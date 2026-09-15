/**
 * Daily Wellness Indicator Calculator
 * Holistic on-device wellness score (0–100) combining physiological vitals,
 * sleep restoration, physical activity, and environmental risk.
 */

export function calculateWellnessScore(vitals, sleepQuality, environmentalRiskScore, baselineReport) {
  let score = 100;

  // 1. Heart Rate Penalty (deviation from 60-80 bpm baseline)
  const hr = vitals.heartRate || 72;
  if (hr > 100) score -= Math.min(25, (hr - 100) * 0.8);
  else if (hr < 55) score -= Math.min(15, (55 - hr) * 0.7);

  // 2. SpO2 Oxygenation Penalty
  const spo2 = vitals.spo2 || 98;
  if (spo2 < 95) score -= Math.min(30, (95 - spo2) * 5.0);

  // 3. Body Temperature Penalty
  const temp = vitals.skinTemp || 36.5;
  if (temp > 37.2) score -= Math.min(25, (temp - 37.2) * 15.0);
  else if (temp < 35.8) score -= Math.min(15, (35.8 - temp) * 10.0);

  // 4. Sleep Restoration Factor (Sleep quality 0-100 contributes up to 20%)
  const sleepFactor = (sleepQuality || 80) / 100;
  if (sleepFactor < 0.7) {
    score -= (0.7 - sleepFactor) * 30;
  }

  // 5. Environmental Exposure Factor (Penalizes high external hazard)
  if (environmentalRiskScore > 50) {
    score -= (environmentalRiskScore - 50) * 0.25;
  }

  // 6. Baseline Anomaly Penalty
  if (baselineReport) {
    if (baselineReport.heartRate?.status === 'SEVERE_DEVIATION') score -= 8;
    if (baselineReport.spo2?.status === 'SEVERE_DEVIATION') score -= 12;
    if (baselineReport.skinTemp?.status === 'SEVERE_DEVIATION') score -= 8;
  }

  const finalScore = Math.max(10, Math.min(100, Math.round(score)));

  let rating = 'Excellent';
  let badgeColor = '#10b981'; // emerald
  if (finalScore < 50) {
    rating = 'Critical Attention';
    badgeColor = '#ef4444'; // red
  } else if (finalScore < 70) {
    rating = 'Moderate Strain';
    badgeColor = '#f59e0b'; // amber
  } else if (finalScore < 85) {
    rating = 'Good';
    badgeColor = '#3b82f6'; // blue
  }

  return {
    score: finalScore,
    rating,
    badgeColor
  };
}
