# Collaudo revisione 1.25.0

- Data: 3 agosto 2026
- Ambiente: Cloudflare Pages preview
- URL: `https://codex-v1-25-visibility.viaggio-in-india-2026.pages.dev`
- Operatori simulati: pubblico, familiare con identità ospite, viaggiatore, coordinatore
- Dati: esclusivamente contenuti di collaudo

## Esiti automatici

Il comando `npm test` ha completato 6 test, 0 errori e 1 prova di abuso esclusa dalla suite ordinaria. La prova antispam separata ha completato 7 test su 7.

Sono stati verificati dominio, revisione, Service Worker, presenza della mappa Liberty, assenza della password nel bundle, intestazioni di sicurezza, minimizzazione dei profili pubblici, blocco di documenti e posizioni, identità ospite server, commenti/reazioni non falsificabili e API health.

## Matrice di visibilità

| Contenuto | Pubblico | Familiare | Viaggiatore | Autore |
|---|---:|---:|---:|---:|
| Pubblico | OK | OK | OK | OK |
| Familiari | KO | OK | OK | OK |
| Solo gruppo | KO | KO | OK | OK |
| Solo io | KO | KO | KO | OK |

La stessa matrice è stata verificata sia per il record del post sia per l’URL diretto del file. Gli accessi negati hanno restituito HTTP 403.

È stato inoltre caricato un allegato in un commento `Familiari`: accesso pubblico HTTP 403 e accesso con identità familiare HTTP 200.

## Prove di autorizzazione

- Invito personale: prima apertura HTTP 200, riuso HTTP 403.
- Commento di un familiare su un post `Solo io`: HTTP 403.
- Reazione di un familiare su un post `Solo gruppo`: HTTP 403.
- Tentativo di modificare il commento di un altro ospite: HTTP 403.
- Undicesimo tentativo di accesso errato in un minuto: HTTP 429.
- Logout: token valido prima, HTTP 401 dopo la revoca.

## Dati di prova conservati

- Post pubblico: `25c732de-fd74-498a-a8bf-e96679357283`
- Post familiari: `937d4081-f774-4c85-b977-6df57b5d6cae`
- Post gruppo: `b1753909-8777-4adf-bfc9-fb87bd1d121d`
- Post solo autore: `77b4c493-e479-4338-abb8-d17ca9436267`

## Backup

È stato creato e verificato tramite SHA-256 l’export D1 successivo alla migrazione. Il backup precedente alla migrazione 1.25.0 non è considerato valido perché il download ha subito un’interruzione di rete; rimane disponibile il backup valido precedente alla 1.24.0.

## Prove ancora fisiche

Notifiche su schermo bloccato, installazione PWA iPhone/Android, permessi di sistema, rotazione, telefonata, batteria, rete indiana e prove di durata richiedono dispositivi reali e non sono segnate come superate.
