# Politica di conservazione dei dati

Queste regole descrivono il comportamento effettivo del servizio. Le operazioni automatiche non devono cancellare contenuti validi o documenti di viaggio.

| Dato | Conservazione | Eliminazione |
|---|---|---|
| Posizione condivisa | 24 ore dall'ultimo aggiornamento | Automatica dopo 24 ore; immediata su richiesta del proprietario o eliminazione del profilo |
| Documenti privati | Per tutta la durata del profilo | Soltanto su eliminazione/sostituzione esplicita del documento o eliminazione del profilo |
| Pubblicazioni e relativi media | Finché la pubblicazione resta presente | Su eliminazione esplicita della pubblicazione o del profilo autore; la cascata comprende media, commenti e reazioni |
| Commenti e relativi media | Finché il commento e la pubblicazione restano presenti | Su eliminazione esplicita del commento, della pubblicazione o del profilo collegato |
| Sottoscrizioni push | Finché dispositivo e sessione restano autorizzati | Disattivazione esplicita, logout, revoca del dispositivo/profilo oppure risposta permanente 404/410 del servizio push |
| Registro tecnico di sicurezza | 180 giorni | Eliminazione automatica oltre 180 giorni; non contiene password, token, documenti o coordinate precise |
| Sessioni revocate | Massimo 7 giorni dopo la revoca | Eliminazione automatica; le sessioni scadute vengono eliminate immediatamente dalla manutenzione |

## Originali e sostituzioni

Foto, audio, video e PDF vengono conservati nel formato caricato finché il contenuto che li usa rimane valido. La sostituzione di un documento o di una fotografia profilo rimuove l'oggetto precedente; un errore tra archivio e database attiva la compensazione e non deve lasciare file orfani.

## Regola di sicurezza

La manutenzione automatica può eliminare soltanto dati scaduti secondo questa tabella. Documenti, post e commenti validi non hanno una scadenza automatica. Ogni eliminazione richiesta dall'utente deve essere autorizzata dal server e confermata nell'interfaccia.
