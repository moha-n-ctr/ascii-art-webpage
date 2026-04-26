"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CHAR_SETS = {
  simple: " .:-=+*#%@",
  complex: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  binary: " 01",
  blocks: "  ░▒▓█"
};

export default function Home() {
  const videoRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const requestRef = useRef(null);
  
  // Settings State
  const [fontSize, setFontSize] = useState(12);
  const [gain, setGain] = useState(1.0);
  const [intensity, setIntensity] = useState(1.0);
  const [contrast, setContrast] = useState(0);
  const [colorMode, setColorMode] = useState("matrix");
  const [charSetKey, setCharSetKey] = useState("simple");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setCameraError("");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Unable to access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const applyContrast = (value, contrast) => {
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    return factor * (value - 128) + 128;
  };

  const clamp = (val) => Math.max(0, Math.min(255, val));

  const processFrame = useCallback(() => {
    if (!videoRef.current || !offscreenCanvasRef.current || !outputCanvasRef.current) return;
    
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const oCanvas = offscreenCanvasRef.current;
    const oCtx = oCanvas.getContext("2d", { willReadFrequently: true });
    
    const outCanvas = outputCanvasRef.current;
    const outCtx = outCanvas.getContext("2d");

    // Dynamic resizing based on window and fontSize
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    
    if (outCanvas.width !== ww || outCanvas.height !== wh) {
      outCanvas.width = ww;
      outCanvas.height = wh;
    }

    // Determine grid size
    const cellWidth = fontSize * 0.6; // average monospace aspect ratio
    const cellHeight = fontSize;
    
    // Scale down video to fit grid exactly
    // Calculate aspect ratio
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    const vRatio = vW / vH;
    const screenRatio = ww / wh;

    let drawW, drawH;
    if (screenRatio > vRatio) {
      drawW = ww;
      drawH = ww / vRatio;
    } else {
      drawW = wh * vRatio;
      drawH = wh;
    }
    
    const cols = Math.floor(ww / cellWidth);
    const rows = Math.floor(wh / cellHeight);

    if (oCanvas.width !== cols || oCanvas.height !== rows) {
      oCanvas.width = cols;
      oCanvas.height = rows;
    }

    // We draw the video onto the small offscreen canvas to pixelate it
    // Center crop
    const sx = (vW - (vW * (ww / drawW))) / 2;
    const sy = (vH - (vH * (wh / drawH))) / 2;
    const sw = vW * (ww / drawW);
    const sh = vH * (wh / drawH);

    oCtx.drawImage(video, sx, sy, sw, sh, 0, 0, cols, rows);
    
    const imageData = oCtx.getImageData(0, 0, cols, rows);
    const data = imageData.data;

    // Clear output canvas
    outCtx.fillStyle = "#000000";
    outCtx.fillRect(0, 0, ww, wh);
    outCtx.font = `bold ${fontSize}px monospace`;
    outCtx.textAlign = "center";
    outCtx.textBaseline = "middle";

    const chars = CHAR_SETS[charSetKey];
    const charLen = chars.length;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const offset = (y * cols + x) * 4;
        let r = data[offset];
        let g = data[offset + 1];
        let b = data[offset + 2];

        // Apply Gain (with some random noise component based on gain)
        // If gain is 1, it's normal. If > 1, add noise and multiply
        if (gain !== 1) {
          const noise = (Math.random() - 0.5) * 50 * (gain - 1);
          r = clamp(r * gain + noise);
          g = clamp(g * gain + noise);
          b = clamp(b * gain + noise);
        }

        // Apply contrast
        if (contrast !== 0) {
          r = clamp(applyContrast(r, contrast));
          g = clamp(applyContrast(g, contrast));
          b = clamp(applyContrast(b, contrast));
        }

        // Brightness / Luminance
        // Magic numbers for perceptual luminance
        let brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Apply Intensity (power curve)
        brightness = 255 * Math.pow(brightness / 255, intensity);

        // Map to Character
        const charIdx = Math.floor((brightness / 255) * (charLen - 1));
        const char = chars[charIdx];

        // Don't draw spaces to save computation
        if (char === " ") continue;

        const px = x * cellWidth + cellWidth / 2;
        const py = y * cellHeight + cellHeight / 2;

        // Colors
        if (colorMode === "matrix") {
          // Greens based on brightness
          const brightnessFactor = brightness / 255;
          const rCol = Math.floor(0);
          const gCol = Math.floor(100 + brightnessFactor * 155);
          const bCol = Math.floor(0);
          outCtx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
        } else if (colorMode === "color") {
          outCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        } else {
          // Grayscale
          outCtx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        }

        outCtx.fillText(char, px, py);
      }
    }

    requestRef.current = requestAnimationFrame(processFrame);
  }, [fontSize, gain, intensity, contrast, colorMode, charSetKey]);

  useEffect(() => {
    if (cameraActive) {
      requestRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cameraActive, processFrame]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#000" }}>
      {/* Hidden processing elements */}
      <video ref={videoRef} style={{ display: "none" }} playsInline muted />
      <canvas ref={offscreenCanvasRef} style={{ display: "none" }} />
      
      {/* Visual output */}
      <canvas 
        ref={outputCanvasRef} 
        style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%",
          zIndex: 1
        }} 
      />

      {/* Floating UI */}
      <div 
        className="glass-panel" 
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          width: "320px",
          padding: "24px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        <h1 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "8px", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
          ASCII Camera Vision
        </h1>
        
        {cameraError && <div style={{ color: "#ff4444", fontSize: "0.9rem" }}>{cameraError}</div>}

        {!cameraActive ? (
          <button 
            onClick={startCamera}
            style={{
              background: "var(--accent)",
              color: "#000",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.target.style.transform = "scale(1.02)"}
            onMouseOut={(e) => e.target.style.transform = "scale(1)"}
          >
            Start Camera
          </button>
        ) : (
          <button 
            onClick={stopCamera}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Stop Camera
          </button>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
          
          <div>
            <label>Font Size <span>{fontSize}px</span></label>
            <input 
              type="range" min="6" max="32" step="1" 
              value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} 
            />
          </div>

          <div>
            <label>Gain (Noise) <span>{gain.toFixed(1)}x</span></label>
            <input 
              type="range" min="0.5" max="5.0" step="0.1" 
              value={gain} onChange={(e) => setGain(Number(e.target.value))} 
            />
          </div>

          <div>
            <label>Intensity <span>{intensity.toFixed(2)}x</span></label>
            <input 
              type="range" min="0.1" max="3.0" step="0.05" 
              value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} 
            />
          </div>

          <div>
            <label>Contrast <span>{contrast}</span></label>
            <input 
              type="range" min="-100" max="100" step="1" 
              value={contrast} onChange={(e) => setContrast(Number(e.target.value))} 
            />
          </div>

          <div>
            <label>Color Mode</label>
            <select value={colorMode} onChange={(e) => setColorMode(e.target.value)}>
              <option value="matrix">Matrix Green</option>
              <option value="color">Original Colors</option>
              <option value="grayscale">Grayscale</option>
            </select>
          </div>

          <div>
            <label>Character Set</label>
            <select value={charSetKey} onChange={(e) => setCharSetKey(e.target.value)}>
              <option value="simple">Simple Gradient</option>
              <option value="complex">Complex Detailed</option>
              <option value="binary">Binary (01)</option>
              <option value="blocks">ASCII Blocks</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  );
}
