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
// App — root navigation state machine — v4
//
// Views:
//   "home"     → landing
//   "passages" → floating passage selection
//   "photo"    → iris reveal + orbital anchors
//   "about"    → page auteur
//
// Transition v4 — home → passages :
//   t=0     click → setExpandingWord + setEnterDir
//                   word starts letter-spacing explosion
//                   siblings collapse, home__center exits
//   t=180   grain-bloom turns on (opacity 0 → 0.34)
//                   — the world dissolves into emulsion
//   t=460   view swaps home → passages
//                   passages slides in from enterDir
//   t=620   grain-bloom starts fading (0.34 → 0.08)
//                   — the chamber resolves out of grain
//   t=1100  grain-bloom off — only base grain remains
//
// Other transitions (any → home, any → about, photo → passages)
// keep the original Dissolve overlay — it's the right tool
// for those heavier cuts.
// ─────────────────────────────────────────────

const toRoman = (n) => {
  const pairs = [[10,"x"],[9,"ix"],[5,"v"],[4,"iv"],[1,"i"]];
  return pairs.reduce((s, [v, r]) => {
    while (n >= v) { s += r; n -= v; }
    return s;
  }, "");
};

const ENTRY_DIRS = ["left", "bottom", "right"];

export default function App() {
  const [view, setView]             = useState("home");
  const [chamberIdx, setChamberIdx] = useState(0);
  const [passageIdx, setPassageIdx] = useState(0);
  const [dissolving, setDissolving] = useState(false);
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 });
  const [visited, setVisited]       = useState({});

  // ── Word click animation + chamber arrival direction
  const [expandingWord, setExpandingWord] = useState(null);
  const [enterDir, setEnterDir]           = useState(null);

  // ── Grain bloom — NEW transition layer for home → passages
  const [grainState, setGrainState] = useState("idle"); // idle | bloom | fading

  // ── P.3 — Seuil de sortie
  //    `revealed[chamberIdx] === true` dès qu'une photo a été dévoilée.
  //    Sur tentative de sortie (back/home/dot/Escape) depuis la vue passages,
  //    on diffère l'action via setThreshold ; le visiteur se retrouve avec
  //    sa disposition, sans la photo, sans les ancres, sans le chrome.
  //    Click / Escape / 20 s exécutent l'action différée.
  const [revealed,  setRevealed]  = useState({});       // { [idx]: true }
  const [threshold, setThreshold] = useState(null);     // null | { exitAction }

  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── Generic dissolve helper (kept for photo/about transitions)
  const dissolveTo = useCallback((callback, fadeOut = 480, hold = 0) => {
    setDissolving(true);
    setTimeout(() => {
      callback();
      setTimeout(() => setDissolving(false), hold + 80);
    }, fadeOut + hold);
  }, []);

  // ── home → passages — grain bloom orchestration
  const handleEnterChamber = useCallback((idx, wordId) => {
    if (expandingWord) return;

    setExpandingWord(wordId);
    setEnterDir(ENTRY_DIRS[idx] ?? "left");

    // t=180 — grain bloom in
    const t1 = setTimeout(() => setGrainState("bloom"), 180);

    // t=460 — view swap
    const t2 = setTimeout(() => {
      setChamberIdx(idx);
      setPassageIdx(0);
      setView("passages");
      setExpandingWord(null);
    }, 460);

    // t=620 — grain bloom starts fading
    const t3 = setTimeout(() => setGrainState("fading"), 620);

    // t=1100 — back to idle
    const t4 = setTimeout(() => setGrainState("idle"), 1100);

    // t=1180 — release enterDir (let the slide-in animation finish first)
    const t5 = setTimeout(() => setEnterDir(null), 1180);

    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
  }, [expandingWord]);

  // ── passages → photo
  const handleSelectPassage = useCallback((idx) => {
    dissolveTo(() => {
      setPassageIdx(idx);
      setView("photo");
      setVisited((prev) => {
        const existing = prev[chamberIdx] ? new Set(prev[chamberIdx]) : new Set();
        existing.add(idx);
        return { ...prev, [chamberIdx]: existing };
      });
      // P.3 — marquer cette chambre comme ayant révélé au moins une photo
      setRevealed((prev) => prev[chamberIdx] ? prev : { ...prev, [chamberIdx]: true });
    });
  }, [dissolveTo, chamberIdx]);

  // ── photo → passages
  const handleBackToList = useCallback(() => {
    dissolveTo(() => setView("passages"), 520);
  }, [dissolveTo]);

  // ── any → home (uses a softer grain-bloom return)
  const handleGoHome = useCallback(() => {
    setGrainState("bloom");
    setTimeout(() => {
      setView("home");
      setEnterDir(null);
      setGrainState("fading");
    }, 320);
    setTimeout(() => setGrainState("idle"), 900);
  }, []);

  // ── home → about
  const handleGoAbout = useCallback(() => {
    dissolveTo(() => setView("about"));
  }, [dissolveTo]);

  // ── chamber dot switch
  const handleSwitchChamber = useCallback((idx) => {
    if (idx === chamberIdx) return;
    dissolveTo(() => {
      setChamberIdx(idx);
      setPassageIdx(0);
      setView("passages");
    });
  }, [dissolveTo, chamberIdx]);

  // ── P.3 — exit gate
  //    Diffère l'action de sortie via le seuil si la chambre courante a
  //    révélé au moins une photo. Sinon, exécute immédiatement.
  const exitChamberWithThreshold = useCallback((exitAction) => {
    if (revealed[chamberIdx] && view === "passages" && !threshold) {
      setThreshold({ exitAction });
    } else {
      exitAction();
    }
  }, [revealed, chamberIdx, view, threshold]);

  const dismissThreshold = useCallback(() => {
    setThreshold((cur) => {
      if (!cur) return null;
      // exécute l'action différée après avoir clos le seuil
      setTimeout(() => cur.exitAction(), 0);
      return null;
    });
  }, []);

  // Auto-dismiss 20 s
  useEffect(() => {
    if (!threshold) return;
    const t = setTimeout(dismissThreshold, 20000);
    return () => clearTimeout(t);
  }, [threshold, dismissThreshold]);

  // Click anywhere / Escape — ferme le seuil. Délai initial pour ignorer
  // le clic qui a déclenché le seuil.
  useEffect(() => {
    if (!threshold) return;
    let clickArmed = false;
    const armTimer = setTimeout(() => { clickArmed = true; }, 350);
    const onClick = () => { if (clickArmed) dismissThreshold(); };
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") dismissThreshold();
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(armTimer);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [threshold, dismissThreshold]);

  // P.3 — Escape depuis la vue passages → déclenche le seuil de sortie.
  useEffect(() => {
    if (view !== "passages" || threshold) return;
    const onKey = (e) => {
      if (e.key === "Escape") exitChamberWithThreshold(handleGoHome);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, threshold, exitChamberWithThreshold, handleGoHome]);

  const chamber = chambers[chamberIdx];

  return (
    <div className="app">

      <Cursor mousePos={mousePos} />
      <div className="grain"    aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      {/* ── Grain bloom — overlay for home → passages transition ── */}
      <div
        className={[
          "grain-bloom",
          grainState === "bloom"  ? "grain-bloom--active" : "",
          grainState === "fading" ? "grain-bloom--fading" : "",
        ].join(" ")}
        aria-hidden="true"
      />

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
            thresholdActive={!!threshold}
          />
          {visited[chamberIdx]?.size > 0 && !threshold && (
            <ReturnIndicator
              key={chamberIdx}
              visitedCount={visited[chamberIdx].size}
              total={chamber.passages.length}
            />
          )}
          {!threshold && (
            <SharedUI
              view="passages"
              chamberIdx={chamberIdx}
              chambers={chambers}
              onGoHome={() => exitChamberWithThreshold(handleGoHome)}
              onSwitchChamber={(idx) => {
                if (idx === chamberIdx) return;
                exitChamberWithThreshold(() => handleSwitchChamber(idx));
              }}
              onBack={() => exitChamberWithThreshold(handleGoHome)}
              site={SITE}
            />
          )}
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
// ReturnIndicator — brief memory signal on passages re-entry
// ─────────────────────────────────────────────
function ReturnIndicator({ visitedCount, total }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <p
      className={`return-indicator${visible ? "" : " return-indicator--hidden"}`}
      aria-hidden="true"
    >
      return · {toRoman(visitedCount)} / {toRoman(total)}
    </p>
  );
}

// ─────────────────────────────────────────────
// SharedUI — UI persistante entre passages + photo
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
      <button
        className={isPhoto ? "shared-home-link" : "shared-back"}
        onClick={isPhoto ? onGoHome : onBack}
        aria-label="Return to home"
        data-cursor-large
      >
        {site.title}
      </button>

      {isPhoto && (
        <button
          className="shared-back shared-back--photo"
          onClick={onBack}
          aria-label="Return to passages"
          data-cursor-large
        >
          passages
        </button>
      )}

      <p className="shared-label" aria-hidden="true">
        {chambers[chamberIdx].label}
        <span className="shared-label__fr">
          {chambers[chamberIdx].labelFr}
        </span>
      </p>

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
