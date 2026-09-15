import React, { useState } from 'react';
import { 
  Flame, 
  Wind, 
  HeartPulse, 
  Sparkles, 
  History, 
  TrendingUp,
  BarChart3
} from 'lucide-react';

/**
 * Minimalist Clean SVG Line Chart Component
 * Teal line (#0E7C7B), clean white surface, light #E7E5E2 grid, subtle dashed average reference line
 */
function CleanTrendChart({
  title,
  unit,
  data,
  valueKey,
  labelKey = 'day',
  minVal,
  maxVal,
  avgVal
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const values = data.map((d) => d[valueKey]);
  const effectiveMin = minVal !== undefined ? minVal : Math.floor(Math.min(...values) * 0.95);
  const effectiveMax = maxVal !== undefined ? maxVal : Math.ceil(Math.max(...values) * 1.05);
  const range = effectiveMax - effectiveMin || 1;

  const width = 310;
  const height = 120;
  const paddingLeft = 32;
  const paddingRight = 14;
  const paddingTop = 14;
  const paddingBottom = 24;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const points = data.map((d, idx) => {
    const x = paddingLeft + (idx / (data.length - 1)) * chartW;
    const y = paddingTop + chartH - ((d[valueKey] - effectiveMin) / range) * chartH;
    return { x, y, value: d[valueKey], label: d[labelKey] };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`;
  const avgY = paddingTop + chartH - ((avgVal - effectiveMin) / range) * chartH;

  return (
    <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-caption" style={{ fontWeight: 600, color: '#15181C' }}>{title}</span>
        <span className="text-mono-caption" style={{ color: '#0E7C7B', fontWeight: 600 }}>
          Avg: {avgVal} {unit}
        </span>
      </div>

      <div style={{ background: '#FAFAF9', borderRadius: '10px', padding: '4px', border: '1px solid #E7E5E2' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '112px', userSelect: 'none' }}>
          <defs>
            <linearGradient id={`grad_${valueKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0E7C7B" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#0E7C7B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#E7E5E2" strokeDasharray="2,2" />
          <line x1={paddingLeft} y1={paddingTop + chartH / 2} x2={width - paddingRight} y2={paddingTop + chartH / 2} stroke="#E7E5E2" strokeDasharray="2,2" />
          <line x1={paddingLeft} y1={paddingTop + chartH} x2={width - paddingRight} y2={paddingTop + chartH} stroke="#D6D3CD" />

          {/* Average Reference Line */}
          {avgY >= paddingTop && avgY <= paddingTop + chartH && (
            <line x1={paddingLeft} y1={avgY} x2={width - paddingRight} y2={avgY} stroke="#D98E04" strokeWidth="1" strokeDasharray="3,3" opacity="0.8" />
          )}

          {/* Y-Axis Value Labels */}
          <text x={paddingLeft - 4} y={paddingTop + 3} fill="#6B7280" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">
            {effectiveMax}
          </text>
          <text x={paddingLeft - 4} y={paddingTop + chartH / 2 + 3} fill="#6B7280" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">
            {Math.round((effectiveMax + effectiveMin) / 2)}
          </text>
          <text x={paddingLeft - 4} y={paddingTop + chartH} fill="#6B7280" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">
            {effectiveMin}
          </text>

          {/* Area Fill */}
          <path d={areaD} fill={`url(#grad_${valueKey})`} />

          {/* Smooth Trend Line */}
          <path d={pathD} fill="none" stroke="#0E7C7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points & X-Axis Labels */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            const isLast = idx === points.length - 1;

            return (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 4.5 : isLast ? 3.5 : 2.5}
                  fill={isLast ? '#0E7C7B' : '#FFFFFF'}
                  stroke="#0E7C7B"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                <text
                  x={pt.x}
                  y={height - 6}
                  fill={isLast ? '#0E7C7B' : '#6B7280'}
                  fontWeight={isLast ? 'bold' : 'normal'}
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                >
                  {pt.label}
                </text>
                {isHovered && (
                  <g>
                    <rect x={pt.x - 16} y={pt.y - 18} width="32" height="14" rx="4" fill="#15181C" />
                    <text x={pt.x} y={pt.y - 8} fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="var(--font-mono)" textAnchor="middle">
                      {pt.value}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function DashboardScreen({
  telemetry,
  heatHazard,
  airHazard,
  vitalsRisk,
  recommendations,
  alertHistory,
  onResolveAlert
}) {
  const [selectedTab, setSelectedTab] = useState('trends'); // 'trends' | 'gauges' | 'history'

  const currentHr = telemetry.vitals?.heartRate || 72;
  const currentSpo2 = telemetry.vitals?.spo2 || 98.4;
  const currentSleep = telemetry.vitals?.sleepQuality || 85;

  const hrTrends = [
    { day: 'M', hr: 71 },
    { day: 'T', hr: 73 },
    { day: 'W', hr: 70 },
    { day: 'T', hr: 74 },
    { day: 'F', hr: 72 },
    { day: 'S', hr: 71 },
    { day: 'Now', hr: currentHr }
  ];

  const spo2Trends = [
    { day: 'M', spo2: 98.4 },
    { day: 'T', spo2: 98.1 },
    { day: 'W', spo2: 98.6 },
    { day: 'T', spo2: 98.2 },
    { day: 'F', spo2: 98.3 },
    { day: 'S', spo2: 98.5 },
    { day: 'Now', spo2: currentSpo2 }
  ];

  const sleepTrends = [
    { day: 'M', sleep: 82 },
    { day: 'T', sleep: 85 },
    { day: 'W', sleep: 88 },
    { day: 'T', sleep: 79 },
    { day: 'F', sleep: 86 },
    { day: 'S', sleep: 84 },
    { day: 'Now', sleep: currentSleep }
  ];

  const heatStressRisk = heatHazard.riskScore;
  const respiratoryRisk = airHazard.riskScore;
  const cardioRisk = vitalsRisk.riskLevel === 'Critical' ? 92 :
                    vitalsRisk.riskLevel === 'High' ? 76 :
                    vitalsRisk.riskLevel === 'Moderate' ? 45 : 15;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Proper Minimal Segmented Control */}
      <div className="segmented-control">
        <button
          onClick={() => setSelectedTab('trends')}
          className={`segmented-control-btn ${selectedTab === 'trends' ? 'active' : ''}`}
        >
          7-Day Trends
        </button>
        <button
          onClick={() => setSelectedTab('gauges')}
          className={`segmented-control-btn ${selectedTab === 'gauges' ? 'active' : ''}`}
        >
          Risk Gauges
        </button>
        <button
          onClick={() => setSelectedTab('history')}
          className={`segmented-control-btn ${selectedTab === 'history' ? 'active' : ''}`}
        >
          Alert History
        </button>
      </div>

      {/* 7-Day Line Charts View */}
      {selectedTab === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <CleanTrendChart
            title="7-Day Heart Rate Trend"
            unit="BPM"
            data={hrTrends}
            valueKey="hr"
            minVal={50}
            maxVal={110}
            avgVal={72}
          />
          <CleanTrendChart
            title="7-Day SpO2 Oxygenation Trend"
            unit="%"
            data={spo2Trends}
            valueKey="spo2"
            minVal={88}
            maxVal={100}
            avgVal={98.3}
          />
          <CleanTrendChart
            title="7-Day Sleep Restoration Index"
            unit="/100"
            data={sleepTrends}
            valueKey="sleep"
            minVal={50}
            maxVal={100}
            avgVal={84}
          />
        </div>
      )}

      {/* Risk Gauges View */}
      {selectedTab === 'gauges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Heat Stress Gauge */}
          <div className="app-card accent-bar-moderate" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} color="#D98E04" />
                <div>
                  <span className="text-section-title" style={{ fontSize: '14px', display: 'block' }}>Heat Stress Risk</span>
                  <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>Heat Index: {heatHazard.heatIndex}°C · Status: {heatHazard.status}</span>
                </div>
              </div>
              <span className="text-mono-caption" style={{ fontWeight: 600, color: '#D98E04' }}>{heatStressRisk}/100</span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: '#F0EFEA', overflow: 'hidden' }}>
              <div style={{ width: `${heatStressRisk}%`, height: '100%', background: '#D98E04', transition: 'width 0.5s ease' }} />
            </div>
            <p className="text-caption" style={{ fontSize: '12px' }}>{heatHazard.description}</p>
          </div>

          {/* Respiratory Risk Gauge */}
          <div className="app-card accent-bar-high" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wind size={16} color="#E2622B" />
                <span className="text-section-title" style={{ fontSize: '14px' }}>Respiratory Hazard Risk</span>
              </div>
              <span className="text-mono-caption" style={{ fontWeight: 600, color: '#E2622B' }}>{respiratoryRisk}/100</span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: '#F0EFEA', overflow: 'hidden' }}>
              <div style={{ width: `${respiratoryRisk}%`, height: '100%', background: '#E2622B', transition: 'width 0.5s ease' }} />
            </div>
            <p className="text-caption" style={{ fontSize: '12px' }}>{airHazard.description}</p>
          </div>

          {/* Cardiovascular Anomaly Risk Gauge */}
          <div className={`app-card ${cardioRisk >= 75 ? 'accent-bar-critical' : 'accent-bar-normal'}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HeartPulse size={16} color={cardioRisk >= 75 ? '#C93A3A' : '#1A9B5C'} />
                <span className="text-section-title" style={{ fontSize: '14px' }}>Cardiovascular Anomaly Risk</span>
              </div>
              <span className="text-mono-caption" style={{ fontWeight: 600, color: cardioRisk >= 75 ? '#C93A3A' : '#1A9B5C' }}>
                {cardioRisk}/100
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: '#F0EFEA', overflow: 'hidden' }}>
              <div style={{ width: `${cardioRisk}%`, height: '100%', background: cardioRisk >= 75 ? '#C93A3A' : '#1A9B5C', transition: 'width 0.5s ease' }} />
            </div>
            <p className="text-caption" style={{ fontSize: '12px' }}>Evaluated on-device via Model A (WESAD + PTT PPG) neural forward pass.</p>
          </div>
        </div>
      )}

      {/* Alert History View */}
      {selectedTab === 'history' && (
        <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="text-caption" style={{ fontWeight: 600, color: '#15181C' }}>
            Alert Resolution Log ({alertHistory.length} events)
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {alertHistory.map((item) => (
              <div key={item.id} style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-body" style={{ fontSize: '13px', fontWeight: 600 }}>{item.title}</span>
                  <span className={`badge-clean ${item.status === 'Resolved' ? 'badge-normal' : 'badge-critical'}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-caption" style={{ fontSize: '12px', color: '#6B7280' }}>{item.detail}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span className="text-mono-caption" style={{ fontSize: '10.5px' }}>{item.timestamp}</span>
                  {item.status === 'Active' && (
                    <button
                      onClick={() => onResolveAlert(item.id)}
                      style={{ color: '#0E7C7B', fontWeight: 600, fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Recommendations Panel */}
      <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="#0E7C7B" />
          <span className="text-caption" style={{ fontWeight: 600, color: '#15181C' }}>
            Action Recommendations
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {recommendations.map((rec) => (
            <div key={rec.id} style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-body" style={{ fontSize: '13px', fontWeight: 600 }}>{rec.title}</span>
                <span className="badge-clean badge-normal" style={{ fontSize: '10px' }}>{rec.category}</span>
              </div>
              <p className="text-caption" style={{ fontSize: '12px', color: '#6B7280' }}>{rec.description}</p>
              <p className="text-caption" style={{ fontSize: '12px', color: '#0E7C7B', fontWeight: 600 }}>👉 {rec.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
