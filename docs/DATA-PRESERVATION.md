# Garanzia di conservazione dei dati

Gli aggiornamenti dell'applicazione non devono cancellare, sostituire o ricreare i dati inseriti dai viaggiatori.

Regole bloccanti per ogni rilascio:

1. creare e verificare un backup D1 prima di ogni migrazione di produzione;
2. usare migrazioni additive e numerate, mai reset del database;
3. vietare `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` e cancellazioni sulle tabelle dei dati reali;
4. permettere aggiornamenti massivi dei dati reali solo con una clausola `WHERE` esplicita e una procedura dedicata;
5. eseguire i collaudi con identificativi `qa-*` univoci;
6. eliminare esclusivamente i record creati dal singolo collaudo;
7. verificare il ripristino del backup in un database vuoto;
8. confrontare versione sorgente, Service Worker e versione pubblicata dopo il deploy.

Le tabelle protette includono profili, post, media, commenti, reazioni, documenti e posizioni. Le revisioni dell'interfaccia e delle API devono rimanere compatibili con i record creati dalle versioni precedenti.
