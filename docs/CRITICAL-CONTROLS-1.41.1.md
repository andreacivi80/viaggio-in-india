# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **85** tra 85 controlli P0–P2 ancora privi di evidenza conclusiva.
Stato del pacchetto: **0 superati**, **85 pendenti**.

Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.

- **K0 (40):** blocca qualsiasi rilascio.
- **K1 (50):** deve passare prima della condivisione stabile.
- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.

## K0

- [ ] **K-001 · sync-rete** — Badge sincronizzato dei contenuti non letti.
  Sorgente: `globale:T-0076`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-002 · sync-rete** — Stato letto/non letto sincronizzato tra dispositivi.
  Sorgente: `globale:T-0091`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-003 · media-upload** — Misurare batteria durante upload video.
  Sorgente: `globale:T-1664`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-004 · media-upload** — Scaricamento soltanto delle modifiche.
  Sorgente: `globale:T-0112`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-005 · media-upload** — Selezionare un video MOV.
  Sorgente: `usabilita:U0200`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-006 · media-upload** — Selezionare un video MP4.
  Sorgente: `usabilita:U0201`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-007 · altro** — Ricevere una notifica dopo revoca del dispositivo.
  Sorgente: `globale:T-0870`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-008 · profili-ruoli** — Cambiare profilo sullo stesso dispositivo.
  Sorgente: `globale:T-0858`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-009 · profili-ruoli** — Confrontare numero di profili.
  Sorgente: `globale:T-1162`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-010 · profili-ruoli** — Creare il profilo del Viaggiatore A.
  Sorgente: `globale:T-0698`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-011 · profili-ruoli** — Creare il profilo del Viaggiatore B.
  Sorgente: `globale:T-0699`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-012 · profili-ruoli** — Deep link del profilo.
  Sorgente: `globale:T-0242`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-013 · profili-ruoli** — Modificare contemporaneamente lo stesso profilo da due dispositivi.
  Sorgente: `globale:T-0797`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-014 · profili-ruoli** — Modificare il profilo dalla seconda.
  Sorgente: `globale:T-1591`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-015 · profili-ruoli** — Mostrare un messaggio preciso: “Per pubblicare devi prima collegare questo dispositivo al tuo profilo”.
  Sorgente: `usabilita:U0007`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-016 · profili-ruoli** — Tutti controllano il proprio profilo.
  Sorgente: `globale:T-1733`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-017 · profili-ruoli** — Verificare che il nome del marker corrisponda al profilo A.
  Sorgente: `globale:T-0711`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-018 · profili-ruoli** — Verificare comportamento dopo cambio profilo.
  Sorgente: `globale:T-1361`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-019 · social** — Archivio di post e commenti.
  Sorgente: `globale:T-1710`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-020 · mappe-posizione** — Aggiornamento con segnale GPS debole.
  Sorgente: `globale:T-1456`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-021 · mappe-posizione** — Visualizzazione della precisione GPS.
  Sorgente: `globale:T-0215`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-022 · sync-rete** — Preferiti sincronizzati tra dispositivi.
  Sorgente: `globale:T-0267`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-023 · usabilita-mobile** — Attivarle su iPhone PWA.
  Sorgente: `globale:T-0518`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-024 · usabilita-mobile** — Installare la PWA su iPhone.
  Sorgente: `globale:T-0308`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-025 · usabilita-mobile** — iPhone con schermo piccolo.
  Sorgente: `globale:T-1090`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-026 · usabilita-mobile** — iPhone con versione iOS minima supportata.
  Sorgente: `globale:T-1091`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-027 · usabilita-mobile** — iPhone con versione iOS più recente.
  Sorgente: `globale:T-1092`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-028 · usabilita-mobile** — Test Push su iPhone con PWA installata.
  Sorgente: `globale:T-0097`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-029 · usabilita-mobile** — Utilizzare l’app in automobile come passeggero.
  Sorgente: `globale:T-0597`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-030 · usabilita-mobile** — Verificare Live Photo iPhone.
  Sorgente: `globale:T-1435`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-031 · altro** — Produrre un resoconto dei dati eliminati.
  Sorgente: `globale:T-1350`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-032 · altro** — Verificare incremento della versione per eliminazione.
  Sorgente: `globale:T-1033`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-033 · media-upload** — Verificare cancellazione immediata dalla mappa.
  Sorgente: `globale:T-1463`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-034 · altro** — Notifica → post → indietro.
  Sorgente: `globale:T-1417`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-035 · altro** — Notifica automatica al responsabile tecnico.
  Sorgente: `globale:T-1552`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-036 · altro** — Notifica con apertura del post preciso.
  Sorgente: `globale:T-0083`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-037 · altro** — Ricevere una notifica dopo logout.
  Sorgente: `globale:T-0869`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-038 · altro** — Toccando la notifica mostrare “Contenuto non più disponibile”.
  Sorgente: `globale:T-0872`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-039 · altro** — Toccare la notifica e verificare apertura del post preciso.
  Sorgente: `globale:T-0707`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-040 · altro** — Verificare che il contenuto venga ricontrollato dal server quando la notifica viene aperta.
  Sorgente: `globale:T-1360`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.

## K1

- [ ] **K-041 · altro** — Verificare che il telefono B riceva la notifica.
  Sorgente: `globale:T-0715`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-042 · altro** — Verificare ricezione della notifica.
  Sorgente: `usabilita:U0022`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-043 · altro** — Verificare una notifica con telefono bloccato.
  Sorgente: `globale:T-1364`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-044 · altro** — Verificare una notifica con telefono sbloccato.
  Sorgente: `globale:T-1365`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-045 · profili-ruoli** — Moltiplicare per tutti i Viaggiatori e familiari.
  Sorgente: `globale:T-1537`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-046 · profili-ruoli** — Passare a vista Viaggiatore.
  Sorgente: `usabilita:U0453`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-047 · profili-ruoli** — Verificare numero dei Viaggiatori.
  Sorgente: `usabilita:U0444`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-048 · social** — Aggiungere reazioni ai commenti.
  Sorgente: `globale:T-0058`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-049 · social** — Aggiungere risposte ai commenti.
  Sorgente: `globale:T-0059`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-050 · social** — Bacheca → post → commenti → indietro.
  Sorgente: `globale:T-1410`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-051 · social** — Chiudi tutti i commenti.
  Sorgente: `usabilita:U0313`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-052 · social** — Commenti periodici durante la prova.
  Sorgente: `globale:T-1126`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-053 · social** — Confrontare numero di commenti.
  Sorgente: `globale:T-1159`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-054 · social** — Confrontare numero di reazioni.
  Sorgente: `globale:T-1163`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-055 · social** — Copiare il collegamento del commento.
  Sorgente: `globale:T-0968`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-056 · social** — Deep link del singolo commento.
  Sorgente: `globale:T-0243`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-057 · social** — Errore durante creazione del post con 10 allegati.
  Sorgente: `globale:T-1148`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-058 · social** — Espandere tutti i commenti.
  Sorgente: `globale:T-1398`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-059 · social** — Iniziare a scrivere un commento.
  Sorgente: `globale:T-1399`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-060 · social** — Modificare contemporaneamente la stessa reazione.
  Sorgente: `globale:T-0796`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-061 · social** — Tutti aggiungono una reazione.
  Sorgente: `globale:T-1730`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-062 · social** — Tutti inseriscono un commento.
  Sorgente: `globale:T-1737`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-063 · social** — Verificare apertura del commento preciso.
  Sorgente: `globale:T-0978`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-064 · social** — Verificare che l’aggiornamento non chiuda i commenti.
  Sorgente: `usabilita:U0111`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-065 · social** — Verificare ora dei commenti.
  Sorgente: `globale:T-0942`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-066 · social** — Visualizza tutti i commenti.
  Sorgente: `usabilita:U0312`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-067 · mappe-posizione** — Copiare il collegamento della mappa.
  Sorgente: `globale:T-0971`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-068 · mappe-posizione** — Correggere i popup della mappa per impedire inserimento di HTML o script nei nomi.
  Sorgente: `globale:T-0186`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-069 · mappe-posizione** — Descrizione dei marker della mappa.
  Sorgente: `globale:T-1063`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-070 · mappe-posizione** — Itinerario → giorno → mappa → indietro.
  Sorgente: `globale:T-1414`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-071 · mappe-posizione** — Mappa → Google Maps → ritorno all’app.
  Sorgente: `globale:T-1416`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-072 · mappe-posizione** — Mappa con coordinate 0,0.
  Sorgente: `globale:T-0945`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-073 · mappe-posizione** — Mappa con dieci persone nello stesso punto.
  Sorgente: `globale:T-0946`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-074 · mappe-posizione** — Mappa con latitudine -90.
  Sorgente: `globale:T-0948;globale:T-0949`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-075 · mappe-posizione** — Mappa con longitudine -180.
  Sorgente: `globale:T-0950;globale:T-0951`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-076 · mappe-posizione** — Mappa con una persona fuori dall’India.
  Sorgente: `globale:T-0953`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-077 · mappe-posizione** — Misurare batteria con mappa aperta.
  Sorgente: `globale:T-1659`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-078 · mappe-posizione** — Verificare mappa quando Google Maps non risponde.
  Sorgente: `globale:T-0961`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-079 · mappe-posizione** — Verificare mappa quando OpenFreeMap non risponde.
  Sorgente: `globale:T-0962`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-080 · altro** — Disattivazione completa delle notifiche.
  Sorgente: `globale:T-0077`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-081 · altro** — Inviare due notifiche con lo stesso tag.
  Sorgente: `globale:T-0861`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-082 · altro** — Misurare batteria con notifiche attive.
  Sorgente: `globale:T-1660`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-083 · altro** — Notifiche durante la prova.
  Sorgente: `globale:T-1127`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-084 · altro** — Tutti attivano le notifiche.
  Sorgente: `globale:T-1731`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-085 · altro** — Verificare raggruppamento delle notifiche.
  Sorgente: `globale:T-0880`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.

## K2

