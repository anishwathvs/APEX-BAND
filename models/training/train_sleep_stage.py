"""
Model C: On-Device Sleep Stage Classifier
Trained on Sleep-EDF Expanded (Sleep Cassette) EEG spectral band powers + Movement.
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

def train_and_export_sleep_model():
    print("========================================================================")
    print("  MODEL C: Sleep Stage Classifier Training (Subject-Wise Holdout)      ")
    print("========================================================================")
    df = pd.read_csv(os.path.join(DATA_DIR, "sleep_edf_subset.csv"))
    
    feature_cols = [
        "delta_power", "theta_power", "alpha_power", "beta_power",
        "heart_rate_bpm", "movement_index"
    ]
    
    X = df[feature_cols].values.astype(np.float32)
    y = df["stage_label"].values.astype(np.int64)
    groups = df["subject_id"].values
    
    # Strict Subject-Wise Train/Test Split (Leave 5 recordings out for testing)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]
    
    train_subs = sorted(list(set(groups[train_idx])))
    test_subs = sorted(list(set(groups[test_idx])))
    print(f"Train recordings ({len(train_subs)}): {train_subs}")
    print(f"Test recordings  ({len(test_subs)}): {test_subs}")
    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")
    
    # Fit scaler ONLY on training fold
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = MLPClassifier(
        hidden_layer_sizes=(24, 12),
        activation='relu',
        solver='adam',
        max_iter=350,
        random_state=42,
        alpha=0.01
    )
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    target_names = ["Wake (W)", "N1 Light", "N2 Core", "N3 Deep", "REM"]
    present_classes = sorted(list(set(y_test) | set(y_pred)))
    filtered_names = [target_names[i] for i in present_classes]
    
    print(f"\n[MODEL C RAW METRICS] Subject-Wise Hold-Out Accuracy: {acc*100:.2f}%")
    print("\nCLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred, target_names=filtered_names, digits=4))
    
    cm = confusion_matrix(y_test, y_pred)
    print("CONFUSION MATRIX (Row=True, Col=Predicted):")
    print(cm)
    
    weights = [w.tolist() for w in model.coefs_]
    biases = [b.tolist() for b in model.intercepts_]
    
    tflite_bytes = build_tflite_flatbuffer(
        model_name="sleep_stage",
        input_dim=6,
        hidden_layers=[24, 12],
        output_dim=5,
        weights=model.coefs_,
        biases=model.intercepts_,
        classes=target_names
    )
    
    tflite_path = os.path.join(EXPORT_DIR, "sleep_stage.tflite")
    with open(tflite_path, "wb") as f:
        f.write(tflite_bytes)
        
    size_bytes = len(tflite_bytes)
    
    meta_json = {
        "model_name": "sleep_stage",
        "input_features": feature_cols,
        "classes": target_names,
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "architecture": [6, 24, 12, 5],
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
    
    json_path = os.path.join(EXPORT_DIR, "sleep_stage_meta.json")
    with open(json_path, "w") as f:
        json.dump(meta_json, f, indent=2)
        
    print(f"[OK] Exported {tflite_path} ({size_bytes/1024.0:.2f} KB)")
    return meta_json

if __name__ == "__main__":
    train_and_export_sleep_model()
