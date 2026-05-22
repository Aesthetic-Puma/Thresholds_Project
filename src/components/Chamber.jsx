// ─────────────────────────────────────────────
// SEUILS / THRESHOLDS — Portfolio Data
// Jean Viratel — Creative Technology
//
// Structure:
//   3 chambers (Space / Time / The Other)
//   Each chamber has passages — excerpts from
//   Élégies Oubliées, translated poetically to English.
//   Each passage links to one photo + anchored words.
//
// Per passage:
//   src     — image path in /public/photos/
//   alt     — accessible description
//   source  — nouvelle title (French)
//   short   — truncated version for the list screen
//   full    — complete passage shown under the photo
//   anchors — [ { word, note, px, py } ]
//             px/py = % position on the photo (0–100)
// ─────────────────────────────────────────────

export const SITE = {
  title:      "Thresholds",
  titleFr:    "Seuils",
  titleJp:    "敷居",
  subtitle:   "Photography · Writing · Code",
  author:     "Jean Viratel",
  tagline:    "Here, nothing stands quite straight.\nEvery image is a door left ajar.",
  enterLabel: "enter",
  bookTitle:  "Élégies Oubliées",
  bookLink:   "https://www.babelio.com/livres/Viratel-legies-oubliees/1893561",
};

export const chambers = [

  // ── CHAMBRE I — Space ──────────────────────
  {
    id:      "space",
    label:   "Space",
    labelFr: "L'Espace",
    navWord: "Space",

    passages: [
      {
        src:    "/photos/espace/couple-escaliers.jpg",
        alt:    "Couple on stairs, aerial view, B&W",
        source: "Chambre Noire",
        short:  "His solitary silhouette dissolved into the ever-shifting city…",
        full:   "His solitary silhouette dissolved into the ever-shifting city. He was an ephemeral witness to a life that moved around him — never through him.",
        anchors: [
          { word: "solitary silhouette", note: "one among many\nyet alone",       px: 52, py: 28 },
          { word: "ever-shifting",       note: "the city absorbs\nall bodies",     px: 16, py: 55 },
          { word: "never through him",   note: "passing through\nnever staying",   px: 74, py: 70 },
        ],
      },
      {
        src:    "/photos/espace/graffiti-fenetre.jpg",
        alt:    "Painted couple on wall, woman in lit window",
        source: "Chambre Noire",
        short:  "Every encounter left behind only traces — fragments that would dissolve…",
        full:   "Every encounter left behind only traces — fragments of a life that would dissolve as quickly as they had surfaced. Each step an escape, and an admission.",
        anchors: [
          { word: "traces",             note: "painted on the wall\nnever touched", px: 22, py: 35 },
          { word: "dissolve",           note: "two worlds\nside by side",           px: 72, py: 52 },
          { word: "each step an escape", note: "the light\nbehind the glass",      px: 76, py: 74 },
        ],
      },
      {
        src:    "/photos/espace/porte-coreenne.jpg",
        alt:    "Woman from behind, Korean door at night",
        source: "Chambre Noire",
        short:  "The boundaries between what is and what could be grow blurred…",
        full:   "The boundaries between what is and what could be grow blurred at the threshold of the door. She stood there — not yet inside, not yet gone.",
        anchors: [
          { word: "boundaries grow blurred", note: "the door\nstill closed",          px: 50, py: 28 },
          { word: "threshold",               note: "between two\nworlds at once",      px: 28, py: 55 },
          { word: "not yet gone",            note: "from behind\nalways from behind",  px: 65, py: 74 },
        ],
      },
      {
        src:    "/photos/espace/couple-pluie-coree.jpg",
        alt:    "Couple under umbrella, neon Korean alley, rain",
        source: "Pluie Isométrique",
        short:  "A city where time hangs suspended beneath a perpetual veil of rain…",
        full:   "A city where time hangs suspended beneath a perpetual veil of rain. The neon signs cast uncertain halos through the toxic air, promising nothing.",
        anchors: [
          { word: "time suspended",    note: "two figures\nstill in the rain",       px: 50, py: 22 },
          { word: "perpetual veil",    note: "the alley swallows\nall who enter",    px: 22, py: 52 },
          { word: "promising nothing", note: "Korean neon\ndripping light",          px: 70, py: 68 },
        ],
      },
      {
        src:    "/photos/espace/homme-ombre.jpg",
        alt:    "Old man, giant shadow on wall, B&W",
        source: "Chambre Noire",
        short:  "He was an ephemeral spectator of the life unfolding around him…",
        full:   "He was an ephemeral spectator of the life unfolding around him. Each step an escape — and an assertion of his perpetual foreignness in a world not built for him.",
        anchors: [
          { word: "ephemeral spectator", note: "passing through\nnever there",         px: 65, py: 22 },
          { word: "perpetual foreignness", note: "the shadow\nlarger than the man",   px: 28, py: 60 },
          { word: "not built for him",    note: "not his wall\nnot his city",          px: 55, py: 80 },
        ],
      },
      {
        src:    "/photos/espace/deux-femmes-embrasure.jpg",
        alt:    "Two women seen through a doorframe, B&W",
        source: "Entre les images",
        short:  "Observed from the dark, the lit room held another world entire…",
        full:   "Observed from the dark, the lit room held another world entire — just beyond reach. She looked in from outside, as she always had.",
        anchors: [
          { word: "observed from the dark", note: "the doorframe\nframes everything",  px: 15, py: 40 },
          { word: "another world entire",   note: "lit from within\nunseen from here", px: 55, py: 35 },
          { word: "just beyond reach",      note: "always outside\nalways looking in", px: 50, py: 72 },
        ],
      },
    ],
  },

  // ── CHAMBRE II — Time ──────────────────────
  {
    id:      "time",
    label:   "Time",
    labelFr: "Le Temps",
    navWord: "Time",

    passages: [
      {
        src:    "/photos/temps/musee-orange.jpg",
        alt:    "Visitor seated before museum display, orange light",
        source: "Chambre Noire",
        short:  "The flickering candles cast reflections in his eyes…",
        full:   "The flickering candles cast reflections in his eyes, deepening the air of mystery around him. The click of the shutter resonated through the room — a small eternity.",
        anchors: [
          { word: "flickering candles", note: "amber light\non ancient things", px: 20, py: 35 },
          { word: "air of mystery",     note: "alone before\nthe centuries",    px: 55, py: 25 },
          { word: "small eternity",     note: "clay and bone\nand silence",     px: 72, py: 62 },
        ],
      },
      {
        src:    "/photos/temps/cathedrale.jpg",
        alt:    "Man alone in cathedral, stained glass",
        source: "Réminiscence",
        short:  "A frozen image of simpler times, when the world was still legible…",
        full:   "A frozen image of simpler times, when the world was still legible. A fleeting glimmer of nostalgia crossed her eyes and vanished — like light through old glass.",
        anchors: [
          { word: "frozen image",          note: "a man alone\nbefore the sacred",   px: 48, py: 25 },
          { word: "world still legible",   note: "stained glass\ndoes not change",   px: 22, py: 55 },
          { word: "light through old glass", note: "the nape turned\naway from us",  px: 66, py: 73 },
        ],
      },
      {
        src:    "/photos/temps/moine-bouddhas.jpg",
        alt:    "Buddhist monk facing golden Buddhas",
        source: "Entre les images",
        short:  "She stood frozen, staring at the door. A silhouette entered…",
        full:   "She stood frozen, staring at the door. A silhouette entered the room, advancing with quiet, inexorable purpose. She held her breath.",
        anchors: [
          { word: "frozen, staring",    note: "the monk before\nthe golden Buddhas", px: 48, py: 22 },
          { word: "silhouette",         note: "always from behind\nalways",          px: 28, py: 52 },
          { word: "inexorable purpose", note: "he will not\nturn back",              px: 66, py: 72 },
        ],
      },
      {
        src:    "/photos/temps/moine-temple.jpg",
        alt:    "Monk in red robe on temple threshold",
        source: "Entrevue Divine",
        short:  "His eyes, worn by years, seemed to scan a distant horizon…",
        full:   "His eyes, worn by years, seemed to scan a distant and unreachable horizon. Every line of his face held something he could not set down.",
        anchors: [
          { word: "distant horizon",    note: "standing at the\nedge of the ancient", px: 48, py: 22 },
          { word: "worn by years",      note: "the temple\npredates memory",         px: 22, py: 52 },
          { word: "could not set down", note: "red robe\non the threshold",          px: 68, py: 72 },
        ],
      },
      {
        src:    "/photos/temps/homme-marbres-elgin.jpg",
        alt:    "Man sketching before headless Elgin Marbles",
        source: "Chambre Noire",
        short:  "He found himself drawing what time had already unmade…",
        full:   "He found himself drawing what time had already unmade. He who creates, facing what was created — centuries apart, the same gesture, the same silence.",
        anchors: [
          { word: "drawing",              note: "the sketchbook\nopen on his knee",  px: 35, py: 70 },
          { word: "time had unmade",      note: "headless figures\nstill standing",  px: 65, py: 28 },
          { word: "the same gesture",     note: "creator\nand creation",             px: 48, py: 52 },
        ],
      },
      {
        src:    "/photos/temps/garde-royal-dos.jpg",
        alt:    "Royal guard from behind, ornate palace facade",
        source: "Entrevue Divine",
        short:  "The landscapes scrolled past like ephemeral paintings…",
        full:   "The landscapes scrolled past like ephemeral paintings — history frozen mid-breath. He stood with his back to the present, facing only what had already passed.",
        anchors: [
          { word: "ephemeral paintings", note: "the dragon\nembroidered on his back", px: 50, py: 45 },
          { word: "frozen mid-breath",   note: "the palace\ndoes not blink",          px: 22, py: 25 },
          { word: "what had passed",     note: "back turned\nto the present",         px: 70, py: 72 },
        ],
      },
    ],
  },

  // ── CHAMBRE III — The Other ────────────────
  {
    id:      "other",
    label:   "The Other",
    labelFr: "L'Autre",
    navWord: "The Other",

    passages: [
      {
        src:    "/photos/autre/miroir-vert.jpg",
        alt:    "Woman silhouette in green neon mirror",
        source: "Chambre Noire",
        short:  "Her eyes seemed to pierce straight through — watching with unsettling intensity…",
        full:   "Her eyes seemed to pierce straight through — watching with an unsettling intensity, as if something irresistible had already taken hold.",
        anchors: [
          { word: "pierce straight through",  note: "the gaze inside\nthe green mirror", px: 48, py: 28 },
          { word: "unsettling intensity",     note: "encircled\nby cold light",          px: 28, py: 58 },
          { word: "already taken hold",       note: "the circle\nholds her in",          px: 66, py: 74 },
        ],
      },
      {
        src:    "/photos/autre/couple-flou-fantome.jpg",
        alt:    "Couple back to back, motion blur on one face",
        source: "Anomalie Silencieuse",
        short:  "Even in the growing dark of uncertainty, he tried to reason his way through…",
        full:   "Even in the growing dark of uncertainty, he tried to reason his way through. But the walls seemed to close in — indifferent to logic, indifferent to him.",
        anchors: [
          { word: "growing dark",        note: "the blur takes\none of the faces",      px: 32, py: 28 },
          { word: "reason his way",      note: "together\nyet already apart",           px: 62, py: 50 },
          { word: "walls seemed to close", note: "one is leaving\nthe other remains",   px: 50, py: 75 },
        ],
      },
      {
        src:    "/photos/autre/femme-rouge-venise.jpg",
        alt:    "Woman in red dress, Venice, eyes closed",
        source: "Chambre Noire",
        short:  "A sensation strange and bewitching took hold — as if under an irresistible force…",
        full:   "A sensation strange and bewitching took hold — as if under an irresistible force. He could not look away. The real had begun, quietly, to unravel.",
        anchors: [
          { word: "bewitching",           note: "red against\ncold stone",              px: 50, py: 28 },
          { word: "irresistible force",   note: "eyes closed\nto the world",            px: 28, py: 55 },
          { word: "quietly unravel",      note: "the columns\nstand unmoved",           px: 70, py: 72 },
        ],
      },
      {
        src:    "/photos/autre/allumettes.jpg",
        alt:    "Woman in red dress, hands lighting matches",
        source: "Entrevue Divine",
        short:  "Faces pressed against the glass, barely contained…",
        full:   "Faces pressed against the glass, their excitement barely contained. On the other side — a murmur of strangers, a sea of eyes fixed on something they could not name.",
        anchors: [
          { word: "pressed against the glass", note: "three hands\none flame",         px: 50, py: 28 },
          { word: "barely contained",          note: "the fire\nalready lit",          px: 28, py: 55 },
          { word: "could not name",            note: "she holds still\namong the hands", px: 68, py: 74 },
        ],
      },
      {
        src:    "/photos/autre/portrait-pierre-verte.jpg",
        alt:    "Portrait woman against green stone wall",
        source: "Réminiscence",
        short:  "The metallic smell of rain clung to her jacket like a shadow…",
        full:   "The metallic smell of rain clung to her jacket like a shadow that would not leave. Outside, the city's lights danced across the angles of everything.",
        anchors: [
          { word: "shadow that would not leave", note: "the wall holds her\nlike stone", px: 50, py: 28 },
          { word: "city's lights",               note: "green cold\nagainst skin",       px: 28, py: 55 },
          { word: "angles of everything",        note: "she looks away\ntoward what",    px: 66, py: 74 },
        ],
      },
      {
        src:    "/photos/autre/femme-fleurs-arches.jpg",
        alt:    "Woman with flowers under gothic arches",
        source: "Réminiscence",
        short:  "She had not remembered. But that does not mean she had not lived it…",
        full:   "She had not remembered. But that does not mean she had not lived it. Not remembering a thing does not mean it did not happen. Keep that in mind.",
        anchors: [
          { word: "not remembered",     note: "the arches\nremember for her",        px: 50, py: 18 },
          { word: "not mean she had not lived", note: "flowers in\nthe dark",        px: 25, py: 52 },
          { word: "keep that in mind",  note: "she looks\nelsewhere",                px: 68, py: 72 },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────
// ABOUT
// ─────────────────────────────────────────────
export const about = {
  photo:  "/photos/auteur/signature.jpg",
  name:   "Jean Viratel",
  roles:  ["Full Stack Engineer", "Photographer", "Author"],
  bio: `I write code the way I write fiction — searching for what lies beneath the surface.

Based in France, I have worked as a full stack engineer since 2020, building systems for clients including SNCF. In parallel, I photograph the spaces between people and their worlds, and I write stories where the real quietly unravels.

Élégies Oubliées, my debut collection of short fiction, was published in 2024. It explores the thresholds between what is visible and what persists in shadow.

This portfolio is itself an object I built — a site that behaves the way my photographs do: it does not explain. It opens a door, and waits.`,
  book: {
    title:     "Élégies Oubliées",
    publisher: "Published 2024",
    link:      "https://www.babelio.com/livres/Viratel-legies-oubliees/1893561",
    cover:     "/photos/auteur/book-cover.jpg",
  },
  contact: "contact@jeanviratel.com",
  cv:      "/cv-jean-viratel.pdf",
};