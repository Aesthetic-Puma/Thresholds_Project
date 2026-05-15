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
        About <span className="about__nav-label-fr">{site.titleFr}</span>
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
                Engineering sharpened the same instinct in a different register.
                A worker who must read a screen in three seconds, an interface where
                ambiguity has a cost — these are the threshold question, posed in the
                field. That work was not a detour. It was apprenticeship in the stakes
                of the seam.
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
                I have always worked at the boundary between system and meaning. A
                programme where technical rigour and artistic practice are not competing
                disciplines but complementary methods is the context in which this
                inquiry can go further.
              </p>
              <blockquote className="about__pull-quote">
                The question I am bringing is not new. The tools to ask it properly are.
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
                <span className="about__work-meta">Photography · Writing · Code &thinsp;—&thinsp; 2025</span>
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

          {/* ── IV — Contact ── */}
          <section className="about__section about__section--last">
            <div className="about__label-col">
              <span className="about__section-num">IV — Contact</span>
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
            <span>{site.title} · {site.titleFr} · {new Date().getFullYear()}</span>
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
