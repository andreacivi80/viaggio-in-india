# Matrice globale dei controlli

Generata dalle quattro checklist allegate. Le righe duplicate identiche sono consolidate.

- Sezioni sorgente: 100
- Caselle sorgente complessive: 2.537
- Controlli distinti: 1812
- Controlli superati con evidenza: 60
- Controlli falliti aperti: 0
- Controlli non ancora eseguiti: 1752
- Sezioni completamente chiuse: 0/100
- Stati ammessi: SUPERATO, FALLITO, NON ESEGUITO, BLOCCATO FISICO

| ID | Sezione | Controllo | Stato | Evidenza |
|---|---:|---|---|---|
| T-0001 | 1 | Aggiornare README e documentazione, ancora riferiti a versioni precedenti. | NON ESEGUITO | — |
| T-0002 | 1 | Aggiungere una pagina “Informazioni” con versione, data pubblicazione e stato API. | NON ESEGUITO | — |
| T-0003 | 1 | Collegare il deploy automatico da GitHub a Cloudflare. | NON ESEGUITO | — |
| T-0004 | 1 | Consegnare uno ZIP pulito contenente sorgenti, configurazioni, migrazioni e documentazione. | NON ESEGUITO | — |
| T-0005 | 1 | Eliminare dallo ZIP le cartelle node_modules, .git, .wrangler e dist, se deve essere ricostruita automaticamente. | NON ESEGUITO | — |
| T-0006 | 1 | Eliminare dallo ZIP le cartelle: | NON ESEGUITO | — |
| T-0007 | 1 | Garantire che il repository non presenti file modificati ma non registrati. | NON ESEGUITO | — |
| T-0008 | 1 | Pubblicare realmente la versione 1.21.5 su Cloudflare. | NON ESEGUITO | — |
| T-0009 | 1 | Registrare tutte le modifiche in un commit preciso. | NON ESEGUITO | — |
| T-0010 | 1 | Separare chiaramente versione sorgente, versione compilata e versione pubblicata. | NON ESEGUITO | — |
| T-0011 | 1 | Verificare che il dominio mostri “REV 1.21.5”. | NON ESEGUITO | — |
| T-0012 | 1 | Verificare che il Service Worker utilizzi la cache 1.21.5. | NON ESEGUITO | — |
| T-0013 | 2 | test automatico del Service Worker. | SUPERATO | production-smoke: revisione e Service Worker verificati sul dominio live |
| T-0014 | 2 | test dei formati multimediali; | NON ESEGUITO | — |
| T-0015 | 2 | test del database; | NON ESEGUITO | — |
| T-0016 | 2 | test delle API; | NON ESEGUITO | — |
| T-0017 | 2 | test delle autorizzazioni; | NON ESEGUITO | — |
| T-0018 | 2 | test delle migrazioni; | NON ESEGUITO | — |
| T-0019 | 2 | test delle notifiche; | NON ESEGUITO | — |
| T-0020 | 2 | test di accessibilità; | NON ESEGUITO | — |
| T-0021 | 2 | test di carico; | NON ESEGUITO | — |
| T-0022 | 2 | test di creazione, modifica ed eliminazione; | NON ESEGUITO | — |
| T-0023 | 2 | test di idempotenza; | SUPERATO | production-smoke: retry idempotenti di commenti, reazioni, post e documenti |
| T-0024 | 2,67 | test di regressione; | NON ESEGUITO | — |
| T-0025 | 2 | test end-to-end con browser; | NON ESEGUITO | — |
| T-0026 | 2 | test offline; | SUPERATO | offline-queue: due prove automatiche su coda e allegati |
| T-0027 | 2 | test unitari; | NON ESEGUITO | — |
| T-0028 | 2 | test visuali mobile; | NON ESEGUITO | — |
| T-0029 | 3 | Aggiungere “Disconnetti tutti i dispositivi”. | SUPERATO | QA 1.28.0: logout di tutti i dispositivi e sessione successivamente negata |
| T-0030 | 3 | Aggiungere elenco dei dispositivi autorizzati. | SUPERATO | production-smoke: elenco dispositivi include corrente e secondario |
| T-0031 | 3 | Aggiungere revoca del singolo dispositivo. | SUPERATO | production-smoke: revoca del dispositivo secondario e lista aggiornata |
| T-0032 | 3 | Aggiungere rinnovo sicuro della sessione. | NON ESEGUITO | — |
| T-0033 | 3 | Aggiungere scadenza per inattività. | NON ESEGUITO | — |
| T-0034 | 3 | Eliminare l’endpoint che trasforma il codice comune in una sessione per un profilo scelto. | NON ESEGUITO | — |
| T-0035 | 3 | Impedire definitivamente di selezionare l’identità di un altro Viaggiatore. | NON ESEGUITO | — |
| T-0036 | 3 | Impedire il riutilizzo di una sessione rubata. | NON ESEGUITO | — |
| T-0037 | 3 | Registrare data, ora e ultimo utilizzo della sessione. | NON ESEGUITO | — |
| T-0038 | 3 | Richiedere l’invito personale per collegare un dispositivo a un profilo. | NON ESEGUITO | — |
| T-0039 | 3 | Ridurre la durata della sessione, attualmente prevista fino a 90 giorni. | NON ESEGUITO | — |
| T-0040 | 3 | Ruotare il token dopo operazioni sensibili. | NON ESEGUITO | — |
| T-0041 | 3 | Utilizzare il codice comune soltanto come invito iniziale al gruppo. | NON ESEGUITO | — |
| T-0042 | 3 | Valutare cookie sicuro HttpOnly invece del token nel localStorage. | NON ESEGUITO | — |
| T-0043 | 4 | Aggiungere consenso privacy esplicito. | NON ESEGUITO | — |
| T-0044 | 4 | Aggiungere data di accettazione dell’informativa. | NON ESEGUITO | — |
| T-0045 | 4 | Aggiungere funzione di cancellazione del proprio profilo. | NON ESEGUITO | — |
| T-0046 | 4 | Aggiungere funzione di esportazione dei propri dati. | NON ESEGUITO | — |
| T-0047 | 4 | Aggiungere informativa sul trattamento dei dati. | NON ESEGUITO | — |
| T-0048 | 4 | Consentire a ogni persona di scegliere quali dati rendere visibili. | NON ESEGUITO | — |
| T-0049 | 4 | Definire il periodo di conservazione dei dati dopo il viaggio. | NON ESEGUITO | — |
| T-0050 | 4 | Non mostrare automaticamente età, lavoro e biografia al pubblico. | SUPERATO | production-smoke: eta, lavoro, bio e avatar_key assenti dallo stato pubblico |
| T-0051 | 4 | Rendere nome e cognome configurabili come nome completo, nome abbreviato o soprannome. | NON ESEGUITO | — |
| T-0052 | 4 | Separare profilo pubblico e profilo privato. | SUPERATO | production-smoke: stato pubblico separato dall'area privata |
| T-0053 | 5 | Aggiungere blocco di un ospite. | NON ESEGUITO | — |
| T-0054 | 5 | Aggiungere limite di commenti al minuto. | NON ESEGUITO | — |
| T-0055 | 5 | Aggiungere limite di reazioni al minuto. | NON ESEGUITO | — |
| T-0056 | 5 | Aggiungere moderazione del Coordinatore. | NON ESEGUITO | — |
| T-0057 | 5 | Aggiungere protezione antispam. | NON ESEGUITO | — |
| T-0058 | 5 | Aggiungere reazioni ai commenti. | NON ESEGUITO | — |
| T-0059 | 5 | Aggiungere risposte ai commenti. | NON ESEGUITO | — |
| T-0060 | 5 | Aggiungere segnalazione dei contenuti. | NON ESEGUITO | — |
| T-0061 | 5 | Associare i commenti dei Viaggiatori alla sessione personale. | NON ESEGUITO | — |
| T-0062 | 5 | Creare un’identità ospite controllata per i familiari. | SUPERATO | production-smoke: identita ospite creata e validata dal server |
| T-0063 | 5 | Impedire che un utente modifichi visitor_id dal browser. | NON ESEGUITO | — |
| T-0064 | 5 | Impedire di modificare o eliminare commenti altrui. | NON ESEGUITO | — |
| T-0065 | 5 | Rendere reali le menzioni: attualmente “@nome” viene evidenziato, ma non genera una notifica specifica. | NON ESEGUITO | — |
| T-0066 | 6 | Controllo della visibilità lato server. | NON ESEGUITO | — |
| T-0067 | 6 | Divieto di leggere un post privato modificando direttamente l’URL. | NON ESEGUITO | — |
| T-0068 | 6 | Feed differente in base al ruolo. | NON ESEGUITO | — |
| T-0069 | 6 | Impedire che il testo di un post privato compaia nella notifica di utenti non autorizzati. | NON ESEGUITO | — |
| T-0070 | 6 | Notifiche inviate soltanto agli utenti autorizzati a vedere il post. | NON ESEGUITO | — |
| T-0071 | 6 | Possibilità di modificare la visibilità dopo la pubblicazione. | NON ESEGUITO | — |
| T-0072 | 6 | Selettore Familiari. | NON ESEGUITO | — |
| T-0073 | 6 | Selettore Gruppo. | NON ESEGUITO | — |
| T-0074 | 6 | Selettore Pubblico. | NON ESEGUITO | — |
| T-0075 | 6 | Selettore Solo io. | NON ESEGUITO | — |
| T-0076 | 7 | Badge sincronizzato dei contenuti non letti. | NON ESEGUITO | — |
| T-0077 | 7 | Disattivazione completa delle notifiche. | NON ESEGUITO | — |
| T-0078 | 7 | Eliminazione della subscription dal database quando l’utente le disattiva. | NON ESEGUITO | — |
| T-0079 | 7 | Fascia oraria “Non disturbare”. | NON ESEGUITO | — |
| T-0080 | 7 | Modalità silenziosa. | NON ESEGUITO | — |
| T-0081 | 7 | Non inviare all’autore la notifica della propria operazione. | NON ESEGUITO | — |
| T-0082 | 7 | Notifica con apertura del commento preciso. | NON ESEGUITO | — |
| T-0083 | 7 | Notifica con apertura del post preciso. | NON ESEGUITO | — |
| T-0084 | 7 | Notifica per documento mancante o aggiornato. | NON ESEGUITO | — |
| T-0085 | 7 | Notifica per invito personale. | NON ESEGUITO | — |
| T-0086 | 7 | Notifica per menzione. | NON ESEGUITO | — |
| T-0087 | 7 | Notifica per posizione condivisa, soltanto se autorizzata. | NON ESEGUITO | — |
| T-0088 | 7 | Notifica per reazione, se scelta dall’utente. | NON ESEGUITO | — |
| T-0089 | 7 | Notifica per risposta a un commento. | NON ESEGUITO | — |
| T-0090 | 7 | Preferenze separate per post, commenti, reazioni, documenti e posizione. | NON ESEGUITO | — |
| T-0091 | 7 | Stato letto/non letto sincronizzato tra dispositivi. | NON ESEGUITO | — |
| T-0092 | 7 | Test Push con app aperta. | NON ESEGUITO | — |
| T-0093 | 7 | Test Push con app completamente chiusa. | NON ESEGUITO | — |
| T-0094 | 7 | Test Push con app in background. | NON ESEGUITO | — |
| T-0095 | 7 | Test Push dopo riavvio del telefono. | NON ESEGUITO | — |
| T-0096 | 7 | Test Push su Android con PWA installata. | NON ESEGUITO | — |
| T-0097 | 7 | Test Push su iPhone con PWA installata. | NON ESEGUITO | — |
| T-0098 | 8 | Centro sincronizzazione visibile. | NON ESEGUITO | — |
| T-0099 | 8 | Endpoint con cursore o updated_since. | NON ESEGUITO | — |
| T-0100 | 8 | Gestione dei conflitti. | NON ESEGUITO | — |
| T-0101 | 8 | Gestione delle modifiche concorrenti. | NON ESEGUITO | — |
| T-0102 | 8 | Indicazione “Errore”. | NON ESEGUITO | — |
| T-0103 | 8 | Indicazione “In attesa”. | NON ESEGUITO | — |
| T-0104 | 8 | Indicazione “Invio in corso”. | NON ESEGUITO | — |
| T-0105 | 8 | Indicazione “Ultima sincronizzazione”. | NON ESEGUITO | — |
| T-0106 | 8 | Nessun salto della pagina durante l’aggiornamento. | NON ESEGUITO | — |
| T-0107 | 8 | Nessuna chiusura involontaria di modali e tastiera. | NON ESEGUITO | — |
| T-0108 | 8 | Paginazione dei commenti. | NON ESEGUITO | — |
| T-0109 | 8 | Paginazione dei post. | NON ESEGUITO | — |
| T-0110 | 8 | Pulsante “Riprova”. | NON ESEGUITO | — |
| T-0111 | 8 | Riduzione del controllo ogni 2,5 secondi. | NON ESEGUITO | — |
| T-0112 | 8 | Scaricamento soltanto delle modifiche. | NON ESEGUITO | — |
| T-0113 | 8 | Sincronizzazione delle eliminazioni. | NON ESEGUITO | — |
| T-0114 | 8 | Sincronizzazione immediata al ritorno della rete. | NON ESEGUITO | — |
| T-0115 | 8 | SSE, WebSocket o polling incrementale sostenibile. | NON ESEGUITO | — |
| T-0116 | 9 | Centro “Pronto per l’offline”. | NON ESEGUITO | — |
| T-0117 | 9 | Coda automatica degli invii. | NON ESEGUITO | — |
| T-0118 | 9 | Controllo che l’operazione venga inviata una sola volta. | NON ESEGUITO | — |
| T-0119 | 9 | Hotel e indirizzi offline. | NON ESEGUITO | — |
| T-0120 | 9 | IndexedDB. | SUPERATO | offline-queue: outbox persistente verificata con IndexedDB simulato |
| T-0121 | 9 | Indicazione dello spazio necessario. | NON ESEGUITO | — |
| T-0122 | 9 | Informazioni di emergenza offline. | NON ESEGUITO | — |
| T-0123 | 9 | Invio automatico al ritorno della rete. | NON ESEGUITO | — |
| T-0124 | 9 | Mappe e coordinate essenziali offline. | NON ESEGUITO | — |
| T-0125 | 9 | Outbox offline. | SUPERATO | offline-queue: accodamento, persistenza e svuotamento verificati |
| T-0126 | 9 | Pulsante per cancellare i dati offline. | NON ESEGUITO | — |
| T-0127 | 9 | Riapertura della coda dopo chiusura forzata. | NON ESEGUITO | — |
| T-0128 | 9 | Salvataggio offline degli audio selezionati. | SUPERATO | offline-queue: file MP3 conservato con nome, MIME e contenuto |
| T-0129 | 9 | Salvataggio offline dei commenti. | NON ESEGUITO | — |
| T-0130 | 9 | Salvataggio offline dei video selezionati. | SUPERATO | offline-queue: file MP4 conservato con nome, MIME e contenuto |
| T-0131 | 9 | Salvataggio offline delle fotografie selezionate. | SUPERATO | offline-queue: file JPEG conservato con nome, MIME e contenuto |
| T-0132 | 9 | Salvataggio offline delle posizioni. | NON ESEGUITO | — |
| T-0133 | 10 | Chiave idempotente nel database. | SUPERATO | production-smoke: chiave idempotente riutilizzata e risposta replayed |
| T-0134 | 10 | Identificativo univoco per ogni operazione. | NON ESEGUITO | — |
| T-0135 | 10 | Nessuna duplicazione dopo cambio Wi-Fi/dati mobili. | NON ESEGUITO | — |
| T-0136 | 10 | Protezione dal doppio clic. | NON ESEGUITO | — |
| T-0137 | 10 | Protezione dal doppio tocco. | NON ESEGUITO | — |
| T-0138 | 10 | Recupero dopo risposta server incerta. | NON ESEGUITO | — |
| T-0139 | 10 | Stesso identificativo per ogni retry della medesima operazione. | NON ESEGUITO | — |
| T-0140 | 10 | Un solo commento dopo dieci retry. | NON ESEGUITO | — |
| T-0141 | 10 | Un solo documento dopo dieci retry. | NON ESEGUITO | — |
| T-0142 | 10 | Un solo post dopo dieci retry. | NON ESEGUITO | — |
| T-0143 | 10 | Una sola posizione dopo dieci retry. | NON ESEGUITO | — |
| T-0144 | 10 | Una sola reazione dopo dieci retry. | NON ESEGUITO | — |
| T-0145 | 11 | bonifica periodica dei file orfani. | NON ESEGUITO | — |
| T-0146 | 11 | compressione fotografie; | NON ESEGUITO | — |
| T-0147 | 11 | compressione video; | NON ESEGUITO | — |
| T-0148 | 11 | continuazione dopo chiusura dell’app; | NON ESEGUITO | — |
| T-0149 | 11 | continuazione dopo perdita della rete; | NON ESEGUITO | — |
| T-0150 | 11 | copertina video; | NON ESEGUITO | — |
| T-0151 | 11 | limite complessivo del post; | NON ESEGUITO | — |
| T-0152 | 11 | miniature; | NON ESEGUITO | — |
| T-0153 | 11 | modifica della copertina; | NON ESEGUITO | — |
| T-0154 | 11 | pausa; | NON ESEGUITO | — |
| T-0155 | 11 | percentuale complessiva; | NON ESEGUITO | — |
| T-0156 | 11 | percentuale per ogni file; | SUPERATO | resumable-upload: avanzamento del singolo file verificato fino al 100% |
| T-0157 | 11 | quota giornaliera per utente; | NON ESEGUITO | — |
| T-0158 | 11 | retry del singolo file; | NON ESEGUITO | — |
| T-0159 | 11 | riordinamento allegati; | NON ESEGUITO | — |
| T-0160 | 11 | ripresa; | SUPERATO | resumable-upload: ripresa da parti già confermate |
| T-0161 | 11 | rotazione e ritaglio fotografie; | NON ESEGUITO | — |
| T-0162 | 11 | stima del consumo dati; | NON ESEGUITO | — |
| T-0163 | 11 | stima del tempo; | NON ESEGUITO | — |
| T-0164 | 11 | upload multipart; | NON ESEGUITO | — |
| T-0165 | 11 | upload riprendibile; | NON ESEGUITO | — |
| T-0166 | 12 | Controllare PDF corrotti o pericolosi. | NON ESEGUITO | — |
| T-0167 | 12 | Controllo dei nomi file. | NON ESEGUITO | — |
| T-0168 | 12 | Limite complessivo di 10 allegati. | NON ESEGUITO | — |
| T-0169 | 12 | Limite complessivo in megabyte per post. | NON ESEGUITO | — |
| T-0170 | 12 | Log dei file rifiutati. | NON ESEGUITO | — |
| T-0171 | 12 | Nessuna esecuzione di contenuto caricato. | NON ESEGUITO | — |
| T-0172 | 12 | Non fidarsi soltanto del MIME dichiarato dal telefono. | NON ESEGUITO | — |
| T-0173 | 12 | Quota massima per giornata. | NON ESEGUITO | — |
| T-0174 | 12 | Quota massima per utente. | NON ESEGUITO | — |
| T-0175 | 12 | Rifiutare estensioni false. | NON ESEGUITO | — |
| T-0176 | 12 | Rifiutare HTML e JavaScript. | NON ESEGUITO | — |
| T-0177 | 12 | Rifiutare SVG pericolosi. | NON ESEGUITO | — |
| T-0178 | 12 | Scansione antivirus. | NON ESEGUITO | — |
| T-0179 | 12 | Validazione delle dimensioni reali. | SUPERATO | QA 1.29.0: dimensione reale da 9 MB ricomposta e verificata dal server |
| T-0180 | 12 | Verifica della firma reale del file. | NON ESEGUITO | — |
| T-0181 | 13 | Aggiungere alternativa offline. | NON ESEGUITO | — |
| T-0182 | 13 | Aggiungere data e ora locale dell’India. | NON ESEGUITO | — |
| T-0183 | 13 | Aggiungere hotel e punti di incontro. | NON ESEGUITO | — |
| T-0184 | 13 | Aggiungere indirizzi copiabili. | NON ESEGUITO | — |
| T-0185 | 13 | Aggiungere precisione della geolocalizzazione. | NON ESEGUITO | — |
| T-0186 | 13 | Correggere i popup della mappa per impedire inserimento di HTML o script nei nomi. | NON ESEGUITO | — |
| T-0187 | 13 | Integrare un routing reale, se si vogliono mostrare strade reali. | NON ESEGUITO | — |
| T-0188 | 13 | Non definire “percorso reale” una linea disegnata manualmente. | NON ESEGUITO | — |
| T-0189 | 13 | Validare anche le coordinate degli endpoint di ricerca inversa. | NON ESEGUITO | — |
| T-0190 | 13 | Verificare che latitudine e longitudine non siano invertite. | NON ESEGUITO | — |
| T-0191 | 13 | Verificare che ogni marker corrisponda alla città corretta. | NON ESEGUITO | — |
| T-0192 | 13 | Verificare la tappa intermedia di Ranakpur. | NON ESEGUITO | — |
| T-0193 | 13 | Verificare manualmente ogni coordinata. | NON ESEGUITO | — |
| T-0194 | 13 | Verificare ogni itinerario giornaliero. | NON ESEGUITO | — |
| T-0195 | 13 | Verificare partenza e ritorno a Delhi. | NON ESEGUITO | — |
| T-0196 | 13 | Verificare percorsi aerei. | NON ESEGUITO | — |
| T-0197 | 13 | Verificare percorsi ferroviari. | NON ESEGUITO | — |
| T-0198 | 13 | Verificare percorsi in van. | NON ESEGUITO | — |
| T-0199 | 14 | Aggiornamento continuo volontario. | NON ESEGUITO | — |
| T-0200 | 14 | Arresto automatico alla scadenza. | NON ESEGUITO | — |
| T-0201 | 14 | Arresto immediato. | NON ESEGUITO | — |
| T-0202 | 14 | Condivisione per 15 minuti. | NON ESEGUITO | — |
| T-0203 | 14 | Condivisione per 30 minuti. | NON ESEGUITO | — |
| T-0204 | 14 | Condivisione per 60 minuti. | NON ESEGUITO | — |
| T-0205 | 14 | Conferma prima della condivisione. | NON ESEGUITO | — |
| T-0206 | 14 | Conferma quando la condivisione è terminata. | NON ESEGUITO | — |
| T-0207 | 14 | Indicazione “Posizione recente”. | NON ESEGUITO | — |
| T-0208 | 14 | Indicazione “Posizione scaduta”. | NON ESEGUITO | — |
| T-0209 | 14 | Indicazione “Posizione vecchia”. | NON ESEGUITO | — |
| T-0210 | 14 | Limitazione dell’accesso alle persone autorizzate. | NON ESEGUITO | — |
| T-0211 | 14 | Nessuna posizione visibile al pubblico. | SUPERATO | production-smoke: endpoint posizione negato senza sessione |
| T-0212 | 14 | Pulsante “Ho bisogno di aiuto”. | NON ESEGUITO | — |
| T-0213 | 14 | Pulsante “Sono al sicuro”. | NON ESEGUITO | — |
| T-0214 | 14 | Pulsante “Sono arrivato”. | NON ESEGUITO | — |
| T-0215 | 14 | Visualizzazione della precisione GPS. | NON ESEGUITO | — |
| T-0216 | 15 | Allarme in caso di errori ripetuti. | NON ESEGUITO | — |
| T-0217 | 15 | Audit log. | NON ESEGUITO | — |
| T-0218 | 15 | Content Security Policy. | SUPERATO | production-smoke: header Content-Security-Policy presente |
| T-0219 | 15 | Intestazioni di sicurezza complete. | NON ESEGUITO | — |
| T-0220 | 15 | Monitoraggio errori. | NON ESEGUITO | — |
| T-0221 | 15 | Protezione antispam. | NON ESEGUITO | — |
| T-0222 | 15 | Protezione contro accesso a documenti altrui. | NON ESEGUITO | — |
| T-0223 | 15 | Protezione contro eliminazione di post altrui. | NON ESEGUITO | — |
| T-0224 | 15 | Protezione contro modifica di commenti altrui. | NON ESEGUITO | — |
| T-0225 | 15 | Protezione contro modifica manuale del profile_id. | NON ESEGUITO | — |
| T-0226 | 15 | Protezione contro modifica manuale del ruolo. | NON ESEGUITO | — |
| T-0227 | 15 | Protezione contro richieste automatiche. | NON ESEGUITO | — |
| T-0228 | 15 | Protezione XSS. | NON ESEGUITO | — |
| T-0229 | 15 | Rate limiting. | NON ESEGUITO | — |
| T-0230 | 15 | Revoca immediata di sessioni compromesse. | NON ESEGUITO | — |
| T-0231 | 15 | Sanificazione dei contenuti inseriti nei popup delle mappe. | NON ESEGUITO | — |
| T-0232 | 15 | Validazione di tutti gli identificativi. | NON ESEGUITO | — |
| T-0233 | 16 | Album HTML offline. | NON ESEGUITO | — |
| T-0234 | 16 | Ambasciata. | NON ESEGUITO | — |
| T-0235 | 16 | Archivio finale. | NON ESEGUITO | — |
| T-0236 | 16 | Biglietti collegati alle giornate. | NON ESEGUITO | — |
| T-0237 | 16 | Condivisione con fallback “Copia link”. | NON ESEGUITO | — |
| T-0238 | 16 | Contatti assicurazione. | NON ESEGUITO | — |
| T-0239 | 16 | Convertitore euro/rupie. | NON ESEGUITO | — |
| T-0240 | 16 | Copertina del giorno. | NON ESEGUITO | — |
| T-0241 | 16 | Deep link del documento. | NON ESEGUITO | — |
| T-0242 | 16 | Deep link del profilo. | NON ESEGUITO | — |
| T-0243 | 16 | Deep link del singolo commento. | NON ESEGUITO | — |
| T-0244 | 16 | Deep link del singolo post. | NON ESEGUITO | — |
| T-0245 | 16 | Deep link della singola fotografia. | NON ESEGUITO | — |
| T-0246 | 16 | Diario Mattina/Pomeriggio/Sera. | NON ESEGUITO | — |
| T-0247 | 16 | dispone di screenshot, video o log come prova. | NON ESEGUITO | — |
| T-0248 | 16 | è presente; | NON ESEGUITO | — |
| T-0249 | 16 | Emergenza offline. | NON ESEGUITO | — |
| T-0250 | 16 | Esportazione CSV. | NON ESEGUITO | — |
| T-0251 | 16 | Esportazione JSON. | NON ESEGUITO | — |
| T-0252 | 16 | funziona con dati reali o anonimizzati; | NON ESEGUITO | — |
| T-0253 | 16 | funziona dopo chiusura e riapertura; | SUPERATO | resumable-upload: manifesto persistente ripreso dopo riapertura simulata |
| T-0254 | 16 | funziona su Android; | NON ESEGUITO | — |
| T-0255 | 16 | funziona su iPhone; | NON ESEGUITO | — |
| T-0256 | 16 | funziona sul dominio Cloudflare; | NON ESEGUITO | — |
| T-0257 | 16 | gestisce correttamente gli errori; | NON ESEGUITO | — |
| T-0258 | 16 | Hotel e prenotazioni. | NON ESEGUITO | — |
| T-0259 | 16 | Modalità risparmio batteria. | NON ESEGUITO | — |
| T-0260 | 16 | Modalità risparmio dati. | NON ESEGUITO | — |
| T-0261 | 16 | Modalità scura. | NON ESEGUITO | — |
| T-0262 | 16 | Modifica di un post pubblicato. | NON ESEGUITO | — |
| T-0263 | 16 | Mostra al tassista in inglese e hindi. | NON ESEGUITO | — |
| T-0264 | 16 | non danneggia altre funzioni; | NON ESEGUITO | — |
| T-0265 | 16 | PDF del viaggio. | NON ESEGUITO | — |
| T-0266 | 16 | Preferiti salvati nel database. | NON ESEGUITO | — |
| T-0267 | 16 | Preferiti sincronizzati tra dispositivi. | NON ESEGUITO | — |
| T-0268 | 16 | produce un risultato persistente; | NON ESEGUITO | — |
| T-0269 | 16 | Ricerca globale. | NON ESEGUITO | — |
| T-0270 | 16,95 | Ricerca per città. | NON ESEGUITO | — |
| T-0271 | 16 | Ricerca per giorno. | NON ESEGUITO | — |
| T-0272 | 16 | Ricerca per persona. | NON ESEGUITO | — |
| T-0273 | 16 | Ricerca per testo. | NON ESEGUITO | — |
| T-0274 | 16 | Riepilogo serale. | NON ESEGUITO | — |
| T-0275 | 16 | Sezione Spese. | NON ESEGUITO | — |
| T-0276 | 16 | ZIP dei contenuti. | NON ESEGUITO | — |
| T-0277 | 17 | BLOCCATO | NON ESEGUITO | — |
| T-0278 | 17 | Coordinatore | NON ESEGUITO | — |
| T-0279 | 17 | Familiare/Ospite | NON ESEGUITO | — |
| T-0280 | 17 | Log browser | NON ESEGUITO | — |
| T-0281 | 17 | Log Cloudflare | NON ESEGUITO | — |
| T-0282 | 17 | Misurazione prestazioni | NON ESEGUITO | — |
| T-0283 | 17 | NO | NON ESEGUITO | — |
| T-0284 | 17 | NON SUPERATO | NON ESEGUITO | — |
| T-0285 | 17 | PARZIALE | NON ESEGUITO | — |
| T-0286 | 17 | Pubblico | NON ESEGUITO | — |
| T-0287 | 17 | Query database | NON ESEGUITO | — |
| T-0288 | 17 | Screenshot | NON ESEGUITO | — |
| T-0289 | 17 | SÌ | NON ESEGUITO | — |
| T-0290 | 17 | SUPERATO | NON ESEGUITO | — |
| T-0291 | 17 | Viaggiatore | NON ESEGUITO | — |
| T-0292 | 17 | Video | NON ESEGUITO | — |
| T-0293 | 18 | Android Chrome; | NON ESEGUITO | — |
| T-0294 | 18 | Android PWA; | NON ESEGUITO | — |
| T-0295 | 18 | computer – utente pubblico; | NON ESEGUITO | — |
| T-0296 | 18 | computer macOS, se disponibile. | NON ESEGUITO | — |
| T-0297 | 18 | computer Windows; | NON ESEGUITO | — |
| T-0298 | 18 | iPhone PWA; | NON ESEGUITO | — |
| T-0299 | 18 | iPhone Safari; | NON ESEGUITO | — |
| T-0300 | 18 | tablet; | NON ESEGUITO | — |
| T-0301 | 18 | telefono A – Coordinatore; | NON ESEGUITO | — |
| T-0302 | 18 | telefono B – Viaggiatore 1; | NON ESEGUITO | — |
| T-0303 | 18 | telefono C – Viaggiatore 2; | NON ESEGUITO | — |
| T-0304 | 18 | telefono D – Familiare; | NON ESEGUITO | — |
| T-0305 | 19 | Aprire il dominio senza cache. | NON ESEGUITO | — |
| T-0306 | 19 | Aprire nuovamente la PWA. | NON ESEGUITO | — |
| T-0307 | 19 | Installare la PWA su Android. | NON ESEGUITO | — |
| T-0308 | 19 | Installare la PWA su iPhone. | NON ESEGUITO | — |
| T-0309 | 19,41 | Riavviare il telefono. | NON ESEGUITO | — |
| T-0310 | 19 | Verificare aggiornamento dalla versione precedente. | NON ESEGUITO | — |
| T-0311 | 19 | Verificare apertura standalone. | NON ESEGUITO | — |
| T-0312 | 19 | Verificare assenza di errori in console. | NON ESEGUITO | — |
| T-0313 | 19 | Verificare assenza di schermata bianca. | NON ESEGUITO | — |
| T-0314 | 19 | Verificare che l’aggiornamento non elimini dati o bozze. | NON ESEGUITO | — |
| T-0315 | 19 | Verificare che un aggiornamento non faccia perdere allegati selezionati. | NON ESEGUITO | — |
| T-0316 | 19 | Verificare HTTPS. | NON ESEGUITO | — |
| T-0317 | 19 | Verificare icona corretta. | NON ESEGUITO | — |
| T-0318 | 19,41 | Verificare mantenimento della sessione. | NON ESEGUITO | — |
| T-0319 | 19 | Verificare nome corretto. | NON ESEGUITO | — |
| T-0320 | 19 | Verificare REV 1.21.5. | NON ESEGUITO | — |
| T-0321 | 20 | Accedere come Viaggiatore A. | NON ESEGUITO | — |
| T-0322 | 20 | Aprire invito sul telefono A. | NON ESEGUITO | — |
| T-0323 | 20 | Aprire l’app come pubblico. | NON ESEGUITO | — |
| T-0324 | 20 | Creare invito per Viaggiatore A. | NON ESEGUITO | — |
| T-0325 | 20,99 | Eseguire logout. | NON ESEGUITO | — |
| T-0326 | 20 | Modificare manualmente profile_id. | NON ESEGUITO | — |
| T-0327 | 20 | Modificare manualmente role. | NON ESEGUITO | — |
| T-0328 | 20,88 | Revocare il dispositivo. | SUPERATO | production-smoke: dispositivo secondario revocato |
| T-0329 | 20 | Risultato atteso definitivo: impossibile. | NON ESEGUITO | — |
| T-0330 | 20,28,29 | Risultato atteso: 403. | NON ESEGUITO | — |
| T-0331 | 20,42 | Risultato atteso: accesso negato. | NON ESEGUITO | — |
| T-0332 | 20 | Risultato atteso: nessun aumento dei privilegi. | NON ESEGUITO | — |
| T-0333 | 20 | Riutilizzare lo stesso invito su telefono B. | NON ESEGUITO | — |
| T-0334 | 20 | Tentare di accedere come Viaggiatore B usando il codice comune. | NON ESEGUITO | — |
| T-0335 | 20 | Utilizzare invito scaduto. | NON ESEGUITO | — |
| T-0336 | 20 | Verificare accesso negato immediato. | NON ESEGUITO | — |
| T-0337 | 20 | Verificare che il pubblico non veda documenti. | SUPERATO | production-smoke: area documenti privata restituisce 401 al pubblico |
| T-0338 | 20 | Verificare che il pubblico non veda posizioni. | SUPERATO | production-smoke: eliminazione posizione restituisce 403 al pubblico |
| T-0339 | 20 | Verificare che il token non funzioni più. | NON ESEGUITO | — |
| T-0340 | 20 | Verificare che l’invito funzioni una sola volta. | NON ESEGUITO | — |
| T-0341 | 20 | Verificare che non possa diventare Coordinatore. | NON ESEGUITO | — |
| T-0342 | 21 | Caricare fotografia. | NON ESEGUITO | — |
| T-0343 | 21 | Creare un profilo. | NON ESEGUITO | — |
| T-0344 | 21 | Inserire apostrofi e accenti. | NON ESEGUITO | — |
| T-0345 | 21 | Inserire biografia. | NON ESEGUITO | — |
| T-0346 | 21 | Inserire caratteri HTML e script. | NON ESEGUITO | — |
| T-0347 | 21 | Inserire città. | NON ESEGUITO | — |
| T-0348 | 21 | Inserire emoji. | NON ESEGUITO | — |
| T-0349 | 21 | Inserire età. | NON ESEGUITO | — |
| T-0350 | 21 | Inserire lavoro. | NON ESEGUITO | — |
| T-0351 | 21 | Inserire nome e cognome. | NON ESEGUITO | — |
| T-0352 | 21 | Inserire un nome molto lungo. | NON ESEGUITO | — |
| T-0353 | 21 | Modificare ogni campo. | NON ESEGUITO | — |
| T-0354 | 21 | Sostituire fotografia. | NON ESEGUITO | — |
| T-0355 | 21 | Verificare che il Coordinatore gestisca i profili autorizzati. | NON ESEGUITO | — |
| T-0356 | 21 | Verificare che il Viaggiatore modifichi soltanto il proprio profilo. | NON ESEGUITO | — |
| T-0357 | 21 | Verificare che vengano mostrati come testo innocuo. | NON ESEGUITO | — |
| T-0358 | 21 | Verificare eliminazione della vecchia fotografia. | NON ESEGUITO | — |
| T-0359 | 21 | Verificare privacy dei dati sul profilo pubblico. | SUPERATO | production-smoke: nessun campo privato nei profili pubblici |
| T-0360 | 22 | Chiudere e riaprire. | NON ESEGUITO | — |
| T-0361 | 22 | Verificare Agra. | NON ESEGUITO | — |
| T-0362 | 22 | Verificare attività. | NON ESEGUITO | — |
| T-0363 | 22,87 | Verificare checklist. | NON ESEGUITO | — |
| T-0364 | 22 | Verificare chilometri. | NON ESEGUITO | — |
| T-0365 | 22 | Verificare date dal 10 al 23 agosto 2026. | NON ESEGUITO | — |
| T-0366 | 22 | Verificare Delhi. | NON ESEGUITO | — |
| T-0367 | 22 | Verificare descrizioni. | NON ESEGUITO | — |
| T-0368 | 22 | Verificare durate. | NON ESEGUITO | — |
| T-0369 | 22 | Verificare giorno precedente e successivo. | NON ESEGUITO | — |
| T-0370 | 22 | Verificare Jaipur. | NON ESEGUITO | — |
| T-0371 | 22 | Verificare Jodhpur. | NON ESEGUITO | — |
| T-0372 | 22 | Verificare mezzi. | NON ESEGUITO | — |
| T-0373 | 22 | Verificare obiettivi. | NON ESEGUITO | — |
| T-0374 | 22 | Verificare persistenza della checklist. | NON ESEGUITO | — |
| T-0375 | 22 | Verificare Ranakpur. | NON ESEGUITO | — |
| T-0376 | 22 | Verificare ritorno a Delhi. | NON ESEGUITO | — |
| T-0377 | 22 | Verificare titoli. | NON ESEGUITO | — |
| T-0378 | 22 | Verificare tutte le 14 giornate. | NON ESEGUITO | — |
| T-0379 | 22 | Verificare Udaipur. | NON ESEGUITO | — |
| T-0380 | 22 | Verificare Varanasi. | NON ESEGUITO | — |
| T-0381 | 23 | Aprire la mappa generale. | NON ESEGUITO | — |
| T-0382 | 23 | Aprire ogni singola giornata. | NON ESEGUITO | — |
| T-0383 | 23 | Aprire una mappa tramite collegamento. | NON ESEGUITO | — |
| T-0384 | 23 | Controllare Delhi iniziale e finale. | NON ESEGUITO | — |
| T-0385 | 23 | Controllare gesture con una mano. | NON ESEGUITO | — |
| T-0386 | 23 | Controllare marker sovrapposti. | NON ESEGUITO | — |
| T-0387 | 23 | Controllare orientamento orizzontale. | NON ESEGUITO | — |
| T-0388 | 23 | Controllare orientamento verticale. | NON ESEGUITO | — |
| T-0389 | 23 | Controllare tutte le coordinate. | NON ESEGUITO | — |
| T-0390 | 23 | Controllare tutti i marker. | NON ESEGUITO | — |
| T-0391 | 23 | Controllare tutti i percorsi. | NON ESEGUITO | — |
| T-0392 | 23 | Controllare zoom automatico. | NON ESEGUITO | — |
| T-0393 | 23 | Controllare zoom con due dita. | NON ESEGUITO | — |
| T-0394 | 23 | Provare senza connessione. | NON ESEGUITO | — |
| T-0395 | 23 | Ricaricare la pagina. | NON ESEGUITO | — |
| T-0396 | 23,39,74 | Tornare indietro. | NON ESEGUITO | — |
| T-0397 | 23 | Verificare alternativa offline. | NON ESEGUITO | — |
| T-0398 | 23 | Verificare che il collegamento riapra la stessa mappa. | NON ESEGUITO | — |
| T-0399 | 23 | Verificare ritorno allo stesso giorno e alla stessa posizione. | NON ESEGUITO | — |
| T-0400 | 24 | Eliminare il post. | NON ESEGUITO | — |
| T-0401 | 24 | Pubblicare 10 allegati. | NON ESEGUITO | — |
| T-0402 | 24 | Pubblicare con emoji. | NON ESEGUITO | — |
| T-0403 | 24 | Pubblicare con luogo scritto manualmente. | NON ESEGUITO | — |
| T-0404 | 24 | Pubblicare con posizione GPS. | NON ESEGUITO | — |
| T-0405 | 24 | Pubblicare contenuto misto. | NON ESEGUITO | — |
| T-0406 | 24 | Pubblicare in ogni giornata. | NON ESEGUITO | — |
| T-0407 | 24 | Pubblicare più fotografie. | NON ESEGUITO | — |
| T-0408 | 24 | Pubblicare senza testo. | NON ESEGUITO | — |
| T-0409 | 24 | Pubblicare solo testo. | NON ESEGUITO | — |
| T-0410 | 24 | Pubblicare testo molto lungo. | NON ESEGUITO | — |
| T-0411 | 24 | Pubblicare un audio. | NON ESEGUITO | — |
| T-0412 | 24 | Pubblicare un video. | NON ESEGUITO | — |
| T-0413 | 24 | Pubblicare una fotografia. | NON ESEGUITO | — |
| T-0414 | 24 | Rimuovere la posizione prima dell’invio. | NON ESEGUITO | — |
| T-0415 | 24 | Tentare 11 allegati. | NON ESEGUITO | — |
| T-0416 | 24 | Verificare aggiornamento sul secondo telefono. | NON ESEGUITO | — |
| T-0417 | 24 | Verificare autore corretto. | NON ESEGUITO | — |
| T-0418 | 24 | Verificare eliminazione di tutti i file collegati. | NON ESEGUITO | — |
| T-0419 | 24 | Verificare eliminazione su tutti i dispositivi. | NON ESEGUITO | — |
| T-0420 | 24 | Verificare messaggio corretto. | NON ESEGUITO | — |
| T-0421 | 24 | Verificare ordinamento nel feed. | NON ESEGUITO | — |
| T-0422 | 24 | Verificare profile_id corretto nel database. | NON ESEGUITO | — |
| T-0423 | 25 | AAC. | NON ESEGUITO | — |
| T-0424 | 25 | estensione falsa. | NON ESEGUITO | — |
| T-0425 | 25 | file corrotto. | NON ESEGUITO | — |
| T-0426 | 25 | file HTML rinominato JPG. | NON ESEGUITO | — |
| T-0427 | 25 | file oltre 12 MB. | NON ESEGUITO | — |
| T-0428 | 25 | file senza estensione. | NON ESEGUITO | — |
| T-0429 | 25 | file SVG rinominato PNG. | NON ESEGUITO | — |
| T-0430 | 25 | fotografia orizzontale. | NON ESEGUITO | — |
| T-0431 | 25 | fotografia verticale. | NON ESEGUITO | — |
| T-0432 | 25 | HEIC. | NON ESEGUITO | — |
| T-0433 | 25 | HEIF. | NON ESEGUITO | — |
| T-0434 | 25 | JPEG. | NON ESEGUITO | — |
| T-0435 | 25 | M4A. | NON ESEGUITO | — |
| T-0436 | 25 | MOV. | NON ESEGUITO | — |
| T-0437 | 25 | MP4. | NON ESEGUITO | — |
| T-0438 | 25 | PDF molto grande. | NON ESEGUITO | — |
| T-0439 | 25 | PDF nei documenti. | NON ESEGUITO | — |
| T-0440 | 25 | PNG. | NON ESEGUITO | — |
| T-0441 | 25 | video oltre 25 MB. | NON ESEGUITO | — |
| T-0442 | 25 | video orizzontale. | NON ESEGUITO | — |
| T-0443 | 25 | video verticale. | NON ESEGUITO | — |
| T-0444 | 25 | WebM. | NON ESEGUITO | — |
| T-0445 | 26 | Autorizzare il microfono. | NON ESEGUITO | — |
| T-0446 | 26 | Bloccare lo schermo durante la registrazione. | NON ESEGUITO | — |
| T-0447 | 26 | Cambiare applicazione. | NON ESEGUITO | — |
| T-0448 | 26 | Eliminare. | NON ESEGUITO | — |
| T-0449 | 26 | Mettere in pausa. | NON ESEGUITO | — |
| T-0450 | 26 | Negare il microfono. | NON ESEGUITO | — |
| T-0451 | 26 | Registrare 5 minuti. | NON ESEGUITO | — |
| T-0452 | 26 | Registrare 5 secondi. | NON ESEGUITO | — |
| T-0453 | 26 | Registrare nuovamente. | NON ESEGUITO | — |
| T-0454 | 26 | Riascoltare. | NON ESEGUITO | — |
| T-0455 | 26 | Ricevere una telefonata durante la registrazione. | NON ESEGUITO | — |
| T-0456 | 26 | Riprendere. | NON ESEGUITO | — |
| T-0457 | 26,45 | Tornare nell’app. | NON ESEGUITO | — |
| T-0458 | 26 | Verificare che l’audio non venga perso o corrotto. | NON ESEGUITO | — |
| T-0459 | 27 | Cambio reazione. | NON ESEGUITO | — |
| T-0460 | 27 | Commento con audio. | NON ESEGUITO | — |
| T-0461 | 27 | Commento con fotografia. | NON ESEGUITO | — |
| T-0462 | 27 | Commento con video. | NON ESEGUITO | — |
| T-0463 | 27 | Commento testuale. | NON ESEGUITO | — |
| T-0464 | 27 | Due persone reagiscono contemporaneamente. | NON ESEGUITO | — |
| T-0465 | 27 | Eliminazione commento. | NON ESEGUITO | — |
| T-0466 | 27 | Inserimento di HTML/script. | NON ESEGUITO | — |
| T-0467 | 27 | Invio ripetuto rapido. | NON ESEGUITO | — |
| T-0468 | 27 | Modifica commento. | NON ESEGUITO | — |
| T-0469 | 27 | Reazione Mi piace. | NON ESEGUITO | — |
| T-0470 | 27 | Rimozione reazione. | NON ESEGUITO | — |
| T-0471 | 27 | Tentativo di eliminare commento altrui. | NON ESEGUITO | — |
| T-0472 | 27 | Tentativo di modificare commento altrui. | NON ESEGUITO | — |
| T-0473 | 27 | Verifica aggiornamento sul secondo telefono. | NON ESEGUITO | — |
| T-0474 | 27 | Verifica antispam. | NON ESEGUITO | — |
| T-0475 | 28 | Aprire documento. | NON ESEGUITO | — |
| T-0476 | 28 | Caricare assicurazione. | NON ESEGUITO | — |
| T-0477 | 28 | Caricare biglietti. | NON ESEGUITO | — |
| T-0478 | 28 | Caricare passaporto. | NON ESEGUITO | — |
| T-0479 | 28 | Caricare visto. | NON ESEGUITO | — |
| T-0480 | 28 | Coordinatore: documenti autorizzati del gruppo. | NON ESEGUITO | — |
| T-0481 | 28 | Eliminare documento. | NON ESEGUITO | — |
| T-0482 | 28 | Familiare: nessun accesso. | NON ESEGUITO | — |
| T-0483 | 28 | Manipolare profile_id nell’URL. | NON ESEGUITO | — |
| T-0484 | 28 | Pubblico: nessun accesso. | NON ESEGUITO | — |
| T-0485 | 28 | Scaricare documento. | NON ESEGUITO | — |
| T-0486 | 28 | Sostituire documento. | NON ESEGUITO | — |
| T-0487 | 28 | Verificare eliminazione del vecchio file. | NON ESEGUITO | — |
| T-0488 | 28 | Verificare intestazione private, no-store. | NON ESEGUITO | — |
| T-0489 | 28 | Verificare log di apertura e download. | NON ESEGUITO | — |
| T-0490 | 28 | Verificare logout durante apertura. | NON ESEGUITO | — |
| T-0491 | 28 | Verificare nessun documento nella cache del browser. | NON ESEGUITO | — |
| T-0492 | 28 | Verificare URL precedente non più funzionante. | NON ESEGUITO | — |
| T-0493 | 28 | Viaggiatore A: impossibile aprire documento B. | NON ESEGUITO | — |
| T-0494 | 28 | Viaggiatore A: soltanto documenti A. | NON ESEGUITO | — |
| T-0495 | 29,39 | Aprire Google Maps. | NON ESEGUITO | — |
| T-0496 | 29 | Cancellare la posizione. | NON ESEGUITO | — |
| T-0497 | 29 | Consentire geolocalizzazione. | NON ESEGUITO | — |
| T-0498 | 29 | Negare geolocalizzazione. | NON ESEGUITO | — |
| T-0499 | 29 | Posizione all’interno di un edificio. | NON ESEGUITO | — |
| T-0500 | 29 | Posizione con GPS impreciso. | NON ESEGUITO | — |
| T-0501 | 29 | Posizione con GPS preciso. | NON ESEGUITO | — |
| T-0502 | 29 | Posizione in movimento. | NON ESEGUITO | — |
| T-0503 | 29 | Tentare di modificare posizione altrui. | NON ESEGUITO | — |
| T-0504 | 29 | Utilizzare Naviga. | NON ESEGUITO | — |
| T-0505 | 29 | Verificare che non siano invertite. | NON ESEGUITO | — |
| T-0506 | 29 | Verificare fuso orario. | NON ESEGUITO | — |
| T-0507 | 29 | Verificare latitudine. | NON ESEGUITO | — |
| T-0508 | 29 | Verificare longitudine. | NON ESEGUITO | — |
| T-0509 | 29 | Verificare scadenza automatica. | NON ESEGUITO | — |
| T-0510 | 29 | Verificare scomparsa sul secondo telefono. | NON ESEGUITO | — |
| T-0511 | 29 | Verificare stato posizione vecchia. | NON ESEGUITO | — |
| T-0512 | 29 | Verificare timestamp. | NON ESEGUITO | — |
| T-0513 | 30 | App aperta. | NON ESEGUITO | — |
| T-0514 | 30 | App chiusa. | NON ESEGUITO | — |
| T-0515 | 30 | App in background. | NON ESEGUITO | — |
| T-0516 | 30 | Aprire la notifica. | NON ESEGUITO | — |
| T-0517 | 30 | Attivarle su Android PWA. | NON ESEGUITO | — |
| T-0518 | 30 | Attivarle su iPhone PWA. | NON ESEGUITO | — |
| T-0519 | 30 | Autorizzare notifiche. | NON ESEGUITO | — |
| T-0520 | 30 | Disattivazione notifiche. | NON ESEGUITO | — |
| T-0521 | 30 | Modalità risparmio energetico. | NON ESEGUITO | — |
| T-0522 | 30 | Negare notifiche. | NON ESEGUITO | — |
| T-0523 | 30 | Negarle e tentare nuovamente. | NON ESEGUITO | — |
| T-0524 | 30 | Nuova menzione. | NON ESEGUITO | — |
| T-0525 | 30 | Nuova risposta. | NON ESEGUITO | — |
| T-0526 | 30 | Nuovo commento. | NON ESEGUITO | — |
| T-0527 | 30 | Nuovo post. | NON ESEGUITO | — |
| T-0528 | 30 | Riavvio del telefono. | NON ESEGUITO | — |
| T-0529 | 30 | Schermo bloccato. | NON ESEGUITO | — |
| T-0530 | 30 | Verificare apertura del contenuto preciso. | NON ESEGUITO | — |
| T-0531 | 30 | Verificare nessun nuovo invio dopo disattivazione. | NON ESEGUITO | — |
| T-0532 | 30 | Verificare privacy del testo mostrato sul blocco schermo. | NON ESEGUITO | — |
| T-0533 | 31 | Aprire l’app online. | NON ESEGUITO | — |
| T-0534 | 31 | Attivare modalità aereo. | NON ESEGUITO | — |
| T-0535 | 31 | Cambiare da Wi-Fi a dati mobili. | NON ESEGUITO | — |
| T-0536 | 31 | Chiudere completamente l’app. | NON ESEGUITO | — |
| T-0537 | 31 | Consultare checklist. | NON ESEGUITO | — |
| T-0538 | 31 | Consultare informazioni di emergenza. | NON ESEGUITO | — |
| T-0539 | 31 | Consultare itinerario. | NON ESEGUITO | — |
| T-0540 | 31 | Consultare post già scaricati. | NON ESEGUITO | — |
| T-0541 | 31 | Interrompere upload al 25%. | NON ESEGUITO | — |
| T-0542 | 31 | Interrompere upload al 50%. | NON ESEGUITO | — |
| T-0543 | 31 | Interrompere upload al 90%. | NON ESEGUITO | — |
| T-0544 | 31 | Preparare post con audio offline. | NON ESEGUITO | — |
| T-0545 | 31 | Preparare post con fotografia offline. | NON ESEGUITO | — |
| T-0546 | 31 | Preparare post con video offline. | NON ESEGUITO | — |
| T-0547 | 31 | Preparare post testuale offline. | NON ESEGUITO | — |
| T-0548 | 31 | Riaprire l’app. | NON ESEGUITO | — |
| T-0549 | 31 | Riaprire offline. | NON ESEGUITO | — |
| T-0550 | 31 | Riattivare la rete. | NON ESEGUITO | — |
| T-0551 | 31 | Simulare latenza di 2 secondi. | NON ESEGUITO | — |
| T-0552 | 31 | Simulare perdita pacchetti. | NON ESEGUITO | — |
| T-0553 | 31 | Simulare rete 2G. | NON ESEGUITO | — |
| T-0554 | 31 | Simulare rete 3G. | NON ESEGUITO | — |
| T-0555 | 31 | Verificare invio automatico una sola volta. | NON ESEGUITO | — |
| T-0556 | 31 | Verificare presenza della bozza e degli allegati. | NON ESEGUITO | — |
| T-0557 | 31 | Verificare ripresa senza duplicazione. | SUPERATO | resumable-upload: parte già confermata non viene inviata due volte |
| T-0558 | 32 | 1.000 commenti. | NON ESEGUITO | — |
| T-0559 | 32,59 | 1.000 post. | NON ESEGUITO | — |
| T-0560 | 32 | 10 allegati per post. | NON ESEGUITO | — |
| T-0561 | 32 | 10 utenti contemporanei. | NON ESEGUITO | — |
| T-0562 | 32 | 10.000 reazioni. | NON ESEGUITO | — |
| T-0563 | 32,59 | 100 post. | NON ESEGUITO | — |
| T-0564 | 32 | 2 utenti contemporanei. | NON ESEGUITO | — |
| T-0565 | 32 | 25 utenti contemporanei. | NON ESEGUITO | — |
| T-0566 | 32 | 5 utenti contemporanei. | NON ESEGUITO | — |
| T-0567 | 32 | 50 utenti contemporanei. | NON ESEGUITO | — |
| T-0568 | 32 | Aggiornamenti contemporanei da tre telefoni. | NON ESEGUITO | — |
| T-0569 | 32 | Aggiornamento posizione contemporaneo. | NON ESEGUITO | — |
| T-0570 | 32 | Commento mentre il post viene eliminato. | NON ESEGUITO | — |
| T-0571 | 32 | Dieci notifiche contemporanee. | NON ESEGUITO | — |
| T-0572 | 32 | Eliminazione mentre un altro dispositivo legge. | NON ESEGUITO | — |
| T-0573 | 32 | Sostituzione documento durante il download. | NON ESEGUITO | — |
| T-0574 | 32 | Tre upload contemporanei. | NON ESEGUITO | — |
| T-0575 | 32 | Verificare assenza di duplicazioni. | NON ESEGUITO | — |
| T-0576 | 32,62 | Verificare assenza di file orfani. | NON ESEGUITO | — |
| T-0577 | 32 | Verificare consumo Cloudflare. | NON ESEGUITO | — |
| T-0578 | 32 | Verificare stabilità del database. | NON ESEGUITO | — |
| T-0579 | 33 | Eseguire prova continuativa di 48 ore. | NON ESEGUITO | — |
| T-0580 | 33 | Lasciare l’app aperta per 24 ore. | NON ESEGUITO | — |
| T-0581 | 33 | Lasciare l’app aperta per 8 ore. | NON ESEGUITO | — |
| T-0582 | 33 | Misurare apertura iniziale. | NON ESEGUITO | — |
| T-0583 | 33 | Misurare apertura mappa. | NON ESEGUITO | — |
| T-0584 | 33 | Misurare apertura successiva. | NON ESEGUITO | — |
| T-0585 | 33 | Misurare batteria in un’ora. | NON ESEGUITO | — |
| T-0586 | 33 | Misurare caricamento documento. | NON ESEGUITO | — |
| T-0587 | 33 | Misurare caricamento feed. | NON ESEGUITO | — |
| T-0588 | 33 | Misurare consumo CPU. | NON ESEGUITO | — |
| T-0589 | 33 | Misurare consumo RAM. | NON ESEGUITO | — |
| T-0590 | 33 | Misurare dati consumati in un’ora. | NON ESEGUITO | — |
| T-0591 | 33 | Misurare pubblicazione post. | NON ESEGUITO | — |
| T-0592 | 33 | Verificare assenza di aumento progressivo della memoria. | NON ESEGUITO | — |
| T-0593 | 33 | Verificare che il controllo ogni 2,5 secondi non consumi eccessivamente dati e batteria. | NON ESEGUITO | — |
| T-0594 | 34 | Utilizzare l’app al buio. | NON ESEGUITO | — |
| T-0595 | 34 | Utilizzare l’app camminando. | NON ESEGUITO | — |
| T-0596 | 34 | Utilizzare l’app con una sola mano. | NON ESEGUITO | — |
| T-0597 | 34 | Utilizzare l’app in automobile come passeggero. | NON ESEGUITO | — |
| T-0598 | 34 | Utilizzare l’app sotto luce solare. | NON ESEGUITO | — |
| T-0599 | 34 | Verificare che la tastiera non copra i pulsanti. | NON ESEGUITO | — |
| T-0600 | 34 | Verificare che non esistano pulsanti simulati. | NON ESEGUITO | — |
| T-0601 | 34 | Verificare che ogni operazione mostri se è in corso, riuscita o fallita. | NON ESEGUITO | — |
| T-0602 | 34 | Verificare contrasto colori. | NON ESEGUITO | — |
| T-0603 | 34 | Verificare focus visibile. | NON ESEGUITO | — |
| T-0604 | 34 | Verificare messaggi di errore comprensibili. | NON ESEGUITO | — |
| T-0605 | 34 | Verificare navigazione da tastiera. | NON ESEGUITO | — |
| T-0606 | 34 | Verificare orientamento orizzontale. | NON ESEGUITO | — |
| T-0607 | 34 | Verificare orientamento verticale. | NON ESEGUITO | — |
| T-0608 | 34 | Verificare pulsanti di almeno 44×44 pixel. | NON ESEGUITO | — |
| T-0609 | 34 | Verificare riduzione animazioni. | NON ESEGUITO | — |
| T-0610 | 34 | Verificare screen reader. | NON ESEGUITO | — |
| T-0611 | 34 | Verificare tastiera aperta. | NON ESEGUITO | — |
| T-0612 | 34 | Verificare testi leggibili. | NON ESEGUITO | — |
| T-0613 | 34 | Verificare zoom testo 200%. | NON ESEGUITO | — |
| T-0614 | 35 | Caricare file con MIME falso. | NON ESEGUITO | — |
| T-0615 | 35 | Copiare token su altro dispositivo. | NON ESEGUITO | — |
| T-0616 | 35 | Eseguire richieste ripetute automatiche. | NON ESEGUITO | — |
| T-0617 | 35 | Inserire HTML. | NON ESEGUITO | — |
| T-0618 | 35 | Inserire JavaScript. | NON ESEGUITO | — |
| T-0619 | 35 | Inserire nome contenente script. | NON ESEGUITO | — |
| T-0620 | 35 | Inserire nome contenente virgolette e tag. | NON ESEGUITO | — |
| T-0621 | 35 | Modificare profile_id. | NON ESEGUITO | — |
| T-0622 | 35 | Modificare role. | NON ESEGUITO | — |
| T-0623 | 35 | Modificare token. | NON ESEGUITO | — |
| T-0624 | 35 | Tentare accesso a documento altrui. | NON ESEGUITO | — |
| T-0625 | 35 | Tentare eliminazione post altrui. | NON ESEGUITO | — |
| T-0626 | 35 | Tentare modifica commento altrui. | NON ESEGUITO | — |
| T-0627 | 35 | Utilizzare token revocato. | NON ESEGUITO | — |
| T-0628 | 35 | Utilizzare token scaduto. | NON ESEGUITO | — |
| T-0629 | 35 | Verificare audit log. | NON ESEGUITO | — |
| T-0630 | 35 | Verificare che nessun dato sensibile compaia nei log. | NON ESEGUITO | — |
| T-0631 | 35 | Verificare che nessun segreto sia presente nel frontend. | NON ESEGUITO | — |
| T-0632 | 35 | Verificare CSP. | SUPERATO | production-smoke: CSP verificata sul dominio live |
| T-0633 | 35 | Verificare rate limiting. | SUPERATO | QA 1.28.0: raffica di accessi errati bloccata con HTTP 429 |
| T-0634 | 36 | Backup archivio MEDIA. | NON ESEGUITO | — |
| T-0635 | 36 | Backup D1. | SUPERATO | backup D1 pre-1.29.0 esportato e verificato |
| T-0636 | 36 | Backup delle chiavi Push. | NON ESEGUITO | — |
| T-0637 | 36 | Backup delle configurazioni. | NON ESEGUITO | — |
| T-0638 | 36 | Confronto conteggi prima/dopo. | NON ESEGUITO | — |
| T-0639 | 36 | Prova di ripristino documentata. | SUPERATO | verify-d1-backup: procedura ripetibile di ripristino documentata nel repository |
| T-0640 | 36 | Registrazione data e ora backup. | SUPERATO | backup D1 registrato con data, ora e impronta SHA-256 |
| T-0641 | 36 | Ripristino in ambiente di prova. | SUPERATO | verify-d1-backup: ripristino eseguito in database temporaneo vuoto |
| T-0642 | 36 | Verifica commenti ripristinati. | SUPERATO | verify-d1-backup: 8 commenti ripristinati e leggibili |
| T-0643 | 36 | Verifica documenti ripristinati. | SUPERATO | verify-d1-backup: 14 documenti ripristinati e leggibili |
| T-0644 | 36 | Verifica integrità backup. | SUPERATO | verify-d1-backup: PRAGMA integrity_check restituisce ok |
| T-0645 | 36 | Verifica media ripristinati. | NON ESEGUITO | — |
| T-0646 | 36 | Verifica posizioni ripristinate. | SUPERATO | verify-d1-backup: posizione ripristinata |
| T-0647 | 36 | Verifica post ripristinati. | SUPERATO | verify-d1-backup: 10 post ripristinati |
| T-0648 | 36 | Verifica profili ripristinati. | SUPERATO | verify-d1-backup: 5 profili ripristinati |
| T-0649 | 37 | Accesso tramite eSIM. | NON ESEGUITO | — |
| T-0650 | 37 | Accesso tramite rete Wi-Fi indiana. | NON ESEGUITO | — |
| T-0651 | 37 | Accesso tramite roaming italiano. | NON ESEGUITO | — |
| T-0652 | 37 | Accesso tramite SIM indiana. | NON ESEGUITO | — |
| T-0653 | 37 | Verifica caricamento foto. | NON ESEGUITO | — |
| T-0654 | 37 | Verifica caricamento video. | NON ESEGUITO | — |
| T-0655 | 37 | Verifica Cloudflare raggiungibile. | NON ESEGUITO | — |
| T-0656 | 37 | Verifica consumo dati. | NON ESEGUITO | — |
| T-0657 | 37 | Verifica funzionamento con computer del programmatore spento. | NON ESEGUITO | — |
| T-0658 | 37 | Verifica Google Maps raggiungibile. | NON ESEGUITO | — |
| T-0659 | 37 | Verifica mappe raggiungibili. | NON ESEGUITO | — |
| T-0660 | 37 | Verifica notifiche Push. | NON ESEGUITO | — |
| T-0661 | 37 | Verifica OpenFreeMap raggiungibile. | NON ESEGUITO | — |
| T-0662 | 37 | Verifica posizione. | NON ESEGUITO | — |
| T-0663 | 37 | Verifica Unsplash raggiungibile. | NON ESEGUITO | — |
| T-0664 | 38 | commenti e reazioni non sono manipolabili; | NON ESEGUITO | — |
| T-0665 | 38 | è pubblicata realmente; | NON ESEGUITO | — |
| T-0666 | 38 | è stata eseguita una prova dalla rete indiana; | NON ESEGUITO | — |
| T-0667 | 38 | esistono backup e ripristino; | NON ESEGUITO | — |
| T-0668 | 38 | esistono rate limiting e protezioni antispam; | NON ESEGUITO | — |
| T-0669 | 38 | esistono test automatici reali; | NON ESEGUITO | — |
| T-0670 | 38 | GitHub e Cloudflare utilizzano lo stesso commit; | NON ESEGUITO | — |
| T-0671 | 38 | gli invii non vengono duplicati; | SUPERATO | production-smoke: doppio invio conserva un solo record |
| T-0672 | 38 | gli upload riprendono dopo perdita della rete; | NON ESEGUITO | — |
| T-0673 | 38 | i dati dei profili rispettano la privacy; | NON ESEGUITO | — |
| T-0674 | 38 | il codice comune non permette di impersonare un profilo; | NON ESEGUITO | — |
| T-0675 | 38 | il Coordinatore è autorizzato lato server; | NON ESEGUITO | — |
| T-0676 | 38 | il dominio mostra REV 1.21.5; | NON ESEGUITO | — |
| T-0677 | 38 | l’applicazione funziona con il computer del programmatore spento; | NON ESEGUITO | — |
| T-0678 | 38 | l’offline conserva testo e allegati; | SUPERATO | offline-queue: testo, foto, audio e video conservati nella coda |
| T-0679 | 38 | la visibilità dei post è reale; | NON ESEGUITO | — |
| T-0680 | 38 | le coordinate sono corrette; | NON ESEGUITO | — |
| T-0681 | 38 | le notifiche aprono il contenuto preciso; | NON ESEGUITO | — |
| T-0682 | 38 | le posizioni scadono automaticamente; | NON ESEGUITO | — |
| T-0683 | 38 | nessun pulsante è soltanto simulato; | NON ESEGUITO | — |
| T-0684 | 38 | nessuna funzione esistente è stata eliminata; | NON ESEGUITO | — |
| T-0685 | 38 | ogni prova dispone di evidenza. | NON ESEGUITO | — |
| T-0686 | 38 | ogni Viaggiatore vede soltanto i propri documenti; | NON ESEGUITO | — |
| T-0687 | 38 | sono stati superati i test Android; | NON ESEGUITO | — |
| T-0688 | 38 | sono stati superati i test di rete lenta; | NON ESEGUITO | — |
| T-0689 | 38 | sono stati superati i test iPhone; | NON ESEGUITO | — |
| T-0690 | 38 | sono stati superati i test multidispositivo; | NON ESEGUITO | — |
| T-0691 | 39 | Aprire il giorno 5 dell’itinerario. | NON ESEGUITO | — |
| T-0692 | 39 | Aprire la posizione del post. | NON ESEGUITO | — |
| T-0693 | 39 | Avviare Naviga. | NON ESEGUITO | — |
| T-0694 | 39 | Cancellare la posizione dal telefono A. | NON ESEGUITO | — |
| T-0695 | 39 | Caricare quattro documenti dal telefono B. | NON ESEGUITO | — |
| T-0696 | 39 | Collegare il telefono A tramite invito personale. | NON ESEGUITO | — |
| T-0697 | 39 | Condividere la posizione dal telefono A. | NON ESEGUITO | — |
| T-0698 | 39 | Creare il profilo del Viaggiatore A. | NON ESEGUITO | — |
| T-0699 | 39 | Creare il profilo del Viaggiatore B. | NON ESEGUITO | — |
| T-0700 | 39 | Documentare e applicare una regola unica. | NON ESEGUITO | — |
| T-0701 | 39 | Eliminare un documento dal telefono B. | NON ESEGUITO | — |
| T-0702 | 39 | Modificare il nome del profilo A. | NON ESEGUITO | — |
| T-0703 | 39 | Pubblicare un contenuto. | NON ESEGUITO | — |
| T-0704 | 39 | Pubblicare un post dal telefono A. | NON ESEGUITO | — |
| T-0705 | 39 | Selezionare “Aggiungi ricordo”. | NON ESEGUITO | — |
| T-0706 | 39 | Sostituire il documento. | NON ESEGUITO | — |
| T-0707 | 39 | Toccare la notifica e verificare apertura del post preciso. | NON ESEGUITO | — |
| T-0708 | 39 | Verificare che day_index corrisponda al giorno 5. | NON ESEGUITO | — |
| T-0709 | 39 | Verificare che il conteggio torni a 4/4. | NON ESEGUITO | — |
| T-0710 | 39 | Verificare che il Coordinatore visualizzi 4/4. | NON ESEGUITO | — |
| T-0711 | 39 | Verificare che il nome del marker corrisponda al profilo A. | NON ESEGUITO | — |
| T-0712 | 39 | Verificare che il post compaia nel filtro del giorno corretto. | NON ESEGUITO | — |
| T-0713 | 39 | Verificare che il post compaia sul telefono B senza ricaricamento manuale. | NON ESEGUITO | — |
| T-0714 | 39 | Verificare che il post utilizzi automaticamente nome, cognome, fotografia e profile_id corretti. | NON ESEGUITO | — |
| T-0715 | 39 | Verificare che il telefono B riceva la notifica. | NON ESEGUITO | — |
| T-0716 | 39 | Verificare che il vecchio file non sia più raggiungibile. | NON ESEGUITO | — |
| T-0717 | 39 | Verificare che la dashboard del Coordinatore passi immediatamente a 3/4. | NON ESEGUITO | — |
| T-0718 | 39 | Verificare che non compaia in una giornata differente. | NON ESEGUITO | — |
| T-0719 | 39 | Verificare che non sia possibile pubblicare utilizzando il nome del Viaggiatore B. | NON ESEGUITO | — |
| T-0720 | 39 | Verificare la posizione dal telefono del Coordinatore. | NON ESEGUITO | — |
| T-0721 | 39 | Verificare ritorno allo stesso post e allo stesso punto di scorrimento. | NON ESEGUITO | — |
| T-0722 | 39 | Verificare scomparsa del marker su tutti i dispositivi. | NON ESEGUITO | — |
| T-0723 | 39 | Verificare se i post precedenti devono mantenere il vecchio nome oppure utilizzare quello nuovo. | NON ESEGUITO | — |
| T-0724 | 40 | apertura documento altrui; | NON ESEGUITO | — |
| T-0725 | 40 | apertura documento proprio; | NON ESEGUITO | — |
| T-0726 | 40 | cancellazione posizione altrui. | NON ESEGUITO | — |
| T-0727 | 40 | cancellazione posizione propria; | NON ESEGUITO | — |
| T-0728 | 40 | caricamento documento altrui; | NON ESEGUITO | — |
| T-0729 | 40 | caricamento documento proprio; | NON ESEGUITO | — |
| T-0730 | 40 | commento; | NON ESEGUITO | — |
| T-0731 | 40 | condivisione posizione propria; | NON ESEGUITO | — |
| T-0732 | 40 | creazione invito; | NON ESEGUITO | — |
| T-0733 | 40 | creazione profilo; | NON ESEGUITO | — |
| T-0734 | 40 | eliminazione documento altrui; | NON ESEGUITO | — |
| T-0735 | 40 | eliminazione documento proprio; | NON ESEGUITO | — |
| T-0736 | 40 | eliminazione post altrui; | NON ESEGUITO | — |
| T-0737 | 40 | eliminazione post proprio; | NON ESEGUITO | — |
| T-0738 | 40 | lettura profilo; | NON ESEGUITO | — |
| T-0739 | 40 | messaggio comprensibile nell’interfaccia; | NON ESEGUITO | — |
| T-0740 | 40 | modifica commento altrui; | NON ESEGUITO | — |
| T-0741 | 40 | modifica commento proprio; | NON ESEGUITO | — |
| T-0742 | 40 | modifica posizione altrui; | NON ESEGUITO | — |
| T-0743 | 40 | modifica profilo altrui; | NON ESEGUITO | — |
| T-0744 | 40 | modifica profilo proprio; | NON ESEGUITO | — |
| T-0745 | 40 | modifica ruolo; | NON ESEGUITO | — |
| T-0746 | 40 | nessun file creato; | NON ESEGUITO | — |
| T-0747 | 40 | nessuna informazione sensibile nella risposta. | NON ESEGUITO | — |
| T-0748 | 40 | nessuna modifica nel database; | NON ESEGUITO | — |
| T-0749 | 40 | nessuna notifica inviata; | NON ESEGUITO | — |
| T-0750 | 40 | pubblicazione post; | NON ESEGUITO | — |
| T-0751 | 40 | reazione; | NON ESEGUITO | — |
| T-0752 | 40 | risposta HTTP 401 o 403; | NON ESEGUITO | — |
| T-0753 | 41 | Accedere tramite invito personale. | NON ESEGUITO | — |
| T-0754 | 41 | Cambiare data e ora del telefono. | NON ESEGUITO | — |
| T-0755 | 41 | Cambiare il ruolo da Coordinatore a Viaggiatore. | NON ESEGUITO | — |
| T-0756 | 41 | Chiudere il browser. | NON ESEGUITO | — |
| T-0757 | 41 | Copiare il token su un altro browser. | NON ESEGUITO | — |
| T-0758 | 41 | Eliminare il profilo associato a una sessione attiva. | NON ESEGUITO | — |
| T-0759 | 41 | Eseguire logout durante un caricamento. | NON ESEGUITO | — |
| T-0760 | 41 | Eseguire logout senza rete. | NON ESEGUITO | — |
| T-0761 | 41 | Lasciare la sessione inattiva fino alla scadenza prevista. | NON ESEGUITO | — |
| T-0762 | 41 | Modificare un solo carattere del token. | NON ESEGUITO | — |
| T-0763 | 41 | Revocare il dispositivo dal Coordinatore. | NON ESEGUITO | — |
| T-0764 | 41 | Riaprire il browser. | NON ESEGUITO | — |
| T-0765 | 41 | Risultato atteso: sessione non valida. | NON ESEGUITO | — |
| T-0766 | 41 | Verificare che il caricamento venga annullato o gestito in modo sicuro. | SUPERATO | QA 1.30.0: upload interrotto annullato e sessione eliminata |
| T-0767 | 41 | Verificare che il dispositivo revocato non possa più aprire documenti. | NON ESEGUITO | — |
| T-0768 | 41 | Verificare che la scadenza sia determinata dal server. | NON ESEGUITO | — |
| T-0769 | 41 | Verificare gestione della revoca al ritorno della rete. | NON ESEGUITO | — |
| T-0770 | 41 | Verificare la regola prevista per il riutilizzo del token. | NON ESEGUITO | — |
| T-0771 | 41 | Verificare perdita immediata dei privilegi da Coordinatore. | NON ESEGUITO | — |
| T-0772 | 41 | Verificare revoca automatica di tutte le sessioni del profilo. | NON ESEGUITO | — |
| T-0773 | 41 | Verificare richiesta di nuovo accesso. | NON ESEGUITO | — |
| T-0774 | 42 | Aprire due volte contemporaneamente lo stesso invito. | NON ESEGUITO | — |
| T-0775 | 42 | Condividere per errore l’invito del Viaggiatore A con il Viaggiatore B. | NON ESEGUITO | — |
| T-0776 | 42 | Creare due inviti successivi per la stessa persona. | NON ESEGUITO | — |
| T-0777 | 42 | Creare un invito per ogni Viaggiatore. | NON ESEGUITO | — |
| T-0778 | 42 | Modificare un carattere dell’invito. | NON ESEGUITO | — |
| T-0779 | 42 | Revocare un invito non ancora utilizzato. | NON ESEGUITO | — |
| T-0780 | 42 | Soltanto una delle due richieste deve riuscire. | NON ESEGUITO | — |
| T-0781 | 42 | Utilizzare un invito già consumato. | NON ESEGUITO | — |
| T-0782 | 42 | Utilizzare un invito scaduto. | NON ESEGUITO | — |
| T-0783 | 42 | Verificare che ciascun invito sia collegato alla persona corretta. | NON ESEGUITO | — |
| T-0784 | 42 | Verificare che il link non esponga informazioni personali. | NON ESEGUITO | — |
| T-0785 | 42 | Verificare che il link venga rimosso dalla barra dopo l’attivazione. | NON ESEGUITO | — |
| T-0786 | 42 | Verificare che il token non rimanga nella cronologia o nei log applicativi. | NON ESEGUITO | — |
| T-0787 | 42 | Verificare impossibilità di utilizzarlo. | NON ESEGUITO | — |
| T-0788 | 42 | Verificare procedura di revoca e rigenerazione. | NON ESEGUITO | — |
| T-0789 | 42 | Verificare quale invito rimane valido. | NON ESEGUITO | — |
| T-0790 | 43 | Aggiornare la stessa posizione da due dispositivi. | NON ESEGUITO | — |
| T-0791 | 43 | Aprire contemporaneamente lo stesso invito personale. | NON ESEGUITO | — |
| T-0792 | 43 | Eliminare un commento mentre viene modificato da un altro dispositivo. | NON ESEGUITO | — |
| T-0793 | 43 | Eliminare un post mentre un altro utente sta inserendo un commento. | NON ESEGUITO | — |
| T-0794 | 43 | Il commento non deve rimanere orfano. | SUPERATO | verify-d1-backup: zero commenti orfani dopo il ripristino |
| T-0795 | 43 | Informare l’utente in caso di conflitto. | NON ESEGUITO | — |
| T-0796 | 43 | Modificare contemporaneamente la stessa reazione. | NON ESEGUITO | — |
| T-0797 | 43 | Modificare contemporaneamente lo stesso profilo da due dispositivi. | NON ESEGUITO | — |
| T-0798 | 43 | Pubblicare contemporaneamente da 10 dispositivi. | NON ESEGUITO | — |
| T-0799 | 43 | Sostituire contemporaneamente lo stesso documento da due telefoni. | NON ESEGUITO | — |
| T-0800 | 43 | Verificare che rimanga un solo documento valido. | NON ESEGUITO | — |
| T-0801 | 43 | Verificare che venga conservato l’aggiornamento più recente. | NON ESEGUITO | — |
| T-0802 | 43 | Verificare che venga creata una sola associazione valida. | NON ESEGUITO | — |
| T-0803 | 43 | Verificare eliminazione dei file non più collegati. | NON ESEGUITO | — |
| T-0804 | 43 | Verificare ordinamento corretto mediante timestamp server. | NON ESEGUITO | — |
| T-0805 | 43 | Verificare presenza di una sola reazione per persona. | NON ESEGUITO | — |
| T-0806 | 43 | Verificare quale modifica viene conservata. | NON ESEGUITO | — |
| T-0807 | 43 | Verificare risposta coerente. | NON ESEGUITO | — |
| T-0808 | 44 | attivare modalità aereo; | NON ESEGUITO | — |
| T-0809 | 44 | bloccare lo schermo; | NON ESEGUITO | — |
| T-0810 | 44 | cambiare applicazione; | NON ESEGUITO | — |
| T-0811 | 44 | chiudere forzatamente la PWA; | NON ESEGUITO | — |
| T-0812 | 44 | chiudere la scheda; | NON ESEGUITO | — |
| T-0813 | 44 | passare ai dati mobili; | NON ESEGUITO | — |
| T-0814 | 44 | riavviare il telefono; | NON ESEGUITO | — |
| T-0815 | 44 | ricevere una telefonata; | NON ESEGUITO | — |
| T-0816 | 44 | spegnere il telefono; | NON ESEGUITO | — |
| T-0817 | 44 | spegnere il Wi-Fi; | NON ESEGUITO | — |
| T-0818 | 44 | verificare che il pulsante non rimanga bloccato su “Invio”; | NON ESEGUITO | — |
| T-0819 | 44 | verificare che non esistano duplicati; | NON ESEGUITO | — |
| T-0820 | 44 | verificare che non esistano file orfani; | NON ESEGUITO | — |
| T-0821 | 44 | verificare lo stato dell’operazione alla riapertura; | SUPERATO | resumable-upload: stato server riletto prima della ripresa |
| T-0822 | 44,62 | verificare possibilità di riprovare. | NON ESEGUITO | — |
| T-0823 | 45 | Aggiungere un messaggio “Aggiornamento disponibile”. | NON ESEGUITO | — |
| T-0824 | 45 | Aprire due schede con versioni differenti. | NON ESEGUITO | — |
| T-0825 | 45 | Aprire e utilizzare l’app. | NON ESEGUITO | — |
| T-0826 | 45 | Consentire all’utente di scegliere quando aggiornare se esiste una bozza. | NON ESEGUITO | — |
| T-0827 | 45 | Creare una bozza testuale. | NON ESEGUITO | — |
| T-0828 | 45 | Installare la versione precedente. | NON ESEGUITO | — |
| T-0829 | 45 | Pubblicare la versione 1.21.5. | NON ESEGUITO | — |
| T-0830 | 45 | Selezionare fotografie e video. | NON ESEGUITO | — |
| T-0831 | 45 | Verificare aggiornamento al successivo ritorno della rete. | NON ESEGUITO | — |
| T-0832 | 45 | Verificare aggiornamento con telefono offline. | NON ESEGUITO | — |
| T-0833 | 45 | Verificare assenza di corruzione dei dati. | NON ESEGUITO | — |
| T-0834 | 45 | Verificare che frontend e API siano compatibili durante il passaggio di versione. | NON ESEGUITO | — |
| T-0835 | 45 | Verificare che l’app non si ricarichi durante la registrazione audio. | NON ESEGUITO | — |
| T-0836 | 45 | Verificare che l’app non si ricarichi durante la scrittura. | NON ESEGUITO | — |
| T-0837 | 45 | Verificare che l’app non si ricarichi durante un upload. | NON ESEGUITO | — |
| T-0838 | 45 | Verificare che non rimangano file JavaScript della versione precedente. | NON ESEGUITO | — |
| T-0839 | 45 | Verificare che testo e allegati non vengano persi. | NON ESEGUITO | — |
| T-0840 | 45 | Verificare eliminazione della vecchia cache. | NON ESEGUITO | — |
| T-0841 | 45 | Verificare rilevamento dell’aggiornamento. | NON ESEGUITO | — |
| T-0842 | 46 | Mostrare spazio richiesto dai contenuti in attesa. | NON ESEGUITO | — |
| T-0843 | 46 | Mostrare spazio utilizzato dall’app. | NON ESEGUITO | — |
| T-0844 | 46 | Mostrare un messaggio comprensibile. | NON ESEGUITO | — |
| T-0845 | 46 | Non cancellare documenti o bozze senza conferma. | NON ESEGUITO | — |
| T-0846 | 46 | Non perdere le bozze già salvate. | NON ESEGUITO | — |
| T-0847 | 46 | Permettere all’utente di eliminare elementi dalla coda. | NON ESEGUITO | — |
| T-0848 | 46 | Riempire progressivamente IndexedDB. | NON ESEGUITO | — |
| T-0849 | 46 | Salvare più bozze offline. | NON ESEGUITO | — |
| T-0850 | 46 | Salvare una bozza con dieci fotografie. | NON ESEGUITO | — |
| T-0851 | 46 | Salvare una bozza con un video. | NON ESEGUITO | — |
| T-0852 | 46 | Salvare una bozza con una fotografia. | NON ESEGUITO | — |
| T-0853 | 46 | Simulare quota esaurita. | NON ESEGUITO | — |
| T-0854 | 46 | Verificare cancellazione automatica soltanto dei dati non essenziali. | NON ESEGUITO | — |
| T-0855 | 46 | Verificare comportamento della pulizia automatica di iOS. | NON ESEGUITO | — |
| T-0856 | 46 | Verificare comportamento dopo molti giorni senza aprire la PWA. | NON ESEGUITO | — |
| T-0857 | 46 | Verificare spazio disponibile sul dispositivo. | NON ESEGUITO | — |
| T-0858 | 47 | Cambiare profilo sullo stesso dispositivo. | NON ESEGUITO | — |
| T-0859 | 47 | Eliminare i dati del browser. | NON ESEGUITO | — |
| T-0860 | 47 | Evitare 20 avvisi separati e inutilizzabili. | NON ESEGUITO | — |
| T-0861 | 47 | Inviare due notifiche con lo stesso tag. | NON ESEGUITO | — |
| T-0862 | 47 | Inviare notifica con caratteri speciali. | NON ESEGUITO | — |
| T-0863 | 47 | Inviare notifica con emoji. | NON ESEGUITO | — |
| T-0864 | 47 | Inviare notifica con testo molto lungo. | NON ESEGUITO | — |
| T-0865 | 47 | Inviare notifica con titolo molto lungo. | NON ESEGUITO | — |
| T-0866 | 47 | Inviare notifica relativa a un contenuto successivamente eliminato. | NON ESEGUITO | — |
| T-0867 | 47 | Pubblicare 20 post in pochi minuti. | NON ESEGUITO | — |
| T-0868 | 47 | Revocare il permesso dalle impostazioni del telefono. | NON ESEGUITO | — |
| T-0869 | 47 | Ricevere una notifica dopo logout. | NON ESEGUITO | — |
| T-0870 | 47 | Ricevere una notifica dopo revoca del dispositivo. | NON ESEGUITO | — |
| T-0871 | 47 | Risultato atteso: nessun contenuto privato visibile. | NON ESEGUITO | — |
| T-0872 | 47 | Toccando la notifica mostrare “Contenuto non più disponibile”. | NON ESEGUITO | — |
| T-0873 | 47 | Verificare aggiornamento coerente. | NON ESEGUITO | — |
| T-0874 | 47 | Verificare aggiornamento dello stato nell’app. | NON ESEGUITO | — |
| T-0875 | 47 | Verificare che la subscription venga associata all’identità corretta. | NON ESEGUITO | — |
| T-0876 | 47 | Verificare che una notifica “Solo io” non venga inviata a nessun altro. | NON ESEGUITO | — |
| T-0877 | 47 | Verificare che una notifica relativa a un post Gruppo non venga inviata ai familiari pubblici. | NON ESEGUITO | — |
| T-0878 | 47 | Verificare eliminazione della subscription. | NON ESEGUITO | — |
| T-0879 | 47 | Verificare nuova registrazione della subscription. | NON ESEGUITO | — |
| T-0880 | 47 | Verificare raggruppamento delle notifiche. | NON ESEGUITO | — |
| T-0881 | 48 | 1.000 caratteri. | NON ESEGUITO | — |
| T-0882 | 48 | 10.000 caratteri. | NON ESEGUITO | — |
| T-0883 | 48 | Apostrofi e virgolette. | NON ESEGUITO | — |
| T-0884 | 48 | Collegamenti Internet. | NON ESEGUITO | — |
| T-0885 | 48 | Hashtag. | NON ESEGUITO | — |
| T-0886 | 48 | HTML. | NON ESEGUITO | — |
| T-0887 | 48 | JavaScript. | NON ESEGUITO | — |
| T-0888 | 48 | Menzioni. | NON ESEGUITO | — |
| T-0889 | 48 | Numeri di telefono. | NON ESEGUITO | — |
| T-0890 | 48 | Simboli matematici. | NON ESEGUITO | — |
| T-0891 | 48 | Solo spazi. | NON ESEGUITO | — |
| T-0892 | 48 | Stringhe SQL. | NON ESEGUITO | — |
| T-0893 | 48 | Testo con alfabeti non latini. | NON ESEGUITO | — |
| T-0894 | 48 | Testo con emoji multiple. | NON ESEGUITO | — |
| T-0895 | 48 | Testo con ritorni a capo. | NON ESEGUITO | — |
| T-0896 | 48 | Testo copiato da WhatsApp. | NON ESEGUITO | — |
| T-0897 | 48 | Testo copiato da Word. | NON ESEGUITO | — |
| T-0898 | 48 | Testo da destra verso sinistra. | NON ESEGUITO | — |
| T-0899 | 48 | Testo in hindi. | NON ESEGUITO | — |
| T-0900 | 48 | Testo in inglese. | NON ESEGUITO | — |
| T-0901 | 48 | Testo in italiano. | NON ESEGUITO | — |
| T-0902 | 48 | Testo vuoto. | NON ESEGUITO | — |
| T-0903 | 48 | Una parola. | NON ESEGUITO | — |
| T-0904 | 48 | Verificare che il contenuto venga mostrato come testo e non eseguito. | NON ESEGUITO | — |
| T-0905 | 48 | Verificare troncamento e pulsante “Leggi tutto”, se necessario. | NON ESEGUITO | — |
| T-0906 | 49 | Abbassare e aumentare il volume. | NON ESEGUITO | — |
| T-0907 | 49 | Aprire il primo allegato di un carosello. | NON ESEGUITO | — |
| T-0908 | 49 | Aprire l’ultimo allegato. | NON ESEGUITO | — |
| T-0909 | 49 | Bloccare lo schermo durante l’audio. | NON ESEGUITO | — |
| T-0910 | 49 | Cambiare post durante la riproduzione. | NON ESEGUITO | — |
| T-0911 | 49 | Collegare cuffie Bluetooth. | NON ESEGUITO | — |
| T-0912 | 49 | Ingrandire una fotografia. | NON ESEGUITO | — |
| T-0913 | 49 | Mettere in pausa il video. | NON ESEGUITO | — |
| T-0914 | 49 | Portare il video avanti e indietro. | NON ESEGUITO | — |
| T-0915 | 49 | Riprodurre il video con rete lenta. | NON ESEGUITO | — |
| T-0916 | 49 | Riprodurre un file audio. | NON ESEGUITO | — |
| T-0917 | 49 | Riprodurre un video con audio. | NON ESEGUITO | — |
| T-0918 | 49 | Ruotare il telefono durante la visualizzazione. | NON ESEGUITO | — |
| T-0919 | 49 | Scollegare le cuffie. | NON ESEGUITO | — |
| T-0920 | 49 | Scorrere rapidamente dieci allegati. | NON ESEGUITO | — |
| T-0921 | 49 | Tornare all’allegato precedente. | NON ESEGUITO | — |
| T-0922 | 49 | Verificare che due video non vengano riprodotti contemporaneamente. | NON ESEGUITO | — |
| T-0923 | 49 | Verificare che la riproduzione non ricominci dopo un aggiornamento del feed. | NON ESEGUITO | — |
| T-0924 | 49 | Verificare messaggio corretto per file non riproducibile. | NON ESEGUITO | — |
| T-0925 | 49 | Verificare richieste Range 206. | SUPERATO | QA 1.29.0: lettura Range attraversa due parti e restituisce HTTP 206 |
| T-0926 | 50 | Mostrare chiaramente se l’orario è italiano o indiano. | NON ESEGUITO | — |
| T-0927 | 50 | Pubblicazione alle 00:00. | NON ESEGUITO | — |
| T-0928 | 50 | Pubblicazione alle 23:59. | NON ESEGUITO | — |
| T-0929 | 50 | Pubblicazione dopo l’arrivo in India. | NON ESEGUITO | — |
| T-0930 | 50 | Pubblicazione durante il volo. | NON ESEGUITO | — |
| T-0931 | 50 | Pubblicazione prima della partenza. | NON ESEGUITO | — |
| T-0932 | 50 | Telefono con fuso automatico. | NON ESEGUITO | — |
| T-0933 | 50 | Telefono con fuso manuale errato. | NON ESEGUITO | — |
| T-0934 | 50 | Telefono impostato sul fuso indiano. | NON ESEGUITO | — |
| T-0935 | 50 | Telefono impostato sul fuso italiano. | NON ESEGUITO | — |
| T-0936 | 50 | Verificare assegnazione alla giornata corretta. | NON ESEGUITO | — |
| T-0937 | 50 | Verificare conto alla rovescia. | NON ESEGUITO | — |
| T-0938 | 50 | Verificare data precedente al viaggio. | NON ESEGUITO | — |
| T-0939 | 50 | Verificare data successiva al viaggio. | NON ESEGUITO | — |
| T-0940 | 50 | Verificare il 10 agosto 2026. | NON ESEGUITO | — |
| T-0941 | 50 | Verificare il 23 agosto 2026. | NON ESEGUITO | — |
| T-0942 | 50 | Verificare ora dei commenti. | NON ESEGUITO | — |
| T-0943 | 50 | Verificare ora delle posizioni. | NON ESEGUITO | — |
| T-0944 | 50 | Verificare ordinamento dei post mediante ora server. | NON ESEGUITO | — |
| T-0945 | 51 | Mappa con coordinate 0,0. | NON ESEGUITO | — |
| T-0946 | 51 | Mappa con dieci persone nello stesso punto. | NON ESEGUITO | — |
| T-0947 | 51 | Mappa con due posizioni identiche. | NON ESEGUITO | — |
| T-0948 | 51 | Mappa con latitudine -90. | NON ESEGUITO | — |
| T-0949 | 51 | Mappa con latitudine 90. | NON ESEGUITO | — |
| T-0950 | 51 | Mappa con longitudine -180. | NON ESEGUITO | — |
| T-0951 | 51 | Mappa con longitudine 180. | NON ESEGUITO | — |
| T-0952 | 51 | Mappa con nessuna posizione condivisa. | NON ESEGUITO | — |
| T-0953 | 51 | Mappa con una persona fuori dall’India. | NON ESEGUITO | — |
| T-0954 | 51 | Mappa con una posizione. | NON ESEGUITO | — |
| T-0955 | 51 | Mostrare coordinate testuali come alternativa. | NON ESEGUITO | — |
| T-0956 | 51 | Permettere di copiare le coordinate. | NON ESEGUITO | — |
| T-0957 | 51 | Rifiutare coordinate come testo non numerico. | NON ESEGUITO | — |
| T-0958 | 51 | Rifiutare Infinity. | NON ESEGUITO | — |
| T-0959 | 51 | Rifiutare NaN. | NON ESEGUITO | — |
| T-0960 | 51 | Rifiutare valori oltre gli intervalli ammessi. | NON ESEGUITO | — |
| T-0961 | 51 | Verificare mappa quando Google Maps non risponde. | NON ESEGUITO | — |
| T-0962 | 51 | Verificare mappa quando OpenFreeMap non risponde. | NON ESEGUITO | — |
| T-0963 | 51 | Verificare marker sovrapposti. | NON ESEGUITO | — |
| T-0964 | 51 | Verificare popup con HTML e script. | NON ESEGUITO | — |
| T-0965 | 51 | Verificare popup con nome molto lungo. | NON ESEGUITO | — |
| T-0966 | 51 | Verificare precisione decimale. | NON ESEGUITO | — |
| T-0967 | 52 | Aprirlo su un secondo telefono. | NON ESEGUITO | — |
| T-0968 | 52 | Copiare il collegamento del commento. | NON ESEGUITO | — |
| T-0969 | 52 | Copiare il collegamento del giorno. | NON ESEGUITO | — |
| T-0970 | 52 | Copiare il collegamento del post. | NON ESEGUITO | — |
| T-0971 | 52 | Copiare il collegamento della mappa. | NON ESEGUITO | — |
| T-0972 | 52 | Premere Avanti del browser. | NON ESEGUITO | — |
| T-0973 | 52 | Premere Indietro del browser. | NON ESEGUITO | — |
| T-0974 | 52 | Tornare da Google Maps. | NON ESEGUITO | — |
| T-0975 | 52 | Tornare da un documento. | NON ESEGUITO | — |
| T-0976 | 52 | Tornare dalla mappa. | NON ESEGUITO | — |
| T-0977 | 52 | Tornare dopo la visualizzazione di una fotografia. | NON ESEGUITO | — |
| T-0978 | 52 | Verificare apertura del commento preciso. | NON ESEGUITO | — |
| T-0979 | 52 | Verificare apertura del giorno preciso. | NON ESEGUITO | — |
| T-0980 | 52 | Verificare apertura del post preciso. | NON ESEGUITO | — |
| T-0981 | 52 | Verificare apertura della mappa precisa. | NON ESEGUITO | — |
| T-0982 | 52 | Verificare fallback “Copia link” quando navigator.share non è disponibile. | NON ESEGUITO | — |
| T-0983 | 52 | Verificare funzionamento dopo ricaricamento della pagina. | NON ESEGUITO | — |
| T-0984 | 52 | Verificare mantenimento del filtro. | NON ESEGUITO | — |
| T-0985 | 52 | Verificare mantenimento del testo non inviato. | NON ESEGUITO | — |
| T-0986 | 52 | Verificare mantenimento della giornata. | NON ESEGUITO | — |
| T-0987 | 52 | Verificare mantenimento dello scorrimento. | NON ESEGUITO | — |
| T-0988 | 53 | Aprire lo stesso documento da due dispositivi. | NON ESEGUITO | — |
| T-0989 | 53 | Caricare due file con lo stesso nome. | NON ESEGUITO | — |
| T-0990 | 53 | Caricare un file con accenti. | NON ESEGUITO | — |
| T-0991 | 53 | Caricare un file con emoji nel nome. | NON ESEGUITO | — |
| T-0992 | 53 | Caricare un file con nome molto lungo. | NON ESEGUITO | — |
| T-0993 | 53 | Caricare un PDF multipagina. | NON ESEGUITO | — |
| T-0994 | 53 | Caricare un PDF protetto da password. | NON ESEGUITO | — |
| T-0995 | 53 | Caricare una fotografia del passaporto verticale. | NON ESEGUITO | — |
| T-0996 | 53 | Caricare una fotografia orizzontale. | NON ESEGUITO | — |
| T-0997 | 53 | Caricare una fotografia sfocata. | NON ESEGUITO | — |
| T-0998 | 53 | Eliminare il documento durante un download. | NON ESEGUITO | — |
| T-0999 | 53 | Interrompere la sostituzione. | NON ESEGUITO | — |
| T-1000 | 53 | Sostituire più volte lo stesso documento. | NON ESEGUITO | — |
| T-1001 | 53 | Verificare che rimanga disponibile la versione precedente. | NON ESEGUITO | — |
| T-1002 | 53 | Verificare log di apertura. | NON ESEGUITO | — |
| T-1003 | 53 | Verificare log di download. | NON ESEGUITO | — |
| T-1004 | 53 | Verificare log di eliminazione. | NON ESEGUITO | — |
| T-1005 | 53 | Verificare log di sostituzione. | NON ESEGUITO | — |
| T-1006 | 53 | Verificare nessun URL permanente condivisibile senza sessione. | NON ESEGUITO | — |
| T-1007 | 53 | Verificare nessuna anteprima nella cache pubblica. | NON ESEGUITO | — |
| T-1008 | 53 | Verificare streaming senza caricare tutto il file in memoria. | NON ESEGUITO | — |
| T-1009 | 54 | Aggiungere chiavi esterne o controlli equivalenti. | NON ESEGUITO | — |
| T-1010 | 54 | Eliminando un post, eliminare media, commenti e reazioni. | NON ESEGUITO | — |
| T-1011 | 54 | Eliminando un profilo, gestire documenti, posizioni, sessioni e inviti. | NON ESEGUITO | — |
| T-1012 | 54 | Non devono esistere file nell’archivio MEDIA senza riferimento. | NON ESEGUITO | — |
| T-1013 | 54 | Non devono esistere riferimenti nel database a file mancanti. | NON ESEGUITO | — |
| T-1014 | 54 | Ogni allegato deve essere collegato a un post esistente. | NON ESEGUITO | — |
| T-1015 | 54 | Ogni commento deve essere collegato a un post esistente. | NON ESEGUITO | — |
| T-1016 | 54 | Ogni documento deve essere collegato a un profilo esistente. | NON ESEGUITO | — |
| T-1017 | 54 | Ogni invito deve essere collegato a un profilo esistente. | NON ESEGUITO | — |
| T-1018 | 54 | Ogni posizione deve essere collegata a un profilo esistente. | NON ESEGUITO | — |
| T-1019 | 54 | Ogni post deve avere un autore valido. | NON ESEGUITO | — |
| T-1020 | 54 | Ogni reazione deve essere collegata a un post esistente. | NON ESEGUITO | — |
| T-1021 | 54 | Ogni sessione deve essere collegata a un profilo esistente. | NON ESEGUITO | — |
| T-1022 | 54 | Verificare comportamento con database temporaneamente non disponibile. | NON ESEGUITO | — |
| T-1023 | 54 | Verificare indici sulle query più utilizzate. | NON ESEGUITO | — |
| T-1024 | 54 | Verificare rollback dopo errore a metà operazione. | NON ESEGUITO | — |
| T-1025 | 54 | Verificare unicità delle operazioni idempotenti. | SUPERATO | production-smoke: unicita operazioni idempotenti verificata |
| T-1026 | 55 | Applicare le migrazioni una alla volta. | NON ESEGUITO | — |
| T-1027 | 55 | Creare un database dalla schema completa. | NON ESEGUITO | — |
| T-1028 | 55 | Creare un database partendo dalla prima versione. | NON ESEGUITO | — |
| T-1029 | 55 | Eseguire backup prima di ogni migrazione di produzione. | SUPERATO | backup D1 creato e verificato prima della migrazione 0013 |
| T-1030 | 55 | Verificare che ogni migrazione venga applicata una sola volta. | NON ESEGUITO | — |
| T-1031 | 55 | Verificare dati precedenti conservati. | NON ESEGUITO | — |
| T-1032 | 55 | Verificare documenti precedenti conservati. | NON ESEGUITO | — |
| T-1033 | 55 | Verificare incremento della versione per eliminazione. | NON ESEGUITO | — |
| T-1034 | 55 | Verificare incremento della versione per inserimento. | NON ESEGUITO | — |
| T-1035 | 55 | Verificare incremento della versione per modifica. | NON ESEGUITO | — |
| T-1036 | 55 | Verificare migrazione già applicata. | NON ESEGUITO | — |
| T-1037 | 55 | Verificare migrazione interrotta. | NON ESEGUITO | — |
| T-1038 | 55 | Verificare ordine corretto delle migrazioni. | NON ESEGUITO | — |
| T-1039 | 55 | Verificare profili precedenti conservati. | NON ESEGUITO | — |
| T-1040 | 55 | Verificare rollback della migrazione. | NON ESEGUITO | — |
| T-1041 | 55 | Verificare sessioni precedenti. | NON ESEGUITO | — |
| T-1042 | 55 | Verificare trigger della sincronizzazione. | NON ESEGUITO | — |
| T-1043 | 56 | 100 commenti in un minuto. | NON ESEGUITO | — |
| T-1044 | 56 | 100 iscrizioni Push dallo stesso dispositivo. | NON ESEGUITO | — |
| T-1045 | 56 | 100 reazioni in un minuto. | NON ESEGUITO | — |
| T-1046 | 56 | 100 ricerche di luoghi in un minuto. | NON ESEGUITO | — |
| T-1047 | 56 | 100 richieste di ricerca inversa in un minuto. | NON ESEGUITO | — |
| T-1048 | 56 | 100 richieste di sincronizzazione in un minuto. | NON ESEGUITO | — |
| T-1049 | 56 | 100 tentativi di accesso con codice errato. | NON ESEGUITO | — |
| T-1050 | 56 | 100 tentativi di utilizzo di un invito errato. | NON ESEGUITO | — |
| T-1051 | 56 | 100 upload dallo stesso utente. | NON ESEGUITO | — |
| T-1052 | 56 | Avvisare il Coordinatore in caso di abuso ripetuto. | NON ESEGUITO | — |
| T-1053 | 56 | Distinguere limiti per IP, sessione e profilo. | NON ESEGUITO | — |
| T-1054 | 56 | Mostrare tempo prima di poter riprovare. | NON ESEGUITO | — |
| T-1055 | 56 | Non bloccare permanentemente un utente legittimo. | NON ESEGUITO | — |
| T-1056 | 56 | Proteggere Cloudflare D1 e MEDIA da consumi anomali. | NON ESEGUITO | — |
| T-1057 | 56 | Registrare eventi sospetti. | NON ESEGUITO | — |
| T-1058 | 56 | Verificare risposta 429. | NON ESEGUITO | — |
| T-1059 | 57 | Chiusura modale mediante tastiera. | NON ESEGUITO | — |
| T-1060 | 57 | Contrasto sufficiente sotto luce solare. | NON ESEGUITO | — |
| T-1061 | 57 | Controllo con caratteri ingranditi al 200%. | NON ESEGUITO | — |
| T-1062 | 57 | Controllo con caratteri ingranditi al 300%. | NON ESEGUITO | — |
| T-1063 | 57 | Descrizione dei marker della mappa. | NON ESEGUITO | — |
| T-1064 | 57 | Descrizione delle fotografie. | NON ESEGUITO | — |
| T-1065 | 57 | Descrizione dello stato dei documenti. | NON ESEGUITO | — |
| T-1066 | 57 | Focus intrappolato correttamente nelle finestre modali. | NON ESEGUITO | — |
| T-1067 | 57 | Lettura corretta dei pulsanti. | NON ESEGUITO | — |
| T-1068 | 57 | Lettura corretta dei titoli. | NON ESEGUITO | — |
| T-1069 | 57 | Nessun pulsante tagliato. | NON ESEGUITO | — |
| T-1070 | 57 | Nessun testo sovrapposto. | NON ESEGUITO | — |
| T-1071 | 57 | Nessuna informazione comunicata soltanto tramite colore. | NON ESEGUITO | — |
| T-1072 | 57 | Ordine logico del focus. | NON ESEGUITO | — |
| T-1073 | 57 | Stato caricamento comunicato allo screen reader. | NON ESEGUITO | — |
| T-1074 | 57 | Stato errore comunicato allo screen reader. | NON ESEGUITO | — |
| T-1075 | 57 | Supporto prefers-reduced-motion. | NON ESEGUITO | — |
| T-1076 | 57 | TalkBack su Android. | NON ESEGUITO | — |
| T-1077 | 57 | VoiceOver su iPhone. | NON ESEGUITO | — |
| T-1078 | 58 | Android con Chrome aggiornato. | NON ESEGUITO | — |
| T-1079 | 58 | Android con WebView precedente. | NON ESEGUITO | — |
| T-1080 | 58 | Android di fascia alta. | NON ESEGUITO | — |
| T-1081 | 58 | Android economico con poca memoria. | NON ESEGUITO | — |
| T-1082 | 58 | Browser con cookie/storage bloccati. | NON ESEGUITO | — |
| T-1083 | 58 | Chrome. | NON ESEGUITO | — |
| T-1084 | 58 | Computer macOS. | NON ESEGUITO | — |
| T-1085 | 58 | Computer Windows. | NON ESEGUITO | — |
| T-1086 | 58 | Dispositivo con batteria inferiore al 10%. | NON ESEGUITO | — |
| T-1087 | 58 | Dispositivo con memoria quasi esaurita. | NON ESEGUITO | — |
| T-1088 | 58 | Edge. | NON ESEGUITO | — |
| T-1089 | 58 | Firefox. | NON ESEGUITO | — |
| T-1090 | 58 | iPhone con schermo piccolo. | NON ESEGUITO | — |
| T-1091 | 58 | iPhone con versione iOS minima supportata. | NON ESEGUITO | — |
| T-1092 | 58 | iPhone con versione iOS più recente. | NON ESEGUITO | — |
| T-1093 | 58 | iPhone Pro Max. | NON ESEGUITO | — |
| T-1094 | 58 | Modalità privata del browser. | NON ESEGUITO | — |
| T-1095 | 58 | Safari. | NON ESEGUITO | — |
| T-1096 | 58 | Tablet Android. | NON ESEGUITO | — |
| T-1097 | 58 | Tablet iPad. | NON ESEGUITO | — |
| T-1098 | 59 | 10.000 commenti. | NON ESEGUITO | — |
| T-1099 | 59 | 2.500 commenti. | NON ESEGUITO | — |
| T-1100 | 59 | 20.000 reazioni. | NON ESEGUITO | — |
| T-1101 | 59 | 25 utenti attivi. | NON ESEGUITO | — |
| T-1102 | 59 | 5 utenti attivi. | NON ESEGUITO | — |
| T-1103 | 59 | 5.000 reazioni. | NON ESEGUITO | — |
| T-1104 | 59 | 50 utenti attivi. | NON ESEGUITO | — |
| T-1105 | 59 | 500 commenti. | NON ESEGUITO | — |
| T-1106 | 59 | 500 post. | NON ESEGUITO | — |
| T-1107 | 59 | 500 reazioni. | NON ESEGUITO | — |
| T-1108 | 59 | assenza di duplicazioni; | NON ESEGUITO | — |
| T-1109 | 59 | assenza di perdita dati. | NON ESEGUITO | — |
| T-1110 | 59 | batteria telefono; | NON ESEGUITO | — |
| T-1111 | 59 | consumo CPU; | NON ESEGUITO | — |
| T-1112 | 59 | consumo D1; | NON ESEGUITO | — |
| T-1113 | 59 | consumo MEDIA; | NON ESEGUITO | — |
| T-1114 | 59 | dati trasferiti; | NON ESEGUITO | — |
| T-1115 | 59 | errori HTTP; | NON ESEGUITO | — |
| T-1116 | 59 | memoria; | NON ESEGUITO | — |
| T-1117 | 59 | percentile 95; | NON ESEGUITO | — |
| T-1118 | 59 | stabilità del feed; | NON ESEGUITO | — |
| T-1119 | 59 | stabilità delle notifiche; | NON ESEGUITO | — |
| T-1120 | 59 | tempo massimo API; | NON ESEGUITO | — |
| T-1121 | 59 | tempo medio API; | NON ESEGUITO | — |
| T-1122 | 60 | Aggiornamenti posizione durante la prova. | NON ESEGUITO | — |
| T-1123 | 60 | App aperta per 24 ore. | NON ESEGUITO | — |
| T-1124 | 60 | App aperta per 8 ore. | NON ESEGUITO | — |
| T-1125 | 60 | App utilizzata per 48 ore. | NON ESEGUITO | — |
| T-1126 | 60 | Commenti periodici durante la prova. | NON ESEGUITO | — |
| T-1127 | 60 | Notifiche durante la prova. | NON ESEGUITO | — |
| T-1128 | 60 | Pubblicazione periodica durante la prova. | NON ESEGUITO | — |
| T-1129 | 60 | Tre telefoni connessi contemporaneamente per 48 ore. | NON ESEGUITO | — |
| T-1130 | 60 | Verificare aumento progressivo del consumo dati. | NON ESEGUITO | — |
| T-1131 | 60 | Verificare aumento progressivo del numero di richieste. | NON ESEGUITO | — |
| T-1132 | 60 | Verificare aumento progressivo della RAM. | NON ESEGUITO | — |
| T-1133 | 60 | Verificare blocchi dell’interfaccia. | NON ESEGUITO | — |
| T-1134 | 60 | Verificare errori Cloudflare. | NON ESEGUITO | — |
| T-1135 | 60 | Verificare errori JavaScript. | NON ESEGUITO | — |
| T-1136 | 60 | Verificare stabilità con computer del programmatore spento. | NON ESEGUITO | — |
| T-1137 | 61 | mantenere funzionanti le sezioni non coinvolte; | NON ESEGUITO | — |
| T-1138 | 61 | mostrare lo stato del servizio; | NON ESEGUITO | — |
| T-1139 | 61 | mostrare un errore comprensibile; | NON ESEGUITO | — |
| T-1140 | 61 | non duplicare operazioni; | NON ESEGUITO | — |
| T-1141 | 61 | non esporre dettagli tecnici sensibili all’utente. | NON ESEGUITO | — |
| T-1142 | 61 | non mostrare schermata bianca; | NON ESEGUITO | — |
| T-1143 | 61 | non perdere bozze; | NON ESEGUITO | — |
| T-1144 | 61 | registrare l’errore nei log; | NON ESEGUITO | — |
| T-1145 | 61 | riprendere automaticamente quando il servizio ritorna; | NON ESEGUITO | — |
| T-1146 | 61 | riprovare con intervalli progressivi; | NON ESEGUITO | — |
| T-1147 | 62 | Aggiungere procedura periodica di controllo integrità. | NON ESEGUITO | — |
| T-1148 | 62 | Errore durante creazione del post con 10 allegati. | NON ESEGUITO | — |
| T-1149 | 62 | Errore durante eliminazione multipla. | NON ESEGUITO | — |
| T-1150 | 62 | Errore durante sostituzione documento. | NON ESEGUITO | — |
| T-1151 | 62 | Interruzione del database dopo salvataggio del file. | NON ESEGUITO | — |
| T-1152 | 62 | Interruzione del database durante un upload. | NON ESEGUITO | — |
| T-1153 | 62 | Interruzione dell’archivio MEDIA dopo salvataggio del database. | NON ESEGUITO | — |
| T-1154 | 62 | Verificare assenza di record parziali. | NON ESEGUITO | — |
| T-1155 | 62 | Verificare riconciliazione automatica. | NON ESEGUITO | — |
| T-1156 | 62 | Verificare rollback completo. | NON ESEGUITO | — |
| T-1157 | 63 | Calcolare hash dei file. | NON ESEGUITO | — |
| T-1158 | 63 | Confrontare numero di allegati. | NON ESEGUITO | — |
| T-1159 | 63 | Confrontare numero di commenti. | NON ESEGUITO | — |
| T-1160 | 63 | Confrontare numero di documenti. | NON ESEGUITO | — |
| T-1161 | 63 | Confrontare numero di post. | NON ESEGUITO | — |
| T-1162 | 63 | Confrontare numero di profili. | NON ESEGUITO | — |
| T-1163 | 63 | Confrontare numero di reazioni. | NON ESEGUITO | — |
| T-1164 | 63 | Definire perdita massima accettabile dei dati. | NON ESEGUITO | — |
| T-1165 | 63 | Documentare tempo necessario al ripristino. | SUPERATO | verify-d1-backup: tempo di ripristino misurato automaticamente |
| T-1166 | 63 | Eseguire backup mentre vengono aggiunti commenti. | NON ESEGUITO | — |
| T-1167 | 63 | Eseguire backup mentre vengono caricati documenti. | NON ESEGUITO | — |
| T-1168 | 63 | Eseguire backup mentre vengono creati post. | NON ESEGUITO | — |
| T-1169 | 63 | Ripristinare il backup in un ambiente vuoto. | SUPERATO | verify-d1-backup: export importato in database temporaneo vuoto |
| T-1170 | 63 | Verificare apertura di ogni documento ripristinato. | NON ESEGUITO | — |
| T-1171 | 63 | Verificare consistenza temporale del backup. | NON ESEGUITO | — |
| T-1172 | 64 | Documentare procedura e tempo di rollback. | NON ESEGUITO | — |
| T-1173 | 64 | Pubblicare una versione di collaudo successiva. | NON ESEGUITO | — |
| T-1174 | 64 | Simulare errore bloccante. | NON ESEGUITO | — |
| T-1175 | 64 | Tornare alla versione 1.21.5. | NON ESEGUITO | — |
| T-1176 | 64 | Verificare che i telefoni ricevano la versione ripristinata. | NON ESEGUITO | — |
| T-1177 | 64 | Verificare che le sessioni rimangano valide o siano revocate in modo controllato. | NON ESEGUITO | — |
| T-1178 | 64 | Verificare compatibilità del database. | NON ESEGUITO | — |
| T-1179 | 64 | Verificare compatibilità delle migrazioni. | NON ESEGUITO | — |
| T-1180 | 64 | Verificare conservazione dei dati. | NON ESEGUITO | — |
| T-1181 | 64 | Verificare eliminazione della cache difettosa. | NON ESEGUITO | — |
| T-1182 | 64 | Verificare Service Worker. | SUPERATO | production-smoke: Service Worker live contiene la revisione corrente |
| T-1183 | 65 | Aprire Emergenza senza rete. | NON ESEGUITO | — |
| T-1184 | 65 | Chiamare il numero di emergenza. | NON ESEGUITO | — |
| T-1185 | 65 | Copiare indirizzo. | NON ESEGUITO | — |
| T-1186 | 65 | Inviare “Ho bisogno di aiuto”. | NON ESEGUITO | — |
| T-1187 | 65 | Inviare “Sono al sicuro”. | NON ESEGUITO | — |
| T-1188 | 65 | Inviare “Sono arrivato”. | NON ESEGUITO | — |
| T-1189 | 65 | Mostrare indirizzo al tassista in hindi. | NON ESEGUITO | — |
| T-1190 | 65 | Mostrare indirizzo al tassista in inglese. | NON ESEGUITO | — |
| T-1191 | 65 | Verificare che i dati sensibili non siano visibili senza autorizzazione. | NON ESEGUITO | — |
| T-1192 | 65 | Verificare funzionamento con rete assente. | NON ESEGUITO | — |
| T-1193 | 65 | Verificare notifica prioritaria al Coordinatore. | NON ESEGUITO | — |
| T-1194 | 65 | Verificare posizione allegata soltanto con consenso. | NON ESEGUITO | — |
| T-1195 | 65 | Visualizzare ambasciata italiana. | NON ESEGUITO | — |
| T-1196 | 65 | Visualizzare contatto del Coordinatore. | NON ESEGUITO | — |
| T-1197 | 65 | Visualizzare hotel della giornata. | NON ESEGUITO | — |
| T-1198 | 65 | Visualizzare numero dell’assicurazione. | NON ESEGUITO | — |
| T-1199 | 66 | Accesso personale. | NON ESEGUITO | — |
| T-1200 | 66 | Apertura della giornata corrente. | NON ESEGUITO | — |
| T-1201 | 66 | Apertura documento autorizzato. | NON ESEGUITO | — |
| T-1202 | 66 | Apertura invito. | NON ESEGUITO | — |
| T-1203 | 66 | Apertura mappa. | NON ESEGUITO | — |
| T-1204 | 66 | Apertura pubblica. | NON ESEGUITO | — |
| T-1205 | 66 | Attivazione notifiche. | NON ESEGUITO | — |
| T-1206 | 66 | Attivazione sessione. | NON ESEGUITO | — |
| T-1207 | 66 | Caricamento documenti. | NON ESEGUITO | — |
| T-1208 | 66 | Chiusura app. | NON ESEGUITO | — |
| T-1209 | 66 | Chiusura e riapertura. | NON ESEGUITO | — |
| T-1210 | 66 | Consultazione emergenze. | NON ESEGUITO | — |
| T-1211 | 66 | Consultazione itinerario. | NON ESEGUITO | — |
| T-1212 | 66 | Controllo documenti del gruppo. | NON ESEGUITO | — |
| T-1213 | 66 | Controllo itinerario. | NON ESEGUITO | — |
| T-1214 | 66 | Controllo log. | NON ESEGUITO | — |
| T-1215 | 66 | Controllo posizioni. | NON ESEGUITO | — |
| T-1216 | 66 | Controllo profilo. | NON ESEGUITO | — |
| T-1217 | 66 | Controllo programma. | NON ESEGUITO | — |
| T-1218 | 66 | Creazione invito. | NON ESEGUITO | — |
| T-1219 | 66 | Impossibilità di vedere documenti e posizioni private. | NON ESEGUITO | — |
| T-1220 | 66 | Inserimento commento. | NON ESEGUITO | — |
| T-1221 | 66 | Inserimento reazione. | NON ESEGUITO | — |
| T-1222 | 66 | Installazione PWA. | NON ESEGUITO | — |
| T-1223 | 66 | Invio automatico una sola volta. | NON ESEGUITO | — |
| T-1224 | 66 | Modalità aereo. | NON ESEGUITO | — |
| T-1225 | 66 | Moderazione contenuto. | NON ESEGUITO | — |
| T-1226 | 66 | Navigazione verso una tappa. | NON ESEGUITO | — |
| T-1227 | 66 | Nessuna perdita del punto di navigazione. | NON ESEGUITO | — |
| T-1228 | 66 | Preparazione post con allegati. | NON ESEGUITO | — |
| T-1229 | 66 | Pubblicazione fotografia con posizione. | NON ESEGUITO | — |
| T-1230 | 66 | Revoca dispositivo. | NON ESEGUITO | — |
| T-1231 | 66 | Riapertura offline. | NON ESEGUITO | — |
| T-1232 | 66 | Ricezione commento. | NON ESEGUITO | — |
| T-1233 | 66 | Ricezione invito. | NON ESEGUITO | — |
| T-1234 | 66 | Ricezione notifica consentita. | NON ESEGUITO | — |
| T-1235 | 66 | Risposta al commento. | NON ESEGUITO | — |
| T-1236 | 66 | Ritorno al programma della giornata. | NON ESEGUITO | — |
| T-1237 | 66 | Ritorno della rete. | NON ESEGUITO | — |
| T-1238 | 66 | Tutti i dati devono rimanere corretti. | NON ESEGUITO | — |
| T-1239 | 66 | Visualizzazione contenuti autorizzati. | NON ESEGUITO | — |
| T-1240 | 67 | approvazione dell’utilizzatore finale. | NON ESEGUITO | — |
| T-1241 | 67 | browser; | NON ESEGUITO | — |
| T-1242 | 67 | consumo batteria; | NON ESEGUITO | — |
| T-1243 | 67 | consumo dati; | NON ESEGUITO | — |
| T-1244 | 67 | correzione applicata; | NON ESEGUITO | — |
| T-1245 | 67 | data e ora; | NON ESEGUITO | — |
| T-1246 | 67 | dati database prima e dopo; | NON ESEGUITO | — |
| T-1247 | 67 | difetti rilevati; | NON ESEGUITO | — |
| T-1248 | 67 | dispositivo utilizzato; | NON ESEGUITO | — |
| T-1249 | 67 | elenco delle prove eseguite; | NON ESEGUITO | — |
| T-1250 | 67 | eventuali duplicazioni; | NON ESEGUITO | — |
| T-1251 | 67 | eventuali file orfani; | NON ESEGUITO | — |
| T-1252 | 67 | firma del programmatore; | NON ESEGUITO | — |
| T-1253 | 67 | gravità del difetto; | NON ESEGUITO | — |
| T-1254 | 67 | log browser; | NON ESEGUITO | — |
| T-1255 | 67 | log Cloudflare; | NON ESEGUITO | — |
| T-1256 | 67 | rete utilizzata; | NON ESEGUITO | — |
| T-1257 | 67 | risultato atteso; | NON ESEGUITO | — |
| T-1258 | 67 | risultato ottenuto; | NON ESEGUITO | — |
| T-1259 | 67 | screenshot; | NON ESEGUITO | — |
| T-1260 | 67 | tempi di risposta; | NON ESEGUITO | — |
| T-1261 | 67 | versione del sistema operativo; | NON ESEGUITO | — |
| T-1262 | 67 | video; | NON ESEGUITO | — |
| T-1263 | 68 | Confrontare gli orari con i biglietti ferroviari reali. | NON ESEGUITO | — |
| T-1264 | 68 | Confrontare le date con i biglietti aerei reali. | NON ESEGUITO | — |
| T-1265 | 68 | Confrontare ogni giornata con il programma definitivo dell’agenzia. | NON ESEGUITO | — |
| T-1266 | 68 | Verificare aeroporti di partenza e arrivo. | NON ESEGUITO | — |
| T-1267 | 68 | Verificare attività opzionali. | NON ESEGUITO | — |
| T-1268 | 68 | Verificare che le attività siano associate alla giornata corretta. | NON ESEGUITO | — |
| T-1269 | 68 | Verificare che non vi siano differenze tra itinerario, mappe e documenti. | NON ESEGUITO | — |
| T-1270 | 68 | Verificare contatti degli autisti. | NON ESEGUITO | — |
| T-1271 | 68 | Verificare distanze indicate. | NON ESEGUITO | — |
| T-1272 | 68 | Verificare durate indicate. | NON ESEGUITO | — |
| T-1273 | 68 | Verificare giorni di chiusura dei monumenti. | NON ESEGUITO | — |
| T-1274 | 68 | Verificare indirizzo completo di ogni hotel. | NON ESEGUITO | — |
| T-1275 | 68 | Verificare nome esatto di ogni hotel. | NON ESEGUITO | — |
| T-1276 | 68 | Verificare nomi delle guide. | NON ESEGUITO | — |
| T-1277 | 68 | Verificare numeri dei treni. | NON ESEGUITO | — |
| T-1278 | 68 | Verificare numeri dei voli. | NON ESEGUITO | — |
| T-1279 | 68 | Verificare orari di check-in. | NON ESEGUITO | — |
| T-1280 | 68 | Verificare orari di check-out. | NON ESEGUITO | — |
| T-1281 | 68 | Verificare posizione geografica di ogni hotel. | NON ESEGUITO | — |
| T-1282 | 68 | Verificare punti d’incontro. | NON ESEGUITO | — |
| T-1283 | 68 | Verificare stazioni ferroviarie di partenza e arrivo. | NON ESEGUITO | — |
| T-1284 | 68 | Verificare telefono di ogni hotel. | NON ESEGUITO | — |
| T-1285 | 69 | accenti; | NON ESEGUITO | — |
| T-1286 | 69 | apostrofi; | NON ESEGUITO | — |
| T-1287 | 69 | array e oggetti inviati al posto di testo. | NON ESEGUITO | — |
| T-1288 | 69 | caratteri HTML; | NON ESEGUITO | — |
| T-1289 | 69 | caratteri invisibili; | NON ESEGUITO | — |
| T-1290 | 69 | caratteri JavaScript; | NON ESEGUITO | — |
| T-1291 | 69 | emoji; | NON ESEGUITO | — |
| T-1292 | 69 | il database non riceva valori non validi; | NON ESEGUITO | — |
| T-1293 | 69 | il frontend impedisca errori evidenti; | NON ESEGUITO | — |
| T-1294 | 69 | il messaggio indichi esattamente il campo errato; | NON ESEGUITO | — |
| T-1295 | 69 | il server ripeta autonomamente la validazione; | NON ESEGUITO | — |
| T-1296 | 69 | lettere e numeri; | NON ESEGUITO | — |
| T-1297 | 69 | lettere; | NON ESEGUITO | — |
| T-1298 | 69 | nessun errore tecnico venga mostrato all’utilizzatore. | NON ESEGUITO | — |
| T-1299 | 69 | numeri; | NON ESEGUITO | — |
| T-1300 | 69 | ritorni a capo; | NON ESEGUITO | — |
| T-1301 | 69 | solo spazi; | NON ESEGUITO | — |
| T-1302 | 69 | spazi finali; | NON ESEGUITO | — |
| T-1303 | 69 | spazi iniziali; | NON ESEGUITO | — |
| T-1304 | 69 | spazi ripetuti; | NON ESEGUITO | — |
| T-1305 | 69 | stringhe SQL; | NON ESEGUITO | — |
| T-1306 | 69 | testo copiato da WhatsApp; | NON ESEGUITO | — |
| T-1307 | 69 | testo copiato da Word; | NON ESEGUITO | — |
| T-1308 | 69 | testo estremamente lungo; | NON ESEGUITO | — |
| T-1309 | 69 | testo in hindi; | NON ESEGUITO | — |
| T-1310 | 69 | valore massimo; | NON ESEGUITO | — |
| T-1311 | 69 | valore minimo; | NON ESEGUITO | — |
| T-1312 | 69 | valore oltre il massimo; | NON ESEGUITO | — |
| T-1313 | 69 | valore vuoto; | NON ESEGUITO | — |
| T-1314 | 69 | valori null; | NON ESEGUITO | — |
| T-1315 | 69 | valori undefined; | NON ESEGUITO | — |
| T-1316 | 69 | virgolette; | NON ESEGUITO | — |
| T-1317 | 70 | Definire cosa accade ai commenti. | NON ESEGUITO | — |
| T-1318 | 70 | Definire cosa accade ai post. | NON ESEGUITO | — |
| T-1319 | 70 | Definire cosa accade alle reazioni. | NON ESEGUITO | — |
| T-1320 | 70 | Definire se i contenuti vengono eliminati o anonimizzati. | NON ESEGUITO | — |
| T-1321 | 70 | Mostrare chiaramente quali dati verranno eliminati. | NON ESEGUITO | — |
| T-1322 | 70 | Registrare l’operazione nell’audit log. | NON ESEGUITO | — |
| T-1323 | 70 | Richiedere conferma esplicita. | NON ESEGUITO | — |
| T-1324 | 70 | Richiedere eliminazione del proprio profilo. | NON ESEGUITO | — |
| T-1325 | 70 | Verificare backup e politica di conservazione. | NON ESEGUITO | — |
| T-1326 | 70 | Verificare che i vecchi link ai documenti non funzionino. | NON ESEGUITO | — |
| T-1327 | 70 | Verificare che il profilo non compaia nel feed. | NON ESEGUITO | — |
| T-1328 | 70 | Verificare che il profilo non compaia nella dashboard del Coordinatore. | NON ESEGUITO | — |
| T-1329 | 70 | Verificare che il vecchio token non funzioni. | NON ESEGUITO | — |
| T-1330 | 70 | Verificare che non rimangano file orfani. | NON ESEGUITO | — |
| T-1331 | 70 | Verificare eliminazione degli inviti. | NON ESEGUITO | — |
| T-1332 | 70 | Verificare eliminazione dei documenti. | NON ESEGUITO | — |
| T-1333 | 70 | Verificare eliminazione dell’avatar. | NON ESEGUITO | — |
| T-1334 | 70 | Verificare eliminazione della posizione. | NON ESEGUITO | — |
| T-1335 | 70 | Verificare eliminazione delle sessioni. | NON ESEGUITO | — |
| T-1336 | 71 | Avvisare gli utenti prima dell’eliminazione. | NON ESEGUITO | — |
| T-1337 | 71 | Consentire download dei propri dati. | NON ESEGUITO | — |
| T-1338 | 71 | Consentire proroga autorizzata della conservazione. | NON ESEGUITO | — |
| T-1339 | 71 | Definire cosa accade al termine del viaggio. | NON ESEGUITO | — |
| T-1340 | 71 | Definire per quanto tempo vengono conservate le posizioni. | NON ESEGUITO | — |
| T-1341 | 71 | Definire per quanto tempo vengono conservate le subscription Push. | NON ESEGUITO | — |
| T-1342 | 71 | Definire per quanto tempo vengono conservati i commenti. | NON ESEGUITO | — |
| T-1343 | 71 | Definire per quanto tempo vengono conservati i documenti. | NON ESEGUITO | — |
| T-1344 | 71 | Definire per quanto tempo vengono conservati i log. | NON ESEGUITO | — |
| T-1345 | 71 | Definire per quanto tempo vengono conservati i post. | NON ESEGUITO | — |
| T-1346 | 71 | Eliminare automaticamente le posizioni non più necessarie. | NON ESEGUITO | — |
| T-1347 | 71 | Eliminare inviti scaduti. | NON ESEGUITO | — |
| T-1348 | 71 | Eliminare sessioni scadute. | NON ESEGUITO | — |
| T-1349 | 71 | Eliminare subscription inattive. | NON ESEGUITO | — |
| T-1350 | 71 | Produrre un resoconto dei dati eliminati. | NON ESEGUITO | — |
| T-1351 | 71 | Verificare che la pulizia automatica non elimini dati ancora validi. | NON ESEGUITO | — |
| T-1352 | 72 | Non mostrare contenuti “Solo io”. | NON ESEGUITO | — |
| T-1353 | 72 | Non mostrare dati dei documenti nella notifica. | NON ESEGUITO | — |
| T-1354 | 72 | Non mostrare numeri di passaporto. | NON ESEGUITO | — |
| T-1355 | 72 | Non mostrare posizione precisa sul blocco schermo. | NON ESEGUITO | — |
| T-1356 | 72 | Non mostrare testo di post riservati a utenti non autorizzati. | NON ESEGUITO | — |
| T-1357 | 72 | Utilizzare una notifica generica quando il contenuto è sensibile. | NON ESEGUITO | — |
| T-1358 | 72 | Verificare anteprima completa attiva. | NON ESEGUITO | — |
| T-1359 | 72 | Verificare anteprima nascosta dalle impostazioni del telefono. | NON ESEGUITO | — |
| T-1360 | 72 | Verificare che il contenuto venga ricontrollato dal server quando la notifica viene aperta. | NON ESEGUITO | — |
| T-1361 | 72 | Verificare comportamento dopo cambio profilo. | NON ESEGUITO | — |
| T-1362 | 72,89 | Verificare comportamento dopo logout. | NON ESEGUITO | — |
| T-1363 | 72 | Verificare comportamento dopo revoca del dispositivo. | NON ESEGUITO | — |
| T-1364 | 72 | Verificare una notifica con telefono bloccato. | NON ESEGUITO | — |
| T-1365 | 72 | Verificare una notifica con telefono sbloccato. | NON ESEGUITO | — |
| T-1366 | 73 | accesso completo; | NON ESEGUITO | — |
| T-1367 | 73 | accesso limitato ad alcune fotografie; | NON ESEGUITO | — |
| T-1368 | 73 | accesso negato; | NON ESEGUITO | — |
| T-1369 | 73 | aggiunta successiva di fotografie autorizzate. | NON ESEGUITO | — |
| T-1370 | 73 | autorizzata durante l’uso; | NON ESEGUITO | — |
| T-1371 | 73 | autorizzata sempre; | NON ESEGUITO | — |
| T-1372 | 73 | autorizzata una sola volta; | NON ESEGUITO | — |
| T-1373 | 73 | autorizzate; | NON ESEGUITO | — |
| T-1374 | 73 | disattivate dal sistema; | NON ESEGUITO | — |
| T-1375 | 73 | disattivate soltanto nell’app. | NON ESEGUITO | — |
| T-1376 | 73 | indicazioni per riattivarlo; | NON ESEGUITO | — |
| T-1377 | 73 | messaggio comprensibile; | NON ESEGUITO | — |
| T-1378 | 73 | negate; | NON ESEGUITO | — |
| T-1379 | 73 | nessun blocco dell’intera applicazione; | NON ESEGUITO | — |
| T-1380 | 73 | nessun ciclo continuo di richiesta del permesso. | NON ESEGUITO | — |
| T-1381 | 73 | permesso autorizzato; | NON ESEGUITO | — |
| T-1382 | 73 | permesso negato; | NON ESEGUITO | — |
| T-1383 | 73 | permesso revocato dalle impostazioni. | NON ESEGUITO | — |
| T-1384 | 73 | permesso revocato durante l’uso. | NON ESEGUITO | — |
| T-1385 | 73 | permesso revocato durante la registrazione. | NON ESEGUITO | — |
| T-1386 | 73 | posizione precisa attiva; | NON ESEGUITO | — |
| T-1387 | 73 | posizione precisa disattiva; | NON ESEGUITO | — |
| T-1388 | 73 | silenziose; | NON ESEGUITO | — |
| T-1389 | 74 | Applicare un filtro al feed. | NON ESEGUITO | — |
| T-1390 | 74 | Aprire la mappa. | NON ESEGUITO | — |
| T-1391 | 74 | Aprire la tastiera. | NON ESEGUITO | — |
| T-1392 | 74 | Aprire un post specifico. | NON ESEGUITO | — |
| T-1393 | 74 | Aprire un profilo. | NON ESEGUITO | — |
| T-1394 | 74 | Aprire una fotografia del carosello. | NON ESEGUITO | — |
| T-1395 | 74 | Aprire una giornata specifica. | NON ESEGUITO | — |
| T-1396 | 74 | Bloccare e sbloccare lo schermo. | NON ESEGUITO | — |
| T-1397 | 74 | Cambiare sezione. | NON ESEGUITO | — |
| T-1398 | 74 | Espandere tutti i commenti. | NON ESEGUITO | — |
| T-1399 | 74 | Iniziare a scrivere un commento. | NON ESEGUITO | — |
| T-1400 | 74 | Ricevere una sincronizzazione. | NON ESEGUITO | — |
| T-1401 | 74 | Ruotare il telefono. | NON ESEGUITO | — |
| T-1402 | 74 | Scorrere a metà giornata. | NON ESEGUITO | — |
| T-1403 | 74 | Tornare al post. | NON ESEGUITO | — |
| T-1404 | 74 | Verificare che tastiera e campo rimangano aperti. | NON ESEGUITO | — |
| T-1405 | 74 | Verificare filtro ancora attivo. | NON ESEGUITO | — |
| T-1406 | 74 | Verificare mantenimento dello stato. | NON ESEGUITO | — |
| T-1407 | 74 | Verificare stessa giornata e stesso punto. | NON ESEGUITO | — |
| T-1408 | 74 | Verificare stesso post, stessi commenti e stessa fotografia. | NON ESEGUITO | — |
| T-1409 | 74 | Verificare testo non perso. | NON ESEGUITO | — |
| T-1410 | 75 | Bacheca → post → commenti → indietro. | NON ESEGUITO | — |
| T-1411 | 75 | Bacheca → profilo → documenti → indietro. | NON ESEGUITO | — |
| T-1412 | 75 | Documento → visualizzatore → indietro. | NON ESEGUITO | — |
| T-1413 | 75 | Fotografia → carosello → indietro. | NON ESEGUITO | — |
| T-1414 | 75 | Itinerario → giorno → mappa → indietro. | NON ESEGUITO | — |
| T-1415 | 75 | Link esterno → giornata → indietro. | NON ESEGUITO | — |
| T-1416 | 75 | Mappa → Google Maps → ritorno all’app. | NON ESEGUITO | — |
| T-1417 | 75 | Notifica → post → indietro. | NON ESEGUITO | — |
| T-1418 | 75 | Premere Avanti dopo essere tornati indietro. | NON ESEGUITO | — |
| T-1419 | 75 | Premere Indietro rapidamente più volte. | NON ESEGUITO | — |
| T-1420 | 75 | Ricaricare ogni URL significativo. | NON ESEGUITO | — |
| T-1421 | 75 | Verificare apertura della medesima schermata. | NON ESEGUITO | — |
| T-1422 | 75 | Verificare che l’app non esca inaspettatamente. | NON ESEGUITO | — |
| T-1423 | 75 | Verificare che l’URL corrisponda alla schermata mostrata. | NON ESEGUITO | — |
| T-1424 | 75 | Verificare che non si creino schermate duplicate nella cronologia. | NON ESEGUITO | — |
| T-1425 | 76 | Caricare fotografia con nome originale personale. | NON ESEGUITO | — |
| T-1426 | 76 | Caricare fotografia contenente data e ora. | NON ESEGUITO | — |
| T-1427 | 76 | Caricare fotografia contenente modello del telefono. | NON ESEGUITO | — |
| T-1428 | 76 | Caricare una fotografia contenente coordinate GPS EXIF. | NON ESEGUITO | — |
| T-1429 | 76 | Definire gestione della componente video della Live Photo. | NON ESEGUITO | — |
| T-1430 | 76 | Definire se l’originale deve essere conservato. | NON ESEGUITO | — |
| T-1431 | 76 | Distinguere originale e versione ottimizzata. | NON ESEGUITO | — |
| T-1432 | 76 | Non rendere pubblica la posizione EXIF senza consenso. | NON ESEGUITO | — |
| T-1433 | 76 | Verificare che la fotografia non venga mostrata ruotata. | NON ESEGUITO | — |
| T-1434 | 76 | Verificare fotografie HDR. | NON ESEGUITO | — |
| T-1435 | 76 | Verificare Live Photo iPhone. | NON ESEGUITO | — |
| T-1436 | 76 | Verificare orientamento EXIF. | NON ESEGUITO | — |
| T-1437 | 76 | Verificare profilo colore. | NON ESEGUITO | — |
| T-1438 | 76 | Verificare rimozione dei metadati sensibili dalle copie pubbliche. | NON ESEGUITO | — |
| T-1439 | 76 | Verificare se i metadati vengono conservati o eliminati. | NON ESEGUITO | — |
| T-1440 | 77 | Inviare coordinate fuori dall’India. | NON ESEGUITO | — |
| T-1441 | 77 | Inviare coordinate modificate manualmente. | NON ESEGUITO | — |
| T-1442 | 77 | Mostrare chiaramente “Ultimo aggiornamento manuale”. | NON ESEGUITO | — |
| T-1443 | 77 | Non bloccare automaticamente un utente senza possibilità di spiegazione. | NON ESEGUITO | — |
| T-1444 | 77 | Non dichiarare una posizione come certificata se non è verificabile. | NON ESEGUITO | — |
| T-1445 | 77 | Registrare data e ora server. | NON ESEGUITO | — |
| T-1446 | 77 | Registrare precisione GPS. | NON ESEGUITO | — |
| T-1447 | 77 | Rifiutare timestamp creati manualmente dal client. | NON ESEGUITO | — |
| T-1448 | 77 | Segnalare spostamenti fisicamente impossibili. | NON ESEGUITO | — |
| T-1449 | 77 | Segnalare variazioni di migliaia di chilometri in pochi minuti. | NON ESEGUITO | — |
| T-1450 | 77 | Utilizzare posizione simulata Android. | NON ESEGUITO | — |
| T-1451 | 77 | Utilizzare strumenti di sviluppo per modificare latitudine e longitudine. | NON ESEGUITO | — |
| T-1452 | 77 | Verificare che la posizione venga indicata come dichiarata dal dispositivo. | NON ESEGUITO | — |
| T-1453 | 78 | Aggiornamento camminando. | NON ESEGUITO | — |
| T-1454 | 78 | Aggiornamento con app in background. | NON ESEGUITO | — |
| T-1455 | 78 | Aggiornamento con risparmio batteria attivo. | NON ESEGUITO | — |
| T-1456 | 78 | Aggiornamento con segnale GPS debole. | NON ESEGUITO | — |
| T-1457 | 78 | Aggiornamento da fermo. | NON ESEGUITO | — |
| T-1458 | 78 | Aggiornamento in aeroporto. | NON ESEGUITO | — |
| T-1459 | 78 | Aggiornamento in automobile. | NON ESEGUITO | — |
| T-1460 | 78 | Aggiornamento in hotel. | NON ESEGUITO | — |
| T-1461 | 78 | Aggiornamento in treno. | NON ESEGUITO | — |
| T-1462 | 78 | Aggiornamento in tuk-tuk. | NON ESEGUITO | — |
| T-1463 | 78 | Verificare cancellazione immediata dalla mappa. | NON ESEGUITO | — |
| T-1464 | 78 | Verificare che la posizione non continui dopo “Interrompi”. | NON ESEGUITO | — |
| T-1465 | 78 | Verificare consumo batteria. | NON ESEGUITO | — |
| T-1466 | 78 | Verificare frequenza degli aggiornamenti. | NON ESEGUITO | — |
| T-1467 | 78 | Verificare scadenza dopo 15, 30 e 60 minuti. | NON ESEGUITO | — |
| T-1468 | 79 | API sensibili con no-store. | NON ESEGUITO | — |
| T-1469 | 79 | Cache-Control corretto. | NON ESEGUITO | — |
| T-1470 | 79 | Content-Disposition corretto. | NON ESEGUITO | — |
| T-1471 | 79 | Content-Security-Policy. | NON ESEGUITO | — |
| T-1472 | 79 | Content-Type corretto. | NON ESEGUITO | — |
| T-1473 | 79 | Documenti privati con private, no-store. | NON ESEGUITO | — |
| T-1474 | 79 | Frame-Ancestors o X-Frame-Options. | NON ESEGUITO | — |
| T-1475 | 79 | Media pubblici con cache controllata. | NON ESEGUITO | — |
| T-1476 | 79 | Nessun codice di gruppo negli URL. | NON ESEGUITO | — |
| T-1477 | 79 | Nessun CORS eccessivamente permissivo. | NON ESEGUITO | — |
| T-1478 | 79 | Nessun dato personale negli header di risposta. | NON ESEGUITO | — |
| T-1479 | 79 | Nessun token negli URL. | NON ESEGUITO | — |
| T-1480 | 79 | Nessuna pagina privata incorporabile in siti esterni. | NON ESEGUITO | — |
| T-1481 | 79 | Permissions-Policy. | NON ESEGUITO | — |
| T-1482 | 79 | Referrer-Policy. | NON ESEGUITO | — |
| T-1483 | 79 | Strict-Transport-Security. | NON ESEGUITO | — |
| T-1484 | 79 | X-Content-Type-Options: nosniff. | SUPERATO | production-smoke: X-Content-Type-Options nosniff presente |
| T-1485 | 80 | Risultato atteso: operazione bloccata. | NON ESEGUITO | — |
| T-1486 | 80 | Tentare clickjacking su Carica documento. | NON ESEGUITO | — |
| T-1487 | 80 | Tentare clickjacking su Condividi posizione. | NON ESEGUITO | — |
| T-1488 | 80 | Tentare clickjacking sui pulsanti Elimina. | NON ESEGUITO | — |
| T-1489 | 80 | Tentare di incorporare l’app in un iframe esterno. | NON ESEGUITO | — |
| T-1490 | 80 | Verificare che pagine pubbliche eventualmente incorporabili siano separate da quelle private. | NON ESEGUITO | — |
| T-1491 | 80 | Verificare protezione mediante CSP frame-ancestors. | NON ESEGUITO | — |
| T-1492 | 81 | Aggiungere scansione automatica dei segreti nella pipeline. | NON ESEGUITO | — |
| T-1493 | 81 | Cercare chiavi private VAPID nel bundle JavaScript. | NON ESEGUITO | — |
| T-1494 | 81 | Cercare file .env nello ZIP. | NON ESEGUITO | — |
| T-1495 | 81 | Cercare GROUP_CODE nel bundle JavaScript. | NON ESEGUITO | — |
| T-1496 | 81 | Cercare ID o credenziali non necessarie. | NON ESEGUITO | — |
| T-1497 | 81 | Cercare segreti nei file sorgenti. | NON ESEGUITO | — |
| T-1498 | 81 | Cercare segreti nei log GitHub Actions. | NON ESEGUITO | — |
| T-1499 | 81 | Cercare segreti nei messaggi di errore. | NON ESEGUITO | — |
| T-1500 | 81 | Cercare segreti nel Service Worker. | NON ESEGUITO | — |
| T-1501 | 81 | Cercare segreti nella cronologia Git. | NON ESEGUITO | — |
| T-1502 | 81 | Cercare token Cloudflare. | NON ESEGUITO | — |
| T-1503 | 81 | Ruotare immediatamente qualsiasi segreto eventualmente esposto. | NON ESEGUITO | — |
| T-1504 | 81 | Verificare che soltanto la chiave pubblica VAPID sia inviata al browser. | NON ESEGUITO | — |
| T-1505 | 82 | Verificare accesso amministrativo con autenticazione a più fattori. | NON ESEGUITO | — |
| T-1506 | 82 | Verificare ambiente di collaudo separato. | NON ESEGUITO | — |
| T-1507 | 82 | Verificare ambiente produzione. | NON ESEGUITO | — |
| T-1508 | 82 | Verificare binding D1 corretto. | NON ESEGUITO | — |
| T-1509 | 82 | Verificare binding MEDIA corretto. | NON ESEGUITO | — |
| T-1510 | 82 | Verificare certificato HTTPS. | NON ESEGUITO | — |
| T-1511 | 82 | Verificare che i test non utilizzino dati di produzione. | NON ESEGUITO | — |
| T-1512 | 82 | Verificare configurazione del dominio. | NON ESEGUITO | — |
| T-1513 | 82 | Verificare limiti dell’archivio MEDIA. | NON ESEGUITO | — |
| T-1514 | 82 | Verificare limiti delle Functions. | NON ESEGUITO | — |
| T-1515 | 82 | Verificare limiti di D1. | NON ESEGUITO | — |
| T-1516 | 82 | Verificare log di deploy. | NON ESEGUITO | — |
| T-1517 | 82 | Verificare protezione dagli abusi. | NON ESEGUITO | — |
| T-1518 | 82 | Verificare redirect da HTTP a HTTPS. | NON ESEGUITO | — |
| T-1519 | 82 | Verificare rollback del deploy. | NON ESEGUITO | — |
| T-1520 | 82 | Verificare VAPID_PRIVATE_KEY. | NON ESEGUITO | — |
| T-1521 | 82 | Verificare VAPID_PUBLIC_KEY. | NON ESEGUITO | — |
| T-1522 | 82 | Verificare variabile GROUP_CODE. | NON ESEGUITO | — |
| T-1523 | 83 | Calcolare consumo giornaliero previsto. | NON ESEGUITO | — |
| T-1524 | 83 | Calcolare consumo massimo di un post con 10 allegati. | NON ESEGUITO | — |
| T-1525 | 83 | Calcolare consumo per 14 giorni. | NON ESEGUITO | — |
| T-1526 | 83 | Calcolare numero di richieste per utente al giorno. | NON ESEGUITO | — |
| T-1527 | 83 | Calcolare peso medio di un audio. | NON ESEGUITO | — |
| T-1528 | 83 | Calcolare peso medio di un video. | NON ESEGUITO | — |
| T-1529 | 83 | Calcolare peso medio di una fotografia. | NON ESEGUITO | — |
| T-1530 | 83 | Calcolare richieste Push. | NON ESEGUITO | — |
| T-1531 | 83 | Calcolare spazio necessario per documenti. | NON ESEGUITO | — |
| T-1532 | 83 | Calcolare traffico generato dal polling ogni 2,5 secondi. | NON ESEGUITO | — |
| T-1533 | 83 | Definire comportamento quando la quota viene superata. | NON ESEGUITO | — |
| T-1534 | 83 | Impedire che un singolo utente esaurisca la quota. | NON ESEGUITO | — |
| T-1535 | 83 | Impostare allarme al 95% della quota. | NON ESEGUITO | — |
| T-1536 | 83 | Impostare allarme all’80% della quota. | NON ESEGUITO | — |
| T-1537 | 83 | Moltiplicare per tutti i Viaggiatori e familiari. | NON ESEGUITO | — |
| T-1538 | 83 | Non perdere dati già caricati. | NON ESEGUITO | — |
| T-1539 | 84 | Aumento dei tentativi di accesso errati. | NON ESEGUITO | — |
| T-1540 | 84 | Aumento improvviso degli upload. | NON ESEGUITO | — |
| T-1541 | 84 | Aumento improvviso dei tempi di risposta. | NON ESEGUITO | — |
| T-1542 | 84 | Backup non eseguito. | NON ESEGUITO | — |
| T-1543 | 84 | Errore API 500. | NON ESEGUITO | — |
| T-1544 | 84 | Errore archivio MEDIA. | NON ESEGUITO | — |
| T-1545 | 84 | Errore conversione HEIC. | NON ESEGUITO | — |
| T-1546 | 84 | Errore database. | NON ESEGUITO | — |
| T-1547 | 84 | Errore JavaScript frontend. | NON ESEGUITO | — |
| T-1548 | 84 | Errore Push. | NON ESEGUITO | — |
| T-1549 | 84 | Errore Service Worker. | NON ESEGUITO | — |
| T-1550 | 84 | Migrazione non riuscita. | NON ESEGUITO | — |
| T-1551 | 84 | Nessun dato personale sensibile nel sistema di monitoraggio. | NON ESEGUITO | — |
| T-1552 | 84 | Notifica automatica al responsabile tecnico. | NON ESEGUITO | — |
| T-1553 | 84 | Quota Cloudflare quasi esaurita. | NON ESEGUITO | — |
| T-1554 | 84 | Registrazione di versione, endpoint e identificativo dell’errore. | NON ESEGUITO | — |
| T-1555 | 85 | accesso; | NON ESEGUITO | — |
| T-1556 | 85 | commento eliminato; | NON ESEGUITO | — |
| T-1557 | 85 | data e ora server; | NON ESEGUITO | — |
| T-1558 | 85 | dispositivo o sessione; | NON ESEGUITO | — |
| T-1559 | 85 | dispositivo revocato; | NON ESEGUITO | — |
| T-1560 | 85 | documento aperto; | NON ESEGUITO | — |
| T-1561 | 85 | documento caricato; | NON ESEGUITO | — |
| T-1562 | 85 | documento eliminato; | NON ESEGUITO | — |
| T-1563 | 85 | documento scaricato; | NON ESEGUITO | — |
| T-1564 | 85 | documento sostituito; | NON ESEGUITO | — |
| T-1565 | 85 | errore di sicurezza. | NON ESEGUITO | — |
| T-1566 | 85 | invito creato; | NON ESEGUITO | — |
| T-1567 | 85 | invito utilizzato; | NON ESEGUITO | — |
| T-1568 | 85 | logout; | NON ESEGUITO | — |
| T-1569 | 85 | nessun contenuto completo del documento; | NON ESEGUITO | — |
| T-1570 | 85 | nessun token; | NON ESEGUITO | — |
| T-1571 | 85 | nessuna password. | NON ESEGUITO | — |
| T-1572 | 85 | posizione cancellata; | NON ESEGUITO | — |
| T-1573 | 85 | posizione condivisa; | NON ESEGUITO | — |
| T-1574 | 85 | post eliminato; | NON ESEGUITO | — |
| T-1575 | 85 | profilo creato; | NON ESEGUITO | — |
| T-1576 | 85 | profilo modificato; | NON ESEGUITO | — |
| T-1577 | 85 | profilo; | NON ESEGUITO | — |
| T-1578 | 85 | rate limit raggiunto; | NON ESEGUITO | — |
| T-1579 | 85 | risorsa coinvolta; | NON ESEGUITO | — |
| T-1580 | 85 | risultato; | NON ESEGUITO | — |
| T-1581 | 85 | ruolo modificato; | NON ESEGUITO | — |
| T-1582 | 85 | ruolo; | NON ESEGUITO | — |
| T-1583 | 85 | sessione scaduta; | NON ESEGUITO | — |
| T-1584 | 85 | tentativo non autorizzato; | NON ESEGUITO | — |
| T-1585 | 85 | tipo di operazione; | NON ESEGUITO | — |
| T-1586 | 86 | Accedere nella prima scheda. | NON ESEGUITO | — |
| T-1587 | 86 | Aggiornare il Service Worker con due schede aperte. | NON ESEGUITO | — |
| T-1588 | 86 | Aprire l’app in due schede dello stesso browser. | NON ESEGUITO | — |
| T-1589 | 86 | Chiudere una scheda durante un upload. | NON ESEGUITO | — |
| T-1590 | 86 | Eseguire logout nella prima scheda. | NON ESEGUITO | — |
| T-1591 | 86 | Modificare il profilo dalla seconda. | NON ESEGUITO | — |
| T-1592 | 86 | Pubblicare dalla prima scheda. | NON ESEGUITO | — |
| T-1593 | 86 | Scrivere due bozze differenti. | NON ESEGUITO | — |
| T-1594 | 86 | Verificare aggiornamento della prima. | NON ESEGUITO | — |
| T-1595 | 86 | Verificare aggiornamento della seconda. | NON ESEGUITO | — |
| T-1596 | 86 | Verificare che nessuna scheda rimanga su codice incompatibile. | NON ESEGUITO | — |
| T-1597 | 86 | Verificare comportamento dell’altra scheda. | NON ESEGUITO | — |
| T-1598 | 86 | Verificare gestione senza sovrascrittura silenziosa. | NON ESEGUITO | — |
| T-1599 | 86 | Verificare logout anche nella seconda. | NON ESEGUITO | — |
| T-1600 | 87 | Accedere sul nuovo telefono. | NON ESEGUITO | — |
| T-1601 | 87 | Accedere sul vecchio telefono. | NON ESEGUITO | — |
| T-1602 | 87 | Creare un invito o procedura di trasferimento sicura. | NON ESEGUITO | — |
| T-1603 | 87 | Revocare il vecchio telefono. | NON ESEGUITO | — |
| T-1604 | 87 | Verificare bozze, se devono essere sincronizzate. | NON ESEGUITO | — |
| T-1605 | 87 | Verificare che il vecchio telefono non acceda più. | NON ESEGUITO | — |
| T-1606 | 87 | Verificare documenti corretti. | NON ESEGUITO | — |
| T-1607 | 87 | Verificare elenco dispositivi aggiornato. | SUPERATO | production-smoke: elenco dispositivi aggiornato dopo revoca |
| T-1608 | 87 | Verificare preferenze notifiche. | NON ESEGUITO | — |
| T-1609 | 87 | Verificare preferiti. | NON ESEGUITO | — |
| T-1610 | 87 | Verificare profilo corretto. | NON ESEGUITO | — |
| T-1611 | 87 | Verificare rimozione della vecchia subscription Push. | NON ESEGUITO | — |
| T-1612 | 88 | Accedere come Coordinatore da altro dispositivo. | NON ESEGUITO | — |
| T-1613 | 88 | Consentire creazione di un nuovo invito sicuro. | NON ESEGUITO | — |
| T-1614 | 88 | Individuare la sessione del telefono smarrito. | NON ESEGUITO | — |
| T-1615 | 88 | Registrare la revoca nel log. | NON ESEGUITO | — |
| T-1616 | 88 | Simulare telefono smarrito. | NON ESEGUITO | — |
| T-1617 | 88 | Verificare blocco immediato. | NON ESEGUITO | — |
| T-1618 | 88 | Verificare che il codice comune non consenta di riattivare il profilo. | NON ESEGUITO | — |
| T-1619 | 88 | Verificare eliminazione della subscription Push. | NON ESEGUITO | — |
| T-1620 | 88 | Verificare impossibilità di aprire documenti già non disponibili offline. | NON ESEGUITO | — |
| T-1621 | 89 | Aggiungere pulsante “Cancella dati da questo dispositivo”. | NON ESEGUITO | — |
| T-1622 | 89 | Cancellare dati sensibili dopo logout. | NON ESEGUITO | — |
| T-1623 | 89 | Non lasciare documenti privati nella cache. | NON ESEGUITO | — |
| T-1624 | 89 | Verificare dati dopo cancellazione dell’app dalla schermata Home. | NON ESEGUITO | — |
| T-1625 | 89 | Verificare dati dopo revoca della sessione. | NON ESEGUITO | — |
| T-1626 | 89 | Verificare dati tramite strumenti di sviluppo. | NON ESEGUITO | — |
| T-1627 | 89 | Verificare quali dati restano in IndexedDB. | NON ESEGUITO | — |
| T-1628 | 89 | Verificare quali dati restano nel localStorage. | NON ESEGUITO | — |
| T-1629 | 89 | Verificare quali dati restano nella Cache API. | NON ESEGUITO | — |
| T-1630 | 89 | Verificare quali documenti restano memorizzati. | NON ESEGUITO | — |
| T-1631 | 89 | Verificare quali fotografie restano memorizzate. | NON ESEGUITO | — |
| T-1632 | 90 | Evitare spazi bianchi o layout rotti. | NON ESEGUITO | — |
| T-1633 | 90 | Utilizzare immagine locale di riserva. | NON ESEGUITO | — |
| T-1634 | 90 | Verificare caricamento di ogni immagine Unsplash. | NON ESEGUITO | — |
| T-1635 | 90 | Verificare caricamento differito. | NON ESEGUITO | — |
| T-1636 | 90 | Verificare che l’immagine rappresenti la città corretta. | NON ESEGUITO | — |
| T-1637 | 90 | Verificare che le immagini non consumino dati inutilmente. | NON ESEGUITO | — |
| T-1638 | 90 | Verificare comportamento con Unsplash bloccato. | NON ESEGUITO | — |
| T-1639 | 90 | Verificare comportamento offline. | NON ESEGUITO | — |
| T-1640 | 90 | Verificare licenza e attribuzione, se necessaria. | NON ESEGUITO | — |
| T-1641 | 90 | Verificare peso delle immagini. | NON ESEGUITO | — |
| T-1642 | 90 | Verificare testo alternativo. | NON ESEGUITO | — |
| T-1643 | 91 | Attivare modalità manualmente. | NON ESEGUITO | — |
| T-1644 | 91 | Attivazione automatica su rete lenta. | NON ESEGUITO | — |
| T-1645 | 91 | Caricare immagini a qualità ridotta. | NON ESEGUITO | — |
| T-1646 | 91 | Conservare possibilità di scaricare l’originale. | NON ESEGUITO | — |
| T-1647 | 91 | Disattivare caricamento automatico video. | NON ESEGUITO | — |
| T-1648 | 91 | Mantenere sempre disponibili itinerario ed emergenze. | NON ESEGUITO | — |
| T-1649 | 91 | Mostrare quantità di dati risparmiati. | NON ESEGUITO | — |
| T-1650 | 91 | Non compromettere documenti e funzioni essenziali. | NON ESEGUITO | — |
| T-1651 | 91 | Ridurre frequenza di sincronizzazione. | NON ESEGUITO | — |
| T-1652 | 91 | Utilizzare miniature. | NON ESEGUITO | — |
| T-1653 | 92 | Confrontare iPhone e Android. | NON ESEGUITO | — |
| T-1654 | 92 | Definire consumo massimo accettabile. | NON ESEGUITO | — |
| T-1655 | 92 | Eseguire prova di quattro ore. | NON ESEGUITO | — |
| T-1656 | 92 | Eseguire prova di un’ora. | NON ESEGUITO | — |
| T-1657 | 92 | Misurare batteria con app aperta e inattiva. | NON ESEGUITO | — |
| T-1658 | 92 | Misurare batteria con app chiusa. | NON ESEGUITO | — |
| T-1659 | 92 | Misurare batteria con mappa aperta. | NON ESEGUITO | — |
| T-1660 | 92 | Misurare batteria con notifiche attive. | NON ESEGUITO | — |
| T-1661 | 92 | Misurare batteria con polling attivo. | NON ESEGUITO | — |
| T-1662 | 92 | Misurare batteria con posizione attiva. | NON ESEGUITO | — |
| T-1663 | 92 | Misurare batteria durante conversione HEIC. | NON ESEGUITO | — |
| T-1664 | 92 | Misurare batteria durante upload video. | NON ESEGUITO | — |
| T-1665 | 92 | Ridurre attività in background non indispensabili. | NON ESEGUITO | — |
| T-1666 | 93 | Definire budget massimo del bundle. | NON ESEGUITO | — |
| T-1667 | 93 | Misurare CSS iniziale. | NON ESEGUITO | — |
| T-1668 | 93 | Misurare heic2any. | NON ESEGUITO | — |
| T-1669 | 93 | Misurare JavaScript iniziale. | NON ESEGUITO | — |
| T-1670 | 93 | Misurare MapLibre. | NON ESEGUITO | — |
| T-1671 | 93 | Verificare assenza di codice inutilizzato. | NON ESEGUITO | — |
| T-1672 | 93 | Verificare caching degli asset versionati. | NON ESEGUITO | — |
| T-1673 | 93 | Verificare caricamento heic2any soltanto con file HEIC. | NON ESEGUITO | — |
| T-1674 | 93 | Verificare caricamento MapLibre soltanto quando serve. | NON ESEGUITO | — |
| T-1675 | 93 | Verificare compressione Brotli/Gzip. | NON ESEGUITO | — |
| T-1676 | 93 | Verificare tempo di apertura su rete 3G. | NON ESEGUITO | — |
| T-1677 | 93 | Verificare tempo di parsing su telefono economico. | NON ESEGUITO | — |
| T-1678 | 94 | Cambiare filtro. | NON ESEGUITO | — |
| T-1679 | 94 | Caricare i primi 20 post. | NON ESEGUITO | — |
| T-1680 | 94 | Eliminare un post già caricato. | NON ESEGUITO | — |
| T-1681 | 94 | Gestire errore nel caricamento della pagina successiva. | NON ESEGUITO | — |
| T-1682 | 94 | Inserire un nuovo post mentre si scorre. | NON ESEGUITO | — |
| T-1683 | 94 | Mostrare chiaramente “Non ci sono altri contenuti”. | NON ESEGUITO | — |
| T-1684 | 94 | Permettere di riprovare senza ricominciare dall’inizio. | SUPERATO | resumable-upload: errore temporaneo ritentato senza ricominciare il file |
| T-1685 | 94 | Raggiungere la fine del feed. | NON ESEGUITO | — |
| T-1686 | 94 | Scorrere e caricare i successivi. | NON ESEGUITO | — |
| T-1687 | 94 | Tornare al filtro precedente. | NON ESEGUITO | — |
| T-1688 | 94 | Verificare nessun duplicato tra pagine. | NON ESEGUITO | — |
| T-1689 | 94 | Verificare nessun post mancante. | NON ESEGUITO | — |
| T-1690 | 94 | Verificare posizione di scorrimento. | NON ESEGUITO | — |
| T-1691 | 95 | Nessun contenuto “Solo io” mostrato ad altri utenti. | NON ESEGUITO | — |
| T-1692 | 95 | Nessun documento privato nei risultati pubblici. | NON ESEGUITO | — |
| T-1693 | 95 | Ricerca con accenti. | NON ESEGUITO | — |
| T-1694 | 95 | Ricerca con errore di battitura. | NON ESEGUITO | — |
| T-1695 | 95 | Ricerca maiuscole/minuscole. | NON ESEGUITO | — |
| T-1696 | 95 | Ricerca offline sui dati disponibili. | NON ESEGUITO | — |
| T-1697 | 95 | Ricerca per cognome. | NON ESEGUITO | — |
| T-1698 | 95 | Ricerca per commento. | NON ESEGUITO | — |
| T-1699 | 95 | Ricerca per giornata. | NON ESEGUITO | — |
| T-1700 | 95 | Ricerca per luogo. | NON ESEGUITO | — |
| T-1701 | 95 | Ricerca per nome. | NON ESEGUITO | — |
| T-1702 | 95 | Ricerca per testo del post. | NON ESEGUITO | — |
| T-1703 | 95 | Ricerca senza accenti. | NON ESEGUITO | — |
| T-1704 | 95 | Risultati filtrati in base al ruolo. | NON ESEGUITO | — |
| T-1705 | 96 | Apertura dell’archivio su macOS. | NON ESEGUITO | — |
| T-1706 | 96 | Apertura dell’archivio su telefono. | NON ESEGUITO | — |
| T-1707 | 96 | Apertura dell’archivio su Windows. | NON ESEGUITO | — |
| T-1708 | 96 | Archivio di audio. | NON ESEGUITO | — |
| T-1709 | 96 | Archivio di fotografie. | NON ESEGUITO | — |
| T-1710 | 96 | Archivio di post e commenti. | NON ESEGUITO | — |
| T-1711 | 96 | Archivio di tutti i 14 giorni. | NON ESEGUITO | — |
| T-1712 | 96 | Archivio di un solo giorno. | NON ESEGUITO | — |
| T-1713 | 96 | Archivio di una sola persona. | NON ESEGUITO | — |
| T-1714 | 96 | Archivio di video. | NON ESEGUITO | — |
| T-1715 | 96 | Controllo dei file mancanti. | NON ESEGUITO | — |
| T-1716 | 96 | CSV delle informazioni strutturate. | NON ESEGUITO | — |
| T-1717 | 96 | Hash per verifica integrità. | NON ESEGUITO | — |
| T-1718 | 96 | HTML utilizzabile offline. | NON ESEGUITO | — |
| T-1719 | 96 | Indicazione avanzamento. | NON ESEGUITO | — |
| T-1720 | 96 | JSON dei dati. | NON ESEGUITO | — |
| T-1721 | 96 | Manifesto con elenco dei contenuti. | NON ESEGUITO | — |
| T-1722 | 96 | Nessun documento privato inserito senza consenso. | NON ESEGUITO | — |
| T-1723 | 96 | Pausa e ripresa. | NON ESEGUITO | — |
| T-1724 | 96 | PDF del diario. | NON ESEGUITO | — |
| T-1725 | 96 | Ripresa dopo perdita della rete. | NON ESEGUITO | — |
| T-1726 | 96 | Suddivisione in più parti se troppo grande. | SUPERATO | resumable-upload: file da 9 MB suddiviso e completato in tre parti |
| T-1727 | 96 | ZIP completo. | NON ESEGUITO | — |
| T-1728 | 97 | Il Coordinatore controlla i documenti. | NON ESEGUITO | — |
| T-1729 | 97 | Il Coordinatore revoca un dispositivo di prova. | NON ESEGUITO | — |
| T-1730 | 97 | Tutti aggiungono una reazione. | NON ESEGUITO | — |
| T-1731 | 97 | Tutti attivano le notifiche. | NON ESEGUITO | — |
| T-1732 | 97 | Tutti condividono e cancellano la posizione. | NON ESEGUITO | — |
| T-1733 | 97 | Tutti controllano il proprio profilo. | NON ESEGUITO | — |
| T-1734 | 97 | Tutti controllano l’itinerario. | NON ESEGUITO | — |
| T-1735 | 97 | Tutti i partecipanti aprono il proprio invito. | NON ESEGUITO | — |
| T-1736 | 97 | Tutti i partecipanti installano la PWA. | NON ESEGUITO | — |
| T-1737 | 97 | Tutti inseriscono un commento. | NON ESEGUITO | — |
| T-1738 | 97 | Tutti provano la modalità aereo. | NON ESEGUITO | — |
| T-1739 | 97 | Tutti pubblicano un post di prova. | NON ESEGUITO | — |
| T-1740 | 97 | Tutti pubblicano una fotografia. | NON ESEGUITO | — |
| T-1741 | 97 | Tutti registrano un audio. | NON ESEGUITO | — |
| T-1742 | 97 | Tutti verificano i dati di emergenza. | NON ESEGUITO | — |
| T-1743 | 97 | Viene eseguito un backup. | SUPERATO | backup D1 pre-migrazione eseguito |
| T-1744 | 97 | Viene eseguito un ripristino. | SUPERATO | backup D1 ripristinato in ambiente temporaneo |
| T-1745 | 97 | Viene simulata una perdita della connessione. | NON ESEGUITO | — |
| T-1746 | 97 | Viene simulata una rete lenta. | NON ESEGUITO | — |
| T-1747 | 97 | Viene verificato il ritorno della rete. | NON ESEGUITO | — |
| T-1748 | 98 | API funzionanti; | NON ESEGUITO | — |
| T-1749 | 98 | backup eseguito; | SUPERATO | backup eseguito con impronta SHA-256 verificata |
| T-1750 | 98 | coda offline vuota oppure correttamente registrata; | NON ESEGUITO | — |
| T-1751 | 98 | commenti sincronizzati; | NON ESEGUITO | — |
| T-1752 | 98 | dati di emergenza disponibili offline. | NON ESEGUITO | — |
| T-1753 | 98 | documenti essenziali disponibili; | NON ESEGUITO | — |
| T-1754 | 98 | dominio raggiungibile; | NON ESEGUITO | — |
| T-1755 | 98 | eventuali errori annotati. | NON ESEGUITO | — |
| T-1756 | 98 | fotografie e video presenti; | NON ESEGUITO | — |
| T-1757 | 98 | itinerario della giornata; | NON ESEGUITO | — |
| T-1758 | 98 | mappe; | NON ESEGUITO | — |
| T-1759 | 98 | nessun errore critico nelle ultime 24 ore; | NON ESEGUITO | — |
| T-1760 | 98 | nessun upload bloccato; | NON ESEGUITO | — |
| T-1761 | 98 | nessuna duplicazione; | NON ESEGUITO | — |
| T-1762 | 98 | notifiche; | NON ESEGUITO | — |
| T-1763 | 98 | nuovi post sincronizzati; | NON ESEGUITO | — |
| T-1764 | 98 | posizioni scadute o cancellate; | NON ESEGUITO | — |
| T-1765 | 98 | spazio Cloudflare; | NON ESEGUITO | — |
| T-1766 | 98 | spazio disponibile; | NON ESEGUITO | — |
| T-1767 | 98 | ultimo backup; | NON ESEGUITO | — |
| T-1768 | 98 | versione corretta; | NON ESEGUITO | — |
| T-1769 | 99 | aprire la mappa; | NON ESEGUITO | — |
| T-1770 | 99 | attivare le notifiche; | NON ESEGUITO | — |
| T-1771 | 99 | cancellare la posizione; | NON ESEGUITO | — |
| T-1772 | 99 | commentare un post; | NON ESEGUITO | — |
| T-1773 | 99 | condividere la posizione; | NON ESEGUITO | — |
| T-1774 | 99 | entrare con un invito; | NON ESEGUITO | — |
| T-1775 | 99 | errori commessi; | NON ESEGUITO | — |
| T-1776 | 99 | installare l’app; | NON ESEGUITO | — |
| T-1777 | 99 | operazioni troppo lunghe; | NON ESEGUITO | — |
| T-1778 | 99 | pubblicare una fotografia; | NON ESEGUITO | — |
| T-1779 | 99 | pulsanti che non comprende; | NON ESEGUITO | — |
| T-1780 | 99 | punti in cui chiede aiuto; | NON ESEGUITO | — |
| T-1781 | 99 | registrare un audio; | NON ESEGUITO | — |
| T-1782 | 99 | sezioni difficili da trovare; | NON ESEGUITO | — |
| T-1783 | 99 | suggerimenti spontanei. | NON ESEGUITO | — |
| T-1784 | 99 | tempo necessario per ogni attività; | NON ESEGUITO | — |
| T-1785 | 99 | testi poco chiari; | NON ESEGUITO | — |
| T-1786 | 99 | trovare i propri documenti; | NON ESEGUITO | — |
| T-1787 | 99 | trovare il programma del giorno; | NON ESEGUITO | — |
| T-1788 | 100 | assenza di errori bloccanti aperti. | NON ESEGUITO | — |
| T-1789 | 100 | autenticazione e identità; | NON ESEGUITO | — |
| T-1790 | 100 | autorizzazioni dei ruoli; | NON ESEGUITO | — |
| T-1791 | 100 | backup e ripristino; | SUPERATO | backup e ripristino D1 verificati end-to-end |
| T-1792 | 100 | idempotenza; | SUPERATO | production-smoke: idempotenza coperta su quattro tipi di scrittura |
| T-1793 | 100 | notifiche autorizzate correttamente; | NON ESEGUITO | — |
| T-1794 | 100 | offline con allegati; | SUPERATO | offline-queue: allegati multimediali conservati e reinviati |
| T-1795 | 100 | privacy dei profili; | NON ESEGUITO | — |
| T-1796 | 100 | protezione dei documenti; | NON ESEGUITO | — |
| T-1797 | 100 | prova con computer del programmatore spento; | NON ESEGUITO | — |
| T-1798 | 100 | prova con utilizzatore non esperto; | NON ESEGUITO | — |
| T-1799 | 100 | prova generale con tutto il gruppo; | NON ESEGUITO | — |
| T-1800 | 100 | ripresa upload; | SUPERATO | resumable-upload: ripresa upload coperta da prova automatica |
| T-1801 | 100 | sicurezza delle posizioni; | NON ESEGUITO | — |
| T-1802 | 100 | sincronizzazione incrementale; | NON ESEGUITO | — |
| T-1803 | 100 | test Android; | NON ESEGUITO | — |
| T-1804 | 100 | test del Familiare; | NON ESEGUITO | — |
| T-1805 | 100 | test del percorso completo del Coordinatore; | NON ESEGUITO | — |
| T-1806 | 100 | test del percorso completo del Viaggiatore; | NON ESEGUITO | — |
| T-1807 | 100 | test iPhone; | NON ESEGUITO | — |
| T-1808 | 100 | test modalità aereo; | NON ESEGUITO | — |
| T-1809 | 100 | test multidispositivo; | NON ESEGUITO | — |
| T-1810 | 100 | test rete lenta; | NON ESEGUITO | — |
| T-1811 | 100 | verifica dall’India o da una rete con caratteristiche equivalenti; | NON ESEGUITO | — |
| T-1812 | 100 | visibilità dei post; | NON ESEGUITO | — |
