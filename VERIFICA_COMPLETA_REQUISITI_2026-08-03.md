# Verifica completa dei requisiti — India Insieme

Data verifica: 3 agosto 2026  
Versione pubblicata verificata: **1.15.0** (`0f4d870`)  
Versione locale non pubblicata e congelata: **1.16.0**  
URL verificato: https://viaggio-in-india-2026.pages.dev/

## Regole della verifica

- **OK REALE**: presente nel codice, collegato al server quando necessario e provato.
- **PARZIALE**: esiste, ma non soddisfa tutto il requisito.
- **NON ESEGUITO**: assente o soltanto segnaposto.
- **NON VERIFICABILE**: richiede un dispositivo, una rete o una condizione fisica non disponibile durante questa verifica.

Sono stati riletti integralmente i dieci documenti unici allegati alla conversazione. Il file `1559af9d...` è un duplicato identico del file `dbcd019d...`. Le richieste ripetute sono state consolidate senza eliminarne il contenuto.

## 1. Sorgente, pubblicazione e continuità del servizio

| Requisito | Stato | Prova / limite |
|---|---|---|
| GitHub come sorgente del progetto | OK REALE | Repository `andreacivi80/viaggio-in-india`, branch `main`, commit remoto e locale `0f4d870`. |
| Link neutro senza nome/maila dell'autore | OK REALE | Dominio pubblico `viaggio-in-india-2026.pages.dev`. |
| Frontend cloud con computer spento | OK REALE | Cloudflare Pages risponde HTTPS 200; nessun riferimento a localhost, IP privati o percorsi Windows nel sorgente. |
| API cloud sempre disponibili | OK REALE | `/api/state` restituisce JSON da Pages Functions. |
| Database remoto | OK REALE | Cloudflare D1 `viaggio-in-india-db`, ID verificato. |
| Archivio multimediale remoto | OK REALE, CON LIMITE | Cloudflare KV `MEDIA`; non R2. R2 non è stato abilitato. |
| HTTPS e certificato | OK REALE | Risposta Cloudflare HTTPS con header di sicurezza di base. |
| Aggiornamenti con revisione visibile | OK REALE | `REV 1.15.0` visibile in alto; cache del Service Worker passa a 1.15 dopo aggiornamento/ricarica. |
| Aggiornamenti senza perdita dei dati D1/KV | PARZIALE | I deploy non cancellano D1/KV; manca migrazione versionata, backup documentato e rollback automatico. |
| Deploy automatico da GitHub a Cloudflare | NON ESEGUITO | GitHub esegue soltanto build/test. I deploy Cloudflare sono attualmente manuali. |
| Backup e ripristino provati | NON ESEGUITO | Nessuna procedura/test documentato. |
| Monitoraggio errori e allarmi | NON ESEGUITO | Nessun Sentry/monitor operativo. |
| Accesso reale dall'India | NON VERIFICABILE | Non è stato eseguito da rete indiana. |
| Prova continuativa 48 ore con PC spento | NON VERIFICABILE | Da pianificare fisicamente prima della partenza. |

## 2. Itinerario, giornate e Diario di bordo

| Requisito | Stato | Prova / limite |
|---|---|---|
| Itinerario 10–23 agosto, 14 giornate | OK REALE | Dati presenti per Delhi, Udaipur, Ranakpur, Jodhpur, Jaipur, Agra, Varanasi e rientro Delhi. |
| Foto di copertina per le città | OK REALE, CON LIMITE | Presenti tramite Unsplash; dipendono da un servizio esterno e non sono garantite offline/India. |
| Programma, obiettivo, mezzo, distanza, durata e attività | OK REALE | Presenti nelle giornate. |
| Checklist giornaliera persistente sul dispositivo | OK REALE | Salvata in `localStorage`; non sincronizzata tra persone. |
| Un solo giorno aperto e selettore giorni | OK REALE | Diario centrato sulla giornata selezionata. |
| Giorno precedente/successivo | OK REALE | Comandi presenti. |
| Ritorno dalla mappa allo stesso giorno/punto | PARZIALE | URL `?view=map&day=NN`, `history` e origine in `sessionStorage`; non copre foto, commenti, profili e tutti i casi di rendering lento. |
| Diario narrativo distinto dalla bacheca | PARZIALE | Introduzione e giornata esistono; mancano Mattina/Pomeriggio/Sera/Momento speciale modificabili. |
| Post/foto/video/audio impaginati automaticamente nel giorno | NON ESEGUITO | I post sono filtrabili per giorno, ma non compongono un vero racconto editoriale. |
| Modifica del racconto, autosalvataggio e riordino | NON ESEGUITO | Assente. |
| Copertina del giorno selezionabile | NON ESEGUITO | Assente. |
| Riepilogo serale automatico modificabile | NON ESEGUITO | Assente. |
| Indice Racconto/Foto/Video/Audio/Mappa/Persone/Commenti | NON ESEGUITO | Assente. |
| Deep link stabili per giorno, post, commento, media, profilo e documento | PARZIALE | Solo vista mappa/giorno è realmente gestita. |

## 3. Mappe, tappe e navigazione

| Requisito | Stato | Prova / limite |
|---|---|---|
| Cartina reale dell'India con tutte le tappe | OK REALE | MapLibre/OpenFreeMap con marker e percorso. |
| Delhi con punto iniziale e finale affiancati | OK REALE | Gestito nella mappa dell'itinerario. |
| Zoom automatico su tutti i punti della giornata | OK REALE, DA ESTENDERE | `fitBounds`/zoom differenziato e attesa caricamento presenti; non provato su ogni orientamento/dispositivo. |
| Distanze brevi 12/22/35 km visibili | PARZIALE | Percorsi giornalieri presenti; la leggibilità su tutti i telefoni non è certificata. |
| Nessuna sovrapposizione del mezzo sui marker | PARZIALE | Migliorata, ma non esiste test visuale automatico su tutte le risoluzioni. |
| Mappa più compatta e centrata nel viewport | PARZIALE | Migliorata; alcuni casi usano ancora logica di scorrimento e dipendono dal caricamento esterno. |
| Mappa delle persone in India | OK REALE | Presente nella parte privata. |
| Apri in Google Maps e Naviga verso una persona | OK REALE | Collegamenti presenti. |
| Cancella la propria posizione | OK REALE | Endpoint e pulsante presenti. |
| Posizione temporizzata 15/30/60 minuti | NON ESEGUITO | Assente. |
| Indicazione posizione vecchia/non recente | NON ESEGUITO | Mostra data/ora, ma non scadenza o stato automatico. |
| Tracciamento durante spostamento con consenso | NON ESEGUITO | Solo aggiornamento manuale. |
| Mappa/cartografia offline | NON ESEGUITO | Dipende da OpenFreeMap. |
| Alternativa offline con tappe, coordinate e indirizzi | NON ESEGUITO | Assente. |
| Percorsi calcolati da un navigatore reale | NON ESEGUITO | Le linee sono predefinite, non routing stradale dinamico. |

## 4. Bacheca social e pubblicazione

| Requisito | Stato | Prova / limite |
|---|---|---|
| Bacheca come schermata iniziale | OK REALE | Feed pubblico aperto all'avvio. |
| Feed social mobile con foto/video/audio/testo | OK REALE | Collegato a D1/KV. |
| Pubblicazione reale da utenti del gruppo | OK REALE | Test end-to-end eseguito su Cloudflare. |
| Fino a 10 allegati in un post | OK REALE | `post_media` esiste anche nel D1 remoto; limite server esplicito. |
| Foto, video, audio e contenuti misti | OK REALE | Filtri e carosello leggono `post.media`. |
| Galleria fotografica e fotocamera separate | OK REALE, DIPENDE DAL SISTEMA | Input `accept=image/*`; il selettore finale dipende da iOS/Android. |
| Registrazione audio diretta | OK REALE | `MediaRecorder` e file aggiunto agli allegati. |
| Anteprima audio prima della pubblicazione | PARZIALE LIVE / OK LOCALE | Player aggiunto nella 1.16 locale non pubblicata; live 1.15 non è ancora aggiornato. |
| Video riproducibile con audio | OK REALE | Player video nativo; Range 206 verificato. |
| Streaming audio/video | OK REALE | HEAD 200, `Accept-Ranges: bytes`, richiesta Range 206. |
| Più di 10 allegati: messaggio con quantità da rimuovere | OK LOCALE NON PUBBLICATO | Corretto nella 1.15/1.16 locale; da riverificare nella versione pubblicata corrente. |
| Dimensione preventiva e limiti chiari | PARZIALE | Nome/dimensione in anteprima; limiti 12 MB e 25 MB, senza stima tempo/consumo. |
| HEIC/HEIF/MOV e tutti i formati del telefono | PARZIALE | Selezione accetta molti formati; nessuna conversione server o prova completa cross-browser. |
| Compressione automatica conservando l'originale | NON ESEGUITO | Assente. |
| Percentuale per file e totale | NON ESEGUITO | Assente. |
| Pausa, ripresa, upload multipart/background | NON ESEGUITO | Assente. |
| Riordino allegati, ritaglio, rotazione, copertina | NON ESEGUITO | Assente. |
| Visibilità gruppo/familiari/solo io/pubblico | NON ESEGUITO | Campo DB esiste, ma il compositore non lo gestisce; default `public`. |
| Proprietà del post legata al profilo | PARZIALE LIVE / OK LOCALE | `profile_id` viene inviato nella 1.16 locale; live 1.15 va verificata prima del rilascio. |
| Modifica di un post pubblicato | NON ESEGUITO | Assente. |
| Eliminazione post e relativi media/comment media | OK REALE | Backend elimina post_media, media commenti, commenti e reazioni. |
| Prevenzione file orfani in errore di creazione | OK PARZIALE | Rollback nell'endpoint post; manca processo periodico di bonifica. |

## 5. Commenti, reazioni e interazione dei familiari

| Requisito | Stato | Prova / limite |
|---|---|---|
| Commenti pubblici con nome | OK REALE | Test end-to-end tra due sessioni. |
| Foto/video/audio nei commenti | OK REALE | Un allegato per commento. |
| Modifica del proprio commento | OK FUNZIONALE, NON SICURO | Funziona tramite `visitor_id` locale manipolabile. |
| Eliminazione del proprio commento | OK FUNZIONALE, NON SICURO | Funziona e il file collegato viene eliminato; identità non autenticata. |
| Commento eliminato sparisce subito | OK REALE | Aggiornamento ottimistico aggiunto. |
| Visualizza tutti i commenti | OK REALE | Espansione presente. |
| Nome di chi commenta | OK REALE | Visibile per i nuovi commenti. |
| Mi piace con nome di chi lo ha inserito | OK REALE | Autore salvato; vecchie reazioni senza nome restano “Una persona”. |
| Una reazione per persona, modificabile/rimovibile | OK FUNZIONALE, NON SICURO | Toggle server per `visitor_id`; identificativo copiabile. |
| Risposte annidate | NON ESEGUITO | Assente. |
| Menzioni @nome | NON ESEGUITO | Assente. |
| Reazioni ai commenti | NON ESEGUITO | Assente. |
| Segnalazione, moderazione e antispam | NON ESEGUITO | Assente. |
| Audio registrato direttamente nella risposta | PARZIALE | Allegato audio selezionabile; registratore diretto nel commento non completo. |

## 6. Profili, identità e ruoli

| Requisito | Stato | Prova / limite |
|---|---|---|
| Creazione viaggiatore con nome/cognome/età/lavoro/bio/foto | OK REALE | Endpoint D1 e interfaccia presenti. |
| Modifica profilo e foto successiva | OK REALE | PUT server; pulizia vecchio avatar dopo aggiornamento riuscito. |
| Nome/profilo memorizzato sul dispositivo | OK REALE | `localStorage` per nome e profile ID. |
| Password memorizzata dopo primo accesso | OK REALE, NON SICURO | Codice nel `localStorage`; evita reinserimento ma non è una sessione sicura. |
| Collegare un telefono a profilo già creato | OK REALE | Pannello rapido “collega questo telefono”. |
| Ruolo Viaggiatore/Coordinatore | PARZIALE | Campo DB e viste esistono; autorizzazione server assente. |
| Andrea C impostato Coordinatore | OK REALE | Ruolo remoto aggiornato su richiesta. |
| Vista coordinatore con controllo documenti | OK REALE LIVE | Griglia live 1.15 verificata; restyling a schede 1.16 è locale e congelato. |
| Tasto diretto “Griglia coordinatore” | OK LOCALE NON PUBBLICATO | Implementato nella 1.16 congelata. |
| Sessione individuale sicura | NON ESEGUITO | Assente. |
| Token con scadenza e revoca dispositivo | NON ESEGUITO | Assente. |
| Impossibilità di impersonare/modificare altri profili | NON ESEGUITO | Con il codice comune si può selezionare/modificare un altro profilo. |
| Proprietario, moderatore e ospite come ruoli server | NON ESEGUITO | Assenti. |

## 7. Documenti privati e coordinatore

| Requisito | Stato | Prova / limite |
|---|---|---|
| Passaporto, visto, biglietti, assicurazione | OK REALE | 11 documenti simulati nel D1/KV remoto. |
| Carica, apri, scarica, sostituisci, elimina | OK REALE | Provati; vecchio file non più raggiungibile dopo sostituzione/eliminazione. |
| Flag presente/manca per persona | OK REALE | Vista coordinatore. |
| File privato senza codice | OK REALE | Risposta 403. |
| File privato con codice e streaming | OK REALE | Risposta Range 206, `private, no-store`. |
| Coordinatore vede tutti i documenti | OK REALE | Endpoint privato restituisce 11 documenti e la vista li aggrega. |
| Viaggiatore vede soltanto i propri documenti | NON ESEGUITO — BLOCCANTE | Con il codice comune il server restituisce tutti i documenti. |
| Pubblico non vede documenti | OK REALE | Senza codice: 403. |
| Autorizzazione del coordinatore lato server | NON ESEGUITO — BLOCCANTE | Il ruolo è aggirabile dal client. |
| Cifratura specifica dei documenti | NON ESEGUITO | Solo protezione del provider/trasporto; nessuna cifratura applicativa documentata. |
| URL temporanei firmati | NON ESEGUITO | URL API stabile, autorizzato dal codice comune. |
| Log di chi apre/elimina un documento | NON ESEGUITO | Assente. |
| Scadenza, promemoria, versioni e verifica leggibilità | NON ESEGUITO | Assenti. |
| Salvataggio offline protetto dei documenti essenziali | NON ESEGUITO | Assente. |

## 8. Posizioni e sicurezza del gruppo

| Requisito | Stato | Prova / limite |
|---|---|---|
| Condivisione volontaria della posizione | OK REALE | Endpoint D1 e pulsanti presenti. |
| Pannello rapido dal profilo | OK REALE | Condividi/cancella senza entrare in altre sezioni. |
| Tutti i dispositivi autorizzati vedono la posizione | OK REALE COME SCAMBIO CLOUD | Stato privato condiviso; nessuna posizione attualmente salvata. |
| Naviga verso una persona | OK REALE | Link cartografico presente. |
| Precisione, durata e scadenza | NON ESEGUITO | Assenti. |
| Posizione approssimata per familiari | NON ESEGUITO | Il pubblico non vede la posizione; non esiste zona approssimata. |
| Aggiornamento continuo consensuale | NON ESEGUITO | Solo manuale. |
| “Sono arrivato / Sono al sicuro / Aiuto” | NON ESEGUITO | Assente. |

## 9. Sincronizzazione, offline e consumo dati

| Requisito | Stato | Prova / limite |
|---|---|---|
| Scambio dati reale fra sessioni | OK REALE | Post A → B, commento/reazione B → A, lettura e cancellazione provate sul server. |
| Aggiornamento automatico | PARZIALE | Polling completo ogni 15 secondi. |
| Realtime WebSocket/SSE | NON ESEGUITO — BLOCCANTE | Assente. |
| Sincronizzazione incrementale con cursore | NON ESEGUITO — BLOCCANTE | `/api/sync?since=` assente. |
| Non spostare la lettura durante refresh | PARZIALE | Conservazione anchor presente; non copre ogni interazione. |
| Stato connessione/errore/riprova | PARZIALE | Toast e retry manuale presenti; manca centro sincronizzazione. |
| Ultima sincronizzazione visibile | PARZIALE | Stato interno presente, non sempre esposto chiaramente. |
| Consultazione offline di shell/post/profili/checklist | PARZIALE | Service Worker + localStorage. |
| Outbox IndexedDB per POST e allegati | NON ESEGUITO — BLOCCANTE | Assente. |
| Ripresa automatica al ritorno della rete | NON ESEGUITO — BLOCCANTE | Assente. |
| `clientOperationId` e idempotenza | NON ESEGUITO — BLOCCANTE | Assenti dal DB e dalle API. |
| Nessuna duplicazione dopo retry | NON GARANTITO | Senza idempotenza un retry può duplicare. |
| Bozza testuale persistente | OK PARZIALE | Testo salvato; allegati non salvati. |
| Allegati conservati chiudendo l'app | NON ESEGUITO | Vengono persi. |
| Modalità connessione lenta | NON ESEGUITO | Assente. |
| Solo Wi-Fi / qualità ridotta / miniature | NON ESEGUITO | Assente. |
| Consumo dati controllato | NON ESEGUITO | Il polling completo e i media originali non sono ottimizzati. |

## 10. Notifiche, preferiti, ricerca e funzioni social avanzate

| Requisito | Stato | Prova / limite |
|---|---|---|
| Pannello attività recenti | OK REALE | Post/commenti recenti, stato letto locale. |
| Notifiche push con app chiusa | NON ESEGUITO | Nessuna subscription Push/server push. |
| Preferenze notifiche | NON ESEGUITO | Assenti. |
| Badge di non letti sincronizzato | NON ESEGUITO | Stato letto solo locale. |
| Preferiti persistenti | NON ESEGUITO | Bookmark soltanto nello stato React. |
| Condivisione nativa | OK PARZIALE | `navigator.share` se disponibile. |
| Copia link come fallback e deep link post | NON ESEGUITO | Assente. |
| Storie | NON ESEGUITO | Assenti. |
| Sondaggi, domanda del giorno, catene ricordo | NON ESEGUITO | Assenti. |
| Contenuti fissati dal coordinatore | NON ESEGUITO | Assenti. |
| Ricerca universale | NON ESEGUITO | Assente. |
| Statistiche e badge | NON ESEGUITO | Assenti. |

## 11. Archivio e download al rientro

| Requisito | Stato | Prova / limite |
|---|---|---|
| Nessun download pesante automatico durante il viaggio | OK REALE | Non viene avviato alcun archivio automatico. |
| “Prepara archivio” / “Scarica tutto” | NON ESEGUITO | Solo segnaposto. |
| ZIP, PDF, HTML offline, CSV, JSON | NON ESEGUITO | Assenti. |
| Selezione contenuti e organizzazione per giorno/città/autore/tipo | NON ESEGUITO | Assente. |
| Archivio grande suddiviso e riprendibile | NON ESEGUITO | Assente. |
| Integrità, file mancanti e resoconto | NON ESEGUITO | Assenti. |
| Scelta cartella/destinazione al ritorno | NON ESEGUITO | Assente. |
| “Decidi più tardi” e scadenza archivio | NON ESEGUITO | Assente. |
| Originali distinti da ottimizzati/miniature | NON ESEGUITO | Assente. |

## 12. Funzioni operative da viaggio richieste negli addendum

| Requisito | Stato |
|---|---|
| Home dinamica mattino/spostamento/sera | NON ESEGUITO |
| Schermata Oggi e Prossimi 60 minuti | NON ESEGUITO |
| Modalità viaggio rapida | NON ESEGUITO |
| Timeline con orari reali | NON ESEGUITO |
| Hotel, prenotazioni, biglietti e punti di incontro collegati al giorno | NON ESEGUITO |
| Emergenza disponibile offline | NON ESEGUITO |
| Mostra al tassista in inglese/hindi | NON ESEGUITO |
| Spese condivise, ricevute e saldi | NON ESEGUITO |
| Convertitore euro/rupie e mance | NON ESEGUITO |
| Frasi utili | NON ESEGUITO |
| Checklist valigia, farmaci, SIM/eSIM, power bank | NON ESEGUITO |
| Centro “Pronto per l'offline / Pronto a partire” | NON ESEGUITO |
| Modalità scura/alto contrasto/risparmio batteria | NON ESEGUITO |

## 13. Estetica, mobile e accessibilità

| Requisito | Stato | Prova / limite |
|---|---|---|
| Mobile-first e barra inferiore a cinque voci | OK REALE | Bacheca, Viaggio, Pubblica, Mappa, Gruppo. |
| Pubblica centrale e raggiungibile | OK REALE | Presente nella barra. |
| Icone Lucide coerenti | OK REALE, CON ECCEZIONI | Lucide usato; bandiera come elemento narrativo. |
| Safe area e target 44 px | PARZIALE | Regole presenti in molte aree, non certificate ovunque. |
| Interfaccia compatta e giovane | PARZIALE | Migliorata, ma la valutazione finale dell'utente non è ancora approvata. |
| Dashboard coordinatore leggibile a tutta larghezza | OK LOCALE NON PUBBLICATO | Restyling 1.16 congelato su richiesta di audit. |
| Nessun alert/confirm del browser | PARZIALE | Le eliminazioni usano modali; rimane un `alert()` per errore geolocalizzazione. |
| Focus visibile, screen reader e tastiera | PARZIALE / NON VERIFICATO | ARIA presente in alcuni controlli; nessun audit completo. |
| `prefers-reduced-motion` | OK REALE | CSS presente. |
| PWA manifest, favicon e icona | OK LOCALE / PARZIALE LIVE | Icona aggiunta nella 1.15/1.16 locale; installazione fisica non provata. |
| Prestazioni iniziali | PARZIALE | Build riuscita; chunk MapLibre circa 991 KB prima di gzip. |

## 14. Sicurezza tecnica

| Requisito | Stato | Prova / limite |
|---|---|---|
| Password non presente nel frontend | OK REALE | Nel sorgente compare solo `env.GROUP_CODE`; secret remoto. |
| Codice comune come autenticazione definitiva | NON CONFORME | È memorizzato sul dispositivo e autorizza troppe operazioni. |
| Sessioni personali, token, scadenza, revoca | NON ESEGUITO — BLOCCANTE | Assenti. |
| Autorizzazione proprietario/ruolo per ogni API | NON ESEGUITO — BLOCCANTE | Assente. |
| Rate limit e antispam | NON ESEGUITO | Assenti. |
| Validazione MIME/firma/scansione antivirus | NON ESEGUITO | Solo dimensione e MIME dichiarato dal client. |
| CSP/CORS/header completi | PARZIALE | Alcuni header Cloudflare; nessuna CSP applicativa verificata. |
| Audit accessi/eliminazioni | NON ESEGUITO | Assente. |
| Dipendenze runtime senza vulnerabilità note | OK REALE | `npm audit --omit=dev`: 0 vulnerabilità. |
| Dipendenze di sviluppo | PARZIALE | Vite 8.0.13 ha un advisory high in ambiente dev; fix disponibile 8.2.0. |

## 15. Test eseguiti realmente in questa verifica

- Build Vite 1.15/1.16: superata.
- Controllo sintassi Function: superato.
- Dominio HTTPS Cloudflare: 200.
- `/api/state`: JSON remoto.
- D1 remoto: tabelle `profiles`, `posts`, `post_media`, `comments`, `reactions`, `document_status`, `locations` presenti.
- Conteggi verificati prima del collaudo: 4 profili, 4 post, 2 media post, 3 commenti, 4 reazioni, 11 documenti, 0 posizioni.
- Scambio sessione A/B: post, commento e reazione visti dall'altra sessione.
- Pulizia collaudo: post/commento temporanei assenti dopo la prova.
- Privato senza codice: 403.
- Privato con codice: restituisce 11 documenti (conferma anche il difetto di autorizzazione individuale).
- Media pubblico: HEAD 200 e Range 206.
- Documento privato: 403 senza codice, Range 206 con codice, cache `private, no-store`.
- Vista coordinatore live: griglia con Andrea, Coordinatrice, Giulia e Marco verificata.
- Passaggio vista viaggiatore/coordinatore: verificato graficamente.
- GitHub `main` e deploy Cloudflare: stesso commit `0f4d870`.

## 16. Test non ancora validamente eseguiti

- iPhone Safari e PWA installata.
- Android Chrome e PWA installata.
- Due/tre telefoni fisici contemporaneamente.
- Rete 3G/alta latenza/cambio Wi-Fi-dati.
- Chiusura app durante upload e successiva ripresa.
- Pubblicazione realmente offline.
- 10 fotografie reali da telefono, HEIC, MOV, M4A e video oltre limite.
- Accesso da rete indiana.
- Computer di sviluppo spento per 48 ore.
- Test con 100 post/1.000 contenuti.
- Screen reader, testo ingrandito, luce solare e orientamento.
- Backup e ripristino.
- Anti-duplicazione, perché non è implementata.
- Notifiche push, perché non sono implementate.
- Archivio finale, perché non è implementato.

## 17. Esito bloccante

L'applicazione **non è pronta per il viaggio**. Le funzioni cloud e social di base sono reali, ma prima dell'uso con documenti veri e rete instabile devono essere completati almeno:

1. autenticazione personale e autorizzazioni server-side;
2. viaggiatore limitato ai propri documenti e coordinatore autorizzato realmente;
3. outbox IndexedDB per testo e allegati;
4. `clientOperationId` e idempotenza;
5. sincronizzazione incrementale/realtime;
6. upload riprendibili e gestione della perdita rete;
7. posizione con scadenza;
8. test fisici iPhone/Android/multidispositivo/rete lenta;
9. test da rete indiana e prova PC spento;
10. backup e ripristino documentati.

Fino al superamento di questi punti non devono essere caricati passaporti o altri documenti reali sensibili.
