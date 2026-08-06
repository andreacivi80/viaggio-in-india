# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **120** tra 379 controlli P0–P2 ancora privi di evidenza conclusiva.

Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.

- **K0 (40):** blocca qualsiasi rilascio.
- **K1 (50):** deve passare prima della condivisione stabile.
- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.

## K0

- [ ] **K-001 · accessi-privacy** — Nessun documento privato inserito senza consenso.  
  Sorgente: `globale:T-1722`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-002 · documenti** — Eliminare un documento dal telefono B.  
  Sorgente: `globale:T-0701`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-003 · accessi-privacy** — Distinguere limiti per IP, sessione e profilo.  
  Sorgente: `globale:T-1053`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-004 · documenti** — Documentare procedura e tempo di rollback.  
  Sorgente: `globale:T-1172`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-005 · documenti** — Eseguire backup mentre vengono caricati documenti.  
  Sorgente: `globale:T-1167`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-006 · documenti** — Verificare apertura di ogni documento ripristinato.  
  Sorgente: `globale:T-1170`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-007 · accessi-privacy** — Notifica per invito personale.  
  Sorgente: `globale:T-0085`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-008 · accessi-privacy** — Notifica per posizione condivisa, soltanto se autorizzata.  
  Sorgente: `globale:T-0087`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-009 · documenti** — Bacheca → profilo → documenti → indietro.  
  Sorgente: `globale:T-1411`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-010 · documenti** — Ogni documento deve essere collegato a un profilo esistente.  
  Sorgente: `globale:T-1016`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-011 · documenti** — Verificare che il Coordinatore possa moderare, se previsto.  
  Sorgente: `usabilita:U0294`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-012 · documenti** — Verificare che il dispositivo revocato non possa più aprire documenti.  
  Sorgente: `globale:T-0767`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-013 · documenti** — Errore durante sostituzione documento.  
  Sorgente: `globale:T-1150`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-014 · documenti** — Sostituzione documento durante il download.  
  Sorgente: `globale:T-0573`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-015 · documenti** — Un solo documento dopo dieci retry.  
  Sorgente: `globale:T-0141`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-016 · documenti** — Non mostrare dati dei documenti nella notifica.  
  Sorgente: `globale:T-1353`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-017 · documenti** — Notifica per documento mancante o aggiornato.  
  Sorgente: `globale:T-0084`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-018 · documenti** — Preferenze separate per post, commenti, reazioni, documenti e posizione.  
  Sorgente: `globale:T-0090`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-019 · documenti** — Verificare impossibilità di aprire documenti già non disponibili offline.  
  Sorgente: `globale:T-1620`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-020 · persistenza** — Eliminazione della subscription dal database quando l’utente le disattiva.  
  Sorgente: `globale:T-0078`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-021 · persistenza** — Interruzione del database dopo salvataggio del file.  
  Sorgente: `globale:T-1151`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-022 · persistenza** — Non devono esistere riferimenti nel database a file mancanti.  
  Sorgente: `globale:T-1013`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-023 · persistenza** — un file esiste nell’archivio ma non nel database.  
  Sorgente: `addendum:A0307`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-024 · profili-ruoli** — Controllare author_name e profile_id nel database.  
  Sorgente: `usabilita:U0175`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-025 · profili-ruoli** — Verificare profile_id corretto nel database.  
  Sorgente: `globale:T-0422`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-026 · accessi-privacy** — aggiunta successiva di fotografie autorizzate.  
  Sorgente: `globale:T-1369`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-027 · accessi-privacy** — Consentire proroga autorizzata della conservazione.  
  Sorgente: `globale:T-1338`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-028 · accessi-privacy** — Richiesta di nuovo accesso.  
  Sorgente: `usabilita:U0488`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-029 · accessi-privacy** — Se la password del gruppo deve permettere la pubblicazione, creare una sessione Ospite/Familiare valida e controllata.  
  Sorgente: `usabilita:U0002`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-030 · accessi-privacy** — Se può pubblicare, creare sessione Ospite.  
  Sorgente: `usabilita:U0480`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-031 · accessi-privacy** — Valutare cookie sicuro HttpOnly invece del token nel localStorage.  
  Sorgente: `globale:T-0042`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-032 · accessi-privacy** — Verificare accesso amministrativo con autenticazione a più fattori.  
  Sorgente: `globale:T-1505`. Accesso, consenso o segreto: un errore può esporre funzioni riservate.
- [ ] **K-033 · profili-ruoli** — Richiedere eliminazione del proprio profilo.  
  Sorgente: `globale:T-1324`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-034 · profili-ruoli** — Verificare notifica prioritaria al Coordinatore.  
  Sorgente: `globale:T-1193`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-035 · documenti** — Calcolare spazio necessario per documenti.  
  Sorgente: `globale:T-1531`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-036 · documenti** — Caricare una fotografia del passaporto verticale.  
  Sorgente: `globale:T-0995`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-037 · documenti** — Deep link del documento.  
  Sorgente: `globale:T-0241`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-038 · documenti** — Definire per quanto tempo vengono conservati i documenti.  
  Sorgente: `globale:T-1343`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-039 · documenti** — Documentare e applicare una regola unica.  
  Sorgente: `globale:T-0700`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-040 · documenti** — documentato come funzione non completata.  
  Sorgente: `addendum:A0197`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.

## K1

- [ ] **K-041 · documenti** — Non compromettere documenti e funzioni essenziali.  
  Sorgente: `globale:T-1650`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-042 · documenti** — Non mostrare numeri di passaporto.  
  Sorgente: `globale:T-1354`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-043 · documenti** — Tentare di aprire documenti.  
  Sorgente: `usabilita:U0620;usabilita:U0635`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-044 · documenti** — Verificare che i vecchi link ai documenti non funzionino.  
  Sorgente: `globale:T-1326`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-045 · documenti** — Verificare che non vi siano differenze tra itinerario, mappe e documenti.  
  Sorgente: `globale:T-1269`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-046 · documenti** — Verificare documenti precedenti conservati.  
  Sorgente: `globale:T-1032`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-047 · documenti** — Verificare nessun documento nella cache del browser.  
  Sorgente: `globale:T-0491`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-048 · documenti** — Verificare quali documenti restano memorizzati.  
  Sorgente: `globale:T-1630`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-049 · mappe-posizione** — Eliminare automaticamente le posizioni non più necessarie.  
  Sorgente: `globale:T-1346`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-050 · persistenza** — Applicare le migrazioni una alla volta.  
  Sorgente: `globale:T-1026`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-051 · persistenza** — Backup delle chiavi Push.  
  Sorgente: `globale:T-0636`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-052 · persistenza** — controlli eventuale modifica del database.  
  Sorgente: `addendum:A0208`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-053 · persistenza** — Creare un database dalla schema completa.  
  Sorgente: `globale:T-1027`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-054 · persistenza** — Creare un database partendo dalla prima versione.  
  Sorgente: `globale:T-1028`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-055 · persistenza** — Eseguire backup mentre vengono creati post.  
  Sorgente: `globale:T-1168`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-056 · persistenza** — nessun dato precedente ripristinato erroneamente.  
  Sorgente: `usabilita:U0568`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-057 · persistenza** — Verificare backup e politica di conservazione.  
  Sorgente: `globale:T-1325`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-058 · persistenza** — Verificare che i telefoni ricevano la versione ripristinata.  
  Sorgente: `globale:T-1176`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-059 · persistenza** — Verificare comportamento con database temporaneamente non disponibile.  
  Sorgente: `globale:T-1022`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-060 · persistenza** — Verificare consistenza temporale del backup.  
  Sorgente: `globale:T-1171`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-061 · persistenza** — Verificare day_index nel database.  
  Sorgente: `usabilita:U0178`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-062 · persistenza** — Verificare inserimento nel database.  
  Sorgente: `usabilita:U0017`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-063 · persistenza** — Verificare rollback della migrazione.  
  Sorgente: `globale:T-1040`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-064 · persistenza** — Verificare stabilità del database.  
  Sorgente: `globale:T-0578`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-065 · profili-ruoli** — Aggiungere moderazione del Coordinatore.  
  Sorgente: `globale:T-0056`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-066 · profili-ruoli** — Aprire la Bacheca come Coordinatore.  
  Sorgente: `usabilita:U0098`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-067 · profili-ruoli** — Avvisare il Coordinatore in caso di abuso ripetuto.  
  Sorgente: `globale:T-1052`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-068 · profili-ruoli** — Il Coordinatore revoca un dispositivo di prova.  
  Sorgente: `globale:T-1729`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-069 · profili-ruoli** — Revocare il dispositivo dal Coordinatore.  
  Sorgente: `globale:T-0763`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-070 · profili-ruoli** — Tornare a vista Coordinatore.  
  Sorgente: `usabilita:U0454`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-071 · profili-ruoli** — Verificare che il Coordinatore visualizzi 4/4.  
  Sorgente: `globale:T-0710`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-072 · profili-ruoli** — Verificare che il profilo non compaia nella dashboard del Coordinatore.  
  Sorgente: `globale:T-1328`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-073 · profili-ruoli** — Visualizzare contatto del Coordinatore.  
  Sorgente: `globale:T-1196`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-074 · persistenza** — Preferiti salvati nel database.  
  Sorgente: `globale:T-0266`. Aggiornamenti, guasti e retry non devono perdere o duplicare dati.
- [ ] **K-075 · mappe-posizione** — Non rendere pubblica la posizione EXIF senza consenso.  
  Sorgente: `globale:T-1432`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-076 · mappe-posizione** — Verificare posizione allegata soltanto con consenso.  
  Sorgente: `globale:T-1194`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-077 · mappe-posizione** — Ogni posizione deve essere collegata a un profilo esistente.  
  Sorgente: `globale:T-1018`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-078 · mappe-posizione** — Verificare che la posizione venga indicata come dichiarata dal dispositivo.  
  Sorgente: `globale:T-1452`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-079 · sync-rete** — Aprire il dominio senza cache.  
  Sorgente: `globale:T-0305`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-080 · sync-rete** — Verificare che il Service Worker utilizzi la cache 1.21.5.  
  Sorgente: `globale:T-0012`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-081 · sync-rete** — Verificare nessuna anteprima nella cache pubblica.  
  Sorgente: `globale:T-1007`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-082 · sync-rete** — Verificare quali dati restano nella Cache API.  
  Sorgente: `globale:T-1629`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-083 · altro** — Inviare notifica relativa a un contenuto successivamente eliminato.  
  Sorgente: `globale:T-0866`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-084 · documenti** — Caricare un PDF multipagina.  
  Sorgente: `globale:T-0993`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-085 · documenti** — Controllare PDF corrotti o pericolosi.  
  Sorgente: `globale:T-0166`. Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.
- [ ] **K-086 · mappe-posizione** — Una sola posizione dopo dieci retry.  
  Sorgente: `globale:T-0143`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
- [ ] **K-087 · media-upload** — Media pubblici con cache controllata.  
  Sorgente: `globale:T-1475`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-088 · sync-rete** — Verificare gestione della revoca al ritorno della rete.  
  Sorgente: `globale:T-0769`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-089 · media-upload** — Verificare che il post utilizzi automaticamente nome, cognome, fotografia e profile_id corretti.  
  Sorgente: `globale:T-0714`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-090 · sync-rete** — Centro “Pronto per l’offline”.  
  Sorgente: `globale:T-0116`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.

## K2

- [ ] **K-091 · sync-rete** — dati di emergenza disponibili offline.  
  Sorgente: `globale:T-1752`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-092 · sync-rete** — Hotel e indirizzi offline.  
  Sorgente: `globale:T-0119`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-093 · sync-rete** — Informazioni di emergenza offline.  
  Sorgente: `globale:T-0122`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-094 · sync-rete** — Mappe e coordinate essenziali offline.  
  Sorgente: `globale:T-0124`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-095 · sync-rete** — Preparare post testuale offline.  
  Sorgente: `globale:T-0547`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-096 · sync-rete** — Pulsante per cancellare i dati offline.  
  Sorgente: `globale:T-0126`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-097 · sync-rete** — Ricerca offline sui dati disponibili.  
  Sorgente: `globale:T-1696`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-098 · sync-rete** — Salvare più bozze offline.  
  Sorgente: `globale:T-0849`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-099 · sync-rete** — Salvataggio offline dei commenti.  
  Sorgente: `globale:T-0129`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-100 · sync-rete** — Salvataggio offline delle posizioni.  
  Sorgente: `globale:T-0132`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-101 · sync-rete** — Verificare aggiornamento con telefono offline.  
  Sorgente: `globale:T-0832`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-102 · altro** — Definire se i contenuti vengono eliminati o anonimizzati.  
  Sorgente: `globale:T-1320`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-103 · altro** — Eliminare i dati del browser.  
  Sorgente: `globale:T-0859`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-104 · altro** — Errore durante eliminazione multipla.  
  Sorgente: `globale:T-1149`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-105 · altro** — Mostrare chiaramente quali dati verranno eliminati.  
  Sorgente: `globale:T-1321`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-106 · altro** — Permettere all’utente di eliminare elementi dalla coda.  
  Sorgente: `globale:T-0847`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-107 · altro** — Verificare che la pulizia automatica non elimini dati ancora validi.  
  Sorgente: `globale:T-1351`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-108 · altro** — Verificare log di eliminazione.  
  Sorgente: `globale:T-1004`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-109 · altro** — Verificare se i metadati vengono conservati o eliminati.  
  Sorgente: `globale:T-1439`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-110 · media-upload** — Caricare fotografia contenente modello del telefono.  
  Sorgente: `globale:T-1427`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-111 · media-upload** — Preparare post con audio offline.  
  Sorgente: `globale:T-0544`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-112 · media-upload** — Preparare post con fotografia offline.  
  Sorgente: `globale:T-0545`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-113 · media-upload** — Preparare post con video offline.  
  Sorgente: `globale:T-0546`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-114 · media-upload** — Pubblicazione fotografia con posizione.  
  Sorgente: `globale:T-1229`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-115 · media-upload** — Verificare che il post compaia sul telefono B senza ricaricamento manuale.  
  Sorgente: `globale:T-0713`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-116 · social** — Notifica con apertura del commento preciso.  
  Sorgente: `globale:T-0082`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-117 · social** — Notifica per reazione, se scelta dall’utente.  
  Sorgente: `globale:T-0088`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-118 · social** — Notifica per risposta a un commento.  
  Sorgente: `globale:T-0089`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-119 · social** — Verificare che una notifica relativa a un post Gruppo non venga inviata ai familiari pubblici.  
  Sorgente: `globale:T-0877`. Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.
- [ ] **K-120 · mappe-posizione** — A cancella posizione, B vede scomparsa.  
  Sorgente: `usabilita:U0561`. La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.
