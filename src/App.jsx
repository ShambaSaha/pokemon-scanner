/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import toast, { Toaster } from "react-hot-toast";
import { toPng } from 'html-to-image';
import "./App.css";

const LOGO_URL = "/Xplorica Logo (1).png";

function App() {
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [pokemon, setPokemon] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [dnaPercent, setDnaPercent] = useState(0);

  const imgRef = useRef();
  const screenshotRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setLoading(false);
      } catch (err) {
        console.error("Models failed to load", err);
      }
    };
    loadModels();
  }, []);

const handleUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result); // This saves the actual image data, not a temporary link
      setPokemon(null);
      setDnaPercent(0);
    };
    reader.readAsDataURL(file);
  }
};

 const shareToStory = async () => {
  if (!screenshotRef.current) return;
  // const toastId = toast.loading("SYNCHRONIZING POKEDEX...");

  try {
    // Give the browser a millisecond to breathe
    await new Promise((resolve) => setTimeout(resolve, 100));

    const dataUrl = await toPng(screenshotRef.current, {
      cacheBust: true,
      pixelRatio: 2, // Keeps it sharp
      skipFonts: false, // Set to true if fonts still cause issues
    });

    const link = document.createElement('a');
    link.download = `pokedex-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    
    toast.success("DOWNLOADED!");
  } catch (error) {
    console.error("Screenshot Error:", error);
    toast.error("IMAGE SYNC ERROR");
  }
};

  const findMatch = async () => {
    if (!image) return toast.error("Upload a subject first!");
    setIsScanning(true);
    const detect = await faceapi.detectSingleFace(imgRef.current, new faceapi.TinyFaceDetectorOptions());
    if (!detect) {
      toast.error("No face detected!");
      setIsScanning(false);
      return;
    }
    const hash = Math.floor(detect.box.x + detect.box.y);
    const pokeId = (hash % 905) + 1;
    const percent = 92 + (hash % 7);
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
    const data = await res.json();
    setPokemon(data);
    setDnaPercent(percent);
    setIsScanning(false);
  };

  if (loading) return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] overflow-hidden">
    {/* Circular Spinner */}
    <div className="relative w-24 h-24 mb-8">
      {/* Background Ring */}
      <div className="absolute inset-0 border-8 border-gray-800 rounded-full"></div>
      {/* Glowing Progress Ring */}
      <div className="absolute inset-0 border-8 border-transparent border-t-[#FFDE00] rounded-full animate-spin shadow-[0_0_15px_#FFDE00]"></div>
    </div>

    {/* Glowing Text Section */}
    <div className="text-center">
      <h1 className="text-[#FFDE00] text-5xl md:text-6xl uppercase font-black tracking-tighter pokemon-font 
        drop-shadow-[0_0_10px_rgba(255,222,0,0.8)] animate-pulse">
        System Booting...
      </h1>
      
      <p className="mt-4 text-[#00E5FF] text-sm md:text-lg font-bold tracking-[0.3em] uppercase opacity-80">
        Initializing Research Database
      </p>
    </div>

    {/* Subtle Scanline Effect Overlay */}
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
  </div>
);

  return (
    <div ref={screenshotRef} className="pokedex-page-wrapper min-h-screen flex items-start justify-center md:justify-start p-4 pt-10 md:pt-16 md:pl-20">
      <Toaster />

      <div className="flex flex-col md:flex-row md:items-end z-10 filter drop-shadow-2xl">

        {/* PANEL 1: Scanner Panel (Becomes the ONLY container on Mobile) */}
        <div className="w-[320px] xs:w-80 md:w-85 bg-[#DC0A2D] border-[4px] border-black rounded-[30px] md:rounded-none md:rounded-l-[40px] p-6 flex flex-col relative z-20">
          
          {/* Header Lights */}
          <div className="flex gap-2 mb-4">
            <div className="w-14 h-14 bg-white rounded-full border-[3px] border-black flex items-center justify-center">
              <div className={`w-12 h-12 rounded-full border-[3px] border-black shadow-[inset_-4px_4px_10px_white] transition-colors duration-300 ${isScanning ? "bg-red-500 animate-pulse" : "bg-[#28AAFD]"}`}></div>
            </div>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-red-800 rounded-full border border-black shadow-md rounded-full"></div>
              <div className="w-4 h-4 bg-yellow-500 rounded-full border border-black shadow-md rounded-full"></div>
              <div className="w-4 h-4 bg-green-600 rounded-full border border-black shadow-md rounded-full"></div>
            </div>
          </div>

          {/* Scanner Unit Screen */}
          <div className="bg-[#DEDEDE] border-[3px] border-black p-4 rounded-bl-[40px] rounded-tr-[10px] flex flex-col h-72">
            <p className="text-xs text-center font-bold text-gray-600 mb-1">SCANNER</p>
            <div className="bg-[#232323] w-full h-full rounded-lg border-[3px] border-[#555] flex items-center justify-center overflow-hidden relative shadow-inner">
              {image ? (
                <img ref={imgRef} src={image} alt="Subject" className="w-full h-full object-contain" crossOrigin="anonymous"/>
              ) : (
                <label className="text-yellow-400 text-center cursor-pointer pokemon-font text-[10px] p-4 leading-relaxed">
                  CLICK TO UPLOAD SUBJECT...
                  <input type="file" hidden onChange={handleUpload} />
                </label>
              )}
            </div>
            {/* CLEAR BUFFER / RESET BUTTON */}
            <button className="mt-3 bg-[#ff5f5f] border-2 border-black text-white text-[10px] font-bold py-1 rounded-sm active:scale-95 transition-transform uppercase" onClick={() => {setImage(null); setPokemon(null); setDnaPercent(0);}}>
              Clear Buffer
            </button>
          </div>

          <button onClick={findMatch} className="mt-4 w-full bg-black text-white py-3 font-black rounded-lg border-2 border-black tracking-widest text-sm uppercase active:translate-y-1 transition-all">
            {isScanning ? "PROCESSING..." : "Analyze DNA"}
          </button>

          {/* MOBILE-ONLY RESULTS (IMAGE 1 STYLE) */}
          <div className="block md:hidden mt-6 bg-[#f8f5f5] p-4 rounded-xl border-[3px] border-black h-48 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
            <img src={LOGO_URL} crossOrigin="anonymous" alt="Xplorica" className="absolute top-2 right-2 w-7" />
            {pokemon ? (
              <div className="animate-in fade-in zoom-in duration-300 w-full">
                <img src={pokemon.sprites.other["official-artwork"].front_default} className="w-16 h-16 mx-auto mb-1" alt="res" crossOrigin="anonymous"/>
                <p className="text-xs font-black text-green-700">{pokemon.name.toUpperCase()}</p>
                <div className="flex gap-1 justify-center my-1">
                   {pokemon.types.map(t => (
                     <span key={t.type.name} className="text-[8px] border border-green-700 px-1 rounded-sm font-bold bg-white">{t.type.name.toUpperCase()}</span>
                   ))}
                </div>
                <p className="text-[9px] font-bold">DNA MATCH: {dnaPercent}%</p>
                <div className="w-full h-2 bg-gray-200 border border-black/10 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${dnaPercent}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-4xl text-yellow-400 font-black drop-shadow-sm">?</span>
                <p className="text-[10px] font-bold text-yellow-600 mt-1 uppercase pokemon-font">Who's that Pokemon?</p>
              </div>
            )}
          </div>
          
          {/* MOBILE DECORATION & DOWNLOAD */}
          <div className="block md:hidden">
            <div className="grid grid-cols-5 gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3 bg-[#28AAFD] border border-black rounded-sm shadow-inner"></div>
              ))}
            </div>
            <button onClick={shareToStory} className="mt-3 w-full h-11 bg-[#ffcb05] text-[#3b4cca] font-black border-2 border-black rounded-lg uppercase text-[10px] shadow-lg">
              Download Story
            </button>
          </div>
        </div>

        {/* DESKTOP ONLY: HINGE & SECOND PANEL (IMAGE 2 STYLE) */}
        <div className="hidden md:flex items-end">
          <div className="w-10 h-[480px] bg-[#8B0000] border-y-[4px] border-black flex flex-col justify-around py-10 shadow-[inset_0_0_15px_black]">
            {[...Array(3)].map((_, i) => <div key={i} className="h-[2px] bg-black/20 w-full"></div>)}
          </div>

          <div 
            className="w-85 h-[440px] bg-[#DC0A2D] border-[4px] border-l-0 border-black rounded-r-[40px] p-6 flex flex-col relative"
            style={{ clipPath: "polygon(0 22%, 40% 22%, 100% 0, 100% 100%, 0 100%)" }}
          >
            <div className="mt-20 bg-[#f8f5f5] p-4 rounded-lg border-[3px] border-black h-44 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
               <img src={LOGO_URL} alt="Xplorica" className="absolute top-2 right-2 w-8" crossOrigin="anonymous"/>
               {pokemon ? (
                <div className="w-full">
                  <img src={pokemon.sprites.other["official-artwork"].front_default} className="w-20 h-20 mx-auto" alt="res" crossOrigin="anonymous"/>
                  <p className="font-black text-green-700">{pokemon.name.toUpperCase()}</p>
                  <div className="flex gap-1 justify-center my-1">
                   {pokemon.types.map(t => (
                     <span key={t.type.name} className="text-[8px] border border-green-700 px-1 rounded-sm font-bold bg-white">{t.type.name.toUpperCase()}</span>
                   ))}
                </div>
                  <p className="text-xs font-bold text-gray-500 mt-1">DNA MATCH: {dnaPercent}%</p>
                  <div className="w-full h-2 bg-gray-200 border border-black/10 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${dnaPercent}%` }}></div>
                </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                <span className="text-4xl text-yellow-400 font-black drop-shadow-sm">?</span>
                <p className="text-[10px] font-bold text-yellow-600 mt-1 uppercase pokemon-font">Who's that Pokemon?</p>
              </div>
              )}
            </div>
            
            <div className="grid grid-cols-5 gap-0 mt-4 border-[2px] border-black overflow-hidden rounded-lg shrink-0">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-[#28AAFD] border border-black shadow-inner"></div>
            ))}
          </div>

            <button onClick={shareToStory} className="mt-auto h-12 bg-[#ffcb05] text-[#3b4cca] font-black border-2 border-black rounded-lg uppercase shadow-lg active:scale-95 transition-all">
              Download Full Story
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
