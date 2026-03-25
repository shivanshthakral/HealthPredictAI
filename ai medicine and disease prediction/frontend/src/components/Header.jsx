import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/predict', label: 'Diagnosis Engine' },
  { to: '/ocr', label: 'Pharmacy' },
  { to: '/chat', label: 'Copilot' },
  { to: '/health-score', label: 'Health Score' },
  { to: '/orders', label: 'Orders' },
];

export default function Header({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Welcome to HealthEngine.", time: "Just now", read: false },
    { id: 2, text: "Health data sync is complete.", time: "1 hr ago", read: false }
  ]);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    if (isNotificationsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationsOpen]);

  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
    return null; 
  }

  return (
    <header style={{ 
      position: "sticky", top: 0, zIndex: 50, 
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "1rem 2.5rem", background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => navigate('/dashboard')}>
           <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
           </div>
           <div>
             <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif", margin: 0, letterSpacing: "-0.02em" }}>
               HealthAssist
             </h2>
             <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Clinic</span>
           </div>
        </div>

        {/* Global Navigation */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "#f8fafc", padding: "0.25rem", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          {NAV_LINKS.map(link => {
             const isActive = location.pathname === link.to;
             return (
               <NavLink 
                 key={link.to} to={link.to} 
                 style={{ 
                   padding: "0.4rem 1rem", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, textDecoration: "none",
                   background: isActive ? "white" : "transparent",
                   color: isActive ? "#0f172a" : "#64748b",
                   boxShadow: isActive ? "0 2px 4px rgba(0,0,0,0.02)" : "none",
                   border: isActive ? "1px solid #cbd5e1" : "1px solid transparent",
                   transition: "all 0.15s"
                 }}
               >
                 {link.label}
               </NavLink>
             );
          })}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        {user ? (
          <>
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                style={{
                  width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: isNotificationsOpen ? "#f1f5f9" : "transparent", color: isNotificationsOpen ? "#0f172a" : "#64748b",
                  border: "none", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid white" }} />}
              </button>

              {isNotificationsOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 0.5rem)", right: 0, width: 340, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", overflow: "hidden", zIndex: 100 }}>
                  <div style={{ padding: "1rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>System Alerts</h3>
                    {unreadCount > 0 && <button onClick={markAllRead} style={{ background: "none", border: "none", fontSize: "0.75rem", fontWeight: 600, color: "#059669", cursor: "pointer" }}>Mark read</button>}
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {notifications.length === 0 ? <div style={{ padding: "2rem", textAlign: "center", fontSize: "0.85rem", color: "#64748b" }}>No alerts generated.</div> : 
                      notifications.map((n) => (
                        <div key={n.id} style={{ padding: "1rem", borderBottom: "1px solid #f1f5f9", background: n.read ? "white" : "#f8fafc" }}>
                          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: n.read ? 500 : 600, color: n.read ? "#475569" : "#0f172a" }}>{n.text}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "1.5rem", borderLeft: "1px solid #e2e8f0" }}>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{user.name || "System User"}</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>{user.role === 'admin' ? 'Administrator' : 'Standard License'}</span>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", overflow: "hidden", cursor: "pointer" }} onClick={() => navigate('/profile')}>
                <img src={`https://ui-avatars.com/api/?name=${user.name || 'User'}&background=0f172a&color=fff&rounded=false`} alt="User" style={{ width: "100%", height: "100%" }} />
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", cursor: "pointer", marginLeft: "0.5rem" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')} style={{ padding: "0.6rem 1.25rem", background: "#0f172a", color: "white", border: "none", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
            Secure Login
          </button>
        )}
      </div>
    </header>
  );
}
