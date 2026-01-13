
import React, { useState, useRef } from 'react';

interface RecorderProps {
  onRecordingComplete: (blob: Blob, fileName: string) => void;
}

export const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const fileName = `Capture_${new Date().toLocaleTimeString().replace(/\s/g, '')}`;
        onRecordingComplete(blob, fileName);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between group">
      <div>
        <h4 className="font-bold text-white text-[11px] uppercase tracking-widest">Live Capture</h4>
        <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Studio Recording</p>
      </div>
      
      <div className="flex items-center gap-3">
        {isRecording && (
          <div className="flex flex-col items-end">
             <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest animate-pulse">On Air</span>
             <span className="text-sm font-mono font-black text-white">{formatTime(recordingTime)}</span>
          </div>
        )}

        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
            isRecording 
            ? 'bg-red-500 border-red-500/20 scale-105' 
            : 'bg-zinc-800 border-zinc-700 hover:border-indigo-500'
          }`}
        >
          {isRecording ? (
            <div className="w-3 h-3 bg-white rounded-[2px]"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
