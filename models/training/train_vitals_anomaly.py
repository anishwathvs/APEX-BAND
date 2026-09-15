"""
Model A: On-Device Vitals Anomaly & Risk Classifier
Trained on WESAD (15 Subjects) + PTT PPG (22 Subjects) windowed features.
Validation: Subject-Wise Hold-Out GroupShuffleSplit (Zero Data Leakage).
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from tflite_builder import build_tflite_flatbuffer

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(ROOT_DIR, "data")
EXPORT_DIR = os.path.join(ROOT_DIR, "models", "exported")
os.makedirs(EXPORT_DIR, exist_ok=True)

def load_and_merge_features():
    df_wesad = pd.read_csv(os.path.join(DATA_DIR, "wesad_subset.csv"))
    df_ptt = pd.read_csv(os.path.join(DATA_DIR, "ptt_ppg_subset.csv"))
    
    min_len = min(len(df_wesad), len(df_ptt))
    X_list, y_list, groups = [], [], []
    
    for i in range(min_len):
        w_row = df_wesad.iloc[i]
        p_row = df_ptt.iloc[i]
        
        hr = float(w_row["heart_rate_bpm"])
        temp = float(w_row["skin_temp_c"])
        eda = float(w_row["eda_microsiemens"])
        acc = float(w_row["acc_magnitude_g"])
        spo2 = float(p_row["spo2_pct"])
        ptt = float(p_row["ptt_ms"])
        ppg_amp = float(p_row["ppg_amplitude"])
        resp_rate = float(p_row["respiratory_rate_brpm"])
        subject_id = str(w_row["subject_id"])
        
        # Clinical Risk categorization based on physiological threshold boundaries
        if spo2 < 89.0 or temp > 38.5 or hr > 135.0 or (spo2 < 91.5 and hr > 110.0):
            risk = 3  # Critical
        elif spo2 < 93.5 or temp > 37.6 or (hr > 105.0 and eda > 4.5) or (hr < 50.0):
            risk = 2  # High
        elif hr > 88.0 or eda > 2.2 or temp > 37.0 or spo2 < 95.5 or resp_rate > 20.0:
            risk = 1  # Moderate
        else:
            risk = 0  # Low / Normal
            
        X_list.append([hr, temp, eda, acc, spo2, ptt, ppg_amp, resp_rate])
        y_list.append(risk)
        groups.append(subject_id)
        
    return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int64), np.array(groups)

def train_and_export_vitals_model():
    print("========================================================================")
    print("  MODEL A: Vitals Anomaly Classifier Training (Subject-Wise Holdout)   ")
    print("========================================================================")
    X, y, groups = load_and_merge_features()
    
    # Strict Subject-Wise Train/Test Split (Leave 4 subjects out for testing)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]
    
    train_subs = sorted(list(set(groups[train_idx])))
    test_subs = sorted(list(set(groups[test_idx])))
    print(f"Train subjects ({len(train_subs)}): {train_subs}")
    print(f"Test subjects  ({len(test_subs)}): {test_subs}")
    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")
    
    # Fit scaler ONLY on training data
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = MLPClassifier(
        hidden_layer_sizes=(32, 16),
        activation='relu',
        solver='adam',
        max_iter=350,
        random_state=42,
        alpha=0.005
    )
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    target_names = ["Low", "Moderate", "High", "Critical"]
    present_classes = sorted(list(set(y_test) | set(y_pred)))
    filtered_names = [target_names[i] for i in present_classes]
    
    print(f"\n[MODEL A RAW METRICS] Subject-Wise Hold-Out Accuracy: {acc*100:.2f}%")
    print("\nCLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred, target_names=filtered_names, digits=4))
    
    cm = confusion_matrix(y_test, y_pred)
    print("CONFUSION MATRIX (Row=True, Col=Predicted):")
    print(cm)
    
    weights = [w.tolist() for w in model.coefs_]
    biases = [b.tolist() for b in model.intercepts_]
    
    tflite_bytes = build_tflite_flatbuffer(
        model_name="vitals_anomaly",
        input_dim=8,
        hidden_layers=[32, 16],
        output_dim=4,
        weights=model.coefs_,
        biases=model.intercepts_,
        classes=target_names
    )
    
    tflite_path = os.path.join(EXPORT_DIR, "vitals_anomaly.tflite")
    with open(tflite_path, "wb") as f:
        f.write(tflite_bytes)
        
    size_bytes = len(tflite_bytes)
    
    meta_json = {
        "model_name": "vitals_anomaly",
        "input_features": ["heart_rate", "skin_temp", "eda", "acc_mag", "spo2", "ptt", "ppg_amp", "resp_rate"],
        "classes": target_names,
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "architecture": [8, 32, 16, 4],
        "accuracy": float(acc),
        "size_bytes": size_bytes,
        "split_method": "GroupShuffleSplit (Subject-Wise Hold-Out)",
        "train_subjects": train_subs,
        "test_subjects": test_subs,
        "confusion_matrix": cm.tolist(),
        "sample_test_input": X_test[0].tolist(),
        "sample_test_true_label": int(y_test[0]),
        "weights": weights,
        "biases": biases
    }
    
    json_path = os.path.join(EXPORT_DIR, "vitals_anomaly_meta.json")
    with open(json_path, "w") as f:
        json.dump(meta_json, f, indent=2)
        
    print(f"[OK] Exported {tflite_path} ({size_bytes/1024.0:.2f} KB)")
    return meta_json

if __name__ == "__main__":
    train_and_export_vitals_model()
