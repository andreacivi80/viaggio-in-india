# Stati di accesso — 1.31.0

| Stato | Etichetta | Possibilità | Transizione sicura |
|---|---|---|---|
| Nessuna password, nessuna sessione | Pubblico | Consultazione pubblica; identità Ospite per interagire | Password comune oppure invito personale |
| Password comune valida, nessuna sessione | Gruppo | Nessun privilegio personale; Pubblica resta bloccato | Aprire il proprio invito personale |
| Profilo locale, nessuna sessione valida | Telefono non collegato | Nessuna impersonificazione automatica | Nuovo invito personale |
| Ospite valido | Nome Ospite | Commenti e reazioni sui contenuti visibili | Scadenza, logout ospite o invito personale |
| Viaggiatore valido | Nome Viaggiatore | Funzioni personali e del gruppo previste dalla matrice | Logout, revoca, scadenza |
| Coordinatore valido | Nome Coordinatore | Coordinamento previsto dalla matrice | Logout, revoca, scadenza o cambio ruolo server |
| Sessione scaduta | Sessione scaduta | Nessuna funzione privata; bozze locali conservate | Nuovo invito personale |
| Sessione revocata | Dispositivo revocato | Nessuna funzione privata | Nuovo invito personale autorizzato |
| Token locale sconosciuto | Pubblico | Token rimosso; nessun recupero da `profile_id` locale | Invito personale |
| Password locale cambiata sul server | Accesso da verificare | Nessun aumento di privilegi | Reinserire la password per le sole funzioni non personali |

Precedenza: **sessione server valida → ruolo server → profilo server → dati locali di sola presentazione**. La password comune non può sostituire nessuno dei primi tre livelli.
