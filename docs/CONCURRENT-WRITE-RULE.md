# Regola unica per modifiche concorrenti

Questa regola vale per qualunque operazione eseguita da due telefoni sullo stesso viaggio: profili, pubblicazioni, commenti, documenti, posizioni e spunte.

## Regola

**Lo stato confermato dal server prevale sempre sullo stato locale.**

- una creazione ritentata conserva la stessa chiave di idempotenza e non genera duplicati;
- una modifica è valida soltanto dopo la risposta positiva dell’API autorizzata;
- se due modifiche autorizzate raggiungono il server, D1 le ordina e resta visibile l’ultima scrittura confermata;
- una sostituzione di documento registra la nuova versione prima di eliminare il vecchio oggetto, evitando file mancanti o orfani;
- un errore, un timeout o una risposta incerta obbliga il client a rileggere il server: non può dichiarare riuscita la sola copia locale;
- una cancellazione autorizzata prevale sulle copie cache; sincronizzazione e contatore di versione le rimuovono dalle altre schede e dagli altri dispositivi;
- ruoli, proprietà e autorizzazioni sono derivati dalla sessione server, mai dai campi inviati dal browser.

## Conflitti previsti

| Caso | Risultato unico |
|---|---|
| Doppio tocco o retry della stessa creazione | Una sola risorsa, stessa risposta riprodotta |
| Due aggiornamenti autorizzati dello stesso dato | Ultima scrittura confermata dal server |
| Sostituzione concorrente di un documento | Una versione attiva, nessun oggetto privato orfano |
| Modifica da utente non proprietario | Diniego; lo stato server non cambia |
| Risposta di rete persa dopo il salvataggio | Rilettura server prima di mostrare errore definitivo |
| Dato locale in contrasto con ruolo/sessione | Ruolo e identità server sostituiscono i dati locali |

## Evidenze obbligatorie

La regola non si considera applicata per la sola presenza di questo documento. Devono restare verdi:

1. idempotenza delle creazioni e dei retry;
2. sostituzione concorrente dei documenti con pulizia dell’oggetto precedente;
3. identità, ruolo e proprietà ricavati lato server;
4. rilettura dello stato dopo esito incerto;
5. collaudo QA su due dispositivi isolati, senza scritture sul sito ufficiale.

