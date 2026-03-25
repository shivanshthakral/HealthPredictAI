import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: 'AI', title: 'Disease Prediction',
    desc: '132-symptom ML ensemble model with confidence scores and specialist recommendations.',
    path: '/predict', color: '#f1f5f9', borderColor: '#e2e8f0'
  },
  {
    icon: 'Chat', title: 'Multilingual Assistant',
    desc: 'Health assistant in 10 Indian languages — English, Hindi, Tamil, and more.',
    path: '/chat', color: '#f1f5f9', borderColor: '#e2e8f0'
  },
  {
    icon: 'Scan', title: 'Prescription Analysis',
    desc: 'Advanced OCR with OpenCV — extracts medicines, dosages, and side effects.',
    path: '/ocr', color: '#f1f5f9', borderColor: '#e2e8f0'
  },
  {
    icon: 'Doc', title: 'Specialist Directory',
    desc: 'Find specialists near you, book slots, and get video consultations.',
    path: '/doctors', color: '#f1f5f9', borderColor: '#e2e8f0'
  },
  {
    icon: 'Health', title: 'Health Metrics',
    desc: 'Personalized BMI assessment, health score, and 7-day diet planner.',
    path: '/health-score', color: '#f1f5f9', borderColor: '#e2e8f0'
  },
  {
    icon: 'Report', title: 'Clinical Reports',
    desc: 'Generate comprehensive PDF health reports with AI insights and recommendations.',
    path: '/report', color: '#f1f5f9', borderColor: '#e2e8f0'
  },
];

const STATS = [
  { number: '41', label: 'Diseases Detected', suffix: '+' },
  { number: '132', label: 'Symptoms Analyzed', suffix: '' },
  { number: '10', label: 'Indian Languages', suffix: '' },
  { number: '99', label: 'Accuracy Rate', suffix: '%' },
];

export default function Home() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState(STATS.map(() => 0));

  useEffect(() => {
    STATS.forEach((s, i) => {
      const target = parseInt(s.number);
      const step = Math.ceil(target / 40);
      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        setCounts(prev => { const n = [...prev]; n[i] = current; return n; });
        if (current >= target) clearInterval(timer);
      }, 30);
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="badge badge-primary">Rural-First Healthcare</span>
              <span className="badge badge-info">AI-Powered</span>
            </div>
            <h1 style={{ marginBottom: '1.5rem', lineHeight: 1.1 }}>
              Your <span className="text-gradient">Clinical Decision</span> Support System
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--gray-600)', maxWidth: '580px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
              Professional healthcare intelligence powered by ML ensembles and automated OCR analysis. 
              Designed for clinical accuracy and accessibility.
            </p>
            <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/predict')}>
                Diagnostic Assessment
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/chat')}>
                Virtual Assistant
              </button>
            </div>
            <div className="flex gap-6 mt-6" style={{ flexWrap: 'wrap', opacity: 0.8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                HIPAA-Aware Design
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Enterprise Grade
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Multilingual Support
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--bg-secondary)', padding: '3rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="grid-4">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-card animate-fade-in">
                <div className="stat-number">{counts[i]}{stat.suffix}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-6">
            <h2>Everything You Need for <span className="text-gradient">Better Health</span></h2>
            <p style={{ fontSize: '1.05rem', maxWidth: '520px', margin: '1rem auto 0' }}>
              Six powerful AI modules working together to give you world-class healthcare access.
            </p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="feature-card"
                onClick={() => navigate(f.path)}
                style={{ cursor: 'pointer' }}
              >
                <div className="feature-icon" style={{ background: f.color, border: `1px solid ${f.borderColor}`, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-600)' }}>
                  {f.icon}
                </div>
                <h3 style={{ marginBottom: '0.5rem', position: 'relative' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem', position: 'relative', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
                <div style={{ marginTop: '1.25rem', position: 'relative' }}>
                  <span className="btn btn-outline btn-sm">Explore →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <section style={{ background: 'var(--bg-primary)', padding: '2.5rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <h3 style={{ color: 'var(--danger)', marginBottom: '0.35rem' }}>Emergency Protocol</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                For immediate medical emergencies, contact local authorities.
              </p>
            </div>
            <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
              <a href="tel:108" className="btn btn-danger">Ambulance (108)</a>
              <a href="tel:112" className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                Emergency (112)
              </a>
              <a href="tel:104" className="btn btn-secondary">Health Helpline (104)</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem 0', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
        <div className="container">
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', lineHeight: 1.7 }}>
            <strong>Medical Disclaimer:</strong> HealthPredict AI systems are for clinical support and informational purposes. 
            They do not replace professional diagnosis. Validated clinical judgment remains paramount.
          </p>
        </div>
      </footer>
    </div>
  );
}
