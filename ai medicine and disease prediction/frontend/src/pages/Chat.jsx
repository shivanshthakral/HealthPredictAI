import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { GoogleGenerativeAI } from '@google/generative-ai';

const LANGUAGES = [
  { code: 'en', name: 'English', format: 'en-IN' },
  { code: 'hi', name: 'Hindi (हिंदी)', format: 'hi-IN' },
  { code: 'ta', name: 'Tamil (தமிழ்)', format: 'ta-IN' },
  { code: 'te', name: 'Telugu (తెలుగు)', format: 'te-IN' },
  { code: 'ml', name: 'Malayalam (മലയാളം)', format: 'ml-IN' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', format: 'kn-IN' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', format: 'pa-IN' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)', format: 'gu-IN' },
  { code: 'mr', name: 'Marathi (मराठी)', format: 'mr-IN' },
  { code: 'bn', name: 'Bengali (বাংলা)', format: 'bn-IN' },
];

const QUICK_PROMPTS = [
  { text: 'I have stomach ache and vomiting', label: 'Stomach Pain' },
  { text: 'My baby has high fever', label: 'Child Health' },
  { text: 'What should a pregnant woman eat?', label: 'Pregnancy Diet' },
  { text: 'Home remedies for a bad cough', label: 'Cough & Cold' },
  { text: 'मुझे दो दिन से तेज़ बुखार है', label: 'Hindi Check (बुखार)' }
];

// Converts a File to base64 string (without the data URI prefix)
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'bot',
      text: 'Namaste! I am your Village Health Assistant (स्वास्थ्य सहायक). I can understand and reply in **10 regional Indian languages**.\n\nI can help you understand symptoms, provide basic health and nutrition advice. You can also **upload an image** (wound, rash, medicine label, etc.) and ask me about it.\n\nPlease note that I am an AI and **cannot replace a real doctor**.\n\nType your message below or tap the microphone to speak.',
      language: 'en'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [emergency, setEmergency] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState(null); // { file, previewUrl, base64, mimeType }
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a; font-weight:700;">$1</strong>')
      .replace(/\n/g, '<br />');
  };

  // ─── Handle image file selection ───────────────────────────────────────────
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, WEBP, or GIF image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be under 10MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const base64 = await fileToBase64(file);
    setUploadedImage({ file, previewUrl, base64, mimeType: file.type });
    // Reset the file input so the same file can be re-selected
    e.target.value = '';
  };

  const removeUploadedImage = () => {
    if (uploadedImage?.previewUrl) URL.revokeObjectURL(uploadedImage.previewUrl);
    setUploadedImage(null);
  };

  // ─── Gemini API call (text only or text + image) ────────────────────────────
  const getGeminiResponse = async (userText, chatHistory, imageData = null) => {
    const apiKey = "AIzaSyABFlhVegUoUV8-uhlr7tV2m1ppb8Z4SYc";
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('VITE_GEMINI_API_KEY is not set or invalid in frontend .env file.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // gemini-1.5-flash supports vision; fall back gracefully
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const selectedLangName = LANGUAGES.find(l => l.code === language)?.name || 'English';
    const historyText = chatHistory.map(m => `${m.role === 'bot' ? 'Assistant' : 'User'}: ${m.text}`).join('\n');

    const systemPrompt = `
You are a compassionate Village Health Assistant. Provide basic health advice, symptom understanding, and nutrition tips.
You MUST respond ONLY in the following language: ${selectedLangName}.

Conversation History:
${historyText}

Guidelines:
1. Always prioritize safety. If symptoms suggest an emergency (e.g., chest pain, difficulty breathing, severe bleeding), advise them to seek immediate medical help or dial 108.
2. Keep responses concise (3-5 sentences) and easy to understand for rural populations.
3. Reply purely in ${selectedLangName}.
4. Do not provide a formal medical diagnosis.
${imageData ? '5. An image has been shared. Analyse it carefully and provide relevant health observations.' : ''}
`;

    // Build the parts array for the prompt
    const parts = [];

    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      });
    }

    parts.push({ text: systemPrompt + `\nUser's New Message (Respond in ${selectedLangName}):\n"${userText}"` });

    const result = await model.generateContent(parts);
    return result.response.text();
  };

  // ─── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;

    const imageSnapshot = uploadedImage; // capture before clearing
    setInput('');
    setUploadedImage(null);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text,
      image: imageSnapshot ? imageSnapshot.previewUrl : null,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const chatHistory = messages.slice(-5);
      const responseText = await getGeminiResponse(
        text,
        chatHistory,
        imageSnapshot ? { base64: imageSnapshot.base64, mimeType: imageSnapshot.mimeType } : null
      );

      const lowerText = text.toLowerCase() + ' ' + responseText.toLowerCase();
      const emergencyKeywords = ['chest pain', 'heart attack', 'severe bleeding', 'breathing difficulty', 'unconscious', 'emergency'];
      const isEmergency = emergencyKeywords.some(kw => lowerText.includes(kw));
      if (isEmergency) setEmergency({ message: 'Possible emergency detected. Please seek immediate medical attention.' });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: responseText,
        language: LANGUAGES.find(l => l.code === language)?.name || 'English',
        source: 'Gemini Vision',
        isEmergency,
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: `Error: ${err.message}. If experiencing an emergency, dial 108.`,
        isEmergency: false,
      }]);
    }
    setLoading(false);
  };

  // ─── TTS ─────────────────────────────────────────────────────────────────────
  const speakText = (text) => {
    const clean = text.replace(/<[^>]+>/g, '').replace(/\*\*/g, '');
    const langConfig = LANGUAGES.find(l => l.code === language);
    const targetLang = langConfig ? langConfig.format : 'en-IN';

    const speak = () => {
      const voices = speechSynthesis.getVoices();
      const voice =
        voices.find(v => v.lang === targetLang) ||
        voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = targetLang;
      if (voice) utter.voice = voice;
      speechSynthesis.speak(utter);
    };

    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.onvoiceschanged = null;
        speak();
      };
    } else {
      speak();
    }
  };

  // ─── Voice input ─────────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice typing is not supported in this browser. Please try Chrome.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognitionRef.current = recognition;
      const langConfig = LANGUAGES.find(l => l.code === language);
      recognition.lang = langConfig ? langConfig.format : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        setInput(transcript);
      };
      recognition.onerror = (e) => { console.error(e.error); setIsListening(false); };
      recognition.onend = () => setIsListening(false);
      try { recognition.start(); } catch (e) { setIsListening(false); }
    }).catch(() => {
      alert('Microphone permission was denied. Please allow microphone access in your browser settings.');
      setIsListening(false);
    });
  };

  // ─── Image preview modal ──────────────────────────────────────────────────────
  const ImageModal = () => (
    <div
      onClick={() => setShowImageModal(false)}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, cursor: 'zoom-out',
      }}
    >
      <img
        src={modalImage}
        alt="Preview"
        style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      <Header title="Health AI Connect" />

      {showImageModal && <ImageModal />}

      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '2.5rem 2rem', display: 'flex', gap: '2rem' }}>

        {/* ── Left: Chat ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>

          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2l.5-.5a4.04 4.04 0 0 1-5-5l-.5.5z" /><path d="m15 5 4 4" /><path d="m20.5 8.5-4-4a2.83 2.83 0 0 0-4 4l9.5 9.5a2.83 2.83 0 0 0 4-4l-5.5-5.5z" /></svg>
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Village Health Assistant</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 2px rgba(16,185,129,0.2)' }} />
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Vision + Multilingual Mode</span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Banner */}
          {emergency && (
            <div style={{ margin: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
              <h4 style={{ color: '#b91c1c', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.8l7.5 13.2h-15L12 5.8zm-1 4.2v5h2v-5h-2zm0 7v2h2v-2h-2z" /></svg>
                Emergency Protocol Activated
              </h4>
              <p style={{ color: '#991b1b', fontSize: '0.85rem', marginBottom: '1rem' }}>{emergency.message}</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a href="tel:108" style={{ background: '#dc2626', color: 'white', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Dial 108</a>
                <button onClick={() => setEmergency(null)} style={{ background: 'transparent', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Dismiss Warning</button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=') repeat", backgroundSize: '20px 20px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '1rem 1.25rem', borderRadius: 12,
                  background: msg.role === 'user' ? '#0f172a' : (msg.isEmergency ? '#fef2f2' : '#ffffff'),
                  color: msg.role === 'user' ? '#ffffff' : '#334155',
                  border: msg.role === 'user' ? 'none' : (msg.isEmergency ? '1px solid #fecaca' : '1px solid #e2e8f0'),
                  borderBottomRightRadius: msg.role === 'user' ? 2 : 12,
                  borderBottomLeftRadius: msg.role === 'bot' ? 2 : 12,
                  boxShadow: msg.role === 'bot' ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                  fontSize: '0.95rem', lineHeight: 1.6,
                }}>
                  {/* Attached image thumbnail (user messages) */}
                  {msg.image && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <img
                        src={msg.image}
                        alt="Uploaded"
                        onClick={() => { setModalImage(msg.image); setShowImageModal(true); }}
                        style={{
                          maxWidth: 200, maxHeight: 160, borderRadius: 8, display: 'block',
                          border: '2px solid rgba(255,255,255,0.2)', cursor: 'zoom-in', objectFit: 'cover',
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.3rem', display: 'block' }}>
                        📷 Image attached — tap to enlarge
                      </span>
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                </div>

                {msg.role === 'bot' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                      {msg.language ? `${msg.language} ${msg.source ? `(${msg.source})` : ''}` : 'English (en)'}
                    </span>
                    <button
                      onClick={() => speakText(msg.text)}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                      Read aloud
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, borderBottomLeftRadius: 2 }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1', animation: `bounce 1.4s infinite ease-in-out ${i * 0.16}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '1.25rem 1.5rem', background: '#fff', borderTop: '1px solid #e2e8f0' }}>

            {/* Image preview strip (before sending) */}
            {uploadedImage && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                padding: '0.75rem 1rem', marginBottom: '0.75rem',
              }}>
                <img
                  src={uploadedImage.previewUrl}
                  alt="To send"
                  onClick={() => { setModalImage(uploadedImage.previewUrl); setShowImageModal(true); }}
                  style={{ width: 56, height: 48, objectFit: 'cover', borderRadius: 6, cursor: 'zoom-in', border: '1px solid #86efac' }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534', margin: 0 }}>Image ready to send</p>
                  <p style={{ fontSize: '0.72rem', color: '#4ade80', margin: '0.1rem 0 0' }}>{uploadedImage.file.name}</p>
                </div>
                <button
                  onClick={removeUploadedImage}
                  title="Remove image"
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.25rem', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            )}

            {/* Language selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Speak/Reply in:</span>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: 6 }}
              >
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem', borderRadius: 12 }}>

              {/* Mic button */}
              <button
                onClick={toggleVoice}
                title={isListening ? 'Stop listening' : 'Voice input'}
                style={{
                  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isListening ? '#fef2f2' : '#ffffff', color: isListening ? '#ef4444' : '#059669',
                  border: '2px solid', borderColor: isListening ? '#fca5a5' : '#e2e8f0', borderRadius: '50%',
                  cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                  boxShadow: isListening ? '0 0 0 4px rgba(239, 68, 68, 0.2)' : 'none',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
              </button>

              {/* Image upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload image for analysis"
                style={{
                  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: uploadedImage ? '#f0fdf4' : '#ffffff',
                  color: uploadedImage ? '#059669' : '#64748b',
                  border: '2px solid', borderColor: uploadedImage ? '#86efac' : '#e2e8f0', borderRadius: '50%',
                  cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleImageSelect} />

              {/* Text input */}
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={
                  isListening ? 'Listening to you...' :
                    uploadedImage ? 'Ask something about the image...' :
                      'Type your message...'
                }
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem', color: '#0f172a', minHeight: '44px' }}
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && !uploadedImage) || loading}
                style={{
                  height: 44, padding: '0 1.25rem',
                  background: ((!input.trim() && !uploadedImage) || loading) ? '#cbd5e1' : 'linear-gradient(135deg, #059669, #047857)',
                  color: 'white', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600,
                  cursor: ((!input.trim() && !uploadedImage) || loading) ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                Send
              </button>
            </div>

            {/* Image tip */}
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0, paddingLeft: '0.25rem' }}>
              📷 Upload a photo of a wound, rash, medicine label, or food to get AI-powered health insights.
            </p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.5rem', marginBottom: 0 }}>
              AI models provide general advice. Always consult a real doctor for serious issues.
            </p>
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Quick prompts */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              Suggested Queries
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(p.text); inputRef.current?.focus(); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', color: '#334155', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image analysis tip card */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📷</span> Image Analysis
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              Tap the <strong>image icon</strong> in the input bar to upload a photo. You can ask about:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {['Skin rash or wound', 'Medicine / prescription label', 'Food & nutrition', 'X-ray or medical report', 'Plant or animal bite'].map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Engine card */}
          <div style={{ background: 'linear-gradient(145deg, #059669, #047857)', borderRadius: 16, padding: '1.5rem', color: 'white', boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.2)' }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Vision + Multilingual Engine</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 0 }}>
              Powered by Gemini 1.5 Flash with vision support. Understands images and text in 10 Indian languages.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}