# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **120** tra 173 controlli P0–P2 ancora privi di evidenza conclusiva.
Stato del pacchetto: **0 superati**, **120 pendenti**.

Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.

- **K0 (40):** blocca qualsiasi rilascio.
- **K1 (50):** deve passare prima della condivisione stabile.
- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.

## K0

- [ ] **K-001 · sync-rete** — Attivazione automatica su rete lenta.
  Sorgente: `globale:T-1644`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-002 · sync-rete** — Badge sincronizzato dei contenuti non letti.
  Sorgente: `globale:T-0076`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-003 · sync-rete** — Eseguire logout senza rete.
  Sorgente: `globale:T-0760`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-004 · sync-rete** — Ridurre frequenza di sincronizzazione.
  Sorgente: `globale:T-1651`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-005 · sync-rete** — Stato letto/non letto sincronizzato tra dispositivi.
  Sorgente: `globale:T-0091`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-006 · sync-rete** — Verificare bozze, se devono essere sincronizzate.
  Sorgente: `globale:T-1604`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-007 · sync-rete** — Verificare trigger della sincronizzazione.
  Sorgente: `globale:T-1042`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-008 · media-upload** — 100 upload dallo stesso utente.
  Sorgente: `globale:T-1051`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-009 · media-upload** — Aprire una fotografia del carosello.
  Sorgente: `globale:T-1394`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-010 · media-upload** — Aumento improvviso degli upload.
  Sorgente: `globale:T-1540`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-011 · media-upload** — Bloccare lo schermo durante l’audio.
  Sorgente: `globale:T-0909`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-012 · media-upload** — Caricare due file con lo stesso nome.
  Sorgente: `globale:T-0989`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-013 · media-upload** — Caricare fotografia con nome originale personale.
  Sorgente: `globale:T-1425`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-014 · media-upload** — Caricare fotografia contenente data e ora.
  Sorgente: `globale:T-1426`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-015 · media-upload** — Caricare i primi 20 post.
  Sorgente: `globale:T-1679`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-016 · media-upload** — Caricare immagini a qualità ridotta.
  Sorgente: `globale:T-1645`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-017 · media-upload** — Caricare un file con accenti.
  Sorgente: `globale:T-0990`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-018 · media-upload** — Caricare un file con emoji nel nome.
  Sorgente: `globale:T-0991`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-019 · media-upload** — Caricare un file con nome molto lungo.
  Sorgente: `globale:T-0992`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-020 · media-upload** — Caricare una fotografia sfocata.
  Sorgente: `globale:T-0997`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-021 · media-upload** — Conservare possibilità di scaricare l’originale.
  Sorgente: `globale:T-1646`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-022 · media-upload** — Consultare post già scaricati.
  Sorgente: `globale:T-0540`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-023 · media-upload** — Deep link della singola fotografia.
  Sorgente: `globale:T-0245`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-024 · media-upload** — Disattivare caricamento automatico video.
  Sorgente: `globale:T-1647`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-025 · media-upload** — dispone di screenshot, video o log come prova.
  Sorgente: `globale:T-0247`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-026 · media-upload** — Eseguire logout durante un caricamento.
  Sorgente: `globale:T-0759`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-027 · media-upload** — Fotografia → carosello → indietro.
  Sorgente: `globale:T-1413`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-028 · media-upload** — Gestire errore nel caricamento della pagina successiva.
  Sorgente: `globale:T-1681`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-029 · media-upload** — Mettere in pausa il video.
  Sorgente: `globale:T-0913`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-030 · media-upload** — Misurare batteria durante upload video.
  Sorgente: `globale:T-1664`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-031 · media-upload** — Nessuna esecuzione di contenuto caricato.
  Sorgente: `globale:T-0171`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-032 · media-upload** — Portare il video avanti e indietro.
  Sorgente: `globale:T-0914`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-033 · media-upload** — Ricaricare ogni URL significativo.
  Sorgente: `globale:T-1420`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-034 · media-upload** — Riprodurre il video con rete lenta.
  Sorgente: `globale:T-0915`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-035 · media-upload** — Salvare una bozza con dieci fotografie.
  Sorgente: `globale:T-0850`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-036 · media-upload** — Salvare una bozza con un video.
  Sorgente: `globale:T-0851`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-037 · media-upload** — Salvare una bozza con una fotografia.
  Sorgente: `globale:T-0852`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-038 · media-upload** — Scaricamento soltanto delle modifiche.
  Sorgente: `globale:T-0112`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-039 · media-upload** — Scorrere e caricare i successivi.
  Sorgente: `globale:T-1686`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-040 · media-upload** — Selezionare un video MOV.
  Sorgente: `usabilita:U0200`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.

## K1

- [ ] **K-041 · media-upload** — Selezionare un video MP4.
  Sorgente: `usabilita:U0201`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-042 · media-upload** — Sincronizzazione immediata al ritorno della rete.
  Sorgente: `globale:T-0114`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-043 · media-upload** — Sostituire la propria fotografia.
  Sorgente: `usabilita:U0372`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-044 · media-upload** — Stato caricamento comunicato allo screen reader.
  Sorgente: `globale:T-1073`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-045 · media-upload** — Tornare dopo la visualizzazione di una fotografia.
  Sorgente: `globale:T-0977`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-046 · media-upload** — Tutti pubblicano una fotografia.
  Sorgente: `globale:T-1740`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-047 · media-upload** — Tutti registrano un audio.
  Sorgente: `globale:T-1741`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-048 · media-upload** — Verificare caricamento di ogni immagine Unsplash.
  Sorgente: `globale:T-1634`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-049 · media-upload** — Verificare caricamento heic2any soltanto con file HEIC.
  Sorgente: `globale:T-1673`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-050 · media-upload** — Verificare caricamento MapLibre soltanto quando serve.
  Sorgente: `globale:T-1674`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-051 · media-upload** — Verificare che due video non vengano riprodotti contemporaneamente.
  Sorgente: `globale:T-0922`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-052 · media-upload** — Verificare che l’app non si ricarichi durante la registrazione audio.
  Sorgente: `globale:T-0835`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-053 · media-upload** — Verificare che l’app non si ricarichi durante la scrittura.
  Sorgente: `globale:T-0836`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-054 · media-upload** — Verificare che l’app non si ricarichi durante un upload.
  Sorgente: `globale:T-0837`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-055 · media-upload** — Verificare che la fotografia non venga mostrata ruotata.
  Sorgente: `globale:T-1433`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-056 · media-upload** — Verificare quali fotografie restano memorizzate.
  Sorgente: `globale:T-1631`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-057 · media-upload** — Verificare stesso post, stessi commenti e stessa fotografia.
  Sorgente: `globale:T-1408`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-058 · media-upload** — video oltre 25 MB.
  Sorgente: `globale:T-0441`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-059 · altro** — Ricevere una notifica dopo revoca del dispositivo.
  Sorgente: `globale:T-0870`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-060 · profili-ruoli** — Aprire il proprio profilo.
  Sorgente: `usabilita:U0070;usabilita:U0370`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-061 · profili-ruoli** — Cambiare profilo sullo stesso dispositivo.
  Sorgente: `globale:T-0858`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-062 · profili-ruoli** — Confrontare numero di profili.
  Sorgente: `globale:T-1162`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-063 · profili-ruoli** — Creare il profilo del Viaggiatore A.
  Sorgente: `globale:T-0698`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-064 · profili-ruoli** — Creare il profilo del Viaggiatore B.
  Sorgente: `globale:T-0699`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-065 · profili-ruoli** — Deep link del profilo.
  Sorgente: `globale:T-0242`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-066 · profili-ruoli** — Modificare contemporaneamente lo stesso profilo da due dispositivi.
  Sorgente: `globale:T-0797`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-067 · profili-ruoli** — Modificare il nome del profilo A.
  Sorgente: `globale:T-0702`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-068 · profili-ruoli** — Modificare il profilo dalla seconda.
  Sorgente: `globale:T-1591`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-069 · profili-ruoli** — Modificare il proprio profilo.
  Sorgente: `usabilita:U0371`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-070 · profili-ruoli** — Mostrare un messaggio preciso: “Per pubblicare devi prima collegare questo dispositivo al tuo profilo”.
  Sorgente: `usabilita:U0007`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-071 · profili-ruoli** — Non associare automaticamente un profilo scelto dal client.
  Sorgente: `usabilita:U0482`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-072 · profili-ruoli** — Tentare di scegliere un profilo esistente.
  Sorgente: `usabilita:U0634`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-073 · profili-ruoli** — Tutti controllano il proprio profilo.
  Sorgente: `globale:T-1733`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-074 · profili-ruoli** — Verificare che il nome del marker corrisponda al profilo A.
  Sorgente: `globale:T-0711`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-075 · profili-ruoli** — Verificare che il profilo non compaia nel feed.
  Sorgente: `globale:T-1327`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-076 · profili-ruoli** — Verificare comportamento dopo cambio profilo.
  Sorgente: `globale:T-1361`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-077 · social** — Archivio di post e commenti.
  Sorgente: `globale:T-1710`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-078 · social** — Un solo commento dopo dieci retry.
  Sorgente: `globale:T-0140`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-079 · social** — Una sola reazione dopo dieci retry.
  Sorgente: `globale:T-0144`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-080 · mappe-posizione** — Aggiornamento con segnale GPS debole.
  Sorgente: `globale:T-1456`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-081 · mappe-posizione** — Visualizzazione della precisione GPS.
  Sorgente: `globale:T-0215`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-082 · sync-rete** — Preferiti sincronizzati tra dispositivi.
  Sorgente: `globale:T-0267`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-083 · usabilita-mobile** — Attivarle su iPhone PWA.
  Sorgente: `globale:T-0518`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-084 · usabilita-mobile** — Confrontare iPhone e Android.
  Sorgente: `globale:T-1653`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-085 · usabilita-mobile** — funziona su iPhone e Android.
  Sorgente: `usabilita:U0686`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-086 · usabilita-mobile** — Installare la PWA su iPhone.
  Sorgente: `globale:T-0308`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-087 · usabilita-mobile** — iPhone con schermo piccolo.
  Sorgente: `globale:T-1090`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-088 · usabilita-mobile** — iPhone con versione iOS minima supportata.
  Sorgente: `globale:T-1091`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-089 · usabilita-mobile** — iPhone con versione iOS più recente.
  Sorgente: `globale:T-1092`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-090 · usabilita-mobile** — Test Push su iPhone con PWA installata.
  Sorgente: `globale:T-0097`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.

## K2

- [ ] **K-091 · usabilita-mobile** — Utilizzare l’app in automobile come passeggero.
  Sorgente: `globale:T-0597`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-092 · usabilita-mobile** — Verificare Live Photo iPhone.
  Sorgente: `globale:T-1435`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-093 · altro** — Produrre un resoconto dei dati eliminati.
  Sorgente: `globale:T-1350`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-094 · altro** — Verificare incremento della versione per eliminazione.
  Sorgente: `globale:T-1033`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-095 · media-upload** — Verificare cancellazione immediata dalla mappa.
  Sorgente: `globale:T-1463`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-096 · altro** — Inviare notifica con caratteri speciali.
  Sorgente: `globale:T-0862`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-097 · altro** — Inviare notifica con emoji.
  Sorgente: `globale:T-0863`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-098 · altro** — Inviare notifica con testo molto lungo.
  Sorgente: `globale:T-0864`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-099 · altro** — Inviare notifica con titolo molto lungo.
  Sorgente: `globale:T-0865`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-100 · altro** — Non inviare all’autore la notifica della propria operazione.
  Sorgente: `globale:T-0081`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-101 · altro** — Notifica → post → indietro.
  Sorgente: `globale:T-1417`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-102 · altro** — Notifica automatica al responsabile tecnico.
  Sorgente: `globale:T-1552`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-103 · altro** — Notifica con apertura del post preciso.
  Sorgente: `globale:T-0083`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-104 · altro** — Rendere reali le menzioni: attualmente “@nome” viene evidenziato, ma non genera una notifica specifica.
  Sorgente: `globale:T-0065`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-105 · altro** — Ricevere una notifica dopo logout.
  Sorgente: `globale:T-0869`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-106 · altro** — Toccando la notifica mostrare “Contenuto non più disponibile”.
  Sorgente: `globale:T-0872`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-107 · altro** — Toccare la notifica e verificare apertura del post preciso.
  Sorgente: `globale:T-0707`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-108 · altro** — Utilizzare una notifica generica quando il contenuto è sensibile.
  Sorgente: `globale:T-1357`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-109 · altro** — Verificare che il contenuto venga ricontrollato dal server quando la notifica viene aperta.
  Sorgente: `globale:T-1360`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-110 · altro** — Verificare che il telefono B riceva la notifica.
  Sorgente: `globale:T-0715`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-111 · altro** — Verificare che una notifica “Solo io” non venga inviata a nessun altro.
  Sorgente: `globale:T-0876`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-112 · altro** — Verificare ricezione della notifica.
  Sorgente: `usabilita:U0022`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-113 · altro** — Verificare una notifica con telefono bloccato.
  Sorgente: `globale:T-1364`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-114 · altro** — Verificare una notifica con telefono sbloccato.
  Sorgente: `globale:T-1365`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-115 · profili-ruoli** — Aprire la Bacheca come Viaggiatore.
  Sorgente: `usabilita:U0097`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-116 · profili-ruoli** — Il Viaggiatore non deve poter scrivere il nome di un’altra persona.
  Sorgente: `usabilita:U0168`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-117 · profili-ruoli** — Modificare localStorage con il nome di un altro Viaggiatore.
  Sorgente: `usabilita:U0171`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-118 · profili-ruoli** — Moltiplicare per tutti i Viaggiatori e familiari.
  Sorgente: `globale:T-1537`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-119 · profili-ruoli** — Passare a vista Viaggiatore.
  Sorgente: `usabilita:U0453`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-120 · profili-ruoli** — Tentare di accedere come Viaggiatore B usando il codice comune.
  Sorgente: `globale:T-0334`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
