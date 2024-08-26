# vite-plugin-html-auto-reload
一个用于构建时生成版本号并在版本变更时自动刷新 HTML 的 Vite 插件

<p align="center">
  <strong>
    <a href="./README.md">English</a>
    |
    <span>简体中文</span>
  </strong>
</p>

## 安装

```sh
# pnpm
pnpm add -D vite-plugin-html-auto-reload
# yarn
yarn add -D vite-plugin-html-auto-reload
# npm
npm i -D vite-plugin-html-auto-reload
```

## 使用方法

```ts
// vite.config.js
import { defineConfig } from 'vite'
import htmlAutoReload from "vite-plugin-html-auto-reload"

export default defineConfig({
  plugins: [
    htmlAutoReload(),
  ],
})
```

## 插件配置

```ts
export type Options {
  /**
   * 是否仅询问一次
   * @default true
   */
  once?: boolean;
  /**
   * 是否在 visibilitychange 事件时获取版本号
   * @default true
   */
  onvisibilitychange?: boolean;
  /**
   * 是否在加载模块错误时获取版本号
   * @default true
   */
  onerror?: boolean;
  /**
   * 是否通过轮询获取版本号，以及轮询间隔
   * 轮询间隔时间单位：毫秒，默认 1000 * 60 毫秒
   * @default false
   */
  polling?: boolean | number;
}
```