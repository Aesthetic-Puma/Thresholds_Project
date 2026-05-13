import { useState, useEffect, useCallback } from "react";
import { SITE, chambers, about } from "./data/chambers";
import Cursor            from "./components/Cursor";
import Home              from "./components/Home";
import FloatingPassages  from "./components/FloatingPassages";
import PhotoStage        from "./components/Photostage";
import About             from "./components/About";
import Dissolve          from "./components/Dissolve";
import "./App.css";

// ─────────────────────────────────────────────
// App — root navigation state machine
//
// Views:
//   "home"     → landing, trois mots
//   "passages" → floating passage selection
//   "photo"    → iris reveal + orbital anchors
//   "about"    → page auteur
//
// Flux complet :
//   home ──[clic mot]──► passages ──[clic fragment]──► photo
//    ▲                       ▲                            │
//    └──[Thresholds]─────────┘◄──────[← passages]────────┘
//
// Corrections v2 :
//   - dissolveTo prend duration + fadeInDuration séparés
//   - handleBackToList signal à PhotoStage de stopper
//     les animations avant le dissolve
//   - handleEnterChamber passe le mot cliqué pour
//     l'animation d'expansion dans Home
// ─────────────────────────────────────────────

const toRoman = (n) => {
  const pairs = [[10,"x"],[9,"ix"],[5,"v"],[4,"iv"],[1,"i"]];
  return pairs.reduce((s, [v, r]) => {
    while (n >= v) { s += r; n -= v; }
    return s;
  }, "");
};

export default function App() {
  const [view, setView]             = useState("home");
  const [chamberIdx, setChamberIdx] = useState(0);
  const [passageIdx, setPassageIdx] = useState(0);
  const [dissolving, setDissolving] = useState(false);
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 });
  const [visited, setVisited]       = useState({});

  // ── Mot cliqué sur la home — pour l'animation d'expansion
  const [expandingWord, setExpandingWord] = useState(null);
  // Direction d'entrée de FloatingPassages (calée sur la position du mot cliqué)
  const [enterDir, setEnterDir] = useState(null);

  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── dissolveTo amélioré
  // fadeOut  : durée du fondu au noir (ms)
  // hold     : temps de maintien au noir avant callback (ms)
  // fadeIn   : durée du retour (ms) — le Dissolve.css gère ça
  const dissolveTo = useCallback((callback, fadeOut = 480, hold = 0) => {
    setDissolving(true);
    setTimeout(() => {
      callback();
      setTimeout(() => setDissolving(false), hold + 80);
    }, fadeOut + hold);
  }, []);

  // ── home → passages ──
  // Le mot cliqué s'étale (letter-spacing → ∞), les autres s'effacent.
  // Pas de dissolve — FloatingPassages entre depuis la direction du mot.
  //   Space (gauche)    → enterDir 'left'
  //   Time (bas)        → enterDir 'bottom'
  //   The Other (droite)→ enterDir 'right'
  const handleEnterChamber = useCallback((idx, wordId) => {
    const dirs = ['left', 'bottom', 'right'];
    setExpandingWord(wordId);
    setEnterDir(dirs[idx] ?? 'left');
    setTimeout(() => {
      setChamberIdx(idx);
      setPassageIdx(0);
      setView("passages");
      setExpandingWord(null);
    }, 420);
    setTimeout(() => setEnterDir(null), 420 + 700);
  }, []);

  // ── passages → photo ──
  const handleSelectPassage = useCallback((idx) => {
    dissolveTo(() => {
      setPassageIdx(idx);
      setView("photo");
      setVisited((prev) => {
        const existing = prev[chamberIdx] ? new Set(prev[chamberIdx]) : new Set();
        existing.add(idx);
        return { ...prev, [chamberIdx]: existing };
      });
    });
  }, [dissolveTo, chamberIdx]);

  // ── photo → passages ──
  // Dissolve légèrement plus long pour laisser PhotoStage
  // nettoyer ses animations (mots volants, canvas grain)
  const handleBackToList = useCallback(() => {
    dissolveTo(() => setView("passages"), 520);
  }, [dissolveTo]);

  // ── any → home ──
  const handleGoHome = useCallback(() => {
    dissolveTo(() => setView("home"), 520);
  }, [dissolveTo]);

  // ── home → about ──
  const handleGoAbout = useCallback(() => {
    dissolveTo(() => setView("about"));
  }, [dissolveTo]);

  // ── switch chamber depuis dots ──
  const handleSwitchChamber = useCallback((idx) => {
    if (idx === chamberIdx) return; // évite le dissolve inutile
    dissolveTo(() => {
      setChamberIdx(idx);
      setPassageIdx(0);
      setView("passages");
    });
  }, [dissolveTo, chamberIdx]);

  const chamber = chambers[chamberIdx];

  return (
    <div className="app">

      <Cursor mousePos={mousePos} />
      <div className="grain"    aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <Dissolve active={dissolving} />

      {/* ── HOME ── */}
      {view === "home" && (
        <>
          <Home
            site={SITE}
            chambers={chambers}
            onEnterChamber={handleEnterChamber}
            mousePos={mousePos}
            expandingWord={expandingWord}
          />
          <button
            className="about-trigger"
            onClick={handleGoAbout}
            data-cursor-large
          >
            about
          </button>
        </>
      )}

      {/* ── ABOUT ── */}
      {view === "about" && (
        <About about={about} site={SITE} onClose={handleGoHome} />
      )}

      {/* ── FLOATING PASSAGES ── */}
      {view === "passages" && (
        <>
          <FloatingPassages
            chamber={chamber}
            onSelect={handleSelectPassage}
            visitedSet={visited[chamberIdx]}
            enterDir={enterDir}
          />
          <SharedUI
            view="passages"
            chamberIdx={chamberIdx}
            chambers={chambers}
            onGoHome={handleGoHome}
            onSwitchChamber={handleSwitchChamber}
            onBack={handleGoHome}
            site={SITE}
          />
        </>
      )}

      {/* ── PHOTO STAGE ── */}
      {view === "photo" && (
        <>
          <PhotoStage
            chamber={chamber}
            passageIdx={passageIdx}
            onBackToList={handleBackToList}
            site={SITE}
          />
          <SharedUI
            view="photo"
            chamberIdx={chamberIdx}
            chambers={chambers}
            onGoHome={handleGoHome}
            onSwitchChamber={handleSwitchChamber}
            onBack={handleBackToList}
            site={SITE}
            passageProgress={{
              current: passageIdx + 1,
              total: chamber.passages.length,
            }}
          />
        </>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────
// SharedUI — UI persistante entre passages + photo
//
// Vue "passages" :
//   gauche  → ← home
//   centre  → label chambre
//   bas     → dots
//
// Vue "photo" :
//   gauche  → Thresholds (home)
//   droite  → ← passages
//   centre  → label chambre
//   bas     → dots
//   droite vertical → i / iv (progress)
// ─────────────────────────────────────────────
function SharedUI({
  view,
  chamberIdx,
  chambers,
  onGoHome,
  onSwitchChamber,
  onBack,
  site,
  passageProgress,
}) {
  const isPhoto = view === "photo";

  return (
    <>
      {/* ── Gauche : home link (toujours) ── */}
      <button
        className={isPhoto ? "shared-home-link" : "shared-back"}
        onClick={isPhoto ? onGoHome : onBack}
        aria-label={isPhoto ? "Return to home" : "← home"}
        data-cursor-large
      >
        {isPhoto ? site.title : "← home"}
      </button>

      {/* ── Droite : ← passages (vue photo seulement) ── */}
      {isPhoto && (
        <button
          className="shared-back shared-back--photo"
          onClick={onBack}
          aria-label="← passages"
          data-cursor-large
        >
          ← passages
        </button>
      )}

      {/* ── Centre haut : label chambre ── */}
      <p className="shared-label" aria-hidden="true">
        {chambers[chamberIdx].label}
        <span className="shared-label__fr">
          {chambers[chamberIdx].labelFr}
        </span>
      </p>

      {/* ── Bas centre : dots de navigation ── */}
      <nav className="shared-dots" aria-label="Chamber navigation">
        {chambers.map((ch, i) => (
          <button
            key={i}
            className={`dot shared-dot ${i === chamberIdx ? "shared-dot--active" : ""}`}
            onClick={() => onSwitchChamber(i)}
            aria-label={`Go to ${ch.label}`}
            aria-current={i === chamberIdx}
            data-cursor-large
          />
        ))}
      </nav>

      {/* ── Droite vertical : progression i / iv (vue photo) ── */}
      {isPhoto && passageProgress && (
        <p
          className="shared-progress"
          aria-label={`Passage ${passageProgress.current} of ${passageProgress.total}`}
        >
          {toRoman(passageProgress.current)}&thinsp;/&thinsp;{toRoman(passageProgress.total)}
        </p>
      )}
    </>
  );
}