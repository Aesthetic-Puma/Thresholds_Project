import "./DesktopGate.css";

// ─────────────────────────────────────────────
// DesktopGate — seuil fermé sur mobile / tactile.
//
// Thresholds est une expérience pilotée au curseur (parallax, survol,
// proximité, mots qui fuient). Sur tactile, ce modèle n'existe pas — plutôt
// que d'en livrer une version dégradée, on assume « conçu pour desktop »
// dans le vocabulaire du projet (la porte, le seuil).
//
// Monté en amont de <App/> (voir main.jsx) pour que l'app — et ses boucles
// rAF / vidéos — ne se charge même pas sur mobile.
// ─────────────────────────────────────────────

export default function DesktopGate({ site }) {
  return (
    <div className="gate" role="dialog" aria-label="Desktop experience required">
      <div className="gate__grain" aria-hidden="true" />

      <div className="gate__inner">
        <h1 className="gate__title">{site.title.toUpperCase()}</h1>
        <p className="gate__jp" aria-hidden="true" lang="ja">{site.titleJp}</p>

        <div className="gate__divider" aria-hidden="true" />

        <p className="gate__line">Some thresholds only open on a larger screen.</p>
        <p className="gate__sub">
          Thresholds is a cursor-led experience, composed for desktop.
          <br />
          Return on a computer to step through.
        </p>
      </div>

      <div className="gate__foot" aria-hidden="true">
        <div className="gate__glyphs">
          <span>空</span>
          <span>時</span>
          <span>他</span>
        </div>
        <p className="gate__sig">{site.author} · {site.year}</p>
      </div>
    </div>
  );
}
