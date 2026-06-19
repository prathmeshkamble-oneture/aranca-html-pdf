const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { convertHTMLtoPDF, splitBySection } = require("./pdfService");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"] }));
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, "uploads");
const OUTPUTS_DIR = path.join(__dirname, "outputs");
[UPLOADS_DIR, OUTPUTS_DIR].forEach((d) => fs.mkdirSync(d, { recursive: true }));

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.match(/\.(html|htm)$/i)) {
      return cb(
        Object.assign(new Error("Only HTML files are allowed"), {
          status: 400,
        }),
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

const uploadPdf = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.match(/\.pdf$/i)) {
      return cb(
        Object.assign(new Error("Only PDF files are allowed"), { status: 400 }),
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 100 * 1024 * 1024 },
});

function safeUnlink(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch { }
}

function createZip(filePaths, zipPath) {
  return new Promise((resolve, reject) => {
    try {
      fs.mkdirSync(path.dirname(zipPath), { recursive: true });
      const JSZip = require("jszip");
      const zip = new JSZip();
      filePaths.forEach((fp) => {
        if (fs.existsSync(fp)) {
          zip.file(path.basename(fp), fs.readFileSync(fp));
        }
      });
      zip
        .generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
        .then((buf) => {
          fs.writeFileSync(zipPath, buf);
          resolve();
        })
        .catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

function detectLanguage(html) {
  const textOnly = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ");

  const ar = (textOnly.match(/[\u0600-\u06FF]/g) || []).length;
  const en = (textOnly.match(/[a-zA-Z]/g) || []).length;

  return ar > 50 || ar > en * 0.2 ? "ar" : "en";
}

function detectSections(html) {
  const sections = [];
  const re = /data-section=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) sections.push({ id: m[1], label: m[1] });
  if (sections.length === 0) {
    const re2 = /<(?:section|article|div)[^>]+id=["']([^"']+)["'][^>]*>/gi;
    while ((m = re2.exec(html)) !== null)
      sections.push({ id: m[1], label: m[1] });
  }
  return sections;
}

// ─── Routes ────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/validate", upload.single("html"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No HTML file provided" });
  try {
    const html = fs.readFileSync(req.file.path, "utf-8");
    const sections = detectSections(html);
    const language = detectLanguage(html);
    safeUnlink(req.file.path);
    res.json({ sections, language, valid: true });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/convert", upload.single("html"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No HTML file provided" });

  const jobId = uuidv4();
  const jobDir = path.join(OUTPUTS_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const htmlPath = req.file.path;

  try {
    const {
      outputType = "single",
      language = "auto",
      compress = "true",
    } = req.body;

    const html = fs.readFileSync(htmlPath, "utf-8");
    const detectedLang = language === "auto" ? "en" : language;
    const baseName = path.basename(
      req.file.originalname,
      path.extname(req.file.originalname),
    );
    // const isRTL        = detectedLang === "ar";
    const generatedFiles = [];

    if (outputType === "single" || outputType === "both") {
      const outPath = path.join(jobDir, `${baseName}.pdf`);
      await convertHTMLtoPDF(htmlPath, outPath, {
        compress: compress === "true",
      });
      generatedFiles.push({ name: `${baseName}.pdf`, path: outPath });
    }

    if (outputType === "sectioned" || outputType === "both") {
      const sections = detectSections(html);
      const files = await splitBySection(htmlPath, jobDir, sections, {
        language: detectedLang,
      });
      generatedFiles.push(...files);
    }

    const zipPath = path.join(jobDir, "pdfs.zip");
    await createZip(
      generatedFiles.map((f) => f.path),
      zipPath,
    );

    safeUnlink(htmlPath);
    const { PDFDocument } = require("pdf-lib");
    const mainPdf = generatedFiles[0]?.path;
    const totalPages = mainPdf
      ? (await PDFDocument.load(fs.readFileSync(mainPdf))).getPageCount()
      : null;

    res.json({
      success: true,
      jobId,
      totalPages,
      files: generatedFiles.map((f) => ({
        name: f.name,
        downloadUrl: `/api/download/${jobId}/${encodeURIComponent(f.name)}`,
        size: fs.statSync(f.path).size,
      })),
      zipUrl: `/api/download/${jobId}/pdfs.zip`,
      language: detectedLang,
    });
  } catch (err) {
    console.error("Conversion error:", err.message);
    fs.rmSync(jobDir, { recursive: true, force: true });
    safeUnlink(htmlPath);
    res.status(500).json({ error: err.message || "Conversion failed" });
  }
});

//- upload PDF for splitting
app.post("/api/upload-pdf", uploadPdf.single("pdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No PDF file provided" });
  try {
    const jobId = uuidv4();
    const jobDir = path.join(OUTPUTS_DIR, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    const baseName = path.basename(
      req.file.originalname,
      path.extname(req.file.originalname),
    );
    const destPath = path.join(jobDir, `${baseName}.pdf`);
    fs.renameSync(req.file.path, destPath);

    const { PDFDocument } = require("pdf-lib");
    const totalPages = (
      await PDFDocument.load(fs.readFileSync(destPath))
    ).getPageCount();

    res.json({ success: true, jobId, totalPages });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/split", async (req, res) => {
  const { jobId, ranges, language = "en" } = req.body;

  if (!jobId || !ranges || !Array.isArray(ranges) || ranges.length === 0) {
    return res.status(400).json({ error: "jobId and ranges are required" });
  }
  for (const r of ranges) {
    if (!r.name || !r.from) {
      return res
        .status(400)
        .json({ error: "Each range needs a name and from page" });
    }
  }

  const jobDir = path.join(OUTPUTS_DIR, jobId);
  // const fullPdf = path.join(jobDir, `document-${language}.pdf`);

  const pdfFiles = fs.readdirSync(jobDir).filter((f) => f.endsWith(".pdf"));
  if (pdfFiles.length === 0) {
    return res
      .status(404)
      .json({ error: "Source PDF not found. Please convert first." });
  }
  const fullPdf = path.join(jobDir, pdfFiles[0]);

  // if (!fs.existsSync(fullPdf)) {
  //   return res.status(404).json({ error: "Source PDF not found. Please convert first." });
  // }

  try {
    const { splitByPageRanges } = require("./pdfService");
    const splitDir = path.join(jobDir, "splits");
    fs.mkdirSync(splitDir, { recursive: true });

    const files = await splitByPageRanges(fullPdf, splitDir, ranges, language);

    const { PDFDocument } = require("pdf-lib");
    const totalPages = (
      await PDFDocument.load(fs.readFileSync(fullPdf))
    ).getPageCount();

    const zipPath = path.join(jobDir, "splits.zip");
    await createZip(
      files.map((f) => f.path),
      zipPath,
    );

    res.json({
      success: true,
      totalPages,
      files: files.map((f) => ({
        name: f.name,
        pages: f.pages,
        downloadUrl: `/api/download/${jobId}/splits/${encodeURIComponent(f.name)}`,
        size: fs.statSync(f.path).size,
      })),
      zipUrl: `/api/download/${jobId}/splits.zip`,
    });
  } catch (err) {
    console.error("Split error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/preview/:jobId/:filename", (req, res) => {
  const { jobId } = req.params;
  const filename = decodeURIComponent(req.params.filename);
  if (/\.\./.test(jobId) || /\.\./.test(filename))
    return res.status(400).json({ error: "Invalid path" });
  const filePath = path.join(OUTPUTS_DIR, jobId, filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "File not found" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  fs.createReadStream(filePath).pipe(res);
});
// ─── Download routes — specific before generic ─────────────────────────────────

app.get("/api/download/:jobId/splits.zip", (req, res) => {
  const { jobId } = req.params;
  if (/\.\./.test(jobId))
    return res.status(400).json({ error: "Invalid path" });
  const filePath = path.join(OUTPUTS_DIR, jobId, "splits.zip");
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "File not found" });
  res.download(filePath, "splits.zip");
});

app.get("/api/download/:jobId/splits/:filename", (req, res) => {
  const { jobId, filename } = req.params;
  if (/\.\./.test(jobId) || /\.\./.test(filename))
    return res.status(400).json({ error: "Invalid path" });
  const filePath = path.join(OUTPUTS_DIR, jobId, "splits", filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "File not found" });
  res.download(filePath, filename);
});

app.get("/api/download/:jobId/:filename", (req, res) => {
  const { jobId } = req.params;
  const filename = decodeURIComponent(req.params.filename);
  if (/\.\./.test(jobId) || /\.\./.test(filename))
    return res.status(400).json({ error: "Invalid path" });
  const filePath = path.join(OUTPUTS_DIR, jobId, filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "File not found" });
  res.download(filePath, filename);
});

// ─── Error handler ─────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

// ─── Cleanup old jobs ──────────────────────────────────────────────────────────

setInterval(
  () => {
    if (!fs.existsSync(OUTPUTS_DIR)) return;
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const dir of fs.readdirSync(OUTPUTS_DIR)) {
      const p = path.join(OUTPUTS_DIR, dir);
      try {
        if (fs.statSync(p).isDirectory() && fs.statSync(p).mtimeMs < cutoff) {
          fs.rmSync(p, { recursive: true, force: true });
        }
      } catch { }
    }
  },
  5 * 60 * 1000,
);

// ─── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () =>
  console.log(`✅  PDF server ready → http://localhost:${PORT}`),
);
