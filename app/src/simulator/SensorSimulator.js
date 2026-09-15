/**
 * Sensor Stream Simulator & Dataset Replay Service
 * Streams real-time physiological & environmental telemetry from bundled offline datasets
 * (WESAD, PTT PPG, India AQI, Geriatric Fall, Sleep-EDF).
 */

import { WESAD_SAMPLES, FALL_SAMPLES, SLEEP_SAMPLES, INDIA_AQI_SAMPLES, PTT_PPG_SAMPLES } from './dataset_samples.js';

export const SCENARIOS = {
  NORMAL: {
    id: 'NORMAL',
    name: 'Normal Baseline State',
    description: 'Resting baseline physiology with moderate environmental conditions (Chennai/Bengaluru).'
  },
  HEAT_WAVE: {
    id: 'HEAT_WAVE',
    name: 'Heat Wave & Thermal Strain',
    description: 'Extreme ambient heat (43°C, 65% humidity) inducing heat stress, rising core temp and tachycardia.'
  },
  AIR_POLLUTION: {
    id: 'AIR_POLLUTION',
    name: 'Severe Air Pollution (Delhi AQI)',
    description: 'Hazardous PM2.5 spike with respiratory distress and SpO2 desaturation.'
  },
  TACHYCARDIA_STRESS: {
    id: 'TACHYCARDIA_STRESS',
    name: 'Acute Tachycardia & Stress',
    description: 'Sympathetic nervous surge, elevated EDA (WESAD stress state) and high heart rate.'
  },
  FALL_INCIDENT: {
    id: 'FALL_INCIDENT',
    name: 'Sudden Fall Impact (Geriatric)',
    description: 'High peak 4.2G acceleration and angular tumble triggering on-device fall classifier.'
  },
  DISASTER_FLOOD: {
    id: 'DISASTER_FLOOD',
    name: 'Monsoon Flood & Cyclone Mode',
    description: 'Natural disaster state with waterborne hazard advisories and emergency prep.'
  }
};

export class SensorSimulator {
  constructor() {
    this.currentScenario = 'NORMAL';
    this.currentIndex = 0;
    this.subscribers = [];
    this.intervalId = null;
    this.isPaused = false;
    this.selectedCity = 'Delhi';
    this.selectedDisaster = 'none';
    this.sensorMask = {
      heartRate: true,
      imu: true,
      environment: true
    };

    // Synthetic live waveforms
    this.ppgWaveform = [];
    for (let i = 0; i < 40; i++) {
      this.ppgWaveform.push(Math.sin((i / 40) * Math.PI * 4) * 20 + 50);
    }
  }

  setSensorMask(mask) {
    this.sensorMask = { ...this.sensorMask, ...mask };
    this.tick();
  }

  setScenario(scenarioId) {
    this.currentScenario = scenarioId;
    this.currentIndex = 0;

    if (scenarioId === 'DISASTER_FLOOD') {
      this.selectedDisaster = 'flood';
    } else if (scenarioId === 'HEAT_WAVE') {
      this.selectedCity = 'Delhi';
    } else if (scenarioId === 'AIR_POLLUTION') {
      this.selectedCity = 'Delhi';
    }

    this.tick();
  }

  setCity(city) {
    this.selectedCity = city;
    this.tick();
  }

  setDisasterMode(disasterType) {
    this.selectedDisaster = disasterType;
    this.tick();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  start(intervalMs = 1500) {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.tick(), intervalMs);
    this.tick();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick() {
    if (this.isPaused) return;

    this.currentIndex++;
    const wIdx = this.currentIndex % (WESAD_SAMPLES.length || 1);
    const pIdx = this.currentIndex % (PTT_PPG_SAMPLES.length || 1);
    const fIdx = this.currentIndex % (FALL_SAMPLES.length || 1);
    const sIdx = this.currentIndex % (SLEEP_SAMPLES.length || 1);

    const wesad = WESAD_SAMPLES[wIdx] || { heart_rate_bpm: 72, skin_temp_c: 36.5, eda_microsiemens: 1.2, acc_magnitude_g: 1.0 };
    const ptt = PTT_PPG_SAMPLES[pIdx] || { spo2_pct: 98.4, ptt_ms: 235, ppg_amplitude: 0.9, respiratory_rate_brpm: 15 };
    const fall = FALL_SAMPLES[fIdx] || { acc_x: 0.05, acc_y: 0.98, acc_z: 0.1, gyro_x: 0.5, gyro_y: 0.2, gyro_z: 0.1, svm_total_g: 1.0, heart_rate: 72, fall_label: 0 };
    const sleep = SLEEP_SAMPLES[sIdx] || { stage: 'N2', stage_idx: 2, delta_power_uV2: 45, theta_power_uV2: 50, alpha_power_uV2: 12, beta_power_uV2: 12, heart_rate_bpm: 62, movement_index: 0.04 };

    // Filter AQI for chosen city
    const cityAqiList = INDIA_AQI_SAMPLES.filter(r => r.City === this.selectedCity) || INDIA_AQI_SAMPLES;
    const aqiRow = cityAqiList[this.currentIndex % (cityAqiList.length || 1)] || {
      City: this.selectedCity,
      AQI: 85,
      AQI_Bucket: 'Satisfactory',
      PM25: 45,
      PM10: 75,
      NO2: 25,
      Ambient_Temp_C: 30,
      Ambient_Humidity_Pct: 60
    };

    // Scenario Overrides
    let heartRate = (wesad.heart_rate_bpm + ptt.heart_rate_bpm) / 2;
    let skinTemp = wesad.skin_temp_c;
    let eda = wesad.eda_microsiemens;
    let accMag = wesad.acc_magnitude_g;
    let spo2 = ptt.spo2_pct;
    let pttMs = ptt.ptt_ms;
    let ppgAmp = ptt.ppg_amplitude;
    let respRate = ptt.respiratory_rate_brpm;
    let ambientTemp = aqiRow.Ambient_Temp_C;
    let ambientHumidity = aqiRow.Ambient_Humidity_Pct;
    let aqi = aqiRow.AQI;
    let pm25 = aqiRow['PM2.5'] || 50;
    let imu = {
      acc_x: fall.acc_x,
      acc_y: fall.acc_y,
      acc_z: fall.acc_z,
      gyro_x: fall.gyro_x,
      gyro_y: fall.gyro_y,
      gyro_z: fall.gyro_z,
      svm_total_g: fall.svm_total_g
    };
    let isFallTriggered = false;

    if (this.currentScenario === 'HEAT_WAVE') {
      ambientTemp = 43.5 + Math.sin(this.currentIndex * 0.2) * 1.5;
      ambientHumidity = 68 + Math.cos(this.currentIndex * 0.2) * 5;
      skinTemp = 38.4 + Math.sin(this.currentIndex * 0.1) * 0.4;
      heartRate = 118 + Math.random() * 8;
      eda = 8.5 + Math.random() * 2.0;
      respRate = 24 + Math.random() * 3;
    } else if (this.currentScenario === 'AIR_POLLUTION') {
      aqi = 388 + Math.random() * 25;
      pm25 = 230 + Math.random() * 20;
      spo2 = 90.5 - Math.random() * 2.0; // Desaturation
      respRate = 27 + Math.random() * 4;
      heartRate = 104 + Math.random() * 6;
    } else if (this.currentScenario === 'TACHYCARDIA_STRESS') {
      heartRate = 136 + Math.random() * 12;
      eda = 11.2 + Math.random() * 2.5;
      skinTemp = 37.1 + Math.random() * 0.2;
    } else if (this.currentScenario === 'FALL_INCIDENT') {
      imu = {
        acc_x: 2.8,
        acc_y: 3.4,
        acc_z: 1.9,
        gyro_x: 245.0,
        gyro_y: 310.0,
        gyro_z: 180.0,
        svm_total_g: 4.8
      };
      heartRate = 122 + Math.random() * 8;
      isFallTriggered = true;
    } else if (this.currentScenario === 'NORMAL') {
      heartRate = 72 + Math.sin(this.currentIndex * 0.3) * 4;
      skinTemp = 36.5 + Math.sin(this.currentIndex * 0.1) * 0.15;
      spo2 = 98.6 + Math.sin(this.currentIndex * 0.2) * 0.5;
      eda = 1.2 + Math.random() * 0.3;
      respRate = 15 + Math.random() * 2;
    }

    // Compose vector features for on-device inference:
    // Model A: [HR, Skin Temp, EDA, Accel Mag, SpO2, PTT, PPG Amp, Resp Rate]
    const modelAFeatures = [
      Math.round(heartRate * 10) / 10,
      Math.round(skinTemp * 10) / 10,
      Math.round(eda * 100) / 100,
      Math.round(accMag * 100) / 100,
      Math.round(spo2 * 10) / 10,
      Math.round(pttMs * 10) / 10,
      Math.round(ppgAmp * 100) / 100,
      Math.round(respRate * 10) / 10
    ];

    // Model B: [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z, svm_total_g, heart_rate]
    const modelBFeatures = [
      imu.acc_x,
      imu.acc_y,
      imu.acc_z,
      imu.gyro_x,
      imu.gyro_y,
      imu.gyro_z,
      imu.svm_total_g,
      Math.round(heartRate)
    ];

    // Model C: [delta, theta, alpha, beta, hr, movement]
    const modelCFeatures = [
      sleep.delta_power_uV2,
      sleep.theta_power_uV2,
      sleep.alpha_power_uV2,
      sleep.beta_power_uV2,
      sleep.heart_rate_bpm,
      sleep.movement_index
    ];

    const snapshot = {
      timestamp: new Date().toLocaleTimeString(),
      scenario: this.currentScenario,
      sensorMask: this.sensorMask,
      vitals: this.sensorMask.heartRate ? {
        heartRate: Math.round(heartRate),
        spo2: Math.min(100, Math.max(70, Math.round(spo2 * 10) / 10)),
        skinTemp: Math.round(skinTemp * 10) / 10,
        eda: Math.round(eda * 100) / 100,
        respiratoryRate: Math.round(respRate),
        steps: 6420 + this.currentIndex * 12,
        sleepQuality: 86
      } : null,
      environment: this.sensorMask.environment ? {
        city: this.selectedCity,
        ambientTemp: Math.round(ambientTemp * 10) / 10,
        ambientHumidity: Math.round(ambientHumidity),
        aqi: Math.round(aqi),
        pm25: Math.round(pm25),
        aqiBucket: aqiRow.AQI_Bucket || 'Moderate',
        disasterMode: this.selectedDisaster
      } : null,
      imu: this.sensorMask.imu ? imu : null,
      sleepStage: sleep.stage,
      modelAFeatures,
      modelBFeatures,
      modelCFeatures,
      isFallTriggered: this.currentScenario === 'FALL_INCIDENT'
    };

    this.subscribers.forEach(cb => cb(snapshot));
  }
}

export const sensorSimulator = new SensorSimulator();
