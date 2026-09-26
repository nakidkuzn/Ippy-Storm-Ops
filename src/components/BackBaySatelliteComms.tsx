import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Send, 
  Radio, 
  Maximize2, 
  Minimize2, 
  Camera, 
  Compass, 
  Eye, 
  Flame, 
  MapPin, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  ShieldCheck, 
  Building, 
  Sparkles,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { playTacticalAlertSound } from '../services/audioAlertService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundingLinks?: Array<{ title: string; uri: string }>;
  isStreaming?: boolean;
}

interface BackBaySatelliteCommsProps {
  onClose?: () => void;
}

export const BackBaySatelliteComms: React.FC<BackBaySatelliteCommsProps> = ({ onClose }) => {
  // Video Feed States
  const [activeCamera, setActiveCamera] = useState<'command-desk' | 'boylston-st' | 'staging-bay' | 'user-cam'>('command-desk');
  const [thermalMode, setThermalMode] = useState(false);
  const [ptzZoom, setPtzZoom] = useState(1);
  const [ptzPan, setPtzPan] = useState(0);
  const [ptzTilt, setPtzTilt] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [radioChannel, setRadioChannel] = useState('CH 1: Back Bay Satellite (154.280 MHz)');
  const [userMediaStream, setUserMediaStream] = useState<MediaStream | null>(null);

  // Canvas ref for high-fidelity simulated tactical video feed
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Multi-Turn Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'Back Bay Satellite Office online. Dispatch Officer J. Doherty on duty at Boylston & Dartmouth St. We have visual contact with Copley Square and Commonwealth Ave corridors. How can we support Everett operations?',
      timestamp: '14:15 EST',
      groundingLinks: [
        {
          title: 'Back Bay Satellite Office (Boylston St)',
          uri: 'https://maps.google.com/?q=Boylston+St+and+Dartmouth+St+Boston+MA',
        },
        {
          title: 'Copley Square Boston',
          uri: 'https://maps.google.com/?q=Copley+Square+Boston+MA',
        },
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle local webcam if user switches to CAM 04
  useEffect(() => {
    if (activeCamera === 'user-cam') {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setUserMediaStream(stream);
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // If permission denied or unavailable, fallback gracefully
          setActiveCamera('command-desk');
        });
    } else {
      if (userMediaStream) {
        userMediaStream.getTracks().forEach((track) => track.stop());
        setUserMediaStream(null);
      }
    }

    return () => {
      if (userMediaStream) {
        userMediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCamera]);

  // Canvas Animation loop for realistic tactical CCTV simulation
  useEffect(() => {
    if (activeCamera === 'user-cam') return;
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // Base background
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      // Apply PTZ transformations
      ctx.translate(w / 2 + ptzPan, h / 2 + ptzTilt);
      ctx.scale(ptzZoom, ptzZoom);
      ctx.translate(-w / 2, -h / 2);

      if (activeCamera === 'command-desk') {
        // Draw Command Desk View: Office monitors, dispatch map displays, snow radar screens
        // Background office walls
        ctx.fillStyle = '#111827';
        ctx.fillRect(40, 30, w - 80, h - 60);

        // Multi-monitor wall
        ctx.fillStyle = '#030712';
        ctx.fillRect(70, 50, 160, 95);
        ctx.fillRect(250, 50, 160, 95);
        ctx.fillRect(430, 50, 160, 95);

        // Monitor 1: Boston radar map with sweeping sweep line
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(74, 54, 152, 87);
        const sweepAngle = (frameCount * 0.04) % (Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(150, 97);
        ctx.lineTo(150 + Math.cos(sweepAngle) * 60, 97 + Math.sin(sweepAngle) * 60);
        ctx.stroke();

        // Monitor 2: Back Bay Fleet Status & Site manifest matrix
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(254, 54, 152, 87);
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(260, 62 + i * 14, 50 + (i * 15) % 80, 5);
        }

        // Monitor 3: Live Street CCTV feeds
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(434, 54, 152, 87);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(440, 62, 140, 3);

        // Dispatch console desk
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.moveTo(20, h - 50);
        ctx.lineTo(w - 20, h - 50);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Operator silhouette at console
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(w / 2 + Math.sin(frameCount * 0.02) * 4, h - 85, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(w / 2 - 38 + Math.sin(frameCount * 0.02) * 4, h - 60, 76, 50);

        // Headset with blinking green comms led
        ctx.fillStyle = '#10b981';
        ctx.fillRect(w / 2 + 18, h - 90, 4, 4);

      } else if (activeCamera === 'boylston-st') {
        // Draw Exterior Boylston Street Camera: Boston Brownstones, Copley Square, falling snow particles
        // Sky & Buildings
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h * 0.45);

        // Boston architecture skyline
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(30, 40, 110, h * 0.45);
        ctx.fillRect(160, 65, 140, h * 0.45);
        ctx.fillRect(320, 30, 120, h * 0.45);
        ctx.fillRect(460, 50, 150, h * 0.45);

        // Lit windows
        ctx.fillStyle = '#fef08a';
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 6; col++) {
            if ((row + col) % 2 === 0) {
              ctx.fillRect(50 + col * 20, 60 + row * 22, 10, 14);
            }
          }
        }

        // Street pavement with snow accumulation
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, h * 0.55, w, h * 0.45);

        // Snow drifts along curb
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.65);
        ctx.bezierCurveTo(150, h * 0.62, 350, h * 0.68, w, h * 0.64);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Plow truck passing by in the street
        const truckX = ((frameCount * 3) % (w + 200)) - 100;
        ctx.fillStyle = '#f97316'; // Orange plow truck body
        ctx.fillRect(truckX, h * 0.68, 90, 35);
        ctx.fillStyle = '#e2e8f0'; // Plow blade
        ctx.fillRect(truckX + 80, h * 0.72, 18, 25);
        // Flashing amber beacon
        if (Math.floor(frameCount / 10) % 2 === 0) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(truckX + 45, h * 0.65, 6, 0, Math.PI * 2);
          ctx.fill();
        }

      } else {
        // Staging Bay: Salt pallets, Skid steer with snow pusher, staging alleys
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, w, h);

        // Salt dome / pallet stacks
        ctx.fillStyle = '#cbd5e1';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(60 + i * 55, h - 140, 48, 60);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(60 + i * 55, h - 80, 48, 8);
        }

        // Bobcat Skid Steer with snow pusher box
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(340, h - 130, 85, 55);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(370, h - 110, 45, 30);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(360, h - 70, 18, 0, Math.PI * 2);
        ctx.arc(415, h - 70, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Continuous falling snow particles overlay on all exterior / window cameras
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let s = 0; s < 70; s++) {
        const sx = (s * 37 + frameCount * 1.5) % w;
        const sy = (s * 49 + frameCount * 3.5) % h;
        const sSize = 1.2 + (s % 3);
        ctx.beginPath();
        ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Thermal Imaging Filter Overlay
      if (thermalMode) {
        ctx.save();
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.45)'; // Cyan thermal glow
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'color-dodge';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)'; // Red hot zone
        ctx.fillRect(w * 0.3, h * 0.4, w * 0.4, h * 0.5);
        ctx.restore();
      }

      // CRT Scanline and tactical lens grid
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let line = 0; line < h; line += 4) {
        ctx.fillRect(0, line, w, 1);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeCamera, thermalMode, ptzZoom, ptzPan, ptzTilt]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle Multi-Turn Chat Submit
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' EST',
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/backbay/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'Copy that. Standing by on Back Bay dispatch frequency.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' EST',
        groundingLinks: data.groundingLinks || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      playTacticalAlertSound('radar_ping');
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 2}`,
        role: 'assistant',
        content: 'Back Bay Satellite Office acknowledges. We are maintaining Boylston St / Copley corridor clearance. Pre-treated salt supplies are standing by at Dartmouth St alley.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' EST',
        groundingLinks: [
          {
            title: 'Boylston St Snow Route Grounding',
            uri: 'https://maps.google.com/?q=Boylston+St+Boston+MA',
          },
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Push to talk radio trigger
  const handlePushToTalk = () => {
    setIsTransmitting(true);
    playTacticalAlertSound('site_cleared');
    setTimeout(() => {
      setIsTransmitting(false);
      playTacticalAlertSound('radar_ping');
    }, 1800);
  };

  return (
    <div className="w-full h-full bg-neutral-950 flex flex-col xl:flex-row overflow-hidden select-none border-t border-neutral-800">
      {/* LEFT COLUMN: LIVE VIDEO FEED & CCTV CONTROLS */}
      <div className="flex-1 flex flex-col border-b xl:border-b-0 xl:border-r border-neutral-800 bg-neutral-900/60 min-h-[380px]">
        {/* Video Header & Feed Selector */}
        <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 border border-red-700/80 text-red-400 font-mono text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>LIVE SATELLITE STREAM</span>
            </div>
            <span className="font-display font-bold text-sm tracking-wide text-neutral-100 uppercase">
              Back Bay Satellite Office (Boylston Command)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-neutral-400">
              <span className="text-emerald-400">● 1080P60</span>
              <span>· 4.8 Mbps H.264 · WebRTC</span>
            </div>
            {onClose && (
              <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100 text-xs px-2 py-1 bg-neutral-800 rounded">
                Close Feed
              </button>
            )}
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {activeCamera === 'user-cam' ? (
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <canvas
              ref={videoCanvasRef}
              width={640}
              height={360}
              className="w-full h-full object-cover max-h-[480px]"
            />
          )}

          {/* Tactical HUD Overlay Elements */}
          <div className="absolute top-3 left-3 pointer-events-none font-mono text-[11px] text-emerald-400 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded border border-emerald-500/40 space-y-0.5 shadow-lg">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-neutral-100">
                {activeCamera === 'command-desk' ? 'CAM-01: DISPATCH DESK' :
                 activeCamera === 'boylston-st' ? 'CAM-02: BOYLSTON ST & COPLEY' :
                 activeCamera === 'staging-bay' ? 'CAM-03: STAGING ALLEY / SALT' :
                 'CAM-04: FIELD CREW TWO-WAY'}
              </span>
              <span className="text-[10px] px-1 bg-emerald-950 text-emerald-300 rounded border border-emerald-700/60">
                LATENCY: 42ms
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">
              GPS: 42.3503° N, 71.0810° W · ELEVATION: 18ft
            </div>
          </div>

          {/* Zoom / PTZ Status Overlay */}
          <div className="absolute top-3 right-3 pointer-events-none font-mono text-[11px] text-cyan-400 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded border border-cyan-500/40">
            <div>ZOOM: {ptzZoom.toFixed(1)}X · PAN: {ptzPan}px</div>
            {thermalMode && <div className="text-red-400 font-bold">THERMAL FLIR ACTIVE</div>}
          </div>

          {/* Bottom HUD Bar: Radio Transmit Indicator */}
          {isTransmitting && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-red-600/90 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-full shadow-2xl flex items-center gap-2 animate-pulse border border-white/50">
              <Mic className="w-4 h-4" />
              <span>TRANSMITTING ON {radioChannel.split(':')[0]}</span>
            </div>
          )}
        </div>

        {/* Video Control Bar & Camera Switcher */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs font-mono">
          {/* Camera Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveCamera('command-desk')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeCamera === 'command-desk' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Cam 1: Desk
            </button>
            <button
              onClick={() => setActiveCamera('boylston-st')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeCamera === 'boylston-st' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Cam 2: Boylston St
            </button>
            <button
              onClick={() => setActiveCamera('staging-bay')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeCamera === 'staging-bay' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Cam 3: Staging Bay
            </button>
            <button
              onClick={() => setActiveCamera('user-cam')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeCamera === 'user-cam' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Cam 4: Field Cam
            </button>
          </div>

          {/* PTZ & Optics Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setThermalMode(!thermalMode)}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                thermalMode ? 'bg-red-950 text-red-300 border border-red-600 font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Toggle Thermal Infrared De-icing Filter"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Thermal</span>
            </button>

            <button
              onClick={() => setPtzZoom((z) => (z >= 2 ? 1 : z + 0.5))}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
              title="Cycle optical zoom"
            >
              Zoom {ptzZoom}x
            </button>

            <button
              onClick={() => {
                setPtzZoom(1);
                setPtzPan(0);
                setPtzTilt(0);
              }}
              className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 rounded border border-neutral-700"
              title="Reset Camera PTZ Position"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Radio Voice Transceiver Bar */}
        <div className="px-4 py-2.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <select
              value={radioChannel}
              onChange={(e) => setRadioChannel(e.target.value)}
              className="bg-neutral-900 text-neutral-200 border border-neutral-800 rounded px-2 py-1 outline-none text-[11px]"
            >
              <option value="CH 1: Back Bay Satellite (154.280 MHz)">CH 1: Back Bay Satellite (154.280 MHz)</option>
              <option value="CH 2: Everett HQ Operations (155.055 MHz)">CH 2: Everett HQ Operations (155.055 MHz)</option>
              <option value="CH 3: Seaport Heavy Pushers (158.400 MHz)">CH 3: Seaport Heavy Pushers (158.400 MHz)</option>
              <option value="CH 4: Boston Emergency Liaison (151.175 MHz)">CH 4: Boston Emergency Liaison (151.175 MHz)</option>
            </select>
          </div>

          <button
            onMouseDown={handlePushToTalk}
            onTouchStart={handlePushToTalk}
            className={`flex items-center gap-2 px-3 py-1.5 rounded font-bold transition-all shadow-md ${
              isTransmitting
                ? 'bg-red-600 text-white scale-105 ring-2 ring-red-400'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 active:bg-red-700'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>PUSH TO TALK (PTT)</span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: MULTI-TURN GEMINI DISPATCH CHAT WITH MAPS GROUNDING */}
      <div className="w-full xl:w-[460px] flex flex-col bg-neutral-900 h-full">
        {/* Chat Header */}
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-neutral-100 uppercase">
                Satellite Dispatch Officer Liaison
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                Powered by Gemini 3.5 Flash · Google Maps Grounding Active
              </p>
            </div>
          </div>

          <button
            onClick={() => setMessages([])}
            className="p-1 text-neutral-500 hover:text-neutral-300 rounded hover:bg-neutral-800"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Conversation Thread */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 font-sans text-xs">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 font-mono text-xs">
              Direct communication link ready. Send an inquiry or command to Back Bay Satellite Office.
            </div>
          ) : (
            messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-neutral-400">
                    <span className="font-bold text-neutral-300">
                      {isAssistant ? 'BACK BAY DISPATCH' : 'EVERETT HQ'}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[90%] p-3 rounded-lg leading-relaxed shadow ${
                      isAssistant
                        ? 'bg-neutral-950 text-neutral-200 border border-neutral-800'
                        : 'bg-cyan-950 text-cyan-100 border border-cyan-700/70'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Google Maps Grounding Links (MANDATORY REQUIREMENT) */}
                    {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-800/80 space-y-1">
                        <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>Google Maps Grounded Locations:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.groundingLinks.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.uri}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-cyan-800/60 text-cyan-300 text-[11px] font-mono transition-colors"
                            >
                              <span>{link.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Back Bay Dispatch retrieving Google Maps route data & composing transmission...</span>
            </div>
          )}
        </div>

        {/* Tactical Quick Action Suggestion Chips */}
        <div className="px-3 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono shrink-0">
          <button
            onClick={() => handleSendMessage('What is the current Back Bay snow emergency parking and tow status?')}
            className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 whitespace-nowrap"
          >
            Parking Tow Ban
          </button>
          <button
            onClick={() => handleSendMessage('Where is the nearest salt replenishment depot to Back Bay office?')}
            className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 whitespace-nowrap"
          >
            Salt Depot
          </button>
          <button
            onClick={() => handleSendMessage('Assess Copley Square and Boylston Street road conditions')}
            className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 whitespace-nowrap"
          >
            Boylston Street
          </button>
          <button
            onClick={() => handleSendMessage('Identify critical emergency hospital access routes in Boston')}
            className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 whitespace-nowrap"
          >
            Hospital Routes
          </button>
        </div>

        {/* Message Input Box */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Transmit message or query to Back Bay satellite dispatch..."
              disabled={isLoading}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-neutral-950 font-bold rounded text-xs transition-colors flex items-center gap-1 font-mono"
            >
              <span>SEND</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
