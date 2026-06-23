import { useEffect, useRef, useCallback, useState } from "react";
import "./FloatingPassages.css";

// ── Float tuning — standard chambers
const FLOAT_SPEED_MIN  = 0.00012;
const FLOAT_SPEED_MAX  = 0.00013;
const FLOAT_AMP_X_MIN  = 2.5;
const FLOAT_AMP_X_MAX  = 5.5;
const FLOAT_AMP_Y_MIN  = 1.5;
const FLOAT_AMP_Y_MAX  = 4;
const ITEM_WIDTH       = 300;
const MARGIN           = 80;

// ── Space chamber — panning canvas
const SPACE_MAX_PAN   = 0.68;  // × vw — amplitude horizontale
const SPACE_MAX_PAN_Y = 0.46;  // × vh — amplitude verticale

// ── Space chamber — drift-decay (P.1 — blancs iseriens)
//    Chaque passage a une fraîcheur (0…1) qui décroit à mesure qu'il quitte
//    le centre du viewport. Sous seuil, les tokens listés dans `passage.blanks`
//    deviennent transparents (avec un cadratin résiduel). Au retour au centre,
//    ils réapparaissent, plus lentement — c'est le geste du "se souvenir".
//    Le chemin de pan du visiteur écrit le texte.
const SPACE_FRESH_RADIUS      = 700;   // px — frontière franche, décay actif dès la marge
const SPACE_FRESH_LERP        = 0.012; // décroissance lente — le texte ne flicker pas
const SPACE_LOST_THRESHOLD    = 0.30;  // < ce seuil → tokens lost
const SPACE_RESTORE_THRESHOLD = 0.55;  // > ce seuil → tokens restorés (hystérésis)
const SPACE_REMEMBER_MS       = 1800;  // durée de la transition lente à la restauration

// ── Time chamber — stratigraphie : axe Y = âge.
//    Top = surface (frais), bas = sédiment (ancien).
//    L'ordre source dans chambers.js ne décide plus du placement —
//    TIME_NATURAL_AGES le fait. Chaque item expose une `depth` (0…1)
//    consommée par le rendu pour cumuler les signaux d'âge.
const getTimeLayout = (passages) => {
  const indexed = passages.map((_, i) => ({
    i,
    age: TIME_NATURAL_AGES[i] ?? 0,
  }));
  indexed.sort((a, b) => a.age - b.age || a.i - b.i);

  const TIME_COLS = 2;
  const totalRows = Math.ceil(passages.length / TIME_COLS);

  return passages.map((_, originalIdx) => {
    const stratPos = indexed.findIndex((x) => x.i === originalIdx);
    const col      = stratPos % TIME_COLS;
    const row      = Math.floor(stratPos / TIME_COLS);
    return {
      col,
      row,
      totalRows,
      depth: totalRows > 1 ? row / (totalRows - 1) : 0,
    };
  });
};

// ── Time chamber — voix centrale, cycle toutes les 7.6s
const TIME_VOICE = [
  "stories take time",
  "some passages remember less",
  "do not click yet",
  "wait — it surfaces",
];

// ── Space chamber — voix centrale, cycle toutes les 8.4s
const SPACE_VOICE = [
  "the canvas exceeds you",
  "the path writes the words",
  "what you pass leaves a trace",
  "drift — do not aim",
];

// ── Other chamber — voix centrale, cycle toutes les 9s
const OTHER_VOICE = [
  "presence is the threshold",
  "do not aim",
  "wait — it returns",
  "the gaze answers stillness",
];

// ── Other chamber — intimité cumulée
const INTIMACY_FULL_MS = 180000; // ~3 min de stillness cumulée → confiance pleine

// ── Other chamber — anchors au centre, échos en orbite radiale
const getOtherLayout = (passages) => {
  let anchorIdx = 0, echoIdx = 0;
  const echoCount = passages.filter((p) => !p.anchor).length;
  return passages.map((p) => {
    if (p.anchor) return { type: "anchor", ai: anchorIdx++ };
    const baseAngle = (echoIdx / echoCount) * Math.PI * 2 - Math.PI / 4;
    return { type: "echo", baseAngle, ei: echoIdx++ };
  });
};

// ── Time chamber — stratigraphie des âges (signal : flou, pas opacité)
// Layout post-reorder : écho·01(0px), écho·02(0px) | ancre·03(1.8px), ancre·04(1.8px) | écho·05(3.5px), écho·06(3.5px)
const TIME_NATURAL_AGES  = [0, 0, 1, 1, 2, 2];
const TIME_BASE_BLUR     = [0, 1.8, 3.5, 5.5];   // px — flou par niveau d'âge (0→3)
const TIME_OPACITY_REST  = 0.82;                    // opacité uniforme — le flou porte le temps
const TIME_FULL_BLUR     = 0;                       // hover : mémoire nette
const TIME_FULL_OPACITY  = 0.95;
const TIME_LERP_ENTRANCE = 0.038;  // résolution rapide du flou d'entrée
const TIME_LERP_REVEAL   = 0.008;  // mise au point lente au survol
const TIME_LERP_AGE      = 0.020;  // retour au flou mémoriel
const TIME_FLOAT_SCALE   = 0.55;
const LS_TIME_KEY        = "thresholds-time-visits-v2";

// Stable ID per passage — keyed on filename, not array index.
// This ensures visit counts survive passage reordering.
const passageId = (p) => p.src.split("/").pop().replace(/\.\w+$/, "");

// ── Other chamber — impatience punie, stillness récompensée
const OTHER_SPEED_THRESHOLD  = 1.8;   // seuil bas — la moindre hâte déclenche la fuite
const OTHER_SPEED_DECAY      = 0.88;  // décroissance de vitesse par frame
const OTHER_RETREAT_FORCE    = 1.2;   // impulsion forte — fuite nettement visible
const OTHER_RETREAT_MAX      = 280;   // px — distance de fuite maximale
const OTHER_TARGET_DECAY     = 0.96;  // décroissance lente — les impulsions s'accumulent
const OTHER_CURRENT_LERP     = 0.12;  // suivi de la cible
const OTHER_INFLUENCE_RADIUS = 500;   // px — rayon d'influence du curseur
const OTHER_OPACITY_REST     = 0.72;
const OTHER_OPACITY_MIN      = 0.03;
const OTHER_STILL_MS         = 1300;
const OTHER_ANNOTATE_RADIUS  = 260;
const OTHER_ANNOT_LERP       = 0.007;

// ─────────────────────────────────────────────
// Tokenize a passage `short` into <span class="fp-token">word</span>,
// marking tokens whose 0-based index is in `blanksIdxArr` as `fp-token--blank`.
// Whitespace and punctuation attached to words are preserved.
// ─────────────────────────────────────────────
function tokenizeShort(text, blanksIdxArr) {
  const blanks = new Set(blanksIdxArr || []);
  const parts  = text.split(/(\s+)/);
  let wi        = 0;
  let blankRank = 0;
  let html      = "";
  for (const p of parts) {
    if (p === "") continue;
    if (/^\s+$/.test(p)) {
      html += p;
    } else {
      const isBlank = blanks.has(wi);
      if (isBlank) {
        html += `<span class="fp-token fp-token--blank" data-ti="${wi}" style="--blank-idx:${blankRank}"><span class="fp-word">${p}</span><span class="fp-dash" aria-hidden="true">—</span></span>`;
        blankRank++;
      } else {
        html += `<span class="fp-token" data-ti="${wi}">${p}</span>`;
      }
      wi++;
    }
  }
  return html;
}

// ─────────────────────────────────────────────

export default function FloatingPassages({ chamber, onSelect, visitedSet, enterDir, thresholdActive }) {
  const containerRef    = useRef(null);
  const itemsRef        = useRef([]);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const thresholdRef    = useRef(false);

  // Sync threshold prop → ref (RAF loop l'utilise pour figer pan/freshness/retreat)
  useEffect(() => { thresholdRef.current = !!thresholdActive; }, [thresholdActive]);
  const rafRef          = useRef(null);
  const tRef            = useRef(0);
  const hoveredRef      = useRef(-1);
  const enterDirRef     = useRef(enterDir);
  const mousePosRef     = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: 0 });
  const panRef          = useRef({ current: 0, target: 0, currentY: 0, targetY: 0 });
  const isSpaceRef      = useRef(false);
  const isTimeRef       = useRef(false);
  const isOtherRef      = useRef(false);
  const mouseSpeedRef   = useRef(0);
  const prevMouseRef    = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: 0, t: 0 });
  const lastMoveTimeRef = useRef(0);
  const stillCumMsRef   = useRef(0);  // temps d'immobilité cumulé (ms)
  const intimacyRef     = useRef(0);  // 0 = méfiance, 1 = pleinement reçu

  enterDirRef.current = enterDir;

  // ── Tracking souris — Space (pan) et Other (vitesse)
  useEffect(() => {
    if (chamber.id !== "space" && chamber.id !== "other") return;
    const onMove = (e) => {
      if (chamber.id === "other") {
        const now  = performance.now();
        const prev = prevMouseRef.current;
        const dt   = now - prev.t;
        if (dt > 0 && dt < 200) {
          const dx = e.clientX - prev.x;
          const dy = e.clientY - prev.y;
          mouseSpeedRef.current = Math.sqrt(dx * dx + dy * dy) / dt * 16;
        }
        prevMouseRef.current    = { x: e.clientX, y: e.clientY, t: now };
        lastMoveTimeRef.current = now;
      }
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [chamber.id]);

  // ── Disposition Space : slots fixes sur canvas élargi
  //    Canvas étendu de −0.15 vw à 1.15 vw (hors-champ = découverte par pan).
  //    2 ancres visibles au repos, 4 échos dispersés — 2 off-screen chaque côté.
  //    Séparation minimale garantie : pas d'overlap à aucune valeur de pan.
  const getSpaceLayout = () => [
    { cxR: 0.25, cyR: 0.34, far: false },   // ancre 0  — gauche-centre
    { cxR: 0.62, cyR: 0.61, far: false },   // ancre 1  — droite-centre
    { cxR: -0.13, cyR: 0.54, far: true  },  // écho 0   — hors-champ gauche
    { cxR: 0.44, cyR: 0.20, far: false },   // écho 1   — centre-haut
    { cxR: 1.11, cyR: 0.44, far: true  },   // écho 2   — hors-champ droite
    { cxR: 0.85, cyR: 0.75, far: false },   // écho 3   — droite visible
  ];

  // ── Build items + boucle d'animation
  const build = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    // ── Halo de gravité Space — retiré et recréé à chaque build
    const prevHalo = containerRef.current?.parentElement?.querySelector(".fp-gravity-halo");
    if (prevHalo) prevHalo.remove();
    // Clear any pending remember-timers from a previous build (Space)
    itemsRef.current.forEach((it) => {
      if (it.rememberTimer) clearTimeout(it.rememberTimer);
    });
    itemsRef.current    = [];
    panRef.current      = { current: 0, target: 0, currentY: 0, targetY: 0 };
    mouseSpeedRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const vw      = window.innerWidth;
    const vh      = window.innerHeight;
    const isSpace = chamber.id === "space";
    const isTime  = chamber.id === "time";
    const isOther = chamber.id === "other";
    isSpaceRef.current = isSpace;
    isTimeRef.current  = isTime;
    isOtherRef.current = isOther;

    if (isSpace) {
      const halo = document.createElement("div");
      halo.className = "fp-gravity-halo";
      halo.setAttribute("aria-hidden", "true");
      halo.innerHTML = `
        <div class="fp-gravity-halo__inner"></div>
        <div class="fp-gravity-halo__outer"></div>
      `;
      containerRef.current?.parentElement?.appendChild(halo);
    }

    if (isOther) lastMoveTimeRef.current = performance.now();

    const timeVisits = isTime
      ? JSON.parse(localStorage.getItem(LS_TIME_KEY) || "{}")
      : null;

    const spaceLayout = isSpace ? getSpaceLayout() : null;
    const timeLayout  = isTime  ? getTimeLayout(chamber.passages)  : null;
    const otherLayout = isOther ? getOtherLayout(chamber.passages) : null;

    chamber.passages.forEach((passage, i) => {
      let cx, cy, floatAmpX, floatAmpY, floatSpd, floatSpdY;
      let tDepth = 0; // stratigraphie Time — accessible après la création de el

      if (isSpace) {
        const { cxR, cyR } = spaceLayout[i];
        const jx = (Math.random() - 0.5) * vw * 0.04;
        const jy = (Math.random() - 0.5) * vh * 0.06;
        cx        = vw * cxR + jx;
        cy        = Math.max(MARGIN + 50, Math.min(vh - MARGIN - 50, vh * cyR + jy));
        floatAmpX = 1.5 + Math.random() * 2;
        floatAmpY = FLOAT_AMP_Y_MIN + Math.random() * (FLOAT_AMP_Y_MAX - FLOAT_AMP_Y_MIN);
        floatSpd  = FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN);
        floatSpdY = FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN);

      } else if (isTime) {
        const { col: tCol, row: tRow, totalRows: tRows, depth } = timeLayout[i];
        tDepth = depth;
        const colW  = vw / 2;
        const topY  = vh * 0.12;
        const botY  = vh * 0.88;
        const baseX = tCol * colW + colW / 2;
        const baseY = tRows > 1 ? topY + (tRow / (tRows - 1)) * (botY - topY) : vh / 2;
        // Jitter augmenté en profondeur — le sédiment ne s'aligne pas
        const jitterX = colW * (0.18 + tDepth * 0.20);
        const jitterY = ((botY - topY) / tRows) * (0.30 + tDepth * 0.25);
        const jx = (Math.random() - 0.5) * jitterX;
        const jy = (Math.random() - 0.5) * jitterY;
        cx        = Math.max(MARGIN + ITEM_WIDTH / 2, Math.min(vw - MARGIN - ITEM_WIDTH / 2, baseX + jx));
        cy        = Math.max(MARGIN + 50, Math.min(vh - MARGIN - 50, baseY + jy));
        floatAmpX = (FLOAT_AMP_X_MIN + Math.random() * (FLOAT_AMP_X_MAX - FLOAT_AMP_X_MIN)) * TIME_FLOAT_SCALE;
        floatAmpY = (FLOAT_AMP_Y_MIN + Math.random() * (FLOAT_AMP_Y_MAX - FLOAT_AMP_Y_MIN)) * TIME_FLOAT_SCALE;
        floatSpd  = (FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN)) * 0.62;
        floatSpdY = (FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN)) * 0.62;

      } else {
        const oLayout = otherLayout[i];
        if (oLayout.type === "anchor") {
          const offsetX = oLayout.ai === 0 ? -vw * 0.17 : vw * 0.17;
          const offsetY = oLayout.ai === 0 ? -vh * 0.09 : vh * 0.07;
          cx = vw / 2 + offsetX + (Math.random() - 0.5) * vw * 0.06;
          cy = vh / 2 + offsetY + (Math.random() - 0.5) * vh * 0.05;
        } else {
          const angle  = oLayout.baseAngle + (Math.random() * 0.4 - 0.2);
          const radius = vw * 0.31 + (Math.random() - 0.5) * vw * 0.10;
          cx = vw / 2 + Math.cos(angle) * radius;
          cy = vh / 2 + Math.sin(angle) * radius * 0.62;
        }
        cx        = Math.max(MARGIN + ITEM_WIDTH / 2, Math.min(vw - MARGIN - ITEM_WIDTH / 2, cx));
        cy        = Math.max(MARGIN + 50, Math.min(vh - MARGIN - 50, cy));
        floatAmpX = FLOAT_AMP_X_MIN + Math.random() * (FLOAT_AMP_X_MAX - FLOAT_AMP_X_MIN);
        floatAmpY = FLOAT_AMP_Y_MIN + Math.random() * (FLOAT_AMP_Y_MAX - FLOAT_AMP_Y_MIN);
        floatSpd  = FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN);
        floatSpdY = FLOAT_SPEED_MIN + Math.random() * (FLOAT_SPEED_MAX - FLOAT_SPEED_MIN);
      }

      const floatPhX = Math.random() * Math.PI * 2;
      const floatPhY = Math.random() * Math.PI * 2;

      // ── Âge Time — flou comme signal temporel
      let baseBlur       = 0;
      let currentBlur    = 0;
      let targetBlur     = 0;
      let baseOpacity    = TIME_OPACITY_REST;
      let currentOpacity = 0;
      let targetOpacity  = 0;
      if (isTime) {
        const naturalAge = TIME_NATURAL_AGES[i] ?? 0;
        const visitCount = timeVisits[passageId(passage)] || 0;
        const totalAge   = Math.min(naturalAge + visitCount, TIME_BASE_BLUR.length - 1);
        baseBlur       = TIME_BASE_BLUR[totalAge];
        currentBlur    = 9;   // tous les passages entrent très flous
        targetBlur     = 0;   // sera mis à jour par le timeout d'entrée
        baseOpacity    = TIME_OPACITY_REST;
        currentOpacity = 0;
        targetOpacity  = 0;
      }

      const isAnchor = !!passage.anchor;
      const el = document.createElement("button");
      el.className = `fp-item ${isAnchor ? "fp-item--anchor" : "fp-item--echo"}`;

      if (isSpace && spaceLayout[i].far) el.classList.add("fp-item--far");
      if (!isTime && !isOther && visitedSet?.has(i)) el.classList.add("fp-item--visited");
      if (isOther) el.classList.add("fp-item--ready");

      el.style.left = `${cx}px`;
      el.style.top  = `${cy}px`;

      // Variables CSS de strate (Time uniquement) — consommées par le rendu CSS
      if (isTime) {
        el.style.setProperty("--strat-depth",    tDepth.toFixed(3));
        el.style.setProperty("--strat-scale",    (1 - tDepth * 0.12).toFixed(3));
        el.style.setProperty("--strat-saturate", (1 - tDepth * 0.40).toFixed(3));
      }

      if (isTime || isOther) {
        el.style.opacity    = "0";
        el.style.transition = "none"; // empêche le CSS transition d'interférer avec le lerp JS
      }
      if (isTime) {
        el.style.filter = "blur(9px)"; // état initial — résolue par le rAF
      }

      el.innerHTML = `
        <span class="fp-source">${passage.source}</span>
        <p class="fp-text">${isSpace ? tokenizeShort(passage.short, passage.blanks) : passage.short}</p>
      `;

      // ── Annotation Other
      let annotEl = null;
      if (isOther && passage.anchors?.[0]?.word) {
        annotEl = document.createElement("span");
        annotEl.className = "fp-annotation";
        annotEl.textContent = passage.anchors[0].word;
        annotEl.style.opacity = "0";
        el.appendChild(annotEl);
      }

      // ── Visibilité à l'entrée
      if (isTime) {
        const idx = i;
        setTimeout(() => {
          const it = itemsRef.current.find((x) => x.idx === idx);
          if (it) {
            it.targetOpacity = it.baseOpacity;
            it.targetBlur    = it.baseBlur;   // résolution vers l'âge de repos
          }
        }, 280 + i * 200);
      } else if (isOther) {
        const idx = i;
        setTimeout(() => {
          const it = itemsRef.current.find((x) => x.idx === idx);
          if (it) it.otherActive = true;
        }, 200 + i * 110);
      } else if (enterDirRef.current) {
        el.classList.add("fp-item--visible");
      } else {
        setTimeout(() => el.classList.add("fp-item--visible"), 200 + i * 110);
      }

      // ── Hover
      el.addEventListener("mouseenter", () => {
        hoveredRef.current = i;

        if (isTime) {
          const it = itemsRef.current.find((x) => x.idx === i);
          if (it) {
            it.targetOpacity = TIME_FULL_OPACITY;
            it.targetBlur    = TIME_FULL_BLUR;   // mise au point — souvenir net
          }
        } else if (!isOther) {
          itemsRef.current.forEach((it) => {
            if (it.idx === i) return;
            if (isAnchor) {
              if (it.isAnchor) it.el.classList.add("fp-item--anchor-dimmed");
              else             it.el.classList.add("fp-item--echo-dimmed");
            } else {
              it.el.classList.add("fp-item--dimmed");
            }
          });
        }
      });

      el.addEventListener("mouseleave", () => {
        hoveredRef.current = -1;

        if (isTime) {
          const it = itemsRef.current.find((x) => x.idx === i);
          if (it) {
            it.targetOpacity = it.baseOpacity;
            it.targetBlur    = it.baseBlur;    // retour au flou mémoriel
          }
        } else if (!isOther) {
          itemsRef.current.forEach((it) => {
            it.el.classList.remove("fp-item--dimmed", "fp-item--echo-dimmed", "fp-item--anchor-dimmed");
          });
        }
      });

      el.addEventListener("click", () => {
        if (isSpace) {
          const it = itemsRef.current.find((x) => x.idx === i);
          if (!it || it.lostState) return;
        }
        if (isTime) {
          const it = itemsRef.current.find((x) => x.idx === i);
          if (!it || it.currentBlur > 0.8) return;
        }
        if (isTime) {
          try {
            const visits = JSON.parse(localStorage.getItem(LS_TIME_KEY) || "{}");
            const pk = passageId(chamber.passages[i]);
            visits[pk] = (visits[pk] || 0) + 1;
            localStorage.setItem(LS_TIME_KEY, JSON.stringify(visits));
          } catch (_) { /* localStorage indisponible */ }
        }
        onSelect(i);
      });

      // ── Space drift-decay : fraîcheur initiale = fonction de la distance au centre.
      //    Items éloignés du centre commencent déjà décayés (classe posée avant
      //    appendChild pour éviter une transition d'entrée indésirable).
      let initFreshness = 1;
      let initLost      = false;
      if (isSpace) {
        initFreshness = 0;
        initLost      = true;
        el.classList.add("fp-item--decayed");
        el.classList.add("fp-item--ever-decayed");
      }

      container.appendChild(el);
      itemsRef.current.push({
        el, cx, cy,
        floatAmp: floatAmpX, floatSpd, floatPhX,
        floatAmpY, floatSpdY, floatPhY,
        idx: i, isAnchor,
        panFactorX: 1,
        panFactorY: isSpace ? (isAnchor ? 1.3 : 0.65) : 1,
        // Time
        baseBlur, currentBlur, targetBlur,
        baseOpacity, currentOpacity, targetOpacity,
        // Other
        otherActive:    false,
        retreatX:       0,
        retreatY:       0,
        retreatTargetX: 0,
        retreatTargetY: 0,
        annotEl,
        annotOpacity:   0,
        annotTarget:    0,
        // Space drift-decay
        freshness:       initFreshness,
        lostState:       initLost,
        rememberTimer:   null,
      });
    });

    // ── Boucle d'animation
    tRef.current = 0;
    const animate = () => {
      tRef.current += 16;
      const h           = hoveredRef.current;
      const isSpaceMode = isSpaceRef.current;
      const isTimeMode  = isTimeRef.current;
      const isOtherMode = isOtherRef.current;

      // Pan Space — X + Y, parallax divergent par profondeur
      if (isSpaceMode && !thresholdRef.current) {
        const vwNow      = window.innerWidth;
        const vhNow      = window.innerHeight;
        const normX      = mousePosRef.current.x / vwNow;
        const normY      = mousePosRef.current.y / vhNow;
        const lerpFactor = h !== -1 ? 0.008 : 0.018;
        panRef.current.target   = (0.5 - normX) * 2 * SPACE_MAX_PAN   * vwNow;
        panRef.current.current += (panRef.current.target  - panRef.current.current)  * lerpFactor;
        panRef.current.targetY  = (0.5 - normY) * 2 * SPACE_MAX_PAN_Y * vhNow;
        panRef.current.currentY += (panRef.current.targetY - panRef.current.currentY) * lerpFactor;

        // Expose le pan en CSS var — consommé par ::after (l'horizon parallaxé)
        const root = containerRef.current?.parentElement;
        if (root) {
          root.style.setProperty("--space-pan-x", `${(panRef.current.current * -0.25).toFixed(1)}px`);
          root.style.setProperty("--space-pan-y", `${(panRef.current.currentY * -0.25).toFixed(1)}px`);
        }
      }

      // Other : intimité + pré-calcul stillness + item le plus proche
      let otherNearestIdx = -1, otherNearestDist = Infinity;
      if (isOtherMode && !thresholdRef.current) {
        mouseSpeedRef.current *= OTHER_SPEED_DECAY;
        const speed   = mouseSpeedRef.current;
        const isStill = speed < OTHER_SPEED_THRESHOLD &&
                        (performance.now() - lastMoveTimeRef.current) > OTHER_STILL_MS;

        // Accumulation d'intimité — la chambre apprend le visiteur
        if (isStill) {
          stillCumMsRef.current = Math.min(stillCumMsRef.current + 16, INTIMACY_FULL_MS);
        } else {
          stillCumMsRef.current = Math.max(stillCumMsRef.current - 8, 0);
        }
        intimacyRef.current = stillCumMsRef.current / INTIMACY_FULL_MS;
        const rootEl = containerRef.current?.parentElement;
        if (rootEl) rootEl.style.setProperty("--intimacy", intimacyRef.current.toFixed(4));

        if (isStill) {
          const mx = mousePosRef.current.x;
          const my = mousePosRef.current.y;
          itemsRef.current.forEach((it) => {
            if (!it.otherActive) return;
            const dx = it.cx + it.retreatX - mx;
            const dy = it.cy + it.retreatY - my;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d < otherNearestDist) { otherNearestDist = d; otherNearestIdx = it.idx; }
          });
        }
      }

      itemsRef.current.forEach((item) => {

        // ── Other : retraite + opacité + annotation
        if (isOtherMode) {
          if (!item.otherActive) {
            item.el.style.opacity = "0";
            return;
          }
          const mx    = mousePosRef.current.x;
          const my    = mousePosRef.current.y;
          const speed = thresholdRef.current ? 0 : mouseSpeedRef.current;

          // Cible de retraite : décroissance lente vers le repos
          item.retreatTargetX *= OTHER_TARGET_DECAY;
          item.retreatTargetY *= OTHER_TARGET_DECAY;

          // Impulsion si curseur rapide et proche — désactivée en mode seuil
          if (!thresholdRef.current && speed > OTHER_SPEED_THRESHOLD) {
            const ddx  = item.cx - mx;
            const ddy  = item.cy - my;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
            const adjustedRadius = OTHER_INFLUENCE_RADIUS * (1 - intimacyRef.current * 0.5);
            const adjustedForce  = OTHER_RETREAT_FORCE    * (1 - intimacyRef.current * 0.6);
            const infl = Math.max(0, 1 - dist / adjustedRadius);
            if (infl > 0) {
              const force = (speed - OTHER_SPEED_THRESHOLD) * adjustedForce * infl;
              item.retreatTargetX += (ddx / dist) * force;
              item.retreatTargetY += (ddy / dist) * force;
            }
          }

          // Plafonner la cible
          const tm = Math.hypot(item.retreatTargetX, item.retreatTargetY);
          if (tm > OTHER_RETREAT_MAX) {
            item.retreatTargetX = item.retreatTargetX / tm * OTHER_RETREAT_MAX;
            item.retreatTargetY = item.retreatTargetY / tm * OTHER_RETREAT_MAX;
          }

          // Lerp courant → cible
          item.retreatX += (item.retreatTargetX - item.retreatX) * OTHER_CURRENT_LERP;
          item.retreatY += (item.retreatTargetY - item.retreatY) * OTHER_CURRENT_LERP;

          // Opacité proportionnelle à la distance de fuite
          const rm = Math.hypot(item.retreatX, item.retreatY);
          const rf = Math.min(rm / OTHER_RETREAT_MAX, 1);
          item.el.style.opacity = (OTHER_OPACITY_REST * (1 - rf) + OTHER_OPACITY_MIN * rf).toFixed(4);

          // Position : flottement + offset de fuite
          const fdx = Math.sin(tRef.current * item.floatSpd  + item.floatPhX) * item.floatAmp;
          const fdy = Math.cos(tRef.current * item.floatSpdY + item.floatPhY) * item.floatAmpY;
          item.el.style.left = `${item.cx + fdx + item.retreatX}px`;
          item.el.style.top  = `${item.cy + fdy + item.retreatY}px`;

          // Annotation — récompense de la stillness ; éteinte en mode seuil
          const isNearest = !thresholdRef.current
            && item.idx === otherNearestIdx
            && otherNearestDist < OTHER_ANNOTATE_RADIUS;
          item.annotTarget = isNearest ? 1 : 0;
          if (item.annotEl) {
            item.annotOpacity += (item.annotTarget - item.annotOpacity) * OTHER_ANNOT_LERP;
            item.annotEl.style.opacity = item.annotOpacity.toFixed(4);
          }
          // Gazed — marque la réponse de présence
          if (isNearest) {
            item.el.classList.add("fp-item--gazed");
          } else {
            item.el.classList.remove("fp-item--gazed");
          }
          return;
        }

        // ── Standard / Space / Time
        const panX = isSpaceMode ? panRef.current.current  * item.panFactorX : 0;
        const panY = isSpaceMode ? panRef.current.currentY * item.panFactorY : 0;
        const shouldAnimate = isSpaceMode || isTimeMode || h === -1 || item.idx === h;
        let newLeft = item.cx;
        let newTop  = item.cy;
        if (shouldAnimate) {
          const dx = Math.sin(tRef.current * item.floatSpd  + item.floatPhX) * item.floatAmp;
          const dy = Math.cos(tRef.current * item.floatSpdY + item.floatPhY) * item.floatAmpY;
          newLeft = item.cx + dx + panX;
          newTop  = item.cy + dy + panY;
          item.el.style.left = `${newLeft}px`;
          item.el.style.top  = `${newTop}px`;
        }

        // ── Space drift-decay : fraîcheur → tokens lost / restorés
        //    Plus l'item s'éloigne du centre du viewport, plus il perd ses mots.
        //    Le visiteur écrit le texte avec son pan.
        //    En mode seuil de sortie, la fraîcheur est gelée : la disposition demeure.
        if (isSpaceMode && !thresholdRef.current) {
          const distX  = (item.cx + panX) - window.innerWidth  / 2;
          const distY  = (item.cy + panY) - window.innerHeight / 2;
          const dist   = Math.hypot(distX, distY);
          const target = Math.max(0, Math.min(1, 1 - dist / SPACE_FRESH_RADIUS));
          item.freshness += (target - item.freshness) * SPACE_FRESH_LERP;

          const wasLost = item.lostState;
          if (wasLost && item.freshness > SPACE_RESTORE_THRESHOLD) {
            // Retour — transition lente (1.6s), classe `--remembering`
            item.lostState = false;
            item.el.classList.remove("fp-item--decayed");
            item.el.classList.add("fp-item--remembering");
            if (item.rememberTimer) clearTimeout(item.rememberTimer);
            item.rememberTimer = setTimeout(() => {
              item.el.classList.remove("fp-item--remembering");
              item.rememberTimer = null;
            }, SPACE_REMEMBER_MS);
          } else if (!wasLost && item.freshness < SPACE_LOST_THRESHOLD) {
            // Perte — transition normale (0.9s)
            item.lostState = true;
            item.el.classList.add("fp-item--decayed");
            item.el.classList.add("fp-item--ever-decayed"); // sticky — trace iserienne permanente
            item.el.classList.remove("fp-item--remembering");
            if (item.rememberTimer) {
              clearTimeout(item.rememberTimer);
              item.rememberTimer = null;
            }
          }
          item.el.classList.toggle("fp-item--ready", !item.lostState);
        }

        // Time — opacité + flou : le souvenir se brouille avec le temps
        if (isTimeMode) {
          // Opacité : entrée rapide, réveil lent au survol
          const opRising  = item.currentOpacity < item.targetOpacity;
          const opLerp    = opRising
            ? (item.targetOpacity <= item.baseOpacity ? TIME_LERP_ENTRANCE : TIME_LERP_REVEAL)
            : TIME_LERP_AGE;
          item.currentOpacity += (item.targetOpacity - item.currentOpacity) * opLerp;
          item.el.style.opacity = item.currentOpacity.toFixed(4);

          // Flou : résolution rapide à l'entrée, mise au point lente au survol, ré-embrumement moyen
          const blurFalling = item.currentBlur > item.targetBlur; // se clarifie
          const blurLerp    = blurFalling
            ? (item.targetBlur < item.baseBlur ? TIME_LERP_REVEAL : TIME_LERP_ENTRANCE)
            : TIME_LERP_AGE;
          item.currentBlur += (item.targetBlur - item.currentBlur) * blurLerp;
          item.el.style.filter = `blur(${item.currentBlur.toFixed(3)}px)`;
          item.el.classList.toggle("fp-item--ready", item.currentBlur < 0.8);
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamber, onSelect]);

  useEffect(() => {
    build();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Clear any pending Space remember-timers
      itemsRef.current.forEach((it) => {
        if (it.rememberTimer) clearTimeout(it.rememberTimer);
      });
    };
  }, [build]);

  // ── Time — vieillissement en session.
  //    Toutes les ~28s, les passages non-survolés et non protégés gagnent
  //    un cran de patine. Démontre la mémoire de la chambre en direct.
  useEffect(() => {
    if (chamber.id !== "time") return;
    const STEP_MS    = 28000;
    const STEP_BLUR  = 0.20;
    const PROTECT_MS = 60000;
    const touchedAt  = new Map();

    const onOver = (e) => {
      const t  = e.target.closest(".fp-item");
      if (!t) return;
      const it = itemsRef.current.find((x) => x.el === t);
      if (it) touchedAt.set(it.idx, performance.now());
    };
    const root = containerRef.current;
    root?.addEventListener("mouseover", onOver);

    const itv = setInterval(() => {
      const now = performance.now();
      const cap = TIME_BASE_BLUR[TIME_BASE_BLUR.length - 1];
      itemsRef.current.forEach((it) => {
        if (it.idx === hoveredRef.current) return;
        const last = touchedAt.get(it.idx) || 0;
        if (now - last < PROTECT_MS) return;
        const next = Math.min(it.baseBlur + STEP_BLUR, cap);
        it.baseBlur   = next;
        it.targetBlur = next;
      });
    }, STEP_MS);

    return () => {
      clearInterval(itv);
      root?.removeEventListener("mouseover", onOver);
    };
  }, [chamber.id]);

  // ── Time + Space + Other — voix centrale
  useEffect(() => {
    if (!["time", "space", "other"].includes(chamber.id)) return;
    const voice  = chamber.id === "time" ? TIME_VOICE : chamber.id === "space" ? SPACE_VOICE : OTHER_VOICE;
    const period = chamber.id === "time" ? 7600 : chamber.id === "space" ? 8400 : 9000;
    setVoiceIdx(0);
    const itv = setInterval(() => setVoiceIdx((i) => (i + 1) % voice.length), period);
    return () => clearInterval(itv);
  }, [chamber.id]);

  // ── Mise à jour des classes visited sans rebuild (ni Time ni Other)
  useEffect(() => {
    itemsRef.current.forEach((item) => {
      if (isTimeRef.current || isOtherRef.current) return;
      item.el.classList.toggle("fp-item--visited", visitedSet?.has(item.idx) ?? false);
    });
  }, [visitedSet]);

  const hint = chamber.id === "space" ? "drift to explore"
             : chamber.id === "time"  ? "hover to reveal"
             : chamber.id === "other" ? "move slow — be still"
             : "choose a passage";

  return (
    <div className={`floating-passages floating-passages--${chamber.id}${enterDir ? ` floating-passages--from-${enterDir}` : ""}${thresholdActive ? " floating-passages--threshold" : ""}`}>
      <div className="fp-center" aria-hidden="true">
        <span className="fp-center__label">{chamber.label}</span>
        {["time", "space", "other"].includes(chamber.id) ? (
          <span key={`${chamber.id}-${voiceIdx}`} className="fp-center__voice">
            {(chamber.id === "time" ? TIME_VOICE : chamber.id === "space" ? SPACE_VOICE : OTHER_VOICE)[voiceIdx]}
          </span>
        ) : (
          <>
            <span className="fp-center__hint">{hint}</span>
            <span className="fp-center__action">click a passage to enter</span>
          </>
        )}
      </div>
      <div ref={containerRef} className="fp-container" aria-label={`Passages for ${chamber.label}`} />
    </div>
  );
}
