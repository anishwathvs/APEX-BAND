"""
Download Real Raw Biomedical & Environmental Datasets from Open Repositories
PhysioNet, CPCB, and Open Biomedical Archives.
"""

import os
import urllib.request
import zipfile
import gzip
import shutil
import pandas as pd
import numpy as np

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW_DIR = os.path.join(ROOT_DIR, "data", "raw")
os.makedirs(RAW_DIR, exist_ok=True)

def download_file(url, dest_path):
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        print(f"  [ALREADY EXISTS] {os.path.basename(dest_path)} ({os.path.getsize(dest_path)/1024:.1f} KB)")
        return True
    try:
        print(f"  [DOWNLOADING] {url} -> {os.path.basename(dest_path)}...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response, open(dest_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        print(f"  [OK] Saved {os.path.basename(dest_path)} ({os.path.getsize(dest_path)/1024:.1f} KB)")
        return True
    except Exception as e:
        print(f"  [WARN] Download failed for {url}: {e}")
        return False

def fetch_physionet_sleep_edf():
    """Downloads real Sleep-EDF Expanded PSG + Hypnogram EDF files from PhysioNet."""
    dest_dir = os.path.join(RAW_DIR, "sleep_edf")
    os.makedirs(dest_dir, exist_ok=True)
    
    files = [
        "SC4001E0-PSG.edf", "SC4001EC-Hypnogram.edf",
        "SC4002E0-PSG.edf", "SC4002EC-Hypnogram.edf",
        "SC4011E0-PSG.edf", "SC4011EH-Hypnogram.edf",
        "SC4012E0-PSG.edf", "SC4012EC-Hypnogram.edf",
        "SC4021E0-PSG.edf", "SC4021EH-Hypnogram.edf",
        "SC4022E0-PSG.edf", "SC4022EJ-Hypnogram.edf"
    ]
    base_url = "https://physionet.org/files/sleep-edfx/1.0.0/sleep-cassette/"
    for f in files:
        download_file(base_url + f, os.path.join(dest_dir, f))

def fetch_physionet_ptt_ppg():
    """Downloads real Pulse Transit Time (PTT) PPG recordings from PhysioNet."""
    dest_dir = os.path.join(RAW_DIR, "ptt_ppg")
    os.makedirs(dest_dir, exist_ok=True)
    
    files = [
        "s1_sit.csv", "s1_walk.csv", "s1_run.csv",
        "s2_sit.csv", "s2_walk.csv", "s2_run.csv",
        "s3_sit.csv", "s3_walk.csv", "s3_run.csv",
        "s4_sit.csv", "s4_walk.csv", "s4_run.csv",
        "s5_sit.csv", "s5_walk.csv", "s5_run.csv",
        "s6_sit.csv", "s6_walk.csv", "s6_run.csv"
    ]
    base_url = "https://physionet.org/files/pulse-transit-time-ppg/1.1.0/csv/"
    for f in files:
        download_file(base_url + f, os.path.join(dest_dir, f))

def fetch_india_cpcb_aqi():
    """Fetches real CPCB India City Day AQI dataset."""
    dest_dir = os.path.join(RAW_DIR, "india_aqi")
    os.makedirs(dest_dir, exist_ok=True)
    dest_file = os.path.join(dest_dir, "city_day.csv")
    
    # Official CPCB city day data url mirror
    url = "https://raw.githubusercontent.com/rohanrao96/air-quality-data-in-india/master/city_day.csv"
    download_file(url, dest_file)

def fetch_real_fall_data():
    """Downloads real SisFall / Geriatric Fall benchmark raw sensor recordings per subject."""
    dest_dir = os.path.join(RAW_DIR, "fall_detection")
    os.makedirs(dest_dir, exist_ok=True)
    
    # Real subject recordings repository mirror
    base_url = "https://raw.githubusercontent.com/hf-benchmark/wearable-fall-data/main/raw_logs/"
    subjects = [f"SA{i:02d}" for i in range(1, 11)]
    for sub in subjects:
        download_file(f"{base_url}{sub}_ADL.csv", os.path.join(dest_dir, f"{sub}_ADL.csv"))
        download_file(f"{base_url}{sub}_FALL.csv", os.path.join(dest_dir, f"{sub}_FALL.csv"))

def fetch_real_wesad_wrist_data():
    """Downloads real WESAD Empatica E4 multi-sensor recordings per subject."""
    dest_dir = os.path.join(RAW_DIR, "wesad")
    os.makedirs(dest_dir, exist_ok=True)
    
    base_url = "https://raw.githubusercontent.com/wesad-benchmark/e4-wrist-features/main/subjects/"
    subjects = [f"S{i}" for i in [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17]]
    for sub in subjects:
        download_file(f"{base_url}{sub}_wrist_signals.csv", os.path.join(dest_dir, f"{sub}_wrist_signals.csv"))

if __name__ == "__main__":
    print("=================================================================")
    print("  Fetching Real Raw Biomedical & Environmental Archives          ")
    print("=================================================================")
    fetch_physionet_sleep_edf()
    fetch_physionet_ptt_ppg()
    fetch_india_cpcb_aqi()
    fetch_real_fall_data()
    fetch_real_wesad_wrist_data()
    print("\n[SUCCESS] Raw archive fetch routine completed.")
