import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  PhoneCall, 
  LayoutDashboard, 
  Settings, 
  Wifi, 
  WifiOff, 
  LogIn, 
  Home,
  ShieldCheck,
  MapPin,
  MessageSquare,
  Bluetooth,
  Check
} from 'lucide-react';

import { sensorSimulator } from './simulator/SensorSimulator';
import { predictVitalsAnomaly, predictFall, predictSleepStage } from './inference/OnDeviceInference';
import { personalBaselineEngine } from './rules/PersonalBaselineEngine';
import { DisasterRuleEngine } from './rules/DisasterRuleEngine';
import { calculateWellnessScore } from './rules/WellnessScoreCalculator';
import { generatePersonalizedRecommendations } from './rules/RecommendationsEngine';

import { LandingScreen } from './screens/LandingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { LiveVitalsScreen } from './screens/LiveVitalsScreen';
import { AlertsScreen } from './screens/AlertsScreen';
import { SOSScreen } from './screens/SOSScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export function App() {
  // Top-level product view: 'landing' | 'login' | 'app'
  const [currentView, setCurrentView] = useState('app'); 
  const [activeTab, setActiveTab] = useState('vitals'); // 'vitals' | 'alerts' | 'sos' | 'dashboard' | 'settings'

  // Hydrate initial state from real localStorage
  const [isAirplaneMode, setIsAirplaneMode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hp_airplane_mode')) || false;
    } catch { return false; }
  });

  const [isVulnerable, setIsVulnerable] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hp_is_vulnerable')) || false;
    } catch { return false; }
  });

  const [sensorPerms, setSensorPerms] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hp_sensor_perms')) || {
        heartRate: true,
        imu: true,
        environment: true
      };
    } catch {
      return { heartRate: true, imu: true, environment: true };
    }
  });

  const [currentScenario, setCurrentScenario] = useState('NORMAL');
  const [isFallActive, setIsFallActive] = useState(false);
  const [measuredLatency, setMeasuredLatency] = useState(0.28);
  const [currentUser, setCurrentUser] = useState({ name: 'Demo Patient', email: 'demo@healthpulse.edge' });

  // Onboarding Permission Modal state
  const [showPermissionModal, setShowPermissionModal] = useState(() => {
    try {
      return localStorage.getItem('hp_permissions_prompted') !== 'true';
    } catch { return true; }
  });

  const handleGrantPermissions = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => console.log('Location permission granted:', pos.coords),
        (err) => console.warn('Location permission notice:', err.message),
        { timeout: 6000 }
      );
    }
    try {
      localStorage.setItem('hp_permissions_prompted', 'true');
    } catch {}
    setShowPermissionModal(false);
  };

  const handleSkipPermissions = () => {
    try {
      localStorage.setItem('hp_permissions_prompted', 'true');
    } catch {}
    setShowPermissionModal(false);
  };

  // Live telemetry state
  const [telemetry, setTelemetry] = useState({
    timestamp: '--:--',
    scenario: 'NORMAL',
    sensorMask: { heartRate: true, imu: true, environment: true },
    vitals: { heartRate: 72, spo2: 98.4, skinTemp: 36.5, eda: 1.2, respiratoryRate: 15, steps: 7200, sleepQuality: 86 },
    environment: { city: 'Delhi', ambientTemp: 32, ambientHumidity: 55, aqi: 85, pm25: 45, aqiBucket: 'Satisfactory', disasterMode: 'none' },
    imu: { acc_x: 0.05, acc_y: 0.98, acc_z: 0.1, gyro_x: 0.5, gyro_y: 0.2, gyro_z: 0.1, svm_total_g: 1.0 },
    sleepStage: 'N2 Core',
    modelAFeatures: [72, 36.5, 1.2, 1.0, 98.4, 235, 0.9, 15],
    modelBFeatures: [0.05, 0.98, 0.1, 0.5, 0.2, 0.1, 1.0, 72],
    modelCFeatures: [45, 50, 12, 12, 62, 0.04]
  });

  const [vitalsRisk, setVitalsRisk] = useState({
    riskLevel: 'Low',
    riskIndex: 0,
    confidence: 98,
    probabilities: [0.98, 0.02, 0, 0],
    latencyMs: 0.28,
    detectedAnomalies: [],
    isNormal: true
  });

  const [fallPrediction, setFallPrediction] = useState({
    isFall: false,
    confidence: 100,
    fallProbability: 0,
    svmMagnitudeG: 1.0,
    latencyMs: 0.25
  });

  const [heatHazard, setHeatHazard] = useState({
    heatIndex: 32,
    ambientTemp: 32,
    ambientHumidity: 55,
    status: 'NORMAL',
    riskScore: 15,
    description: 'Thermal conditions are optimal.',
    recommendations: ['Maintain regular hydration.']
  });

  const [airHazard, setAirHazard] = useState({
    aqi: 85,
    pm25: 45,
    bucket: 'Satisfactory',
    riskScore: 20,
    description: 'Air quality is acceptable.',
    recommendations: ['Safe for regular outdoor activities.']
  });

  const [disasterAdvisory, setDisasterAdvisory] = useState({
    active: false,
    type: 'NONE',
    title: 'No Active Natural Disaster',
    severity: 'LOW',
    recommendations: []
  });

  const [baselineReport, setBaselineReport] = useState(null);
  const [wellnessScore, setWellnessScore] = useState({ score: 92, rating: 'Excellent', badgeColor: '#1A9B5C' });
  const [recommendations, setRecommendations] = useState([]);

  // Hydrate Alert History from localStorage
  const [alertHistory, setAlertHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_alert_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'alt_01', title: 'Normal Baseline Check', detail: 'All 5 physiological sensors calibrated', timestamp: '10:00 AM', status: 'Resolved' }
    ];
  });

  // Sync settings & perms to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hp_airplane_mode', JSON.stringify(isAirplaneMode));
      localStorage.setItem('hp_is_vulnerable', JSON.stringify(isVulnerable));
      localStorage.setItem('hp_sensor_perms', JSON.stringify(sensorPerms));
      localStorage.setItem('hp_alert_history', JSON.stringify(alertHistory));
    } catch (e) {
      console.warn('LocalStorage sync warning:', e);
    }
  }, [isAirplaneMode, isVulnerable, sensorPerms, alertHistory]);

  // Update simulator sensor mask when perms change
  useEffect(() => {
    sensorSimulator.setSensorMask(sensorPerms);
  }, [sensorPerms]);

  // Telemetry simulator & on-device edge AI loop
  useEffect(() => {
    sensorSimulator.start(1400);

    const unsubscribe = sensorSimulator.subscribe((snapshot) => {
      setTelemetry(snapshot);

      // Measure exact execution time of on-device neural forward passes
      const startInference = performance.now();

      // 1. Run On-Device Model A if vitals sensor active
      let vRisk = { riskLevel: 'Low', riskIndex: 0, confidence: 95, probabilities: [0.95, 0.05, 0, 0], latencyMs: 0.2, detectedAnomalies: [], isNormal: true };
      if (snapshot.vitals) {
        vRisk = predictVitalsAnomaly(snapshot.modelAFeatures);
        setVitalsRisk(vRisk);
      }

      // 2. Run On-Device Model B if IMU sensor active
      if (snapshot.imu) {
        const fPred = predictFall(snapshot.modelBFeatures);
        setFallPrediction(fPred);
        if (fPred.isFall || snapshot.isFallTriggered) {
          setIsFallActive(true);
        }
      }

      const totalInferenceTime = performance.now() - startInference;
      const rounded = Math.round(totalInferenceTime * 100) / 100;
      setMeasuredLatency(rounded > 0 ? rounded : 0.15);

      // 3. Compute 7-day Rolling Baseline Deviations if vitals present
      let bReport = null;
      if (snapshot.vitals) {
        personalBaselineEngine.updateObservation('heartRate', snapshot.vitals.heartRate);
        personalBaselineEngine.updateObservation('spo2', snapshot.vitals.spo2);
        personalBaselineEngine.updateObservation('skinTemp', snapshot.vitals.skinTemp);
        bReport = personalBaselineEngine.getBaselineSummary(snapshot.vitals);
        setBaselineReport(bReport);
      }

      // 4. Evaluate Hazards if environment sensor present
      let hHazard = heatHazard;
      let aHazard = airHazard;
      if (snapshot.environment) {
        hHazard = DisasterRuleEngine.evaluateHeatHazard(
          snapshot.environment.ambientTemp,
          snapshot.environment.ambientHumidity,
          snapshot.vitals || { heartRate: 72, skinTemp: 36.5 },
          isVulnerable
        );
        setHeatHazard(hHazard);

        aHazard = DisasterRuleEngine.evaluateAirQualityRisk(
          snapshot.environment.aqi,
          snapshot.environment.pm25,
          snapshot.vitals || { respiratoryRate: 15, spo2: 98 },
          isVulnerable
        );
        setAirHazard(aHazard);

        const dAdvisory = DisasterRuleEngine.getDisasterAdvisory(snapshot.environment.disasterMode, isVulnerable);
        setDisasterAdvisory(dAdvisory);
      }

      // 5. Compute Holistic Wellness Score (0–100)
      if (snapshot.vitals) {
        const combinedEnvRisk = Math.max(hHazard.riskScore, aHazard.riskScore);
        const wScore = calculateWellnessScore(snapshot.vitals, snapshot.vitals.sleepQuality, combinedEnvRisk, bReport);
        setWellnessScore(wScore);

        // 6. Generate Actionable Recommendations
        const recs = generatePersonalizedRecommendations({
          vitalsRisk: vRisk,
          heatHazard: hHazard,
          airHazard: aHazard,
          disasterAdvisory: DisasterRuleEngine.getDisasterAdvisory(snapshot.environment?.disasterMode || 'none', isVulnerable),
          wellnessScore: wScore,
          isVulnerable
        });
        setRecommendations(recs);
      }

      // Log high risk alerts to history
      if (snapshot.vitals && (!vRisk.isNormal || hHazard.status === 'EXTREME_DANGER' || aHazard.bucket === 'Severe')) {
        const newAlert = {
          id: `alt_${Date.now()}`,
          title: vRisk.detectedAnomalies[0] || `${hHazard.status} Heat Alert`,
          detail: `Confidence: ${vRisk.confidence}% | AQI: ${snapshot.environment?.aqi || 'N/A'}`,
          timestamp: snapshot.timestamp,
          status: 'Active'
        };
        setAlertHistory((prev) => [newAlert, ...prev.slice(0, 15)]);
      }
    });

    return () => {
      unsubscribe();
      sensorSimulator.stop();
    };
  }, [isVulnerable, sensorPerms]);

  const handleScenarioChange = (scenarioId) => {
    setCurrentScenario(scenarioId);
    sensorSimulator.setScenario(scenarioId);
    if (scenarioId === 'FALL_INCIDENT') {
      setIsFallActive(true);
      setActiveTab('sos');
    }
  };

  const handleCityChange = (city) => {
    sensorSimulator.setCity(city);
  };

  const handleDisasterChange = (mode) => {
    sensorSimulator.setDisasterMode(mode);
  };

  // Real data wipe: removes all keys from localStorage and resets state
  const handleWipeData = () => {
    try {
      localStorage.removeItem('hp_alert_history');
      localStorage.removeItem('hp_baseline_history');
      localStorage.removeItem('hp_settings');
      localStorage.removeItem('hp_sensor_perms');
      localStorage.removeItem('hp_airplane_mode');
      localStorage.removeItem('hp_is_vulnerable');
    } catch (e) {
      console.error('Data wipe error:', e);
    }
    setAlertHistory([]);
    personalBaselineEngine.reset();
    alert('Persistent storage wiped clean from browser localStorage. Zero residual health data.');
  };

  const handleResolveAlert = (alertId) => {
    setAlertHistory((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'Resolved' } : a))
    );
  };

  return (
    <div className="app-device-wrapper">
      <div className="app-mobile-container">
        {/* Global Minimalist Header */}
        <header style={{ padding: '16px 20px 12px 20px', background: '#FFFFFF', borderBottom: '1px solid #E7E5E2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="text-display" style={{ fontSize: '20px', lineHeight: '26px' }}>
                HealthPulse<span style={{ color: '#0E7C7B' }}>EDGE</span>
              </h1>
              <p className="text-caption" style={{ color: '#6B7280', fontSize: '11px', marginTop: '1px' }}>
                SIH 2026 · Qualcomm PS 26181
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentView !== 'app' ? (
                <button
                  onClick={() => setCurrentView('app')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: '#0E7C7B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Enter App
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('landing')}
                  title="View Landing Page"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '8px',
                    background: '#FAFAF9',
                    border: '1px solid #E7E5E2',
                    color: '#6B7280',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Home size={12} />
                  <span>Intro</span>
                </button>
              )}

              {/* Status Dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FAFAF9', border: '1px solid #E7E5E2', borderRadius: '14px', padding: '3px 8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAirplaneMode ? '#D98E04' : '#1A9B5C' }} />
                <span className="text-mono-caption" style={{ fontSize: '10.5px', fontWeight: 600, color: '#15181C' }}>
                  {isAirplaneMode 
                    ? 'Offline' 
                    : (currentView === 'landing' || currentView === 'login') 
                      ? 'Edge AI Ready' 
                      : `Edge AI ${measuredLatency.toFixed(2)}ms`}
                </span>
              </div>

              <button
                onClick={() => setIsAirplaneMode(!isAirplaneMode)}
                title={isAirplaneMode ? 'Disable Offline Mode' : 'Enable Offline Mode'}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  background: isAirplaneMode ? 'rgba(217, 142, 4, 0.12)' : '#FAFAF9',
                  border: isAirplaneMode ? '1px solid rgba(217, 142, 4, 0.3)' : '1px solid #E7E5E2',
                  cursor: 'pointer',
                  color: isAirplaneMode ? '#D98E04' : '#6B7280'
                }}
              >
                {isAirplaneMode ? <WifiOff size={14} /> : <Wifi size={14} />}
              </button>
            </div>
          </div>
        </header>

        {/* Signature Element: Living Pulse Line */}
        <div className="living-pulse-container">
          <div className="living-pulse-line"></div>
        </div>

        {/* Screen Body Container */}
        <main className="screen-content-area" style={{ paddingBottom: currentView === 'app' ? '88px' : '24px' }}>
          {currentView === 'landing' && (
            <LandingScreen
              onGetStarted={() => setCurrentView('app')}
              onLogin={() => setCurrentView('login')}
            />
          )}

          {currentView === 'login' && (
            <LoginScreen
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                setCurrentView('app');
              }}
              onBackToLanding={() => setCurrentView('landing')}
            />
          )}

          {currentView === 'app' && (
            <>
              {activeTab === 'vitals' && (
                <LiveVitalsScreen
                  telemetry={telemetry}
                  vitalsRisk={vitalsRisk}
                  baselineReport={baselineReport}
                  wellnessScore={wellnessScore}
                  onScenarioChange={handleScenarioChange}
                  currentScenario={currentScenario}
                  sensorPerms={sensorPerms}
                />
              )}

              {activeTab === 'alerts' && (
                <AlertsScreen
                  telemetry={telemetry}
                  heatHazard={heatHazard}
                  airHazard={airHazard}
                  disasterAdvisory={disasterAdvisory}
                  isVulnerable={isVulnerable}
                  onToggleVulnerable={setIsVulnerable}
                  onCityChange={handleCityChange}
                  onDisasterChange={handleDisasterChange}
                  sensorPerms={sensorPerms}
                />
              )}

              {activeTab === 'sos' && (
                <SOSScreen
                  telemetry={telemetry}
                  fallPrediction={fallPrediction}
                  isFallActive={isFallActive}
                  onTriggerFall={() => setIsFallActive(true)}
                  onResetFall={() => setIsFallActive(false)}
                  sensorPerms={sensorPerms}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardScreen
                  telemetry={telemetry}
                  heatHazard={heatHazard}
                  airHazard={airHazard}
                  vitalsRisk={vitalsRisk}
                  recommendations={recommendations}
                  alertHistory={alertHistory}
                  onResolveAlert={handleResolveAlert}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsScreen
                  telemetry={telemetry}
                  isAirplaneMode={isAirplaneMode}
                  onToggleAirplaneMode={setIsAirplaneMode}
                  onWipeData={handleWipeData}
                  baselineReport={baselineReport}
                  wellnessScore={wellnessScore}
                  sensorPerms={sensorPerms}
                  onToggleSensorPerm={(key, val) => setSensorPerms(prev => ({ ...prev, [key]: val }))}
                />
              )}
            </>
          )}
        </main>

        {/* Fixed Bottom Navigation Bar */}
        {currentView === 'app' && (
          <nav className="app-bottom-nav">
            <button
              onClick={() => setActiveTab('vitals')}
              className={`nav-tab-btn ${activeTab === 'vitals' ? 'active' : ''}`}
            >
              <Activity size={18} className="nav-tab-icon" />
              <span>Vitals</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`nav-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            >
              <div style={{ position: 'relative' }}>
                <AlertTriangle size={18} className="nav-tab-icon" />
                {(heatHazard.status !== 'NORMAL' || airHazard.bucket === 'Severe') && (
                  <span style={{ position: 'absolute', top: '-1px', right: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: '#C93A3A' }} />
                )}
              </div>
              <span>Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab('sos')}
              className={`nav-tab-btn ${activeTab === 'sos' ? 'active' : ''}`}
            >
              <div style={{ position: 'relative' }}>
                <PhoneCall size={18} className="nav-tab-icon" style={{ color: isFallActive ? '#C93A3A' : undefined }} />
                {isFallActive && (
                  <span style={{ position: 'absolute', top: '-1px', right: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: '#C93A3A' }} />
                )}
              </div>
              <span>SOS</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} className="nav-tab-icon" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <Settings size={18} className="nav-tab-icon" />
              <span>Settings</span>
            </button>
          </nav>
        )}

        {/* Permission Request Onboarding Modal */}
        {showPermissionModal && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(21, 24, 28, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div className="app-card" style={{
              width: '100%',
              maxWidth: '350px',
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              borderRadius: '20px',
              background: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(14, 124, 123, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} color="#0E7C7B" />
                </div>
                <div>
                  <span className="text-section-title" style={{ fontSize: '15px', display: 'block' }}>
                    Permissions & Privacy
                  </span>
                  <span className="text-caption" style={{ fontSize: '11px', color: '#6B7280' }}>
                    100% On-Device · Zero Cloud Storage
                  </span>
                </div>
              </div>

              <p className="text-caption" style={{ fontSize: '12px', color: '#15181C', lineHeight: '17px' }}>
                HealthPulseEDGE processes all health models locally. Please grant the following permissions for full emergency protection:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#FAFAF9', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E7E5E2' }}>
                  <MapPin size={15} color="#0E7C7B" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span className="text-caption" style={{ fontWeight: 600, color: '#15181C', fontSize: '11.5px', display: 'block' }}>GPS Geolocation</span>
                    <span className="text-caption" style={{ fontSize: '10.5px', color: '#6B7280' }}>Attaches live emergency coordinates to SOS alerts</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#FAFAF9', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E7E5E2' }}>
                  <MessageSquare size={15} color="#0E7C7B" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span className="text-caption" style={{ fontWeight: 600, color: '#15181C', fontSize: '11.5px', display: 'block' }}>Direct-SIM SMS</span>
                    <span className="text-caption" style={{ fontSize: '10.5px', color: '#6B7280' }}>Transmits emergency alerts to kin via phone SIM card</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#FAFAF9', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E7E5E2' }}>
                  <Bluetooth size={15} color="#0E7C7B" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span className="text-caption" style={{ fontWeight: 600, color: '#15181C', fontSize: '11.5px', display: 'block' }}>Bluetooth Sensor Sync</span>
                    <span className="text-caption" style={{ fontSize: '10.5px', color: '#6B7280' }}>Pairs with ESP32-S3 wearable for continuous telemetry</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <button
                  onClick={handleGrantPermissions}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#0E7C7B',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(14, 124, 123, 0.25)'
                  }}
                >
                  <Check size={16} color="#FFFFFF" />
                  <span>Grant Permissions & Continue</span>
                </button>

                <button
                  onClick={handleSkipPermissions}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: '10px',
                    background: 'transparent',
                    color: '#6B7280',
                    fontWeight: 500,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Continue in Offline Demo Mode
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
