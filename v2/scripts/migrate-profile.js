// scripts/migrate-profile.js
// Migrates profile.json → Supabase profiles table and uploads assets to R2.
// Usage: pnpm dotenv -e .env -- node scripts/migrate-profile.js

require('dotenv').config();
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PROFILE_JSON_PATH = join(__dirname, '..', '..', 'data', 'profile.json');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  forcePathStyle: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function objectExistsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch { return false; }
}

async function downloadFile(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CulhaneLibraryMigration/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} downloading ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

async function uploadToR2(key, body, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return `${R2_PUBLIC_URL}/${key}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('--- Profile Migration Script ---');

  const rawData = readFileSync(PROFILE_JSON_PATH, 'utf-8');
  const profile = JSON.parse(rawData);
  console.log(`Profile: ${profile.name}`);

  // Upload profile image to R2
  let imageUrl = profile.imageUrl;
  if (profile.imageUrl && R2_ENDPOINT) {
    const imageKey = 'images/profile-photo.jpg';
    const alreadyExists = await objectExistsInR2(imageKey);
    if (alreadyExists) {
      imageUrl = `${R2_PUBLIC_URL}/${imageKey}`;
      console.log(`Profile image already in R2`);
    } else {
      console.log('Downloading profile image from GitHub...');
      const { buffer, contentType } = await downloadFile(profile.imageUrl);
      imageUrl = await uploadToR2(imageKey, buffer, contentType);
      console.log(`Uploaded profile image (${(buffer.length / 1024).toFixed(0)}KB)`);
    }
  }

  // Upload CV to R2
  let cvUrl = profile.cvUrl;
  if (profile.cvUrl && R2_ENDPOINT) {
    const cvKey = 'documents/dennis-cv.pdf';
    const alreadyExists = await objectExistsInR2(cvKey);
    if (alreadyExists) {
      cvUrl = `${R2_PUBLIC_URL}/${cvKey}`;
      console.log('CV already in R2');
    } else {
      const isUrl = profile.cvUrl.startsWith('http');
      if (isUrl) {
        const { buffer, contentType } = await downloadFile(profile.cvUrl);
        cvUrl = await uploadToR2(cvKey, buffer, contentType);
        console.log('Uploaded CV from URL');
      } else {
        const localCvPath = join(__dirname, '..', '..', profile.cvUrl);
        try {
          const cvBuffer = readFileSync(localCvPath);
          cvUrl = await uploadToR2(cvKey, cvBuffer, 'application/pdf');
          console.log('Uploaded local CV');
        } catch {
          console.warn(`Could not read local CV at ${localCvPath}, keeping original path`);
        }
      }
    }
  }

  // Upsert profile
  const positions = profile.positions.map((p) => p.replace(/,$/, '').trim());

  // Check if profile already exists
  const { data: existing } = await supabase.from('profiles').select('id').limit(1);

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update({ name: profile.name, positions, biography: profile.biography, image_url: imageUrl, cv_url: cvUrl })
      .eq('id', existing[0].id);
    if (error) { console.error('Failed to update profile:', error.message); process.exit(1); }
    console.log(`Updated existing profile (id: ${existing[0].id})`);
  } else {
    const { error } = await supabase
      .from('profiles')
      .insert({ name: profile.name, positions, biography: profile.biography, image_url: imageUrl, cv_url: cvUrl });
    if (error) { console.error('Failed to insert profile:', error.message); process.exit(1); }
    console.log('Inserted new profile');
  }

  console.log('\n--- Profile Migration Complete ---');
}

main().catch((err) => { console.error('Profile migration failed:', err); process.exit(1); });
