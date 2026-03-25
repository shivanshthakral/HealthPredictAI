import { useState } from 'react';
import Header from '../components/Header';

const API = 'http://127.0.0.1:5001';

const DIET_PREFS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non_vegetarian', label: 'Omnivore' },
  { value: 'vegan', label: 'Plant-Based' },
];

const GOALS = [
  { value: 'weight_loss', label: 'Cut Weight' },
  { value: 'weight_gain', label: 'Mass Gain' },
  { value: 'balanced', label: 'Equilibrium' },
  { value: 'muscle_gain', label: 'Hypertrophy' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function HealthScore() {
  const [form, setForm] = useState({
    age: '', weight_kg: '', height_cm: '', gender: 'male',
    exercise_days_per_week: 3, sleep_hours: 7,
    is_smoker: false, alcohol_units_per_week: 0,
    diet_quality: 'moderate', diet_preference: 'vegetarian',
    stress_level: 'moderate', activity_level: 'moderate',
    goal: 'balanced', conditions: []
  });

  const [scoreResult, setScoreResult] = useState(null);
  const [dietResult, setDietResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState('Monday');
  const [conditionInput, setConditionInput] = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const analyzeHealth = async () => {
    if (!form.age || !form.weight_kg || !form.height_cm) {
      setError('Required biological metrics missing: Age, Weight, Height.');
      return;
    }
    setLoading(true); setError('');

    try {
      const payload = { ...form, age: +form.age, weight_kg: +form.weight_kg, height_cm: +form.height_cm };
      const [scoreRes, dietRes] = await Promise.all([
        fetch(`${API}/health-score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        fetch(`${API}/diet-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      ]);
      const [score, diet] = await Promise.all([scoreRes.json(), dietRes.json()]);
      if (score.error) throw new Error(score.error);
      setScoreResult(score);
      setDietResult(diet);
    } catch (e) {
      setError(e.message || 'Analysis engine failure.');
    }
    setLoading(false);
  };

  const addCondition = () => {
    if (conditionInput.trim() && !form.conditions.includes(conditionInput.trim())) {
      set('conditions', [...form.conditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const scoreColor = (s) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444';

  const InputField = ({ label, value, setter, type="text", placeholder="" }) => (
    <div>
      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>{label}</label>
      <input 
        type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontSize: "0.95rem" }}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>
      <Header title="Health Metrics & Nutrition" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 2rem" }}>
        
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            Health Score & Diet Plan
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.05rem", margin: 0, maxWidth: 650 }}>
            Enter your physical details to generate a health score and a personalized 7-day diet regimen.
          </p>
        </div>

        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          
          {/* Left Column: Input Form */}
          <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "2rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>Your Details</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
                <InputField label="Target Age (Yrs) *" type="number" value={form.age} setter={v => set('age', v)} placeholder="e.g 28" />
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>Biological Sex</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} style={{ width: "100%", padding: "0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontSize: "0.95rem" }}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <InputField label="Weight (KG) *" type="number" value={form.weight_kg} setter={v => set('weight_kg', v)} placeholder="" />
                <InputField label="Height (CM) *" type="number" value={form.height_cm} setter={v => set('height_cm', v)} placeholder="" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Activity Output / Week</label>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{form.exercise_days_per_week} Days</span>
                  </div>
                  <input type="range" min="0" max="7" value={form.exercise_days_per_week} onChange={e => set('exercise_days_per_week', +e.target.value)} style={{ width: "100%", accentColor: "#0f172a" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>REM/Sleep Cycle Length</label>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{form.sleep_hours} Hours</span>
                  </div>
                  <input type="range" min="4" max="12" value={form.sleep_hours} onChange={e => set('sleep_hours', +e.target.value)} style={{ width: "100%", accentColor: "#0f172a" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>Base Diet Quality</label>
                  <select value={form.diet_quality} onChange={e => set('diet_quality', e.target.value)} style={{ width: "100%", padding: "0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontSize: "0.95rem" }}>
                    {['poor', 'moderate', 'good', 'excellent'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>Endocrine Stress</label>
                  <select value={form.stress_level} onChange={e => set('stress_level', e.target.value)} style={{ width: "100%", padding: "0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontSize: "0.95rem" }}>
                    {['low', 'moderate', 'high'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.75rem" }}>Diet Preference</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {DIET_PREFS.map(d => (
                    <button key={d.value} onClick={() => set('diet_preference', d.value)}
                      style={{ padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", border: form.diet_preference === d.value ? "1px solid #0f172a" : "1px solid #e2e8f0", background: form.diet_preference === d.value ? "#0f172a" : "#f8fafc", color: form.diet_preference === d.value ? "white" : "#475569" }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.75rem" }}>Your Goal</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {GOALS.map(g => (
                    <button key={g.value} onClick={() => set('goal', g.value)}
                      style={{ padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", border: form.goal === g.value ? "1px solid #1e293b" : "1px solid #e2e8f0", background: form.goal === g.value ? "#1e293b" : "#f8fafc", color: form.goal === g.value ? "white" : "#475569" }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", padding: "1rem", background: form.is_smoker ? "#fee2e2" : "#f8fafc", border: `1px solid ${form.is_smoker ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 8 }}>
                  <input type="checkbox" checked={form.is_smoker} onChange={e => set('is_smoker', e.target.checked)} style={{ width: 18, height: 18, accentColor: "#dc2626" }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: form.is_smoker ? "#b91c1c" : "#475569" }}>I am a smoker</span>
                </label>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.75rem" }}>Known Health Conditions</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input type="text" value={conditionInput} onChange={e => setConditionInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCondition()} placeholder="e.g. Hypertension" style={{ flex: 1, padding: "0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontSize: "0.95rem" }} />
                  <button onClick={addCondition} style={{ padding: "0 1.25rem", background: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Add</button>
                </div>
                {form.conditions.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.75rem" }}>
                    {form.conditions.map(c => (
                      <div key={c} style={{ padding: "0.3rem 0.6rem", background: "#0f172a", color: "white", borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {c} <button onClick={() => set('conditions', form.conditions.filter(x => x !== c))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <div style={{ padding: "1rem", background: "#fef2f2", borderLeft: "4px solid #ef4444", color: "#b91c1c", borderRadius: 8, fontSize: "0.9rem", fontWeight: 500, marginBottom: "1.5rem" }}>{error}</div>}

              <button 
                onClick={analyzeHealth} disabled={loading}
                style={{ width: "100%", padding: "1.1rem", background: loading ? "#94a3b8" : "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", border: "none", borderRadius: 12, fontSize: "1.05rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem" }}
              >
                {loading ? <><div className="spin-loader" /> Generating Analytics...</> : 'Analyze My Health'}
              </button>
            </div>
          </div>

          {/* Right Column: Output Dashboards */}
          <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
             {!scoreResult && !loading && (
              <div style={{ background: "white", border: "1px dashed #cbd5e1", borderRadius: 16, padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
                <div style={{ width: 64, height: 64, background: "#f1f5f9", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", marginBottom: "1.5rem" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>Waiting for Details</h3>
                <p style={{ color: "#64748b", fontSize: "0.95rem", maxWidth: 300, margin: 0 }}>Input your physical details to calculate your specific health baseline and nutritional targets.</p>
              </div>
            )}

            {loading && (
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                <div className="spin-loader" style={{ width: 40, height: 40, borderWidth: 3, marginBottom: "1.5rem", borderColor: "#f1f5f9", borderTopColor: "#0f172a" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>Interpreting Data</h3>
                <p style={{ color: "#64748b", fontSize: "0.95rem", maxWidth: 300, margin: 0 }}>Calculating physiological thresholds and composing macronutrient algorithms...</p>
              </div>
            )}

            {scoreResult && (
              <div style={{ animation: "fadeIn 0.4s ease-out", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Score Widget */}
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "2rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", textAlign: "center" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", marginBottom: "2rem" }}>Composite Score</h3>
                  
                  <div style={{
                    width: 180, height: 180, borderRadius: "50%", margin: "0 auto 1.5rem",
                    background: `conic-gradient(${scoreColor(scoreResult.health_score)} ${scoreResult.health_score * 3.6}deg, #f1f5f9 0deg)`,
                    display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
                  }}>
                    <div style={{
                      width: 140, height: 140, borderRadius: "50%", background: "white",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                    }}>
                      <span style={{ fontSize: "3rem", fontWeight: 800, color: scoreColor(scoreResult.health_score), lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>
                        {scoreResult.health_score}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, letterSpacing: "0.05em" }}>/ 100</span>
                    </div>
                  </div>
                  
                  <span style={{ display: "inline-block", background: `${scoreColor(scoreResult.health_score)}15`, color: scoreColor(scoreResult.health_score), padding: "0.4rem 1.25rem", borderRadius: 20, fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {scoreResult.risk_level}
                  </span>

                  {scoreResult.bmi && (
                    <div style={{ marginTop: "2rem", padding: "1.25rem", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Body Mass Index</div>
                        <div style={{ fontSize: "1.1rem", color: "#0f172a", fontWeight: 700 }}>{scoreResult.bmi.category}</div>
                      </div>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: scoreResult.bmi.color || "#0f172a", fontFamily: "'Outfit', sans-serif" }}>
                        {scoreResult.bmi.bmi}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subsystem Breakdown */}
                {scoreResult.breakdown && (
                  <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", marginBottom: "1.25rem" }}>System Breakdown</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {Object.entries(scoreResult.breakdown).map(([key, val]) => {
                        const isGood = val === 'Good' || val === 'Excellent';
                        const isWarn = val === 'Needs improvement' || val === 'Needs attention';
                        const bColor = isGood ? '#10b981' : isWarn ? '#f59e0b' : '#3b82f6';
                        return (
                          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", textTransform: "capitalize" }}>
                              {key.replace('_score', '').replace(/_/g, ' ')}
                            </span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: bColor, background: `${bColor}15`, padding: "0.2rem 0.6rem", borderRadius: 4 }}>
                              {val}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Nutritional Plan */}
                {dietResult && (
                  <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", margin: 0 }}>7-Day Diet Plan</h3>
                      <div style={{ background: "#0f172a", color: "white", padding: "0.3rem 0.75rem", borderRadius: 6, fontSize: "0.8rem", fontWeight: 700 }}>
                        {dietResult.calorie_target} KCAL/DAY
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.25rem", overflowX: "auto", paddingBottom: "1rem", marginBottom: "0.5rem" }}>
                      {DAYS.map(d => (
                        <button key={d} onClick={() => setActiveDay(d)} style={{ padding: "0.4rem 0.75rem", background: activeDay === d ? "#f1f5f9" : "transparent", border: activeDay === d ? "1px solid #cbd5e1" : "1px solid transparent", color: activeDay === d ? "#0f172a" : "#64748b", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.1s" }}>
                          {d.slice(0,3)}
                        </button>
                      ))}
                    </div>

                    {dietResult.meal_plan?.[activeDay] ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {[['Breakfast', 'breakfast'], ['Lunch', 'lunch'], ['Dinner', 'dinner'], ['Snack', 'snack']].map(([label, key]) => (
                          dietResult.meal_plan[activeDay][key] && (
                            <div key={key} style={{ padding: "1rem", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", gap: "1rem" }}>
                               <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", width: 80, flexShrink: 0 }}>{label}</div>
                               <div style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.5 }}>
                                 {dietResult.meal_plan[activeDay][key]}
                               </div>
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>No data matrix generated for {activeDay}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>
        {`
          .spin-loader { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>
    </div>
  );
}
