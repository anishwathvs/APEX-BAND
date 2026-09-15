/**
 * Disaster & Environmental Health Rule Engine
 * Integrates India AQI data, Heat Index equations, flood/cyclone protocols,
 * and personal physiological risks. Runs 100% on-device with zero network latency.
 */

export class DisasterRuleEngine {
  /**
   * Calculates Steadman / Rothfusz Heat Index (°C) from dry bulb temp (°C) and relative humidity (%)
   */
  static calculateHeatIndex(tempC, humidityPct) {
    const T = (tempC * 9/5) + 32; // Convert to Fahrenheit
    const R = humidityPct;

    if (T < 80) return tempC;

    let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));
    if (HI >= 80) {
      HI = -42.379 + 2.04901523*T + 10.14333127*R - 0.22475541*T*R
           - 0.00683783*T*T - 0.05481717*R*R + 0.00122874*T*T*R
           + 0.00085282*T*R*R - 0.00000199*T*T*R*R;
    }

    const heatIndexC = (HI - 32) * 5/9;
    return Math.round(heatIndexC * 10) / 10;
  }

  /**
   * Evaluates Heat Wave & Thermal Stress Hazard
   */
  static evaluateHeatHazard(tempC, humidityPct, vitals, isVulnerable = false) {
    const heatIndex = this.calculateHeatIndex(tempC, humidityPct);
    const hr = vitals.heartRate;
    const skinTemp = vitals.skinTemp;

    // Thresholds escalate for vulnerable users (elderly/chronic)
    const cautionHI = isVulnerable ? 30 : 33;
    const dangerHI = isVulnerable ? 37 : 41;
    const extremeDangerHI = isVulnerable ? 44 : 50;

    let status = 'NORMAL';
    let riskScore = 15;
    let description = 'Thermal conditions are within comfortable physiological tolerance.';
    let recommendations = ['Maintain regular hydration throughout the day.'];

    if (heatIndex >= extremeDangerHI || (heatIndex >= dangerHI && (skinTemp > 38.0 || hr > 115))) {
      status = 'EXTREME_DANGER';
      riskScore = 95;
      description = 'EMERGENCY: Heat stroke risk imminent. Critical thermal strain on cardiovascular system.';
      recommendations = [
        'Move immediately to an air-conditioned or shaded cool area.',
        'Apply cold wet compresses to neck, armpits, and groin.',
        'Drink electrolyte rehydration solutions (ORS) in sips.',
        'Seek urgent emergency medical assistance if disorientation or dizziness occurs.'
      ];
    } else if (heatIndex >= dangerHI || (heatIndex >= cautionHI && (skinTemp > 37.4 || hr > 100))) {
      status = 'DANGER';
      riskScore = 75;
      description = 'Heat exhaustion likely with prolonged outdoor exposure or activity.';
      recommendations = [
        'Halt strenuous physical activity immediately.',
        'Stay indoors during peak solar hours (11:00 AM – 4:00 PM).',
        'Increase water intake to at least 500ml per hour.',
        'Wear loose, light-colored cotton clothing.'
      ];
    } else if (heatIndex >= cautionHI || skinTemp > 37.0) {
      status = 'CAUTION';
      riskScore = 45;
      description = 'Elevated ambient heat index. Mild heat stress potential.';
      recommendations = [
        'Hydrate regularly before feeling thirsty.',
        'Take frequent breaks in shade if working outdoors.',
        'Monitor heart rate and body temperature for upward spikes.'
      ];
    }

    return {
      heatIndex,
      ambientTemp: tempC,
      ambientHumidity: humidityPct,
      status,
      riskScore,
      description,
      recommendations
    };
  }

  /**
   * Evaluates Air Quality & Respiratory Risk from India AQI dataset standards
   */
  static evaluateAirQualityRisk(aqi, pm25, vitals, isVulnerable = false) {
    const spo2 = vitals.spo2;
    const respRate = vitals.respiratoryRate || 16;

    let bucket = 'Good';
    let riskScore = 10;
    let description = 'Air quality is satisfactory and poses minimal health risk.';
    let recommendations = ['Safe for outdoor exercise and normal daily routines.'];

    // Escalation thresholds for vulnerable individuals
    const modThreshold = isVulnerable ? 80 : 100;
    const poorThreshold = isVulnerable ? 150 : 200;
    const vPoorThreshold = isVulnerable ? 250 : 300;
    const severeThreshold = isVulnerable ? 350 : 400;

    if (aqi >= severeThreshold || pm25 > 250 || (aqi > 250 && spo2 < 92)) {
      bucket = 'Severe';
      riskScore = 95;
      description = 'HAZARDOUS: Severe respiratory emergency. Immediate threat to cardiovascular & pulmonary health.';
      recommendations = [
        'Strictly stay indoors and seal doors/windows.',
        'Operate HEPA air purifiers if available.',
        'Wear an N95/FFP2 respirator mask if stepping outside is unavoidable.',
        'Patients with asthma/COPD must keep rescue inhalers immediately accessible.'
      ];
    } else if (aqi >= vPoorThreshold || pm25 > 120 || (aqi > 150 && spo2 < 94)) {
      bucket = 'Very Poor';
      riskScore = 80;
      description = 'Respiratory illness may develop upon prolonged exposure.';
      recommendations = [
        'Avoid morning and evening outdoor jogs/walks.',
        'Keep windows closed during high-traffic hours.',
        'Use an N95 mask outdoors.'
      ];
    } else if (aqi >= poorThreshold || pm25 > 60 || spo2 < 95) {
      bucket = 'Poor';
      riskScore = 55;
      description = 'Breathing discomfort to people with lung disease, elderly, and children.';
      recommendations = [
        'Reduce intense outdoor physical exertion.',
        'Stay well-hydrated to help clear airway secretions.'
      ];
    } else if (aqi >= modThreshold) {
      bucket = 'Moderate';
      riskScore = 35;
      description = 'May cause breathing discomfort for sensitive individuals with asthma.';
      recommendations = ['Sensitive individuals should limit prolonged outdoor exertion.'];
    } else if (aqi > 50) {
      bucket = 'Satisfactory';
      riskScore = 20;
      description = 'Minor breathing discomfort possible for unusually sensitive people.';
      recommendations = ['Acceptable air quality for general population.'];
    }

    return {
      aqi,
      pm25,
      bucket,
      riskScore,
      description,
      recommendations
    };
  }

  /**
   * Generates Comprehensive Flood / Cyclone Health Advisories with Clinical Protocols
   * Escalates dynamically for vulnerable elderly / chronic-illness profiles.
   */
  static getDisasterAdvisory(disasterType = 'none', isVulnerable = false) {
    if (disasterType === 'flood') {
      const recs = [
        'Waterborne Pathogen Warning: Strict boil-water protocol (rolling boil ≥3 mins) to prevent Cholera, Typhoid, and Acute Diarrheal Disease.',
        'Contaminated Water Barrier: Avoid wading in floodwater without rubber boots. Floodwaters carry Leptospira bacteria from animal waste.',
        'Wound Infection & Cellulitis: Disinfect open skin cuts immediately with povidone-iodine/antiseptic; cover with waterproof dressing.',
        'Medication Protection: Store insulin, antihypertensives, and vital prescriptions in elevated, airtight waterproof containers.'
      ];

      if (isVulnerable) {
        recs.unshift('⚠️ VULNERABLE PROFILE ESCALATION: Prepare 14-day supply of chronic medications; coordinate pre-flood transfer if dependent on home oxygen or peritoneal dialysis.');
      }

      return {
        active: true,
        type: 'FLOOD_HEALTH_ALERT',
        title: 'Flood Health & Waterborne Disease Advisory',
        severity: isVulnerable ? 'CRITICAL' : 'HIGH',
        riskLevel: isVulnerable ? 'Critical Severity' : 'High Alert',
        accentClass: isVulnerable ? 'accent-bar-critical' : 'accent-bar-high',
        badgeClass: isVulnerable ? 'badge-critical' : 'badge-high',
        keyStats: [
          { label: 'Waterborne Risk', value: 'Severe' },
          { label: 'Leptospirosis Vector', value: 'High' },
          { label: 'Wound Cellulitis', value: isVulnerable ? 'Critical' : 'Elevated' }
        ],
        description: isVulnerable
          ? 'CRITICAL ALERT: Severe flood contamination detected. Heightened mortality risk for geriatric and immunocompromised patients due to waterborne pathogens.'
          : 'High risk of waterborne bacterial infections (Cholera, Leptospirosis) and contaminated wound sepsis.',
        recommendations: recs
      };
    } else if (disasterType === 'cyclone') {
      const recs = [
        'Pre-Landfall Medication Stockpiling: Maintain a verified 7-day reserve of essential daily prescriptions and emergency first-aid kit.',
        'Medical Device Power Backup: Fully charge battery-powered nebulizers, glucometers, and portable oxygen units before grid failure.',
        'Laceration & Flying Debris Hazards: Shelter in an interior windowless room; secure all heavy furniture and wear sturdy closed-toe shoes.',
        'Post-Cyclone Hazard Precautions: Beware of downed electrical lines in waterlogged ground and structural roof collapse hazards.'
      ];

      if (isVulnerable) {
        recs.unshift('⚠️ VULNERABLE PROFILE ESCALATION: Mandatory early evacuation triage for reduced-mobility or bedridden patients before gale-force winds reach 60 km/h.');
      }

      return {
        active: true,
        type: 'CYCLONE_SAFETY_ALERT',
        title: 'Cyclone & Extreme Storm Health Advisory',
        severity: isVulnerable ? 'CRITICAL' : 'HIGH',
        riskLevel: isVulnerable ? 'Critical Severity' : 'High Alert',
        accentClass: isVulnerable ? 'accent-bar-critical' : 'accent-bar-high',
        badgeClass: isVulnerable ? 'badge-critical' : 'badge-high',
        keyStats: [
          { label: 'Wind Hazard', value: 'Cat 3+ Gusts' },
          { label: 'Mobility Triage', value: isVulnerable ? 'Immediate' : 'Standard' },
          { label: 'Grid Outage Risk', value: 'Extreme' }
        ],
        description: isVulnerable
          ? 'CRITICAL WARNING: Imminent severe cyclonic storm. Delayed EMS emergency access expected. Evacuate high-risk chronic patients immediately.'
          : 'Severe cyclonic conditions. Protect against trauma, structural projectile impact, and medical supply chain disruptions.',
        recommendations: recs
      };
    }

    return {
      active: false,
      type: 'NONE',
      title: 'No Active Natural Disaster Advisory',
      severity: 'LOW',
      riskLevel: 'Normal',
      accentClass: 'accent-bar-normal',
      badgeClass: 'badge-normal',
      keyStats: [],
      description: 'Standard environmental conditions.',
      recommendations: ['Routine precautions applicable.']
    };
  }
}
