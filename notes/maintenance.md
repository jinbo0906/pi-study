# 维护审计与验证记录

日期：2026-09-30。开始时根仓库 main 和远程 main 均为 `4f48825`，工作区干净，origin 为 `jinbo0906/pi-study`。官方、课程和教材子模块已按原固定提交初始化，本次没有升级或修改其受 Git 跟踪的内容。

## 审计结论与处置

| 学习问题 | 实际证据 | 处置 |
| --- | --- | --- |
| 新读者无法直接开始 | README 让读者在已存在的 00 目录再次生成，官方脚本拒绝覆盖 | README 改为直接安装和运行现有练习 |
| 隔离练习仍有整仓库命令和依赖 | 导出只包含课程包，根 build/check 却引用 tui、ai 与不存在的维护脚本 | 简化 workspace 和锁文件，只保留 TypeScript / Node 类型 |
| 只有静态轨迹，难以验证核心循环 | 00 的 runPrologueDemo 克隆固定数组，不执行模型和工具 | 新增锁定官方 npm API 的离线实验及行为测试 |
| 后续生成练习重复继承环境问题 | 固定 practice.mjs 从 parent 导出上游 package.json/lock | 本地 wrapper 保留生成的源码、starter 与测试，只精简环境并补 MIT 来源 |
| 个人笔记缺少公共入口和精确版本 | 四份资料可读取；固定官方包声明与笔记均为 0.84.2，但非同一发布快照 | 整理源码指南、固定链接与差异说明，不复制私人原文 |
| 缺少持续验证 | 根仓库没有 package scripts 或 CI | 添加零依赖文本检查、checkpoint 历史核验和 Windows/Linux CI |

学习映射和源码证据见 [source-guide.md](source-guide.md)。四份输入为《项目解读.md》《ai 包源码精读.md》《agent 包源码精读.md》《coding-agent 包源码精读.md》；课程和教材来源由原 README / .gitmodules 定位。MIT 和教材 CC BY 4.0 均已核对原授权。

## 资料差异

固定官方源码 `a69bef789` 的包声明为 0.84.2，npm 发布和 tag 是 `914cf147`；API / coding-agent 有发布后的差异，不能混用。课程从官方 0.80.6 的 `8479bd84` 出发，自己的协议不等同于 SDK。实验相关 Agent、loop、types、Models、Faux、EventStream、validation 文件已比对，发布版与固定源码相同。

主要订正：流事件不全含 partial；beforeToolCall 返回值负责阻断/终止，扩展可原地修改已校验 input，但不会再次自动校验；prepareNextTurn 在 turn_end 后刷新；agent_end 与应用层 agent_settled 不同；内存会话与延迟首次写出不能解释为断电零丢失；agent 对 ai 还有 EventStream / validateToolArguments 的运行时依赖。

## 本地实际验证

环境为 Windows、PowerShell 7、Node `24.13.1`、npm `11.8.0`。以下结果来自本次运行，不沿用历史日志中的测试证据。

| 命令（仓库根目录） | 结果 |
| --- | --- |
| `git submodule update --init --recursive` | 三个固定提交成功检出 |
| `npm ci --ignore-scripts --prefix pi-practice-00` | 安装成功，4 packages |
| `npm ci --ignore-scripts --prefix labs` | 安装成功，95 packages；不执行生命周期脚本 |
| `npm run check:versions` | 三个引用一致，15 个 checkpoint 的提交、parent、主题和测试路径与教材一致 |
| `npm run check:practice`、`npm run test:practice`、`npm run demo:practice` | 类型与构建通过；2/2 测试通过；七行 fixture 轨迹 |
| `npm run check:labs`、`npm run test:labs` | 类型与构建通过；9/9 行为测试通过 |
| `npm run demo:labs`；labs 的 parallel / truncated / invalid-args demo | 正常 2 请求/1 执行；并发完成序与历史序不同；截断及缺参 0 执行并反馈错误 |
| `npm run test:docs` | 3/3，通过断链、锚点、格式与敏感信息负例 |
| `npm run check`、`npm test` | 根目录统一检查通过；共 14/14 离线测试通过 |
| `npm run check:docs`、`git diff --check` | 最终 34 个主仓库文本文件无问题；相对链接、格式与疑似敏感内容检查通过 |

生成流程另实跑 `npm run practice -- 01` 和 `npm ci --ignore-scripts --prefix pi-practice-01`，均成功；导出的 01 测试 blob 与课程 target 相同。首次 build 报缺少待实现的 `src/survival/events`，属于该章 parent 起点，未填入答案或把失败记作通过。测试用目录在验证后清理，正式学习时按 README 重新生成。

完整课程 target 使用已安装的轻量 TypeScript 环境运行：

```powershell
node pi-practice-00/node_modules/typescript/bin/tsc -p pi-course/packages/pi-course/tsconfig.json --typeRoots pi-practice-00/node_modules/@types
node --test pi-course/packages/pi-course/dist/test/*.test.js
```

类型检查通过；Windows **116/120** 测试通过。4 个失败为 08 的 workspace 符号链接、Bash 输出与超时/取消，以及 12 的 Skill 符号链接逃逸：当前账户创建 symlink 报 EPERM，Windows cmd 没有测试使用的 printf，进程终止结果也与 POSIX 不同。它们不是本次修改导致的问题。本次保留固定课程，不弱化其断言；08/12 的完整实验建议用 Linux / WSL2。CI 额外在 Linux 跑完整 target，以独立验证这些路径。

## 检查范围与后续

最终 diff 已审阅，未包含密钥、个人路径、缓存、dist 或临时练习。检查器不扫描缓存、dist 或子模块全文，外部固定源码链接通过本地 Git 对象核对；在线教材地址仅为上游来源，不依赖网站实时内容。CI 的远程结果以 GitHub Actions 为准，未完成的 job 不能记作通过。

尚未调用真实 Provider、未运行官方整仓库测试或教材网站构建、未实跑 coding-agent 会话/压缩/扩展。默认实验没有密钥或模型费用。下一步优先自己完成 01–09 重建，再在 Linux 实验 08/12，最后补持久化与 compaction 的最小验证。
