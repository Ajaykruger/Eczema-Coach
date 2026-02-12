
import React, { useState } from 'react';
import { DailyLog } from '../types';
import { ArrowLeft, Calendar, Maximize2, X, Camera, Clock } from 'lucide-react';

interface Props {
  logs: DailyLog[];
  onBack: () => void;
}

const Gallery: React.FC<Props> = ({ logs, onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Filter logs that have images
  // Sort by date (descending)
  const logsWithImages = logs
    .filter(log => (log.images && log.images.length > 0) || log.photoUrl)
    .sort((a, b) => {
        // Prefer timestamp for sorting if available, else date
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
        return timeB - timeA;
    });

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-10 px-4 py-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
           <h1 className="text-xl font-bold text-slate-900">Skin Journey</h1>
           <p className="text-xs text-slate-500">Visualize your healing over time.</p>
        </div>
      </header>

      {/* Gallery Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {logsWithImages.map((log) => {
           // Handle legacy single photoUrl vs new images array
           const displayImages = log.images && log.images.length > 0 ? log.images : (log.photoUrl ? [log.photoUrl] : []);
           
           // Format Time if available
           const timeStr = log.timestamp 
             ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
             : null;

           return displayImages.map((img, idx) => (
             <div 
                key={`${log.id}-${idx}`} 
                className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-sm border border-slate-200 cursor-pointer group"
                onClick={() => setSelectedImage(img)}
             >
                <img src={img} alt={`Log ${log.date}`} className="w-full h-full object-cover" />
                
                {/* Overlay Info */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-6 text-white">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Calendar size={12} className="opacity-70" />
                                <span className="text-xs font-medium">{new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                            {timeStr && (
                                <div className="flex items-center gap-1.5 opacity-80">
                                    <Clock size={10} className="opacity-70" />
                                    <span className="text-[10px]">{timeStr}</span>
                                </div>
                            )}
                        </div>
                        {log.aiRednessScore !== undefined && (
                            <div className="inline-block px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm text-[10px] font-bold">
                                {log.aiRednessScore}
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-1.5 rounded-full text-white">
                    <Maximize2 size={16} />
                </div>
             </div>
           ));
        })}

        {logsWithImages.length === 0 && (
            <div className="col-span-2 py-16 flex flex-col items-center text-center text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Camera size={32} />
                </div>
                <h3 className="text-slate-900 font-bold">Your transformation starts here</h3>
                <p className="text-sm mt-2 max-w-xs mx-auto">
                    Take your "Day 1" photo in the daily check-in. Future you will want to see this progress.
                </p>
            </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
            <button 
                className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
                onClick={() => setSelectedImage(null)}
            >
                <X size={32} />
            </button>
            <img 
                src={selectedImage} 
                className="max-w-full max-h-full rounded-lg shadow-2xl" 
                onClick={(e) => e.stopPropagation()} 
                alt="Full size"
            />
        </div>
      )}
    </div>
  );
};

export default Gallery;
