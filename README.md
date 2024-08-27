# vite-plugin-html-auto-reload
a vite plugin to build with version and do auto reload html on version change

<p align="center">
  <strong>
    <span>English</span>
    |
    <a href="./README.zh-CN.md">简体中文</a>
  </strong>
</p>

## Install

```sh
# pnpm
pnpm add -D vite-plugin-html-auto-reload
# yarn
yarn add -D vite-plugin-html-auto-reload
# npm
npm i -D vite-plugin-html-auto-reload
```

## Usage

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

## Options

```ts
export type Options {
  /**
   * Whether to ask only once
   * @default true
   */
  once?: boolean;
  /**
   * Whether to get version on visibilitychange
   * @default true
   */
  onvisibilitychange?: boolean;
  /**
   * Whether to get version when load chunk error
   * @default true
   */
  onerror?: boolean;
  /**
   * Whether to poll to get version, and polling interval
   * polling interval time unit: ms, default 1000 * 60 ms
   * @default false
   */
  polling?: boolean | number;
}
```

## Server Configuration

```nginx
# nginx.conf

location ~* \.(html|htm)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```