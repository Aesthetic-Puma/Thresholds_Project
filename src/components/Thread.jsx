import { useState, useEffect, useRef, useCallback } from "react";
import "./Thread.css";

// ─────────────────────────────────────────────
// Thread — Ariadne's thread navigation
//
// Each photo has a text fragment where one word
// or phrase is clickable (the "thread").
// Hovering reveals a thumbnail of the next photo.
// Clicking follows the thread to the next image.
// The last photo has no thread — the story ends.
// ─────────────────────────────────────────────

export default function Thread({
  chamber,
  chamberIdx,
  totalChambers,
  onSwitch,
  onGoHome,
  mousePos,
  site,
}) {
  const [photoIdx, setPhotoIdx]       = useState(0);
  const [photoVisible, setPhotoVis]   = useState(false);
  const [textVisible, setTextVis]     = useState(false);
  const [previewSrc, setPreviewSrc]   = useState(null);
  const [previewPos, setPreviewPos]   = useState({ x: 0, y: 0 });
  const [previewVisible, setPreviewV] = useState(false);
  const [showEndMsg, setShowEndMsg]   = useState(false);
  const [showHint, setShowHint]       = useState(true);

  const hintTimer = useRef(null);
  const transTimer= useRef(null);

  const photo = chamber.photos[photoIdx];
  const total = chamber.photos.length;

  // ── Reset on chamber change ──
  useEffect(() => {
    loadPhoto(0, true);
  }, [chamber]);

  // ── Hide hint after 5s ──
  useEffect(() => {
    setShowHint(true);
    hintTimer.current = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(hintTimer.current);
  }, [chamber]);

  // ── Track mouse for preview position ──
  useEffect(() => {
    setPreviewPos({ x: mousePos.x + 18, y: mousePos.y - 55 });
  }, [mousePos]);

  // ── Load photo with transition ──
  const loadPhoto = useCallback((idx, instant = false) => {
    clearTimeout(transTimer.current);

    if (instant) {
      setPhotoIdx(idx);
      setShowEndMsg(false);
      setTimeout(() => { setPhotoVis(true); setTextVis(true); }, 120);
    } else {
      // Fade out
      setPhotoVis(false);
      setTextVis(false);
      setShowEndMsg(false);
      transTimer.current = setTimeout(() => {
        setPhotoIdx(idx);
        // Fade in
        setTimeout(() => { setPhotoVis(true); setTextVis(true); }, 80);
        // End message on last photo
        if (chamber.photos[idx].next === null) {
          setTimeout(() => setShowEndMsg(true), 2800);
        }
      }, 450);
    }
  }, [chamber]);

  // ── Follow thread ──
  const followThread = useCallback((nextIdx) => {
    setPreviewV(false);
    loadPhoto(nextIdx);
    setShowHint(false);
  }, [loadPhoto]);

  // ── Thread hover ──
  const onThreadEnter = useCallback((nextIdx) => {
    const next = chamber.photos[nextIdx];
    if (next) {
      setPreviewSrc(next.src);
      setPreviewV(true);
    }
  }, [chamber]);

  const onThreadLeave = useCallback(() => {
    setPreviewV(false);
  }, []);

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" && photo?.next !== null && photo?.next !== undefined) {
        followThread(photo.next);
      }
      if (e.key === "ArrowUp")   onSwitch((chamberIdx + 1) % totalChambers);
      if (e.key === "ArrowDown") onSwitch((chamberIdx + totalChambers - 1) % totalChambers);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo, followThread, onSwitch, chamberIdx, totalChambers]);

  return (
    <div className="thread-view">

      {/* ── Photo ── */}
      <div
        className={`thread-photo ${photoVisible ? "thread-photo--visible" : ""}`}
        style={{ backgroundImage: `url(${photo?.src})` }}
        aria-label={photo?.alt}
        role="img"
      />

      {/* ── Text fragment with thread word ── */}
      <div
        className={`thread-text ${textVisible ? "thread-text--visible" : ""}`}
        aria-live="polite"
      >
        {photo?.before && (
          <span className="thread-text__plain">{photo.before}</span>
        )}

        {photo?.thread && photo?.next !== null ? (
          // Clickable thread word
          <button
            className="thread-word"
            onClick={() => followThread(photo.next)}
            onMouseEnter={() => onThreadEnter(photo.next)}
            onMouseLeave={onThreadLeave}
            aria-label={`Follow the thread: ${photo.thread}`}
            data-cursor-large
          >
            {photo.thread}
          </button>
        ) : photo?.thread ? (
          // Last photo — thread word styled but not clickable
          <span className="thread-text__final">{photo.thread}</span>
        ) : null}

        {photo?.after && (
          <span className="thread-text__plain">{photo.after}</span>
        )}
      </div>

      {/* ── Preview thumbnail ── */}
      {previewSrc && (
        <div
          className={`thread-preview ${previewVisible ? "thread-preview--visible" : ""}`}
          style={{
            backgroundImage: `url(${previewSrc})`,
            left: `${previewPos.x}px`,
            top:  `${previewPos.y}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* ── End of chamber message ── */}
      {showEndMsg && (
        <p className="thread-end" aria-live="polite">
          · end of chamber ·
        </p>
      )}

      {/* ── First-time hint ── */}
      {showHint && (
        <p className="thread-hint">
          hover the highlighted word · click to follow the thread
        </p>
      )}

      {/* ── Chamber label ── */}
      <p className="thread-label">
        {chamber.label}
        <span className="thread-label__fr">{chamber.labelFr}</span>
      </p>

      {/* ── Counter ── */}
      <p className="thread-counter">
        <span className="thread-counter__cur">
          {String(photoIdx + 1).padStart(2, "0")}
        </span>
        {" · "}
        {String(total).padStart(2, "0")}
      </p>

      {/* ── Chamber dots ── */}
      <nav className="thread-dots" aria-label="Chamber navigation">
        {Array.from({ length: totalChambers }).map((_, i) => (
          <button
            key={i}
            className={`dot thread-dot ${i === chamberIdx ? "thread-dot--active" : ""}`}
            onClick={() => onSwitch(i)}
            aria-label={`Chamber ${i + 1}`}
            aria-current={i === chamberIdx}
          />
        ))}
      </nav>

      {/* ── Home link ── */}
      <button
        className="home-link thread-home"
        onClick={onGoHome}
        aria-label="Return to home"
      >
        {site.title}
      </button>

    </div>
  );
}