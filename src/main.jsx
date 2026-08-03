import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  Wifi,
  ImageIcon,
} from "./icons.jsx";
import "./styles.css";

const VERSION = "1.1.2",
  API = "/api";
const cityImages = {
  Delhi:
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1100&q=80",
  Udaipur:
    "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1100&q=80",
  Jodhpur:
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1100&q=80",
  Jaipur:
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1100&q=80",
  Agra: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1100&q=80",
  Varanasi:
    "https://images.unsplash.com/photo-1561361058-c24e02d4a4c4?auto=format&fit=crop&w=1100&q=80",
};
const places = {
  Delhi: [28.6139, 77.209],
  Udaipur: [24.5854, 73.7125],
  Ranakpur: [25.1164, 73.4737],
  Jodhpur: [26.2389, 73.0243],
  Jaipur: [26.9124, 75.7873],
  Agra: [27.1767, 78.0081],
  Varanasi: [25.3176, 82.9739],
};
const roadPaths = {
  "Udaipur-Jodhpur": [
    [24.585, 73.712],
    [24.667, 73.639],
    [24.814, 73.428],
    [25.116, 73.473],
    [25.373, 73.453],
    [25.581, 73.39],
    [25.872, 73.223],
    [26.032, 73.079],
    [26.239, 73.024],
  ],
  "Jodhpur-Jaipur": [
    [26.239, 73.024],
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
    [26.912, 75.787],
  ],
  "Jaipur-Agra": [
    [26.912, 75.787],
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
    [27.177, 78.008],
  ],
};
const days = [
  {
    date: "Lun 10 ago",
    city: "Delhi",
    title: "Primo respiro d’India",
    story:
      "Atterriamo nella capitale, ci sistemiamo e cominciamo senza fretta: Lotus Temple, Connaught Place e la prima cena tutti insieme.",
    goal: "Prendere il ritmo e conoscere il gruppo",
    km: 18,
    time: "45 min complessivi",
    transport: "Taxi + metro",
    from: "Delhi",
    to: "Delhi",
    checks: [
      "Lotus Temple",
      "Pranzo locale",
      "Connaught Place",
      "Cena e compleanni",
    ],
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
    checks: ["Van per Jaipur", "Walking tour", "Cooking class", "Cena insieme"],
  },
  {
    date: "Lun 17 ago",
    city: "Jaipur",
    title: "Templi e fortezze",
    story:
      "Galta Ji al mattino, Amber Fort nel pomeriggio e una cena panoramica per festeggiare il compleanno di Paolo.",
    goal: "Dall’acqua sacra alle mura di Amber",
    km: 35,
    time: "1 h 20 complessive",
    transport: "Tuk-tuk + van",
    from: "Jaipur",
    to: "Jaipur",
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
    title: "Alba sul Gange",
    story:
      "Partenza in barca prima del sole, yoga sul rooftop e tempo libero nei vicoli. La sera festeggiamo Davide.",
    goal: "Guardare Varanasi svegliarsi dal fiume",
    km: 10,
    time: "Barca 1 h 30",
    transport: "Barca + a piedi",
    from: "Varanasi",
    to: "Varanasi",
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

function TripMap({ selectedDay, onSelect }) {
  const el = useRef(null),
    map = useRef(null),
    layers = useRef([]);
  const day = selectedDay == null ? null : days[selectedDay];
  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 4,
    }).setView([25.8, 77.2], 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map.current);
    setTimeout(() => map.current?.invalidateSize(), 60);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    layers.current.forEach((x) => x.remove());
    layers.current = [];
    const add = (x) => {
      x.addTo(map.current);
      layers.current.push(x);
      return x;
    };
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
    sequence.forEach((name, i) => {
      const marker = add(
        L.circleMarker(places[name], {
          radius:
            day && (name === day.from || name === day.to || name === day.via)
              ? 9
              : 6,
          color: "#fff",
          weight: 2,
          fillColor:
            day && (name === day.from || name === day.to || name === day.via)
              ? "#e85d18"
              : "#153d31",
          fillOpacity: 1,
        }),
      );
      marker.bindPopup(`<b>${i + 1}. ${name}</b>`);
      marker.on("click", () =>
        onSelect?.(days.findIndex((d) => d.city === name)),
      );
    });
    const draw = (coords, opts = {}) =>
      add(
        L.polyline(coords, {
          color: "#e85d18",
          weight: 4,
          opacity: 0.9,
          ...opts,
        }),
      );
    if (day) {
      const coords = day.path
        ? roadPaths[day.path]
        : day.from === day.to
          ? [places[day.from]]
          : [places[day.from], places[day.to]];
      if (coords.length > 1)
        draw(coords, {
          dashArray: ["Aereo", "Treno", "Treno notturno"].includes(
            day.transport,
          )
            ? "10 10"
            : null,
        });
      map.current.fitBounds(L.latLngBounds(coords).pad(0.35), {
        maxZoom: day.from === day.to ? 11 : 7,
      });
    } else {
      draw([places.Delhi, places.Udaipur], { dashArray: "10 10" });
      draw(roadPaths["Udaipur-Jodhpur"]);
      draw(roadPaths["Jodhpur-Jaipur"]);
      draw(roadPaths["Jaipur-Agra"]);
      draw([places.Agra, places.Varanasi, places.Delhi], {
        dashArray: "10 10",
      });
      map.current.fitBounds(L.latLngBounds(Object.values(places)).pad(0.08));
    }
  }, [selectedDay]);
  return (
    <div
      className="realMap"
      ref={el}
      aria-label="Mappa interattiva reale dell’itinerario in India"
    />
  );
}

function App() {
  const [tab, setTab] = useState("diary"),
    [done, setDone] = useState(() => load("india-done", {})),
    [posts, setPosts] = useState(() => load("india-posts", [])),
    [people, setPeople] = useState(() => load("india-people", [])),
    [open, setOpen] = useState(0),
    [selectedDay, setSelectedDay] = useState(0),
    [mapDay, setMapDay] = useState(null),
    [groupCode, setGroupCode] = useState(
      () => sessionStorage.getItem("india-group-code") || "",
    ),
    [syncing, setSyncing] = useState(false);
  const refresh = async () => {
    try {
      setSyncing(true);
      const r = await fetch(`${API}/state`, { cache: "no-store" });
      if (!r.ok) throw Error();
      const d = await r.json();
      setPosts(d.posts || []);
      setPeople(d.profiles || []);
      localStorage.setItem("india-posts", JSON.stringify(d.posts || []));
      localStorage.setItem("india-people", JSON.stringify(d.profiles || []));
    } catch {
    } finally {
      setSyncing(false);
    }
  };
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);
  useEffect(
    () => localStorage.setItem("india-done", JSON.stringify(done)),
    [done],
  );
  useEffect(() => {
    if (groupCode) sessionStorage.setItem("india-group-code", groupCode);
  }, [groupCode]);
  const completed = useMemo(
    () => Object.values(done).filter(Boolean).length,
    [done],
  );
  const showMap = (i) => {
    setSelectedDay(i);
    setMapDay(i);
    setTab("map");
  };
  return (
    <div className="app">
      <header className="hero">
        <div className="heroShade" />
        <div className="top">
          <span className="flag">🇮🇳</span>
          <span className="brand">INDIA INSIEME</span>
          <span className="version">
            REV {VERSION}
            {syncing ? " · ↻" : ""}
          </span>
        </div>
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
              setMapDay(null);
              setTab("map");
            }}
          >
            <MapPinned /> Apri la mappa reale del viaggio
          </button>
        </div>
      </header>
      <nav className="tabs">
        {[
          ["diary", Camera, "Social"],
          ["roadmap", Route, "Diario"],
          ["map", MapPinned, "Mappa"],
          ["people", Users, "Gruppo"],
          ["vault", LockKeyhole, "Privato"],
        ].map(([id, I, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
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
              <button className="progress" onClick={() => setDone({})}>
                <b>{completed}</b>
                <small>spuntate</small>
              </button>
            </div>
            <div className="dayList">
              {days.map((d, i) => (
                <article className={`day ${open === i ? "open" : ""}`} key={i}>
                  <button
                    className="dayHero"
                    onClick={() => setOpen(open === i ? -1 : i)}
                  >
                    <img
                      src={cityImages[d.city]}
                      alt={`Vista di ${d.city}`}
                      loading="lazy"
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
                    </div>
                    <ChevronDown className={open === i ? "rot" : ""} />
                  </button>
                  {open === i && (
                    <div className="dayBody">
                      <div className="storyLabel">DIARIO DI BORDO</div>
                      <p>{d.story}</p>
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
                            setSelectedDay(i);
                            setTab("diary");
                          }}
                        >
                          <Camera /> Aggiungi ricordo
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "map" && (
          <MapSection selectedDay={mapDay} setSelectedDay={setMapDay} />
        )}{" "}
        {tab === "diary" && (
          <Diary
            posts={posts}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            groupCode={groupCode}
            setGroupCode={setGroupCode}
            refresh={refresh}
          />
        )}{" "}
        {tab === "people" && (
          <People
            people={people}
            groupCode={groupCode}
            setGroupCode={setGroupCode}
            refresh={refresh}
          />
        )}{" "}
        {tab === "vault" && (
          <VaultOnline
            people={people}
            groupCode={groupCode}
            setGroupCode={setGroupCode}
          />
        )}
      </main>
      <footer>
        <span>🇮🇳</span>
        <p>Un viaggio si misura negli amici, non nei chilometri.</p>
        <small>India Insieme · revisione {VERSION}</small>
      </footer>
    </div>
  );
}

function MapSection({ selectedDay, setSelectedDay }) {
  const d = selectedDay == null ? null : days[selectedDay];
  return (
    <section>
      <div className="mapHeading">
        <div>
          <span className="eyebrow">CARTINA REALE DELL’INDIA</span>
          <h2>{d ? `${d.from} → ${d.to}` : "Tutto l’itinerario"}</h2>
        </div>
        {d && <button onClick={() => setSelectedDay(null)}>Vedi tutto</button>}
      </div>
      <div className="mapShell">
        <TripMap
          selectedDay={selectedDay}
          onSelect={(i) => i >= 0 && setSelectedDay(i)}
        />
        {d && (
          <div className="mapTrip">
            <span>
              {d.transport.includes("Aereo")
                ? "✈️"
                : d.transport.includes("Treno")
                  ? "🚆"
                  : "🚐"}
            </span>
            <div>
              <b>{d.transport}</b>
              <small>
                {d.km} km · {d.time}
              </small>
            </div>
          </div>
        )}
      </div>
      <div className="routeChips">
        {days.map((x, i) => (
          <button
            key={i}
            className={selectedDay === i ? "active" : ""}
            onClick={() => setSelectedDay(i)}
          >
            <b>{i + 1}</b>
            <span>{x.city}</span>
            <small>
              {x.transport} · {x.km} km
            </small>
          </button>
        ))}
      </div>
      <p className="mapNote">
        Le strade in van seguono il tracciato stradale; voli e treni sono
        rappresentati come collegamenti tratteggiati. Distanze e tempi sono
        indicativi e possono cambiare.
      </p>
    </section>
  );
}

function Diary({
  posts,
  selectedDay,
  setSelectedDay,
  groupCode,
  setGroupCode,
  refresh,
}) {
  const today = new Date();
  const tripStart = new Date("2026-08-10T00:00:00+05:30");
  const liveIndex = Math.max(
    0,
    Math.min(13, Math.floor((today - tripStart) / 86400000)),
  );
  const liveDay = days[liveIndex];
  const [text, setText] = useState(() => localStorage.getItem("india-draft") || ""),
    [file, setFile] = useState(null),
    [author, setAuthor] = useState(
      () => localStorage.getItem("india-visitor-name") || "",
    ),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (author) localStorage.setItem("india-visitor-name", author);
  }, [author]);
  useEffect(() => localStorage.setItem("india-draft", text), [text]);
  const add = async () => {
    if (!groupCode || (!text.trim() && !file)) return;
    setBusy(true);
    try {
      const f = new FormData();
      f.set("author_name", author || "Viaggiatore");
      f.set("day_index", selectedDay);
      f.set("text", text);
      if (file) f.set("file", file);
      const r = await fetch(`${API}/posts`, {
        method: "POST",
        headers: { "x-group-code": groupCode },
        body: f,
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error);
      setText("");
      localStorage.removeItem("india-draft");
      setFile(null);
      await refresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section>
      <span className="eyebrow">SOCIAL DEL VIAGGIO</span>
      <h2>Raccontiamola insieme</h2>
      <button
        className="liveStatus"
        onClick={() => setSelectedDay(liveIndex)}
      >
        <span className="liveDot" />
        <div>
          <small>{today < tripStart ? "PROSSIMA TAPPA" : "DOVE SIAMO ORA"}</small>
          <b>{liveDay.city} · Giorno {liveIndex + 1}</b>
          <span>{liveDay.title}</span>
        </div>
        <MapPinned />
      </button>
      <div className="visitorBar">
        <div className="avatar">{author?.[0]?.toUpperCase() || "?"}</div>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Il tuo nome"
        />
        <small>Serve per commentare e rispondere</small>
      </div>
      {posts.length ? (
        posts.map((p) => (
          <Post
            key={p.id}
            p={p}
            author={author}
            groupCode={groupCode}
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
      <div className="dataSaver">
        <Wifi />
        <div>
          <b>Modalità pochi giga</b>
          <small>I contenuti si sincronizzano su tutti i telefoni.</small>
        </div>
      </div>
      {groupCode ? (
        <div className="composer">
          <div className="groupBadge">
            <LockKeyhole /> Pubblicazione viaggiatore
          </div>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
          >
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
          <div className="composerActions">
            <label>
              <ImageIcon /> Foto
              <input
                type="file"
                accept="image/*,.heic,.heif"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <label>
              <Camera /> Video
              <input
                type="file"
                accept="video/*,.mov,.mp4"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <label>
              <Mic /> Audio
              <input
                type="file"
                accept="audio/*,.m4a,.aac"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <button disabled={busy} onClick={add}>
              <Plus /> {busy ? "Invio…" : "Pubblica"}
            </button>
          </div>
          {file && <small className="selected">Pronto: {file.name}</small>}
        </div>
      ) : (
        <UnlockCard
          code={code}
          setCode={setCode}
          onUnlock={() => code === "india26" && setGroupCode(code)}
          text="I familiari possono già commentare e mettere cuori. Il codice serve per pubblicare nuovi ricordi."
        />
      )}
    </section>
  );
}

function Post({ p, author, groupCode, refresh }) {
  const [comment, setComment] = useState(""),
    [audio, setAudio] = useState(null),
    [gate, setGate] = useState(false),
    [deleteCode, setDeleteCode] = useState("");
  const visitor = () => {
    let v = localStorage.getItem("india-visitor-id");
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem("india-visitor-id", v);
    }
    return v;
  };
  const react = async (kind) => {
    await fetch(`${API}/reactions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ post_id: p.id, visitor_id: visitor(), kind }),
    });
    refresh();
  };
  const send = async () => {
    if (!author.trim() || (!comment.trim() && !audio)) return;
    const f = new FormData();
    f.set("post_id", p.id);
    f.set("author_name", author.trim());
    f.set("text", comment);
    if (audio) f.set("file", audio);
    const r = await fetch(`${API}/comments`, { method: "POST", body: f });
    if (r.ok) {
      setComment("");
      setAudio(null);
      refresh();
    } else alert((await r.json()).error);
  };
  const remove = async () => {
    const r = await fetch(`${API}/posts/${p.id}`, {
      method: "DELETE",
      headers: { "x-group-code": deleteCode || groupCode },
    });
    if (r.ok) refresh();
    else alert("Codice non corretto");
  };
  const count = (k) =>
    Number(p.reactions?.find((x) => x.kind === k)?.total || 0);
  return (
    <article className="post">
      <div className="postTop">
        <div className="avatar">{p.author_name?.[0] || "V"}</div>
        <div>
          <b>{p.author_name}</b>
          <small>
            Giorno {Number(p.day_index) + 1} · {days[p.day_index]?.city}
          </small>
        </div>
        {groupCode && (
          <button onClick={() => setGate(!gate)}>
            <Trash2 />
          </button>
        )}
      </div>
      {gate && (
        <div className="deleteGate">
          <b>Cancellazione protetta</b>
          <input
            type="password"
            value={deleteCode}
            onChange={(e) => setDeleteCode(e.target.value)}
            placeholder="Codice gruppo"
          />
          <button onClick={remove}>Elimina</button>
        </div>
      )}
      {p.text && <p>{p.text}</p>}
      {p.media_type?.startsWith("image") && (
        <img src={p.media_url} alt="Ricordo del viaggio" loading="lazy" />
      )}
      {p.media_type?.startsWith("video") && (
        <video controls playsInline preload="metadata" src={p.media_url} />
      )}{" "}
      {p.media_type?.startsWith("audio") && (
        <audio controls preload="metadata" src={p.media_url} />
      )}
      <div className="reactions">
        <button onClick={() => react("heart")}>
          ♥ <b>{count("heart")}</b>
        </button>
        <button onClick={() => react("like")}>
          👍 <b>{count("like")}</b>
        </button>
        <span>
          <MessageCircle /> {p.comments?.length || 0}
        </span>
      </div>
      <div className="comments">
        {p.comments?.map((x) => (
          <div className="comment" key={x.id}>
            <b>{x.author_name}</b>
            {x.text && <span>{x.text}</span>}
            {x.media_type?.startsWith("audio") && (
              <audio controls src={x.media_url} />
            )}
          </div>
        ))}
        <div className="reply">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={author ? "Rispondi…" : "Inserisci il tuo nome sopra"}
          />
          <label>
            <Mic />
            <input
              type="file"
              accept="audio/*,.m4a,.aac"
              onChange={(e) => setAudio(e.target.files?.[0] || null)}
            />
          </label>
          <button onClick={send}>Invia</button>
        </div>
        {audio && <small>Audio pronto: {audio.name}</small>}
      </div>
    </article>
  );
}

function People({ people, groupCode, setGroupCode, refresh }) {
  const [form, setForm] = useState({
      name: "",
      surname: "",
      age: "",
      job: "",
      bio: "",
    }),
    [avatar, setAvatar] = useState(null),
    [code, setCode] = useState("");
  const add = async () => {
    if (!groupCode || !form.name.trim()) return;
    const f = new FormData();
    Object.entries(form).forEach(([k, v]) => f.set(k, v));
    if (avatar) f.set("avatar", avatar);
    const r = await fetch(`${API}/profiles`, {
      method: "POST",
      headers: { "x-group-code": groupCode },
      body: f,
    });
    if (r.ok) {
      setForm({ name: "", surname: "", age: "", job: "", bio: "" });
      setAvatar(null);
      refresh();
    } else alert((await r.json()).error);
  };
  return (
    <section>
      <span className="eyebrow">IL NOSTRO GRUPPO</span>
      <h2>Facce, nomi e storie</h2>
      {groupCode ? (
        <div className="profileForm">
          <label className="avatarPicker">
            {avatar ? (
              <img src={URL.createObjectURL(avatar)} alt="Anteprima" />
            ) : (
              <Users />
            )}
            <input
              type="file"
              accept="image/*,.heic,.heif"
              onChange={(e) => setAvatar(e.target.files?.[0] || null)}
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
          <textarea
            placeholder="Raccontaci qualcosa di te…"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <button onClick={add}>
            <Plus /> Inserisci viaggiatore
          </button>
        </div>
      ) : (
        <UnlockCard
          code={code}
          setCode={setCode}
          onUnlock={() => code === "india26" && setGroupCode(code)}
          text="Il codice del gruppo serve per aggiungere un viaggiatore."
        />
      )}
      <div className="peopleGrid">
        {people.map((x) => (
          <article key={x.id}>
            {x.avatar_url ? (
              <img className="profilePhoto" src={x.avatar_url} alt={x.name} />
            ) : (
              <div className="avatar big">{x.name[0]}</div>
            )}
            <h3>
              {x.name} {x.surname}
            </h3>
            <small>
              {[x.age && `${x.age} anni`, x.job].filter(Boolean).join(" · ")}
            </small>
            <p>{x.bio}</p>
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

function VaultOnline({ people, groupCode, setGroupCode }) {
  const [code, setCode] = useState(""),
    [privateData, setPrivateData] = useState({ documents: [], locations: [] }),
    [profileId, setProfileId] = useState(""),
    [busy, setBusy] = useState("");
  const refresh = async (c = groupCode) => {
    if (!c) return;
    const r = await fetch(`${API}/private`, {
      headers: { "x-group-code": c },
      cache: "no-store",
    });
    if (r.ok) setPrivateData(await r.json());
  };
  useEffect(() => {
    if (groupCode) refresh();
  }, [groupCode]);
  useEffect(() => {
    if (!profileId && people[0]) setProfileId(people[0].id);
  }, [people]);
  const upload = async (type, file) => {
    if (!file || !profileId) return;
    setBusy(type);
    const f = new FormData();
    f.set("profile_id", profileId);
    f.set("doc_type", type);
    f.set("file", file);
    const r = await fetch(`${API}/documents`, {
      method: "POST",
      headers: { "x-group-code": groupCode },
      body: f,
    });
    setBusy("");
    if (r.ok) refresh();
    else alert((await r.json()).error);
  };
  const remove = async (type) => {
    if (!confirm("Rimuovere questo documento dalla cartella privata?")) return;
    const r = await fetch(`${API}/documents/${profileId}/${type}`, {
      method: "DELETE",
      headers: { "x-group-code": groupCode },
    });
    if (r.ok) refresh();
  };
  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      async (p) => {
        const person = people.find((x) => x.id === profileId);
        await fetch(`${API}/locations`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-group-code": groupCode,
          },
          body: JSON.stringify({
            profile_id: profileId,
            display_name: person
              ? `${person.name} ${person.surname}`
              : "Viaggiatore",
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
          }),
        });
        refresh();
      },
      () =>
        alert("Posizione non disponibile: controlla i permessi del telefono."),
    );
  if (!groupCode)
    return (
      <section>
        <span className="eyebrow">AREA RISERVATA</span>
        <h2>La base del gruppo</h2>
        <UnlockCard
          code={code}
          setCode={setCode}
          onUnlock={() => code === "india26" && setGroupCode(code)}
          text="Documenti e posizioni sono visibili soltanto ai viaggiatori."
        />
      </section>
    );
  const types = [
    ["passport", "Passaporto"],
    ["visa", "Visto India"],
    ["tickets", "Biglietti"],
    ["insurance", "Assicurazione"],
  ];
  return (
    <section>
      <span className="eyebrow">AREA RISERVATA</span>
      <h2>Documenti e sicurezza</h2>
      <div className="privateBadge">
        <ShieldCheck /> Area privata aperta
      </div>
      <label className="personSelect">
        Cartella di
        <select
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.surname}
            </option>
          ))}
        </select>
      </label>
      {people.length ? (
        <div className="documentList">
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
                    <button
                      onClick={() => remove(type)}
                      aria-label={`Rimuovi ${label}`}
                    >
                      <Trash2 />
                    </button>
                  </>
                ) : (
                  <label>
                    {busy === type ? "Invio…" : "Carica"}
                    <input
                      type="file"
                      accept="application/pdf,image/*,.heic,.heif"
                      onChange={(e) => upload(type, e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          icon={Users}
          title="Manca il viaggiatore"
          text="Aggiungi prima una persona nella sezione Gruppo."
        />
      )}
      <div className="locationPanel">
        <MapPin />
        <div>
          <b>Posizione condivisa</b>
          <small>Aggiornamento volontario, visibile a tutto il gruppo.</small>
        </div>
        <button onClick={locate} disabled={!profileId}>
          Aggiorna ora
        </button>
      </div>
      <div className="locationList">
        {privateData.locations.map((x) => (
          <a
            key={x.profile_id}
            href={`https://www.openstreetmap.org/?mlat=${x.latitude}&mlon=${x.longitude}#map=15/${x.latitude}/${x.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            <b>{x.display_name}</b>
            <span>
              {Number(x.latitude).toFixed(4)}, {Number(x.longitude).toFixed(4)}
            </span>
            <small>{new Date(x.updated_at).toLocaleString("it-IT")}</small>
          </a>
        ))}
      </div>
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

function UnlockCard({ code, setCode, onUnlock, text }) {
  return (
    <div className="lockedComposer">
      <div className="lockMini">
        <LockKeyhole />
      </div>
      <div>
        <b>Accesso del gruppo</b>
        <small>{text}</small>
      </div>
      <input
        type="password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Codice gruppo"
        onKeyDown={(e) => e.key === "Enter" && onUnlock()}
      />
      <button onClick={onUnlock}>Sblocca</button>
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
