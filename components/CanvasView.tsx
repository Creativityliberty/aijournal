import React, { useState, useRef, useEffect, useCallback } from 'react';
import { JournalPage, CanvasItem, ItemType, Position } from '../types';
import { ImageIcon, SparklesIcon, MicIcon, ArrowLeftIcon, VideoCameraIcon, PlayIcon, FileCodeIcon, DownloadIcon } from './Icons';
import ImageGeneratorModal from './ImageGeneratorModal';
import VideoRecorder from './VideoRecorder';
import { transcribeAudio } from '../services/geminiService';
import { exportPageAsHtml, exportVideoAsGif } from '../services/exportService';

interface ExportStatus {
  inProgress: boolean;
  message: string;
}

const ExportLoader: React.FC<{ status: ExportStatus }> = ({ status }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex flex-col justify-center items-center text-white">
        <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold">Exporting...</p>
        <p className="text-sm mt-1">{status.message}</p>
    </div>
);

interface CanvasItemProps {
  item: CanvasItem;
  isSelected: boolean;
  onUpdate: (id: string, newPosition: Position, newSize?: {width: number, height: number}) => void;
  onSelect: (e: React.MouseEvent, id: string) => void;
  onPlayAudio: (audioSrc: string) => void;
  onExportGif: (item: CanvasItem) => void;
}

const CanvasItemComponent: React.FC<CanvasItemProps> = ({ item, isSelected, onUpdate, onSelect, onPlayAudio, onExportGif }) => {
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    onSelect(e, item.id);
    
    const startPos = { x: e.clientX, y: e.clientY };
    const startItemPos = item.position;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = startItemPos.x + (moveEvent.clientX - startPos.x);
      const newY = startItemPos.y + (moveEvent.clientY - startPos.y);
      onUpdate(item.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [item.id, item.position, onUpdate, onSelect]);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (item.audioContent) {
        onPlayAudio(item.audioContent);
    }
  }

  return (
    <div
      ref={itemRef}
      onMouseDown={handleMouseDown}
      onClick={item.type === ItemType.TEXT && item.audioContent ? handleInteraction : (e) => onSelect(e, item.id)}
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        left: `${item.position.x}px`,
        top: `${item.position.y}px`,
        width: `${item.size.width}px`,
        height: item.type === ItemType.TEXT ? 'auto' : `${item.size.height}px`,
        zIndex: item.zIndex,
        outline: isSelected ? '2px solid #4f46e5' : 'none',
        outlineOffset: '4px',
        borderRadius: '8px'
      }}
    >
      {item.type === ItemType.IMAGE ? (
        <img src={item.content} alt="journal content" className="w-full h-full object-cover rounded-md shadow-lg pointer-events-none" />
      ) : item.type === ItemType.TEXT ? (
        <div className={`relative bg-black bg-opacity-60 text-white p-4 rounded-md shadow-lg pointer-events-none text-base ${item.audioContent ? 'cursor-pointer' : ''}`} style={{ fontFamily: "'Courier Prime', monospace" }}>
          {item.content}
          {item.audioContent && (
              <div className="absolute bottom-2 right-2 opacity-70">
                  <PlayIcon className="w-5 h-5 text-white" />
              </div>
          )}
        </div>
      ): item.type === ItemType.VIDEO ? (
        <div className="relative w-full h-full group">
            <video 
                src={item.content} 
                className="w-full h-full object-cover rounded-md shadow-lg pointer-events-none" 
                autoPlay 
                loop 
                muted 
                playsInline
            />
            <button 
                onClick={(e) => { e.stopPropagation(); onExportGif(item); }}
                className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs font-bold py-1 px-2 rounded-full flex items-center gap-1 hover:bg-opacity-80 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                <DownloadIcon className="w-4 h-4" />
                GIF
            </button>
        </div>
      ) : null}
    </div>
  );
};


interface CanvasViewProps {
  page: JournalPage;
  onSave: (page: JournalPage) => void;
  onBack: () => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({ page, onSave, onBack }) => {
  const [items, setItems] = useState<CanvasItem[]>(page.items);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ inProgress: false, message: '' });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const zIndexCounterRef = useRef<number>(Math.max(0, ...page.items.map(i => i.zIndex)) + 1);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const addNewItem = (newItem: Omit<CanvasItem, 'id' | 'zIndex'>) => {
      const zIndex = zIndexCounterRef.current++;
      setItems(prev => [...prev, { ...newItem, id: Date.now().toString(), zIndex }]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const img = new Image();
          img.onload = () => {
            const aspectRatio = img.width / img.height;
            const width = 300;
            const height = width / aspectRatio;
            addNewItem({
              type: ItemType.IMAGE,
              content: e.target!.result as string,
              position: { x: 50, y: 50 },
              size: { width, height },
            });
          };
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageGenerated = (base64Image: string) => {
    addNewItem({
        type: ItemType.IMAGE,
        content: base64Image,
        position: { x: 70, y: 70 },
        size: { width: 300, height: 300 },
    });
  };

  const handleVideoRecorded = (base64Video: string) => {
    addNewItem({
        type: ItemType.VIDEO,
        content: base64Video,
        position: { x: 90, y: 90 },
        size: { width: 320, height: 180 }, // 16:9 aspect ratio
    });
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
        setSelectedItemId(null);
        const text = prompt("Enter your note:");
        if (text) {
             addNewItem({
                type: ItemType.TEXT,
                content: text,
                position: { x: e.clientX - e.currentTarget.getBoundingClientRect().left, y: e.clientY - e.currentTarget.getBoundingClientRect().top },
                size: { width: 250, height: 0 }, // height is auto for text
            });
        }
    }
  };

  const updateItem = useCallback((id: string, newPosition: Position) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, position: newPosition } : item
      )
    );
  }, []);

  const selectItem = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedItemId(id);
    const newZIndex = zIndexCounterRef.current++;
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, zIndex: newZIndex } : item
      )
    );
  }, []);

  const handlePlayAudio = (audioSrc: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const newAudioPlayer = new Audio(audioSrc);
    audioPlayerRef.current = newAudioPlayer;
    newAudioPlayer.play().catch(e => console.error("Error playing audio:", e));
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                setIsTranscribing(true);
                try {
                    const transcribedText = await transcribeAudio(audioBlob);
                    if(transcribedText) {
                        addNewItem({
                            type: ItemType.TEXT,
                            content: transcribedText,
                            audioContent: base64Audio,
                            position: { x: 80, y: 80 },
                            size: { width: 300, height: 0 },
                        });
                    }
                } catch (error) {
                    console.error("Transcription failed", error);
                    alert("Transcription failed. Please try again.");
                } finally {
                    setIsTranscribing(false);
                }
            };
            reader.onerror = () => {
                console.error("Failed to read audio blob");
                alert("Could not process audio recording.");
            }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
    }
  };

  const handleSave = () => {
    const firstImage = items.find(item => item.type === ItemType.IMAGE || item.type === ItemType.VIDEO);
    onSave({ ...page, items, previewImage: firstImage?.content });
  };
  
  const handleExportHtml = () => {
      exportPageAsHtml({ ...page, items });
  }

  const handleExportGif = async (item: CanvasItem) => {
    if (item.type !== ItemType.VIDEO) return;
    setExportStatus({ inProgress: true, message: 'Preparing video for conversion...' });
    try {
        await exportVideoAsGif(item.content, (message) => {
            setExportStatus({ inProgress: true, message });
        });
    } catch (error) {
        console.error("Failed to export GIF", error);
        alert(`Failed to export GIF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setExportStatus({ inProgress: false, message: '' });
    }
  }

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up audio player
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }

      // Clean up media recorder and streams
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-stone-100 overflow-hidden" onClick={handleCanvasClick}>
       {items.map(item => (
        <CanvasItemComponent 
            key={item.id} 
            item={item} 
            isSelected={item.id === selectedItemId}
            onUpdate={updateItem} 
            onSelect={selectItem} 
            onPlayAudio={handlePlayAudio}
            onExportGif={handleExportGif}
        />
      ))}

      {isGeneratingImage && (
        <ImageGeneratorModal
          onClose={() => setIsGeneratingImage(false)}
          onImageGenerated={handleImageGenerated}
        />
      )}
      
      {showVideoRecorder && (
        <VideoRecorder
          onClose={() => setShowVideoRecorder(false)}
          onVideoRecorded={handleVideoRecorded}
        />
      )}

      {exportStatus.inProgress && <ExportLoader status={exportStatus} />}

      {/* Toolbar */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/70 backdrop-blur-sm shadow-xl rounded-full p-2">
         <button onClick={handleSave} className="p-3 rounded-full hover:bg-gray-200 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-gray-700"/>
        </button>
        <div className="w-px h-8 bg-gray-300"></div>
        <label htmlFor="file-upload" className="cursor-pointer p-3 rounded-full hover:bg-gray-200 transition-colors">
          <ImageIcon className="w-6 h-6 text-gray-700" />
          <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
        <button onClick={() => setShowVideoRecorder(true)} className="p-3 rounded-full hover:bg-gray-200 transition-colors">
          <VideoCameraIcon className="w-6 h-6 text-gray-700" />
        </button>
        <button onClick={() => setIsGeneratingImage(true)} className="p-3 rounded-full hover:bg-gray-200 transition-colors">
          <SparklesIcon className="w-6 h-6 text-gray-700" />
        </button>
        <button 
          onClick={isRecording ? stopRecording : startRecording} 
          className={`p-3 rounded-full hover:bg-gray-200 transition-colors relative ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
          disabled={isTranscribing}
        >
          {isTranscribing && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              </div>
          )}
          <MicIcon className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-gray-700'}`} />
        </button>
        <div className="w-px h-8 bg-gray-300"></div>
        <button onClick={handleExportHtml} className="p-3 rounded-full hover:bg-gray-200 transition-colors">
            <FileCodeIcon className="w-6 h-6 text-gray-700"/>
        </button>
      </div>
    </div>
  );
};