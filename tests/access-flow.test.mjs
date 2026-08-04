import test from "node:test";
import assert from "node:assert/strict";
import {
  publicationAccessStep,
  publicationEntryState,
} from "../src/accessFlow.js";

test("Pubblica usa la sessione personale gia memorizzata senza chiedere la password", () => {
  const state = publicationEntryState({
    sessionToken: "sessione-valida",
    groupCode: "codice-gia-verificato",
    selectedDay: 3,
  });

  assert.equal(state.publicPreview, false);
  assert.equal(state.composeOpen, true);
  assert.equal(state.selectedDay, 3);
  assert.equal(state.step, "composer");
});

test("dopo la password Pubblica richiede il link personale senza impersonare nomi", () => {
  assert.equal(
    publicationAccessStep({ groupCode: "codice-verificato", sessionToken: "" }),
    "personal-link",
  );
});

test("solo un dispositivo mai sbloccato vede la richiesta password", () => {
  assert.equal(publicationAccessStep({ groupCode: "", sessionToken: "" }), "password");
});
