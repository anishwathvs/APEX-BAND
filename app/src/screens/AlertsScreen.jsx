import React from 'react';
import { 
  Flame, 
  Wind, 
  MapPin, 
  UserCheck, 
  ShieldAlert, 
  Waves, 
  CloudLightning,
  ChevronDown,
  Info,
  PauseCircle
} from 'lucide-react';

export function AlertsScreen({
  telemetry,
  heatHazard,
  airHazard,
  disasterAdvisory,
  isVulnerable,
  onToggleVulnerable,
  onCityChange,
  onDisasterChange,
  sensorPerms = { heartRate: true, imu: true, environment: true }
}) {
  const isEnvActive = sensorPerms.environment && telemetry.environment;
  const env = telemetry.environment || { city: 'Delhi', ambientTemp: 32, ambientHumidity: 55, aqi: 85, pm25: 45, aqiBucket: 'Satisfactory', disasterMode: 'none' };
  const cities = ['Delhi', 'Chennai', 'Mumbai', 'Kolkata', 'Bengaluru'];

  const heatAccentClass = 
    heatHazard.status === 'EXTREME_DANGER' ? 'accent-bar-critical' :
    heatHazard.status === 'DANGER' ? 'accent-bar-high' :
    heatHazard.status === 'CAUTION' ? 'accent-bar-moderate' : 'accent-bar-normal';

  const heatBadgeClass = 
    heatHazard.status === 'EXTREME_DANGER' ? 'badge-critical' :
    heatHazard.status === 'DANGER' ? 'badge-high' :
    heatHazard.status === 'CAUTION' ? 'badge-moderate' : 'badge-normal';

  const airAccentClass = 
    airHazard.bucket === 'Severe' ? 'accent-bar-critical' :
    airHazard.bucket === 'Very Poor' ? 'accent-bar-high' :
    airHazard.bucket === 'Poor' ? 'accent-bar-moderate' : 'badge-normal';

  const airBadgeClass = 
    airHazard.bucket === 'Severe' ? 'badge-critical' :
    airHazard.bucket === 'Very Poor' ? 'badge-high' :
    airHazard.bucket === 'Poor' ? 'badge-moderate' : 'badge-normal';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Sensor Inactive Notice */}
      {!isEnvActive && (
        <div style={{ background: 'rgba(217, 142, 4, 0.1)', border: '1px solid rgba(217, 142, 4, 0.3)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PauseCircle size={15} color="#D98E04" />
          <span className="text-caption" style={{ color: '#D98E04', fontWeight: 600, fontSize: '11.5px' }}>
            Environmental AQI & Temperature Feeds Paused in Settings
          </span>
        </div>
      )}

      {/* Context Configuration Card */}
      <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span className="text-section-title" style={{ fontSize: '14px', marginBottom: '2px' }}>
          Environmental Context
        </span>

        {/* Row 1: Region Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} color="#6B7280" />
            <span className="text-body" style={{ fontSize: '13px' }}>Region (City Feed)</span>
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={env.city}
              onChange={(e) => onCityChange(e.target.value)}
              style={{
                background: '#FAFAF9',
                border: '1px solid #E7E5E2',
                borderRadius: '8px',
                padding: '5px 26px 5px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#15181C',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown 
              size={13} 
              color="#6B7280" 
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
          </div>
        </div>

        <div style={{ height: '1px', background: '#E7E5E2' }} />

        {/* Row 2: Vulnerable User Profile Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={15} color="#6B7280" />
              <span className="text-body" style={{ fontSize: '13px', fontWeight: 500 }}>Vulnerable User Profile</span>
            </div>
            <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
              Lowers risk thresholds for elderly / chronic patients
            </span>
          </div>
          <label className="switch-clean">
            <input
              type="checkbox"
              checked={isVulnerable}
              onChange={(e) => onToggleVulnerable(e.target.checked)}
            />
            <span className="slider-clean"></span>
          </label>
        </div>

        <div style={{ height: '1px', background: '#E7E5E2' }} />

        {/* Row 3: Disaster Mode Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={15} color="#6B7280" />
            <span className="text-body" style={{ fontSize: '13px' }}>Disaster Protocol</span>
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={env.disasterMode}
              onChange={(e) => onDisasterChange(e.target.value)}
              style={{
                background: '#FAFAF9',
                border: '1px solid #E7E5E2',
                borderRadius: '8px',
                padding: '5px 26px 5px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#15181C',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="none">Normal</option>
              <option value="flood">Flood Alert</option>
              <option value="cyclone">Cyclone Alert</option>
            </select>
            <ChevronDown 
              size={13} 
              color="#6B7280" 
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
          </div>
        </div>
      </div>

      {/* Continuous Environmental Monitoring Section Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
        <span className="text-section-title" style={{ fontSize: '14px', color: '#15181C' }}>
          Continuous Environmental Monitoring
        </span>
        <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
          Real-time ambient conditions for {env.city || 'selected region'} (always-on background tracking)
        </span>
      </div>

      {/* Heat-Wave Exposure Alert Card */}
      <div className={`app-card ${heatAccentClass}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} color="#D98E04" />
            <span className="text-section-title" style={{ fontSize: '14px' }}>
              Heat-Wave Exposure
            </span>
          </div>
          <span className={`badge-clean ${heatBadgeClass}`}>
            {heatHazard.status}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '8px', padding: '4px 8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span className="text-caption" style={{ color: '#6B7280' }}>Ambient:</span>
            <span className="text-mono-caption" style={{ fontWeight: 600, color: '#15181C' }}>{env.ambientTemp}°C</span>
          </div>
          <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '8px', padding: '4px 8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span className="text-caption" style={{ color: '#6B7280' }}>Humidity:</span>
            <span className="text-mono-caption" style={{ fontWeight: 600, color: '#15181C' }}>{env.ambientHumidity}%</span>
          </div>
          <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '8px', padding: '4px 8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span className="text-caption" style={{ color: '#6B7280' }}>Heat Index:</span>
            <span className="text-mono-caption" style={{ fontWeight: 600, color: '#15181C' }}>{heatHazard.heatIndex}°C</span>
          </div>
        </div>

        <p className="text-body-muted" style={{ fontSize: '13px', margin: '2px 0' }}>
          {heatHazard.description}
        </p>

        <div style={{ borderTop: '1px solid #E7E5E2', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {heatHazard.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px', color: '#15181C' }}>
              <span style={{ color: '#0E7C7B', fontWeight: 'bold', lineHeight: '1.2' }}>•</span>
              <span style={{ lineHeight: '18px' }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Air Quality Alert Card */}
      <div className={`app-card ${airAccentClass}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wind size={16} color="#0E7C7B" />
            <span className="text-section-title" style={{ fontSize: '14px' }}>
              Air Quality & Respiratory Risk
            </span>
          </div>
          <span className={`badge-clean ${airBadgeClass}`}>
            {airHazard.bucket}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '8px', padding: '4px 8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span className="text-caption" style={{ color: '#6B7280' }}>AQI:</span>
            <span className="text-mono-caption" style={{ fontWeight: 600, color: '#15181C' }}>{env.aqi}</span>
          </div>
          <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '8px', padding: '4px 8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span className="text-caption" style={{ color: '#6B7280' }}>PM2.5:</span>
            <span className="text-mono-caption" style={{ fontWeight: 600, color: '#15181C' }}>{env.pm25} µg/m³</span>
          </div>
          <div style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '8px', padding: '4px 8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span className="text-caption" style={{ color: '#6B7280' }}>Risk Score:</span>
            <span className="text-mono-caption" style={{ fontWeight: 600, color: '#15181C' }}>{airHazard.riskScore}/100</span>
          </div>
        </div>

        <p className="text-body-muted" style={{ fontSize: '13px', margin: '2px 0' }}>
          {airHazard.description}
        </p>

        <div style={{ borderTop: '1px solid #E7E5E2', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {airHazard.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px', color: '#15181C' }}>
              <span style={{ color: '#0E7C7B', fontWeight: 'bold', lineHeight: '1.2' }}>•</span>
              <span style={{ lineHeight: '18px' }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Honest Data Source Citation Caption */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px' }}>
        <Info size={12} color="#6B7280" />
        <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
          Source: India AQI Historical Dataset (CPCB, 2015–2020), city-level offline lookup.
        </span>
      </div>

      {/* Active Disaster Protocol Simulation Section Header */}
      {disasterAdvisory.active && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
          <span className="text-section-title" style={{ fontSize: '14px', color: isVulnerable ? '#C93A3A' : '#15181C' }}>
            Active Disaster Protocol Simulation
          </span>
          <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
            Specialized emergency clinical guidance for simulated event ({env.disasterMode?.toUpperCase() || 'EVENT'})
          </span>
        </div>
      )}

      {/* Disaster Advisory Card (Flood / Cyclone) */}
      {disasterAdvisory.active && (
        <div className={`app-card ${disasterAdvisory.accentClass || 'accent-bar-high'}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {env.disasterMode === 'flood' ? <Waves size={17} color={isVulnerable ? '#C93A3A' : '#E2622B'} /> : <CloudLightning size={17} color={isVulnerable ? '#C93A3A' : '#E2622B'} />}
              <span className="text-section-title" style={{ fontSize: '14px', color: '#15181C' }}>
                {disasterAdvisory.title}
              </span>
            </div>
            <span className={`badge-clean ${disasterAdvisory.badgeClass || 'badge-high'}`}>
              {disasterAdvisory.riskLevel || disasterAdvisory.severity}
            </span>
          </div>

          {/* Key Stat Chips */}
          {disasterAdvisory.keyStats?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {disasterAdvisory.keyStats.map((stat, idx) => (
                <div key={idx} style={{ background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '8px', padding: '4px 8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span className="text-caption" style={{ color: '#6B7280' }}>{stat.label}:</span>
                  <span className="text-mono-caption" style={{ fontWeight: 600, color: stat.value === 'Critical' || stat.value === 'Immediate' || stat.value === 'Severe' || stat.value === 'Extreme' ? '#C93A3A' : '#15181C' }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-body-muted" style={{ fontSize: '13px', margin: '2px 0' }}>
            {disasterAdvisory.description}
          </p>

          <div style={{ borderTop: '1px solid #E7E5E2', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {disasterAdvisory.recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px', color: '#15181C' }}>
                <span style={{ color: isVulnerable && i === 0 ? '#C93A3A' : '#0E7C7B', fontWeight: 'bold', lineHeight: '1.2' }}>•</span>
                <span style={{ lineHeight: '18px', fontWeight: isVulnerable && i === 0 ? 600 : 400, color: isVulnerable && i === 0 ? '#C93A3A' : '#15181C' }}>
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
