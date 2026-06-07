import { useEffect, useRef } from "react";
import "./Cursor.css";

export default function Cursor({ mousePos }) {
  const ringRef = useRef(null);
  const posRef  = useRef({ x: mousePos.x, y: mousePos.y });
  const rafRef  = useRef(null);

  useEffect(() => {
    const READY = ".cw, .home-link, .photo-slot, a, [data-cursor-large], button:not(.fp-item)";

    const animate = () => {
      const ring = ringRef.current;
      if (!ring) return;

      posRef.current.x += (mousePos.x - posRef.current.x) * 0.09;
      posRef.current.y += (mousePos.y - posRef.current.y) * 0.09;

      ring.style.left = `${posRef.current.x}px`;
      ring.style.top  = `${posRef.current.y}px`;

      const hit     = document.elementFromPoint(mousePos.x, mousePos.y);
      const ready   = hit && (hit.closest(READY) || hit.closest(".fp-item--ready"));
      const blocked = hit && hit.closest(".fp-item") && !hit.closest(".fp-item--ready");
      ring.classList.toggle("cursor-ring--large",   !!ready);
      ring.classList.toggle("cursor-ring--blocked", !!blocked);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mousePos]);

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
