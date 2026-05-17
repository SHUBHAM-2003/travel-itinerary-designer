import React, { useState } from 'react';
import { Plane, Wand2, RefreshCcw, Map, Sun, MoveRight, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TripDay = {
  dayTitle: string;
  activities: { time: string; description: string }[];
  meals: string;
  stay: string;
  imageQuery: string;
};

type ItineraryData = {
  title: string;
  category: string;
  duration: string;
  groupType: string;
  price: string;
  overview: string;
  days: TripDay[];
  inclusions: string[];
  exclusions: string[];
  importantNotes: string[];
};

export default function App() {
  const [rawData, setRawData] = useState("");
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [designTheme, setDesignTheme] = useState<"elegant" | "scrapbook">("elegant");
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<"gemini" | "openrouter">("gemini");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

  const generateItinerary = async () => {
    if (!rawData.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData, provider, apiKey, model })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setItinerary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F7F5F2] text-[#1A1A1A] font-sans print:block print:h-auto overflow-hidden">
      <header className="h-16 border-b border-[#1A1A1A]/10 px-8 flex items-center justify-between bg-white shrink-0 print:hidden hidden md:flex z-20 relative">
        <div className="flex items-center gap-4">
          <span className="font-black text-xl tracking-tighter">KARVIR TOURS</span>
          <span className="h-4 w-px bg-[#1A1A1A]/20"></span>
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50">Itinerary Design Engine v4.0</span>
        </div>
        <div className="flex gap-6">
          <button onClick={() => window.print()} className="text-[11px] uppercase tracking-widest font-bold border-b border-[#1A1A1A] hover:opacity-70 transition-opacity">Export PDF</button>
          <button onClick={() => setShowSettings(!showSettings)} className={`text-[11px] uppercase tracking-widest font-bold transition-opacity ${showSettings ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}>Settings</button>
        </div>
      </header>
      
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-[#1A1A1A]/10 overflow-hidden shrink-0 print:hidden z-10 relative"
          >
            <div className="px-8 py-6 max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-end">
               <div className="flex-1 w-full">
                 <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/50 mb-2 block">AI Provider</label>
                 <select 
                   value={provider} 
                   onChange={(e) => setProvider(e.target.value as "gemini" | "openrouter")}
                   className="w-full bg-[#F7F5F2] border border-[#1A1A1A]/10 text-xs p-2.5 rounded-sm focus:outline-none focus:border-[#1A1A1A]/20"
                  >
                   <option value="gemini">Google Gemini</option>
                   <option value="openrouter">OpenRouter</option>
                 </select>
               </div>
               <div className="flex-1 w-full">
                 <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/50 mb-2 block">API Key (optional if default preset)</label>
                 <input 
                   type="password" 
                   value={apiKey} 
                   onChange={(e) => setApiKey(e.target.value)}
                   className="w-full bg-[#F7F5F2] border border-[#1A1A1A]/10 text-xs p-2.5 rounded-sm focus:outline-none focus:border-[#1A1A1A]/20"
                   placeholder="sk-..."
                 />
               </div>
               <div className="flex-1 w-full">
                 <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/50 mb-2 block">Model Override (optional)</label>
                 <input 
                   type="text" 
                   value={model} 
                   onChange={(e) => setModel(e.target.value)}
                   className="w-full bg-[#F7F5F2] border border-[#1A1A1A]/10 text-xs p-2.5 rounded-sm focus:outline-none focus:border-[#1A1A1A]/20"
                   placeholder={provider === 'gemini' ? 'gemini-2.5-flash' : 'google/gemma-4-26b-a4b-it:free'}
                 />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex overflow-hidden print:h-auto print:overflow-visible flex-col md:flex-row">
        <aside className="w-full md:w-[320px] border-r border-[#1A1A1A]/10 bg-white p-6 flex flex-col gap-6 shrink-0 md:h-full md:overflow-y-auto print:hidden">
          {/* Mobile Header */}
          <div className="flex items-center gap-3 mb-2 md:hidden">
            <span className="font-black text-xl tracking-tighter">KARVIR TOURS</span>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <section>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/40 mb-3 block">
                Raw Data Input
              </label>
              <textarea
                className="w-full h-48 md:h-64 p-3 bg-[#F7F5F2] border border-[#1A1A1A]/5 rounded-sm focus:outline-none focus:border-[#1A1A1A]/20 resize-none text-xs font-mono leading-relaxed placeholder:opacity-60 placeholder:italic"
                placeholder="Paste raw text here... e.g., '3 days in bali for family. day 1 beach day 2 temple day 3 mountains. price $500.'"
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
              />
            </section>

            <section>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#1A1A1A]/40 mb-3 block">
                Design Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDesignTheme("elegant")}
                  className={`text-[10px] py-2 px-3 border transition-colors ${
                    designTheme === "elegant"
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                      : "border-[#1A1A1A]/10 text-[#1A1A1A]/60 hover:bg-[#F7F5F2]"
                  }`}
                >
                  <div className="flex gap-2 items-center justify-center uppercase font-bold tracking-widest"><Sun size={12} /> Editorial</div>
                </button>
                <button
                  onClick={() => setDesignTheme("scrapbook")}
                  className={`text-[10px] py-2 px-3 border transition-colors ${
                    designTheme === "scrapbook"
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                      : "border-[#1A1A1A]/10 text-[#1A1A1A]/60 hover:bg-[#F7F5F2]"
                  }`}
                >
                  <div className="flex gap-2 items-center justify-center uppercase font-bold tracking-widest"><Map size={12} /> Scrapbook</div>
                </button>
              </div>
            </section>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 text-xs mt-2 rounded-sm">
                {error}
              </div>
            )}

            <button
              disabled={loading || !rawData.trim()}
              onClick={generateItinerary}
              className="mt-auto w-full bg-[#1A1A1A] text-white py-4 text-xs uppercase tracking-widest font-bold disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <RefreshCcw className="animate-spin" size={14} /> : null}
              {loading ? "GENERATING..." : "GENERATE ITINERARY"}
            </button>
          </div>
        </aside>

        {/* MAIN VIEW AREA */}
        <section className="flex-1 bg-[#F7F5F2] p-4 md:p-10 overflow-y-auto flex flex-col items-center print:bg-white print:p-0 print:h-auto print:overflow-visible print:block">
          <AnimatePresence mode="wait">
            {!itinerary && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[#1A1A1A]/40 flex flex-col items-center justify-center h-full gap-4 max-w-sm text-center font-serif italic"
              >
                <Plane size={48} className="text-[#1A1A1A]/20" strokeWidth={1} />
                <p className="text-sm">Paste trip data on the left to dynamically generate an editorial itinerary.</p>
              </motion.div>
            )}

            {loading && (
               <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="text-[#1A1A1A]/60 flex flex-col items-center justify-center h-full gap-4"
             >
               <RefreshCcw size={48} className="animate-spin" strokeWidth={1} />
               <p className="animate-pulse text-sm font-bold tracking-widest uppercase">Drafting layout...</p>
             </motion.div>
            )}

            {itinerary && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-6xl mx-auto flex flex-col pb-16 print:pb-0"
              >
                <div className="w-full flex justify-end mb-4 print:hidden shrink-0">
                   <button 
                      onClick={() => window.print()}
                      className="text-[11px] uppercase tracking-widest font-bold border-b border-[#1A1A1A] pb-1 hover:opacity-70 transition-opacity"
                   >
                      Export PDF
                   </button>
                </div>
                {designTheme === "elegant" ? (
                  <ElegantTemplate data={itinerary} />
                ) : (
                  <ScrapbookTemplate data={itinerary} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function ElegantTemplate({ data }: { data: ItineraryData }) {
  return (
    <div className="flex flex-col gap-8 items-center bg-[#F7F5F2] w-full py-8 font-sans">
      {/* PAGE 1: Cover & Overview */}
      <div className="w-[210mm] h-[297mm] shrink-0 bg-white shadow-xl relative overflow-hidden print:shadow-none print:border-none print:m-0 break-after-page flex flex-col">
          {/* Header Image */}
          {data.days.length > 0 && (
            <div className="h-[90mm] w-full relative">
               <img src={`/api/unsplash?query=${encodeURIComponent(data.days[0].imageQuery)}`} className="w-full h-full object-cover grayscale" />
            </div>
          )}
          <div className="p-12 flex flex-col flex-1">
             <h1 className="text-4xl md:text-5xl font-serif italic mb-6 leading-tight text-slate-900">{data.title}</h1>
             <div className="flex gap-4 text-xs md:text-sm uppercase tracking-widest font-bold text-slate-500 mb-8 pb-8 border-b border-slate-200">
               <span>{data.duration}</span> • <span>{data.category}</span> • <span>{data.price}</span>
             </div>

             <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mb-4">Overview</h2>
             <p className="text-sm md:text-base font-serif italic text-slate-700 leading-relaxed mb-auto">
               {data.overview}
             </p>

             <footer className="pt-6 border-t border-slate-200 flex justify-between items-center shrink-0 mt-8">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Karvir Tours</div>
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page 1</div>
             </footer>
          </div>
      </div>

      {/* Pages for Days (1 Day per Page) */}
      {(data.days || []).map((day, pageIndex) => (
         <div key={pageIndex} className="w-[210mm] h-[297mm] shrink-0 bg-white shadow-xl relative overflow-hidden print:shadow-none print:border-none print:m-0 break-after-page flex flex-col p-12">
            <h2 className="text-xs md:text-sm uppercase tracking-[0.2em] font-bold text-slate-400 mb-8 border-b border-slate-200 pb-4">
              Day {(pageIndex + 1).toString().padStart(2, '0')} • {day.dayTitle}
            </h2>
            <div className="flex-1 flex flex-col">
               <div className="h-[100mm] w-full mb-8 relative border border-slate-100">
                   <img src={`/api/unsplash?query=${encodeURIComponent(day.imageQuery)}`} className="w-full h-full object-cover grayscale mix-blend-multiply" />
               </div>
               
               <div className="flex-1 space-y-4 text-sm md:text-base font-sans leading-relaxed text-slate-800">
                  {(day.activities || []).map((act, j) => (
                    <p key={j}>
                      <span className="font-bold text-slate-900 mr-2 border-b-2 border-slate-900">{act.time}</span>
                      {act.description}
                    </p>
                  ))}
               </div>
               <div className="pt-6 mt-8 border-t border-slate-200 flex gap-8 text-[10px] md:text-xs uppercase tracking-widest text-slate-600 font-bold bg-slate-50 p-6">
                  {day.stay && <span>🛏 Stay: {day.stay}</span>}
                  {day.meals && <span>🍽 Meals: {day.meals}</span>}
               </div>
            </div>
            <footer className="pt-6 border-t border-slate-200 flex justify-between items-center shrink-0 mt-6">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Karvir Tours</div>
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {pageIndex + 2}</div>
             </footer>
         </div>
      ))}

      {/* Final Page: Inclusions & Exclusions */}
      <div className="w-[210mm] h-[297mm] shrink-0 bg-white shadow-xl relative overflow-hidden print:shadow-none print:border-none print:m-0 break-after-page flex flex-col p-12">
          <h2 className="text-xs md:text-sm uppercase tracking-[0.2em] font-bold text-slate-400 mb-8 border-b border-slate-200 pb-4">
            Important Information
          </h2>
          <div className="flex-1 flex flex-col gap-10">
             <div className="flex gap-12">
               <div className="flex-1">
                 <h3 className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-emerald-700 mb-6 border-b border-emerald-100 pb-3">Included in price</h3>
                 <ul className="space-y-3 text-xs md:text-sm text-slate-700 font-sans list-none">
                    {(data.inclusions || []).map((inc, i) => (
                      <li key={i} className="flex gap-3"><span className="text-emerald-500 font-bold">✓</span> <span className="leading-relaxed border-b border-slate-100">{inc}</span></li>
                    ))}
                 </ul>
               </div>
               <div className="flex-1">
                 <h3 className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-rose-700 mb-6 border-b border-rose-100 pb-3">Not included</h3>
                 <ul className="space-y-3 text-xs md:text-sm text-slate-700 font-sans list-none">
                    {(data.exclusions || []).map((exc, i) => (
                      <li key={i} className="flex gap-3"><span className="text-rose-500 font-bold">✕</span> <span className="leading-relaxed border-b border-slate-100">{exc}</span></li>
                    ))}
                 </ul>
               </div>
             </div>
             
             {data.importantNotes && data.importantNotes.length > 0 && (
               <div className="mt-8 pt-8 border-t border-slate-100">
                 <h3 className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-slate-700 mb-6 pb-3">Notes & Policies</h3>
                 <div className="space-y-3 text-xs md:text-sm text-slate-600 font-mono leading-relaxed bg-slate-50 p-6 border border-slate-100">
                    <p>{data.importantNotes.join(" ")}</p>
                 </div>
               </div>
             )}
          </div>
          <footer className="pt-6 border-t border-slate-200 flex justify-between items-center shrink-0 mt-auto">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Karvir Tours</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {data.days.length + 2}</div>
           </footer>
      </div>
    </div>
  );
}

function ScrapbookTemplate({ data }: { data: ItineraryData }) {
  const tapePositions = [
    "top-[-10px] left-[50%] -translate-x-1/2 rotate-[-2deg]",
    "top-[10px] left-[-20px] rotate-[-45deg]",
    "top-[10px] right-[-20px] rotate-[45deg]"
  ];

  return (
    <div className="flex flex-col gap-8 items-center bg-[#F7F5F2] w-full py-8 font-handwriting">
      {/* Cover Page */}
      <div className="w-[210mm] h-[297mm] shrink-0 bg-[#faf9f6] shadow-xl relative overflow-hidden print:shadow-none print:border-none print:m-0 break-after-page flex flex-col items-center">
         <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply" 
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`}}>
         </div>
         <div className="p-12 h-full flex flex-col justify-center items-center w-full z-10 text-center">
           <h3 className="font-montserrat font-bold tracking-[0.3em] uppercase text-slate-800 text-base md:text-xl border-b-2 border-slate-800 pb-2 mb-8 transform -rotate-2">
             Travel Plan
           </h3>
           <h1 className="text-[3rem] md:text-[4rem] leading-tight font-bold text-center mb-8 decoration-amber-300 decoration-4 underline underline-offset-8 transform rotate-1">
             {data.title}
           </h1>
           <div className="mb-12 flex flex-wrap justify-center gap-4 text-base md:text-xl text-slate-600 font-bold max-w-2xl bg-white/80 p-4 border border-dashed border-slate-300 shadow-sm transform -rotate-1">
             <span>{data.duration}</span> • <span>{data.category}</span> • <span>{data.price}</span>
           </div>
           
           {data.days.length > 0 && (
              <div className="bg-white p-4 pb-12 shadow-xl transform rotate-3 w-[70%] max-h-[100mm] mx-auto relative mt-8 shrink-0">
                 <div className={`absolute w-32 h-8 bg-amber-100/80 border border-amber-200 z-20 top-[-10px] left-[50%] -translate-x-1/2 rotate-[-2deg] shadow-sm backdrop-blur-sm`}></div>
                 <img 
                   src={`/api/unsplash?query=${encodeURIComponent(data.days[0].imageQuery)}`} 
                   className="w-full h-full object-cover border border-slate-100"
                 />
              </div>
           )}

           <p className="mt-12 text-xl md:text-2xl max-w-2xl leading-relaxed text-slate-800 font-medium">
             {data.overview}
           </p>
         </div>
      </div>

      {/* Pages for Days */}
      {(data.days || []).map((day, pageIndex) => {
         const isEven = pageIndex % 2 === 0;
         return (
           <div key={pageIndex} className="w-[210mm] h-[297mm] shrink-0 bg-[#faf9f6] shadow-xl relative overflow-hidden print:shadow-none print:border-none print:m-0 break-after-page flex flex-col justify-center p-12">
             <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply" 
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`}}>
             </div>

             <div className="z-10 w-full flex flex-col h-full gap-8">
                <div className="text-center mb-4">
                  <h2 className="text-4xl md:text-5xl text-slate-400 font-montserrat italic font-light transform -rotate-2">Day {pageIndex + 1}</h2>
                  <h3 className="font-montserrat font-bold text-2xl md:text-3xl uppercase tracking-widest text-slate-800 mt-2 transform rotate-1">
                    {day.dayTitle}
                  </h3>
                </div>

                <div className={`bg-white p-4 pb-12 shadow-xl transform ${isEven ? 'rotate-[-3deg]' : 'rotate-[4deg]'} w-[80%] mx-auto relative shrink-0`}>
                  <div className={`absolute w-32 h-8 bg-amber-100/80 border border-amber-200 z-20 ${tapePositions[pageIndex % 3]} shadow-sm backdrop-blur-sm`}></div>
                  <img 
                    src={`/api/unsplash?query=${encodeURIComponent(day.imageQuery)}`} 
                    alt={day.dayTitle} 
                    className="w-full h-[80mm] object-cover border border-slate-100"
                  />
                  <div className="absolute bottom-4 left-0 w-full text-center text-xl md:text-2xl font-bold text-slate-700">
                    Day {pageIndex + 1} Snapshot
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-[85%] mx-auto w-full space-y-5">
                  {(day.activities || []).map((act, j) => (
                    <p key={j} className="text-[1.25rem] md:text-[1.5rem] leading-relaxed text-slate-800">
                      <strong className="font-montserrat text-sm md:text-base uppercase tracking-widest bg-amber-100 px-3 py-1 mr-3 inline-block -rotate-2 shadow-sm text-amber-900 border border-amber-200">
                        {act.time}
                      </strong>
                      {' '}{act.description}
                    </p>
                  ))}
                </div>

                <div className="flex justify-center flex-wrap gap-4 md:gap-6 mt-auto bg-slate-900 text-white p-4 font-montserrat text-base md:text-lg max-w-[90%] mx-auto w-full font-semibold rotate-1 shadow-xl">
                   <span>🍽 {day.meals || "Own leisure"}</span>
                   <span>🛏 {day.stay || "N/A"}</span>
                </div>
             </div>
           </div>
         );
      })}

      {/* Final Page */}
      <div className="w-[210mm] h-[297mm] shrink-0 bg-[#faf9f6] shadow-xl relative overflow-hidden print:shadow-none print:border-none print:m-0 break-after-page flex flex-col items-center justify-center p-16">
         <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply" 
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`}}>
         </div>

         <div className="w-full bg-white border-8 border-slate-900 shadow-[20px_20px_0px_0px_rgba(15,23,42,0.1)] p-12 relative z-10 transform -rotate-1 h-full flex flex-col">
            <h3 className="font-montserrat text-2xl md:text-4xl font-black uppercase mb-12 text-center border-b-4 border-slate-900 pb-6 text-slate-900">
              Important Details
            </h3>

            <div className="flex-1 flex flex-col gap-12">
               <div>
                  <h4 className="font-bold border-b-2 border-emerald-300 pb-3 mb-6 text-xl md:text-2xl text-emerald-800 uppercase tracking-widest font-montserrat flex items-center gap-3">
                     <span className="bg-emerald-100 p-2 rounded-full leading-none">✓</span> Included
                  </h4>
                  <ul className="list-none space-y-4 text-lg md:text-xl font-medium text-emerald-900">
                    {(data.inclusions || []).map((inc, i) => <li key={i}>{inc}</li>)}
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold border-b-2 border-rose-300 pb-3 mb-6 text-xl md:text-2xl text-rose-800 uppercase tracking-widest font-montserrat flex items-center gap-3">
                     <span className="bg-rose-100 p-2 rounded-full leading-none">✕</span> Not Included
                  </h4>
                  <ul className="list-none space-y-4 text-lg md:text-xl font-medium text-rose-900">
                    {(data.exclusions || []).map((exc, i) => <li key={i}>{exc}</li>)}
                  </ul>
               </div>
            </div>

            <p className="mt-auto text-center font-montserrat font-bold text-slate-400 tracking-widest text-lg md:text-xl">END OF ITINERARY</p>
         </div>
      </div>
    </div>
  );
}

