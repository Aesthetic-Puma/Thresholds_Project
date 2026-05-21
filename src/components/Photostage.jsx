import { useState, useEffect, useRef, useCallback } from "react";
import "./PhotoStage.css";

const ORBIT_PAD_X = 95;
const ORBIT_PAD_Y = 55;

// ─────────────────────────────────────────────
// REVEAL CONFIG — three chambers, three modes
//
// space : iris (clip-path circle) — geometric shutter
// time  : blur dissolve — the memory surfaces, no geometry
// other : iris + cursor-reactive closing — stillness required
// ─────────────────────────────────────────────
const REVEAL = {
  space: {
    // Standard iris — unchanged
    useIris:       true,
    useBlur:       false,
    useCursorGate: false,
    filterIn:      "brightness(4) sepia(0.85) contrast(0.45)",
    filterOpen:    "brightness(1) sepia(0)    contrast(1)",
    clipIn:        "circle(0%  at 50% 50%)",
    clipOpen:      "circle(72% at 50% 50%)",
    clipTiming:    "1.2s cubic-bezier(0.4, 0, 0.2, 1)",
    filterTiming:  "2.8s cubic-bezier(0.55, 0, 0.15, 1)",
    // How long the passage text stays before click-to-reveal hint appears
    hintDelay:     1800,
  },
  time: {
    // Blur dissolve — no iris, image emerges from grain
    useIris:       false,
    useBlur:       true,
    useCursorGate: false,
    filterIn:      "brightness(0.25) blur(14px) sepia(0.22) contrast(0.9)",
    filterOpen:    "brightness(1)    blur(0px)  sepia(0)    contrast(1)",
    clipIn:        "circle(100% at 50% 50%)",  // already full — blur does the work
    clipOpen:      "circle(100% at 50% 50%)",
    clipTiming:    "0s",
    filterTiming:  "3.8s cubic-bezier(0.55, 0, 0.10, 1)",
    // Passage text lingers longer — recalling a memory takes time
    hintDelay:     2800,
  },
  other: {
    // Iris + cursor gate — stillness opens, movement closes
    useIris:       true,
    useBlur:       false,
    useCursorGate: true,
    filterIn:      "brightness(4) sepia(0.85) contrast(0.45)",
    filterOpen:    "brightness(1) sepia(0)    contrast(1)",
    clipIn:        "circle(0%  at 50% 50%)",
    clipOpen:      "circle(72% at 50% 50%)",
    clipTiming:    "1.6s cubic-bezier(0.4, 0, 0.2, 1)",
    filterTiming:  "3.2s cubic-bezier(0.55, 0, 0.15, 1)",
    hintDelay:     1800,
    // Cursor gate constants
    speedThreshold: 2.2,    // px/frame — above this = too fast
    retreatRate:    0.038,  // how fast the clip collapses per fast frame
    openRate:       0.006,  // how fast it opens when still
    minRadius:      0,      // % — fully closed
    maxRadius:      72,     // % — fully open
  },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parseText(text, anchors) {
  if (!anchors?.length) return [{ type: "text", content: text }];
  const hits = anchors
    .map((a, i) => ({
      i,
      start: text.toLowerCase().indexOf(a.word.toLowerCase()),
      len: a.word.length,
    }))
    .filter((h) => h.start !== -1)
    .sort((a, b) => a.start - b.start);

  const segs = [];
  let cur = 0;
  for (const { i, start, len } of hits) {
    if (start < cur) continue;
    if (start > cur) segs.push({ type: "text", content: text.slice(cur, start) });
    segs.push({ type: "kw", content: text.slice(start, start + len), anchorIdx: i });
    cur = start + len;
  }
  if (cur < text.length) segs.push({ type: "text", content: text.slice(cur) });
  return segs;
}

function FlyingWord({ data, delay }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const dx = data.tx - data.sx;
  const dy = data.ty - data.sy;

  return (
    <span
      className="ps-fly"
      style={{
        left: data.sx,
        top: data.sy,
        transform: active
          ? `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.72)`
          : "translate(-50%, -50%)",
        transitionDelay: `${delay}s`,
      }}
    >
      {data.word}
    </span>
  );
}

// ─────────────────────────────────────────────
// PhotoStage — differentiated by chamber.id
//
// space : iris reveal (unchanged)
// time  : blur dissolve, slower passage phase
// other : iris + cursor gate (stillness required to open)
// ─────────────────────────────────────────────

export default function PhotoStage({ chamber, passageIdx, onBackToList, site }) {
  const [phase,    setPhase]    = useState("passage");
  const [textIn,   setTextIn]   = useState(false);
  const [textOut,  setTextOut]  = useState(false);
  const [irisOpen, setIrisOpen] = useState(false);
  const [anchors,  setAnchors]  = useState([]);
  const [flying,   setFlying]   = useState(null);
  const [lines,    setLines]    = useState(false);

  // Other — cursor gate
  const [clipRadius, setClipRadius] = useState(0);  // 0–72 %
  const clipRadiusRef = useRef(0);
  const mouseSpeedRef = useRef(0);
  const prevMouseRef  = useRef({ x: 0, y: 0, t: 0 });
  const gateRafRef    = useRef(null);
  const gateActiveRef = useRef(false); // true once migration triggered for Other

  const photoRef = useRef(null);
  const kwRefs   = useRef([]);
  const tids     = useRef([]);

  const passage = chamber.passages[passageIdx];
  const cfg     = REVEAL[chamber.id] ?? REVEAL.space;

  const at     = (fn, ms) => { const id = setTimeout(fn, ms); tids.current.push(id); };
  const clearT = () => { tids.current.forEach(clearTimeout); tids.current = []; };

  // ── Anchor positions
  const getAnchors = useCallback(() => {
    const el = photoRef.current;
    if (!el || !passage?.anchors?.length) return null;
    const r   = el.getBoundingClientRect();
    const natW = el.naturalWidth  || r.width;
    const natH = el.naturalHeight || r.height;
    const sc  = Math.min(r.width / natW, r.height / natH);
    const iw  = natW * sc;
    const ih  = natH * sc;
    const ix  = r.left + (r.width  - iw) / 2;
    const iy  = r.top  + (r.height - ih) / 2;
    const cx  = ix + iw / 2;
    const cy  = iy + ih / 2;
    const rx  = iw / 2 + ORBIT_PAD_X;
    const ry  = ih / 2 + ORBIT_PAD_Y;
    const n   = passage.anchors.length;
    return passage.anchors.map((a, i) => ({
      ...a,
      ax: ix + (a.px / 100) * iw,
      ay: iy + (a.py / 100) * ih,
      wx: cx + rx * Math.cos((i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6),
      wy: cy + ry * Math.sin((i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6),
    }));
  }, [passage]);

  // ── Migration (passage → photo phase) — shared core
  const triggerMigration = useCallback(() => {
    if (phase !== "passage") return;
    clearT();
    setTextOut(true);
    const computed = getAnchors();
    if (computed) {
      setAnchors(computed);
      setFlying(
        passage.anchors.map((a, i) => {
          const rc = kwRefs.current[i]?.getBoundingClientRect();
          return {
            word: a.word,
            sx: rc ? rc.left + rc.width  / 2 : window.innerWidth  / 2,
            sy: rc ? rc.top  + rc.height / 2 : window.innerHeight / 2,
            tx: computed[i].wx,
            ty: computed[i].wy,
          };
        })
      );
    }

    if (cfg.useCursorGate) {
      // Other — don't open iris here; the gate RAF drives clipRadius
      gateActiveRef.current = true;
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => setIrisOpen(true)));
    }

    at(() => { setPhase("photo"); setLines(true); setFlying(null); }, 1800);
  }, [phase, passage, getAnchors, cfg]);

  // ── Other — cursor gate RAF
  //    Runs only in photo phase for The Other.
  //    Tracks mouse speed; slow/still → open, fast → close.
  useEffect(() => {
    if (chamber.id !== "other") return;

    const onMove = (e) => {
      const now  = performance.now();
      const prev = prevMouseRef.current;
      const dt   = now - prev.t;
      if (dt > 0 && dt < 200) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        mouseSpeedRef.current = Math.sqrt(dx * dx + dy * dy) / dt * 16;
      }
      prevMouseRef.current = { x: e.clientX, y: e.clientY, t: now };
    };
    window.addEventListener("mousemove", onMove);

    const loop = () => {
      if (gateActiveRef.current) {
        const speed   = mouseSpeedRef.current;
        const isStill = speed < cfg.speedThreshold;
        const current = clipRadiusRef.current;
        const target  = isStill ? cfg.maxRadius : cfg.minRadius;
        const rate    = isStill ? cfg.openRate  : cfg.retreatRate;
        const next    = current + (target - current) * rate;
        clipRadiusRef.current = next;
        setClipRadius(next);
        // Decay speed
        mouseSpeedRef.current *= 0.88;
      }
      gateRafRef.current = requestAnimationFrame(loop);
    };
    gateRafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (gateRafRef.current) cancelAnimationFrame(gateRafRef.current);
    };
  }, [chamber.id, cfg]);

  // ── Main timeline
  useEffect(() => {
    clearT();
    kwRefs.current = [];
    setPhase("passage");
    setTextIn(false); setTextOut(false);
    setIrisOpen(false); setAnchors([]);
    setFlying(null); setLines(false);
    clipRadiusRef.current = 0;
    setClipRadius(0);
    gateActiveRef.current = false;

    new Image().src = passage.src;
    at(() => setTextIn(true), 80);
    return clearT;
  }, [passage]);

  // ── Resize
  useEffect(() => {
    const handler = () => {
      if (phase === "photo") {
        const c = getAnchors();
        if (c) setAnchors(c);
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [phase, getAnchors]);

  // ── Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onBackToList();
      if (e.key === " " || e.key === "Enter") triggerMigration();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBackToList, triggerMigration]);

  if (!passage) return null;

  const segs = parseText(passage.full, passage.anchors);

  // ── Compute photo style based on chamber mode
  const photoStyle = (() => {
    if (cfg.useCursorGate) {
      // Other — clip driven by gate RAF, filter driven by irisOpen state
      // We use clipRadius state (0–72) for the circle
      const r = Math.max(0, Math.min(cfg.maxRadius, clipRadius));
      return {
        clipPath:   `circle(${r.toFixed(2)}% at 50% 50%)`,
        filter:     gateActiveRef.current
          ? cfg.filterOpen
          : cfg.filterIn,
        transition: `filter ${cfg.filterTiming}`,
        // No CSS transition on clip-path for Other — JS drives it
      };
    }

    if (cfg.useBlur) {
      // Time — no clip-path change, only filter transition
      return {
        clipPath:   cfg.clipOpen,
        filter:     irisOpen ? cfg.filterOpen : cfg.filterIn,
        transition: `filter ${cfg.filterTiming}`,
      };
    }

    // Space (default) — clip-path iris + filter
    return {
      clipPath:   irisOpen ? cfg.clipOpen : cfg.clipIn,
      filter:     irisOpen ? cfg.filterOpen : cfg.filterIn,
      transition: `clip-path ${cfg.clipTiming}, filter ${cfg.filterTiming}`,
    };
  })();

  // ── Hint text for passage phase — varies by chamber
  const hintText = {
    space: "click anywhere to reveal",
    time:  "stay with it — click when ready",
    other: "move slowly — stillness will open it",
  }[chamber.id] ?? "click anywhere to reveal";

  // ── Other: after migration, show stillness cue
  const showStillnessCue = cfg.useCursorGate && phase === "photo" && clipRadius < 20;

  return (
    <div className="photo-stage">

      {/* ── Photo */}
      <img
        ref={photoRef}
        src={passage.src}
        alt={passage.alt}
        className={`photo-stage__photo photo-stage__photo--chamber-${chamber.id}`}
        style={photoStyle}
      />

      {/* ── Other — stillness cue */}
      {showStillnessCue && (
        <p className="ps-stillness-cue" aria-live="polite">
          be still
        </p>
      )}

      {/* ── Passage reading overlay */}
      {phase === "passage" && (
        <div
          className={`ps-reading ${textOut ? "ps-reading--out" : ""} ps-reading--${chamber.id}`}
          onClick={triggerMigration}
          style={{ pointerEvents: textIn ? "auto" : "none", cursor: "none" }}
        >
          <div className={`ps-reading__body ${textIn ? "ps-reading__body--in" : ""}`}>
            <p className="ps-reading__text">
              &ldquo;
              {segs.map((s, i) =>
                s.type === "kw" ? (
                  <span
                    key={i}
                    className="ps-kw"
                    ref={(el) => { kwRefs.current[s.anchorIdx] = el; }}
                  >
                    {s.content}
                  </span>
                ) : (
                  <span key={i}>{s.content}</span>
                )
              )}
              &rdquo;
            </p>
            <span
              className="ps-reading__source"
              data-hint={hintText}
            >
              {passage.source}
            </span>
          </div>
        </div>
      )}

      {/* ── Flying keywords */}
      {flying?.map((fw, i) => (
        <FlyingWord key={i} data={fw} delay={i * 0.18} />
      ))}

      {/* ── SVG lines — photo phase */}
      {lines && anchors.length > 0 && (
        <svg className="photo-stage__svg" aria-hidden="true">
          {anchors.map((a, i) => (
            <line
              key={i}
              x1={a.wx} y1={a.wy}
              x2={a.ax} y2={a.ay}
              className="photo-stage__line"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </svg>
      )}

      {/* ── Dots — photo phase */}
      {lines && anchors.map((a, i) => (
        <div
          key={i}
          className="photo-stage__dot"
          style={{ left: a.ax, top: a.ay, animationDelay: `${i * 0.35}s` }}
          aria-hidden="true"
        />
      ))}

      {/* ── Anchor labels — photo phase */}
      {phase === "photo" && anchors.map((a, i) => (
        <div
          key={i}
          className="photo-stage__anchor"
          style={{ left: a.wx, top: a.wy, animationDelay: `${i * 0.18}s` }}
          aria-hidden="true"
        >
          <span className="photo-stage__anchor-word">{a.word}</span>
          <span className="photo-stage__anchor-note">{a.note}</span>
        </div>
      ))}

      {/* ── Source caption — photo phase */}
      {phase === "photo" && (
        <div className="photo-stage__quote photo-stage__quote--visible">
          <span className="photo-stage__quote-source">
            {passage.source} — {site.bookTitle}
          </span>
        </div>
      )}

    </div>
  );
}