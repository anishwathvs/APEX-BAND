import React, { useEffect, useRef } from 'react';
import { 
  Heart, 
  Wind, 
  Thermometer, 
  Moon, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  ChevronDown,
  PauseCircle
} from 'lucide-react';
import { SCENARIOS } from '../simulator/SensorSimulator';

export function LiveVitalsScreen({
  telemetry,
  vitalsRisk,
  baselineReport,
  wellnessScore,
  onScenarioChange,
  currentScenario,
  sensorPerms = { heartRate: true, imu: true, environment: true }
}) {
  const canvasRef = useRef(null);
  const isVitalsActive = sensorPerms.heartRate && telemetry.vitals;

  // Live PPG Arterial Pulse Waveform on Canvas (Active only when sensor enabled)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVitalsActive) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Clean subtle horizontal grid lines
      ctx.strokeStyle = '#F0EFEA';
      ctx.lineWidth = 1;
      for (let y = 15; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw arterial PPG wave with dicrotic notch
      ctx.beginPath();
      ctx.strokeStyle = '#0E7C7B';
      ctx.lineWidth = 2;

      const hrRate = (telemetry.vitals?.heartRate || 72) / 60;
      phase += 0.035 * hrRate;

      for (let x = 0; x < w; x++) {
        const t = (x / 36) + phase;
        const fundamental = Math.sin(t * Math.PI);
        const harmonic = 0.35 * Math.sin((t * 2 + 0.3) * Math.PI);
        const dicrotic = 0.2 * Math.sin((t * 3 - 0.5) * Math.PI);
        const yVal = (h / 2) - (fundamental + harmonic + dicrotic) * (h * 0.34);

        if (x === 0) ctx.moveTo(x, yVal);
        else ctx.lineTo(x, yVal);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [telemetry.vitals?.heartRate, isVitalsActive]);

  const vitals = telemetry.vitals || {};
  const hrDeviation = baselineReport?.heartRate;
  const spo2Deviation = baselineReport?.spo2;
  const tempDeviation = baselineReport?.skinTemp;

  const riskAccentClass = 
    vitalsRisk.riskLevel === 'Critical' ? 'accent-bar-critical' :
    vitalsRisk.riskLevel === 'High' ? 'accent-bar-high' :
    vitalsRisk.riskLevel === 'Moderate' ? 'accent-bar-moderate' : 'accent-bar-normal';

  const riskBadgeClass = 
    vitalsRisk.riskLevel === 'Critical' ? 'badge-critical' :
    vitalsRisk.riskLevel === 'High' ? 'badge-high' :
    vitalsRisk.riskLevel === 'Moderate' ? 'badge-moderate' : 'badge-normal';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Sensor Inactive Notice */}
      {!isVitalsActive && (
        <div style={{ background: 'rgba(217, 142, 4, 0.1)', border: '1px solid rgba(217, 142, 4, 0.3)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PauseCircle size={15} color="#D98E04" />
          <span className="text-caption" style={{ color: '#D98E04', fontWeight: 600, fontSize: '11.5px' }}>
            PPG Vitals Sensor Paused in Settings
          </span>
        </div>
      )}

      {/* Scenario Selector Dropdown */}
      <div className="app-card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <Layers size={14} color="#0E7C7B" />
            <span className="text-caption" style={{ fontWeight: 600, color: '#15181C' }}>Replay Scenario</span>
          </div>
          <div style={{ position: 'relative', flex: 1.6 }}>
            <select
              value={currentScenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              style={{
                width: '100%',
                background: '#FAFAF9',
                border: '1px solid #E7E5E2',
                borderRadius: '8px',
                padding: '6px 28px 6px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#15181C',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {Object.values(SCENARIOS).map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={14} 
              color="#6B7280" 
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
          </div>
        </div>
      </div>

      {/* 2x2 Grid of Metric Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Heart Rate Tile */}
        <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-caption">Heart Rate</span>
            <Heart size={14} color="#6B7280" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
            <span className="text-mono-hero">{isVitalsActive ? (vitals.heartRate || 72) : '--'}</span>
            <span className="text-mono-caption">{isVitalsActive ? 'BPM' : ''}</span>
          </div>
          <div className="text-mono-caption" style={{ color: '#6B7280' }}>
            Base: {hrDeviation?.baselineMean || 72} BPM
          </div>
        </div>

        {/* SpO2 Blood Oxygen Tile */}
        <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-caption">SpO2 Oxygen</span>
            <Wind size={14} color="#6B7280" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
            <span className="text-mono-hero">{isVitalsActive ? (vitals.spo2 || 98.4) : '--'}</span>
            <span className="text-mono-caption">{isVitalsActive ? '%' : ''}</span>
          </div>
          <div className="text-mono-caption" style={{ color: '#6B7280' }}>
            Base: {spo2Deviation?.baselineMean || 98.2}%
          </div>
        </div>

        {/* Skin Temperature Tile */}
        <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-caption">Skin Temp</span>
            <Thermometer size={14} color="#6B7280" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
            <span className="text-mono-hero">{isVitalsActive ? (vitals.skinTemp || 36.5) : '--'}</span>
            <span className="text-mono-caption">{isVitalsActive ? '°C' : ''}</span>
          </div>
          <div className="text-mono-caption" style={{ color: '#6B7280' }}>
            Base: {tempDeviation?.baselineMean || 36.5}°C
          </div>
        </div>

        {/* Sleep State (Model C) Tile */}
        <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-caption">Sleep State</span>
            <Moon size={14} color="#6B7280" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
            <span className="text-mono-secondary" style={{ fontSize: '20px', fontWeight: 600 }}>
              {telemetry.sleepStage || 'N2 Core'}
            </span>
          </div>
          <div className="text-mono-caption" style={{ color: '#6B7280' }}>
            Index: {isVitalsActive ? (vitals.sleepQuality || 85) : '--'}/100
          </div>
        </div>
      </div>

      {/* Live PPG Arterial Pulse Waveform Card */}
      <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-caption" style={{ fontWeight: 600, color: '#15181C' }}>
            Live Arterial PPG Waveform
          </span>
          <span className="text-mono-caption" style={{ color: '#0E7C7B' }}>
            {isVitalsActive ? `PTT: ${telemetry.modelAFeatures?.[5] || 235}ms` : 'Inactive'}
          </span>
        </div>
        {isVitalsActive ? (
          <canvas
            ref={canvasRef}
            width={350}
            height={68}
            style={{ width: '100%', height: '68px', borderRadius: '8px', background: '#FAFAF9' }}
          />
        ) : (
          <div style={{ height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF9', borderRadius: '8px' }}>
            <span className="text-caption" style={{ color: '#6B7280', fontSize: '11.5px' }}>PPG Sensor stream disabled in settings</span>
          </div>
        )}
      </div>

      {/* Daily Wellness Indicator with Circular Progress Ring */}
      <div className="app-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="text-caption" style={{ fontWeight: 600, color: '#15181C' }}>
            Daily Wellness Indicator
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
            <span className="text-mono-hero">{wellnessScore.score}</span>
            <span className="text-caption" style={{ color: '#6B7280' }}>/100</span>
          </div>
          <div style={{ marginTop: '4px' }}>
            <span 
              className={`badge-clean ${
                wellnessScore.score >= 80 ? 'badge-normal' :
                wellnessScore.score >= 60 ? 'badge-moderate' : 'badge-critical'
              }`}
            >
              {wellnessScore.rating}
            </span>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="#E7E5E2"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="#0E7C7B"
              strokeWidth="5"
              strokeDasharray={163.3}
              strokeDashoffset={163.3 - (163.3 * wellnessScore.score) / 100}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <span className="text-mono-caption" style={{ position: 'absolute', fontWeight: 600, color: '#15181C' }}>
            {wellnessScore.score}%
          </span>
        </div>
      </div>

      {/* Risk Assessment Card */}
      <div className={`app-card ${riskAccentClass}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {vitalsRisk.isNormal ? (
              <ShieldCheck size={16} color="#1A9B5C" />
            ) : (
              <AlertTriangle size={16} color={vitalsRisk.riskLevel === 'Critical' ? '#C93A3A' : '#D98E04'} />
            )}
            <span className="text-section-title" style={{ fontSize: '14px' }}>
              On-Device Anomaly Assessment
            </span>
          </div>
          <span className={`badge-clean ${riskBadgeClass}`}>
            {vitalsRisk.riskLevel} Risk
          </span>
        </div>

        {/* Findings as clean bulleted list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {vitalsRisk.detectedAnomalies?.length > 0 ? (
            vitalsRisk.detectedAnomalies.map((anom, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#15181C' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#C93A3A' }} />
                <span>{anom}</span>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1A9B5C' }} />
              <span>All vital channels align with personal rolling baseline.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
