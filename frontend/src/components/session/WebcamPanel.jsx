import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Video } from 'lucide-react';

export default function WebcamPanel({ isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
        }
      } catch {
        if (!cancelled) setCameraError(true);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isActive]);

  // Overlay animation for body tracking visualization
  useEffect(() => {
    if (!hasCamera || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const drawOverlay = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Simulated face tracking box
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.35;
      const w = 120;
      const h = 140;
      const t = Date.now() * 0.002;

      ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -t * 5;

      // Face rectangle
      const rx = cx - w / 2 + Math.sin(t) * 3;
      const ry = cy - h / 2 + Math.cos(t * 0.7) * 2;
      ctx.strokeRect(rx, ry, w, h);

      // Corner accents
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.lineWidth = 3;
      const cornerLen = 15;
      // Top-left
      ctx.beginPath(); ctx.moveTo(rx, ry + cornerLen); ctx.lineTo(rx, ry); ctx.lineTo(rx + cornerLen, ry); ctx.stroke();
      // Top-right
      ctx.beginPath(); ctx.moveTo(rx + w - cornerLen, ry); ctx.lineTo(rx + w, ry); ctx.lineTo(rx + w, ry + cornerLen); ctx.stroke();
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(rx, ry + h - cornerLen); ctx.lineTo(rx, ry + h); ctx.lineTo(rx + cornerLen, ry + h); ctx.stroke();
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(rx + w - cornerLen, ry + h); ctx.lineTo(rx + w, ry + h); ctx.lineTo(rx + w, ry + h - cornerLen); ctx.stroke();

      // Eye tracking dots
      ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
      [[-25, -10], [25, -10]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(cx + ox + Math.sin(t * 1.5) * 2, cy + oy + Math.cos(t * 1.2) * 1, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Posture line
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, ry + h);
      ctx.lineTo(cx + Math.sin(t * 0.3) * 5, canvas.height - 20);
      ctx.stroke();

      animId = requestAnimationFrame(drawOverlay);
    };

    drawOverlay();
    return () => cancelAnimationFrame(animId);
  }, [hasCamera]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong rounded-2xl overflow-hidden relative aspect-[4/3]"
    >
      {/* Label */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-medium text-foreground/80 glass px-2 py-1 rounded-full">
          Live Tracking
        </span>
      </div>

      {hasCamera ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 gap-3">
          {cameraError ? (
            <>
              <CameraOff className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Camera not available</p>
              <p className="text-xs text-muted-foreground/60">Using simulated tracking</p>
            </>
          ) : (
            <>
              <Camera className="w-10 h-10 text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground">Connecting camera...</p>
            </>
          )}
        </div>
      )}

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent z-10" />
    </motion.div>
  );
}