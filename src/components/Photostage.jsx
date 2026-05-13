import { useState, useEffect, useRef, useCallback } from "react";
import "./PhotoStage.css";

const ORBIT_PAD_X = 95;
const ORBIT_PAD_Y = 55;

// ── Split passage.full into plain text + keyword segments
function parseText(text, anchors) {
  if (!anchors?.length) return [{ type: "text", content: text }];
  const hits = anchors
    .map((a, i) => ({
      i,
      start: text.toLowerCase().indexOf(a.word.toLowerCase()),
      len: a.word.length,
    }))
    .filter((h) => h.start !== -1)
    .sort((a, b) => a.start - b.start);

  const segs = [];
  let cur = 0;
  for (const { i, start, len } of hits) {
    if (start < cur) continue;
    if (start > cur) segs.push({ type: "text", content: text.slice(cur, start) });
    segs.push({ type: "kw", content: text.slice(start, start + len), anchorIdx: i });
    cur = start + len;
  }
  if (cur < text.length) segs.push({ type: "text", content: text.slice(cur) });
  return segs;
}

// ── Keyword that flies from passage text position to its orbital anchor
function FlyingWord({ data, delay }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const dx = data.tx - data.sx;
  const dy = data.ty - data.sy;

  return (
    <span
      className="ps-fly"
      style={{
        left: data.sx,
        top: data.sy,
        transform: active
          ? `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.72)`
          : "translate(-50%, -50%)",
        transitionDelay: `${delay}s`,
      }}
    >
      {data.word}
    </span>
  );
}

// ─────────────────────────────────────────────
// PhotoStage — passage reading → keyword migration → photo
//
// Phase 'passage' (0–2200ms):
//   Full passage text, keywords highlighted in the sentence.
//
// At 2200ms:
//   Text fades. Keywords measure their screen rect, then fly
//   via CSS transform to their orbital anchor positions (wx/wy).
//   Iris begins opening simultaneously.
//
// Phase 'photo' (4000ms+):
//   Flying keywords cleared. Settled anchor labels + lines appear.
// ─────────────────────────────────────────────

export default function PhotoStage({ chamber, passageIdx, onBackToList, site }) {
  const [phase,    setPhase]    = useState("passage");
  const [textIn,   setTextIn]   = useState(false);
  const [textOut,  setTextOut]  = useState(false);
  const [irisOpen, setIrisOpen] = useState(false);
  const [anchors,  setAnchors]  = useState([]);
  const [flying,   setFlying]   = useState(null);
  const [lines,    setLines]    = useState(false);

  const photoRef = useRef(null);
  const kwRefs   = useRef([]);
  const tids     = useRef([]);

  const passage = chamber.passages[passageIdx];

  const at     = (fn, ms) => { const id = setTimeout(fn, ms); tids.current.push(id); };
  const clearT = () => { tids.current.forEach(clearTimeout); tids.current = []; };

  // ── Compute orbital + dot positions from photo element
  const getAnchors = useCallback(() => {
    const el = photoRef.current;
    if (!el || !passage?.anchors?.length) return null;
    const r   = el.getBoundingClientRect();
    const natW = el.naturalWidth  || r.width;
    const natH = el.naturalHeight || r.height;
    const sc  = Math.min(r.width / natW, r.height / natH);
    const iw  = natW * sc;
    const ih  = natH * sc;
    const ix  = r.left + (r.width  - iw) / 2;
    const iy  = r.top  + (r.height - ih) / 2;
    const cx  = ix + iw / 2;
    const cy  = iy + ih / 2;
    const rx  = iw / 2 + ORBIT_PAD_X;
    const ry  = ih / 2 + ORBIT_PAD_Y;
    const n   = passage.anchors.length;
    return passage.anchors.map((a, i) => ({
      ...a,
      ax: ix + (a.px / 100) * iw,
      ay: iy + (a.py / 100) * ih,
      wx: cx + rx * Math.cos((i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6),
      wy: cy + ry * Math.sin((i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6),
    }));
  }, [passage]);

  // ── Trigger migration on click (or Space/Enter)
  const triggerMigration = useCallback(() => {
    if (phase !== "passage") return;
    clearT();
    setTextOut(true);
    const computed = getAnchors();
    if (computed) {
      setAnchors(computed);
      setFlying(
        passage.anchors.map((a, i) => {
          const rc = kwRefs.current[i]?.getBoundingClientRect();
          return {
            word: a.word,
            sx: rc ? rc.left + rc.width  / 2 : window.innerWidth  / 2,
            sy: rc ? rc.top  + rc.height / 2 : window.innerHeight / 2,
            tx: computed[i].wx,
            ty: computed[i].wy,
          };
        })
      );
    }
    requestAnimationFrame(() => requestAnimationFrame(() => setIrisOpen(true)));
    at(() => { setPhase("photo"); setLines(true); setFlying(null); }, 1800);
  }, [phase, passage, getAnchors]);

  // ── Main timeline — resets on each new passage
  useEffect(() => {
    clearT();
    kwRefs.current = [];
    setPhase("passage");
    setTextIn(false); setTextOut(false);
    setIrisOpen(false); setAnchors([]);
    setFlying(null); setLines(false);

    new Image().src = passage.src; // preload

    // Text fades in
    at(() => setTextIn(true), 80);

    return clearT;
  }, [passage]);

  // Recompute anchors on resize
  useEffect(() => {
    const handler = () => {
      if (phase === "photo") {
        const c = getAnchors();
        if (c) setAnchors(c);
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [phase, getAnchors]);

  // Keyboard — Escape back, Space/Enter advance
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onBackToList();
      if (e.key === " " || e.key === "Enter") triggerMigration();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBackToList, triggerMigration]);

  if (!passage) return null;

  const segs = parseText(passage.full, passage.anchors);

  return (
    <div className="photo-stage">

      {/* ── Photo — always in DOM for getBoundingClientRect ── */}
      <img
        ref={photoRef}
        src={passage.src}
        alt={passage.alt}
        className={`photo-stage__photo ${irisOpen ? "photo-stage__photo--open" : ""}`}
      />

      {/* ── Passage reading overlay — click anywhere to reveal ── */}
      {phase === "passage" && (
        <div
          className={`ps-reading ${textOut ? "ps-reading--out" : ""}`}
          onClick={triggerMigration}
          style={{ pointerEvents: textIn ? "auto" : "none", cursor: "none" }}
        >
          <div className={`ps-reading__body ${textIn ? "ps-reading__body--in" : ""}`}>
            <p className="ps-reading__text">
              &ldquo;
              {segs.map((s, i) =>
                s.type === "kw" ? (
                  <span
                    key={i}
                    className="ps-kw"
                    ref={(el) => { kwRefs.current[s.anchorIdx] = el; }}
                  >
                    {s.content}
                  </span>
                ) : (
                  <span key={i}>{s.content}</span>
                )
              )}
              &rdquo;
            </p>
            <span className="ps-reading__source">{passage.source}</span>
          </div>
        </div>
      )}

      {/* ── Flying keywords ── */}
      {flying?.map((fw, i) => (
        <FlyingWord key={i} data={fw} delay={i * 0.18} />
      ))}

      {/* ── SVG lines — photo phase ── */}
      {lines && anchors.length > 0 && (
        <svg className="photo-stage__svg" aria-hidden="true">
          {anchors.map((a, i) => (
            <line
              key={i}
              x1={a.wx} y1={a.wy}
              x2={a.ax} y2={a.ay}
              className="photo-stage__line"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </svg>
      )}

      {/* ── Dots on photo — photo phase ── */}
      {lines && anchors.map((a, i) => (
        <div
          key={i}
          className="photo-stage__dot"
          style={{ left: a.ax, top: a.ay, animationDelay: `${i * 0.35}s` }}
          aria-hidden="true"
        />
      ))}

      {/* ── Settled anchor labels — photo phase ── */}
      {phase === "photo" && anchors.map((a, i) => (
        <div
          key={i}
          className="photo-stage__anchor"
          style={{ left: a.wx, top: a.wy, animationDelay: `${i * 0.18}s` }}
          aria-hidden="true"
        >
          <span className="photo-stage__anchor-word">{a.word}</span>
          <span className="photo-stage__anchor-note">{a.note}</span>
        </div>
      ))}

      {/* ── Source caption — photo phase ── */}
      {phase === "photo" && (
        <div className="photo-stage__quote photo-stage__quote--visible">
          <span className="photo-stage__quote-source">
            {passage.source} — {site.bookTitle}
          </span>
        </div>
      )}

    </div>
  );
}
