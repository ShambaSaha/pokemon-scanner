/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [pokemon, setPokemon] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const imgRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setLoading(false);
      } catch (err) { console.error("Model Load Error", err); }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    setCameraActive(true);
    setImage(null);
    setPokemon(null);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setImage(dataUrl);
    setCameraActive(false);
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setPokemon(null);
      setCameraActive(false);
    }
  };

  const findMatch = async () => {
    if (!imgRef.current || pokemon) return;
    setIsScanning(true);

    const detection = await faceapi.detectSingleFace(
      imgRef.current,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks();

    if (!detection) {
      alert("Face not detected. Please try a clearer picture.");
      setIsScanning(false);
      return;
    }

    // Logic: Lock 1 Face to 1 Pokemon using a signature
    const landmarks = detection.landmarks;
    const jaw = landmarks.getJawOutline();
    const faceWidth = Math.abs(jaw[0].x - jaw[16].x);
    const nose = landmarks.getNose();
    const faceHeight = Math.abs(nose[0].y - jaw[8].y) * 2;
    
    // Creating a unique ID from facial geometry
    const faceSignature = Math.floor((faceWidth / faceHeight) * 1000);
    const pokeId = (faceSignature % 151) + 1;

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
    const data = await response.json();
    setPokemon(data);
    setIsScanning(false);
  };

  if (loading) return <div className="lab-loading">BOOTING LAB SYSTEMS...</div>;

  return (
    <div className="page-center-container">
      <div className="lab-window">
        <header className="window-header">
          <div className="window-dots">
            <span className="dot blue"></span><span className="dot red"></span>
            <span className="dot yellow"></span><span className="dot green"></span>
          </div>
          <h1>POKÉMON RESEARCH LAB</h1>
        </header>

        <div className="lab-grid">
          {/* Scanner Section */}
          <section className="lab-panel">
            <div className="panel-label">scanner section</div>
            <div className="view-area">
              <div className="inner-view">
                {cameraActive ? (
                  <video ref={videoRef} autoPlay muted />
                ) : image ? (
                  <img ref={imgRef} src={image} className={isScanning ? "scanning-fx" : ""} alt="subject" />
                ) : (
                  <div className="placeholder-text">AWAITING DNA SAMPLE...</div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            </div>

            <div className="controls-grid">
              <input type="file" onChange={handleUpload} id="file-up" hidden />
              <label htmlFor="file-up" className="lab-btn gray">UPLOAD SUBJECT</label>
              
              {!cameraActive ? (
                <button className="lab-btn gray" onClick={startCamera}>USE CAMERA</button>
              ) : (
                <button className="lab-btn blue" onClick={capturePhoto}>CAPTURE PHOTO</button>
              )}
              
              {image && !pokemon && (
                <button onClick={findMatch} disabled={isScanning} className="lab-btn green full-width">
                  {isScanning ? "ANALYZING..." : "RUN DNA MATCH"}
                </button>
              )}
            </div>
          </section>

          {/* Result Section */}
          <section className={`lab-panel result-side ${pokemon ? 'active' : ''}`}>
            <div className="panel-label">result section</div>
            {pokemon ? (
              <div className="poke-result-card">
                <div className="card-top">
                  <span className="poke-id"># {String(pokemon.id).padStart(3, '0')}</span>
                  <span className="poke-brand">POKÉMON</span>
                </div>
                <img src={pokemon.sprites.other['official-artwork'].front_default} alt="match" />
                <h2 className="poke-name">{pokemon.name.toUpperCase()}</h2>
                <div className="type-tags">
                  {pokemon.types.map(t => <span key={t.type.name} className={`tag ${t.type.name}`}>{t.type.name}</span>)}
                </div>
                <div className="dna-meter-section">
                  <p>DNA SIMILARITY</p>
                  <div className="meter-bg"><div className="meter-fill"></div></div>
                </div>
              </div>
            ) : (
              <div className="card-empty">INITIALIZE SCAN TO VIEW DATA</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;