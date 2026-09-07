# Modello di capacità Thailandia · 1.48.32

## Scenario prudenziale

- 18 viaggiatori con sessione personale;
- 18 familiari contemporanei, pari a un osservatore per viaggiatore;
- applicazione realmente visibile per 6 ore complessive al giorno per dispositivo;
- area privata Gruppo/Documenti aperta per 30 minuti complessivi al giorno per viaggiatore;
- sincronizzazione immediata all'apertura, al ritorno in primo piano e al ritorno online;
- sincronizzazione della bacheca autenticata ogni 7,5 secondi, pubblica ogni 15 secondi, cassaforte privata ogni 10 secondi soltanto mentre è montata la schermata Gruppo e verifica sessione ogni 60 secondi.

Il polling produce 61.560 richieste dei viaggiatori e 25.920 dei familiari: **87.480 richieste/giorno**. Restano oltre 12.000 richieste per aperture, pubblicazioni, commenti, reazioni, notifiche e download. Il test automatico impone inoltre un margine operativo minimo di 8.000 richieste.

La previsione non autorizza un numero illimitato di spettatori contemporanei. Se l'uso reale supera stabilmente questo scenario, il piano Workers Paid elimina il limite giornaliero delle richieste; l'eventuale passaggio di piano resta una decisione separata e non viene effettuato automaticamente.

## Limiti ufficiali verificati

- Workers Free e Pages Functions: 100.000 richieste al giorno: https://developers.cloudflare.com/workers/platform/limits/
- Workers KV Free: 100.000 letture, 1.000 scritture e 1 GB al giorno/account: https://developers.cloudflare.com/kv/platform/limits/
- D1 Free: 5 milioni di righe lette e 100.000 righe scritte al giorno: https://developers.cloudflare.com/workers/platform/pricing/#d1

## Invarianti

- le schede nascoste non eseguono polling;
- gli errori di rete non scollegano il viaggiatore;
- il ritorno online o in primo piano avvia subito una verifica, senza attendere l'intervallo;
- nessun dato, ruolo o autorizzazione viene modificato dalla riduzione del polling.
