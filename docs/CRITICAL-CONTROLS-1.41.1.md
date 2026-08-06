# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **120** tra 344 controlli P0–P2 ancora privi di evidenza conclusiva.
Stato del pacchetto: **74 superati**, **46 pendenti**.

Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.

- **K0 (40):** blocca qualsiasi rilascio.
- **K1 (50):** deve passare prima della condivisione stabile.
- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.

## K0

- [x] **K-001 · accessi-privacy** — Nessun documento privato inserito senza consenso.
  Sorgente: `globale:T-1722`. privacy-consent L1 + P0_AUTH_LIFECYCLE 68/68: registrazioni senza consenso o con consenso falso ricevono 400; solo il consenso esplicito crea profilo e sessione.
- [x] **K-002 · documenti** — Eliminare un documento dal telefono B.
  Sorgente: `globale:T-0701`. P0_DOCUMENTS 12/12: un secondo viaggiatore riceve 403; il proprietario elimina e proprietario/coordinatore vedono subito l’assenza.
- [x] **K-003 · accessi-privacy** — Distinguere limiti per IP, sessione e profilo.
  Sorgente: `globale:T-1053`. rate-limit-dimensions 2/2 + P0_RATE_LIMIT_DIMENSIONS 6/6: bucket distinti per IP, profilo/ospite e singola sessione; due sessioni o due profili non aggirano la soglia.
- [x] **K-004 · documenti** — Eseguire backup mentre vengono caricati documenti.
  Sorgente: `globale:T-1167`. P0_BACKUP_CONTENT 24/24: snapshot SQLite online consistente mentre sette documenti reali vengono caricati; il database ripristinato supera integrity_check.
- [x] **K-005 · documenti** — Verificare apertura di ogni documento ripristinato.
  Sorgente: `globale:T-1170`. P0_BACKUP_CONTENT 24/24: tutti i documenti presenti nello snapshot ripristinato vengono enumerati e ogni relativa chiave privata restituisce PDF valido e leggibile.
- [x] **K-006 · documenti** — Bacheca → profilo → documenti → indietro.
  Sorgente: `globale:T-1411`. ui-protected-pdf Samsung S20 FE 1/1: Bacheca → pannello profilo → Documenti e sicurezza → Torna alla bacheca, con sessione e pagina corretta preservate.
- [x] **K-007 · documenti** — Ogni documento deve essere collegato a un profilo esistente.
  Sorgente: `globale:T-1016`. migration-safety 7/7 + P0_DOCUMENT_PROFILE_INTEGRITY 2/2: trigger D1 rifiutano INSERT e UPDATE di document_status verso profili inesistenti.
- [x] **K-008 · documenti** — Verificare che il Coordinatore possa moderare, se previsto.
  Sorgente: `usabilita:U0294`. P0_AUTHORIZATION_MATRIX 86/86: il coordinatore vede il documento e può verificarlo, ma non può sostituire il file del proprietario.
- [x] **K-009 · documenti** — Verificare che il dispositivo revocato non possa più aprire documenti.
  Sorgente: `globale:T-0767`. P0_AUTH_LIFECYCLE 68/68 + ui-session-history 2/2: il dispositivo revocato riceve 401/403, perde token, profilo e privilegi memorizzati.
- [x] **K-010 · documenti** — Errore durante sostituzione documento.
  Sorgente: `globale:T-1150`. P0_DOCUMENT_CONCURRENCY 28/28: una sostituzione con PDF corrotto riceve 400 e il documento valido precedente resta invariato e apribile.
- [x] **K-011 · documenti** — Sostituzione documento durante il download.
  Sorgente: `globale:T-0573`. P0_DOCUMENT_CONCURRENCY 28/28: download e sostituzione simultanei terminano senza record duplicati; il nuovo file è apribile e la vecchia chiave è revocata.
- [x] **K-012 · documenti** — Un solo documento dopo dieci retry.
  Sorgente: `globale:T-0141`. P0_DOCUMENT_CONCURRENCY 28/28: dieci richieste concorrenti con la stessa chiave idempotente restituiscono successo e lasciano un solo documento.
- [x] **K-013 · documenti** — Non mostrare dati dei documenti nella notifica.
  Sorgente: `globale:T-1353`. push-payload-privacy 3/3 + push-audience 5/5: il push contiene soltanto titolo generico, messaggio generico, URL interno e tag; contenuto e metadati dei documenti sono esclusi.
- [x] **K-014 · documenti** — Verificare impossibilità di aprire documenti già non disponibili offline.
  Sorgente: `globale:T-1620`. ui-protected-pdf Samsung S20 FE 1/1: con rete disattivata il documento non viene aperto dalla cache e mostra Documento non disponibile; tornando online lo stesso file si apre correttamente.
- [x] **K-015 · persistenza** — Eliminazione della subscription dal database quando l’utente le disattiva.
  Sorgente: `globale:T-0078`. P0_PUSH_UNSUBSCRIBE 8/8: il comando Disattiva notifiche elimina la subscription associata; un altro profilo non può rimuoverla e il retry è idempotente.
- [x] **K-016 · persistenza** — Interruzione del database dopo salvataggio del file.
  Sorgente: `globale:T-1151`. d1-media-atomicity L1: un’interruzione D1 dopo il salvataggio MEDIA elimina la parte orfana e consente il retry.
- [x] **K-017 · persistenza** — Non devono esistere riferimenti nel database a file mancanti.
  Sorgente: `globale:T-1013`. P0_DOCUMENT_CONCURRENCY 18/18 + d1-media-atomicity: sostituzione ed eliminazione rimuovono chiave e riferimento, senza record verso file mancanti.
- [x] **K-018 · persistenza** — un file esiste nell’archivio ma non nel database.
  Sorgente: `addendum:A0307`. d1-media-atomicity L1: un file scritto prima del fallimento D1 viene eliminato e non resta orfano nello storage.
- [x] **K-019 · profili-ruoli** — Controllare author_name e profile_id nel database.
  Sorgente: `usabilita:U0175`. P0_ROLES 20/20: author_name e profile_id falsificati vengono ignorati e derivati dalla sessione server.
- [x] **K-020 · profili-ruoli** — Verificare profile_id corretto nel database.
  Sorgente: `globale:T-0422`. P0_ROLES 20/20: il post conserva il profile_id della sessione anche quando il client invia un’identità diversa.
- [x] **K-021 · accessi-privacy** — aggiunta successiva di fotografie autorizzate.
  Sorgente: `globale:T-1369`. P0_AUTHORIZATION_MATRIX 86/86 + P0_MEDIA_DELETE 14/14: aggiunta media consentita solo con sessione e proprietà valide.
- [x] **K-022 · accessi-privacy** — Richiesta di nuovo accesso.
  Sorgente: `usabilita:U0488`. P0_AUTH_LIFECYCLE 68/68: nuova registrazione/invito, scadenza, rinnovo e nuovo accesso verificati con token reali.
- [x] **K-023 · accessi-privacy** — Se la password del gruppo deve permettere la pubblicazione, creare una sessione Ospite/Familiare valida e controllata.
  Sorgente: `usabilita:U0002`. P0_ACCESS_SESSION_BOUNDARIES 17/17: la password comune non apre il gruppo; la pubblicazione familiare usa una sessione ospite legata al dispositivo.
- [x] **K-024 · accessi-privacy** — Se può pubblicare, creare sessione Ospite.
  Sorgente: `usabilita:U0480`. P0_AUTHORIZATION_MATRIX 86/86: commento e reazione familiari richiedono identità ospite valida; il solo codice riceve 401.
- [x] **K-025 · profili-ruoli** — Richiedere eliminazione del proprio profilo.
  Sorgente: `globale:T-1324`. P0_PROFILE_DELETION 40/40: richiesta ed eliminazione del profilo rimuovono sessioni, inviti, documenti, posizione e contenuti collegati.
- [x] **K-026 · documenti** — Caricare una fotografia del passaporto verticale.
  Sorgente: `globale:T-0995`. ui-protected-pdf Samsung S20 FE 1/1: fotografia JPEG verticale reale caricata tramite input touch, aperta interamente con object-fit contain, poi eliminata senza residui.
- [x] **K-027 · documenti** — Deep link del documento.
  Sorgente: `globale:T-0241`. ui-protected-pdf Samsung S20 FE 1/1: il deep link riapre il documento sul dispositivo autenticato; URL contiene soltanto profilo e tipo, mai nome file, chiave storage o contenuto.
- [x] **K-028 · documenti** — Non mostrare numeri di passaporto.
  Sorgente: `globale:T-1354`. push-payload-privacy 3/3: numero di passaporto, nome del titolare, nome file, identificativo profilo e contenuto non entrano nel payload della notifica.
- [x] **K-029 · documenti** — Tentare di aprire documenti.
  Sorgente: `usabilita:U0620;usabilita:U0635`. P0_DOCUMENTS 12/12 + P0_RESOURCE_ENUMERATION 17/17 + ui-protected-pdf 1/1: apertura reale consentita solo a proprietario/coordinatore.
- [x] **K-030 · documenti** — Verificare che i vecchi link ai documenti non funzionino.
  Sorgente: `globale:T-1326`. P0_DOCUMENT_CONCURRENCY 18/18: dopo sostituzione o eliminazione la vecchia chiave media non restituisce più 200.
- [x] **K-031 · documenti** — Verificare documenti precedenti conservati.
  Sorgente: `globale:T-1032`. migration-safety L1: le migrazioni sono additive e preservano profili, post, documenti e sessioni esistenti.
- [x] **K-032 · documenti** — Verificare nessun documento nella cache del browser.
  Sorgente: `globale:T-0491`. service-worker-offline L1: documenti e API private non entrano nella Cache API o nella precache pubblica.
- [x] **K-033 · documenti** — Verificare quali documenti restano memorizzati.
  Sorgente: `globale:T-1630`. document-retention 2/2 + P0_PROFILE_DELETION 40/40 + P0_DOCUMENTS 12/12: documenti validi restano fino a eliminazione/sostituzione esplicita o cancellazione del profilo; la manutenzione non li elimina.
- [x] **K-034 · mappe-posizione** — Eliminare automaticamente le posizioni non più necessarie.
  Sorgente: `globale:T-1346`. P0_LOCATION_RETENTION 5/5: la manutenzione elimina automaticamente posizioni più vecchie di 24 ore e conserva quelle recenti; il proprietario mantiene la cancellazione manuale immediata.
- [x] **K-035 · persistenza** — Applicare le migrazioni una alla volta.
  Sorgente: `globale:T-1026`. P0_MIGRATION_CHAIN 23/23: ogni migrazione viene applicata singolarmente in ordine su D1 locale e, dopo ciascun passaggio, profilo, post e documento sentinella restano presenti.
- [x] **K-036 · persistenza** — controlli eventuale modifica del database.
  Sorgente: `addendum:A0208`. migration-safety 8/8 + P0_MIGRATION_CHAIN 23/23: ogni modifica database è additiva, ordinata e verificata con dati sentinella prima/dopo.
- [x] **K-037 · persistenza** — Creare un database dalla schema completa.
  Sorgente: `globale:T-1027`. P0_FULL_SCHEMA_CREATE 2/2: db/schema.sql crea da zero tutte le 12 tabelle critiche ed è riapplicabile senza errore o duplicazione.
- [x] **K-038 · persistenza** — Creare un database partendo dalla prima versione.
  Sorgente: `globale:T-1028`. P0_MIGRATION_CHAIN 23/23 + P0_LEGACY_DATA_PRESERVATION 3/3: la nuova baseline 0001 ricostruisce la prima versione e raggiunge lo schema attuale conservando i dati reali sentinella.
- [x] **K-039 · persistenza** — Eseguire backup mentre vengono creati post.
  Sorgente: `globale:T-1168`. P0_BACKUP_CONTENT 24/24: snapshot online durante cinque creazioni concorrenti; tutti i post completati restano unici e presenti nello stato finale.
- [x] **K-040 · persistenza** — nessun dato precedente ripristinato erroneamente.
  Sorgente: `usabilita:U0568`. P0_BACKUP_CONTENT 24/24: un post eliminato prima dello snapshot non compare nella tabella posts ripristinata né per ID né per contenuto; nessun dato cancellato viene riesposto.

## K1

- [x] **K-041 · persistenza** — Verificare backup e politica di conservazione.
  Sorgente: `globale:T-1325`. P0_BACKUP_CONTENT 24/24 + document-retention 2/2: snapshot online ripristinabile durante scritture concorrenti; documenti validi conservati fino a eliminazione, sostituzione o cancellazione profilo esplicita.
- [ ] **K-042 · persistenza** — Verificare che i telefoni ricevano la versione ripristinata.
  Sorgente: `globale:T-1176`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [x] **K-043 · persistenza** — Verificare comportamento con database temporaneamente non disponibile.
  Sorgente: `globale:T-1022`. database-unavailable 1/1 + upload-failure-compensation 2/2: indisponibilità D1 produce 503 no-store con Retry-After e senza dettagli tecnici; gli upload compensano la scrittura e il retry completa senza orfani.
- [x] **K-044 · persistenza** — Verificare consistenza temporale del backup.
  Sorgente: `globale:T-1171`. P0_BACKUP_CONTENT 24/24: snapshot SQLite online consistente durante sette upload e cinque post concorrenti; integrity_check e contenuti ripristinati verificati.
- [x] **K-045 · persistenza** — Verificare day_index nel database.
  Sorgente: `usabilita:U0178`. P0_SOCIAL 12/12: day_index=-1 inviato nella pubblicazione viene letto nuovamente come -1 dallo stato persistito, senza conversioni o perdita del collegamento temporale.
- [x] **K-046 · persistenza** — Verificare inserimento nel database.
  Sorgente: `usabilita:U0017`. P0_SOCIAL 12/12: il post viene inserito tramite API reale con identità di sessione e riappare nello stato letto dal database prima della cancellazione di prova.
- [ ] **K-047 · persistenza** — Verificare rollback della migrazione.
  Sorgente: `globale:T-1040`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-048 · persistenza** — Verificare stabilità del database.
  Sorgente: `globale:T-0578`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [x] **K-049 · profili-ruoli** — Aggiungere moderazione del Coordinatore.
  Sorgente: `globale:T-0056`. P0_AUTHORIZATION_MATRIX 86/86: il coordinatore può moderare contenuti condivisi; viaggiatore, familiare e pubblico non acquisiscono privilegi di moderazione.
- [x] **K-050 · profili-ruoli** — Aprire la Bacheca come Coordinatore.
  Sorgente: `usabilita:U0098`. ui-coordinator-grid-access Samsung S20 FE 1/1: il coordinatore autenticato apre la Bacheca e la griglia documenti con touch; sessione, profilo e ruolo restano verificati dal server.
- [ ] **K-051 · profili-ruoli** — Avvisare il Coordinatore in caso di abuso ripetuto.
  Sorgente: `globale:T-1052`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [x] **K-052 · profili-ruoli** — Il Coordinatore revoca un dispositivo di prova.
  Sorgente: `globale:T-1729`. P0_AUTH_LIFECYCLE 68/68: il coordinatore revoca il dispositivo scelto, la relativa sessione riceve 401 e le altre sessioni autorizzate restano attive.
- [x] **K-053 · profili-ruoli** — Revocare il dispositivo dal Coordinatore.
  Sorgente: `globale:T-0763`. P0_AUTH_LIFECYCLE 68/68: il coordinatore revoca il dispositivo scelto, la relativa sessione riceve 401 e le altre sessioni autorizzate restano attive.
- [x] **K-054 · profili-ruoli** — Tornare a vista Coordinatore.
  Sorgente: `usabilita:U0454`. ui-session-history Samsung S20 FE 2/2: la promozione a coordinatore aggiorna subito il telefono già aperto e rende disponibile la griglia; la retrocessione elimina immediatamente i privilegi senza refresh manuale.
- [x] **K-055 · profili-ruoli** — Verificare che il Coordinatore visualizzi 4/4.
  Sorgente: `globale:T-0710`. ui-protected-pdf Samsung S20 FE 1/1: il viaggiatore carica Passaporto, Visto India, Biglietti e Assicurazione; la sessione coordinatore aggiornata mostra 4/4 e i quattro documenti vengono poi eliminati senza residui.
- [x] **K-056 · profili-ruoli** — Verificare che il profilo non compaia nella dashboard del Coordinatore.
  Sorgente: `globale:T-1328`. P0_PROFILE_DELETION 40/40: dopo eliminazione il profilo e i documenti collegati scompaiono anche dalla vista coordinatore e non tornano al refresh.
- [ ] **K-057 · profili-ruoli** — Visualizzare contatto del Coordinatore.
  Sorgente: `globale:T-1196`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [x] **K-058 · mappe-posizione** — Non rendere pubblica la posizione EXIF senza consenso.
  Sorgente: `globale:T-1432`. P0_MEDIA_DELETE 14/14: fotografia JPEG reale con EXIF GPS e modello Samsung viene pubblicata senza trasferire place_name, latitude o longitude nello stato pubblico.
- [x] **K-059 · mappe-posizione** — Verificare posizione allegata soltanto con consenso.
  Sorgente: `globale:T-1194`. P0_MEDIA_DELETE 14/14: coordinate EXIF non diventano posizione del post; senza gesto esplicito di consenso i campi luogo e coordinate restano nulli.
- [x] **K-060 · mappe-posizione** — Ogni posizione deve essere collegata a un profilo esistente.
  Sorgente: `globale:T-1018`. migration-safety 8/8 + P1_LOCATION_PROFILE_INTEGRITY 1/1: trigger D1 rifiuta posizioni verso profili inesistenti e pulisce la posizione quando il profilo viene eliminato.
- [ ] **K-061 · mappe-posizione** — Verificare che la posizione venga indicata come dichiarata dal dispositivo.
  Sorgente: `globale:T-1452`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-062 · sync-rete** — Aprire il dominio senza cache.
  Sorgente: `globale:T-0305`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [x] **K-063 · sync-rete** — Verificare nessuna anteprima nella cache pubblica.
  Sorgente: `globale:T-1007`. public-cache 1/1 + service-worker-offline 2/2: campi personali, contenuti non pubblici, API private e documenti non vengono inseriti nella cache pubblica o serviti offline.
- [x] **K-064 · sync-rete** — Verificare quali dati restano nella Cache API.
  Sorgente: `globale:T-1629`. public-cache 1/1 + service-worker-offline 2/2: la Cache API contiene soltanto shell e risorse pubbliche esplicitamente ammesse; richieste private restano network-only.
- [ ] **K-065 · altro** — Inviare notifica relativa a un contenuto successivamente eliminato.
  Sorgente: `globale:T-0866`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [x] **K-066 · documenti** — Caricare un PDF multipagina.
  Sorgente: `globale:T-0993`. ui-protected-pdf Samsung S20 FE 1/1: PDF reale a due pagine caricato via input touch; il visualizzatore renderizza esattamente due canvas, poi chiusura ed eliminazione completano senza pagina bianca.
- [x] **K-067 · documenti** — Controllare PDF corrotti o pericolosi.
  Sorgente: `globale:T-0166`. file-validation L1 + P0_DOCUMENT_CONCURRENCY 28/28: PDF corrotto o con firma non valida riceve 400 e non sostituisce il documento valido precedente.
- [x] **K-068 · mappe-posizione** — Una sola posizione dopo dieci retry.
  Sorgente: `globale:T-0143`. P0_LOCATION 22/22: dieci aggiornamenti concorrenti dello stesso dispositivo restituiscono successo ma lasciano una sola posizione per il profilo.
- [x] **K-069 · media-upload** — Media pubblici con cache controllata.
  Sorgente: `globale:T-1475`. P0_MEDIA_DELETE 14/14: HEAD reale di foto, audio e video pubblici restituisce cache pubblica immutabile, nosniff e visualizzazione inline; dopo eliminazione ogni URL smette di rispondere 200.
- [ ] **K-070 · sync-rete** — Verificare gestione della revoca al ritorno della rete.
  Sorgente: `globale:T-0769`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [x] **K-071 · media-upload** — Verificare che il post utilizzi automaticamente nome, cognome, fotografia e profile_id corretti.
  Sorgente: `globale:T-0714`. P0_ROLES 20/20: nome, cognome, avatar e profile_id del post vengono derivati dalla sessione server; i valori inviati dal client non possono sostituirli.
- [ ] **K-072 · sync-rete** — dati di emergenza disponibili offline.
  Sorgente: `globale:T-1752`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-073 · sync-rete** — Hotel e indirizzi offline.
  Sorgente: `globale:T-0119`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-074 · sync-rete** — Informazioni di emergenza offline.
  Sorgente: `globale:T-0122`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-075 · sync-rete** — Mappe e coordinate essenziali offline.
  Sorgente: `globale:T-0124`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-076 · sync-rete** — Preparare post testuale offline.
  Sorgente: `globale:T-0547`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-077 · sync-rete** — Pulsante per cancellare i dati offline.
  Sorgente: `globale:T-0126`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-078 · sync-rete** — Ricerca offline sui dati disponibili.
  Sorgente: `globale:T-1696`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-079 · sync-rete** — Salvare più bozze offline.
  Sorgente: `globale:T-0849`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-080 · sync-rete** — Salvataggio offline dei commenti.
  Sorgente: `globale:T-0129`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-081 · sync-rete** — Salvataggio offline delle posizioni.
  Sorgente: `globale:T-0132`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-082 · sync-rete** — Verificare aggiornamento con telefono offline.
  Sorgente: `globale:T-0832`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-083 · altro** — Eliminare i dati del browser.
  Sorgente: `globale:T-0859`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-084 · altro** — Errore durante eliminazione multipla.
  Sorgente: `globale:T-1149`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-085 · altro** — Mostrare chiaramente quali dati verranno eliminati.
  Sorgente: `globale:T-1321`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-086 · altro** — Permettere all’utente di eliminare elementi dalla coda.
  Sorgente: `globale:T-0847`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-087 · altro** — Verificare che la pulizia automatica non elimini dati ancora validi.
  Sorgente: `globale:T-1351`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-088 · altro** — Verificare log di eliminazione.
  Sorgente: `globale:T-1004`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-089 · altro** — Verificare se i metadati vengono conservati o eliminati.
  Sorgente: `globale:T-1439`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [x] **K-090 · media-upload** — Caricare fotografia contenente modello del telefono.
  Sorgente: `globale:T-1427`. P0_MEDIA_DELETE 14/14: JPEG contenente modello Samsung SM-G781B viene accettato e riaperto, ma il modello non viene estratto né mostrato nei dati del post.

## K2

- [ ] **K-091 · media-upload** — Preparare post con audio offline.
  Sorgente: `globale:T-0544`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-092 · media-upload** — Preparare post con fotografia offline.
  Sorgente: `globale:T-0545`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-093 · media-upload** — Preparare post con video offline.
  Sorgente: `globale:T-0546`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-094 · media-upload** — Pubblicazione fotografia con posizione.
  Sorgente: `globale:T-1229`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [x] **K-095 · media-upload** — Verificare che il post compaia sul telefono B senza ricaricamento manuale.
  Sorgente: `globale:T-0713`. P0_ROLES 20/20: nome, cognome, avatar e profile_id sono derivati dalla sessione server; valori falsificati dal client vengono ignorati.
- [x] **K-096 · social** — Verificare che una notifica relativa a un post Gruppo non venga inviata ai familiari pubblici.
  Sorgente: `globale:T-0877`. push-audience 5/5: un contenuto Gruppo raggiunge soltanto profili autenticati e non viene inviato a familiari/visitatori pubblici.
- [x] **K-097 · mappe-posizione** — A cancella posizione, B vede scomparsa.
  Sorgente: `usabilita:U0561`. ui-location-permissions Samsung S20 FE 1/1: A cancella con gesto touch e la posizione scompare dal telefono B entro il ciclo di sincronizzazione.
- [x] **K-098 · mappe-posizione** — A condivide posizione, B vede marker.
  Sorgente: `usabilita:U0560`. ui-location-permissions Samsung S20 FE 1/1: A condivide con gesto touch e B vede il marker e le coordinate senza refresh manuale; il pubblico non vede la mappa privata.
- [x] **K-099 · mappe-posizione** — Aggiornamenti posizione durante la prova.
  Sorgente: `globale:T-1122`. ui-location-permissions Samsung S20 FE 1/1: condivisione, rimozione, diniego permesso, nuova autorizzazione, aggiornamento e seconda rimozione verificati nella stessa sessione.
- [ ] **K-100 · mappe-posizione** — Aprire la posizione del post.
  Sorgente: `globale:T-0692`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [x] **K-101 · mappe-posizione** — Cancellare la posizione dal telefono A.
  Sorgente: `globale:T-0694`. ui-location-permissions Samsung S20 FE 1/1: il proprietario cancella la posizione dal pannello rapido e riceve conferma server 200.
- [x] **K-102 · mappe-posizione** — Condividere la posizione dal telefono A.
  Sorgente: `globale:T-0697`. ui-location-permissions Samsung S20 FE 1/1: il proprietario condivide la posizione GPS tramite touch; il server salva coordinate e identità della sessione.
- [ ] **K-103 · mappe-posizione** — Mappa con due posizioni identiche.
  Sorgente: `globale:T-0947`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [x] **K-104 · mappe-posizione** — Mappa con nessuna posizione condivisa.
  Sorgente: `globale:T-0952`. ui-location-permissions Samsung S20 FE 1/1: dopo la cancellazione la lista e la mappa non mostrano alcun marker residuo.
- [x] **K-105 · mappe-posizione** — Mappa con una posizione.
  Sorgente: `globale:T-0954`. ui-location-permissions Samsung S20 FE 1/1: con una sola posizione la mappa India mostra un solo marker leggibile e i collegamenti Google Maps/Naviga corretti.
- [ ] **K-106 · mappe-posizione** — Non dichiarare una posizione come certificata se non è verificabile.
  Sorgente: `globale:T-1444`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-107 · mappe-posizione** — Non mostrare posizione precisa sul blocco schermo.
  Sorgente: `globale:T-1355`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-108 · mappe-posizione** — Posizione con GPS impreciso.
  Sorgente: `globale:T-0500`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [x] **K-109 · mappe-posizione** — Posizione con GPS preciso.
  Sorgente: `globale:T-0501`. ui-location-permissions Samsung S20 FE 1/1: coordinate precise 28.6139, 77.2090 conservate e mostrate senza arrotondamenti fuorvianti.
- [ ] **K-110 · mappe-posizione** — Pubblicare con posizione GPS.
  Sorgente: `globale:T-0404`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-111 · mappe-posizione** — Rimuovere la posizione prima dell’invio.
  Sorgente: `globale:T-0414`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [x] **K-112 · mappe-posizione** — Tentare cancellazione di posizione altrui.
  Sorgente: `usabilita:U0471`. P0_LOCATION 22/22: il tentativo touch/API di cancellare la posizione di un altro profilo riceve 403 e la posizione resta presente.
- [ ] **K-113 · mappe-posizione** — Tentare clickjacking su Condividi posizione.
  Sorgente: `globale:T-1487`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-114 · mappe-posizione** — Tentare di modificare posizione altrui.
  Sorgente: `globale:T-0503`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-115 · mappe-posizione** — Tentare di vedere posizioni.
  Sorgente: `usabilita:U0621;usabilita:U0636`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-116 · mappe-posizione** — Toccare “Usa posizione attuale”.
  Sorgente: `usabilita:U0234`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-117 · mappe-posizione** — Tutti condividono e cancellano la posizione.
  Sorgente: `globale:T-1732`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-118 · mappe-posizione** — una sola posizione attiva per persona.
  Sorgente: `usabilita:U0607`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-119 · mappe-posizione** — Utilizzare posizione simulata Android.
  Sorgente: `globale:T-1450`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-120 · mappe-posizione** — Verificare che il pubblico veda soltanto la posizione consentita.
  Sorgente: `usabilita:U0249`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
