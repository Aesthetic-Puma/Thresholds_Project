// ─────────────────────────────────────────────
// chambers.js — patch videoSrc
//
// Ajouter le champ videoSrc à chaque objet
// dans le tableau chambers[].
//
// Placer tes fichiers .mp4 dans /public/videos/
// (Vite sert le dossier public/ à la racine)
//
// Exemple de structure :
//   public/
//     videos/
//       space-teaser.mp4
//       time-teaser.mp4
//       other-teaser.mp4
//
// Recommandations vidéo pour les performances :
//   - Format : mp4 / codec H.264
//   - Résolution : 720×1280 (9:16) suffisant pour 200×356px affiché
//   - Durée : 8–15s en boucle idéalement
//   - Poids : < 4MB par fichier (compresser avec HandBrake ou ffmpeg)
//   - ffmpeg : ffmpeg -i input.mp4 -vf scale=720:-1 -crf 28 -preset slow output.mp4
// ─────────────────────────────────────────────

// Dans ton tableau chambers existant,
// ajouter videoSrc comme ceci :

export const chambers = [
    {
      id:       "space",
      label:    "Space",
      labelFr:  "Espace",
      navWord:  "Space",
      videoSrc: "/videos/space-teaser.mp4",   // ← AJOUTER
      // ... reste de tes données existantes
    },
    {
      id:       "time",
      label:    "Time",
      labelFr:  "Temps",
      navWord:  "Time",
      videoSrc: "/videos/time-teaser.mp4",    // ← AJOUTER
      // ... reste de tes données existantes
    },
    {
      id:       "other",
      label:    "The Other",
      labelFr:  "L'Autre",
      navWord:  "The Other",
      videoSrc: "/videos/other-teaser.mp4",   // ← AJOUTER
      // ... reste de tes données existantes
    },
  ];
  
  // Si tu n'as pas encore décidé quelle vidéo
  // va dans quelle chambre, mettre videoSrc: null
  // — Home.jsx vérifie ch.videoSrc avant de
  // rendre la balise <video>.