/**
 * loading 占位
 * 解决首次加载时白屏的问题
 */
(function () {
  const _app = document.querySelector('#app');
  if (_app && _app.innerHTML === '') {
    const styleStr = `
    <style>
      html,
      body,
      #app {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      #app {
        background-repeat: no-repeat;
        background-size: 100% auto;
      }
      .loading-title {
        font-size: 1.1rem;
      }
      .loading-sub-title {
        text-align: center;
        margin-top: 20px;
        font-size: 1rem;
        color: #888;
      }
      .page-loading-warp {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
      }
      .ant-spin {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        color: #1677ff;
        font-size: 12px;
        line-height: 1.6;
        list-style: none;
        font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji';
        position: absolute;
        display: none;
        text-align: center;
        vertical-align: middle;
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86);
      }
      .ant-spin-spinning {
        position: static;
        display: inline-block;
        opacity: 1;
      }
      .ant-spin-dot {
        position: relative;
        display: inline-block;
        font-size: 17.5px;
        width: 1em;
        height: 1em;
      }
      .ant-spin-dot-item {
        position: absolute;
        display: block;
        width: 7.75px;
        height: 7.75px;
        background-color: #1677ff;
        border-radius: 100%;
        transform: scale(0.75);
        transform-origin: 50% 50%;
        opacity: 0.3;
        animation-name: antSpinMove;
        animation-duration: 1s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
        animation-direction: alternate;
      }
      .ant-spin-dot-item:nth-child(1) {
        top: 0;
        inset-inline-start: 0;
      }
      .ant-spin-dot-item:nth-child(2) {
        top: 0;
        inset-inline-end: 0;
        animation-delay: 0.4s;
      }
      .ant-spin-dot-item:nth-child(3) {
        inset-inline-end: 0;
        bottom: 0;
        animation-delay: 0.8s;
      }
      .ant-spin-dot-item:nth-child(4) {
        bottom: 0;
        inset-inline-start: 0;
        animation-delay: 1.2s;
      }
      .ant-spin-dot-spin {
        transform: rotate(45deg);
        animation-name: antRotate;
        animation-duration: 1.2s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
      }
      .ant-spin-lg .ant-spin-dot {
        font-size: 28px;
      }
      .ant-spin-lg .ant-spin-dot i {
        width: 12px;
        height: 12px;
      }
      @-webkit-keyframes antSpinMove {
        to {
          opacity: 1;
        }
      }
      @keyframes antSpinMove {
        to {
          opacity: 1;
        }
      }
      @-webkit-keyframes antRotate {
        to {
          transform: rotate(405deg);
        }
      }
      @keyframes antRotate {
        to {
          transform: rotate(405deg);
        }
      }
    </style>`;

    let loadInfo = {
      title: '正在加载资源',
      titleSub: '初次加载资源可能需要较多时间',
      msg: '请耐心等待',
    };
    document.title = 'loading...';

    const divStr = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 362px;
    ">
      <div class="page-loading-warp">
        <div class="ant-spin ant-spin-lg ant-spin-spinning">
          <span class="ant-spin-dot ant-spin-dot-spin">
            <i class="ant-spin-dot-item"></i>
            <i class="ant-spin-dot-item"></i>
            <i class="ant-spin-dot-item"></i>
            <i class="ant-spin-dot-item"></i>
          </span>
        </div>
      </div>
      <div class="loading-title">
        ${loadInfo.title}
      </div>
      <div class="loading-sub-title">
        ${loadInfo.titleSub} </br> ${loadInfo.msg}
      </div>
    </div>`;

    _app.innerHTML = styleStr + divStr;
  }
})();
