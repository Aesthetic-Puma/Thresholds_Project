import { useState, useEffect } from "react";

// ─────────────────────────────────────────────
// useIsDesktop — true uniquement sur un appareil capable de l'expérience
// pilotée au curseur : survol disponible + pointeur fin + largeur ≥ 768px.
//
//   (hover: hover) and (pointer: fine)  → écarte tout tactile (tél., tablette)
//   innerWidth >= 768                   → écarte les très petites fenêtres
//
// Réévalué au resize et au changement de média (branchement d'une souris,
// rotation, etc.). SSR-safe (renvoie true côté serveur).
// ─────────────────────────────────────────────

const check = () =>
  typeof window === "undefined"
    ? true
    : window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      window.innerWidth >= 768;

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(check);

  useEffect(() => {
    const update = () => setIsDesktop(check());
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    mq.addEventListener?.("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return isDesktop;
}
