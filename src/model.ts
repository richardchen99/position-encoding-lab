export type Method = "sinusoidal" | "rope" | "alibi";
export const dot = (a: number[], b: number[]) =>
  a.reduce((s, v, i) => s + v * b[i], 0);
export function softmax(x: number[]) {
  const e = x.map((v) => Math.exp(v - Math.max(...x)));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}
export function positionVector(pos: number, dim: number, base = 10000) {
  return Array.from({ length: dim }, (_, i) =>
    i % 2
      ? Math.cos(pos / base ** ((i - 1) / dim))
      : Math.sin(pos / base ** (i / dim)),
  );
}
export function rotate(v: number[], pos: number, base = 10000) {
  return v.map((x, i) => {
    const pair = i - (i % 2),
      angle = pos / base ** (pair / v.length);
    return i % 2
      ? v[pair] * Math.sin(angle) + x * Math.cos(angle)
      : x * Math.cos(angle) - v[i + 1] * Math.sin(angle);
  });
}
export function inspect(
  method: Method,
  m: number,
  n: number,
  base: number,
  slope: number,
) {
  const q = [1, 0.4, 0.7, -0.2, 0.3, 0.6, -0.4, 0.8],
    k = [0.6, 0.8, 0.2, 0.9, -0.3, 0.4, 0.5, -0.1];
  const raw = dot(q, k) / Math.sqrt(q.length);
  if (method === "rope") {
    const qr = rotate(q, m, base),
      kr = rotate(k, n, base);
    return {
      q: qr,
      k: kr,
      raw,
      bias: 0,
      score: dot(qr, kr) / Math.sqrt(q.length),
    };
  }
  if (method === "alibi")
    return {
      q,
      k,
      raw,
      bias: -slope * Math.abs(m - n),
      score: raw - slope * Math.abs(m - n),
    };
  const qp = positionVector(m, q.length, base),
    kp = positionVector(n, k.length, base);
  const qr = q.map((v, i) => v + qp[i]),
    kr = k.map((v, i) => v + kp[i]);
  return {
    q: qr,
    k: kr,
    raw,
    bias: 0,
    score: dot(qr, kr) / Math.sqrt(q.length),
  };
}
export function weights(
  method: Method,
  query: number,
  positions: number[],
  base: number,
  slope: number,
) {
  return softmax(
    positions.map((n) => inspect(method, query, n, base, slope).score),
  );
}
