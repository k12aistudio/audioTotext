
import React, { useState, useEffect, useRef } from 'react';
import { TranscriptionJob } from '../types';
import { Button } from './Button';

interface TranscriptionItemProps {
  job: TranscriptionJob;
  onDelete: (id: string) => void;
}

export const TranscriptionItem: React.FC<TranscriptionItemProps> = ({ job, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll while streaming
  useEffect(() => {
    if (job.status === 'processing' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [job.transcript, job.status]);

  const copyToClipboard = () => {
    if (job.transcript) {
      navigator.clipboard.writeText(job.transcript);
    }
  };

  const downloadTranscript = () => {
    if (!job.transcript) return;
    const blob = new Blob([job.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isBilingual = job.transcript?.includes(' - ') && job.transcript?.split('\n').length > 1;

  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden transition-all hover:border-zinc-200">
      <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
            job.status === 'completed' ? 'bg-green-500' : 
            job.status === 'processing' ? 'bg-indigo-500 animate-pulse' : 
            job.status === 'error' ? 'bg-red-500' : 'bg-gray-200'
          }`} />
          <div className="min-w-0">
            <h3 className="font-bold text-zinc-900 text-sm md:text-base truncate leading-tight tracking-tight">
              {job.fileName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                {new Date(job.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className="w-1 h-1 bg-gray-100 rounded-full"></span>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                {job.configAtTime?.name || "Standard"}
              </p>
              {job.status === 'processing' && (
                <span className="text-[8px] font-black text-white bg-indigo-600 px-1 rounded uppercase animate-pulse">Live</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 self-end md:self-center">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors px-2"
          >
            {isExpanded ? 'Hide' : 'Show'}
          </button>
          <button 
            onClick={() => onDelete(job.id)}
            className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-0 space-y-4">
          {job.audioUrl && (
            <div className="bg-zinc-50 rounded-xl p-3 border border-gray-50">
              <audio controls src={job.audioUrl} className="w-full h-7 opacity-60" />
            </div>
          )}

          {(job.transcript || job.status === 'processing') && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div 
                ref={scrollRef}
                className="bg-zinc-50/30 border border-gray-100 rounded-xl p-4 md:p-5 text-zinc-900 leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar scroll-smooth"
              >
                <div className="space-y-3">
                  {job.transcript ? (
                    job.transcript.split('\n').map((line, idx) => (
                      <div key={idx} className="flex gap-3 group items-start">
                        <span className="text-[9px] font-black text-indigo-600 opacity-20 group-hover:opacity-100 transition-opacity mt-1 w-5 flex-shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                        <div className="text-sm font-medium tracking-tight whitespace-pre-wrap flex-1">
                          {isBilingual && line.includes(' - ') ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                              <span className="text-zinc-800 border-l-2 border-indigo-100 pl-3">{line.split(' - ')[0]}</span>
                              <span className="text-zinc-400 italic font-normal">{line.split(' - ')[1]}</span>
                            </div>
                          ) : (
                            line
                          )}
                        </div>
                      </div>
                    ))
                  ) : job.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                      </div>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Initiating Neural Link...</p>
                    </div>
                  ) : null}
                  
                  {job.status === 'processing' && job.transcript && (
                    <div className="flex items-center gap-2 pl-8 opacity-40">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping"></div>
                      <span className="text-[8px] font-black uppercase tracking-widest italic">Stream Active</span>
                    </div>
                  )}
                </div>
              </div>
              
              {job.status !== 'processing' && job.status !== 'error' && (
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" className="flex-1 rounded-xl h-10" onClick={copyToClipboard}>
                    Copy
                  </Button>
                  <Button variant="primary" className="flex-1 rounded-xl h-10" onClick={downloadTranscript}>
                    Download
                  </Button>
                </div>
              )}
            </div>
          )}

          {job.status === 'error' && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-tight">{job.error || "Engine Timeout"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
