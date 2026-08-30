# dsh-webui-mobile

让 DeepSeek Harness 的 Web 界面在手机上正常使用（含在输入框上方悬浮的上传图片功能）。

[![npm](https://img.shields.io/npm/v/dsh-webui-mobile)](https://www.npmjs.com/package/dsh-webui-mobile)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## 它解决什么问题

DSH 的网页界面是按桌面端设计的，在手机浏览器上会出现侧边栏撑满屏幕、弹窗错位、输入框被裁剪等问题。这个插件会在窄屏（手机 / 窄窗口，视口宽度 ≤ 1023px）下自动把界面调整成适合触屏的布局。

它只影响手机端显示，桌面端没有任何变化。

## 做了什么

- 侧边栏、详情面板变成左右抽屉，点一下滑出，不再挤压聊天区
- 提问、权限确认、设置等弹窗在手机上全屏居中显示，不再被裁掉
- 悬浮菜单按钮（可拖动），点击/下拉打开侧边栏
- 上滑到顶部自动加载更早的对话历史
- 切换会话不再自动弹出软键盘
- 子代理目录、模型选择、推理等级、模式选择在小屏正常显示

## 安装

```bash
cd ~/.dsh/profiles/web
pnpm add dsh-webui-mobile
```

然后在 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 数组里加入 `"dsh-webui-mobile"`，重启 `dsh web` 服务。

安装并重启后，在手机打开 DSH 网页即可，无需其它配置。

## 临时关闭

- 在网址后加 `?mobileShell=0`，或
- 在浏览器控制台执行 `localStorage.setItem('dsh-mobile-shell', '0')` 后刷新。

## 更多

- 详细部署、加载机制、开发与发布、故障排查见 [AGENTS.md](./AGENTS.md)
- [npm 包页](https://www.npmjs.com/package/dsh-webui-mobile)

MIT License
