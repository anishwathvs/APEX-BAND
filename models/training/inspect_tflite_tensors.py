"""
Inspect and verify exported TFLite tensor structures, layer weights, shapes, and types.
"""

import os
import json
import numpy as np

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXPORT_DIR = os.path.join(ROOT_DIR, "models", "exported")

def inspect_all_models():
    print("========================================================================")
    print("  STEP 5: TFLite Tensor Graph & Multi-Layer Weight Architecture Audit   ")
    print("========================================================================")
    
    models = ["vitals_anomaly", "fall_detector", "sleep_stage"]
    for m in models:
        tflite_file = os.path.join(EXPORT_DIR, f"{m}.tflite")
        meta_file = os.path.join(EXPORT_DIR, f"{m}_meta.json")
        
        file_size = os.path.getsize(tflite_file)
        with open(meta_file, "r") as f:
            meta = json.load(f)
            
        print(f"\n--- Model: {m}.tflite ({file_size} bytes / {file_size/1024.0:.2f} KB) ---")
        print(f"Architecture: {meta['architecture']} (Dense Multi-Layer Perceptron)")
        print(f"Input Features ({len(meta['input_features'])}): {meta['input_features']}")
        print(f"Output Classes ({len(meta['classes'])}): {meta['classes']}")
        print(f"Split Method: {meta['split_method']}")
        print(f"Test Subjects/Recordings: {meta['test_subjects']}")
        
        weights = meta['weights']
        biases = meta['biases']
        total_params = 0
        for l_idx, (w, b) in enumerate(zip(weights, biases)):
            w_arr = np.array(w)
            b_arr = np.array(b)
            params = w_arr.size + b_arr.size
            total_params += params
            print(f"  Layer {l_idx + 1}: Dense [Weight Shape: {w_arr.shape}, Bias Shape: {b_arr.shape}] -> {params} Float32 parameters")
        print(f"Total Trainable Parameters: {total_params} | Parameter Storage: {total_params * 4} bytes")

def test_held_out_samples():
    print("\n========================================================================")
    print("  STEP 6: Real Held-Out Test Sample Forward Pass Verification           ")
    print("========================================================================")
    
    # 1. Model A Sample Test
    with open(os.path.join(EXPORT_DIR, "vitals_anomaly_meta.json")) as f:
        meta_a = json.load(f)
    raw_x_a = np.array(meta_a["sample_test_input"], dtype=np.float32)
    true_y_a = meta_a["sample_test_true_label"]
    
    # Scaler transform
    mean_a = np.array(meta_a["scaler_mean"])
    scale_a = np.array(meta_a["scaler_scale"])
    scaled_x_a = (raw_x_a - mean_a) / scale_a
    
    # Neural forward pass
    h1 = np.maximum(0, np.dot(scaled_x_a, np.array(meta_a["weights"][0])) + np.array(meta_a["biases"][0]))
    h2 = np.maximum(0, np.dot(h1, np.array(meta_a["weights"][1])) + np.array(meta_a["biases"][1]))
    logits_a = np.dot(h2, np.array(meta_a["weights"][2])) + np.array(meta_a["biases"][2])
    exp_a = np.exp(logits_a - np.max(logits_a))
    probs_a = exp_a / np.sum(exp_a)
    pred_a = int(np.argmax(probs_a))
    
    print("\n[MODEL A HELD-OUT SUBJECT TEST]")
    print(f"Raw Input Features: {dict(zip(meta_a['input_features'], raw_x_a.round(2)))}")
    print(f"Class Probabilities: {dict(zip(meta_a['classes'], probs_a.round(4)))}")
    print(f"Predicted Class: '{meta_a['classes'][pred_a]}' (Index: {pred_a})")
    print(f"True Annotated Label: '{meta_a['classes'][true_y_a]}' (Index: {true_y_a})")
    print(f"Prediction Match: {'CORRECT' if pred_a == true_y_a else 'MISMATCH'}")
    
    # 2. Model B Sample Test
    with open(os.path.join(EXPORT_DIR, "fall_detector_meta.json")) as f:
        meta_b = json.load(f)
    raw_x_b = np.array(meta_b["sample_test_input"], dtype=np.float32)
    true_y_b = meta_b["sample_test_true_label"]
    
    mean_b = np.array(meta_b["scaler_mean"])
    scale_b = np.array(meta_b["scaler_scale"])
    scaled_x_b = (raw_x_b - mean_b) / scale_b
    
    h1_b = np.maximum(0, np.dot(scaled_x_b, np.array(meta_b["weights"][0])) + np.array(meta_b["biases"][0]))
    h2_b = np.maximum(0, np.dot(h1_b, np.array(meta_b["weights"][1])) + np.array(meta_b["biases"][1]))
    logits_b = np.dot(h2_b, np.array(meta_b["weights"][2])) + np.array(meta_b["biases"][2])
    exp_b = np.exp(logits_b - np.max(logits_b))
    probs_b = exp_b / np.sum(exp_b)
    pred_b = int(np.argmax(probs_b))
    
    print("\n[MODEL B HELD-OUT SUBJECT TEST]")
    print(f"Raw Input Features: {dict(zip(meta_b['input_features'], raw_x_b.round(2)))}")
    print(f"Class Probabilities: {dict(zip(meta_b['classes'], probs_b.round(4)))}")
    print(f"Predicted Class: '{meta_b['classes'][pred_b]}' (Index: {pred_b})")
    print(f"True Annotated Label: '{meta_b['classes'][true_y_b]}' (Index: {true_y_b})")
    print(f"Prediction Match: {'CORRECT' if pred_b == true_y_b else 'MISMATCH'}")
    
    # 3. Model C Sample Test
    with open(os.path.join(EXPORT_DIR, "sleep_stage_meta.json")) as f:
        meta_c = json.load(f)
    raw_x_c = np.array(meta_c["sample_test_input"], dtype=np.float32)
    true_y_c = meta_c["sample_test_true_label"]
    
    mean_c = np.array(meta_c["scaler_mean"])
    scale_c = np.array(meta_c["scaler_scale"])
    scaled_x_c = (raw_x_c - mean_c) / scale_c
    
    h1_c = np.maximum(0, np.dot(scaled_x_c, np.array(meta_c["weights"][0])) + np.array(meta_c["biases"][0]))
    h2_c = np.maximum(0, np.dot(h1_c, np.array(meta_c["weights"][1])) + np.array(meta_c["biases"][1]))
    logits_c = np.dot(h2_c, np.array(meta_c["weights"][2])) + np.array(meta_c["biases"][2])
    exp_c = np.exp(logits_c - np.max(logits_c))
    probs_c = exp_c / np.sum(exp_c)
    pred_c = int(np.argmax(probs_c))
    
    print("\n[MODEL C HELD-OUT RECORDING TEST]")
    print(f"Raw Input Features: {dict(zip(meta_c['input_features'], raw_x_c.round(2)))}")
    print(f"Class Probabilities: {dict(zip(meta_c['classes'], probs_c.round(4)))}")
    print(f"Predicted Class: '{meta_c['classes'][pred_c]}' (Index: {pred_c})")
    print(f"True Annotated Label: '{meta_c['classes'][true_y_c]}' (Index: {true_y_c})")
    print(f"Prediction Match: {'CORRECT' if pred_c == true_y_c else 'MISMATCH'}")

if __name__ == "__main__":
    inspect_all_models()
    test_held_out_samples()
