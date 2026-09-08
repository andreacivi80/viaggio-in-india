# Thailandia Insieme

Applicazione mobile-first per condividere il viaggio WEROAD in Thailandia: itinerario, diario pubblico, foto, video, audio, commenti, reazioni, posizione volontaria e documenti privati.

## Servizio ufficiale

- Applicazione: `https://viaggio-in-thailandia-2026.pages.dev`
- Hosting e API: Cloudflare Pages Functions
- Database: Cloudflare D1
- File: Cloudflare R2
- Revisione applicativa corrente: `1.48.37`

Il servizio è indipendente dal computer di sviluppo. Lo spegnimento del computer non interrompe accesso, pubblicazioni o sincronizzazione.

## Accessi e privacy

- Il pubblico vede soltanto i contenuti pubblici.
- Il codice comune serve esclusivamente alla registrazione iniziale.
- Ogni viaggiatore usa una sessione personale associata al proprio dispositivo.
- La coordinatrice è unica e assegnata dal server; un viaggiatore non può auto-promuoversi.
- Documenti e posizione sono visibili soltanto secondo la matrice in `docs/AUTHORIZATION-MATRIX.md`.
- La politica di conservazione è in `docs/DATA-RETENTION-POLICY.md`.

## Verifica e rilascio

La build deve superare scansione dei segreti, test statici, L1, controlli mirati L2 e smoke test online. Le prove scriventi usano soltanto il progetto QA isolato; la produzione viene verificata senza creare dati di collaudo.

Comandi principali eseguibili direttamente con Node:

```text
node node_modules/vite/bin/vite.js build
node scripts/inject-sw-precache.mjs
node scripts/scan-client-secrets.mjs
node scripts/run-static-tests.mjs
node scripts/create-clean-source-archive.mjs
```

La copertura riconciliata è registrata in `docs/CONTROL-COVERAGE.md`. Un controllo è dichiarato superato soltanto quando `docs/CONTROL-EVIDENCE.json` contiene un'evidenza verificabile.

## Archivio sorgente

`scripts/create-clean-source-archive.mjs` crea una consegna riproducibile in `artifacts/source/`. L'archivio include sorgenti, configurazioni, migrazioni, test e documentazione, ma esclude sempre `.git`, `node_modules`, `.wrangler`, `dist`, backup, risultati di test e qualunque file `.env`.
