"""
Master Orchestration: Train All Models, Export Quantized TFLite Binaries,
and Generate JavaScript Weights for Real In-Browser Matrix Execution.
"""

import os
import json
from train_vitals_anomaly import train_and_export_vitals_model
from train_fall_detector import train_and_export_fall_model
from train_sleep_stage import train_and_export_sleep_model

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXPORT_DIR = os.path.join(ROOT_DIR, "models", "exported")
JS_TARGET = os.path.join(ROOT_DIR, "app", "src", "inference", "models_data.js")

def export_all_models_and_js():
    print("==========================================================================")
    print("  HealthPulseEDGE — Edge-AI Training & Quantization Pipeline              ")
    print("  SIH 2026 / PS ID 26181 / Qualcomm Snapdragon Wear Architecture          ")
    print("==========================================================================")
    
    meta_a = train_and_export_vitals_model()
    meta_b = train_and_export_fall_model()
    meta_c = train_and_export_sleep_model()
    
    master_metadata = {
        "project": "Personal Health Companion (SIH 2026 PS ID 26181)",
        "hardware_target": "Qualcomm Snapdragon Wear / Edge Smartphone / Microcontroller NPU",
        "validation_method": "Subject-Wise Hold-Out GroupShuffleSplit (Zero Data Leakage)",
        "all_models_under_5MB": True,
        "models": {
            "model_a_vitals_anomaly": meta_a,
            "model_b_fall_detector": meta_b,
            "model_c_sleep_stage": meta_c
        }
    }
    
    master_path = os.path.join(EXPORT_DIR, "models_metadata.json")
    with open(master_path, "w") as f:
        json.dump(master_metadata, f, indent=2)
    print(f"\n[SUCCESS] Master model metadata written to {master_path}")
    
    # Generate clean JavaScript ES module for frontend on-device execution
    js_content = f"""/**
 * AUTO-GENERATED ON-DEVICE NEURAL WEIGHTS & SCALER PARAMETERS
 * Source: models/exported/models_metadata.json
 * Method: Subject-Wise Hold-Out Validation (Zero Subject Leakage)
 */

export const ON_DEVICE_MODELS_MANIFEST = {json.dumps(master_metadata, indent=2)};
export const MODELS_METADATA = ON_DEVICE_MODELS_MANIFEST;

export const MODEL_A_WEIGHTS = {json.dumps(meta_a, indent=2)};
export const VITALS_MODEL_DATA = MODEL_A_WEIGHTS;

export const MODEL_B_WEIGHTS = {json.dumps(meta_b, indent=2)};
export const FALL_MODEL_DATA = MODEL_B_WEIGHTS;

export const MODEL_C_WEIGHTS = {json.dumps(meta_c, indent=2)};
export const SLEEP_MODEL_DATA = MODEL_C_WEIGHTS;
"""
    with open(JS_TARGET, "w") as f:
        f.write(js_content)
    print(f"[SUCCESS] Updated frontend weights file: {JS_TARGET}")

if __name__ == "__main__":
    export_all_models_and_js()
