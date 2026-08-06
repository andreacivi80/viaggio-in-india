# Matrice autorizzativa verificata

Questa matrice descrive i controlli applicati dal server. La grafica non concede mai privilegi: ogni richiesta viene rivalidata dall’API usando una sessione personale o una sessione ospite.

| Operazione | Pubblico | Familiare / ospite | Viaggiatore | Proprietario | Coordinatore |
|---|---:|---:|---:|---:|---:|
| Vedere post pubblico | Sì | Sì | Sì | Sì | Sì |
| Vedere post familiari | No | Sì | Sì | Sì | Sì |
| Vedere post del gruppo | No | No | Sì | Sì | Sì |
| Vedere un post privato | No | No | No | Solo il proprio | Solo se proprietario |
| Commentare o reagire | Serve identità ospite/personale | Sì, se vede il post | Sì, se vede il post | Sì | Sì |
| Pubblicare | No | No | Sì | Sì | Sì |
| Modificare profilo | No | No | Solo il proprio | Sì | Tutti |
| Creare profili e inviti | No | No | No | No | Sì |
| Vedere documenti | No | No | Solo i propri | Sì | Tutti |
| Caricare/sostituire/eliminare documenti | No | No | Solo i propri | Sì | Solo i propri |
| Verificare documenti altrui | No | No | No | No | Sì |
| Vedere le posizioni del gruppo | No | No | Sì | Sì | Sì |
| Aggiornare/eliminare posizione | No | No | Solo la propria | Sì | Solo la propria |
| Inviare notifica globale di prova | No | No | No | No | Sì |

## Regole non negoziabili

- La password comune verifica soltanto l’ingresso al flusso di registrazione: non identifica una persona e non autorizza operazioni private.
- Un profilo esistente si collega con un invito personale monouso; l’endpoint storico di sblocco non crea sessioni.
- I nuovi inviti tengono il token nel frammento `#invite=` (mai inviato al server) e l’app lo rimuove subito dalla barra prima del claim; i vecchi link `?invite=` restano leggibili soltanto per compatibilità.
- La sessione personale è legata a una chiave casuale del dispositivo: copiare il solo token in un altro browser o telefono restituisce 401.
- Anche la sessione familiare è legata alla chiave del dispositivo: se il token viene copiato, il server ignora l’identità ospite e mostra soltanto il contenuto pubblico.
- Il rinnovo ruota atomicamente il token: il telefono conserva solo quello nuovo e quello precedente viene respinto immediatamente.
- Il server ricava nome, profilo e ruolo dalla sessione: valori dichiarati dal browser non possono impersonare altri viaggiatori.
- Il consenso privacy è esplicito nelle nuove registrazioni; data e versione del consenso non vengono esposte nello stato condiviso.
- I test con scritture accettano soltanto localhost o il dominio QA e rifiutano sempre il dominio ufficiale.

Evidenza automatica principale: `extended-p0-authorization-matrix.mjs`, eseguita su un database D1 e uno storage temporanei con pulizia finale.

L’inventario machine-readable completo è in `docs/API-AUTHORIZATION-INVENTORY.json`.
Il test `endpoint-authorization-inventory.test.mjs` confronta tutte le rotte dichiarate nel Worker e fallisce se una nuova rotta viene aggiunta senza una policy esplicita.

## Allineamento comandi e API

| Comando UI | Visibile a | Controllo server |
|---|---|---|
| Pubblica | Viaggiatore o coordinatore con sessione verificata | `POST /posts`: sessione personale |
| Condividi/rimuovi posizione | Proprietario | `POST/DELETE /locations`: profilo della sessione uguale alla risorsa |
| Apri documenti | Viaggiatore o coordinatore | `GET /private` e media privata: sessione personale |
| Carica/elimina documento | Proprietario | `POST/DELETE /documents`: stesso profilo della sessione |
| Verifica documenti del gruppo | Coordinatore | `POST /documents`: coordinatore senza sostituzione del file altrui |
| Crea profilo o invito | Coordinatore | `POST /profiles` e `POST /auth/invites`: ruolo coordinatore |
| Modifica/elimina contenuto | Proprietario o coordinatore | campo `can_manage` derivato dal server e controllo ripetuto nell’endpoint |
| Commenta/reagisce | Profilo o familiare identificato | sessione personale o ospite valida e autorizzata alla visibilità del post |

La UI nasconde i comandi non pertinenti, ma la sicurezza non dipende dalla UI: una richiesta forzata viene comunque respinta dal Worker.

## Confini della sessione

- Senza token, con token scaduto o con token alterato, l’area privata restituisce `401`.
- La sola password comune non apre endpoint personali e non crea un profilo.
- Una sessione valida deve essere accompagnata dalla chiave del dispositivo associato.
- Logout e revoca rendono subito inutilizzabile il token precedente; un accesso successivo richiede un nuovo invito e produce un token differente.
- Le risposte di autenticazione e i contenuti privati, sia concessi sia negati, usano sempre `Cache-Control: no-store`.
- Tentativi ripetuti con sessioni false non recuperano privilegi; i tentativi ripetuti con password errata attivano `429` senza creare profili.

Evidenze automatiche: `extended-p0-auth-lifecycle.mjs` (68/68) e `extended-p0-access-session-boundaries.mjs` (17/17), eseguite soltanto su database e storage temporanei locali.

Il collaudo touch `ui-role-live.spec.mjs` viene eseguito su un Galaxy S20 FE simulato e su profili locali temporanei. Verifica due flussi: aggiornamento immediato di ruolo/revoca con ritorno tramite cronologia e apertura del Gruppo; avvio con una sessione realmente scaduta e dati locali obsoleti. In entrambi i casi il server resta la fonte autorevole, il telefono cancella token/profilo/ruolo/nome obsoleti e non rimonta documenti o griglia coordinatore.

## Permesso posizione

Il test touch `ui-location.spec.mjs` usa un Galaxy S20 FE e verifica il ciclo completo del GPS: consenso durante l’uso, coordinate restituite dal telefono, scrittura soltanto col profilo autorizzato, sincronizzazione al coordinatore, isolamento del pubblico, rimozione, diniego senza alcuna richiesta di scrittura e nuova condivisione dopo avere riattivato il permesso dalle impostazioni. Il test viene eseguito su profili e storage locali temporanei.

## Permesso microfono

Il test touch `ui-microphone-permissions.spec.mjs` usa un Galaxy S20 FE e concede il microfono soltanto al contesto mobile temporaneo. Verifica che Registra avvii realmente `MediaRecorder`, che Ferma chiuda la traccia e che venga creato un allegato audio riproducibile. Non pubblica contenuti e non usa profili ufficiali.

## Accesso iniziale e password

Il test touch `ui-password-access.spec.mjs` riproduce l’intero primo accesso su Galaxy S20 FE. La password accetta soltanto spazi esterni accidentali, apre il modulo di registrazione ma non crea da sola una sessione e non abilita funzioni private. Soltanto la registrazione con consenso produce token e profilo server; dopo un refresh completo il telefono conserva l’accesso personale e mostra esclusivamente i comandi del proprietario. Profili, sessioni e password usati dal test esistono solo nel database locale temporaneo.

## Non-enumerabilità delle risorse private

Il test `extended-p0-resource-enumeration.mjs` confronta risorse reali e identificativi casuali. Pubblico, familiare e altro viaggiatore ricevono lo stesso diniego per documenti esistenti o inesistenti; l’elenco dispositivi contiene soltanto quelli del profilo corrente; dispositivi e inviti altrui non sono distinguibili da quelli inesistenti. I tentativi non revocano sessioni né alterano risorse altrui. Tutte le risorse vengono create e rimosse in D1 e storage locali temporanei.
