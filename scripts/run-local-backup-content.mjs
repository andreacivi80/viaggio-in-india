import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const temporaryRoot = mkdtempSync(join(tmpdir(), "thailand-backup-content-"));
const persistRoot = join(temporaryRoot, "persist");
const setupPath = join(temporaryRoot, "setup.sql");
const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
const port = await new Promise((resolvePort, rejectPort) => {
  const probe = createServer();
  probe.unref();
  probe.once("error", rejectPort);
  probe.listen(0, "127.0.0.1", () => {
    const address = probe.address();
    probe.close((error) => error ? rejectPort(error) : resolvePort(address.port));
  });
});
const baseUrl = `http://127.0.0.1:${port}`;
const python = process.argv.find((item) => item.startsWith("--python="))?.slice(9) || "";
if (!python) throw new Error("Specificare --python=<percorso interprete>");
const profileId = `qa-local-owner-${randomUUID()}`;
const inviteToken = randomBytes(32).toString("hex");
let token = "";
const deviceKey = randomBytes(32).toString("hex");
const digest = (value) => createHash("sha256").update(value).digest("hex");
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const created = new Date().toISOString();
const expires = new Date(Date.now() + 30 * 86400000).toISOString();

writeFileSync(setupPath, `
INSERT INTO profiles(id,name,surname,role,created_at)
VALUES(${quote(profileId)},'Proprietario','QA locale','traveler',${quote(created)});
INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at)
VALUES(${quote(digest(inviteToken))},${quote(profileId)},NULL,${quote(created)},${quote(expires)},NULL);
`, "utf8");

function runNode(args, environment = process.env) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env: environment,
    encoding: "utf8",
    windowsHide: true,
    shell: false,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Comando locale non riuscito (${result.status})\n${result.stdout || ""}${result.stderr || ""}`);
}

const wrangler = (...args) => runNode([npxCli, "--yes", "wrangler@4.118.0", ...args]);
let server;
let succeeded = false;
try {
  wrangler("d1", "migrations", "apply", "viaggio-in-india-db", "--local", "--config", "wrangler.jsonc", "--persist-to", persistRoot);
  wrangler("d1", "execute", "viaggio-in-india-db", "--local", "--config", "wrangler.jsonc", "--persist-to", persistRoot, "--file", setupPath);

  server = spawn(process.execPath, [
    npxCli, "--yes", "wrangler@4.118.0", "pages", "dev", "dist",
    "--port", String(port), "--persist-to", persistRoot,
  ], {
    cwd: root,
    env: process.env,
    windowsHide: true,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverOutput = "";
  let serverError;
  server.stdout.on("data", (chunk) => { serverOutput += chunk; });
  server.stderr.on("data", (chunk) => { serverOutput += chunk; });
  server.once("error", (error) => { serverError = error; });

  let ready = false;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error(`Server locale terminato: ${serverOutput}`);
    try {
      const response = await fetch(`${baseUrl}/api/state`, { cache: "no-store" });
      if (response.ok) { ready = true; break; }
    } catch { /* attesa avvio */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  if (!ready) throw new Error(`Server locale non pronto: ${serverOutput}`);

  const claimResponse = await fetch(`${baseUrl}/api/auth/claim`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-device-key": deviceKey,
      "x-device-name": "Telefono QA locale",
    },
    body: JSON.stringify({ invite_token: inviteToken }),
  });
  const claimBody = await claimResponse.json().catch(() => ({}));
  if (!claimResponse.ok || !claimBody.token)
    throw new Error(`Creazione sessione locale non riuscita: HTTP ${claimResponse.status} ${JSON.stringify(claimBody)}`);
  token = claimBody.token;

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { authorization: `Bearer ${token}`, "x-device-key": deviceKey },
    cache: "no-store",
  });
  if (!sessionResponse.ok) {
    const publicState = await fetch(`${baseUrl}/api/state`, { cache: "no-store" }).then((response) => response.json());
    throw new Error(
      `Sessione locale non riconosciuta: HTTP ${sessionResponse.status} ${await sessionResponse.text()} `
      + `profili=${JSON.stringify(publicState.profiles?.map((profile) => profile.id) || [])} server=${serverOutput}`,
    );
  }

  runNode([join(root, "tests", "extended-p0-backup-content.mjs")], {
    ...process.env,
    TEST_BASE_URL: baseUrl,
    QA_SESSION_TOKEN: token,
    QA_PROFILE_ID: profileId,
    QA_OWNER_DEVICE_KEY: deviceKey,
    QA_LOCAL_PERSIST_ROOT: persistRoot,
    QA_PYTHON_EXE: python,
  });
  succeeded = true;
} finally {
  if (server && server.exitCode === null) {
    const taskkill = join(process.env.SystemRoot || "C:\\Windows", "System32", "taskkill.exe");
    const stopped = spawnSync(taskkill, ["/PID", String(server.pid), "/T", "/F"], {
      windowsHide: true,
      shell: false,
      encoding: "utf8",
    });
    if (stopped.status !== 0 && server.exitCode === null) server.kill();
    await Promise.race([
      new Promise((resolveClose) => server.once("close", resolveClose)),
      new Promise((resolveWait) => setTimeout(resolveWait, 5000)),
    ]);
  }
  let removed = false;
  for (let attempt = 0; attempt < 80 && !removed; attempt += 1) {
    try {
      rmSync(temporaryRoot, { recursive: true, force: true });
      removed = true;
    } catch (error) {
      if (attempt === 79) throw error;
      await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    }
  }
}
if (succeeded) console.log("LOCAL_BACKUP_CONTENT_COMPLETE=1/1");
