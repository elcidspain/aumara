export const LANGS = [
  { id: "es", code: "ES", name: "Español" },
  { id: "en", code: "EN", name: "English" },
  { id: "ru", code: "RU", name: "Русский" },
  { id: "fr", code: "FR", name: "Français" },
  { id: "de", code: "DE", name: "Deutsch" },
  { id: "nl", code: "NL", name: "Nederlands" },
  { id: "it", code: "IT", name: "Italiano" },
  { id: "pt", code: "PT", name: "Português" },
  { id: "ca", code: "CA", name: "Català" },
  { id: "pl", code: "PL", name: "Polski" },
  { id: "uk", code: "UK", name: "Українська" },
  { id: "sv", code: "SV", name: "Svenska" },
] as const;

export type Lang = (typeof LANGS)[number]["id"];
export type NodeCopy = { title: string; subtitle: string; description: string; label: string };
export type Copy = {
  navWalk: string; navHouses: string; navRetreats: string; navOperator: string; navBook: string;
  eyebrow: string; h1: string; lead: string; ctaWalk: string; ctaBookBeds: string; operator: string;
  checkin: string; checkout: string; openAvail: string; quickNote: string; placeEyebrow: string;
  manifestoBefore: string; manifestoEm: string; manifestoAfter: string; exploreEyebrow: string;
  exploreH2: string; exploreP: string; mapAlt: string; tagWest: string; tagRoad: string;
  pointFootage: string; enterPoint: string; openBeds: string; walkNote: string; stayEyebrow: string;
  stayH2: string; stayP: string; chaletH3: string; chaletP: string; factHouse: string; factOpen: string;
  factMezz: string; factPan: string; bookChalet: string; seeRoute: string; supH3: string; supP: string;
  factLarger: string; factLiving: string; factBed: string; factOutdoor: string; bookSup: string;
  perkH2: string; perkP: string; galEyebrow: string; galH2: string; galP: string; capPath: string;
  capValley: string; capInside: string; capColored: string; capGreen: string; retEyebrow: string;
  retH2: string; retP: string; r1s: string; r1h: string; r1p: string; r2s: string; r2h: string; r2p: string;
  r3s: string; r3h: string; r3p: string; r4s: string; r4h: string; r4p: string; evEyebrow: string;
  evH2: string; evP: string; ev1: string; ev2: string; ev3: string; ev4: string; ev5: string; ev6: string;
  discuss: string; opEyebrow: string; opH2: string; opP: string; brandPlace: string; brandP: string;
  rowElcid: string; rowElcidV: string; rowBook: string; rowBookV: string; rowFmt: string; rowFmtV: string;
  rowWalk: string; rowWalkV: string; legalEyebrow: string; legalP: string; rowCif: string; rowAddr: string;
  rowEmail: string; rowTel: string; addr: string; finalEyebrow: string; finalH2: string; finalP: string;
  walkAgain: string; footerOp: string; close: string; prev: string; next: string; backMap: string;
  pointOf: string; of08: string; flightAria: string; openPoint: string; langLabel: string;
  nodes: Record<string, NodeCopy>;
};

const nodes: Record<string, NodeCopy> = {
  "01": { title: "Central viewpoint", subtitle: "Green house, ochre houses and the valley.", description: "Centre of the site before the route turns west.", label: "Central view" },
  "02": { title: "West approach", subtitle: "Path toward the red house.", description: "West between the planted terraces.", label: "West approach" },
  "03": { title: "Red house", subtitle: "Western house and entrance.", description: "Close view of the red house.", label: "Red house" },
  "04": { title: "Green house", subtitle: "Back toward the central route.", description: "Return east past the green house.", label: "Green house" },
  "05": { title: "The descent", subtitle: "The path drops between the houses.", description: "Slope and changing levels.", label: "Descent" },
  "06": { title: "Upper path", subtitle: "Higher branch of the site.", description: "Trees and house entrances.", label: "Upper path" },
  "07": { title: "Lower route", subtitle: "Lower section and private entrances.", description: "Closer to the valley edge.", label: "Lower route" },
  "08": { title: "Western return", subtitle: "Ochre house and the road below.", description: "Reconnects western houses with the valley road.", label: "Return west" },
};

const EN: Copy = {
  navWalk: "Walk the place", navHouses: "Houses", navRetreats: "Retreats", navOperator: "Operator", navBook: "Book",
  eyebrow: "Benidoleig · Marina Alta · Costa Blanca",
  h1: "Places that give you more.\nAt AUMARA you find yourself again.",
  lead: "Independent houses among pines, open to the valley. A complete house. Your own entrance.",
  ctaWalk: "Walk the place", ctaBookBeds: "Check availability",
  operator: "Operated by EL CID VENTURES BENIDOLEIG S.L. ·",
  checkin: "Check-in", checkout: "Check-out", openAvail: "Check availability",
  quickNote: "Rates, availability and terms are confirmed on the direct booking.",
  placeEyebrow: "The place", manifestoBefore: "The most beautiful thing is not the place. ",
  manifestoEm: "It is how the place makes you feel.",
  manifestoAfter: " It is not about having more. It is about choosing better.",
  exploreEyebrow: "Walkthrough", exploreH2: "Before you arrive, start walking it.",
  exploreP: "Open the plan, enter any of the eight points, and see the houses, the paths and the valley.",
  mapAlt: "AUMARA site plan with houses along the paths", tagWest: "← West / EL CID", tagRoad: "Valley road",
  pointFootage: "real site footage", enterPoint: "Enter this point", openBeds: "Check dates",
  walkNote: "Eight real points on the ground. After the opening flight: the path and the interior.",
  stayEyebrow: "Stay", stayH2: "This is not a row of rooms.",
  stayP: "Chalet and Superior Chalet. Every booking is a complete house, with its own entrance.",
  chaletH3: "A complete house, open to the land.",
  chaletP: "Own entrance, sleeping zone, open mezzanine and windows to the valley. Up to four guests.",
  factHouse: "Complete house", factOpen: "Open-plan living", factMezz: "Mezzanine", factPan: "Panoramic windows",
  bookChalet: "Check Chalet dates", seeRoute: "See it on the walk",
  supH3: "More volume. Sleep apart.",
  supP: "Superior format: larger living room, separate bedroom. Up to six guests.",
  factLarger: "Larger house", factLiving: "Living room", factBed: "Separate bedroom", factOutdoor: "Private outdoor space",
  bookSup: "Check Superior dates", perkH2: "A detail on arrival",
  perkP: "On a direct booking a taste of the Marina Alta waits in the house.",
  galEyebrow: "Light and valley", galH2: "Atmosphere sells more than the speech.",
  galP: "Houses, paths, pines and the valley.", capPath: "Path between houses", capValley: "Valley below",
  capInside: "From inside the house", capColored: "Coloured houses", capGreen: "Green house",
  retEyebrow: "Time with others", retH2: "A place to pay attention, not to impress.",
  retP: "Sleep, movement, food and a quiet landscape.",
  r1s: "Hosted rest", r1h: "A rest for women", r1p: "Body, food, nature.",
  r2s: "Communities", r2h: "Community retreats", r2p: "Groups who already know each other.",
  r3s: "Movement", r3h: "Movement outdoors", r3p: "Mountain and time outside, with structure.",
  r4s: "Your programme", r4h: "Bring your retreat", r4p: "You bring the content. AUMARA brings the houses.",
  evEyebrow: "Gatherings", evH2: "Private gatherings, reviewed.",
  evP: "Family, making, leadership or community.",
  ev1: "Family weekends", ev2: "Creative residencies", ev3: "Leadership off-sites",
  ev4: "Community gatherings", ev5: "Private gatherings", ev6: "Hosted food experiences",
  discuss: "Discuss a gathering", opEyebrow: "Who operates",
  opH2: "AUMARA is the place. Booking is direct.",
  opP: "Public brand of the stay. Legal operator in the open.",
  brandPlace: "Brand and place", brandP: "Independent houses in Benidoleig, Marina Alta.",
  rowElcid: "El Cid", rowElcidV: "El Cid · elcidspain.com", rowBook: "Booking", rowBookV: "Direct on AUMARA.me",
  rowFmt: "House formats", rowFmtV: "Chalet and Superior Chalet",
  rowWalk: "On-site walk", rowWalkV: "Eight real points on the ground",
  legalEyebrow: "Legal operator", legalP: "The company responsible for the stay. Same firm as El Cid.",
  rowCif: "CIF", rowAddr: "Address", rowEmail: "Email", rowTel: "Telephone",
  addr: "Urb. Rincón del Silencio, 3, 03759 Benidoleig, Alicante",
  finalEyebrow: "How to enter", finalH2: "Walk the place. Choose the house. Check the dates.",
  finalP: "Availability, rate and terms are shown on AUMARA direct booking.",
  walkAgain: "Back to the walk", footerOp: "Operated by EL CID VENTURES BENIDOLEIG S.L. · CIF B53816989",
  close: "Close", prev: "Previous point", next: "Next point", backMap: "Back to map",
  pointOf: "Point", of08: "of 08",
  flightAria: "Recorded flight between the houses at AUMARA in Benidoleig",
  openPoint: "Open point", langLabel: "Language", nodes,
};

export const COPY: Record<Lang, Copy> = {
  en: EN,
  es: {
    ...EN,
    navWalk: "Recorrer el lugar", navHouses: "Casas", navRetreats: "Retiros", navOperator: "Quién opera", navBook: "Reservar",
    h1: "Hay lugares que te dan más.\nEn AUMARA vuelves a encontrarte.",
    lead: "Casas independientes entre pinos, abiertas al valle. Casa completa. Entrada propia.",
    ctaWalk: "Recorrer el lugar", ctaBookBeds: "Consultar disponibilidad",
    checkin: "Entrada", checkout: "Salida", openAvail: "Consultar disponibilidad",
    stayP: "Chalet y Superior Chalet. Cada reserva es una casa completa, con entrada propia.",
    rowFmtV: "Chalet y Superior Chalet",
  },
  ru: {
    ...EN,
    navWalk: "Пройти место", navHouses: "Дома", navRetreats: "Ретриты", navOperator: "Кто ведёт", navBook: "Бронь",
    h1: "Есть места, которые дают больше.\nВ AUMARA ты снова находишь себя.",
    lead: "Отдельные дома среди сосен, открытые долине. Целый дом. Свой вход.",
    ctaWalk: "Пройти место", ctaBookBeds: "Смотреть даты",
    checkin: "Заезд", checkout: "Выезд", openAvail: "Смотреть даты",
  },
  fr: { ...EN, h1: "Il y a des lieux qui donnent plus.\nÀ AUMARA tu te retrouves." },
  de: { ...EN, h1: "Es gibt Orte, die mehr geben.\nIn AUMARA findest du dich wieder." },
  nl: { ...EN, h1: "Er zijn plekken die meer geven.\nIn AUMARA kom je weer tot jezelf." },
  it: { ...EN, h1: "Ci sono luoghi che danno di più.\nAd AUMARA ti ritrovi." },
  pt: { ...EN, h1: "Há lugares que te dão mais.\nNa AUMARA voltas a encontrar-te." },
  ca: { ...EN, h1: "Hi ha llocs que et donen més.\nA AUMARA et tornes a trobar." },
  pl: { ...EN, h1: "Są miejsca, które dają więcej.\nW AUMARA znów odnajdujesz siebie." },
  uk: { ...EN, h1: "Є місця, які дають більше.\nВ AUMARA ти знову знаходиш себе." },
  sv: { ...EN, h1: "Det finns platser som ger mer.\nPå AUMARA hittar du dig själv igen." },
};

const STORAGE = "aumara-lang";

export function detectLang(): Lang {
  if (typeof window === "undefined") return "es";
  const saved = window.localStorage.getItem(STORAGE);
  if (saved && LANGS.some((l) => l.id === saved)) return saved as Lang;
  const nav = (window.navigator.language || "es").slice(0, 2).toLowerCase();
  const hit = LANGS.find((l) => l.id === nav);
  return hit ? hit.id : "es";
}

export function persistLang(lang: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE, lang);
  document.documentElement.lang = lang;
}
