import assert from "node:assert/strict";
import test from "node:test";
import { findAspect } from "./index.js";

test("distingue una conjunción de una oposición", () => {
  assert.equal(findAspect("sun", 10, "moon", 10)?.name, "conjunction");
  assert.equal(findAspect("sun", 10, "moon", 190)?.name, "opposition");
});

test("reconoce los aspectos menores habituales con orbes conservadores", () => {
  assert.equal(findAspect("sun", 0, "moon", 30)?.name, "semi-sextile");
  assert.equal(findAspect("sun", 0, "moon", 45)?.name, "semi-square");
  assert.equal(findAspect("sun", 0, "moon", 72)?.name, "quintile");
  assert.equal(findAspect("sun", 0, "moon", 135)?.name, "sesquisquare");
  assert.equal(findAspect("sun", 0, "moon", 144)?.name, "biquintile");
  assert.equal(findAspect("sun", 0, "moon", 150)?.name, "quincunx");
  assert.equal(findAspect("sun", 0, "moon", 33), undefined);
});
