# 参与维护

优先提交能让读者学懂或跑通的小改动：修复命令、补可复现行为测试、为源码结论提供固定版本与符号。保留课程逐章重建结构，避免扩成生产框架。

## 本地验证

Node 22.19+ / 24 LTS，从根目录运行：

```powershell
git submodule update --init --recursive
npm ci --ignore-scripts --prefix pi-practice-00
npm ci --ignore-scripts --prefix labs
npm run check
npm test
npm run demo:practice
npm run demo:labs
```

`check` 检查文档、固定版本与 TypeScript；`test` 运行文档检查器、课程 00 和官方 API 离线测试。代码改动运行对应目录 check/test，修改入口也实际执行 demo。文档改动运行 `npm run check:docs`，版本改动加 `npm run check:versions`。

文档检查覆盖主仓库 Git 文本（含未忽略的新文件），不扫描子模块全文、缓存或 dist；检查 Markdown 相对链接和锚点，外链不联网验证。它不是完整 CommonMark 解析器，也不能识别所有密钥，提交前仍须人工审阅 diff。

## 示例与说明

示例写明用途、版本、运行命令、预期输出、错误路径、源码符号和扩展方向。预期失败不可删除以获取绿灯。真实 Provider 实验须提供空密钥模板、模型和费用说明，并与默认离线检查隔离。

说明接口时同时记录 commit 和包版本，课程协议与官方 API 分开核对。记录可用 [章节模板](notes/TEMPLATE.md)，引用教材须署名并遵守 [教材许可](pi-textbook/LICENSE-CONTENT)。原创材料采用 [MIT](LICENSE)，子模块保持上游授权。不要提交原始个人资料、个人绝对路径、密钥或完整会话。

## 更新与提交

子模块保持固定提交。更新时 fetch 后检出明确 commit，同步核对教材、课程、源码指南和实验；不要在 detached HEAD 直接 pull，也不要因安装警告运行 `npm audit fix --force`。`check:versions` 报固定提交不一致时，先审阅预期升级与新的根仓库指针，再提交并重新验证。

直接依赖固定版本，锁文件变更说明教学必要性；修改 manifest 后运行 `npm install --package-lock-only --ignore-scripts --prefix <目录>`，再用 `npm ci --ignore-scripts` 验证。

提交前查看 `git status --short`、`git diff --check`，只 stage 本次修改的明确路径，审阅 `git diff --cached`。提交信息说明学习问题与解决行为，通过正常 push / PR 工作流提交，不强推。CI 支持 main push、PR 和手动运行；远程绿灯后再把多平台结果记为通过。
