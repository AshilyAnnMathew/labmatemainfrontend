import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Activity, Heart, Wind, AlertCircle, Play, Square, Zap, ZapOff } from 'lucide-react';
import { vitalsAPI } from '../../services/api';
import Swal from 'sweetalert2';

const PPGMonitor = ({ onComplete }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const chartCanvasRef = useRef(null);

    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [signalQuality, setSignalQuality] = useState(0); // 0-100
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [feedback, setFeedback] = useState("");

    const [debugInfo, setDebugInfo] = useState("");

    // Camera selection
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);

    const handleDevices = useCallback(
        (mediaDevices) =>
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
        [setDevices]
    );

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);

    // Buffer to store raw signal data
    const dataBuffer = useRef([]);
    const requestRef = useRef();
    const startTimeRef = useRef();

    // Configuration
    const DURATION_SECONDS = 30;
    const FPS = 30;
    const TOTAL_FRAMES = DURATION_SECONDS * FPS;

    const toggleFlash = async () => {
        if (webcamRef.current && webcamRef.current.stream) {
            const track = webcamRef.current.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
                try {
                    await track.applyConstraints({
                        advanced: [{ torch: !isFlashOn }]
                    });
                    setIsFlashOn(!isFlashOn);
                } catch (e) {
                    console.error("Flash error:", e);
                    setError("Could not toggle flash. Please use specific device settings.");
                }
            } else {
                setError("Flash not supported on this device. Please use an external light source (e.g. phone flashlight).");
            }
        }
    };

    // Process video frame to extract redness
    const processFrame = useCallback(() => {
        if (!isScanning || !webcamRef.current || !webcamRef.current.video) return;

        const video = webcamRef.current.video;
        if (video.readyState !== 4) {
            requestRef.current = requestAnimationFrame(processFrame);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return; // Guard clause

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Extract center region (ROI) - 50x50 pixels
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const roiSize = 50;
        const startX = centerX - roiSize / 2;
        const startY = centerY - roiSize / 2;

        const imageData = ctx.getImageData(startX, startY, roiSize, roiSize);
        const data = imageData.data;

        // Calculate average Red value and Brightness
        let sumRed = 0;
        let sumGreen = 0;
        let sumBlue = 0;

        for (let i = 0; i < data.length; i += 4) {
            sumRed += data[i];
            sumGreen += data[i + 1];
            sumBlue += data[i + 2];
        }

        const pixelCount = data.length / 4;
        const avgRed = sumRed / pixelCount;
        const avgGreen = sumGreen / pixelCount;
        const avgBlue = sumBlue / pixelCount;

        // Check signal quality (finger detection)
        const brightness = (avgRed + avgGreen + avgBlue) / 3;
        // Relaxed Heuristic: Red should be higher than other channels, but allow some margin
        const isRedDominant = avgRed > avgGreen + 10 && avgRed > avgBlue + 10;

        // Debug info for user
        const debugStr = `R:${Math.round(avgRed)} G:${Math.round(avgGreen)} B:${Math.round(avgBlue)} Bri:${Math.round(brightness)}`;
        setDebugInfo(debugStr);

        let quality = 0;
        let msg = "";

        if (brightness < 10) {
            msg = "Too Dark - Use Flash or Phone Torch";
            quality = 0;
        } else if (!isRedDominant) {
            msg = "Place Finger on Camera";
            quality = 0;
        } else {
            // Good signal
            quality = Math.min(100, (avgRed / 255) * 100);
            msg = "";
        }

        setSignalQuality(quality);
        setFeedback(msg);

        // Only collect data if quality is acceptable threshold
        // Relaxed threshold to 20 to allow for varied lighting
        // FORCE COLLECT DATA for debugging
        if (isScanning) {
            dataBuffer.current.push(avgRed);

            // Update progress
            const currentDuration = (Date.now() - startTimeRef.current) / 1000;
            const newProgress = Math.min(100, (currentDuration / DURATION_SECONDS) * 100);
            setProgress(newProgress);

            // Draw Real-time Waveform
            drawWaveform(avgRed);

            if (currentDuration >= DURATION_SECONDS) {
                stopScan();
                // We keep looping for preview even after stop
            }
        }

        // Always loop for continuous monitoring
        requestRef.current = requestAnimationFrame(processFrame);

    }, [isScanning]);

    // Start loop on mount and restart if processFrame changes
    useEffect(() => {
        requestRef.current = requestAnimationFrame(processFrame);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [processFrame]);

    const drawWaveform = (newValue) => {
        const canvas = chartCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const imageData = ctx.getImageData(1, 0, width - 1, height);
        ctx.putImageData(imageData, 0, 0);
        ctx.clearRect(width - 1, 0, 1, height);

        const buffer = dataBuffer.current;
        const recent = buffer.slice(-100); // Last 100 points
        if (recent.length < 2) return;

        const min = Math.min(...recent);
        const max = Math.max(...recent);
        const range = max - min || 1;

        const y = height - ((newValue - min) / range) * height; // Invert Y

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(width - 2, y, 2, 2);
    };

    const startScan = () => {
        setResult(null);
        setError(null);
        setFeedback("");
        dataBuffer.current = [];
        startTimeRef.current = Date.now();
        setIsScanning(true);
        setProgress(0);


        // Auto-try flash if supported
        if (!isFlashOn && webcamRef.current && webcamRef.current.stream) {
            const track = webcamRef.current.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
                track.applyConstraints({ advanced: [{ torch: true }] })
                    .then(() => setIsFlashOn(true))
                    .catch(e => console.log("Auto-flash failed", e));
            }
        }
    };

    const stopScan = async () => {
        setIsScanning(false);
        // Do NOT cancel animation frame so user can still see signal quality

        // Turn off flash
        if (isFlashOn && webcamRef.current && webcamRef.current.stream) {
            const track = webcamRef.current.stream.getVideoTracks()[0];
            track.applyConstraints({ advanced: [{ torch: false }] })
                .then(() => setIsFlashOn(false))
                .catch(e => console.log("Auto-flash off failed", e));
        }

        // Process Data
        if (dataBuffer.current.length < FPS * 5) { // Need at least 5 seconds
            setError("Insufficient data collected. Please try again and keep your finger steady.");
            return;
        }

        try {
            Swal.fire({
                title: 'Processing...',
                text: 'Analyzing your vital signs',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Calculate approximate sampling rate
            const duration = (Date.now() - startTimeRef.current) / 1000;
            const actualFs = dataBuffer.current.length / duration;

            console.log(`Captured ${dataBuffer.current.length} frames in ${duration}s. FS: ${actualFs}`);

            const response = await vitalsAPI.processSignal({
                red_signal: dataBuffer.current,
                fs: actualFs
            });

            Swal.close();

            if (response.success) {
                setResult(response.data || response); // Handle format wrapping
                if (onComplete) onComplete(response.data || response);
            } else {
                setError(response.message || "Failed to process vitals");
            }

        } catch (err) {
            Swal.close();
            console.error(err);
            setError("Server error during processing.");
        }
    };

    const handleCancel = () => {
        setIsScanning(false);
        // Keep monitoring running
        setProgress(0);
        dataBuffer.current = [];
        // Turn off flash
        if (isFlashOn && webcamRef.current && webcamRef.current.stream) {
            const track = webcamRef.current.stream.getVideoTracks()[0];
            track.applyConstraints({ advanced: [{ torch: false }] })
                .then(() => setIsFlashOn(false))
                .catch(e => console.log("Auto-flash off failed", e));
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            // Ensure flash is off
            if (webcamRef.current && webcamRef.current.stream) {
                const track = webcamRef.current.stream.getVideoTracks()[0];
                // Best effort cleanup
                try {
                    track.applyConstraints({ advanced: [{ torch: false }] });
                } catch (e) { }
            }
        };
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <Heart className="w-5 h-5 text-red-500 mr-2" />
                        Vital Monitor (PPG)
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Measure Heart Rate and SpO2 using your camera.
                    </p>
                </div>
                <button
                    onClick={toggleFlash}
                    className={`p-2 rounded-full ${isFlashOn ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'} hover:bg-gray-200 transition-colors`}
                    title="Toggle Flash/Torch"
                >
                    {isFlashOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </button>
            </div>
            {/* Camera Select & Debug */}
            <div className="p-2 bg-gray-50 text-xs text-gray-500 border-b border-gray-100 flex flex-col gap-2">
                <select
                    className="w-full p-1 border rounded bg-white"
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    value={selectedDeviceId}
                >
                    {devices.map((device, key) => (
                        <option key={key} value={device.deviceId}>
                            {device.label || `Camera ${key + 1}`}
                        </option>
                    ))}
                </select>
                <div className="font-mono text-[10px] text-center">{debugInfo}</div>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                    </div>
                )}

                {/* Camera View */}
                <div className="relative mx-auto rounded-lg overflow-hidden bg-black aspect-video max-w-sm shadow-inner mb-6">
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            deviceId: selectedDeviceId,
                            facingMode: !selectedDeviceId ? "environment" : undefined
                        }}
                        className="w-full h-full object-cover opacity-80"
                        mirrored={false}
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-16 h-16 rounded-full border-4 transition-colors duration-300 ${isScanning ? (signalQuality > 20 ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20') : 'border-white/50 border-dashed'}`}></div>
                    </div>

                    {!isScanning && !result && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white text-center p-4">
                            <p className="font-medium text-sm mb-2">Place your finger over the camera lens entirely.</p>
                            <p className="text-xs text-gray-300">
                                💡 No built-in flash? Turn on your phone's flashlight and hold it against your finger.
                            </p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    {/* Progress Bar */}
                    {isScanning && (
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div className="bg-red-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}

                    {/* Waveform Canvas */}
                    <div className="h-16 bg-gray-50 rounded border border-gray-100 w-full overflow-hidden relative">
                        <canvas ref={chartCanvasRef} width={400} height={64} className="w-full h-full" />
                        {!isScanning && <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">Waveform will appear here</div>}
                        {isScanning && feedback && (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-red-500 font-medium bg-white/80">
                                {feedback}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center gap-4">
                        {!isScanning ? (
                            <button
                                onClick={startScan}
                                className="flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {result ? 'Measure Again' : 'Start Measurement'}
                            </button>
                        ) : (
                            <button
                                onClick={handleCancel}
                                className="flex items-center px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                <Square className="w-4 h-4 mr-2" />
                                Stop
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-6 border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                            <div className="flex justify-center mb-2"><Heart className="w-6 h-6 text-red-500" /></div>
                            <div className="text-2xl font-bold text-gray-900">{result.heartRate} <span className="text-xs text-gray-500 font-normal">BPM</span></div>
                            <div className="text-xs text-gray-500 mt-1">Heart Rate</div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                            <div className="flex justify-center mb-2"><Wind className="w-6 h-6 text-blue-500" /></div>
                            <div className="text-2xl font-bold text-gray-900">{result.spo2}%</div>
                            <div className="text-xs text-gray-500 mt-1">SpO2</div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                            <div className="flex justify-center mb-2"><Activity className="w-6 h-6 text-gray-500" /></div>
                            <div className="text-2xl font-bold text-gray-900">{result.confidence}%</div>
                            <div className="text-xs text-gray-500 mt-1">Confidence</div>
                        </div>

                        <div className="col-span-3 text-center mt-2">
                            <p className={`text-sm font-medium ${result.status === 'abnormal' ? 'text-amber-600' : 'text-green-600'}`}>
                                Result: {result.status === 'abnormal' ? 'Irregular values detected. Please consult a doctor.' : 'Within normal range.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PPGMonitor;
