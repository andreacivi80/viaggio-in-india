# Pacchetto ristretto dei controlli critici — revisione 1.41.1

Controlli selezionati: **120** tra 217 controlli P0–P2 ancora privi di evidenza conclusiva.
Stato del pacchetto: **0 superati**, **120 pendenti**.

Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.

- **K0 (40):** blocca qualsiasi rilascio.
- **K1 (50):** deve passare prima della condivisione stabile.
- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.

## K0

- [ ] **K-001 · sync-rete** — Aprire Emergenza senza rete.
  Sorgente: `globale:T-1183`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-002 · sync-rete** — Attivazione automatica su rete lenta.
  Sorgente: `globale:T-1644`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-003 · sync-rete** — Badge sincronizzato dei contenuti non letti.
  Sorgente: `globale:T-0076`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-004 · sync-rete** — Cercare segreti nel Service Worker.
  Sorgente: `globale:T-1500`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-005 · sync-rete** — Eseguire logout senza rete.
  Sorgente: `globale:T-0760`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-006 · sync-rete** — Gestione delle modifiche concorrenti.
  Sorgente: `globale:T-0101`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-007 · sync-rete** — Invio automatico al ritorno della rete.
  Sorgente: `globale:T-0123`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-008 · sync-rete** — Rete interrotta al 50%.
  Sorgente: `usabilita:U0528`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-009 · sync-rete** — Rete interrotta al 90%.
  Sorgente: `usabilita:U0529`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-010 · sync-rete** — Ridurre frequenza di sincronizzazione.
  Sorgente: `globale:T-1651`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-011 · sync-rete** — Ripresa dopo perdita della rete.
  Sorgente: `globale:T-1725`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-012 · sync-rete** — Stato letto/non letto sincronizzato tra dispositivi.
  Sorgente: `globale:T-0091`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-013 · sync-rete** — Verificare aggiornamento al successivo ritorno della rete.
  Sorgente: `globale:T-0831`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-014 · sync-rete** — Verificare bozze, se devono essere sincronizzate.
  Sorgente: `globale:T-1604`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-015 · sync-rete** — Verificare funzionamento con rete assente.
  Sorgente: `globale:T-1192`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-016 · sync-rete** — Verificare tempo di apertura su rete 3G.
  Sorgente: `globale:T-1676`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-017 · sync-rete** — Verificare trigger della sincronizzazione.
  Sorgente: `globale:T-1042`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-018 · sync-rete** — Viene simulata una rete lenta.
  Sorgente: `globale:T-1746`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-019 · sync-rete** — Viene verificato il ritorno della rete.
  Sorgente: `globale:T-1747`. Più telefoni e reti instabili devono convergere senza perdita o duplicazione.
- [ ] **K-020 · media-upload** — 100 upload dallo stesso utente.
  Sorgente: `globale:T-1051`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-021 · media-upload** — Aprire fotografie e video pubblici.
  Sorgente: `usabilita:U0616`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-022 · media-upload** — Aprire una fotografia del carosello.
  Sorgente: `globale:T-1394`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-023 · media-upload** — Aumento improvviso degli upload.
  Sorgente: `globale:T-1540`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-024 · media-upload** — Bloccare lo schermo durante l’audio.
  Sorgente: `globale:T-0909`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-025 · media-upload** — Caricare due file con lo stesso nome.
  Sorgente: `globale:T-0989`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-026 · media-upload** — Caricare file con MIME falso.
  Sorgente: `globale:T-0614`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-027 · media-upload** — Caricare fotografia con nome originale personale.
  Sorgente: `globale:T-1425`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-028 · media-upload** — Caricare fotografia contenente data e ora.
  Sorgente: `globale:T-1426`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-029 · media-upload** — Caricare i primi 20 post.
  Sorgente: `globale:T-1679`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-030 · media-upload** — Caricare immagini a qualità ridotta.
  Sorgente: `globale:T-1645`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-031 · media-upload** — Caricare un file con accenti.
  Sorgente: `globale:T-0990`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-032 · media-upload** — Caricare un file con emoji nel nome.
  Sorgente: `globale:T-0991`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-033 · media-upload** — Caricare un file con nome molto lungo.
  Sorgente: `globale:T-0992`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-034 · media-upload** — Caricare una fotografia contenente coordinate GPS EXIF.
  Sorgente: `globale:T-1428`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-035 · media-upload** — Caricare una fotografia orizzontale.
  Sorgente: `globale:T-0996`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-036 · media-upload** — Caricare una fotografia sfocata.
  Sorgente: `globale:T-0997`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-037 · media-upload** — Chiudere una scheda durante un upload.
  Sorgente: `globale:T-1589`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-038 · media-upload** — Conservare possibilità di scaricare l’originale.
  Sorgente: `globale:T-1646`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-039 · media-upload** — Consultare post già scaricati.
  Sorgente: `globale:T-0540`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-040 · media-upload** — Deep link della singola fotografia.
  Sorgente: `globale:T-0245`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.

## K1

- [ ] **K-041 · media-upload** — Disattivare caricamento automatico video.
  Sorgente: `globale:T-1647`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-042 · media-upload** — dispone di screenshot, video o log come prova.
  Sorgente: `globale:T-0247`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-043 · media-upload** — Eseguire logout durante un caricamento.
  Sorgente: `globale:T-0759`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-044 · media-upload** — Fotografia → carosello → indietro.
  Sorgente: `globale:T-1413`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-045 · media-upload** — Fotografie, video e audio.
  Sorgente: `usabilita:U0149`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-046 · media-upload** — Gestire errore nel caricamento della pagina successiva.
  Sorgente: `globale:T-1681`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-047 · media-upload** — Interrompere upload al 25%.
  Sorgente: `globale:T-0541`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-048 · media-upload** — Interrompere upload al 50%.
  Sorgente: `globale:T-0542`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-049 · media-upload** — Interrompere upload al 90%.
  Sorgente: `globale:T-0543`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-050 · media-upload** — Mettere in pausa il video.
  Sorgente: `globale:T-0913`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-051 · media-upload** — Misurare batteria durante upload video.
  Sorgente: `globale:T-1664`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-052 · media-upload** — Nessuna esecuzione di contenuto caricato.
  Sorgente: `globale:T-0171`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-053 · media-upload** — Non perdere dati già caricati.
  Sorgente: `globale:T-1538`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-054 · media-upload** — Portare il video avanti e indietro.
  Sorgente: `globale:T-0914`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-055 · media-upload** — Pubblicare audio, se consentito.
  Sorgente: `usabilita:U0632`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-056 · media-upload** — Pubblicare fotografia, se consentito.
  Sorgente: `usabilita:U0630`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-057 · media-upload** — Pubblicare video, se consentito.
  Sorgente: `usabilita:U0631`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-058 · media-upload** — Rete interrotta al 25% dell’upload.
  Sorgente: `usabilita:U0527`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-059 · media-upload** — Ricaricare ogni URL significativo.
  Sorgente: `globale:T-1420`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-060 · media-upload** — Riprodurre il video con rete lenta.
  Sorgente: `globale:T-0915`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-061 · media-upload** — Riprodurre un file audio.
  Sorgente: `globale:T-0916`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-062 · media-upload** — Riprodurre un video con audio.
  Sorgente: `globale:T-0917`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-063 · media-upload** — Salvare una bozza con dieci fotografie.
  Sorgente: `globale:T-0850`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-064 · media-upload** — Salvare una bozza con un video.
  Sorgente: `globale:T-0851`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-065 · media-upload** — Salvare una bozza con una fotografia.
  Sorgente: `globale:T-0852`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-066 · media-upload** — Scaricamento soltanto delle modifiche.
  Sorgente: `globale:T-0112`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-067 · media-upload** — Scorrere e caricare i successivi.
  Sorgente: `globale:T-1686`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-068 · media-upload** — Selezionare fotografie e video.
  Sorgente: `globale:T-0830`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-069 · media-upload** — Selezionare un video MOV.
  Sorgente: `usabilita:U0200`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-070 · media-upload** — Selezionare un video MP4.
  Sorgente: `usabilita:U0201`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-071 · media-upload** — Sincronizzazione immediata al ritorno della rete.
  Sorgente: `globale:T-0114`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-072 · media-upload** — Sostituire la propria fotografia.
  Sorgente: `usabilita:U0372`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-073 · media-upload** — Stato caricamento comunicato allo screen reader.
  Sorgente: `globale:T-1073`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-074 · media-upload** — Tornare dopo la visualizzazione di una fotografia.
  Sorgente: `globale:T-0977`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-075 · media-upload** — Tutti pubblicano una fotografia.
  Sorgente: `globale:T-1740`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-076 · media-upload** — Tutti registrano un audio.
  Sorgente: `globale:T-1741`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-077 · media-upload** — Verificare caricamento di ogni immagine Unsplash.
  Sorgente: `globale:T-1634`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-078 · media-upload** — Verificare caricamento heic2any soltanto con file HEIC.
  Sorgente: `globale:T-1673`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-079 · media-upload** — Verificare caricamento MapLibre soltanto quando serve.
  Sorgente: `globale:T-1674`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-080 · media-upload** — Verificare che due video non vengano riprodotti contemporaneamente.
  Sorgente: `globale:T-0922`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-081 · media-upload** — Verificare che l’app non si ricarichi durante la registrazione audio.
  Sorgente: `globale:T-0835`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-082 · media-upload** — Verificare che l’app non si ricarichi durante la scrittura.
  Sorgente: `globale:T-0836`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-083 · media-upload** — Verificare che l’app non si ricarichi durante un upload.
  Sorgente: `globale:T-0837`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-084 · media-upload** — Verificare che l’audio non venga perso o corrotto.
  Sorgente: `globale:T-0458`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-085 · media-upload** — Verificare che la fotografia non venga mostrata ruotata.
  Sorgente: `globale:T-1433`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-086 · media-upload** — Verificare funzionamento dopo ricaricamento della pagina.
  Sorgente: `globale:T-0983`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-087 · media-upload** — Verificare quali fotografie restano memorizzate.
  Sorgente: `globale:T-1631`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-088 · media-upload** — Verificare stesso post, stessi commenti e stessa fotografia.
  Sorgente: `globale:T-1408`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-089 · media-upload** — Verificare streaming senza caricare tutto il file in memoria.
  Sorgente: `globale:T-1008`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.
- [ ] **K-090 · media-upload** — video oltre 25 MB.
  Sorgente: `globale:T-0441`. Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.

## K2

- [ ] **K-091 · altro** — Ricevere una notifica dopo revoca del dispositivo.
  Sorgente: `globale:T-0870`. Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.
- [ ] **K-092 · profili-ruoli** — A modifica profilo, B vede modifica.
  Sorgente: `usabilita:U0562`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-093 · profili-ruoli** — Aggiungere funzione di cancellazione del proprio profilo.
  Sorgente: `globale:T-0045`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-094 · profili-ruoli** — Aprire il proprio profilo.
  Sorgente: `usabilita:U0070;usabilita:U0370`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-095 · profili-ruoli** — Cambiare profilo sullo stesso dispositivo.
  Sorgente: `globale:T-0858`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-096 · profili-ruoli** — Confrontare numero di profili.
  Sorgente: `globale:T-1162`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-097 · profili-ruoli** — Creare il profilo del Viaggiatore A.
  Sorgente: `globale:T-0698`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-098 · profili-ruoli** — Creare il profilo del Viaggiatore B.
  Sorgente: `globale:T-0699`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-099 · profili-ruoli** — Deep link del profilo.
  Sorgente: `globale:T-0242`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-100 · profili-ruoli** — Modificare contemporaneamente lo stesso profilo da due dispositivi.
  Sorgente: `globale:T-0797`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-101 · profili-ruoli** — Modificare il nome del profilo A.
  Sorgente: `globale:T-0702`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-102 · profili-ruoli** — Modificare il profilo dalla seconda.
  Sorgente: `globale:T-1591`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-103 · profili-ruoli** — Modificare il proprio profilo.
  Sorgente: `usabilita:U0371`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-104 · profili-ruoli** — Modificare profile_id nella richiesta.
  Sorgente: `usabilita:U0173`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-105 · profili-ruoli** — Mostrare un messaggio preciso: “Per pubblicare devi prima collegare questo dispositivo al tuo profilo”.
  Sorgente: `usabilita:U0007`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-106 · profili-ruoli** — Non associare automaticamente un profilo scelto dal client.
  Sorgente: `usabilita:U0482`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-107 · profili-ruoli** — Protezione contro modifica manuale del profile_id.
  Sorgente: `globale:T-0225`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-108 · profili-ruoli** — Protezione contro modifica manuale del ruolo.
  Sorgente: `globale:T-0226`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-109 · profili-ruoli** — Risultati filtrati in base al ruolo.
  Sorgente: `globale:T-1704`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-110 · profili-ruoli** — Tentare di scegliere un profilo esistente.
  Sorgente: `usabilita:U0634`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-111 · profili-ruoli** — Tutti controllano il proprio profilo.
  Sorgente: `globale:T-1733`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-112 · profili-ruoli** — Verificare che il cambio di anteprima non modifichi il ruolo reale.
  Sorgente: `usabilita:U0455`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-113 · profili-ruoli** — Verificare che il codice comune non consenta di riattivare il profilo.
  Sorgente: `globale:T-1618`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-114 · profili-ruoli** — Verificare che il nome del marker corrisponda al profilo A.
  Sorgente: `globale:T-0711`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-115 · profili-ruoli** — Verificare che il profilo non compaia nel feed.
  Sorgente: `globale:T-1327`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-116 · profili-ruoli** — Verificare che il Viaggiatore modifichi soltanto il proprio profilo.
  Sorgente: `globale:T-0356`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-117 · profili-ruoli** — Verificare che ogni comando appartenga al profilo corretto.
  Sorgente: `usabilita:U0076`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-118 · profili-ruoli** — Verificare comportamento dopo cambio profilo.
  Sorgente: `globale:T-1361`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-119 · profili-ruoli** — Verificare profile_id o guest_id corretto.
  Sorgente: `usabilita:U0019`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
- [ ] **K-120 · profili-ruoli** — Verificare profili precedenti conservati.
  Sorgente: `globale:T-1039`. Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.
