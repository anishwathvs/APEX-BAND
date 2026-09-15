import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { 
  Activity, 
  ShieldCheck, 
  WifiOff, 
  Cpu, 
  AlertTriangle, 
  PhoneCall, 
  CheckCircle2, 
  ArrowRight,
  Heart,
  Wind,
  Flame,
  Lock,
  Sparkles,
  Zap,
  Moon
} from 'lucide-react';

/**
 * Mini Sparkline Component for Feature Card
 */
function MiniSparkline({ shouldReduceMotion }) {
  const points = [14, 18, 12, 22, 19, 26, 24];
  const width = 80;
  const height = 24;
  const max = 28;
  const min = 10;
  const range = max - min;

  const pts = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke="#0E7C7B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
      <circle cx={width} cy={height - ((points[points.length - 1] - min) / range) * height} r="3" fill="#0E7C7B" />
    </svg>
  );
}

/**
 * Mini Animated Countdown Ring for Fall Feature Card
 */
function MiniCountdownRing({ shouldReduceMotion }) {
  return (
    <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="16" cy="16" r="13" stroke="#F0EFEA" strokeWidth="2.5" fill="transparent" />
        <motion.circle
          cx="16"
          cy="16"
          r="13"
          stroke="#C93A3A"
          strokeWidth="2.5"
          strokeDasharray={81.6}
          initial={{ strokeDashoffset: 0 }}
          animate={shouldReduceMotion ? { strokeDashoffset: 20 } : { strokeDashoffset: [0, 60, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#C93A3A' }}>
        10s
      </span>
    </div>
  );
}

export function LandingScreen({ onGetStarted, onLogin }) {
  const shouldReduceMotion = useReducedMotion();
  const heroCanvasRef = useRef(null);
  const footerCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [heroPhase, setHeroPhase] = useState(0);
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0, active: false });

  // Scroll Progress Tracker for Container
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Choreographed Hero Canvas Pulse Sequence
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;
    let wakeProgress = shouldReduceMotion ? 1 : 0;

    if (!shouldReduceMotion) {
      const t1 = setTimeout(() => setHeroPhase(1), 250);
      const t2 = setTimeout(() => setHeroPhase(2), 800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      ctx.strokeStyle = 'rgba(14, 124, 123, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      if (wakeProgress < 1 && heroPhase >= 1) {
        wakeProgress = Math.min(1, wakeProgress + 0.04);
      }

      ctx.beginPath();
      ctx.strokeStyle = '#0E7C7B';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      time += shouldReduceMotion ? 0 : 0.024;

      for (let x = 0; x < w; x++) {
        if (heroPhase === 0 && !shouldReduceMotion) {
          if (x === 0) ctx.moveTo(x, midY);
          else ctx.lineTo(x, midY);
        } else {
          const t = (x / 50) + time;
          const fundamental = Math.sin(t * Math.PI);
          const harmonic = 0.38 * Math.sin((t * 2 + 0.3) * Math.PI);
          const dicrotic = 0.22 * Math.sin((t * 3 - 0.5) * Math.PI);
          const rawWave = (fundamental + harmonic + dicrotic) * (h * 0.34);
          const yVal = midY - (rawWave * wakeProgress);

          if (x === 0) ctx.moveTo(x, yVal);
          else ctx.lineTo(x, yVal);
        }
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [heroPhase, shouldReduceMotion]);

  // Footer Waveform
  useEffect(() => {
    const canvas = footerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(14, 124, 123, 0.12)';
      ctx.lineWidth = 1.8;

      time += shouldReduceMotion ? 0 : 0.015;

      for (let x = 0; x < w; x++) {
        const t = (x / 65) + time;
        const wave = Math.sin(t * Math.PI) * (h * 0.3);
        const yVal = midY - wave;
        if (x === 0) ctx.moveTo(x, yVal);
        else ctx.lineTo(x, yVal);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [shouldReduceMotion]);

  const handleButtonMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipplePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    });
  };

  const handleButtonMouseLeave = () => {
    setRipplePos((prev) => ({ ...prev, active: false }));
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px', 
        paddingBottom: '32px' 
      }}
    >
      {/* 2.5px Top Scroll-Progress Bar */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2.5px',
          background: '#0E7C7B',
          transformOrigin: '0%',
          scaleX,
          zIndex: 100
        }}
      />

      {/* 1. HERO SECTION WITH PROVING LIVE WAVEFORM VISUAL */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
        {/* Living Pulse Hero Canvas with Live Vitals readout */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ 
            width: '100%', 
            height: '84px', 
            position: 'relative', 
            overflow: 'hidden', 
            borderRadius: '16px', 
            background: '#FFFFFF', 
            border: '1px solid #E7E5E2',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <canvas
            ref={heroCanvasRef}
            width={350}
            height={84}
            style={{ width: '100%', height: '84px', display: 'block' }}
          />
          <div style={{ position: 'absolute', top: '8px', left: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1A9B5C' }} />
            <span className="text-mono-caption" style={{ fontSize: '10.5px', fontWeight: 600, color: '#15181C' }}>
              72 BPM · 98.4% SpO2
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: '8px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="text-mono-caption" style={{ fontSize: '10px', color: '#0E7C7B', fontWeight: 600 }}>
              LIVE ON-DEVICE PPG
            </span>
          </div>
        </motion.div>

        {/* Shortened Tight Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <motion.h1 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-display" 
            style={{ fontSize: '26px', lineHeight: '32px', letterSpacing: '-0.5px' }}
          >
            Health monitoring that never leaves your device.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-body-muted" 
            style={{ fontSize: '14px', fontWeight: 500, color: '#0E7C7B' }}
          >
            Vitals. Falls. Disasters. All on-device.
          </motion.p>
        </div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <button
            onClick={onGetStarted}
            onMouseMove={handleButtonMouseMove}
            onMouseLeave={handleButtonMouseLeave}
            style={{
              position: 'relative',
              overflow: 'hidden',
              flex: 1.2,
              padding: '12px 16px',
              borderRadius: '14px',
              background: '#0E7C7B',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(14, 124, 123, 0.25)'
            }}
          >
            {ripplePos.active && (
              <span
                style={{
                  position: 'absolute',
                  left: ripplePos.x,
                  top: ripplePos.y,
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.25)',
                  transform: 'translate(-50%, -50%) scale(1.8)',
                  pointerEvents: 'none',
                  transition: 'transform 0.4s ease-out, opacity 0.4s ease-out'
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>Get Started</span>
            <ArrowRight size={15} style={{ position: 'relative', zIndex: 1 }} />
          </button>

          <button
            onClick={onLogin}
            className="landing-secondary-btn"
            style={{
              position: 'relative',
              flex: 0.8,
              padding: '12px 14px',
              borderRadius: '14px',
              background: 'transparent',
              color: '#0E7C7B',
              fontSize: '13.5px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              border: '1px solid #E7E5E2',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            Log In
          </button>
        </motion.div>
      </section>

      {/* 2. ICON-FIRST TRUST & PROOF ROW */}
      <section style={{ display: 'flex', gap: '8px' }}>
        {[
          { icon: Cpu, label: 'On-Device', delay: 0 },
          { icon: WifiOff, label: 'Offline-Ready', delay: 0.08 },
          { icon: ShieldCheck, label: 'Zero Data Leaves', delay: 0.16 }
        ].map((item, idx) => {
          const IconC = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : item.delay }}
              style={{
                flex: 1,
                background: '#FFFFFF',
                border: '1px solid #E7E5E2',
                borderRadius: '12px',
                padding: '8px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                textAlign: 'center',
                boxShadow: 'var(--card-shadow)'
              }}
            >
              <IconC size={16} color="#0E7C7B" />
              <span className="text-caption" style={{ fontSize: '11px', fontWeight: 600, color: '#15181C' }}>
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </section>

      {/* 3. HOW IT WORKS WITH LIVE MOTION ICONS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-section-title" style={{ fontSize: '14.5px' }}>
            How It Works
          </span>
          <span className="text-mono-caption" style={{ color: '#0E7C7B', fontWeight: 600, fontSize: '10.5px' }}>
            EDGE PIPELINE
          </span>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              bottom: '20px', 
              left: '23px', 
              width: '2px', 
              background: '#0E7C7B', 
              opacity: 0.25, 
              zIndex: 0 
            }} 
          />

          {[
            {
              step: '01',
              icon: Heart,
              title: 'Continuous Monitoring',
              desc: 'Passive on-device multi-sensor sampling.'
            },
            {
              step: '02',
              icon: Cpu,
              title: 'Edge AI Anomaly Detection',
              desc: 'Real-time neural baseline inference.'
            },
            {
              step: '03',
              icon: AlertTriangle,
              title: 'Disaster Alerts & 10s SOS',
              desc: 'Autonomous emergency shock dispatch.'
            }
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : idx * 0.1 }}
                className="app-card"
                style={{ 
                  position: 'relative', 
                  zIndex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '10px 14px' 
                }}
              >
                <motion.div
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.6 }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(14, 124, 123, 0.1)',
                    border: '1px solid rgba(14, 124, 123, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0E7C7B',
                    flexShrink: 0
                  }}
                >
                  <IconComponent size={14} color="#0E7C7B" />
                </motion.div>
                <div style={{ flex: 1 }}>
                  <span className="text-body" style={{ fontWeight: 600, fontSize: '13px', display: 'block' }}>
                    {item.title}
                  </span>
                  <span className="text-caption" style={{ fontSize: '11.5px', color: '#6B7280' }}>
                    {item.desc}
                  </span>
                </div>
                <span className="text-mono-caption" style={{ color: '#0E7C7B', fontWeight: 700, fontSize: '11px' }}>
                  {item.step}
                </span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. NEW: "SEE IT LIVE" MINI INTERACTIVE PREVIEW */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-section-title" style={{ fontSize: '14.5px' }}>
            See It Live
          </span>
          <span className="badge-clean badge-normal" style={{ fontSize: '10px' }}>
            REAL IN-APP UI
          </span>
        </div>

        {/* Mini Phone UI Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="app-card accent-bar-normal"
          style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          {/* Mini Top Status Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E7E5E2', paddingBottom: '6px' }}>
            <span className="text-caption" style={{ fontWeight: 600, fontSize: '11.5px', color: '#15181C' }}>
              Live Telemetry Stream
            </span>
            <span className="text-mono-caption" style={{ color: '#0E7C7B', fontSize: '10.5px', fontWeight: 600 }}>
              0.22ms Latency
            </span>
          </div>

          {/* 2x2 Mini Vitals Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '10px', padding: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-caption" style={{ fontSize: '10.5px', color: '#6B7280' }}>Heart Rate</span>
                <Heart size={12} color="#C93A3A" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
                <span className="text-mono-hero" style={{ fontSize: '18px', color: '#15181C' }}>72</span>
                <span className="text-caption" style={{ fontSize: '10px', color: '#6B7280' }}>BPM</span>
              </div>
            </div>

            <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '10px', padding: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-caption" style={{ fontSize: '10.5px', color: '#6B7280' }}>Oxygen SpO2</span>
                <Activity size={12} color="#0E7C7B" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
                <span className="text-mono-hero" style={{ fontSize: '18px', color: '#15181C' }}>98.4</span>
                <span className="text-caption" style={{ fontSize: '10px', color: '#6B7280' }}>%</span>
              </div>
            </div>

            <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '10px', padding: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-caption" style={{ fontSize: '10.5px', color: '#6B7280' }}>Skin Temp</span>
                <Flame size={12} color="#D98E04" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
                <span className="text-mono-hero" style={{ fontSize: '18px', color: '#15181C' }}>36.6</span>
                <span className="text-caption" style={{ fontSize: '10px', color: '#6B7280' }}>°C</span>
              </div>
            </div>

            <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '10px', padding: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-caption" style={{ fontSize: '10.5px', color: '#6B7280' }}>Sleep Score</span>
                <Moon size={12} color="#0E7C7B" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
                <span className="text-mono-hero" style={{ fontSize: '18px', color: '#15181C' }}>92</span>
                <span className="text-caption" style={{ fontSize: '10px', color: '#6B7280' }}>/100</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 5. VISUAL-FIRST FEATURE GRID (2x2 with Mini Visuals) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span className="text-section-title" style={{ fontSize: '14.5px' }}>
          Core Capabilities
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Card 1: Continuous Tracking + Sparkline */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="app-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Activity size={16} color="#0E7C7B" />
              <span className="text-caption" style={{ fontSize: '10px', color: '#0E7C7B', fontWeight: 600 }}>7-DAY</span>
            </div>
            <span className="text-body" style={{ fontSize: '12.5px', fontWeight: 600 }}>
              Continuous Tracking
            </span>
            <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'center' }}>
              <MiniSparkline shouldReduceMotion={shouldReduceMotion} />
            </div>
            <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
              7-day rolling personal baseline.
            </span>
          </motion.div>

          {/* Card 2: Disaster Rules + Pulsing Flame */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="app-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Wind size={16} color="#0E7C7B" />
              <motion.div
                animate={shouldReduceMotion ? {} : { scale: [1, 1.15, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                <Flame size={14} color="#D98E04" />
              </motion.div>
            </div>
            <span className="text-body" style={{ fontSize: '12.5px', fontWeight: 600 }}>
              Disaster Rules
            </span>
            <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '6px', padding: '4px 6px', textAlign: 'center', marginTop: '2px' }}>
              <span className="text-mono-caption" style={{ fontSize: '10px', color: '#D98E04', fontWeight: 600 }}>
                Heat Index & AQI
              </span>
            </div>
            <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
              Steadman Heat & CPCB protocols.
            </span>
          </motion.div>

          {/* Card 3: Fall SOS + Animated Ring */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.16 }}
            className="app-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <PhoneCall size={16} color="#0E7C7B" />
              <MiniCountdownRing shouldReduceMotion={shouldReduceMotion} />
            </div>
            <span className="text-body" style={{ fontSize: '12.5px', fontWeight: 600 }}>
              Fall SOS Dispatch
            </span>
            <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
              10s countdown with device GPS.
            </span>
          </motion.div>

          {/* Card 4: Compact TFLite + Shield Micro-interaction */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.24 }}
            className="app-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Cpu size={16} color="#0E7C7B" />
              <motion.div
                animate={shouldReduceMotion ? {} : { rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Lock size={14} color="#1A9B5C" />
              </motion.div>
            </div>
            <span className="text-body" style={{ fontSize: '12.5px', fontWeight: 600 }}>
              Private Edge AI
            </span>
            <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '6px', padding: '4px 6px', textAlign: 'center', marginTop: '2px' }}>
              <span className="text-mono-caption" style={{ fontSize: '10px', color: '#0E7C7B', fontWeight: 600 }}>
                &lt; 2 KB Binaries
              </span>
            </div>
            <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
              Compact in-memory models.
            </span>
          </motion.div>
        </div>
      </section>

      {/* 6. CONCISE CLOSING CTA */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="app-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center',
            textAlign: 'center',
            padding: '18px 14px'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }}>
            <canvas
              ref={footerCanvasRef}
              width={350}
              height={120}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span className="text-section-title" style={{ fontSize: '15px' }}>
              Private edge health intelligence.
            </span>
            <span className="text-caption" style={{ fontSize: '12px', color: '#6B7280' }}>
              Zero cloud dependencies. 100% offline.
            </span>
          </div>

          <button
            onClick={onGetStarted}
            onMouseMove={handleButtonMouseMove}
            onMouseLeave={handleButtonMouseLeave}
            style={{
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: '#0E7C7B',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(14, 124, 123, 0.25)',
              zIndex: 1
            }}
          >
            Launch Companion App
          </button>
        </motion.div>

        <div style={{ textAlign: 'center' }}>
          <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
            APEX-BAND · SIH 2026 · Qualcomm PS 26181
          </span>
        </div>
      </section>
    </div>
  );
}
