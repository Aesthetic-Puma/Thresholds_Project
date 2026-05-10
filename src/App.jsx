import { useState, useEffect, useCallback } from "react";
import { SITE, chambers } from "./data/chambers";
import Cursor            from "./components/Cursor";
import Home              from "./components/Home";
import FloatingPassages  from "./components/FloatingPassages";
import PhotoStage        from "./components/Photostage";
import Dissolve          from "./components/Dissolve";
import "./App.css";

// ─────────────────────────────────────────────
// App — root navigation state machine
//
// Views:
//   "home"     → landing, three words
//   "passages" → floating passage selection
//   "photo"    → iris reveal + orbital anchors
//
// Flow:
//   home → passages → photo
//              ↑_______| (← passages)
//   home ←──────────────  (Thresholds link)
// ─────────────────────────────────────────────

export default function App() {
  const [view, setView]             = useState("home");
  const [chamberIdx, setChamberIdx] = useState(0);
  const [passageIdx, setPassageIdx] = useState(0);
  const [dissolving, setDissolving] = useState(false);
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 });

  // Track mouse globally
  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── Dissolve helper ──
  const dissolveTo = useCallback((callback, duration = 480) => {
    setDissolving(true);
    setTimeout(() => {
      callback();
      setTimeout(() => setDissolving(false), 80);
    }, duration);
  }, []);

  // ── home → passages ──
  const handleEnterChamber = useCallback((idx) => {
    dissolveTo(() => {
      setChamberIdx(idx);
      setPassageIdx(0);
      setView("passages");
    });
  }, [dissolveTo]);

  // ── passages → photo ──
  const handleSelectPassage = useCallback((idx) => {
    dissolveTo(() => {
      setPassageIdx(idx);
      setView("photo");
    });
  }, [dissolveTo]);

  // ── photo → passages ──
  const handleBackToList = useCallback(() => {
    dissolveTo(() => setView("passages"));
  }, [dissolveTo]);

  // ── any → home ──
  const handleGoHome = useCallback(() => {
    dissolveTo(() => setView("home"));
  }, [dissolveTo]);

  // ── switch chamber from dots ──
  const handleSwitchChamber = useCallback((idx) => {
    dissolveTo(() => {
      setChamberIdx(idx);
      setPassageIdx(0);
      setView("passages");
    });
  }, [dissolveTo]);

  const chamber = chambers[chamberIdx];

  return (
    <div className="app">

      <Cursor mousePos={mousePos} />
      <div className="grain"   aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <Dissolve active={dissolving} />

      {/* ── HOME ── */}
      {view === "home" && (
        <Home
          site={SITE}
          chambers={chambers}
          onEnterChamber={handleEnterChamber}
          mousePos={mousePos}
        />
      )}

      {/* ── FLOATING PASSAGES ── */}
      {view === "passages" && (
        <>
          <FloatingPassages
            chamber={chamber}
            onSelect={handleSelectPassage}
          />
          <SharedUI
            chamberIdx={chamberIdx}
            chambers={chambers}
            onGoHome={handleGoHome}
            onSwitchChamber={handleSwitchChamber}
            backLabel="← home"
            onBack={handleGoHome}
            showHomeLink={false}
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
            chamberIdx={chamberIdx}
            chambers={chambers}
            onGoHome={handleGoHome}
            onSwitchChamber={handleSwitchChamber}
            backLabel="← passages"
            onBack={handleBackToList}
            showHomeLink={true}
            site={SITE}
          />
        </>
      )}

    </div>
  );
}

// ── Shared persistent UI ──────────────────────
function SharedUI({
  chamberIdx,
  chambers,
  onGoHome,
  onSwitchChamber,
  backLabel,
  onBack,
  showHomeLink,
  site,
}) {
  return (
    <>
      {/* Back / Home link — same position, different label */}
      {showHomeLink ? (
        <button
          className="shared-home-link"
          onClick={onGoHome}
          aria-label="Return to home"
          data-cursor-large
        >
          {site.title}
        </button>
      ) : (
        <button
          className="shared-back"
          onClick={onBack}
          aria-label={backLabel}
          data-cursor-large
        >
          {backLabel}
        </button>
      )}

      {/* Back button also shown in photo view */}
      {showHomeLink && (
        <button
          className="shared-back shared-back--photo"
          onClick={onBack}
          aria-label={backLabel}
          data-cursor-large
        >
          {backLabel}
        </button>
      )}

      {/* Chamber label */}
      <p className="shared-label">
        {chambers[chamberIdx].label}
        <span className="shared-label__fr">
          {chambers[chamberIdx].labelFr}
        </span>
      </p>

      {/* Chamber dots */}
      <nav className="shared-dots" aria-label="Chamber navigation">
        {chambers.map((_, i) => (
          <button
            key={i}
            className={`dot shared-dot ${i === chamberIdx ? "shared-dot--active" : ""}`}
            onClick={() => onSwitchChamber(i)}
            aria-label={`${chambers[i].label}`}
            aria-current={i === chamberIdx}
          />
        ))}
      </nav>
    </>
  );
}