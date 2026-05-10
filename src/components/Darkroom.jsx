import { useState, useEffect, useRef, useCallback } from "react";
import "./Darkroom.css";

// ─────────────────────────────────────────────
// Darkroom — chambre noire navigation
//
// The photo starts completely dark.
// Moving the cursor acts as a darkroom lamp —
// it reveals the photo progressively beneath.
// Holding still "fixes" the image (like a fixer bath).
// Once fixed, click to advance to the next photo.
//
// Development mechanics:
// - Radial gradient punches a hole in the dark overlay
// - Moving mouse accumulates `developed` (0→1)
// - Sepia tint fades as development increases
// - Holding still fills a progress bar → fixes at 100%
// - On fix: canvas clears fully, text fragment types in
// ─────────────────────────────────────────────

const HOLD_DURATION   = 2800;  // ms to hold still to fix
const BASE_RADIUS     = 160;   // base px radius of lamp
const MAX_RADIUS      = 380;   // max radius when fully developed
const DEVELOP_SPEED   = 0.0018; // per frame — slow, deliberate
const STILL_THRESHOLD = 5;     // px — below = considered still

export default function Darkroom({
  chamber,
  chamberIdx,
  totalChambers,
  onSwitch,
  onGoHome,
  mousePos,
  site,
}) {
  const [photoIdx, setPhotoIdx]       = useState(0);
  const [developed, setDeveloped]     = useState(0);
  const [isFixed, setIsFixed]         = useState(false);
  const [fragment, setFragment]       = useState("");
  const [fragVisible, setFragVisible] = useState(false);
  const [devState, setDevState]       = useState("developing...");
  const [holdProgress, setHoldProgress] = useState(0);
  const [showNextHint, setShowNextHint] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);

  const canvasRef     = useRef(null);
  const developedRef  = useRef(0);       // live value for RAF
  const isFixedRef    = useRef(false);
  const stillFrames   = useRef(0);
  const lastPos       = useRef({ x: mousePos.x, y: mousePos.y });
  const rafRef        = useRef(null);
  const fragTimerRef  = useRef(null);
  const typeTimerRef  = useRef(null);
  const stillInterval = useRef(null);

  // ── Reset when chamber or photo changes ──
  const resetPhoto = useCallback((idx) => {
    setPhotoIdx(idx);
    setDeveloped(0);
    developedRef.current = 0;
    setIsFixed(false);
    isFixedRef.current = false;
    setFragment("");
    setFragVisible(false);
    setDevState("developing...");
    setHoldProgress(0);
    setShowNextHint(false);
    setShowInstruction(true);
    stillFrames.current = 0;

    clearTimeout(fragTimerRef.current);
    clearInterval(typeTimerRef.current);

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Reset on chamber change
  useEffect(() => {
    resetPhoto(0);
  }, [chamber, resetPhoto]);

  // ── Canvas resize ──
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Main RAF loop — development + canvas draw ──
  useEffect(() => {
    const loop = () => {
      if (isFixedRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Accumulate development
      const dx    = mousePos.x - lastPos.current.x;
      const dy    = mousePos.y - lastPos.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const bonus = Math.min(speed * 0.0008, 0.006);
      const next  = Math.min(1, developedRef.current + DEVELOP_SPEED + bonus);

      developedRef.current = next;
      setDeveloped(next);

      // Dev state label
      if (next > 0.95)      setDevState("fixed");
      else if (next > 0.5)  setDevState("emerging...");
      else                  setDevState("developing...");

      // Auto-fix when fully developed
      if (next >= 1 && !isFixedRef.current) fixImage();

      // Draw canvas
      drawReveal(next);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mousePos, chamber, photoIdx]);

  // ── Draw darkroom reveal ──
  const drawReveal = useCallback((dev) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const { x, y } = mousePos;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Step 1: fill entirely black
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#0a0906";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Step 2: cut transparent hole via destination-out
    // colorStop(0) = fully removed at center (no dark blob)
    const radius = BASE_RADIUS + dev * (MAX_RADIUS - BASE_RADIUS);
    const grad   = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0,    "rgba(0,0,0,1)");    // fully removed at center
    grad.addColorStop(0.5,  "rgba(0,0,0,0.95)");
    grad.addColorStop(0.82, "rgba(0,0,0,0.4)");
    grad.addColorStop(1,    "rgba(0,0,0,0)");    // edge stays dark

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }, [mousePos]);

  // ── Stillness detection ──
  useEffect(() => {
    stillInterval.current = setInterval(() => {
      if (isFixedRef.current || developedRef.current < 0.3) return;

      const dist = Math.hypot(
        mousePos.x - lastPos.current.x,
        mousePos.y - lastPos.current.y
      );

      if (dist < STILL_THRESHOLD) {
        stillFrames.current++;
        const progress = Math.min(1, stillFrames.current / (HOLD_DURATION / 16));
        setHoldProgress(progress);
        if (progress >= 1) fixImage();
      } else {
        stillFrames.current = 0;
        setHoldProgress(0);
      }

      lastPos.current = { x: mousePos.x, y: mousePos.y };
    }, 16);

    return () => clearInterval(stillInterval.current);
  }, [mousePos]);

  // ── Fix image ──
  const fixImage = useCallback(() => {
    if (isFixedRef.current) return;
    isFixedRef.current = true;
    setIsFixed(true);
    setDeveloped(1);
    developedRef.current = 1;
    setDevState("fixed");
    setShowInstruction(false);

    // Clear canvas fully — show complete photo
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Type fragment
    clearTimeout(fragTimerRef.current);
    clearInterval(typeTimerRef.current);

    fragTimerRef.current = setTimeout(() => {
      const text = chamber.photos[photoIdx]?.fragment ?? "";
      setFragVisible(true);
      let i = 0;
      typeTimerRef.current = setInterval(() => {
        i++;
        setFragment(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(typeTimerRef.current);
          // Show next hint after reading delay
          setTimeout(() => setShowNextHint(true), 2000);
        }
      }, 26);
    }, 500);
  }, [chamber, photoIdx]);

  // ── Advance to next photo ──
  const advance = useCallback(() => {
    if (!isFixedRef.current) return;
    const total = chamber.photos.length;
    if (photoIdx < total - 1) {
      resetPhoto(photoIdx + 1);
    }
  }, [isFixed, photoIdx, chamber, resetPhoto]);

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") advance();
      if (e.key === "ArrowUp")    onSwitch((chamberIdx + 1) % totalChambers);
      if (e.key === "ArrowDown")  onSwitch((chamberIdx + totalChambers - 1) % totalChambers);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onSwitch, chamberIdx, totalChambers]);

  const sepiaOpacity = Math.max(0, 0.55 - developed * 0.62);
  const total        = chamber.photos.length;
  const photo        = chamber.photos[photoIdx];

  return (
    <div className="darkroom" onClick={advance}>

      {/* ── Photo layer ── */}
      <div
        className="darkroom__photo"
        style={{ backgroundImage: `url(${photo.src})` }}
        aria-label={photo.alt}
      />

      {/* ── Sepia tint ── */}
      <div
        className="darkroom__sepia"
        style={{ opacity: sepiaOpacity }}
        aria-hidden="true"
      />

      {/* ── Canvas mask ── */}
      <canvas
        ref={canvasRef}
        className="darkroom__canvas"
        aria-hidden="true"
      />

      {/* ── Development bar ── */}
      <div
        className="darkroom__bar"
        style={{ width: `${developed * 100}%` }}
        aria-hidden="true"
      />

      {/* ── Initial instruction ── */}
      {showInstruction && (
        <p className="darkroom__instruction" aria-live="polite">
          Move the cursor to reveal the image.<br />
          Hold still to fix it.
        </p>
      )}

      {/* ── Text fragment ── */}
      <p
        className={`darkroom__fragment ${fragVisible ? "darkroom__fragment--visible" : ""}`}
        aria-live="polite"
      >
        {fragment}
        {fragVisible && fragment.length < (photo.fragment?.length ?? 0) && (
          <span className="darkroom__type-cursor" aria-hidden="true">|</span>
        )}
      </p>

      {/* ── Hold-still progress ── */}
      {!isFixed && developed > 0.3 && (
        <div className="darkroom__hold">
          <span className="darkroom__hold-label">hold still to fix the image</span>
          <div className="darkroom__hold-track">
            <div
              className="darkroom__hold-fill"
              style={{ width: `${holdProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Next hint ── */}
      {showNextHint && photoIdx < total - 1 && (
        <p className="darkroom__next-hint" aria-live="polite">
          click anywhere to continue
        </p>
      )}
      {showNextHint && photoIdx === total - 1 && (
        <p className="darkroom__next-hint">· end of chamber ·</p>
      )}

      {/* ── Dev state ── */}
      <p className="darkroom__dev-state">{devState}</p>

      {/* ── Chamber label ── */}
      <p className="darkroom__label">
        {chamber.label}
        <span className="darkroom__label-fr">{chamber.labelFr}</span>
      </p>

      {/* ── Counter ── */}
      <p className="darkroom__counter">
        <span className="darkroom__counter-cur">
          {String(photoIdx + 1).padStart(2, "0")}
        </span>
        {" · "}
        {String(total).padStart(2, "0")}
      </p>

      {/* ── Chamber dots ── */}
      <nav className="darkroom__dots" aria-label="Chamber navigation">
        {Array.from({ length: totalChambers }).map((_, i) => (
          <button
            key={i}
            className={`dot darkroom__dot ${i === chamberIdx ? "darkroom__dot--active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onSwitch(i); }}
            aria-label={`Chamber ${i + 1}`}
            aria-current={i === chamberIdx}
          />
        ))}
      </nav>

      {/* ── Home link ── */}
      <button
        className="home-link darkroom__home"
        onClick={(e) => { e.stopPropagation(); onGoHome(); }}
        aria-label="Return to home"
      >
        {site.title}
      </button>

    </div>
  );
}