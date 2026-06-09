"use client";
import { useState, useEffect } from "react";
import { X, Save, Key, Loader2 } from "lucide-react";
import "./settings.css";

export default function SettingsModal({ isOpen, onClose }) {
  const [sid, setSid] = useState("");
  const [token, setToken] = useState("");
  const [callerId, setCallerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [twimlApp, setTwimlApp] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSid(localStorage.getItem("twilioSid") || "");
      setToken(localStorage.getItem("twilioToken") || "");
      setCallerId(localStorage.getItem("twilioCallerId") || "");
      setApiKey(localStorage.getItem("twilioApiKey") || "");
      setApiSecret(localStorage.getItem("twilioApiSecret") || "");
      setTwimlApp(localStorage.getItem("twilioTwimlApp") || "");
      setMessage("");
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("twilioSid", sid);
    localStorage.setItem("twilioToken", token);
    localStorage.setItem("twilioCallerId", callerId);
    localStorage.setItem("twilioApiKey", apiKey);
    localStorage.setItem("twilioApiSecret", apiSecret);
    localStorage.setItem("twilioTwimlApp", twimlApp);
    setMessage("Settings saved successfully!");
    setTimeout(onClose, 1500);
  };

  const handleGenerateKeys = async () => {
    if (!sid || !token) {
      setMessage("Please enter Account SID and Auth Token first.");
      return;
    }
    setIsGenerating(true);
    setMessage("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid, token }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiKey(data.apiKeySid);
        setApiSecret(data.apiSecret);
        setTwimlApp(data.twimlAppSid);
        setMessage("Keys generated! Don't forget to save.");
      } else {
        setMessage(data.error || "Failed to generate keys.");
      }
    } catch (err) {
      setMessage("Network error occurred.");
    }
    setIsGenerating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        <h2>Twilio Configuration</h2>
        <p className="modal-subtitle">Stored securely in your browser</p>
        
        <div className="input-group">
          <label>Account SID</label>
          <input type="text" value={sid} onChange={(e) => setSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        </div>
        
        <div className="input-group">
          <label>Auth Token</label>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Your Twilio Auth Token" />
        </div>

        <div className="input-group">
          <label>Caller ID (From Number)</label>
          <input type="text" value={callerId} onChange={(e) => setCallerId(e.target.value)} placeholder="+1234567890" />
        </div>

        <div className="advanced-section">
          <div className="advanced-header">
            <h3>Advanced Keys (Required for Web Dialer)</h3>
            <button className="generate-btn" onClick={handleGenerateKeys} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="spin" size={16} /> : <Key size={16} />}
              {isGenerating ? "Generating..." : "Auto-Generate"}
            </button>
          </div>
          <div className="input-row">
            <div className="input-group half">
              <label>API Key SID</label>
              <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="SKxxxxxxxx" />
            </div>
            <div className="input-group half">
              <label>API Secret</label>
              <input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="Secret" />
            </div>
          </div>
          <div className="input-group">
            <label>TwiML App SID</label>
            <input type="text" value={twimlApp} onChange={(e) => setTwimlApp(e.target.value)} placeholder="APxxxxxxxx" />
          </div>
        </div>

        {message && <div className="message">{message}</div>}

        <button className="save-btn" onClick={handleSave}>
          <Save size={20} />
          Save Settings
        </button>
      </div>
    </div>
  );
}
