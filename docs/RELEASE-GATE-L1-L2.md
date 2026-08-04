# Vincolo permanente di rilascio

Questa regola vale per **ogni revisione**, senza eccezioni.

1. Il **Livello 1** completo deve passare: accesso pubblico e privato, identità e ruoli, pubblicazione, privacy, documenti, navigazione primaria, dati persistenti e assenza di regressioni bloccanti.
2. Il **Livello 2** deve essere definito per la modifica specifica e deve riprodurre l’uso reale con touch sui profili mobili interessati.
3. Il Livello 2 deve includere ripetizioni, casi limite e controllo visivo, non soltanto verifiche del codice.
4. Se un controllo L1 o L2 fallisce, la revisione **non si pubblica**.
5. Una revisione si dichiara pubblicata soltanto dopo verifica della versione sul dominio stabile.

## Livello 2 della revisione 1.37.13

- 18 viaggiatori presenti.
- Foto dei viaggiatori da 36 px, circa una volta e mezza rispetto alla revisione precedente.
- Righe dell’elenco rapido comprese tra 40 e 46 px, con testo e chiocciola ancora compatti.
- `@nome` visibile accanto al nome, senza uscire dalla scheda.
- Quattro scorrimenti touch consecutivi nell’elenco rapido.
- Quattro scorrimenti touch consecutivi in “Gruppo · Facce, nomi e storie”.
- Ultima persona raggiungibile in entrambi gli elenchi.
- La pagina sottostante non scorre durante il gesto nel pannello.
- Chiusura del pannello sempre funzionante.
- Controllo visivo su viewport Samsung S20 FE.
