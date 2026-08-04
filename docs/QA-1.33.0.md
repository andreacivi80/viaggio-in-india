# Collaudo revisione 1.33.0 — REVOCATO

> Questo verbale non autorizza più la condivisione. Il 4 agosto 2026 è emersa
> una distinzione insufficiente nell'interfaccia tra password comune
> memorizzata e sessione personale verificata. La revisione successiva deve
> ripetere il gate partendo dai percorsi umani di accesso.

Data: 4 agosto 2026

## Esito

- Gate di usabilità e sicurezza di primo livello: **109/109**
- Fallimenti: **0**
- Controlli obbligatori saltati: **0**
- Database QA dopo il collaudo: **pulito**
- Verifica pubblica non distruttiva: **6/6**
- Verifica visuale mobile pubblica: **2/2**

## Ambiente

- QA isolato: `viaggio-in-india-2026-qa.pages.dev`
- Produzione: `https://viaggio-in-india-2026.pages.dev`
- Database e archivio media QA separati dalla produzione
- Revisione pubblicata: `1.33.0`

## Percorsi coperti

Primo accesso, password comune, collegamento personale, riapertura del dispositivo,
visitatore pubblico, viaggiatore, coordinatore, pubblicazione, foto, video con audio,
messaggio audio, commenti e allegati, reazioni, diario, mappa, documenti, posizione,
sincronizzazione tra dispositivi, modalità offline, idempotenza, caricamenti grandi,
concorrenza, rate-limit, autorizzazioni e pulizia dei dati di prova.

## Protezione dei dati

Prima della migrazione è stato esportato il backup
`backups/pre-1.33.0-2026-08-04.sql`. La migrazione `0014` aggiunge soltanto
21 trigger di sincronizzazione e non elimina né modifica i contenuti esistenti.
Gli aggiornamenti del Service Worker non ricaricano più forzatamente la pagina
durante una pubblicazione o un commento.
