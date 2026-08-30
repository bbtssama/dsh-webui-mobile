# AGENTS.md — dsh-webui-mobile

> 本文档面向 **AI 编程助手 / agent**：如何在任意 DSH 环境中部署本插件、理解它的加载与工作方式，以及如何维护、发布它。人类读者如需快速了解，请回到 [README.md](./README.md)。

## 1. 这是什么

`dsh-webui-mobile` 是一个 **纯客户端 cordis 插件**（client-only），为 DeepSeek Harness（DSH）的 Web GUI 提供移动端（窄屏）适配。它：

- **不包含** 服务端（Node host）逻辑，不注册工具，不改动 DSH 核心源码
- 生效条件：浏览器视口 `max-width: 1023px`（即手机 / 窄窗口）
- 桌面端完全不受影响（所有样式都受移动端断点 + `html.dsh-mobile-shell` 作用域保护）

## 2. 仓库结构

```
dsh-webui-mobile/
├── src/
│   ├── client.js      # 客户端 bundle：window.__ModuleLoader__.load 注册，全部移动端逻辑
│   └── index.js       # host 空桩（apply 为空；仅满足 client-modules 扫描契约）
├── cordis.patch.yml   # bundle patch：只插入一个空的 host entry，供 client-modules 扫描
├── package.json       # dsh.bundle.patch + dsh.client 声明
├── README.md          # 给人看的简介
└── AGENTS.md          # 本文件
```

## 3. 依赖与前置条件

- 一个运行中的 DSH `web` profile（`dsh web` 启动的服务）
- 该 profile 的标准 bundle 已包含 `@deepseek-ai/dsh-client-runtime` 与 `@deepseek-ai/dsh-client-ui-layout`（标准 `@deepseek-ai/dsh-web-app` 自带的，无需额外安装）
- **无 npm 依赖、无构建步骤、无 postinstall、无需 API Key**

## 4. 部署（逐步）

### 方式 A：npm（推荐）

1. 进入 profile 目录：

   ```bash
   cd ~/.dsh/profiles/web
   ```

2. 安装包：

   ```bash
   pnpm add dsh-webui-mobile
   ```

3. 编辑 `~/.dsh/profiles/web/package.json`，在 `dsh.profile.bundles` 数组中加入包名：

   ```jsonc
   {
     "dsh": {
       "profile": {
         "bundles": [
           "@deepseek-ai/dsh-base",
           "@deepseek-ai/dsh-web-app",
           "dsh-webui-mobile"
         ]
       }
     }
   }
   ```

4. 装依赖并重启服务：

   ```bash
   cd ~/.dsh/profiles/web && pnpm install
   sudo systemctl restart dsh-web   # 或对应进程管理器
   ```

5. 验证：用手机或浏览器开发者工具（视口 ≤1023px）打开 DSH 网页，移动端布局自动生效。

### 方式 B：git 链接（本地开发 / 未发布时）

1. 克隆仓库：

   ```bash
   git clone https://github.com/Z-6354/dsh-webui-mobile.git /data/dsh-webui-mobile
   ```

2. 在 profile 的 `package.json` 里用 `link:`：

   ```jsonc
   "dependencies": {
     "dsh-webui-mobile": "link:/data/dsh-webui-mobile"
   }
   ```

3. `pnpm install` → 重启服务（同方式 A）。

### 方式 C：DSH CLI（若可用）

```bash
dsh plugin --profile web add dsh-webui-mobile
```

`dsh plugin add` 会转发 `pnpm add`，并自动把「解析到 `dsh.bundle` 的依赖」加进 `bundles`。

## 5. 加载与工作机制（关键）

### 5.1 客户端 bundle 如何被发现

- `package.json` 的 `dsh.client` 声明 `platform: "web"` 和 `inject: [...]`。
- DSH 的 `client-modules` 扫描器读取各 bundle 的 `dsh.client`，把本插件写入 boot manifest（`window.__DSH_BOOT__` 的 entries），并 serve `/plugins/dsh-webui-mobile/client.js`。
- `src/client.js` 通过 `window.__ModuleLoader__.load({ id: "dsh-webui-mobile", factory })` 注册；factory 内 `require('react')`、导出 `{ apply, inject }`。

### 5.2 host 侧为什么是空桩

本插件是 client-only，`src/index.js` 的 `apply()` 为空。`cordis.patch.yml` 只插入一个空 host entry（`id: dsh-webui-mobile-shell`），作用是让 `client-modules` 能扫描到包的 `dsh.client`。**不要删除这个空 entry**，否则客户端 bundle 不会被注入。

### 5.3 移动端适配的实现方式

- 全部视觉改动位于 `src/client.js` 内的一大段内联 CSS 字符串（`const CSS = ...`），通过 `ensureStyle()` 写入 `<style data-plugin="dsh-webui-mobile">`。
- 所有规则都在 `@media (max-width: 1023px)` 内，且选择器都带 `html.dsh-mobile-shell` 前缀；`MobileChrome` 组件在 `useMobile()` 判定为手机时往 `<html>` 加 `dsh-mobile-shell` class。
- 因此桌面端（宽视口）或未激活时，这些规则完全不生效。

### 5.4 运行时组件

`MobileChrome` 是核心 React 组件，通过 `ctx.slots.inject('shell.overlay', ...)` 注册到 `shell.overlay` slot，注入：

- 可拖拽 FAB（`.dshMobMenu`）+ backdrop（`.dshMobBackdrop`）
- 若干副作用：focus 抑制、上滑自动加载历史、子代理目录/提问面板/设置面板适配、tooltip 隐藏等

## 6. 开发与发布

### 6.1 本地改代码

- 直接改 `src/client.js`，然后 `sudo systemctl restart dsh-web`（服务会按文件内容重新计算 rev 并 serve 新 bundle）。
- 无需构建（纯 JS）。

### 6.2 发布新版本（务必 bump + 打 tag + push tag）

1. 改完并测好后，bump 版本并自动生成 tag：

   ```bash
   npm version patch   # 或 minor/major
   ```

   注意：**不要用 `--no-git-tag-version`**（曾因此漏打 tag，导致 `github:owner/repo#vX.Y.Z` 安装 spec 失效）。

2. 提交并推送：

   ```bash
   git push origin main
   git push origin --tags
   ```

3. 发布 npm：

   ```bash
   npm publish --access public
   ```

   注意：npm 不允许覆盖已发布的版本号；若该版本号已误发，必须 bump 到下一个版本再发。

### 6.3 已知踩坑

- **不要改动 DSH 核心插件**（如 `dsh-client-runtime` 的 `maxMessages`），那些改动不随本包分发、DSH 升级或重装会丢失，且违反「只改插件本身」的原则。
- git tag 必须随版本 bump 一起打并 push（`github:owner/repo#vX.Y.Z` 安装 spec 依赖 tag 存在）。
- `npm publish` 需要具备 bypass 2FA 权限的 token。
- 直接改 npm 包 `node_modules` 里的编译产物（`lib/client.js`）的改动，不会被 git 追踪，重装即丢。

## 7. 故障排查

- **移动端布局没生效**：确认视口 ≤1023px；在页面源码里搜 `dsh-webui-mobile`，boot manifest 里应有对应 entry。若无，说明 bundles 没生效，检查 `pnpm install` + 重启。
- **客户端 bundle 404**：profile 的 `node_modules` 里必须有 `dsh-webui-mobile` 的 symlink（`link:` 或 npm 装出来的）。
- **桌面端被影响**：理论上不可能（断点 + 作用域保护）；若发生，检查是否误改了 `dsh-mobile-shell` class 的注入逻辑。

## 8. 临时禁用

- URL 加 `?mobileShell=0`
- `localStorage.setItem('dsh-mobile-shell', '0')` 后刷新
