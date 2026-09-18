# Position Encoding Lab

**See how position becomes geometry.**

An interactive comparison of **Sinusoidal embeddings, RoPE, and ALiBi** under the same content vectors and causal window. Rotate a vector, shift a context, change a slope—and inspect exactly what happens to the attention score.

[**Open the lab ↗**](https://richardchen99.github.io/position-encoding-lab/) · [Research note · 中文](https://richardchen99.github.io/blog/position-encoding-lab-note/) · [中文 README](README.zh-CN.md) · [Quick start](#quick-start)

Created by **Richard Chen · Renmin University of China / 中国人民大学** · [Homepage](https://richardchen99.github.io)

[![Position Encoding Lab showing rotary geometry, token selection, and attention comparison](docs/assets/overview.jpg)](https://richardchen99.github.io/position-encoding-lab/)

*Real application capture: vector geometry, numerical traces, and attention distributions share one experiment state.*

## Three mechanisms, one controlled experiment

| Mechanism | Intervention | What to inspect |
| --- | --- | --- |
| **Sinusoidal** | Add position vectors to fixed content | Content–position cross terms and the effect of moving the origin |
| **RoPE** | Rotate adjacent dimension pairs | Preserved vector norms and relative-position dot products |
| **ALiBi** | Subtract a distance-dependent score bias | How a head slope changes preference for recent keys |
| **Shared comparison** | Shift Query and Key together | Which scores remain unchanged at a fixed relative distance |

Step through **content → position transform → score → softmax**, choose a dimension pair, and compare all three distributions side by side. Short and long sentence examples provide an intuitive frame; the fixed content vectors do not represent learned coreference. The interface uses English controls and Chinese explanations.

## Experimental framework

![Framework for comparing additive positions, rotary geometry, and linear attention bias under shared inputs](docs/assets/architecture.png)

*Original schematic of the shared inputs, three mathematical branches, and numerical checks. [Editable SVG](docs/assets/architecture.svg) · [Figure provenance](docs/assets/README.md).*

## Try a translation-invariance test

1. Select **RoPE**, use the short example with Query 5 and Key 1, and finish the four playback stages.
2. Move **Shift both positions** from 0 to 24. The vectors rotate, while their relative-position score stays unchanged within floating-point precision.
3. Select **Sinusoidal** and repeat. The additive experiment generally changes because its content–position cross terms depend on the origin.
4. Select **ALiBi**, then increase **Head slope**. Distant causal keys receive a larger negative bias; shifting both positions preserves their distance.

In the captured RoPE state, the displayed shift error is **zero**. This is a check of the implemented identity at display precision, not a long-context quality benchmark.

<details>
<summary><strong>Inspect the shift test and attention comparison</strong></summary>

![RoPE with Query 5, Key 1, shared position shift 24, and zero displayed score error](docs/assets/shift.jpg)

*Common translation changes absolute angles while preserving the relative-position score.*

![Three attention distributions for the long sentence example with Query 11 and Key 2](docs/assets/comparison.jpg)

*The longer example compares the three mechanisms under the same causal window.*

</details>

## Mathematical scope

RoPE applies a rotation to each adjacent dimension pair. With fixed frequencies:

$$
(R_mq)^\top(R_nk)=q^\top R_{n-m}k.
$$

ALiBi adds a linear penalty to causal attention scores:

$$
s_{mn}=\frac{q_m^\top k_n}{\sqrt{d_k}}-a_h(m-n),\quad n\leq m.
$$

The Sinusoidal branch uses **fixed eight-dimensional content vectors, additive positions, and identity Q/K projections** to isolate the mechanism. Learned projections and trained model behavior are outside this experiment. The common-translation properties of RoPE and ALiBi do not establish extrapolation quality in a real language model.

## Quick start

Use **Node.js 24**; the supported minimum is 22.12.

```bash
git clone https://github.com/richardchen99/position-encoding-lab.git
cd position-encoding-lab
npm ci
npm run dev -- --host 127.0.0.1
```

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

All experiment calculations run in the browser; no model service, API key, or GPU is required. Built with React 19, TypeScript, Vite, Framer Motion, and KaTeX.

## Implementation and verification

| Entry point | Responsibility |
| --- | --- |
| [`src/model.ts`](src/model.ts) | Position vectors, rotations, score biases, and stable softmax |
| [`src/App.tsx`](src/App.tsx) | Experiment state, token selection, geometry, and numerical views |
| [`src/shared.tsx`](src/shared.tsx) · [`src/style.css`](src/style.css) | Formulas, animation, glass panels, and reduced-motion support |
| [`tests/model.test.mjs`](tests/model.test.mjs) | Norm preservation, relative-position identity, ALiBi invariance, and normalization |

`npm test` compiles the model and runs the Node test runner. The [Pages workflow](.github/workflows/deploy.yml) tests, type-checks, builds, and deploys `main` using Node 24. For a fork, select **GitHub Actions** as the Pages source.

## Reading and citation

- Vaswani et al. [*Attention Is All You Need*](https://arxiv.org/abs/1706.03762), 2017 — sinusoidal positional encoding.
- Su et al. [*RoFormer: Enhanced Transformer with Rotary Position Embedding*](https://arxiv.org/abs/2104.09864), 2021 preprint — rotary position geometry.
- Press et al. [*Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation*](https://arxiv.org/abs/2108.12409), 2021 preprint — ALiBi.
- [Project research note](https://richardchen99.github.io/blog/position-encoding-lab-note/) — the experiment explained in Chinese.

For teaching or writing, link to this repository and record the commit used. [CITATION.cff](CITATION.cff) provides machine-readable software attribution.

## Explore the series

| Lab | Central question |
| --- | --- |
| [Tokenizer Playground](https://github.com/richardchen99/tokenizer-playground) | How does a corpus become a reusable vocabulary? |
| [Transformer Architecture Lab](https://github.com/richardchen99/transformer-architecture-lab) | How does attention turn token representations into context? |
| **Position Encoding Lab** | How does position change attention geometry? |
| [LLM Inference Lab](https://github.com/richardchen99/llm-inference-lab) | When can past computation be reused? |
| [LLM RL Lab](https://github.com/richardchen99/llm-rl-lab) | How does reward change a response distribution? |

Found it useful? A star helps others discover the series. Contributions that add well-specified mechanisms or stronger numerical checks are welcome.
