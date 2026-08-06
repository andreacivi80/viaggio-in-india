# Messaggi di accesso negato e recupero

Questa tabella collega il diniego restituito dal server a ciò che l’utente deve fare. Il client non traduce un errore in un privilegio e la password comune non viene mai usata per ripetere silenziosamente un’operazione privata.

| Messaggio verificato | Significato | Recupero consentito |
|---|---|---|
| `Codice non corretto` | Password comune errata o mancante | Reinserire la password corretta; non viene creata alcuna sessione |
| `Sessione non valida` | Token assente, scaduto, revocato o non associato al dispositivo | Aprire un nuovo invito personale; il vecchio token viene rimosso |
| `Accesso personale richiesto` | L’operazione richiede una sessione personale, non la sola password | Collegare il proprio profilo con invito oppure creare un nuovo profilo con consenso |
| `Solo il coordinatore può creare inviti` | Il viaggiatore non possiede il ruolo necessario | Chiedere a un coordinatore di generare l’invito |
| `Solo il coordinatore può revocare inviti` | La revoca è riservata al coordinatore | Chiedere a un coordinatore di revocarlo |
| `Solo il coordinatore può creare profili` | La sessione corrente non può creare profili altrui | Il nuovo partecipante crea il proprio profilo oppure interviene un coordinatore |
| `Documento non autorizzato` | Il documento non appartiene al viaggiatore e la sessione non ha l’autorizzazione prevista | Aprire i propri documenti; per il controllo generale deve intervenire il coordinatore |
| `Contenuto non autorizzato` | La visibilità del post non include l’identità corrente | Accedere con il profilo autorizzato; la password comune non estende la visibilità |
| `Non puoi modificare questo profilo` | La sessione non è proprietaria e non è coordinatore | Modificare soltanto il proprio profilo oppure chiedere al coordinatore |
| `Non puoi eliminare questo profilo` | Il profilo non può essere eliminato dalla sessione corrente | Usare il proprietario autorizzato o il coordinatore secondo la matrice |
| `Non puoi modificare questo commento` | Il commento appartiene a un’altra identità | Modificare soltanto i propri commenti |
| `Non puoi eliminare questo commento` | Il commento appartiene a un’altra identità | Eliminare soltanto i propri commenti o usare il coordinatore autorizzato |
| `Puoi aggiornare soltanto la tua posizione` | È stata richiesta una modifica alla posizione altrui | Condividere o aggiornare la propria posizione |
| `Non puoi cancellare questa posizione` | È stata richiesta la cancellazione della posizione altrui | Cancellare soltanto la propria posizione |
| `Identità ospite richiesta` | Un visitatore pubblico vuole commentare o reagire senza nome verificato | Inserire una volta il proprio nome ospite |
| `Invito non valido o scaduto` | L’invito non esiste più o ha superato la scadenza | Richiedere un nuovo invito personale al coordinatore |
| `Invito già utilizzato` | Il link monouso è già stato consumato | Richiedere un nuovo invito personale; il link precedente non viene riattivato |

Messaggi di recupero mostrati direttamente nell’interfaccia:

- `Inserisci la password per vedere il gruppo e collegare il tuo profilo.`
- `Questo dispositivo non è ancora autorizzato` e `Inserisci la password comune e collega il tuo profilo.`
- `I comandi privati restano bloccati fino alla conferma del server.`
- `La sessione è scaduta. Bozza e allegati sono conservati: riapri il tuo invito personale.`
- In testata, `Pubblico` indica assenza di sessione personale verificata; il nome del profilo compare soltanto dopo la conferma server.
