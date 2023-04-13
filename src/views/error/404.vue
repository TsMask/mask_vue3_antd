<script setup lang="ts"></script>

<template>
  <a-result
    status="404"
    title="找不到匹配页面"
    sub-title="对不起，您正在寻找的页面不存在。"
  >
    <template #extra>
      <a-button type="primary" href="/index">返回首页</a-button>
    </template>
    <a-typography>
      <a-typography-title> 找不到网页？ </a-typography-title>
      <a-typography-paragraph>
        1. 尝试检查URL的错误，然后按浏览器上的刷新按钮。
      </a-typography-paragraph>
      <a-typography-paragraph>
        2. 尝试在我们的应用程序中找到其他内容。
      </a-typography-paragraph>
    </a-typography>
  </a-result>
</template>

<style lang="less" scoped></style>
