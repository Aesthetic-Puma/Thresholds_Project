import { useEffect, useRef } from "react";
import "./Cursor.css";

export default function Cursor({ mousePos }) {
  const ringRef = useRef(null);
  const posRef  = useRef({ x: mousePos.x, y: mousePos.y });
  const rafRef  = useRef(null);

  useEffect(() => {
    const animate = () => {
      const ring = ringRef.current;
      if (!ring) return;

      posRef.current.x += (mousePos.x - posRef.current.x) * 0.09;
      posRef.current.y += (mousePos.y - posRef.current.y) * 0.09;

      ring.style.left = `${posRef.current.x}px`;
      ring.style.top  = `${posRef.current.y}px`;

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mousePos]);

  useEffect(() => {
    const interactiveSelectors = [
      ".cw", ".dot", ".home-link", ".photo-slot",
      "button", "a", "[data-cursor-large]",
    ].join(", ");

    const scaleUp   = (e) => { if (e.target.closest(interactiveSelectors)) ringRef.current?.classList.add("cursor-ring--large"); };
    const scaleDown = (e) => { if (e.target.closest(interactiveSelectors)) ringRef.current?.classList.remove("cursor-ring--large"); };

    document.addEventListener("mouseover",  scaleUp);
    document.addEventListener("mouseout",   scaleDown);
    return () => {
      document.removeEventListener("mouseover",  scaleUp);
      document.removeEventListener("mouseout",   scaleDown);
    };
  }, []);

  return (
    <>
      <div
        className="cursor-dot"
        style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        aria-hidden="true"
      />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
