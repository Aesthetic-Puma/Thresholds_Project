import { useEffect, useRef, useCallback } from "react";
import "./FloatingPassages.css";

// ─────────────────────────────────────────────
// FloatingPassages — passage selection screen
//
// Each passage floats slowly across its zone
// with a unique amplitude, speed, and phase.
// Text size is fixed (no clamp/responsive reflow).
// white-space: pre-line preserves manual line breaks.
// Clicking a passage triggers onSelect(idx).
// ─────────────────────────────────────────────

// Float tuning constants
const FLOAT_SPEED_MIN  = 0.00012;
const FLOAT_SPEED_MAX  = 0.00013;
const FLOAT_AMP_X_MIN  = 5;
const FLOAT_AMP_X_MAX  = 11;
const FLOAT_AMP_Y_MIN  = 3;
const FLOAT_AMP_Y_MAX  = 8;
const ITEM_WIDTH       = 300;   // px — fixed, no reflow
const MARGIN           = 80;    // px from screen edges
const COLS             = 3;

export default function FloatingPassages({ chamber, onSelect }) {
  const containerRef  = useRef(null);
  const itemsRef      = useRef([]);
  const rafRef        = useRef(null);
  const tRef          = useRef(0);

  // ── Build and animate items ──
  const build = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous
    container.innerHTML = "";
    itemsRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const n  = chamber.passages.length;
    const rows = Math.ceil(n / COLS);
    const zw = vw / COLS;
    const zh = vh / rows;

    chamber.passages.forEach((passage, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      // Base position — center of zone + random jitter
      const baseX = col * zw + zw / 2;
      const baseY = row * zh + zh / 2;
      const jx    = (Math.random() - 0.5) * zw * 0.32;
      const jy    = (Math.random() - 0.5) * zh * 0.32;
      const cx    = Math.max(MARGIN + ITEM_WIDTH / 2, Math.min(vw - MARGIN - ITEM_WIDTH / 2, baseX + jx));
      const cy    = Math.max(MARGIN + 50, Math.min(vh - MARGIN - 50, baseY + jy));

      // Unique float parameters
      const floatAmp   = FLOAT_AMP_X_MIN + Math.random() * (FLOAT_AMP_X_MAX - FLOAT_AMP_X_MIN);
      const floatSpd   = FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN);
      const floatPhX   = Math.random() * Math.PI * 2;
      const floatAmpY  = FLOAT_AMP_Y_MIN + Math.random() * (FLOAT_AMP_Y_MAX - FLOAT_AMP_Y_MIN);
      const floatSpdY  = FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN);
      const floatPhY   = Math.random() * Math.PI * 2;

      // Build DOM element
      const el = document.createElement("button");
      el.className = "fp-item";
      el.style.left = `${cx}px`;
      el.style.top  = `${cy}px`;
      el.innerHTML = `
        <span class="fp-source">${passage.source}</span>
        <p class="fp-text">${passage.short}</p>
      `;

      // Stagger fade-in
      setTimeout(() => el.classList.add("fp-item--visible"), 200 + i * 110);

      el.addEventListener("click", () => onSelect(i));

      container.appendChild(el);
      itemsRef.current.push({ el, cx, cy, floatAmp, floatSpd, floatPhX, floatAmpY, floatSpdY, floatPhY });
    });

    // Animation loop
    tRef.current = 0;
    const animate = () => {
      tRef.current += 16;
      itemsRef.current.forEach((item) => {
        const dx = Math.sin(tRef.current * item.floatSpd  + item.floatPhX) * item.floatAmp;
        const dy = Math.cos(tRef.current * item.floatSpdY + item.floatPhY) * item.floatAmpY;
        item.el.style.left = `${item.cx + dx}px`;
        item.el.style.top  = `${item.cy + dy}px`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [chamber, onSelect]);

  useEffect(() => {
    build();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [build]);

  return (
    <div className="floating-passages">

      {/* Chamber center label */}
      <div className="fp-center" aria-hidden="true">
        <span className="fp-center__label">{chamber.label}</span>
        <span className="fp-center__hint">choose a passage</span>
      </div>

      {/* Items injected by JS for animation control */}
      <div ref={containerRef} className="fp-container" aria-label={`Passages for ${chamber.label}`} />

    </div>
  );
}