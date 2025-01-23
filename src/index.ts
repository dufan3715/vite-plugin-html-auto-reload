/* eslint-disable no-underscore-dangle */
import { PluginOption, ResolvedConfig } from 'vite';
import { writeFileSync } from 'fs';
import path from 'path';

const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}

const version = new Date().toLocaleString('en-US', dateTimeFormatOptions);

export type HtmlAutoReloadOption = {
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
  /**
   * Prompt content
   * @default "请求资源已更新，请刷新页面"
   */
  promptContent?: string;
};

const getScriptChildren = (
  config: ResolvedConfig,
  option: HtmlAutoReloadOption = {}
) => {
  const versionUrl = path.join(config.base, 'version.txt');
  const {
    onvisibilitychange = true,
    onerror = true,
    once = true,
    polling = false,
    promptContent = '请求资源已更新，请刷新页面'
  } = option;
  const ms = typeof polling === 'number' ? polling : 1000 * 60;
  const funcStr = `
    /* eslint-disable */
    const localVersion = '${version}';
    const key = \`__html_auto_reload_\${localVersion}__\`;
    let confirmed = sessionStorage.getItem(key) === 'Y';
    ${polling ? `let timer;` : ''}
    const checkVersion = () => {
      if (confirmed) return;
      const url = \`${versionUrl}?t=\${Date.now()}\`;
      fetch(url)
        .then(res => res.text())
        .then(remoteVersion => {
          if (confirmed) return;
          if (
            remoteVersion &&
            remoteVersion.length === localVersion.length &&
            remoteVersion !== localVersion
          ) {
            ${once ? `confirmed = true;` : ''}
            sessionStorage.setItem(key, 'Y')
            if (window.confirm('${promptContent}')) {
              window.location.reload();
            } ${once ? `else {
              removeEvent();
            }` : ''}
          }
        })
    };
    ${onerror ? `
    function errorListener(event) {
      const error = event.reason || event;
      const source = event.target || event.srcElement;
      if (
        error.message?.includes('Loading chunk') ||
        source instanceof HTMLScriptElement ||
        source instanceof HTMLLinkElement
      ) {
        checkVersion();
      }
    }`
    : ''}
    const controller = new AbortController();
    function removeEvent() {
      controller.abort();
      ${polling ? `window.clearInterval(timer);` : ''}
    };
    function addEvent() {
      ${onvisibilitychange ? `
      document.addEventListener(
        'visibilitychange',
        () => {
          if (document.hidden) return;
          checkVersion();
        },
        { signal: controller.signal }
      );`
    : ''}
      ${onerror ? `
      window.addEventListener('error', errorListener, {
        capture: true,
        signal: controller.signal,
      });`
    : ''}
      ${polling ? `
      timer = setInterval(() => {
        if (document.hidden) return;
        checkVersion();
      }, ${ms});`
    : ''}
    };
    addEvent();
  `.replace(/^\s*[\r\n]/gm, '');
  return `\n${funcStr}`;
};

const htmlAutoReload = (option: HtmlAutoReloadOption = {}): PluginOption => {
  let config: ResolvedConfig;
  return {
    name: 'html-reload',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    transformIndexHtml() {
      return [{
        tag: 'script',
        attrs: { type: 'module' },
        children: getScriptChildren(config, option),
        injectTo: 'body',
      }]
    },
    closeBundle() {
      const outputDir = path.resolve(config.build.outDir);
      const outputPath = path.join(outputDir, 'version.txt');
      writeFileSync(outputPath, version);
    },
  };
};

export default htmlAutoReload;
