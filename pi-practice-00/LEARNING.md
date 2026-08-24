# Chapter 00 隔离练习

模式：观察

- parent（本章起点）：`8479bd84743e8889f728acb21a62794102db0529`
- target（测试通过的终点）：`f9798b7ce690abeca3539e3410e5f402bc65862d`
- 当前快照：`f9798b7ce690abeca3539e3410e5f402bc65862d`
- 聚焦测试：`packages/pi-course/test/00-prologue.test.ts`

这个目录没有额外 Git 历史或另一份答案可供偷看。00 章已经处于 target，只做预测、运行和受控破坏，不重写实现。

第一次运行：

```bash
npm install
npm run build -w @pi/course
node --test packages/pi-course/dist/test/00-*.test.js
```

若主仓库已经安装依赖，可由陪练安全地复用依赖目录；不要把参考实现复制进来。
