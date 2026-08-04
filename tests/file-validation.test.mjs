import test from "node:test";
import assert from "node:assert/strict";
import { validateFileBytes } from "../functions/_lib/fileValidation.js";

test("accetta firme reali dei principali formati del telefono", () => {
  const fixtures = [
    [new Uint8Array([0xff, 0xd8, 0xff, 0xdb]), "image/jpeg", "foto.jpg", "post"],
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png", "foto.png", "post"],
    [new TextEncoder().encode("%PDF-1.7\n"), "application/pdf", "passaporto.pdf", "document"],
    [new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70]), "video/mp4", "video.mp4", "post"],
    [new TextEncoder().encode("ID3audio"), "audio/mpeg", "audio.mp3", "post"],
  ];
  for (const fixture of fixtures) assert.equal(validateFileBytes(...fixture), true);
});

test("blocca SVG, HTML ed eseguibili anche se rinominati come foto", () => {
  const attacks = [
    [new TextEncoder().encode("<svg onload=alert(1)></svg>"), "image/png", "foto.png"],
    [new TextEncoder().encode("<!doctype html><script>alert(1)</script>"), "image/jpeg", "foto.jpg"],
    [new Uint8Array([0x4d, 0x5a, 0x90, 0]), "image/jpeg", "foto.jpg"],
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47]), "image/png", "foto.svg"],
  ];
  for (const attack of attacks)
    assert.throws(() => validateFileBytes(...attack, "post"), /sicuro|pericoloso|corrisponde/);
});

test("blocca un MIME falso quando la firma non corrisponde", () => {
  assert.throws(
    () => validateFileBytes(new TextEncoder().encode("non una foto"), "image/jpeg", "foto.jpg", "post"),
    /non corrisponde/,
  );
});
