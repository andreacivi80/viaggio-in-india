# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **34** tra 34 controlli P0–P2 ancora privi di evidenza conclusiva.
Stato del pacchetto: **0 superati**, **34 pendenti**.

Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.

- **K0 (40):** blocca qualsiasi rilascio.
- **K1 (50):** deve passare prima della condivisione stabile.
- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.

## K0

- [ ] **K-001 · usabilita-mobile** — Attivarle su iPhone PWA.
  Sorgente: `globale:T-0518`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-002 · usabilita-mobile** — Installare la PWA su iPhone.
  Sorgente: `globale:T-0308`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-003 · usabilita-mobile** — iPhone con schermo piccolo.
  Sorgente: `globale:T-1090`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-004 · usabilita-mobile** — iPhone con versione iOS minima supportata.
  Sorgente: `globale:T-1091`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-005 · usabilita-mobile** — iPhone con versione iOS più recente.
  Sorgente: `globale:T-1092`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-006 · usabilita-mobile** — Test Push su iPhone con PWA installata.
  Sorgente: `globale:T-0097`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-007 · usabilita-mobile** — Utilizzare l’app in automobile come passeggero.
  Sorgente: `globale:T-0597`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-008 · usabilita-mobile** — Verificare Live Photo iPhone.
  Sorgente: `globale:T-1435`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-009 · altro** — Notifica automatica al responsabile tecnico.
  Sorgente: `globale:T-1552`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-010 · altro** — Ricevere una notifica dopo logout.
  Sorgente: `globale:T-0869`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-011 · altro** — Verificare che il telefono B riceva la notifica.
  Sorgente: `globale:T-0715`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-012 · altro** — Verificare ricezione della notifica.
  Sorgente: `usabilita:U0022`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-013 · altro** — Verificare una notifica con telefono bloccato.
  Sorgente: `globale:T-1364`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-014 · altro** — Verificare una notifica con telefono sbloccato.
  Sorgente: `globale:T-1365`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-015 · profili-ruoli** — Moltiplicare per tutti i Viaggiatori e familiari.
  Sorgente: `globale:T-1537`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-016 · profili-ruoli** — Passare a vista Viaggiatore.
  Sorgente: `usabilita:U0453`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-017 · social** — Aggiungere reazioni ai commenti.
  Sorgente: `globale:T-0058`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-018 · social** — Aggiungere risposte ai commenti.
  Sorgente: `globale:T-0059`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-019 · social** — Commenti periodici durante la prova.
  Sorgente: `globale:T-1126`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-020 · social** — Copiare il collegamento del commento.
  Sorgente: `globale:T-0968`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-021 · social** — Errore durante creazione del post con 10 allegati.
  Sorgente: `globale:T-1148`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-022 · social** — Espandere tutti i commenti.
  Sorgente: `globale:T-1398`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-023 · social** — Iniziare a scrivere un commento.
  Sorgente: `globale:T-1399`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-024 · mappe-posizione** — Copiare il collegamento della mappa.
  Sorgente: `globale:T-0971`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-025 · mappe-posizione** — Mappa → Google Maps → ritorno all’app.
  Sorgente: `globale:T-1416`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-026 · mappe-posizione** — Mappa con dieci persone nello stesso punto.
  Sorgente: `globale:T-0946`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-027 · mappe-posizione** — Misurare batteria con mappa aperta.
  Sorgente: `globale:T-1659`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-028 · mappe-posizione** — Verificare mappa quando Google Maps non risponde.
  Sorgente: `globale:T-0961`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-029 · altro** — Disattivazione completa delle notifiche.
  Sorgente: `globale:T-0077`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-030 · altro** — Inviare due notifiche con lo stesso tag.
  Sorgente: `globale:T-0861`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-031 · altro** — Misurare batteria con notifiche attive.
  Sorgente: `globale:T-1660`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-032 · altro** — Notifiche durante la prova.
  Sorgente: `globale:T-1127`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-033 · altro** — Tutti attivano le notifiche.
  Sorgente: `globale:T-1731`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-034 · altro** — Verificare raggruppamento delle notifiche.
  Sorgente: `globale:T-0880`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.

## K1


## K2

