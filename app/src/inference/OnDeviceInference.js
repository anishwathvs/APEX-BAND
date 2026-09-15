/**
 * On-Device Edge AI Inference Engine
 * Executes compact Float32 neural network inference directly in-memory with zero cloud calls.
 * Designed for ultra-portable execution across Smartphones, Snapdragon Wear OS, and Microcontroller NPUs.
 */

import { VITALS_MODEL_DATA, FALL_MODEL_DATA, SLEEP_MODEL_DATA, MODELS_METADATA } from './models_data.js';

class OnDeviceNeuralExecutor {
  constructor(modelData) {
    this.modelData = modelData;
    this.weights = modelData.weights; // list of 2D arrays
    this.biases = modelData.biases;   // list of 1D arrays
    this.mean = modelData.scaler_mean;
    this.scale = modelData.scaler_scale;
    this.classes = modelData.classes;
  }

  // Standardize input features using fitted z-score parameters
  standardize(inputVector) {
    return inputVector.map((val, i) => (val - this.mean[i]) / (this.scale[i] || 1.0));
  }

  // ReLU activation
  relu(arr) {
    return arr.map(x => Math.max(0, x));
  }

  // Softmax activation for normalized probabilities
  softmax(arr) {
    const maxVal = Math.max(...arr);
    const expArr = arr.map(x => Math.exp(x - maxVal));
    const sumExp = expArr.reduce((acc, v) => acc + v, 0);
    return expArr.map(v => v / (sumExp || 1));
  }

  // Dense layer forward pass: Y = X * W + B
  dense(inputVector, weightMatrix, biasVector) {
    const outDim = biasVector.length;
    const inDim = inputVector.length;
    const output = new Array(outDim).fill(0);

    for (let j = 0; j < outDim; j++) {
      let sum = biasVector[j];
      for (let i = 0; i < inDim; i++) {
        sum += inputVector[i] * weightMatrix[i][j];
      }
      output[j] = sum;
    }
    return output;
  }

  // Complete Multi-Layer Neural Forward Pass
  forward(inputVector) {
    const startTime = performance.now();
    let layer = this.standardize(inputVector);

    // Hidden layer 1 + ReLU
    layer = this.dense(layer, this.weights[0], this.biases[0]);
    layer = this.relu(layer);

    // Hidden layer 2 + ReLU
    layer = this.dense(layer, this.weights[1], this.biases[1]);
    layer = this.relu(layer);

    // Output layer + Softmax
    layer = this.dense(layer, this.weights[2], this.biases[2]);
    const probabilities = this.softmax(layer);

    let maxIdx = 0;
    let maxProb = probabilities[0];
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }

    const inferenceLatencyMs = performance.now() - startTime;

    return {
      predictedClass: this.classes[maxIdx],
      predictedIndex: maxIdx,
      confidence: Math.round(maxProb * 100),
      probabilities: probabilities.map(p => Math.round(p * 100) / 100),
      latencyMs: Math.round(inferenceLatencyMs * 100) / 100,
      onDevice: true
    };
  }
}

// Instantiate on-device neural instances
const vitalsModel = new OnDeviceNeuralExecutor(VITALS_MODEL_DATA);
const fallModel = new OnDeviceNeuralExecutor(FALL_MODEL_DATA);
const sleepModel = new OnDeviceNeuralExecutor(SLEEP_MODEL_DATA);

/**
 * Predicts health anomalies and overall risk level from live wearable vitals.
 * Features: [HR, Skin Temp, EDA, Accel Mag, SpO2, PTT, PPG Amp, Resp Rate]
 */
export function predictVitalsAnomaly(features) {
  const result = vitalsModel.forward(features);
  const [hr, temp, eda, acc, spo2, ptt, ppgAmp, respRate] = features;

  const detectedAnomalies = [];

  if (hr > 105) detectedAnomalies.push(`Tachycardia Detected (HR: ${Math.round(hr)} bpm)`);
  else if (hr < 50) detectedAnomalies.push(`Bradycardia Detected (HR: ${Math.round(hr)} bpm)`);

  if (spo2 < 93) detectedAnomalies.push(`Respiratory Distress / Hypoxemia (SpO2: ${spo2}%)`);
  if (temp > 37.8) detectedAnomalies.push(`Hyperthermia / Heat Strain (Temp: ${temp.toFixed(1)}°C)`);
  if (eda > 5.0 && hr > 90) detectedAnomalies.push(`Acute Stress / Sympathetic Arousal (EDA: ${eda.toFixed(1)} µS)`);
  if (respRate > 24) detectedAnomalies.push(`Tachypnea / Rapid Breathing (${Math.round(respRate)} brpm)`);

  return {
    riskLevel: result.predictedClass,
    riskIndex: result.predictedIndex,
    confidence: result.confidence,
    probabilities: result.probabilities,
    latencyMs: result.latencyMs,
    detectedAnomalies,
    isNormal: result.predictedIndex === 0
  };
}

/**
 * Predicts fall event in real-time from 6-DOF IMU + Heart Rate.
 * Features: [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z, svm_total_g, heart_rate]
 */
export function predictFall(features) {
  const result = fallModel.forward(features);
  const svm = features[6];
  const isFall = result.predictedIndex === 1 || svm > 2.8;

  return {
    isFall,
    confidence: result.confidence,
    fallProbability: result.probabilities[1],
    svmMagnitudeG: Math.round(svm * 100) / 100,
    latencyMs: result.latencyMs
  };
}

/**
 * Predicts sleep stage and restorative sleep index from EEG & activity features.
 * Features: [delta_power, theta_power, alpha_power, beta_power, heart_rate, movement_index]
 */
export function predictSleepStage(features) {
  const result = sleepModel.forward(features);
  const stage = result.predictedClass;
  
  // Compute restorative sleep index based on Deep N3 + REM proportion
  let sleepScore = 75;
  if (stage === 'N3 Deep') sleepScore = 95;
  else if (stage === 'REM') sleepScore = 88;
  else if (stage === 'N2 Core') sleepScore = 78;
  else if (stage === 'N1 Light') sleepScore = 60;
  else if (stage === 'Wake (W)') sleepScore = 40;

  return {
    stage,
    stageIndex: result.predictedIndex,
    confidence: result.confidence,
    sleepQualityScore: sleepScore,
    latencyMs: result.latencyMs
  };
}

export function getModelsManifest() {
  return MODELS_METADATA;
}
