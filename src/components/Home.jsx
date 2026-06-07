import { useState, useEffect, useRef } from "react";
import "./Home.css";

// ─────────────────────────────────────────────
// Home — landing screen v4
//
// Changes vs v3:
//   - Word font-size 0.82 → 1.0rem (+22%)
//   - Word letter-spacing 0.32 → 0.34em
//   - Hover ring 120 → 142px (more breathing room)
//   - Word--expanding letter-spacing 0.82 → 1.0em (more dramatic)
//   - Video teaser rect 200×356 → 220×392
//   - Teaser adds: per-rect grain layer + corner crop mark
//   - Teaser label: roman numeral (I/II/III) + chamber name + FR italic
//   - Bottom hint font 0.55rem → 11px
// ─────────────────────────────────────────────

const BG_PHOTOS = [
  "/photos/autre/miroir-vert.jpg",
  "/photos/espace/graffiti-fenetre.jpg",
  "/photos/temps/musee-orange.jpg",
  "/photos/autre/couple-flou-fantome.jpg",
];

const ROMAN = ["I", "II", "III"];

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

  const titleRef       = useRef(null);
  const videoRefs      = useRef({});
  const hoverTimer     = useRef(null);
  const pauseTimers    = useRef({});
  const currentVidIdx  = useRef({});  // { [ch.id]: number } — index en cours par chambre
  const hoveredRef     = useRef(null); // miroir de hovered pour les callbacks onEnded

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

  // Garde hoveredRef synchronisé pour les callbacks onEnded (évite les closures périmées)
  hoveredRef.current = hovered;

  // ── Sélection aléatoire sans répétition
  const playRandom = (ch) => {
    const srcs = ch.videoSrcs;
    if (!srcs?.length) return;
    const video = videoRefs.current[ch.id];
    if (!video) return;
    const prev = currentVidIdx.current[ch.id] ?? -1;
    let next;
    if (prev === -1) {
      next = 0; // première impression : toujours l'index 0
    } else if (srcs.length > 1) {
      next = prev;
      while (next === prev) next = Math.floor(Math.random() * srcs.length);
    } else {
      next = 0;
    }
    currentVidIdx.current[ch.id] = next;
    video.src = srcs[next];
    video.play().catch(() => {});
  };

  // ── Play / pause selon hovered
  useEffect(() => {
    chambers.forEach((ch) => {
      const video = videoRefs.current[ch.id];
      if (!video) return;
      if (hovered === ch.id) {
        clearTimeout(pauseTimers.current[ch.id]);
        playRandom(ch);
      } else {
        pauseTimers.current[ch.id] = setTimeout(() => video.pause(), 650);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered]);

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
    <div className="home" data-screen-label="Home">

      {/* ── Background photos ── */}
      <div className="home__bgs" aria-hidden="true">
        {BG_PHOTOS.map((src, i) => (
          <div
            key={src}
            className={[
              "home__bg",
              i === bgIdx   ? "home__bg--current"  : "",
              i === prevIdx ? "home__bg--prev"     : "",
              isExpanding   ? "home__bg--entering" : "",
            ].join(" ")}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>

      {/* ── Video teaser rectangles ── */}
      {chambers.map((ch, i) => (
        <div
          key={ch.id}
          className={[
            "home__vid-rect",
            `home__vid-rect--${ch.id}`,
            hovered === ch.id ? "home__vid-rect--visible" : "",
          ].join(" ")}
          aria-hidden="true"
        >
          {ch.videoSrcs?.length > 0 && (
            <video
              ref={(el) => { videoRefs.current[ch.id] = el; }}
              muted
              playsInline
              preload="none"
              onEnded={() => {
                if (hoveredRef.current !== ch.id) return;
                playRandom(ch);
              }}
            />
          )}
          <div className="home__vid-vignette" />
          <div className="home__vid-grain" />
          <div className="home__vid-label">
            <span className="home__vid-label-num">
              {ROMAN[i]} &thinsp;·&thinsp; {ch.label}
            </span>
            <em className="home__vid-label-fr">{ch.labelFr}</em>
          </div>
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
        <p className="home__title-jp" aria-label={site.titleJp} lang="ja">
          {site.titleJp}
        </p>
        <div className="home__divider" aria-hidden="true" />
        <p className="home__tagline">
          {site.tagline.split("\n").map((line, i) => (
            <span key={i}>{line}<br /></span>
          ))}
        </p>
        <p className="home__context" aria-hidden="true">
          <span className="home__context-lead">
            three chambers in conversation with <em>Élégies Oubliées</em>
          </span>
          <span className="home__context-meta">
            Portfolio · Research Master in Creative Technology · 2026
          </span>
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

    </div>
  );
}
