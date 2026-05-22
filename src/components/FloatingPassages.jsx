import { useEffect, useRef, useCallback } from "react";
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
const COLS             = 3;

// ── Space chamber — panning canvas
const SPACE_MAX_PAN   = 0.42;  // × vw — amplitude horizontale
const SPACE_MAX_PAN_Y = 0.18;  // × vh — amplitude verticale, plus douce

// ── Space chamber — drift-decay (P.1 — blancs iseriens)
//    Chaque passage a une fraîcheur (0…1) qui décroit à mesure qu'il quitte
//    le centre du viewport. Sous seuil, les tokens listés dans `passage.blanks`
//    deviennent transparents (avec un cadratin résiduel). Au retour au centre,
//    ils réapparaissent, plus lentement — c'est le geste du "se souvenir".
//    Le chemin de pan du visiteur écrit le texte.
const SPACE_FRESH_RADIUS      = 1000; // px — au-delà, la fraîcheur tombe à 0
const SPACE_FRESH_LERP        = 0.012; // décroissance lente — le texte ne flicker pas
const SPACE_LOST_THRESHOLD    = 0.35;  // < ce seuil → tokens lost
const SPACE_RESTORE_THRESHOLD = 0.55;  // > ce seuil → tokens restorés (hystérésis)
const SPACE_REMEMBER_MS       = 1800;  // durée de la transition lente à la restauration

// ── Time chamber — layout 2 colonnes, axe vertical = axe temporel
const getTimeLayout = (passages) => {
  const TIME_COLS = 2;
  const totalRows = Math.ceil(passages.length / TIME_COLS);
  return passages.map((p, i) => ({
    col: i % TIME_COLS,
    row: Math.floor(i / TIME_COLS),
    totalRows,
  }));
};

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
const TIME_NATURAL_AGES  = [0, 0, 1, 1, 2, 2];
const TIME_BASE_BLUR     = [0, 0.65, 1.5, 2.4];   // px — flou par niveau d'âge (0→3)
const TIME_OPACITY_REST  = 0.82;                    // opacité uniforme — le flou porte le temps
const TIME_FULL_BLUR     = 0;                       // hover : mémoire nette
const TIME_FULL_OPACITY  = 0.95;
const TIME_LERP_ENTRANCE = 0.038;  // résolution rapide du flou d'entrée
const TIME_LERP_REVEAL   = 0.008;  // mise au point lente au survol
const TIME_LERP_AGE      = 0.020;  // retour au flou mémoriel
const TIME_FLOAT_SCALE   = 0.55;
const LS_TIME_KEY        = "thresholds-time-visits";

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
  let wi   = 0;
  let html = "";
  for (const p of parts) {
    if (p === "") continue;
    if (/^\s+$/.test(p)) {
      html += p;
    } else {
      const isBlank = blanks.has(wi);
      html += `<span class="fp-token${isBlank ? " fp-token--blank" : ""}" data-ti="${wi}">${p}</span>`;
      wi++;
    }
  }
  return html;
}

// ─────────────────────────────────────────────

export default function FloatingPassages({ chamber, onSelect, visitedSet, enterDir, thresholdActive }) {
  const containerRef    = useRef(null);
  const itemsRef        = useRef([]);
  const thresholdRef    = useRef(false);

  // Sync threshold prop → ref (RAF loop l'utilise pour figer pan/freshness/retreat)
  useEffect(() => { thresholdRef.current = !!thresholdActive; }, [thresholdActive]);
  const rafRef          = useRef(null);
  const tRef            = useRef(0);
  const hoveredRef      = useRef(-1);
  const enterDirRef     = useRef(enterDir);
  const mousePosRef     = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: 0 });
  const panRef          = useRef({ current: 0, target: 0 });
  const isSpaceRef      = useRef(false);
  const isTimeRef       = useRef(false);
  const isOtherRef      = useRef(false);
  const mouseSpeedRef   = useRef(0);
  const prevMouseRef    = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: 0, t: 0 });
  const lastMoveTimeRef = useRef(0);

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
    const n       = chamber.passages.length;
    const isSpace = chamber.id === "space";
    const isTime  = chamber.id === "time";
    const isOther = chamber.id === "other";
    isSpaceRef.current = isSpace;
    isTimeRef.current  = isTime;
    isOtherRef.current = isOther;

    if (isOther) lastMoveTimeRef.current = performance.now();

    const timeVisits = isTime
      ? JSON.parse(localStorage.getItem(LS_TIME_KEY) || "{}")
      : null;

    const spaceLayout = isSpace ? getSpaceLayout() : null;
    const timeLayout  = isTime  ? getTimeLayout(chamber.passages)  : null;
    const otherLayout = isOther ? getOtherLayout(chamber.passages) : null;

    chamber.passages.forEach((passage, i) => {
      let cx, cy, floatAmpX, floatAmpY, floatSpd, floatSpdY;

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
        const { col: tCol, row: tRow, totalRows: tRows } = timeLayout[i];
        const colW  = vw / 2;
        const topY  = vh * 0.16;
        const botY  = vh * 0.84;
        const baseX = tCol * colW + colW / 2;
        const baseY = tRows > 1 ? topY + (tRow / (tRows - 1)) * (botY - topY) : vh / 2;
        const jx    = (Math.random() - 0.5) * colW * 0.32;
        const jy    = (Math.random() - 0.5) * ((botY - topY) / tRows) * 0.45;
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
        const visitCount = timeVisits[i] || 0;
        const totalAge   = Math.min(naturalAge + visitCount, TIME_BASE_BLUR.length - 1);
        baseBlur       = TIME_BASE_BLUR[totalAge];
        currentBlur    = 4;   // tous les passages entrent très flous
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

      el.style.left = `${cx}px`;
      el.style.top  = `${cy}px`;

      if (isTime || isOther) {
        el.style.opacity    = "0";
        el.style.transition = "none"; // empêche le CSS transition d'interférer avec le lerp JS
      }
      if (isTime) {
        el.style.filter = "blur(4px)"; // état initial — résolue par le rAF
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
        if (isTime) {
          try {
            const visits = JSON.parse(localStorage.getItem(LS_TIME_KEY) || "{}");
            visits[i] = (visits[i] || 0) + 1;
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
        const dxc = cx - vw / 2;
        const dyc = cy - vh / 2;
        const dC  = Math.hypot(dxc, dyc);
        initFreshness = Math.max(0, Math.min(1, 1 - dC / SPACE_FRESH_RADIUS));
        initLost      = initFreshness < SPACE_LOST_THRESHOLD;
        if (initLost) el.classList.add("fp-item--decayed");
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
      }

      // Other : pré-calcul stillness + item le plus proche
      let otherNearestIdx = -1, otherNearestDist = Infinity;
      if (isOtherMode && !thresholdRef.current) {
        mouseSpeedRef.current *= OTHER_SPEED_DECAY;
        const speed   = mouseSpeedRef.current;
        const isStill = speed < OTHER_SPEED_THRESHOLD &&
                        (performance.now() - lastMoveTimeRef.current) > OTHER_STILL_MS;
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
            const infl = Math.max(0, 1 - dist / OTHER_INFLUENCE_RADIUS);
            if (infl > 0) {
              const force = (speed - OTHER_SPEED_THRESHOLD) * OTHER_RETREAT_FORCE * infl;
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
          const distX  = newLeft - window.innerWidth  / 2;
          const distY  = newTop  - window.innerHeight / 2;
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
            item.el.classList.remove("fp-item--remembering");
            if (item.rememberTimer) {
              clearTimeout(item.rememberTimer);
              item.rememberTimer = null;
            }
          }
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
        <span className="fp-center__hint">{hint}</span>
        <span className="fp-center__action">click a passage to enter</span>
      </div>
      <div ref={containerRef} className="fp-container" aria-label={`Passages for ${chamber.label}`} />
    </div>
  );
}
