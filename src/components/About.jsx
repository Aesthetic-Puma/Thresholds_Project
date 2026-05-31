import { useEffect, useRef, useState } from "react";
import "./About.css";

export default function About({ about, site, onClose }) {
  const scrollRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 0);
  };

  return (
    <div className="about" data-screen-label="About">

      {/* ── Scroll progress (1px left edge) ── */}
      <div className="about__progress" aria-hidden="true">
        <div
          className="about__progress-bar"
          style={{ height: `${progress * 100}%` }}
        />
      </div>

      {/* ── Nav ── */}
      <button className="about__close" onClick={onClose} data-cursor-large>
        {site.title}
      </button>
      <p
        className={`about__nav-label${progress > 0.04 ? " about__nav-label--dim" : ""}`}
        aria-hidden="true"
      >
        About <span className="about__nav-label-jp">{site.titleJp}</span>
      </p>

      {/* ── Scroll body ── */}
      <div className="about__scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="about__inner">

          {/* ── Header ── */}
          <header className="about__header">
            <div className="about__header-top">
              <div className="about__portrait-wrap">
                <img
                  src={about.photo}
                  alt={about.name}
                  className="about__portrait"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
              <div>
                <h1 className="about__name">{about.name}</h1>
                <p className="about__roles">{about.roles.join(" · ")}</p>
              </div>
            </div>
          </header>

          <div className="about__divider" />

          {/* ── Statement — full width ── */}
          <div className="about__statement">
            <p>
              I work at the threshold between systems and stories — building software,
              photographing the spaces between people and their worlds, writing fiction
              where the real quietly unravels.
            </p>
            <p>
              The same attention to the seam between what is shown and what is hidden
              runs through all three. Whether the material is silver, ink, or code,
              the question is the same: where does a system let something through?
            </p>
            <p>
              <em>Thresholds</em> is not a portfolio of three disciplines.
              It is one inquiry, conducted in three registers.
            </p>
          </div>

          {/* ── I — The Question ── */}
          <section className="about__section">
            <div className="about__label-col">
              <span className="about__section-num">I — The Question</span>
            </div>
            <div className="about__content-col">
              <p>
                Photography taught me to wait. Every image in this work concerns a
                threshold: a body becoming a silhouette, a doorway becoming a question.
                I do not stage. I wait until the world admits something.
              </p>
              <p>
                Fiction extends that attention into language. The stories in{" "}
                <em>{about.book.title}</em> operate close to the photographs — same
                vocabulary, different medium. The book is not beside this portfolio;
                it is the material from which this portfolio is made. Every passage
                a reader encounters in a chamber is in conversation with one of
                its twelve stories.
              </p>
              <p>
                Engineering gave me the stakes. Designing a tablet interface for elderly
                users cut off from digital life, I learned that the threshold between
                what a system lets through and what it blocks is never a technical
                problem — it is always a human one. A worker who must read a screen in
                three seconds, a patient who must understand a notice: these are the
                threshold question at real scale.
              </p>
            </div>
          </section>

          {/* ── II — Why Here ── */}
          <section className="about__section">
            <div className="about__label-col">
              <span className="about__section-num">II — Why Here</span>
            </div>
            <div className="about__content-col">
              <p>
                A Master in Creative Technology is not a departure from engineering.
                It is its formalisation.
              </p>
              <p>
                For six years, I have built interfaces where clarity has stakes. At SNCF,
                ambiguity costs a missed train. At Sanofi — in a GxP-regulated environment
                where product information reaches patients via digital interfaces — a
                misread notice has consequences that belong to a different order entirely.
                The threshold question I bring to <em>Thresholds</em> was already present
                in that work. I did not discover it through photography or fiction.
                I recognised it there.
              </p>
              <p>
                KMD is not the place where I become an artist. It is the place where the
                question — how does a system let something through, and at what cost when
                it doesn't — can be pursued at the scale and with the rigour it requires.
                A programme where technical discipline and artistic practice are treated
                as complementary methods of inquiry, not competing identities, is the
                only context in which this work can go further.
              </p>
              <blockquote className="about__pull-quote">
                What I am bringing is not a completed project.
                It is a question that <em>Thresholds</em> made precise
                but could not resolve alone.
              </blockquote>
            </div>
          </section>

          {/* ── III — Selected Works ── */}
          <section className="about__section">
            <div className="about__label-col">
              <span className="about__section-num">III — Selected Works</span>
            </div>
            <div className="about__content-col">

              {/* Thresholds */}
              <div className="about__work">
                <span className="about__work-title">Thresholds</span>
                <span className="about__work-meta">Photography · Writing · Code &thinsp;—&thinsp; 2026</span>
                <p>
                  A photography and fiction portfolio built as a single interactive
                  experience. Three chambers — <em>Space</em>, <em>Time</em>,{" "}
                  <em>The Other</em> — each with its own interaction model designed
                  to carry its conceptual weight. Built from the ground up: React,
                  a custom animation system, no external motion library.
                </p>
              </div>

              {/* Élégies Oubliées */}
              <div className="about__book">
                <div className="about__book-cover-wrap">
                  <img
                    src={about.book.cover}
                    alt={about.book.title}
                    className="about__book-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>
                <div className="about__book-info">
                  <span className="about__book-title">{about.book.title}</span>
                  <span className="about__book-subtitle">{about.book.subtitle}</span>
                  <span className="about__book-year">— {about.book.publisher}</span>
                  <p className="about__book-desc">{about.book.desc}</p>
                  <a
                    href={about.book.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about__book-link"
                    data-cursor-large
                  >
                    Read on Babelio →
                  </a>
                </div>
              </div>

              {/* Engineering */}
              <div className="about__timeline">
                <div className="about__tl-entry">
                  <span className="about__tl-year">Sanofi</span>
                  <div>
                    <span className="about__tl-role">Electronic Product Information · GxP-regulated</span>
                    <p className="about__tl-note">
                      Making the patient leaflet legible through a QR code, inside an
                      environment where quality, traceability and compliance are not
                      features but obligations. The threshold here is the one in this
                      whole project, at its most literal: what a person is able to
                      understand, and what happens when they cannot.
                    </p>
                    <span className="about__tl-stack">React · Node.js · AWS · OpenShift · Terraform</span>
                  </div>
                </div>
                <div className="about__tl-entry">
                  <span className="about__tl-year">SNCF</span>
                  <div>
                    <span className="about__tl-role">Transport systems · millions of daily users</span>
                    <p className="about__tl-note">
                      The worker who must understand a screen in three seconds was
                      my first school in UX at real stakes — interfaces where
                      ambiguity costs a missed train.
                    </p>
                    <span className="about__tl-stack">React · Java · REST · Agile</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ── IV — Process Notes ── */}
          <section className="about__section">
            <div className="about__label-col">
              <span className="about__section-num">IV — Process</span>
            </div>
            <div className="about__content-col">
              <p>
                A single process document written alongside the work — tracing the
                thesis, the curation of passages, and the 18 image–text pairings.
                It is meant to be read alongside the portfolio.
              </p>
              <div className="about__links">
                <a
                  href="/process/Process_Notes_-_Thresholds.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about__link"
                  data-cursor-large
                >
                  Process Notes →
                </a>
              </div>
            </div>
          </section>

          {/* ── V — Contact ── */}
          <section className="about__section about__section--last">
            <div className="about__label-col">
              <span className="about__section-num">V — Contact</span>
            </div>
            <div className="about__content-col">
              <div className="about__links">
                <a href={`mailto:${about.contact}`} className="about__link" data-cursor-large>
                  {about.contact}
                </a>
                <a
                  href={about.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about__link"
                  data-cursor-large
                >
                  LinkedIn
                </a>
                <a
                  href={about.cv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about__link about__link--dim"
                  data-cursor-large
                >
                  Curriculum Vitæ ↓
                </a>
              </div>
            </div>
          </section>

          <footer className="about__footer">
            <span>{site.title} · {site.titleJp} · {new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>

      <div
        className={`about__scroll-hint${progress > 0.04 ? " about__scroll-hint--dim" : ""}`}
        aria-hidden="true"
      >
        scroll ↓
      </div>
    </div>
  );
}