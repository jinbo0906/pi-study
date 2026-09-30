# Chapter 00 隔离练习

本章是一个完全离线的观察实验：先预测七步反馈轨迹，再运行 fixture、阅读测试，最后观察损坏轨迹如何被拒绝。它不会请求模型服务，也不会真的读取 README，费用为零。

- parent（本章起点）：`8479bd84743e8889f728acb21a62794102db0529`
- target（观察用终点）：`f9798b7ce690abeca3539e3410e5f402bc65862d`
- 实现与测试来源：上述 target 的 `packages/pi-course`
- 模式：观察；00 章使用 target，后续重建章节通常使用 parent 加聚焦测试。

本次维护只精简安装配置并添加运行入口，没有改写轨迹实现、测试或 checkpoint 来源。这个目录没有独立的课程 Git 历史；完整 parent/target 历史保存在 `../pi-course`。

## 安装与运行

要求 Node.js 22.19.0 及以上，推荐 Node.js 22 或 24；无需环境变量或 API key。在仓库根目录执行：

```sh
cd pi-practice-00
npm ci --ignore-scripts
npm run check
npm test
npm run demo
```

`npm ci` 严格使用本目录的锁文件，只安装 TypeScript、Node 类型及其必要依赖。`check` 进行严格类型检查；`test` 先编译到忽略的 `dist/` 再运行两项聚焦测试；`demo` 也先编译，随后打印七行轨迹。

预期结果：测试显示 `pass 2`、`fail 0`；轨迹从 `01 user_message` 开始，以 `07 assistant_message` 结束。owner 顺序为 `user → model → model → loop → tool → model → model`。第一次模型返回 read call，工具结果与 `call_1` 配对，第二次模型给出 stop。

## 观察、验证与扩展

1. 运行前先写出七步 owner，解释第 4 步为什么属于 loop。
2. 阅读 [prologue.ts](packages/pi-course/src/demo/prologue.ts) 的 `runPrologueDemo`、`assertValidPrologueTrace` 和 `formatPrologueTrace`。这里是固定轨迹，不是官方 Agent Loop 实现。
3. 阅读 [00-prologue.test.ts](packages/pi-course/test/00-prologue.test.ts)。第二项测试删除 tool result 并重新编号，期望验证器报“缺少配对结果”；测试通过表示错误被正确拒绝。
4. 在返回副本中尝试“result 先于 call”或不连续 step，预测首先触发哪个检查。保持原 fixture 和已有测试不变，再运行 `npm test` 复核基线。
5. 回到 [教材第 00 章](../pi-textbook/content/chapters/00-prologue.md)，然后进入第 01 章学习真实的类型协议；官方实现的对应入口由根 [学习计划](../STUDY_PLAN.md) 指定。

如果出现 `tsc` 找不到，先确认命令从本目录执行且 `npm ci` 成功。如果提示缺少 `dist`，使用上面的 `test` 或 `demo` 入口，它们会先构建。不要在同名练习目录已存在时再次生成，也不要把课程后期实现覆盖到此目录。
