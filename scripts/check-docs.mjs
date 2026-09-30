import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredParts = new Set([".git", "node_modules", "dist", "coverage", ".next", ".wrangler"]);
const textExtensions = new Set([".md", ".json", ".js", ".mjs", ".ts", ".yml", ".yaml", ".txt", ".sh"]);
const blank = (value) => value.replace(/[^\n]/g, " ");
const lineAt = (text, index) => text.slice(0, index).split("\n").length;

// Keep positions intact so diagnostics refer to the original document.
function withoutCode(text, inline = false) {
  let fence;
  const result = text.split("\n").map((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      return blank(line);
    }
    if (marker) {
      fence = marker[1];
      return blank(line);
    }
    return line;
  }).join("\n").replace(/<!--[\s\S]*?-->/g, blank);
  return inline ? result.replace(/(`+)[^\n]*?\1/g, blank) : result;
}

export function markdownAnchors(text) {
  const anchors = new Set();
  const counts = new Map();
  const lines = withoutCode(text).split("\n");
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    for (const match of line.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) anchors.add(match[1]);
    const atx = line.match(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+\s*)?$/);
    const setext = index + 1 < lines.length && /^ {0,3}(?:=+|-+)\s*$/.test(lines[index + 1]) && line.trim();
    const heading = atx?.[1] ?? (setext ? line.trim() : undefined);
    if (!heading) continue;
    const slug = heading.toLowerCase().replace(/<[^>]*>/g, "").replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "").replace(/\s/g, "-");
    const count = counts.get(slug) ?? 0;
    anchors.add(count ? `${slug}-${count}` : slug);
    counts.set(slug, count + 1);
  }
  return anchors;
}

function markdownLinks(text) {
  const visible = withoutCode(text, true);
  const references = new Map();
  const links = [];
  for (const match of visible.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(<[^>]+>|\S+)/gm)) {
    references.set(match[1].trim().toLowerCase(), match[2]);
    links.push({ destination: match[2], index: match.index });
  }
  for (const match of visible.matchAll(/(?<!\\)!?\[([^\]\n]*)\]\(/g)) {
    let end = match.index + match[0].length;
    const start = end;
    let depth = 1;
    let angle = false;
    for (; end < visible.length; end++) {
      const char = visible[end];
      if (char === "\n") break;
      if (char === "\\") { end++; continue; }
      if (char === "<") angle = true;
      if (char === ">") angle = false;
      if (!angle && char === "(") depth++;
      if (!angle && char === ")" && --depth === 0) break;
    }
    if (!depth) links.push({ destination: visible.slice(start, end).trim(), index: match.index });
  }
  for (const match of visible.matchAll(/(?<!\\)!?\[([^\]\n]+)\](?:\[([^\]\n]*)\])?/g)) {
    const after = visible.slice(match.index + match[0].length, match.index + match[0].length + 1);
    if (after === "(" || after === ":") continue;
    const destination = references.get((match[2] || match[1]).trim().toLowerCase());
    if (destination) links.push({ destination, index: match.index });
    else if (match[2] !== undefined) links.push({ missingReference: true, index: match.index });
  }
  return links;
}

function contained(base, target) {
  const relative = path.relative(base, target);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export function checkFile(repoRoot, filename) {
  const absolute = path.resolve(repoRoot, filename);
  const content = readFileSync(absolute, "utf8").replace(/\r\n/g, "\n");
  const issues = [];
  const report = (index, message) => issues.push({ file: filename, line: lineAt(content, index), message });
  if (content && !content.endsWith("\n")) report(content.length, "缺少末尾换行");
  for (const match of content.matchAll(/[\t ]+$/gm)) {
    // Two spaces are a supported Markdown hard line break.
    if (path.extname(filename) === ".md" && match[0] === "  " && content.slice(0, match.index).split("\n").at(-1).trim()) continue;
    report(match.index, "行尾空白");
  }
  for (const match of content.matchAll(/(?:[A-Za-z]:[\\/]+Users[\\/]+[^\s\\/"']+|\/Users\/[^\s/"']+|\/home\/[^\s/"']+)/g)) {
    report(match.index, "疑似个人绝对路径（内容未输出）");
  }
  for (const match of content.matchAll(/\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|AIza[\w-]{30,})\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g)) {
    report(match.index, "疑似密钥（内容未输出）");
  }
  if (path.extname(filename) !== ".md") return issues;
  for (const link of markdownLinks(content)) {
    if (link.missingReference) { report(link.index, "未定义的 Markdown 引用链接"); continue; }
    const destination = link.destination.startsWith("<")
      ? link.destination.slice(1, link.destination.indexOf(">")) : link.destination.split(/\s/)[0];
    if (!destination || /^(?:[A-Za-z][\w+.-]*:|\/\/)/.test(destination)) continue;
    const [rawPath, rawAnchor] = destination.split("#", 2);
    let linkedPath;
    let anchor;
    try {
      linkedPath = decodeURIComponent(rawPath.split("?", 1)[0]).replace(/\\([()[\] ])/g, "$1");
      anchor = rawAnchor === undefined ? undefined : decodeURIComponent(rawAnchor);
    } catch { report(link.index, "链接包含无效的 URL 编码"); continue; }
    const target = linkedPath ? path.resolve(path.dirname(absolute), linkedPath) : absolute;
    if (!contained(repoRoot, target)) { report(link.index, "相对链接越出仓库边界"); continue; }
    if (!existsSync(target)) { report(link.index, "相对链接目标不存在（子模块未初始化时先初始化）"); continue; }
    if (!contained(realpathSync(repoRoot), realpathSync(target))) { report(link.index, "链接通过软链接越出仓库边界"); continue; }
    if (anchor && path.extname(target).toLowerCase() === ".md" && statSync(target).isFile()) {
      if (!markdownAnchors(readFileSync(target, "utf8")).has(anchor)) report(link.index, "Markdown 目标锚点不存在");
    } else if (anchor && /\.[cm]?[jt]sx?$/.test(target) && statSync(target).isFile()) {
      const range = anchor.match(/^L(\d+)(?:-L?(\d+))?$/);
      if (!range) { report(link.index, "源码锚点须使用 GitHub 的 L数字 或 L数字-L数字 格式"); continue; }
      const start = Number(range[1]);
      const end = Number(range[2] ?? range[1]);
      const lines = readFileSync(target, "utf8").replace(/\n$/, "").split("\n").length;
      if (start < 1 || end < start || end > lines) report(link.index, "源码锚点行号越界");
    }
  }
  return issues;
}

export function repositoryFiles(repoRoot) {
  // Git skips submodule contents; include new deliverables before the first commit.
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: repoRoot, encoding: "utf8" })
    .split("\0").filter(Boolean).filter((filename) => !filename.split("/").some((part) => ignoredParts.has(part)))
    .filter((filename) => textExtensions.has(path.extname(filename)) || [".gitignore", ".gitmodules", ".env.example", "LICENSE"].includes(path.basename(filename)))
    .filter((filename) => existsSync(path.resolve(repoRoot, filename)) && statSync(path.resolve(repoRoot, filename)).isFile());
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = repositoryFiles(root);
  const issues = files.flatMap((filename) => checkFile(root, filename));
  for (const issue of issues) console.error(`${issue.file}:${issue.line}: ${issue.message}`);
  console.log(`文档与文本检查：${files.length} 个文件，${issues.length} 个问题。`);
  process.exitCode = issues.length ? 1 : 0;
}
