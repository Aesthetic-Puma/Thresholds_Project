import { useEffect } from "react";
import "./About.css";

export default function About({ about, site, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="about">

      {/* ── Nav ── */}
      <button className="about__close" onClick={onClose} data-cursor-large>
        ← {site.title}
      </button>
      <p className="about__nav-label" aria-hidden="true">
        About <span className="about__nav-label-fr">{site.titleFr}</span>
      </p>

      {/* ── Scroll body ── */}
      <div className="about__scroll">
        <div className="about__inner">

          {/* ── Header ── */}
          <header className="about__header">
            <div className="about__header-left">
              <h1 className="about__name">{about.name}</h1>
              <p className="about__roles">{about.roles.join(" · ")}</p>
            </div>
            <blockquote className="about__tagline">
              {about.tagline}
            </blockquote>
          </header>

          <div className="about__divider" />

          {/* ── I — Photography ── */}
          <section className="about__section">
            <div className="about__label-col">
              <span className="about__section-num">I — Photography</span>
              <span className="about__section-sub">La chambre noire</span>
            </div>
            <div className="about__content-col">
              <p>
                I photograph in <em>black and white, mostly</em> — at the edge of cities
                I do not belong to. Korea, Venice, the corners of Paris where the present
                has not yet caught up with itself.
              </p>
              <p>
                The work collected in <em>Thresholds</em> is concerned with the moment a
                body becomes a silhouette, a doorway becomes a question. I do not stage.
                I wait until the world admits something.
              </p>
            </div>
          </section>

          {/* ── II — Writing ── */}
          <section className="about__section">
            <div className="about__label-col">
              <span className="about__section-num">II — Writing</span>
              <span className="about__section-sub">l'écriture</span>
            </div>
            <div className="about__content-col">
              <p>
                I write short fiction that operates close to the photographs — same
                vocabulary, different medium. The stories often turn on a single threshold:
                a door not quite closed, a memory that may not have happened, a stranger
                seen too clearly to be real.
              </p>
              <p>
                My debut collection, <em>{about.book.title}</em>, was published in 2024.
              </p>

              {/* Book block */}
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
                    Lire sur Babelio →
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ── III — Engineering ── */}
          <section className="about__section">
            <div className="about__label-col">
              <span className="about__section-num">III — Engineering</span>
              <span className="about__section-sub">le code</span>
            </div>
            <div className="about__content-col">
              <p>
                I have built software since 2020 — systems where a design error has real
                consequences. That constraint sharpened my attention to the seam between
                interface and user, the same seam I look for in photographs.
              </p>
              <div className="about__timeline">
                <div className="about__tl-entry">
                  <span className="about__tl-year">SNCF</span>
                  <div>
                    <span className="about__tl-role">Transport systems · millions of daily users</span>
                    <p className="about__tl-note">
                      The cheminot who needs to understand the screen in three seconds
                      was my first school in UX — interfaces where ambiguity costs a missed train.
                    </p>
                    <span className="about__tl-stack">React · Java · REST · Agile</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── IV — Now ── */}
          <section className="about__section">
            <div className="about__label-col">
              <span className="about__section-num">IV — Now</span>
              <span className="about__section-sub">le présent</span>
            </div>
            <div className="about__content-col">
              <p>
                I am pursuing a Master in Creative Technology — not as a departure from
                engineering, but as its formalisation. I have always worked at the boundary
                between system and meaning.
              </p>
              <blockquote className="about__pull-quote">
                The same attention to the seam between what is shown and what is hidden
                — whether the medium is silver, ink, or code.
              </blockquote>
              <p className="about__pull-attr">— Note d'intention</p>
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
            <span>{site.title} · {site.titleFr} · {new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>

      <div className="about__scroll-hint" aria-hidden="true">scroll ↓</div>
    </div>
  );
}
