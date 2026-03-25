import React, { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

// ── Medicine Knowledge Base ────────────────────────────────────────────────────
const MEDICINE_DB = [
  "Paracetamol", "Amoxicillin", "Ibuprofen", "Cetirizine", "Omeprazole", "Azithromycin",
  "Metformin", "Atorvastatin", "Amlodipine", "Losartan", "Metronidazole", "Ciprofloxacin",
  "Doxycycline", "Pantoprazole", "Ranitidine", "Domperidone", "Ondansetron", "Montelukast",
  "Salbutamol", "Prednisolone", "Atenolol", "Metoprolol", "Ramipril", "Telmisartan",
  "Glimepiride", "Levothyroxine", "Alprazolam", "Sertraline", "Escitalopram", "Acyclovir",
  "Fluconazole", "Albendazole", "Ivermectin", "Diclofenac", "Tramadol", "Furosemide",
  "Ceftriaxone", "Amoxycillin", "Aspirin", "Vitamin", "Calcium", "Zinc", "Iron", "Folic",
  "Dolo", "Crocin", "Combiflam", "Augmentin", "Panadol", "Multivitamin", "Probiotics",
  "Nitrofurantoin", "Trimethoprim", "Naproxen", "Piroxicam", "Voveran", "Pantop", "Pan D",
];

const DOSAGE_RE = /(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|iu|g|%|tablet[s]?|cap[s]?|capsule[s]?))/i;
const FREQ_RE = /\b(OD|BD|TDS|QID|SOS|HS|once\s*daily|twice\s*daily|thrice\s*daily|at\s*night|after\s*food|before\s*food|with\s*food|1[-–]0[-–]1|1[-–]1[-–]1|0[-–]0[-–]1)\b/i;
const DURATION_RE = /(\d+\s*(?:day[s]?|week[s]?|month[s]?)(?:\s*only)?|till\s*complete|as\s*directed)/i;
const DOCTOR_RE = /\b(Dr\.?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/;
const PATIENT_RE = /(?:patient\s*(?:name)?|name|pt\.?)\s*[:=\-]\s*([A-Za-z\s]+)/i;
const DATE_RE = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;

const GEMINI_API_KEY = "AIzaSyABFlhVegUoUV8-uhlr7tV2m1ppb8Z4SYc";

async function refineWithGemini(rawText) {
  try {
    const prompt = `
      You are a medical prescription parser. Extract structured information from the following raw OCR text.
      Return ONLY a valid JSON object with these fields:
      doctor_name (string), patient_name (string), date (string), 
      medicines (array of {name: string, dosage: string, frequency: string, duration: string, instructions: string}), 
      notes (string).
      
      Raw Text:
      ${rawText}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini Error Response:", data);
      throw new Error(data.error?.message || "No candidates returned from Gemini");
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    console.log("Gemini Raw Response:", textResponse);

    // Clean JSON response (remove markdown code blocks if any)
    const jsonStr = textResponse.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini refinement failed:", error);
    return null;
  }
}

function parseText(text) {
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 2);
  const upper = text.toUpperCase();

  // Doctor
  let doctorName = "";
  for (const line of lines.slice(0, 8)) {
    const m = DOCTOR_RE.exec(line);
    if (m) { doctorName = m[1]; break; }
  }

  // Patient
  let patientName = "";
  for (const line of lines.slice(0, 15)) {
    const m = PATIENT_RE.exec(line);
    if (m) { patientName = m[1].trim().slice(0, 50); break; }
  }

  // Date
  let date = "";
  for (const line of lines.slice(0, 15)) {
    const m = DATE_RE.exec(line);
    if (m) { date = m[1]; break; }
  }

  // Medicines
  const medicines = [];
  const seen = new Set();

  for (const med of MEDICINE_DB) {
    if (upper.includes(med.toUpperCase())) {
      for (const line of lines) {
        if (line.toUpperCase().includes(med.toUpperCase()) && !seen.has(med)) {
          seen.add(med);
          medicines.push({
            name: med,
            dosage: (DOSAGE_RE.exec(line) || [])[1] || "",
            frequency: (FREQ_RE.exec(line) || [])[1] || "As directed",
            duration: (DURATION_RE.exec(line) || [])[1] || "",
            instructions: line.slice(0, 100),
          });
          break;
        }
      }
    }
  }

  // Notes
  let notes = "";
  for (const line of lines) {
    if (/\b(advice|note|instruction|follow.?up|review)\b/i.test(line)) {
      notes = line.slice(0, 200);
      break;
    }
  }

  return { doctor_name: doctorName, patient_name: patientName, date, medicines, notes };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function OCR() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const runOCR = useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    setRawText("");
    setProgress(0);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const worker = await createWorker("eng", 1, {
        logger: m => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
          setStatus(m.status);
        },
      });

      const { data } = await worker.recognize(file);
      await worker.terminate();

      setRawText(data.text);
      setStatus("Refining with AI...");
      setProgress(50);

      const refined = await refineWithGemini(data.text);

      let finalResult;
      if (refined) {
        finalResult = refined;
      } else {
        finalResult = parseText(data.text);
      }

      setResult({
        success: true,
        readable: finalResult.medicines.length > 0,
        extracted: finalResult,
        isRefined: !!refined
      });
    } catch (e) {
      setError("OCR failed: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
      setProgress(0);
      setStatus("");
    }
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) runOCR(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) runOCR(f);
    else setError("Please upload a JPG or PNG image.");
  };

  const handleOrder = () => {
    if (!result?.extracted?.medicines?.length) {
      setError("No medicines detected. Please upload a clearer prescription.");
      return;
    }
    navigate("/orders", { state: { prescription: result } });
  };

  // ── Styles ──
  const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <Header />

      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "3rem 2rem" }}>

        {/* Page header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Pharmacy — Intelligent Transcription
            </span>
          </div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}>
            Prescription OCR
          </h1>
          <p style={{ color: "#64748b", fontSize: "1rem", margin: 0, maxWidth: 620 }}>
            Upload a photo of your doctor's prescription. Tesseract reads the image entirely in your browser — no data leaves your device.
          </p>
        </div>

        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* ── Left: Upload ── */}
          <div style={{ flex: "1 1 400px" }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? "#059669" : "#cbd5e1"}`,
                background: dragActive ? "#ecfdf5" : "#fff",
                borderRadius: 16, padding: "3rem 2rem", textAlign: "center",
                transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}
            >
              <input type="file" accept="image/*" onChange={handleFileChange} id="rx-upload" style={{ display: "none" }} />
              <label htmlFor="rx-upload" style={{ cursor: "pointer", display: "block" }}>
                <div style={{ width: 64, height: 64, background: "#f1f5f9", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", color: "#64748b" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21" />
                    <path d="M16 16l-4-4-4 4" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.4rem" }}>Upload Prescription</h3>
                <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1.5rem" }}>Drag and drop, or click to browse</p>
                <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "0.35rem 1rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, color: "#475569", gap: "0.5rem" }}>
                  <span>JPG</span><span>·</span><span>PNG</span><span>·</span><span>WEBP</span>
                </div>
              </label>
            </div>

            {/* Progress */}
            {loading && (
              <div style={{ ...card, marginTop: "1.25rem", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>{status || "Initialising OCR engine…"}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#059669" }}>{progress}%</span>
                </div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#10b981,#059669)", borderRadius: 3, transition: "width 0.3s" }} />
                </div>
                <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.5rem", marginBottom: 0 }}>Processing in browser — no data sent to a server.</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                {error}
              </div>
            )}

            {/* Raw text accordion */}
            {rawText && !loading && (
              <details style={{ marginTop: "1.25rem" }}>
                <summary style={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#475569", padding: "0.75rem 1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                  View Raw OCR Text
                </summary>
                <pre style={{ fontSize: "0.78rem", color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "0.75rem 1rem", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                  {rawText.slice(0, 1500)}
                </pre>
              </details>
            )}
          </div>

          {/* ── Right: Preview + Results ── */}
          <div style={{ flex: "1 1 400px" }}>

            {/* Image preview */}
            {preview && (
              <div style={{ ...card, marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#0f172a", marginBottom: "0.75rem" }}>Source Image</h4>
                <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  <img src={preview} alt="Prescription" style={{ width: "100%", height: "auto", display: "block", maxHeight: 320, objectFit: "contain" }} />
                </div>
              </div>
            )}

            {/* Extracted results */}
            {result && !loading && (
              <div style={{ ...card, animation: "fadeIn 0.4s ease-out" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 40, height: 40, background: result.readable ? "#ecfdf5" : "#fef3c7", color: result.readable ? "#059669" : "#d97706", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {result.readable
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    }
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {result.readable ? (result.isRefined ? "AI Refined Extraction" : "Extraction Complete") : "Partial Read"}
                    </h3>
                    <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
                      {result.readable ? `${result.extracted.medicines.length} medicine(s) identified` : "No standard medicines detected — try a clearer image"}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  {[["Clinician", result.extracted.doctor_name || "—"], ["Patient", result.extracted.patient_name || "—"], ["Date", result.extracted.date || "—"], ["Notes", result.extracted.notes || "—"]].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{k}</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "#334155" }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Medicines table */}
                {result.extracted.medicines.length > 0 && (
                  <>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>Parsed Formulation</h4>
                    <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: "1.5rem" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            {["Medicine", "Dosage", "Frequency", "Duration", "Instructions"].map(h => (
                              <th key={h} style={{ padding: "0.7rem 0.9rem", textAlign: "left", color: "#475569", fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.extracted.medicines.map((m, i) => (
                            <tr key={i} style={{ borderBottom: i < result.extracted.medicines.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                              <td style={{ padding: "0.7rem 0.9rem", fontWeight: 600, color: "#0f172a" }}>{m.name}</td>
                              <td style={{ padding: "0.7rem 0.9rem", color: "#64748b" }}>{m.dosage || "—"}</td>
                              <td style={{ padding: "0.7rem 0.9rem", color: "#64748b" }}>{m.frequency || "—"}</td>
                              <td style={{ padding: "0.7rem 0.9rem", color: "#64748b" }}>{m.duration || "—"}</td>
                              <td style={{ padding: "0.7rem 0.9rem", color: "#64748b", fontSize: "0.75rem" }}>{m.instructions || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={handleOrder}
                      style={{ width: "100%", padding: "1rem", background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", border: "none", borderRadius: 10, fontSize: "0.95rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Transfer to Fulfillment Module →
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Empty state */}
            {!preview && !loading && (
              <div style={{ ...card, padding: "3rem 2rem", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                <div style={{ width: 56, height: 56, background: "#f1f5f9", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "#94a3b8" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>Awaiting Prescription</h3>
                <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>Upload an image on the left to begin extraction.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
