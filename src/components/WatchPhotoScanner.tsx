import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, Link, Sparkles, Loader2, RefreshCw, Check, AlertCircle, Image as ImageIcon, Eye, X, Sliders, Shield, Zap } from "lucide-react";
import { horologyAudio } from "../utils/audio";
import { Watch, HorologySource } from "../types";

interface WatchPhotoScannerProps {
  onWatchScanned: (watch: Watch) => void;
  selectedCollectionId: string;
  sourceLens: string;
}

const NONSTANDARD_SAMPLE_PRESETS = [
  {
    name: "Richard Mille RM 11-03",
    clue: "Richard Mille RM 11-03 Flyback Chronograph, curved tonneau case, spline screws on bezel, tactical pushers with crown guard, skeletonized dial",
    badge: "RM Tonneau + Tactical Pushers",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Heuer Monaco Calibre 11",
    clue: "TAG Heuer Monaco Chronograph Calibre 11 Steve McQueen, square case, large vintage pump pushers, left-hand crown at 9 o'clock, blue dial with white subdials",
    badge: "Square Case + Big Pushers",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Omega Seamaster Bullhead",
    clue: "Omega Seamaster Bullhead Chronograph, asymmetrical bullhead case with dual top pushers at 11 and 1 o'clock, winding crown at 12 o'clock, 6 o'clock internal bezel crown",
    badge: "Bullhead + Top Horn Pushers",
    image: "https://images.unsplash.com/photo-1547996160-71dfa63582d0?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Audemars Piguet Royal Oak Offshore",
    clue: "Audemars Piguet Royal Oak Offshore Chronograph, octagonal bezel with 8 visible hexagonal screws, rectangular paddle pushers with ceramic guards, Mega Tapisserie dial",
    badge: "AP Octagonal + Hex Screws",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
  },
];

export const WatchPhotoScanner: React.FC<WatchPhotoScannerProps> = ({
  onWatchScanned,
  selectedCollectionId,
  sourceLens,
}) => {
  const [inputMode, setInputMode] = useState<"camera" | "upload" | "url">("upload");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  const [selectedShapeClue, setSelectedShapeClue] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup camera stream on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera
  const startCamera = async () => {
    stopCamera();
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      horologyAudio.playCrownClick();
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(
        "Could not access camera. Please allow camera permissions in your browser or use file upload."
      );
      setIsCameraActive(false);
    }
  };

  // Capture frame from video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageSrc(dataUrl);
    stopCamera();
    horologyAudio.playCaseLid();
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WEBP, etc.)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageSrc(result);
      setErrorMessage("");
      horologyAudio.playCrownClick();
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageSrc(result);
        setErrorMessage("");
        horologyAudio.playCrownClick();
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Image URL load
  const handleLoadUrl = async () => {
    if (!imageUrlInput.trim()) return;
    try {
      setIsScanning(true);
      // Validate image by creating an Image object
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            setImageSrc(dataUrl);
          } catch {
            // If CORS blocks canvas export, use URL directly
            setImageSrc(imageUrlInput);
          }
        } else {
          setImageSrc(imageUrlInput);
        }
        setIsScanning(false);
        setErrorMessage("");
        horologyAudio.playCrownClick();
      };
      img.onerror = () => {
        // Fallback: still set imageSrc for preview & let server handle it if possible
        setImageSrc(imageUrlInput);
        setIsScanning(false);
      };
      img.src = imageUrlInput;
    } catch {
      setImageSrc(imageUrlInput);
      setIsScanning(false);
    }
  };

  // Analyze Photo with Gemini Vision
  const handleAnalyzePhoto = async () => {
    if (!imageSrc) return;
    setIsScanning(true);
    setErrorMessage("");
    horologyAudio.playWindingRatchet();

    try {
      const combinedNotes = [userNotes.trim(), selectedShapeClue.trim()].filter(Boolean).join(" | ");
      const res = await fetch("/api/watches/scan-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageSrc,
          userNotes: combinedNotes,
          sourceLens: sourceLens !== "all" ? sourceLens : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Vision analysis service returned non-OK status");
      }

      const data = await res.json();

      const newWatch: Watch = {
        id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        collectionId: selectedCollectionId,
        name: data.name || "Identified Timepiece",
        brand: data.brand || "Fine Watchmaker",
        reference: data.reference || "Custom Ref",
        yearIntroduced: data.yearIntroduced || "Contemporary",
        category: data.category || "Everyday",
        provenanceSource: data.provenanceSource || "the_watch_revised",
        sourceBadgeLabel: data.sourceBadgeLabel || "📸 Visual AI Scanner & Digitizer",
        msrp: data.msrp,
        marketPrice: data.marketPrice,
        caseDiameter: data.caseDiameter || 40,
        caseThickness: data.caseThickness || 12,
        lugToLug: data.lugToLug || 47,
        lugWidth: data.lugWidth || 20,
        waterResistance: data.waterResistance || "100m",
        movement: data.movement || {
          type: "Automatic",
          caliber: "In-House Calibre",
          powerReserve: "48 Hours",
          frequencyVph: 28800,
          jewels: 28,
          features: ["Anti-magnetic balance", "Shock protection"],
        },
        renderingConfig: data.renderingConfig || {
          caseShape: "round",
          caseFinish: "steel",
          caseBezelType: "smooth",
          dialColor: "#0f172a",
          dialPattern: "matte",
          markerType: "applied_batons",
          markerColor: "#ffffff",
          handsType: "baton",
          handsColor: "#ffffff",
          secondsHandColor: "#ef4444",
          lumeColor: "green",
          strapType: "oyster_bracelet",
          strapColor: "#94a3b8",
        },
        facts: data.facts || {
          tagline: "Scanned & Authenticated Masterpiece",
          storyBlurb: "Identified via Gemini Optical Recognition and mapped into the Vitrine Engine.",
          keyHighlights: ["Optical recognition calibrated", "Heritage reference geometry"],
          historicalSignificance: "An emblem of fine watchmaking heritage digitized with exact specifications.",
          movementEngineering: "Crafted with high-amplitude balance and precision escapement tolerances.",
          collectorLore: "Acquired and digitized into the virtual showcase with photographic provenance.",
          funFacts: ["Every visual parameter was extracted via multimodal AI inspection."],
        },
        collectorNotes: userNotes ? `${userNotes}\n[Digitized from Photo]` : "[Digitized from Photo]",
        scannedPhotoUrl: data.scannedPhotoUrl || imageSrc,
        visionAnalysisNotes: data.visionAnalysisNotes || "Visual inspection and horological synthesis complete.",
        dateAdded: new Date().toISOString(),
        userFavorite: false,
      };

      horologyAudio.playCrownClick();
      onWatchScanned(newWatch);
    } catch (err: any) {
      console.error("Error analyzing watch photo:", err);
      setErrorMessage(
        "Optical analysis temporarily encountered an issue. You can try a clearer photo or enter notes below to help the AI identify it."
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4" id="photo-scanner-container">
      {/* Visual Header & Intro */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-900/60 to-amber-900/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1">
              <Camera size={11} />
              <span>Gemini 3.7 Vision Engine</span>
            </span>
            <span className="text-[11px] text-amber-200/70">Photo-to-SVG Digitizer</span>
          </div>
          <p className="text-xs text-neutral-300">
            Upload any watch photo, wrist shot, or capture with your camera. AI will analyze the watch, identify its exact model, and generate an interactive ticking rendering.
          </p>
        </div>

        {/* Input Mode Pills */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800 shrink-0">
          <button
            type="button"
            id="photo-mode-upload-btn"
            onClick={() => {
              setInputMode("upload");
              stopCamera();
              horologyAudio.playCrownClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inputMode === "upload"
                ? "bg-amber-500 text-neutral-950 font-bold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Upload size={13} />
            <span>Upload</span>
          </button>

          <button
            type="button"
            id="photo-mode-camera-btn"
            onClick={() => {
              setInputMode("camera");
              startCamera();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inputMode === "camera"
                ? "bg-amber-500 text-neutral-950 font-bold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Camera size={13} />
            <span>Camera</span>
          </button>

          <button
            type="button"
            id="photo-mode-url-btn"
            onClick={() => {
              setInputMode("url");
              stopCamera();
              horologyAudio.playCrownClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inputMode === "url"
                ? "bg-amber-500 text-neutral-950 font-bold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Link size={13} />
            <span>Web URL</span>
          </button>
        </div>
      </div>

      {/* Nonstandard Geometry Presets & Quick Test Cards */}
      <div className="p-3 bg-neutral-950/60 rounded-2xl border border-neutral-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-400 font-mono flex items-center gap-1.5 uppercase tracking-wider">
            <Zap size={13} className="text-amber-400" />
            <span>Nonstandard Shape & Pusher Test Presets</span>
          </span>
          <span className="text-[10px] text-neutral-400">1-click calibrate & load</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {NONSTANDARD_SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              id={`preset-btn-${idx}`}
              onClick={() => {
                setImageSrc(preset.image);
                setSelectedShapeClue(preset.clue);
                horologyAudio.playCrownClick();
              }}
              className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-left transition-all group flex flex-col justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-neutral-200 block truncate group-hover:text-amber-300">
                  {preset.name}
                </span>
                <span className="text-[9px] text-amber-400/80 font-mono block">
                  {preset.badge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Image Stage & Capture Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Image Canvas / Camera Viewport (7 Cols) */}
        <div className="md:col-span-7 flex flex-col">
          {/* Mode 1: Live Camera Capture */}
          {inputMode === "camera" && (
            <div className="relative aspect-video sm:aspect-[4/3] rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden flex flex-col items-center justify-center">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Camera Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-amber-400/60 border-dashed animate-pulse flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 bg-black/70 px-2.5 py-1 rounded-full text-[10px] text-amber-300 font-mono flex items-center gap-1.5 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Horological Scanner</span>
                  </div>

                  {/* Shutter Capture Button */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      id="camera-snap-btn"
                      onClick={capturePhoto}
                      className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-transform active:scale-95"
                    >
                      <Camera size={16} />
                      <span>Capture Photo</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center space-y-3">
                  <Camera size={36} className="mx-auto text-neutral-600" />
                  <p className="text-xs text-neutral-400 max-w-xs">
                    {cameraError || "Click below to activate your camera and position your watch inside the target reticle."}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
                  >
                    Start Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: File Upload / Drag & Drop */}
          {inputMode === "upload" && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative aspect-video sm:aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center group ${
                imageSrc
                  ? "border-amber-500/60 bg-neutral-950/60"
                  : "border-neutral-700/80 hover:border-amber-500/50 bg-neutral-900/40 hover:bg-neutral-900/70"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-file-input"
              />

              {imageSrc ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                  <img
                    src={imageSrc}
                    alt="Uploaded Watch"
                    className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                  />
                  <div className="absolute top-2 right-2 bg-neutral-950/80 p-1.5 rounded-full text-neutral-300 hover:text-white border border-neutral-700 backdrop-blur-sm">
                    <RefreshCw size={14} />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/75 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-mono">
                    Click or drag new image to replace
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-200 block">
                      Drop watch photo here or click to browse
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      Supports wrist shots, dealer listings, macro photos (JPEG, PNG, WEBP)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Image URL Input */}
          {inputMode === "url" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLoadUrl()}
                  placeholder="Paste direct watch image URL (e.g. https://.../rolex_daytona.jpg)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleLoadUrl}
                  disabled={!imageUrlInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase disabled:opacity-40"
                >
                  Load
                </button>
              </div>

              <div className="relative aspect-video sm:aspect-[4/3] rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Loaded Watch from URL"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-neutral-500 text-xs space-y-2">
                    <ImageIcon size={32} className="mx-auto opacity-50" />
                    <span>Enter an image URL above to preview and scan</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Vision Parameters & Scan Trigger (5 Cols) */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3.5 bg-neutral-900/60 rounded-2xl border border-neutral-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block font-mono flex items-center gap-1.5">
                <Eye size={13} />
                <span>What Gemini Vision Will Extract</span>
              </span>
              <ul className="text-[11px] text-neutral-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-emerald-400 shrink-0" />
                  <span>Exact Brand, Reference & Year of Creation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-emerald-400 shrink-0" />
                  <span>Case Metal, Shape & Bezel Inserts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-emerald-400 shrink-0" />
                  <span>Dial Tone, Patterns, Indices & Handset</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-emerald-400 shrink-0" />
                  <span>Movement Specs, Caliber & Complications</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={12} className="text-emerald-400 shrink-0" />
                  <span>Full Provenance Story & Collector Trivia</span>
                </li>
              </ul>
            </div>

            {/* Optional User Context/Notes Input & Shape Calibration Tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 block">
                Optional Collector Context or Clues:
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="e.g. Vintage 1968 piece inherited from grandfather, yellow gold case, tropical dial..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
              />

              {/* Quick Calibration Tags */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Sliders size={11} className="text-amber-400" />
                  <span>Shape & Pusher Geometry Clues:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Richard Mille Tonneau", clue: "Richard Mille style curved tonneau case, spline bezel screws, tactical pushers" },
                    { label: "Vintage Big Pushers", clue: "Chronograph with oversized vintage pump pushers" },
                    { label: "Heuer Monaco Square", clue: "Square case, chronograph pushers, left-side 9H crown" },
                    { label: "Bullhead Top Horns", clue: "Bullhead asymmetrical case, dual pushers at 11 and 1 o'clock, crown at 12" },
                    { label: "AP Octagonal Screws", clue: "Octagonal bezel with hexagonal exposed screws, paddle pushers" },
                    { label: "Daytona Knurled Collars", clue: "Screw-down knurled chronograph pushers" },
                  ].map((tag, i) => {
                    const isSelected = selectedShapeClue === tag.clue;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedShapeClue(isSelected ? "" : tag.clue);
                          horologyAudio.playCrownClick();
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          isSelected
                            ? "bg-amber-500 text-neutral-950 font-bold shadow-sm"
                            : "bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Scan & Digitize Action Button */}
          <button
            type="button"
            id="scan-watch-photo-btn"
            onClick={handleAnalyzePhoto}
            disabled={!imageSrc || isScanning}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-40 transition-all active:scale-98"
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Digitizing Timepiece from Photo...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Scan Photo & Generate Vitrine Rendering</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
