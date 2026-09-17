# Procedura di rollback

Questa procedura si applica a ogni revisione dell'app Thailandia Insieme. Il rollback dell'applicazione e il ripristino dei dati sono due operazioni distinte: tornare al codice precedente non deve mai riscrivere o cancellare il database.

## Obiettivi misurabili

- **RTO applicazione:** ripristino della revisione precedente entro 15 minuti dalla decisione.
- **RTO dati:** ripristino verificato entro 30 minuti quando è coinvolto D1.
- **RPO dati:** zero per una migrazione pianificata, perché l'export D1 verificato è obbligatorio immediatamente prima della migrazione; per un guasto esterno vale l'ultimo backup verificato disponibile.
- La persona autorizzata al rollback è il responsabile del rilascio con accesso al progetto Cloudflare e ai backup. Nessun viaggiatore o visitatore può avviarlo dall'app.

## Prima di ogni rilascio

1. Annotare commit, versione, URL immutabile della revisione attiva e conteggi delle tabelle protette.
2. Eseguire un export D1 prima di qualsiasi migrazione e conservarne percorso, ora, dimensione e SHA-256.
3. Verificare l'export con `scripts/verify-d1-backup.py`: import in un database vuoto, `PRAGMA integrity_check`, tabelle richieste, relazioni e conteggi.
4. Pubblicare prima in QA, eseguire L1/L2 e conservare l'URL immutabile superato.
5. Procedere in produzione soltanto con migrazioni additive e compatibili con la revisione precedente.

## Rollback dell'applicazione

1. Bloccare nuovi deploy, senza eliminare la revisione difettosa né alterare D1 o R2.
2. Ripartire dall'ultimo commit e URL immutabile che hanno superato L1/L2.
3. Ricostruire quel commit e pubblicarne gli stessi artefatti sul progetto di produzione usando la procedura Node senza shell intermedia.
4. Verificare che dominio, bundle, Service Worker e `/api/health` espongano la versione ripristinata.
5. Eseguire due smoke test consecutivi. Controllare accesso, pubblicazione, documenti, posizione e dati già presenti.
6. Registrare ora di inizio, ora di ripristino e durata effettiva; se supera 15 minuti aprire un incidente P0.

## Rollback dei dati

Si esegue soltanto se una migrazione ha modificato dati o schema in modo incompatibile. Una regressione soltanto grafica o applicativa non autorizza il ripristino del database.

1. Sospendere le scritture e creare un secondo export dello stato difettoso per analisi e recupero delle eventuali scritture successive.
2. Verificare nuovamente checksum e ripristinabilità del backup precedente alla migrazione.
3. Importare il backup in un database D1 di ripristino vuoto; non usare `DROP`, `TRUNCATE`, reset o una migrazione inversa distruttiva sul database attivo.
4. Eseguire controllo di integrità, conteggi, relazioni, apertura dei documenti e confronto delle chiavi media.
5. Collegare il Worker al database verificato solo dopo l'approvazione del responsabile del rilascio.
6. Rieseguire L1/L2 e due smoke test; riabilitare le scritture solo a esito positivo.
7. Registrare durata effettiva e scostamento dall'obiettivo di 30 minuti.

## Criteri di riuscita

Il rollback è concluso soltanto quando la versione attesa è stabile sul dominio, due smoke test consecutivi passano, i conteggi protetti coincidono con il backup scelto, i documenti sono apribili, non esistono file orfani e le sessioni sono valide oppure revocate in modo esplicito e controllato. In caso contrario il sistema resta in stato di incidente e non viene dichiarato ripristinato.
