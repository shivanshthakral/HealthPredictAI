import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { user } = useAuth();
    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
            <Header title="Patient Directory" />

            <main style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 2rem" }}>
                
                {/* Profile Header Block */}
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "2.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", display: "flex", gap: "2.5rem", alignItems: "center", marginBottom: "2rem" }}>
                    
                    <div style={{ position: "relative" }}>
                        <div style={{ width: 140, height: 140, borderRadius: 16, background: "linear-gradient(135deg, #0f172a, #1e293b)", padding: "4px" }}>
                            <div style={{ width: "100%", height: "100%", borderRadius: 12, background: "white", overflow: "hidden" }}>
                                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=f1f5f9&color=0f172a&size=200`} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                            <div>
                                <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", margin: "0 0 0.25rem 0" }}>{user?.name || 'User'}</h1>
                                <p style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 500, margin: 0 }}>Clinical Patient ID: <span style={{ fontFamily: "monospace", color: "#0f172a", fontWeight: 700, background: "#f1f5f9", padding: "0.2rem 0.5rem", borderRadius: 4 }}>#PT-839201</span></p>
                            </div>
                            <button style={{ padding: "0.6rem 1.25rem", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                                Edit Profile
                            </button>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "0.5rem 1rem", borderRadius: 8 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                {user?.email || 'user@example.com'}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "0.5rem 1rem", borderRadius: 8 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                +1 (555) 123-4567
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "0.5rem 1rem", borderRadius: 8 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                New York, USA
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                    
                    {/* Biological Record */}
                    <div style={{ flex: "1 1 500px", background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "2rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", marginBottom: "1.5rem" }}>Biological Record</h3>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div style={{ padding: "1.25rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Blood Type</div>
                                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>O+</div>
                            </div>
                            <div style={{ padding: "1.25rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Height</div>
                                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>180 <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>cm</span></div>
                            </div>
                            <div style={{ padding: "1.25rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Mass</div>
                                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>75 <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>kg</span></div>
                            </div>
                            <div style={{ padding: "1.25rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12 }}>
                                <div style={{ fontSize: "0.8rem", color: "#b91c1c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Known Allergies</div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#991b1b" }}>Peanuts</div>
                            </div>
                        </div>
                    </div>

                    {/* Account Analytics */}
                    <div style={{ flex: "1 1 300px", background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "2rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif", marginBottom: "1.5rem" }}>Account Analytics</h3>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ padding: "0.4rem", background: "#e0e7ff", color: "#4f46e5", borderRadius: 6 }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                    </div>
                                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>Processed Orders</span>
                                </div>
                                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>12</span>
                            </div>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ padding: "0.4rem", background: "#ecfdf5", color: "#059669", borderRadius: 6 }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    </div>
                                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>AI Consultations</span>
                                </div>
                                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>5</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ padding: "0.4rem", background: "#ffedd5", color: "#ea580c", borderRadius: 6 }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                    </div>
                                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>Feedback Supplied</span>
                                </div>
                                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>8</span>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
