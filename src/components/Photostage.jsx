import { useState, useEffect, useRef, useCallback } from "react";
import "./PhotoStage.css";

// ─────────────────────────────────────────────
// PhotoStage — photo + orbital anchored words
//
// Photo appears via iris animation:
//   clip-path: circle(0%) → circle(72%)
//   Duration: 1.2s, cubic-bezier ease-out
//
// Anchor words are positioned on an ellipse
// OUTSIDE the photo bounds — fully visible,
// with a semi-dark background for legibility.
// Thin lines connect each word to its dot on photo.
//
// No prev/next arrows — back button returns to list.
// ─────────────────────────────────────────────

const ORBIT_PAD_X = 95;   // px beyond photo half-width
const ORBIT_PAD_Y = 55;   // px beyond photo half-height

export default function PhotoStage({
  chamber,
  passageIdx,
  onBackToList,
  site,
}) {
  const [irisOpen, setIrisOpen]       = useState(false);
  const [quoteVisible, setQuoteVis]   = useState(false);
  const [anchors, setAnchors]         = useState([]);
  const [anchorsVisible, setAncVis]   = useState(false);

  const photoRef    = useRef(null);
  const transTimer  = useRef(null);
  const anchorTimer = useRef(null);
  const quoteTimer  = useRef(null);

  const passage = chamber.passages[passageIdx];

  // ── Reset and open iris on each passage change ──
  useEffect(() => {
    clearTimeout(transTimer.current);
    clearTimeout(anchorTimer.current);
    clearTimeout(quoteTimer.current);

    setIrisOpen(false);
    setQuoteVis(false);
    setAnchors([]);
    setAncVis(false);

    // Preload image, then trigger iris
    const img = new Image();
    img.src = passage.src;
    img.onload = () => {
      // Two-frame delay ensures clip-path transition fires correctly
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIrisOpen(true);
        });
      });
    };
    // Fallback if image already cached (onload may not fire)
    if (img.complete) {
      transTimer.current = setTimeout(() => setIrisOpen(true), 80);
    }

    // Build anchors after iris opens
    anchorTimer.current = setTimeout(() => {
      computeAnchors();
      setAncVis(true);
    }, 1400);

    // Show quote
    quoteTimer.current = setTimeout(() => {
      setQuoteVis(true);
    }, 1600);

    return () => {
      clearTimeout(transTimer.current);
      clearTimeout(anchorTimer.current);
      clearTimeout(quoteTimer.current);
    };
  }, [passage]);

  // ── Compute anchor orbit positions ──
  const computeAnchors = useCallback(() => {
    const el = photoRef.current;
    if (!el || !passage) return;

    // For <img> with object-fit:contain, getBoundingClientRect gives the
    // element box — we need the actual rendered image bounds
    const elRect  = el.getBoundingClientRect();
    const natW    = el.naturalWidth  || elRect.width;
    const natH    = el.naturalHeight || elRect.height;
    const elW     = elRect.width;
    const elH     = elRect.height;

    // Compute actual rendered size (contain = letterboxed)
    const scale   = Math.min(elW / natW, elH / natH);
    const imgW    = natW * scale;
    const imgH    = natH * scale;
    const offsetX = (elW - imgW) / 2;
    const offsetY = (elH - imgH) / 2;

    const imgLeft = elRect.left + offsetX;
    const imgTop  = elRect.top  + offsetY;
    const pcx     = imgLeft + imgW / 2;
    const pcy     = imgTop  + imgH / 2;
    const orx     = imgW / 2 + ORBIT_PAD_X;
    const ory     = imgH / 2 + ORBIT_PAD_Y;
    const n       = passage.anchors.length;

    const computed = passage.anchors.map((a, i) => {
      const ax = imgLeft + (a.px / 100) * imgW;
      const ay = imgTop  + (a.py / 100) * imgH;

      const theta = (i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6;
      const wx = pcx + orx * Math.cos(theta);
      const wy = pcy + ory * Math.sin(theta);

      return { ...a, ax, ay, wx, wy };
    });

    setAnchors(computed);
  }, [passage]);

  // Recompute on resize
  useEffect(() => {
    const onResize = () => { if (anchorsVisible) computeAnchors(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [anchorsVisible, computeAnchors]);

  // Keyboard — Escape goes back
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onBackToList(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBackToList]);

  if (!passage) return null;

  return (
    <div className="photo-stage">

      {/* ── Photo — iris reveal ── */}
      <img
        ref={photoRef}
        src={passage.src}
        alt={passage.alt}
        className={`photo-stage__photo ${irisOpen ? "photo-stage__photo--open" : ""}`}
      />

      {/* ── SVG lines from orbit words to photo dots ── */}
      {anchorsVisible && anchors.length > 0 && (
        <svg className="photo-stage__svg" aria-hidden="true">
          {anchors.map((a, i) => (
            <line
              key={`line-${i}`}
              x1={a.wx} y1={a.wy}
              x2={a.ax} y2={a.ay}
              className="photo-stage__line"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </svg>
      )}

      {/* ── Dots on photo ── */}
      {anchorsVisible && anchors.map((a, i) => (
        <div
          key={`dot-${i}`}
          className="photo-stage__dot"
          style={{
            left: a.ax,
            top:  a.ay,
            animationDelay: `${i * 0.35}s`,
          }}
          aria-hidden="true"
        />
      ))}

      {/* ── Orbit word labels ── */}
      {anchorsVisible && anchors.map((a, i) => (
        <div
          key={`word-${i}`}
          className="photo-stage__anchor"
          style={{
            left:            a.wx,
            top:             a.wy,
            animationDelay: `${i * 0.35}s`,
          }}
          aria-hidden="true"
        >
          <span className="photo-stage__anchor-word">{a.word}</span>
          <span className="photo-stage__anchor-note">{a.note}</span>
        </div>
      ))}

      {/* ── Full quote ── */}
      <div
        className={`photo-stage__quote ${quoteVisible ? "photo-stage__quote--visible" : ""}`}
        aria-live="polite"
      >
        <p className="photo-stage__quote-text">
          &ldquo;{passage.full}&rdquo;
        </p>
        <span className="photo-stage__quote-source">
          {passage.source} — {site.bookTitle}
        </span>
      </div>

    </div>
  );
}