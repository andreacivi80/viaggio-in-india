# Integrazione controlli critici 1.43.3

Revisione mirata dei rischi K0/K1 residui nei 3.024 controlli sorgente, oltre al pacchetto ristretto da 120 già chiuso.

- **K0-S01 — errore di rendering:** un errore React non lascia la schermata bianca; compare un recupero esplicito senza cancellare i dati salvati. **PASS**
- **K0-S02 — storage bloccato o pieno:** il rifiuto di `localStorage`/`sessionStorage` non arresta l’app; la sessione corrente continua in memoria. **PASS**
- **K1-S03 — aggiornamento con cache precedente:** navigazione `network-first` quando online, cache versionata e fallback della shell quando offline. **PASS**
- **K1-S04 — isolamento offline dei dati privati:** API e documenti privati restano `network-only` e non entrano nella cache pubblica. **PASS**

Non sono emersi altri controlli K0/K1 distinti non già coperti: gli altri casi sorgente sono duplicati, cosmetici o rischio K2.
