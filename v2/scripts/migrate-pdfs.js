// scripts/migrate-pdfs.js
// Downloads PDFs from GitHub raw URLs, uploads to Cloudflare R2,
// then updates pdf_url in Supabase to R2 public URL.
// Usage: pnpm dotenv -e .env -- node scripts/migrate-pdfs.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME', 'R2_PUBLIC_URL',
];
for (const name of REQUIRED_VARS) {
  if (!process.env[name]) { console.error(`Missing env var: ${name}`); process.exit(1); }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;
const GITHUB_RAW_PREFIX = 'https://raw.githubusercontent.com/Dennis-Culhane/Culhane.github.io/main/papers/';
const R2_KEY_PREFIX = 'papers/';
const MAX_CONCURRENT = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeFilename(rawFilename) {
  const decoded = decodeURIComponent(rawFilename);
  return decoded
    .replace(/[^\w\s\-_.()]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 200);
}

async function objectExistsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

async function downloadPdf(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CulhaneLibraryMigration/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} downloading ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToR2(key, body) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: 'application/pdf',
  }));
  return `${PUBLIC_URL}/${key}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('--- PDF Migration Script ---');
  console.log(`R2 Bucket: ${BUCKET} | Public URL: ${PUBLIC_URL}`);

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, pdf_url, pdf_filename')
    .eq('source_type', 'uploaded')
    .not('pdf_url', 'is', null);

  if (error) { console.error('Failed to fetch articles:', error.message); process.exit(1); }
  if (!articles || articles.length === 0) {
    console.log('No articles with source_type="uploaded" found.');
    return;
  }

  console.log(`Found ${articles.length} articles with GitHub-hosted PDFs\n`);

  let successCount = 0, skipCount = 0, failCount = 0;

  for (let i = 0; i < articles.length; i += MAX_CONCURRENT) {
    const batch = articles.slice(i, i + MAX_CONCURRENT);

    const results = await Promise.allSettled(
      batch.map(async (article) => {
        const githubUrl = article.pdf_url;
        if (!githubUrl || !githubUrl.startsWith(GITHUB_RAW_PREFIX)) {
          return { status: 'skip', id: article.id, reason: 'not a GitHub URL' };
        }

        const rawFilename = githubUrl.replace(GITHUB_RAW_PREFIX, '');
        const safeFilename = sanitizeFilename(rawFilename);
        const r2Key = `${R2_KEY_PREFIX}${safeFilename}`;

        const alreadyExists = await objectExistsInR2(r2Key);
        if (alreadyExists) {
          const newUrl = `${PUBLIC_URL}/${r2Key}`;
          await supabase.from('articles').update({ pdf_url: newUrl }).eq('id', article.id);
          return { status: 'skip', id: article.id, reason: 'already in R2' };
        }

        const pdfBuffer = await downloadPdf(githubUrl);
        const newUrl = await uploadToR2(r2Key, pdfBuffer);

        const { error: updateError } = await supabase
          .from('articles')
          .update({ pdf_url: newUrl })
          .eq('id', article.id);

        if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

        return {
          status: 'success',
          title: article.title.substring(0, 60),
          size: `${(pdfBuffer.length / 1024).toFixed(0)}KB`,
        };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const v = result.value;
        if (v.status === 'success') {
          successCount++;
          console.log(`  [OK] ${v.title}... (${v.size})`);
        } else {
          skipCount++;
          console.log(`  [SKIP] ${v.reason}`);
        }
      } else {
        failCount++;
        console.error(`  [FAIL] ${result.reason}`);
      }
    }
  }

  console.log('\n--- PDF Migration Complete ---');
  console.log(`Uploaded: ${successCount} | Skipped: ${skipCount} | Failed: ${failCount}`);
}

main().catch((err) => { console.error('PDF migration failed:', err); process.exit(1); });
