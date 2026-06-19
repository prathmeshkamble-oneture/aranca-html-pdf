# HTML → PDF Converter

Digital-distribution PDF generation from HTML, with English + Arabic (RTL) support, section splitting, and compression. Built with Vite + React (frontend) and Node.js + Express + Puppeteer (backend).

---

## Project Structure

```
html-to-pdf/
├── backend/
│   ├── server.js          ← Express API server
│   ├── pdfService.js      ← Puppeteer conversion logic
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx        ← Main UI
│   │   ├── utils/api.js   ← API client
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── HTML_TEMPLATE_GUIDE.html   ← How to mark sections in your HTML
```

---

## Quick Start

### 1. Install & run the backend

```bash
cd backend
npm install
cp .env.example .env
node server.js
# → Running on http://localhost:3001
```

### 2. Install & run the frontend

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## How It Works

### Conversion Pipeline

1. **Upload** — Client uploads `.html` file via the UI
2. **Validate** — Backend scans for `data-section` attributes and detects language (EN/AR)
3. **Render** — Puppeteer (headless Chrome) loads the HTML, including all assets
4. **RTL Injection** — If Arabic is detected (or selected), RTL direction + Arabic fonts are injected
5. **Generate** — PDF is created at A4 size, optimised for digital (no print margins)
6. **Section Split** — For each `data-section`, CSS hides all other sections and generates a separate PDF
7. **Compress** — Puppeteer's built-in Chromium compression is applied
8. **Package** — All PDFs are zipped for download

### Output Options

| Mode | Output |
|------|--------|
| **Single PDF** | One PDF covering the full HTML document |
| **Section PDFs** | One PDF per `data-section` (for social media) |
| **Both** | Single + all sections (recommended) |

---

## Marking Sections in Your HTML

Add `data-section="unique-id"` to any top-level block element:

```html
<section data-section="cover">
  <!-- Cover / hero image -->
</section>

<section data-section="main-story">
  <!-- Lead article -->
</section>

<section data-section="feature">
  <!-- Feature article -->
</section>
```

**Rules for section IDs:**
- Must be unique within the document
- Letters, numbers, hyphens only (e.g. `main-story`, `section-1`)
- Used as the output filename: `section-main-story-en.pdf`

---

## Arabic / RTL Support

Two approaches:

### Option A — Separate AR file (recommended)
Provide two HTML files: one EN, one AR. Upload each separately and select "Arabic (RTL)" for the Arabic file.

### Option B — Auto-detect
The backend counts Arabic Unicode characters vs Latin characters. If Arabic is dominant, RTL mode is applied automatically.

**What RTL mode does:**
- Sets `direction: rtl` on `html` and `body`
- Injects Arabic font stack: Cairo → Noto Sans Arabic → Arial → Tahoma
- All other layout is preserved from your CSS

---

## HTML Requirements for Best Results

| Requirement | Why |
|-------------|-----|
| Self-contained HTML (inline CSS or `<style>` tags) | Puppeteer loads via `file://`; external stylesheets on CDNs may be blocked |
| Compressed images (use TinyJPG) | Reduces output PDF size |
| `data-section` attributes | Enables section splitting |
| No heavy JS frameworks (or pre-rendered) | Puppeteer waits for `networkidle0`, but complex SPAs may not render fully |
| Fixed-width layout (e.g. `max-width: 800px`) | Consistent PDF output |

---

## API Reference

### `POST /api/validate`
Validates HTML and detects sections/language.
- **Body**: `multipart/form-data` with `html` file
- **Response**: `{ valid, sections: [{id, label}], language: "en"|"ar" }`

### `POST /api/convert`
Converts HTML to PDF(s).
- **Body**: `multipart/form-data`
  - `html` — the HTML file
  - `outputType` — `"single"` | `"sectioned"` | `"both"`
  - `compress` — `"true"` | `"false"`
  - `language` — `"auto"` | `"en"` | `"ar"`
- **Response**: `{ success, jobId, files: [{name, downloadUrl, size}], zipUrl, language }`

### `GET /api/download/:jobId/:filename`
Downloads a generated file. Jobs are cleaned up after 1 hour.

---

## Deployment Notes

- **Backend** can be deployed to any Node.js host (Railway, Render, EC2, etc.)
- Puppeteer requires Chrome/Chromium; most Node.js hosts support it
- For production, set `PUPPETEER_EXECUTABLE_PATH` to your system Chrome if needed
- **Frontend** can be deployed to Vercel, Netlify, etc. — update the proxy in `vite.config.js` to point to your deployed backend URL
- Increase server memory if processing large HTML files with many images

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Arabic text renders as boxes | Ensure the server has Arabic fonts installed; or embed Google Fonts in your HTML |
| PDF is missing images | Use absolute URLs or base64-encode images in your HTML |
| Section split produces blank pages | Verify `data-section` IDs match exactly and elements are block-level |
| File too large | Compress images with TinyJPG before including in HTML |
| Puppeteer install fails | Run `npx puppeteer browsers install chrome` after `npm install` |
