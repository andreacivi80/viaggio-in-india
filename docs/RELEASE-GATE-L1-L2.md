# Vincolo permanente di rilascio

Questa regola vale per **ogni revisione**, senza eccezioni.

1. Il **Livello 1** completo deve passare: accesso pubblico e privato, identità e ruoli, pubblicazione, privacy, documenti, navigazione primaria, dati persistenti e assenza di regressioni bloccanti.
2. Il **Livello 2** deve essere definito per la modifica specifica e deve riprodurre l’uso reale con touch sui profili mobili interessati.
3. Il Livello 2 deve includere ripetizioni, casi limite e controllo visivo, non soltanto verifiche del codice.
4. Se un controllo L1 o L2 fallisce, la revisione **non si pubblica**.
5. Una revisione si dichiara pubblicata soltanto dopo verifica della versione sul dominio stabile.

## Livello 2 della revisione 1.37.14

- 18 viaggiatori presenti.
- Cinque hotel reali associati alle giornate corrette di Udaipur, Jodhpur, Jaipur, Agra e Varanasi.
- Nome, indirizzo e contatto presenti nel diario senza sovrapposizioni su Samsung S20 FE.
- Un punto hotel visibile sulla cartina per ogni giornata con alloggio.
- La linea giornaliera parte o arriva all’hotel e l’inquadratura include tutti i punti della giornata.
- Nella cartina completa sono presenti tutti gli hotel senza perdere le otto tappe numerate.
- `@nome` visibile accanto al nome, senza uscire dalla scheda.
- Quattro scorrimenti touch consecutivi nell’elenco rapido.
- Quattro scorrimenti touch consecutivi in “Gruppo · Facce, nomi e storie”.
- Ultima persona raggiungibile in entrambi gli elenchi.
- La pagina sottostante non scorre durante il gesto nel pannello.
- Chiusura del pannello sempre funzionante.
- Controllo visivo su viewport Samsung S20 FE.

## Livello 2 della revisione 1.37.15

- Conteggio di appoggi e pernottamenti verificato per tutte le 14 giornate.
- Rockland ripetuto nella seconda giornata di Delhi.
- Taj Vilas e Costa River indicati anche come appoggio prima dei treni notturni.
- Notti Agra–Varanasi e Varanasi–Delhi identificate separatamente come pernottamento in treno.
- Zoom touch più stretto e leggibile per tratte locali fino a 40 km.
- Hotel, città e percorso restano tutti dentro l'inquadratura sui due profili Samsung.
- Regressione completa Livello 1 obbligatoria prima della pubblicazione.

## Livello 2 della revisione 1.37.16

- Mappa generale priva di icone hotel.
- Otto tappe numerate e linee del percorso generale invariate.
- Hotel ancora visibile nel dettaglio di ogni giornata interessata.
- Zoom e ricentratura giornalieri invariati.

## Livello 2 della revisione 1.37.17

- Inquadratura calcolata su percorso, tappe numerate e punto hotel del dettaglio.
- Tutti i marker devono restare interamente dentro la mappa dopo ogni animazione.
- Verifica consecutiva delle 14 giornate su viewport mobile reale.
- Vista generale ancora priva di icone hotel.

## Livello 2 della revisione 1.37.18

- Livello 1 completo superato: 109/109.
- Un solo scorrimento naturale della pagina nella sezione Gruppo, senza contenitori concorrenti.
- Tre persone sempre visibili dopo 20 passaggi Bacheca/Viaggio/Gruppo su Samsung S20 FE, Samsung meno recente e iPhone piccolo.
- Diciotto persone raggiungibili tramite touch, con ordine, colori, ruoli, `@nome` e chiusura invariati.
- Dieci PDF appartenenti a dieci persone aperti dal coordinatore nel visualizzatore mobile con ritorno all'app.
- Audio e video arrestati quando l'app passa in background.
- Percorsi, hotel, zoom e marker verificati nelle quattordici giornate; nessun marker fuori mappa.
- Meteo e ora India leggibili senza sovrapposizioni nelle quattordici giornate.
- Bacheca utilizzabile su rete mobile lenta e moduli pesanti caricati solo quando servono.
- Dopo una prima visita, la bacheca pubblica si riapre senza rete senza esporre dati privati.
- Service worker con precache generata a ogni build e registrazione immediata.

## Livello 2 della revisione 1.37.19

- Livello 1 completo superato: 109/109.
- Età e lavoro mostrati soltanto quando sono presenti nei dati condivisi del profilo.
- Riga compatta composta da ruolo, città, età e lavoro senza campi vuoti.
- Diciotto viaggiatori verificati su Samsung S20 FE, Samsung meno recente e iPhone piccolo.
- Nessuna uscita orizzontale dai bordi; ordine, colori, scorrimento e chiusura invariati.
