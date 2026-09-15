/**
 * Personalized Recommendations Engine (Unified Cross-Screen Architecture)
 * Directly correlates on-device anomaly detections, environmental indicators,
 * and disaster advisories from the shared DisasterRuleEngine into unified action cards.
 */

export function generatePersonalizedRecommendations(params) {
  const {
    vitalsRisk,
    heatHazard,
    airHazard,
    disasterAdvisory,
    wellnessScore,
    isVulnerable
  } = params;

  const recommendations = [];

  // 1. Critical / High Vitals Anomaly (Model A Neural Inference)
  if (vitalsRisk && (vitalsRisk.riskLevel === 'Critical' || vitalsRisk.riskLevel === 'High')) {
    recommendations.push({
      id: 'rec_vitals_critical',
      priority: 'CRITICAL',
      category: 'Medical Alert',
      title: 'Physiological Anomaly Alert',
      description: `Neural model detected ${vitalsRisk.riskLevel} risk (${vitalsRisk.confidence}% conf). ${vitalsRisk.detectedAnomalies?.join('; ') || 'Significant vital sign deviation'}.`,
      action: 'Rest immediately in seated position and consult emergency medical contact if symptoms persist.'
    });
  }

  // 2. Continuous Environmental: Heat Wave & Thermal Stress Guidance (Shared with Alerts screen)
  if (heatHazard && (heatHazard.status === 'EXTREME_DANGER' || heatHazard.status === 'DANGER')) {
    recommendations.push({
      id: 'rec_heat_alert',
      priority: heatHazard.status === 'EXTREME_DANGER' ? 'CRITICAL' : 'HIGH',
      category: 'Thermal Stress',
      title: 'Heat Wave Protection Protocol',
      description: `Current Ambient Heat Index: ${heatHazard.heatIndex}°C (${heatHazard.status.replace('_', ' ')}). ${heatHazard.description}`,
      action: heatHazard.recommendations?.[0] || 'Drink 500ml of electrolyte solution and move to shaded cool space.'
    });
  } else if (heatHazard && heatHazard.status === 'CAUTION') {
    recommendations.push({
      id: 'rec_heat_caution',
      priority: 'MODERATE',
      category: 'Hydration',
      title: 'Hydration Reminder',
      description: `Ambient Heat Index: ${heatHazard.heatIndex}°C (Ambient: ${heatHazard.ambientTemp}°C). Target 2.5L water intake today.`,
      action: heatHazard.recommendations?.[0] || 'Hydrate regularly before feeling thirsty.'
    });
  }

  // 3. Continuous Environmental: Air Quality & Respiratory Protection (Shared with Alerts screen)
  if (airHazard && (airHazard.bucket === 'Severe' || airHazard.bucket === 'Very Poor' || airHazard.bucket === 'Poor')) {
    recommendations.push({
      id: 'rec_aqi_severe',
      priority: airHazard.bucket === 'Severe' ? 'CRITICAL' : 'HIGH',
      category: 'Air Quality',
      title: 'Hazardous Air Exposure Advisory',
      description: `AQI: ${airHazard.aqi} (${airHazard.bucket} — PM2.5: ${airHazard.pm25} µg/m³). ${airHazard.description}`,
      action: airHazard.recommendations?.[0] || 'Wear an N95 respirator mask outdoors.'
    });
  }

  // 4. Natural Disaster Protocol Simulation (Shared directly with Alerts screen Disaster Advisory)
  if (disasterAdvisory && disasterAdvisory.active) {
    recommendations.push({
      id: 'rec_disaster_active',
      priority: disasterAdvisory.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      category: 'Disaster Protocol',
      title: disasterAdvisory.title,
      description: disasterAdvisory.description,
      action: disasterAdvisory.recommendations?.[0] || 'Follow local disaster management protocols.'
    });
  }

  // 5. Vulnerable user profile escalation flag
  if (isVulnerable && recommendations.length > 0) {
    recommendations.push({
      id: 'rec_vulnerable_note',
      priority: 'MODERATE',
      category: 'Vulnerable Profile',
      title: 'Personalized Escalation Active',
      description: 'Dynamic thresholds are sensitized for elderly / chronic care profile.',
      action: 'Keep prescribed emergency medications accessible at all times.'
    });
  }

  // 6. Default healthy wellness suggestion if no high risk
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec_healthy_lifestyle',
      priority: 'LOW',
      category: 'Wellness',
      title: 'Optimal Physiological Balance',
      description: `Wellness score is ${wellnessScore?.score || 92}/100 with vitals aligning with your 7-day personal baseline.`,
      action: 'Keep up your physical activity pacing and balanced hydration.'
    });
  }

  return recommendations;
}
