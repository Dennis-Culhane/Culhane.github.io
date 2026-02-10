// scripts/migrate-articles.js
// Migrates articles.json → Supabase (categories, articles, article_categories).
// Usage: pnpm dotenv -e .env -- node scripts/migrate-articles.js

require('dotenv').config();
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ARTICLES_JSON_PATH = join(__dirname, '..', '..', 'data', 'articles.json');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const GITHUB_RAW_PREFIX = 'https://raw.githubusercontent.com/Dennis-Culhane/Culhane.github.io/main/papers/';

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
}

function ensureUniqueSlug(slug, existingSlugs) {
  if (!existingSlugs.has(slug)) {
    existingSlugs.add(slug);
    return slug;
  }
  let counter = 2;
  while (existingSlugs.has(`${slug}-${counter}`)) counter++;
  const uniqueSlug = `${slug}-${counter}`;
  existingSlugs.add(uniqueSlug);
  return uniqueSlug;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('--- Article Migration Script ---');

  const rawData = readFileSync(ARTICLES_JSON_PATH, 'utf-8');
  const articles = JSON.parse(rawData);
  console.log(`Loaded ${articles.length} articles from articles.json`);

  // Collect unique categories
  const categoryNameSet = new Set();
  for (const article of articles) {
    for (const cat of article.categories) {
      categoryNameSet.add(cat.trim());
    }
  }
  const categoryNames = Array.from(categoryNameSet).sort();
  console.log(`Found ${categoryNames.length} unique categories`);

  // Upsert categories
  const categoryRows = categoryNames.map((name, index) => ({
    name,
    slug: generateSlug(name),
    sort_order: index,
  }));

  const { data: insertedCategories, error: catError } = await supabase
    .from('categories')
    .upsert(categoryRows, { onConflict: 'name' })
    .select('id, name');

  if (catError) {
    console.error('Failed to insert categories:', catError.message);
    process.exit(1);
  }

  const categoryMap = new Map();
  if (insertedCategories) {
    for (const cat of insertedCategories) {
      categoryMap.set(cat.name, cat.id);
    }
  }
  console.log(`Inserted/updated ${categoryMap.size} categories`);

  // Insert articles in batches
  const BATCH_SIZE = 50;
  const slugSet = new Set();
  let totalInserted = 0;
  let totalJoins = 0;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);

    const articleRows = batch.map((article) => {
      const isGitHubPdf = article.pdfUrl.startsWith(GITHUB_RAW_PREFIX);
      const slug = ensureUniqueSlug(generateSlug(article.title), slugSet);
      return {
        title: article.title,
        slug,
        authors: article.authors,
        published_date: article.date || null,
        abstract: article.abstract || '',
        pdf_url: article.pdfUrl,
        pdf_filename: isGitHubPdf
          ? decodeURIComponent(article.pdfUrl.replace(GITHUB_RAW_PREFIX, ''))
          : null,
        source_type: isGitHubPdf ? 'uploaded' : 'external',
        external_url: isGitHubPdf ? null : article.pdfUrl,
      };
    });

    const { data: insertedArticles, error: artError } = await supabase
      .from('articles')
      .upsert(articleRows, { onConflict: 'slug' })
      .select('id, slug');

    if (artError) {
      console.error(`Failed to insert batch ${i / BATCH_SIZE + 1}:`, artError.message);
      continue;
    }
    if (!insertedArticles) continue;
    totalInserted += insertedArticles.length;

    const slugToUuid = new Map();
    for (const a of insertedArticles) slugToUuid.set(a.slug, a.id);

    // Article-category join rows
    const joinRows = [];
    for (const article of batch) {
      const slug = generateSlug(article.title);
      const matchedSlug = [...slugToUuid.keys()].find(
        (s) => s === slug || s.startsWith(slug + '-')
      );
      if (!matchedSlug) continue;
      const articleUuid = slugToUuid.get(matchedSlug);
      if (!articleUuid) continue;
      for (const catName of article.categories) {
        const catId = categoryMap.get(catName.trim());
        if (catId !== undefined) {
          joinRows.push({ article_id: articleUuid, category_id: catId });
        }
      }
    }

    if (joinRows.length > 0) {
      const { error: joinError } = await supabase
        .from('article_categories')
        .upsert(joinRows, { onConflict: 'article_id,category_id' });
      if (joinError) {
        console.error(`Failed join batch ${i / BATCH_SIZE + 1}:`, joinError.message);
      } else {
        totalJoins += joinRows.length;
      }
    }
    console.log(`  Batch ${i / BATCH_SIZE + 1}: ${insertedArticles.length} articles, ${joinRows.length} links`);
  }

  console.log('\n--- Migration Complete ---');
  console.log(`Articles: ${totalInserted} | Links: ${totalJoins} | Categories: ${categoryMap.size}`);
}

main().catch((err) => { console.error('Migration failed:', err); process.exit(1); });
