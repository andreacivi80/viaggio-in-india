# Baseline migrazioni D1 · 5 agosto 2026

Prima dell'intervento sono stati verificati su QA e produzione:

- tutte le 10 tabelle introdotte dalle migrazioni;
- tutte le colonne aggiunte a profili, commenti, post, sessioni e notifiche;
- tutti i 21 trigger `sync_*`;
- conteggi dei dati reali di produzione.

La produzione considerava pendenti `0010_profile_gender.sql` e `0014_realtime_sync_triggers.sql`, benché i loro effetti fossero già presenti. La QA possedeva lo schema completo ma il registro `d1_migrations` era vuoto. Per evitare la riesecuzione di SQL già applicato è stato riallineato soltanto il registro ufficiale delle migrazioni.

Backup di produzione precedente all'intervento:

- file: `C:\Users\utente38\Desktop\Manuale\Viaggio India\backups\pre-migration-baseline-1.37.19-2026-08-05.sql`
- dimensione: 133543 byte
- SHA-256: `FF6250E975CDFFCE1A8722A19F37A563C495EEDC20CD81D51CF60B4B74146573`

Confronto dati produzione prima/dopo:

| Tabella | Prima | Dopo |
|---|---:|---:|
| Profili | 4 | 4 |
| Post | 1 | 1 |
| Documenti | 2 | 2 |
| Commenti | 0 | 0 |
| Posizioni | 0 | 0 |

Verifica finale: Wrangler riporta `No migrations to apply` sia per QA sia per produzione; `/api/health` risponde correttamente.
