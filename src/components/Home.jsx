import { useState, useEffect, useRef } from "react";
import "./Home.css";

// ─────────────────────────────────────────────
// Home — landing screen v3
//
// Nouveautés :
//   - Rectangles portrait vidéo (200×356px) au hover
//   - Direction glissement cohérente avec position du mot
//   - Délai 160ms anti-accidentel
//   - video.currentTime = 0 à chaque hover
//   - Pause différée après fade-out
//   - expandingWord pour animation sortie → chambre
// ─────────────────────────────────────────────

const BG_PHOTOS = [
  "/photos/autre/miroir-vert.jpg",
  "/photos/espace/graffiti-fenetre.jpg",
  "/photos/temps/musee-orange.jpg",
  "/photos/autre/couple-flou-fantome.jpg",
];

export default function Home({
  site,
  chambers,
  onEnterChamber,
  mousePos,
  expandingWord,
}) {
  const [bgIdx, setBgIdx]     = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [ready, setReady]     = useState(false);
  const [hovered, setHovered] = useState(null);

  const titleRef    = useRef(null);
  const videoRefs   = useRef({});
  const hoverTimer  = useRef(null);
  const pauseTimers = useRef({});

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

  // ── Play / pause selon hovered
  useEffect(() => {
    chambers.forEach((ch) => {
      const video = videoRefs.current[ch.id];
      if (!video) return;
      if (hovered === ch.id) {
        clearTimeout(pauseTimers.current[ch.id]);
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        pauseTimers.current[ch.id] = setTimeout(() => {
          video.pause();
        }, 650);
      }
    });
  }, [hovered, chambers]);

  useEffect(() => {
    return () => {
      clearTimeout(hoverTimer.current);
      Object.values(pauseTimers.current).forEach(clearTimeout);
    };
  }, []);

  const isExpanding = expandingWord !== null;

  const handleMouseEnter = (chId) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(chId), 160);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setHovered(null);
  };

  return (
    <div className="home">

      {/* ── Fond photos ── */}
      <div className="home__bgs" aria-hidden="true">
        {BG_PHOTOS.map((src, i) => (
          <div
            key={src}
            className={[
              "home__bg",
              i === bgIdx   ? "home__bg--current" : "",
              i === prevIdx ? "home__bg--prev"    : "",
              isExpanding   ? "home__bg--entering" : "",
            ].join(" ")}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>

      {/* ── Rectangles portrait vidéo ── */}
      {chambers.map((ch) => (
        <div
          key={ch.id}
          className={[
            "home__vid-rect",
            `home__vid-rect--${ch.id}`,
            hovered === ch.id ? "home__vid-rect--visible" : "",
          ].join(" ")}
          aria-hidden="true"
        >
          {ch.videoSrc && (
            <video
              ref={(el) => { videoRefs.current[ch.id] = el; }}
              src={ch.videoSrc}
              muted
              loop
              playsInline
              preload="none"
            />
          )}
          <div className="home__vid-vignette" />
          <span className="home__vid-label">
            {ch.label}
            <em className="home__vid-label-fr">{ch.labelFr}</em>
          </span>
        </div>
      ))}

      {/* ── Bloc titre ── */}
      <div
        className={[
          "home__center",
          isExpanding ? "home__center--exit" : "",
        ].join(" ")}
        ref={titleRef}
      >
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

      {/* ── Mots navigation ── */}
      <nav className="home__words" aria-label="Enter a chamber">
        {chambers.map((ch, i) => {
          const isThisExpanding  = expandingWord === ch.id;
          const isOtherExpanding = isExpanding && !isThisExpanding;
          const isSiblingHovered = hovered && hovered !== ch.id;

          return (
            <button
              key={ch.id}
              className={[
                "cw",
                "home__word",
                ready              ? "home__word--ready"          : "",
                hovered === ch.id  ? "home__word--hovered"        : "",
                isSiblingHovered   ? "home__word--sibling-hovered": "",
                isThisExpanding    ? "home__word--expanding"      : "",
                isOtherExpanding   ? "home__word--collapsing"     : "",
              ].join(" ")}
              style={{ animationDelay: `${2.2 + i * 0.18}s` }}
              onClick={() => onEnterChamber(i, ch.id)}
              onMouseEnter={() => !isExpanding && handleMouseEnter(ch.id)}
              onMouseLeave={handleMouseLeave}
              aria-label={`Enter chamber: ${ch.label}`}
              disabled={isExpanding}
            >
              {ch.navWord}
            </button>
          );
        })}
      </nav>

      {/* ── Hint bas ── */}
      <p
        className={[
          "home__enter",
          isExpanding ? "home__enter--exit" : "",
        ].join(" ")}
        aria-hidden="true"
      >
        {site.enterLabel}
        <span className="home__enter-line" />
      </p>

    </div>
  );
}