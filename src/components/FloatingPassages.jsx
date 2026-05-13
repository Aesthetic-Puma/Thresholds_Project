import { useEffect, useRef, useCallback } from "react";
import "./FloatingPassages.css";

// Float tuning — halved amplitudes vs. original
const FLOAT_SPEED_MIN  = 0.00012;
const FLOAT_SPEED_MAX  = 0.00013;
const FLOAT_AMP_X_MIN  = 2.5;
const FLOAT_AMP_X_MAX  = 5.5;
const FLOAT_AMP_Y_MIN  = 1.5;
const FLOAT_AMP_Y_MAX  = 4;
const ITEM_WIDTH       = 300;
const MARGIN           = 80;
const COLS             = 3;

export default function FloatingPassages({ chamber, onSelect, visitedSet, enterDir }) {
  const containerRef = useRef(null);
  const itemsRef     = useRef([]);
  const rafRef       = useRef(null);
  const tRef         = useRef(0);
  const hoveredRef   = useRef(-1);
  // Ref pour lire enterDir dans build() sans l'ajouter aux deps
  const enterDirRef  = useRef(enterDir);
  enterDirRef.current = enterDir;

  // ── Build items and start animation loop
  const build = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    itemsRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const vw   = window.innerWidth;
    const vh   = window.innerHeight;
    const n    = chamber.passages.length;
    const rows = Math.ceil(n / COLS);
    const zw   = vw / COLS;
    const zh   = vh / rows;

    chamber.passages.forEach((passage, i) => {
      const col  = i % COLS;
      const row  = Math.floor(i / COLS);
      const baseX = col * zw + zw / 2;
      const baseY = row * zh + zh / 2;
      const jx   = (Math.random() - 0.5) * zw * 0.32;
      const jy   = (Math.random() - 0.5) * zh * 0.32;
      const cx   = Math.max(MARGIN + ITEM_WIDTH / 2, Math.min(vw - MARGIN - ITEM_WIDTH / 2, baseX + jx));
      const cy   = Math.max(MARGIN + 50, Math.min(vh - MARGIN - 50, baseY + jy));

      const floatAmp  = FLOAT_AMP_X_MIN + Math.random() * (FLOAT_AMP_X_MAX - FLOAT_AMP_X_MIN);
      const floatSpd  = FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN);
      const floatPhX  = Math.random() * Math.PI * 2;
      const floatAmpY = FLOAT_AMP_Y_MIN + Math.random() * (FLOAT_AMP_Y_MAX - FLOAT_AMP_Y_MIN);
      const floatSpdY = FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN);
      const floatPhY  = Math.random() * Math.PI * 2;

      const el = document.createElement("button");
      el.className = "fp-item";
      if (visitedSet?.has(i)) el.classList.add("fp-item--visited");
      el.style.left = `${cx}px`;
      el.style.top  = `${cy}px`;
      el.innerHTML = `
        <span class="fp-source">${passage.source}</span>
        <p class="fp-text">${passage.short}</p>
      `;

      // Entrée directionnelle : items visibles d'emblée pour que le glissement
      // du conteneur soit perceptible. Sinon stagger normal.
      if (enterDirRef.current) {
        el.classList.add("fp-item--visible");
      } else {
        setTimeout(() => el.classList.add("fp-item--visible"), 200 + i * 110);
      }

      // Hover — freeze and dim siblings
      el.addEventListener("mouseenter", () => {
        hoveredRef.current = i;
        itemsRef.current.forEach((it) => {
          if (it.idx !== i) it.el.classList.add("fp-item--dimmed");
        });
      });
      el.addEventListener("mouseleave", () => {
        hoveredRef.current = -1;
        itemsRef.current.forEach((it) => it.el.classList.remove("fp-item--dimmed"));
      });

      el.addEventListener("click", () => onSelect(i));

      container.appendChild(el);
      itemsRef.current.push({ el, cx, cy, floatAmp, floatSpd, floatPhX, floatAmpY, floatSpdY, floatPhY, idx: i });
    });

    // Animation loop — freeze siblings while one is hovered
    tRef.current = 0;
    const animate = () => {
      tRef.current += 16;
      const h = hoveredRef.current;
      itemsRef.current.forEach((item) => {
        if (h !== -1 && item.idx !== h) return; // frozen
        const dx = Math.sin(tRef.current * item.floatSpd  + item.floatPhX) * item.floatAmp;
        const dy = Math.cos(tRef.current * item.floatSpdY + item.floatPhY) * item.floatAmpY;
        item.el.style.left = `${item.cx + dx}px`;
        item.el.style.top  = `${item.cy + dy}px`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [chamber, onSelect]); // visitedSet intentionally excluded — updated via separate effect

  useEffect(() => {
    build();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [build]);

  // ── Update visited classes without rebuilding
  useEffect(() => {
    itemsRef.current.forEach((item) => {
      item.el.classList.toggle("fp-item--visited", visitedSet?.has(item.idx) ?? false);
    });
  }, [visitedSet]);

  return (
    <div className={`floating-passages${enterDir ? ` floating-passages--from-${enterDir}` : ""}`}>
      <div className="fp-center" aria-hidden="true">
        <span className="fp-center__label">{chamber.label}</span>
        <span className="fp-center__hint">choose a passage</span>
      </div>
      <div ref={containerRef} className="fp-container" aria-label={`Passages for ${chamber.label}`} />
    </div>
  );
}
