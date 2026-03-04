"""
Train a multi-output Random Forest classifier for test recommendations.

Input features : age, gender, heartRate, systolicBP, diastolicBP,
                 bloodSugar, cholesterol, spo2
Output targets : 11 binary test labels (ECG, ThyroidProfile, etc.)

Usage:
    python train_model.py
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import classification_report, accuracy_score

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'health_dataset.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'test_recommender_model.pkl')

# Test label columns
TESTS = [
    'ECG', 'ThyroidProfile', 'LipidProfile', 'HbA1c',
    'KidneyFunction', 'LiverFunction', 'CBC',
    'UrineAnalysis', 'PulmonaryFunction', 'ChestXRay',
    'CardiacRiskMarkers'
]

FEATURES = ['age', 'gender', 'heartRate', 'systolicBP', 'diastolicBP',
            'bloodSugar', 'cholesterol', 'spo2']


def main():
    print("=" * 60)
    print("  Smart Test Recommendation — Model Training")
    print("=" * 60)

    # 1. Load dataset
    if not os.path.exists(DATA_PATH):
        print(f"❌ Dataset not found at {DATA_PATH}")
        print("   Run:  python data/generate_dataset.py  first")
        return

    df = pd.read_csv(DATA_PATH)
    print(f"\n📊 Dataset: {len(df)} rows, {len(df.columns)} columns")

    # 2. Prepare features and targets
    X = df[FEATURES].values
    y = df[TESTS].values

    print(f"   Features shape: {X.shape}")
    print(f"   Targets shape:  {y.shape}")

    # 3. Train/Test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\n📦 Train: {len(X_train)} | Test: {len(X_test)}")

    # 4. Train Random Forest (multi-output)
    print("\n🌲 Training Random Forest Classifier...")
    base_rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model = MultiOutputClassifier(base_rf)
    model.fit(X_train, y_train)
    print("   ✅ Training complete!")

    # 5. Evaluate
    y_pred = model.predict(X_test)
    print("\n📈 Per-Test Accuracy:")
    print("-" * 40)
    for i, test in enumerate(TESTS):
        acc = accuracy_score(y_test[:, i], y_pred[:, i])
        pos = int(y_test[:, i].sum())
        print(f"   {test:25s}  {acc*100:5.1f}%  ({pos} positives in test set)")

    overall = np.mean([accuracy_score(y_test[:, i], y_pred[:, i]) for i in range(len(TESTS))])
    print(f"\n   🎯 Overall Average Accuracy: {overall*100:.1f}%")

    # 6. Save model
    joblib.dump({
        'model': model,
        'features': FEATURES,
        'tests': TESTS
    }, MODEL_PATH)
    size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
    print(f"\n💾 Model saved → {MODEL_PATH} ({size_mb:.1f} MB)")
    print("=" * 60)


if __name__ == '__main__':
    main()
