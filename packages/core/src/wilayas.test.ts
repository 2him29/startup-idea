import { test } from "node:test";
import assert from "node:assert/strict";
import { nameStatesWilaya } from "./wilayas.ts";

test("a hospital named after its wilaya says so", () => {
  assert.equal(nameStatesWilaya("CHU Frantz Fanon – Blida", "Blida"), true);
  assert.equal(nameStatesWilaya("CHU Oran – Dr Benzerdjeb", "Oran"), true);
  assert.equal(nameStatesWilaya("CHU Alger Centre", "Alger"), true);
});

test("a hospital that says nothing about where it is", () => {
  assert.equal(nameStatesWilaya("Clinique El Amel", "Blida"), false);
  assert.equal(nameStatesWilaya("EHS Maouche Mohand Amokrane – El Biar", "Alger"), false);
});

test("an adjective is not a place", () => {
  // The reason this is not `includes`. Suppressing the wilaya here would hide
  // it from every request in the capital.
  assert.equal(nameStatesWilaya("Croissant-Rouge Algérien", "Alger"), false);
  assert.equal(nameStatesWilaya("Clinique Algérienne", "Alger"), false);
  // But the same string with the actual wilaya appended does state it.
  assert.equal(nameStatesWilaya("Croissant-Rouge Algérien — Alger", "Alger"), true);
});

test("accents on either side do not matter", () => {
  assert.equal(nameStatesWilaya("EPH Bejaia", "Béjaïa"), true);
  assert.equal(nameStatesWilaya("EPH Béjaïa", "Bejaia"), true);
  assert.equal(nameStatesWilaya("Hôpital de Sétif", "Setif"), true);
});

test("multi-word wilayas match whole", () => {
  assert.equal(nameStatesWilaya("EPH Bordj Bou Arreridj", "Bordj Bou Arreridj"), true);
  assert.equal(nameStatesWilaya("EPH Bordj", "Bordj Bou Arreridj"), false);
});

test("missing either side is not a match", () => {
  assert.equal(nameStatesWilaya(null, "Blida"), false);
  assert.equal(nameStatesWilaya("CHU Blida", null), false);
  assert.equal(nameStatesWilaya("CHU Blida", "   "), false);
});
