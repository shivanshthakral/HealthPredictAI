import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const healthData = [
  { name: 'Mon', bpm: 72, steps: 4000 },
  { name: 'Tue', bpm: 75, steps: 6000 },
  { name: 'Wed', bpm: 70, steps: 8000 },
  { name: 'Thu', bpm: 74, steps: 5500 },
  { name: 'Fri', bpm: 78, steps: 7000 },
  { name: 'Sat', bpm: 73, steps: 9000 },
  { name: 'Sun', bpm: 71, steps: 4500 },
];

const maxBpm = Math.max(...healthData.map(d => d.bpm));

const STATS = [
  { title: 'Heart Rate', value: '72 bpm', trend: '+2%', trendUp: true, label: 'HR', color: '#ef4444', icon: <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /> },
  { title: 'Blood Pressure', value: '120/80', trend: 'Normal', trendNeutral: true, label: 'BP', color: '#3b82f6', icon: <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /> },
  { title: 'Calories Burned', value: '1,240', trend: '-5%', trendUp: false, label: 'Cal', color: '#f97316', icon: <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /> },
  { title: 'Daily Steps', value: '5,430', trend: '+12%', trendUp: true, label: 'Steps', color: '#10b981', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /> },
];

const MEDS = [
  { name: 'Paracetamol 500mg', note: 'After Lunch · 2:00 PM', color: '#059669' },
  { name: 'Vitamin D3', note: 'With Dinner · 8:00 PM', color: '#f59e0b' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <Header title="Patient Dashboard" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 2rem" }}>
        
        {/* Welcome Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
              Welcome back, {user?.name || "User"}
            </h1>
            <p style={{ color: "#64748b", fontSize: "1.05rem", margin: 0 }}>
              Here is your health overview for today.
            </p>
          </div>
          <button 
            onClick={() => navigate('/predict')}
            style={{
              padding: "0.875rem 1.5rem", background: "linear-gradient(135deg, #059669, #047857)",
              color: "white", border: "none", borderRadius: 10, fontSize: "0.95rem", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
              boxShadow: "0 4px 6px -1px rgba(5, 150, 105, 0.2)", transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            New Assessment
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {s.icon}
                  </svg>
                </div>
                <div style={{
                  padding: "0.25rem 0.6rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700,
                  background: s.trendNeutral ? "#f1f5f9" : s.trendUp ? "#ecfdf5" : "#fef2f2",
                  color: s.trendNeutral ? "#64748b" : s.trendUp ? "#10b981" : "#ef4444"
                }}>
                  {s.trend}
                </div>
              </div>
              <p style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500, marginBottom: "0.25rem" }}>{s.title}</p>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          
          {/* Main Chart Area */}
          <div style={{ flex: "1 1 600px", display: "flex", flexDirection: "column", gap: "2rem" }}>
             
             <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.75rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                 <div>
                   <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem", fontFamily: "'Outfit', sans-serif" }}>Resting Heart Rate</h3>
                   <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>7-day historical clinical data</p>
                 </div>
                 <div style={{ padding: "0.4rem 0.8rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
                   Last 7 Days (BPM)
                 </div>
               </div>
               
               {/* Clean professional SVG bar chart representation */}
               <div style={{ height: 260, width: "100%", position: "relative", paddingTop: "1rem" }}>
                 <svg viewBox="0 0 700 220" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                   {/* Horizontal grid lines */}
                   {[0, 1, 2, 3].map(i => {
                     const y = i * 60;
                     return (
                       <g key={i}>
                         <line x1="40" y1={y} x2="700" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                         <text x="30" y={y + 4} textAnchor="end" fontSize="12" fill="#94a3b8" fontWeight="500">{120 - (i * 30)}</text>
                       </g>
                     )
                   })}
                   
                   {/* Bars */}
                   {healthData.map((d, i) => {
                     const barHeight = (d.bpm / maxBpm) * 160;
                     const x = 80 + i * 95;
                     const y = 200 - barHeight;
                     
                     return (
                       <g key={d.name}>
                         {/* Bar background path */}
                         <rect x={x} y="20" width="44" height="180" rx="6" fill="#f8fafc" />
                         {/* Actual data bar */}
                         <rect 
                           x={x} y={y} width="44" height={barHeight} rx="6" 
                           fill={i === healthData.length - 1 ? "url(#gradActive)" : "#cbd5e1"} 
                         />
                         {/* Value text above bar */}
                         <text x={x + 22} y={y - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill={i === healthData.length - 1 ? "#059669" : "#475569"}>
                           {d.bpm}
                         </text>
                         {/* X-axis label */}
                         <text x={x + 22} y="230" textAnchor="middle" fontSize="13" fontWeight="600" fill="#64748b">{d.name}</text>
                       </g>
                     );
                   })}
                   <defs>
                     <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#10b981" />
                       <stop offset="100%" stopColor="#059669" />
                     </linearGradient>
                   </defs>
                 </svg>
               </div>
             </div>

          </div>

          {/* Right Sidebar */}
          <div style={{ flex: "1 1 300px", maxWidth: 400, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Medication Regimen Module */}
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", margin: 0 }}>Medication Regimen</h3>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "0.25rem 0.6rem", borderRadius: 12 }}>Today</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {MEDS.map((med, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: 4, height: 36, background: med.color, borderRadius: 4 }} />
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" }}>{med.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem" }}>{med.note}</div>
                      </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input type="checkbox" style={{ width: 20, height: 20, accentColor: "#059669", cursor: "pointer" }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", marginBottom: "1.25rem" }}>Quick Formulations</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button 
                  onClick={() => navigate('/ocr')}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                >
                  <div style={{ background: "#e0e7ff", color: "#4f46e5", padding: "0.5rem", borderRadius: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>Prescription OCR</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>Digitize and order meds</div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/chat')}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                >
                  <div style={{ background: "#ecfdf5", color: "#059669", padding: "0.5rem", borderRadius: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>Consult AI Copilot</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>Get instant clinical info</div>
                  </div>
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
