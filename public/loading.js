/**
 * 首屏加载占位
 *
 * 在 Vue 应用挂载前填充 #app；应用挂载后内容会被整体替换，无需手动清理。
 */
(function () {
  const app = document.querySelector('#app');
  if (!app || app.innerHTML !== '') return;

  app.innerHTML = `
    <style>
      body {
        margin: 0;
      }
      #app {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #f5f6f8;
        color: rgba(0, 0, 0, 0.55);
        font: 14px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          'Helvetica Neue', Arial, sans-serif;
      }
      .page-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      .page-loading-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(22, 119, 255, 0.2);
        border-top-color: #1677ff;
        border-radius: 50%;
        animation: page-loading-rotate 0.8s linear infinite;
      }
      @keyframes page-loading-rotate {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-color-scheme: dark) {
        #app {
          background: #141414;
          color: rgba(255, 255, 255, 0.55);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .page-loading-spinner {
          animation: none;
        }
      }
    </style>
    <div class="page-loading" role="status" aria-label="正在加载">
      <div class="page-loading-spinner"></div>
      <div>正在加载，请稍候</div>
    </div>`;
})();
