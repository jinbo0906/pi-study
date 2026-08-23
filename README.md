# pi-study

一个系统学习 [Pi Agent](https://github.com/earendil-works/pi) 的个人工程仓库。

本仓库将官方源码、课程代码和中文教材固定为独立的 Git Submodule，同时维护自己的学习计划、章节笔记与实践代码。目标不是只会运行 Pi，而是能够解释并实现它的核心链路：

```text
消息协议 → 模型流 → Provider → 工具 → Agent Loop
        → 状态 → 会话树 → Context Compaction → 扩展 → Eval
```

## 仓库结构

| 路径 | 用途 | 维护方式 |
| --- | --- | --- |
| `pi/` | Earendil Works 官方 Pi 主线，用于运行和源码对照 | Submodule，跟踪 `main` |
| `pi-textbook/` | 《动手学 Pi》中文教材 | Submodule，跟踪 `main` |
| `pi-course/` | 15 个可运行 checkpoint 的课程代码 | Submodule，跟踪 `course/build-your-own-pi` |
| `pi-practice-XX/` | 每章由 `practice` 命令生成的独立练习 | 由本仓库维护 |
| `notes/` | 概念、源码对照、实验和复盘笔记 | 由本仓库维护 |
| `STUDY_PLAN.md` | 学习顺序、进度和验收标准 | 由本仓库维护 |

三个上游仓库彼此隔离。课程实现不合并进官方 `pi/main`，练习答案也不直接写入 `pi-course`。

## 获取仓库

首次克隆时同时初始化 Submodule：

```powershell
git clone --recurse-submodules https://github.com/jinbo0906/pi-study.git
Set-Location .\pi-study
```

如果已经克隆了根仓库：

```powershell
git submodule update --init --recursive
```

## 开始 Checkpoint 00

当前环境建议使用 Node.js 22.19 或更高版本。课程依赖只需在 `pi-course` 中安装一次：

```powershell
Set-Location .\pi-course
npm install --ignore-scripts

npm run checkpoint -w @pi/course -- 00
npm run practice -w @pi/course -- 00 ..\pi-practice-00
```

练习生成后，先阅读 `pi-practice-00/LEARNING.md`，再按照其中的聚焦测试完成实现。不要在第一次尝试前查看 target commit 的答案。

教材正文位于 `pi-textbook/content/chapters/`。仅阅读内容时不需要启动教材网站。

## 每章工作流

1. 阅读本章正文，在展开答案前完成预测题。
2. 用 `checkpoint` 确认 parent、target、教学文件和聚焦测试。
3. 用 `practice` 创建独立目录，先读测试再实现。
4. 记录失败现象、被破坏的协议和最终修复。
5. 完成测试后，再查看课程 target diff。
6. 回到官方 `pi/`，对照真实实现增加的并发、取消、错误处理和兼容逻辑。
7. 更新章节笔记与 `STUDY_PLAN.md`，提交本章学习成果。

推荐提交格式：

```text
docs(ch00): record agent loop notes
feat(ch00): complete checkpoint practice
docs(ch00): compare course implementation with upstream pi
```

## 更新上游引用

更新某个 Submodule 后，根仓库还需要提交新的版本指针：

```powershell
git -C .\pi pull --ff-only
git add pi
git commit -m "chore: update pi upstream reference"
```

课程学习期间不要随意更新 `pi-course`。教材 checkpoint 与课程 Git 历史相互对应，应当一起核对后再升级。

## 安全说明

Pi 默认以启动进程的用户权限访问文件、进程、网络和环境变量。学习时应：

- 只在 `pi-practice-XX` 等实验目录中运行 Agent。
- 前期优先使用 Scripted/Faux Model 和离线测试。
- 不提交 `.env`、`auth.json`、`.pi/`、会话 JSONL 或任何 API Key。
- 使用真实 Provider 前提交当前改动，并确认工具允许访问的工作目录。

三个 Submodule 分别遵循其上游项目许可证。本仓库中的个人学习笔记与练习应避免直接复制未注明来源的大段内容。
