# Revisione 1.33.1 — rilascio bloccato

La produzione non è autorizzata alla condivisione finché questi percorsi non
sono stati eseguiti integralmente sul QA:

1. Telefono nuovo: Gruppo mostra obbligatoriamente la password.
2. Telefono con vecchio `india-group-code`: il valore viene eliminato e non
   concede accesso.
3. Password corretta: non viene conservata e non crea un'identità personale.
4. Riapertura senza sessione personale: la password viene richiesta di nuovo.
5. Visitatore: vede e interagisce con i contenuti pubblici, ma non pubblica,
   elimina, gestisce posizioni o apre documenti.
6. Invito personale valido: crea una sessione revocabile e collega soltanto il
   profilo previsto.
7. Viaggiatore: pubblica e gestisce soltanto i propri dati.
8. Coordinatore: gestisce il gruppo e vede la griglia documentale.
9. Logout o revoca: rimuove immediatamente tutti i privilegi.
10. Aggiornamento dell'app: non ripristina password, ruoli o sessioni revocate.

La parola “Gruppo” può apparire come stato di accesso soltanto dopo la conferma
server di una sessione personale valida.
