# pi-study

面向 Agent 爱好者的中文学习工程：沿《动手学 Pi》的 15 个 checkpoint 重建核心概念，用离线实验验证，再回到 [Earendil Works Pi 官方源码](https://github.com/earendil-works/pi) 理解真实实现。社区教材和课程由 Chunhao Zhang / hahhforest 维护，本项目不代表官方。

初学者从七步轨迹开始，学习消息、模型流、工具与反馈循环；有开发经验的读者可先运行官方 API 实验，再追踪状态、会话、压缩和扩展。建议具备 JavaScript、命令行与 Git 基础；TypeScript 的联合类型、Promise 和 ESM 会在 checkpoint 01 中补齐。

目标是解释并验证一次请求的执行过程，随后增加工具或替换模型边界。课程实现是教学协议，不是官方 SDK 的直接替代品。

## 从这里开始

要求：Git、可用的 `tar`（生成练习使用）、Node.js **22.19+** 或 **24 LTS**、随 Node 安装的 npm。命令默认从仓库根目录执行，PowerShell、bash 均可使用。阅读教材正文不需要启动教材网站。

```powershell
git clone --recurse-submodules https://github.com/jinbo0906/pi-study.git
cd pi-study
# 已有克隆若未初始化子模块，运行：
git submodule update --init --recursive

npm ci --ignore-scripts --prefix pi-practice-00
npm run check:practice
npm run test:practice
npm run demo:practice
```

预期：类型检查成功，Checkpoint 00 的 **2 项测试通过**，demo 输出 `01`–`07` 七个事件，其中第 4 步 `tool_start` 的 owner 是 `loop`。这是固定 fixture，不调用模型或读取磁盘 README。详见 [练习指引](pi-practice-00/LEARNING.md) 和 [00 笔记](notes/00-prologue.md)。仓库已包含这份练习，继续使用即可。

## 接着验证真实 Agent Loop

```powershell
npm ci --ignore-scripts --prefix labs
npm run check:labs
npm run test:labs
npm run demo:labs
npm --prefix labs run demo -- parallel
npm --prefix labs run demo -- truncated
```

实验运行官方 `Agent`、`Models` 和 Faux Provider，以内存工具产生真实回执。正常路径输出 `requests=2 executed=1 idle=true`；并发完成事件是 `call_2 → call_1`，模型历史仍是 `call_1 → call_2`；截断实验输出 `executed=0` 和错误回执。无需密钥，不发出模型网络请求，不产生模型费用。配置、测试和扩展练习见 [labs/README.md](labs/README.md)。

## 推荐学习顺序

| 顺序 | 学习内容 | 入口与验收 |
| --- | --- | --- |
| 1 | 定位与完整反馈闭环 | 本页 → [00 教材](pi-textbook/content/chapters/00-prologue.md) → 现有 practice；解释 owner 和 call/result 配对 |
| 2 | 消息与模型边界：01–05 | [学习计划](STUDY_PLAN.md) → 每章正文与独立练习；区分 partial、终态与 Provider 请求 |
| 3 | 工具、循环和状态：06–09 | 课程 → [官方离线实验](labs/README.md) → [源码指南](notes/source-guide.md)；跟踪第二次模型请求 |
| 4 | 会话与上下文：10–11 | 分支恢复、压缩课程实验 → SessionManager / compaction；区分历史与模型上下文 |
| 5 | 扩展与评测：12–14 | 资源、工具注册、Runtime、Eval；先加内存工具，再尝试官方扩展 |

“主题 → 课程实现 → 中文讲解 → 官方符号 → 差异”见 [源码指南](notes/source-guide.md)。[STUDY_PLAN.md](STUDY_PLAN.md) 保留作者进度，不代表新读者已经完成章节。

### 创建后续章节练习

先读 [01 教材](pi-textbook/content/chapters/01-typescript-survival.md) 并预测测试，再运行：

```powershell
node pi-course/packages/pi-course/scripts/checkpoint.mjs 01
npm run practice -- 01
npm ci --ignore-scripts --prefix pi-practice-01
npm --prefix pi-practice-01 run build
node --test pi-practice-01/packages/pi-course/dist/test/01-*.test.js
```

`practice` 调用固定课程生成器，再精简导出的环境；不改 starter 和测试，目录已存在时拒绝覆盖。00 是观察型 target；01–14 由 parent、目标测试及必要 starter 构成，首次失败通常是待实现的学习起点，应按 `LEARNING.md` 定位。替换章编号即可继续。先自己实现，再用 `git -C pi-course diff <parent> <target> -- packages/pi-course` 对照答案。

## 目录与版本

| 路径 | 用途 | 固定依据 |
| --- | --- | --- |
| `pi/` | 官方源码对照 | [`a69bef789`](https://github.com/earendil-works/pi/tree/a69bef789bc95abf0acee16f7b4660b70b650bb9)，包声明 `0.84.2` |
| `pi-course/` | 15 章累积课程历史 | [`fe8b8699`](https://github.com/hahhforest/pi/tree/fe8b8699b6bef90a3e1347214488c9ef191d56b9)，`@pi/course@0.0.1` |
| `pi-textbook/` | 《动手学 Pi》中文教材 | [`20dd3a7d`](https://github.com/hahhforest/pi-textbook/tree/20dd3a7d791c2470a87c5172aa0729c3963a6b18) |
| `pi-practice-00/` | 课程观察练习 | target `f9798b7`，保留原始 fixture 与测试 |
| `labs/` | 官方 npm API 离线实验 | ai / agent-core / telemetry 锁定 `0.84.2` |
| `notes/` | 章节记录与源码对照 | [索引](notes/README.md) |
| `scripts/`、`.github/` | 练习生成、文本检查、CI | [贡献说明](CONTRIBUTING.md) |

子模块跟踪分支只是来源提示，实际使用根仓库提交的 SHA，初始化不会升级到最新主干。课程起点 `8479bd84` 是官方 `0.80.6`。npm `v0.84.2` 发布提交为 [`914cf147`](https://github.com/earendil-works/pi/tree/914cf1472e715297caa30db4b9535d534a9eb718)；固定源码含其后的未发版改动。核心循环、Models、Faux、EventStream 在两提交之间一致，coding-agent 讲解以 `a69bef789` 为准。

## 维护检查与排查

两个可执行目录安装依赖后，从根目录运行：

```powershell
npm run check
npm test
```

检查主仓库文本格式、Markdown 相对链接和锚点、疑似密钥与个人路径、子模块引用、教材 15 个 checkpoint 与 Git 历史，以及类型和离线测试。CI 在 Linux / Windows、Node 22 / 24 上运行学习检查；外部网站与真实 Provider 不由离线 CI 保证。

| 现象 | 排查方法 |
| --- | --- |
| 子模块目录空、教材链接不存在 | `git submodule update --init --recursive`，再 `npm run check:versions` |
| `tsc` 不存在 | 对应目录运行 `npm ci --ignore-scripts --prefix <目录>`；根目录没有安装依赖 |
| `practice` 报目录已存在 | 继续已有练习，保留尚未完成的学习成果 |
| 新章节构建或测试失败 | 先读 `LEARNING.md`、starter 与聚焦测试，区分教学起点与环境错误 |
| PowerShell 中文乱码 | Windows PowerShell 5.1 用 `Get-Content -Encoding UTF8`；推荐 PowerShell 7 |
| 上游整仓库 build/check 缺包或原生依赖 | 本工程用根目录学习检查；上游完整 monorepo 有独立环境要求 |
| 08 / 12 章的 Bash 或符号链接测试在 Windows 失败 | 完整课程建议在 Linux / WSL2 运行；当前 Windows target 基线为 116/120，详见维护记录 |

实际证据与未验证项见 [维护记录](notes/maintenance.md)。后续优先自己完成 01–09，再开展会话与扩展实验；不声称已验证全部上游测试。版本升级与贡献流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 来源与实验边界

本仓库原创材料采用 [MIT](LICENSE)。官方与课程代码沿用各自 MIT；教材正文和原创媒体采用 [CC BY 4.0](pi-textbook/LICENSE-CONTENT)，作者为 Chunhao Zhang。子模块保留原授权；源码指南重新组织精读内容并注明来源，不复制私人笔记全文。

默认使用离线模型。真实 Pi 的工具具有进程用户权限，应在练习目录与受控范围内实验；不要提交 `.env`、API Key、`auth.json`、`.pi/` 或会话 JSONL。真实 Provider 和自动摘要可能产生服务费用，接入前按对应版本的官方文档配置。
