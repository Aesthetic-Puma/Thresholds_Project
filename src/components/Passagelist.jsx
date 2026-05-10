import { useState, useEffect } from "react";
import "./Passagelist.css";

// Deterministic pseudo-random from a seed
const pr = (seed) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

// Spread n fragments across the screen in a constellation.
// Divides the viewport into a grid of zones, places one fragment
// per zone with jitter so they feel organic, not mechanical.
const computePositions = (n) => {
  const cols = Math.ceil(Math.sqrt(n * 1.5));
  const rows = Math.ceil(n / cols);
  return Array.from({ length: n }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 68 / cols;
    const cellH = 66 / rows;
    return {
      left: `${10 + col * cellW + pr(i * 3)     * cellW * 0.52}%`,
      top:  `${12 + row * cellH + pr(i * 3 + 1) * cellH * 0.52}%`,
    };
  });
};

export default function PassageList({ chamber, onSelect }) {
  const [ready, setReady]       = useState(false);
  const [floating, setFloating] = useState(false);

  // positions are stable per chamber render
  const [positions] = useState(() => computePositions(chamber.passages.length));

  useEffect(() => {
    setReady(false);
    setFloating(false);
    const t1 = setTimeout(() => setReady(true), 80);
    // Start floating after all entries have faded in
    const t2 = setTimeout(() => setFloating(true), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [chamber]);

  return (
    <div className="plist">
      {chamber.passages.map((passage, i) => (
        <button
          key={passage.src}
          className={[
            "pstar",
            ready    ? "pstar--ready"    : "",
            floating ? "pstar--floating" : "",
          ].join(" ")}
          style={{
            left:             positions[i].left,
            top:              positions[i].top,
            animationDelay:   `${0.1 + i * 0.14}s`,
            "--float-dur":    `${4.4 + pr(i * 7) * 3.2}s`,
            "--float-delay":  `${pr(i * 7 + 3) * 2}s`,
            "--float-offset": `${-(4 + pr(i * 7 + 2) * 7)}px`,
          }}
          onClick={() => onSelect(i)}
          aria-label={`Open passage: ${passage.short}`}
          data-cursor-large
        >
          <span className="pstar__source">{passage.source}</span>
          <p className="pstar__text">&ldquo;{passage.short}&rdquo;</p>
          <div
            className="pstar__ghost"
            style={{ backgroundImage: `url(${passage.src})` }}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
