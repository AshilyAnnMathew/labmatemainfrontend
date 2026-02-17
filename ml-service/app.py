from flask import Flask, request, jsonify
import numpy as np
import logging
from datetime import datetime

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Simple Butterworth filter implementation using numpy
def butter_bandpass_filter(data, lowcut, highcut, fs, order=2):
    try:
        # Normalize frequencies
        nyq = 0.5 * fs
        low = lowcut / nyq
        high = highcut / nyq
        
        # Simple IIR filter implementation (Butterworth approximation)
        dt = 1/fs
        rc = 1/(2*np.pi*5.0)
        alpha_lp = dt/(rc+dt)
        
        # High pass at 0.5Hz
        rc = 1/(2*np.pi*0.5)
        alpha_hp = rc/(rc+dt)
        
        y_lp = np.zeros_like(data)
        y_hp = np.zeros_like(data)
        
        # Apply Low Pass
        y_lp[0] = data[0]
        for i in range(1, len(data)):
            y_lp[i] = y_lp[i-1] + alpha_lp * (data[i] - y_lp[i-1])
            
        # Apply High Pass to the Low-Passed signal
        y_hp[0] = 0
        for i in range(1, len(data)):
            y_hp[i] = alpha_hp * (y_hp[i-1] + y_lp[i] - y_lp[i-1])
            
        return y_hp
    except Exception as e:
        logging.error(f"Filter error: {e}")
        return data

def find_peaks_simple(signal, distance, prominence):
    # Simple peak detection
    peaks = []
    if len(signal) < distance:
        return peaks
    
    # Find local maxima
    for i in range(1, len(signal) - 1):
        if signal[i] > signal[i-1] and signal[i] > signal[i+1]:
            # Check distance
            if len(peaks) > 0 and (i - peaks[-1]) < distance:
                # If closer than distance, keep the higher one
                if signal[i] > signal[peaks[-1]]:
                    peaks.pop()
                    peaks.append(i)
            else:
                # Check prominence (amplitude relative to local mean)
                local_mean = np.mean(signal[max(0, i-distance):min(len(signal), i+distance)])
                if signal[i] > local_mean + prominence:
                    peaks.append(i)
                    
    return np.array(peaks)


def process_ppg_signal(data, fs=30):
    try:
        # Convert to numpy array
        sig = np.array(data)
        
        if len(sig) < fs * 2: # Need at least 2 seconds
             return None, None, 0.0, "Insufficient data length (< 2s)"

        # Filter signal (0.5Hz - 5Hz)
        filtered_sig = butter_bandpass_filter(sig, 0.5, 5.0, fs)
        
        # Peak detection
        # Distance between peaks ~0.4s (150 BPM)
        distance = int(0.35 * fs) # Reduced slightly to allow for faster heart rates / irregularities
        
        # Adaptive Thresholding Approach
        # 1. First pass: moderate prominence
        prominence_factor = 0.05 
        prominence = (np.max(filtered_sig) - np.min(filtered_sig)) * prominence_factor
        peaks = find_peaks_simple(filtered_sig, distance=distance, prominence=prominence)
        
        # 2. Rescuing: If BPM < 40 or too few peaks, try lower threshold
        # Calculate BPM tentatively
        bpm = 0
        if len(peaks) > 1:
            peak_intervals = np.diff(peaks) / fs
            avg_interval = np.mean(peak_intervals)
            if avg_interval > 0:
                bpm = 60 / avg_interval

        if len(peaks) < 4 or (bpm < 40 and len(peaks) > 0):
             logging.info(f"First pass failed (BPM: {bpm}, Peaks: {len(peaks)}). Retrying with lower threshold.")
             prominence_factor = 0.01 # Very sensitive
             prominence = (np.max(filtered_sig) - np.min(filtered_sig)) * prominence_factor
             peaks = find_peaks_simple(filtered_sig, distance=distance, prominence=prominence)
        
        if len(peaks) < 2:
            return None, None, 0.0, f"Not enough peaks detected ({len(peaks)})"

        # Calculate Heart Rate (BPM)
        peak_intervals = np.diff(peaks) / fs
        avg_interval = np.mean(peak_intervals)
        if avg_interval == 0: return None, None, 0.0, "Invalid peak interval"
        
        bpm = 60 / avg_interval
        
        # Filter BPM range
        if bpm < 30 or bpm > 220:
             return None, None, 0.0, f"BPM out of range ({bpm:.1f})"
        
        # Confidence Score based on regularity
        if len(peak_intervals) > 1:
            interval_std = np.std(peak_intervals)
            # Lower std dev -> higher confidence
            confidence = max(0, 100 - (interval_std * 200))
        else:
            confidence = 50.0

        # SpO2 Estimation (Approximation)
        dc_component = np.mean(sig)
        ac_component = np.max(filtered_sig) - np.min(filtered_sig)
        
        if dc_component == 0:
            ratio = 0
        else:
            ratio = ac_component / dc_component

        # Estimation map for single wavelength (Red)
        # This is a rough estimation
        spo2_est = 110 - (25 * ratio) 
        spo2_est = min(100, max(85, spo2_est))

        return bpm, spo2_est, confidence, None

    except Exception as e:
        logging.error(f"Signal processing error: {e}")
        return None, None, 0.0, f"Processing error: {str(e)}"

@app.route('/process-ppg', methods=['POST'])
def process_ppg():
    try:
        data = request.json
        if not data or 'red_signal' not in data:
            return jsonify({'error': 'Missing red_signal data'}), 400
        
        red_signal = data['red_signal']
        fs = data.get('fs', 30)

        bpm, spo2, confidence, error_reason = process_ppg_signal(red_signal, fs)
        
        if bpm is None:
             return jsonify({
                'success': False,
                'message': error_reason or 'Signal quality too low or insufficient data'
            }), 200

        return jsonify({
            'success': True,
            'heartRate': round(bpm, 1),
            'spo2': round(spo2, 1),
            'confidence': round(confidence, 1)
        })

    except Exception as e:
        logging.error(f"API Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict-risk', methods=['POST'])
def predict_risk():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Extract features
        age = data.get('age', 0)
        gender = data.get('gender', 'male')
        heart_rate = data.get('heartRate', 70)
        systolic_bp = data.get('systolicBP', 120)
        diastolic_bp = data.get('diastolicBP', 80)
        blood_sugar = data.get('bloodSugar', 90)
        cholesterol = data.get('cholesterol', 180)
        spo2 = data.get('spo2', 98)

        # Rule-based Risk Assessment (Mock Model)
        risk_score = 0
        risk_factors = []

        # Age Factor
        if age > 50:
            risk_score += 10
            risk_factors.append("Age > 50")
        
        # Blood Pressure Factor
        if systolic_bp > 140 or diastolic_bp > 90:
            risk_score += 30
            risk_factors.append("High Blood Pressure")
        elif systolic_bp > 130 or diastolic_bp > 85:
            risk_score += 15
            risk_factors.append("Elevated Blood Pressure")

        # Heart Rate Factor
        if heart_rate > 100:
            risk_score += 15
            risk_factors.append("Tachycardia (High Heart Rate)")
        elif heart_rate < 60:
            risk_score += 10
            risk_factors.append("Bradycardia (Low Heart Rate)")

        # Blood Sugar Factor (Assumed fasting if not specified, simpler logic)
        if blood_sugar > 126:
            risk_score += 40
            risk_factors.append("High Blood Sugar (Diabetes Risk)")
        elif blood_sugar > 100:
            risk_score += 20
            risk_factors.append("Elevated Blood Sugar (Pre-diabetes)")

        # SpO2 Factor
        if spo2 < 95:
            risk_score += 25
            risk_factors.append("Low Oxygen Saturation")

        # Cholesterol Factor
        if cholesterol > 240:
             risk_score += 25
             risk_factors.append("High Cholesterol")
        elif cholesterol > 200:
             risk_score += 10
             risk_factors.append("Borderline High Cholesterol")

        # Determine Risk Level
        if risk_score >= 60:
            risk_level = 'High'
        elif risk_score >= 30:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'

        # Normalize score to 0-100
        risk_probability = min(100, risk_score)

        return jsonify({
            'success': True,
            'riskLevel': risk_level,
            'riskScore': risk_probability,
            'riskFactors': risk_factors,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logging.error(f"Prediction API Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'ppg-service', 'time': str(datetime.now())}), 200

@app.route('/recommend-tests', methods=['POST'])
def recommend_tests():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Extract features (using defaults if missing)
        heart_rate = data.get('heartRate', 70)
        systolic_bp = data.get('systolicBP', 120)
        diastolic_bp = data.get('diastolicBP', 80)
        blood_sugar = data.get('bloodSugar', 90)
        cholesterol = data.get('cholesterol', 180)
        spo2 = data.get('spo2', 98)
        
        recommendations = []

        # 1. SpO2 Rules
        if spo2 < 95:
             recommendations.append({
                 'testName': 'Pulmonary Function Test',
                 'reason': f'Low Oxygen Saturation ({spo2}%) indicates potential respiratory issues.',
                 'priority': 'High'
             })
             recommendations.append({
                 'testName': 'Chest X-Ray',
                 'reason': 'To check for underlying lung conditions affecting oxygen levels.',
                 'priority': 'Medium'
             })

        # 2. Heart Rate Rules
        if heart_rate > 100:
            recommendations.append({
                 'testName': 'ECG (Electrocardiogram)',
                 'reason': f'High Heart Rate (Tachycardia: {heart_rate} BPM) detected.',
                 'priority': 'High'
             })
            recommendations.append({
                 'testName': 'Thyroid Profile',
                 'reason': 'Thyroid overactivity can cause high heart rate.',
                 'priority': 'Medium'
             })
        elif heart_rate < 50:
             recommendations.append({
                 'testName': 'ECG (Electrocardiogram)',
                 'reason': f'Low Heart Rate (Bradycardia: {heart_rate} BPM) detected.',
                 'priority': 'High'
             })

        # 3. Blood Pressure Rules
        if systolic_bp > 140 or diastolic_bp > 90:
            recommendations.append({
                 'testName': 'Kidney Function Test',
                 'reason': 'High Blood Pressure can strain kidneys.',
                 'priority': 'Medium'
             })
            recommendations.append({
                 'testName': 'Lipid Profile',
                 'reason': 'Hypertension is often linked with high cholesterol.',
                 'priority': 'High'
             })

        # 4. Blood Sugar Rules
        if blood_sugar > 126:
            recommendations.append({
                 'testName': 'HbA1c',
                 'reason': f'High fasting blood sugar ({blood_sugar} mg/dL) suggests diabetes risk.',
                 'priority': 'High'
             })
            recommendations.append({
                 'testName': 'Urine Analysis',
                 'reason': 'To check for glucose or ketones in urine.',
                 'priority': 'Medium'
             })
        elif blood_sugar > 100:
             recommendations.append({
                 'testName': 'HbA1c',
                 'reason': 'Pre-diabetic blood sugar levels detected.',
                 'priority': 'Medium'
             })

        # 5. Cholesterol Rules
        if cholesterol > 240:
             recommendations.append({
                 'testName': 'Lipid Profile',
                 'reason': f'High Total Cholesterol ({cholesterol} mg/dL). Detailed breakdown needed.',
                 'priority': 'High'
             })
             recommendations.append({
                 'testName': 'Liver Function Test',
                 'reason': 'Liver plays a key role in cholesterol metabolism.',
                 'priority': 'Medium'
             })
        
        # 6. Combined/Complex Rules
        if (systolic_bp > 130 or diastolic_bp > 85) and cholesterol > 200:
             recommendations.append({
                 'testName': 'Cardiac Risk Markers',
                 'reason': 'Combined high BP and cholesterol increases cardiovascular risk.',
                 'priority': 'High'
             })

        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logging.error(f"Recommendation API Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Threaded mode for better performance
    app.run(port=5001, debug=True, threaded=True)
