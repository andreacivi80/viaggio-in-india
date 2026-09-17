# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **6** tra 6 controlli P0–P2 ancora privi di evidenza conclusiva.
Stato del pacchetto: **0 superati**, **6 pendenti**.

Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.

- **K0 (40):** blocca qualsiasi rilascio.
- **K1 (50):** deve passare prima della condivisione stabile.
- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.

## K0

- [ ] **K-001 · usabilita-mobile** — Attivarle su iPhone PWA.
  Sorgente: `globale:T-0518`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-002 · usabilita-mobile** — Installare la PWA su iPhone.
  Sorgente: `globale:T-0308`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-003 · usabilita-mobile** — iPhone con versione iOS minima supportata.
  Sorgente: `globale:T-1091`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-004 · usabilita-mobile** — Test Push su iPhone con PWA installata.
  Sorgente: `globale:T-0097`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-005 · usabilita-mobile** — Utilizzare l’app in automobile come passeggero.
  Sorgente: `globale:T-0597`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.
- [ ] **K-006 · usabilita-mobile** — Verificare Live Photo iPhone.
  Sorgente: `globale:T-1435`. I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.

## K1


## K2

