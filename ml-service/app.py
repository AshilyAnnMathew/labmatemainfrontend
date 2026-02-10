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
        # Pre-calculated coefficients for 2nd order Butterworth bandpass 0.5-5Hz at 30Hz
        # If fs varies significantly, this approach is less accurate but sufficient for POC.
        # Alternatively, we can use a simpler Moving Average approach.
        
        # Let's use a robust Moving Average Bandpass to avoid scipy dependency
        # High-pass = Original - Low-pass (0.5Hz)
        # Low-pass = Low-pass (5Hz)
        
        # Moving average window sizes
        # 0.5 Hz -> 2 seconds window -> 2 * fs samples
        # 5.0 Hz -> 0.2 seconds window -> 0.2 * fs samples
        
        # But moving average is not ideal for PPG.
        # Let's use a simple recursive filter (IIR)
        # y[n] = a * y[n-1] + (1-a) * x[n] (Low Pass)
        
        # Low pass at 5Hz
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
             return None, None, 0.0

        # Filter signal (0.5Hz - 5Hz)
        filtered_sig = butter_bandpass_filter(sig, 0.5, 5.0, fs)
        
        # Peak detection
        # Distance between peaks ~0.4s (150 BPM)
        distance = int(0.4 * fs) 
        # Prominence threshold
        prominence = (np.max(filtered_sig) - np.min(filtered_sig)) * 0.1
        
        peaks = find_peaks_simple(filtered_sig, distance=distance, prominence=prominence)
        
        if len(peaks) < 2:
            return None, None, 0.0

        # Calculate Heart Rate (BPM)
        peak_intervals = np.diff(peaks) / fs
        avg_interval = np.mean(peak_intervals)
        if avg_interval == 0: return None, None, 0.0
        
        bpm = 60 / avg_interval
        
        # Filter BPM range
        if bpm < 30 or bpm > 220:
             return None, None, 0.0
        
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

        return bpm, spo2_est, confidence

    except Exception as e:
        logging.error(f"Signal processing error: {e}")
        return None, None, 0.0

@app.route('/process-ppg', methods=['POST'])
def process_ppg():
    try:
        data = request.json
        if not data or 'red_signal' not in data:
            return jsonify({'error': 'Missing red_signal data'}), 400
        
        red_signal = data['red_signal']
        fs = data.get('fs', 30)

        bpm, spo2, confidence = process_ppg_signal(red_signal, fs)
        
        if bpm is None:
             return jsonify({
                'success': False,
                'message': 'Signal quality too low or insufficient data'
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

if __name__ == '__main__':
    # Threaded mode for better performance
    app.run(port=5001, debug=True, threaded=True)
