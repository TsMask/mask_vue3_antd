<template>
  <a-divider :style="{ margin: '16px 0 12px' }">其他登录方式</a-divider>
  <a-space align="center" :size="8">
    <a-tooltip title="微信扫一扫登录" placement="bottom">
      <a-button shape="circle" size="middle" type="link">
        <template #icon>
          <WechatOutlined :style="{ color: '#52c41a', fontSize: '18px' }" />
        </template>
      </a-button>
    </a-tooltip>
    <a-tooltip title="QQ扫码登录" placement="bottom">
      <a-button shape="circle" size="middle" type="link">
        <template #icon>
          <QqOutlined :style="{ color: '#40a9ff', fontSize: '18px' }" />
        </template>
      </a-button>
    </a-tooltip>
  </a-space>
</template>
