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
} from "./icons.jsx";
import "./styles.css";

const VERSION = "1.10.0",
  API = "/api";
async function verifyGroupCode(code, setGroupCode) {
  const response = await fetch(`${API}/private`, {
    headers: { "x-group-code": code },
    cache: "no-store",
  });
  if (!response.ok) return false;
  setGroupCode(code);
  return true;
}
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
  "Delhi-arrival": [
    [28.5562, 77.1],
    [28.5535, 77.2588],
    [28.6127, 77.2295],
    [28.6315, 77.2167],
  ],
  "Delhi-old-city": [
    [28.5355, 77.278],
    [28.6562, 77.241],
    [28.6506, 77.2303],
    [28.6507, 77.2334],
    [28.6315, 77.2167],
  ],
  "Udaipur-local": [
    [24.5854, 73.7125],
    [24.5764, 73.6835],
    [24.572, 73.675],
    [24.5938, 73.6398],
    [24.6031, 73.6853],
    [24.5854, 73.7125],
  ],
  "Jodhpur-local": [
    [26.2389, 73.0243],
    [26.298, 73.018],
    [26.289, 73.024],
    [26.281, 73.018],
    [26.2389, 73.0243],
  ],
  "Jaipur-local": [
    [26.9124, 75.7873],
    [26.916, 75.859],
    [26.9855, 75.8513],
    [26.926, 75.8235],
    [26.9124, 75.7873],
  ],
  "Varanasi-ghats": [
    [25.3176, 82.9739],
    [25.3109, 83.0107],
    [25.306, 83.011],
    [25.282, 83.006],
    [25.3176, 82.9739],
  ],
  "Varanasi-river": [
    [25.3109, 83.0107],
    [25.323, 83.021],
    [25.337, 83.026],
    [25.3176, 82.9739],
  ],
  "Delhi-finale": [
    [28.6139, 77.209],
    [28.5933, 77.2507],
    [28.6127, 77.2773],
    [28.5562, 77.1],
  ],
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
    path: "Delhi-arrival",
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
    path: "Delhi-old-city",
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
    path: "Udaipur-local",
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
    path: "Jodhpur-local",
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
    path: "Jaipur-local",
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
    path: "Varanasi-ghats",
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
    path: "Varanasi-river",
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

function TripMap({ selectedDay, onSelect, onReady }) {
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
      map.current.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right",
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
            "line-width": 9,
            "line-opacity": 0.28,
            "line-blur": 2,
          },
        });
        map.current.addLayer({
          id: "trip-route-road",
          type: "line",
          source: "trip-route",
          filter: ["==", ["get", "mode"], "road"],
          paint: {
            "line-color": "#ed6a24",
            "line-width": 5,
            "line-opacity": 1,
          },
        });
        map.current.addLayer({
          id: "trip-route-transit",
          type: "line",
          source: "trip-route",
          filter: ["==", ["get", "mode"], "transit"],
          paint: {
            "line-color": "#ed6a24",
            "line-width": 4,
            "line-dasharray": [2, 2],
          },
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
    const visibleMarkerIndexes =
      selectedDay == null
        ? sequence.map((_, i) => i)
        : dayMarkerIndexes[selectedDay];
    sequence.forEach((name, i) => {
      if (!visibleMarkerIndexes.includes(i)) return;
      const active = Boolean(day);
      const node = document.createElement("button");
      node.className = `vectorMarker ${active ? "active" : ""}`;
      node.textContent = String(i + 1);
      node.setAttribute("aria-label", `Tappa ${i + 1}: ${name}`);
      node.onclick = () => onSelect?.(days.findIndex((d) => d.city === name));
      const [lat, lng] = places[name];
      const marker = new maplibregl.Marker({
        element: node,
        anchor: "center",
        offset:
          selectedDay == null && name === "Delhi"
            ? [i === 0 ? -16 : 16, 0]
            : [0, 0],
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
      const transit = ["Aereo", "Treno", "Treno notturno"].includes(
        day.transport,
      );
      features =
        coords.length > 1 ? [line(coords, transit ? "transit" : "road")] : [];
      fitPoints = coords;
    } else {
      features = [
        line([places.Delhi, places.Udaipur], "transit"),
        line(roadPaths["Udaipur-Jodhpur"]),
        line(roadPaths["Jodhpur-Jaipur"]),
        line(roadPaths["Jaipur-Agra"]),
        line([places.Agra, places.Varanasi], "transit"),
        line([places.Varanasi, places.Delhi], "transit"),
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
        padding: { top: 55, right: 45, bottom: 100, left: 45 },
        maxZoom: day ? (day.from === day.to ? 11 : 7.2) : 5.2,
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
  }, [selectedDay, ready]);
  return (
    <div className="realMapWrap">
      <div
        className="realMap"
        ref={el}
        aria-label="Mappa interattiva reale dell’itinerario in India"
      />
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
      mapRef.current.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right",
      );
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

function App() {
  const initialParams = new URLSearchParams(location.search);
  const initialDay = Math.max(
    0,
    Math.min(days.length - 1, Number(initialParams.get("day") || 1) - 1),
  );
  const startsOnMap = initialParams.get("view") === "map";
  const navigationOriginRef = useRef(
    (() => {
      try {
        return JSON.parse(sessionStorage.getItem("india-map-origin"));
      } catch {
        return null;
      }
    })(),
  );
  const [tab, setTab] = useState(startsOnMap ? "map" : "diary"),
    [done, setDone] = useState(() => load("india-done", {})),
    [posts, setPosts] = useState(() => load("india-posts", [])),
    [people, setPeople] = useState(() => load("india-people", [])),
    [open, setOpen] = useState(initialDay),
    [selectedDay, setSelectedDay] = useState(0),
    [mapDay, setMapDay] = useState(startsOnMap ? initialDay : null),
    [vaultProfileId, setVaultProfileId] = useState(""),
    [composeOpen, setComposeOpen] = useState(false),
    [notificationOpen, setNotificationOpen] = useState(false),
    [quickProfileOpen, setQuickProfileOpen] = useState(false),
    [quickStatus, setQuickStatus] = useState(""),
    [groupCode, setGroupCode] = useState(
      () => localStorage.getItem("india-group-code") || "",
    ),
    [syncing, setSyncing] = useState(false),
    [syncError, setSyncError] = useState(""),
    [lastSync, setLastSync] = useState(null);
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
      setSyncing(true);
      setSyncError("");
      const r = await fetch(`${API}/state`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!r.ok) throw Error();
      const d = await r.json();
      setPosts(d.posts || []);
      setPeople(d.profiles || []);
      localStorage.setItem("india-posts", JSON.stringify(d.posts || []));
      localStorage.setItem("india-people", JSON.stringify(d.profiles || []));
      setLastSync(new Date());
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
      setSyncError(
        navigator.onLine
          ? "Sincronizzazione non riuscita · Tocca per riprovare"
          : "Connessione assente · I dati salvati restano disponibili",
      );
      console.error("india-sync", error);
    } finally {
      clearTimeout(timeout);
      setSyncing(false);
    }
  };
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
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
    if (groupCode) localStorage.setItem("india-group-code", groupCode);
  }, [groupCode]);
  const completed = useMemo(
    () => Object.values(done).filter(Boolean).length,
    [done],
  );
  const activeProfileId =
    vaultProfileId || localStorage.getItem("india-profile-id") || "";
  const storedVisitorName = (
    localStorage.getItem("india-visitor-name") || ""
  ).trim().toLowerCase();
  const currentProfile =
    people.find((person) => person.id === activeProfileId) ||
    people.find(
      (person) =>
        `${person.name} ${person.surname || ""}`.trim().toLowerCase() ===
          storedVisitorName ||
        person.name.trim().toLowerCase() === storedVisitorName,
    );
  useEffect(() => {
    if (!currentProfile) return;
    localStorage.setItem("india-profile-id", currentProfile.id);
    localStorage.setItem(
      "india-visitor-name",
      `${currentProfile.name} ${currentProfile.surname || ""}`.trim(),
    );
  }, [currentProfile?.id]);
  const quickShareLocation = () => {
    if (!currentProfile || !groupCode) return;
    setQuickStatus("Cerco la posizione…");
    navigator.geolocation?.getCurrentPosition(
      async (position) => {
        const response = await fetch(`${API}/locations`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-group-code": groupCode,
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
    if (!currentProfile || !groupCode) return;
    const response = await fetch(`${API}/locations/${currentProfile.id}`, {
      method: "DELETE",
      headers: { "x-group-code": groupCode },
    });
    setQuickStatus(
      response.ok ? "Posizione cancellata." : "Cancellazione non riuscita.",
    );
  };
  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      setQuickStatus("Notifiche non supportate su questo dispositivo.");
      return;
    }
    const permission = await Notification.requestPermission();
    localStorage.setItem("india-notifications", permission);
    setQuickStatus(
      permission === "granted"
        ? "Notifiche attivate."
        : "Notifiche non autorizzate.",
    );
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
  return (
    <div className="app">
      <header className="hero">
        <div className="heroShade" />
        <div className="top">
          <span className="flag">🇮🇳</span>
          <span className="versionBadge">REV {VERSION}</span>
          <button
            className={`accessPill ${groupCode ? "unlocked" : ""}`}
            onClick={() => {
              setQuickProfileOpen(!quickProfileOpen);
              setNotificationOpen(false);
            }}
          >
            <CircleUserRound size={15} />
            {currentProfile?.name || (groupCode ? "Profilo" : "Pubblico")}
          </button>
          <button
            className="headerIcon"
            aria-label="Notifiche"
            onClick={() => setNotificationOpen(!notificationOpen)}
          >
            <Bell size={18} />
            {syncing && <span className="syncDot" />}
            {posts.length > 0 && (
              <span className="notificationBadge">{Math.min(posts.length, 9)}</span>
            )}
          </button>
        </div>
        {syncError && (
          <button className="syncErrorToast" onClick={refresh}>
            Connessione non aggiornata · Riprova
          </button>
        )}
        {notificationOpen && (
          <div className="notificationPanel">
            <div>
              <b>Notifiche del viaggio</b>
              <button
                aria-label="Chiudi notifiche"
                onClick={() => setNotificationOpen(false)}
              >
                ×
              </button>
            </div>
            {posts.slice(0, 3).map((post) => (
              <button
                key={post.id}
                onClick={() => {
                  setSelectedDay(Number(post.day_index) || 0);
                  setTab("diary");
                  setNotificationOpen(false);
                }}
              >
                <span className="avatar">
                  {post.author_name?.[0]?.toUpperCase() || "I"}
                </span>
                <span>
                  <b>{post.author_name}</b>
                  <small>
                    Nuovo ricordo · {days[post.day_index]?.city || "India"}
                  </small>
                </span>
              </button>
            ))}
            {!posts.length && <small>Nessuna nuova attività.</small>}
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
                <small>{groupCode ? "Dispositivo sbloccato" : "Accesso pubblico"}</small>
              </div>
              <button
                aria-label="Chiudi pannello personale"
                onClick={() => setQuickProfileOpen(false)}
              >
                ×
              </button>
            </div>
            {currentProfile ? (
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
                  <ShieldCheck /> Documenti e sicurezza
                </button>
                <button onClick={enableNotifications}>
                  <Bell /> Attiva notifiche
                </button>
              </div>
            ) : (
              <div className="profileChooser">
                <b>Collega questo telefono al tuo profilo</b>
                <small>Non devi creare nuovamente il viaggiatore.</small>
                {people.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => {
                      localStorage.setItem("india-profile-id", person.id);
                      localStorage.setItem(
                        "india-visitor-name",
                        `${person.name} ${person.surname || ""}`.trim(),
                      );
                      setVaultProfileId(person.id);
                      setQuickStatus(`Telefono collegato a ${person.name}.`);
                    }}
                  >
                    <span className="avatar">
                      {person.name?.[0]?.toUpperCase() || "?"}
                    </span>
                    {person.name} {person.surname || ""}
                  </button>
                ))}
                <button
                  className="chooseProfileButton"
                  onClick={() => {
                    setTab("people");
                    setQuickProfileOpen(false);
                  }}
                >
                  Crea un nuovo viaggiatore
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
            onClick={() => {
              if (id === "publish") {
                setTab("diary");
                setComposeOpen(true);
              } else {
                if (id === "map") showMap(null);
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
              <button className="progress" onClick={() => setDone({})}>
                <b>{completed}</b>
                <small>spuntate</small>
              </button>
            </div>
            <div className="diaryNavigator">
              <button
                aria-label="Giorno precedente"
                disabled={open === 0}
                onClick={() => setOpen(Math.max(0, open - 1))}
              >
                ←
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
                →
              </button>
            </div>
            <div className="diaryDayPicker" aria-label="Seleziona la giornata">
              {days.map((day, index) => (
                <button
                  key={index}
                  className={open === index ? "active" : ""}
                  aria-pressed={open === index}
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
                </button>
              ))}
            </div>
            <div className="dayList">
              {days.map((d, i) => (
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
                            setSelectedDay(i);
                            setTab("diary");
                            setComposeOpen(true);
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
              ))}
            </div>
          </section>
        )}
        {tab === "map" && (
          <MapSection
            selectedDay={mapDay}
            setSelectedDay={setMapDay}
            onBack={returnFromMap}
          />
        )}{" "}
        {tab === "diary" && (
          <Diary
            posts={posts}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            groupCode={groupCode}
            setGroupCode={setGroupCode}
            refresh={refresh}
            composeOpen={composeOpen}
            setComposeOpen={setComposeOpen}
            deviceProfileName={
              currentProfile
                ? `${currentProfile.name} ${currentProfile.surname || ""}`.trim()
                : ""
            }
          />
        )}{" "}
        {tab === "people" && (
          <People
            people={people}
            groupCode={groupCode}
            setGroupCode={setGroupCode}
            refresh={refresh}
            onOpenPrivate={(profileId) => {
              setVaultProfileId(profileId);
              setTab("vault");
            }}
          />
        )}{" "}
        {tab === "vault" && (
          <VaultOnline
            people={people}
            groupCode={groupCode}
            setGroupCode={setGroupCode}
            onOpenGroup={() => setTab("people")}
            preferredProfileId={vaultProfileId}
          />
        )}
      </main>
    </div>
  );
}

function MapSection({ selectedDay, setSelectedDay, onBack }) {
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
  useEffect(() => {
    const handleResize = () => placeMapInUsableViewport();
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
    <section className="mapSection">
      {onBack && (
        <button className="mapBack" onClick={onBack}>
          ← Torna al Diario{selectedDay != null ? ` · Giorno ${selectedDay + 1}` : ""}
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
          onSelect={(i) => i >= 0 && focusMap(i)}
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
  selectedDay,
  setSelectedDay,
  groupCode,
  setGroupCode,
  refresh,
  composeOpen,
  setComposeOpen,
  deviceProfileName,
}) {
  const today = new Date();
  const tripStart = new Date("2026-08-10T00:00:00+05:30");
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
    [feedFilter, setFeedFilter] = useState("all");
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
  const addFiles = (incoming) => {
    const selected = Array.from(incoming || []);
    setFiles((current) => {
      const total = current.length + selected.length;
      if (total > 10) {
        setFileStatus(
          `Puoi caricare massimo 10 contenuti per volta. Hai selezionato ${total} elementi.`,
        );
        return current;
      }
      setFileStatus("");
      return [...current, ...selected];
    });
  };
  const visiblePosts = posts.filter((p) => {
    if (feedFilter === "all") return true;
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
    if (!groupCode || (!text.trim() && !files.length)) return;
    setBusy(true);
    try {
      const f = new FormData();
      f.set("author_name", author || "Viaggiatore");
      f.set("day_index", selectedDay);
      f.set("text", text);
      files.forEach((file) => f.append("files", file));
      const r = await fetch(`${API}/posts`, {
        method: "POST",
        headers: { "x-group-code": groupCode },
        body: f,
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error);
      setText("");
      localStorage.removeItem("india-draft");
      setFiles([]);
      setFileStatus("");
      await refresh();
      setComposeOpen(false);
    } catch (e) {
      setFileStatus(e.message || "Pubblicazione non riuscita.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section>
      <span className="eyebrow">SOCIAL DEL VIAGGIO</span>
      <h2>Raccontiamola insieme</h2>
      <button className="liveStatus" onClick={() => setSelectedDay(liveIndex)}>
        <span className="liveDot" />
        <div>
          <small>
            {today < tripStart ? "PROSSIMA TAPPA" : "DOVE SIAMO ORA"}
          </small>
          <b>
            {liveDay.city} · Giorno {liveIndex + 1}
          </b>
          <span>{liveDay.title}</span>
        </div>
        <MapPinned />
      </button>
      {author && !editingName ? (
        <div className="identityBar">
          <div className="avatar">{author[0].toUpperCase()}</div>
          <div>
            <small>STAI PARTECIPANDO COME</small>
            <b>{author}</b>
          </div>
          <button onClick={() => setEditingName(true)}>Modifica</button>
        </div>
      ) : (
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
                <AudioRecorder
                  onRecorded={(recordedFile) => addFiles([recordedFile])}
                />
                <div className="composerActions">
                  <label>
                    <ImageIcon /> Galleria
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </label>
                  <label>
                    <Camera /> Video
                    <input
                      type="file"
                      accept="video/*,.mov,.mp4"
                      multiple
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </label>
                  <label>
                    <Mic /> Audio
                    <input
                      type="file"
                      accept="audio/*,.m4a,.aac"
                      multiple
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </label>
                  <button disabled={busy} onClick={add}>
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
            ) : (
              <UnlockCard
                code={code}
                setCode={setCode}
                onUnlock={() => verifyGroupCode(code, setGroupCode)}
                text="I familiari possono commentare. Il codice serve per pubblicare foto, video e audio."
              />
            )}
          </div>
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
        const blob = new Blob(chunksRef.current, { type });
        onRecorded(
          new File([blob], `voce-${new Date().toISOString().slice(0, 19)}.webm`, {
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
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [items.length]);
  if (!items.length) return null;
  const visualItems = items.filter(
    (item) => !item.media_type?.startsWith("audio"),
  );
  const audioItems = items.filter((item) =>
    item.media_type?.startsWith("audio"),
  );
  const current = visualItems[Math.min(active, visualItems.length - 1)];
  return (
    <div className="postMediaCollection">
      {audioItems.map((audioItem, index) => (
        <div className="audioCard" key={audioItem.id || audioItem.media_url}>
          <Mic />
          <div>
            <b>Messaggio vocale {index + 1}</b>
            <small>Premi Play qui per ascoltare l’audio</small>
          </div>
          <audio controls preload="metadata" src={audioItem.media_url} />
        </div>
      ))}
      {current && (
        <div className="postMediaCarousel">
          {current.media_type?.startsWith("image") && (
            <img src={current.media_url} alt="Ricordo del viaggio" loading="lazy" />
          )}
          {current.media_type?.startsWith("video") && (
            <>
              <span className="mediaTypeLabel">VIDEO</span>
              <video controls playsInline preload="metadata" src={current.media_url} />
            </>
          )}
          {visualItems.length > 1 && (
            <>
              <span className="mediaCounter">
                {active + 1}/{visualItems.length}
              </span>
              <button
                className="mediaPrev"
                disabled={active === 0}
                onClick={() => setActive((index) => Math.max(0, index - 1))}
                aria-label="Contenuto precedente"
              >
                ‹
              </button>
              <button
                className="mediaNext"
                disabled={active === visualItems.length - 1}
                onClick={() =>
                  setActive((index) =>
                    Math.min(visualItems.length - 1, index + 1),
                  )
                }
                aria-label="Contenuto successivo"
              >
                ›
              </button>
              <div className="mediaDots">
                {visualItems.map((_, index) => (
                  <button
                    key={index}
                    className={active === index ? "active" : ""}
                    onClick={() => setActive(index)}
                    aria-label={`Vai al contenuto ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Post({ p, author, groupCode, refresh }) {
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
    [showAllComments, setShowAllComments] = useState(false);
  const replyInputRef = useRef(null);
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
    await fetch(`${API}/reactions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        post_id: p.id,
        visitor_id: visitor(),
        author_name: reactionAuthor,
        kind,
      }),
    });
    refresh();
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
      const r = await fetch(`${API}/comments`, { method: "POST", body: f });
      if (!r.ok) {
        const response = await r.json().catch(() => ({}));
        throw Error(
          response.error || "Commento non inviato. Tocca per riprovare.",
        );
      }
      setComment("");
      setReplyFile(null);
      await refresh();
      setCommentStatus("Commento pubblicato.");
    } catch (error) {
      setCommentStatus(
        error.message || "Commento non inviato. Tocca per riprovare.",
      );
    } finally {
      setSendingComment(false);
    }
  };
  const saveCommentEdit = async (commentId) => {
    const response = await fetch(`${API}/comments/${commentId}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...(groupCode ? { "x-group-code": groupCode } : {}),
      },
      body: JSON.stringify({
        text: editingCommentText,
        visitor_id: visitor(),
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
  const remove = async () => {
    const r = await fetch(`${API}/posts/${p.id}`, {
      method: "DELETE",
      headers: { "x-group-code": groupCode },
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
  return (
    <article className="post" data-scroll-anchor={`post-${p.id}`}>
      <div className="postTop">
        <div className="avatar">{p.author_name?.[0] || "V"}</div>
        <div>
          <b>{p.author_name}</b>
          <small>
            Giorno {Number(p.day_index) + 1} · {days[p.day_index]?.city}
          </small>
        </div>
        {groupCode && (
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
        {(showAllComments ? p.comments || [] : (p.comments || []).slice(-2)).map((x) => (
          <div className="comment" key={x.id}>
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
                  <button onClick={() => saveCommentEdit(x.id)}>Salva</button>
                  <button onClick={() => setEditingCommentId("")}>Annulla</button>
                </div>
              ) : (
                <>
                  {x.text && <span>{x.text}</span>}
                  {(groupCode || x.visitor_id === visitor()) && x.text && (
                    <button
                      className="editCommentButton"
                      onClick={() => {
                        setEditingCommentId(x.id);
                        setEditingCommentText(x.text || "");
                      }}
                    >
                      Modifica
                    </button>
                  )}
                </>
              )}
            </div>
            {x.media_type?.startsWith("audio") && (
              <audio controls src={x.media_url} />
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
        {p.comments?.length > 2 && (
          <button
            className="allComments"
            onClick={() => setShowAllComments(!showAllComments)}
          >
            {showAllComments
              ? "Mostra soltanto gli ultimi commenti"
              : `Visualizza tutti i ${p.comments.length} commenti`}
          </button>
        )}
        <div className="reply">
          <input
            ref={replyInputRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={author ? "Rispondi…" : "Inserisci il tuo nome sopra"}
          />
          <label title="Aggiungi foto, video o audio">
            <Paperclip />
            <input
              type="file"
              accept="image/*,video/*,audio/*,.heic,.heif,.mov,.mp4,.m4a,.aac"
              onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
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
    </article>
  );
}

function People({
  people,
  groupCode,
  setGroupCode,
  refresh,
  onOpenPrivate,
}) {
  const [form, setForm] = useState({
      name: "",
      surname: "",
      age: "",
      job: "",
      bio: "",
    }),
    [avatar, setAvatar] = useState(null),
    [code, setCode] = useState(""),
    [saving, setSaving] = useState(false),
    [formStatus, setFormStatus] = useState({ type: "", text: "" }),
    [editingId, setEditingId] = useState("");
  const add = async () => {
    if (!form.name.trim()) {
      setFormStatus({ type: "error", text: "Inserisci almeno il nome." });
      return;
    }
    if (!groupCode || saving) return;
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
        headers: { "x-group-code": groupCode },
        body: f,
        },
      );
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "Salvataggio non riuscito");
      const currentId = editingId || result.id;
      localStorage.setItem("india-profile-id", currentId);
      localStorage.setItem(
        "india-visitor-name",
        `${form.name} ${form.surname}`.trim(),
      );
      setForm({ name: "", surname: "", age: "", job: "", bio: "" });
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
      {groupCode ? (
        <div className="profileForm">
          {editingId && (
            <div className="editingProfile">
              <b>Stai modificando questo viaggiatore</b>
              <button
                onClick={() => {
                  setEditingId("");
                  setForm({ name: "", surname: "", age: "", job: "", bio: "" });
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
      ) : (
        <UnlockCard
          code={code}
          setCode={setCode}
          onUnlock={() => verifyGroupCode(code, setGroupCode)}
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
            {groupCode && (
              <div className="profileActions">
                <button
                  onClick={() => {
                    setEditingId(x.id);
                    setForm({
                      name: x.name || "",
                      surname: x.surname || "",
                      age: x.age || "",
                      job: x.job || "",
                      bio: x.bio || "",
                    });
                    setAvatar(null);
                    document.querySelector(".profileForm")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                >
                  Modifica profilo
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("india-profile-id", x.id);
                    localStorage.setItem(
                      "india-visitor-name",
                      `${x.name} ${x.surname || ""}`.trim(),
                    );
                    onOpenPrivate(x.id);
                  }}
                >
                  <ShieldCheck /> Documenti e posizione
                </button>
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
  setGroupCode,
  onOpenGroup,
  preferredProfileId,
}) {
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
    if (preferredProfileId && people.some((p) => p.id === preferredProfileId)) {
      setProfileId(preferredProfileId);
      localStorage.setItem("india-profile-id", preferredProfileId);
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
  }, [people, preferredProfileId]);
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
  const removeLocation = async (targetProfileId) => {
    const response = await fetch(`${API}/locations/${targetProfileId}`, {
      method: "DELETE",
      headers: { "x-group-code": groupCode },
    });
    if (response.ok) refresh();
  };
  const lockDevice = () => {
    localStorage.removeItem("india-group-code");
    setGroupCode("");
  };
  if (!groupCode)
    return (
      <section>
        <span className="eyebrow">AREA RISERVATA</span>
        <h2>La base del gruppo</h2>
        <UnlockCard
          code={code}
          setCode={setCode}
          onUnlock={() => verifyGroupCode(code, setGroupCode)}
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
      <div className="privateTop">
        <div className="privateBadge">
          <ShieldCheck /> Dispositivo sbloccato
        </div>
        <button onClick={lockDevice}>
          <LockKeyhole /> Blocca
        </button>
      </div>
      {people.length > 0 && (
        <label className="personSelect">
          Chi sei?
          <select
            value={profileId}
            onChange={(e) => {
              setProfileId(e.target.value);
              localStorage.setItem("india-profile-id", e.target.value);
              const selectedPerson = people.find(
                (person) => person.id === e.target.value,
              );
              if (selectedPerson)
                localStorage.setItem(
                  "india-visitor-name",
                  `${selectedPerson.name} ${selectedPerson.surname || ""}`.trim(),
                );
            }}
          >
            <option value="">Seleziona il tuo profilo</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.surname}
              </option>
            ))}
          </select>
        </label>
      )}
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
        <button onClick={locate} disabled={!profileId}>
          Aggiorna ora
        </button>
      </div>
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
              {x.profile_id === profileId && (
                <button onClick={() => removeLocation(x.profile_id)}>
                  Cancella posizione
                </button>
              )}
            </div>
          </article>
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
  const [error, setError] = useState("");
  const unlock = async () => {
    setError("");
    if (!(await onUnlock())) setError("Codice non corretto");
  };
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
        onKeyDown={(e) => e.key === "Enter" && unlock()}
      />
      <button onClick={unlock}>Sblocca</button>
      {error && <small className="unlockError">{error}</small>}
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
