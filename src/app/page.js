"use client";
import { useState, useEffect, useRef } from "react";
import { Settings, Phone, PhoneOff, Delete, Loader2, Wifi, WifiOff } from "lucide-react";
import { Device } from "@twilio/voice-sdk";
import SettingsModal from "@/components/SettingsModal";
import "./page.css";

const numpad = [
  { num: "1", sub: "" },
  { num: "2", sub: "ABC" },
  { num: "3", sub: "DEF" },
  { num: "4", sub: "GHI" },
  { num: "5", sub: "JKL" },
  { num: "6", sub: "MNO" },
  { num: "7", sub: "PQRS" },
  { num: "8", sub: "TUV" },
  { num: "9", sub: "WXYZ" },
  { num: "*", sub: "" },
  { num: "0", sub: "+" },
  { num: "#", sub: "" },
];

const countries = [
  { name: "US/Canada", code: "+1" },
  { name: "Bangladesh", code: "+880" },
  { name: "UK", code: "+44" },
  { name: "India", code: "+91" },
  { name: "Australia", code: "+61" },
  { name: "Germany", code: "+49" },
  { name: "France", code: "+33" },
  { name: "Brazil", code: "+55" },
  { name: "Mexico", code: "+52" },
  { name: "Custom", code: "" }
];

export default function Dialer() {
  const [number, setNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [isReady, setIsReady] = useState(false);
  const [callState, setCallState] = useState("idle");
  const deviceRef = useRef(null);
  const callRef = useRef(null);

  useEffect(() => {
    initTwilio();
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
      }
    };
  }, []);

  const initTwilio = async () => {
    const accountSid = localStorage.getItem("twilioSid");
    const apiKey = localStorage.getItem("twilioApiKey");
    const apiSecret = localStorage.getItem("twilioApiSecret");
    const twimlAppSid = localStorage.getItem("twilioTwimlApp");

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      setStatus("Settings Missing. Please configure.");
      setIsReady(false);
      return;
    }

    try {
      setStatus("Connecting...");
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountSid, apiKey, apiSecret, twimlAppSid })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const device = new Device(data.token, {
        codecPreferences: ["opus", "pcmu"],
        fakeLocalDTMF: true,
        enableRingingState: true,
      });

      device.on("registered", () => {
        setStatus("Ready to call");
        setIsReady(true);
      });

      device.on("error", (error) => {
        console.error("Twilio Device Error:", error);
        setStatus(`Error: ${error.message}`);
        setIsReady(false);
      });

      device.register();
      deviceRef.current = device;
    } catch (err) {
      setStatus("Failed to connect");
      setIsReady(false);
      console.error(err);
    }
  };

  const handleCall = async () => {
    if (!deviceRef.current || !isReady || !number) return;
    
    try {
      const callerId = localStorage.getItem("twilioCallerId");
      
      const fullNumber = number.startsWith('+') ? number : `${countryCode}${number}`;
      
      const params = { To: fullNumber };
      if (callerId) {
        params.CallerId = callerId;
      }
      
      const call = await deviceRef.current.connect({ params });
      callRef.current = call;
      
      setCallState("calling");
      setStatus(`Calling ${fullNumber}...`);

      call.on("accept", () => {
        setCallState("active");
        setStatus("Call in progress...");
      });

      call.on("disconnect", () => {
        setCallState("idle");
        setStatus("Ready to call");
        callRef.current = null;
      });

      call.on("error", (error) => {
        console.error("Call error:", error);
        setCallState("idle");
        setStatus("Call failed");
      });

    } catch (err) {
      console.error("Error making call", err);
      setStatus("Failed to call");
      setCallState("idle");
    }
  };

  const handleHangup = () => {
    if (deviceRef.current) {
      deviceRef.current.disconnectAll();
    }
    setCallState("idle");
    setStatus("Ready to call");
  };

  const handleKeyPress = (num) => {
    setNumber((prev) => prev + num);
  };

  const handleBackspace = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    initTwilio();
  };

  // Determine if we should show the country code prefix in the input display
  const displayPrefix = number.startsWith('+') ? '' : countryCode;

  return (
    <>
      <main className="dialer-container">
        <div className="glass-panel dialer-card animate-fade-in">
          <button className="settings-trigger" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </button>
          
          <div className={`status-badge ${isReady ? (callState !== 'idle' ? 'active' : 'ready') : 'error'}`}>
            {isReady ? <Wifi size={14} /> : <WifiOff size={14} />}
            {status}
          </div>

          <div className="country-selector">
            <select 
              value={countryCode} 
              onChange={(e) => setCountryCode(e.target.value)}
              className="country-select"
            >
              {countries.map(c => (
                <option key={c.name} value={c.code}>
                  {c.name} {c.code && `(${c.code})`}
                </option>
              ))}
            </select>
          </div>

          <div className="input-wrapper">
            {displayPrefix && <span className="country-prefix">{displayPrefix}</span>}
            <input 
              type="text" 
              className={`number-display ${displayPrefix ? 'with-prefix' : ''}`} 
              value={number} 
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Enter number"
            />
          </div>

          <div className="numpad">
            {numpad.map((btn) => (
              <button key={btn.num} className="num-btn" onClick={() => handleKeyPress(btn.num)}>
                <span>{btn.num}</span>
                <span className="sub">{btn.sub}</span>
              </button>
            ))}
          </div>

          <div className="actions">
            {callState === "idle" ? (
              <>
                <div style={{ width: 48 }}></div>
                <button className="call-btn" onClick={handleCall} disabled={!isReady || !number}>
                  <Phone size={28} />
                </button>
                <button className="backspace-btn" onClick={handleBackspace}>
                  <Delete size={24} />
                </button>
              </>
            ) : (
              <button className="hangup-btn" onClick={handleHangup}>
                <PhoneOff size={28} />
              </button>
            )}
          </div>
        </div>
      </main>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={handleSettingsClose} />
    </>
  );
}
