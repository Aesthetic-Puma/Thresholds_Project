export const SITE = {
  title:      "Thresholds",
  titleFr:    "Seuils",
  titleJp:    "敷居",
  titleKr:    "문턱",
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
    id:        "space",
    label:     "Space",
    labelFr:   "L'Espace",
    navWord:   "Space",
    videoSrcs: [
      "/videos/space-london.mov",
      "/videos/space-korean-street.mp4",
      "/videos/space-street-piano.mp4",
      "/videos/space-buildings.mp4",
    ],

    passages: [
      // ── ANCRE 01
      {
        anchor: true,
        src:    "/photos/temps/mains-statue.jpg",
        alt:    "Hand reaching toward marble statue hand, Louvre, close up",
        source: "Isometric Rain",
        short:  "Sometimes, the right place is a person.",
        full:   "Sometimes, the right place is a person.",
        anchors: [
          { word: "right place", note: "not a place\na presence",         px: 48, py: 42 },
          { word: "person",      note: "the living hand\nagainst marble",  px: 65, py: 72 },
        ],
      },
      // ── ANCRE 02
      {
        anchor: true,
        src:    "/photos/temps/hanbok-mannequins.jpg",
        alt:    "Hanbok mannequins in darkness, identical figures repeated",
        source: "Silent Anomaly",
        short:  "Dozens of copies of herself lay scattered across the floor, like shattered replicas of a fragmented reality.",
        full:   "Dozens of copies of herself lay scattered across the floor, like shattered replicas of a fragmented reality.",
        anchors: [
          { word: "copies",             note: "the empty dress\nmultiplied",  px: 25, py: 35 },
          { word: "scattered",          note: "the series\ncollapsing",       px: 55, py: 60 },
          { word: "fragmented reality", note: "one self\nin pieces",           px: 75, py: 78 },
        ],
      },
      // ── ÉCHO 03
      {
        anchor: false,
        src:    "/photos/espace/couple-escaliers.jpg",
        alt:    "Couple on stairs, aerial view, B&W",
        source: "Darkroom",
        short:  "His solitary silhouette dissolved into the ever-shifting urban architecture.",
        full:   "His solitary silhouette dissolved into the ever-shifting urban architecture.",
        anchors: [
          { word: "solitary silhouette", note: "the back\nagainst the city",  px: 50, py: 28 },
          { word: "dissolved",           note: "the steps\nabsorbing him",    px: 28, py: 55 },
          { word: "ever-shifting",       note: "the geometry\nin motion",     px: 72, py: 74 },
        ],
      },
      // ── ÉCHO 04
      {
        anchor: false,
        src:    "/photos/espace/ruelle-coreenne.jpg",
        alt:    "Korean alley at night, man alone with phone",
        source: "Isometric Rain",
        short:  "The promise of a paradise elsewhere grew more distant, yet he clung to it desperately.",
        full:   "The promise of a paradise elsewhere grew more distant, yet he clung to it desperately.",
        anchors: [
          { word: "paradise elsewhere",    note: "the signs\npromise",         px: 22, py: 25 },
          { word: "more distant",          note: "the alley\nfading",          px: 55, py: 52 },
          { word: "clung to it desperately", note: "the light\nof the phone",  px: 68, py: 74 },
        ],
      },
      // ── ÉCHO 05
      {
        anchor: false,
        src:    "/photos/temps/musee-orange.jpg",
        alt:    "Visitor seated before museum display, orange light",
        source: "Reminiscence",
        short:  "A dark mass moved in the distance. It must have been enormous, given how far away it was.",
        full:   "A dark mass moved in the distance. It must have been enormous, given how far away it was.",
        anchors: [
          { word: "dark mass",      note: "the shards\nbehind the glass",        px: 65, py: 28 },
          { word: "in the distance", note: "the seated man\nfacing the unknown", px: 28, py: 52 },
          { word: "enormous",       note: "the scale\ninverted",                  px: 52, py: 74 },
        ],
      },
      // ── ÉCHO 06
      {
        anchor: false,
        src:    "/photos/espace/homme-ombre.jpg",
        alt:    "Old man, giant shadow on wall, B&W",
        source: "Darkroom",
        short:  "Every step was an escape, but also an assertion of his status as a perpetual outsider.",
        full:   "Every step was an escape, but also an assertion of his status as a perpetual outsider.",
        anchors: [
          { word: "escape",            note: "the shadow\nlarger than him",  px: 28, py: 28 },
          { word: "perpetual outsider", note: "not his wall\nnot his city",  px: 65, py: 55 },
          { word: "assertion",         note: "he walks on\nanyway",          px: 48, py: 78 },
        ],
      },
    ],
  },

  // ── CHAMBRE II — Time ──────────────────────
  {
    id:        "time",
    label:     "Time",
    labelFr:   "Le Temps",
    navWord:   "Time",
    videoSrcs: [
      "/videos/time-bridge.mp4",
      "/videos/time-monk.mp4",
      "/videos/time-peacock.mp4",
      "/videos/time-pagoda.mp4",
    ],

    passages: [
      // ── ANCRE 01
      {
        anchor: true,
        src:    "/photos/autre/couple-flou-fantome.jpg",
        alt:    "Couple back to back, motion blur on one face, B&W",
        source: "The Specter of Her Voice",
        short:  "Stories take time to get their teeth into us.",
        full:   "Stories take time to get their teeth into us.",
        anchors: [
          { word: "take time",       note: "the smoke\nbeginning",           px: 35, py: 28 },
          { word: "get their teeth", note: "a face\ngoing under",            px: 62, py: 52 },
          { word: "into us",         note: "the exposure\nstretching",       px: 50, py: 78 },
        ],
      },
      // ── ANCRE 02
      {
        anchor: true,
        src:    "/photos/autre/femme-rouge-venise.jpg",
        alt:    "Woman in red dress, Venice, eyes closed",
        source: "Reminiscence",
        short:  "You will always be my favourite memory.",
        full:   "You will always be my favourite memory.",
        anchors: [
          { word: "always",   note: "the columns\nunmoving",    px: 50, py: 25 },
          { word: "favourite", note: "the red\nof memory",     px: 72, py: 72 },
          { word: "memory",   note: "eyes closed\nto the past", px: 28, py: 55 },
        ],
      },
      // ── ÉCHO 03
      {
        anchor: false,
        src:    "/photos/espace/graffiti-fenetre.jpg",
        alt:    "Painted couple on wall, woman in lit window",
        source: "Reminiscence",
        short:  "A frozen image from simpler times, when the world was still comprehensible.",
        full:   "A frozen image from simpler times, when the world was still comprehensible.",
        anchors: [
          { word: "frozen image",   note: "painted on the wall\nnever ending",        px: 22, py: 35 },
          { word: "simpler times",  note: "the window\nwhere someone lives",           px: 72, py: 52 },
          { word: "comprehensible", note: "the frozen couple\nagainst the living",     px: 50, py: 74 },
        ],
      },
      // ── ÉCHO 04
      {
        anchor: false,
        src:    "/photos/autre/femme-bulles.jpg",
        alt:    "Woman with soap bubbles, man turned away, interior scene",
        source: "The Specter of Her Voice",
        short:  "Was it a dream, or a reality she could not escape?",
        full:   "Was it a dream, or a reality she could not escape?",
        anchors: [
          { word: "dream",   note: "the bubbles\nevaporating",  px: 55, py: 25 },
          { word: "reality", note: "the man\nfacing away",      px: 28, py: 55 },
          { word: "escape",  note: "the scene\ndissolving",     px: 65, py: 74 },
        ],
      },
      // ── ÉCHO 05
      {
        anchor: false,
        src:    "/photos/espace/deux-femmes-embrasure.jpg",
        alt:    "Two women seen through a doorframe, B&W",
        source: "Divine Encounter",
        short:  "This place is not really a café. It is an in-between space.",
        full:   "This place is not really a café. It is an in-between space.",
        anchors: [
          { word: "not really",      note: "the doorframe\nbetween two worlds", px: 15, py: 38 },
          { word: "café",            note: "a woman\nher blurred double",        px: 55, py: 35 },
          { word: "in-between space", note: "neither inside\nnor outside",       px: 50, py: 72 },
        ],
      },
      // ── ÉCHO 06
      {
        anchor: false,
        src:    "/photos/autre/allumettes.jpg",
        alt:    "Woman in red dress, hands lighting matches",
        source: "Between Images",
        short:  "Her silhouette turned into a blaze.",
        full:   "Her silhouette turned into a blaze.",
        anchors: [
          { word: "silhouette", note: "three hands\none flame",   px: 50, py: 25 },
          { word: "turned",     note: "the collective\nritual",   px: 28, py: 55 },
          { word: "blaze",      note: "the flame\nalready lit",   px: 68, py: 74 },
        ],
      },
    ],
  },

  // ── CHAMBRE III — The Other ────────────────
  {
    id:        "other",
    label:     "The Other",
    labelFr:   "L'Autre",
    navWord:   "The Other",
    videoSrcs: [
      "/videos/other-palace.mp4",
      "/videos/other-guards.mov",
      "/videos/other-protest.mp4",
      "/videos/other-police.mp4",
    ],

    passages: [
      // ── ANCRE 01
      {
        anchor: true,
        src:    "/photos/autre/miroir-vert.jpg",
        alt:    "Woman silhouette in green neon mirror, circular light",
        source: "Silent Anomaly",
        short:  "You… you're not real…",
        full:   "You… you're not real…",
        anchors: [
          { word: "You",      note: "the direct\naddress",     px: 32, py: 28 },
          { word: "not real", note: "in the mirror\nanother",  px: 50, py: 55 },
        ],
      },
      // ── ANCRE 02
      {
        anchor: true,
        src:    "/photos/autre/portrait-pierre-verte.jpg",
        alt:    "Portrait woman against green stone wall, direct gaze",
        source: "Darkroom",
        short:  "Her eyes, a deep blue, seemed to pierce through the photograph, as if she were watching Jack with unsettling intensity.",
        full:   "Her eyes, a deep blue, seemed to pierce through the photograph, as if she were watching Jack with unsettling intensity.",
        anchors: [
          { word: "pierce through the photograph", note: "the gaze\nthat returns",       px: 50, py: 28 },
          { word: "unsettling intensity",          note: "the stone\nas backdrop",        px: 28, py: 55 },
          { word: "watching Jack",                 note: "she looks\nbeyond the frame",   px: 65, py: 72 },
        ],
      },
      // ── ÉCHO 03
      {
        anchor: false,
        src:    "/photos/temps/homme-marbres-elgin.jpg",
        alt:    "Man sketching before headless Elgin Marbles",
        source: "Divine Encounter",
        short:  "We are not so different, you and I. We observe, we learn, we try to understand.",
        full:   "We are not so different, you and I. We observe, we learn, we try to understand.",
        anchors: [
          { word: "not so different", note: "creator\nfacing creation",  px: 48, py: 28 },
          { word: "observe",          note: "the notebook\non his knee",  px: 35, py: 72 },
          { word: "understand",       note: "the missing\nheads",          px: 65, py: 52 },
        ],
      },
      // ── ÉCHO 04
      {
        anchor: false,
        src:    "/photos/temps/moine-bouddhas.jpg",
        alt:    "Buddhist monk facing golden Buddhas, candles lit",
        source: "The Specter of Her Voice",
        short:  "Stay with me.",
        full:   "Stay with me.",
        anchors: [
          { word: "Stay",    note: "the plea\nto the divine",           px: 48, py: 25 },
          { word: "with me", note: "the three Buddhas\ndo not answer",  px: 65, py: 72 },
        ],
      },
      // ── ÉCHO 05
      {
        anchor: false,
        src:    "/photos/autre/femme-fleurs-arches.jpg",
        alt:    "Woman with flowers under gothic arches",
        source: "Reminiscence",
        short:  "Everything is fine. I am here.",
        full:   "Everything is fine. I am here.",
        anchors: [
          { word: "here", note: "lateral\npresence",           px: 50, py: 18 },
          { word: "fine", note: "the arches\nremember",        px: 25, py: 52 },
          { word: "I am", note: "she looks\naway",             px: 68, py: 72 },
        ],
      },
      // ── ÉCHO 06
      {
        anchor: false,
        src:    "/photos/temps/garde-jardin-statue.jpg",
        alt:    "Man in hanbok facing half-hidden garden statue",
        source: "Darkroom",
        short:  "A strange and haunting sensation overtook him, as though he were under the spell of an irresistible force.",
        full:   "A strange and haunting sensation overtook him, as though he were under the spell of an irresistible force.",
        anchors: [
          { word: "haunting",    note: "the man facing\nthe hidden statue", px: 50, py: 38 },
          { word: "spell",       note: "the garden\nencircling him",        px: 22, py: 25 },
          { word: "irresistible", note: "impossible\nto look away",         px: 70, py: 72 },
        ],
      },
    ],
  },
];

export const about = {
  photo:    "/photos/auteur/signature.jpg",
  name:     "Jean Viratel",
  roles:    ["Photographer", "Writer", "Engineer"],
  tagline:  "I work at the threshold between systems and stories — building software, photographing the spaces between people and their worlds, writing fiction where the real quietly unravels.",
  book: {
    title:     "Élégies Oubliées",
    subtitle:  "Recueil de fictions courtes",
    publisher: "2024",
    link:      "https://www.babelio.com/livres/Viratel-legies-oubliees/1893561",
    cover:     "/photos/auteur/book-cover.png",
    desc:      "Twelve stories, set in the half-light between memory and presence. A collection about thresholds, in the literal and figurative sense — doorways, nightfalls, faces seen and not quite recognised. Each piece in this portfolio is in conversation with one of these stories.",
  },
  contact:  "jviratel@gmail.com",
  linkedin: "https://www.linkedin.com/in/jean-viratel/",
  cv:       "/cv-jean-viratel.pdf",
};
