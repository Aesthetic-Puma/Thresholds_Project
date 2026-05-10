import { useState, useEffect, useRef } from "react";
import "./Home.css";

const BG_PHOTOS = [
  "/photos/autre/miroir-vert.jpg",
  "/photos/espace/graffiti-fenetre.jpg",
  "/photos/temps/musee-orange.jpg",
  "/photos/autre/couple-flou-fantome.jpg",
];

export default function Home({ site, chambers, onEnterChamber, mousePos }) {
  const [bgIdx, setBgIdx]     = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [ready, setReady]     = useState(false);
  const [hovered, setHovered] = useState(null);
  const titleRef              = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevIdx(bgIdx);
      setBgIdx((i) => (i + 1) % BG_PHOTOS.length);
    }, 4800);
    return () => clearInterval(interval);
  }, [bgIdx]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (mousePos.x - cx) / cx * 7;
    const dy = (mousePos.y - cy) / cy * 4;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }, [mousePos]);

  return (
    <div className="home">
      <div className="home__bgs" aria-hidden="true">
        {BG_PHOTOS.map((src, i) => (
          <div
            key={src}
            className={[
              "home__bg",
              i === bgIdx   ? "home__bg--current" : "",
              i === prevIdx ? "home__bg--prev"    : "",
            ].join(" ")}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>

      <div className="home__center" ref={titleRef}>
        <h1 className="home__title">{site.title.toUpperCase()}</h1>
        <p className="home__title-jp" aria-label={site.titleJp}>
          {site.titleJp}
          <span className="home__title-kr">{site.titleKr}</span>
        </p>
        <div className="home__divider" aria-hidden="true" />
        <p className="home__tagline">
          {site.tagline.split("\n").map((line, i) => (
            <span key={i}>{line}<br /></span>
          ))}
        </p>
      </div>

      <nav className="home__words" aria-label="Enter a chamber">
        {chambers.map((ch, i) => (
          <button
            key={ch.id}
            className={[
              "cw",
              "home__word",
              ready             ? "home__word--ready"   : "",
              hovered === ch.id ? "home__word--hovered" : "",
            ].join(" ")}
            style={{ animationDelay: `${2.2 + i * 0.18}s` }}
            onClick={() => onEnterChamber(i)}
            onMouseEnter={() => setHovered(ch.id)}
            onMouseLeave={() => setHovered(null)}
            aria-label={`Enter chamber: ${ch.label}`}
          >
            {ch.navWord}
          </button>
        ))}
      </nav>

      <p className="home__enter" aria-hidden="true">
        {site.enterLabel}
        <span className="home__enter-line" />
      </p>
    </div>
  );
}
