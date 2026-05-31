import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// useProximityReveal — la nav émerge à l'approche du curseur.
//
// C'est la grammaire « emergence » du projet (cf. AnchorsFlee dans
// PhotoStage, où le mot le plus proche du curseur affleure) appliquée
// au chrome de navigation : au repos, les contrôles sont un murmure ;
// quand le curseur s'en approche, ils montent en opacité.
//
// L'opacité est écrite DIRECTEMENT sur l'élément à chaque frame
// (pas de re-render React — même approche perf que AnchorsFlee).
// ─────────────────────────────────────────────

// ── Tracker curseur singleton — un seul listener pour tous les consommateurs ──
let _x = -99999, _y = -99999, _count = 0, _bound = false;
const _onMove = (e) => { _x = e.clientX; _y = e.clientY; };
function _subscribe() {
  if (!_bound) { window.addEventListener("mousemove", _onMove, { passive: true }); _bound = true; }
  _count++;
  return () => {
    _count--;
    if (_count <= 0 && _bound) { window.removeEventListener("mousemove", _onMove); _bound = false; }
  };
}

// Tactile / sans survol → pas de proximité possible : on garde les contrôles présents.
const _coarse =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(hover: none)").matches;

/**
 * @param {Object}  opts
 * @param {boolean} opts.active     false → opacité ramenée à 0 (suppression)
 * @param {number}  opts.radius     distance (px) où la révélation commence
 * @param {number}  opts.min        opacité au repos (curseur loin)
 * @param {number}  opts.max        opacité sur le contrôle (curseur dessus)
 * @param {number}  opts.intro      durée (ms) de l'amorce (révélation initiale)
 * @param {number}  opts.introHold  durée (ms) de maintien de l'amorce avant retrait
 * @returns {import("react").RefObject}
 */
export function useProximityReveal({
  active = true,
  radius = 240,
  min = 0.22,
  max = 1,
  intro = 1000,
  introHold = 650,
} = {}) {
  const ref = useRef(null);
  const opacityRef = useRef(0);

  useEffect(() => {
    const unsub = _subscribe();
    const introEnd = performance.now() + intro + introHold;
    let raf;

    const loop = () => {
      const el = ref.current;
      if (el) {
        let target;
        if (!active) {
          target = 0;
        } else if (_coarse) {
          target = max;                       // tactile : toujours présent
        } else {
          const r  = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const d  = Math.hypot(_x - cx, _y - cy);
          const prox = Math.max(0, 1 - d / radius);      // 0 (loin) … 1 (dessus)
          target = min + (max - min) * prox;
          // Amorce — révélation quasi-pleine au moment de l'activation
          if (performance.now() < introEnd) target = Math.max(target, max * 0.92);
        }
        const next = opacityRef.current + (target - opacityRef.current) * 0.12;
        opacityRef.current = next;
        el.style.opacity = next.toFixed(3);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { unsub(); cancelAnimationFrame(raf); };
  }, [active, radius, min, max, intro, introHold]);

  return ref;
}
