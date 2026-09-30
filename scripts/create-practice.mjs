import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const course = path.join(root, "pi-course");
const generator = path.join(course, "packages/pi-course/scripts/practice.mjs");
if (!existsSync(generator)) throw new Error("先运行 git submodule update --init --recursive。");

if (process.argv[2] === "--check") {
  const modules = execFileSync("git", ["ls-tree", "HEAD", "pi", "pi-course", "pi-textbook"], { cwd: root, encoding: "utf8" });
  for (const line of modules.trim().split("\n")) {
    const [, pinned, name] = line.match(/^160000 commit ([a-f0-9]{40})\t(.+)$/) ?? [];
    if (!name) throw new Error("缺少固定的子模块引用。");
    const actual = execFileSync("git", ["rev-parse", "HEAD"], { cwd: path.join(root, name), encoding: "utf8" }).trim();
    if (actual !== pinned) throw new Error(`${name} 当前提交与根仓库固定引用不一致。`);
  }
  const chapters = JSON.parse(readFileSync(path.join(root, "pi-textbook/content/checkpoints.json"), "utf8"));
  if (chapters.length !== 15) throw new Error("预期 00–14 共 15 个 checkpoint。");
  const history = execFileSync("git", ["log", "--format=%H%x09%P%x09%s", "--", "packages/pi-course"], { cwd: course, encoding: "utf8" });
  for (const [index, chapter] of chapters.entries()) {
    if (chapter.id !== String(index).padStart(2, "0")) throw new Error("教材章节顺序与 00–14 不一致。");
    const row = history.split("\n").find((line) => line.startsWith(`${chapter.commit}\t`));
    const [, parents, subject] = row?.split("\t") ?? [];
    if (parents?.split(" ")[0] !== chapter.parentCommit || subject !== chapter.subject) {
      throw new Error(`教材 checkpoint ${chapter.id} 与课程历史不一致。`);
    }
    execFileSync("git", ["cat-file", "-e", `${chapter.commit}:${chapter.focusedTest}`], { cwd: course });
  }
  console.log("三个子模块提交一致；教材与课程 15 个 checkpoint 的提交、parent、主题及聚焦测试一致。");
} else {
  const chapter = process.argv[2]?.padStart(2, "0");
  if (!chapter || !/^(?:0[0-9]|1[0-4])$/.test(chapter) || process.argv.length > 3) {
    throw new Error("Usage: npm run practice -- <00..14> | npm run check:versions");
  }
  const destination = path.join(root, `pi-practice-${chapter}`);
  // Refuse before the upstream generator runs; existing learner work is never replaced.
  if (existsSync(destination)) throw new Error(`pi-practice-${chapter} 已存在，请继续该目录中的练习。`);
  execFileSync(process.execPath, [generator, chapter, `../pi-practice-${chapter}`], { cwd: course, stdio: "inherit" });
  writeFileSync(path.join(destination, "LICENSE"), `${readFileSync(path.join(course, "LICENSE"), "utf8").trimEnd()}\n`);
  // The upstream archive includes monorepo commands/deps for packages that it
  // does not export. Reuse our minimal environment without changing lesson code.
  const manifest = JSON.parse(readFileSync(path.join(root, "pi-practice-00/package.json"), "utf8"));
  const lock = JSON.parse(readFileSync(path.join(root, "pi-practice-00/package-lock.json"), "utf8"));
  manifest.name = `pi-practice-${chapter}`;
  delete manifest.scripts.demo;
  lock.name = manifest.name;
  lock.packages[""].name = manifest.name;
  writeFileSync(path.join(destination, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(path.join(destination, "package-lock.json"), `${JSON.stringify(lock, null, 2)}\n`);
  const guide = path.join(destination, "LEARNING.md");
  writeFileSync(guide, readFileSync(guide, "utf8").replace("npm install", "npm ci --ignore-scripts") +
    "\n本仓库仅精简导出的根 workspace 配置及锁文件，课程源码、target 聚焦测试和 starter 保持上游生成结果。build 通过而当前章测试失败可能是正常学习起点；先按本章教材判断，不要复制最终答案。\n");
  console.log(`环境已精简。从仓库根目录运行 npm ci --ignore-scripts --prefix pi-practice-${chapter}，再按 LEARNING.md 继续。`);
}
