# System Architecture v1.0 — Professor's Digital Library

> **Project**: Dennis Culhane Academic Digital Library  
> **Domain**: [dennisculhane.com](https://dennisculhane.com)  
> **Repository**: `Dennis-Culhane/Culhane.github.io`  
> **Document Version**: 1.0  
> **Date**: 2026-02-09  
> **Purpose**: Full reverse-engineering analysis of the existing v1.0 system to inform the v2.0 upgrade.

---

## Table of Contents

1. [Project Background & Objectives](#1-project-background--objectives)
2. [Technical Architecture](#2-technical-architecture)
3. [Feature Specifications](#3-feature-specifications)
4. [Database Schema](#4-database-schema)
5. [Core Data Flow & Implementation Logic](#5-core-data-flow--implementation-logic)
6. [Technical Debt & Improvement Recommendations](#6-technical-debt--improvement-recommendations)

---

## 1. Project Background & Objectives

### 1.1 Project Context

The Professor's Digital Library is an academic portfolio website for **Dennis P. Culhane, Ph.D.** — Dana and Andrew Stone Chair in Social Policy at the University of Pennsylvania. The site serves as a centralized repository for his **200+ published research papers** spanning topics including homelessness, housing policy, integrated data systems, and social policy.

### 1.2 Core Objectives (v1.0)

| Objective | Status |
|---|---|
| Publicly display all academic publications | ✅ Achieved |
| Provide category-based article navigation | ✅ Achieved |
| Enable admin content management (CRUD) | ✅ Achieved |
| Support bulk article import from Excel | ✅ Achieved |
| Host PDF papers with direct download links | ✅ Achieved |
| Provide article deep-linking via URL hash | ✅ Achieved |
| Zero-cost hosting and maintenance | ✅ Achieved (GitHub Pages) |

### 1.3 User Roles

| Role | Access | Authentication |
|---|---|---|
| **Public Visitor** | Read-only: browse articles, view profile, download PDFs | None |
| **Administrator** | Full CRUD: manage articles, upload PDFs, manage profile | GitHub Personal Access Token |

---

## 2. Technical Architecture

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │  index.html   │  │  admin.html  │  │  visualization.html    │    │
│  │  (Public)     │  │  (Admin)     │  │  author-network.html   │    │
│  │              │  │              │  │  analytics.html         │    │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬───────────┘    │
│         │                  │                       │                │
│  ┌──────┴──────────────────┴───────────────────────┴──────────┐    │
│  │                  Vanilla JavaScript Layer                   │    │
│  │  config.js │ data.js │ main.js │ admin.js │ followers.js   │    │
│  │  auth.js   │ dashboard.js │ analytics.js                   │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                       │
│  ┌──────────────────────────┴─────────────────────────────────┐    │
│  │              CDN Libraries                                  │    │
│  │  Tailwind CSS │ Chart.js │ D3.js │ SheetJS │ AOS           │    │
│  │  Font Awesome │ Google Fonts │ EmailJS (unconfigured)      │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                          HTTPS (fetch API)
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      GitHub REST API v3                               │
│                                                                      │
│  GET  /repos/{owner}/{repo}/contents/data/articles.json  (Read)     │
│  PUT  /repos/{owner}/{repo}/contents/data/articles.json  (Write)    │
│  PUT  /repos/{owner}/{repo}/contents/papers/{filename}   (Upload)   │
│  GET  /user                                              (Auth)     │
│  DELETE /repos/{owner}/{repo}/contents/papers/{filename} (Delete)   │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     GitHub Repository (Storage)                      │
│                                                                      │
│  data/                                                               │
│  ├── articles.json ........... Article metadata (200+ entries)       │
│  ├── profile.json ............ Professor profile data                │
│  ├── stats.json .............. Analytics data (static/mock)          │
│  └── followers.json .......... Subscriber email list                 │
│                                                                      │
│  papers/ ..................... 233 PDF research papers                │
│  images/ ..................... 3 profile images                       │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                          GitHub Pages (auto-deploy)
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     GitHub Pages Hosting                              │
│                     CNAME: dennisculhane.com                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Markup** | HTML5 | — | Page structure |
| **Styling** | Tailwind CSS | 3.x (CDN) | Utility-first CSS framework |
| **Styling** | Custom CSS | — | `css/style.css` supplementary styles |
| **Scripting** | Vanilla JavaScript | ES6+ | Core application logic |
| **Scripting** | React + TypeScript | 18.2 / 4.8 | Alternative frontend (unused in production) |
| **Charting** | Chart.js | Latest (CDN) | Research statistics visualization |
| **Graphs** | D3.js | v7 (CDN) | Author collaboration network |
| **Spreadsheet** | SheetJS (XLSX) | Latest (CDN) | Excel file parsing for bulk upload |
| **Animation** | AOS | Latest (CDN) | Scroll-triggered animations |
| **Icons** | Font Awesome | 6.0 (CDN) | Icon library |
| **Fonts** | Google Fonts | — | Inter, Poppins typefaces |
| **API** | GitHub REST API | v3 | Data persistence layer |
| **Hosting** | GitHub Pages | — | Static site hosting |
| **Domain** | Custom CNAME | — | `dennisculhane.com` |

### 2.3 File Structure

```
Culhane.github.io/
│
├── index.html ..................... Public main page (~2,173 lines)
├── admin.html ..................... Admin dashboard (~1,782 lines)
├── dashboard.html ................. Legacy dashboard
├── visualization.html ............. Research statistics (Chart.js)
├── author-network.html ............ Collaboration network (D3.js)
├── analytics.html ................. Analytics dashboard
│
├── js/
│   ├── config.js .................. GitHub API config & unified settings
│   ├── config.js.template ......... Config template (with env vars)
│   ├── data.js .................... ArticlesManager: CRUD + file ops
│   ├── main.js .................... Public page UI logic
│   ├── admin.js ................... Admin page UI + storage ops
│   ├── auth.js .................... Simple auth check (localStorage)
│   ├── followers.js ............... FollowersManager: email subscriptions
│   ├── dashboard.js ............... Dashboard page logic
│   └── analytics.js ............... Analytics page logic
│
├── css/
│   └── style.css .................. Custom styles
│
├── data/
│   ├── articles.json .............. Article database (200+ records)
│   ├── profile.json ............... Professor profile
│   ├── stats.json ................. Analytics data (static)
│   └── *.pdf ...................... CV documents (3 files)
│
├── papers/ ........................ 233 research paper PDFs
├── images/ ........................ 3 profile images
│
├── client/ ........................ React/TypeScript app (alternative, not deployed)
│   └── src/
│       ├── App.tsx
│       ├── index.tsx
│       ├── components/ ............ ArticleList, BulkUploadTool, etc.
│       ├── pages/ ................. Home.tsx
│       ├── services/ .............. api.ts
│       └── types/ ................. index.ts
│
├── server/ ........................ Mongoose models (not used in prod)
│   └── src/models/
│       ├── Article.ts
│       └── Professor.ts
│
├── scripts/
│   └── generate-sitemap.js ........ Sitemap generator
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── CNAME
├── robots.txt
├── sitemap.xml
└── README.md
```

### 2.4 Deployment Architecture

- **Hosting**: GitHub Pages with automatic deployment on push to `main` branch.
- **Domain**: Custom domain `dennisculhane.com` configured via `CNAME` file.
- **CDN**: All third-party libraries loaded from public CDNs (unpkg, cdnjs, googleapis).
- **CI/CD**: None. Changes pushed to `main` trigger GitHub Pages rebuild automatically.
- **SSL**: Provided by GitHub Pages (Let's Encrypt).

---

## 3. Feature Specifications

### 3.1 Public Main Page (`index.html`)

| Feature | Implementation | Status |
|---|---|---|
| **Professor Profile Display** | Fetches `data/profile.json`; renders name, positions, biography, photo | ✅ |
| **Biography Modal** | "Read More" expands full bio in a modal overlay | ✅ |
| **Research Area Tags** | Hardcoded array rendered as pill-style tags | ✅ |
| **Article Listing** | Fetches `data/articles.json` via GitHub raw URL; sorted by date (newest first) | ✅ |
| **Category Filtering** | Dynamically extracts categories from articles; filters client-side | ✅ |
| **Article Detail Modal** | Click article title to see title, authors, date, abstract, categories, download link | ✅ |
| **PDF Access** | Links to raw GitHub URLs or external URLs for paper downloads | ✅ |
| **Article Deep-linking** | URL hash `#article={slug}` scrolls to and opens specific article | ✅ |
| **Copy Article Link** | Clipboard API copies shareable article URL | ✅ |
| **Responsive Design** | Tailwind CSS responsive utilities | ✅ |
| **Dark Mode** | Not implemented | ❌ |
| **Full-text Search** | Not implemented — only category filter exists | ❌ |
| **Pagination** | Not implemented — all 200+ articles rendered at once | ❌ |
| **CV Download** | Links to PDF files in `data/` directory | ✅ |

### 3.2 Admin Dashboard (`admin.html`)

| Feature | Implementation | Status |
|---|---|---|
| **Token Authentication** | Admin enters GitHub PAT; validated via `GET /user`; stored in `sessionStorage` | ✅ |
| **Single Article Add** | Form: title, authors, date, categories, abstract, PDF file upload | ✅ |
| **PDF Upload** | File → base64 → GitHub API PUT to `papers/{filename}` | ✅ |
| **Bulk Upload (Excel)** | SheetJS parses `.xlsx`; preview table; confirm to batch-add articles | ✅ |
| **Article Editing** | In-place edit with form population; updates `articles.json` via GitHub API | ✅ |
| **Single Article Delete** | Removes from `articles.json`; attempts PDF file deletion from `papers/` | ✅ |
| **Batch Delete** | Select mode with checkboxes; bulk remove selected articles | ✅ |
| **Category Management** | Categories extracted from existing articles; rendered as selectable tags | ✅ |
| **Profile Management** | Editable professor profile (name, bio, image, CV) | Partial |
| **Followers Management** | `FollowersManager` reads/writes `data/followers.json` | ✅ |
| **Email Notifications** | EmailJS integration scaffolded but **not configured** (placeholder IDs) | ⚠️ |

### 3.3 Visualization Pages

| Page | Technology | Features |
|---|---|---|
| `visualization.html` | Chart.js | Research statistics charts (publication timeline, category distribution) |
| `author-network.html` | D3.js v7 | Force-directed graph of co-author collaboration network |
| `analytics.html` | Chart.js | Visitor analytics dashboard (reads `data/stats.json`) |
| `dashboard.html` | — | Legacy/alternative dashboard (170 lines, minimal) |

### 3.4 SEO & Discoverability

| Feature | File | Status |
|---|---|---|
| Sitemap | `sitemap.xml` (auto-generated via `scripts/generate-sitemap.js`) | ✅ |
| Robots.txt | `robots.txt` | ✅ |
| Meta Tags | Embedded in HTML `<head>` | ✅ |
| Custom Domain | `CNAME` → `dennisculhane.com` | ✅ |

---

## 4. Database Schema

The project uses **flat JSON files** stored in the GitHub repository as its persistence layer. There is no relational or document database.

### 4.1 `data/articles.json` — Article Metadata

```jsonc
// Array of Article objects. Current count: 200+
[
  {
    "id": "1744965347136",        // string — timestamp-based unique ID
    "title": "Article Title",      // string — full publication title
    "authors": "Author A, Author B", // string — comma-separated author names
    "date": "2019-01-16",         // string — publication date (YYYY-MM-DD)
    "categories": [                // string[] — research topic tags
      "Policy Analysis and Commentary",
      "Population Estimation"
    ],
    "abstract": "Full abstract...", // string — article abstract
    "pdfUrl": "https://raw...",    // string — direct URL to PDF (GitHub raw or external)
    "fileName": "paper.pdf",       // string? — optional, original upload filename
    "lastModified": "2025-03-10"   // string? — optional, last edit date
  }
]
```

**Key observations:**
- `id` is generated via `Date.now().toString()` — a timestamp string, not an integer.
- `categories` uses semicolons (`;`) as delimiters in Excel imports but commas (`,`) elsewhere — inconsistency.
- `pdfUrl` is a mix of GitHub raw URLs (`raw.githubusercontent.com/...`) and external URLs (e.g., `aisp.upenn.edu`).
- No `createdAt`/`updatedAt` audit fields beyond the optional `lastModified`.
- No relational links between articles (no co-citation, no series grouping).

### 4.2 `data/profile.json` — Professor Profile

```jsonc
{
  "imageUrl": "https://raw.githubusercontent.com/.../images/DennisCulhane_05 cropped.jpg",
  "name": "Dennis P. Culhane, Ph.D.",
  "positions": [
    "Dana and Andrew Stone Chair in Social Policy,",
    "Professor, School of Social Policy and Practice,",
    "University of Pennsylvania"
  ],
  "biography": [
    "Paragraph 1 of biography...",
    "Paragraph 2 of biography..."
  ],
  "cvUrl": "data/Dennis CV Oct 2025.pdf"
}
```

### 4.3 `data/stats.json` — Analytics Data (Static/Mock)

```jsonc
{
  "summary": {
    "totalVisits": 5840,
    "totalDownloads": 1400,
    "avgReadTime": "...",      // ENCODING ISSUE: garbled Chinese characters
    "maxReadTime": "..."       // ENCODING ISSUE: garbled Chinese characters
  },
  "countries": [               // Top 10 countries by visits
    { "code": "US", "name": "...", "visits": 1250, "downloads": 320 }
  ],
  "dailyVisits": [             // 30 days of daily visit/download counts
    { "date": "2025-02-15", "visits": 53, "downloads": 12 }
  ],
  "articleStats": [            // Per-article visit/download stats (all articles)
    {
      "id": "1738572561394",
      "title": "...",
      "visits": 999,
      "downloads": 299,
      "conversionRate": "29.9%",
      "readTime": "10分59秒"   // Chinese-formatted read time
    }
  ]
}
```

**Key observations:**
- Analytics data appears to be **static/mock** — there is no analytics collection mechanism.
- Character encoding is broken in `summary` fields (double-encoded UTF-8 → Latin-1).
- `readTime` fields use Chinese characters (`分`, `秒`) inconsistently with the English UI.

### 4.4 `data/followers.json` — Subscriber List

```jsonc
// Simple array of email strings
[
  "user1@example.com",
  "user2@example.com"
]
```

### 4.5 Entity Relationship (Conceptual)

```
┌─────────────┐
│   Profile    │  (singleton)
│─────────────│
│ name         │
│ positions[]  │
│ biography[]  │
│ imageUrl     │
│ cvUrl        │
└─────────────┘

┌─────────────┐       ┌──────────────┐
│   Article    │───────│  PDF File    │
│─────────────│       │──────────────│
│ id (PK)      │       │ filename     │
│ title        │       │ stored in    │
│ authors      │       │ papers/      │
│ date         │       └──────────────┘
│ categories[] │
│ abstract     │       ┌──────────────┐
│ pdfUrl    ───┼───────│ External URL │
│ fileName     │       └──────────────┘
│ lastModified │
└─────────────┘

┌─────────────┐
│  Follower    │  (flat email list)
│─────────────│
│ email        │
└─────────────┘

┌─────────────┐
│   Stats      │  (static mock data)
│─────────────│
│ summary      │
│ countries[]  │
│ dailyVisits[]│
│ articleStats[]│
└─────────────┘
```

---

## 5. Core Data Flow & Implementation Logic

### 5.1 Article Read Flow (Public Page)

```
User visits index.html
        │
        ▼
DOMContentLoaded fires
        │
        ▼
main.js: displayArticles()
        │
        ▼
window.getArticlesFromStorage()
        │
        ├── localStorage cache hit? → Use cached data
        │
        └── Cache miss → fetch(GitHub Raw URL/data/articles.json)
                              │
                              ▼
                        Parse JSON response
                              │
                              ▼
                        Sort by date (newest first)
                              │
                              ▼
                        Render article cards via innerHTML template literals
                              │
                              ▼
                        Attach event listeners (modal, copy link, filter)
```

**Key detail:** The public page uses `localStorage` as a cache layer and fetches from the GitHub raw content URL (no authentication required for public repos).

### 5.2 Article Write Flow (Admin Page)

```
Admin enters GitHub PAT → stored in sessionStorage
        │
        ▼
Admin fills article form + selects PDF file
        │
        ▼
handleArticleSubmit(event)
        │
        ├── Step 1: Upload PDF
        │       File → FileReader → base64
        │       GET  papers/{filename} → check if exists (get SHA)
        │       PUT  papers/{filename} → upload base64 content
        │       Return raw GitHub URL for the PDF
        │
        ├── Step 2: Fetch current articles.json
        │       GET  data/articles.json → decode base64 → parse JSON
        │       Extract current SHA for conflict detection
        │
        ├── Step 3: Append new article object
        │       id = Date.now().toString()
        │       Attach pdfUrl from Step 1
        │
        └── Step 4: Save updated articles.json
                JSON.stringify → base64 encode
                PUT data/articles.json (with SHA for optimistic concurrency)
                        │
                        ├── Success → re-render article list
                        │
                        └── SHA mismatch → exponential backoff retry (max 3)
```

### 5.3 Bulk Upload Flow (Excel Import)

```
Admin selects .xlsx file
        │
        ▼
SheetJS (XLSX) parses file → JSON array
        │
        ▼
Preview table rendered in DOM
        │
        ▼
Admin clicks "Confirm Upload"
        │
        ▼
For each row:
  ├── Validate required fields (Title, Authors, Date, Abstract, PDF URL)
  ├── Parse categories (comma or semicolon delimited)
  ├── Parse date (handles: YYYY-MM-DD, MM/DD/YYYY, Excel serial numbers, etc.)
  └── Create article object with incremented ID
        │
        ▼
Merge with existing articles → PUT to data/articles.json
```

### 5.4 Authentication Flow

```
┌─────────────────────────────────────┐
│ admin.html loads                     │
│         │                            │
│         ▼                            │
│ Check sessionStorage for token       │
│         │                            │
│    ┌────┴────┐                       │
│    │ Found?  │                       │
│    └────┬────┘                       │
│   Yes   │   No                       │
│    │    │    │                        │
│    │    │    ▼                        │
│    │    │ Show token input form       │
│    │    │    │                        │
│    │    │    ▼                        │
│    │    │ Admin enters PAT            │
│    │    │    │                        │
│    ▼    │    ▼                        │
│ GET https://api.github.com/user      │
│ Authorization: Bearer {token}        │
│         │                            │
│    ┌────┴────┐                       │
│    │ 200 OK? │                       │
│    └────┬────┘                       │
│   Yes   │   No                       │
│    │    │    │                        │
│    │    │    ▼                        │
│    │    │ Clear token, show error     │
│    ▼    │                            │
│ Hide token input                     │
│ Show admin content                   │
│ Initialize article management        │
└─────────────────────────────────────┘
```

**Dual auth mechanism (inconsistency):**
- `data.js`: Uses `sessionStorage.getItem('github_token')` for GitHub API operations.
- `auth.js`: Uses `localStorage.getItem('isAuthenticated')` for a simpler page guard.
- These two systems are **not synchronized**.

### 5.5 Article Deletion Flow

```
Admin clicks delete on article
        │
        ▼
confirm() dialog
        │
        ▼
Fetch current articles.json
        │
        ▼
Find article by ID
        │
        ├── If article has fileName property:
        │       GET papers/{fileName} → get SHA
        │       DELETE papers/{fileName} (with SHA)
        │       (Failure here is non-blocking)
        │
        └── Filter out article from array
                │
                ▼
        PUT updated articles.json (with SHA)
                │
                ▼
        Re-render article list
```

---

## 6. Technical Debt & Improvement Recommendations

### 6.1 Critical Issues

| # | Issue | Impact | Location | Recommendation |
|---|---|---|---|---|
| **C1** | **Client-side GitHub PAT exposure** | Security: token is visible in browser DevTools, network tab, and `sessionStorage`. Any XSS vulnerability would leak full repo write access. | `js/config.js`, `js/data.js` | Migrate to a backend proxy or GitHub OAuth App with server-side token management. |
| **C2** | **No real analytics** | `data/stats.json` is static mock data with encoding corruption. No actual visitor tracking exists. | `data/stats.json` | Integrate Google Analytics, Plausible, or Umami for real metrics. |
| **C3** | **All 200+ articles rendered at once** | Performance: DOM renders 200+ article cards with no pagination or virtual scrolling. Page load degrades as content grows. | `js/main.js`, `js/data.js` | Implement pagination, infinite scroll, or virtual list. |
| **C4** | **No full-text search** | UX: users can only filter by category, not search by title/author/abstract. | `js/main.js` | Add client-side search (e.g., Fuse.js) or server-side search index. |

### 6.2 Architecture Debt

| # | Issue | Impact | Recommendation |
|---|---|---|---|
| **A1** | **Hybrid codebase: Vanilla JS + React coexist** | The `/client` React app and `/server` Mongoose models are unused in production. They add confusion and maintenance burden. | Remove unused `/client` and `/server` directories, or commit to one framework for v2.0. |
| **A2** | **GitHub repo as database** | GitHub API rate limits (60/hr unauthenticated, 5000/hr authenticated), no query capabilities, no indexes, no transactions. Every write requires a full file read-modify-write cycle. | Migrate to a proper database (Supabase, PlanetScale, Firebase) or headless CMS. |
| **A3** | **No backend server** | All business logic runs in the browser. No server-side rendering, no API abstraction, no middleware. | Introduce a lightweight backend (Next.js API routes, Express, or serverless functions). |
| **A4** | **No build pipeline** | No bundling, minification, tree-shaking, or code splitting. All JS is loaded as raw files. | Add Vite, Next.js, or similar build tooling for v2.0. |
| **A5** | **No CI/CD** | No automated testing, linting, or deployment gates. | Add GitHub Actions for lint, test, and deploy. |

### 6.3 Code Quality Issues

| # | Issue | Location | Detail |
|---|---|---|---|
| **Q1** | Duplicate function definitions | `js/admin.js` | `renderArticlesList` is defined **twice** (lines ~383 and ~721). `adminFunctions.deleteArticle` is also defined twice. |
| **Q2** | Stray data in source code | `js/admin.js:736` | A full article title string is embedded as a loose expression in the code between function definitions. |
| **Q3** | Inconsistent ID types | `js/data.js` vs `js/admin.js` | `data.js` generates IDs as `Date.now().toString()` (string), while `admin.js` uses `maxId + 1` (integer). This creates type mismatches during article lookup. |
| **Q4** | Inconsistent category delimiters | `js/data.js` vs `js/admin.js` | `data.js` uses semicolons (`;`) for category splitting. `admin.js` uses commas (`,`). Bulk uploads may produce inconsistent category arrays. |
| **Q5** | Dual authentication systems | `js/auth.js` vs `js/data.js` | `auth.js` uses `localStorage('isAuthenticated')`, while `data.js` uses `sessionStorage('github_token')`. These are not synchronized. |
| **Q6** | Excessive `window` globals | `js/admin.js` | Functions and state are attached to `window` for cross-file communication: `window.isSelectMode`, `window.selectedArticles`, `window.selectedCategories`, etc. |
| **Q7** | EmailJS placeholders | `js/data.js:352-363` | EmailJS integration uses `'YOUR_SERVICE_ID'`, `'YOUR_TEMPLATE_ID'`, `'YOUR_USER_ID'` — never configured. |
| **Q8** | Encoding corruption | `data/stats.json` | Chinese characters in `summary.avgReadTime`, `summary.maxReadTime`, and `countries[].name` are garbled (double-encoded UTF-8). |

### 6.4 UX/UI Improvements for v2.0

| # | Area | Current State | Recommendation |
|---|---|---|---|
| **U1** | Search | Category filter only | Full-text search across title, authors, abstract |
| **U2** | Pagination | All articles loaded at once | Paginated or infinite-scroll list |
| **U3** | Article Reading | External PDF link / Google Docs Viewer | Embedded PDF viewer or rich article page |
| **U4** | Dark Mode | Not available | System-preference-aware dark mode |
| **U5** | Mobile Experience | Basic responsive via Tailwind | Dedicated mobile navigation, touch gestures |
| **U6** | Loading States | No loading indicators | Skeleton screens, progress bars for uploads |
| **U7** | Error Handling | `alert()` dialogs | Toast notifications, inline validation |
| **U8** | Citation Export | Not available | BibTeX, APA, Chicago citation generation |
| **U9** | Related Articles | Not available | Content-based or category-based recommendations |
| **U10** | Author Pages | Authors as plain text | Structured author profiles with co-author linking |

### 6.5 Scalability Bottlenecks

| Bottleneck | Current Limit | v2.0 Risk |
|---|---|---|
| **JSON file size** | `articles.json` is a single file (~500KB+ and growing). Every CRUD op requires reading and rewriting the entire file. | Will degrade with scale. GitHub API has a 100MB file limit. |
| **GitHub API rate limits** | 5,000 requests/hour (authenticated). Each article add = 3-4 API calls. | Concurrent admin sessions or automation could hit limits. |
| **PDF storage** | 233 PDFs stored in repo. GitHub recommends repos under 1GB. | Adding more papers will approach the soft limit. Consider external storage (S3, R2). |
| **No caching strategy** | Public page fetches `articles.json` on every page load. | Implement CDN caching headers, service worker, or static site generation. |
| **Monolithic HTML** | `index.html` (2,173 lines) and `admin.html` (1,782 lines) contain inline templates. | Hard to maintain. Decompose into components. |

### 6.6 Recommended v2.0 Architecture Direction

```
┌─────────────────────────────────┐
│     Next.js / Astro / Nuxt      │  ← Framework with SSR/SSG
│     (React/Vue components)      │
│         │                       │
│    ┌────┴────┐                  │
│    │ Public  │  Admin Dashboard │
│    │  Pages  │  (Protected)     │
│    └────┬────┘──────┬───────────│
│         │           │           │
│    API Routes / Serverless Fns  │  ← Backend abstraction
│         │           │           │
└─────────┼───────────┼───────────┘
          │           │
          ▼           ▼
┌──────────────┐  ┌──────────────┐
│  Database    │  │  Object      │
│  (Supabase / │  │  Storage     │
│   PlanetScale│  │  (S3 / R2 /  │
│   / SQLite)  │  │   Supabase)  │
└──────────────┘  └──────────────┘
```

**Key migration priorities:**
1. Extract data from JSON files into a proper database.
2. Move PDF storage to object storage (Cloudflare R2 or S3).
3. Implement server-side authentication (OAuth or session-based).
4. Add a build pipeline with CI/CD.
5. Introduce component-based UI architecture.

---

*End of Document — System Architecture v1.0*
