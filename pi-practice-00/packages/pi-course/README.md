# Checkpoint 00 · 完整离线反馈轨迹

这个包来自课程 commit `f9798b7ce690abeca3539e3410e5f402bc65862d`，只包含第 00 章观察用 fixture 和两项测试。它不是完整的 `pi-course` 仓库；完整课程有 00～14 章 checkpoint，保存在根仓库的 `pi-course` 子模块中。

从练习根目录按 [LEARNING.md](../../LEARNING.md) 安装，再执行 `npm run check`、`npm test`、`npm run demo`。三个命令也可以加 `-w @pi/course` 从练习根直接调用本包。

[src/demo/prologue.ts](src/demo/prologue.ts) 用 `structuredClone` 返回固定的七步事件，验证 call/result 配对后提供展示文本；[test/00-prologue.test.ts](test/00-prologue.test.ts) 同时覆盖正常轨迹和悬空调用。它不连接 Provider，不执行真实文件工具，不代表官方运行时的完整行为。

学习时先预测 owner 和错误，再运行与解释。需要陪练时使用 [AGENT_GUIDE.md](AGENT_GUIDE.md)。对照完整课程历史应在课程子模块中执行：

```sh
git -C pi-course diff 8479bd84743e8889f728acb21a62794102db0529 f9798b7ce690abeca3539e3410e5f402bc65862d -- packages/pi-course
```

上面命令从 `pi-study` 根目录执行。保留 fixture 与测试，扩展实验只操作 `runPrologueDemo()` 返回的副本；从第 01 章开始才逐步重建协议实现。
