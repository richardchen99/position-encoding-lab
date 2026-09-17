# Position Encoding Lab

An interactive research lab by **Richard Chen · 中国人民大学 / Renmin University of China**.

[Live lab](https://richardchen99.github.io/position-encoding-lab/) · [Personal research](https://richardchen99.github.io)

同一组内容向量如何因为位置而改变 attention？用 Sinusoidal、RoPE、ALiBi 三种可计算机制并排回答。

## Experiments

- **Geometry of position**：逐步观察原始向量 → 位置变换 → 点积与缩放 → softmax，维度对、频率基底和 ALiBi 斜率可调。
- **Controlled context shift**：同时移动 Query / Key 的绝对位置，比较相同相对距离下的点积误差。
- **Side-by-side attention**：同一因果窗口内的三个注意力分布同步更新。
- **Numerical trace**：展示 8 维向量的每个分量，使用 KaTeX 渲染推导。

两个句子示例将 `it → animal` 与 `it → report` 放在不同距离。点击词可选择 Key；词仅提供直观背景，内容向量固定，未训练指代关系。

## Try this

1. 保持 RoPE，点击 Play 完成四个阶段。
2. 移动 **Shift both positions**，向量旋转，但位置得分的平移误差接近浮点精度。
3. 切换 Sinusoidal 再执行步骤。相加后的内容 / 位置交叉项使得严格平移不变性一般不成立。
4. 切换 ALiBi，调高 **Head slope**，观察更远的历史位置得到更大的负偏置。

## Mathematical scope

RoPE 按相邻维度对旋转：

$$
(R_mq)^\top(R_nk)=q^\top R_{n-m}k.
$$

ALiBi 在因果窗口中加入线性偏置：

$$
s_{mn}=\frac{q_m^\top k_n}{\sqrt{d_k}}-a_h(m-n),\quad n\leq m.
$$

Sinusoidal 实验采用固定 8 维内容向量、位置相加以及恒等 Q/K 投影，隔离位置机制。真实 Transformer 使用可学习投影。RoPE / ALiBi 的机制特性不能直接证明真实模型的长上下文性能。

## Run locally

Use Node.js **24** (supported minimum: 22.12).

```bash
npm ci
npm run dev -- --host 127.0.0.1
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

## Implementation

- `src/model.ts`：位置向量、二维旋转、注意力分数与稳定 softmax。
- `src/App.tsx`：交互状态、示例、SVG 几何与数值视图。
- `src/shared.tsx` / `src/style.css`：浅色玻璃面板、Framer Motion 动画、KaTeX、键盘可访问控件及 reduced-motion 支持。
- `tests/model.test.mjs`：旋转范数 / 相对位置恒等式、平移不变性、概率归一化。

所有计算在浏览器本地完成，无模型 API 或密钥。`npm test` 用 TypeScript 编译模型后运行 Node test runner；`npm run build` 进行类型检查并构建静态站点。

`.github/workflows/deploy.yml` 在 `main` 推送后使用 Node 24 执行测试与构建，通过 GitHub Pages Actions 发布。首次部署需将仓库 Pages source 设为 GitHub Actions。

## Research series

[Transformer Architecture Lab](https://richardchen99.github.io/transformer-architecture-lab/) ·
[LLM Inference Lab](https://richardchen99.github.io/llm-inference-lab/) ·
[Tokenizer Playground](https://richardchen99.github.io/tokenizer-playground/) ·
[LLM RL Lab](https://richardchen99.github.io/llm-rl-lab/)

## Sources

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)
- [Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409)
