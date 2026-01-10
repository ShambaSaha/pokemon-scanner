import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [pokemon, setPokemon] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [dnaPercent, setDnaPercent] = useState(0);

  const imgRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        ]);
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
      setImage(URL.createObjectURL(file));
      setPokemon(null);
      setDnaPercent(0);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPokemon(null);
    setDnaPercent(0);
  };

  const findMatch = async () => {
    if (!imgRef.current) return;
    setIsScanning(true);
    const detection = await faceapi.detectSingleFace(imgRef.current, new faceapi.TinyFaceDetectorOptions());
    
    if (!detection) {
      alert("DNA Signature not found.");
      setIsScanning(false);
      return;
    }

    const hash = Math.floor(detection.box.x + detection.box.y);
    const pokeId = (hash % 151) + 1;
    const percent = 92 + (hash % 7); 
    
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
    const data = await res.json();
    
    setPokemon(data);
    setDnaPercent(percent);
    setIsScanning(false);
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h1 className="loading-text-poke">SYSTEM BOOTING...</h1>
          <p className="loading-subtext">INITIALIZING RESEARCH DATABASE</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      <div className="lab-window">
        <header className="lab-header">
          <div className="status-dots">
            <span className="dot blue"></span><span className="dot red"></span>
            <span className="dot yellow"></span><span className="dot green"></span>
          </div>
          <h1 className="header-text">POKÉMON RESEARCH LAB</h1>
        </header>

        <div className="lab-grid">
          {/* SCANNER */}
          <div className="panel">
            <h3 className="panel-tag">Scanner Section</h3>
            <div className="viewport">
              {image ? (
                <img ref={imgRef} src={image} alt="subject" />
              ) : (
                <div className="status-message-poke glow-anim">Awaiting DNA Sample...</div>
              )}
            </div>
            <div className="btn-group">
              {!image ? (
                <label className="poke-btn yellow-btn">
                  UPLOAD IMAGE <input type="file" onChange={handleUpload} hidden />
                </label>
              ) : (
                <div className="action-btns">
                  <button onClick={removeImage} className="poke-btn red-btn">REMOVE IMAGE</button>
                  {!pokemon && (
                    <button onClick={findMatch} className="poke-btn green-btn">
                      {isScanning ? "SCANNING..." : "RUN FACE MATCH"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RESULT */}
          <div className="panel">
            <h3 className="panel-tag">Result Section</h3>
            {pokemon ? (
              <div className="result-card">
                <div className="card-top">
                  <span># {String(pokemon.id).padStart(3, '0')} POKÉMON</span>
                </div>
                <img src={pokemon.sprites.other['official-artwork'].front_default} alt="match" className="poke-img" />
                <h2 className="card-name">{pokemon.name.toUpperCase()}</h2>
                <div className="type-pill">{pokemon.types[0].type.name.toUpperCase()}</div>
                
                <div className="dna-metrics">
                  <div className="dna-label">
                    <span>FACE SIMILARITY</span>
                    <span className="percent-text">{dnaPercent}%</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${dnaPercent}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-msg-box">
                 <p className="status-message-poke glow-anim">INITIALIZE SCAN TO VIEW DATA...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;