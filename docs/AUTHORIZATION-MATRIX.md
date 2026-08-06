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

Il test touch `ui-password-access.spec.mjs` riproduce l’intero primo accesso su Galaxy S20 FE. La password accetta soltanto spazi esterni accidentali, apre il modulo di registrazione ma non crea da sola una sessione e non abilita funzioni private. Soltanto la registrazione con consenso produce token e profilo server; dopo un refresh completo il telefono conserva l’accesso personale, mostra esclusivamente i comandi del proprietario e pubblica realmente un post con risposta `201`, senza richiedere di nuovo password o nome. Profili, sessioni, post e password usati dal test esistono solo nel database locale temporaneo.

## Non-enumerabilità delle risorse private

Il test `extended-p0-resource-enumeration.mjs` confronta risorse reali e identificativi casuali. Pubblico, familiare e altro viaggiatore ricevono lo stesso diniego per documenti esistenti o inesistenti; l’elenco dispositivi contiene soltanto quelli del profilo corrente; dispositivi e inviti altrui non sono distinguibili da quelli inesistenti. I tentativi non revocano sessioni né alterano risorse altrui. Tutte le risorse vengono create e rimosse in D1 e storage locali temporanei.

## Griglia coordinatore e fonte autorevole

Il collaudo touch `ui-coordinator-grid-access.spec.mjs` usa quattro browser Galaxy S20 FE isolati. Pubblico e dispositivo con la sola password comune non ricevono una sessione e non vedono mai la griglia; il viaggiatore autenticato vede soltanto i propri comandi. Anche falsificando `role` e `profile_id` nella memoria locale, il telefono ripristina l’identità restituita dal server e non mostra la griglia. Soltanto la sessione coordinatore, legata alla chiave del proprio dispositivo, apre la dashboard. Un osservatore DOM verifica inoltre che i contenuti del coordinatore non compaiano neppure temporaneamente nei tre stati non autorizzati. Profili, inviti e database del test sono esclusivamente locali e vengono eliminati a fine esecuzione.

## Invito ricevuto dalla persona sbagliata

Il collaudo touch `ui-invite-misdelivery.spec.mjs` verifica su Galaxy S20 FE che un telefono con una sessione personale valida non venga mai ricollegato automaticamente quando apre per errore l’invito di un altro profilo. Il token, il profilo e il ruolo correnti restano invariati, l’invito non viene consumato e il destinatario corretto può ancora usarlo da un altro telefono. Per cambiare volontariamente profilo occorre prima bloccare l’accesso corrente. Se invece il token presente sul telefono è realmente scaduto, viene eliminato e il nuovo invito valido crea la nuova sessione. Durante il claim il controllo periodico della vecchia sessione resta sospeso, così non può cancellare il nuovo accesso per una condizione di gara.

## Modalità privata del browser

Il collaudo touch `ui-private-browser-session.spec.mjs` usa un Galaxy S20 FE e un contesto browser privato isolato. L’invito viene rimosso immediatamente dall’URL e la sessione resta disponibile dopo un refresh soltanto finché quel contesto rimane aperto. Dopo la chiusura completa, un nuovo contesto privato che apre lo stesso URL ripulito torna Pubblico: non contiene token, profilo, ruolo, nome, password comune o invito pendente, non mostra documenti o griglia coordinatore e riceve `401` dall’area privata. La copia dell’URL ripulito non trasferisce quindi alcun accesso permanente.

Il collaudo touch `ui-stale-password-session.spec.mjs` parte invece da un telefono contenente deliberatamente un token scaduto, un `profile_id`, un ruolo coordinatore e un nome fittizio. L’app elimina integralmente l’identità obsoleta, mantiene lo stato Pubblico dopo la sola password e non conserva il codice comune. La registrazione autorizzata produce poi un token e un profilo nuovi; dopo il refresh ricompare esclusivamente il nuovo proprietario. Il test è eseguito due volte su database locale temporaneo. Il controllo sorgente `security-surface.test.mjs` verifica inoltre che nessuna funzione privata residua accetti soltanto `x-group-code`: il vecchio endpoint `auth/unlock` resta disabilitato e non è richiamato dal client.

## Separazione tra identità e contenuti gestiti

Il collaudo touch `ui-people.spec.mjs` conserva l’identificativo della sessione coordinatore prima e dopo tre operazioni su un’altra persona: creazione del profilo, modifica e apertura dei relativi documenti. L’identificativo locale e l’etichetta di accesso restano quelli del coordinatore; la persona selezionata serve soltanto a scegliere il contenuto visualizzato. Tornando al Gruppo il dispositivo è ancora collegato al profilo originario. In questo modo un contenuto gestito non può diventare accidentalmente l’identità attiva del telefono.

## Inviti multipli e copia del link

Il collaudo touch `ui-multi-invite-copy.spec.mjs` crea dal telefono del coordinatore tre inviti personali per tre viaggiatori distinti. Per ciascuna scheda tocca `Crea invito personale`, tocca `Copia link` e legge realmente gli appunti del telefono: i tre URL sono differenti, non contengono query e conservano il segreto soltanto nel frammento. Tre contesti mobili nuovi aprono ciascuno il proprio link, ricevono tre profili differenti e mostrano l’etichetta di accesso corretta senza cambiare l’identità del coordinatore. Il successivo riutilizzo di ogni link viene respinto con `403` o `409` e non crea una sessione.

## Stati e recupero dai dinieghi

`CREDENTIAL-STATE-MACHINE.md` contiene il diagramma degli stati e la precedenza applicata dal server. `ACCESS-DENIAL-MESSAGES.md` collega i dinieghi effettivamente restituiti dall’API al recupero consentito all’utente. Il test `access-state-documentation.test.mjs` confronta automaticamente diagramma, tabella, messaggi server e istruzioni presenti nel client: fallisce se un messaggio documentato non esiste nel codice o se manca il corrispondente recupero visibile. La sola password lascia l’etichetta `Pubblico`, non crea una sessione e non può ripetere un’operazione privata rifiutata.

## PDF protetti da password

Il collaudo touch `ui-protected-pdf.spec.mjs` carica un PDF AES-256 realmente cifrato dal telefono del proprietario. Il file viene conservato nell’area privata, compare nella griglia del coordinatore e resta scaricabile senza che l’app richieda o memorizzi la password. Il visualizzatore riconosce `PasswordException`, non mostra pagine vuote o contenuto parziale e propone esplicitamente il lettore PDF del telefono. Proprietario e coordinatore ricevono lo stesso comportamento controllato; il proprietario elimina infine il file. La fixture contiene soltanto dati fittizi ed è verificata con password corretta, password errata e rendering visivo prima del test.

## Confine della chiave VAPID

Il test `vapid-secret-boundary.test.mjs` verifica che `VAPID_PRIVATE_KEY` sia letta soltanto dal Worker come binding segreto. L’endpoint pubblico `/api/push/config` restituisce esclusivamente `VAPID_PUBLIC_KEY`; client e configurazioni Wrangler versionate non contengono la chiave privata. Dopo ogni build, `scan-client-secrets.mjs` esamina inoltre tutti i file destinati al browser e blocca il rilascio se trova il nome o un valore assimilabile alla chiave privata.
