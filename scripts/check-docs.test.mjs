import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkFile, markdownAnchors } from "./check-docs.mjs";

test("相对链接检查覆盖锚点、源码定位、编码路径与错误情况", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "pi-study-docs-"));
  try {
    mkdirSync(path.join(root, "docs"));
    writeFileSync(path.join(root, "docs", "中文 页面.md"), "# 标题与 `类型`\n\n## 重复\n\n## 重复\n\n<a id=\"manual\"></a>\n");
    writeFileSync(path.join(root, "source.ts"), "export const demo = true;\n");
    writeFileSync(path.join(root, "README.md"), [
      "# 开始", "", "[中文](docs/%E4%B8%AD%E6%96%87%20%E9%A1%B5%E9%9D%A2.md#标题与-类型)",
      "[重复](<docs/中文 页面.md#重复-1>)", "[手动][manual]", "[manual]: <docs/中文 页面.md#manual>",
      "[源码](source.ts#L1)", "[外链](https://example.invalid/missing)", "",
      "```md", "[示范](missing-in-fence.md)", "```", "`[示范](missing-inline.md)`",
      "\\[转义](missing-escaped.md)", "", "两空格是换行  ", "下一行", "",
    ].join("\n"));
    assert.deepEqual(checkFile(root, "README.md"), []);
    const bad = [
      "[断链](missing.md)", "[越界](../outside.md)", "[错误锚点](docs/%E4%B8%AD%E6%96%87%20%E9%A1%B5%E9%9D%A2.md#missing)",
      "[坏编码](%ZZ.md)", "[未定义][absent]", "[错误源码锚点](source.ts#symbol)", "[源码行越界](source.ts#L99)",
    ].join("\n") + "\n";
    writeFileSync(path.join(root, "broken.md"), bad);
    const issues = checkFile(root, "broken.md");
    assert.equal(issues.length, 7);
    assert.deepEqual(issues.map((issue) => issue.line), [1, 2, 3, 4, 6, 7, 5]);
    assert.match(issues[0].message, /不存在/);
    assert.match(issues[1].message, /边界/);
    assert.match(issues[2].message, /锚点/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("Markdown 锚点忽略围栏并支持 setext 标题", () => {
  const anchors = markdownAnchors("标题\n====\n\n~~~md\n# 不是标题\n~~~\n\n## Real `type`\n");
  assert.deepEqual([...anchors], ["标题", "real-type"]);
});

test("文本检查发现格式和敏感内容，但诊断不包含原文", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "pi-study-docs-"));
  try {
    const secret = ["sk", "-", "a".repeat(32)].join("");
    const personalPath = ["C:", "/Users/", "fixture", "/draft.md"].join("");
    writeFileSync(path.join(root, "bad.txt"), `line \n${personalPath}\n${secret}`);
    const issues = checkFile(root, "bad.txt");
    assert.equal(issues.length, 4);
    assert.ok(issues.some((issue) => issue.message.includes("末尾换行")));
    assert.ok(issues.some((issue) => issue.message.includes("行尾空白")));
    assert.ok(issues.some((issue) => issue.message.includes("个人绝对路径")));
    assert.ok(issues.some((issue) => issue.message.includes("密钥")));
    assert.ok(!JSON.stringify(issues).includes(secret));
    assert.ok(!JSON.stringify(issues).includes(personalPath));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
