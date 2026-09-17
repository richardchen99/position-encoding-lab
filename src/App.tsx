import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shell,
  Panel,
  Formula,
  Tabs,
  Range,
  Stat,
  Bars,
  Tokens,
  Note,
  Transport,
  usePlayback,
} from "./shared";
import { inspect, positionVector, weights, type Method } from "./model";

const methods = [
  { id: "sinusoidal", label: "Sinusoidal" },
  { id: "rope", label: "RoPE" },
  { id: "alibi", label: "ALiBi" },
];
const stories = {
  sinusoidal: [
    "Add a coordinate",
    "正弦位置向量与 token embedding 相加，位置进入表示。这里用恒等投影，单独观察位置项如何改变点积；真实模型会继续做可学习的 Q/K 投影。",
  ],
  rope: [
    "Rotate, then compare",
    "RoPE 按维度对旋转 Query 和 Key。两个位置一起平移时，旋转角的差不变，所以它们的点积只依赖相对距离。Value 通常不做这项旋转。",
  ],
  alibi: [
    "Bias the attention score",
    "ALiBi 保留 Q/K 向量，直接给 attention logits 加距离惩罚。距离越大，偏置越负；不同 head 使用不同斜率。下方主实验仅允许读取当前位置及历史位置。",
  ],
};
const formulas = {
  sinusoidal: String.raw`x_p=e_p+PE_p,\quad PE_{p,2i}=\sin(p/b^{2i/d}),\quad PE_{p,2i+1}=\cos(p/b^{2i/d})`,
  rope: String.raw`(R_mq)^\top(R_nk)=q^\top R_{n-m}k`,
  alibi: String.raw`s_{mn}=\frac{q_m^\top k_n}{\sqrt{d_k}}-a_h(m-n),\quad n\le m`,
};
const labels = [
  "Content vectors",
  "Position transform",
  "Dot product + scale",
  "Normalize attention",
];
const examples = {
  short: [
    "The",
    "animal",
    "did",
    "not",
    "move;",
    "it",
    "was",
    "tired",
    "after",
    "walking",
    "through",
    "the",
    "quiet",
    "park",
    "all",
    "day.",
  ],
  long: [
    "The",
    "annual",
    "report",
    "described",
    "a",
    "new",
    "model",
    "for",
    "financial",
    "risk",
    "and",
    "it",
    "informed",
    "the",
    "final",
    "decision.",
  ],
};
export default function App() {
  const [method, setMethod] = useState<Method>("rope"),
    [query, setQuery] = useState(5),
    [key, setKey] = useState(1),
    [shift, setShift] = useState(0),
    [pair, setPair] = useState(0),
    [base, setBase] = useState(10000),
    [slope, setSlope] = useState(0.25),
    [example, setExample] = useState<"short" | "long">("short");
  const play = usePlayback(3, `${method}|${example}`),
    m = query + shift,
    n = key + shift;
  const words = examples[example];
  const values = inspect(method, m, n, base, slope),
    initial = inspect("alibi", m, n, base, 0),
    shown = play.step >= 1 ? values : initial;
  const p = Array.from({ length: query + 1 }, (_, i) => i + shift),
    distribution = weights(method, m, p, base, slope);
  const circlePoint = (v: number[]) => ({
    x: 155 + v[pair * 2] * 75,
    y: 150 - v[pair * 2 + 1] * 75,
  });
  const qPoint = circlePoint(shown.q),
    kPoint = circlePoint(shown.k);
  const shiftDelta = Math.abs(
    values.score - inspect(method, query, key, base, slope).score,
  );
  return (
    <Shell
      slug="position-encoding-lab"
      title="Position Encoding Lab"
      subtitle="同样的词，换一个位置会发生什么？转动一对向量、改变相对距离，观察位置怎样进入注意力。"
      sources={[
        ["Attention Is All You Need", "https://arxiv.org/abs/1706.03762"],
        [
          "RoFormer · Rotary Position Embedding",
          "https://arxiv.org/abs/2104.09864",
        ],
        ["Train Short, Test Long · ALiBi", "https://arxiv.org/abs/2108.12409"],
      ]}
    >
      <div className="grid">
        <Panel title={stories[method][0]} eyebrow="01 / GEOMETRY OF POSITION">
          <Tabs
            options={methods}
            value={method}
            onChange={(v) => setMethod(v as Method)}
            label="Position method"
          />
          <div className="grid equal">
            <div>
              <svg
                className="diagram"
                viewBox="0 0 310 300"
                role="img"
                aria-label="Query and Key vector geometry"
              >
                <defs>
                  <radialGradient id="orbit">
                    <stop stopColor="#faf0dc" />
                    <stop offset="1" stopColor="#f8fbfd" />
                  </radialGradient>
                  <marker
                    id="arrow"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6" fill="#6fa8dc" />
                  </marker>
                </defs>
                <circle cx="155" cy="150" r="122" fill="url(#orbit)" />
                <circle
                  cx="155"
                  cy="150"
                  r="90"
                  fill="none"
                  stroke="#c8a96a50"
                  strokeDasharray="3 6"
                />
                <path d="M30 150 H280 M155 25 V275" stroke="#1d273313" />
                <motion.line
                  x1="155"
                  y1="150"
                  animate={{ x2: qPoint.x, y2: qPoint.y }}
                  stroke="#6fa8dc"
                  strokeWidth="3"
                  markerEnd="url(#arrow)"
                />
                <motion.line
                  x1="155"
                  y1="150"
                  animate={{ x2: kPoint.x, y2: kPoint.y }}
                  stroke="#b8934f"
                  strokeWidth="3"
                />
                <motion.circle
                  animate={{ cx: qPoint.x, cy: qPoint.y }}
                  r="6"
                  fill="#6fa8dc"
                />
                <motion.circle
                  animate={{ cx: kPoint.x, cy: kPoint.y }}
                  r="6"
                  fill="#b8934f"
                />
                <text x="20" y="290">
                  Q · position {m}
                </text>
                <text x="185" y="290">
                  K · position {n}
                </text>
              </svg>
              <div className="legend">
                <span>
                  <i />
                  Query
                </span>
                <span>
                  <i />
                  Key
                </span>
              </div>
            </div>
            <div className="stack">
              <Note>{stories[method][1]}</Note>
              <Range
                label="Dimension pair"
                min={0}
                max={3}
                value={pair}
                onChange={setPair}
              />
              <div className="stats">
                <Stat label="RELATIVE DISTANCE" value={m - n} />
                <Stat
                  label="POSITION SCORE"
                  value={play.step >= 2 ? values.score.toFixed(3) : "—"}
                />
              </div>
            </div>
          </div>
          <Formula tex={formulas[method]} />
          <Transport {...play} labels={labels} />
        </Panel>
        <Panel title="Move the context" eyebrow="02 / CONTROLLED EXPERIMENT">
          <div className="stack">
            <label className="field">
              Example
              <select
                value={example}
                onChange={(e) => {
                  setExample(e.target.value as "short" | "long");
                  setQuery(e.target.value === "long" ? 11 : 5);
                  setKey(e.target.value === "long" ? 2 : 1);
                  setShift(0);
                }}
              >
                <option value="short">Pronoun · it reads animal</option>
                <option value="long">Long context · it reads report</option>
              </select>
            </label>
            <Range
              label="Query position"
              min={1}
              max={15}
              value={query}
              onChange={(v) => {
                setQuery(v);
                setKey((k) => Math.min(k, v));
              }}
            />
            <Range
              label="Key position"
              min={0}
              max={query}
              value={key}
              onChange={setKey}
            />
            <Range
              label="Shift both positions"
              min={0}
              max={40}
              value={shift}
              onChange={setShift}
            />
            {method === "alibi" ? (
              <Range
                label="Head slope"
                min={0.0625}
                max={1}
                step={0.0625}
                value={slope}
                onChange={setSlope}
              />
            ) : (
              <Range
                label="Frequency base"
                min={1000}
                max={20000}
                step={1000}
                value={base}
                onChange={setBase}
              />
            )}
          </div>
          <div className="callout">
            <p className="miniTitle">
              Query “{words[query]}” → Key “{words[key]}”
            </p>
            <Tokens
              tokens={words.slice(0, query + 1)}
              active={key}
              onSelect={setKey}
              label="Key token in context"
            />
            <Note>
              点击词切换
              Key。单词切分与内容向量固定，用来隔离位置因素；模型未训练指代关系。
            </Note>
          </div>
          <div className="stats">
            <Stat
              label="SHIFT ERROR"
              value={shiftDelta.toExponential(1)}
              detail="相同内容向量，位置同时平移"
            />
            <Stat
              label={method === "alibi" ? "DISTANCE BIAS" : "PAIR FREQUENCY"}
              value={
                method === "alibi"
                  ? values.bias.toFixed(3)
                  : (1 / base ** ((pair * 2) / 8)).toFixed(4)
              }
            />
          </div>
          <Note>
            这里固定内容向量，隔离位置因素。RoPE 与 ALiBi
            的平移误差应接近零；正弦编码与内容相加后一般不具备这种严格不变性。
          </Note>
        </Panel>
      </div>
      <Panel title="Three views, one attention row" eyebrow="03 / SIDE-BY-SIDE">
        <Note>
          相同的 Query / Key
          内容、相同的因果窗口，三个方法并排计算。距离变化会重排分布；这不等于已经学会指代关系。
        </Note>
        <div className="grid three" style={{ marginTop: 20 }}>
          {methods.map((o) => (
            <div className="stack" key={o.id}>
              <h3>{o.label}</h3>
              <Bars
                items={weights(o.id as Method, m, p, base, slope).map(
                  (w, i) => ({
                    label: `${p[i]} · ${words[i]}`,
                    value: play.step >= 3 ? w : 0,
                    active: i === key,
                    display: play.step >= 3 ? `${(100 * w).toFixed(1)}%` : "—",
                  }),
                )}
              />
            </div>
          ))}
        </div>
        <div className="stats">
          <Stat
            label="ACTIVE ROW SUM"
            value={
              play.step >= 3
                ? distribution.reduce((a, b) => a + b, 0).toFixed(6)
                : "—"
            }
          />
          <Stat label="CAUSAL WINDOW" value={`${p.length} tokens`} />
        </div>
      </Panel>
      <Panel title="Inspect the transform" eyebrow="04 / NUMERICAL TRACE">
        <Tokens
          tokens={Array.from({ length: 4 }, (_, i) => `Pair ${i}`)}
          active={pair}
          onSelect={setPair}
          label="Inspect dimension pair"
        />
        <div className="grid equal" style={{ marginTop: 20 }}>
          <Bars
            signed
            items={shown.q.map((v, i) => ({ label: `Q [${i}]`, value: v }))}
          />
          <Bars
            signed
            items={(method === "sinusoidal"
              ? positionVector(m, 8, base)
              : shown.k
            ).map((v, i) => ({
              label: `${method === "sinusoidal" ? "PE" : "K"} [${i}]`,
              value: v,
            }))}
          />
        </div>
        <div className="callout">
          <h3>Where extrapolation gets difficult</h3>
          <Note>
            RoPE
            的相位在远距离可能进入训练中未充分见过的范围，改变频率基底也不能保证模型长文本性能。ALiBi
            的线性偏置天然偏好近处，但不意味着远处信息永远无用。此实验比较机制，不代替真实模型评测。
          </Note>
        </div>
      </Panel>
    </Shell>
  );
}
