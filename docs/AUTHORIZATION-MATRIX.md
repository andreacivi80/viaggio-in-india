# Matrice autorizzativa unica — 1.31.0

Questa matrice è il contratto comune di interfaccia, API e test. La password comune `india26` non identifica una persona e non aumenta i privilegi. Per scrivere come Viaggiatore o Coordinatore serve sempre una sessione personale ottenuta da un invito monouso.

Legenda: **Sì**, **No**, **Proprietario**, **Approvazione** (serve consenso esplicito), **N/A**.

| Operazione | Pubblico | Familiare con password | Ospite autenticato | Viaggiatore proprietario | Viaggiatore non proprietario | Coordinatore | Scaduta | Revocata |
|---|---|---|---|---|---|---|---|---|
| Visualizzare contenuti | Solo pubblici | Solo pubblici | Pubblici + Familiari | Pubblici + Familiari + Gruppo + propri privati | Pubblici + Familiari + Gruppo | Contenuti del gruppo | Solo pubblici | Solo pubblici |
| Creare contenuti | No | No | No | Sì | Sì | Sì | No | No |
| Modificare contenuti | No | No | No | Proprietario | Proprietario | Moderazione | No | No |
| Eliminare contenuti | No | No | No | Proprietario | Proprietario | Moderazione | No | No |
| Condividere contenuti | Solo pubblici | Solo pubblici | Contenuti visibili | Contenuti visibili | Contenuti visibili | Contenuti visibili | Solo pubblici | Solo pubblici |
| Commentare | Dopo identità Ospite | Dopo identità Ospite | Sì, sui contenuti visibili | Sì, sui contenuti visibili | Sì, sui contenuti visibili | Sì, sui contenuti visibili | Dopo nuova identità Ospite | Dopo nuova identità Ospite |
| Reagire | Dopo identità Ospite | Dopo identità Ospite | Sì, sui contenuti visibili | Sì, sui contenuti visibili | Sì, sui contenuti visibili | Sì, sui contenuti visibili | Dopo nuova identità Ospite | Dopo nuova identità Ospite |
| Gestire profilo | No | No | No | Proprietario | Proprietario | Tutti i profili | No | No |
| Gestire inviti | No | No | No | No | No | Sì | No | No |
| Gestire documenti | No | No | No | Proprietario | Proprietario | Coordinamento | No | No |
| Gestire posizione | No | No | No | Proprietario + approvazione GPS | Proprietario + approvazione GPS | Coordinamento | No | No |
| Attivare notifiche | Approvazione | Approvazione | Approvazione | Approvazione | Approvazione | Approvazione | Approvazione pubblica | Approvazione pubblica |
| Moderare | No | No | No | No | No | Sì | No | No |
| Visualizzare log | No | No | No | No | No | Solo log non sensibili | No | No |
| Revocare dispositivi | No | No | No | Propri dispositivi | Propri dispositivi | Propri dispositivi | No | No |

Regole inderogabili:

- l’identità e il ruolo restituiti dal server prevalgono sempre su nome, ruolo e `profile_id` locali;
- una password comune non può creare una sessione personale o scegliere un profilo;
- una sessione scaduta, revocata o sconosciuta viene rimossa dal dispositivo;
- l’interfaccia non deve mostrare come utilizzabile un comando che l’API rifiuterà sistematicamente;
- il server verifica ruolo e proprietà anche se la richiesta viene costruita manualmente.
