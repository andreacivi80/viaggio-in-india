import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la matrice autorizzativa documenta tutti i ruoli e le risorse sensibili", async () => {
  const matrix = await readFile(new URL("../docs/AUTHORIZATION-MATRIX.md", import.meta.url), "utf8");
  for (const role of ["Pubblico", "Familiare / ospite", "Viaggiatore", "Proprietario", "Coordinatore"])
    assert.match(matrix, new RegExp(role.replace("/", "\\/")));
  for (const resource of ["post privato", "documenti", "posizioni", "notifica globale", "inviti"])
    assert.match(matrix, new RegExp(resource, "i"));
  assert.match(matrix, /password comune[\s\S]*non autorizza operazioni private/i);
  assert.match(matrix, /token scaduto[\s\S]*token alterato[\s\S]*401/i);
  assert.match(matrix, /Logout e revoca[\s\S]*nuovo invito[\s\S]*token differente/i);
  assert.match(matrix, /Cache-Control: no-store/i);
  assert.match(matrix, /extended-p0-access-session-boundaries\.mjs[\s\S]*17\/17/i);
  assert.match(matrix, /ui-role-live\.spec\.mjs[\s\S]*Galaxy S20 FE/i);
  assert.match(matrix, /sessione realmente scaduta[\s\S]*dati locali obsoleti/i);
  assert.match(matrix, /ui-location\.spec\.mjs[\s\S]*Galaxy S20 FE/i);
  assert.match(matrix, /diniego senza alcuna richiesta di scrittura[\s\S]*riattivato il permesso/i);
  assert.match(matrix, /ui-microphone-permissions\.spec\.mjs[\s\S]*Galaxy S20 FE/i);
  assert.match(matrix, /MediaRecorder[\s\S]*allegato audio riproducibile/i);
  assert.match(matrix, /ui-password-access\.spec\.mjs[\s\S]*Galaxy S20 FE/i);
  assert.match(matrix, /password[\s\S]*non crea da sola una sessione[\s\S]*refresh completo[\s\S]*risposta `201`/i);
  assert.match(matrix, /extended-p0-resource-enumeration\.mjs/i);
  assert.match(matrix, /risorse reali[\s\S]*identificativi casuali[\s\S]*stesso diniego/i);
  assert.match(matrix, /ui-coordinator-grid-access\.spec\.mjs[\s\S]*quattro browser Galaxy S20 FE/i);
  assert.match(matrix, /falsificando[\s\S]*role[\s\S]*profile_id[\s\S]*identità restituita dal server/i);
  assert.match(matrix, /non compaiano neppure temporaneamente/i);
  assert.match(matrix, /ui-invite-misdelivery\.spec\.mjs[\s\S]*sessione personale valida/i);
  assert.match(matrix, /invito non viene consumato[\s\S]*destinatario corretto/i);
  assert.match(matrix, /token[\s\S]*realmente scaduto[\s\S]*nuova sessione/i);
  assert.match(matrix, /ui-private-browser-session\.spec\.mjs[\s\S]*Galaxy S20 FE/i);
  assert.match(matrix, /nuovo contesto privato[\s\S]*torna Pubblico[\s\S]*401/i);
  assert.match(matrix, /copia dell.URL ripulito[\s\S]*non trasferisce[\s\S]*accesso permanente/i);
  assert.match(matrix, /ui-people\.spec\.mjs[\s\S]*creazione del profilo[\s\S]*modifica[\s\S]*apertura dei relativi documenti/i);
  assert.match(matrix, /contenuto gestito[\s\S]*non può diventare accidentalmente[\s\S]*identità attiva/i);
  assert.match(matrix, /ui-protected-pdf\.spec\.mjs[\s\S]*AES-256[\s\S]*PasswordException/i);
  assert.match(matrix, /non mostra pagine vuote[\s\S]*lettore PDF del telefono/i);
  assert.match(matrix, /vapid-secret-boundary\.test\.mjs[\s\S]*VAPID_PRIVATE_KEY[\s\S]*soltanto dal Worker/i);
  assert.match(matrix, /push\/config[\s\S]*esclusivamente `VAPID_PUBLIC_KEY`/i);
});
