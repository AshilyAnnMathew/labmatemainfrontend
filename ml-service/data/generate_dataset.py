"""
Generate a synthetic clinical dataset for training
the Smart Test Recommendation ML model.

Each row represents a patient with vitals. The target columns
are binary labels indicating which tests should be recommended.
"""

import csv
import random
import os

random.seed(42)

TESTS = [
    'ECG', 'ThyroidProfile', 'LipidProfile', 'HbA1c',
    'KidneyFunction', 'LiverFunction', 'CBC',
    'UrineAnalysis', 'PulmonaryFunction', 'ChestXRay',
    'CardiacRiskMarkers'
]

FEATURES = ['age', 'gender', 'heartRate', 'systolicBP', 'diastolicBP',
            'bloodSugar', 'cholesterol', 'spo2']


def generate_row():
    age = random.randint(18, 85)
    gender = random.choice(['male', 'female'])
    gender_val = 0 if gender == 'male' else 1

    heart_rate = random.gauss(75, 15)
    heart_rate = max(40, min(150, round(heart_rate)))

    systolic_bp = random.gauss(120, 20)
    systolic_bp = max(85, min(200, round(systolic_bp)))

    diastolic_bp = random.gauss(80, 12)
    diastolic_bp = max(50, min(130, round(diastolic_bp)))

    blood_sugar = random.gauss(100, 30)
    blood_sugar = max(60, min(300, round(blood_sugar)))

    cholesterol = random.gauss(200, 40)
    cholesterol = max(100, min(400, round(cholesterol)))

    spo2 = random.gauss(97, 2)
    spo2 = max(85, min(100, round(spo2, 1)))

    # --- Rule-based labeling with noise for realistic training ---
    labels = {t: 0 for t in TESTS}

    # ECG: high or low heart rate
    if heart_rate > 100 or heart_rate < 55:
        labels['ECG'] = 1 if random.random() < 0.88 else 0

    # Thyroid Profile: tachycardia or age > 40
    if heart_rate > 100 or (age > 40 and random.random() < 0.3):
        labels['ThyroidProfile'] = 1 if random.random() < 0.8 else 0

    # Lipid Profile: high BP or high cholesterol
    if systolic_bp > 135 or diastolic_bp > 88 or cholesterol > 210:
        labels['LipidProfile'] = 1 if random.random() < 0.85 else 0

    # HbA1c: elevated blood sugar
    if blood_sugar > 105:
        labels['HbA1c'] = 1 if random.random() < 0.9 else 0
    if blood_sugar > 140:
        labels['HbA1c'] = 1  # Always for very high sugar

    # Kidney Function: high BP
    if systolic_bp > 140 or diastolic_bp > 90:
        labels['KidneyFunction'] = 1 if random.random() < 0.82 else 0

    # Liver Function: high cholesterol
    if cholesterol > 230:
        labels['LiverFunction'] = 1 if random.random() < 0.78 else 0

    # CBC: age > 50 or anemia indicators (low heart rate + low spo2)
    if age > 50 or (heart_rate < 60 and spo2 < 96):
        labels['CBC'] = 1 if random.random() < 0.7 else 0

    # Urine Analysis: high blood sugar
    if blood_sugar > 126:
        labels['UrineAnalysis'] = 1 if random.random() < 0.85 else 0

    # Pulmonary Function: low SpO2
    if spo2 < 95:
        labels['PulmonaryFunction'] = 1 if random.random() < 0.9 else 0

    # Chest X-Ray: low SpO2 or age > 55 with smoking-proxy
    if spo2 < 95:
        labels['ChestXRay'] = 1 if random.random() < 0.85 else 0

    # Cardiac Risk Markers: combined high BP + high cholesterol
    if (systolic_bp > 130 or diastolic_bp > 85) and cholesterol > 200:
        labels['CardiacRiskMarkers'] = 1 if random.random() < 0.88 else 0

    # Add some noise: randomly flip 2-5% of labels
    for t in TESTS:
        if random.random() < 0.03:
            labels[t] = 1 - labels[t]

    return {
        'age': age,
        'gender': gender_val,
        'heartRate': heart_rate,
        'systolicBP': systolic_bp,
        'diastolicBP': diastolic_bp,
        'bloodSugar': blood_sugar,
        'cholesterol': cholesterol,
        'spo2': spo2,
        **labels
    }


def main():
    rows = [generate_row() for _ in range(500)]

    out_path = os.path.join(os.path.dirname(__file__), 'health_dataset.csv')
    with open(out_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FEATURES[:-1] + ['gender'] + FEATURES[2:] + TESTS)
        # Fix header order
        header = ['age', 'gender', 'heartRate', 'systolicBP', 'diastolicBP',
                  'bloodSugar', 'cholesterol', 'spo2'] + TESTS
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Generated {len(rows)} rows → {out_path}")

    # Quick stats
    for t in TESTS:
        positive = sum(1 for r in rows if r[t] == 1)
        print(f"   {t}: {positive}/{len(rows)} positive ({positive/len(rows)*100:.1f}%)")


if __name__ == '__main__':
    main()
