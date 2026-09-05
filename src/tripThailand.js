export const tripDateKeys = [
  "2026-12-26", "2026-12-27", "2026-12-28", "2026-12-29", "2026-12-30",
  "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03", "2027-01-04", "2027-01-05",
];

export const cityImages = {
  Bangkok: "/thailand/bangkok.jpg",
  "Hua Hin": "/thailand/railway-market.jpg",
  Chumphon: "/thailand/kui-buri.jpg",
  "Khao Sok": "/thailand/khao-sok.jpg",
  "Cheow Lan Lake": "/thailand/cheow-lan.jpg",
  "Phi Phi Island": "/thailand/phi-phi.jpg",
  Krabi: "/thailand/krabi.jpg",
};

export const places = {
  Bangkok: [13.7563, 100.5018],
  "Aeroporto BKK": [13.69, 100.7501],
  "Maeklong Railway Market": [13.4071, 99.9987],
  Phetchaburi: [13.1119, 99.9397],
  "Hua Hin": [12.5684, 99.9577],
  "Sam Roi Yot": [12.2017, 99.9494],
  "Kui Buri": [12.0719, 99.648],
  Chumphon: [10.493, 99.18],
  "Khao Sok": [8.9105, 98.5315],
  "Cheow Lan Lake": [8.9777, 98.8193],
  "Ratchaprapha Pier": [8.9762, 98.8108],
  "Klong Jilad Pier": [8.0421, 98.9182],
  "Phi Phi Island": [7.7407, 98.7784],
  Krabi: [8.0863, 98.9063],
  "Ao Nang": [8.032, 98.8225],
  "Surat Thani": [9.1382, 99.3217],
};

export const routeSequence = [
  "Bangkok", "Hua Hin", "Chumphon", "Khao Sok", "Cheow Lan Lake", "Phi Phi Island", "Krabi", "Bangkok",
];

export const dayMarkerIndexes = [
  [0], [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6], [6, 7], [7], [7],
];

export const currentMarkerIndexes = [0, 1, 2, 3, 4, 5, 6, 6, 7, 7, 7];

export const overviewCityLabelOffsets = {
  Bangkok: [0, -35],
  "Hua Hin": [40, -10],
  Chumphon: [-42, -10],
  "Khao Sok": [-76, -8],
  "Cheow Lan Lake": [82, -18],
  "Phi Phi Island": [-78, 30],
  Krabi: [74, 24],
};

export const overviewStageOffsets = [
  [-6, -6], [0, 0], [0, 0], [-8, -6], [8, -6], [-5, 5], [5, -5], [6, 6],
];

export const cityFacts = {
  Bangkok: {
    healthDeclaration: { state: "Bangkok", district: "Bangkok Metropolis", mainCity: "Bangkok", region: "Thailandia centrale" },
    population: "circa 10,5 milioni nell’area urbana", area: "1.569 km²", scope: "Amministrazione Metropolitana di Bangkok",
    description: "Capitale vivace e stratificata, dove templi dorati, canali, mercati e grattacieli convivono lungo il Chao Phraya.",
    knownFor: "Grand Palace, Wat Pho, Wat Arun, street food, mercati e vita notturna",
    identity: "È il principale nodo culturale e logistico del Paese e il punto di partenza e arrivo del viaggio.",
    languages: "Thailandese; inglese diffuso nelle aree turistiche", altitude: "circa 1,5 m",
  },
  "Hua Hin": {
    healthDeclaration: { state: "Prachuap Khiri Khan", district: "Hua Hin", mainCity: "Hua Hin", region: "Thailandia occidentale · Golfo di Thailandia" },
    population: "circa 65.000", area: "circa 911 km²", scope: "Distretto di Hua Hin",
    description: "Località costiera storica, nota per la lunga spiaggia, il mercato notturno e l’atmosfera rilassata.",
    knownFor: "Night Market, spiaggia, stazione storica e vicinanza alle grotte di Phetchaburi",
    identity: "Antica destinazione balneare della famiglia reale, oggi è una tappa piacevole tra Bangkok e il sud.",
    languages: "Thailandese; inglese nelle aree turistiche", altitude: "circa 5 m",
  },
  Chumphon: {
    healthDeclaration: { state: "Chumphon", district: "Mueang Chumphon", mainCity: "Chumphon", region: "Thailandia meridionale · Golfo di Thailandia" },
    population: "circa 34.000", area: "circa 748 km²", scope: "Distretto di Mueang Chumphon",
    description: "Porta d’ingresso alla Thailandia meridionale, tra costa, piantagioni e parchi naturali.",
    knownFor: "Costa del Golfo, mercati locali e collegamenti verso le isole e il sud",
    identity: "Una tappa di transito autentica, lontana dai percorsi turistici più affollati.",
    languages: "Thailandese", altitude: "circa 10 m",
  },
  "Khao Sok": {
    healthDeclaration: { state: "Surat Thani", district: "Phanom", mainCity: "Khlong Sok", region: "Thailandia meridionale" },
    population: "area rurale protetta", area: "739 km²", scope: "Parco Nazionale di Khao Sok",
    description: "Foresta pluviale, fiumi, grotte e pareti calcaree formano una delle riserve naturali più spettacolari della Thailandia.",
    knownFor: "Giungla, elefanti, trekking, fiume Sok e biodiversità tropicale",
    identity: "È il cuore naturalistico del viaggio e una delle foreste sempreverdi più antiche del pianeta.",
    languages: "Thailandese; inglese nelle strutture del parco", altitude: "variabile, fino a oltre 900 m",
  },
  "Cheow Lan Lake": {
    healthDeclaration: { state: "Surat Thani", district: "Ban Ta Khun", mainCity: "Ratchaprapha", region: "Parco Nazionale di Khao Sok" },
    population: "area lacustre protetta", area: "circa 185 km²", scope: "Lago artificiale Ratchaprapha",
    description: "Un lago color smeraldo circondato da faraglioni calcarei e foresta, con bungalow galleggianti raggiungibili in barca.",
    knownFor: "Floating village, kayak, navigazione notturna e albe sul lago",
    identity: "Qui si trascorre la notte più particolare del viaggio, direttamente sull’acqua.",
    languages: "Thailandese; inglese nelle strutture turistiche", altitude: "circa 65 m",
  },
  "Phi Phi Island": {
    healthDeclaration: { state: "Krabi", district: "Mueang Krabi", mainCity: "Ko Phi Phi Don", region: "Mare delle Andamane" },
    population: "piccola comunità insulare", area: "circa 12 km²", scope: "Arcipelago Phi Phi",
    description: "Isole di roccia calcarea, baie turchesi e spiagge bianche nel cuore del Mare delle Andamane.",
    knownFor: "Maya Bay, long-tail boat, snorkeling e punti panoramici",
    identity: "È la tappa più iconica del tratto di mare, raggiungibile soltanto in barca.",
    languages: "Thailandese; inglese molto diffuso", altitude: "livello del mare",
  },
  Krabi: {
    healthDeclaration: { state: "Krabi", district: "Mueang Krabi", mainCity: "Krabi", region: "Thailandia meridionale · Mare delle Andamane" },
    population: "circa 32.000", area: "circa 4.709 km² nella provincia", scope: "Provincia di Krabi",
    description: "Costa tropicale con spiagge, mangrovie e imponenti falesie calcaree affacciate sul Mare delle Andamane.",
    knownFor: "Ao Nang, Railay, Hong Island, snorkeling e tramonti sul mare",
    identity: "È la base degli ultimi giorni di mare e il punto di partenza del rientro notturno verso Bangkok.",
    languages: "Thailandese; inglese diffuso nelle zone costiere", altitude: "circa 8 m",
  },
};

export const roadPaths = {
  "bkk-bangkok": [[13.69, 100.7501], [13.725, 100.650], [13.7563, 100.5018]],
  "bangkok-huahin": [[13.7563, 100.5018], [13.4071, 99.9987], [13.1119, 99.9397], [12.5684, 99.9577]],
  "huahin-chumphon": [[12.5684, 99.9577], [12.2017, 99.9494], [12.0719, 99.648], [10.493, 99.18]],
  "chumphon-khaosok": [[10.493, 99.18], [9.65, 98.95], [8.9105, 98.5315]],
  "khaosok-pier": [[8.9105, 98.5315], [8.9777, 98.8193]],
  "cheowlan-krabi": [[8.9777, 98.8193], [8.35, 98.78], [8.0421, 98.9182]],
  "krabi-phiphi": [[8.0421, 98.9182], [7.89, 98.84], [7.7407, 98.7784]],
  "phiphi-krabi": [[7.7407, 98.7784], [7.89, 98.84], [8.0421, 98.9182], [8.0863, 98.9063]],
  "krabi-local": [[8.0863, 98.9063], [8.032, 98.8225], [8.056, 98.79], [8.0863, 98.9063]],
  "krabi-surat": [[8.0863, 98.9063], [8.55, 99.02], [9.1382, 99.3217]],
  "surat-bangkok": [
    [9.1382, 99.3217], [10.493, 99.18], [10.708, 99.318], [11.214, 99.512],
    [11.812, 99.798], [12.5684, 99.9577], [13.1119, 99.9397], [13.7563, 100.5018],
  ],
  "bangkok-local": [[13.7563, 100.5018], [13.7466, 100.493], [13.7516, 100.4927], [13.7563, 100.5018]],
  "bangkok-bkk": [[13.7563, 100.5018], [13.725, 100.65], [13.69, 100.7501]],
};

export const overviewModes = [
  ["🚐", "Minivan Bangkok–Hua Hin", "road", "bangkok-huahin", 0.58, "Bangkok–Hua Hin", "2", [0, 0]],
  ["🦶", "Trekking e safari a Kui Buri", "walk", "huahin-chumphon", 0.80, "Kui Buri", "3", [0, 0]],
  ["⛵", "Barca sul lago Cheow Lan", "boat", "khaosok-pier", 0.78, "Cheow Lan", "5", [34, 14]],
  ["⛴️", "Traghetto per Phi Phi", "boat", "krabi-phiphi", 0.56, "Phi Phi", "6", [-26, -12]],
  ["🚌", "Bus notturno per Bangkok", "transit", "surat-bangkok", 0, "Surat–Bangkok", "7", [20, -2]],
];

export const overviewSegments = [
  { path: "bangkok-huahin", mode: "road" },
  { path: "huahin-chumphon", mode: "road" },
  { path: "chumphon-khaosok", mode: "road" },
  { path: "khaosok-pier", mode: "road" },
  { path: "cheowlan-krabi", mode: "road" },
  { path: "krabi-phiphi", mode: "boat" },
  { path: "phiphi-krabi", mode: "boat" },
  { path: "krabi-surat", mode: "road" },
  { path: "surat-bangkok", mode: "transit" },
];

export const days = [
  {
    date: "Sab 26 dic", city: "Bangkok", title: "Benvenuti in Thailandia!",
    story: "Arrivo a Bangkok, check-in e meeting di benvenuto alle 18:00. Primo incontro con il gruppo e con i sapori della capitale.",
    goal: "Riunire il gruppo e iniziare il viaggio", km: 32, time: "35–55 min", transport: "Taxi + metro",
    from: "Aeroporto BKK", to: "Bangkok", path: "bkk-bangkok",
    checks: ["Arrivo a Bangkok", "Check-in", "Meeting alle 18:00", "Prima cena insieme"],
  },
  {
    date: "Dom 27 dic", city: "Hua Hin", title: "Mercati, canali e caverne nascoste",
    story: "Railway Market, eventuale navigazione sui klongs e sosta alla grotta Tham Khao Luang. In serata arriviamo a Hua Hin per lo street food del mercato notturno.",
    goal: "Scoprire la Thailandia più quotidiana", km: 250, time: "4–5 h con soste", transport: "Minivan + barca",
    from: "Bangkok", via: "Maeklong e Phetchaburi", to: "Hua Hin", path: "bangkok-huahin",
    checks: ["Railway Market", "Klongs opzionali", "Tham Khao Luang Cave", "Night Market di Hua Hin"],
  },
  {
    date: "Lun 28 dic", city: "Chumphon", title: "Safari nel Parco Nazionale di Kui Buri",
    story: "Mattina tra spiaggia e trekking a Sam Roi Yot, poi safari nel Parco di Kui Buri alla ricerca degli elefanti asiatici. Proseguiamo fino a Chumphon.",
    goal: "Vivere natura e fauna thailandese", km: 285, time: "5–6 h con soste", transport: "Minivan + safari + a piedi",
    from: "Hua Hin", via: "Sam Roi Yot e Kui Buri", to: "Chumphon", path: "huahin-chumphon",
    checks: ["Spiaggia o trekking", "Grotta Sam Roi Yot", "Safari Kui Buri", "Arrivo a Chumphon"],
  },
  {
    date: "Mar 29 dic", city: "Khao Sok", title: "Nel Parco Nazionale di Khao Sok",
    story: "Entriamo nella più grande riserva naturalistica della Thailandia, tra foresta tropicale e fiume Sok. Nel pomeriggio esperienza rispettosa con gli elefanti.",
    goal: "Immergerci nella foresta tropicale", km: 250, time: "4–5 h", transport: "Minivan + a piedi",
    from: "Chumphon", to: "Khao Sok", path: "chumphon-khaosok",
    checks: ["Transfer verso Khao Sok", "Passeggiata nella natura", "Esperienza con gli elefanti", "Notte nel parco"],
  },
  {
    date: "Mer 30 dic", city: "Cheow Lan Lake", title: "Sul lago Cheow Lan: dormiamo sull’acqua!",
    story: "Raggiungiamo il lago e il floating village. Tempo per kayak e relax, cena sul lago e tour notturno in barca sotto le stelle.",
    goal: "Dormire in un bungalow galleggiante", km: 65, time: "1 h 30 + barca", transport: "Minivan + barca + kayak",
    from: "Khao Sok", to: "Cheow Lan Lake", path: "khaosok-pier", overnight: "Notte nel floating village sul lago",
    checks: ["Transfer al lago", "Barca verso il floating village", "Kayak", "Tour notturno"],
  },
  {
    date: "Gio 31 dic", city: "Phi Phi Island", title: "Phi Phi Island: benvenuti in paradiso!",
    story: "Salutiamo Khao Sok, passiamo dal porto di Krabi e prendiamo il traghetto per Phi Phi Island. Sistemazione e primo bagno nel Mare delle Andamane.",
    goal: "Festeggiare l’arrivo a Phi Phi", km: 190, time: "4–5 h complessive", transport: "Minivan + traghetto",
    from: "Cheow Lan Lake", via: "Porto di Krabi", to: "Phi Phi Island", path: "krabi-phiphi",
    segments: [{ path: "cheowlan-krabi", mode: "road" }, { path: "krabi-phiphi", mode: "boat" }],
    checks: ["Partenza dal lago", "Transfer al porto", "Traghetto", "Primo bagno a Phi Phi"],
  },
  {
    date: "Ven 1 gen", city: "Krabi", title: "Tra Phi Phi Island e Krabi",
    story: "Mattina tra le spiagge più belle di Phi Phi, da Maya Bay a Laem Tong. Nel pomeriggio traghetto verso Krabi e cocktail al tramonto.",
    goal: "Iniziare l’anno tra isole e mare", km: 50, time: "2 h di traghetto", transport: "Barca + traghetto",
    from: "Phi Phi Island", to: "Krabi", path: "phiphi-krabi",
    checks: ["Spiagge di Phi Phi", "Maya Bay opzionale", "Traghetto per Krabi", "Tramonto"],
  },
  {
    date: "Sab 2 gen", city: "Krabi", title: "Esploriamo Krabi",
    story: "Giornata dedicata alle spiagge della costa: Ao Nang, Hat Noppharat Thara o un’escursione tra le isole, secondo le scelte del gruppo.",
    goal: "Scoprire il mare di Krabi", km: 35, time: "spostamenti locali", transport: "Taxi + long-tail boat",
    from: "Krabi", to: "Krabi", path: "krabi-local",
    checks: ["Ao Nang Beach", "Hat Noppharat Thara", "Escursione opzionale", "Tramonto sul mare"],
  },
  {
    date: "Dom 3 gen", city: "Krabi", title: "Ultima giornata di mare",
    story: "Ultimo bagno sulla costa di Krabi, poi prepariamo gli zaini. In serata raggiungiamo Surat Thani e partiamo in bus notturno per Bangkok.",
    goal: "Salutare il mare e rientrare verso Bangkok", km: 780, time: "notte in viaggio", transport: "Minivan + bus notturno",
    from: "Krabi", via: "Surat Thani", to: "Bangkok", path: "surat-bangkok",
    segments: [{ path: "krabi-surat", mode: "road" }, { path: "surat-bangkok", mode: "transit" }],
    overnight: "Notte in bus · Surat Thani → Bangkok",
    checks: ["Ultimo bagno", "Preparazione zaini", "Transfer a Surat Thani", "Bus notturno"],
  },
  {
    date: "Lun 4 gen", city: "Bangkok", title: "Torniamo a Bangkok",
    story: "Arrivo dopo il viaggio notturno e ultima giornata nella capitale: mercati, shopping, street food e cena finale per brindare ai ricordi condivisi.",
    goal: "Vivere l’ultimo giorno insieme", km: 25, time: "spostamenti locali", transport: "Metro + tuk-tuk",
    from: "Bangkok", to: "Bangkok", path: "bangkok-local",
    checks: ["Arrivo a Bangkok", "Mercati e shopping", "Street food", "Cena finale"],
  },
  {
    date: "Mar 5 gen", city: "Bangkok", title: "Arrivederci Thailandia!",
    story: "Check-out e saluti. L’ultimo giorno è libero: ciascuno può raggiungere l’aeroporto all’orario più adatto al proprio volo.",
    goal: "Chiudere il viaggio senza fretta", km: 32, time: "35–55 min", transport: "Taxi + metro",
    from: "Bangkok", to: "Aeroporto BKK", path: "bangkok-bkk",
    checks: ["Check-out", "Saluti", "Transfer verso BKK", "Rientro"],
  },
];
