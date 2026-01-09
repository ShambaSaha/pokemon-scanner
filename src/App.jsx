/* eslint-disable react-hooks/purity */
import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [pokemon, setPokemon] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const imgRef = useRef();

  // Load the AI models from your public/models folder
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      setLoading(false);
    };
    loadModels();
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setPokemon(null);
    }
  };

  const findMatch = async () => {
    if (!imgRef.current) return;
    setIsScanning(true);

    // AI Step: Detect Face and Landmarks
    const detection = await faceapi.detectSingleFace(
      imgRef.current,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks();

    if (!detection) {
      alert("No face detected! Please try a clearer picture.");
      setIsScanning(false);
      return;
    }

    // Logic Step: Calculate "Face Ratio" (Width vs Height)
    const landmarks = detection.landmarks;
    const jawOutline = landmarks.getJawOutline();
    const faceWidth = Math.abs(jawOutline[0].x - jawOutline[16].x);
    const faceHeight = Math.abs(landmarks.getNose()[0].y - jawOutline[8].y) * 2;
    const ratio = faceWidth / faceHeight;

    // API Step: Match ratio to a Pokemon type/ID
    // If ratio > 1 (Round face), if ratio < 1 (Long face)
    let pokeId = ratio > 1 ? Math.floor(Math.random() * 50) + 1 : Math.floor(Math.random() * 50) + 100;
    
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
    const data = await response.json();
    
    setPokemon(data);
    setIsScanning(false);
  };

  if (loading) return <div className="loading-screen">Booting Pokedex Systems...</div>;

  return (
    <div className="pokedex-app">
      <div className="main-panel">
        <h1 className="led-text">POKÉ-SCANNER v1.0</h1>
        
        <div className="viewfinder">
          {image ? (
            <img ref={imgRef} src={image} alt="subject" className={isScanning ? "scanning" : ""} />
          ) : (
            <div className="empty-state">INSERT SUBJECT PHOTO</div>
          )}
        </div>

        <div className="controls">
          <input type="file" accept="image/*" onChange={handleUpload} id="upload" hidden />
          <label htmlFor="upload" className="btn blue-btn">UPLOAD SUBJECT</label>
          
          {image && (
            <button onClick={findMatch} className="btn green-btn" disabled={isScanning}>
              {isScanning ? "ANALYZING..." : "FIND MATCH"}
            </button>
          )}
        </div>
      </div>

      {pokemon && (
        <div className="result-panel">
          <div className="match-card">
            <h2>MATCH FOUND: {pokemon.name.toUpperCase()}</h2>
            <img src={pokemon.sprites.other['official-artwork'].front_default} alt="match" />
            <div className="stats">
              <p>TYPE: {pokemon.types.map(t => t.type.name).join(' / ')}</p>
              <p>FACE MATCH: {Math.floor(Math.random() * 15) + 80}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;