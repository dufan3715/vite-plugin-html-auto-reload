/* eslint-disable no-underscore-dangle */
import { PluginOption, ResolvedConfig } from 'vite';
import { writeFileSync } from 'fs';
import path from 'path';

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
  } = option;
  const ms = typeof polling === 'number' ? polling : 1000 * 60;
  const funcStr = `
      let htmlVersion;
      ${once ? `let alreadyShowConfirm = false;` : ''}
      ${polling ? `let timer;` : ''}
      const checkHtmlVersion = () => {
        const url = \`${versionUrl}?t=\${Date.now()}\`;
        fetch(url)
          .then(res => res.text())
          .then(version => {
            if (!version) return;
            if (!htmlVersion) {
              htmlVersion = version;
              return;
            }
            ${once ? `if (alreadyShowConfirm) return;` : ''}
            if (version !== htmlVersion) {
              ${once ? `alreadyShowConfirm = true;` : ''}
              // eslint-disable-next-line no-alert
              if (window.confirm('请求资源已更新，请刷新页面')) {
                window.location.reload();
              } ${once ? `else {
                // eslint-disable-next-line no-use-before-define
                removeEvent();
              }` : ''}
            }
          });
      };
      ${
        onerror
          ? `function errorListener(event) {
        const error = event.reason || event;
        const source = event.target || event.srcElement;
        if (error.message?.includes('Loading chunk') ||
            source instanceof HTMLScriptElement ||
            source instanceof HTMLLinkElement) {
          checkHtmlVersion();
        }
      }`
          : ''
      }
      function removeEvent() {
        ${
          onvisibilitychange
            ? `document.removeEventListener('visibilitychange', checkHtmlVersion);`
            : ''
        }
        ${
          onerror
            ? `window.removeEventListener('error', errorListener, true);`
            : ''
        }
        ${polling ? `window.clearInterval(timer);` : ''}
      };
      function addEvent() {
        ${
          onvisibilitychange
            ? `document.addEventListener('visibilitychange', () => {
          if (document.hidden) return;
          checkHtmlVersion();
        });`
            : ''
        }
        ${
          onerror
            ? `window.addEventListener('error', errorListener, true);`
            : ''
        }
        ${
          polling
            ? `timer = setInterval(() => {
            if (document.hidden) return;
            checkHtmlVersion();
          }, ${ms});`
            : ''
        }
      };
      checkHtmlVersion();
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
      return [
        {
          tag: 'script',
          attrs: { type: 'module', defer: true },
          children: getScriptChildren(config, option),
          injectTo: 'body',
        },
      ];
    },
    buildEnd() {
      const version = new Date().toISOString();
      const outputDir = path.resolve(config.build.outDir);
      const outputPath = path.join(outputDir, 'version.txt');
      writeFileSync(outputPath, version);
    },
  };
};

export default htmlAutoReload;
