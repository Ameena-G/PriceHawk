import { useState, useEffect, useRef } from "react";

const API_BASE = (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_URL) || "http://localhost:8080";

const formatPrice = (price, currency = "INR") => {
  if (!price && price !== 0) return "N/A";
  const symbols = { USD: "$", INR: "₹", GBP: "£", EUR: "€", AUD: "A$", CAD: "C$" };
  return `${symbols[currency] || currency + " "}${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const STORE_META = {
  Amazon:     { color: "#FF9900", glow: "rgba(255,153,0,0.3)" },
  eBay:       { color: "#E53238", glow: "rgba(229,50,56,0.3)" },
  "Best Buy": { color: "#00C8F0", glow: "rgba(0,200,240,0.3)" },
  Flipkart:   { color: "#2874F0", glow: "rgba(40,116,240,0.3)" },
  Croma:      { color: "#9C27B0", glow: "rgba(156,39,176,0.3)" },
  Walmart:    { color: "#0071CE", glow: "rgba(0,113,206,0.3)" },
};
const getMeta = (name) => STORE_META[name] || { color: "#7FFFD4", glow: "rgba(127,255,212,0.3)" };

// ══════════════════════════════════════════════════════════════════════════════
// ── SVG ICON LIBRARY ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const Icon = ({ name, size = 20, color = "currentColor", style = {} }) => {
  const s = { width: size, height: size, display: "inline-block", flexShrink: 0, ...style };
  const paths = {
    // Hawk/eagle — custom brand mark
    hawk: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M12 3C8 3 4 6 4 10c0 2 1 4 2.5 5.5L3 21l4-1.5C8.5 20.5 10 21 12 21s3.5-.5 5-1.5L21 21l-3.5-5.5C19 14 20 12 20 10c0-4-4-7-8-7z"/>
        <path d="M9 10c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5"/>
        <circle cx="9.5" cy="10.5" r="1" fill={color} stroke="none"/>
        <circle cx="14.5" cy="10.5" r="1" fill={color} stroke="none"/>
      </svg>
    ),
    // Clean hawk silhouette
    hawkSilhouette: (
      <svg viewBox="0 0 32 32" fill="none" style={s}>
        <path d="M16 4C10.5 4 6 8 6 13c0 2.5 1 4.8 2.8 6.5L5 28l5.5-2C12 27 14 27.5 16 27.5s4-.5 5.5-1.5L27 28l-3.8-8.5C25 18 26 15.5 26 13c0-5-4.5-9-10-9z" fill={color} opacity="0.15"/>
        <path d="M16 4C10.5 4 6 8 6 13c0 2.5 1 4.8 2.8 6.5L5 28l5.5-2C12 27 14 27.5 16 27.5s4-.5 5.5-1.5L27 28l-3.8-8.5C25 18 26 15.5 26 13c0-5-4.5-9-10-9z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M12 18l4-2 4 2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="13" cy="12" r="1.2" fill={color}/>
        <circle cx="19" cy="12" r="1.2" fill={color}/>
      </svg>
    ),
    // Search / magnifier
    search: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <circle cx="11" cy="11" r="7"/>
        <path d="M16.5 16.5L21 21"/>
      </svg>
    ),
    // Crosshair / target — for "You Search"
    target: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
        <circle cx="12" cy="12" r="1" fill={color} stroke="none"/>
      </svg>
    ),
    // CPU / AI processor — for "AI Hunts"
    cpu: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <rect x="7" y="7" width="10" height="10" rx="1.5"/>
        <path d="M9 7V4M12 7V4M15 7V4M9 17v3M12 17v3M15 17v3M7 9H4M7 12H4M7 15H4M17 9h3M17 12h3M17 15h3"/>
        <circle cx="12" cy="12" r="1.5" fill={color} stroke="none"/>
      </svg>
    ),
    // Sparkles / AI magic — for Gemini
    sparkles: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 16.4l-6.2 4.5 2.4-7.2L2 9.2h7.6z"/>
        <path d="M5 3v3M3 5h3" strokeWidth="1.5"/>
        <path d="M19 17v2.5M17.8 18.2h2.5" strokeWidth="1.5"/>
      </svg>
    ),
    // Trophy / award — for "You Save"
    trophy: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 4H17l-1 7a5 5 0 0 1-8 0L7 4z"/>
        <path d="M7 4H4.5a1 1 0 0 0-1 1.1L4 7a4 4 0 0 0 3.5 3.5"/>
        <path d="M17 4h2.5a1 1 0 0 1 1 1.1L20 7a4 4 0 0 1-3.5 3.5"/>
        <path d="M9 21h6" strokeWidth="1.5"/>
      </svg>
    ),
    // Eye — for Vision-Only
    eye: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
        <circle cx="12" cy="12" r="3"/>
        <circle cx="12" cy="12" r="1" fill={color} stroke="none"/>
      </svg>
    ),
    // Zap / lightning — for Multi-Site Speed
    zap: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} fillOpacity="0.12"/>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    // Bar chart / trending — for Price History
    trendingUp: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    // Mail / send — for Export
    mail: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    // Cloud — for Google Cloud
    cloud: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
      </svg>
    ),
    // Shield check — for trust
    shieldCheck: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    // User circle — for profile
    user: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    // X / close
    x: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    // Arrow down
    arrowDown: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19 12 12 19 5 12"/>
      </svg>
    ),
    // Arrow right
    arrowRight: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
    ),
    // Check
    check: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    // Download
    download: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    // Send
    send: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
    // Diamond / best deal badge
    diamond: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M6 3h12l4 6-10 13L2 9z" fill={color} fillOpacity="0.15"/>
        <path d="M6 3h12l4 6-10 13L2 9z"/>
        <line x1="2" y1="9" x2="22" y2="9"/>
        <path d="M6 3l4 6M18 3l-4 6M2 9l10 13M22 9L12 22"/>
      </svg>
    ),
    // Star — top rated
    star: (
      <svg viewBox="0 0 24 24" fill={color} fillOpacity="0.9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    // Brain / AI analysis
    brain: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z"/>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"/>
      </svg>
    ),
    // Layers / multi-site
    layers: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" fill={color} fillOpacity="0.1"/>
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
    // Activity pulse
    activity: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    // Log out
    logOut: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    // Lock
    lock: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    // Infinite loop / spinning
    loader: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={{ ...s, animation: "rotate 1s linear infinite" }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    ),
    // Crosshair for scanning
    crosshair: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="22" y1="12" x2="18" y2="12"/>
        <line x1="6" y1="12" x2="2" y2="12"/>
        <line x1="12" y1="6" x2="12" y2="2"/>
        <line x1="12" y1="22" x2="12" y2="18"/>
        <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.2"/>
      </svg>
    ),
    // Filter
    filter: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    ),
    // Sort
    sortAsc: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M11 5h10M11 9h7M11 13h4"/>
        <polyline points="3 8 6 5 9 8"/>
        <line x1="6" y1="5" x2="6" y2="19"/>
      </svg>
    ),
  };
  return paths[name] || null;
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:     #030D0E;
    --deep:    #051518;
    --teal:    #062F35;
    --teal2:   #0A4048;
    --teal3:   #0E5560;
    --accent:  #7FFFD4;
    --accent2: #4DD9AC;
    --gold:    #C9A84C;
    --gold2:   #E8C97A;
    --border:  rgba(127,255,212,0.12);
    --border2: rgba(127,255,212,0.22);
    --text:    #D4EDE8;
    --muted:   #5E8A82;
    --muted2:  #8BB5AD;
    --serif:   'Playfair Display', serif;
    --sans:    'Outfit', sans-serif;
  }

  html, body { background: var(--ink); min-height: 100vh; font-family: var(--sans); color: var(--text); overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--deep); }
  ::-webkit-scrollbar-thumb { background: var(--teal3); border-radius: 2px; }
  ::selection { background: var(--accent); color: var(--ink); }
  input::placeholder { color: var(--muted); }

  @keyframes smokeFloat { 0%,100%{transform:translateY(0) scale(1);opacity:.4} 50%{transform:translateY(-30px) scale(1.05);opacity:.7} }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn  { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  @keyframes rotate   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ticker   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes popIn    { 0%{opacity:0;transform:scale(.94) translateY(10px)} 70%{transform:scale(1.01)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes pulseGlow{ 0%,100%{box-shadow:0 0 20px rgba(127,255,212,.15)} 50%{box-shadow:0 0 40px rgba(127,255,212,.35)} }
  @keyframes drawLine { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes floatBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

  .fade-up  { animation: fadeUp  0.6s cubic-bezier(.16,1,.3,1) forwards; }
  .fade-in  { animation: fadeIn  0.5s ease forwards; }
  .pop-in   { animation: popIn   0.5s cubic-bezier(.34,1.56,.64,1) forwards; }

  .glass {
    background: rgba(6,47,53,0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border);
  }

  .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; cursor: default; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,.5), 0 0 30px rgba(127,255,212,.07); }

  .btn-primary {
    background: linear-gradient(135deg, var(--accent2), var(--accent));
    border: none; color: var(--ink); font-family: var(--sans); font-weight: 700;
    letter-spacing: 0.06em; cursor: pointer; transition: all 0.25s ease;
    display: inline-flex; align-items: center; gap: 8px; justify-content: center;
  }
  .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(127,255,212,.35); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .icon-btn {
    background: transparent; border: none; cursor: pointer; display: inline-flex;
    align-items: center; justify-content: center; transition: opacity 0.2s;
  }
  .icon-btn:hover { opacity: 0.7; }
`;

// ── Background ─────────────────────────────────────────────────────────────
function SmokeBg() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 20% 40%,#062F3580 0%,transparent 70%),radial-gradient(ellipse 60% 80% at 80% 70%,#041F2460 0%,transparent 70%),radial-gradient(ellipse 100% 100% at 50% 50%,#030D0E 40%,#041820 100%)" }} />
      {[{w:700,h:500,l:"5%",t:"10%",delay:"0s",dur:"8s",color:"rgba(6,47,53,0.6)"},{w:500,h:600,l:"60%",t:"30%",delay:"3s",dur:"11s",color:"rgba(10,64,72,0.4)"},{w:600,h:400,l:"30%",t:"60%",delay:"1.5s",dur:"9s",color:"rgba(4,31,36,0.5)"},{w:400,h:500,l:"75%",t:"5%",delay:"4s",dur:"13s",color:"rgba(14,85,96,0.25)"}].map((b,i)=>(
        <div key={i} style={{ position:"absolute", left:b.l, top:b.t, width:b.w, height:b.h, background:`radial-gradient(ellipse at center,${b.color},transparent 70%)`, animation:`smokeFloat ${b.dur} ease-in-out ${b.delay} infinite`, filter:"blur(40px)" }} />
      ))}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center,transparent 40%,rgba(3,13,14,.85) 100%)" }} />
    </div>
  );
}

function ParticleCanvas() {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight, raf;
    const particles = Array.from({length:55},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.3,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,o:Math.random()*.45+.1}));
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(127,255,212,${p.o})`;ctx.fill();});
      for(let i=0;i<particles.length;i++)for(let j=i+1;j<particles.length;j++){const dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<115){ctx.beginPath();ctx.strokeStyle=`rgba(127,255,212,${.055*(1-d/115)})`;ctx.lineWidth=.5;ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.stroke();}}
      raf=requestAnimationFrame(draw);
    };
    draw();
    const resize=()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;};
    window.addEventListener("resize",resize);
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── LANDING PAGE ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function LandingPage({ onSignIn }) {
  const features = [
    { icon: "eye",        title: "Vision-Only AI",    desc: "Gemini 2.0 Flash reads product pages like a human. No retailer APIs, no brittle scrapers — pure multimodal intelligence." },
    { icon: "zap",        title: "Multi-Site Scan",   desc: "Amazon, Flipkart & Croma searched simultaneously via real browser sessions. Results in under 30 seconds." },
    { icon: "trophy",     title: "Smart Rankings",    desc: "Gemini compares every result and explains why one deal beats the rest. Best price AND best rated, always identified." },
    { icon: "trendingUp", title: "Price History",     desc: "Every search builds a price trend chart stored in Google Cloud Firestore. Know if today's price is actually a deal." },
    { icon: "mail",       title: "Export Anywhere",   desc: "Send results to your inbox or download a CSV. Your research, your format, your hands." },
    { icon: "cloud",      title: "Google Cloud",      desc: "Deployed on Cloud Run. Scales to zero, scales to thousands. Enterprise-grade infrastructure for every search." },
  ];

  const steps = [
    { step:"01", icon:"target",  title:"You search",  desc:"Type any product name. PriceHawk understands context — \"iPhone 15 128GB\" or just \"iPhone 15\"." },
    { step:"02", icon:"cpu",     title:"AI hunts",    desc:"Playwright opens real browser tabs. Gemini reads screenshots. No APIs, no scraping tricks — pure vision." },
    { step:"03", icon:"trophy",  title:"You save",    desc:"See ranked results with Best Deal and Top Rated badges. Export, email, or just buy right now." },
  ];

  return (
    <div style={{ position:"relative", zIndex:1, minHeight:"100vh", overflowX:"hidden" }}>

      {/* NAV */}
      <nav className="glass" style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 48px", borderTop:"none", borderLeft:"none", borderRight:"none", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,var(--teal2),var(--teal3))", border:"1px solid var(--border2)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(127,255,212,0.15)" }}>
            <Icon name="crosshair" size={20} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontFamily:"var(--serif)", fontSize:19, fontWeight:700, color:"var(--accent)", lineHeight:1 }}>PriceHawk</div>
            <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:"0.2em", fontWeight:500 }}>AI PRICE INTELLIGENCE</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontSize:11, color:"var(--muted2)", letterSpacing:"0.05em", display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="sparkles" size={13} color="var(--gold)" />
            Powered by Gemini 2.0 Flash
          </div>
          <button className="btn-primary" onClick={onSignIn} style={{ padding:"10px 24px", fontSize:13, borderRadius:10 }}>
            Sign In <Icon name="arrowRight" size={14} color="var(--ink)" />
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 24px 80px" }}>
        <div className="fade-up" style={{ animationDelay:"0.1s", opacity:0, marginBottom:28 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(127,255,212,0.06)", border:"1px solid var(--border2)", padding:"7px 20px", borderRadius:30 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--accent)", boxShadow:"0 0 8px var(--accent)", animation:"pulseGlow 2s ease infinite" }} />
            <span style={{ fontSize:11, letterSpacing:"0.2em", color:"var(--accent2)", fontWeight:500 }}>AI-POWERED · VISION-ONLY · REAL-TIME · GOOGLE CLOUD</span>
          </div>
        </div>

        <div className="fade-up" style={{ animationDelay:"0.2s", opacity:0, marginBottom:24 }}>
          <h1 style={{ fontFamily:"var(--serif)", fontSize:"clamp(44px,7.5vw,96px)", fontWeight:900, lineHeight:1.02, letterSpacing:"-0.02em", maxWidth:900 }}>
            <span style={{ color:"var(--text)" }}>Stop overpaying.</span><br/>
            <span style={{ color:"transparent", backgroundClip:"text", WebkitBackgroundClip:"text", backgroundImage:"linear-gradient(135deg,var(--accent) 0%,var(--gold2) 100%)", filter:"drop-shadow(0 0 40px rgba(127,255,212,0.25))" }}>
              Let AI hunt for you.
            </span>
          </h1>
        </div>

        <div className="fade-up" style={{ animationDelay:"0.3s", opacity:0, marginBottom:48 }}>
          <p style={{ fontSize:"clamp(15px,2vw,19px)", color:"var(--muted2)", maxWidth:600, lineHeight:1.75, fontWeight:300 }}>
            PriceHawk uses Gemini's vision to read Amazon, Flipkart, and Croma like a human would — no APIs, no guessing — and finds you the best deal in real time.
          </p>
        </div>

        <div className="fade-up" style={{ animationDelay:"0.4s", opacity:0, display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center" }}>
          <button className="btn-primary" onClick={onSignIn} style={{ padding:"16px 44px", fontSize:16, borderRadius:14, boxShadow:"0 0 40px rgba(127,255,212,0.2)" }}>
            Get Started — It's Free <Icon name="arrowRight" size={17} color="var(--ink)" />
          </button>
          <button onClick={onSignIn} style={{ padding:"16px 30px", fontSize:15, borderRadius:14, background:"transparent", border:"1px solid var(--border2)", color:"var(--muted2)", cursor:"pointer", fontFamily:"var(--sans)", transition:"all 0.2s", display:"flex", alignItems:"center", gap:8 }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.color="var(--accent)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--muted2)";}}>
            <Icon name="eye" size={16} color="currentColor" /> Watch Demo
          </button>
        </div>

        <div className="fade-in" style={{ animationDelay:"0.6s", opacity:0, marginTop:64, display:"flex", gap:28, flexWrap:"wrap", justifyContent:"center" }}>
          {[{icon:"shieldCheck",label:"No API keys needed"},{icon:"zap",label:"Results in 30s"},{icon:"cloud",label:"Google Cloud Run"},{icon:"lock",label:"Secure by default"}].map(b=>(
            <div key={b.label} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"var(--muted)" }}>
              <Icon name={b.icon} size={14} color="var(--accent)" style={{opacity:0.7}} />
              {b.label}
            </div>
          ))}
        </div>

        <div style={{ marginTop:80, display:"flex", flexDirection:"column", alignItems:"center", gap:6, animation:"fadeIn 1s 1s ease forwards", opacity:0 }}>
          <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:"0.2em" }}>SCROLL TO EXPLORE</div>
          <div style={{ animation:"floatBob 1.8s ease-in-out infinite" }}>
            <Icon name="arrowDown" size={18} color="var(--muted)" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:"100px 24px", maxWidth:1000, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:60 }}>
          <div style={{ fontSize:11, letterSpacing:"0.25em", color:"var(--accent2)", fontWeight:600, marginBottom:16 }}>HOW IT WORKS</div>
          <h2 style={{ fontFamily:"var(--serif)", fontSize:"clamp(28px,4vw,48px)", fontWeight:700, color:"var(--text)", lineHeight:1.1 }}>Three steps to the best deal</h2>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24, position:"relative" }}>
          <div style={{ position:"absolute", top:44, left:"17%", right:"17%", height:1, background:"linear-gradient(90deg,transparent,var(--accent),transparent)", opacity:0.15 }} />
          {steps.map((item,i)=>(
            <div key={i} className="glass card-hover" style={{ borderRadius:16, padding:"32px 24px", textAlign:"center" }}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(127,255,212,0.08)", border:"1px solid var(--border2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <Icon name={item.icon} size={26} color="var(--accent)" />
              </div>
              <div style={{ fontSize:10, color:"var(--gold)", letterSpacing:"0.2em", fontWeight:700, marginBottom:8 }}>STEP {item.step}</div>
              <h3 style={{ fontFamily:"var(--serif)", fontSize:20, fontWeight:700, color:"var(--accent)", marginBottom:12 }}>{item.title}</h3>
              <p style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:"80px 24px 100px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:60 }}>
          <div style={{ fontSize:11, letterSpacing:"0.25em", color:"var(--accent2)", fontWeight:600, marginBottom:16 }}>FEATURES</div>
          <h2 style={{ fontFamily:"var(--serif)", fontSize:"clamp(28px,4vw,48px)", fontWeight:700, color:"var(--text)", lineHeight:1.1 }}>
            Everything you need.<br/><span style={{ color:"var(--muted2)", fontWeight:400 }}>Nothing you don't.</span>
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
          {features.map((f,i)=>(
            <div key={i} className="glass card-hover" style={{ borderRadius:14, padding:"28px 24px" }}>
              <div style={{ width:48, height:48, borderRadius:12, background:"rgba(127,255,212,0.08)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <Icon name={f.icon} size={22} color="var(--accent)" />
              </div>
              <h3 style={{ fontFamily:"var(--serif)", fontSize:18, fontWeight:600, color:"var(--accent)", marginBottom:10 }}>{f.title}</h3>
              <p style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.75 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"80px 24px 120px", textAlign:"center" }}>
        <div className="glass" style={{ maxWidth:700, margin:"0 auto", borderRadius:24, padding:"64px 48px", borderColor:"rgba(127,255,212,0.2)", boxShadow:"0 0 80px rgba(127,255,212,0.05)" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,var(--teal2),var(--teal3))", border:"1px solid var(--border2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", boxShadow:"0 0 30px rgba(127,255,212,0.15)" }}>
            <Icon name="crosshair" size={28} color="var(--accent)" />
          </div>
          <h2 style={{ fontFamily:"var(--serif)", fontSize:"clamp(28px,4vw,44px)", fontWeight:800, color:"var(--text)", lineHeight:1.1, marginBottom:16 }}>Ready to hunt smarter?</h2>
          <p style={{ fontSize:15, color:"var(--muted2)", marginBottom:36, lineHeight:1.7 }}>Join PriceHawk and let Gemini do the comparison shopping for you. Free to use. No credit card required.</p>
          <button className="btn-primary" onClick={onSignIn} style={{ padding:"18px 52px", fontSize:16, borderRadius:14, boxShadow:"0 0 50px rgba(127,255,212,0.25)" }}>
            Sign In & Start Hunting <Icon name="arrowRight" size={17} color="var(--ink)" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid var(--border)", padding:"32px 48px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Icon name="crosshair" size={18} color="var(--accent)" />
          <span style={{ fontFamily:"var(--serif)", fontSize:16, fontWeight:700, color:"var(--accent)" }}>PriceHawk</span>
          <span style={{ fontSize:11, color:"var(--muted)", marginLeft:8 }}>AI Price Intelligence</span>
        </div>
        <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:"0.1em" }}>Built with Gemini 2.0 Flash · Google Cloud · Google GenAI SDK</div>
      </footer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SIGN IN MODAL ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function SignInModal({ onClose, onSuccess }) {
  const [mode,setMode]=useState("signin");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const handleSubmit=()=>{
    if(!email||!password){setError("Please fill in all fields.");return;}
    if(mode==="signup"&&!name){setError("Please enter your name.");return;}
    setLoading(true);setError("");
    setTimeout(()=>{
      setLoading(false);
      const user={name:name||email.split("@")[0],email};
      localStorage.setItem("ph_user",JSON.stringify(user));
      onSuccess(user);
    },1200);
  };

  const inputStyle = {width:"100%",background:"rgba(6,47,53,0.6)",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text)",padding:"13px 16px 13px 42px",fontSize:14,outline:"none",fontFamily:"var(--sans)",transition:"border-color 0.2s"};

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24, background:"rgba(3,13,14,0.88)", backdropFilter:"blur(16px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="glass pop-in" style={{ width:"100%", maxWidth:440, borderRadius:24, padding:"48px 40px", borderColor:"rgba(127,255,212,0.25)", boxShadow:"0 40px 120px rgba(0,0,0,0.6),0 0 60px rgba(127,255,212,0.06)", position:"relative" }}>

        {/* Close */}
        <button className="icon-btn" onClick={onClose} style={{ position:"absolute", top:18, right:18, padding:6, borderRadius:8, background:"rgba(127,255,212,0.06)", border:"1px solid var(--border)" }}>
          <Icon name="x" size={16} color="var(--muted)" />
        </button>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,var(--teal2),var(--teal3))", border:"1px solid var(--border2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 0 24px rgba(127,255,212,0.15)" }}>
            <Icon name="crosshair" size={26} color="var(--accent)" />
          </div>
          <h2 style={{ fontFamily:"var(--serif)", fontSize:28, fontWeight:800, color:"var(--accent)", marginBottom:6 }}>
            {mode==="signin"?"Welcome back":"Create account"}
          </h2>
          <p style={{ fontSize:13, color:"var(--muted2)" }}>
            {mode==="signin"?"Sign in to access PriceHawk":"Start hunting smarter prices today"}
          </p>
        </div>

        {/* Toggle */}
        <div style={{ display:"flex", background:"rgba(6,47,53,0.5)", borderRadius:10, padding:4, marginBottom:28 }}>
          {["signin","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:13, fontWeight:mode===m?600:400, transition:"all 0.2s", background:mode===m?"rgba(127,255,212,0.12)":"transparent", color:mode===m?"var(--accent)":"var(--muted2)" }}>
              {m==="signin"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:24 }}>
          {mode==="signup" && (
            <div style={{ position:"relative" }}>
              <label style={{ fontSize:11, color:"var(--muted2)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>YOUR NAME</label>
              <div style={{ position:"absolute", left:14, bottom:14 }}><Icon name="user" size={15} color="var(--muted)" /></div>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inputStyle} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
            </div>
          )}
          <div style={{ position:"relative" }}>
            <label style={{ fontSize:11, color:"var(--muted2)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>EMAIL ADDRESS</label>
            <div style={{ position:"absolute", left:14, bottom:14 }}><Icon name="mail" size={15} color="var(--muted)" /></div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border2)"} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          </div>
          <div style={{ position:"relative" }}>
            <label style={{ fontSize:11, color:"var(--muted2)", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>PASSWORD</label>
            <div style={{ position:"absolute", left:14, bottom:14 }}><Icon name="lock" size={15} color="var(--muted)" /></div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border2)"} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          </div>
        </div>

        {error&&<div style={{ background:"rgba(251,113,133,0.1)", border:"1px solid rgba(251,113,133,0.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#FB7185", marginBottom:16 }}>{error}</div>}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:"15px 0", fontSize:15, borderRadius:12, marginBottom:20 }}>
          {loading ? <><Icon name="loader" size={16} color="var(--ink)" /> {mode==="signin"?"Signing in...":"Creating account..."}</> : <>{mode==="signin"?"Sign In":"Create Account"} <Icon name="arrowRight" size={16} color="var(--ink)" /></>}
        </button>

        <p style={{ textAlign:"center", fontSize:12, color:"var(--muted)", lineHeight:1.6 }}>
          By continuing you agree to our Terms of Service.<br/>
          <span style={{ color:"var(--muted2)" }}>No credit card required. Free forever.</span>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── DASHBOARD ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function Ticker({ products }) {
  const text = products.length>0 ? products.map(p=>`${p.source.toUpperCase()}  ·  ${p.title?.slice(0,40)}  ·  ${formatPrice(p.price,p.currency)}`).join("     //     ") : "PRICEHAWK INTELLIGENCE  ·  GEMINI 2.0 FLASH VISION  ·  REAL-TIME MULTISITE SCANNING  ·  GOOGLE CLOUD POWERED";
  const doubled = text+"     //     "+text;
  return (
    <div style={{ background:"rgba(6,47,53,0.9)", borderBottom:"1px solid var(--border)", height:30, overflow:"hidden", display:"flex", alignItems:"center", position:"relative", zIndex:50 }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:80, background:"linear-gradient(90deg,rgba(3,13,14,1),transparent)", zIndex:2 }} />
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:80, background:"linear-gradient(-90deg,rgba(3,13,14,1),transparent)", zIndex:2 }} />
      <div style={{ display:"flex", whiteSpace:"nowrap", animation:"ticker 35s linear infinite", fontSize:10, letterSpacing:"0.18em", color:"var(--accent2)", opacity:0.7, fontWeight:500 }}>
        <span style={{ paddingRight:60 }}>{doubled}</span>
      </div>
    </div>
  );
}

function DashboardHeader({ user, onSignOut, productCount, storeCount }) {
  const [time,setTime]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);
  return (
    <header className="glass" style={{ position:"sticky", top:0, zIndex:100, borderTop:"none", borderLeft:"none", borderRight:"none", borderBottom:"1px solid var(--border)", padding:"0 40px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,var(--teal2),var(--teal3))", border:"1px solid var(--border2)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 18px rgba(127,255,212,0.15)" }}>
          <Icon name="crosshair" size={18} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontFamily:"var(--serif)", fontSize:19, fontWeight:700, color:"var(--accent)", lineHeight:1 }}>PriceHawk</div>
          <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:"0.2em" }}>AI PRICE INTELLIGENCE</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {productCount>0&&(<>
          <div style={{ background:"rgba(127,255,212,0.08)", border:"1px solid var(--border2)", padding:"5px 12px", borderRadius:20, fontSize:11, color:"var(--accent2)", display:"flex", alignItems:"center", gap:5 }}>
            <Icon name="layers" size={12} color="var(--accent2)" />{storeCount} sources
          </div>
          <div style={{ background:"rgba(127,255,212,0.08)", border:"1px solid var(--border2)", padding:"5px 12px", borderRadius:20, fontSize:11, color:"var(--accent2)", display:"flex", alignItems:"center", gap:5 }}>
            <Icon name="activity" size={12} color="var(--accent2)" />{productCount} results
          </div>
        </>)}
        <div style={{ background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.25)", padding:"5px 12px", borderRadius:20, fontSize:11, color:"var(--gold)", display:"flex", alignItems:"center", gap:5 }}>
          <Icon name="sparkles" size={12} color="var(--gold)" />Gemini 2.0 Flash
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ fontSize:12, color:"var(--muted2)", letterSpacing:"0.06em" }}>{time.toLocaleTimeString("en-US",{hour12:false})}</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,var(--accent2),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="user" size={16} color="var(--ink)" />
          </div>
          <div>
            <div style={{ fontSize:12, color:"var(--text)", fontWeight:500, lineHeight:1 }}>{user?.name||"User"}</div>
            <button onClick={onSignOut} style={{ background:"none", border:"none", fontSize:10, color:"var(--muted)", cursor:"pointer", padding:0, fontFamily:"var(--sans)", display:"flex", alignItems:"center", gap:4, marginTop:2 }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--accent)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}>
              <Icon name="logOut" size={10} color="currentColor" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ProductCard({ product, rank, isBest, isTopRated, idx }) {
  const meta = getMeta(product.source);
  return (
    <div className="glass card-hover pop-in" style={{ borderRadius:14, padding:20, position:"relative", borderColor:isBest?"rgba(127,255,212,0.35)":isTopRated?"rgba(74,222,128,0.3)":"var(--border)", boxShadow:isBest?"0 0 30px rgba(127,255,212,0.07)":"none", animationDelay:`${idx*0.045}s`, opacity:0, animationFillMode:"forwards" }}>
      <div style={{ position:"absolute", top:14, right:14, width:26, height:26, borderRadius:6, background:"rgba(127,255,212,0.06)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"var(--muted)", fontWeight:600 }}>{rank}</div>

      {(isBest||isTopRated)&&(
        <div style={{ position:"absolute", top:-10, left:16, background:isBest?"linear-gradient(135deg,var(--accent2),var(--accent))":"linear-gradient(135deg,#4ADE80,#22C55E)", color:"var(--ink)", fontSize:9, fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:"0.12em", display:"flex", alignItems:"center", gap:5, boxShadow:isBest?"0 4px 12px rgba(127,255,212,0.3)":"0 4px 12px rgba(74,222,128,0.3)" }}>
          {isBest?<><Icon name="diamond" size={9} color="var(--ink)" /> BEST DEAL</>:<><Icon name="star" size={9} color="var(--ink)" /> TOP RATED</>}
        </div>
      )}

      <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:14, marginTop:(isBest||isTopRated)?6:0, background:`${meta.color}12`, border:`1px solid ${meta.color}30`, padding:"4px 10px", borderRadius:20 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:meta.color, boxShadow:`0 0 6px ${meta.glow}` }} />
        <span style={{ fontSize:10, color:meta.color, letterSpacing:"0.1em", fontWeight:600 }}>{product.source.toUpperCase()}</span>
      </div>

      <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.55, marginBottom:16, minHeight:40, fontWeight:400 }}>{product.title?.slice(0,82)}{product.title?.length>82?"…":""}</p>
      <div style={{ height:1, background:"var(--border)", marginBottom:16 }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:"0.1em", marginBottom:4 }}>PRICE</div>
          <div style={{ fontFamily:"var(--serif)", fontSize:24, fontWeight:700, color:isBest?"var(--accent)":"var(--text)", textShadow:isBest?"0 0 20px rgba(127,255,212,0.25)":"none" }}>{formatPrice(product.price,product.currency)}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          {product.rating&&(
            <>
              <div style={{ display:"flex", gap:2, justifyContent:"flex-end" }}>
                {[1,2,3,4,5].map(n=><div key={n} style={{ width:10, height:10, background:n<=Math.round(product.rating)?"var(--gold)":"var(--teal2)", borderRadius:2, boxShadow:n<=Math.round(product.rating)?"0 0 4px rgba(201,168,76,0.4)":"none" }} />)}
              </div>
              <div style={{ fontSize:11, color:"var(--muted2)", marginTop:3 }}>{product.rating?.toFixed(1)}{product.reviewCount?` · ${Number(product.reviewCount).toLocaleString()}`:""}</div>
            </>
          )}
          {product.availability==="in stock"&&<div style={{ fontSize:10, color:"#4ADE80", marginTop:4, display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}><div style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80" }} />In Stock</div>}
        </div>
      </div>
    </div>
  );
}

function AnalysisBanner({ analysis, products }) {
  if (!analysis?.summary) return null;
  return (
    <div className="pop-in glass" style={{ borderRadius:16, padding:"28px 32px", marginBottom:24, borderColor:"rgba(127,255,212,0.2)" }}>
      <div style={{ display:"flex", gap:24, flexWrap:"wrap", alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,rgba(127,255,212,0.15),rgba(201,168,76,0.1))", border:"1px solid rgba(127,255,212,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="brain" size={17} color="var(--accent)" />
            </div>
            <div style={{ fontSize:10, letterSpacing:"0.2em", color:"var(--accent2)", fontWeight:600 }}>GEMINI ANALYSIS</div>
          </div>
          <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.8, marginBottom:8 }}>{analysis.summary}</p>
          {analysis.recommendation&&<p style={{ fontSize:12, color:"var(--muted2)", fontStyle:"italic" }}>💡 {analysis.recommendation}</p>}
        </div>
        {analysis.priceRange&&(
          <div style={{ display:"flex", gap:20, flexShrink:0 }}>
            {[{label:"Lowest",val:formatPrice(analysis.priceRange.min, analysis.currency || products[0]?.currency || "INR"),color:"#4ADE80"},
  {label:"Average",val:formatPrice(analysis.priceRange.average, analysis.currency || products[0]?.currency || "INR"),color:"var(--accent)"},
  {label:"Highest",val:formatPrice(analysis.priceRange.max, analysis.currency || products[0]?.currency || "INR"),color:"#FB7185"}].map(({label,val,color})=>(
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:"0.1em", marginBottom:4 }}>{label.toUpperCase()}</div>
                <div style={{ fontFamily:"var(--serif)", fontSize:20, fontWeight:700, color }}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {analysis.insights?.length>0&&(
        <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)", display:"flex", gap:8, flexWrap:"wrap" }}>
          {analysis.insights.map((ins,i)=><span key={i} style={{ background:"rgba(127,255,212,0.06)", border:"1px solid var(--border)", color:"var(--muted2)", padding:"4px 12px", borderRadius:20, fontSize:11 }}>{ins}</span>)}
        </div>
      )}
    </div>
  );
}

function PriceChart({ history, query }) {
  if (!history||!Object.keys(history).length) return (
    <div style={{ padding:"60px 0", textAlign:"center" }}>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:12, opacity:0.2 }}><Icon name="trendingUp" size={40} color="var(--accent)" /></div>
      <div style={{ fontSize:13, color:"var(--muted)" }}>No price history yet for "{query}"</div>
      <div style={{ fontSize:11, color:"var(--muted)", marginTop:6, opacity:0.6 }}>History builds up over multiple searches</div>
    </div>
  );
  const sources=Object.keys(history);
  const all=sources.flatMap(s=>history[s].map(p=>p.price)).filter(Boolean);
  const minP=Math.min(...all),maxP=Math.max(...all),range=maxP-minP||1;
  const W=700,H=220,PX=55,PY=24,cW=W-PX*2,cH=H-PY*2;
  const colors=["#7FFFD4","#C9A84C","#4ADE80","#FB7185","#A78BFA"];
  const getPath=pts=>pts?.map((p,i)=>{const x=PX+(i/Math.max(pts.length-1,1))*cW;const y=PY+cH-((p.price-minP)/range)*cH;return`${i===0?"M":"L"} ${x.toFixed(1)} ${y.toFixed(1)}`;}).join(" ")||"";
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {[0,.25,.5,.75,1].map(t=>(<g key={t}><line x1={PX} y1={PY+cH*(1-t)} x2={W-PX} y2={PY+cH*(1-t)} stroke="rgba(127,255,212,0.08)" strokeWidth="1" strokeDasharray="4,4"/><text x={PX-8} y={PY+cH*(1-t)+4} textAnchor="end" fill="var(--muted)" fontSize="9" fontFamily="var(--sans)">${Math.round(minP+t*range)}</text></g>))}
        {sources.map((src,i)=><path key={src} d={getPath(history[src])} fill="none" stroke={colors[i%colors.length]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:`drawLine 1.2s ease ${i*0.2}s both`,strokeDasharray:1000}}/>)}
        {sources.map((src,i)=>history[src].map((p,j)=>{const x=PX+(j/Math.max(history[src].length-1,1))*cW;const y=PY+cH-((p.price-minP)/range)*cH;return<circle key={`${src}-${j}`} cx={x} cy={y} r="4" fill={colors[i%colors.length]} stroke="var(--deep)" strokeWidth="2"/>;}))}
      </svg>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:8}}>{sources.map((src,i)=><div key={src} style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:"var(--muted2)"}}><div style={{width:20,height:2.5,background:colors[i%colors.length],borderRadius:2}}/>{src}</div>)}</div>
    </div>
  );
}

function ExportPanel({ query, products, analysis }) {
  const [email,setEmail]=useState(""),  [status,setStatus]=useState("idle");
  const sendEmail=async()=>{if(!email)return;setStatus("sending");try{const r=await fetch(`${API_BASE}/api/export/email`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,query,products,analysis})});setStatus(r.ok?"sent":"error");}catch{setStatus("error");}};
  const downloadCSV=async()=>{const r=await fetch(`${API_BASE}/api/export/csv`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({products,query})});const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`pricehawk_${query?.replace(/\s+/g,"_")}.csv`;a.click();};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <p style={{fontSize:13,color:"var(--muted2)",lineHeight:1.7}}>Export your {products.length} results as a CSV or receive them by email.</p>
      <button onClick={downloadCSV} style={{background:"rgba(127,255,212,0.08)",border:"1px solid var(--border2)",color:"var(--accent)",padding:"14px 20px",fontSize:13,borderRadius:10,cursor:"pointer",textAlign:"left",fontFamily:"var(--sans)",transition:"all 0.15s",display:"flex",alignItems:"center",gap:10}}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(127,255,212,0.14)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(127,255,212,0.08)";}}>
        <Icon name="download" size={16} color="var(--accent)" /> Download CSV <span style={{color:"var(--muted)",marginLeft:4}}>({products.length} records)</span>
      </button>
      <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"1px solid var(--border2)"}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendEmail()} placeholder="your@email.com" style={{flex:1,background:"rgba(6,47,53,0.6)",border:"none",color:"var(--text)",padding:"14px 16px",fontSize:13,outline:"none",fontFamily:"var(--sans)"}}/>
        <button onClick={sendEmail} disabled={!email||status==="sending"||status==="sent"} className="btn-primary" style={{padding:"0 20px",fontSize:12,borderRadius:0,letterSpacing:"0.06em",opacity:!email?0.4:1,gap:6}}>
          {status==="sent"?<><Icon name="check" size={14} color="var(--ink)"/> Sent</>:status==="sending"?<Icon name="loader" size={14} color="var(--ink)"/>:<><Icon name="send" size={13} color="var(--ink)"/> Send</>}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ user, onSignOut }) {
  const [query,setQuery]=useState(""),  [jobId,setJobId]=useState(null),  [job,setJob]=useState(null);
  const [tab,setTab]=useState("results"),  [filter,setFilter]=useState("All"),  [sort,setSort]=useState("price");
  const [history,setHistory]=useState(null);
  const pollRef=useRef(null);

  const products=job?.products||[];
  const analysis=job?.analysis||{};
  const isLoading=["running","browsing","analyzing","saving"].includes(job?.status);

  const startSearch=async()=>{
    if(!query.trim()||isLoading)return;
    setJob(null);setHistory(null);setTab("results");setFilter("All");
    try{
      const r=await fetch(`${API_BASE}/api/search`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:query.trim()})});
      const data=await r.json();
      if(data.jobId){setJobId(data.jobId);setJob({status:"running",progress:5,message:"Initializing agent...",query:query.trim()});}
    }catch{setJob({status:"error",error:"Cannot reach API. Make sure backend is running on port 8080."});}
  };

  useEffect(()=>{
    if(!jobId)return;
    pollRef.current=setInterval(async()=>{
      try{const r=await fetch(`${API_BASE}/api/search/${jobId}`);const data=await r.json();setJob(data);
        if(data.status==="done"||data.status==="error"){clearInterval(pollRef.current);
          if(data.status==="done")fetch(`${API_BASE}/api/history?query=${encodeURIComponent(query)}`).then(r=>r.json()).then(d=>setHistory(d.history)).catch(()=>{});}
      }catch{}},1500);
    return()=>clearInterval(pollRef.current);
  },[jobId]);

  const stores=["All",...new Set(products.map(p=>p.source))];
  const filtered=products.filter(p=>filter==="All"||p.source===filter).sort((a,b)=>sort==="price"?(a.price||999999)-(b.price||999999):sort==="rating"?(b.rating||0)-(a.rating||0):(a.source||"").localeCompare(b.source||""));
  const stages=[{key:"running",label:"Initializing"},{key:"browsing",label:"Browsing sites"},{key:"analyzing",label:"AI analysis"},{key:"saving",label:"Saving"}];
  const curStage=stages.findIndex(s=>s.key===job?.status);

  return (
    <div style={{position:"relative",zIndex:1,minHeight:"100vh"}}>
      <Ticker products={products}/>
      <DashboardHeader user={user} onSignOut={onSignOut} productCount={products.length} storeCount={new Set(products.map(p=>p.source)).size}/>

      <main style={{maxWidth:1100,margin:"0 auto",padding:"0 24px 100px"}}>
        {/* Search */}
        <div style={{maxWidth:860,margin:"0 auto",padding:"48px 0 0"}}>
          {!job&&(
            <div className="fade-up" style={{textAlign:"center",marginBottom:36,animationDelay:"0.1s",opacity:0}}>
              <h1 style={{fontFamily:"var(--serif)",fontSize:"clamp(32px,5vw,56px)",fontWeight:800,lineHeight:1.08,letterSpacing:"-0.01em"}}>
                <span style={{color:"var(--text)"}}>Hello, {user?.name?.split(" ")[0]||"Hunter"}.</span><br/>
                <span style={{color:"transparent",backgroundClip:"text",WebkitBackgroundClip:"text",backgroundImage:"linear-gradient(135deg,var(--accent) 0%,var(--gold2) 100%)"}}>What are you hunting today?</span>
              </h1>
            </div>
          )}

          <div className="fade-up" style={{animationDelay:"0.2s",opacity:0}}>
            <div style={{display:"flex",background:"rgba(6,47,53,0.7)",border:"1px solid var(--border2)",borderRadius:14,backdropFilter:"blur(20px)",overflow:"hidden",transition:"box-shadow 0.3s",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}
              onFocusCapture={e=>e.currentTarget.style.boxShadow="0 20px 60px rgba(0,0,0,0.4),0 0 0 1px rgba(127,255,212,0.2)"}
              onBlurCapture={e=>e.currentTarget.style.boxShadow="0 20px 60px rgba(0,0,0,0.4)"}>
              <div style={{padding:"0 20px",display:"flex",alignItems:"center"}}>
                <Icon name="search" size={18} color="var(--muted)" />
              </div>
              <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&startSearch()} disabled={isLoading} placeholder="Search any product — iPhone 15, Sony WH-1000XM5..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:"var(--text)",fontSize:15,padding:"20px 8px",fontFamily:"var(--sans)",fontWeight:400}}/>
              <button className="btn-primary" onClick={startSearch} disabled={isLoading||!query.trim()} style={{padding:"0 28px",fontSize:14,borderRadius:0,margin:6,borderRadius:8,minWidth:140,height:44}}>
                {isLoading?<><Icon name="loader" size={15} color="var(--ink)"/> Scanning</>:<>Hunt Prices <Icon name="arrowRight" size={15} color="var(--ink)"/></>}
              </button>
            </div>

            {!job&&(
              <div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
                <span style={{fontSize:11,color:"var(--muted)",alignSelf:"center"}}>Try:</span>
                {["iPhone 15","Sony WH-1000XM5","MacBook Air M3","Samsung S24"].map(s=>(
                  <button key={s} onClick={()=>setQuery(s)} style={{background:"rgba(127,255,212,0.04)",border:"1px solid var(--border)",color:"var(--muted2)",fontSize:11,padding:"5px 14px",borderRadius:20,cursor:"pointer",fontFamily:"var(--sans)",transition:"all 0.2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.color="var(--accent)";e.currentTarget.style.background="rgba(127,255,212,0.08)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted2)";e.currentTarget.style.background="rgba(127,255,212,0.04)";}}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading&&(
          <div style={{maxWidth:680,margin:"48px auto"}} className="fade-up">
            <div className="glass" style={{borderRadius:20,padding:40,textAlign:"center"}}>
              <div style={{position:"relative",width:72,height:72,margin:"0 auto 28px"}}>
                <div style={{width:72,height:72,borderRadius:"50%",background:"radial-gradient(circle,rgba(127,255,212,0.2) 0%,transparent 70%)",border:"1px solid rgba(127,255,212,0.3)",animation:"pulseGlow 1.5s ease-in-out infinite"}}/>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:38,height:38,borderRadius:"50%",border:"2px solid var(--accent)",borderTopColor:"transparent",animation:"rotate 1s linear infinite"}}/>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",display:"flex"}}>
                  <Icon name="crosshair" size={18} color="var(--accent)" />
                </div>
              </div>
              <h3 style={{fontFamily:"var(--serif)",fontSize:22,fontWeight:700,color:"var(--accent)",marginBottom:6}}>{job?.message||"Scanning..."}</h3>
              <p style={{fontSize:13,color:"var(--muted2)",marginBottom:28}}>Hunting for <em style={{color:"var(--text)"}}>{job?.query}</em></p>
              <div style={{marginBottom:28}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginBottom:8}}><span>Progress</span><span style={{color:"var(--accent)",fontWeight:600}}>{job?.progress||5}%</span></div>
                <div style={{height:3,background:"rgba(127,255,212,0.1)",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${job?.progress||5}%`,background:"linear-gradient(90deg,var(--accent2),var(--accent))",transition:"width 0.6s ease",boxShadow:"0 0 12px rgba(127,255,212,0.5)",borderRadius:2}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                {stages.map((s,i)=>{const done=i<curStage,active=i===curStage;return(
                  <div key={s.key} style={{flex:1,padding:"10px 8px",background:active?"rgba(127,255,212,0.08)":done?"rgba(127,255,212,0.04)":"transparent",border:`1px solid ${active?"rgba(127,255,212,0.4)":done?"rgba(127,255,212,0.15)":"var(--border)"}`,borderRadius:8}}>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:6}}>
                      {done?<Icon name="check" size={14} color="var(--accent)"/>:active?<Icon name="activity" size={14} color="var(--accent)" style={{animation:"blink 0.8s infinite"}}/>:<Icon name="crosshair" size={14} color="var(--muted)" style={{opacity:0.3}}/>}
                    </div>
                    <div style={{fontSize:9,color:active?"var(--accent)":done?"var(--muted2)":"var(--muted)",letterSpacing:"0.05em",lineHeight:1.4}}>{s.label}</div>
                  </div>
                );})}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {job?.status==="error"&&(
          <div style={{maxWidth:680,margin:"32px auto"}} className="fade-up">
            <div className="glass" style={{borderRadius:14,padding:28,borderColor:"rgba(251,113,133,0.3)"}}>
              <div style={{fontSize:12,color:"#FB7185",letterSpacing:"0.1em",marginBottom:8,fontWeight:600}}>SEARCH FAILED</div>
              <div style={{color:"var(--muted2)",fontSize:13}}>{job.error}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {job?.status==="done"&&(
          <div style={{marginTop:40}} className="fade-up">
            <AnalysisBanner analysis={analysis} products={products}/>

            {/* Tabs */}
            <div style={{display:"flex",borderBottom:"1px solid var(--border)",marginBottom:24}}>
              {[["results",`Results (${products.length})`],["history","Price History"],["export","Export"]].map(([id,label])=>(
                <button key={id} onClick={()=>setTab(id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${tab===id?"var(--accent)":"transparent"}`,color:tab===id?"var(--accent)":"var(--muted)",padding:"12px 22px",cursor:"pointer",fontSize:13,fontWeight:tab===id?600:400,letterSpacing:"0.03em",transition:"all 0.15s",marginBottom:-1,fontFamily:"var(--sans)"}}>
                  {label}
                </button>
              ))}
            </div>

            {tab==="results"&&(
              <>
                <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    <Icon name="filter" size={13} color="var(--muted)" style={{marginRight:4}}/>
                    {stores.map(s=>{const active=filter===s;const meta=s==="All"?{color:"var(--accent)"}:getMeta(s);return(
                      <button key={s} onClick={()=>setFilter(s)} style={{background:active?`${meta.color}14`:"transparent",border:`1px solid ${active?meta.color:"var(--border)"}`,color:active?meta.color:"var(--muted2)",padding:"5px 14px",cursor:"pointer",fontSize:11,borderRadius:20,fontFamily:"var(--sans)",transition:"all 0.15s",fontWeight:active?600:400}}>{s}</button>
                    );})}
                  </div>
                  <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center"}}>
                    <Icon name="sortAsc" size={13} color="var(--muted)" style={{marginRight:4}}/>
                    {[["price","Price ↑"],["rating","Rating ↓"],["store","Store"]].map(([val,label])=>(
                      <button key={val} onClick={()=>setSort(val)} style={{background:sort===val?"rgba(127,255,212,0.08)":"transparent",border:`1px solid ${sort===val?"var(--border2)":"transparent"}`,color:sort===val?"var(--accent)":"var(--muted)",padding:"5px 12px",cursor:"pointer",fontSize:11,borderRadius:20,fontFamily:"var(--sans)",transition:"all 0.15s"}}>{label}</button>
                    ))}
                  </div>
                </div>
                {filtered.length>0?(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
                    {filtered.map((p,i)=><ProductCard key={i} product={p} rank={i+1} idx={i} isBest={analysis.bestDeal?.title===p.title&&analysis.bestDeal?.source===p.source} isTopRated={analysis.bestRated?.title===p.title&&analysis.bestRated?.source===p.source}/>)}
                  </div>
                ):(
                  <div style={{textAlign:"center",padding:"60px 0",color:"var(--muted)"}}>No results for this filter</div>
                )}
              </>
            )}

            {tab==="history"&&(
              <div className="glass" style={{borderRadius:16,padding:32}}>
                <div style={{fontSize:12,color:"var(--accent2)",letterSpacing:"0.15em",fontWeight:600,marginBottom:24,display:"flex",alignItems:"center",gap:8}}>
                  <Icon name="trendingUp" size={15} color="var(--accent2)"/> PRICE TREND · {query.toUpperCase()}
                </div>
                <PriceChart history={history} query={query}/>
              </div>
            )}

            {tab==="export"&&(
              <div className="glass" style={{borderRadius:16,padding:32,maxWidth:520}}>
                <div style={{fontSize:12,color:"var(--accent2)",letterSpacing:"0.15em",fontWeight:600,marginBottom:20,display:"flex",alignItems:"center",gap:8}}>
                  <Icon name="download" size={15} color="var(--accent2)"/> EXPORT RESULTS
                </div>
                <ExportPanel query={query} products={products} analysis={analysis}/>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!job&&(
          <div style={{textAlign:"center",padding:"60px 0 20px"}} className="fade-in">
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginTop:20,maxWidth:700,margin:"20px auto 0"}}>
              {[{icon:"eye",title:"Vision-Only",desc:"Gemini reads screenshots — no retailer APIs needed"},{icon:"layers",title:"Multi-Site",desc:"Amazon, Flipkart & Croma scanned in parallel"},{icon:"brain",title:"AI Analysis",desc:"Ranked by best deal and rating with full explanation"}].map(({icon,title,desc})=>(
                <div key={title} className="glass card-hover" style={{borderRadius:12,padding:"22px 18px",textAlign:"left"}}>
                  <div style={{width:40,height:40,borderRadius:10,background:"rgba(127,255,212,0.08)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
                    <Icon name={icon} size={20} color="var(--accent)"/>
                  </div>
                  <div style={{fontFamily:"var(--serif)",fontSize:15,fontWeight:600,color:"var(--accent)",marginBottom:6}}>{title}</div>
                  <div style={{fontSize:11,color:"var(--muted2)",lineHeight:1.6}}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── ROOT ──────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page,setPage]=useState("landing");
  const [user,setUser]=useState(null);
  const [showSignIn,setShowSignIn]=useState(false);

  useEffect(()=>{
    const saved=localStorage.getItem("ph_user");
    if(saved){try{const u=JSON.parse(saved);setUser(u);setPage("dashboard");}catch{}}
  },[]);

  const handleSignInSuccess=(u)=>{setUser(u);setShowSignIn(false);setPage("dashboard");};
  const handleSignOut=()=>{localStorage.removeItem("ph_user");setUser(null);setPage("landing");};

  return (
    <>
      <style>{CSS}</style>
      <SmokeBg/>
      <ParticleCanvas/>
      {page==="landing"&&<LandingPage onSignIn={()=>setShowSignIn(true)}/>}
      {page==="dashboard"&&user&&<Dashboard user={user} onSignOut={handleSignOut}/>}
      {showSignIn&&<SignInModal onClose={()=>setShowSignIn(false)} onSuccess={handleSignInSuccess}/>}
    </>
  );
}