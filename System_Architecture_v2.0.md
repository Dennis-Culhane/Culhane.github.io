# System Architecture v2.0 — Professor's Digital Library

> **项目**: Dennis Culhane 学术数字图书馆  
> **域名**: [dennisculhane.com](https://dennisculhane.com)  
> **文档版本**: 2.0  
> **日期**: 2026-02-09  
> **目标**: 将 v1.0 静态文件托管架构转型为现代化全栈 Serverless 应用，彻底解决 GitHub 存储瓶颈，并全面升级 UI/UX。  
> **前置文档**: [System_Architecture_v1.0.md](./System_Architecture_v1.0.md)

---

## 目录

1. [v1.0 → v2.0 变更摘要](#1-v10--v20-变更摘要)
2. [新技术栈选型与理由](#2-新技术栈选型与理由)
3. [系统架构设计](#3-系统架构设计)
4. [数据库模型设计](#4-数据库模型设计)
5. [对象存储方案设计](#5-对象存储方案设计)
6. [核心业务流转](#6-核心业务流转)
7. [UI/UX 设计指导 — Material Design 3](#7-uiux-设计指导--material-design-3)
8. [项目结构规划](#8-项目结构规划)
9. [部署与 CI/CD](#9-部署与-cicd)
10. [数据迁移计划](#10-数据迁移计划)
11. [成本估算](#11-成本估算)

---

## 1. v1.0 → v2.0 变更摘要

| 维度 | v1.0 (As-Is) | v2.0 (To-Be) | 解决的痛点 |
|---|---|---|---|
| **前端框架** | Vanilla JS + 内联 HTML 模板 | Next.js 15 (App Router) + React 19 | 组件化、SSR/SSG、代码分割 |
| **UI 设计语言** | Tailwind CSS (CDN) 无设计系统 | MUI v6 + "Ethereal Intelligence" (Gemini Style) — 极光背景 / 磨砂玻璃 / 光随指尖 | 沉浸感、品牌辨识度、无障碍 |
| **元数据存储** | `articles.json` (GitHub 仓库文件) | Supabase PostgreSQL | SQL 查询、索引、事务、实时订阅 |
| **文件存储** | `papers/` 目录 (GitHub 仓库, ~700MB) | Cloudflare R2 (对象存储) | **彻底解决 GitHub 容量瓶颈** |
| **认证方式** | GitHub PAT (客户端暴露) | Supabase Auth (服务端 JWT) | 安全、标准化、会话管理 |
| **后端逻辑** | 无后端，纯客户端调 GitHub API | Next.js API Routes (Serverless) | 安全隔离、业务编排、中间件 |
| **搜索** | 仅分类筛选 | PostgreSQL 全文搜索 + 客户端即时过滤 | 标题/作者/摘要全字段搜索 |
| **部署** | GitHub Pages (静态) | Vercel (SSR/Edge) | 秒级部署、预览环境、Edge 加速 |
| **CI/CD** | 无 | GitHub Actions + Vercel 自动部署 | 质量门禁、自动化流水线 |
| **分析统计** | 静态 mock 数据 (stats.json) | Umami / Vercel Analytics | 真实访客数据 |

---

## 2. 新技术栈选型与理由

### 2.1 技术栈全景

```
┌─────────────────────────────────────────────────────┐
│                    前端 (Frontend)                    │
│                                                     │
│  Next.js 15 ─── React 19 ─── TypeScript 5.x        │
│  MUI v6 (Ethereal Glass Theme) ─── Framer Motion   │
│  TanStack Query v5 ─── Zustand ─── ShaderGradient  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│              后端 API 层 (Backend)                    │
│                                                     │
│  Next.js API Routes (Serverless Functions)           │
│  Supabase JS Client (服务端) ─── R2 SDK              │
│  Zod (请求校验) ─── next-auth or Supabase Auth      │
└───────┬────────────────────────────┬────────────────┘
        │                            │
        ▼                            ▼
┌───────────────┐          ┌──────────────────┐
│   Supabase    │          │  Cloudflare R2   │
│  PostgreSQL   │          │  (对象存储)       │
│  + Auth       │          │                  │
│  + Realtime   │          │  PDF / 图片文件   │
└───────────────┘          └──────────────────┘
```

### 2.2 选型决策矩阵

| 层级 | 选型 | 备选方案 | 选择理由 |
|---|---|---|---|
| **前端框架** | **Next.js 15** | Nuxt 3, Astro | React 生态最成熟；App Router 支持 RSC (React Server Components)；Vercel 原生集成；v1.0 的 `/client` 已有 React 基础 |
| **UI 组件库** | **MUI v6** + 自定义 Glass Theme | Radix + Tailwind, shadcn/ui | 200+ 生产级组件基础上覆盖 "Ethereal Intelligence" 玻璃主题；`sx` prop 灵活覆盖；类型安全 |
| **状态管理** | **TanStack Query + Zustand** | Redux Toolkit, Jotai | TanStack Query 专攻服务端状态缓存 (文章列表)；Zustand 极简管理 UI 状态 (筛选、模态框) |
| **动画** | **Framer Motion** + CSS Keyframes | GSAP, React Spring | 声明式 API 与 React 集成；`layoutId` 共享元素过渡；CSS 原生动画驱动极光背景 (60fps, 低 GPU 占用) |
| **背景渲染** | **@shadergradient/react** (可选) | react-mesh-gradient | WebGL Shader 驱动的流体极光；低端设备自动降级为 CSS 动画 |
| **数据库** | **Supabase PostgreSQL** | PlanetScale, Neon, Firebase | 免费 500MB 数据库 + 内置 Auth + Realtime + 自动生成 REST API；RLS 行级安全 |
| **对象存储** | **Cloudflare R2** | AWS S3, Supabase Storage | **零出口流量费**（S3 出口费约 $0.09/GB）；免费层 10GB 存储；S3 兼容 API |
| **认证** | **Supabase Auth** | NextAuth.js, Clerk | 与数据库同平台零配置；支持 Email/Password、Magic Link；RLS 策略直接绑定用户 |
| **部署** | **Vercel** | Netlify, Cloudflare Pages | Next.js 官方平台；免费层含 100GB 带宽；自动预览部署；Edge Functions |
| **分析** | **Umami** (自托管) | Vercel Analytics, Plausible | 开源免费、隐私友好、无 Cookie；可部署在 Vercel + Supabase |

### 2.3 免费层覆盖评估

| 服务 | 免费配额 | 预计用量 | 是否充裕 |
|---|---|---|---|
| **Vercel** | 100GB 带宽/月, 100小时构建/月 | ~5GB 带宽 (静态页面为主) | ✅ 充裕 |
| **Supabase** | 500MB 数据库, 5GB 带宽, 50K MAU | ~10MB 数据库, 低 MAU | ✅ 充裕 |
| **Cloudflare R2** | 10GB 存储, 10M 读/月, 1M 写/月 | ~1GB 存储 (233 PDFs), ~10K 读/月 | ✅ 充裕 |
| **GitHub Actions** | 2000 分钟/月 | ~50 分钟/月 (CI 流水线) | ✅ 充裕 |

---

## 3. 系统架构设计

### 3.1 整体架构图

```
                    ┌──────────────────────┐
                    │   dennisculhane.com   │
                    │     (Vercel Edge)     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  公开页面     │  │  管理后台     │  │  API 路由     │
   │  (SSG/ISR)   │  │  (CSR, 鉴权)  │  │  (Serverless) │
   │              │  │              │  │              │
   │  /           │  │  /admin      │  │  /api/...    │
   │  /articles   │  │  /admin/new  │  │              │
   │  /article/[s]│  │  /admin/edit │  │              │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          │                  │                  │
          │     ┌────────────┴──────────┐       │
          │     │  Supabase Auth (JWT)  │       │
          │     │  中间件鉴权            │       │
          │     └───────────────────────┘       │
          │                                     │
          └──────────────┬──────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
  ┌──────────────┐ ┌──────────┐ ┌───────────────┐
  │  Supabase    │ │  Supabase│ │ Cloudflare R2 │
  │  PostgreSQL  │ │  Auth    │ │ (对象存储)     │
  │              │ │          │ │               │
  │  articles    │ │  users   │ │  /papers/     │
  │  categories  │ │  sessions│ │  /images/     │
  │  profiles    │ │          │ │  /cv/         │
  │  subscribers │ │          │ │               │
  └──────────────┘ └──────────┘ └───────────────┘
```

### 3.2 请求流转路径

#### 3.2.1 公开页面 — 访客浏览文章

```
访客请求 GET /articles
        │
        ▼
Vercel Edge CDN 命中缓存? ──Yes──▶ 直接返回 HTML (ISR)
        │ No
        ▼
Next.js Server Component 执行
        │
        ▼
supabase.from('articles').select('*').order('published_date', { ascending: false }).range(0, 19)
        │
        ▼
PostgreSQL 返回分页数据 (20条/页)
        │
        ▼
Server Component 渲染 HTML → 返回客户端
        │
        ▼
客户端水合 (Hydration) → 交互就绪
        │
        ▼
PDF 下载: 用户点击 → 直接请求 R2 公开 URL → 零延迟下载
```

#### 3.2.2 管理后台 — 上传新文章

```
管理员访问 /admin
        │
        ▼
Next.js 中间件检查 Supabase Session
        │
   ┌────┴────┐
   │ 已登录? │
   └────┬────┘
  Yes   │   No → 重定向到 /admin/login
        │
        ▼
管理员填写表单 + 选择 PDF 文件
        │
        ▼
Step 1: 客户端获取 Presigned URL
        POST /api/upload/presign { fileName, contentType }
        │
        ▼
Step 2: API Route 用 R2 SDK 生成预签名上传 URL
        返回 { uploadUrl, publicUrl }
        │
        ▼
Step 3: 客户端直传 PDF 到 R2 (不经过服务器)
        PUT {uploadUrl} ← File Binary
        │
        ▼
Step 4: 客户端提交文章元数据
        POST /api/articles { title, authors, ..., pdfUrl: publicUrl }
        │
        ▼
Step 5: API Route 校验数据 → 写入 Supabase PostgreSQL
        │
        ▼
Step 6: 触发 ISR 重新验证 → 公开页面更新
        revalidatePath('/articles')
```

### 3.3 渲染策略

| 页面 | 渲染方式 | 缓存策略 | 理由 |
|---|---|---|---|
| `/` 首页 | **ISR** (增量静态再生) | `revalidate: 3600` (1小时) | 内容更新频率低，优先性能 |
| `/articles` 文章列表 | **ISR** | `revalidate: 600` (10分钟) | 平衡实时性与性能 |
| `/article/[slug]` 文章详情 | **SSG** + 按需重新验证 | `generateStaticParams` 预生成 | 200+ 文章全部预渲染，SEO 最优 |
| `/admin/*` 管理后台 | **CSR** (客户端渲染) | 无缓存 | 动态交互密集，需实时数据 |
| `/api/*` API 路由 | **Serverless** | 无缓存 | 数据变更操作 |

---

## 4. 数据库模型设计

### 4.1 ER 关系图

```
┌──────────────────────┐       ┌──────────────────────────┐
│      profiles        │       │        categories         │
│──────────────────────│       │──────────────────────────│
│ id (PK, UUID)        │       │ id (PK, SERIAL)           │
│ name                 │       │ name (UNIQUE)             │
│ title                │       │ slug (UNIQUE)             │
│ positions (TEXT[])   │       │ article_count (INT)       │
│ biography (TEXT)     │       │ created_at                │
│ avatar_url           │       └────────────┬─────────────┘
│ cv_url               │                    │
│ research_areas (TEXT[])│                   │ M:N
│ updated_at           │                    │
└──────────────────────┘       ┌────────────┴─────────────┐
                               │   article_categories      │
┌──────────────────────┐       │──────────────────────────│
│      articles        │───────│ article_id (FK)           │
│──────────────────────│       │ category_id (FK)          │
│ id (PK, UUID)        │       │ PRIMARY KEY (article_id,  │
│ title                │       │              category_id) │
│ slug (UNIQUE)        │       └──────────────────────────┘
│ authors              │
│ published_date       │
│ abstract (TEXT)      │
│ pdf_url              │       ┌──────────────────────────┐
│ pdf_filename         │       │      subscribers         │
│ source_type          │       │──────────────────────────│
│ external_url         │       │ id (PK, UUID)            │
│ citation_count       │       │ email (UNIQUE)           │
│ is_featured          │       │ is_active                │
│ created_at           │       │ subscribed_at            │
│ updated_at           │       │ unsubscribed_at          │
│ search_vector (TSVECTOR)│    └──────────────────────────┘
└──────────────────────┘
                               ┌──────────────────────────┐
                               │      page_views          │
                               │──────────────────────────│
                               │ id (PK, BIGSERIAL)       │
                               │ article_id (FK, nullable)│
                               │ path                     │
                               │ referrer                 │
                               │ country_code             │
                               │ created_at               │
                               └──────────────────────────┘
```

### 4.2 SQL Schema 定义

```sql
-- ============================================================
-- 文章主表
-- ============================================================
CREATE TABLE articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    authors         TEXT NOT NULL,                          -- "Author A, Author B"
    published_date  DATE,
    abstract        TEXT DEFAULT '',
    pdf_url         TEXT,                                   -- R2 公开 URL 或外部链接
    pdf_filename    TEXT,                                   -- 原始文件名
    source_type     TEXT NOT NULL DEFAULT 'uploaded'        -- 'uploaded' | 'external'
                    CHECK (source_type IN ('uploaded', 'external')),
    external_url    TEXT,                                   -- 外部文章页链接 (非 PDF)
    citation_count  INTEGER DEFAULT 0,
    is_featured     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    -- PostgreSQL 全文搜索向量
    search_vector   TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(authors, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(abstract, '')), 'C')
    ) STORED
);

-- 全文搜索索引 (GIN)
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);

-- 日期排序索引
CREATE INDEX idx_articles_date ON articles (published_date DESC NULLS LAST);

-- Slug 查询索引
CREATE INDEX idx_articles_slug ON articles (slug);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 分类表
-- ============================================================
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    article_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories (slug);

-- ============================================================
-- 文章-分类关联表 (多对多)
-- ============================================================
CREATE TABLE article_categories (
    article_id      UUID REFERENCES articles(id) ON DELETE CASCADE,
    category_id     INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

CREATE INDEX idx_ac_category ON article_categories (category_id);

-- 分类计数触发器
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE categories SET article_count = article_count + 1 WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE categories SET article_count = article_count - 1 WHERE id = OLD.category_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_category_count
    AFTER INSERT OR DELETE ON article_categories
    FOR EACH ROW EXECUTE FUNCTION update_category_count();

-- ============================================================
-- 教授简介 (单例)
-- ============================================================
CREATE TABLE profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    title           TEXT,                                   -- "Ph.D."
    positions       TEXT[] DEFAULT '{}',                    -- 职位数组
    biography       TEXT DEFAULT '',
    avatar_url      TEXT,                                   -- R2 URL
    cv_url          TEXT,                                   -- R2 URL
    research_areas  TEXT[] DEFAULT '{}',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 订阅者
-- ============================================================
CREATE TABLE subscribers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    is_active       BOOLEAN DEFAULT TRUE,
    subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

-- ============================================================
-- 页面访问记录 (轻量分析)
-- ============================================================
CREATE TABLE page_views (
    id              BIGSERIAL PRIMARY KEY,
    article_id      UUID REFERENCES articles(id) ON DELETE SET NULL,
    path            TEXT NOT NULL,
    referrer        TEXT,
    country_code    CHAR(2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_views_article ON page_views (article_id);
CREATE INDEX idx_page_views_date ON page_views (created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- 公开读取策略
CREATE POLICY "Public read articles"  ON articles  FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read profiles"  ON profiles  FOR SELECT USING (true);

-- 管理员写入策略 (需要认证)
CREATE POLICY "Admin manage articles"  ON articles  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage profiles"  ON profiles  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage subscribers" ON subscribers FOR ALL USING (auth.role() = 'authenticated');
```

### 4.3 全文搜索查询示例

```sql
-- 搜索 "homelessness veterans housing"
SELECT
    id, title, authors, published_date, abstract,
    ts_rank(search_vector, query) AS relevance
FROM articles,
    plainto_tsquery('english', 'homelessness veterans housing') AS query
WHERE search_vector @@ query
ORDER BY relevance DESC, published_date DESC
LIMIT 20 OFFSET 0;
```

对应 Supabase JS 客户端调用:

```typescript
const { data, error } = await supabase
  .rpc('search_articles', {
    search_query: 'homelessness veterans housing',
    page_limit: 20,
    page_offset: 0
  });
```

### 4.4 v1.0 → v2.0 字段映射

| v1.0 JSON 字段 | v2.0 数据库字段 | 变更说明 |
|---|---|---|
| `id` (timestamp string) | `id` (UUID) | 类型标准化 |
| `title` | `title` + `slug` (自动生成) | 新增 URL 友好的 slug |
| `authors` | `authors` | 保持字符串格式 |
| `date` | `published_date` (DATE) | 类型从字符串改为原生日期 |
| `categories[]` | `article_categories` 关联表 | 从嵌套数组改为标准化多对多 |
| `abstract` | `abstract` | 不变 |
| `pdfUrl` | `pdf_url` + `source_type` | 区分上传文件与外部链接 |
| `fileName` | `pdf_filename` | 不变 |
| `lastModified` | `updated_at` (自动触发器) | 自动化管理 |
| *(无)* | `search_vector` | 新增全文搜索 |
| *(无)* | `is_featured` | 新增精选文章标记 |
| *(无)* | `citation_count` | 新增引用计数 |

---

## 5. 对象存储方案设计

### 5.1 Cloudflare R2 桶结构

```
culhane-library/                          ← R2 Bucket 名称
│
├── papers/                               ← 研究论文 PDF
│   ├── a-data-based-re-design-2019.pdf
│   ├── epidemiology-of-homelessness-2018.pdf
│   └── ... (233+ files)
│
├── images/                               ← 个人照片、文章配图
│   ├── profile/
│   │   └── dennis-culhane.webp
│   └── articles/
│       └── ...
│
└── cv/                                   ← 简历文件
    └── dennis-cv-2025.pdf
```

### 5.2 文件命名规范

```
papers/{slug}-{year}.pdf

示例:
papers/a-data-based-re-design-of-housing-supports-2019.pdf
papers/epidemiology-of-homelessness-among-veterans-2018.pdf
```

规则:
- 文件名由文章 slug + 发表年份构成
- 全部小写，连字符分隔
- 原始文件名保存在数据库 `pdf_filename` 字段中

### 5.3 访问控制策略

| 操作 | 权限 | 实现方式 |
|---|---|---|
| **读取 (下载 PDF)** | 公开 | R2 Bucket 设为公开读；通过自定义域名 `files.dennisculhane.com` 访问 |
| **上传** | 仅管理员 | Next.js API Route 生成 Presigned URL (有效期 10 分钟)；客户端直传 R2 |
| **删除** | 仅管理员 | Next.js API Route 调用 R2 DeleteObject；仅服务端持有 R2 密钥 |

### 5.4 Presigned URL 上传流程 (核心)

```
浏览器 (Admin)                API Route (/api/upload/presign)              Cloudflare R2
     │                                    │                                      │
     │  POST { fileName, contentType }    │                                      │
     │ ──────────────────────────────────▶ │                                      │
     │                                    │                                      │
     │                                    │  验证 Supabase Auth Session           │
     │                                    │  生成唯一文件路径 papers/{slug}.pdf    │
     │                                    │  调用 R2 PutObject Presigned URL     │
     │                                    │ ────────────────────────────────────▶ │
     │                                    │                                      │
     │                                    │ ◀──── 返回 Presigned URL (10分钟有效) │
     │                                    │                                      │
     │ ◀─── { uploadUrl, publicUrl }      │                                      │
     │                                    │                                      │
     │  PUT uploadUrl ← File Binary       │                                      │
     │ ──────────────────────────────────────────────────────────────────────────▶│
     │                                    │                                      │
     │ ◀───────────────────────────────────────────────────── 200 OK ────────────│
     │                                    │                                      │
     │  POST /api/articles                │                                      │
     │  { ..., pdfUrl: publicUrl }        │                                      │
     │ ──────────────────────────────────▶ │                                      │
     │                                    │  INSERT INTO articles (...)           │
     │                                    │  → Supabase PostgreSQL               │
     │                                    │                                      │
```

**关键优势**: PDF 二进制流**不经过 Next.js 服务器**，直接从浏览器传输到 R2。服务器仅处理轻量级的 URL 签名请求和元数据入库。

### 5.5 API Route 实现参考

```typescript
// app/api/upload/presign/route.ts

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://files.dennisculhane.com

export async function POST(request: Request) {
  // 1. Verify authentication
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse and validate request
  const { fileName, contentType } = await request.json();
  if (!fileName || contentType !== 'application/pdf') {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  // 3. Generate unique storage key
  const slug = fileName
    .replace(/\.pdf$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const key = `papers/${slug}-${Date.now()}.pdf`;

  // 4. Generate presigned upload URL (10-minute expiry)
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: 'application/pdf',
  });

  const uploadUrl = await getSignedUrl(R2, command, { expiresIn: 600 });
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
```

---

## 6. 核心业务流转

### 6.1 公开页面 — 文章浏览与搜索

```
┌─ 文章列表页 (/articles) ─────────────────────────────────────────────┐
│                                                                      │
│  [搜索框] ─── 输入关键词 → debounce 300ms → RPC search_articles      │
│                                                                      │
│  [分类标签栏] ─── 点击分类 → 筛选 category_id → 重新查询             │
│                                                                      │
│  [排序切换] ─── 最新 / 最相关 / 最多引用                             │
│                                                                      │
│  [文章卡片列表] ─── 分页加载 (20条/页)                               │
│      │                                                               │
│      ├── 卡片: 标题 | 作者 | 日期 | 分类标签 | 摘要预览              │
│      │                                                               │
│      └── 点击卡片 → Framer Motion layoutId 过渡 →                    │
│              展开为文章详情面板 (无页面跳转)                           │
│              │                                                       │
│              ├── 完整摘要                                             │
│              ├── PDF 嵌入预览 (pdf.js) 或下载按钮                     │
│              ├── 引用导出 (BibTeX / APA)                              │
│              └── 复制分享链接                                         │
│                                                                      │
│  [加载更多] ─── Intersection Observer → 无限滚动 / 分页按钮          │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 管理后台 — 文章 CRUD 完整流程

```
┌─ 管理后台 (/admin) ──────────────────────────────────────────────────┐
│                                                                      │
│  ┌─ 侧边导航 (Navigation Rail) ──┐  ┌─ 主内容区 ─────────────────┐ │
│  │                                │  │                             │ │
│  │  📊 仪表盘                     │  │  [新建文章]                  │ │
│  │  📄 文章管理  ← active         │  │      │                      │ │
│  │  📁 分类管理                   │  │      ▼                      │ │
│  │  👤 个人资料                   │  │  表单:                      │ │
│  │  📧 订阅者                     │  │  - 标题 (TextField)         │ │
│  │  📈 统计                       │  │  - 作者 (TextField)         │ │
│  │                                │  │  - 日期 (DatePicker)        │ │
│  └────────────────────────────────┘  │  - 分类 (Autocomplete多选)  │ │
│                                      │  - 摘要 (TextField多行)     │ │
│                                      │  - PDF (FileDrop组件)       │ │
│                                      │      ├── 拖拽上传            │ │
│                                      │      ├── 进度条 (Linear)     │ │
│                                      │      └── 上传完成 → 预览     │ │
│                                      │  - 或输入外部 URL            │ │
│                                      │                             │ │
│                                      │  [提交] → 保存元数据到 DB   │ │
│                                      │                             │ │
│                                      │  [文章列表]                  │ │
│                                      │  - DataGrid (MUI)           │ │
│                                      │  - 排序 / 筛选 / 搜索       │ │
│                                      │  - 行操作: 编辑 / 删除      │ │
│                                      │  - 批量选择 → 批量删除      │ │
│                                      └──────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### 6.3 文章删除流程 (含 R2 文件清理)

```
管理员点击删除
        │
        ▼
确认对话框 (MUI Dialog)
        │
        ▼
DELETE /api/articles/{id}
        │
        ▼
API Route:
  1. 查询文章 → 获取 pdf_url 和 source_type
  2. IF source_type === 'uploaded':
        解析 R2 key from pdf_url
        R2.deleteObject({ Bucket, Key })
  3. DELETE FROM article_categories WHERE article_id = id
  4. DELETE FROM articles WHERE id = id
  5. revalidatePath('/articles')
        │
        ▼
返回 200 → 前端刷新列表 (乐观更新)
```

### 6.4 批量导入流程 (Excel → DB)

```
管理员上传 .xlsx 文件
        │
        ▼
客户端 SheetJS 解析 → JSON 数组
        │
        ▼
渲染预览表格 (MUI DataGrid, 可编辑)
管理员检查并修正数据
        │
        ▼
POST /api/articles/batch
  Body: { articles: [...] }
        │
        ▼
API Route:
  1. Zod 校验每条记录
  2. 为每篇文章生成 slug
  3. 提取并去重所有 categories → UPSERT categories 表
  4. BEGIN TRANSACTION
        INSERT INTO articles (...)  ← 批量插入
        INSERT INTO article_categories (...) ← 批量插入关联
     COMMIT
  5. revalidatePath('/articles')
        │
        ▼
返回成功计数 → Toast 通知
```

---

## 7. UI/UX 设计指导 — "Ethereal Intelligence" (Gemini Style)

> **核心理念**: 将知识视为"光"。界面是承载这束光的容器——通透、流动、深邃。  
> **设计哲学**: 不追求传统 Material Design 的实心卡片与不透明表面。取而代之的是一套受 Google Gemini 启发的视觉语言：流动的极光背景、深度磨砂玻璃材质、光随指尖移动的交互反馈。

### 7.1 视觉基调 (Visual Foundations)

| 维度 | 规范 | 说明 |
|---|---|---|
| **默认模式** | **Dark Mode First** | 深色模式为主打体验，亮色模式作为辅助切换项。深色画布是光效存在的前提 |
| **基调色温** | Deep Navy → Midnight Blue | 背景不是纯黑 `#000`，而是带蓝调的深色 `#0A0E1A`，营造深邃宇宙感 |
| **色彩性格** | 克制的发光 (Restrained Luminance) | 发光效果**仅限主行动点** (下载 PDF、搜索、FAB)；次要元素使用低饱和度半透明灰白 — "Less is More" |
| **UI 字体** | Inter Variable (Light 300 / Regular 400) | 导航、标签、元数据、按钮等界面元素。字间距 `+0.02em`，营造科技呼吸感 |
| **阅读字体** | Merriweather (Regular 400 / Bold 700) | 文章标题、摘要、长文正文。衬线体增加"学术权威感"，中和过度科幻感 |
| **阅读区域** | 高不透明度容器 (`rgba(10,14,26,0.88)`) | 文章详情/摘要阅读区使用接近不透明的背景，仅保留容器边缘的玻璃质感，确保极光漂移不影响文字对比度 |
| **圆角** | 20px (卡片) / 28px (搜索栏) / 12px (按钮) | 大圆角强化柔和流动感 |
| **边框** | `1px solid rgba(255, 255, 255, 0.08)` | 所有玻璃容器使用极细微光边框 |

### 7.2 色彩系统 — 双模式光谱

```
┌─────────────────────────────────────────────────────────────────┐
│               Dark Theme (默认 / 主打)                           │
│                                                                 │
│  Canvas:              #0A0E1A  (深空蓝黑)                       │
│  Surface:             rgba(255, 255, 255, 0.04)  (玻璃基底)     │
│  Surface Hover:       rgba(255, 255, 255, 0.08)  (悬停提亮)     │
│  Surface Active:      rgba(255, 255, 255, 0.12)  (按下态)       │
│                                                                 │
│  Primary (Cyan):      #4AEADC  (青色荧光)                       │
│  Secondary (Violet):  #B18CFF  (紫色荧光)                       │
│  Accent (White):      #F0F4FF  (冷白高光)                       │
│                                                                 │
│  Text Primary:        rgba(255, 255, 255, 0.92)                 │
│  Text Secondary:      rgba(255, 255, 255, 0.56)                 │
│  Text Disabled:       rgba(255, 255, 255, 0.28)                 │
│                                                                 │
│  Border:              rgba(255, 255, 255, 0.08)                 │
│  Border Glow:         rgba(74, 234, 220, 0.40)  (Hover 发光)    │
│                                                                 │
│  Error:               #FF6B6B                                   │
│  Success:             #4AEA8B                                   │
│  Warning:             #FFD166                                   │
│                                                                 │
│  Aurora Gradient A:   #4AEADC → #B18CFF (青→紫)                 │
│  Aurora Gradient B:   #B18CFF → #FF6BB5 (紫→粉)                 │
│  Aurora Gradient C:   #4AEADC → #4A9EEA (青→蓝)                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│               Light Theme — "Dawn / Opal" (辅助)                 │
│                                                                 │
│  设计原则: 彻底放弃"发光 (Glow)"，改用"色散 (Dispersion)"       │
│  和"彩虹光泽 (Iridescence)"。模拟晨曦天空 / 蛋白石质感。       │
│                                                                 │
│  Canvas:              #F8F6F4  (暖色蛋白石白, 非冷蓝白)         │
│  Surface:             rgba(255, 255, 255, 0.65)  (柔白磨砂)     │
│  Surface Hover:       rgba(255, 255, 255, 0.80)                 │
│  Reading Surface:     rgba(255, 255, 255, 0.92)  (近不透明)     │
│                                                                 │
│  Primary:             #0D7377  (深青, 非亮青 — 避免刺眼)        │
│  Secondary:           #6B4FA0  (柔紫)                            │
│  Accent:              #C47A2E  (琥珀暖光, 用于特殊高亮)         │
│                                                                 │
│  Text Primary:        #1A1A2E  (近黑, 带微暖)                   │
│  Text Secondary:      rgba(26, 26, 46, 0.56)                   │
│                                                                 │
│  Border:              rgba(0, 0, 0, 0.08)                       │
│  Border Hover:        rgba(107, 79, 160, 0.2)  (棱镜色散感)     │
│                                                                 │
│  Error:               #D32F2F                                   │
│  Success:             #2E7D32                                   │
│  Warning:             #ED6C02                                   │
│                                                                 │
│  Background Gradient (Dawn Sky / 晨曦):                         │
│    radial-gradient(ellipse at top, #FFF0E8, #F0E6FF, #E8F4F8)  │
│    粉暖 → 淡紫 → 冷蓝, 极低饱和度, 大面积弥散                  │
│                                                                 │
│  ⚠ 规则: 亮色模式下 NO element emits "glow" (boxShadow-color). │
│  所有阴影为标准 rgba(0,0,0,x) 投影。Hover 效果使用色调阴影      │
│  (如 rgba(107,79,160,0.08)) 而非发光阴影。                      │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 三层视觉架构

整个界面由三个独立的视觉层叠加而成，从后到前：

```
┌──────────────────────────────────────────────────────────┐
│  Layer 4: 内容层 (Content)                                │  ← 文字、图标、交互元素
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Layer 3: 玻璃容器层 (Glass Surfaces)                      │  ← 卡片、导航栏、面板
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Layer 2: 噪点质感层 (Film Grain Overlay)                  │  ← 极细微颗粒，消除色阶断层
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Layer 1: 极光背景层 (Aurora Canvas)                       │  ← 流动渐变光斑
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Layer 0: 深色画布 (Deep Canvas #0A0E1A)                   │  ← 纯色基底
└──────────────────────────────────────────────────────────┘
```

> **Layer 2 (Film Grain)** 是关键的质感层。在所有 CSS 渐变上叠加极细微的噪点纹理，可消除大面积渐变常见的"色阶断层 (Color Banding)"，并赋予画面一种"胶片"或"蛋白石"的物理质感，显著提升高级感。

### 7.4 Layer 1 — 流动极光背景 (Aurora Canvas)

背景不是静态渐变。多个大型模糊光斑以 **60 秒/周期** 的极慢速度在画布上漂移，模拟"思维的流动"。

#### 7.4.1 CSS 实现

```css
/* components/AuroraBackground.module.css */

.aurora {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background-color: #0A0E1A;
}

.aurora::before,
.aurora::after {
  content: '';
  position: absolute;
  width: 60vmax;
  height: 60vmax;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.35;
  will-change: transform;
}

/* Cyan orb — top left drift */
.aurora::before {
  background: radial-gradient(circle, #4AEADC 0%, transparent 70%);
  top: -20%;
  left: -10%;
  animation: drift-a 60s ease-in-out infinite alternate;
}

/* Violet orb — bottom right drift */
.aurora::after {
  background: radial-gradient(circle, #B18CFF 0%, transparent 70%);
  bottom: -20%;
  right: -10%;
  animation: drift-b 45s ease-in-out infinite alternate;
}

@keyframes drift-a {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(15vw, 20vh) scale(1.1); }
  66%  { transform: translate(-5vw, 35vh) scale(0.95); }
  100% { transform: translate(10vw, 10vh) scale(1.05); }
}

@keyframes drift-b {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(-20vw, -15vh) scale(1.15); }
  100% { transform: translate(-5vw, -25vh) scale(0.9); }
}
```

#### 7.4.2 噪点质感层 (Film Grain Overlay)

在极光之上叠加一层 SVG 噪点，消除渐变色阶断层，增加胶片物理质感：

```css
/* components/AuroraBackground.module.css — continued */

.grain {
  position: fixed;
  inset: 0;
  z-index: 0;   /* above aurora (-1), below glass containers */
  pointer-events: none;
  opacity: 0.04; /* extremely subtle — 调节此值控制颗粒强度 */
  mix-blend-mode: overlay;
  background-image: url('/textures/noise-256.png');
  background-repeat: repeat;
  background-size: 256px 256px;
}

/* 亮色模式下略微增强颗粒感，模拟纸张质感 */
:global(.light-mode) .grain {
  opacity: 0.06;
  mix-blend-mode: multiply;
}
```

> **噪点纹理生成**: 使用 256x256 的透明 PNG (灰度噪点, opacity 约 30%)。可通过 CSS `filter: url(#noise-svg)` 内联 SVG turbulence 替代静态 PNG，避免额外网络请求。

```css
/* 替代方案: 纯 CSS SVG 噪点 (无需额外资源) */
.grain-svg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.03;
  filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
}
```

#### 7.4.3 React 组件

```typescript
// components/ui/AuroraBackground.tsx

'use client';
import styles from './AuroraBackground.module.css';

export function AuroraBackground() {
  return (
    <>
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
    </>
  );
}
```

#### 7.4.4 高级方案 — WebGL Shader (可选)

对于追求极致流畅度的场景，可使用 `@shadergradient/react` 替代 CSS 动画：

```typescript
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

export function AuroraShader() {
  return (
    <ShaderGradientCanvas
      style={{ position: 'fixed', inset: 0, zIndex: -1 }}
      pointerEvents="none"
    >
      <ShaderGradient
        type="waterPlane"
        color1="#4AEADC"
        color2="#B18CFF"
        color3="#0A0E1A"
        uSpeed={0.08}     // extremely slow
        uDensity={1.2}
        uStrength={1.5}
      />
    </ShaderGradientCanvas>
  );
}
```

**性能保护**: 检测 `navigator.hardwareConcurrency < 4` 或 `prefers-reduced-motion` 时，自动降级为静态 CSS 渐变。

#### 7.4.5 亮色模式极光 — "晨曦 / 蛋白石" (Dawn / Opal)

亮色模式下，极光**不是暗色极光的反色**（那会变成"脏斑"）。取而代之的是模拟晨曦天空的极淡色弥散渐变：

```css
/* components/AuroraBackground.module.css — light mode override */

:global(.light-mode) .aurora {
  background-color: #F8F6F4; /* Warm opal white base */
}

:global(.light-mode) .aurora::before {
  /* Warm peach/rose — top left */
  background: radial-gradient(circle, rgba(255, 218, 200, 0.5) 0%, transparent 70%);
  opacity: 0.4;
  filter: blur(150px); /* MORE blur in light mode */
}

:global(.light-mode) .aurora::after {
  /* Cool lavender/blue — bottom right */
  background: radial-gradient(circle, rgba(200, 210, 255, 0.5) 0%, transparent 70%);
  opacity: 0.4;
  filter: blur(150px);
}

/* Animation speed unchanged, but barely perceptible in light mode
   due to low saturation — creates subtle ambient warmth shifts */
```

> **原则**: 亮色模式下，渐变色的**饱和度 ≤ 25%**，模糊半径增大至 150px。用户几乎察觉不到背景在变化，但潜意识中会感受到"温暖的呼吸感"，而非静态纯白。

### 7.5 Layer 2 — 深度磨砂玻璃 (Glass Surfaces)

所有卡片、面板、对话框均使用磨砂玻璃材质，能"透"出背景极光的色彩。

#### 7.5.1 MUI 主题覆盖

```typescript
// lib/theme.ts

import { createTheme } from '@mui/material/styles';

// ════════════════════════════════════════════════════════════════
//  SURFACE CONSTANTS
// ════════════════════════════════════════════════════════════════

const GLASS_SURFACE = {
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(24px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  backgroundImage: 'none',
};

const GLASS_SURFACE_ELEVATED = {
  ...GLASS_SURFACE,
  backgroundColor: 'rgba(255, 255, 255, 0.07)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
};

// Article detail / abstract reading zone — near-opaque to isolate
// text from aurora drift, preserving glass edges only at container borders
const READING_SURFACE = {
  backgroundColor: 'rgba(10, 14, 26, 0.88)',
  backdropFilter: 'blur(32px) saturate(1.1)',
  WebkitBackdropFilter: 'blur(32px) saturate(1.1)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  backgroundImage: 'none',
};

// ════════════════════════════════════════════════════════════════
//  GLOW BUDGET — "Less is More" discipline
// ════════════════════════════════════════════════════════════════
//
//  Glow (boxShadow with color spread) is reserved ONLY for:
//    ✅ Primary CTA buttons (Download PDF, Submit)
//    ✅ FAB (Floating Action Button)
//    ✅ Search bar focus state
//    ✅ SpotlightCard hover border (mouse-tracking)
//
//  Everything else uses MUTED surfaces:
//    ❌ Chips — no glow, use low-opacity white fill
//    ❌ Secondary buttons — subtle border, no glow
//    ❌ DataGrid rows — soft white tint, no color glow
//    ❌ Navigation items — opacity change only
//
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
//  FONT STACKS
// ════════════════════════════════════════════════════════════════

const FONT_UI = '"Inter Variable", system-ui, sans-serif';
const FONT_READING = '"Merriweather", "Noto Serif SC", Georgia, serif';

// ════════════════════════════════════════════════════════════════
//  DARK THEME (Default)
// ════════════════════════════════════════════════════════════════

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4AEADC' },
    secondary: { main: '#B18CFF' },
    background: {
      default: '#0A0E1A',
      paper: 'rgba(255, 255, 255, 0.04)',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.92)',
      secondary: 'rgba(255, 255, 255, 0.56)',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    error: { main: '#FF6B6B' },
    success: { main: '#4AEA8B' },
    warning: { main: '#FFD166' },
  },
  typography: {
    fontFamily: FONT_UI,
    h1: { fontFamily: FONT_READING, fontWeight: 400, letterSpacing: '-0.02em' },
    h2: { fontFamily: FONT_READING, fontWeight: 400, letterSpacing: '-0.01em' },
    h3: { fontFamily: FONT_READING, fontWeight: 400 },
    h4: { fontWeight: 400 },
    // Article body text uses serif for academic authority
    body1: { fontFamily: FONT_READING, fontWeight: 400, lineHeight: 1.8, letterSpacing: '0.01em' },
    // UI labels, metadata, captions use sans-serif
    body2: { fontFamily: FONT_UI, fontWeight: 300, letterSpacing: '0.02em' },
    button: { fontFamily: FONT_UI, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'none' as const },
    caption: { fontFamily: FONT_UI, fontWeight: 300, letterSpacing: '0.03em' },
    overline: { fontFamily: FONT_UI, fontWeight: 400, letterSpacing: '0.08em' },
  },
  shape: { borderRadius: 20 },
  components: {
    // --- Glass Card ---
    MuiCard: {
      styleOverrides: {
        root: {
          ...GLASS_SURFACE,
          borderRadius: 20,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            // Subtle white border shift — NO cyan glow here (glow budget)
            borderColor: 'rgba(255, 255, 255, 0.15)',
          },
        },
      },
    },
    // --- Glass AppBar ---
    MuiAppBar: {
      styleOverrides: {
        root: {
          ...GLASS_SURFACE,
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 0,
        },
      },
    },
    // --- Glass Dialog ---
    MuiDialog: {
      styleOverrides: {
        paper: {
          ...GLASS_SURFACE_ELEVATED,
          borderRadius: 24,
        },
      },
    },
    // --- Button (Glow Budget: only `contained` primary CTAs glow) ---
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
        },
        contained: {
          // ✅ PRIMARY CTA — allowed to glow
          background: 'linear-gradient(135deg, #4AEADC, #B18CFF)',
          color: '#0A0E1A',
          fontWeight: 500,
          boxShadow: '0 0 20px rgba(74, 234, 220, 0.25)',
          '&:hover': {
            boxShadow: '0 0 30px rgba(74, 234, 220, 0.4)',
          },
        },
        outlined: {
          // ❌ SECONDARY — muted, no glow
          borderColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
        text: {
          // ❌ TERTIARY — opacity only
          color: 'rgba(255, 255, 255, 0.72)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
        },
      },
    },
    // --- Chip (Glow Budget: ❌ NO glow — muted low-saturation) ---
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'rgba(255, 255, 255, 0.72)',
          fontFamily: FONT_UI,
          fontSize: '0.8125rem',
          '&.MuiChip-filled': {
            // Selected state: slightly brighter white, NOT gradient glow
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.92)',
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.10)',
          },
        },
      },
    },
    // --- Glass TextField ---
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
          // ✅ Search focus — allowed to glow (primary action point)
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4AEADC',
            boxShadow: '0 0 16px rgba(74, 234, 220, 0.15)',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    // --- FAB (Glow Budget: ✅ allowed — primary action) ---
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #4AEADC, #B18CFF)',
          color: '#0A0E1A',
          boxShadow: '0 0 24px rgba(74, 234, 220, 0.3)',
          borderRadius: 16,
          '&:hover': {
            boxShadow: '0 0 36px rgba(74, 234, 220, 0.5)',
          },
        },
      },
    },
    // --- Snackbar ---
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          ...GLASS_SURFACE_ELEVATED,
        },
      },
    },
    // --- DataGrid (Glow Budget: ❌ no color glow on rows) ---
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          ...GLASS_SURFACE,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          },
          '& .MuiDataGrid-row:hover': {
            // Muted white tint instead of cyan glow
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
  },
});

// ════════════════════════════════════════════════════════════════
//  READING SURFACE — exported for article detail components
// ════════════════════════════════════════════════════════════════

export { READING_SURFACE };

// ════════════════════════════════════════════════════════════════
//  LIGHT THEME — "Dawn / Opal" aesthetic
// ════════════════════════════════════════════════════════════════
//
//  Design principle: In light mode, abandon "Glow" entirely.
//  Replace with "Dispersion" (色散) and "Iridescence" (彩虹光泽).
//  Background mimics dawn sky / opal stone — pastel pink/blue/yellow.
//  Glass surfaces become frosted white with subtle prismatic borders.
//

const LIGHT_GLASS_SURFACE = {
  backgroundColor: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  backgroundImage: 'none',
  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.06)',
};

const LIGHT_READING_SURFACE = {
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  backgroundImage: 'none',
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0D7377' },     // Deep teal — NOT bright cyan
    secondary: { main: '#6B4FA0' },   // Muted violet
    background: {
      default: '#F8F6F4',             // Warm opal white (not blue-white)
      paper: 'rgba(255, 255, 255, 0.72)',
    },
    text: {
      primary: '#1A1A2E',             // Near-black with slight warmth
      secondary: 'rgba(26, 26, 46, 0.56)',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    error: { main: '#D32F2F' },
    success: { main: '#2E7D32' },
    warning: { main: '#ED6C02' },
  },
  typography: {
    fontFamily: FONT_UI,
    h1: { fontFamily: FONT_READING, fontWeight: 400, letterSpacing: '-0.02em' },
    h2: { fontFamily: FONT_READING, fontWeight: 400, letterSpacing: '-0.01em' },
    h3: { fontFamily: FONT_READING, fontWeight: 400 },
    h4: { fontWeight: 400 },
    body1: { fontFamily: FONT_READING, fontWeight: 400, lineHeight: 1.8, letterSpacing: '0.01em' },
    body2: { fontFamily: FONT_UI, fontWeight: 400, letterSpacing: '0.02em' },
    button: { fontFamily: FONT_UI, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'none' as const },
  },
  shape: { borderRadius: 20 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          ...LIGHT_GLASS_SURFACE,
          borderRadius: 20,
          // Iridescent border on hover (prismatic shimmer, NOT glow)
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
          '&:hover': {
            borderColor: 'rgba(107, 79, 160, 0.2)',
            boxShadow: '0 4px 24px rgba(107, 79, 160, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          ...LIGHT_GLASS_SURFACE,
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: 'none' },
        contained: {
          // Solid teal — NO glow, NO gradient in light mode
          backgroundColor: '#0D7377',
          color: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(13, 115, 119, 0.2)',
          '&:hover': {
            backgroundColor: '#0A5E62',
            boxShadow: '0 4px 12px rgba(13, 115, 119, 0.3)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 0, 0, 0.15)',
          '&:hover': {
            borderColor: 'rgba(13, 115, 119, 0.4)',
            backgroundColor: 'rgba(13, 115, 119, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          '&.MuiChip-filled': {
            backgroundColor: 'rgba(13, 115, 119, 0.1)',
            borderColor: 'rgba(13, 115, 119, 0.2)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0D7377',
            // Soft teal shadow instead of glow
            boxShadow: '0 0 0 3px rgba(13, 115, 119, 0.1)',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          // Solid teal — NO glow in light mode
          backgroundColor: '#0D7377',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(13, 115, 119, 0.25)',
          borderRadius: 16,
          '&:hover': {
            backgroundColor: '#0A5E62',
          },
        },
      },
    },
  },
});
```

> **关键差异**: 暗色模式中 `boxShadow` 产生的"发光"效果，在亮色模式中全部替换为标准的 `elevation shadow` (低透明度投影)。亮色下没有任何元素"发光"，取而代之的是柔和的色调阴影和棱镜般的边框色散。

### 7.6 Layer 3 — 交互光效 (Interactive Lighting)

#### 7.6.1 Spotlight Card — 光随鼠标 (核心交互)

当鼠标划过卡片时，一束柔和的光晕紧跟指针位置照亮边框和背景，如同手电筒照射玻璃表面。

```typescript
// components/ui/SpotlightCard.tsx

'use client';
import { useRef, type MouseEvent, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Card from '@mui/material/Card';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function SpotlightCard({ children, className, onClick }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring-damped cursor tracking
  const springX = useSpring(mouseX, { stiffness: 200, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 200, damping: 30 });

  function handleMouseMove(e: MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <Card
      ref={ref}
      component={motion.div}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={className}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        // Base glass styling is inherited from theme

        // Spotlight glow layer (pseudo-element via ::before)
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          opacity: 0,
          transition: 'opacity 0.4s ease',
          background: `radial-gradient(
            400px circle at var(--spotlight-x) var(--spotlight-y),
            rgba(74, 234, 220, 0.10),
            transparent 60%
          )`,
          pointerEvents: 'none',
        },
        '&:hover::before': {
          opacity: 1,
        },

        // Border glow layer
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: '1px',
          opacity: 0,
          transition: 'opacity 0.4s ease',
          background: `radial-gradient(
            300px circle at var(--spotlight-x) var(--spotlight-y),
            rgba(74, 234, 220, 0.35),
            transparent 60%
          )`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          WebkitMaskComposite: 'xor',
          pointerEvents: 'none',
        },
        '&:hover::after': {
          opacity: 1,
        },
      }}
      style={{
        // Pass spring values to CSS custom properties
        '--spotlight-x': springX as unknown as string,
        '--spotlight-y': springY as unknown as string,
      } as React.CSSProperties}
    >
      {children}
    </Card>
  );
}
```

#### 7.6.2 发光搜索栏 (Glowing Search Capsule)

搜索栏是一个全圆角胶囊体。聚焦时周围产生扩散的青色辉光。

```typescript
// components/ui/GlowSearchBar.tsx

'use client';
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { motion } from 'framer-motion';

export function GlowSearchBar({ value, onChange, placeholder = 'Search articles...' }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      animate={{
        boxShadow: isFocused
          ? '0 0 40px rgba(74, 234, 220, 0.15), 0 0 80px rgba(177, 140, 255, 0.08)'
          : '0 0 0px transparent',
      }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ borderRadius: 28 }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: isFocused ? '#4AEADC' : 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '28px',
            height: 52,
            transition: 'all 0.3s ease',
          },
        }}
      />
    </motion.div>
  );
}
```

#### 7.6.3 导航栏滚动渐变 (Scroll-Reveal Glass Nav)

导航栏初始完全透明，滚动超过 64px 后逐渐获得磨砂玻璃质感。

```typescript
// components/layout/GlassHeader.tsx

'use client';
import { useScroll, useTransform, motion } from 'framer-motion';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

export function GlassHeader({ children }) {
  const { scrollY } = useScroll();

  const backdropBlur = useTransform(scrollY, [0, 64], [0, 24]);
  const bgOpacity = useTransform(scrollY, [0, 64], [0, 0.06]);
  const borderOpacity = useTransform(scrollY, [0, 64], [0, 0.08]);

  return (
    <AppBar
      component={motion.header}
      position="sticky"
      elevation={0}
      sx={{
        background: 'transparent',
        borderBottom: 'none',
        transition: 'none',
      }}
      style={{
        backdropFilter: `blur(${backdropBlur}px)`,
        backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
        borderBottom: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
      }}
    >
      <Toolbar>{children}</Toolbar>
    </AppBar>
  );
}
```

### 7.7 核心页面布局

#### 7.7.1 公开首页 — 桌面端

```
┌─────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░ Aurora Background (Layer 1) ░░░░░░░░░░░░░░░░ │
│ ░░                                                         ░░ │
│ ░░  ┌─ Glass Nav (透明 → 滚动后磨砂) ─────────────────────┐░░ │
│ ░░  │  Culhane Library     Articles  About  CV   [🔍] [◐] │░░ │
│ ░░  └──────────────────────────────────────────────────────┘░░ │
│ ░░                                                         ░░ │
│ ░░  ┌─ Hero Glass Panel ──────────────────────────────────┐░░ │
│ ░░  │ ┏━━━━━━━┓                                          │░░ │
│ ░░  │ ┃ 头像  ┃  Dennis P. Culhane, Ph.D.               │░░ │
│ ░░  │ ┃(光环) ┃  Dana & Andrew Stone Chair               │░░ │
│ ░░  │ ┗━━━━━━━┛  University of Pennsylvania              │░░ │
│ ░░  │                                                     │░░ │
│ ░░  │  [Biography →]  [Download CV →]                     │░░ │
│ ░░  │                                                     │░░ │
│ ░░  │  ┌─────────┐ ┌──────────┐ ┌────────────────┐       │░░ │
│ ░░  │  │Homeless │ │ Housing  │ │Integrated Data │ ...   │░░ │
│ ░░  │  │ness     │ │ Policy   │ │ Systems        │       │░░ │
│ ░░  │  └─────────┘ └──────────┘ └────────────────┘       │░░ │
│ ░░  └─────────────────────────────────────────────────────┘░░ │
│ ░░                                                         ░░ │
│ ░░  ┌─ Glow Search Capsule ───────────────────────────────┐░░ │
│ ░░  │  🔍  Search by title, author, or keyword...         │░░ │
│ ░░  └─────────────────────────────────────────────────────┘░░ │
│ ░░                                                         ░░ │
│ ░░  [All ✓] [Homelessness] [Veterans] [Policy] [AISP] ← Chips░░ │
│ ░░                                                         ░░ │
│ ░░  ┌─ Spotlight Card (Hover: 光随鼠标) ─────────────────┐░░ │
│ ░░  │  ╭──────────────────────────────────────────────╮  │░░ │
│ ░░  │  │  Title of the Research Paper                 │  │░░ │
│ ░░  │  │  Authors · 2024-03-15                        │  │░░ │
│ ░░  │  │  ┌────────┐ ┌──────────┐                     │  │░░ │
│ ░░  │  │  │Veterans│ │Housing   │                     │  │░░ │
│ ░░  │  │  └────────┘ └──────────┘                     │  │░░ │
│ ░░  │  │  Abstract preview text (3 lines max)...      │  │░░ │
│ ░░  │  │                     [Expand ↗] [Download ↓]  │  │░░ │
│ ░░  │  ╰──────────────────────────────────────────────╯  │░░ │
│ ░░  └─────────────────────────────────────────────────────┘░░ │
│ ░░                                                         ░░ │
│ ░░  ┌─ Spotlight Card ────────────────────────────────────┐░░ │
│ ░░  │  ...                                                │░░ │
│ ░░  └─────────────────────────────────────────────────────┘░░ │
│ ░░                                                         ░░ │
│ ░░             [ Load More ↓ ] (Glass Pill Button)         ░░ │
│ ░░                                                         ░░ │
│ ░░  ── Glass Footer ─────────────────────────────────────── ░░ │
│ ░░  © 2026 Dennis P. Culhane · University of Pennsylvania  ░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.7.2 公开首页 — 移动端

```
┌──────────────────────────┐
│ ░ Aurora BG (简化双色) ░ │
│ ░                      ░ │
│ ░ ☰  Culhane Library  🔍░ │  ← Glass TopBar
│ ░                      ░ │
│ ░  ┌──────────────────┐░ │
│ ░  │   ◯ 头像 (光环)  │░ │
│ ░  │   Dennis Culhane  │░ │
│ ░  │   Ph.D. · UPenn   │░ │
│ ░  │   [Bio] [CV]      │░ │
│ ░  └──────────────────┘░ │
│ ░                      ░ │
│ ░ ┌──────────────────┐ ░ │
│ ░ │ 🔍 Search...     │ ░ │  ← Glow Capsule (全宽)
│ ░ └──────────────────┘ ░ │
│ ░                      ░ │
│ ░ ←─ Scroll Chips ──→ ░ │
│ ░ [All][Homeless][Vets]░ │
│ ░                      ░ │
│ ░ ╭──────────────────╮ ░ │
│ ░ │ Article Title    │ ░ │  ← Glass Card (单列)
│ ░ │ Author · Date    │ ░ │
│ ░ │ [Tag] [Tag]      │ ░ │
│ ░ │ Abstract...      │ ░ │
│ ░ │    [Expand] [↓]  │ ░ │
│ ░ ╰──────────────────╯ ░ │
│ ░ ╭──────────────────╮ ░ │
│ ░ │ ...              │ ░ │
│ ░ ╰──────────────────╯ ░ │
│ ░                      ░ │
│ ░  [ Load More ↓ ]    ░ │
│ ░                      ░ │
│ ░ ┌──────────────────┐ ░ │
│ ░ │ 📄 Articles │ 👤  │ ░ │  ← Glass Bottom Nav
│ ░ └──────────────────┘ ░ │
└──────────────────────────┘
```

#### 7.7.3 管理后台 — 桌面端

```
┌─────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░ Aurora BG (降低亮度 50%) ░░░░░░░░░░░░░░░░░░ │
│ ░                                                            ░ │
│ ░ ┌─ Glass Rail ─┐  ┌─ Glass Content Panel ────────────────┐░ │
│ ░ │              │  │                                      │░ │
│ ░ │   ◇ Logo    │  │  Admin Dashboard          [◯ Admin] │░ │
│ ░ │              │  │                                      │░ │
│ ░ │   📊        │  │  ┌────────┐ ┌────────┐ ┌────────┐   │░ │
│ ░ │  Dashboard   │  │  │  233  │ │   12   │ │ 5,840  │   │░ │
│ ░ │              │  │  │Articles│ │Categor.│ │ Views  │   │░ │
│ ░ │   📄        │  │  └────────┘ └────────┘ └────────┘   │░ │
│ ░ │  Articles ●  │  │  (Glass stat cards w/ gradient num)  │░ │
│ ░ │              │  │                                      │░ │
│ ░ │   📁        │  │  ┌─ Glass DataGrid ──────────────┐   │░ │
│ ░ │  Categories  │  │  │ 🔍 Search...  [+ New] [📤]   │   │░ │
│ ░ │              │  │  │                               │   │░ │
│ ░ │   👤        │  │  │ ☐ │ Title     │Authors│Date│⋮ │   │░ │
│ ░ │  Profile     │  │  │ ──┼──────────┼───────┼────┼── │   │░ │
│ ░ │              │  │  │ ☐ │A Data-...│Culhane│2019│⋮ │   │░ │
│ ░ │   📧        │  │  │ ☐ │Epidemiol.│Brignon│2018│⋮ │   │░ │
│ ░ │  Subscribers │  │  │                               │   │░ │
│ ░ │              │  │  │ ◀ 1 2 3 ... ▶    20/page ▾  │   │░ │
│ ░ │   📈        │  │  └───────────────────────────────┘   │░ │
│ ░ │  Analytics   │  │                                      │░ │
│ ░ │              │  │                          ╭─────╮    │░ │
│ ░ └──────────────┘  │                          │  ＋ │    │░ │
│ ░                    │                          ╰─────╯ FAB│░ │
│ ░                    └──────────────────────────────────────┘░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────────┘
```

### 7.8 关键动效规范

#### 7.8.1 文章卡片展开 — 水流变形过渡 (Morphing Transition)

点击卡片后，卡片不是简单地"打开弹窗"，而是原地流体变形为详情面板。

```typescript
// components/articles/ArticleCard.tsx

'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Box from '@mui/material/Box';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { READING_SURFACE } from '@/lib/theme';

export function ArticleCard({ article, isExpanded, onToggle }) {
  return (
    <SpotlightCard onClick={onToggle}>
      <motion.div
        layout
        layoutId={`card-${article.id}`}
        transition={{
          layout: { type: 'spring', stiffness: 200, damping: 28 },
        }}
        style={{ padding: isExpanded ? 32 : 24 }}
      >
        {/* Title uses serif font (h3 → Merriweather via theme) */}
        <motion.h3
          layoutId={`title-${article.id}`}
          style={{
            fontSize: isExpanded ? '1.5rem' : '1.125rem',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.92)',
            fontFamily: '"Merriweather", Georgia, serif',
          }}
        >
          {article.title}
        </motion.h3>

        {/* Metadata uses sans-serif (Inter) */}
        <motion.p
          layoutId={`meta-${article.id}`}
          style={{
            color: 'rgba(255, 255, 255, 0.56)',
            fontFamily: '"Inter Variable", system-ui, sans-serif',
            fontSize: '0.875rem',
          }}
        >
          {article.authors} · {article.published_date}
        </motion.p>

        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/*
                READING ZONE: near-opaque background isolates text from
                aurora drift, preventing contrast fluctuation during reading.
                Glass edges are preserved at the container border only.
              */}
              <Box
                sx={{
                  ...READING_SURFACE,
                  borderRadius: 3,
                  p: 3,
                  mt: 2,
                }}
              >
                <p style={{
                  color: 'rgba(255, 255, 255, 0.88)',
                  lineHeight: 1.9,
                  fontFamily: '"Merriweather", Georgia, serif',
                  fontSize: '1rem',
                }}>
                  {article.abstract}
                </p>
              </Box>
              <PdfPreview url={article.pdf_url} />
              <CitationExport article={article} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </SpotlightCard>
  );
}
```

#### 7.8.2 页面路由过渡 — 淡入 + 解除模糊

```typescript
// app/template.tsx

'use client';
import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(8px)', y: 12 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
```

#### 7.8.3 极光呼吸 — 背景节奏感

极光光斑除了位移，还有缓慢的"呼吸"效果（透明度脉动）：

```css
/* 叠加在 drift 动画之上 */
.aurora::before {
  animation:
    drift-a 60s ease-in-out infinite alternate,
    breathe 8s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 0.30; }
  50%      { opacity: 0.42; }
}
```

#### 7.8.4 动效时间常量

| 场景 | 时长 | 缓动函数 | 说明 |
|---|---|---|---|
| 极光漂移 | 45-60s | `ease-in-out` | 极慢，模拟思维流动 |
| 极光呼吸 | 8s | `ease-in-out` | 透明度脉动 |
| 卡片展开 | 400ms | `spring(200, 28)` | 弹簧物理感 |
| 页面过渡 | 500ms | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | M3 标准缓出 |
| 光效出现 | 400ms | `ease` | 光晕渐显 |
| Hover 变化 | 300ms | `ease` | 背景/边框色变 |
| 搜索辉光 | 500ms | `ease-out` | 聚焦后柔和扩散 |
| Toast 进入 | 300ms | `ease-out` | 从底部滑入 |

### 7.9 组件使用对照表

| 场景 | 组件名称 | 视觉特征 | 发光预算 |
|---|---|---|---|
| 全局背景 | `<AuroraBackground>` | 多色光斑慢速漂移 + 呼吸透明度 + **噪点质感层** | — |
| 顶部导航 | `<GlassHeader>` | 透明 → 滚动后磨砂玻璃 | ❌ 无发光 |
| 文章卡片 | `<SpotlightCard>` | 玻璃材质 + 鼠标追踪光晕 (仅边框) | ✅ Hover 边框光 |
| 阅读区域 | `<ReadingZone>` | 近不透明背景 (`0.88`), 衬线体排版, 高对比度 | ❌ 无发光 |
| 搜索栏 | `<GlowSearchBar>` | 全圆角胶囊 + 聚焦时扩散辉光 | ✅ Focus 发光 |
| 分类标签 | `<MutedChip>` | **低透明度白色填充**, 选中态仅亮度提升, 无渐变发光 | ❌ 无发光 |
| 主 CTA 按钮 | `<GradientButton>` | 青→紫渐变 + 发光阴影 | ✅ 发光 |
| 次要按钮 | `outlined / text` | 细边框, hover 微亮, 无色彩阴影 | ❌ 无发光 |
| FAB | `<GlowFab>` | 渐变 + 脉动光晕 | ✅ 发光 |
| 侧边导航 | `<GlassRail>` | 玻璃材质 Rail, 72px 宽 | ❌ 无发光 |
| 数据表格 | `<GlassDataGrid>` | 玻璃容器, **行 hover 白色微亮** (非青色) | ❌ 无发光 |
| 对话框 | `<GlassDialog>` | 磨砂玻璃面板, 24px 圆角 | ❌ 无发光 |
| 提示条 | `<GlassSnackbar>` | 磨砂玻璃条 | ❌ 无发光 |
| 骨架屏 | `<AuroraSkeleton>` | 渐变色脉动 (而非灰色) | — |
| 文件拖放 | `<GlassDropZone>` | 虚线边框, 拖入时边框提亮 (白色, 非发光) | ❌ 无发光 |
| 底部导航 | `<GlassBottomNav>` | 磨砂玻璃, 仅移动端 | ❌ 无发光 |

### 7.10 无障碍、可读性与性能保护

| 场景 | 策略 |
|---|---|
| **长文阅读区** | 文章详情、摘要展开区使用 `READING_SURFACE` (`rgba(10,14,26,0.88)`)，背景接近不透明，确保极光漂移不影响文字对比度 |
| **学术排版** | 正文/摘要使用衬线体 Merriweather (`body1`)；行高 1.8-1.9；段落间距 1.5em。UI 元素保持 Inter 无衬线 |
| **发光预算** | 仅主 CTA (下载/搜索/FAB) 允许发光阴影；Chip、次要按钮、DataGrid 行使用低透明度白色变化，无彩色发光 |
| `prefers-reduced-motion` | 禁用所有 CSS 动画和 Framer Motion；极光降级为静态渐变；Spotlight 改为静态边框 |
| `prefers-contrast: high` | 增加边框对比度至 `rgba(255,255,255,0.3)`；关闭 `backdrop-filter`；阅读区背景提升至 `0.95` |
| GPU 性能不足 | 检测 `navigator.hardwareConcurrency < 4`，降级为纯 CSS 静态背景；跳过 noise overlay |
| **亮色模式 (Dawn/Opal)** | 彻底放弃"发光"，改用色调阴影 (tinted shadow) + 棱镜色散边框；背景使用晨曦渐变 (`#FFF0E8 → #F0E6FF → #E8F4F8`) 而非暗色极光的反色；噪点 `mix-blend-mode` 切换为 `multiply` |
| WCAG 2.1 AA | 所有文字对比度 ≥ 4.5:1 (阅读区实测 ≥ 12:1)；交互元素 focus 态使用 `2px solid #4AEADC` (暗色) / `#0D7377` (亮色) |
| 触屏设备 | Spotlight 效果禁用鼠标追踪，改为静态渐变边框 + `touch-action: manipulation` |
| **噪点纹理** | 全局叠加 `opacity: 0.04` 的 Film Grain，消除 CSS 渐变色阶断层；亮色模式下提升至 `0.06` 并切换 `multiply` 混合模式 |

### 7.11 响应式断点

| 断点 | 宽度 | 极光 | 卡片布局 | 导航 |
|---|---|---|---|---|
| **Mobile** | < 600px | 双色静态渐变 (省 GPU) | 单列全宽 | Glass Bottom Nav |
| **Tablet** | 600-904px | CSS 双光斑漂移 | 双列网格 | 侧滑抽屉 |
| **Desktop** | 905-1439px | CSS 三光斑漂移 | 三列网格 | Glass Top Bar |
| **Wide** | ≥ 1440px | WebGL Shader (可选) | 三列 + 侧面板, max-width 1320px | Glass Top Bar |

---

## 8. 项目结构规划

```
culhane-library-v2/
│
├── app/                                ← Next.js App Router
│   ├── (public)/                       ← 公开页面分组
│   │   ├── layout.tsx                  ← 公开页面通用布局
│   │   ├── page.tsx                    ← 首页 (/)
│   │   ├── articles/
│   │   │   └── page.tsx               ← 文章列表 (/articles)
│   │   ├── article/
│   │   │   └── [slug]/
│   │   │       └── page.tsx           ← 文章详情 (/article/[slug])
│   │   └── about/
│   │       └── page.tsx               ← 关于页面
│   │
│   ├── admin/                          ← 管理后台 (受保护)
│   │   ├── layout.tsx                  ← 后台布局 (Navigation Rail)
│   │   ├── page.tsx                    ← 仪表盘 (/admin)
│   │   ├── login/
│   │   │   └── page.tsx               ← 登录页
│   │   ├── articles/
│   │   │   ├── page.tsx               ← 文章管理列表
│   │   │   ├── new/
│   │   │   │   └── page.tsx           ← 新建文章
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx       ← 编辑文章
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── subscribers/
│   │   │   └── page.tsx
│   │   └── stats/
│   │       └── page.tsx
│   │
│   ├── api/                            ← API Routes (Serverless)
│   │   ├── articles/
│   │   │   ├── route.ts               ← GET (list/search), POST (create)
│   │   │   ├── batch/
│   │   │   │   └── route.ts           ← POST (bulk import)
│   │   │   └── [id]/
│   │   │       └── route.ts           ← GET, PUT, DELETE
│   │   ├── categories/
│   │   │   └── route.ts
│   │   ├── upload/
│   │   │   └── presign/
│   │   │       └── route.ts           ← POST (R2 presigned URL)
│   │   ├── profile/
│   │   │   └── route.ts
│   │   └── subscribers/
│   │       └── route.ts
│   │
│   ├── layout.tsx                      ← 根布局 (ThemeProvider)
│   └── template.tsx                    ← 路由过渡动画
│
├── components/
│   ├── ui/                             ← 通用 UI 组件 (Ethereal Intelligence)
│   │   ├── AuroraBackground.tsx        ← 流动极光背景 + 噪点质感层
│   │   ├── AuroraBackground.module.css ← 极光/噪点/亮色模式 CSS
│   │   ├── SpotlightCard.tsx           ← 鼠标追踪光晕卡片
│   │   ├── ReadingZone.tsx             ← 近不透明阅读容器 (READING_SURFACE)
│   │   ├── GlowSearchBar.tsx           ← 发光搜索胶囊
│   │   ├── GlassDropZone.tsx           ← 玻璃材质文件拖放区
│   │   ├── GlassDialog.tsx             ← 磨砂玻璃对话框
│   │   ├── AuroraSkeleton.tsx          ← 渐变色脉动骨架屏
│   │   ├── ThemeToggle.tsx             ← 亮/暗模式切换
│   │   └── ConfirmDialog.tsx
│   ├── articles/                       ← 文章相关组件
│   │   ├── ArticleCard.tsx             ← 使用 SpotlightCard 封装
│   │   ├── ArticleDetail.tsx
│   │   ├── ArticleGrid.tsx
│   │   ├── CategoryChips.tsx           ← 半透明玻璃标签
│   │   ├── CitationExport.tsx
│   │   └── PdfPreview.tsx
│   ├── admin/                          ← 管理后台组件
│   │   ├── GlassRail.tsx               ← 玻璃材质侧边导航
│   │   ├── ArticleForm.tsx
│   │   ├── ArticleDataGrid.tsx         ← Glass DataGrid
│   │   ├── BulkImportDialog.tsx
│   │   ├── StatsCards.tsx              ← 渐变数字高亮
│   │   └── ProfileEditor.tsx
│   └── layout/                         ← 布局组件
│       ├── GlassHeader.tsx             ← 滚动渐变玻璃导航
│       ├── GlassFooter.tsx
│       ├── HeroSection.tsx
│       └── GlassBottomNav.tsx          ← 移动端玻璃底栏
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   ← 浏览器端 Supabase 客户端
│   │   ├── server.ts                   ← 服务端 Supabase 客户端
│   │   └── middleware.ts               ← Auth 中间件
│   ├── r2/
│   │   └── client.ts                   ← R2 S3Client 配置
│   ├── theme.ts                        ← MUI 主题配置 (Ethereal Glass Theme)
│   ├── utils.ts                        ← 通用工具函数
│   └── validators.ts                   ← Zod Schema 校验
│
├── hooks/
│   ├── useArticleSearch.ts
│   ├── useDebouncedValue.ts
│   ├── useFileUpload.ts
│   └── useMediaQuery.ts
│
├── types/
│   └── index.ts                        ← TypeScript 类型定义
│
├── public/
│   ├── fonts/                          ← 自托管字体
│   │   ├── inter-variable.woff2        ← UI 无衬线字体
│   │   └── merriweather-*.woff2        ← 阅读衬线字体 (Regular + Bold)
│   ├── textures/
│   │   └── noise-256.png               ← 256x256 灰度噪点 (Film Grain)
│   └── favicon.ico
│
├── middleware.ts                        ← Next.js 中间件 (Auth Guard)
├── next.config.ts
├── package.json
├── tsconfig.json
├── .env.local                          ← 环境变量 (不提交)
├── .env.example                        ← 环境变量模板
└── .github/
    └── workflows/
        ├── ci.yml                      ← CI: lint + type-check + test
        └── deploy.yml                  ← 可选: 非 Vercel 部署
```

### 8.1 环境变量

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # 仅服务端使用

# Cloudflare R2
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=culhane-library
R2_PUBLIC_URL=https://files.dennisculhane.com

# Vercel (自动注入)
VERCEL_URL=xxx
```

---

## 9. 部署与 CI/CD

### 9.1 部署流水线

```
开发者推送代码到 GitHub
        │
        ├──▶ GitHub Actions (CI)
        │     ├── pnpm install
        │     ├── pnpm lint
        │     ├── pnpm type-check
        │     ├── pnpm test
        │     └── 全部通过 → ✅ 标记为可部署
        │
        └──▶ Vercel (CD)
              ├── 检测到 push → 自动构建
              ├── 预览部署 (PR 分支 → preview URL)
              └── 合并到 main → 生产部署 → dennisculhane.com
```

### 9.2 域名配置

| 域名 | 指向 | 用途 |
|---|---|---|
| `dennisculhane.com` | Vercel | 主站 (Next.js) |
| `files.dennisculhane.com` | Cloudflare R2 Custom Domain | PDF 文件分发 |

---

## 10. 数据迁移计划

### 10.1 迁移步骤

```
Phase 1: 基础设施搭建 (Day 1-2)
  ├── 创建 Supabase 项目 → 执行 SQL Schema
  ├── 创建 Cloudflare R2 Bucket → 配置公开访问
  ├── 初始化 Next.js 项目 → 部署到 Vercel
  └── 配置域名 DNS

Phase 2: 数据迁移 (Day 3-4)
  ├── 编写迁移脚本: scripts/migrate-articles.ts
  │     ├── 读取 data/articles.json
  │     ├── 为每篇文章生成 UUID + Slug
  │     ├── 提取并去重 categories → INSERT categories
  │     ├── INSERT articles (批量)
  │     └── INSERT article_categories (关联)
  │
  ├── 编写迁移脚本: scripts/migrate-pdfs.ts
  │     ├── 遍历 papers/ 目录下所有 PDF
  │     ├── 使用 R2 SDK 上传每个文件
  │     ├── 更新 articles.pdf_url 为 R2 公开 URL
  │     └── 验证所有文件可访问
  │
  └── 迁移 profile.json → INSERT profiles

Phase 3: 功能开发 (Day 5-14)
  ├── 公开页面 (首页、文章列表、文章详情)
  ├── 管理后台 (登录、CRUD、批量导入)
  ├── 搜索功能
  └── 主题切换

Phase 4: 验证与切换 (Day 15-16)
  ├── 端到端测试
  ├── 性能测试 (Lighthouse > 90)
  ├── DNS 切换 dennisculhane.com → Vercel
  └── 旧仓库 papers/ 目录标记为 deprecated
```

### 10.2 迁移脚本伪代码

```typescript
// scripts/migrate-articles.ts

import articles from '../data/articles.json';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function generateSlug(title: string, date: string): string {
  const datePrefix = date || '';
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
  return `${datePrefix}-${titleSlug}`;
}

async function migrate() {
  // 1. Collect and deduplicate categories
  const allCategories = new Set<string>();
  for (const article of articles) {
    for (const cat of article.categories ?? []) {
      allCategories.add(cat.trim());
    }
  }

  // 2. Insert categories
  const categoryMap = new Map<string, number>();
  for (const name of allCategories) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data } = await supabase
      .from('categories')
      .upsert({ name, slug }, { onConflict: 'name' })
      .select('id')
      .single();
    categoryMap.set(name, data!.id);
  }

  // 3. Insert articles
  for (const article of articles) {
    const slug = generateSlug(article.title, article.date);
    const isExternal = !article.pdfUrl?.includes('raw.githubusercontent.com');

    const { data: inserted } = await supabase
      .from('articles')
      .insert({
        title: article.title,
        slug,
        authors: article.authors,
        published_date: article.date || null,
        abstract: article.abstract || '',
        pdf_url: article.pdfUrl,
        pdf_filename: article.fileName || null,
        source_type: isExternal ? 'external' : 'uploaded',
        external_url: isExternal ? article.pdfUrl : null,
      })
      .select('id')
      .single();

    // 4. Insert article-category relations
    const relations = (article.categories ?? []).map((cat) => ({
      article_id: inserted!.id,
      category_id: categoryMap.get(cat.trim())!,
    }));

    if (relations.length > 0) {
      await supabase.from('article_categories').insert(relations);
    }
  }

  console.log(`Migrated ${articles.length} articles`);
}

migrate();
```

---

## 11. 成本估算

### 11.1 月度运行成本 (预计)

| 服务 | 免费层配额 | 预计月用量 | 月成本 |
|---|---|---|---|
| **Vercel** (Hobby) | 100GB 带宽 | ~5GB | **$0** |
| **Supabase** (Free) | 500MB DB, 5GB 带宽 | ~10MB DB | **$0** |
| **Cloudflare R2** (Free) | 10GB 存储, 10M 读 | ~1GB, ~10K 读 | **$0** |
| **GitHub** (Free) | 无限公开仓库 | 代码仓库 | **$0** |
| **域名** | — | dennisculhane.com | **~$12/年** |
| | | | |
| **总计** | | | **≈ $1/月** (仅域名分摊) |

### 11.2 扩展成本触发点

| 触发条件 | 升级方案 | 增加成本 |
|---|---|---|
| 文章超 5,000 篇 / DB > 500MB | Supabase Pro | +$25/月 |
| PDF 存储超 10GB | R2 按量计费 ($0.015/GB/月) | +$0.15/GB |
| 月访问量超 100K | Vercel Pro | +$20/月 |
| 需要自定义邮件通知 | Resend (Free 3,000/月) | $0 |

---

*End of Document — System Architecture v2.0*

*下一步: 基于此文档开始 Phase 1 基础设施搭建。*
