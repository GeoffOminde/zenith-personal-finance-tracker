
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { parseReceipt } from '../services/geminiService';
import { ParsedReceipt } from '../types';
import Button from './ui/Button';

// --- ICONS ---
const Spinner = () => <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;

interface ReceiptScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: ParsedReceipt) => void;
    apiKey: string | null;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ isOpen, onClose, onComplete, apiKey }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = useCallback(async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Could not access the camera. Please check permissions and try again.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context){
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(imageDataUrl);
                stopCamera();
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setError(null);
        startCamera();
    };

    const handleConfirm = async () => {
        if (!capturedImage || !apiKey) return;
        
        setIsLoading(true);
        setError(null);
        try {
            // Remove the data URL prefix 'data:image/jpeg;base64,'
            const base64Data = capturedImage.split(',')[1];
            const parsedData = await parseReceipt(apiKey, base64Data);
            onComplete(parsedData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to parse receipt.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center text-white p-4">
            <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-20">
                <CloseIcon />
            </button>
            
            <div className="relative w-full max-w-lg aspect-square bg-gray-900 rounded-lg overflow-hidden flex justify-center items-center">
                {error && (
                    <div className="text-center p-4">
                        <p className="font-semibold text-red-400">Error</p>
                        <p className="text-sm text-gray-300 mb-4">{error}</p>
                        <Button variant="secondary" onClick={startCamera}>Try Again</Button>
                    </div>
                )}

                {!error && (
                    <>
                        {capturedImage ? (
                            <img src={capturedImage} alt="Captured receipt" className="object-contain h-full w-full" />
                        ) : (
                            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                        )}

                        {isLoading && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center gap-4">
                                <Spinner />
                                <p>Analyzing Receipt...</p>
                            </div>
                        )}
                        
                        <canvas ref={canvasRef} className="hidden" />
                    </>
                )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-6">
                {!capturedImage && !error && (
                    <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30 transition-transform hover:scale-105">
                        <CameraIcon />
                    </button>
                )}
                {capturedImage && !isLoading && (
                    <>
                        <Button onClick={handleRetake} variant="secondary" size="lg">Retake</Button>
                        <Button onClick={handleConfirm} variant="primary" size="lg">Confirm</Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReceiptScanner;