# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **120** tra 132 controlli P0–P2 ancora privi di evidenza conclusiva.
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
- [ ] **K-003 · sync-rete** — Stato letto/non letto sincronizzato tra dispositivi.
  Sorgente: `globale:T-0091`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-004 · sync-rete** — Verificare bozze, se devono essere sincronizzate.
  Sorgente: `globale:T-1604`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-005 · media-upload** — Caricare immagini a qualità ridotta.
  Sorgente: `globale:T-1645`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-006 · media-upload** — Caricare una fotografia sfocata.
  Sorgente: `globale:T-0997`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-007 · media-upload** — Deep link della singola fotografia.
  Sorgente: `globale:T-0245`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-008 · media-upload** — Eseguire logout durante un caricamento.
  Sorgente: `globale:T-0759`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-009 · media-upload** — Gestire errore nel caricamento della pagina successiva.
  Sorgente: `globale:T-1681`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-010 · media-upload** — Misurare batteria durante upload video.
  Sorgente: `globale:T-1664`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-011 · media-upload** — Ricaricare ogni URL significativo.
  Sorgente: `globale:T-1420`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-012 · media-upload** — Riprodurre il video con rete lenta.
  Sorgente: `globale:T-0915`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-013 · media-upload** — Salvare una bozza con dieci fotografie.
  Sorgente: `globale:T-0850`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-014 · media-upload** — Salvare una bozza con un video.
  Sorgente: `globale:T-0851`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-015 · media-upload** — Salvare una bozza con una fotografia.
  Sorgente: `globale:T-0852`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-016 · media-upload** — Scaricamento soltanto delle modifiche.
  Sorgente: `globale:T-0112`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-017 · media-upload** — Scorrere e caricare i successivi.
  Sorgente: `globale:T-1686`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-018 · media-upload** — Selezionare un video MOV.
  Sorgente: `usabilita:U0200`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-019 · media-upload** — Selezionare un video MP4.
  Sorgente: `usabilita:U0201`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-020 · media-upload** — Sostituire la propria fotografia.
  Sorgente: `usabilita:U0372`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-021 · media-upload** — Stato caricamento comunicato allo screen reader.
  Sorgente: `globale:T-1073`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-022 · media-upload** — Tutti pubblicano una fotografia.
  Sorgente: `globale:T-1740`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-023 · media-upload** — Tutti registrano un audio.
  Sorgente: `globale:T-1741`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-024 · media-upload** — Verificare caricamento di ogni immagine Unsplash.
  Sorgente: `globale:T-1634`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-025 · media-upload** — video oltre 25 MB.
  Sorgente: `globale:T-0441`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-026 · altro** — Ricevere una notifica dopo revoca del dispositivo.
  Sorgente: `globale:T-0870`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-027 · profili-ruoli** — Aprire il proprio profilo.
  Sorgente: `usabilita:U0070;usabilita:U0370`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-028 · profili-ruoli** — Cambiare profilo sullo stesso dispositivo.
  Sorgente: `globale:T-0858`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-029 · profili-ruoli** — Confrontare numero di profili.
  Sorgente: `globale:T-1162`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-030 · profili-ruoli** — Creare il profilo del Viaggiatore A.
  Sorgente: `globale:T-0698`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-031 · profili-ruoli** — Creare il profilo del Viaggiatore B.
  Sorgente: `globale:T-0699`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-032 · profili-ruoli** — Deep link del profilo.
  Sorgente: `globale:T-0242`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-033 · profili-ruoli** — Modificare contemporaneamente lo stesso profilo da due dispositivi.
  Sorgente: `globale:T-0797`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-034 · profili-ruoli** — Modificare il nome del profilo A.
  Sorgente: `globale:T-0702`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-035 · profili-ruoli** — Modificare il profilo dalla seconda.
  Sorgente: `globale:T-1591`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-036 · profili-ruoli** — Modificare il proprio profilo.
  Sorgente: `usabilita:U0371`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-037 · profili-ruoli** — Mostrare un messaggio preciso: “Per pubblicare devi prima collegare questo dispositivo al tuo profilo”.
  Sorgente: `usabilita:U0007`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-038 · profili-ruoli** — Non associare automaticamente un profilo scelto dal client.
  Sorgente: `usabilita:U0482`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-039 · profili-ruoli** — Tentare di scegliere un profilo esistente.
  Sorgente: `usabilita:U0634`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-040 · profili-ruoli** — Tutti controllano il proprio profilo.
  Sorgente: `globale:T-1733`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.

## K1

- [ ] **K-041 · profili-ruoli** — Verificare che il nome del marker corrisponda al profilo A.
  Sorgente: `globale:T-0711`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-042 · profili-ruoli** — Verificare che il profilo non compaia nel feed.
  Sorgente: `globale:T-1327`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-043 · profili-ruoli** — Verificare comportamento dopo cambio profilo.
  Sorgente: `globale:T-1361`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-044 · social** — Archivio di post e commenti.
  Sorgente: `globale:T-1710`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-045 · social** — Un solo commento dopo dieci retry.
  Sorgente: `globale:T-0140`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-046 · social** — Una sola reazione dopo dieci retry.
  Sorgente: `globale:T-0144`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-047 · mappe-posizione** — Aggiornamento con segnale GPS debole.
  Sorgente: `globale:T-1456`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-048 · mappe-posizione** — Visualizzazione della precisione GPS.
  Sorgente: `globale:T-0215`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-049 · sync-rete** — Preferiti sincronizzati tra dispositivi.
  Sorgente: `globale:T-0267`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-050 · usabilita-mobile** — Attivarle su iPhone PWA.
  Sorgente: `globale:T-0518`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-051 · usabilita-mobile** — Confrontare iPhone e Android.
  Sorgente: `globale:T-1653`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-052 · usabilita-mobile** — funziona su iPhone e Android.
  Sorgente: `usabilita:U0686`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-053 · usabilita-mobile** — Installare la PWA su iPhone.
  Sorgente: `globale:T-0308`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-054 · usabilita-mobile** — iPhone con schermo piccolo.
  Sorgente: `globale:T-1090`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-055 · usabilita-mobile** — iPhone con versione iOS minima supportata.
  Sorgente: `globale:T-1091`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-056 · usabilita-mobile** — iPhone con versione iOS più recente.
  Sorgente: `globale:T-1092`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-057 · usabilita-mobile** — Test Push su iPhone con PWA installata.
  Sorgente: `globale:T-0097`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-058 · usabilita-mobile** — Utilizzare l’app in automobile come passeggero.
  Sorgente: `globale:T-0597`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-059 · usabilita-mobile** — Verificare Live Photo iPhone.
  Sorgente: `globale:T-1435`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-060 · altro** — Produrre un resoconto dei dati eliminati.
  Sorgente: `globale:T-1350`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-061 · altro** — Verificare incremento della versione per eliminazione.
  Sorgente: `globale:T-1033`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-062 · media-upload** — Verificare cancellazione immediata dalla mappa.
  Sorgente: `globale:T-1463`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-063 · altro** — Notifica → post → indietro.
  Sorgente: `globale:T-1417`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-064 · altro** — Notifica automatica al responsabile tecnico.
  Sorgente: `globale:T-1552`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-065 · altro** — Notifica con apertura del post preciso.
  Sorgente: `globale:T-0083`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-066 · altro** — Ricevere una notifica dopo logout.
  Sorgente: `globale:T-0869`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-067 · altro** — Toccando la notifica mostrare “Contenuto non più disponibile”.
  Sorgente: `globale:T-0872`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-068 · altro** — Toccare la notifica e verificare apertura del post preciso.
  Sorgente: `globale:T-0707`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-069 · altro** — Verificare che il contenuto venga ricontrollato dal server quando la notifica viene aperta.
  Sorgente: `globale:T-1360`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-070 · altro** — Verificare che il telefono B riceva la notifica.
  Sorgente: `globale:T-0715`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-071 · altro** — Verificare ricezione della notifica.
  Sorgente: `usabilita:U0022`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-072 · altro** — Verificare una notifica con telefono bloccato.
  Sorgente: `globale:T-1364`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-073 · altro** — Verificare una notifica con telefono sbloccato.
  Sorgente: `globale:T-1365`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-074 · profili-ruoli** — Aprire la Bacheca come Viaggiatore.
  Sorgente: `usabilita:U0097`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-075 · profili-ruoli** — Il Viaggiatore non deve poter scrivere il nome di un’altra persona.
  Sorgente: `usabilita:U0168`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-076 · profili-ruoli** — Modificare localStorage con il nome di un altro Viaggiatore.
  Sorgente: `usabilita:U0171`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-077 · profili-ruoli** — Moltiplicare per tutti i Viaggiatori e familiari.
  Sorgente: `globale:T-1537`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-078 · profili-ruoli** — Passare a vista Viaggiatore.
  Sorgente: `usabilita:U0453`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-079 · profili-ruoli** — Tentare di accedere come Viaggiatore B usando il codice comune.
  Sorgente: `globale:T-0334`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-080 · profili-ruoli** — Verificare che non sia possibile pubblicare utilizzando il nome del Viaggiatore B.
  Sorgente: `globale:T-0719`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-081 · profili-ruoli** — Verificare numero dei Viaggiatori.
  Sorgente: `usabilita:U0444`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-082 · social** — 100 commenti in un minuto.
  Sorgente: `globale:T-1043`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-083 · social** — 100 reazioni in un minuto.
  Sorgente: `globale:T-1045`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-084 · social** — Aggiungere limite di commenti al minuto.
  Sorgente: `globale:T-0054`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-085 · social** — Aggiungere limite di reazioni al minuto.
  Sorgente: `globale:T-0055`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-086 · social** — Aggiungere reazioni ai commenti.
  Sorgente: `globale:T-0058`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-087 · social** — Aggiungere risposte ai commenti.
  Sorgente: `globale:T-0059`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-088 · social** — Bacheca → post → commenti → indietro.
  Sorgente: `globale:T-1410`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-089 · social** — Chiudi tutti i commenti.
  Sorgente: `usabilita:U0313`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-090 · social** — Commenti periodici durante la prova.
  Sorgente: `globale:T-1126`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.

## K2

- [ ] **K-091 · social** — Confrontare numero di commenti.
  Sorgente: `globale:T-1159`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-092 · social** — Confrontare numero di reazioni.
  Sorgente: `globale:T-1163`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-093 · social** — Copiare il collegamento del commento.
  Sorgente: `globale:T-0968`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-094 · social** — Deep link del singolo commento.
  Sorgente: `globale:T-0243`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-095 · social** — Errore durante creazione del post con 10 allegati.
  Sorgente: `globale:T-1148`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-096 · social** — Espandere tutti i commenti.
  Sorgente: `globale:T-1398`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-097 · social** — Iniziare a scrivere un commento.
  Sorgente: `globale:T-1399`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-098 · social** — Modificare contemporaneamente la stessa reazione.
  Sorgente: `globale:T-0796`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-099 · social** — Ogni commento deve essere collegato a un post esistente.
  Sorgente: `globale:T-1015`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-100 · social** — Ogni reazione deve essere collegata a un post esistente.
  Sorgente: `globale:T-1020`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-101 · social** — Tutti aggiungono una reazione.
  Sorgente: `globale:T-1730`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-102 · social** — Tutti inseriscono un commento.
  Sorgente: `globale:T-1737`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-103 · social** — Verificare apertura del commento preciso.
  Sorgente: `globale:T-0978`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-104 · social** — Verificare che l’aggiornamento non chiuda i commenti.
  Sorgente: `usabilita:U0111`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-105 · social** — Verificare ora dei commenti.
  Sorgente: `globale:T-0942`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-106 · social** — Verificare presenza di una sola reazione per persona.
  Sorgente: `globale:T-0805`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-107 · social** — Verificare una sola reazione.
  Sorgente: `usabilita:U0256`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-108 · social** — Visualizza tutti i commenti.
  Sorgente: `usabilita:U0312`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-109 · mappe-posizione** — Aprire la mappa generale.
  Sorgente: `globale:T-0381`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-110 · mappe-posizione** — Aprire una mappa tramite collegamento.
  Sorgente: `globale:T-0383`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-111 · mappe-posizione** — Copiare il collegamento della mappa.
  Sorgente: `globale:T-0971`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-112 · mappe-posizione** — Correggere i popup della mappa per impedire inserimento di HTML o script nei nomi.
  Sorgente: `globale:T-0186`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-113 · mappe-posizione** — Descrizione dei marker della mappa.
  Sorgente: `globale:T-1063`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-114 · mappe-posizione** — Itinerario → giorno → mappa → indietro.
  Sorgente: `globale:T-1414`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-115 · mappe-posizione** — Mappa → Google Maps → ritorno all’app.
  Sorgente: `globale:T-1416`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-116 · mappe-posizione** — Mappa con coordinate 0,0.
  Sorgente: `globale:T-0945`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-117 · mappe-posizione** — Mappa con dieci persone nello stesso punto.
  Sorgente: `globale:T-0946`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-118 · mappe-posizione** — Mappa con latitudine -90.
  Sorgente: `globale:T-0948;globale:T-0949`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-119 · mappe-posizione** — Mappa con longitudine -180.
  Sorgente: `globale:T-0950;globale:T-0951`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-120 · mappe-posizione** — Mappa con una persona fuori dall’India.
  Sorgente: `globale:T-0953`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
