import React, { useState, useRef, useCallback } from "react";
import {
  FileText,
  Upload,
  Download,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  Globe,
  FileArchive,
  Layers,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { validateHTML, convertToPDF, formatBytes } from "./utils/api";

const STEP = {
  UPLOAD: "upload",
  CONFIG: "config",
  CONVERTING: "converting",
  DONE: "done",
};

export default function App() {
  const [step, setStep] = useState(STEP.UPLOAD);
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [config, setConfig] = useState({ language: "auto", compress: true });
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState("convert");
  const fileRef = useRef();

  const handleFile = useCallback(async (f) => {
    if (!f || !f.name.match(/\.(html|htm)$/i)) {
      setError("Please upload an HTML or HTM file.");
      return;
    }
    setError(null);
    setFile(f);
    setStep(STEP.CONFIG);
    try {
      const info = await validateHTML(f);
      setValidation(info);
      if (info.language !== "auto")
        setConfig((c) => ({ ...c, language: info.language }));
    } catch {
      setValidation({ valid: true, sections: [], language: "unknown" });
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleConvert = async () => {
    setStep(STEP.CONVERTING);
    setProgress(0);
    setProgressLabel("Uploading file…");
    setError(null);
    try {
      const stages = [
        [20, "Uploading file…"],
        [45, "Rendering HTML…"],
        [65, "Applying layout & fonts…"],
        [80, "Generating PDF…"],
        [92, "Compressing output…"],
        [98, "Packaging files…"],
      ];
      let i = 0;
      const ticker = setInterval(() => {
        if (i < stages.length) {
          setProgress(stages[i][0]);
          setProgressLabel(stages[i][1]);
          i++;
        }
      }, 900);
      const data = await convertToPDF(file, config, (p) => setProgress(p));

      clearInterval(ticker);
      setProgress(100);
      setProgressLabel("Done!");
      setResult(data);
      setTimeout(() => setStep(STEP.DONE), 400);
    } catch (err) {
      setError(err.message || "Conversion failed. Please try again.");
      setStep(STEP.CONFIG);
    }
  };

  const reset = () => {
    setStep(STEP.UPLOAD);
    setFile(null);
    setValidation(null);
    setResult(null);
    setError(null);
    setProgress(0);
   setConfig({ language: "auto", compress: true });
  };

  return (
    <div style={s.shell}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <header style={s.header}>
        {/* <div style={s.headerInner}>
          <div style={s.logo}>
            <div style={s.logoIcon}><FileText size={16} color="#fff" /></div>
            <span style={s.logoText}>PDF<span style={{ color: "var(--accent)" }}>Converter</span></span>
          </div>
          <span style={s.tagline}>HTML → PDF · EN / AR · Digital Distribution</span>
        </div> */}

        <div style={s.headerInner}>
          <div style={s.logo}>
            <div style={s.logoIcon}>
              <FileText size={16} color="#fff" />
            </div>
            <span style={s.logoText}>
              PDF<span style={{ color: "var(--accent)" }}>Converter</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "convert", label: "HTML → PDF" },
              { key: "split", label: "Split PDF" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  // border: "none",
                  border: "1px solid grey",
                  transition: "all var(--transition)",
                  background: mode === key ? "var(--accent)" : "transparent",
                  color: mode === key ? "#fff" : "var(--text-2)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      {
        /* 
      <main style={s.main}>
        <StepIndicator current={step} />

        {error && (
          <div style={s.errorBanner}>
            <AlertCircle size={15} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              style={{
                background: "none",
                border: "none",
                color: "#dc2626",
                cursor: "pointer",
              }}
              onClick={() => setError(null)}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {step === STEP.UPLOAD && (
          <UploadZone
            dragging={dragging}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          />
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".html,.htm"
          style={{ display: "none" }}
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        />

        {step === STEP.CONFIG && file && (
          <ConfigPanel
            file={file}
            validation={validation}
            config={config}
            setConfig={setConfig}
            onConvert={handleConvert}
            onBack={reset}
          />
        )}

        {step === STEP.CONVERTING && (
          <ConvertingPanel progress={progress} label={progressLabel} />
        )}
        {step === STEP.DONE && result && (
          <ResultPanel result={result} onReset={reset} />
        )}
      </main> */

        <main style={s.main}>
          {mode === "convert" && (
            <>
              <StepIndicator current={step} />

              {error && (
                <div style={s.errorBanner}>
                  <AlertCircle size={15} />
                  <span style={{ flex: 1 }}>{error}</span>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                    }}
                    onClick={() => setError(null)}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {step === STEP.UPLOAD && (
                <UploadZone
                  dragging={dragging}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                />
              )}

              <input
                ref={fileRef}
                type="file"
                accept=".html,.htm"
                style={{ display: "none" }}
                onChange={(e) =>
                  e.target.files[0] && handleFile(e.target.files[0])
                }
              />

              {step === STEP.CONFIG && file && (
                <ConfigPanel
                  file={file}
                  validation={validation}
                  config={config}
                  setConfig={setConfig}
                  onConvert={handleConvert}
                  onBack={reset}
                />
              )}

              {step === STEP.CONVERTING && (
                <ConvertingPanel progress={progress} label={progressLabel} />
              )}
              {step === STEP.DONE && result && (
                <ResultPanel result={result} onReset={reset} />
              )}
            </>
          )}

          {mode === "split" && <PDFSplitPanel />}
        </main>
      }
    </div>
  );
}

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { key: "upload", label: "Upload" },
    { key: "config", label: "Configure" },
    { key: "converting", label: "Convert" },
    { key: "done", label: "Download" },
  ];
  const idx = steps.findIndex((st) => st.key === current);
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}
    >
      {steps.map((st, i) => (
        <React.Fragment key={st.key}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 600,
                background:
                  i < idx
                    ? "var(--success)"
                    : i === idx
                      ? "var(--accent)"
                      : "var(--surface-3)",
                color: i <= idx ? "#fff" : "var(--text-3)",
                border:
                  i === idx
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                boxShadow: i === idx ? "0 0 0 3px var(--accent-dim)" : "none",
              }}
            >
              {i < idx ? <CheckCircle size={12} /> : i + 1}
            </div>
            <span
              style={{
                fontSize: 13,
                color: i === idx ? "var(--text)" : "var(--text-3)",
                fontWeight: i === idx ? 600 : 400,
              }}
            >
              {st.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 1,
                background: "var(--border)",
                minWidth: 16,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ dragging, onDragOver, onDragLeave, onDrop, onClick }) {
  return (
    <div style={s.card}>
      <div
        style={{
          border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 12,
          padding: "52px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          transition: "all var(--transition)",
          userSelect: "none",
          background: dragging ? "var(--accent-dim)" : "transparent",
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: dragging ? "var(--accent-dim)" : "var(--surface-2)",
            display: "grid",
            placeItems: "center",
            marginBottom: 4,
            border: "1px solid var(--border)",
          }}
        >
          <Upload
            size={26}
            color={dragging ? "var(--accent)" : "var(--text-3)"}
          />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
          {dragging ? "Drop it here" : "Drop your HTML file here"}
        </p>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>
          or click to browse · .html / .htm · max 50 MB
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { icon: <Globe size={12} />, text: "English + Arabic" },
            { icon: <Layers size={12} />, text: "Page splitting" },
            { icon: <Zap size={12} />, text: "Compression" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                fontSize: 12,
                color: "var(--text-2)",
              }}
            >
              {icon}
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Config Panel ──────────────────────────────────────────────────────────────
function ConfigPanel({
  file,
  validation,
  config,
  setConfig,
  onConvert,
  onBack,
}) {
  const upd = (key, val) => setConfig((c) => ({ ...c, [key]: val }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* File info */}
      <div style={s.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--accent-dim)",
              border: "1px solid var(--border)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <FileText size={18} color="var(--accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              {formatBytes(file.size)}
              {validation && (
                <>
                  {" · "}
                  <span
                    style={{
                      color:
                        validation.language === "ar"
                          ? "var(--warning)"
                          : "var(--success)",
                      fontWeight: 500,
                    }}
                  >
                    {validation.language === "ar" ? "Arabic " : "English "}
                  </span>
                </>
              )}
            </p>
          </div>
          {validation && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 20,
                background: "var(--success-dim)",
                color: "var(--success)",
                fontSize: 12,
                fontWeight: 500,
                flexShrink: 0,
                border: "1px solid rgba(22,163,74,0.2)",
              }}
            >
              <CheckCircle size={12} /> Valid
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div style={s.card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <Settings size={15} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            Conversion Options
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Language */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={s.label}>Language / Direction</label>
            <div style={{ position: "relative" }}>
              <div style={{ maxWidth: 320, position: "relative" }}>
                <select
                  value={config.language}
                  onChange={(e) => upd("language", e.target.value)}
                  style={s.select}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="en">English (LTR)</option>
                  <option value="ar">Arabic (RTL)</option>
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "var(--text-3)",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button style={s.btnSecondary} onClick={onBack}>
                  <RotateCcw size={13} /> Start over
                </button>
                <button style={s.btnPrimary} onClick={onConvert}>
                  Convert to PDF <ArrowRight size={14} />
                </button>
              </div>
            </div>
            {config.language === "ar" && (
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                {" "}
                Arabic font stack will be applied automatically.
              </p>
            )}
          </div>

          {/* Orientation + Compression */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label style={s.label}>Compression</label>
              <button onClick={() => upd("compress", !config.compress)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: config.compress ? "var(--accent-dim)" : "var(--surface-2)",
                border: `1.5px solid ${config.compress ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 8, cursor: "pointer", transition: "all var(--transition)", height: 68,
              }}>
                <div style={{
                  width: 36, height: 20, borderRadius: 10, flexShrink: 0, position: "relative",
                  background: config.compress ? "var(--accent)" : "var(--surface-3)",
                  transition: "background var(--transition)", border: "1px solid var(--border)",
                }}>
                  <div style={{
                    position: "absolute", top: 2, width: 15, height: 15, borderRadius: "50%",
                    background: "#fff", transition: "left var(--transition)",
                    left: config.compress ? 18 : 2,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                    {config.compress ? "Enabled" : "Disabled"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                    {config.compress ? "Optimised for email" : "Maximum quality"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Converting Panel ──────────────────────────────────────────────────────────
function ConvertingPanel({ progress, label }) {
  return (
    <div style={{ ...s.card, textAlign: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          padding: "16px 0",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--accent-dim)",
            border: "1px solid var(--border)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Loader2
            size={30}
            color="var(--accent)"
            style={{ animation: "spin 1s linear infinite" }}
          />
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
            Converting…
          </p>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
            {label}
          </p>
        </div>
        <div
          style={{
            width: "100%",
            maxWidth: 340,
            height: 4,
            background: "var(--surface-3)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "var(--accent)",
              borderRadius: 2,
              width: `${progress}%`,
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            fontFamily: "monospace",
          }}
        >
          {progress}%
        </p>
      </div>
    </div>
  );
}

// ─── Result Panel ──────────────────────────────────────────────────────────────
function ResultPanel({ result, onReset }) {
  const [splitRanges, setSplitRanges] = useState([
    { name: "", from: "1", to: "end" },
  ]);
  const [splitResult, setSplitResult] = useState(null);
  const [splitting, setSplitting] = useState(false);
  const [splitError, setSplitError] = useState(null);
  const [totalPages, setTotalPages] = useState(result.totalPages || null);
  // const [activeTab, setActiveTab]     = useState("single");
  const [activeTab, setActiveTab] = useState("preview");
  const addRange = () =>
    setSplitRanges((r) => [...r, { name: "", from: "", to: "end" }]);
  const removeRange = (i) =>
    setSplitRanges((r) => r.filter((_, idx) => idx !== i));
  const updateRange = (i, key, val) =>
    setSplitRanges((r) =>
      r.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)),
    );

  const handleSplit = async () => {
    setSplitError(null);
    for (const r of splitRanges) {
      if (!r.name.trim()) return setSplitError("Each range must have a name.");
      if (!r.from) return setSplitError("Each range must have a start page.");
    }
    setSplitting(true);
    try {
      const res = await fetch("/api/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: result.jobId,
          ranges: splitRanges,
          language: result.language,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Split failed");
      const data = await res.json();
      setTotalPages(data.totalPages);
      setSplitResult(data);
    } catch (err) {
      setSplitError(err.message);
    } finally {
      setSplitting(false);
    }
  };

  return (
    <div style={{ minHeight: "900px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Success */}
        <div
          style={{
            ...s.card,
            background: "var(--success-dim)",
            border: "1px solid rgba(22,163,74,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid rgba(22,163,74,0.2)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <CheckCircle size={22} color="var(--success)" />
            </div>
            <div>
              <p
                style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}
              >
                Conversion complete
              </p>
              <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>
                {result.files.length} file{result.files.length !== 1 ? "s" : ""}{" "}
                generated · {result.language === "ar" ? "Arabic " : "English "}
                {totalPages && ` · ${totalPages} pages`}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            borderBottom: "1px solid var(--border)",
            paddingBottom: 0,
          }}
        >
          {[
            {
              key: "preview",
              icon: <FileText size={13} />,
              label: "Preview / Download",
            },
            // { key: "single", icon: <FileText size={13} />, label: "Single PDF" },
            {
              key: "split",
              icon: <Layers size={13} />,
              label: "Split by Page Range",
            },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${activeTab === key ? "var(--accent)" : "transparent"}`,
                marginBottom: "-1px",
                fontSize: 13,
                fontWeight: activeTab === key ? 600 : 400,
                color: activeTab === key ? "var(--accent)" : "var(--text-2)",
                cursor: "pointer",
                transition: "all var(--transition)",
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {activeTab === "preview" && (
          <div style={s.card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={15} color="var(--accent)" />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {result.files[0]?.name}
                </span>
              </div>
              <a
                href={result.files[0]?.downloadUrl}
                download={result.files[0]?.name}
                style={{
                  ...s.btnPrimary,
                  textDecoration: "none",
                  padding: "7px 14px",
                  fontSize: 12,
                }}
              >
                <Download size={13} /> Download
              </a>
            </div>
            <iframe
              src={result.files[0]?.downloadUrl.replace(
                "/api/download/",
                "/api/preview/",
              )}
              style={{
                width: "100%",
                height: "780px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "#fff",
              }}
              title="PDF Preview"
            />
          </div>
        )}
        {/* Single PDF */}

        {/* Split */}
        {activeTab === "split" && (
          <div style={s.card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Layers size={15} color="var(--accent)" />
              <span
                style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}
              >
                Define Page Ranges
              </span>
              {totalPages && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: "var(--text-3)",
                    background: "var(--surface-2)",
                    padding: "2px 10px",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                  }}
                >
                  {totalPages} pages total
                </span>
              )}
            </div>

            {splitError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  background: "rgba(220,38,38,0.06)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--error)",
                  marginBottom: 12,
                }}
              >
                <AlertCircle size={14} />
                <span>{splitError}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                {["Section Name", "From page", "To page / end", ""].map(
                  (h, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--text-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </span>
                  ),
                )}
              </div>
              {splitRanges.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr auto",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    placeholder="e.g. Cover"
                    value={r.name}
                    onChange={(e) => updateRange(i, "name", e.target.value)}
                    style={s.input}
                  />
                  <input
                    placeholder="1"
                    value={r.from}
                    onChange={(e) => updateRange(i, "from", e.target.value)}
                    style={s.input}
                    type="number"
                    min="1"
                  />
                  <input
                    placeholder="end"
                    value={r.to}
                    onChange={(e) => updateRange(i, "to", e.target.value)}
                    style={s.input}
                  />
                  {splitRanges.length > 1 ? (
                    <button
                      onClick={() => removeRange(i)}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: 7,
                        color: "var(--text-3)",
                        padding: "8px 9px",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button style={s.btnSecondary} onClick={addRange}>
                + Add Range
              </button>
              <button
                style={{ ...s.btnPrimary, opacity: splitting ? 0.7 : 1 }}
                onClick={handleSplit}
                disabled={splitting}
              >
                {splitting ? (
                  <>
                    <Loader2
                      size={13}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Splitting…
                  </>
                ) : (
                  <>
                    <Zap size={13} /> Generate Splits
                  </>
                )}
              </button>
            </div>

            {splitResult && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  <CheckCircle size={14} color="var(--success)" />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--success)",
                    }}
                  >
                    Split complete
                  </span>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {splitResult.files.map((f) => (
                    <a
                      key={f.name}
                      href={f.downloadUrl}
                      download={f.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 13px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: 9,
                        textDecoration: "none",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          background: "var(--accent-dim)",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={14} color="var(--accent)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.name}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--text-3)",
                            marginTop: 2,
                          }}
                        >
                          Pages {f.pages} · {formatBytes(f.size)}
                        </p>
                      </div>
                      <Download size={13} color="var(--text-3)" />
                    </a>
                  ))}
                </div>
                <a
                  href={splitResult.zipUrl}
                  download="splits.zip"
                  style={{
                    ...s.btnPrimary,
                    textDecoration: "none",
                    marginTop: 14,
                    justifyContent: "center",
                    display: "flex",
                  }}
                >
                  <FileArchive size={14} /> Download All Splits as ZIP
                </a>
              </div>
            )}
          </div>
        )}

        <button style={s.btnSecondary} onClick={onReset}>
          <RotateCcw size={13} /> Convert another file
        </button>
      </div>
    </div>
  );
}


function PDFSplitPanel() {
  const [pdfFile, setPdfFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [ranges, setRanges] = useState([{ name: "", from: "1", to: "end" }]);
  const [splitting, setSplitting] = useState(false);
  const [splitResult, setSplitResult] = useState(null);
  const [splitError, setSplitError] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const addRange = () =>
    setRanges((r) => [...r, { name: "", from: "", to: "end" }]);
  const removeRange = (i) => setRanges((r) => r.filter((_, idx) => idx !== i));
  const updateRange = (i, key, val) =>
    setRanges((r) =>
      r.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)),
    );

  const handleFile = async (f) => {
    if (!f || !f.name.match(/\.pdf$/i)) {
      setSplitError("Please upload a PDF file.");
      return;
    }
    setSplitError(null);
    setPdfFile(f);
    setUploading(true);
    setSplitResult(null);
    setJobId(null);

    // Upload PDF to backend
    try {
      const form = new FormData();
      form.append("pdf", f);
      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      const data = await res.json();
      setJobId(data.jobId);
      setTotalPages(data.totalPages);
    } catch (err) {
      setSplitError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSplit = async () => {
    setSplitError(null);
    for (const r of ranges) {
      if (!r.name.trim()) return setSplitError("Each range must have a name.");
      if (!r.from) return setSplitError("Each range must have a start page.");
    }
    setSplitting(true);
    try {
      const res = await fetch("/api/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, ranges, language: "en" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Split failed");
      const data = await res.json();
      setSplitResult(data);
      setTotalPages(data.totalPages);
    } catch (err) {
      setSplitError(err.message);
    } finally {
      setSplitting(false);
    }
  };

  const reset = () => {
    setPdfFile(null);
    setRanges([{ name: "", from: "1", to: "end" }]);
    setSplitResult(null);
    setSplitError(null);
    setTotalPages(null);
    setJobId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Upload */}
      {!pdfFile ? (
        <div style={s.card}>
          <div
            style={{
              border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 12,
              padding: "52px 32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              transition: "all var(--transition)",
              userSelect: "none",
              background: dragging ? "var(--accent-dim)" : "transparent",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: dragging ? "var(--accent-dim)" : "var(--surface-2)",
                display: "grid",
                placeItems: "center",
                marginBottom: 4,
                border: "1px solid var(--border)",
              }}
            >
              <Upload
                size={26}
                color={dragging ? "var(--accent)" : "var(--text-3)"}
              />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
              {dragging ? "Drop it here" : "Drop your PDF file here"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              or click to browse · .pdf · max 100 MB
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div style={s.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--accent-dim)",
                border: "1px solid var(--border)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <FileText size={18} color="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
              >
                {pdfFile.name}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                {formatBytes(pdfFile.size)}
                {uploading && " · Uploading…"}
                {totalPages && ` · ${totalPages} pages`}
              </p>
            </div>
            <button onClick={reset} style={s.btnSecondary}>
              <RotateCcw size={13} /> Change file
            </button>
          </div>
        </div>
      )}

      {splitError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.2)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--error)",
          }}
        >
          <AlertCircle size={14} />
          <span>{splitError}</span>
        </div>
      )}

      {/* Ranges */}
      {pdfFile && !uploading && jobId && (
        <div style={s.card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Layers size={15} color="var(--accent)" />
            <span
              style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}
            >
              Define Page Ranges
            </span>
            {totalPages && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: "var(--text-3)",
                  background: "var(--surface-2)",
                  padding: "2px 10px",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                }}
              >
                {totalPages} pages total
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: 8,
                marginBottom: 4,
              }}
            >
              {["Section Name", "From page", "To page / end", ""].map(
                (h, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </span>
                ),
              )}
            </div>
            {ranges.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  placeholder="e.g. Cover"
                  value={r.name}
                  onChange={(e) => updateRange(i, "name", e.target.value)}
                  style={s.input}
                />
                <input
                  placeholder="1"
                  value={r.from}
                  onChange={(e) => updateRange(i, "from", e.target.value)}
                  style={s.input}
                  type="number"
                  min="1"
                />
                <input
                  placeholder="end"
                  value={r.to}
                  onChange={(e) => updateRange(i, "to", e.target.value)}
                  style={s.input}
                />
                {ranges.length > 1 ? (
                  <button
                    onClick={() => removeRange(i)}
                    style={{
                      background: "none",
                      border: "1px solid var(--border)",
                      borderRadius: 7,
                      color: "var(--text-3)",
                      padding: "8px 9px",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button style={s.btnSecondary} onClick={addRange}>
              + Add Range
            </button>
            <button
              style={{ ...s.btnPrimary, opacity: splitting ? 0.7 : 1 }}
              onClick={handleSplit}
              disabled={splitting}
            >
              {splitting ? (
                <>
                  <Loader2
                    size={13}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
                  Splitting…
                </>
              ) : (
                <>
                  <Zap size={13} /> Generate Splits
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {splitResult && (
        <div style={s.card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14,
            }}
          >
            <CheckCircle size={14} color="var(--success)" />
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}
            >
              Split complete
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {splitResult.files.map((f) => (
              <a
                key={f.name}
                href={f.downloadUrl}
                download={f.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 13px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 7,
                    background: "var(--accent-dim)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={14} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.name}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-3)",
                      marginTop: 2,
                    }}
                  >
                    Pages {f.pages} · {formatBytes(f.size)}
                  </p>
                </div>
                <Download size={13} color="var(--text-3)" />
              </a>
            ))}
          </div>
          <a
            href={splitResult.zipUrl}
            download="splits.zip"
            style={{
              ...s.btnPrimary,
              textDecoration: "none",
              marginTop: 14,
              justifyContent: "center",
              display: "flex",
            }}
          >
            <FileArchive size={14} /> Download All Splits as ZIP
          </a>
        </div>
      )}
    </div>
  );
}
// ─── Styles ────────────────────────────────────────────────────────────────────
const s = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg)",
  },
  header: {
    borderBottom: "1px solid var(--border)",
    background: "var(--surface)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  headerInner: {
    maxWidth: "100%",
    margin: "0 auto",
    padding: "16px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 9 },
  logoText: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--text)",
    letterSpacing: "-0.5px",
  },
  tagline: {
    fontSize: 16,
    color: "var(--text-3)",
    fontFamily: "monospace",
    letterSpacing: "0.02em",
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "var(--accent)",
    display: "grid",
    placeItems: "center",
  },
  main: {
    flex: 1,
    maxWidth: 1080,
    width: "100%",
    margin: "0 auto",
    padding: "32px 40px 72px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-2)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  select: {
    width: "100%",
    padding: "10px 36px 10px 12px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text)",
    fontSize: 13,
    appearance: "none",
    cursor: "pointer",
  },
  input: {
    padding: "9px 11px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 7,
    color: "var(--text)",
    fontSize: 13,
    width: "100%",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "10px 20px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity var(--transition)",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "10px 16px",
    background: "transparent",
    color: "var(--text-2)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 14px",
    background: "rgba(220,38,38,0.06)",
    border: "1px solid rgba(220,38,38,0.2)",
    borderRadius: 8,
    fontSize: 13,
    color: "var(--error)",
  },
};

// {activeTab === "single" && (
//         <div style={s.card}>
//           <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
//             <Download size={15} color="var(--accent)" />
//             <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Download Files</span>
//           </div>

//            <div style={{ maxWidth: 480 }}>  {/* ← add this wrapper */}
//           <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//             {result.files.map((f) => (
//               <a key={f.name} href={f.downloadUrl} download={f.name} style={{
//                 display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
//                 background: "var(--surface-2)", border: "1px solid var(--border)",
//                 borderRadius: 9, textDecoration: "none", transition: "border-color var(--transition)",
//               }}>
//                 <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--accent-dim)", display: "grid", placeItems: "center", flexShrink: 0 }}>
//                   <FileText size={15} color="var(--accent)" />
//                 </div>
//                 <div style={{ flex: 1, minWidth: 0 }}>
//                   <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
//                   <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{formatBytes(f.size)}</p>
//                 </div>
//                 <Download size={14} color="var(--text-3)" />
//               </a>
//             ))}
//           </div>
//           {result.zipUrl && (
//             <a href={result.zipUrl} download="pdfs.zip" style={{ ...s.btnPrimary, textDecoration: "none", marginTop: 14, justifyContent: "center", display: "flex" }}>
//               <FileArchive size={14} /> Download as ZIP
//             </a>
//           )}
//         </div>
//        </div>

//       )}
