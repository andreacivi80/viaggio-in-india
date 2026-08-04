# Bozza piano d'azione — India, Wi-Fi debole e reti mobili

Stato: bozza tecnica, nessuna modifica applicativa inclusa nella revisione 1.37.14.

## Obiettivo

Garantire che l'app resti consultabile e non perda foto, commenti, documenti o posizione quando il telefono:

- passa da Wi-Fi a rete mobile o cambia SIM;
- vede una rete Wi-Fi collegata ma senza Internet o con captive portal;
- usa una connessione lenta, intermittente o con latenza elevata;
- va in standby, chiude la scheda o termina il browser durante un invio;
- dispone di pochi dati, poca memoria o poca batteria.

Il computer di sviluppo non è coinvolto: applicazione, API e dati restano su Cloudflare.

## Base già presente

- applicazione pubblicata su Cloudflare Pages e API lato server;
- Service Worker per riaprire l'interfaccia già visitata;
- coda IndexedDB per richieste non inviate;
- chiavi di idempotenza contro duplicazioni dopo un retry;
- caricamento riprendibile per file grandi, diviso oggi in parti da 4 MB;
- retry progressivo fino a cinque tentativi;
- controllo di sincronizzazione al ritorno online e al ritorno nell'app;
- API e dati privati esclusi dalla cache pubblica.

## Rischi ancora da trattare

1. `navigator.onLine` non prova che il server sia raggiungibile: un captive portal può produrre un falso “online”.
2. Un blocco da 4 MB può fallire ripetutamente su una rete molto instabile.
3. Il browser può sospendere il JavaScript quando schermo o app vengono chiusi; non si può promettere l'invio in background su ogni Samsung/iPhone.
4. IndexedDB può essere limitato o eliminato dal sistema in modalità privata, con spazio quasi esaurito o sotto pressione di memoria.
5. Foto HEIC, video e audio originali possono consumare molti GB in roaming.
6. Mappe, ricerca località, navigazione e reverse geocoding richiedono rete; il solo GPS può invece produrre coordinate anche senza dati.
7. I documenti privati non sono deliberatamente messi nella cache offline: oggi senza rete non sono consultabili.
8. Più dispositivi che aggiornano insieme richiedono controllo di versione e conferma server, non soltanto ottimismo dell'interfaccia.

## Livello 1 — bloccante prima della partenza

Implementazione proposta:

1. Stato rete a tre livelli: **online verificato**, **rete instabile**, **offline**, basato su una chiamata leggera a `/api/health` e non sul solo telefono.
2. Indicatore silenzioso ma apribile con: elementi in attesa, ultimo invio riuscito, ultimo sync e pulsante “Riprova ora”.
3. Coda persistente con stati `in attesa / invio / inviato / da controllare`; niente rimozione locale prima della conferma server.
4. Ripresa automatica dopo cambio rete, riapertura app e ritorno in primo piano.
5. Upload adattivo: parti più piccole su rete instabile, retry con backoff e casualità, ripresa dal primo blocco mancante.
6. Modalità **Risparmio dati**: comprime le foto, genera anteprima, blocca autoplay e chiede conferma per video/audio pesanti.
7. Avviso preventivo di dimensione e consumo stimato prima dell'invio.
8. Nessun caricamento grande dichiarato concluso finché il server non conferma dimensione, parti e checksum.
9. Conflitti: versione server autorevole, operazioni idempotenti e refresh mirato dopo ogni scrittura.
10. Posizione: data/ora e precisione sempre visibili; una posizione vecchia non deve apparire come attuale.
11. Rimozione posizione confermata dal server e riflessa subito sugli altri dispositivi.
12. Sessione: riconvalida silenziosa al ritorno online; se scaduta, coda conservata e richiesta di nuovo accesso senza perdere il contenuto.
13. Mappa di emergenza leggera pre-caricata con itinerario, città, hotel e recapiti, utilizzabile anche senza tile online.
14. Schermata “Prima di partire” che verifica spazio locale, Service Worker, sessione, rete, permessi e apertura dei documenti.
15. Aggiornamenti applicativi atomici: la nuova versione entra al riavvio controllato e non interrompe un upload in corso.

Gate Livello 1 proposto: **24 prove, 24/24 obbligatorie** su S20 FE, Samsung meno recente e iPhone/Safari reale o dispositivo remoto equivalente.

Scenari L1 principali:

- primo accesso e riapertura senza computer acceso;
- Wi-Fi → dati mobili → Wi-Fi durante foto, video, audio e PDF;
- perdita rete a ogni blocco di upload e ripresa senza duplicati;
- captive portal e falso online;
- standby/riapertura durante invio;
- spazio IndexedDB insufficiente;
- sessione scaduta con contenuto già in coda;
- due telefoni che pubblicano e cancellano contemporaneamente;
- posizione aggiornata, vecchia e rimossa;
- aggiornamento versione con dati e upload pendenti;
- apertura offline dell'interfaccia, itinerario, hotel e recapiti essenziali;
- verifica che dati/documenti privati non entrino nella cache pubblica.

## Livello 2 — robustezza e consumo

1. Compressione adattiva per immagini e video con scelta “originale / risparmio dati”.
2. Priorità coda: testo e posizione prima, poi foto, audio, video e documenti grandi.
3. Pausa/riprendi/annulla per ogni allegato e retry manuale del solo elemento fallito.
4. Stima tempo residuo basata sulla velocità realmente osservata.
5. Protezione batteria: niente polling aggressivo e niente GPS continuo non richiesto.
6. Precaricamento selettivo della giornata corrente e successiva, non di tutta la galleria.
7. Anteprime leggere nel social; file originale scaricato solo al tocco.
8. Download completo al rientro separato dal normale uso del viaggio.
9. Telemetria tecnica anonima minima: errori, latenza, retry e code bloccate, mai documenti o coordinate.
10. Procedura di recupero visibile se il browser cancella dati locali.

Gate Livello 2 proposto: **20 prove, 20/20 obbligatorie** su reti simulate 2G/3G, latenza 800–1500 ms, perdita pacchetti, banda limitata e cambi di rete ripetuti.

## Cosa non promettere

- Un sito chiuso dal sistema operativo non può garantire attività illimitata in background su tutti i browser. Background Sync è un miglioramento progressivo, non la sola garanzia.
- Il GPS senza dati può trovare coordinate, ma mappa, nome del luogo e navigazione possono richiedere Internet o mappe offline esterne.
- Per rendere disponibili offline passaporti e visti serve una funzione separata con cifratura locale, consenso esplicito e revoca; non vanno inseriti nella cache ordinaria.

## Ordine di lavoro proposto

1. Fotografare lo stato attuale con i 24 test L1, senza modifiche.
2. Implementare rilevazione server, stato coda e ripresa affidabile.
3. Rendere adattivi upload e risparmio dati.
4. Aggiungere mappa/recapiti essenziali offline.
5. Eseguire 24/24 L1; pubblicare solo a esito completo.
6. Implementare ed eseguire i 20 test L2.
7. Riprendere la matrice generale già pianificata, mantenendo L1 come regressione obbligatoria a ogni revisione.

## Riferimenti tecnici

- Cloudflare Pages, caching e distribuzione: https://developers.cloudflare.com/pages/configuration/serving-pages/
- Cloudflare R2, upload multipart e ripresa: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2multipartupload-definition
- MDN, funzionamento offline e in background delle PWA: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
- MDN, Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
