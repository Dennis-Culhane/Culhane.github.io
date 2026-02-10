-- ============================================================================
-- Professor's Digital Library — Complete PostgreSQL Schema
-- Designed for Supabase (PostgreSQL 15+)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()


-- ============================================================================
-- 1. PROFILES TABLE
-- Stores the professor's public profile information.
-- ============================================================================

CREATE TABLE profiles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    positions   TEXT[]      DEFAULT '{}',
    biography   TEXT[]      DEFAULT '{}',
    image_url   TEXT,
    cv_url      TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  profiles             IS 'Professor profile information (typically a single row).';
COMMENT ON COLUMN profiles.positions   IS 'Ordered list of professional titles / positions.';
COMMENT ON COLUMN profiles.biography   IS 'Biography paragraphs stored as a text array.';


-- ============================================================================
-- 2. CATEGORIES TABLE
-- Classifies articles into research areas / topics.
-- ============================================================================

CREATE TABLE categories (
    id          SERIAL      PRIMARY KEY,
    name        TEXT        NOT NULL UNIQUE,
    slug        TEXT        NOT NULL UNIQUE,
    description TEXT,
    sort_order  INT         DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  categories           IS 'Research categories used to classify articles.';
COMMENT ON COLUMN categories.slug      IS 'URL-friendly identifier, e.g. "machine-learning".';
COMMENT ON COLUMN categories.sort_order IS 'Display ordering — lower numbers appear first.';


-- ============================================================================
-- 3. ARTICLES TABLE
-- Core table holding every publication in the digital library.
-- ============================================================================

CREATE TABLE articles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT        NOT NULL,
    slug            TEXT        NOT NULL UNIQUE,
    authors         TEXT        NOT NULL,
    published_date  DATE,
    abstract        TEXT        DEFAULT '',
    pdf_url         TEXT,
    pdf_filename    TEXT,
    source_type     TEXT        NOT NULL DEFAULT 'uploaded'
                                CHECK (source_type IN ('uploaded', 'external')),
    external_url    TEXT,
    citation_count  INT         DEFAULT 0,
    is_featured     BOOLEAN     DEFAULT false,
    search_vector   TSVECTOR,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  articles                IS 'Published articles and papers in the digital library.';
COMMENT ON COLUMN articles.source_type    IS 'Whether the PDF is hosted locally ("uploaded") or linked ("external").';
COMMENT ON COLUMN articles.search_vector  IS 'Pre-computed tsvector for full-text search (auto-maintained by trigger).';
COMMENT ON COLUMN articles.is_featured    IS 'Flag to highlight key publications on the homepage.';


-- ============================================================================
-- 4. ARTICLE ↔ CATEGORY JOIN TABLE
-- Many-to-many relationship between articles and categories.
-- ============================================================================

CREATE TABLE article_categories (
    article_id  UUID    NOT NULL REFERENCES articles(id)    ON DELETE CASCADE,
    category_id INT     NOT NULL REFERENCES categories(id)  ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

COMMENT ON TABLE article_categories IS 'Join table linking articles to their research categories.';


-- ============================================================================
-- 5. SUBSCRIBERS TABLE
-- Email newsletter subscribers.
-- ============================================================================

CREATE TABLE subscribers (
    id              SERIAL      PRIMARY KEY,
    email           TEXT        NOT NULL UNIQUE,
    subscribed_at   TIMESTAMPTZ DEFAULT now(),
    is_active       BOOLEAN     DEFAULT true
);

COMMENT ON TABLE  subscribers          IS 'Email subscribers for publication alerts / newsletters.';
COMMENT ON COLUMN subscribers.is_active IS 'Soft-delete flag — false means unsubscribed.';


-- ============================================================================
-- 6. INDEXES
-- Performance indexes beyond the automatic primary-key / unique indexes.
-- ============================================================================

-- Full-text search on the pre-computed tsvector column
CREATE INDEX idx_articles_search_vector   ON articles USING GIN (search_vector);

-- Fast ordering / range queries on publication date
CREATE INDEX idx_articles_published_date  ON articles (published_date DESC);

-- Slug lookups (used in URL routing)
CREATE INDEX idx_articles_slug            ON articles (slug);
CREATE INDEX idx_categories_slug          ON categories (slug);


-- ============================================================================
-- 7. TRIGGER — Auto-update search_vector on articles INSERT / UPDATE
-- Weights: A = title, B = authors, C = abstract
-- ============================================================================

CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')),    'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.authors, '')),  'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.abstract, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_search_vector
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_search_vector();

COMMENT ON FUNCTION update_article_search_vector()
    IS 'Recomputes the tsvector column on every article INSERT/UPDATE.';


-- ============================================================================
-- 8. TRIGGER — Auto-update updated_at on articles and profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to articles
CREATE TRIGGER trg_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to profiles
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column()
    IS 'Generic trigger function that sets updated_at = now() before every UPDATE.';


-- ============================================================================
-- 9. RPC FUNCTION — search_articles
-- Full-text search with category aggregation and pagination.
-- Returns all articles (by date) when search_query is empty / NULL.
-- ============================================================================

CREATE OR REPLACE FUNCTION search_articles(
    search_query  TEXT,
    page_limit    INT DEFAULT 20,
    page_offset   INT DEFAULT 0
)
RETURNS TABLE (
    id              UUID,
    title           TEXT,
    slug            TEXT,
    authors         TEXT,
    published_date  DATE,
    abstract        TEXT,
    pdf_url         TEXT,
    pdf_filename    TEXT,
    source_type     TEXT,
    external_url    TEXT,
    citation_count  INT,
    is_featured     BOOLEAN,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ,
    rank            REAL,
    categories      TEXT[]          -- aggregated category names
) AS $$
BEGIN
    -- When the search query is empty or NULL, return everything by date
    IF search_query IS NULL OR TRIM(search_query) = '' THEN
        RETURN QUERY
            SELECT
                a.id,
                a.title,
                a.slug,
                a.authors,
                a.published_date,
                a.abstract,
                a.pdf_url,
                a.pdf_filename,
                a.source_type,
                a.external_url,
                a.citation_count,
                a.is_featured,
                a.created_at,
                a.updated_at,
                0::REAL                             AS rank,
                COALESCE(
                    ARRAY_AGG(c.name ORDER BY c.sort_order)
                        FILTER (WHERE c.name IS NOT NULL),
                    '{}'
                )                                   AS categories
            FROM articles a
            LEFT JOIN article_categories ac ON ac.article_id  = a.id
            LEFT JOIN categories          c  ON c.id          = ac.category_id
            GROUP BY a.id
            ORDER BY a.published_date DESC NULLS LAST
            LIMIT  page_limit
            OFFSET page_offset;
    ELSE
        RETURN QUERY
            SELECT
                a.id,
                a.title,
                a.slug,
                a.authors,
                a.published_date,
                a.abstract,
                a.pdf_url,
                a.pdf_filename,
                a.source_type,
                a.external_url,
                a.citation_count,
                a.is_featured,
                a.created_at,
                a.updated_at,
                ts_rank(a.search_vector,
                        websearch_to_tsquery('english', search_query))::REAL AS rank,
                COALESCE(
                    ARRAY_AGG(c.name ORDER BY c.sort_order)
                        FILTER (WHERE c.name IS NOT NULL),
                    '{}'
                )                                   AS categories
            FROM articles a
            LEFT JOIN article_categories ac ON ac.article_id  = a.id
            LEFT JOIN categories          c  ON c.id          = ac.category_id
            WHERE a.search_vector @@ websearch_to_tsquery('english', search_query)
            GROUP BY a.id
            ORDER BY rank DESC, a.published_date DESC NULLS LAST
            LIMIT  page_limit
            OFFSET page_offset;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_articles(TEXT, INT, INT)
    IS 'Full-text search over articles with category aggregation. Empty query returns all articles by date.';


-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- Public  = anyone (anon + authenticated)
-- Auth    = authenticated role only
-- ============================================================================

-- ---- profiles ----
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on profiles"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Authenticated write access on profiles"
    ON profiles FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---- categories ----
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Authenticated write access on categories"
    ON categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---- articles ----
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on articles"
    ON articles FOR SELECT
    USING (true);

CREATE POLICY "Authenticated write access on articles"
    ON articles FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---- article_categories ----
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on article_categories"
    ON article_categories FOR SELECT
    USING (true);

CREATE POLICY "Authenticated write access on article_categories"
    ON article_categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---- subscribers ----
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can read subscribers? Typically admin-only, but we allow public INSERT
-- for the email signup form and restrict reads to authenticated users.
CREATE POLICY "Authenticated read access on subscribers"
    ON subscribers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Public insert access on subscribers"
    ON subscribers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated manage access on subscribers"
    ON subscribers FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated delete access on subscribers"
    ON subscribers FOR DELETE
    TO authenticated
    USING (true);


-- ============================================================================
-- Done! Schema ready for Supabase deployment.
-- Run via: supabase db reset   OR   psql -f schema.sql
-- ============================================================================
