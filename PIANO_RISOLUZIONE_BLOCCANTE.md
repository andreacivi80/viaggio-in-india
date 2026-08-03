# Tabella di risoluzione bloccante — India Insieme

Regola: una riga passa a **Completata** soltanto dopo prova reale. Nessuna funzione viene considerata valida perché è presente un pulsante.

| Ordine | Blocco da risolvere | Soluzione da realizzare | Prova obbligatoria di chiusura | Stato |
|---:|---|---|---|---|
| 1 | Identità non verificata | Account/sessione server, token sicuro persistente sul dispositivo, associazione profilo-dispositivo, logout e revoca | Un viaggiatore non può impersonare o modificare un altro profilo modificando localStorage/header | Da fare |
| 2 | Ruoli solo grafici | Autorizzazioni server per proprietario, coordinatore, viaggiatore e ospite; ogni endpoint verifica sessione e ruolo | Chiamate API dirette con ruolo errato ricevono 403 | Da fare |
| 3 | Documenti visibili a tutto il gruppo | Il viaggiatore riceve soltanto i propri documenti; coordinatore autorizzato riceve la matrice completa; pubblico nessun dato | Tre sessioni separate: pubblico 403, viaggiatore solo propri file, coordinatore tutti | Da fare |
| 4 | Codice comune troppo potente | Limitare `india26` all'ingresso/invito iniziale; trasformarlo in sessione e non usarlo come autorizzazione permanente | Il solo codice, senza sessione personale, non apre/elimina documenti o profili | Da fare |
| 5 | Nessuna idempotenza | Aggiungere `clientOperationId` univoco a post, commenti, reazioni, posizioni e documenti; risposta ripetuta restituisce lo stesso risultato | Inviare 10 volte la stessa operazione crea un solo record e un solo file | Da fare |
| 6 | Invii persi offline | Outbox IndexedDB per testo, Blob/allegati, commenti, posizioni e documenti; retry con backoff e stati visibili | Modalità aereo → pubblica → chiudi app → riapri → rete attiva → un solo invio completo | Da fare |
| 7 | Sincronizzazione pesante ogni 15 secondi | Endpoint incrementale con cursore/versione e cancellazioni; SSE/WebSocket quando sostenibile, polling incrementale di recupero | Il secondo telefono riceve la modifica senza scaricare tutto e senza spostare la lettura | Da fare |
| 8 | Upload non riprendibile | Upload per file/parti, avanzamento, pausa, ripresa, retry singolo, rollback e bonifica file orfani | Interrompere rete al 50%, riprendere senza ricominciare e senza duplicare | Da fare |
| 9 | Allegati persi chiudendo l'app | Salvare bozza e Blob in IndexedDB; ripristinare compositore e allegati | Chiudere forzatamente e ritrovare testo, foto, video e audio selezionati | Da fare |
| 10 | Formati telefono non garantiti | Validazione reale MIME/firma, supporto HEIC/HEIF/MOV/M4A, conversione/anteprima compatibile, messaggi per file non supportati | Matrice iPhone/Android con HEIC, MOV, MP4, M4A, WebM, JPEG, PNG | Da fare |
| 11 | Posizione senza scadenza | Sessioni di condivisione 15/30/60 minuti, timestamp, precisione, stato non recente, stop immediato | Scadenza automatica e rimozione/indicazione coerente su due telefoni | Da fare |
| 12 | Notifiche non push | Subscription Push, salvataggio server, eventi, lette/non lette, preferenze e deep link | App chiusa: ricezione notifica e apertura del post/commento esatto | Da fare |
| 13 | Preferiti temporanei | Tabella preferiti per utente, endpoint e sincronizzazione | Salva su telefono A, presente dopo riavvio e su telefono B | Da fare |
| 14 | Navigazione incompleta | URL stabili per giorno/post/commento/media/profilo, cronologia e ripristino anchor/scroll/map state | Sequenza Diario → mappa → marker → foto → indietro ritorna esattamente ai quattro stati | Da fare |
| 15 | Mappe e informazioni senza rete | Pacchetto offline minimo: tappe, coordinate, indirizzi, hotel, emergenze e mappa alternativa/statica | Modalità aereo: itinerario, indirizzi e navigazione testuale disponibili | Da fare |
| 16 | Nessun centro sincronizzazione | Schermata con in attesa/in corso/errore/sincronizzato, dimensione, tentativi, riprova/modifica/elimina | Tutti gli stati dell'outbox sono visibili e controllabili | Da fare |
| 17 | Nessun backup/ripristino | Backup D1 e media, procedura versionata, verifica integrità e prova di restore | Ripristino completo in ambiente di prova con conteggi e hash coerenti | Da fare |
| 18 | Archivio finale assente | Generazione lato server ZIP/PDF/HTML/CSV/JSON, selezione contenuti, avanzamento, parti e ripresa | Archivio completo scaricato, aperto offline e verificato senza file mancanti | Da fare |
| 19 | Emergenza e dati essenziali offline | Schermata Emergenza, hotel, assicurazione, ambasciata, contatti, tassista, biglietti essenziali | Funziona in modalità aereo e non espone dati sensibili al pubblico | Da fare |
| 20 | Mancanza di prove fisiche | Suite automatica + test iPhone, Android, due/tre dispositivi, rete lenta, cambio rete, app chiusa, India | Verbale con data, dispositivo, rete, risultato e prove per ogni scenario | Da fare |

## Sequenza di rilascio

| Revisione prevista | Contenuto | Condizione per pubblicare |
|---|---|---|
| 1.16.0 | Sessioni, ruoli e documenti autorizzati lato server | Test pubblico/viaggiatore/coordinatore tutti superati |
| 1.17.0 | Idempotenza e outbox offline | Test modalità aereo/riapertura/nessun duplicato superato |
| 1.18.0 | Sync incrementale e aggiornamenti tra dispositivi | Test A/B/C senza refresh completo superato |
| 1.19.0 | Upload riprendibile e compatibilità file telefono | Test rete interrotta + matrice HEIC/MOV/M4A superati |
| 1.20.0 | Posizione temporizzata, notifiche e preferiti | Test scadenza, Push e persistenza superati |
| 1.21.0 | Offline viaggio, emergenza e navigazione completa | Test modalità aereo e ritorno al punto superati |
| 1.22.0 | Archivio finale, backup e ripristino | Download/restore/integrità superati |
| 2.0.0 | Versione candidata per il viaggio | Test fisici completi e prova continuativa con PC spento superati |

## Primo blocco operativo

Si inizia dalle righe 1–4 insieme, perché autenticazione, ruoli e privacy dei documenti sono lo stesso confine di sicurezza. Non verranno caricati documenti reali prima della chiusura di questo blocco.
