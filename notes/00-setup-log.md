# Checkpoint 00：环境准备与命令记录

本页是 2026-08 的历史日志，保留当时环境和安装结果。2026-09 的维护已精简 practice 依赖并修复启动入口；新的读者按 [根 README](../README.md) 和 [当前维护记录](maintenance.md) 操作，不需要重新生成现有 00 练习。

## 记录信息

- 日期：2026-08-23
- Shell：PowerShell，Conda `base` 环境处于激活状态
- 课程仓库：`pi-course/`
- Practice 目录：`pi-practice-00/`
- Node.js：`v24.14.0`
- npm：`11.9.0`
- 结果：四条准备命令及 `LEARNING.md` 中的安装、构建、测试命令均执行成功

## 四条命令的职责

| 顺序 | 命令 | 作用 | 是否运行测试 |
| ---: | --- | --- | :---: |
| 1 | `Set-Location .\pi-course` | 从 `pi-study/` 进入包含 npm workspace 和课程 Git 历史的仓库 | 否 |
| 2 | `npm install --ignore-scripts` | 安装 workspace 依赖，跳过 npm 生命周期脚本 | 否 |
| 3 | `npm run checkpoint -w @pi/course -- 00` | 从 Git 历史定位 Checkpoint 00 的 parent、target 和聚焦测试 | 否 |
| 4 | `npm run practice -w @pi/course -- 00 ..\pi-practice-00` | 在课程仓库之外导出 Chapter 00 的观察型隔离练习 | 否 |

这四条命令只完成环境准备、章节定位和练习生成。真正的 Checkpoint 运行还需要在 practice 目录中安装依赖、编译并执行测试。

## 1. 进入课程仓库

```powershell
(base) PS pi-study> Set-Location .\pi-course
(base) PS pi-study\pi-course>
```

结果：PowerShell 当前工作目录成功切换到 `pi-course/`。提示符已经按公开文档要求规范化，没有保留本机用户目录和绝对路径。

## 2. 安装课程依赖

执行命令：

```powershell
npm install --ignore-scripts
```

终端记录：

```text
npm warn Unknown project config "min-release-age". This will stop working in the next major version of npm.
npm warn deprecated prebuild-install@7.1.3: No longer maintained. Please contact the author of the relevant native addon; alternatives are available.
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead

added 350 packages, and audited 362 packages in 33s

54 packages are looking for funding
  run `npm fund` for details

6 vulnerabilities (1 moderate, 5 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues, run:
  npm audit fix --force

Run `npm audit` for details.
```

结果：依赖安装成功，没有执行根仓库的 `prepare` 等生命周期脚本。

### 安装警告解读

- `min-release-age`：当前 npm 把仓库 `.npmrc` 中的这个配置视为未知项目配置。它没有阻止本次安装。
- 两条 `deprecated`：来自依赖树中的旧包，不代表课程代码安装失败。
- `6 vulnerabilities`：是 npm 对完整依赖树的审计结果，不等于本章离线示例已经发生安全问题。
- 当前不执行 `npm audit fix --force`。课程依赖和 Git 历史是固定教学输入，强制升级可能改写锁文件、引入破坏性版本并使 checkpoint 无法复现。

### 安装产生的工作区变化

`npm install` 修改了 `pi-course/package-lock.json`：当前差异为 8 行新增、45 行删除，主要包括 npm 重新整理可选平台包的 `libc` 元数据，并补充 `@pi/course` workspace link。该变化暂不提交，也不自动回退，后续单独决定如何处理。

## 3. 定位 Checkpoint 00

执行命令：

```powershell
npm run checkpoint -w @pi/course -- 00
```

终端记录：

```text
npm warn Unknown project config "min-release-age". This will stop working in the next major version of npm.

> @pi/course@0.0.1 checkpoint
> node scripts/checkpoint.mjs 00

checkpoint: 00
target:     f9798b7ce690abeca3539e3410e5f402bc65862d
parent:     8479bd84743e8889f728acb21a62794102db0529
subject:    course(00): observe a complete offline agent trace

先让学习者预测，再查看：
git diff 8479bd84743e8889f728acb21a62794102db0529 f9798b7ce690abeca3539e3410e5f402bc65862d -- packages/pi-course

聚焦运行：
node --test packages/pi-course/dist/test/00-*.test.js
```

定位结果：

- `parent` 是课程包出现前的起点 `8479bd8`。
- `target` 是包含完整离线轨迹和两项聚焦测试的终点 `f9798b7`。
- 本章主题是“观察一条完整的离线 Agent trace”。
- 输出中的 `git diff` 是答案对照入口，应先完成预测和观察，再查看。
- 此脚本只打印聚焦测试命令，不负责执行；聚焦测试已在后续 Practice 验证中完成。

## 4. 创建隔离练习

执行命令：

```powershell
npm run practice -w @pi/course -- 00 ..\pi-practice-00
```

终端记录：

```text
npm warn Unknown project config "min-release-age". This will stop working in the next major version of npm.

> @pi/course@0.0.1 practice
> node scripts/practice.mjs 00 ..\pi-practice-00

chapter: 00
mode:    观察
output:  ../pi-practice-00
test:    packages/pi-course/test/00-prologue.test.ts

先阅读 ../pi-practice-00/LEARNING.md
```

上面两处输出路径由脚本实际打印的绝对路径规范化为相对于 `pi-course/` 的路径，目录指向不变。

结果：成功创建 `pi-practice-00`，本章模式为“观察”。与后续重建章节不同，Checkpoint 00 导出的是 target 快照，因为目标是运行、预测和受控破坏现成轨迹，不是从空白重写实现。

Practice 目录当前包含：

```text
pi-practice-00/
├── LEARNING.md
├── package.json
├── package-lock.json
└── packages/
    └── pi-course/
```

## 当前结论

- 四条命令全部成功。
- `pi-course` 依赖已经安装。
- Checkpoint 00 的 parent、target 和聚焦测试已经定位。
- 独立 practice 目录已经生成。
- `LEARNING.md` 已使用 UTF-8 正确读取。
- Practice 目录中的依赖安装和 TypeScript 构建成功。
- 两项聚焦测试全部通过。

## 5. 执行 LEARNING 指引

### 读取 LEARNING.md

从 `pi-course/` 进入 Practice 目录：

```powershell
Set-Location ..\pi-practice-00
Get-Content -Encoding UTF8 .\LEARNING.md
```

第一次未指定编码读取时，中文显示为乱码；增加 `-Encoding UTF8` 后内容正常。文件本身没有损坏，问题发生在 PowerShell 的文本解码环节。公开日志只保留规范化后的相对路径，不保留本机提示符。

`LEARNING.md` 确认本章是“观察”模式：当前快照已经位于 target，只做预测、运行和受控破坏，不从 parent 重写实现。

### 安装 Practice 依赖

```powershell
npm install
```

结果：

```text
added 71 packages, and audited 83 packages in 5s
12 packages are looking for funding
1 high severity vulnerability
```

依赖安装成功。这里同样不运行 `npm audit fix`，避免课程固定依赖被自动改写。

### 编译课程包

```powershell
npm run build -w @pi/course
```

实际执行：

```text
> @pi/course@0.0.1 build
> tsc -p tsconfig.json
```

命令正常结束且没有 TypeScript 错误，说明源码已经成功编译到 `dist/`。

### 运行聚焦测试

```powershell
node --test packages/pi-course/dist/test/00-*.test.js
```

结果：

```text
✔ 离线轨迹稳定呈现一条完整反馈回路
✔ 悬空 tool call 在结果文本之前暴露

tests 2
pass 2
fail 0
```

Checkpoint 00 的可执行基线验证完成。详细概念、源码和测试理解记录在 [00-prologue.md](00-prologue.md)。
