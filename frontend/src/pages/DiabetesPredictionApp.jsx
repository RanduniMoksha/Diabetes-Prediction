import React, { useState } from "react";
import axios from "axios";

// ---------------------------------------------------------------------------
// Diabetes Prediction System — single page UI
//
// Palette (blue + green health theme):
//   #1E1B2E  ink (near-black, text/headers)
//   #2D2A45  deep-slate (dark panel background)
//   #6B7280  steel (secondary text, borders)
//   #2563EB  blue (primary accent — trust / clinical)
//   #1D4ED8  deep-blue (gradient partner / hover)
//   #16A34A  green (low-risk accent / success)
//   #DC2626  red (risk accent / warning)
//   #EFF6FF  paper (page background, faint blue tint)
//
// Type: system font stack only — no network font loading, no <style> tag,
// so nothing can fail to load and nothing blocks first paint.
// ---------------------------------------------------------------------------

const API_BASE_URL = "http://localhost:8000"; // <-- point this at your FastAPI backend

const FIELDS = [
  { key: "pregnancies", label: "Pregnancies", unit: "count", min: 0, max: 20, step: 1, icon: "👶", help: "e.g. 2" },
  { key: "glucose", label: "Glucose", unit: "mg/dL", min: 0, max: 300, step: 1, icon: "🩸", help: "e.g. 120" },
  { key: "blood_pressure", label: "Blood Pressure", unit: "mm Hg", min: 0, max: 200, step: 1, icon: "💓", help: "e.g. 70" },
  { key: "skin_thickness", label: "Skin Thickness", unit: "mm", min: 0, max: 100, step: 1, icon: "📏", help: "e.g. 20" },
  { key: "insulin", label: "Insulin", unit: "mu U/mL", min: 0, max: 900, step: 1, icon: "💉", help: "e.g. 100" },
  { key: "bmi", label: "BMI", unit: "kg/m²", min: 0, max: 70, step: 0.1, icon: "⚖️", help: "e.g. 30" },
  { key: "diabetes_function", label: "Diabetes Pedigree", unit: "score", min: 0, max: 3, step: 0.01, icon: "🧬", help: "e.g. 0.5" },
  { key: "age", label: "Age", unit: "years", min: 1, max: 120, step: 1, icon: "🎂", help: "e.g. 40" },
];

const DEFAULT_FORM = FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});

export default function DiabetesPredictionApp() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null); // { result, confidence }
  const [errorMessage, setErrorMessage] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    FIELDS.forEach((f) => {
      const raw = form[f.key];
      if (raw === "" || raw === null || raw === undefined) {
        next[f.key] = "Required";
        return;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) {
        next[f.key] = "Must be a number";
      } else if (num < f.min || num > f.max) {
        next[f.key] = `Range ${f.min}–${f.max}`;
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setErrorMessage("");

    const payload = FIELDS.reduce(
      (acc, f) => ({ ...acc, [f.key]: Number(form[f.key]) }),
      {}
    );

    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, payload);
      setResult(response.data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err?.response?.data?.detail ||
          "Could not reach the prediction service. Check that the backend is running."
      );
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setErrors({});
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
  };

  const isRisk = result?.result?.toLowerCase().includes("no") === false;
  const confidenceValue = result ? Math.min(Number(result.confidence), 100) : 0;
  const ringCircumference = 2 * Math.PI * 54;
  const ringOffset = ringCircumference - (confidenceValue / 100) * ringCircumference;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <div style={styles.brandMark}>+</div>
            <div>
              <div style={styles.brandText}>Diabetes Risk Assessment</div>
              <div style={styles.headerSub}>PathLanka Health Tools</div>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* ---------------- Form panel ---------------- */}
        <section style={styles.formPanel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h1 style={styles.title}>Patient details</h1>
              <p style={styles.subtitle}>Enter all eight measurements to generate a risk estimate.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.grid}>
              {FIELDS.map((f) => (
                <div key={f.key} style={styles.fieldWrap}>
                  <label style={styles.label} htmlFor={f.key}>
                    <span style={styles.iconBadge}>{f.icon}</span>
                    <span>
                      {f.label}
                      <span style={styles.unit}> · {f.unit}</span>
                    </span>
                  </label>
                  <input
                    id={f.key}
                    type="number"
                    inputMode="decimal"
                    step={f.step}
                    placeholder={f.help}
                    value={form[f.key]}
                    onFocus={() => setFocusedField(f.key)}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    style={{
                      ...styles.input,
                      borderColor: errors[f.key]
                        ? "#DC2626"
                        : focusedField === f.key
                        ? "#2563EB"
                        : "#DBEAFE",
                      boxShadow:
                        focusedField === f.key && !errors[f.key]
                          ? "0 0 0 3px rgba(37,99,235,0.12)"
                          : "none",
                    }}
                  />
                  {errors[f.key] && <span style={styles.errorText}>{errors[f.key]}</span>}
                </div>
              ))}
            </div>

            <div style={styles.actions}>
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  ...styles.submitBtn,
                  opacity: status === "loading" ? 0.75 : 1,
                  cursor: status === "loading" ? "default" : "pointer",
                }}
              >
                {status === "loading" ? "Analyzing…" : "Run prediction"}
              </button>
              <button type="button" onClick={handleReset} style={styles.resetBtn}>
                Clear form
              </button>
            </div>
          </form>
        </section>

        {/* ---------------- Result panel ---------------- */}
        <aside style={styles.resultPanel}>
          <div style={styles.resultPanelGlow} />
          <h2 style={styles.resultHeading}>Result</h2>

          {status === "idle" && (
            <div style={styles.placeholder}>
              <div style={styles.placeholderRing}>
                <span style={styles.placeholderGlyph}>?</span>
              </div>
              <p style={styles.placeholderText}>
                Fill in the form and run a prediction to see the result here.
              </p>
            </div>
          )}

          {status === "loading" && (
            <div style={styles.placeholder}>
              <svg width="36" height="36" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#4C4768"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="22 66"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 18 18"
                    to="360 18 18"
                    dur="0.9s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
              <p style={styles.placeholderText}>Sending data to the model…</p>
            </div>
          )}

          {status === "error" && (
            <div style={styles.placeholder}>
              <div style={{ ...styles.placeholderRing, borderColor: "#DC2626" }}>
                <span style={{ ...styles.placeholderGlyph, color: "#DC2626" }}>!</span>
              </div>
              <p style={{ ...styles.placeholderText, color: "#FCA5A5" }}>{errorMessage}</p>
            </div>
          )}

          {status === "success" && result && (
            <div style={styles.resultBody}>
              <div style={styles.ringWrap}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="none"
                    stroke={isRisk ? "#DC2626" : "#16A34A"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    transform="rotate(-90 70 70)"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                  <text
                    x="70"
                    y="65"
                    textAnchor="middle"
                    fontSize="26"
                    fontWeight="700"
                    fill="#FFFFFF"
                  >
                    {Number(result.confidence).toFixed(0)}%
                  </text>
                  <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#93C5FD">
                    CONFIDENCE
                  </text>
                </svg>
              </div>

              <div
                style={{
                  ...styles.resultBadge,
                  background: isRisk ? "rgba(220,38,38,0.15)" : "rgba(22,163,74,0.15)",
                  color: isRisk ? "#FCA5A5" : "#86EFAC",
                  borderColor: isRisk ? "#DC2626" : "#16A34A",
                }}
              >
                {isRisk ? "⚠️" : "✓"} {result.result}
              </div>

              <p style={styles.disclaimer}>
                This estimate is generated by a statistical model and does not
                replace professional medical advice. Consult a clinician for
                diagnosis or treatment.
              </p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const FONT_STACK =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #EFF6FF 0%, #FAFAFA 100%)",
    fontFamily: FONT_STACK,
    color: "#1E1B2E",
  },
  header: {
    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
  },
  headerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "22px 28px",
  },
  brand: { display: "flex", alignItems: "center", gap: 14 },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "rgba(255,255,255,0.18)",
    color: "#FFFFFF",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 20,
    flexShrink: 0,
  },
  brandText: {
    fontWeight: 700,
    fontSize: 19,
    color: "#FFFFFF",
    letterSpacing: "-0.01em",
  },
  headerSub: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  main: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "36px 28px 80px",
    display: "grid",
    gridTemplateColumns: "1.55fr 1fr",
    gap: 28,
    alignItems: "start",
  },
  formPanel: {
    background: "#FFFFFF",
    borderRadius: 20,
    padding: "30px 30px 26px",
    border: "1px solid #DBEAFE",
    boxShadow: "0 4px 24px rgba(37,99,235,0.06)",
  },
  panelHeaderRow: {
    marginBottom: 22,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    color: "#1E1B2E",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6B7280",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 18px",
  },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 7 },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#2D2A45",
  },
  iconBadge: {
    width: 24,
    height: 24,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    borderRadius: 7,
    background: "#EFF6FF",
    flexShrink: 0,
  },
  unit: {
    fontWeight: 400,
    color: "#9CA3AF",
    fontSize: 12,
  },
  input: {
    padding: "11px 13px",
    borderRadius: 10,
    border: "1.5px solid #DBEAFE",
    fontSize: 15,
    color: "#1E1B2E",
    background: "#FAFAFC",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    fontFamily: FONT_STACK,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: 500,
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 26,
  },
  submitBtn: {
    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    padding: "13px 26px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: FONT_STACK,
    boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
  },
  resetBtn: {
    background: "#FFFFFF",
    color: "#6B7280",
    border: "1.5px solid #DBEAFE",
    borderRadius: 12,
    padding: "13px 20px",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: FONT_STACK,
  },
  resultPanel: {
    background: "linear-gradient(160deg, #2D2A45 0%, #1E1B2E 100%)",
    color: "#FFFFFF",
    borderRadius: 20,
    padding: "28px 26px",
    minHeight: 440,
    position: "sticky",
    top: 24,
    overflow: "hidden",
  },
  resultPanelGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  resultHeading: {
    fontSize: 16,
    fontWeight: 700,
    margin: "0 0 24px",
    color: "#93C5FD",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    position: "relative",
  },
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    minHeight: 300,
    gap: 16,
    position: "relative",
  },
  placeholderRing: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    border: "2px dashed #4C4768",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderGlyph: {
    fontSize: 26,
    fontWeight: 700,
    color: "#2563EB",
  },
  placeholderText: {
    color: "#A5A0C0",
    fontSize: 14,
    maxWidth: 220,
    lineHeight: 1.55,
  },
  resultBody: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 22,
    position: "relative",
  },
  ringWrap: { display: "flex", justifyContent: "center" },
  resultBadge: {
    fontSize: 16,
    fontWeight: 700,
    padding: "12px 18px",
    borderRadius: 12,
    border: "1.5px solid",
    textAlign: "center",
    width: "100%",
  },
  disclaimer: {
    fontSize: 12.5,
    color: "#8B86A8",
    lineHeight: 1.6,
    borderTop: "1px solid #3D3960",
    paddingTop: 16,
    margin: 0,
    textAlign: "left",
  },
};