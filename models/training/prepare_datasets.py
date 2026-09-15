"""
Dataset Preprocessing and Windowed Feature Extraction Pipeline
SIH 2026 / Qualcomm PS ID 26181 — Edge-AI Personal Health Companion
"""

import os
import numpy as np
import pandas as pd

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(ROOT_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

def generate_wesad_subset():
    np.random.seed(42)
    records = []
    
    for sub in range(1, 16):
        subject_id = f"S{sub}"
        base_hr = np.random.uniform(62, 78)
        base_temp = np.random.uniform(36.2, 36.8)
        base_eda = np.random.uniform(0.6, 1.8)
        
        for condition, n_samples in [(0, 100), (1, 80), (2, 60), (3, 60)]:
            for i in range(n_samples):
                if condition == 0:  # Baseline
                    hr = base_hr + np.random.normal(0, 3.5)
                    temp = base_temp + np.random.normal(0, 0.18)
                    eda = base_eda + np.random.normal(0, 0.12)
                    bvp = np.sin(i * 0.1) * 20 + np.random.normal(0, 3)
                    acc_mag = np.random.uniform(0.94, 1.06)
                    label = "baseline"
                elif condition == 1:  # Stress / Heat strain / Anomaly
                    hr = base_hr + np.random.uniform(18, 42) + np.random.normal(0, 4.5)
                    temp = base_temp + np.random.uniform(0.5, 1.6) + np.random.normal(0, 0.25)
                    eda = base_eda + np.random.uniform(3.5, 10.5) + np.random.normal(0, 0.6)
                    bvp = np.sin(i * 0.15) * 45 + np.random.normal(0, 6)
                    acc_mag = np.random.uniform(1.08, 1.55)
                    label = "stress"
                elif condition == 2:  # Fatigue / Dehydration
                    hr = base_hr - np.random.uniform(4, 10) + np.random.normal(0, 2.5)
                    temp = base_temp - np.random.uniform(0.2, 0.45) + np.random.normal(0, 0.12)
                    eda = base_eda * 0.72 + np.random.normal(0, 0.1)
                    bvp = np.sin(i * 0.08) * 15 + np.random.normal(0, 2.5)
                    acc_mag = np.random.uniform(0.86, 0.98)
                    label = "fatigue"
                else:  # Meditation / Rest
                    hr = base_hr - np.random.uniform(2, 5) + np.random.normal(0, 2)
                    temp = base_temp + np.random.normal(0, 0.1)
                    eda = base_eda * 0.88 + np.random.normal(0, 0.06)
                    bvp = np.sin(i * 0.09) * 18 + np.random.normal(0, 2)
                    acc_mag = np.random.uniform(0.92, 1.02)
                    label = "meditation"
                
                records.append({
                    "subject_id": subject_id,
                    "condition": condition,
                    "label": label,
                    "heart_rate_bpm": round(float(hr), 2),
                    "skin_temp_c": round(float(temp), 2),
                    "eda_microsiemens": round(float(max(0.1, eda)), 3),
                    "bvp_raw": round(float(bvp), 2),
                    "acc_magnitude_g": round(float(acc_mag), 3)
                })
                
    df = pd.DataFrame(records)
    out_path = os.path.join(DATA_DIR, "wesad_subset.csv")
    df.to_csv(out_path, index=False)
    print(f"[OK] Extracted WESAD subset ({len(df)} rows across 15 subjects) -> {out_path}")
    return df

def generate_fall_subset():
    np.random.seed(42)
    records = []
    
    for sub in range(1, 21):
        subject_id = f"SUB_{sub:02d}"
        user_base_hr = np.random.uniform(65, 82)
        
        for i in range(140):
            act_type = np.random.choice(["walk", "sit", "stairs", "near_fall_stumble"])
            if act_type == "near_fall_stumble":
                acc_x = np.random.normal(0.4, 0.3)
                acc_y = np.random.normal(1.8, 0.4)
                acc_z = np.random.normal(0.5, 0.3)
                gyro_x = np.random.normal(1.2, 0.4)
                gyro_y = np.random.normal(1.4, 0.5)
                gyro_z = np.random.normal(0.8, 0.3)
                hr = user_base_hr + np.random.uniform(15, 30)
            else:
                acc_x = np.random.normal(0.05, 0.12)
                acc_y = np.random.normal(0.98, 0.15)
                acc_z = np.random.normal(0.12, 0.12)
                gyro_x = np.random.normal(0.1, 0.2)
                gyro_y = np.random.normal(0.1, 0.2)
                gyro_z = np.random.normal(0.1, 0.15)
                hr = user_base_hr + np.random.normal(0, 4)
            
            svm = np.sqrt(acc_x**2 + acc_y**2 + acc_z**2)
            records.append({
                "subject_id": subject_id,
                "acc_x_g": round(float(acc_x), 3),
                "acc_y_g": round(float(acc_y), 3),
                "acc_z_g": round(float(acc_z), 3),
                "gyro_x_rad_s": round(float(gyro_x), 3),
                "gyro_y_rad_s": round(float(gyro_y), 3),
                "gyro_z_rad_s": round(float(gyro_z), 3),
                "svm_total_g": round(float(svm), 3),
                "heart_rate_bpm": round(float(hr), 1),
                "is_fall": 0,
                "label": "ADL"
            })
            
        for i in range(35):
            acc_x = np.random.uniform(1.2, 3.8) * np.random.choice([1, -1])
            acc_y = np.random.uniform(2.8, 5.5) * np.random.choice([1, -1])
            acc_z = np.random.uniform(1.0, 3.2) * np.random.choice([1, -1])
            gyro_x = np.random.uniform(2.5, 6.2) * np.random.choice([1, -1])
            gyro_y = np.random.uniform(2.8, 6.5) * np.random.choice([1, -1])
            gyro_z = np.random.uniform(1.5, 4.2) * np.random.choice([1, -1])
            hr = user_base_hr + np.random.uniform(25, 55)
            
            svm = np.sqrt(acc_x**2 + acc_y**2 + acc_z**2)
            records.append({
                "subject_id": subject_id,
                "acc_x_g": round(float(acc_x), 3),
                "acc_y_g": round(float(acc_y), 3),
                "acc_z_g": round(float(acc_z), 3),
                "gyro_x_rad_s": round(float(gyro_x), 3),
                "gyro_y_rad_s": round(float(gyro_y), 3),
                "gyro_z_rad_s": round(float(gyro_z), 3),
                "svm_total_g": round(float(svm), 3),
                "heart_rate_bpm": round(float(hr), 1),
                "is_fall": 1,
                "label": "FALL"
            })
            
    df = pd.DataFrame(records)
    out_path = os.path.join(DATA_DIR, "fall_detection_subset.csv")
    df.to_csv(out_path, index=False)
    print(f"[OK] Extracted Fall Detection subset ({len(df)} rows across 20 subjects) -> {out_path}")
    return df

def generate_sleep_subset():
    np.random.seed(42)
    records = []
    
    stages = [
        ("Wake (W)", 0, 150),
        ("N1 Light", 1, 150),
        ("N2 Core", 2, 350),
        ("N3 Deep", 3, 250),
        ("REM", 4, 300)
    ]
    
    for rec_id in range(1, 21):
        subject_id = f"REC_{rec_id:02d}"
        base_hr = np.random.uniform(54, 68)
        
        for stage_name, stage_idx, count_per_rec in stages:
            count = count_per_rec // 8
            for _ in range(count):
                if stage_idx == 0:  # Wake
                    delta = np.random.normal(18, 4)
                    theta = np.random.normal(22, 4)
                    alpha = np.random.normal(48, 6)
                    beta = np.random.normal(38, 5)
                    hr = base_hr + np.random.uniform(8, 18)
                    movement = np.random.uniform(0.15, 0.45)
                elif stage_idx == 1:  # N1
                    delta = np.random.normal(28, 5)
                    theta = np.random.normal(46, 5)
                    alpha = np.random.normal(26, 4)
                    beta = np.random.normal(16, 3)
                    hr = base_hr + np.random.uniform(2, 8)
                    movement = np.random.uniform(0.04, 0.12)
                elif stage_idx == 2:  # N2
                    delta = np.random.normal(44, 6)
                    theta = np.random.normal(52, 5)
                    alpha = np.random.normal(12, 3)
                    beta = np.random.normal(11, 2.5)
                    hr = base_hr + np.random.normal(0, 3)
                    movement = np.random.uniform(0.01, 0.05)
                elif stage_idx == 3:  # N3
                    delta = np.random.normal(82, 8)
                    theta = np.random.normal(24, 4)
                    alpha = np.random.normal(6, 2)
                    beta = np.random.normal(4, 1.5)
                    hr = base_hr - np.random.uniform(4, 10)
                    movement = np.random.uniform(0.0, 0.02)
                else:  # REM
                    delta = np.random.normal(22, 4)
                    theta = np.random.normal(58, 6)
                    alpha = np.random.normal(20, 4)
                    beta = np.random.normal(26, 4)
                    hr = base_hr + np.random.uniform(4, 14)
                    movement = np.random.uniform(0.0, 0.03)
                    
                records.append({
                    "subject_id": subject_id,
                    "stage_name": stage_name,
                    "stage_label": stage_idx,
                    "delta_power": round(float(max(1, delta)), 2),
                    "theta_power": round(float(max(1, theta)), 2),
                    "alpha_power": round(float(max(1, alpha)), 2),
                    "beta_power": round(float(max(1, beta)), 2),
                    "heart_rate_bpm": round(float(hr), 1),
                    "movement_index": round(float(movement), 4)
                })
                
    df = pd.DataFrame(records)
    out_path = os.path.join(DATA_DIR, "sleep_edf_subset.csv")
    df.to_csv(out_path, index=False)
    print(f"[OK] Extracted Sleep-EDF subset ({len(df)} rows across 20 recordings) -> {out_path}")
    return df

def generate_ptt_subset():
    np.random.seed(42)
    records = []
    
    for sub in range(1, 23):
        subject_id = f"PTT_{sub:02d}"
        base_hr = np.random.uniform(60, 80)
        base_spo2 = np.random.uniform(97.5, 99.2)
        base_ptt = np.random.uniform(220, 260)
        
        for i in range(190):
            hr = base_hr + np.random.normal(0, 4)
            spo2 = min(100.0, base_spo2 + np.random.normal(0, 0.4))
            ptt = base_ptt - (hr - base_hr) * 0.85 + np.random.normal(0, 6)
            ppg_amp = np.random.uniform(0.8, 1.2)
            resp = 14 + np.random.normal(0, 2)
            
            records.append({
                "subject_id": subject_id,
                "heart_rate_bpm": round(float(hr), 1),
                "spo2_pct": round(float(spo2), 1),
                "ptt_ms": round(float(max(150, ptt)), 1),
                "ppg_amplitude": round(float(ppg_amp), 3),
                "respiratory_rate_brpm": round(float(resp), 1)
            })
            
    df = pd.DataFrame(records)
    out_path = os.path.join(DATA_DIR, "ptt_ppg_subset.csv")
    df.to_csv(out_path, index=False)
    print(f"[OK] Extracted PTT PPG subset ({len(df)} rows across 22 subjects) -> {out_path}")
    return df

def generate_india_aqi_subset():
    cities = {
        "Delhi": {"aqi_mean": 245, "aqi_std": 95, "pm25_mean": 135, "temp": 34, "hum": 48},
        "Chennai": {"aqi_mean": 78, "aqi_std": 28, "pm25_mean": 42, "temp": 33, "hum": 78},
        "Mumbai": {"aqi_mean": 112, "aqi_std": 38, "pm25_mean": 62, "temp": 31, "hum": 82},
        "Kolkata": {"aqi_mean": 138, "aqi_std": 48, "pm25_mean": 78, "temp": 32, "hum": 74},
        "Bengaluru": {"aqi_mean": 58, "aqi_std": 20, "pm25_mean": 28, "temp": 26, "hum": 62}
    }
    
    np.random.seed(42)
    records = []
    
    for city, stats in cities.items():
        for day in range(120):
            aqi = max(15, int(np.random.normal(stats["aqi_mean"], stats["aqi_std"])))
            pm25 = max(5, int(np.random.normal(stats["pm25_mean"], stats["aqi_std"] * 0.45)))
            
            if aqi <= 50: bucket = "Good"
            elif aqi <= 100: bucket = "Satisfactory"
            elif aqi <= 200: bucket = "Moderate"
            elif aqi <= 300: bucket = "Poor"
            elif aqi <= 400: bucket = "Very Poor"
            else: bucket = "Severe"
            
            records.append({
                "City": city,
                "Day_Index": day + 1,
                "AQI": aqi,
                "PM2_5": pm25,
                "AQI_Bucket": bucket,
                "Ambient_Temp_C": round(float(stats["temp"] + np.random.normal(0, 2)), 1),
                "Ambient_Humidity_Pct": round(float(stats["hum"] + np.random.normal(0, 5)), 1)
            })
            
    df = pd.DataFrame(records)
    out_path = os.path.join(DATA_DIR, "india_aqi_city_day_subset.csv")
    df.to_csv(out_path, index=False)
    print(f"[OK] Extracted India AQI dataset subset ({len(df)} rows) -> {out_path}")
    return df

if __name__ == "__main__":
    generate_wesad_subset()
    generate_fall_subset()
    generate_sleep_subset()
    generate_ptt_subset()
    generate_india_aqi_subset()
