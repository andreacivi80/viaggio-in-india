# Collaudo revisione 1.31.0

Data: 4 agosto 2026  
Ambiente verificato: `https://63b53987.viaggio-in-india-2026.pages.dev`

La revisione 1.31.0 rimane in anteprima: non sostituisce ancora la versione pubblica finché i controlli di accettazione prioritari non sono conclusi.

## Esito eseguito

- suite mobile Playwright: 17/17 scenari superati in 8/8 blocchi;
- test server autenticati e di carico: 20/20 applicabili superati;
- test separati antispam e rate limiting: 2/2 superati;
- test unitari, sicurezza locale e smoke: 23/23 applicabili superati;
- compilazione di produzione: riuscita;
- profili tecnici residui dopo il collaudo: 0.

## Copertura delle checklist di usabilità

- checklist principale: 197/730;
- terzo addendum credenziali e autorizzazioni: 134/482;
- totale consolidato: 331/1212, pari al 27,3%.

Le righe sono segnate come superate soltanto quando esiste un riscontro automatico o remoto specifico. I controlli non ancora eseguiti restano `pending` e non vengono conteggiati come riusciti.

## Difetti trovati e corretti durante il collaudo

- modale di pubblicazione coperta dalla barra inferiore;
- salvataggio del nome visitatore con testi lunghi;
- autorizzazioni di eliminazione derivate dal client anziché dal server;
- campi e chiavi interne presenti nella risposta pubblica;
- Service Worker bloccato dalla Content Security Policy;
- aggiornamento del Service Worker durante upload o consultazione di una sezione;
- anteprima PDF protetta lasciata su una pagina vuota;
- griglia documenti del coordinatore non aggiornata in tempo reale;
- runner QA che non dichiarava il fallimento della pulizia remota.
- schede persone con nomi lunghi che allargavano la griglia e rendevano incerta l'area di tocco.
- identità e comandi personali visibili durante la verifica di una sessione memorizzata;
- dati locali del precedente utente non rimossi dopo il rifiuto o la chiusura della sessione.
- identità Ospite precedente che poteva riapparire dopo il logout personale.
- cache locale autenticata che poteva mostrare per un istante profili o post privati dopo il logout.

## Funzioni verificate da utente finale

- invito personale, persistenza della sessione e pubblicazione senza nuova password;
- tutte le 14 giornate e tutte le ricollocazioni della mappa;
- commenti, modifica, eliminazione, like e sincronizzazione su tre telefoni;
- caricamento e riproducibilità di foto, video con audio e WAV;
- limite di dieci allegati e rifiuto dell'undicesimo;
- PDF reale: caricamento, apertura, download, annullamento ed eliminazione;
- dashboard coordinatore con aggiornamento 1/4 → 0/4 su un altro telefono;
- GPS consentito e negato, marker sulla cartina dell'India, Google Maps, Naviga, cancellazione e sincronizzazione;
- protezione della vista pubblica da documenti, posizioni e comandi riservati;
- creazione e modifica profilo, cambio ruolo, invito personale e propagazione dei permessi su tre telefoni;
- idempotenza, firme reali dei file, file camuffati, upload a parti, sessioni scadute, inviti monouso, revoca dispositivo, richieste concorrenti, antispam e rate limiting.
