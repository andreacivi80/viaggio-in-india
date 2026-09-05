# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **120** tra 125 controlli P0–P2 ancora privi di evidenza conclusiva.
Stato del pacchetto: **0 superati**, **120 pendenti**.

Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.

- **K0 (40):** blocca qualsiasi rilascio.
- **K1 (50):** deve passare prima della condivisione stabile.
- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.

## K0

- [ ] **K-001 · sync-rete** — Badge sincronizzato dei contenuti non letti.
  Sorgente: `globale:T-0076`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-002 · sync-rete** — Stato letto/non letto sincronizzato tra dispositivi.
  Sorgente: `globale:T-0091`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-003 · sync-rete** — Verificare bozze, se devono essere sincronizzate.
  Sorgente: `globale:T-1604`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-004 · media-upload** — Gestire errore nel caricamento della pagina successiva.
  Sorgente: `globale:T-1681`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-005 · media-upload** — Misurare batteria durante upload video.
  Sorgente: `globale:T-1664`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-006 · media-upload** — Ricaricare ogni URL significativo.
  Sorgente: `globale:T-1420`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-007 · media-upload** — Riprodurre il video con rete lenta.
  Sorgente: `globale:T-0915`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-008 · media-upload** — Salvare una bozza con dieci fotografie.
  Sorgente: `globale:T-0850`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-009 · media-upload** — Salvare una bozza con un video.
  Sorgente: `globale:T-0851`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-010 · media-upload** — Salvare una bozza con una fotografia.
  Sorgente: `globale:T-0852`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-011 · media-upload** — Scaricamento soltanto delle modifiche.
  Sorgente: `globale:T-0112`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-012 · media-upload** — Scorrere e caricare i successivi.
  Sorgente: `globale:T-1686`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-013 · media-upload** — Selezionare un video MOV.
  Sorgente: `usabilita:U0200`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-014 · media-upload** — Selezionare un video MP4.
  Sorgente: `usabilita:U0201`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-015 · media-upload** — Sostituire la propria fotografia.
  Sorgente: `usabilita:U0372`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-016 · media-upload** — Stato caricamento comunicato allo screen reader.
  Sorgente: `globale:T-1073`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-017 · media-upload** — Tutti pubblicano una fotografia.
  Sorgente: `globale:T-1740`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-018 · media-upload** — Tutti registrano un audio.
  Sorgente: `globale:T-1741`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-019 · media-upload** — Verificare caricamento di ogni immagine Unsplash.
  Sorgente: `globale:T-1634`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-020 · media-upload** — video oltre 25 MB.
  Sorgente: `globale:T-0441`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-021 · altro** — Ricevere una notifica dopo revoca del dispositivo.
  Sorgente: `globale:T-0870`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-022 · profili-ruoli** — Aprire il proprio profilo.
  Sorgente: `usabilita:U0070;usabilita:U0370`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-023 · profili-ruoli** — Cambiare profilo sullo stesso dispositivo.
  Sorgente: `globale:T-0858`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-024 · profili-ruoli** — Confrontare numero di profili.
  Sorgente: `globale:T-1162`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-025 · profili-ruoli** — Creare il profilo del Viaggiatore A.
  Sorgente: `globale:T-0698`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-026 · profili-ruoli** — Creare il profilo del Viaggiatore B.
  Sorgente: `globale:T-0699`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-027 · profili-ruoli** — Deep link del profilo.
  Sorgente: `globale:T-0242`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-028 · profili-ruoli** — Modificare contemporaneamente lo stesso profilo da due dispositivi.
  Sorgente: `globale:T-0797`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-029 · profili-ruoli** — Modificare il nome del profilo A.
  Sorgente: `globale:T-0702`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-030 · profili-ruoli** — Modificare il profilo dalla seconda.
  Sorgente: `globale:T-1591`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-031 · profili-ruoli** — Modificare il proprio profilo.
  Sorgente: `usabilita:U0371`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-032 · profili-ruoli** — Mostrare un messaggio preciso: “Per pubblicare devi prima collegare questo dispositivo al tuo profilo”.
  Sorgente: `usabilita:U0007`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-033 · profili-ruoli** — Non associare automaticamente un profilo scelto dal client.
  Sorgente: `usabilita:U0482`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-034 · profili-ruoli** — Tentare di scegliere un profilo esistente.
  Sorgente: `usabilita:U0634`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-035 · profili-ruoli** — Tutti controllano il proprio profilo.
  Sorgente: `globale:T-1733`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-036 · profili-ruoli** — Verificare che il nome del marker corrisponda al profilo A.
  Sorgente: `globale:T-0711`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-037 · profili-ruoli** — Verificare che il profilo non compaia nel feed.
  Sorgente: `globale:T-1327`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-038 · profili-ruoli** — Verificare comportamento dopo cambio profilo.
  Sorgente: `globale:T-1361`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-039 · social** — Archivio di post e commenti.
  Sorgente: `globale:T-1710`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-040 · mappe-posizione** — Aggiornamento con segnale GPS debole.
  Sorgente: `globale:T-1456`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.

## K1

- [ ] **K-041 · mappe-posizione** — Visualizzazione della precisione GPS.
  Sorgente: `globale:T-0215`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-042 · sync-rete** — Preferiti sincronizzati tra dispositivi.
  Sorgente: `globale:T-0267`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-043 · usabilita-mobile** — Attivarle su iPhone PWA.
  Sorgente: `globale:T-0518`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-044 · usabilita-mobile** — Confrontare iPhone e Android.
  Sorgente: `globale:T-1653`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-045 · usabilita-mobile** — funziona su iPhone e Android.
  Sorgente: `usabilita:U0686`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-046 · usabilita-mobile** — Installare la PWA su iPhone.
  Sorgente: `globale:T-0308`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-047 · usabilita-mobile** — iPhone con schermo piccolo.
  Sorgente: `globale:T-1090`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-048 · usabilita-mobile** — iPhone con versione iOS minima supportata.
  Sorgente: `globale:T-1091`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-049 · usabilita-mobile** — iPhone con versione iOS più recente.
  Sorgente: `globale:T-1092`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-050 · usabilita-mobile** — Test Push su iPhone con PWA installata.
  Sorgente: `globale:T-0097`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-051 · usabilita-mobile** — Utilizzare l’app in automobile come passeggero.
  Sorgente: `globale:T-0597`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-052 · usabilita-mobile** — Verificare Live Photo iPhone.
  Sorgente: `globale:T-1435`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-053 · altro** — Produrre un resoconto dei dati eliminati.
  Sorgente: `globale:T-1350`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-054 · altro** — Verificare incremento della versione per eliminazione.
  Sorgente: `globale:T-1033`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-055 · media-upload** — Verificare cancellazione immediata dalla mappa.
  Sorgente: `globale:T-1463`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-056 · altro** — Notifica → post → indietro.
  Sorgente: `globale:T-1417`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-057 · altro** — Notifica automatica al responsabile tecnico.
  Sorgente: `globale:T-1552`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-058 · altro** — Notifica con apertura del post preciso.
  Sorgente: `globale:T-0083`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-059 · altro** — Ricevere una notifica dopo logout.
  Sorgente: `globale:T-0869`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-060 · altro** — Toccando la notifica mostrare “Contenuto non più disponibile”.
  Sorgente: `globale:T-0872`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-061 · altro** — Toccare la notifica e verificare apertura del post preciso.
  Sorgente: `globale:T-0707`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-062 · altro** — Verificare che il contenuto venga ricontrollato dal server quando la notifica viene aperta.
  Sorgente: `globale:T-1360`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-063 · altro** — Verificare che il telefono B riceva la notifica.
  Sorgente: `globale:T-0715`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-064 · altro** — Verificare ricezione della notifica.
  Sorgente: `usabilita:U0022`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-065 · altro** — Verificare una notifica con telefono bloccato.
  Sorgente: `globale:T-1364`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-066 · altro** — Verificare una notifica con telefono sbloccato.
  Sorgente: `globale:T-1365`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-067 · profili-ruoli** — Aprire la Bacheca come Viaggiatore.
  Sorgente: `usabilita:U0097`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-068 · profili-ruoli** — Il Viaggiatore non deve poter scrivere il nome di un’altra persona.
  Sorgente: `usabilita:U0168`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-069 · profili-ruoli** — Modificare localStorage con il nome di un altro Viaggiatore.
  Sorgente: `usabilita:U0171`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-070 · profili-ruoli** — Moltiplicare per tutti i Viaggiatori e familiari.
  Sorgente: `globale:T-1537`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-071 · profili-ruoli** — Passare a vista Viaggiatore.
  Sorgente: `usabilita:U0453`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-072 · profili-ruoli** — Tentare di accedere come Viaggiatore B usando il codice comune.
  Sorgente: `globale:T-0334`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-073 · profili-ruoli** — Verificare che non sia possibile pubblicare utilizzando il nome del Viaggiatore B.
  Sorgente: `globale:T-0719`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-074 · profili-ruoli** — Verificare numero dei Viaggiatori.
  Sorgente: `usabilita:U0444`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-075 · social** — 100 commenti in un minuto.
  Sorgente: `globale:T-1043`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-076 · social** — 100 reazioni in un minuto.
  Sorgente: `globale:T-1045`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-077 · social** — Aggiungere limite di commenti al minuto.
  Sorgente: `globale:T-0054`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-078 · social** — Aggiungere limite di reazioni al minuto.
  Sorgente: `globale:T-0055`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-079 · social** — Aggiungere reazioni ai commenti.
  Sorgente: `globale:T-0058`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-080 · social** — Aggiungere risposte ai commenti.
  Sorgente: `globale:T-0059`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-081 · social** — Bacheca → post → commenti → indietro.
  Sorgente: `globale:T-1410`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-082 · social** — Chiudi tutti i commenti.
  Sorgente: `usabilita:U0313`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-083 · social** — Commenti periodici durante la prova.
  Sorgente: `globale:T-1126`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-084 · social** — Confrontare numero di commenti.
  Sorgente: `globale:T-1159`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-085 · social** — Confrontare numero di reazioni.
  Sorgente: `globale:T-1163`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-086 · social** — Copiare il collegamento del commento.
  Sorgente: `globale:T-0968`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-087 · social** — Deep link del singolo commento.
  Sorgente: `globale:T-0243`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-088 · social** — Errore durante creazione del post con 10 allegati.
  Sorgente: `globale:T-1148`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-089 · social** — Espandere tutti i commenti.
  Sorgente: `globale:T-1398`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-090 · social** — Iniziare a scrivere un commento.
  Sorgente: `globale:T-1399`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.

## K2

- [ ] **K-091 · social** — Modificare contemporaneamente la stessa reazione.
  Sorgente: `globale:T-0796`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-092 · social** — Ogni commento deve essere collegato a un post esistente.
  Sorgente: `globale:T-1015`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-093 · social** — Ogni reazione deve essere collegata a un post esistente.
  Sorgente: `globale:T-1020`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-094 · social** — Tutti aggiungono una reazione.
  Sorgente: `globale:T-1730`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-095 · social** — Tutti inseriscono un commento.
  Sorgente: `globale:T-1737`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-096 · social** — Verificare apertura del commento preciso.
  Sorgente: `globale:T-0978`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-097 · social** — Verificare che l’aggiornamento non chiuda i commenti.
  Sorgente: `usabilita:U0111`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-098 · social** — Verificare ora dei commenti.
  Sorgente: `globale:T-0942`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-099 · social** — Verificare presenza di una sola reazione per persona.
  Sorgente: `globale:T-0805`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-100 · social** — Verificare una sola reazione.
  Sorgente: `usabilita:U0256`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-101 · social** — Visualizza tutti i commenti.
  Sorgente: `usabilita:U0312`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-102 · mappe-posizione** — Aprire la mappa generale.
  Sorgente: `globale:T-0381`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-103 · mappe-posizione** — Aprire una mappa tramite collegamento.
  Sorgente: `globale:T-0383`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-104 · mappe-posizione** — Copiare il collegamento della mappa.
  Sorgente: `globale:T-0971`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-105 · mappe-posizione** — Correggere i popup della mappa per impedire inserimento di HTML o script nei nomi.
  Sorgente: `globale:T-0186`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-106 · mappe-posizione** — Descrizione dei marker della mappa.
  Sorgente: `globale:T-1063`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-107 · mappe-posizione** — Itinerario → giorno → mappa → indietro.
  Sorgente: `globale:T-1414`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-108 · mappe-posizione** — Mappa → Google Maps → ritorno all’app.
  Sorgente: `globale:T-1416`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-109 · mappe-posizione** — Mappa con coordinate 0,0.
  Sorgente: `globale:T-0945`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-110 · mappe-posizione** — Mappa con dieci persone nello stesso punto.
  Sorgente: `globale:T-0946`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-111 · mappe-posizione** — Mappa con latitudine -90.
  Sorgente: `globale:T-0948;globale:T-0949`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-112 · mappe-posizione** — Mappa con longitudine -180.
  Sorgente: `globale:T-0950;globale:T-0951`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-113 · mappe-posizione** — Mappa con una persona fuori dall’India.
  Sorgente: `globale:T-0953`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-114 · mappe-posizione** — Misurare batteria con mappa aperta.
  Sorgente: `globale:T-1659`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-115 · mappe-posizione** — Verificare apertura della mappa precisa.
  Sorgente: `globale:T-0981`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-116 · mappe-posizione** — Verificare che il collegamento riapra la stessa mappa.
  Sorgente: `globale:T-0398`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-117 · mappe-posizione** — Verificare mappa quando Google Maps non risponde.
  Sorgente: `globale:T-0961`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-118 · mappe-posizione** — Verificare mappa quando OpenFreeMap non risponde.
  Sorgente: `globale:T-0962`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-119 · altro** — Aprire il pannello notifiche.
  Sorgente: `usabilita:U0056`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-120 · altro** — Disattivazione completa delle notifiche.
  Sorgente: `globale:T-0077`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
