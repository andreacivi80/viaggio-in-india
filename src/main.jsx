import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MapPinned,
  Route,
  Camera,
  Users,
  LockKeyhole,
  Mic,
  MessageCircle,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Plane,
  MapPin,
  ShieldCheck,
  ImageIcon,
  House,
  Bell,
  CircleUserRound,
  MoreHorizontal,
  Heart,
  Share2,
  Bookmark,
  Paperclip,
  Send,
  Link,
} from "./icons.jsx";
import "./styles.css";
import { publicationAccessStep, publicationEntryState } from "./accessFlow.js";
import { flushOfflineQueue, queueFormRequest } from "./offlineQueue.js";
import { shouldUseResumableUpload, uploadFileResumable } from "./resumableUpload.js";
import {
  sanitizePostsForPublicCache,
  sanitizeProfilesForPublicCache,
} from "./publicCache.js";
import { validateMediaSelection } from "./mediaValidation.js";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

const VERSION = "1.41.1",
  API = "/api";
const deviceName = () => {
  const userAgent = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iPhone o iPad";
  if (/Android/i.test(userAgent)) return "Telefono Android";
  if (/Windows/i.test(userAgent)) return "Computer Windows";
  if (/Macintosh|Mac OS/i.test(userAgent)) return "Computer Mac";
  return "Dispositivo";
};
const travelerOrderGroup = (person) =>
  person.role === "coordinator" ? 0 : person.gender === "female" ? 1 : person.gender === "male" ? 2 : 3;
const sortTravelers = (travelers = []) =>
  [...travelers].sort((a, b) => travelerOrderGroup(a) - travelerOrderGroup(b) ||
    String(a.created_at || "").localeCompare(String(b.created_at || "")));
const travelerRoleLabel = (person) =>
  person.role === "coordinator"
    ? person.gender === "female" ? "Coordinatrice" : "Coordinatore"
    : person.gender === "female" ? "Viaggiatrice"
      : person.gender === "male" ? "Viaggiatore" : "Partecipante";
const travelerDetails = (person) =>
  [travelerRoleLabel(person), person.origin_city, person.age && `${person.age} anni`, person.job]
    .filter(Boolean)
    .join(" · ");
const TRAVELER_ICON = "/traveler-icon.png";
const ITALIAN_CITY_COORDINATES = {
  milano: [9.19, 45.464], roma: [12.496, 41.903], palermo: [13.362, 38.116],
  cagliari: [9.11, 39.224], torino: [7.686, 45.07], genova: [8.946, 44.405],
  venezia: [12.315, 45.44], trieste: [13.777, 45.65], bologna: [11.342, 44.494],
  firenze: [11.255, 43.77], napoli: [14.268, 40.852], bari: [16.872, 41.118],
  ancona: [13.518, 43.616], perugia: [12.389, 43.112], l_aquila: [13.399, 42.35],
  campobasso: [14.659, 41.56], potenza: [15.805, 40.64], catanzaro: [16.594, 38.91],
  aosta: [7.32, 45.738], trento: [11.121, 46.067], bolzano: [11.354, 46.499],
  verona: [10.992, 45.438], padova: [11.876, 45.407], bergamo: [9.67, 45.698],
  brescia: [10.212, 45.541], mantova: [10.7914, 45.1564], mantua: [10.7914, 45.1564],
  parma: [10.328, 44.801], modena: [10.925, 44.647],
  pisa: [10.402, 43.716], livorno: [10.316, 43.548], salerno: [14.759, 40.682],
  lecce: [18.172, 40.352], messina: [15.554, 38.193], catania: [15.087, 37.503],
  siracusa: [15.293, 37.075], sassari: [8.56, 40.726], rimini: [12.568, 44.067],
};
const normalizeItalianCity = (value = "") => String(value).trim().toLocaleLowerCase("it-IT")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
const tripDateKeys = Array.from({ length: 14 },
  (_, index) => `2026-08-${String(10 + index).padStart(2, "0")}`,
);
const conciseWeather = (description = "") => {
  const value = String(description).toLowerCase();
  if (value.includes("heavy rain") || value.includes("pioggia forte")) return "🌧️ Pioggia forte";
  if (value.includes("moderate rain") || value.includes("pioggia moderata")) return "🌧️ Pioggia moderata";
  if (value.includes("continuous rain") || value.includes("pioggia continua")) return "🌧️ Pioggia continua";
  if (value.includes("light rain") || value.includes("drizzle") || value.includes("pioggia leggera")) return "🌦️ Pioggia leggera";
  if (value.includes("thunder") || value.includes("temporali")) return "⛈️ Temporali";
  if (value.includes("partly cloudy") || value.includes("parzialmente nuvoloso")) return "⛅ Parzialmente nuvoloso";
  if (value.includes("cloud") || value.includes("nuvoloso")) return "☁️ Nuvoloso";
  if (value.includes("clear") || value.includes("sereno")) return "☀️ Sereno";
  return "🌤️ Meteo IMD";
};
const weatherIcon = (description) => conciseWeather(description).split(" ")[0];
const indiaDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
const mentionHandle = (person) =>
  `${person?.name || ""}_${person?.surname || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
const renderCommentText = (value) =>
  String(value || "")
    .split(/(@[a-z0-9_]+)/gi)
    .map((part, index) =>
      part.startsWith("@") ? (
        <mark className="mention" key={`${part}-${index}`}>
          {part}
        </mark>
      ) : (
        part
      ),
    );
const normalizeMobileUpload = async (file) => {
  if (!(file instanceof File)) return file;
  const isHeic =
    /\.(heic|heif)$/i.test(file.name || "") ||
    /image\/(heic|heif)/i.test(file.type || "");
  if (!isHeic) return file;
  const module = await import("heic2any");
  const converted = await module.default({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });
  const jpeg = Array.isArray(converted) ? converted[0] : converted;
  return new File(
    [jpeg],
    `${String(file.name || "foto").replace(/\.(heic|heif)$/i, "")}.jpg`,
    { type: "image/jpeg", lastModified: Date.now() },
  );
};
const deviceKey = () => {
  let key = localStorage.getItem("india-device-key") || "";
  if (!/^[a-f0-9]{64}$/.test(key)) {
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    localStorage.setItem("india-device-key", key);
  }
  return key;
};
const sessionHeaders = (token, additional = {}) => ({
  ...additional,
  ...(token ? { authorization: `Bearer ${token}` } : {}),
  ...(token ? { "x-device-key": deviceKey() } : {}),
});
async function guestHeaders(displayName) {
  const normalizedName = String(displayName || "").trim();
  let token = localStorage.getItem("india-guest-token") || "";
  const storedName = localStorage.getItem("india-guest-name") || "";
  if (!token || storedName !== normalizedName) {
    const response = await fetch(`${API}/auth/guest`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-device-name": deviceName(), "x-device-key": deviceKey() },
      body: JSON.stringify({ display_name: normalizedName }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(result.error || "Identità ospite non disponibile.");
    token = result.token;
    localStorage.setItem("india-guest-token", token);
    localStorage.setItem("india-guest-name", result.display_name);
    localStorage.setItem("india-visitor-id", result.visitor_id);
  }
  return { "x-guest-token": token, "x-device-key": deviceKey() };
}
const storedGuestHeaders = () => {
  const token = localStorage.getItem("india-guest-token") || "";
  return token ? { "x-guest-token": token, "x-device-key": deviceKey() } : {};
};
async function verifyGroupCode(code, setGroupCode) {
  const normalizedCode = String(code || "").trim();
  const response = await fetch(`${API}/auth/group`, {
    method: "POST",
    headers: { "x-group-code": normalizedCode },
  });
  if (!response.ok) return false;
  setGroupCode(normalizedCode);
  return true;
}
const cityImages = {
  Delhi: "/cities/delhi.jpg",
  Udaipur: "/cities/udaipur.jpg",
  Ranakpur: "/cities/ranakpur.jpg",
  Jodhpur: "/cities/jodhpur.jpg",
  Jaipur: "/cities/jaipur.jpg",
  Agra: "/cities/agra.jpg",
  Varanasi: "/cities/varanasi.jpg",
};
const places = {
  Delhi: [28.6139, 77.209],
  "Aeroporto DEL": [28.5562, 77.1],
  "Aeroporto UDR": [24.6177, 73.8961],
  "Agra Cantt": [27.1595, 77.9907],
  "Varanasi Junction": [25.3268, 82.9861],
  "Delhi Junction": [28.6614, 77.2273],
  "Rockland Hotel C R Park": [28.5429119, 77.2428399],
  "Akshay Niwas Boutique Hotel": [24.5793118, 73.6692829],
  Udaipur: [24.5854, 73.7125],
  Ranakpur: [25.1164, 73.4737],
  "Hotel Rajwara Palace": [26.277971, 73.033025],
  Jodhpur: [26.2389, 73.0243],
  "The Wall Street Beacon Hotel": [26.917646, 75.8116579],
  Jaipur: [26.9124, 75.7873],
  "Hotel Taj Vilas": [27.1580309, 78.0592253],
  Agra: [27.1767, 78.0081],
  "Costa River Varanasi": [25.3385012, 82.9795559],
  Varanasi: [25.3176, 82.9739],
};
const cityFacts = {
  Delhi: {
    population: "16,31 milioni", area: "1.484 km\u00b2", scope: "Territorio della Capitale \u00b7 Censimento 2011",
    description: "Capitale immensa e stratificata: quartieri moderni, citt\u00e0 moghul, mercati, moschee e monumenti raccontano molte Indie nello stesso luogo.",
    knownFor: "Forte Rosso, Jama Masjid, India Gate, Qutub Minar e i bazar di Old Delhi",
    identity: "Una metropoli formata da citt\u00e0 sovrapposte, dove l'urbanistica imperiale di New Delhi incontra i vicoli della capitale moghul.",
    languages: "Hindi, inglese, punjabi e urdu", altitude: "circa 216 m",
  },
  Udaipur: {
    population: "451.100", area: "64 km\u00b2", scope: "Comune \u00b7 Censimento 2011",
    description: "La citt\u00e0 dei laghi del Rajasthan, celebre per il City Palace, le haveli e i riflessi dei palazzi sulle acque del Pichola.",
    knownFor: "Lago Pichola, City Palace, Jag Mandir e tramonti sulle colline Aravalli",
    identity: "Fondata nel XVI secolo come capitale del Mewar, conserva un rapporto scenografico unico tra acqua, palazzi e rilievi.",
    languages: "Hindi, mewari e inglese", altitude: "circa 598 m",
  },
  Ranakpur: {
    population: "piccolo centro rurale", area: "area collinare degli Aravalli", scope: "Distretto di Pali \u00b7 Rajasthan",
    description: "Un'oasi verde tra Udaipur e Jodhpur, conosciuta per il grande complesso templare giainista in marmo chiaro.",
    knownFor: "Tempio di Adinath, 1.444 colonne scolpite e paesaggio degli Aravalli",
    identity: "La luce cambia continuamente la percezione delle colonne: la tradizione afferma che non ce ne siano due identiche.",
    languages: "Hindi, marwari e mewari", altitude: "circa 486 m",
  },
  Jodhpur: {
    population: "1,03 milioni", area: "112 km\u00b2", scope: "Comune \u00b7 Censimento 2011",
    description: "La Citt\u00e0 Blu ai margini del Thar: case color indaco, bazar e il Forte Mehrangarh dominano un paesaggio luminoso e compatto.",
    knownFor: "Mehrangarh, Jaswant Thada, Clock Tower e quartieri dipinti di blu",
    identity: "Antica capitale del Marwar, lega l'architettura guerriera del forte alla vita dei mercati ai suoi piedi.",
    languages: "Hindi, marwari e inglese", altitude: "circa 231 m",
  },
  Jaipur: {
    population: "3,05 milioni", area: "485 km\u00b2", scope: "Comune \u00b7 Censimento 2011",
    description: "La Citt\u00e0 Rosa, capitale del Rajasthan, unisce palazzi, osservatori astronomici, bazar artigiani e fortezze sulle colline.",
    knownFor: "Hawa Mahal, City Palace, Jantar Mantar, Amber Fort e artigianato",
    identity: "Progettata nel 1727 secondo una griglia urbana, fu dipinta di rosa nel XIX secolo come colore dell'ospitalit\u00e0.",
    languages: "Hindi, dhundhari, marwari e inglese", altitude: "circa 431 m",
  },
  Agra: {
    population: "1,75 milioni", area: "circa 121 km\u00b2", scope: "Area urbana \u00b7 Censimento 2011",
    description: "Citt\u00e0 moghul sulle rive dello Yamuna, conosciuta nel mondo per il Taj Mahal ma ricca anche di fortezze, giardini e artigianato.",
    knownFor: "Taj Mahal, Forte di Agra, Itmad-ud-Daulah e lavorazione del marmo",
    identity: "Fu uno dei grandi centri dell'impero moghul: il fiume connetteva palazzi e giardini disposti sulle due rive.",
    languages: "Hindi, urdu e braj bhasha", altitude: "circa 171 m",
  },
  Varanasi: {
    population: "1,44 milioni", area: "circa 82 km\u00b2", scope: "Area urbana \u00b7 Censimento 2011",
    description: "Una delle citt\u00e0 sacre pi\u00f9 antiche dell'India: i ghat sul Gange, le barche all'alba e i rituali serali scandiscono la vita quotidiana.",
    knownFor: "Ghat del Gange, cerimonia Ganga Aarti, Sarnath, seta e musica classica",
    identity: "La citt\u00e0 storica cresce come un anfiteatro sulla riva occidentale del Gange, con vicoli che convergono verso i ghat.",
    languages: "Hindi, bhojpuri, urdu e inglese", altitude: "circa 80 m",
  },
};
const normalizedDegrees = (value) => ((value % 360) + 360) % 360;
const solarEventTime = (dateKey, latitude, longitude, sunrise) => {
  const date = new Date(`${dateKey}T12:00:00Z`);
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start) / 86400000);
  const longitudeHour = longitude / 15;
  const approximate = day + ((sunrise ? 6 : 18) - longitudeHour) / 24;
  const meanAnomaly = (0.9856 * approximate) - 3.289;
  const trueLongitude = normalizedDegrees(
    meanAnomaly + 1.916 * Math.sin(meanAnomaly * Math.PI / 180) +
    0.02 * Math.sin(2 * meanAnomaly * Math.PI / 180) + 282.634,
  );
  let rightAscension = normalizedDegrees(Math.atan(0.91764 * Math.tan(trueLongitude * Math.PI / 180)) * 180 / Math.PI);
  rightAscension += Math.floor(trueLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90;
  rightAscension /= 15;
  const sinDeclination = 0.39782 * Math.sin(trueLongitude * Math.PI / 180);
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const latitudeRadians = latitude * Math.PI / 180;
  const cosHour = (Math.cos(90.833 * Math.PI / 180) - sinDeclination * Math.sin(latitudeRadians)) /
    (cosDeclination * Math.cos(latitudeRadians));
  if (cosHour < -1 || cosHour > 1) return "—";
  let localHour = sunrise
    ? 360 - Math.acos(cosHour) * 180 / Math.PI
    : Math.acos(cosHour) * 180 / Math.PI;
  localHour /= 15;
  const utcHour = normalizedDegrees((localHour + rightAscension - 0.06571 * approximate - 6.622 - longitudeHour) * 15) / 15;
  const indiaHour = (utcHour + 5.5) % 24;
  const hours = Math.floor(indiaHour);
  const minutes = Math.round((indiaHour - hours) * 60);
  const adjustedHours = minutes === 60 ? (hours + 1) % 24 : hours;
  return `${String(adjustedHours).padStart(2, "0")}:${String(minutes === 60 ? 0 : minutes).padStart(2, "0")}`;
};
const solarTimesForDay = (dateKey, city, forecast) => {
  const [latitude, longitude] = places[city] || places.Delhi;
  return {
    sunrise: forecast?.sunrise || solarEventTime(dateKey, latitude, longitude, true),
    sunset: forecast?.sunset || solarEventTime(dateKey, latitude, longitude, false),
  };
};
const roadPaths = {
  "Delhi-arrival": [
    [28.5562, 77.1],
    [28.5578, 77.121],
    [28.5498, 77.164],
    [28.5455, 77.207],
    [28.5429119, 77.2428399],
  ],
  "Delhi-old-city": [
    [28.5429119, 77.2428399],
    [28.5355, 77.278],
    [28.6562, 77.241],
    [28.6506, 77.2303],
    [28.6507, 77.2334],
    [28.6315, 77.2167],
    [28.5429119, 77.2428399],
  ],
  "Udaipur-local": [
    [24.5793118, 73.6692829],
    [24.5764, 73.6835],
    [24.572, 73.675],
    [24.5938, 73.6398],
    [24.6031, 73.6853],
    [24.5793118, 73.6692829],
  ],
  "Jodhpur-local": [
    [26.277971, 73.033025],
    [26.298, 73.018],
    [26.289, 73.024],
    [26.281, 73.018],
    [26.277971, 73.033025],
  ],
  "Jaipur-local": [
    [26.917646, 75.8116579],
    [26.916, 75.859],
    [26.9855, 75.8513],
    [26.926, 75.8235],
    [26.917646, 75.8116579],
  ],
  "Varanasi-ghats": [
    [25.3385012, 82.9795559],
    [25.3109, 83.0107],
    [25.306, 83.011],
    [25.282, 83.006],
    [25.3385012, 82.9795559],
  ],
  "Varanasi-river": [
    [25.3109, 83.0107],
    [25.323, 83.021],
    [25.337, 83.026],
    [25.3385012, 82.9795559],
  ],
  "Delhi-finale": [
    [28.6139, 77.209],
    [28.5933, 77.2507],
    [28.6127, 77.2773],
    [28.5562, 77.1],
  ],
  "Udaipur-Jodhpur": [
    [24.5793118, 73.6692829],
    [24.667, 73.639],
    [24.814, 73.428],
    [25.116, 73.473],
    [25.373, 73.453],
    [25.581, 73.39],
    [25.872, 73.223],
    [26.032, 73.079],
    [26.277971, 73.033025],
  ],
  "Jodhpur-Jaipur": [
    [26.277971, 73.033025],
    [26.272, 73.256],
    [26.265, 73.5],
    [26.217, 73.648],
    [26.196, 73.954],
    [26.074, 74.211],
    [26.154, 74.364],
    [26.279, 74.499],
    [26.476, 74.714],
    [26.559, 74.798],
    [26.59, 74.901],
    [26.65, 75.133],
    [26.749, 75.324],
    [26.855, 75.652],
    [26.917646, 75.8116579],
  ],
  "Jaipur-Agra": [
    [26.917646, 75.8116579],
    [26.89, 75.87],
    [26.855, 76.011],
    [26.858, 76.168],
    [26.893, 76.259],
    [26.916, 76.468],
    [26.971, 76.794],
    [27.038, 76.927],
    [27.097, 77.057],
    [27.165, 77.321],
    [27.173, 77.397],
    [27.206, 77.512],
    [27.103, 77.679],
    [27.1580309, 78.0592253],
  ],
  "Delhi-Udaipur-hotel": [
    [28.5429119, 77.2428399],
    [24.5793118, 73.6692829],
  ],
  "Agra-Varanasi-hotel": [
    [27.1580309, 78.0592253],
    [25.3385012, 82.9795559],
  ],
  "Varanasi-Delhi": [
    [25.3385012, 82.9795559],
    [28.6139, 77.209],
  ],
  "Delhi-airport-transfer": [
    [28.5429119, 77.2428399],
    [28.5498, 77.207],
    [28.5578, 77.121],
    [28.5562, 77.1],
  ],
  "Udaipur-airport-transfer": [
    [24.6177, 73.8961],
    [24.604, 73.831],
    [24.594, 73.758],
    [24.5793118, 73.6692829],
  ],
  "Agra-station-transfer": [
    [27.1580309, 78.0592253],
    [27.162, 78.031],
    [27.1595, 77.9907],
  ],
  "Varanasi-station-transfer": [
    [25.3268, 82.9861],
    [25.333, 82.982],
    [25.3385012, 82.9795559],
  ],
  "Delhi-station-transfer": [
    [28.6614, 77.2273],
    [28.637, 77.219],
    [28.6139, 77.209],
  ],
};
const days = [
  {
    date: "Lun 10 ago",
    city: "Delhi",
    birthdays: [
      { name: "Antonella", age: 26 },
      { name: "Ludovica", age: 28 },
    ],
    title: "Partenza: prima notte a Nuova Delhi",
    story:
      "Atterriamo all’aeroporto internazionale di Delhi e raggiungiamo il Rockland Hotel C.R. Park. Sistemazione, incontro con il gruppo WEROAD e prima notte nella capitale.",
    goal: "Arrivare, riunire il gruppo e sistemarci in hotel",
    km: 15,
    time: "30–45 min",
    transport: "Transfer privato + taxi",
    from: "Aeroporto DEL",
    to: "Rockland Hotel C R Park",
    path: "Delhi-arrival",
    hotel: {
      name: "Rockland Hotel C.R. Park",
      place: "Rockland Hotel C R Park",
      address: "B-207, C.R. Park, Outer Ring Road, New Delhi 110019",
      contact: "Shekhar · +91 88264 93202",
    },
    checks: ["Arrivo aeroporto DEL", "Transfer verso l’hotel", "Check-in", "Prima notte a Nuova Delhi"],
  },
  {
    date: "Mar 11 ago",
    city: "Delhi",
    title: "Delhi senza filtri",
    story:
      "Una giornata tra vita quotidiana, storia moghul e mercati. Sanjay Colony, Red Fort, Chandni Chowk e Jama Masjid, fino al rooftop serale.",
    goal: "Scoprire i contrasti della capitale",
    km: 32,
    time: "1 h 30 complessive",
    transport: "Metro + risciò",
    from: "Delhi",
    to: "Delhi",
    path: "Delhi-old-city",
    hotel: {
      name: "Rockland Hotel C.R. Park",
      place: "Rockland Hotel C R Park",
      address: "B-207, C.R. Park, Outer Ring Road, New Delhi 110019",
      contact: "Shekhar · +91 88264 93202",
    },
    checks: ["Tour Sanjay Colony", "Red Fort", "Chandni Chowk", "Jama Masjid"],
  },
  {
    date: "Mer 12 ago",
    city: "Udaipur",
    title: "Verso la città dei laghi",
    story:
      "Lasciamo Delhi in volo e cambiamo completamente scenario. Check-in, passeggiata sul lago e cena elegante al Charcoal.",
    goal: "Arrivare a Udaipur e goderci il lago",
    km: 570,
    time: "1 h 15 di volo",
    transport: "Aereo",
    from: "Delhi",
    to: "Udaipur",
    path: "Delhi-Udaipur-hotel",
    hotel: {
      name: "Akshay Niwas Boutique Hotel by Amantra",
      place: "Akshay Niwas Boutique Hotel",
      address: "7, Haridas Ji Ki Magri, vicino al Trident Hotel e al Lago Pichola, Udaipur, Rajasthan 313002",
      contact: "Ashok · +91 94628 42799",
    },
    checks: [
      "Volo Delhi–Udaipur",
      "Check-in",
      "Passeggiata lago",
      "Cena Charcoal",
    ],
  },
  {
    date: "Gio 13 ago",
    city: "Udaipur",
    title: "Palazzi al tramonto",
    story:
      "Alba con la guida, vicoli della città vecchia, City Palace e una barca sul lago Pichola mentre il sole scende dietro i palazzi.",
    goal: "Vivere la città dall’acqua",
    km: 22,
    time: "1 h complessiva",
    transport: "Tuk-tuk + barca",
    from: "Udaipur",
    to: "Udaipur",
    path: "Udaipur-local",
    hotel: {
      name: "Akshay Niwas Boutique Hotel by Amantra",
      place: "Akshay Niwas Boutique Hotel",
      address: "7, Haridas Ji Ki Magri, vicino al Trident Hotel e al Lago Pichola, Udaipur, Rajasthan 313002",
      contact: "Ashok · +91 94628 42799",
    },
    checks: ["Tour guidato", "Barca al tramonto", "City Palace", "Shopping"],
  },
  {
    date: "Ven 14 ago",
    city: "Jodhpur",
    title: "Ranakpur e la città blu",
    story:
      "La strada entra nel Rajasthan rurale. Sosta al tempio giainista di Ranakpur, poi il viaggio continua fino alle case blu di Jodhpur.",
    goal: "Attraversare il cuore del Rajasthan",
    km: 251,
    time: "4 h 15 senza soste",
    transport: "Van privato",
    from: "Udaipur",
    via: "Ranakpur",
    to: "Jodhpur",
    path: "Udaipur-Jodhpur",
    hotel: {
      name: "Hotel Rajwara Palace",
      place: "Hotel Rajwara Palace",
      address: "Di fronte al Government Veterinary Hospital, Ratanada Road, Jodhpur, Rajasthan 342001",
      contact: "Gajendra Singh · +91 76655 81115",
    },
    checks: [
      "Partenza in van",
      "Tempio Ranakpur",
      "Pozzo a gradini",
      "Cena Jhankar Haveli",
    ],
  },
  {
    date: "Sab 15 ago",
    city: "Jodhpur",
    title: "Dentro la città blu",
    story:
      "Walking tour con Lakshimi, colazione indiana e Forte Mehrangarh. La sera finisce con musica dal vivo e vista sui tetti blu.",
    goal: "Conoscere Jodhpur a passo lento",
    km: 18,
    time: "50 min complessivi",
    transport: "A piedi + tuk-tuk",
    from: "Jodhpur",
    to: "Jodhpur",
    path: "Jodhpur-local",
    hotel: {
      name: "Hotel Rajwara Palace",
      place: "Hotel Rajwara Palace",
      address: "Di fronte al Government Veterinary Hospital, Ratanada Road, Jodhpur, Rajasthan 342001",
      contact: "Gajendra Singh · +91 76655 81115",
    },
    checks: [
      "Walking tour",
      "Colazione tipica",
      "Mehrangarh Fort",
      "Musica live",
    ],
  },
  {
    date: "Dom 16 ago",
    city: "Jaipur",
    title: "Verso la città rosa",
    story:
      "Trasferimento a Jaipur, possibile deviazione a Pushkar, primo giro nei bazar e cooking class serale con Vaseem.",
    goal: "Arrivare a Jaipur cucinando insieme",
    km: 328,
    time: "5 h 30 senza soste",
    transport: "Van privato",
    from: "Jodhpur",
    to: "Jaipur",
    path: "Jodhpur-Jaipur",
    hotel: {
      name: "The Wall Street Beacon Hotel",
      place: "The Wall Street Beacon Hotel",
      address: "C-7, Mirza Ismail Road, vicino a Panch Batti, Jayanti Market, New Colony, Jaipur, Rajasthan 302001",
      contact: "Amit · +91 99291 55591",
    },
    checks: ["Van per Jaipur", "Walking tour", "Cooking class", "Cena insieme"],
  },
  {
    date: "Lun 17 ago",
    city: "Jaipur",
    birthdays: [{ name: "Paolo", age: 37 }],
    title: "Templi e fortezze",
    story:
      "Galta Ji al mattino, Amber Fort nel pomeriggio e una cena panoramica per festeggiare il compleanno di Paolo.",
    goal: "Dall’acqua sacra alle mura di Amber",
    km: 35,
    time: "1 h 20 complessive",
    transport: "Tuk-tuk + van",
    from: "Jaipur",
    to: "Jaipur",
    path: "Jaipur-local",
    hotel: {
      name: "The Wall Street Beacon Hotel",
      place: "The Wall Street Beacon Hotel",
      address: "C-7, Mirza Ismail Road, vicino a Panch Batti, Jayanti Market, New Colony, Jaipur, Rajasthan 302001",
      contact: "Amit · +91 99291 55591",
    },
    checks: ["Galta Ji", "Amber Fort", "Foto di gruppo", "Cena Tattoo Café"],
  },
  {
    date: "Mar 18 ago",
    city: "Agra",
    title: "La prima vista del Taj",
    story:
      "Ultimi acquisti a Jaipur, poi strada verso Agra. Il Taj Mahal appare per la prima volta dall’altra riva del fiume.",
    goal: "Vedere il Taj al tramonto",
    km: 238,
    time: "4 h senza soste",
    transport: "Van privato",
    from: "Jaipur",
    to: "Agra",
    path: "Jaipur-Agra",
    hotel: {
      name: "Hotel Taj Vilas",
      place: "Hotel Taj Vilas",
      address: "Fatehabad Road, vicino al TDI Mall, di fronte all’Hotel Trident, Tajganj, Basai, Agra 282006",
      contact: "Sachin · +91 78950 02674",
    },
    checks: [
      "Shopping Jaipur",
      "Van per Agra",
      "Foto Taj Mahal",
      "Aperitivo Joey’s",
    ],
  },
  {
    date: "Mer 19 ago",
    city: "Agra",
    title: "Il giorno del Taj Mahal",
    story:
      "Ingresso all’alba, quando il marmo cambia colore. Dopo i mercati e il pranzo solidale da Sheroes, saliamo sul treno notturno.",
    goal: "Vivere il Taj prima della folla",
    km: 615,
    time: "10–12 h notturne",
    transport: "Treno notturno",
    from: "Agra",
    to: "Varanasi",
    path: "Agra-Varanasi-hotel",
    hotel: {
      label: "APPOGGIO AD AGRA PRIMA DEL TRENO",
      name: "Hotel Taj Vilas",
      place: "Hotel Taj Vilas",
      address: "Fatehabad Road, vicino al TDI Mall, di fronte all’Hotel Trident, Tajganj, Basai, Agra 282006",
      contact: "Sachin · +91 78950 02674",
    },
    overnight: "Notte in treno · Agra → Varanasi",
    checks: [
      "Taj Mahal all’alba",
      "Mercatini",
      "Pranzo Sheroes",
      "Treno notturno",
    ],
  },
  {
    date: "Gio 20 ago",
    city: "Varanasi",
    title: "L’essenza del Gange",
    story:
      "Arrivo nella città sacra, cammino tra i ghat con Pappu e cerimonia Ganga Aarti al tramonto: il diario entra nel suo capitolo più intenso.",
    goal: "Orientarci tra i ghat e il Gange",
    km: 12,
    time: "40 min complessivi",
    transport: "A piedi + barca",
    from: "Varanasi",
    to: "Varanasi",
    path: "Varanasi-ghats",
    hotel: {
      name: "Costa River Varanasi",
      place: "Costa River Varanasi",
      address: "Nepali Kothi, S 51-A-4-A1, The Mall Road, Nadesar, Varanasi Cantonment, Uttar Pradesh 221002",
    },
    checks: [
      "Arrivo e check-in",
      "Walking tour ghat",
      "Ganga Aarti",
      "Cena BrijRama",
    ],
  },
  {
    date: "Ven 21 ago",
    city: "Varanasi",
    birthdays: [{ name: "Davide Spinaci", age: 29 }],
    title: "Alba sul Gange",
    story:
      "Partenza in barca prima del sole, yoga sul rooftop e tempo libero nei vicoli. La sera festeggiamo Davide.",
    goal: "Guardare Varanasi svegliarsi dal fiume",
    km: 10,
    time: "Barca 1 h 30",
    transport: "Barca + a piedi",
    from: "Varanasi",
    to: "Varanasi",
    path: "Varanasi-river",
    hotel: {
      name: "Costa River Varanasi",
      place: "Costa River Varanasi",
      address: "Nepali Kothi, S 51-A-4-A1, The Mall Road, Nadesar, Varanasi Cantonment, Uttar Pradesh 221002",
    },
    checks: [
      "Barca all’alba",
      "Tempo libero",
      "Yoga rooftop",
      "Cena Aadha Aadha",
    ],
  },
  {
    date: "Sab 22 ago",
    city: "Varanasi",
    title: "Ultime ore e ritorno",
    story:
      "Mattina libera, ultimi regali e partenza nel pomeriggio. Il treno ci riporta a Delhi attraversando la notte.",
    goal: "Salutare Varanasi e rientrare insieme",
    km: 760,
    time: "11–13 h",
    transport: "Treno",
    from: "Varanasi",
    to: "Delhi",
    path: "Varanasi-Delhi",
    hotel: {
      label: "APPOGGIO A VARANASI PRIMA DEL TRENO",
      name: "Costa River Varanasi",
      place: "Costa River Varanasi",
      address: "Nepali Kothi, S 51-A-4-A1, The Mall Road, Nadesar, Varanasi Cantonment, Uttar Pradesh 221002",
    },
    overnight: "Notte in treno · Varanasi → Delhi",
    checks: [
      "Mattina libera",
      "Ultimi regali",
      "Treno per Delhi",
      "Ultima serata",
    ],
  },
  {
    date: "Dom 23 ago",
    city: "Delhi",
    title: "Namaste India",
    story:
      "Ultima colazione, saluti e partenze. Chi ha ancora tempo può visitare Humayun’s Tomb o Akshardham Temple.",
    goal: "Chiudere il viaggio senza fretta",
    km: 25,
    time: "1 h complessiva",
    transport: "Metro + taxi",
    from: "Delhi",
    to: "Delhi",
    path: "Delhi-finale",
    checks: [
      "Check-out",
      "Saluti",
      "Humayun’s Tomb opzionale",
      "Akshardham opzionale",
    ],
  },
];
const load = (k, f) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? f;
  } catch {
    return f;
  }
};

const pushKeyBytes = (value) => {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const transportPresentation = (transport = "") => {
  const icons = [];
  if (transport.includes("Aereo")) icons.push("\u2708\uFE0F");
  if (transport.includes("Treno")) icons.push("\uD83D\uDE86");
  if (transport.includes("Barca")) icons.push("\u26F5");
  if (transport.includes("A piedi")) icons.push("\uD83D\uDC63");
  if (transport.includes("Tuk-tuk")) icons.push("\uD83D\uDED6");
  if (transport.includes("Metro")) icons.push("\uD83D\uDE87");
  if (transport.includes("risci\u00f2")) icons.push("\uD83D\uDED6");
  if (transport.includes("Van") || transport.includes("Transfer") || transport.includes("taxi")) icons.push("\uD83D\uDE90");
  const mode = transport.includes("Aereo")
    ? "air"
    : transport.includes("Treno")
      ? "rail"
      : transport.includes("Barca")
        ? "boat"
        : transport.includes("A piedi")
          ? "walk"
          : "road";
  return { icons: [...new Set(icons)].join(" ") || "\uD83D\uDE90", mode };
};

const birthdayProfile = (people, birthdayName) => {
  const wanted = normalizeItalianCity(birthdayName);
  const wantedFirstName = wanted.split(" ")[0];
  return people.find((person) => {
    const fullName = normalizeItalianCity(`${person.name || ""} ${person.surname || ""}`);
    const firstName = normalizeItalianCity(person.name || "");
    return fullName === wanted || (wanted.split(" ").length === 1 && firstName === wantedFirstName);
  });
};

function TripMap({ selectedDay, currentDayIndex, onSelect, onReady }) {
  const el = useRef(null),
    map = useRef(null),
    maplibre = useRef(null),
    markers = useRef([]);
  const [ready, setReady] = useState(false);
  const [visualReady, setVisualReady] = useState(false);
  const day = selectedDay == null ? null : days[selectedDay];
  useEffect(() => {
    if (!el.current || map.current) return;
    let cancelled = false;
    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !el.current) return;
      maplibre.current = maplibregl;
      map.current = new maplibregl.Map({
        container: el.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [77.2, 25.8],
        zoom: 4.5,
        minZoom: 3.5,
        attributionControl: false,
        cooperativeGestures: true,
        antialias: true,
        fadeDuration: 0,
      });
      map.current.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );
      map.current.addControl(
        new maplibregl.ScaleControl({ unit: "metric", maxWidth: 90 }),
        "bottom-left",
      );
      map.current.on("load", () => {
        map.current.addSource("trip-route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.current.addLayer({
          id: "trip-route-shadow",
          type: "line",
          source: "trip-route",
          paint: {
            "line-color": "#102d25",
            "line-width": 11,
            "line-opacity": 0.34,
            "line-blur": 2.4,
          },
        });
        map.current.addLayer({
          id: "trip-route-road",
          type: "line",
          source: "trip-route",
          filter: ["==", ["get", "mode"], "road"],
          paint: {
            "line-color": "#ed6a24",
            "line-width": 6,
            "line-opacity": 1,
          },
        });
        map.current.addLayer({
          id: "trip-route-transit",
          type: "line",
          source: "trip-route",
          filter: ["==", ["get", "mode"], "transit"],
          paint: {
            "line-color": "#123b72",
            "line-width": 5.5,
            "line-opacity": 1,
            "line-dasharray": [1.6, 1.4],
          },
        });
        [
          ["air", "#1769aa", [1.1, 1.6]],
          ["rail", "#7b2845", [2.4, 1.1]],
          ["boat", "#007f86", [0.8, 1.25]],
          ["walk", "#287943", [0.35, 1.15]],
        ].forEach(([mode, color, dash]) => {
          map.current.addLayer({
            id: `trip-route-${mode}`,
            type: "line",
            source: "trip-route",
            filter: ["==", ["get", "mode"], mode],
            paint: {
              "line-color": color,
              "line-width": 5.5,
              "line-opacity": 1,
              "line-dasharray": dash,
            },
          });
        });
        setReady(true);
        map.current.once("idle", () => {
          setVisualReady(true);
          onReady?.();
        });
      });
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !ready || !maplibre.current) return;
    setVisualReady(false);
    const maplibregl = maplibre.current;
    markers.current.forEach((x) => x.remove());
    markers.current = [];
    const sequence = [
      "Delhi",
      "Udaipur",
      "Ranakpur",
      "Jodhpur",
      "Jaipur",
      "Agra",
      "Varanasi",
      "Delhi",
    ];
    const dayMarkerIndexes = [
      [0],
      [0],
      [0, 1],
      [1],
      [1, 2, 3],
      [3],
      [3, 4],
      [4],
      [4, 5],
      [5, 6],
      [6],
      [6],
      [6, 7],
      [7],
    ];
    const currentMarkerIndexes = [0, 0, 1, 1, 3, 3, 4, 4, 5, 6, 6, 6, 7, 7];
    const currentMarkerIndex =
      currentDayIndex >= 0 ? currentMarkerIndexes[currentDayIndex] : -1;
    const visibleMarkerIndexes =
      selectedDay == null
        ? sequence.map((_, i) => i)
        : dayMarkerIndexes[selectedDay];
    sequence.forEach((name, i) => {
      if (!visibleMarkerIndexes.includes(i)) return;
      const active = Boolean(day);
      const isCurrent =
        i === currentMarkerIndex &&
        (selectedDay == null || selectedDay === currentDayIndex);
      const node = document.createElement("button");
      node.className = `vectorMarker ${active ? "active" : ""} ${isCurrent ? "currentToday" : ""}`.trim();
      node.textContent = String(i + 1);
      node.setAttribute(
        "aria-label",
        `${isCurrent ? "Siamo qui oggi. " : ""}Tappa ${i + 1}: ${name}`,
      );
      node.onclick = () => onSelect?.(days.findIndex((d) => d.city === name));
      const [lat, lng] = places[name];
      const overviewOffset =
        selectedDay == null && i === 1
          ? [-15, 7]
          : selectedDay == null && i === 2
            ? [15, -7]
            : [0, 0];
      const marker = new maplibregl.Marker({
        element: node,
        anchor: "center",
        offset:
          selectedDay == null && name === "Delhi"
            ? [i === 0 ? -16 : 16, 0]
            : overviewOffset,
      })
        .setLngLat([lng, lat])
        .setPopup(
          new maplibregl.Popup({ offset: 18 }).setHTML(
            `<strong>${i + 1}. ${name}</strong>`,
          ),
        )
        .addTo(map.current);
      markers.current.push(marker);
    });
    const specialStops = selectedDay == null
      ? []
      : [
          ...([0, 2].includes(selectedDay) ? [["✈", "Aeroporto DEL", places["Aeroporto DEL"]]] : []),
          ...(selectedDay === 2 ? [["✈", "Aeroporto UDR", places["Aeroporto UDR"]]] : []),
          ...(selectedDay === 9 ? [
            ["🚆", "Stazione Agra Cantt", places["Agra Cantt"]],
            ["🚆", "Varanasi Junction", places["Varanasi Junction"]],
          ] : []),
          ...(selectedDay === 12 ? [
            ["🚆", "Varanasi Junction", places["Varanasi Junction"]],
            ["🚆", "Delhi Junction", places["Delhi Junction"]],
          ] : []),
          ...(day?.hotel?.place ? [["🏨", day.hotel.name, places[day.hotel.place]]] : []),
        ];
    specialStops
      .filter(([, , coordinates]) => coordinates)
      .forEach(([symbol, label, coordinates]) => {
        const node = document.createElement("span");
        node.className = "specialTripMarker";
        node.textContent = symbol;
        node.setAttribute("aria-label", label);
        const [lat, lng] = coordinates;
        const marker = new maplibregl.Marker({
          element: node,
          anchor: "bottom",
          offset: [0, -4],
        })
          .setLngLat([lng, lat])
          .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(`<strong>${label}</strong>`))
          .addTo(map.current);
        markers.current.push(marker);
      });
    if (selectedDay == null) {
      const midpointLngLat = (start, finish) => [
        (start[1] + finish[1]) / 2,
        (start[0] + finish[0]) / 2,
      ];
      const roadReference = roadPaths["Udaipur-Jodhpur"][
        Math.floor(roadPaths["Udaipur-Jodhpur"].length / 2)
      ];
      [
        ["✈️", "Volo interno DEL–UDR", "air", midpointLngLat(places["Aeroporto DEL"], places["Aeroporto UDR"]), [0, -28], "DEL–UDR"],
        ["🚐", "Spostamenti su strada Udaipur–Jodhpur", "road", [roadReference[1], roadReference[0]], [30, 26], "Udaipur–Jodhpur"],
        ["🚆", "Treno notturno Agra–Varanasi", "rail", midpointLngLat(places["Agra Cantt"], places["Varanasi Junction"]), [20, -22], "Agra–Varanasi"],
        ["⛵", "Barca sul Gange a Varanasi", "boat", [83.009, 25.305], [34, 22], "Varanasi"],
        ["👣", "Visite a piedi a Jodhpur", "walk", [places.Jodhpur[1], places.Jodhpur[0]], [-8, -25], "Jodhpur"],
      ].forEach(([symbol, label, mode, coordinates, offset, reference]) => {
        const node = document.createElement("span");
        node.className = `overviewModeMarker mode-${mode}`;
        node.textContent = symbol;
        node.setAttribute("aria-label", label);
        node.dataset.routeReference = reference;
        markers.current.push(new maplibregl.Marker({ element: node, anchor: "center", offset })
          .setLngLat(coordinates)
          .setPopup(new maplibregl.Popup({ offset: 18 }).setText(label))
          .addTo(map.current));
      });
    }
    const line = (coords, mode = "road") => ({
      type: "Feature",
      properties: { mode },
      geometry: {
        type: "LineString",
        coordinates: coords.map(([lat, lng]) => [lng, lat]),
      },
    });
    let features;
    let fitPoints;
    if (day) {
      const coords = day.path
        ? roadPaths[day.path]
        : day.from === day.to
          ? [places[day.from]]
          : [places[day.from], places[day.to]];
      const routeMode = transportPresentation(day.transport).mode;
      if (selectedDay === 2) {
        features = [
          line(roadPaths["Delhi-airport-transfer"], "road"),
          line([places["Aeroporto DEL"], [27.2, 75.45], places["Aeroporto UDR"]], "air"),
          line(roadPaths["Udaipur-airport-transfer"], "road"),
        ];
      } else if (selectedDay === 9) {
        features = [
          line(roadPaths["Agra-station-transfer"], "road"),
          line([places["Agra Cantt"], [26.15, 80.55], places["Varanasi Junction"]], "rail"),
          line(roadPaths["Varanasi-station-transfer"], "road"),
        ];
      } else if (selectedDay === 12) {
        features = [
          line([...roadPaths["Varanasi-station-transfer"]].reverse(), "road"),
          line([places["Varanasi Junction"], [26.75, 80.4], places["Delhi Junction"]], "rail"),
          line(roadPaths["Delhi-station-transfer"], "road"),
        ];
      } else {
        features = coords.length > 1 ? [line(coords, routeMode)] : [];
      }
      fitPoints = [
        ...features.flatMap((feature) => feature.geometry.coordinates.map(([lng, lat]) => [lat, lng])),
        ...visibleMarkerIndexes.map((index) => places[sequence[index]]),
        ...specialStops.map(([, , coordinates]) => coordinates),
      ].filter(Boolean);
      if (coords.length > 1) {
        [
          ["start", "Partenza", day.from, coords[0]],
          ["finish", "Arrivo", day.to, coords[coords.length - 1]],
        ].forEach(([kind, label, place, coordinates]) => {
          const node = document.createElement("span");
          node.className = `routeEndpointMarker ${kind}`;
          node.textContent = kind === "start" ? "▶" : "●";
          node.setAttribute("aria-label", `${label}: ${place}`);
          const [lat, lng] = coordinates;
          markers.current.push(new maplibregl.Marker({ element: node, anchor: "center" })
            .setLngLat([lng, lat])
            .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(
              `<strong>${label}</strong><br><small>${place}</small>`,
            ))
            .addTo(map.current));
        });
      }
    } else {
      features = [
        line([places["Aeroporto DEL"], [27.2, 75.45], places["Aeroporto UDR"]], "air"),
        line(roadPaths["Udaipur-Jodhpur"], "road"),
        line(roadPaths["Jodhpur-Jaipur"], "road"),
        line(roadPaths["Jaipur-Agra"], "road"),
        line([places["Agra Cantt"], [26.15, 80.55], places["Varanasi Junction"]], "rail"),
        line([places["Varanasi Junction"], [26.75, 80.4], places["Delhi Junction"]], "rail"),
      ];
      fitPoints = Object.values(places);
    }
    map.current.getSource("trip-route").setData({
      type: "FeatureCollection",
      features,
    });
    map.current.stop();
    map.current.resize();
    if (fitPoints.length === 1) {
      const [lat, lng] = fitPoints[0];
      map.current.flyTo({
        center: [lng, lat],
        zoom: 10.5,
        bearing: 0,
        pitch: 0,
        duration: 900,
        essential: true,
      });
    } else {
      const bounds = fitPoints.reduce(
        (box, [lat, lng]) => box.extend([lng, lat]),
        new maplibregl.LngLatBounds(),
      );
      map.current.fitBounds(bounds, {
        padding: day
          ? { top: 76, right: 40, bottom: 76, left: 40 }
          : { top: 112, right: 56, bottom: 108, left: 56 },
        maxZoom: day
          ? day.km <= 15
            ? 13.2
            : day.km <= 40
              ? 12.4
              : day.km <= 120
                ? 10.2
                : 7.5
          : 5.2,
        duration: 950,
        bearing: 0,
        pitch: 0,
        essential: true,
      });
    }
    map.current.once("idle", () => {
      setVisualReady(true);
      onReady?.();
    });
  }, [selectedDay, ready, currentDayIndex]);
  return (
    <div className={`realMapWrap ${day ? "dayRouteMap" : "overviewRouteMap"}`}>
      <div
        className="realMap"
        ref={el}
        aria-label="Mappa interattiva reale dell’itinerario in India"
      />
      {day && (
        <div
          className={`transportMapBadge transport-${transportPresentation(day.transport).mode}`}
          aria-label={`Mezzi del giorno: ${day.transport}`}
        >
          <span>{transportPresentation(day.transport).icons}</span>
          <b>{day.transport}</b>
        </div>
      )}
      {!day && (
        <div className="overviewRouteLegend" aria-label="Legenda dei mezzi">
          <span className="air">✈️ Aereo</span>
          <span className="road">🚐 Van</span>
          <span className="rail">🚆 Treno</span>
          <span className="boat">⛵ Barca</span>
          <span className="walk">👣 Piedi</span>
        </div>
      )}
      {day && (
        <div className="routeMapSummary" aria-label={`Percorso da ${day.from} a ${day.to}`}>
          <span><i className="start">▶</i><small>Partenza</small><b>{day.from}</b></span>
          <em>{day.km} km</em>
          <span><i className="finish">●</i><small>Arrivo</small><b>{day.to}</b></span>
        </div>
      )}
      {!visualReady && (
        <div className="mapLoading">
          <MapPinned />
          <b>Disegno il percorso sulla cartina…</b>
          <small>Cartografia vettoriale ad alta definizione</small>
        </div>
      )}
    </div>
  );
}

function GoogleTripMap({ selectedDay, onReady }) {
  const day = selectedDay == null ? null : days[selectedDay];
  const place = (value) => `${value === "Delhi" ? "New Delhi" : value}, India`;
  const mapQuery = day
    ? day.from === day.to
      ? place(day.to)
      : `${place(day.from)} to ${place(day.to)}`
    : "Northern India";
  const zoom = day ? (day.km <= 35 ? 11 : day.km <= 120 ? 8 : 6) : 5;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${zoom}&output=embed`;
  const directions = new URL("https://www.google.com/maps/dir/");
  directions.searchParams.set("api", "1");
  if (day) {
    directions.searchParams.set("origin", place(day.from));
    directions.searchParams.set("destination", place(day.to));
  } else {
    directions.searchParams.set("origin", "New Delhi, India");
    directions.searchParams.set("destination", "New Delhi, India");
    directions.searchParams.set(
      "waypoints",
      "Udaipur, India|Jodhpur, India|Jaipur, India|Agra, India|Varanasi, India",
    );
  }
  return (
    <div className="googleTripMap">
      <iframe
        key={`${selectedDay}-${embedUrl}`}
        title={day ? `Google Maps: ${day.from} - ${day.to}` : "Google Maps: itinerario India"}
        src={embedUrl}
        loading="eager"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={onReady}
      />
      <div className="googleMapCaption">
        <span>Google Maps</span>
        <b>{day ? `${day.from} → ${day.to}` : "India del Nord"}</b>
        <a href={directions.toString()} target="_blank" rel="noreferrer">
          Apri percorso
        </a>
      </div>
    </div>
  );
}

function PeopleLocationMap({ locations }) {
  const elementRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const tripMarkersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;
    let cancelled = false;
    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !elementRef.current) return;
      mapRef.current = new maplibregl.Map({
        container: elementRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [78.9, 22.6],
        zoom: 3.8,
        minZoom: 3,
        attributionControl: false,
      });
      mapRef.current.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );
      mapRef.current.once("load", () => {
        const routeCities = [
          "Delhi",
          "Udaipur",
          "Jodhpur",
          "Jaipur",
          "Agra",
          "Varanasi",
          "Delhi",
        ];
        mapRef.current.addSource("group-trip-context", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: routeCities.map((city) => {
                const [lat, lng] = places[city];
                return [lng, lat];
              }),
            },
          },
        });
        mapRef.current.addLayer({
          id: "group-trip-context-line",
          type: "line",
          source: "group-trip-context",
          paint: {
            "line-color": "#e96824",
            "line-width": 3,
            "line-opacity": 0.72,
            "line-dasharray": [2, 1.5],
          },
        });
        tripMarkersRef.current = routeCities.slice(0, -1).map((city, index) => {
          const node = document.createElement("div");
          node.className = "tripContextMarker";
          node.textContent = String(index + 1);
          const [lat, lng] = places[city];
          return new maplibregl.Marker({ element: node })
            .setLngLat([lng, lat])
            .setPopup(
              new maplibregl.Popup({ offset: 14 }).setText(
                `${index + 1}. ${city}`,
              ),
            )
            .addTo(mapRef.current);
        });
        setMapReady(true);
      });
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      tripMarkersRef.current = [];
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const render = async () => {
      const { default: maplibregl } = await import("maplibre-gl");
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = locations.map((location) => {
        const node = document.createElement("div");
        node.className = "personMapMarker";
        node.textContent = location.display_name?.[0]?.toUpperCase() || "•";
        return new maplibregl.Marker({ element: node })
          .setLngLat([Number(location.longitude), Number(location.latitude)])
          .setPopup(
            new maplibregl.Popup({ offset: 18 }).setHTML(
              `<strong>${location.display_name}</strong><br><small>${new Date(location.updated_at).toLocaleString("it-IT")}</small>`,
            ),
          )
          .addTo(map);
      });
      map.resize();
      if (!locations.length) {
        map.easeTo({ center: [78.9, 22.6], zoom: 3.8, duration: 500 });
      } else if (locations.length === 1) {
        map.easeTo({
          center: [Number(locations[0].longitude), Number(locations[0].latitude)],
          zoom: 10,
          duration: 700,
        });
      } else {
        const bounds = locations.reduce(
          (value, location) =>
            value.extend([
              Number(location.longitude),
              Number(location.latitude),
            ]),
          new maplibregl.LngLatBounds(),
        );
        map.fitBounds(bounds, { padding: 55, maxZoom: 10, duration: 700 });
      }
    };
    render();
  }, [locations, mapReady]);
  return (
    <div className="peopleLocationMap" ref={elementRef} aria-label="Posizioni del gruppo sulla cartina dell'India" />
  );
}

function ItalyTravelerMap({ people }) {
  const elementRef = useRef(null);
  const [resolvedCities, setResolvedCities] = useState({});
  const unknownCities = useMemo(() => {
    const result = new Map();
    people.forEach((person) => {
      const city = String(person.origin_city || "").trim();
      const key = normalizeItalianCity(city);
      if (key && !ITALIAN_CITY_COORDINATES[key] && !resolvedCities[key]) result.set(key, city);
    });
    return [...result.entries()];
  }, [people, resolvedCities]);
  useEffect(() => {
    if (!unknownCities.length) return undefined;
    const controller = new AbortController();
    Promise.all(unknownCities.map(async ([key, city]) => {
      try {
        const response = await fetch(`${API}/places/search?q=${encodeURIComponent(`${city}, Italia`)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return null;
        const result = await response.json();
        const italianPlace = (result.places || []).find((place) =>
          Number(place.longitude) >= 6.4 && Number(place.longitude) <= 18.9 &&
          Number(place.latitude) >= 35.4 && Number(place.latitude) <= 47.2,
        );
        return italianPlace
          ? [key, [Number(italianPlace.longitude), Number(italianPlace.latitude)]]
          : null;
      } catch (error) {
        if (error.name !== "AbortError") return null;
        return null;
      }
    })).then((entries) => {
      if (controller.signal.aborted) return;
      const found = Object.fromEntries(entries.filter(Boolean));
      if (Object.keys(found).length) setResolvedCities((current) => ({ ...current, ...found }));
    });
    return () => controller.abort();
  }, [unknownCities]);
  const groups = useMemo(() => {
    const grouped = new Map();
    people.forEach((person) => {
      const key = normalizeItalianCity(person.origin_city);
      const coordinates = ITALIAN_CITY_COORDINATES[key] || resolvedCities[key];
      if (!coordinates) return;
      const existing = grouped.get(key) || {
        city: String(person.origin_city).trim(),
        coordinates,
        people: [],
      };
      existing.people.push(person);
      grouped.set(key, existing);
    });
    return [...grouped.values()];
  }, [people, resolvedCities]);
  useEffect(() => {
    if (!elementRef.current) return undefined;
    let map;
    let cancelled = false;
    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !elementRef.current) return;
      map = new maplibregl.Map({
        container: elementRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [12.4, 42.4],
        zoom: 4.5,
        minZoom: 4,
        attributionControl: false,
        cooperativeGestures: true,
        antialias: true,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        const bounds = new maplibregl.LngLatBounds();
        groups.forEach((group) => {
          const markerNode = document.createElement("button");
          markerNode.className = "italyOriginMarker";
          markerNode.textContent = String(group.people.length);
          markerNode.setAttribute("aria-label", `${group.people.length} da ${group.city}`);
          new maplibregl.Marker({ element: markerNode })
            .setLngLat(group.coordinates)
            .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(
              `<strong>${group.city}</strong><br><small>${group.people.map((person) => `${person.name} ${person.surname || ""}`.trim()).join(" · ")}</small>`,
            ))
            .addTo(map);
          bounds.extend(group.coordinates);
        });
        map.resize();
        if (groups.length === 1) map.easeTo({ center: groups[0].coordinates, zoom: 7, duration: 500 });
        else if (groups.length > 1) map.fitBounds(bounds, { padding: 58, maxZoom: 7, duration: 600 });
      });
    });
    return () => { cancelled = true; map?.remove(); };
  }, [groups]);
  const mappedCount = groups.reduce((total, group) => total + group.people.length, 0);
  return (
    <div className="italyOriginsBody">
      <div className="italyOriginsMap" ref={elementRef} aria-label="Provenienza dei viaggiatori sulla cartina dell’Italia" />
      <div className="italyOriginsLegend">
        <b>{mappedCount} viaggiatori localizzati</b>
        <small>Il numero nel punto indica quante persone arrivano dalla stessa città.</small>
        {people.length > mappedCount && (
          <small>{people.length - mappedCount} senza città indicata o da localizzare.</small>
        )}
      </div>
    </div>
  );
}

function App() {
  const initialParams = new URLSearchParams(location.search);
  const initialDay = Math.max(
    0,
    Math.min(days.length - 1, Number(initialParams.get("day") || 1) - 1),
  );
  // L’apertura normale resta sulla bacheca; i soli link espliciti di anteprima
  // possono aprire direttamente la cartina completa o una giornata precisa.
  const startsOnMap = initialParams.get("view") === "map";
  const initialMapDay = startsOnMap && initialParams.has("day") ? initialDay : null;
  const navigationOriginRef = useRef(
    (() => {
      try {
        return JSON.parse(sessionStorage.getItem("india-map-origin"));
      } catch {
        return null;
      }
    })(),
  );
  const syncVersionRef = useRef(0);
  const [tab, setTab] = useState(startsOnMap ? "map" : "diary"),
    [done, setDone] = useState(() => load("india-done", {})),
    [posts, setPosts] = useState(() => sanitizePostsForPublicCache(load("india-posts", []))),
    [people, setPeople] = useState(() => sanitizeProfilesForPublicCache(load("india-people", []))),
    [open, setOpen] = useState(initialDay),
    [selectedDay, setSelectedDay] = useState(0),
    [mapDay, setMapDay] = useState(initialMapDay),
    [vaultProfileId, setVaultProfileId] = useState(""),
    [composeOpen, setComposeOpen] = useState(false),
    [notificationOpen, setNotificationOpen] = useState(false),
    [quickProfileOpen, setQuickProfileOpen] = useState(false),
    [travelersOpen, setTravelersOpen] = useState(false),
    [travelerOriginsOpen, setTravelerOriginsOpen] = useState(false),
    [cityPanel, setCityPanel] = useState(null),
    [weatherByDate, setWeatherByDate] = useState({}),
    [indiaClock, setIndiaClock] = useState(() => Date.now()),
    [quickStatus, setQuickStatus] = useState(""),
    [accessCode, setAccessCode] = useState(""),
    [groupCode, setGroupCode] = useState(""),
    [sessionToken, setSessionToken] = useState(
      () => localStorage.getItem("india-session-token") || "",
    ),
    [sessionProfile, setSessionProfile] = useState(null),
    [lastActivityRead, setLastActivityRead] = useState(
      () => localStorage.getItem("india-activity-read") || "",
    ),
    [indiaToday, setIndiaToday] = useState(() => indiaDateKey());
  const [bootstrapForm, setBootstrapForm] = useState({
    name: "",
    surname: "",
    origin_city: "",
    gender: "",
    role: "traveler",
    privacy_consent: false,
  });
  const [bootstrapBusy, setBootstrapBusy] = useState(false);
  const [travelerRegisterBusy, setTravelerRegisterBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${API}/weather`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => {
        if (!active) return;
        setWeatherByDate(Object.fromEntries(
          (result.forecasts || []).map((forecast) => [`${forecast.date}:${forecast.city}`, forecast]),
        ));
      })
      .catch(() => {});
    const timer = setInterval(() => setIndiaClock(Date.now()), 30_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const indiaTime = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  }).format(indiaClock);

  useEffect(() => {
    if (!travelersOpen && !travelerOriginsOpen) return undefined;
    document.documentElement.classList.add("travelerDirectoryOpen");
    return () => {
      document.documentElement.classList.remove("travelerDirectoryOpen");
    };
  }, [travelersOpen, travelerOriginsOpen]);
  useEffect(() => {
    // Cambiare sezione non deve lasciare un overlay o un blocco dello scroll attivo.
    setTravelersOpen(false);
    setTravelerOriginsOpen(false);
    setNotificationOpen(false);
    document.documentElement.classList.remove("travelerDirectoryOpen");
  }, [tab]);
  useEffect(() => {
    const pauseEveryMedia = () => {
      document.querySelectorAll("audio, video").forEach((media) => {
        if (!media.paused) media.pause();
      });
      if ("mediaSession" in navigator) {
        try { navigator.mediaSession.playbackState = "paused"; } catch {}
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) pauseEveryMedia();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", pauseEveryMedia);
    window.addEventListener("freeze", pauseEveryMedia);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", pauseEveryMedia);
      window.removeEventListener("freeze", pauseEveryMedia);
      document.documentElement.classList.remove("travelerDirectoryOpen");
    };
  }, []);
  const simulatedDate = initialParams.get("simulateDate");
  const activeDateKey = /^2026-08-(1\d|2[0-3])$/.test(simulatedDate || "")
    ? simulatedDate
    : indiaToday;
  const todayTripIndex = tripDateKeys.indexOf(activeDateKey);
  const effectiveGroupCode = groupCode;
  const verifiedSessionToken = sessionProfile ? sessionToken : "";
  const sessionCheckPending = Boolean(sessionToken && !sessionProfile);
  const effectiveSessionToken = verifiedSessionToken;
  const sessionTokenRef = useRef(effectiveSessionToken);
  useEffect(() => {
    sessionTokenRef.current = effectiveSessionToken;
    refresh();
  }, [effectiveSessionToken]);
  const refresh = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const visibleAnchor = Array.from(
      document.querySelectorAll("[data-scroll-anchor]"),
    ).find((element) => element.getBoundingClientRect().bottom > 72);
    const anchorState = visibleAnchor
      ? {
          id: visibleAnchor.getAttribute("data-scroll-anchor"),
          top: visibleAnchor.getBoundingClientRect().top,
        }
      : null;
    try {
      const r = await fetch(`${API}/state`, {
        cache: "no-store",
        headers: sessionTokenRef.current
          ? sessionHeaders(sessionTokenRef.current)
          : storedGuestHeaders(),
        signal: controller.signal,
      });
      if (!r.ok) throw Error();
      const d = await r.json();
      setPosts(d.posts || []);
      setPeople(d.profiles || []);
      syncVersionRef.current = Number(d.sync_version || 0);
      localStorage.setItem(
        "india-posts",
        JSON.stringify(sanitizePostsForPublicCache(d.posts || [])),
      );
      localStorage.setItem(
        "india-people",
        JSON.stringify(sanitizeProfilesForPublicCache(d.profiles || [])),
      );
      if (anchorState) {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const sameElement = document.querySelector(
              `[data-scroll-anchor="${CSS.escape(anchorState.id)}"]`,
            );
            if (!sameElement) return;
            const movement = sameElement.getBoundingClientRect().top - anchorState.top;
            if (Math.abs(movement) > 1)
              window.scrollBy({ top: movement, behavior: "auto" });
          }),
        );
      }
    } catch (error) {
      console.error("india-sync", error);
    } finally {
      clearTimeout(timeout);
    }
  };
  useEffect(() => {
    let flushing = false;
    const flushPending = async () => {
      if (flushing || !navigator.onLine) return;
      flushing = true;
      try {
        const result = await flushOfflineQueue();
        if (result.sent) await refresh();
      } catch {
        // La coda resta nel dispositivo e verrà riprovata al prossimo ciclo.
      } finally {
        flushing = false;
      }
    };
    flushPending();
    const timer = setInterval(flushPending, 15000);
    addEventListener("online", flushPending);
    return () => {
      clearInterval(timer);
      removeEventListener("online", flushPending);
    };
  }, []);
  useEffect(() => {
    const initialUrl = new URL(location.href);
    if (initialUrl.searchParams.has("view") || initialUrl.searchParams.has("day")) {
      initialUrl.searchParams.delete("view");
      initialUrl.searchParams.delete("day");
      history.replaceState({}, "", initialUrl);
    }
    refresh();
    const checkVersion = async () => {
      if (document.hidden || !navigator.onLine) return;
      try {
        const response = await fetch(`${API}/sync/version`, { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        if (Number(result.version || 0) > syncVersionRef.current) await refresh();
      } catch {
        // Il controllo leggero riprova automaticamente al ciclo successivo.
      }
    };
    const onReturn = () => {
      if (!document.hidden) checkVersion();
    };
    const timer = setInterval(checkVersion, 2500);
    const silentRepair = setInterval(async () => {
      if (document.hidden || !navigator.onLine) return;
      try {
        const response = await fetch(`${API}/health`, { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        if (Number(result.version || 0) > syncVersionRef.current) await refresh();
      } catch {
        // Controllo di salute silenzioso: riprova senza disturbare l'utente.
      }
    }, 60000);
    addEventListener("online", checkVersion);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      clearInterval(timer);
      clearInterval(silentRepair);
      removeEventListener("online", checkVersion);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, []);
  const deepLinkHandledRef = useRef("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postId = params.get("post");
    if (!postId || !posts.some((post) => post.id === postId)) return;
    const commentId = params.get("comment");
    const key = `${postId}:${commentId || ""}`;
    if (deepLinkHandledRef.current === key) return;
    deepLinkHandledRef.current = key;
    setTab("diary");
    requestAnimationFrame(() => {
      const target = document.querySelector(
        commentId
          ? `[data-comment-id="${CSS.escape(commentId)}"]`
          : `[data-scroll-anchor="post-${CSS.escape(postId)}"]`,
      );
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [posts]);
  useEffect(() => {
    const timer = setInterval(() => setIndiaToday(indiaDateKey()), 60000);
    return () => clearInterval(timer);
  }, []);
  const restoreNavigationOrigin = (origin) => {
    if (!origin) return;
    setTab(origin.tab || "roadmap");
    if (Number.isInteger(origin.day)) {
      setOpen(origin.day);
      setSelectedDay(origin.day);
    }
    document.fonts?.ready.then(() => {
      const target = document.getElementById(
        origin.contentId || `day-${Number(origin.day) + 1}`,
      );
      if (!target) {
        window.scrollTo({ top: origin.scrollY || 0, behavior: "auto" });
        return;
      }
      const observer = new ResizeObserver(() => {
        observer.disconnect();
        window.scrollTo({ top: origin.scrollY || target.offsetTop, behavior: "auto" });
      });
      observer.observe(target);
    });
  };
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(location.search);
      if (params.get("view") === "map") {
        const dayIndex = Math.max(
          0,
          Math.min(days.length - 1, Number(params.get("day") || 1) - 1),
        );
        setMapDay(dayIndex);
        setTab("map");
      } else {
        restoreNavigationOrigin(navigationOriginRef.current);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(
    () => localStorage.setItem("india-done", JSON.stringify(done)),
    [done],
  );
  useEffect(() => {
    document.documentElement.dataset.appTab = tab;
  }, [tab]);
  useEffect(() => {
    // Il vecchio codice comune non deve sopravvivere nel dispositivo.
    // Dopo il collegamento resta soltanto la sessione personale revocabile.
    localStorage.removeItem("india-group-code");
  }, []);
  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
    const inviteToken =
      hashParams.get("invite") ||
      new URLSearchParams(location.search).get("invite") ||
      sessionStorage.getItem("india-pending-invite");
    if (!inviteToken) return;
    const cleanUrl = new URL(location.href);
    cleanUrl.searchParams.delete("invite");
    cleanUrl.hash = "";
    history.replaceState({}, "", cleanUrl);
    sessionStorage.setItem("india-auth-claiming", "1");
    sessionStorage.setItem("india-pending-invite", inviteToken);
    const claimInvite = async () => {
      const existingToken = localStorage.getItem("india-session-token") || "";
      if (existingToken) {
        const currentResponse = await fetch(`${API}/auth/session`, {
          cache: "no-store",
          headers: sessionHeaders(existingToken),
        });
        if (currentResponse.ok) {
          const current = await currentResponse.json();
          localStorage.setItem("india-profile-id", current.profile.id);
          localStorage.setItem("india-role", current.profile.role || "traveler");
          localStorage.setItem(
            "india-visitor-name",
            `${current.profile.name} ${current.profile.surname || ""}`.trim(),
          );
          setSessionToken(existingToken);
          setSessionProfile(current.profile);
          setVaultProfileId(current.profile.id);
          setQuickProfileOpen(true);
          setQuickStatus(
            `Questo telefono è già collegato a ${current.profile.name}. Per usare un altro invito, blocca prima questo accesso.`,
          );
          sessionStorage.removeItem("india-pending-invite");
          return;
        }
        if (![401, 403].includes(currentResponse.status))
          throw Error("Verifica dell’accesso non riuscita. Riprova.");
        localStorage.removeItem("india-session-token");
        localStorage.removeItem("india-profile-id");
        localStorage.removeItem("india-role");
        localStorage.removeItem("india-visitor-name");
      }
      const response = await fetch(`${API}/auth/claim`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-device-name": deviceName(), "x-device-key": deviceKey() },
        body: JSON.stringify({ invite_token: inviteToken }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Invito non valido");
      return result;
    };
    claimInvite()
      .then((result) => {
        if (!result) return;
        localStorage.setItem("india-session-token", result.token);
        localStorage.removeItem("india-guest-token");
        localStorage.removeItem("india-guest-name");
        localStorage.removeItem("india-visitor-id");
        localStorage.setItem("india-profile-id", result.profile.id);
        localStorage.setItem("india-role", result.profile.role || "traveler");
        localStorage.setItem(
          "india-visitor-name",
          `${result.profile.name} ${result.profile.surname || ""}`.trim(),
        );
        setSessionToken(result.token);
        setSessionProfile(result.profile);
        setVaultProfileId(result.profile.id);
        setQuickStatus(`Accesso personale attivato per ${result.profile.name}.`);
        sessionStorage.removeItem("india-pending-invite");
      })
      .catch((error) => setQuickStatus(error.message))
      .finally(() => sessionStorage.removeItem("india-auth-claiming"));
  }, []);
  useEffect(() => {
    if (!sessionToken) return undefined;
    let active = true;
    let checking = false;
    const verifySession = async () => {
      if (
        checking ||
        document.hidden ||
        !navigator.onLine ||
        sessionStorage.getItem("india-auth-claiming") === "1"
      ) return;
      checking = true;
      try {
        const response = await fetch(`${API}/auth/session`, {
          cache: "no-store",
          headers: sessionHeaders(sessionToken),
        });
        if (!active) return;
        if (response.ok) {
          const result = await response.json();
          if (!active) return;
          setSessionProfile(result.profile);
          localStorage.setItem("india-profile-id", result.profile.id);
          localStorage.setItem("india-role", result.profile.role || "traveler");
          localStorage.setItem(
            "india-visitor-name",
            `${result.profile.name} ${result.profile.surname || ""}`.trim(),
          );
          const expiresAt = Date.parse(result.expires_at || "");
          if (Number.isFinite(expiresAt) && expiresAt - Date.now() < 7 * 24 * 60 * 60 * 1000) {
            const refreshed = await fetch(`${API}/auth/refresh`, {
              method: "POST",
              cache: "no-store",
              headers: sessionHeaders(sessionToken),
            });
            if (refreshed.ok) {
              const refreshedSession = await refreshed.json();
              if (typeof refreshedSession.token !== "string" || !refreshedSession.token) {
                throw Object.assign(new Error("Rinnovo sessione non valido"), { invalidSession: true });
              }
              localStorage.setItem("india-session-token", refreshedSession.token);
              setSessionToken(refreshedSession.token);
            } else if ([401, 403].includes(refreshed.status)) {
              throw Object.assign(new Error("Sessione non valida"), { invalidSession: true });
            }
          }
          return;
        }
        if (![401, 403].includes(response.status)) return;
        localStorage.removeItem("india-session-token");
        localStorage.removeItem("india-profile-id");
        localStorage.removeItem("india-visitor-name");
        localStorage.removeItem("india-role");
        localStorage.removeItem("india-guest-token");
        localStorage.removeItem("india-guest-name");
        localStorage.removeItem("india-visitor-id");
        setSessionToken("");
        setSessionProfile(null);
      } catch (error) {
        if (error?.invalidSession) {
          localStorage.removeItem("india-session-token");
          localStorage.removeItem("india-profile-id");
          localStorage.removeItem("india-visitor-name");
          localStorage.removeItem("india-role");
          setSessionToken("");
          setSessionProfile(null);
        }
        // Un errore di rete non deve scollegare il viaggiatore: il controllo riprova.
      } finally {
        checking = false;
      }
    };
    const onReturn = () => {
      if (!document.hidden) verifySession();
    };
    verifySession();
    const timer = setInterval(verifySession, 2500);
    addEventListener("online", verifySession);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      active = false;
      clearInterval(timer);
      removeEventListener("online", verifySession);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [sessionToken]);
  useEffect(() => {
    if (!sessionToken) setSessionProfile(null);
  }, [sessionToken]);
  const activeProfileId = sessionProfile?.id || "";
  const currentProfile = sessionProfile
    ? people.find((person) => person.id === sessionProfile.id) || sessionProfile
    : null;
  useEffect(() => {
    if (sessionToken) return;
    localStorage.removeItem("india-profile-id");
    localStorage.removeItem("india-role");
  }, [sessionToken]);
  useEffect(() => {
    if (!currentProfile || !verifiedSessionToken) return;
    localStorage.setItem("india-profile-id", currentProfile.id);
    localStorage.setItem(
      "india-visitor-name",
      `${currentProfile.name} ${currentProfile.surname || ""}`.trim(),
    );
  }, [currentProfile?.id, verifiedSessionToken]);
  const openComposer = (dayIndex) => {
    // Pubblicare e' un'azione del gruppo: non lasciare il pannello bloccato
    // dalla sola anteprima pubblica quando questo dispositivo e' gia' sbloccato.
    const entry = publicationEntryState({
      sessionToken: verifiedSessionToken,
      groupCode,
      selectedDay: dayIndex,
    });
    setTab("diary");
    setSelectedDay(entry.selectedDay);
    setComposeOpen(entry.composeOpen);
  };
  const bootstrapCoordinator = async () => {
    if (!bootstrapForm.name.trim() || bootstrapBusy) {
      setQuickStatus("Inserisci almeno il tuo nome.");
      return;
    }
    setBootstrapBusy(true);
    setQuickStatus("Creo il primo coordinatore e collego questo telefono…");
    try {
      const response = await fetch(`${API}/auth/bootstrap`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-group-code": groupCode,
          "x-device-name": deviceName(),
          "x-device-key": deviceKey(),
        },
        body: JSON.stringify(bootstrapForm),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(result.error || "Creazione non riuscita.");
      const displayName = `${result.profile.name} ${result.profile.surname || ""}`.trim();
      localStorage.setItem("india-session-token", result.token);
      localStorage.removeItem("india-guest-token");
      localStorage.removeItem("india-guest-name");
      localStorage.removeItem("india-visitor-id");
      localStorage.setItem("india-profile-id", result.profile.id);
      localStorage.setItem("india-role", "coordinator");
      localStorage.setItem("india-visitor-name", displayName);
      setSessionToken(result.token);
      setSessionProfile(result.profile);
      setGroupCode("");
      setVaultProfileId(result.profile.id);
      setQuickStatus(`Accesso coordinatore attivato per ${displayName}.`);
      await refresh();
    } catch (error) {
      setQuickStatus(error.message || "Creazione del coordinatore non riuscita.");
    } finally {
      setBootstrapBusy(false);
    }
  };
  const registerTraveler = async () => {
    if (!bootstrapForm.name.trim() || travelerRegisterBusy) {
      setQuickStatus("Inserisci almeno il tuo nome.");
      return;
    }
    if (bootstrapForm.privacy_consent !== true) {
      setQuickStatus("Accetta l’informativa privacy per creare il profilo.");
      return;
    }
    setTravelerRegisterBusy(true);
    setQuickStatus("Creo il tuo profilo e collego questo telefono…");
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-group-code": groupCode,
          "x-device-name": deviceName(),
          "x-device-key": deviceKey(),
        },
        body: JSON.stringify(bootstrapForm),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(result.error || "Registrazione non riuscita.");
      const displayName = `${result.profile.name} ${result.profile.surname || ""}`.trim();
      localStorage.setItem("india-session-token", result.token);
      localStorage.removeItem("india-guest-token");
      localStorage.removeItem("india-guest-name");
      localStorage.removeItem("india-visitor-id");
      localStorage.setItem("india-profile-id", result.profile.id);
      localStorage.setItem("india-role", result.profile.role || "traveler");
      localStorage.setItem("india-visitor-name", displayName);
      setSessionToken(result.token);
      setSessionProfile(result.profile);
      setGroupCode("");
      setQuickStatus(`Telefono collegato a ${displayName}.`);
      await refresh();
    } catch (error) {
      setQuickStatus(error.message || "Registrazione non riuscita.");
    } finally {
      setTravelerRegisterBusy(false);
    }
  };
  const quickShareLocation = () => {
    if (!currentProfile || !verifiedSessionToken) return;
    setQuickStatus("Cerco la posizione…");
    navigator.geolocation?.getCurrentPosition(
      async (position) => {
        const response = await fetch(`${API}/locations`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...sessionHeaders(verifiedSessionToken),
          },
          body: JSON.stringify({
            profile_id: currentProfile.id,
            display_name:
              `${currentProfile.name} ${currentProfile.surname || ""}`.trim(),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });
        setQuickStatus(
          response.ok
            ? "Posizione condivisa adesso."
            : "Posizione non inviata. Riprova.",
        );
      },
      () => setQuickStatus("Permesso posizione non disponibile."),
    );
  };
  const quickRemoveLocation = async () => {
    if (!currentProfile || !verifiedSessionToken) return;
    const response = await fetch(`${API}/locations/${currentProfile.id}`, {
      method: "DELETE",
      headers: sessionHeaders(verifiedSessionToken),
    });
    setQuickStatus(
      response.ok ? "Posizione cancellata." : "Cancellazione non riuscita.",
    );
  };
  const enableNotifications = async () => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true;
    if (isIos && !isStandalone) {
      setQuickStatus("Su iPhone: aggiungi prima l’app alla schermata Home.");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setQuickStatus("Notifiche non supportate su questo dispositivo.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem("india-notifications", permission);
      if (permission !== "granted") {
        setQuickStatus("Notifiche non autorizzate.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const configResponse = await fetch(`${API}/push/config`, { cache: "no-store" });
      if (!configResponse.ok) throw new Error("Configurazione non disponibile");
      const { public_key: publicKey } = await configResponse.json();
      if (!publicKey) throw new Error("Configurazione non disponibile");
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription)
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: pushKeyBytes(publicKey),
        });
      const response = await fetch(`${API}/push/subscribe`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...sessionHeaders(sessionToken),
          ...(!sessionToken ? storedGuestHeaders() : {}),
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          visitor_name: localStorage.getItem("india-visitor-name") || "Familiare",
        }),
      });
      if (!response.ok) throw new Error("Iscrizione non riuscita");
      localStorage.setItem("india-push-enabled", "true");
      setQuickStatus("Notifiche sul telefono attive.");
    } catch (error) {
      console.error("india-push", error);
      setQuickStatus("Notifiche non attivate. Riprova.");
    }
  };
  const showMap = (i) => {
    const origin = {
      page: tab,
      tab,
      tripId: "india-2026",
      day: Number.isInteger(i) ? i : open,
      dayId: `giorno-${String((Number.isInteger(i) ? i : open) + 1).padStart(2, "0")}`,
      contentId: `day-${(Number.isInteger(i) ? i : open) + 1}`,
      scrollY: window.scrollY,
      source: tab === "roadmap" ? "diario" : tab,
    };
    navigationOriginRef.current = origin;
    sessionStorage.setItem("india-map-origin", JSON.stringify(origin));
    if (Number.isInteger(i)) setSelectedDay(i);
    setMapDay(i);
    setTab("map");
    const url = new URL(location.href);
    url.searchParams.set("view", "map");
    if (Number.isInteger(i))
      url.searchParams.set("day", String(i + 1).padStart(2, "0"));
    else url.searchParams.delete("day");
    history.pushState({ view: "map", day: i }, "", url);
  };
  const returnFromMap = () => {
    if (history.state?.view === "map" && navigationOriginRef.current) {
      history.back();
    } else {
      const url = new URL(location.href);
      url.searchParams.delete("view");
      url.searchParams.delete("day");
      history.replaceState({}, "", url);
      restoreNavigationOrigin(navigationOriginRef.current);
    }
  };
  const activityItems = useMemo(
    () =>
      posts
        .flatMap((post) => [
          {
            id: `post-${post.id}`,
            kind: "post",
            author: post.author_name,
            text: `Nuovo ricordo · ${days[post.day_index]?.city || "India"}`,
            createdAt: post.created_at,
            dayIndex: Number(post.day_index) || 0,
          },
          ...(post.comments || []).map((comment) => ({
            id: `comment-${comment.id}`,
            kind: "comment",
            author: comment.author_name,
            text: `Nuovo commento · ${comment.text || "Allegato"}`,
            createdAt: comment.created_at,
            dayIndex: Number(post.day_index) || 0,
          })),
        ])
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [posts],
  );
  const unreadActivityCount = activityItems.filter(
    (item) => !lastActivityRead || item.createdAt > lastActivityRead,
  ).length;
  const toggleActivityPanel = () => {
    const opening = !notificationOpen;
    setNotificationOpen(opening);
    setQuickProfileOpen(false);
    if (opening) {
      const readAt = new Date().toISOString();
      setLastActivityRead(readAt);
      localStorage.setItem("india-activity-read", readAt);
    }
  };
  return (
    <div className="app">
      <header className={`hero ${tab === "diary" ? "heroFeed" : ""}`}>
        <div className="heroShade" />
        <div className="top">
          <img className="flag" src="/cities/india-flag-real.png" alt="Bandiera dell’India" />
          <span className="versionBadge">REV {VERSION}</span>
          <button
            className={`accessPill ${effectiveSessionToken ? "unlocked" : ""}`}
            onClick={() => {
              setQuickProfileOpen(!quickProfileOpen);
              setNotificationOpen(false);
            }}
          >
            <CircleUserRound size={15} />
            {effectiveSessionToken
              ? currentProfile?.name || "Profilo"
              : sessionCheckPending
                ? "Verifica…"
              : "Pubblico"}
          </button>
          <button
            className="headerIcon"
            aria-label="Attività recenti"
            onClick={toggleActivityPanel}
          >
            <Bell size={18} />
            {unreadActivityCount > 0 && (
              <span className="notificationBadge">
                {Math.min(unreadActivityCount, 9)}
              </span>
            )}
          </button>
        </div>
        {tab === "diary" && (
          <>
          <div className="heroTravelers">
            <button
              type="button"
              className="heroTravelersMain"
              onClick={() => setTravelersOpen(true)}
              aria-label={`Apri elenco viaggiatori, ${people.length} persone`}
            >
              <img src={TRAVELER_ICON} alt="" aria-hidden="true" />
              <span><b>Viaggiatori</b><small>{people.length}</small></span>
            </button>
            <button
              type="button"
              className="heroTravelersMapButton"
              onClick={() => setTravelerOriginsOpen(true)}
              aria-label="Apri la cartina di provenienza dei viaggiatori"
            >+</button>
          </div>
          <img className="heroWeRoadLogo" src="/ui/weroad-logo.png" alt="WEROAD" />
          </>
        )}
        {notificationOpen && (
          <div className="notificationPanel">
            <div>
              <b>Attività recenti</b>
              <button
                aria-label="Chiudi notifiche"
                onClick={() => setNotificationOpen(false)}
              >
                ×
              </button>
            </div>
            <small className="notificationKind">Avvisi nell’app</small>
            {activityItems.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedDay(item.dayIndex);
                  setTab("diary");
                  setNotificationOpen(false);
                }}
              >
                <span className="avatar">
                  {item.author?.[0]?.toUpperCase() || "I"}
                </span>
                <span>
                  <b>{item.author}</b>
                  <small>{item.text}</small>
                </span>
              </button>
            ))}
            {!activityItems.length && <small>Nessuna nuova attività.</small>}
          </div>
        )}
        {quickProfileOpen && (
          <div className="quickProfilePanel">
            <div className="quickProfileHead">
              <span className="avatar">
                {currentProfile?.name?.[0]?.toUpperCase() || "?"}
              </span>
              <div>
                <b>
                  {currentProfile
                    ? `${currentProfile.name} ${currentProfile.surname || ""}`.trim()
                    : "Scegli il tuo profilo"}
                </b>
                <small>
                  {verifiedSessionToken
                    ? "Accesso personale attivo"
                    : sessionCheckPending
                      ? "Verifica accesso personale…"
                    : effectiveGroupCode
                      ? "Password verificata · profilo non collegato"
                      : "Accesso pubblico"}
                </small>
              </div>
              <button
                aria-label="Chiudi pannello personale"
                onClick={() => setQuickProfileOpen(false)}
              >
                ×
              </button>
            </div>
            {sessionCheckPending ? (
              <div className="personalAccessRequired" role="status">
                <CircleUserRound />
                <div>
                  <b>Verifico l’accesso personale…</b>
                  <small>I comandi privati restano bloccati fino alla conferma del server.</small>
                </div>
              </div>
            ) : !effectiveGroupCode && !verifiedSessionToken ? (
              <UnlockCard
                code={accessCode}
                setCode={setAccessCode}
                onUnlock={() => verifyGroupCode(accessCode, setGroupCode)}
                text="La password è comune a tutti i viaggiatori."
              />
            ) : effectiveGroupCode && !verifiedSessionToken ? (
              <div className="bootstrapCoordinator travelerRegistration">
                <b>Entra nel gruppo</b>
                <small>
                  Inserisci i tuoi dati, scegli il ruolo e collega questo telefono.
                </small>
                <div className="roleChoice" role="group" aria-label="Scegli il ruolo">
                  <button
                    type="button"
                    className={bootstrapForm.role === "traveler" ? "active" : ""}
                    aria-pressed={bootstrapForm.role === "traveler"}
                    onClick={() => setBootstrapForm({ ...bootstrapForm, role: "traveler" })}
                  >
                    <span>Viaggiatore</span>
                    {bootstrapForm.role === "traveler" && <Check aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className={bootstrapForm.role === "coordinator" ? "active" : ""}
                    aria-pressed={bootstrapForm.role === "coordinator"}
                    onClick={() => setBootstrapForm({ ...bootstrapForm, role: "coordinator" })}
                  >
                    <span>Coordinatore</span>
                    {bootstrapForm.role === "coordinator" && <Check aria-hidden="true" />}
                  </button>
                </div>
                <input
                  placeholder="Nome *"
                  value={bootstrapForm.name}
                  onChange={(event) => setBootstrapForm({ ...bootstrapForm, name: event.target.value })}
                />
                <input
                  placeholder="Cognome"
                  value={bootstrapForm.surname}
                  onChange={(event) => setBootstrapForm({ ...bootstrapForm, surname: event.target.value })}
                />
                <input
                  placeholder="Da dove vieni"
                  value={bootstrapForm.origin_city}
                  onChange={(event) => setBootstrapForm({ ...bootstrapForm, origin_city: event.target.value })}
                />
                <label className="genderSelect">
                  Genere (facoltativo)
                  <select value={bootstrapForm.gender} onChange={(event) => setBootstrapForm({ ...bootstrapForm, gender: event.target.value })}>
                    <option value="">Preferisco non indicarlo</option><option value="female">Donna</option><option value="male">Uomo</option>
                  </select>
                </label>
                <label className="privacyConsent">
                  <input
                    type="checkbox"
                    checked={bootstrapForm.privacy_consent}
                    onChange={(event) => setBootstrapForm({ ...bootstrapForm, privacy_consent: event.target.checked })}
                  />
                  <span>
                    Accetto l’uso dei miei dati per il viaggio. Documenti e posizione restano nell’area privata.
                  </span>
                </label>
                <button onClick={registerTraveler} disabled={travelerRegisterBusy}>
                  <CircleUserRound /> {travelerRegisterBusy ? "Collegamento…" : "Crea profilo e accedi"}
                </button>
                <small>La scelta resta memorizzata su questo dispositivo.</small>
              </div>
            ) : currentProfile && verifiedSessionToken ? (
              <div className="quickProfileActions">
                <button onClick={quickShareLocation}>
                  <MapPin /> Condividi posizione
                </button>
                <button onClick={quickRemoveLocation}>Cancella posizione</button>
                <button
                  onClick={() => {
                    setVaultProfileId(currentProfile.id);
                    setTab("vault");
                    setQuickProfileOpen(false);
                  }}
                >
                  <ShieldCheck />
                  {currentProfile.role === "coordinator"
                    ? "Griglia coordinatore"
                    : "Documenti e sicurezza"}
                </button>
              </div>
            ) : (
              <div className="profileChooser personalLinkRequired">
                <b>Telefono non collegato a un profilo</b>
                <small>
                  Torna all’accesso, inserisci la password comune e crea il tuo profilo.
                </small>
                <button
                  className="chooseProfileButton"
                  onClick={() => {
                    setTab("people");
                    setQuickProfileOpen(false);
                  }}
                >
                  Vedi il gruppo
                </button>
              </div>
            )}
            {quickStatus && <small className="quickStatus">{quickStatus}</small>}
          </div>
        )}
        <div className="heroCopy">
          <p>10 — 23 AGOSTO 2026</p>
          <h1>
            Un diario vivo,
            <br />
            dal Rajasthan al Gange.
          </h1>
          <button
            className="heroRoute"
            onClick={() => {
              showMap(null);
            }}
          >
            <MapPinned /> Apri la mappa reale del viaggio
          </button>
        </div>
      </header>
      <nav className="tabs">
        {[
          ["diary", House, "Bacheca"],
          ["roadmap", Route, "Viaggio"],
          ["publish", Plus, "Pubblica"],
          ["map", MapPinned, "Mappa"],
          ["people", Users, "Gruppo"],
        ].map(([id, I, label]) => (
          <button
            key={id}
            className={`${tab === id ? "active" : ""} ${id === "publish" ? "publishNav" : ""}`}
            aria-current={tab === id && id !== "publish" ? "page" : undefined}
            onClick={() => {
              setQuickProfileOpen(false);
              setNotificationOpen(false);
              if (id === "publish") {
                openComposer(todayTripIndex >= 0 ? todayTripIndex : -1);
              } else {
                if (id === "map") showMap(null);
                else if (id === "people" && !verifiedSessionToken) {
                  setQuickProfileOpen(true);
                  setNotificationOpen(false);
                  setTab("people");
                }
                else setTab(id);
              }
            }}
          >
            <I size={20} />
            <small>{label}</small>
          </button>
        ))}
      </nav>
      <main>
        {tab === "roadmap" && (
          <section>
            <div className="sectionHead">
              <div>
                <span className="eyebrow">DIARIO DI BORDO</span>
                <h2>La storia, giorno per giorno</h2>
              </div>
            </div>
            <div className="diaryNavigator">
              <button
                aria-label="Giorno precedente"
                disabled={open === 0}
                onClick={() => setOpen(Math.max(0, open - 1))}
              >
                <ChevronDown className="diaryArrow previous" aria-hidden="true" />
              </button>
              <div>
                <small>SCEGLI LA GIORNATA</small>
                <b>
                  Giorno {open + 1} di {days.length} · {days[open]?.city}
                </b>
              </div>
              <button
                aria-label="Giorno successivo"
                disabled={open === days.length - 1}
                onClick={() => setOpen(Math.min(days.length - 1, open + 1))}
              >
                <ChevronDown className="diaryArrow next" aria-hidden="true" />
              </button>
            </div>
            <div className="diaryDayPicker" aria-label="Seleziona la giornata">
              {days.map((day, index) => (
                (() => {
                  const forecast = weatherByDate[`${tripDateKeys[index]}:${day.city}`];
                  return (
                <button
                  key={index}
                  className={`${open === index ? "active" : ""} ${todayTripIndex === index ? "today" : ""}`.trim()}
                  aria-pressed={open === index}
                  aria-label={`${todayTripIndex === index ? "Oggi, " : ""}Giorno ${index + 1}, ${day.date}, ${day.city}`}
                  onClick={(event) => {
                    setOpen(index);
                    event.currentTarget.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                      inline: "center",
                    });
                  }}
                >
                  <b>Giorno {index + 1}</b>
                  <span>{day.date.replace(" AGOSTO", " AGO")}</span>
                  <small>{day.city}</small>
                  {forecast && (
                    <em className="dayPickerWeather" title={forecast.description}>
                      <span aria-hidden="true">{weatherIcon(forecast.description)}</span>{" "}
                      {forecast.max}°/{forecast.min}°
                    </em>
                  )}
                  {day.birthdays?.length > 0 && (
                    <i className="birthdayPickerDot" title="Compleanno in viaggio" aria-label="Compleanno in viaggio">
                      <img src="/ui/birthday-party-we-road-v1.jpg" alt="" />
                    </i>
                  )}
                  {todayTripIndex === index && (
                    <i className="todayDot" title="Oggi" aria-hidden="true" />
                  )}
                </button>
                  );
                })()
              ))}
            </div>
            <div className="dayList">
              {days.map((d, i) => (
                (() => {
                  const forecast = weatherByDate[`${tripDateKeys[i]}:${d.city}`];
                  const solar = solarTimesForDay(tripDateKeys[i], d.city, forecast);
                  const facts = cityFacts[d.city];
                  return (
                <article
                  id={`day-${i + 1}`}
                  className={`day ${open === i ? "open" : ""}`}
                  key={i}
                >
                  <button
                    className="dayHero"
                    onClick={() => setOpen(i)}
                  >
                    <img
                      src={cityImages[d.city]}
                      alt={`Vista di ${d.city}`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/cities/delhi.jpg";
                      }}
                    />
                    <span className="dayNo">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <small>
                        {d.date} · {d.city}
                      </small>
                      <h3>{d.title}</h3>
                      <span className="travelMini">
                        {d.transport} · {d.km} km
                      </span>
                      <span className="dayWeatherLine" title={forecast?.description || "Ora locale India"}>
                        {forecast ? `${forecast.max}°/${forecast.min}° · ${conciseWeather(forecast.description)}${Number.isFinite(forecast.rain_probability) ? ` ${forecast.rain_probability}%` : ""} · ` : ""}
                        Ora India {indiaTime}
                      </span>
                    </div>
                    <ChevronDown className={open === i ? "rot" : ""} />
                  </button>
                  {d.birthdays?.length > 0 && (
                    <div
                      className="dayBirthdayRibbon"
                      aria-label={`Compleanni del ${d.date}: ${d.birthdays.map((birthday) => `${birthday.name}, ${birthday.age} anni`).join("; ")}`}
                    >
                      <div className="birthdayPartyVisual">
                        <img
                          className="birthdayPartyScene"
                          src="/ui/birthday-party-we-road-v1.jpg"
                          alt="Gruppo di viaggiatori WEROAD in festa in India"
                          loading="lazy"
                        />
                      </div>
                      <div className="birthdayRibbonCopy">
                        <span className="birthdayCake" aria-hidden="true">🎉</span>
                        <div>
                          <small>IL GRUPPO FESTEGGIA IN INDIA</small>
                          <b>{d.birthdays.map((birthday) => `${birthday.name} · ${birthday.age} anni`).join("  •  ")}</b>
                        </div>
                        <span className="birthdayTravelers" aria-hidden="true">
                          {d.birthdays.map((birthday) => {
                            const profile = birthdayProfile(people, birthday.name);
                            return profile?.avatar_url ? (
                              <img key={birthday.name} src={profile.avatar_url} alt="" />
                            ) : (
                              <i key={birthday.name}>{birthday.name[0]}</i>
                            );
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  {facts && (
                    <button
                      type="button"
                      className="cityInfoButton"
                      aria-label={`Scopri ${d.city}`}
                      onClick={() => setCityPanel(i)}
                    >
                      <span aria-hidden="true">+</span>
                    </button>
                  )}
                  {open === i && (
                    <div className="dayBody">
                      <div className="storyLabel">DIARIO DI BORDO</div>
                      <p>{d.story}</p>
                      <section className="dayClimateCard" aria-label={`Meteo, alba e tramonto a ${d.city}`}>
                        <div className="climateWeather">
                          <span className="climateSymbol" aria-hidden="true">{weatherIcon(forecast?.description)}</span>
                          <div>
                            <small>METEO</small>
                            <b>{forecast ? `${forecast.max}° / ${forecast.min}°` : "In aggiornamento"}</b>
                            {Number.isFinite(forecast?.relative_humidity) && (
                              <span>Umidità media {forecast.relative_humidity}%</span>
                            )}
                          </div>
                        </div>
                        <div className="solarTime">
                          <img src="/ui/sunrise.png" alt="" aria-hidden="true" />
                          <div><small>ALBA</small><b>{solar.sunrise}</b></div>
                        </div>
                        <div className="solarTime">
                          <img src="/ui/sunset.png" alt="" aria-hidden="true" />
                          <div><small>TRAMONTO</small><b>{solar.sunset}</b></div>
                        </div>
                      </section>
                      {d.hotel && (
                        <div className="lodgingCard">
                          <span aria-hidden="true">🏨</span>
                          <div>
                            <small>{d.hotel.label || `ALLOGGIO A ${d.city.toUpperCase()}`}</small>
                            <b>{d.hotel.name}</b>
                            <span>{d.hotel.address}</span>
                            {d.hotel.contact && <span className="hotelContact">☎ {d.hotel.contact}</span>}
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.hotel.address)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Apri
                          </a>
                        </div>
                      )}
                      {d.overnight && (
                        <div className="overnightCard">
                          <span aria-hidden="true">🚆</span>
                          <div>
                            <small>PERNOTTAMENTO</small>
                            <b>{d.overnight}</b>
                          </div>
                        </div>
                      )}
                      {d.transport.includes("Aereo") && (
                        <details className="flightBaggageCard">
                          <summary><span aria-hidden="true">✈️</span><div><small>VOLO INTERNO INDIGO</small><b>Misure e peso dei bagagli</b></div><strong>+</strong></summary>
                          <div className="flightBaggageBody">
                            <section><b>Bagaglio a mano</b><span>55 x 35 x 25 cm</span><small>Ruote e maniglie incluse</small></section>
                            <section><b>Peso in cabina</b><span>7 kg</span><small>Fino a 8 kg soltanto se previsto dalla tariffa</small></section>
                            <section><b>Oggetto personale</b><span>1 piccolo accessorio</span><small>Borsa, PC o zainetto da riporre sotto il sedile</small></section>
                            <section><b>Bagaglio da stiva</b><span>158 cm totali - 15 kg</span><small>Somma delle tre dimensioni; verificare sempre la franchigia sul biglietto</small></section>
                          </div>
                        </details>
                      )}
                      <div className="journeyCard">
                        <span className="transportIcon">
                          {d.transport.includes("Aereo")
                            ? "✈️"
                            : d.transport.includes("Treno")
                              ? "🚆"
                              : d.transport.includes("Barca")
                                ? "⛵"
                                : "🚐"}
                        </span>
                        <div>
                          <small>
                            {d.from}
                            {d.via ? ` → ${d.via}` : ""} → {d.to}
                          </small>
                          <b>
                            {d.km} km · {d.time}
                          </b>
                          <span>{d.transport}</span>
                        </div>
                        <button
                          onClick={() => showMap(i)}
                          aria-label="Vedi questa tappa sulla mappa"
                        >
                          <MapPinned />
                        </button>
                      </div>
                      <div className="objective">
                        <b>Obiettivo del giorno</b>
                        <span>{d.goal}</span>
                      </div>
                      <div className="diaryMiniMap">
                        <div className="miniMapTitle">
                          <div>
                            <small>PERCORSO DELLA GIORNATA</small>
                            <b>
                              {d.from} → {d.to}
                            </b>
                          </div>
                          <button onClick={() => showMap(i)}>
                            Apri mappa completa
                          </button>
                        </div>
                        <TripMap selectedDay={i} onSelect={() => showMap(i)} />
                      </div>
                      <div className="checks">
                        {d.checks.map((x, j) => {
                          const k = `${i}-${j}`;
                          return (
                            <label key={k} className={done[k] ? "checked" : ""}>
                              <input
                                type="checkbox"
                                checked={!!done[k]}
                                onChange={(e) =>
                                  setDone({ ...done, [k]: e.target.checked })
                                }
                              />
                              <span>{done[k] ? <Check /> : null}</span>
                              {x}
                            </label>
                          );
                        })}
                      </div>
                      <div className="dayActions">
                        <button onClick={() => showMap(i)}>
                          <MapPinned /> Percorso
                        </button>
                        <button
                          onClick={() => {
                            openComposer(i);
                          }}
                        >
                          <Camera /> Aggiungi ricordo
                        </button>
                      </div>
                      <div className="diaryPager">
                        <button
                          disabled={i === 0}
                          onClick={() => setOpen(Math.max(0, i - 1))}
                        >
                          ← Giorno precedente
                        </button>
                        <button
                          disabled={i === days.length - 1}
                          onClick={() => setOpen(Math.min(days.length - 1, i + 1))}
                        >
                          Giorno successivo →
                        </button>
                      </div>
                    </div>
                  )}
                </article>
                  );
                })()
              ))}
            </div>
            {cityPanel !== null && cityFacts[days[cityPanel]?.city] && (() => {
              const city = days[cityPanel].city;
              const facts = cityFacts[city];
              return (
                <div className="citySheetBackdrop" role="presentation" onClick={() => setCityPanel(null)}>
                  <section className="citySheet" role="dialog" aria-modal="true" aria-label={`Conosci ${city}`} onClick={(event) => event.stopPropagation()}>
                    <header>
                      <img src={cityImages[city]} alt={`Panorama di ${city}`} />
                      <button type="button" onClick={() => setCityPanel(null)} aria-label="Chiudi informazioni citta">X</button>
                      <div><small>CONOSCIAMO LA TAPPA</small><h2>{city}</h2></div>
                    </header>
                    <div className="citySheetBody">
                      <p className="cityLead">{facts.description}</p>
                      <dl>
                        <div><dt>Abitanti</dt><dd>{facts.population}</dd></div>
                        <div><dt>Superficie</dt><dd>{facts.area}</dd></div>
                        <div><dt>Altitudine</dt><dd>{facts.altitude}</dd></div>
                        <div><dt>Lingue diffuse</dt><dd>{facts.languages}</dd></div>
                      </dl>
                      <article><small>UNA CITTA, NON SOLO UNA TAPPA</small><p>{facts.identity}</p></article>
                      <article><small>COSA LA RENDE SPECIALE</small><p>{facts.knownFor}</p></article>
                      <footer>{facts.scope} - dati indicativi da fonti pubbliche indiane</footer>
                    </div>
                  </section>
                </div>
              );
            })()}
          </section>
        )}
        {tab === "map" && (
          <MapSection
            selectedDay={mapDay}
            setSelectedDay={setMapDay}
            currentDayIndex={todayTripIndex}
            onBack={returnFromMap}
          />
        )}{" "}
        {tab === "diary" && (
          <Diary
            posts={posts}
            people={people}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            groupCode={effectiveGroupCode}
            sessionToken={effectiveSessionToken}
            setGroupCode={setGroupCode}
            refresh={refresh}
            composeOpen={composeOpen}
            setComposeOpen={setComposeOpen}
            deviceProfileName={
              currentProfile
                && effectiveSessionToken
                ? `${currentProfile.name} ${currentProfile.surname || ""}`.trim()
                : ""
            }
            deviceProfileId={currentProfile?.id || ""}
            onManageProfiles={() => {
              setTab("people");
              setComposeOpen(false);
            }}
            onGroupUnlocked={() => {
              setComposeOpen(false);
              setQuickProfileOpen(true);
              setNotificationOpen(false);
            }}
            onSessionInvalid={() => {
              localStorage.removeItem("india-session-token");
              localStorage.removeItem("india-profile-id");
              localStorage.removeItem("india-visitor-name");
              localStorage.removeItem("india-role");
              localStorage.removeItem("india-guest-token");
              localStorage.removeItem("india-guest-name");
              localStorage.removeItem("india-visitor-id");
              setSessionToken("");
              setSessionProfile(null);
            }}
            directoryOpen={travelersOpen}
            setDirectoryOpen={setTravelersOpen}
            originsOpen={travelerOriginsOpen}
            setOriginsOpen={setTravelerOriginsOpen}
          />
        )}{" "}
        {tab === "people" && verifiedSessionToken && (
          <People
            people={people}
            groupCode={effectiveGroupCode}
            sessionToken={effectiveSessionToken}
            sessionProfile={sessionProfile}
            setGroupCode={setGroupCode}
            refresh={refresh}
            onOpenPrivate={(profileId) => {
              setVaultProfileId(profileId);
              setTab("vault");
            }}
          />
        )}{" "}
        {tab === "people" && !verifiedSessionToken && (
          <section className="privateGroupGate" aria-label="Accesso privato richiesto">
            <LockKeyhole aria-hidden="true" />
            <h2>Gruppo privato</h2>
            <p>Inserisci la password per vedere il gruppo e collegare il tuo profilo.</p>
            <button
              type="button"
              onClick={() => {
                setQuickProfileOpen(true);
              }}
            >
              Accedi
            </button>
          </section>
        )}{" "}
        {tab === "vault" && (
          <VaultOnline
            people={people}
            groupCode={effectiveGroupCode}
            sessionToken={effectiveSessionToken}
            setSessionToken={setSessionToken}
            setGroupCode={setGroupCode}
            onOpenGroup={() => setTab("people")}
            preferredProfileId={vaultProfileId}
          />
        )}
      </main>
    </div>
  );
}

function MapSection({ selectedDay, setSelectedDay, currentDayIndex, onBack }) {
  const d = selectedDay == null ? null : days[selectedDay];
  const mapShellRef = useRef(null);
  const positionedDayRef = useRef(Symbol("not-positioned"));
  const placeMapInUsableViewport = () => {
    const shell = mapShellRef.current;
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const navHeight =
      document.querySelector(".tabs")?.getBoundingClientRect().height || 0;
    const usableBottom = viewportHeight - navHeight - 10;
    const desiredTop = Math.max(96, (usableBottom - rect.height) / 2);
    const target = Math.max(0, window.scrollY + rect.top - desiredTop);
    window.scrollTo({ top: target, behavior: "smooth" });
  };
  const focusMap = (dayIndex) => {
    positionedDayRef.current = Symbol("not-positioned");
    setSelectedDay(dayIndex);
    const url = new URL(location.href);
    url.searchParams.set("view", "map");
    if (dayIndex == null) url.searchParams.delete("day");
    else url.searchParams.set("day", String(dayIndex + 1).padStart(2, "0"));
    history.replaceState({ view: "map", day: dayIndex }, "", url);
  };
  const positionMapOnce = () => {
    if (positionedDayRef.current === selectedDay) return;
    positionedDayRef.current = selectedDay;
    placeMapInUsableViewport();
  };
  return (
    <section className="mapSection">
      {onBack && (
        <button className="mapBack" onClick={onBack}>
          ← Torna alla Bacheca{selectedDay != null ? ` · Giorno ${selectedDay + 1}` : ""}
        </button>
      )}
      <div className="mapHeading">
        <div>
          <span className="eyebrow">CARTINA REALE DELL’INDIA</span>
          <h2>{d ? `${d.from} → ${d.to}` : "Tutto l’itinerario"}</h2>
        </div>
        {d && <button onClick={() => focusMap(null)}>Vedi tutto</button>}
      </div>
      {d && (
        <div className="mapTrip mapTripOutside">
          <span>
            {d.transport.includes("Aereo")
              ? "✈️"
              : d.transport.includes("Treno")
                ? "🚆"
                : "🚐"}
          </span>
          <div>
            <em>Giorno {selectedDay + 1}</em>
            <b>{d.transport}</b>
            <small>
              {d.km} km · {d.time}
            </small>
          </div>
        </div>
      )}
      <div className="mapShell" ref={mapShellRef}>
        <TripMap
          selectedDay={selectedDay}
          currentDayIndex={currentDayIndex}
          onSelect={focusMap}
          onReady={positionMapOnce}
        />
      </div>
      <div className="routeChips">
        {days.map((x, i) => (
          <button
            key={i}
            className={selectedDay === i ? "active" : ""}
            onClick={() => focusMap(i)}
          >
            <b>{i + 1}</b>
            <span>{x.city}</span>
            <small>
              {x.transport} · {x.km} km
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}

function Diary({
  posts,
  people,
  selectedDay,
  setSelectedDay,
  groupCode,
  sessionToken,
  setGroupCode,
  refresh,
  composeOpen,
  setComposeOpen,
  deviceProfileName,
  deviceProfileId,
  onManageProfiles,
  onGroupUnlocked,
  onSessionInvalid,
  directoryOpen,
  setDirectoryOpen,
  originsOpen,
  setOriginsOpen,
}) {
  const locationRequestRef = useRef(0);
  const postOperationRef = useRef("");
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const today = new Date(clock);
  const tripStart = new Date("2026-08-10T00:00:00+05:30");
  const departure = new Date("2026-08-10T18:00:00+02:00");
  const remainingToDeparture = Math.max(0, departure.getTime() - clock);
  const countdownDays = Math.floor(remainingToDeparture / 86400000);
  const countdownHours = Math.floor((remainingToDeparture % 86400000) / 3600000);
  const countdownMinutes = Math.floor((remainingToDeparture % 3600000) / 60000);
  const countdownSeconds = Math.floor((remainingToDeparture % 60000) / 1000);
  const countdownLabel = `${countdownDays}g ${countdownHours}h ${countdownMinutes}m ${countdownSeconds}s`;
  const liveIndex = Math.max(
    0,
    Math.min(13, Math.floor((today - tripStart) / 86400000)),
  );
  const liveDay = days[liveIndex];
  const [text, setText] = useState(
      () => localStorage.getItem("india-draft") || "",
    ),
    [files, setFiles] = useState([]),
    [author, setAuthor] = useState(
      () => localStorage.getItem("india-visitor-name") || "",
    ),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [fileStatus, setFileStatus] = useState(""),
    [publishNotice, setPublishNotice] = useState(""),
    [feedFilter, setFeedFilter] = useState("all"),
    [placeName, setPlaceName] = useState(""),
    [postCoordinates, setPostCoordinates] = useState(null),
    [locatingPost, setLocatingPost] = useState(false),
    [placeResults, setPlaceResults] = useState([]),
    [placeSearching, setPlaceSearching] = useState(false);
  const [postVisibility, setPostVisibility] = useState("public");
  const publicationStep = publicationAccessStep({ sessionToken, groupCode });
  const [editingName, setEditingName] = useState(
    () => !localStorage.getItem("india-visitor-name"),
  );
  useEffect(() => {
    if (author) localStorage.setItem("india-visitor-name", author);
  }, [author]);
  useEffect(() => {
    if (!deviceProfileName) return;
    setAuthor(deviceProfileName);
    setEditingName(false);
    localStorage.setItem("india-visitor-name", deviceProfileName);
  }, [deviceProfileName]);
  useEffect(() => localStorage.setItem("india-draft", text), [text]);
  useEffect(() => {
    if (!publishNotice) return undefined;
    const timer = setTimeout(() => setPublishNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [publishNotice]);
  useEffect(() => {
    const query = placeName.trim();
    if (postCoordinates || query.length < 3) {
      setPlaceResults([]);
      setPlaceSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPlaceSearching(true);
      try {
        const response = await fetch(
          `${API}/places/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const result = await response.json();
        setPlaceResults(result.places || []);
      } catch (error) {
        if (error.name !== "AbortError") setPlaceResults([]);
      } finally {
        setPlaceSearching(false);
      }
    }, 550);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [placeName, postCoordinates]);
  const addFiles = async (incoming) => {
    const sourceFiles = Array.from(incoming || []);
    if (!sourceFiles.length) return;
    const invalidFile = sourceFiles
      .map((file) => validateMediaSelection(file))
      .find(Boolean);
    if (invalidFile) {
      setFileStatus(invalidFile);
      return;
    }
    if (sourceFiles.some((file) => /\.(heic|heif)$/i.test(file.name || "")))
      setFileStatus("Converto la foto iPhone per renderla visibile a tutti…");
    let selected;
    try {
      selected = await Promise.all(sourceFiles.map(normalizeMobileUpload));
    } catch {
      setFileStatus(
        "La foto HEIC non è stata convertita. Sul telefono scegli JPG/Alta compatibilità e riprova.",
      );
      return;
    }
    setFiles((current) => {
      const total = current.length + selected.length;
      if (total > 10) {
        setFileStatus(
          `Puoi caricare massimo 10 contenuti per ogni post. Hai selezionato ${total} elementi. Rimuovine ${total - 10} per continuare.`,
        );
        return current;
      }
      setFileStatus("");
      return [...current, ...selected];
    });
  };
  const visiblePosts = posts.filter((p) => {
    if (feedFilter === "all") return true;
    if (feedFilter === "before") return Number(p.day_index) < 0;
    if (feedFilter === "today") return Number(p.day_index) === liveIndex;
    const mediaTypes = (p.media?.length ? p.media : [p])
      .map((media) => media.media_type)
      .filter(Boolean);
    if (feedFilter === "text") return mediaTypes.length === 0 && Boolean(p.text);
    if (feedFilter === "mixed")
      return new Set(mediaTypes.map((type) => type.split("/")[0])).size > 1;
    return mediaTypes.some((type) => type.startsWith(feedFilter));
  });
  const add = async () => {
    if (!sessionToken || (!text.trim() && !files.length)) return;
    setBusy(true);
    setFileStatus("Pubblicazione in corso…");
    let pendingForm;
    try {
      const f = new FormData();
      f.set("author_name", author || "Viaggiatore");
      f.set("profile_id", deviceProfileId || "");
      f.set("day_index", selectedDay);
      f.set("text", text);
      f.set("visibility", postVisibility);
      f.set("place_name", placeName);
      if (postCoordinates) {
        f.set("latitude", String(postCoordinates.latitude));
        f.set("longitude", String(postCoordinates.longitude));
      }
      pendingForm = new FormData();
      for (const [key, value] of f.entries()) pendingForm.append(key, value);
      files.forEach((file) => pendingForm.append("files", file));
      const uploadedIds = [];
      for (const file of files) {
        if (navigator.onLine && shouldUseResumableUpload(file)) {
          setFileStatus(`Caricamento protetto di ${file.name}: 0%`);
          const uploaded = await uploadFileResumable({
            api: API,
            file,
            scope: "post",
            visibility: postVisibility,
            headers: sessionHeaders(sessionToken),
            onProgress: (progress) => setFileStatus(`Caricamento protetto di ${file.name}: ${progress}%`),
          });
          uploadedIds.push(uploaded.upload_id);
        } else f.append("files", file);
      }
      f.set("upload_ids", JSON.stringify(uploadedIds));
      if (!postOperationRef.current)
        postOperationRef.current = crypto.randomUUID();
      const r = await fetch(`${API}/posts`, {
        method: "POST",
        headers: {
          ...sessionHeaders(sessionToken),
          "x-idempotency-key": postOperationRef.current,
        },
        body: f,
      });
      const j = await r.json();
      if (!r.ok) {
        if (r.status === 401) {
          onSessionInvalid?.();
          throw Error(
            "La sessione è scaduta. Bozza e allegati sono conservati: riapri il tuo invito personale.",
          );
        }
        throw Error(j.error || "Pubblicazione non riuscita. Riprova.");
      }
      setText("");
      localStorage.removeItem("india-draft");
      setFiles([]);
      setPlaceName("");
      setPostCoordinates(null);
      setPlaceResults([]);
      setPostVisibility("public");
      postOperationRef.current = "";
      setFileStatus("");
      await refresh();
      setComposeOpen(false);
      setPublishNotice("Pubblicazione riuscita.");
    } catch (e) {
      if (pendingForm && (!navigator.onLine || e instanceof TypeError)) {
        try {
          await queueFormRequest({
            id: `post:${postOperationRef.current}`,
            endpoint: `${API}/posts`,
            form: pendingForm,
            authType: "session",
            operationKey: postOperationRef.current,
          });
          setText("");
          setFiles([]);
          setPlaceName("");
          setPostCoordinates(null);
          const offlineMessage = "Salvato nel telefono. Sarà pubblicato automaticamente quando torna la rete.";
          setFileStatus(offlineMessage);
          setPublishNotice(offlineMessage);
          postOperationRef.current = "";
          setComposeOpen(false);
        } catch {
          setFileStatus("Connessione assente e salvataggio offline non disponibile.");
        }
      } else setFileStatus(e.message || "Pubblicazione non riuscita.");
    } finally {
      setBusy(false);
    }
  };
  const clearPostLocation = () => {
    locationRequestRef.current += 1;
    setPostCoordinates(null);
    setPlaceName("");
    setPlaceResults([]);
    setLocatingPost(false);
    setFileStatus("Posizione rimossa.");
  };
  const capturePostLocation = () => {
    if (!navigator.geolocation) {
      setFileStatus("Posizione non supportata su questo dispositivo.");
      return;
    }
    setLocatingPost(true);
    setFileStatus("Cerco la posizione…");
    const requestId = locationRequestRef.current + 1;
    locationRequestRef.current = requestId;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        try {
          const response = await fetch(
            `${API}/places/reverse?lat=${coordinates.latitude}&lon=${coordinates.longitude}`,
            { cache: "no-store" },
          );
          const result = response.ok ? await response.json() : null;
          if (locationRequestRef.current !== requestId) return;
          const resolvedName = result?.place?.label ||
            `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
          setPostCoordinates(coordinates);
          setPlaceName(resolvedName);
          setFileStatus(`Posizione pronta: ${resolvedName}`);
        } catch {
          if (locationRequestRef.current !== requestId) return;
          const fallback = `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
          setPostCoordinates(coordinates);
          setPlaceName(fallback);
          setFileStatus(`Posizione pronta: ${fallback}`);
        } finally {
          if (locationRequestRef.current === requestId) setLocatingPost(false);
        }
      },
      () => {
        if (locationRequestRef.current !== requestId) return;
        setFileStatus("Posizione non disponibile. Puoi scrivere il luogo manualmente.");
        setLocatingPost(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };
  return (
    <section>
      <div className="socialHeading">
        <div>
          <span className="eyebrow">SOCIAL DEL VIAGGIO</span>
          <h2>Raccontiamocele insieme</h2>
        </div>
      </div>
      <button className="liveStatus" onClick={() => setSelectedDay(liveIndex)}>
        <span className="liveDot" />
        <div>
          <small>
            {today < departure ? `PARTENZA TRA ${countdownLabel}` : "DOVE SIAMO ORA"}
          </small>
          <b>
            {liveDay.city} · Giorno {liveIndex + 1}
          </b>
          <span>{liveDay.title}</span>
          <small className="livePlaceDetail">
            {today < departure
              ? "Preparativi prima della partenza"
              : `${liveDay.city}, India · tappa prevista oggi`}
          </small>
        </div>
        <MapPinned />
      </button>
      {publishNotice && (
        <div className="publishNotice" role="status">
          <Check /> {publishNotice}
        </div>
      )}
      {!deviceProfileName && (!author || editingName) && (
        <div className="visitorBar">
          <div className="avatar">{author?.[0]?.toUpperCase() || "?"}</div>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Inserisci il tuo nome una sola volta"
          />
          <button
            disabled={!author.trim()}
            onClick={() => setEditingName(false)}
          >
            Salva
          </button>
          <small>Rimarrà memorizzato soltanto su questo dispositivo</small>
        </div>
      )}
      <div className="feedFilters" aria-label="Filtri della bacheca">
        {[
          ["all", "Recenti"],
          ["before", "Prima della partenza"],
          ["today", "Oggi"],
          ["image", "Foto"],
          ["video", "Video"],
          ["audio", "Audio"],
          ["mixed", "Misti"],
          ["text", "Solo testo"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={feedFilter === id ? "active" : ""}
            onClick={() => setFeedFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {visiblePosts.length ? (
        visiblePosts.map((p) => (
          <Post
            key={p.id}
            p={p}
            author={author}
            groupCode={groupCode}
            sessionToken={sessionToken}
            people={people}
            refresh={refresh}
          />
        ))
      ) : (
        <Empty
          icon={Camera}
          title="Il diario è pronto"
          text="Il primo ricordo pubblicato apparirà qui per tutti."
        />
      )}
      {composeOpen && (
        <div className="sheetBackdrop" onClick={() => setComposeOpen(false)}>
          <div className="uploadSheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHandle" />
            <div className="sheetTitle">
              <div>
                <small>NUOVO CONTENUTO</small>
                <h3>Che cosa vuoi condividere?</h3>
              </div>
              <button onClick={() => setComposeOpen(false)} aria-label="Chiudi">
                ×
              </button>
            </div>
            {publicationStep === "composer" ? (
              <div className="composer">
                <div className="groupBadge">
                  <LockKeyhole /> Pubblicazione del gruppo
                </div>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                >
                  <option value={-1}>Prima della partenza · Preparativi</option>
                  {days.map((d, i) => (
                    <option value={i} key={i}>
                      Giorno {i + 1} · {d.city}
                    </option>
                  ))}
                </select>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Racconta questo momento…"
                />
                <label className="visibilityPicker">
                  <span>Chi può vederlo</span>
                  <select
                    value={postVisibility}
                    onChange={(event) => setPostVisibility(event.target.value)}
                  >
                    <option value="public">Pubblico · anche chi riceve il link</option>
                      <option value="family">Visitatori identificati · con un nome</option>
                    <option value="group">Solo gruppo · viaggiatori collegati</option>
                    <option value="private">Solo io</option>
                  </select>
                </label>
                <div className="postLocationComposer">
                  <MapPin />
                  <input
                    value={placeName}
                    onChange={(event) => {
                      setPlaceName(event.target.value);
                      setPostCoordinates(null);
                    }}
                    placeholder="Aggiungi luogo (es. Taj Mahal)"
                  />
                  <button type="button" onClick={capturePostLocation} disabled={locatingPost}>
                    {locatingPost ? "Cerco…" : "Usa posizione"}
                  </button>
                  {postCoordinates && (
                    <button
                      type="button"
                      className="clearPostLocation"
                      onClick={clearPostLocation}
                    >
                      Rimuovi
                    </button>
                  )}
                  {(placeSearching || placeResults.length > 0) && (
                    <div className="placeSuggestions">
                      {placeSearching && <small>Cerco luoghi…</small>}
                      {placeResults.map((place) => (
                        <button
                          type="button"
                          key={`${place.latitude}-${place.longitude}-${place.label}`}
                          onClick={() => {
                            setPlaceName(place.label);
                            setPostCoordinates({
                              latitude: place.latitude,
                              longitude: place.longitude,
                            });
                            setPlaceResults([]);
                          }}
                        >
                          <MapPin /> {place.label}
                        </button>
                      ))}
                      <small>Dati dei luoghi: OpenStreetMap</small>
                    </div>
                  )}
                </div>
                <AudioRecorder
                  onRecorded={(recordedFile) => addFiles([recordedFile])}
                />
                <div className="composerActions">
                  <label>
                    <ImageIcon /> Galleria foto
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      multiple
                      onChange={async (e) => {
                        await addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label>
                    <Camera /> Scatta ora
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      capture="environment"
                      onChange={async (e) => {
                        await addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label>
                    <Camera /> Video
                    <input
                      type="file"
                      accept="video/*,.mov,.mp4"
                      multiple
                      onChange={async (e) => {
                        await addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <label>
                    <Mic /> Audio
                    <input
                      type="file"
                      accept="audio/*,.m4a,.aac"
                      multiple
                      onChange={async (e) => {
                        await addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    disabled={busy || (!text.trim() && !files.length)}
                    onClick={add}
                  >
                    <Plus /> {busy ? "Invio…" : "Pubblica"}
                  </button>
                </div>
                {fileStatus && (
                  <small className="uploadStatus" role="status">
                    {fileStatus}
                  </small>
                )}
                {files.length > 0 && (
                  <div className="attachmentPreviews">
                    <b>{files.length} allegati pronti</b>
                    <div>
                      {files.map((file, index) => (
                        <AttachmentPreview
                          key={`${file.name}-${file.lastModified}-${index}`}
                          file={file}
                          onRemove={() =>
                            setFiles((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : publicationStep === "profile-setup" ? (
              <div className="profileChooser composerProfileChooser personalLinkRequired">
                <b>Completa il tuo accesso</b>
                <small>
                  Crea il tuo profilo personale per pubblicare senza ripetere la password.
                </small>
                <button className="chooseProfileButton" onClick={onGroupUnlocked}>
                  Crea il mio profilo
                </button>
              </div>
            ) : (
              <UnlockCard
                code={code}
                setCode={setCode}
                onUnlock={async () => {
                  const unlocked = await verifyGroupCode(code, setGroupCode);
                  if (unlocked) await onGroupUnlocked?.();
                  return unlocked;
                }}
                text="Inserisci la password comune. Subito dopo creerai il tuo profilo personale."
                successText="Password corretta. Ora crea il tuo profilo."
              />
            )}
          </div>
        </div>
      )}
      {directoryOpen && (
        <div className="directoryBackdrop" onClick={() => setDirectoryOpen(false)}>
          <div
            className="travelerDirectory"
            role="dialog"
            aria-modal="true"
            aria-label="Elenco dei viaggiatori"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="directoryHead">
              <div>
                <small>IL NOSTRO GRUPPO</small>
                <h3>Viaggiatori</h3>
              </div>
              <button
                onClick={() => setDirectoryOpen(false)}
                aria-label="Chiudi elenco viaggiatori"
              >
                ×
              </button>
            </div>
            <p>Nei commenti scrivi <b>@</b> e scegli la persona da menzionare.</p>
            <div className="directoryList">
              {sortTravelers(people).map((person) => (
                <div key={person.id} className={`directoryPerson gender-${person.gender || "unspecified"}`}>
                  {person.avatar_url ? (
                    <img src={person.avatar_url} alt="" />
                  ) : (
                    <span className="avatar">{person.name?.[0] || "?"}</span>
                  )}
                  <div className="directoryIdentity">
                    <span className="directoryNameLine">
                      <b>{person.name} {person.surname || ""}</b>
                      <code>@{mentionHandle(person)}</code>
                    </span>
                    <small title={travelerDetails(person)}>
                      <strong className={person.role === "coordinator" ? "coordinatorRole" : undefined}>
                        {travelerRoleLabel(person)}
                      </strong>
                      {travelerDetails(person).slice(travelerRoleLabel(person).length)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {originsOpen && (
        <div className="directoryBackdrop" onClick={() => setOriginsOpen(false)}>
          <section
            className="travelerOriginsSheet"
            role="dialog"
            aria-modal="true"
            aria-label="Da dove arriviamo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="directoryHead">
              <div><small>IL NOSTRO GRUPPO</small><h3>Da dove arriviamo</h3></div>
              <button type="button" onClick={() => setOriginsOpen(false)} aria-label="Chiudi cartina di provenienza">×</button>
            </div>
            <ItalyTravelerMap people={people} />
          </section>
        </div>
      )}
    </section>
  );
}

function AttachmentPreview({ file, onRemove }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return (
    <article>
      {file.type.startsWith("image/") ? (
        <img src={url} alt={`Anteprima ${file.name}`} />
      ) : file.type.startsWith("video/") ? (
        <video src={url} muted playsInline />
      ) : file.type.startsWith("audio/") ? (
        <audio controls preload="metadata" src={url} />
      ) : (
        <Mic />
      )}
      <span>{file.name}</span>
      <small>{(file.size / 1024 / 1024).toFixed(1)} MB</small>
      <button onClick={onRemove} aria-label={`Rimuovi ${file.name}`}>
        ×
      </button>
    </article>
  );
}

function PdfDocumentViewer({ url, bytes, name }) {
  const pagesRef = useRef(null);
  const [status, setStatus] = useState("Caricamento PDF…");
  useEffect(() => {
    let cancelled = false;
    let loadingTask;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        loadingTask = pdfjs.getDocument({
          data: new Uint8Array(bytes.slice(0)),
          isEvalSupported: false,
          useWorkerFetch: false,
        });
        const pdf = await loadingTask.promise;
        const host = pagesRef.current;
        if (!host || cancelled) return;
        host.replaceChildren();
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(260, host.clientWidth - 16);
          const scale = Math.min(2.2, availableWidth / baseViewport.width);
          const viewport = page.getViewport({ scale });
          const outputScale = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
          const canvas = document.createElement("canvas");
          canvas.className = "pdfPageCanvas";
          canvas.width = Math.ceil(viewport.width * outputScale);
          canvas.height = Math.ceil(viewport.height * outputScale);
          canvas.style.width = `${Math.ceil(viewport.width)}px`;
          canvas.style.height = `${Math.ceil(viewport.height)}px`;
          canvas.setAttribute("aria-label", `${name}, pagina ${pageNumber}`);
          host.appendChild(canvas);
          await page.render({
            canvasContext: canvas.getContext("2d"),
            viewport,
            transform: [outputScale, 0, 0, outputScale, 0, 0],
          }).promise;
        }
        if (!cancelled) setStatus("");
      } catch (error) {
        if (!cancelled)
          setStatus(
            error?.name === "PasswordException"
              ? "PDF protetto da password. Aprilo nel lettore PDF del telefono."
              : "Impossibile visualizzare il PDF in questa finestra.",
          );
      }
    })();
    return () => {
      cancelled = true;
      loadingTask?.destroy?.();
    };
  }, [url, bytes, name]);
  return (
    <div className="pdfDocumentViewer">
      {status && <p role="status">{status}</p>}
      <div ref={pagesRef} className="pdfPages" />
      {["Impossibile visualizzare il PDF in questa finestra.", "PDF protetto da password. Aprilo nel lettore PDF del telefono."].includes(status) && (
        <a className="pdfNativeFallback" href={url} target="_blank" rel="noreferrer">
          Apri nel lettore PDF del telefono
        </a>
      )}
    </div>
  );
}

function AudioRecorder({ onRecorded }) {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };
  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      stopTracks();
    },
    [],
  );
  const start = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("La registrazione diretta non è supportata da questo browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const extension = type.includes("mp4")
          ? "m4a"
          : type.includes("ogg")
            ? "ogg"
            : "webm";
        const blob = new Blob(chunksRef.current, { type });
        onRecorded(
          new File([blob], `voce-${new Date().toISOString().slice(0, 19)}.${extension}`, {
            type,
          }),
        );
        stopTracks();
      };
      recorder.start(500);
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch {
      setError("Microfono non disponibile. Controlla il permesso del telefono.");
      stopTracks();
    }
  };
  const stop = () => {
    clearInterval(timerRef.current);
    recorderRef.current?.stop();
    setRecording(false);
    navigator.vibrate?.(30);
  };
  return (
    <div className={`audioRecorder ${recording ? "recording" : ""}`}>
      <Mic />
      <div>
        <b>{recording ? "Registrazione in corso" : "Registra un messaggio audio"}</b>
        <small>
          {recording
            ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
            : "Tocca per iniziare, poi ascoltalo prima di pubblicare"}
        </small>
      </div>
      <button onClick={recording ? stop : start}>
        {recording ? "Ferma" : "Registra"}
      </button>
      {error && <span>{error}</span>}
    </div>
  );
}

function PostMedia({ items }) {
  const visualItems = items.filter(
    (item) => !item.media_type?.startsWith("audio"),
  );
  const audioItems = items.filter((item) =>
    item.media_type?.startsWith("audio"),
  );
  if (!items.length) return null;
  const photoAudio = visualItems.some((item) => item.media_type?.startsWith("image"))
    ? audioItems[0]
    : null;
  const standaloneAudio = photoAudio ? audioItems.slice(1) : audioItems;
  return (
    <div className="postMediaCollection">
      {visualItems.length > 0 && (
        <div className="postMediaCarousel" aria-label="Contenuti: scorri con il dito">
          {visualItems.map((item, index) => (
            <div className="postMediaSlide" key={item.id || item.media_url}>
              {item.media_type?.startsWith("image") && (
                <img src={item.media_url} alt="Ricordo del viaggio" loading="lazy" />
              )}
              {item.media_type?.startsWith("video") && (
                <video controls playsInline preload="metadata" src={item.media_url} />
              )}
              {index === 0 && photoAudio && (
                <div className="photoAudioOverlay">
                  <BackgroundAudio compact src={photoAudio.media_url} title={photoAudio.media_name || "Racconto dalla foto"} />
                </div>
              )}            </div>
          ))}
          {visualItems.length > 1 && (
            <span className="mediaCounter">{visualItems.length} contenuti · scorri</span>
          )}
        </div>
      )}
      {standaloneAudio.map((audioItem, index) => (
        <div className="audioCard" key={audioItem.id || audioItem.media_url}>
          <Mic />
          <div>
            <b>{audioItem.media_name || `Messaggio vocale ${index + 1}`}</b>
            <small>Premi Play per ascoltare l’audio di questo ricordo</small>
          </div>
          <BackgroundAudio
            src={audioItem.media_url}
            title={audioItem.media_name || `Messaggio vocale ${index + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

function BackgroundAudio({ src, title = "Messaggio dal viaggio", className = "", compact = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const formatAudioTime = (value) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return `${Math.floor(safeValue / 60)}:${String(safeValue % 60).padStart(2, "0")}`;
  };
  const activateMediaSession = () => {
    const audio = audioRef.current;
    setPlaying(true);
    if (!audio || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title, artist: "India insieme", album: "Viaggio in India 2026",
        artwork: [{ src: "/cities/india-insieme-collage.png", type: "image/png" }],
      });
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        audio.currentTime = Math.min(Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + 10, audio.currentTime + (details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (Number.isFinite(details.seekTime)) audio.currentTime = details.seekTime;
      });
      navigator.mediaSession.playbackState = "playing";
    } catch {}
  };
  const markPaused = () => {
    setPlaying(false);
    if (!("mediaSession" in navigator)) return;
    try { navigator.mediaSession.playbackState = "paused"; } catch {}
  };
  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };
  const audioElement = (
    <audio ref={audioRef} className={compact ? "compactAudioElement" : className}
      controls={!compact} preload="metadata" playsInline src={src}
      onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
      onPlay={activateMediaSession} onPause={markPaused}
      onEnded={() => { setPlaying(false); setCurrentTime(0); markPaused(); }}
      data-background-audio="true"
    />
  );
  if (!compact) return audioElement;
  return (
    <div className={`compactPhotoAudio ${playing ? "isPlaying" : ""}`}>
      <button type="button" className="compactAudioPlay" onClick={togglePlayback}
        aria-label={playing ? "Metti in pausa il racconto" : "Ascolta il racconto"}>
        <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
      </button>
      <div className="compactAudioBody">
        <span className="compactAudioLabel">{playing ? "In ascolto" : "Ascolta il racconto"}</span>
        <div className="compactAudioWave">
          <span /><span /><span /><span /><span /><span /><span /><span /><span />
          <input type="range" min="0" max={duration || 0} step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }}
            aria-label="Posizione del racconto audio" />
        </div>
      </div>
      <small>{formatAudioTime(currentTime)} / {formatAudioTime(duration)}</small>
      {audioElement}
    </div>
  );
}

function Post({ p, author, groupCode, sessionToken, people, refresh }) {
  const [comment, setComment] = useState(""),
    [replyFile, setReplyFile] = useState(null),
    [menuOpen, setMenuOpen] = useState(false),
    [saved, setSaved] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false),
    [sendingComment, setSendingComment] = useState(false),
    [commentStatus, setCommentStatus] = useState(""),
    [likesOpen, setLikesOpen] = useState(false),
    [editingCommentId, setEditingCommentId] = useState(""),
    [editingCommentText, setEditingCommentText] = useState(""),
    [deletingCommentId, setDeletingCommentId] = useState(""),
    [hiddenCommentIds, setHiddenCommentIds] = useState([]),
    [showAllComments, setShowAllComments] = useState(false);
  const replyInputRef = useRef(null);
  const commentOperationRef = useRef("");
  const reactionOperationRef = useRef({});
  const visitor = () => {
    let v = localStorage.getItem("india-visitor-id");
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem("india-visitor-id", v);
    }
    return v;
  };
  const react = async (kind) => {
    const reactionAuthor =
      author.trim() || (localStorage.getItem("india-visitor-name") || "").trim();
    if (!reactionAuthor) {
      setCommentStatus("Inserisci il tuo nome prima di lasciare una reazione.");
      return;
    }
    try {
      if (!reactionOperationRef.current[kind])
        reactionOperationRef.current[kind] = crypto.randomUUID();
      const identityHeaders = sessionToken
        ? sessionHeaders(sessionToken)
        : await guestHeaders(reactionAuthor);
      const response = await fetch(`${API}/reactions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...identityHeaders,
          "x-idempotency-key": reactionOperationRef.current[kind],
        },
        body: JSON.stringify({ post_id: p.id, kind }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(result.error || "Reazione non inviata.");
      delete reactionOperationRef.current[kind];
      await refresh();
    } catch (error) {
      setCommentStatus(error.message || "Reazione non inviata.");
    }
  };
  const send = async () => {
    const commentAuthor =
      author.trim() || (localStorage.getItem("india-visitor-name") || "").trim();
    if (!commentAuthor) {
      setCommentStatus("Prima seleziona il tuo profilo nel Gruppo.");
      return;
    }
    if (!comment.trim() && !replyFile) {
      setCommentStatus("Scrivi un commento oppure aggiungi un allegato.");
      return;
    }
    setSendingComment(true);
    setCommentStatus("Invio in corso…");
    const f = new FormData();
    f.set("post_id", p.id);
    f.set("author_name", commentAuthor);
    f.set("visitor_id", visitor());
    f.set("text", comment);
    if (replyFile) f.set("file", replyFile);
    try {
      if (!commentOperationRef.current)
        commentOperationRef.current = crypto.randomUUID();
      const identityHeaders = sessionToken
        ? sessionHeaders(sessionToken)
        : await guestHeaders(commentAuthor);
      const r = await fetch(`${API}/comments`, {
        method: "POST",
        headers: {
          ...identityHeaders,
          "x-idempotency-key": commentOperationRef.current,
        },
        body: f,
      });
      if (!r.ok) {
        const response = await r.json().catch(() => ({}));
        throw Error(
          response.error || "Commento non inviato. Tocca per riprovare.",
        );
      }
      setComment("");
      if (replyInputRef.current) replyInputRef.current.style.height = "";
      setReplyFile(null);
      commentOperationRef.current = "";
      await refresh();
      setCommentStatus("Commento pubblicato.");
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) {
        try {
          await queueFormRequest({
            id: `comment:${commentOperationRef.current}`,
            endpoint: `${API}/comments`,
            form: f,
            authType: sessionToken ? "session" : "guest",
            guestName: commentAuthor,
            operationKey: commentOperationRef.current,
          });
          setComment("");
          setReplyFile(null);
          commentOperationRef.current = "";
          setCommentStatus("Commento salvato nel telefono. Invio automatico al ritorno della rete.");
        } catch {
          setCommentStatus("Connessione assente e salvataggio offline non disponibile.");
        }
      } else
        setCommentStatus(
          error.message || "Commento non inviato. Tocca per riprovare.",
        );
    } finally {
      setSendingComment(false);
    }
  };
  const saveCommentEdit = async (commentId) => {
    const identityHeaders = sessionToken
      ? sessionHeaders(sessionToken)
      : await guestHeaders(author);
    const response = await fetch(`${API}/comments/${commentId}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...identityHeaders,
      },
      body: JSON.stringify({
        text: editingCommentText,
      }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setCommentStatus(result.error || "Modifica non riuscita.");
      return;
    }
    setEditingCommentId("");
    setEditingCommentText("");
    setCommentStatus("Commento modificato.");
    await refresh();
  };
  const deleteComment = async () => {
    if (!deletingCommentId) return;
    const targetCommentId = deletingCommentId;
    const identityHeaders = sessionToken
      ? sessionHeaders(sessionToken)
      : await guestHeaders(author);
    const response = await fetch(`${API}/comments/${deletingCommentId}`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        ...identityHeaders,
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setCommentStatus(result.error || "Eliminazione non riuscita.");
      return;
    }
    setHiddenCommentIds((current) => [...current, targetCommentId]);
    setDeletingCommentId("");
    setCommentStatus("Commento eliminato.");
    await refresh();
  };
  const remove = async () => {
    const r = await fetch(`${API}/posts/${p.id}`, {
      method: "DELETE",
      headers: sessionHeaders(sessionToken),
    });
    if (r.ok) {
      setConfirmDelete(false);
      refresh();
    }
  };
  const heartReactions = (p.reactions || []).filter((x) => x.kind === "heart");
  const heartCount = heartReactions.reduce(
    (total, reaction) => total + Number(reaction.total || 0),
    0,
  );
  const likerNames = heartReactions.flatMap((reaction) =>
    Array(Number(reaction.total || 0)).fill(
      reaction.author_name?.trim() || "Una persona",
    ),
  );
  const visibleComments = (p.comments || []).filter(
    (commentItem) => !hiddenCommentIds.includes(commentItem.id),
  );
  const mentionMatch = comment.match(/(^|\s)@([^\s@]*)$/);
  const mentionQuery = (mentionMatch?.[2] || "").toLowerCase();
  const mentionSuggestions = mentionMatch
    ? (people || [])
        .filter((person) => {
          const fullName = `${person.name} ${person.surname || ""}`.toLowerCase();
          return (
            !mentionQuery ||
            fullName.includes(mentionQuery) ||
            mentionHandle(person).toLowerCase().includes(mentionQuery)
          );
        })
        .slice(0, 5)
    : [];
  const addMention = (person) => {
    if (!mentionMatch) return;
    const prefix = comment.slice(0, mentionMatch.index) + mentionMatch[1];
    setComment(`${prefix}@${mentionHandle(person)} `);
    requestAnimationFrame(() => replyInputRef.current?.focus());
  };
  return (
    <article className="post" data-scroll-anchor={`post-${p.id}`}>
      <div className="postTop">
        <div className="avatar">{p.author_name?.[0] || "V"}</div>
        <div>
          <b>{p.author_name}</b>
          <small>
            {Number(p.day_index) < 0
              ? "Prima della partenza · Preparativi"
              : Number.isInteger(Number(p.day_index)) && days[Number(p.day_index)]
                ? `Giorno ${Number(p.day_index) + 1} · ${days[Number(p.day_index)].city}`
                : "Ricordo del viaggio"}
          </small>
          {p.visibility && p.visibility !== "public" && (
            <small className="postVisibility">
              {p.visibility === "family"
                ? "Familiari"
                : p.visibility === "group"
                  ? "Solo gruppo"
                  : "Solo io"}
            </small>
          )}
          {p.place_name && (
            p.latitude != null && p.longitude != null ? (
              <a
                className="postPlace"
                href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin /> {p.place_name}
              </a>
            ) : (
              <span className="postPlace"><MapPin /> {p.place_name}</span>
            )
          )}
        </div>
        {p.can_manage && (
          <div className="postMenu">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Altre opzioni"
            >
              <MoreHorizontal />
            </button>
            {menuOpen && (
              <button
                className="postDelete"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(true);
                }}
              >
                <Trash2 /> Elimina
              </button>
            )}
          </div>
        )}
      </div>
      <PostMedia
        items={
          p.media?.length
            ? p.media
            : p.media_url
              ? [{ media_url: p.media_url, media_type: p.media_type }]
              : []
        }
      />
      {p.text && <p className="postCaption">{p.text}</p>}
      <div className="postActions">
        <button onClick={() => react("heart")} aria-label="Mi piace">
          <Heart /> <span>Mi piace</span>
        </button>
        <button
          aria-label="Commenta"
          onClick={() => replyInputRef.current?.focus()}
        >
          <MessageCircle /> <span>Commenta</span>
        </button>
        <button
          aria-label="Condividi"
          onClick={() => navigator.share?.({ title: "India Insieme", url: location.href })}
        >
          <Share2 />
        </button>
        <button
          className={saved ? "saved" : ""}
          aria-label="Salva"
          onClick={() => setSaved(!saved)}
        >
          <Bookmark />
        </button>
      </div>
      {heartCount > 0 && (
        <div className="likesBlock">
          <button className="likesSummary" onClick={() => setLikesOpen(!likesOpen)}>
            Piace a {likerNames.slice(0, 2).join(", ")}
            {likerNames.length > 2 ? ` e altre ${likerNames.length - 2}` : ""}
          </button>
          {likesOpen && (
            <div className="likerList">
              <b>Mi piace di</b>
              {likerNames.map((name, index) => (
                <span key={`${name}-${index}`}>
                  <i>{name[0]?.toUpperCase() || "?"}</i>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="comments">
        {(showAllComments ? visibleComments : visibleComments.slice(-2)).map((x) => (
          <div className="comment" key={x.id} data-comment-id={x.id}>
            <i className="commentAvatar">
              {x.author_name?.[0]?.toUpperCase() || "?"}
            </i>
            <div className="commentCopy">
              <b>{x.author_name || "Ospite"}</b>
              {editingCommentId === x.id ? (
                <div className="commentEditor">
                  <input
                    value={editingCommentText}
                    onChange={(event) => setEditingCommentText(event.target.value)}
                    aria-label="Modifica commento"
                  />
                  <button
                    aria-label="Salva modifica commento"
                    onClick={() => saveCommentEdit(x.id)}
                  >
                    Salva
                  </button>
                  <button
                    aria-label="Annulla modifica commento"
                    onClick={() => setEditingCommentId("")}
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <>
                  {x.text && <span>{renderCommentText(x.text)}</span>}
                  {x.can_manage && x.text && (
                    <div className="commentCommands">
                      <button
                        onClick={() => {
                          setEditingCommentId(x.id);
                          setEditingCommentText(x.text || "");
                        }}
                      >
                        Modifica
                      </button>
                      <button onClick={() => setDeletingCommentId(x.id)}>
                        Elimina
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {x.media_type?.startsWith("audio") && (
              <BackgroundAudio
                src={x.media_url}
                title={`Risposta audio di ${x.author_name}`}
              />
            )}
            {x.media_type?.startsWith("image") && (
              <img
                src={x.media_url}
                alt={`Risposta di ${x.author_name}`}
                loading="lazy"
              />
            )}
            {x.media_type?.startsWith("video") && (
              <video
                controls
                playsInline
                preload="metadata"
                src={x.media_url}
              />
            )}
          </div>
        ))}
        {visibleComments.length > 2 && (
          <button
            className="allComments"
            onClick={() => setShowAllComments(!showAllComments)}
          >
            {showAllComments
              ? "Mostra soltanto gli ultimi commenti"
              : `Visualizza tutti i ${visibleComments.length} commenti`}
          </button>
        )}
        <div className="reply">
          <textarea
            ref={replyInputRef}
            value={comment}
            rows={1}
            onChange={(event) => {
              setComment(event.target.value);
              event.currentTarget.style.height = "auto";
              event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 150)}px`;
            }}
            placeholder={author ? "Scrivi un commento…" : "Inserisci il tuo nome sopra"}
            autoCapitalize="sentences"
            autoCorrect="on"
          />
          <label title="Aggiungi foto, video o audio">
            <Paperclip />
            <input
              type="file"
              accept="image/*,video/*,audio/*,.heic,.heif,.mov,.mp4,.m4a,.aac"
              onChange={async (e) => {
                const selectedFile = e.target.files?.[0] || null;
                if (!selectedFile) return setReplyFile(null);
                const invalidFile = validateMediaSelection(selectedFile);
                if (invalidFile) {
                  setCommentStatus(invalidFile);
                  e.target.value = "";
                  return;
                }
                try {
                  setReplyFile(await normalizeMobileUpload(selectedFile));
                } catch {
                  setCommentStatus("Foto HEIC non convertita. Riprova in formato JPG.");
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
          <button
            onClick={send}
            aria-label="Invia commento"
            disabled={sendingComment}
          >
            <Send />
          </button>
        </div>
        {mentionSuggestions.length > 0 && (
          <div className="mentionSuggestions" role="listbox" aria-label="Persone da menzionare">
            {mentionSuggestions.map((person) => (
              <button
                key={person.id}
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addMention(person)}
              >
                <span className="avatar">{person.name?.[0] || "?"}</span>
                <span>
                  <b>{person.name} {person.surname || ""}</b>
                  <small>@{mentionHandle(person)}</small>
                </span>
              </button>
            ))}
          </div>
        )}
        {replyFile && <small>Allegato pronto: {replyFile.name}</small>}
        {commentStatus && (
          <small className="commentStatus" role="status">
            {commentStatus}
          </small>
        )}
      </div>
      {confirmDelete && (
        <div className="confirmOverlay" onClick={() => setConfirmDelete(false)}>
          <div className="confirmCard" onClick={(event) => event.stopPropagation()}>
            <Trash2 />
            <h3>Eliminare questo contenuto?</h3>
            <p>Verranno rimossi il post e i suoi allegati.</p>
            <div>
              <button onClick={() => setConfirmDelete(false)}>Annulla</button>
              <button onClick={remove}>Elimina</button>
            </div>
          </div>
        </div>
      )}
      {deletingCommentId && (
        <div className="confirmOverlay" onClick={() => setDeletingCommentId("")}>
          <div className="confirmCard" onClick={(event) => event.stopPropagation()}>
            <Trash2 />
            <h3>Eliminare questo commento?</h3>
            <p>Il testo e l’eventuale allegato verranno rimossi.</p>
            <div>
              <button onClick={() => setDeletingCommentId("")}>Annulla</button>
              <button onClick={deleteComment}>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function People({
  people,
  groupCode,
  sessionToken,
  sessionProfile,
  setGroupCode,
  refresh,
  onOpenPrivate,
}) {
  const [form, setForm] = useState({
      name: "",
      surname: "",
      age: "",
      job: "",
      origin_city: "",
      bio: "",
      gender: "",
      role: "traveler",
    }),
    [avatar, setAvatar] = useState(null),
    [code, setCode] = useState(""),
    [saving, setSaving] = useState(false),
    [formStatus, setFormStatus] = useState({ type: "", text: "" }),
    [editingId, setEditingId] = useState(""),
    [inviteLinks, setInviteLinks] = useState({}),
    [inviteStatus, setInviteStatus] = useState("");
  const canManageGroup = sessionProfile?.role === "coordinator";
  const canEdit = (profileId) =>
    canManageGroup || sessionProfile?.id === profileId;
  const createInvite = async (person) => {
    setInviteStatus(`Creo l’invito per ${person.name}…`);
    const response = await fetch(`${API}/auth/invites`, {
      method: "POST",
      headers: sessionHeaders(sessionToken, { "content-type": "application/json" }),
      body: JSON.stringify({ profile_id: person.id }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setInviteStatus(result.error || "Invito non creato.");
      return;
    }
    const inviteUrl = new URL(location.origin);
    inviteUrl.hash = new URLSearchParams({ invite: result.invite_token }).toString();
    setInviteLinks((current) => ({ ...current, [person.id]: inviteUrl.href }));
    setInviteStatus(`Invito pronto per ${person.name}. Vale 48 ore e si usa una volta.`);
  };
  const copyInvite = async (person) => {
    const link = inviteLinks[person.id];
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setInviteStatus(`Link di ${person.name} copiato.`);
  };
  const add = async () => {
    if (!form.name.trim()) {
      setFormStatus({ type: "error", text: "Inserisci almeno il nome." });
      return;
    }
    if (!sessionToken || saving) return;
    setSaving(true);
    setFormStatus({ type: "", text: "" });
    try {
      const f = new FormData();
      Object.entries(form).forEach(([k, v]) => f.set(k, v));
      if (avatar) f.set("avatar", avatar);
      const r = await fetch(
        editingId ? `${API}/profiles/${editingId}` : `${API}/profiles`,
        {
        method: editingId ? "PUT" : "POST",
        headers: sessionHeaders(sessionToken),
        body: f,
        },
      );
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "Salvataggio non riuscito");
      const currentId = editingId || result.id;
      if (editingId && currentId === sessionProfile?.id) {
        localStorage.setItem("india-profile-id", currentId);
        localStorage.setItem(
          "india-visitor-name",
          `${form.name} ${form.surname}`.trim(),
        );
      }
      setForm({
        name: "",
        surname: "",
        age: "",
        job: "",
        origin_city: "",
        bio: "",
        gender: "",
        role: "traveler",
      });
      setAvatar(null);
      setEditingId("");
      setFormStatus({
        type: "success",
        text: editingId
          ? "Profilo aggiornato correttamente."
          : "Viaggiatore inserito correttamente.",
      });
      await refresh();
    } catch {
      await refresh();
      setFormStatus({
        type: "error",
        text: "Non è stato possibile confermare il salvataggio. L'elenco è stato aggiornato: controlla se il profilo compare qui sotto.",
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <section>
      <span className="eyebrow">IL NOSTRO GRUPPO</span>
      <h2>Facce, nomi e storie</h2>
      {sessionToken && (canManageGroup || editingId === sessionProfile?.id) ? (
        <div className="profileForm">
          {editingId && (
            <div className="editingProfile">
              <b>Stai modificando questo viaggiatore</b>
              <button
                onClick={() => {
                  setEditingId("");
                  setForm({
                    name: "",
                    surname: "",
                    age: "",
                    job: "",
                    origin_city: "",
                    bio: "",
                    gender: "",
                    role: "traveler",
                  });
                  setAvatar(null);
                }}
              >
                Annulla
              </button>
            </div>
          )}
          <label className="avatarPicker">
            {avatar ? (
              <img src={URL.createObjectURL(avatar)} alt="Anteprima" />
            ) : (
              <Users />
            )}
            <input
              type="file"
              accept="image/*,.heic,.heif"
              onChange={async (e) => {
                const selectedFile = e.target.files?.[0] || null;
                if (!selectedFile) return setAvatar(null);
                try {
                  setAvatar(await normalizeMobileUpload(selectedFile));
                } catch {
                  setFormStatus({
                    type: "error",
                    text: "Foto HEIC non convertita. Riprova in formato JPG.",
                  });
                }
              }}
            />
            <span>Aggiungi la tua foto</span>
          </label>
          <input
            placeholder="Nome *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Cognome"
            value={form.surname}
            onChange={(e) => setForm({ ...form, surname: e.target.value })}
          />
          <div className="split">
            <input
              placeholder="Età"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
            <input
              placeholder="Lavoro"
              value={form.job}
              onChange={(e) => setForm({ ...form, job: e.target.value })}
            />
          </div>
          <input
            placeholder="Da dove vieni (es. Milano)"
            value={form.origin_city}
            onChange={(e) => setForm({ ...form, origin_city: e.target.value })}
          />
          <textarea
            placeholder="Raccontaci qualcosa di te…"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <label className="genderSelect">
            Genere (facoltativo)
            <select value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Preferisco non indicarlo</option><option value="female">Donna</option><option value="male">Uomo</option>
            </select>
          </label>
          <label className="roleSelect">
            Ruolo nel viaggio
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="traveler">Viaggiatore</option>
              {canManageGroup && <option value="coordinator">Coordinatore</option>}
            </select>
          </label>
          {formStatus.text && (
            <div className={`formStatus ${formStatus.type}`} role="status">
              {formStatus.text}
            </div>
          )}
          <button onClick={add} disabled={saving}>
            <Plus />{" "}
            {saving
              ? "Salvataggio…"
              : editingId
                ? "Salva modifiche"
                : "Inserisci viaggiatore"}
          </button>
        </div>
      ) : !sessionToken ? (
        <div className="personalAccessRequired">
          <LockKeyhole />
          <div>
            <b>Accesso personale richiesto</b>
            <small>Inserisci la password comune e crea il tuo profilo per modificare il gruppo.</small>
          </div>
        </div>
      ) : (
        <div className="personalAccessRequired">
          <CircleUserRound />
          <div>
            <b>Il tuo profilo è collegato</b>
            <small>Puoi modificare i tuoi dati dalla tua scheda qui sotto.</small>
          </div>
        </div>
      )}
      {inviteStatus && <div className="formStatus success" role="status">{inviteStatus}</div>}
      <div className="peopleGrid">
        {sortTravelers(people).map((x) => (
          <article key={x.id} className={`profileCard gender-${x.gender || "unspecified"}`}>
            {x.avatar_url ? (
              <img className="profilePhoto" src={x.avatar_url} alt={x.name} />
            ) : (
              <div className="avatar big">{x.name[0]}</div>
            )}
            <h3>
              {x.name} {x.surname}{x.origin_city ? ` · ${x.origin_city}` : ""}
            </h3>
            <small>{travelerDetails(x)}</small>
            <p>{x.bio}</p>
            {sessionToken && canEdit(x.id) && (
              <div className="profileActions">
                <button
                  onClick={() => {
                    setEditingId(x.id);
                    setForm({
                      name: x.name || "",
                      surname: x.surname || "",
                      age: x.age || "",
                      job: x.job || "",
                      origin_city: x.origin_city || "",
                      bio: x.bio || "",
                      gender: x.gender || "",
                      role: x.role || "traveler",
                    });
                    setAvatar(null);
                    document.querySelector(".profileForm")?.scrollIntoView({
                      behavior: "auto",
                      block: "start",
                    });
                  }}
                >
                  Modifica profilo
                </button>
                <button
                  onClick={() => onOpenPrivate(x.id)}
                >
                  <ShieldCheck /> Documenti e posizione
                </button>
                {canManageGroup && (
                  <button onClick={() => createInvite(x)}>
                    <Link /> Crea invito personale
                  </button>
                )}
                {inviteLinks[x.id] && (
                  <div className="profileInviteLink">
                    <small>Invito personale, valido una sola volta</small>
                    <button onClick={() => copyInvite(x)}>Copia link</button>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
      {!people.length && (
        <Empty
          icon={Users}
          title="Il gruppo è ancora vuoto"
          text="Inserisci il primo partecipante con la sua foto."
        />
      )}
    </section>
  );
}

function VaultOnline({
  people,
  groupCode,
  sessionToken,
  setSessionToken,
  setGroupCode,
  onOpenGroup,
  preferredProfileId,
}) {
  const documentOperationRef = useRef({});
  const vaultSyncVersionRef = useRef(0);
  const [code, setCode] = useState(""),
    [privateData, setPrivateData] = useState({ documents: [], locations: [] }),
    [profileId, setProfileId] = useState(""),
    [busy, setBusy] = useState(""),
    [documentStatus, setDocumentStatus] = useState(""),
    [locationStatus, setLocationStatus] = useState(""),
    [documentPreview, setDocumentPreview] = useState(null),
    [pendingDocumentDelete, setPendingDocumentDelete] = useState(""),
    [locationMapOpen, setLocationMapOpen] = useState(false),
    [viewMode, setViewMode] = useState("traveler"),
    [devices, setDevices] = useState([]);
  const refresh = async () => {
    if (!sessionToken) return;
    const [privateResponse, devicesResponse, syncResponse] = await Promise.all([
      fetch(`${API}/private`, {
        headers: sessionHeaders(sessionToken),
        cache: "no-store",
      }),
      fetch(`${API}/auth/devices`, {
        headers: sessionHeaders(sessionToken),
        cache: "no-store",
      }),
      fetch(`${API}/sync/version`, { cache: "no-store" }),
    ]);
    if (privateResponse.ok) setPrivateData(await privateResponse.json());
    if (devicesResponse.ok)
      setDevices((await devicesResponse.json()).devices || []);
    if (syncResponse.ok)
      vaultSyncVersionRef.current = Number((await syncResponse.json()).version || 0);
  };
  useEffect(() => {
    if (sessionToken) refresh();
  }, [sessionToken]);
  useEffect(() => {
    if (!sessionToken) return undefined;
    let checking = false;
    const checkPrivateUpdates = async () => {
      if (checking || document.hidden || !navigator.onLine) return;
      checking = true;
      try {
        const response = await fetch(`${API}/sync/version`, { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        if (Number(result.version || 0) > vaultSyncVersionRef.current) await refresh();
      } catch {
        // Sincronizzazione privata silenziosa: il ciclo successivo ritenta.
      } finally {
        checking = false;
      }
    };
    const timer = setInterval(checkPrivateUpdates, 2500);
    return () => clearInterval(timer);
  }, [sessionToken]);
  useEffect(() => {
    const viewer = privateData.viewer;
    if (!viewer) return;
    if (viewer.role !== "coordinator") {
      setProfileId(viewer.profile_id);
      setViewMode("traveler");
    }
  }, [privateData.viewer?.profile_id, privateData.viewer?.role]);
  useEffect(() => {
    if (!sessionToken) return;
    if (preferredProfileId && people.some((p) => p.id === preferredProfileId)) {
      setProfileId(preferredProfileId);
      return;
    }
    if (profileId || !people.length) return;
    const savedProfileId = localStorage.getItem("india-profile-id") || "";
    if (savedProfileId && people.some((p) => p.id === savedProfileId)) {
      setProfileId(savedProfileId);
      return;
    }
    const savedName = (localStorage.getItem("india-visitor-name") || "")
      .trim()
      .toLowerCase();
    const match = people.find(
      (person) =>
        `${person.name} ${person.surname || ""}`.trim().toLowerCase() ===
          savedName || person.name.trim().toLowerCase() === savedName,
    );
    if (match) setProfileId(match.id);
  }, [people, preferredProfileId, sessionToken]);
  useEffect(() => {
    const person = people.find((item) => item.id === profileId);
    if (person)
      setViewMode(person.role === "coordinator" ? "coordinator" : "traveler");
  }, [profileId, people]);
  const upload = async (type, file) => {
    if (!file || !profileId) return;
    setBusy(type);
    const f = new FormData();
    f.set("profile_id", profileId);
    f.set("doc_type", type);
    f.set("file", file);
    const signature = `${file.name}:${file.size}:${file.lastModified}`;
    const pendingOperation = documentOperationRef.current[type];
    if (!pendingOperation || pendingOperation.signature !== signature)
      documentOperationRef.current[type] = {
        signature,
        key: crypto.randomUUID(),
      };
    try {
      if (navigator.onLine && shouldUseResumableUpload(file)) {
        setDocumentStatus(`Caricamento protetto: 0%`);
        const uploaded = await uploadFileResumable({
          api: API,
          file,
          scope: "document",
          headers: sessionHeaders(sessionToken),
          onProgress: (progress) => setDocumentStatus(`Caricamento protetto: ${progress}%`),
        });
        f.delete("file");
        f.set("upload_id", uploaded.upload_id);
      }
      const r = await fetch(`${API}/documents`, {
        method: "POST",
        headers: {
          ...sessionHeaders(sessionToken),
          "x-idempotency-key": documentOperationRef.current[type].key,
        },
        body: f,
      });
      if (r.ok) {
        delete documentOperationRef.current[type];
        setDocumentStatus("Documento caricato correttamente.");
        refresh();
      } else {
        const result = await r.json().catch(() => ({}));
        setDocumentStatus(result.error || "Caricamento del documento non riuscito.");
      }
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) {
        try {
          await queueFormRequest({
            id: `document:${documentOperationRef.current[type].key}`,
            endpoint: `${API}/documents`,
            form: f,
            authType: "session",
            operationKey: documentOperationRef.current[type].key,
          });
          delete documentOperationRef.current[type];
          setDocumentStatus("Documento salvato nel telefono. Caricamento automatico al ritorno della rete.");
        } catch {
          setDocumentStatus("Connessione assente e salvataggio offline non disponibile.");
        }
      } else setDocumentStatus("Caricamento del documento non riuscito.");
    } finally {
      setBusy("");
    }
  };
  const remove = async (type) => {
    const r = await fetch(`${API}/documents/${profileId}/${type}`, {
      method: "DELETE",
      headers: sessionHeaders(sessionToken),
    });
    if (r.ok) {
      setPendingDocumentDelete("");
      setDocumentStatus("Documento eliminato.");
      refresh();
    } else setDocumentStatus("Eliminazione del documento non riuscita.");
  };
  const openDocument = async (doc, download = false) => {
    setDocumentStatus("Apertura del documento…");
    const response = await fetch(
      `${API}/media/${encodeURIComponent(doc.file_key)}`,
      { headers: sessionHeaders(sessionToken) },
    );
    if (!response.ok) {
      setDocumentStatus("Documento non disponibile. Tocca Riprova.");
      return;
    }
    const documentBlob = await response.blob();
    const responseType = documentBlob.type || response.headers.get("content-type") || "";
    const isPdf = responseType.toLowerCase().includes("application/pdf") ||
      String(doc.file_name || "").toLowerCase().endsWith(".pdf");
    const previewBlob = isPdf && documentBlob.type !== "application/pdf"
      ? new Blob([documentBlob], { type: "application/pdf" })
      : documentBlob;
    const blobUrl = URL.createObjectURL(previewBlob);
    if (download) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = doc.file_name || "documento";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDocumentStatus("Download avviato.");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } else {
      if (documentPreview?.url) URL.revokeObjectURL(documentPreview.url);
      setDocumentPreview({
        url: blobUrl,
        bytes: await previewBlob.arrayBuffer(),
        name: doc.file_name || "Documento",
        type: isPdf ? "application/pdf" : responseType,
      });
      setDocumentStatus("Documento aperto.");
    }
  };
  const closeDocumentPreview = () => {
    if (documentPreview?.url) URL.revokeObjectURL(documentPreview.url);
    setDocumentPreview(null);
  };
  const locate = () => {
    const viewerProfileId = privateData.viewer?.profile_id || "";
    if (!viewerProfileId) {
      setLocationStatus("Collega prima il tuo profilo a questo dispositivo.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus("La posizione non è disponibile su questo dispositivo.");
      return;
    }
    setLocationStatus("Ricerca della posizione in corso…");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          const response = await fetch(`${API}/locations`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...sessionHeaders(sessionToken),
            },
            body: JSON.stringify({
              profile_id: viewerProfileId,
              latitude: p.coords.latitude,
              longitude: p.coords.longitude,
            }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || "Posizione non aggiornata");
          setLocationStatus("Posizione aggiornata e visibile al gruppo.");
          await refresh();
        } catch (error) {
          setLocationStatus(error.message || "Posizione non aggiornata. Riprova.");
        }
      },
      (error) =>
        setLocationStatus(
          error.code === 1
            ? "Permesso posizione non concesso. Abilitalo nelle impostazioni del browser."
            : "Posizione non disponibile. Controlla GPS e connessione e riprova.",
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  };
  const removeLocation = async (targetProfileId) => {
    const response = await fetch(`${API}/locations/${targetProfileId}`, {
      method: "DELETE",
      headers: sessionHeaders(sessionToken),
    });
    if (response.ok) {
      setLocationStatus("Posizione rimossa. Non è più visibile al gruppo.");
      refresh();
    } else {
      const result = await response.json().catch(() => ({}));
      setLocationStatus(result.error || "Posizione non rimossa. Riprova.");
    }
  };
  const lockDevice = async () => {
    if (sessionToken)
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: sessionHeaders(sessionToken),
      }).catch(() => {});
    localStorage.removeItem("india-session-token");
    localStorage.removeItem("india-group-code");
    localStorage.removeItem("india-profile-id");
    localStorage.removeItem("india-visitor-name");
    localStorage.removeItem("india-role");
    localStorage.removeItem("india-guest-token");
    localStorage.removeItem("india-guest-name");
    localStorage.removeItem("india-visitor-id");
    setSessionToken("");
    setGroupCode("");
  };
  const revokeDevice = async (device) => {
    const response = await fetch(
      `${API}/auth/devices/${encodeURIComponent(device.device_id)}`,
      { method: "DELETE", headers: sessionHeaders(sessionToken) },
    );
    if (!response.ok) return;
    if (device.current) await lockDevice();
    else await refresh();
  };
  const revokeAllDevices = async () => {
    const response = await fetch(`${API}/auth/logout-all`, {
      method: "POST",
      headers: sessionHeaders(sessionToken),
    });
    if (response.ok) await lockDevice();
  };
  if (!sessionToken)
    return (
      <section>
        <span className="eyebrow">AREA RISERVATA</span>
        <h2>Accesso personale richiesto</h2>
        <div className="personalAccessRequired">
          <LockKeyhole />
          <div>
            <b>Questo dispositivo non è ancora autorizzato</b>
            <small>Inserisci la password comune e collega il tuo profilo.</small>
          </div>
        </div>
      </section>
    );
  const types = [
    ["passport", "Passaporto"],
    ["visa", "Visto India"],
    ["tickets", "Biglietti"],
    ["insurance", "Assicurazione"],
  ];
  const otherDocuments = privateData.documents.filter(
    (document) => document.profile_id === profileId && document.doc_type?.startsWith("other-"),
  );
  const selectedProfile = people.find((person) => person.id === profileId);
  const viewerIsCoordinator = privateData.viewer?.role === "coordinator";
  const isCoordinator = viewerIsCoordinator && viewMode === "coordinator";
  return (
    <section>
      <span className="eyebrow">AREA RISERVATA</span>
      <h2>Documenti e sicurezza</h2>
      <div className="privateTop">
        <div className="privateBadge">
          <ShieldCheck /> Dispositivo sbloccato
        </div>
        <button onClick={lockDevice}>
          <LockKeyhole /> Blocca
        </button>
      </div>
      <details className="deviceManager">
        <summary>Dispositivi collegati ({devices.length})</summary>
        <div>
          {devices.map((device) => (
            <div className="deviceRow" key={device.device_id}>
              <span>
                <b>{device.device_name || "Dispositivo"}</b>
                <small>{device.current ? "Questo dispositivo" : `Ultimo uso ${new Date(device.last_used_at).toLocaleDateString("it-IT")}`}</small>
              </span>
              <button onClick={() => revokeDevice(device)}>
                {device.current ? "Esci" : "Revoca"}
              </button>
            </div>
          ))}
          {devices.length > 1 && (
            <button className="revokeAll" onClick={revokeAllDevices}>
              Disconnetti tutti i dispositivi
            </button>
          )}
        </div>
      </details>
      <div className="rolePreview" aria-label="Anteprima del ruolo">
        <div>
          <small>ANTEPRIMA SCHERMATA</small>
          <b>Che cosa vede ciascun ruolo</b>
        </div>
        <button
          className={viewMode === "traveler" ? "active" : ""}
          onClick={() => setViewMode("traveler")}
        >
          Viaggiatore
        </button>
        {viewerIsCoordinator && (
          <button
            className={viewMode === "coordinator" ? "active" : ""}
            onClick={() => setViewMode("coordinator")}
          >
            Coordinatore
          </button>
        )}
      </div>
      {viewerIsCoordinator && (
        <button type="button" className="myDocumentsButton" onClick={() => {
          setProfileId(privateData.viewer.profile_id); setViewMode("traveler");
        }}><ShieldCheck /> I miei documenti</button>
      )}
      {people.length > 0 && viewMode === "traveler" && viewerIsCoordinator && (
        <label className="personSelect">
          Chi sei?
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            <option value="">Seleziona il tuo profilo</option>
            {sortTravelers(people).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.surname}
              </option>
            ))}
          </select>
        </label>
      )}
      {isCoordinator && (
        <section className="coordinatorDashboard">
          <div className="coordinatorHead">
            <div>
              <span className="eyebrow">VISTA COORDINATORE</span>
              <h3>Controllo documenti</h3>
              <small>La situazione del gruppo, persona per persona</small>
            </div>
            <b aria-label="Documenti presenti sul totale">
              {
                privateData.documents.filter((document) =>
                  types.some(([type]) => type === document.doc_type),
                ).length
              }
              /{people.length * types.length}
            </b>
          </div>
          <div className="coordinatorProgress" aria-hidden="true">
            <i
              style={{
                width: `${people.length ? Math.round((privateData.documents.filter((document) => types.some(([type]) => type === document.doc_type)).length / (people.length * types.length)) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="documentCards" aria-label="Stato documenti del gruppo">
            {sortTravelers(people).map((person) => {
              const personDocuments = types.map(([type, label]) => ({
                type,
                label,
                document: privateData.documents.find(
                  (item) =>
                    item.profile_id === person.id && item.doc_type === type,
                ),
              }));
              const presentCount = personDocuments.filter(
                (item) => item.document,
              ).length;
              return (
                <article className="documentPersonCard" key={person.id}>
                  <header>
                    <span className="avatar">
                      {person.name?.[0]?.toUpperCase() || "?"}
                    </span>
                    <div>
                      <b>{person.name} {person.surname || ""}</b>
                      <small>
                        {travelerRoleLabel(person)}
                      </small>
                    </div>
                    <strong className={presentCount === types.length ? "complete" : ""}>
                      {presentCount}/{types.length}
                    </strong>
                  </header>
                  <div className="documentChecks">
                    {personDocuments.map(({ type, label, document }) =>
                      document ? (
                        <button
                          aria-label={`${person.name}: ${label} presente, apri`}
                          key={type}
                          onClick={() => openDocument(document)}
                        >
                          <span><Check /></span>
                          <b>{label}</b>
                          <small>Presente · Apri</small>
                        </button>
                      ) : (
                        <div className="documentCheckMissing" key={type}>
                          <span>!</span>
                          <b>{label}</b>
                          <small>Da caricare</small>
                        </div>
                      ),
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
      {people.length && viewMode === "traveler" ? (
        <div className="documentList">
          {documentStatus && (
            <small className="documentStatus" role="status">
              {documentStatus}
            </small>
          )}
          {types.map(([type, label]) => {
            const doc = privateData.documents.find(
              (x) => x.profile_id === profileId && x.doc_type === type,
            );
            return (
              <div className="document" key={type}>
                <div>
                  <b>{label}</b>
                  <small>{doc?.file_name || "Non ancora caricato"}</small>
                </div>
                {doc ? (
                  <>
                    <span className="docOk">✓ Presente</span>
                    <div className="documentActions">
                      <button onClick={() => openDocument(doc)}>Apri</button>
                      <button onClick={() => openDocument(doc, true)}>Scarica</button>
                      {privateData.viewer?.profile_id === profileId && (
                        <>
                          <label>
                            {busy === type ? "Invio…" : "Sostituisci"}
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              onChange={(e) => upload(type, e.target.files?.[0])}
                            />
                          </label>
                          <button onClick={() => setPendingDocumentDelete(type)}>
                            Elimina
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : privateData.viewer?.profile_id === profileId ? (
                  <label>
                    {busy === type ? "Invio…" : "Carica"}
                    <input
                      type="file"
                      accept="application/pdf,image/*,.heic,.heif"
                      onChange={(e) => upload(type, e.target.files?.[0])}
                    />
                  </label>
                ) : (
                  <small>Da caricare</small>
                )}
              </div>
            );
          })}
          <div className="otherDocuments">
            <div className="otherDocumentsHeading">
              <div><b>Altri documenti</b><small>Allegati facoltativi, singoli o multipli</small></div>
              {privateData.viewer?.profile_id === profileId && (
                <label>Aggiungi<input type="file" accept="application/pdf,image/*,.heic,.heif" multiple
                  onChange={async (event) => {
                    const files = Array.from(event.target.files || []); event.target.value = "";
                    for (const file of files) await upload(`other-${crypto.randomUUID()}`, file);
                  }} /></label>
              )}
            </div>
            {otherDocuments.length ? otherDocuments.map((doc) => (
              <div className="otherDocumentRow" key={doc.doc_type}>
                <div><b>{doc.file_name || "Documento"}</b><small>Documento aggiuntivo</small></div>
                <button onClick={() => openDocument(doc)}>Apri</button>
                <button onClick={() => openDocument(doc, true)}>Scarica</button>
                {privateData.viewer?.profile_id === profileId && <button onClick={() => setPendingDocumentDelete(doc.doc_type)}>Elimina</button>}
              </div>
            )) : <small className="otherDocumentsEmpty">Nessun altro documento caricato.</small>}
          </div>
        </div>
      ) : !people.length ? (
        <div className="missingProfile">
          <Users />
          <div>
            <b>Prima crea il tuo profilo viaggiatore</b>
            <small>
              La posizione e i documenti devono essere associati alla persona
              corretta.
            </small>
          </div>
          <button onClick={onOpenGroup}>Vai al Gruppo</button>
        </div>
      ) : null}
      {documentPreview && (
        <div className={`documentPreviewOverlay${documentPreview.fullscreen ? " isFullscreen" : ""}`} role="dialog" aria-modal="true" aria-label={documentPreview.name}>
          <div className="documentPreviewCard">
            <header>
              <b>{documentPreview.name}</b>
              <div>
                {documentPreview.fullscreen ? (
                  <button type="button" className="documentBackButton" onClick={() => setDocumentPreview((current) => ({ ...current, fullscreen: false }))}>
                    ← Torna ai documenti
                  </button>
                ) : (
                  <button type="button" onClick={() => setDocumentPreview((current) => ({ ...current, fullscreen: true }))}>
                    Apri a schermo intero
                  </button>
                )}
                <a href={documentPreview.url} download={documentPreview.name}>Scarica</a>
                <button type="button" onClick={closeDocumentPreview} aria-label="Chiudi documento">×</button>
              </div>
            </header>
            {documentPreview.type.startsWith("image/") ? (
              <img src={documentPreview.url} alt={documentPreview.name} />
            ) : documentPreview.type === "application/pdf" ? (
              <PdfDocumentViewer url={documentPreview.url} bytes={documentPreview.bytes} name={documentPreview.name} />
            ) : (
              <div className="documentPreviewFallback">
                <p>Questo formato non può essere mostrato direttamente dal telefono.</p>
                <a href={documentPreview.url} download={documentPreview.name}>Scarica il documento</a>
              </div>
            )}
          </div>
        </div>
      )}
      {pendingDocumentDelete && (
        <div className="confirmOverlay" onClick={() => setPendingDocumentDelete("")}>
          <div className="confirmCard" onClick={(event) => event.stopPropagation()}>
            <Trash2 />
            <h3>Eliminare questo documento?</h3>
            <p>Verrà rimosso dalla cartella privata del viaggiatore.</p>
            <div>
              <button onClick={() => setPendingDocumentDelete("")}>Annulla</button>
              <button onClick={() => remove(pendingDocumentDelete)}>Elimina</button>
            </div>
          </div>
        </div>
      )}
      <div className={`locationPanel ${!profileId ? "needsProfile" : ""}`}>
        <MapPin />
        <div>
          <b>Posizione condivisa</b>
          <small>
            {profileId
              ? "Aggiornamento volontario, visibile a tutto il gruppo."
              : "Seleziona prima il tuo profilo qui sopra."}
          </small>
        </div>
        <button onClick={locate} disabled={!privateData.viewer?.profile_id}>
          Aggiorna ora
        </button>
      </div>
      {locationStatus && <small className="locationStatus" role="status">{locationStatus}</small>}
      <button
        className="locationMapToggle"
        onClick={() => setLocationMapOpen((value) => !value)}
        aria-expanded={locationMapOpen}
      >
        <MapPinned />
        {locationMapOpen ? "Chiudi mappa posizioni" : "Apri mappa posizioni"}
        <span>{privateData.locations.length}</span>
      </button>
      {locationMapOpen && (
        <>
          <PeopleLocationMap locations={privateData.locations} />
          <div className="locationList">
            {privateData.locations.map((x) => (
              <article key={x.profile_id}>
                <div>
                  <b>{x.display_name}</b>
                  <span>
                    {Number(x.latitude).toFixed(4)}, {Number(x.longitude).toFixed(4)}
                  </span>
                  <small>
                    Ultimo aggiornamento · {new Date(x.updated_at).toLocaleString("it-IT")}
                  </small>
                </div>
                <div className="locationActions">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${x.latitude},${x.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Maps
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${x.latitude},${x.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Naviga
                  </a>
                  {x.profile_id === privateData.viewer?.profile_id && (
                    <button onClick={() => removeLocation(x.profile_id)}>
                      Cancella posizione
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <div className="archive">
        <b>Archivio di fine viaggio</b>
        <p>
          Qui verrà inserito il download completo per il rientro in Italia,
          senza occupare spazio durante il viaggio.
        </p>
      </div>
    </section>
  );
}

function UnlockCard({
  code,
  setCode,
  onUnlock,
  text = "",
  successText = "Password corretta. Ora scegli il tuo nome.",
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const unlock = async () => {
    setError("");
    setSuccess("");
    if (!(await onUnlock())) setError("Codice non corretto");
    else setSuccess(successText);
  };
  return (
    <div className="lockedComposer">
      <div className="lockMini">
        <LockKeyhole />
      </div>
      <div>
        <b>Accesso privato</b>
        {text && <small>{text}</small>}
      </div>
      <div className="unlockInline">
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Password"
          onKeyDown={(e) => e.key === "Enter" && unlock()}
        />
        <button onClick={unlock}>Accedi</button>
        {error && <small className="unlockError">{error}</small>}
        {success && <small className="unlockSuccess">{success}</small>}
      </div>
    </div>
  );
}
function Empty({ icon: I, title, text }) {
  return (
    <div className="empty">
      <I />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
