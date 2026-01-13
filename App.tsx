
import React, { useState, useRef } from 'react';
import { geminiService } from './services/geminiService';
import { TranscriptionJob, TranscriptionConfig, PRESETS, ModelName } from './types';
import { TranscriptionItem } from './components/TranscriptionItem';
import { Button } from './components/Button';
import { Recorder } from './components/Recorder';

const App: React.FC = () => {
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('narrative');
  const [customConfig, setCustomConfig] = useState<TranscriptionConfig>(PRESETS.narrative);
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentConfig = isCustomMode ? customConfig : PRESETS[activePreset];

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processTranscription = async (file: File | Blob, fileName: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const audioUrl = URL.createObjectURL(file);
    
    const jobConfig = { ...currentConfig };

    const newJob: TranscriptionJob = {
      id,
      fileName,
      status: 'processing',
      audioUrl,
      transcript: '',
      timestamp: Date.now(),
      configAtTime: jobConfig
    };

    setJobs(prev => [newJob, ...prev]);

    try {
      const base64 = await blobToBase64(file);
      const mimeType = file.type || 'audio/mpeg';
      
      await geminiService.transcribeAudioStream(
        base64, 
        mimeType, 
        jobConfig,
        (chunk) => {
          setJobs(prev => prev.map(job => 
            job.id === id ? { ...job, transcript: (job.transcript || '') + chunk } : job
          ));
        }
      );
      
      setJobs(prev => prev.map(job => 
        job.id === id ? { ...job, status: 'completed' } : job
      ));
    } catch (err: any) {
      setJobs(prev => prev.map(job => 
        job.id === id ? { ...job, status: 'error', error: err.message } : job
      ));
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      if (file.type.startsWith('audio/')) {
        processTranscription(file, file.name);
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteJob = (id: string) => {
    setJobs(prev => {
      const jobToDelete = prev.find(j => j.id === id);
      if (jobToDelete?.audioUrl) URL.revokeObjectURL(jobToDelete.audioUrl);
      return prev.filter(j => j.id !== id);
    });
  };

  const processingCount = jobs.filter(j => j.status === 'processing').length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col antialiased">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-black text-black tracking-tight flex items-center gap-1.5">
                TRANSCR <span className="text-indigo-600">PRO</span>
              </h1>
              <p className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold hidden sm:block">Enterprise Audio Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {processingCount > 0 && (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50/50 rounded-full border border-indigo-100">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">{processingCount} Active Engine</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload} 
              multiple 
              accept="audio/*" 
              className="hidden" 
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="rounded-full px-5 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 h-9"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Audio</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar - Configuration & Controls */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          
          {/* Engine Config */}
          <section className="bg-white border border-gray-100 p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]">
             <header className="flex items-center justify-between mb-5">
               <h3 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Engine Configuration</h3>
               <button 
                 onClick={() => setIsCustomMode(!isCustomMode)}
                 className="text-[9px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest"
               >
                 {isCustomMode ? 'Use Presets' : 'Custom Mode'}
               </button>
             </header>

            {isCustomMode ? (
              <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] block mb-1.5">Model Selection</label>
                  <select 
                    className="w-full bg-zinc-50 border border-gray-50 rounded-lg px-3 py-2 text-[11px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                    value={customConfig.model}
                    onChange={(e) => setCustomConfig({...customConfig, model: e.target.value as ModelName})}
                  >
                    <option value={ModelName.FLASH_3}>Gemini 3 Flash (Fast)</option>
                    <option value={ModelName.PRO_3}>Gemini 3 Pro (Deep)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] block mb-1.5">System Instruction</label>
                  <textarea 
                    className="w-full bg-zinc-50 border border-gray-50 rounded-lg px-3 py-2 text-[11px] font-medium focus:ring-1 focus:ring-indigo-500 outline-none h-20 resize-none leading-relaxed"
                    value={customConfig.systemInstruction}
                    onChange={(e) => setCustomConfig({...customConfig, systemInstruction: e.target.value})}
                    placeholder="Context for AI engine..."
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] block mb-1.5">User Prompt</label>
                  <textarea 
                    className="w-full bg-zinc-50 border border-gray-50 rounded-lg px-3 py-2 text-[11px] font-medium focus:ring-1 focus:ring-indigo-500 outline-none h-16 resize-none leading-relaxed"
                    value={customConfig.userPrompt}
                    onChange={(e) => setCustomConfig({...customConfig, userPrompt: e.target.value})}
                    placeholder="Specific formatting instructions..."
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(PRESETS).filter(([key]) => key !== 'custom').map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setActivePreset(key)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                      activePreset === key 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : 'bg-zinc-50/50 border-transparent text-zinc-600 hover:bg-zinc-50 hover:border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest">{config.name}</p>
                      {config.model === ModelName.PRO_3 && <span className="text-[7px] bg-black text-white px-1 rounded">ULTRA</span>}
                    </div>
                    <p className={`text-[8px] mt-0.5 line-clamp-1 uppercase tracking-tight opacity-70`}>
                      {config.systemInstruction}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Ingestion Hub */}
          <section className="bg-zinc-950 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden group">
            <header className="mb-4">
              <h2 className="text-lg font-black tracking-tight leading-none">Ingestion Hub</h2>
              <p className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mt-1">Multi-Source Processing</p>
            </header>
            
            <div className="space-y-3">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDragging 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                }`}
              >
                <div className="p-2 bg-zinc-900 rounded-lg">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Drop Audio Files</p>
              </div>

              <Recorder onRecordingComplete={processTranscription} />
            </div>
          </section>
        </aside>

        {/* Right Content - Workspaces */}
        <div className="lg:col-span-8">
          <header className="flex items-end justify-between mb-6 px-1">
            <div>
              <h2 className="text-2xl font-black text-black tracking-tight">Active Transcripts</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Workspace Queue</span>
                <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{jobs.length} Items</span>
              </div>
            </div>
            {jobs.length > 0 && (
              <button 
                onClick={() => {
                  if (confirm("Wipe workspace?")) {
                    jobs.forEach(j => j.audioUrl && URL.revokeObjectURL(j.audioUrl));
                    setJobs([]);
                  }
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-[9px] font-black text-gray-400 hover:text-red-500 hover:border-red-100 transition-all uppercase tracking-widest"
              >
                Clear All
              </button>
            )}
          </header>

          {jobs.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-[2rem] h-[45vh] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-50 shadow-inner">
                <svg className="w-6 h-6 text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
              </div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">Ready for Input</h3>
              <p className="text-gray-400 text-[10px] mt-2 max-w-[240px] leading-relaxed font-bold uppercase tracking-widest">Select a preset in the sidebar and upload audio to begin.</p>
            </div>
          ) : (
            <div className="space-y-4 pb-12">
              {jobs.map(job => (
                <TranscriptionItem 
                  key={job.id} 
                  job={job} 
                  onDelete={deleteJob} 
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-[9px] font-black">TP</div>
             <p className="text-[9px] font-black text-zinc-900 tracking-[0.1em] uppercase">Transcr Pro v1.6 Streaming</p>
          </div>
          <div className="text-[9px] font-bold text-gray-300 tracking-widest uppercase">
            Hyper-Scale Neural Transcription Engine
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
