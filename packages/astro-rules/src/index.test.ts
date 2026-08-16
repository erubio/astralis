import assert from "node:assert/strict";
import test from "node:test";
import { findAspect } from "./index.js";

test("distingue una conjunción de una oposición", () => {
  assert.equal(findAspect("sun", 10, "moon", 10)?.name, "conjunction");
  assert.equal(findAspect("sun", 10, "moon", 190)?.name, "opposition");
});
