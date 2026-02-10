import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Loader2, Camera, RotateCcw } from "lucide-react";

interface CapturedStep {
  label: string;
  dataUrl: string;
}

interface FacialVerificationCameraProps {
  onComplete: (captures: Blob[]) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: "front", instruction: "Regardez droit devant vous", icon: "😐", duration: 3000 },
  { id: "left", instruction: "Tournez lentement la tête à gauche", icon: "👈", duration: 3000 },
  { id: "right", instruction: "Tournez lentement la tête à droite", icon: "👉", duration: 3000 },
  { id: "smile", instruction: "Souriez naturellement", icon: "😊", duration: 3000 },
];

const FacialVerificationCamera = ({ onComplete, onCancel }: FacialVerificationCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [captures, setCaptures] = useState<CapturedStep[]>([]);
  const [captureBlobs, setCaptureBlobs] = useState<Blob[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 960 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraReady(true);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError("Impossible d'accéder à la caméra. Vérifiez vos permissions.");
      }
    };
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const captureFrame = useCallback((): { dataUrl: string; blob: Blob } | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Mirror the image (front camera is mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    // Convert to blob
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    return { dataUrl, blob };
  }, []);

  const startVerification = () => {
    setCurrentStep(0);
  };

  // Auto-capture logic per step
  useEffect(() => {
    if (currentStep < 0 || currentStep >= STEPS.length || isCapturing) return;

    setIsCapturing(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Capture
          const result = captureFrame();
          if (result) {
            setCaptures((prev) => [
              ...prev,
              { label: STEPS[currentStep].instruction, dataUrl: result.dataUrl },
            ]);
            setCaptureBlobs((prev) => [...prev, result.blob]);
          }

          setTimeout(() => {
            setIsCapturing(false);
            if (currentStep < STEPS.length - 1) {
              setCurrentStep((s) => s + 1);
            } else {
              setCompleted(true);
            }
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [currentStep, captureFrame]);

  const handleSubmit = () => {
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onComplete(captureBlobs);
  };

  const handleRetry = () => {
    setCurrentStep(-1);
    setCaptures([]);
    setCaptureBlobs([]);
    setCompleted(false);
    setIsCapturing(false);
  };

  if (cameraError) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <Camera className="w-10 h-10 text-destructive" />
          </div>
          <h3 className="font-bold text-lg">Caméra inaccessible</h3>
          <p className="text-sm text-muted-foreground">{cameraError}</p>
          <button
            onClick={onCancel}
            className="btn-gold px-6 py-3 rounded-xl"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for captures */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
            }
            onCancel();
          }}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <p className="text-white/80 text-sm font-medium">Vérification faciale</p>
        <div className="w-10" />
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Face oval guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            viewBox="0 0 300 400"
            className="w-64 h-80"
            style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.3))" }}
          >
            {/* Dark overlay with oval cutout */}
            <defs>
              <mask id="faceMask">
                <rect width="300" height="400" fill="white" />
                <ellipse cx="150" cy="185" rx="110" ry="145" fill="black" />
              </mask>
            </defs>
            <rect
              width="300"
              height="400"
              fill="rgba(0,0,0,0.5)"
              mask="url(#faceMask)"
            />
            {/* Oval border */}
            <ellipse
              cx="150"
              cy="185"
              rx="110"
              ry="145"
              fill="none"
              stroke={
                completed
                  ? "#22c55e"
                  : isCapturing && countdown === 0
                  ? "#22c55e"
                  : "#d4a843"
              }
              strokeWidth="3"
              strokeDasharray={completed || (isCapturing && countdown === 0) ? "0" : "8 4"}
            >
              {!completed && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="24"
                  dur="1s"
                  repeatCount="indefinite"
                />
              )}
            </ellipse>
          </svg>
        </div>

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdown > 0 && currentStep >= 0 && (
            <motion.div
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span className="text-7xl font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Capture flash */}
        <AnimatePresence>
          {isCapturing && countdown === 0 && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-white pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="bg-gradient-to-t from-black via-black/90 to-transparent p-6 pb-10 space-y-4">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3">
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < captures.length
                  ? "bg-accent scale-100"
                  : i === currentStep
                  ? "bg-gold scale-125"
                  : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Instructions */}
        <AnimatePresence mode="wait">
          {!cameraReady ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-2" />
              <p className="text-white/80 text-sm">Démarrage de la caméra...</p>
            </motion.div>
          ) : currentStep < 0 ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-4"
            >
              <p className="text-white text-lg font-semibold">
                Placez votre visage dans l'ovale
              </p>
              <p className="text-white/60 text-sm">
                Assurez-vous d'être bien éclairé et dans un endroit calme
              </p>
              <button
                onClick={startVerification}
                className="bg-gold text-background px-8 py-3 rounded-xl font-semibold text-base hover:bg-gold/90 transition-colors"
              >
                Commencer la vérification
              </button>
            </motion.div>
          ) : completed ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6 text-accent" />
                <p className="text-white text-lg font-semibold">Vérification terminée !</p>
              </div>
              <p className="text-white/60 text-sm">
                {captures.length} photos capturées. Soumettez pour validation par un administrateur.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recommencer
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-gold text-background px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Soumettre
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="text-center"
            >
              <p className="text-4xl mb-2">{STEPS[currentStep].icon}</p>
              <p className="text-white text-lg font-semibold">
                {STEPS[currentStep].instruction}
              </p>
              <p className="text-white/50 text-xs mt-1">
                Étape {currentStep + 1} sur {STEPS.length}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FacialVerificationCamera;
