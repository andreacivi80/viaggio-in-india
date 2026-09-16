# Decisione sulla conservazione della sessione

## Valutazione

Un cookie `Secure; HttpOnly; SameSite=Strict` ridurrebbe l'esposizione del token di sessione a un eventuale script eseguito nella pagina. Non elimina però da solo il rischio: richiede protezione CSRF, rotazione del cookie, revoca per dispositivo e una migrazione coordinata di tutte le richieste API, dei flussi offline e dei collegamenti personali.

L'applicazione usa attualmente un token casuale nel `localStorage` insieme a una chiave distinta del dispositivo. Il server conserva soltanto gli hash, verifica entrambe le credenziali, ruota il token, applica scadenza e inattività, e permette la revoca del singolo dispositivo. La Content Security Policy impedisce script inline e origini di script non autorizzate. I dati API privati non sono memorizzati dal Service Worker.

## Decisione corrente

Non sostituire il meccanismo durante la fase di rilascio già convalidata: una migrazione parziale potrebbe interrompere accesso, upload riprendibili e funzionamento offline. Il rischio residuo viene mitigato con CSP restrittiva, assenza di HTML utente eseguibile, binding al dispositivo, rotazione e revoca.

La migrazione futura consigliata è un cookie di sessione `Secure; HttpOnly; SameSite=Strict`, mantenendo una chiave di dispositivo separata e aggiungendo token CSRF per tutte le operazioni mutanti. Deve essere rilasciata atomicamente e collaudata su login, inviti, due dispositivi, offline, upload, logout e revoca prima di rimuovere il token corrente.

## Regola di sicurezza

- Nessun token o cookie di sessione entra in URL, log, notifiche o cache condivise.
- Le sessioni restano revocabili per dispositivo e scadono lato server.
- Non si introduce un cookie leggibile da JavaScript.
- La sostituzione avverrà solo con test di regressione L1/L2 completi e rollback verificato.
