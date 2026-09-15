"""
Model B: On-Device Fall Detector Classifier
Trained on SisFall / Geriatric Fall benchmark 6-DOF IMU + Optical Heart Rate.
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

def train_and_export_fall_model():
    print("========================================================================")
    print("  MODEL B: Fall Detector Classifier Training (Subject-Wise Holdout)    ")
    print("========================================================================")
    df = pd.read_csv(os.path.join(DATA_DIR, "fall_detection_subset.csv"))
    
    feature_cols = [
        "acc_x_g", "acc_y_g", "acc_z_g",
        "gyro_x_rad_s", "gyro_y_rad_s", "gyro_z_rad_s",
        "svm_total_g", "heart_rate_bpm"
    ]
    
    X = df[feature_cols].values.astype(np.float32)
    y = df["is_fall"].values.astype(np.int64)
    groups = df["subject_id"].values
    
    # Strict Subject-Wise Train/Test Split (Leave 5 subjects out for testing)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]
    
    train_subs = sorted(list(set(groups[train_idx])))
    test_subs = sorted(list(set(groups[test_idx])))
    print(f"Train subjects ({len(train_subs)}): {train_subs}")
    print(f"Test subjects  ({len(test_subs)}): {test_subs}")
    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")
    
    # Fit scaler ONLY on training fold
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = MLPClassifier(
        hidden_layer_sizes=(16, 8),
        activation='relu',
        solver='adam',
        max_iter=300,
        random_state=42,
        alpha=0.005
    )
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    target_names = ["No Fall (ADL)", "Fall Detected"]
    
    print(f"\n[MODEL B RAW METRICS] Subject-Wise Hold-Out Accuracy: {acc*100:.2f}%")
    print("\nCLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred, target_names=target_names, digits=4))
    
    cm = confusion_matrix(y_test, y_pred)
    print("CONFUSION MATRIX (Row=True, Col=Predicted):")
    print(cm)
    
    # Convert binary single-logit output layer to 2-unit symmetric Softmax [No Fall, Fall]
    # W_2unit = [-W/2, +W/2], B_2unit = [-B/2, +B/2] so Softmax([-z/2, z/2]) = [1-sigma(z), sigma(z)]
    w_out_orig = model.coefs_[2]       # shape (8, 1)
    b_out_orig = model.intercepts_[2]  # shape (1,)
    
    w_out_2class = np.hstack([-w_out_orig / 2.0, w_out_orig / 2.0])  # shape (8, 2)
    b_out_2class = np.array([-b_out_orig[0] / 2.0, b_out_orig[0] / 2.0])  # shape (2,)
    
    export_weights = [model.coefs_[0], model.coefs_[1], w_out_2class]
    export_biases = [model.intercepts_[0], model.intercepts_[1], b_out_2class]
    
    tflite_bytes = build_tflite_flatbuffer(
        model_name="fall_detector",
        input_dim=8,
        hidden_layers=[16, 8],
        output_dim=2,
        weights=export_weights,
        biases=export_biases,
        classes=target_names
    )
    
    tflite_path = os.path.join(EXPORT_DIR, "fall_detector.tflite")
    with open(tflite_path, "wb") as f:
        f.write(tflite_bytes)
        
    size_bytes = len(tflite_bytes)
    
    meta_json = {
        "model_name": "fall_detector",
        "input_features": feature_cols,
        "classes": target_names,
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "architecture": [8, 16, 8, 2],
        "accuracy": float(acc),
        "size_bytes": size_bytes,
        "split_method": "GroupShuffleSplit (Subject-Wise Hold-Out)",
        "train_subjects": train_subs,
        "test_subjects": test_subs,
        "confusion_matrix": cm.tolist(),
        "sample_test_input": X_test[0].tolist(),
        "sample_test_true_label": int(y_test[0]),
        "weights": [w.tolist() for w in export_weights],
        "biases": [b.tolist() for b in export_biases]
    }
    
    json_path = os.path.join(EXPORT_DIR, "fall_detector_meta.json")
    with open(json_path, "w") as f:
        json.dump(meta_json, f, indent=2)
        
    print(f"[OK] Exported {tflite_path} ({size_bytes/1024.0:.2f} KB)")
    return meta_json

if __name__ == "__main__":
    train_and_export_fall_model()
