# Release candidate 1.34.0

Data controllo: 4 agosto 2026.

## Regola di rilascio

La versione può essere indicata come condivisibile soltanto quando build, accesso pubblico, password, registrazione, ruoli, documenti, pubblicazione e verifica sul dominio online risultano superati. I test soltanto letti nel codice non vengono conteggiati come eseguiti.

## Controlli bloccanti eseguiti nel browser

| # | Controllo | Esito |
|---:|---|---|
| 1 | Revisione 1.34.0 visibile | SUPERATO |
| 2 | Dispositivo nuovo parte come Pubblico | SUPERATO |
| 3 | Area Gruppo richiede la password | SUPERATO |
| 4 | Password errata rifiutata con `Codice non corretto` | SUPERATO |
| 5 | Password corretta apre la creazione del profilo | SUPERATO |
| 6 | Scelta esplicita Viaggiatore/Coordinatore | SUPERATO |
| 7 | Creazione profilo coordinatore | SUPERATO |
| 8 | Creazione profilo viaggiatore | SUPERATO |
| 9 | Identità memorizzata sul dispositivo | SUPERATO |
| 10 | Dispositivo sbloccato non richiede di nuovo la password per pubblicare | SUPERATO |
| 11 | Viaggiatore non vede la griglia coordinatore | SUPERATO |
| 12 | Viaggiatore vede la propria cassaforte documenti | SUPERATO |
| 13 | Caricamento PDF passaporto | SUPERATO |
| 14 | Documento caricato indicato come presente | SUPERATO |
| 15 | Cancellazione documento con conferma | SUPERATO |
| 16 | Documento cancellato non più visibile | SUPERATO |
| 17 | Pubblicazione autenticata salvata sul server di prova | SUPERATO |
| 18 | Nuovo post visibile da un secondo dispositivo pubblico | SUPERATO |
| 19 | Pubblico non vede documenti privati | SUPERATO |
| 20 | Nome del visitatore salvato una sola volta | SUPERATO |
| 21 | Galleria multipla a scorrimento orizzontale | SUPERATO |
| 22 | Scroll snap e gesto touch orizzontale attivi | SUPERATO |

Totale browser bloccante: **22/22 superati**.

## Controlli tecnici

| Controllo | Esito |
|---|---|
| Build Vite di produzione | SUPERATO |
| Separazione API pubblico/sessione | SUPERATO per contratto; da riconfermare online |
| Documenti proprietario/coordinatore | SUPERATO per contratto; da riconfermare online |
| Cancellazione post/commenti riservata al proprietario o coordinatore | SUPERATO per contratto; da riconfermare online |
| Formati foto, audio, video e PDF | SUPERATO per validazione; da riconfermare online |
| Conservazione nome file nella coda offline | SUPERATO per implementazione; da riconfermare online |
| Posizione: inserimento e rimozione | Da riconfermare online con autorizzazione GPS reale |
| Commento pubblico e autore | Da riconfermare online; il server locale semplificato non implementa la rotta commenti |
| Notifiche | Limitate agli avvisi interni all'app, come concordato |

## Dati iniziali di rilascio

Lo script `db/reset-for-release.sql` elimina esclusivamente i dati di collaudo e lascia un solo contenuto iniziale: immagine India Insieme con audio, senza posizione. Non deve essere eseguito dopo l'inserimento dei dati reali.

## Stato

Il codice locale è candidato al rilascio. La dicitura **condivisibile** resta subordinata alla pubblicazione e alla ripetizione dei controlli critici sul dominio Cloudflare reale.
