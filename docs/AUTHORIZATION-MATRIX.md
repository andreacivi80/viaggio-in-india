# Matrice autorizzativa verificata

Questa matrice descrive i controlli applicati dal server. La grafica non concede mai privilegi: ogni richiesta viene rivalidata dall’API usando una sessione personale o una sessione ospite.

| Operazione | Pubblico | Familiare / ospite | Viaggiatore | Proprietario | Coordinatore |
|---|---:|---:|---:|---:|---:|
| Vedere post pubblico | Sì | Sì | Sì | Sì | Sì |
| Vedere post familiari | No | Sì | Sì | Sì | Sì |
| Vedere post del gruppo | No | No | Sì | Sì | Sì |
| Vedere un post privato | No | No | No | Solo il proprio | Solo se proprietario |
| Commentare o reagire | Serve identità ospite/personale | Sì, se vede il post | Sì, se vede il post | Sì | Sì |
| Pubblicare | No | No | Sì | Sì | Sì |
| Modificare profilo | No | No | Solo il proprio | Sì | Tutti |
| Creare profili e inviti | No | No | No | No | Sì |
| Vedere documenti | No | No | Solo i propri | Sì | Tutti |
| Caricare/sostituire/eliminare documenti | No | No | Solo i propri | Sì | Solo i propri |
| Verificare documenti altrui | No | No | No | No | Sì |
| Vedere le posizioni del gruppo | No | No | Sì | Sì | Sì |
| Aggiornare/eliminare posizione | No | No | Solo la propria | Sì | Solo la propria |
| Inviare notifica globale di prova | No | No | No | No | Sì |

## Regole non negoziabili

- La password comune verifica soltanto l’ingresso al flusso di registrazione: non identifica una persona e non autorizza operazioni private.
- Un profilo esistente si collega con un invito personale monouso; l’endpoint storico di sblocco non crea sessioni.
- La sessione personale è legata a una chiave casuale del dispositivo: copiare il solo token in un altro browser o telefono restituisce 401.
- Anche la sessione familiare è legata alla chiave del dispositivo: se il token viene copiato, il server ignora l’identità ospite e mostra soltanto il contenuto pubblico.
- Il rinnovo ruota atomicamente il token: il telefono conserva solo quello nuovo e quello precedente viene respinto immediatamente.
- Il server ricava nome, profilo e ruolo dalla sessione: valori dichiarati dal browser non possono impersonare altri viaggiatori.
- Il consenso privacy è esplicito nelle nuove registrazioni; data e versione del consenso non vengono esposte nello stato condiviso.
- I test con scritture accettano soltanto localhost o il dominio QA e rifiutano sempre il dominio ufficiale.

Evidenza automatica principale: `extended-p0-authorization-matrix.mjs`, eseguita su un database D1 e uno storage temporanei con pulizia finale.
