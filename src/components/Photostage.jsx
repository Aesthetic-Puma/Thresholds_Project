import { useState, useEffect, useRef, useCallback } from "react";
import "./PhotoStage.css";

const ORBIT_PAD_X = 55;
const ORBIT_PAD_Y = 35;

// ─────────────────────────────────────────────
// REVEAL CONFIG — three chambers, three modes
//
// space : iris (clip-path circle) — geometric shutter
// time  : blur dissolve — the memory surfaces, no geometry
// other : iris + cursor-reactive closing — stillness required
//
// anchorMode (v3 — différenciation iserienne) :
//   drift    : Space  — ancres en marge négative, sans flèche, dérive lente
//   temporal : Time   — arrivée séquentielle, une à une, position thirds
//   flee     : Other  — ancres qui fuient, émergence au repos uniquement
// ─────────────────────────────────────────────
const REVEAL = {
  space: {
    useIris:       true,
    useBlur:       false,
    useCursorGate: false,
    filterIn:      "brightness(4) sepia(0.85) contrast(0.45)",
    filterOpen:    "brightness(1) sepia(0)    contrast(1)",
    clipIn:        "circle(0%  at 50% 50%)",
    clipOpen:      "circle(72% at 50% 50%)",
    clipTiming:    "1.2s cubic-bezier(0.4, 0, 0.2, 1)",
    filterTiming:  "2.8s cubic-bezier(0.55, 0, 0.15, 1)",
    hintDelay:     1800,
    // Anchor — drift (Space)
    anchorMode:        "drift",
    anchorPadX:        160,    // marge négative — éloigne du bord image
    anchorPadY:        90,
    anchorOpacityRest: 0.55,
    anchorOpacityHover:0.85,
    anchorDriftAmp:    11,     // px d'amplitude de dérive
    anchorDriftSpeed:  0.22,
    anchorParallax:    0.04,   // suit le pan, en sens inverse
  },
  time: {
    useIris:       false,
    useBlur:       true,
    useCursorGate: false,
    filterIn:      "brightness(0.25) blur(14px) sepia(0.22) contrast(0.9)",
    filterOpen:    "brightness(1)    blur(0px)  sepia(0)    contrast(1)",
    clipIn:        "circle(100% at 50% 50%)",
    clipOpen:      "circle(100% at 50% 50%)",
    clipTiming:    "0s",
    filterTiming:  "3.8s cubic-bezier(0.55, 0, 0.10, 1)",
    hintDelay:     2800,
    // Anchor — temporal (Time)
    anchorMode:         "temporal",
    anchorInMs:         700,
    anchorOutMs:        1400,
    anchorHoldMs:       [1500, 1800, 1600, 1900, 1400, 1700], // cadence resserrée
    anchorLoopPauseMs:  3200,
    anchorTrailOpacity: 0.18,  // résidu après passage du mot
  },
  other: {
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
    speedThreshold: 2.2,
    retreatRate:    0.038,
    openRate:       0.006,
    minRadius:      0,
    maxRadius:      72,
    // Anchor — flee (Other)
    anchorMode:         "flee",
    fleeRadius:         220,
    fleeForce:          1.2,
    fleeDecay:          0.88,
    fleeSpring:         0.005,
    stillSpeedMax:      1.6,
    emergenceRadius:    500,   // < cette distance, le mot le plus proche peut émerger
    maskRadiusPx:       140,   // taille du "creux" dans la photo
    maskDimMax:         0.55,  // assombrissement max autour du mot
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
// ANCHOR LAYER — three sub-modes, no SVG lines, no dots
// ─────────────────────────────────────────────

function AnchorsDrift({ anchors, cfg }) {
  // Space — ancres en marge négative, dérive lente + parallax léger.
  // Aucune ligne, aucun point sur l'image : la connexion reste à produire.
  const rafRef    = useRef(null);
  const mouseRef  = useRef({ x: 0, y: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth  - 0.5) * 2; // -1 … 1
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    const loop = (now) => {
      setTick(now / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {anchors.map((a, i) => {
        const phase = i * 1.4;
        const t     = tick * cfg.anchorDriftSpeed;
        const dx    = Math.cos(t + phase) * cfg.anchorDriftAmp
                    - mouseRef.current.x * 18;
        const dy    = Math.sin(t * 1.3 + phase) * (cfg.anchorDriftAmp * 0.75)
                    - mouseRef.current.y * 14;
        return (
          <div
            key={i}
            className="ps-anchor ps-anchor--drift"
            style={{
              left:  a.wx + dx,
              top:   a.wy + dy,
              opacity: cfg.anchorOpacityRest,
              animationDelay: `${i * 0.22}s`,
            }}
            aria-hidden="true"
          >
            <span className="ps-anchor__word">{a.word}</span>
          </div>
        );
      })}
    </>
  );
}

function AnchorsTemporal({ anchors, photoRef, cfg, onTranscendent }) {
  // Time — arrivée séquentielle aux points des tiers, un mot à la fois.
  // Cadence irrégulière. Le dernier mot laisse une trace très faible.
  //
  // P.3 — État transcendantal (position iserienne du lecteur) :
  //   Après le premier cycle complet, tous les mots passent simultanément en
  //   trail (faibles) pendant 3 s. Le parent affiche le fragment textuel seul.
  //   Le visiteur relit avec ce qu'il a construit. Cycles suivants : inchangés.
  const [thirds,    setThirds]    = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [phase,     setPhase]     = useState("idle"); // 'idle' | 'in' | 'hold' | 'out'
  const [transcendent, setTranscendent] = useState(false);
  const firstCycleRef = useRef(true);

  // Ref interne au callback parent : évite que le useEffect de scheduling
  // se relance à chaque render du parent (l'arrow inline change d'identité).
  const onTranscendentRef = useRef(onTranscendent);
  useEffect(() => { onTranscendentRef.current = onTranscendent; }, [onTranscendent]);

  const computeThirds = useCallback(() => {
    const el = photoRef.current;
    if (!el || !anchors.length) return;
    const r    = el.getBoundingClientRect();
    const natW = el.naturalWidth  || r.width;
    const natH = el.naturalHeight || r.height;
    const sc   = Math.min(r.width / natW, r.height / natH);
    const iw   = natW * sc;
    const ih   = natH * sc;
    const ix   = r.left + (r.width  - iw) / 2;
    const iy   = r.top  + (r.height - ih) / 2;
    // Quatre points de tiers + un point central (pour > 4 mots si besoin)
    const pts = [
      { x: ix + iw * 0.33, y: iy + ih * 0.36 },
      { x: ix + iw * 0.66, y: iy + ih * 0.34 },
      { x: ix + iw * 0.36, y: iy + ih * 0.68 },
      { x: ix + iw * 0.68, y: iy + ih * 0.66 },
      { x: ix + iw * 0.50, y: iy + ih * 0.50 },
    ];
    setThirds(anchors.map((_, i) => pts[i % pts.length]));
  }, [anchors, photoRef]);

  useEffect(() => {
    computeThirds();
    window.addEventListener("resize", computeThirds);
    return () => window.removeEventListener("resize", computeThirds);
  }, [computeThirds]);

  // Reset cycle state quand le passage change
  useEffect(() => {
    firstCycleRef.current = true;
    setTranscendent(false);
    onTranscendentRef.current?.(false);
  }, [anchors]);

  useEffect(() => {
    if (!anchors.length) return;
    let cancelled = false;
    let i = 0;
    const tids = [];
    const sched = (fn, ms) => {
      const id = setTimeout(fn, ms);
      tids.push(id);
    };

    const step = () => {
      if (cancelled) return;
      setActiveIdx(i);
      setPhase("in");
      sched(() => {
        if (cancelled) return;
        setPhase("hold");
        sched(() => {
          if (cancelled) return;
          setPhase("out");
          sched(() => {
            if (cancelled) return;
            i = i + 1;
            if (i >= anchors.length) {
              if (firstCycleRef.current) {
                // ─── ÉTAT TRANSCENDANTAL ───
                // Premier cycle fini : tous les mots passent en trail,
                // le fragment seul revient à l'écran via le parent.
                firstCycleRef.current = false;
                setTranscendent(true);
                onTranscendentRef.current?.(true);
                sched(() => {
                  if (cancelled) return;
                  setTranscendent(false);
                  onTranscendentRef.current?.(false);
                  i = 0;
                  sched(step, 400);
                }, 3000);
              } else {
                // Cycles suivants — boucle directe, comportement inchangé
                i = 0;
                sched(step, cfg.anchorLoopPauseMs);
              }
            } else {
              sched(step, 240);
            }
          }, cfg.anchorOutMs);
        }, cfg.anchorHoldMs[i % cfg.anchorHoldMs.length]);
      }, cfg.anchorInMs);
    };
    // Léger délai initial après l'iris
    sched(step, 600);

    return () => {
      cancelled = true;
      tids.forEach(clearTimeout);
    };
  }, [anchors, cfg]);

  if (!thirds.length) return null;

  return (
    <>
      {anchors.map((a, i) => {
        const pos = thirds[i];
        if (!pos) return null;
        const isActive = i === activeIdx;
        const cls = transcendent
          ? "ps-anchor--temporal-trail"
          : (isActive
              ? `ps-anchor--temporal-${phase}`
              : (i < activeIdx ? "ps-anchor--temporal-trail" : "ps-anchor--temporal-idle"));
        const w = a.weight ?? 1;
        return (
          <div
            key={i}
            className={`ps-anchor ps-anchor--temporal ${cls}`}
            style={{
              left: pos.x,
              top:  pos.y,
              // Trail pondéré : les mots-image laissent plus de sédiment
              "--trail-opacity": (cfg.anchorTrailOpacity * w).toFixed(3),
              "--trail-blur":    `${(2 + (1 - w) * 2).toFixed(2)}px`,
              "--hold-opacity":  (0.95 - (1 - w) * 0.15).toFixed(3),
            }}
            aria-hidden="true"
          >
            <span className="ps-anchor__word">{a.word}</span>
          </div>
        );
      })}
    </>
  );
}

function AnchorsFlee({ anchors, photoRef, cfg }) {
  // The Other — ancres avec physique de fuite (même grammaire que FloatingPassages).
  // Au repos, seul le mot le plus proche émerge. La photo se creuse autour de lui.
  const stateRef  = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0, speed: 0, prevT: 0, prevX: 0, prevY: 0 });
  const rafRef    = useRef(null);
  const nodesRef  = useRef([]);   // refs DOM des ancres
  const maskedImg = useRef(null);
  const [ready, setReady] = useState(false);

  // Init physics
  useEffect(() => {
    if (!anchors.length) return;
    stateRef.current = anchors.map((a) => ({
      hx: a.wx, hy: a.wy,
      x:  a.wx, y:  a.wy,
      vx: 0,    vy: 0,
      opacity: 0,
    }));
    maskedImg.current = photoRef.current;
    setReady(true);
    return () => {
      // Nettoyer le mask au démontage
      if (maskedImg.current) {
        maskedImg.current.style.maskImage = "";
        maskedImg.current.style.webkitMaskImage = "";
      }
    };
  }, [anchors, photoRef]);

  useEffect(() => {
    const onMove = (e) => {
      const c   = cursorRef.current;
      const now = performance.now();
      const dt  = now - c.prevT;
      if (dt > 0 && dt < 200) {
        const dx = e.clientX - c.prevX;
        const dy = e.clientY - c.prevY;
        c.speed = Math.sqrt(dx * dx + dy * dy) / dt * 16;
      }
      c.prevX = c.x;     c.prevY = c.y;     c.prevT = now;
      c.x     = e.clientX; c.y   = e.clientY;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const loop = () => {
      const c       = cursorRef.current;
      const state   = stateRef.current;
      if (!state) { rafRef.current = requestAnimationFrame(loop); return; }
      const isStill = c.speed < cfg.stillSpeedMax;

      // Trouve le plus proche
      let closestIdx = -1;
      let closestD   = Infinity;
      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        const d = Math.hypot(s.x - c.x, s.y - c.y);
        if (d < closestD) { closestD = d; closestIdx = i; }
      }

      for (let i = 0; i < state.length; i++) {
        const s    = state[i];
        const dx   = s.x - c.x;
        const dy   = s.y - c.y;
        const dist = Math.hypot(dx, dy);

        // Force de fuite
        if (dist < cfg.fleeRadius && dist > 0.01) {
          const strength = ((cfg.fleeRadius - dist) / cfg.fleeRadius) * cfg.fleeForce;
          s.vx += (dx / dist) * strength;
          s.vy += (dy / dist) * strength;
        }
        // Rappel vers la maison
        s.vx += (s.hx - s.x) * cfg.fleeSpring;
        s.vy += (s.hy - s.y) * cfg.fleeSpring;
        // Friction
        s.vx *= cfg.fleeDecay;
        s.vy *= cfg.fleeDecay;
        s.x  += s.vx;
        s.y  += s.vy;

        // Opacité : émerge si (repos ET le plus proche ET dans le rayon d'émergence)
        const isClosest    = i === closestIdx;
        const inRange      = closestD < cfg.emergenceRadius;
        const targetOp     = (isStill && isClosest && inRange) ? 1 : 0.06;
        s.opacity += (targetOp - s.opacity) * 0.05;

        // Écriture DOM directe (perf)
        const node = nodesRef.current[i];
        if (node) {
          node.style.transform = `translate(-50%, -50%) translate3d(${s.x}px, ${s.y}px, 0)`;
          node.style.opacity   = s.opacity.toFixed(3);
        }
      }
      // Décroissance de la vitesse curseur
      c.speed *= 0.88;

      // Mask de la photo : creuse autour du mot émergent
      const img = maskedImg.current;
      const emerge = closestIdx >= 0 ? state[closestIdx] : null;
      if (img && emerge && emerge.opacity > 0.25) {
        const r  = img.getBoundingClientRect();
        const lx = ((emerge.x - r.left) / r.width)  * 100;
        const ly = ((emerge.y - r.top)  / r.height) * 100;
        const dim = emerge.opacity * cfg.maskDimMax;
        const m  =
          `radial-gradient(${cfg.maskRadiusPx}px at ${lx}% ${ly}%, ` +
          `rgba(0,0,0,${(1 - dim).toFixed(3)}) 0%, ` +
          `rgba(0,0,0,1) 70%)`;
        img.style.maskImage        = m;
        img.style.webkitMaskImage  = m;
      } else if (img) {
        img.style.maskImage        = "";
        img.style.webkitMaskImage  = "";
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, cfg]);

  if (!anchors.length) return null;

  return (
    <>
      {anchors.map((a, i) => (
        <div
          key={i}
          ref={(el) => { nodesRef.current[i] = el; }}
          className="ps-anchor ps-anchor--flee"
          style={{
            left: 0, top: 0,
            transform: `translate(-50%, -50%) translate3d(${a.wx}px, ${a.wy}px, 0)`,
            opacity: 0,
          }}
          aria-hidden="true"
        >
          <span className="ps-anchor__word">{a.word}</span>
        </div>
      ))}
    </>
  );
}

function AnchorLayer({ anchors, photoRef, cfg, onTranscendent }) {
  if (!anchors?.length) return null;
  const mode = cfg.anchorMode;
  if (mode === "drift")    return <AnchorsDrift    anchors={anchors} cfg={cfg} />;
  if (mode === "temporal") return <AnchorsTemporal anchors={anchors} photoRef={photoRef} cfg={cfg} onTranscendent={onTranscendent} />;
  if (mode === "flee")     return <AnchorsFlee     anchors={anchors} photoRef={photoRef} cfg={cfg} />;
  return null;
}

// ─────────────────────────────────────────────
// PhotoStage — differentiated by chamber.id
// ─────────────────────────────────────────────

export default function PhotoStage({ chamber, passageIdx, onBackToList, site }) {
  const [phase,    setPhase]    = useState("passage");
  const [textIn,   setTextIn]   = useState(false);
  const [textOut,  setTextOut]  = useState(false);
  const [irisOpen, setIrisOpen] = useState(false);
  const [anchors,  setAnchors]  = useState([]);
  const [flying,   setFlying]   = useState(null);
  const [lines,    setLines]    = useState(false);

  // P.3 — État transcendantal (remonté par AnchorsTemporal après 1er cycle).
  //       Quand true : la couche d'ancres reste montée (tous mots en trail)
  //       et un overlay affiche le fragment complet, sans mots-clés soulignés.
  const [transcendentActive, setTranscendentActive] = useState(false);

  // Other — cursor gate
  const [clipRadius, setClipRadius] = useState(0);
  const clipRadiusRef = useRef(0);
  const mouseSpeedRef = useRef(0);
  const prevMouseRef  = useRef({ x: 0, y: 0, t: 0 });
  const gateRafRef    = useRef(null);
  const gateActiveRef = useRef(false);

  const photoRef = useRef(null);
  const kwRefs   = useRef([]);
  const tids     = useRef([]);

  const passage = chamber.passages[passageIdx];
  const cfg     = REVEAL[chamber.id] ?? REVEAL.space;

  const at     = (fn, ms) => { const id = setTimeout(fn, ms); tids.current.push(id); };
  const clearT = () => { tids.current.forEach(clearTimeout); tids.current = []; };

  // ── Anchor landing positions
  //    Pour Space, on élargit le pad pour pousser les ancres dans la marge négative.
  //    Pour Time/Other, on garde le pad orbital standard.
  const getAnchors = useCallback(() => {
    const el = photoRef.current;
    if (!el || !passage?.anchors?.length) return null;
    const padX = cfg.anchorMode === "drift" ? cfg.anchorPadX : ORBIT_PAD_X;
    const padY = cfg.anchorMode === "drift" ? cfg.anchorPadY : ORBIT_PAD_Y;
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
    const rx  = iw / 2 + padX;
    const ry  = ih / 2 + padY;
    const n   = passage.anchors.length;
    return passage.anchors.map((a, i) => ({
      ...a,
      ax: ix + (a.px / 100) * iw,
      ay: iy + (a.py / 100) * ih,
      wx: cx + rx * Math.cos((i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6),
      wy: cy + ry * Math.sin((i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6),
    }));
  }, [passage, cfg]);

  // ── Migration (passage → photo phase)
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
      gateActiveRef.current = true;
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => setIrisOpen(true)));
    }

    at(() => { setPhase("photo"); setLines(true); setFlying(null); }, 1800);
  }, [phase, passage, getAnchors, cfg]);

  // ── Other — cursor gate RAF
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
    setTranscendentActive(false);   // reset l'état transcendantal au changement de passage
    clipRadiusRef.current = 0;
    setClipRadius(0);
    gateActiveRef.current = false;

    // Reset photo mask (Other résiduel)
    if (photoRef.current) {
      photoRef.current.style.maskImage = "";
      photoRef.current.style.webkitMaskImage = "";
    }

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
      if ((e.key === " " || e.key === "Enter") && phase === "passage") {
        triggerMigration();
      }
      // Time uniquement : re-déclencher l'état transcendantal (geste pratiqué)
      if (chamber.id === "time" && phase === "photo" &&
          (e.key === " " || e.key === "t" || e.key === "T")) {
        e.preventDefault();
        setTranscendentActive(true);
        setTimeout(() => setTranscendentActive(false), 3200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBackToList, triggerMigration, chamber.id, phase]);

  if (!passage) return null;

  const segs = parseText(passage.full, passage.anchors);

  // ── Photo style — par mode
  const photoStyle = (() => {
    if (cfg.useCursorGate) {
      const r = Math.max(0, Math.min(cfg.maxRadius, clipRadius));
      return {
        clipPath:   `circle(${r.toFixed(2)}% at 50% 50%)`,
        filter:     gateActiveRef.current ? cfg.filterOpen : cfg.filterIn,
        transition: `filter ${cfg.filterTiming}`,
      };
    }
    if (cfg.useBlur) {
      return {
        clipPath:   cfg.clipOpen,
        filter:     irisOpen ? cfg.filterOpen : cfg.filterIn,
        transition: `filter ${cfg.filterTiming}`,
      };
    }
    return {
      clipPath:   irisOpen ? cfg.clipOpen : cfg.clipIn,
      filter:     irisOpen ? cfg.filterOpen : cfg.filterIn,
      transition: `clip-path ${cfg.clipTiming}, filter ${cfg.filterTiming}`,
    };
  })();

  const hintText = {
    space: "click anywhere to reveal",
    time:  "stay with it — click when ready",
    other: "move slowly — stillness will open it",
  }[chamber.id] ?? "click anywhere to reveal";

  const showStillnessCue = cfg.useCursorGate && phase === "photo" && clipRadius < 20;

  return (
    <div className={`photo-stage photo-stage--anchor-${cfg.anchorMode}`}>

      {/* Photo */}
      <img
        ref={photoRef}
        src={passage.src}
        alt={passage.alt}
        className={`photo-stage__photo photo-stage__photo--chamber-${chamber.id}`}
        style={photoStyle}
      />

      {/* Stillness cue (Other) */}
      {showStillnessCue && (
        <p className="ps-stillness-cue" aria-live="polite">
          be still
        </p>
      )}

      {/* Reading overlay */}
      {phase === "passage" && (
        <div
          className={`ps-reading ${textOut ? "ps-reading--out" : ""} ps-reading--${chamber.id}`}
          onClick={triggerMigration}
          style={{ pointerEvents: (textIn && !textOut) ? "auto" : "none", cursor: "none" }}
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

      {/* Flying keywords (transition) */}
      {flying?.map((fw, i) => (
        <FlyingWord key={i} data={fw} delay={i * 0.18} />
      ))}

      {/* ─────────────────────────────────────────
          ANCHOR LAYER — différenciée par chambre
          ─────────────────────────────────────── */}
      {phase === "photo" && lines && (
        <AnchorLayer
          chamberId={chamber.id}
          anchors={anchors}
          photoRef={photoRef}
          cfg={cfg}
          onTranscendent={setTranscendentActive}
        />
      )}

      {/* P.3 — État transcendantal (Time uniquement, porté par AnchorsTemporal) :
          le fragment complet revient seul, sans mots-clés soulignés,
          pendant que toutes les ancres sont en trail. */}
      {phase === "photo" && transcendentActive && (
        <div className="ps-transcendent" aria-hidden="true">
          <p className="ps-transcendent__text">
            &ldquo;{passage.full}&rdquo;
          </p>
        </div>
      )}

      {/* Source caption */}
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
