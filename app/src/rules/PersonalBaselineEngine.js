/**
 * Personal Baseline Engine
 * Computes on-device 7-day rolling baseline for each physiological metric
 * and detects personal deviations rather than static global thresholds.
 */

export class PersonalBaselineEngine {
  constructor(initialBaseline = null) {
    this.baseline = initialBaseline || {
      heartRate: { mean: 72, std: 4.5, min: 58, max: 88 },
      spo2: { mean: 98.2, std: 0.8, min: 96, max: 100 },
      skinTemp: { mean: 36.5, std: 0.25, min: 35.8, max: 37.2 },
      activitySteps: { mean: 8200, std: 1200, min: 4500, max: 12000 },
      sleepQuality: { mean: 84, std: 6, min: 65, max: 95 }
    };

    // Rolling history for 7-day window
    this.history = {
      heartRate: [71, 73, 70, 74, 72, 71, 72],
      spo2: [98.1, 98.4, 98.0, 98.5, 98.2, 98.3, 98.2],
      skinTemp: [36.4, 36.6, 36.5, 36.4, 36.7, 36.5, 36.5],
      activitySteps: [7800, 8400, 9100, 6500, 8900, 8100, 8600],
      sleepQuality: [82, 85, 88, 79, 86, 84, 85]
    };
  }

  reset() {
    this.history = {
      heartRate: [71, 73, 70, 74, 72, 71, 72],
      spo2: [98.1, 98.4, 98.0, 98.5, 98.2, 98.3, 98.2],
      skinTemp: [36.4, 36.6, 36.5, 36.4, 36.7, 36.5, 36.5],
      activitySteps: [7800, 8400, 9100, 6500, 8900, 8100, 8600],
      sleepQuality: [82, 85, 88, 79, 86, 84, 85]
    };
    this.baseline = {
      heartRate: { mean: 72, std: 4.5, min: 58, max: 88 },
      spo2: { mean: 98.2, std: 0.8, min: 96, max: 100 },
      skinTemp: { mean: 36.5, std: 0.25, min: 35.8, max: 37.2 },
      activitySteps: { mean: 8200, std: 1200, min: 4500, max: 12000 },
      sleepQuality: { mean: 84, std: 6, min: 65, max: 95 }
    };
  }

  // Update rolling baseline with new observation
  updateObservation(metric, value) {
    if (!this.history[metric]) return;
    this.history[metric].push(value);
    if (this.history[metric].length > 7) {
      this.history[metric].shift();
    }

    // Recompute mean and standard deviation
    const vals = this.history[metric];
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    const std = Math.sqrt(variance) || 0.1;

    this.baseline[metric] = {
      mean: Math.round(mean * 10) / 10,
      std: Math.round(std * 100) / 100,
      min: Math.min(...vals),
      max: Math.max(...vals)
    };
  }

  // Check how many standard deviations current metric deviates from user's rolling baseline
  checkDeviation(metric, currentValue) {
    const base = this.baseline[metric];
    if (!base) return { zScore: 0, status: 'NORMAL', delta: 0 };

    const delta = currentValue - base.mean;
    const zScore = delta / (base.std || 1);

    let status = 'NORMAL';
    if (Math.abs(zScore) >= 2.5) {
      status = 'SEVERE_DEVIATION';
    } else if (Math.abs(zScore) >= 1.7) {
      status = 'MODERATE_DEVIATION';
    }

    return {
      current: currentValue,
      baselineMean: base.mean,
      delta: Math.round(delta * 10) / 10,
      zScore: Math.round(zScore * 100) / 100,
      status,
      isSignificantAnomaly: status !== 'NORMAL',
      isElevated: delta > 0,
      isDepressed: delta < 0
    };
  }

  // Holistic baseline report
  getBaselineSummary(currentVitals) {
    return {
      heartRate: this.checkDeviation('heartRate', currentVitals.heartRate),
      spo2: this.checkDeviation('spo2', currentVitals.spo2),
      skinTemp: this.checkDeviation('skinTemp', currentVitals.skinTemp),
      activitySteps: this.checkDeviation('activitySteps', currentVitals.steps || 7500),
      sleepQuality: this.checkDeviation('sleepQuality', currentVitals.sleepQuality || 82),
      baseline: this.baseline
    };
  }
}

export const personalBaselineEngine = new PersonalBaselineEngine();
