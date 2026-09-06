# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **50** tra 50 controlli P0–P2 ancora privi di evidenza conclusiva.
Stato del pacchetto: **0 superati**, **50 pendenti**.

Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.

- **K0 (40):** blocca qualsiasi rilascio.
- **K1 (50):** deve passare prima della condivisione stabile.
- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.

## K0

- [ ] **K-001 · sync-rete** — Preferiti sincronizzati tra dispositivi.
  Sorgente: `globale:T-0267`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-002 · usabilita-mobile** — Attivarle su iPhone PWA.
  Sorgente: `globale:T-0518`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-003 · usabilita-mobile** — Installare la PWA su iPhone.
  Sorgente: `globale:T-0308`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-004 · usabilita-mobile** — iPhone con schermo piccolo.
  Sorgente: `globale:T-1090`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-005 · usabilita-mobile** — iPhone con versione iOS minima supportata.
  Sorgente: `globale:T-1091`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-006 · usabilita-mobile** — iPhone con versione iOS più recente.
  Sorgente: `globale:T-1092`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-007 · usabilita-mobile** — Test Push su iPhone con PWA installata.
  Sorgente: `globale:T-0097`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-008 · usabilita-mobile** — Utilizzare l’app in automobile come passeggero.
  Sorgente: `globale:T-0597`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-009 · usabilita-mobile** — Verificare Live Photo iPhone.
  Sorgente: `globale:T-1435`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-010 · altro** — Produrre un resoconto dei dati eliminati.
  Sorgente: `globale:T-1350`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-011 · altro** — Verificare incremento della versione per eliminazione.
  Sorgente: `globale:T-1033`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-012 · media-upload** — Verificare cancellazione immediata dalla mappa.
  Sorgente: `globale:T-1463`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-013 · altro** — Notifica → post → indietro.
  Sorgente: `globale:T-1417`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-014 · altro** — Notifica automatica al responsabile tecnico.
  Sorgente: `globale:T-1552`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-015 · altro** — Notifica con apertura del post preciso.
  Sorgente: `globale:T-0083`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-016 · altro** — Ricevere una notifica dopo logout.
  Sorgente: `globale:T-0869`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-017 · altro** — Toccando la notifica mostrare “Contenuto non più disponibile”.
  Sorgente: `globale:T-0872`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-018 · altro** — Toccare la notifica e verificare apertura del post preciso.
  Sorgente: `globale:T-0707`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-019 · altro** — Verificare che il contenuto venga ricontrollato dal server quando la notifica viene aperta.
  Sorgente: `globale:T-1360`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-020 · altro** — Verificare che il telefono B riceva la notifica.
  Sorgente: `globale:T-0715`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-021 · altro** — Verificare ricezione della notifica.
  Sorgente: `usabilita:U0022`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-022 · altro** — Verificare una notifica con telefono bloccato.
  Sorgente: `globale:T-1364`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-023 · altro** — Verificare una notifica con telefono sbloccato.
  Sorgente: `globale:T-1365`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-024 · profili-ruoli** — Moltiplicare per tutti i Viaggiatori e familiari.
  Sorgente: `globale:T-1537`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-025 · profili-ruoli** — Passare a vista Viaggiatore.
  Sorgente: `usabilita:U0453`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-026 · social** — Aggiungere reazioni ai commenti.
  Sorgente: `globale:T-0058`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-027 · social** — Aggiungere risposte ai commenti.
  Sorgente: `globale:T-0059`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-028 · social** — Commenti periodici durante la prova.
  Sorgente: `globale:T-1126`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-029 · social** — Copiare il collegamento del commento.
  Sorgente: `globale:T-0968`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-030 · social** — Errore durante creazione del post con 10 allegati.
  Sorgente: `globale:T-1148`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-031 · social** — Espandere tutti i commenti.
  Sorgente: `globale:T-1398`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-032 · social** — Iniziare a scrivere un commento.
  Sorgente: `globale:T-1399`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-033 · mappe-posizione** — Copiare il collegamento della mappa.
  Sorgente: `globale:T-0971`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-034 · mappe-posizione** — Descrizione dei marker della mappa.
  Sorgente: `globale:T-1063`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-035 · mappe-posizione** — Itinerario → giorno → mappa → indietro.
  Sorgente: `globale:T-1414`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-036 · mappe-posizione** — Mappa → Google Maps → ritorno all’app.
  Sorgente: `globale:T-1416`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-037 · mappe-posizione** — Mappa con coordinate 0,0.
  Sorgente: `globale:T-0945`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-038 · mappe-posizione** — Mappa con dieci persone nello stesso punto.
  Sorgente: `globale:T-0946`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-039 · mappe-posizione** — Mappa con latitudine -90.
  Sorgente: `globale:T-0948;globale:T-0949`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-040 · mappe-posizione** — Mappa con longitudine -180.
  Sorgente: `globale:T-0950;globale:T-0951`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.

## K1

- [ ] **K-041 · mappe-posizione** — Mappa con una persona fuori dall’India.
  Sorgente: `globale:T-0953`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-042 · mappe-posizione** — Misurare batteria con mappa aperta.
  Sorgente: `globale:T-1659`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-043 · mappe-posizione** — Verificare mappa quando Google Maps non risponde.
  Sorgente: `globale:T-0961`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-044 · mappe-posizione** — Verificare mappa quando OpenFreeMap non risponde.
  Sorgente: `globale:T-0962`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-045 · altro** — Disattivazione completa delle notifiche.
  Sorgente: `globale:T-0077`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-046 · altro** — Inviare due notifiche con lo stesso tag.
  Sorgente: `globale:T-0861`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-047 · altro** — Misurare batteria con notifiche attive.
  Sorgente: `globale:T-1660`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-048 · altro** — Notifiche durante la prova.
  Sorgente: `globale:T-1127`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-049 · altro** — Tutti attivano le notifiche.
  Sorgente: `globale:T-1731`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-050 · altro** — Verificare raggruppamento delle notifiche.
  Sorgente: `globale:T-0880`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.

## K2

