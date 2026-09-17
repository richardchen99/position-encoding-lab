import test from "node:test";
import assert from "node:assert/strict";
import { model as m } from "../scripts/load-model.mjs";
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} vs ${b}`);
test("RoPE preserves norm and uses only relative displacement", () => {
  const q = [1, 0.4, 0.7, -0.2, 0.3, 0.6, -0.4, 0.8],
    k = [0.6, 0.8, 0.2, 0.9, -0.3, 0.4, 0.5, -0.1];
  for (const base of [1000, 10000, 20000])
    for (const pos of [0, 1, 15, 900]) {
      close(m.dot(m.rotate(q, pos, base), m.rotate(q, pos, base)), m.dot(q, q));
      close(
        m.dot(m.rotate(q, pos, base), m.rotate(k, pos + 3, base)),
        m.dot(q, m.rotate(k, 3, base)),
      );
    }
});
test("ALiBi is translation invariant and penalizes distant equal-content keys", () => {
  const near = m.inspect("alibi", 5, 4, 10000, 0.25),
    far = m.inspect("alibi", 5, 1, 10000, 0.25);
  close(near.score - far.score, 0.75);
  close(far.score, m.inspect("alibi", 45, 41, 10000, 0.25).score);
});
test("All compared attention rows normalize; PE origin alternates zero/one", () => {
  assert.deepEqual(m.positionVector(0, 8), [0, 1, 0, 1, 0, 1, 0, 1]);
  for (const method of ["sinusoidal", "rope", "alibi"]) {
    const row = m.weights(method, 7, [0, 1, 2, 3, 4, 5, 6, 7], 10000, 0.5);
    close(
      row.reduce((a, b) => a + b, 0),
      1,
    );
    assert.ok(row.every((v) => v >= 0 && v <= 1));
  }
});
