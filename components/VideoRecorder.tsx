import React, { useState, useRef, useEffect } from 'react';

interface VideoRecorderProps {
  onClose: () => void;
  onVideoRecorded: (base64Video: string) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ onClose, onVideoRecorded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordedChunks = useRef<Blob[]>([]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        alert("Could not access camera. Please check permissions.");
        onClose();
      }
    };
    startCamera();

    return () => {
      // Clean up media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Clean up video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Clean up media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  const handleStartRecording = () => {
    if (!streamRef.current) return;
    setIsRecording(true);
    recordedChunks.current = [];
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };
    mediaRecorderRef.current.start();
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(videoBlob);
        reader.onloadend = () => {
          onVideoRecorded(reader.result as string);
          onClose();
        };
      };
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain"></video>
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
      <div className="absolute bottom-10">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500' : 'bg-transparent'}`}
        >
          {isRecording && <div className="w-8 h-8 bg-white rounded-md"></div>}
        </button>
      </div>
    </div>
  );
};

export default VideoRecorder;