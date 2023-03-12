<template>
  <a-row :gutter="20">
    <a-col :span="12">
      <img src="@/assets/images_error/404.svg" width="313" height="428" alt="404!"
    /></a-col>
    <a-col :span="12">
      <h1 class="text-jumbo text-ginormous">404错误!</h1>
      <h2>找不到网页！</h2>
      <h6>
        对不起，您正在寻找的页面不存在。尝试检查URL的错误，然后按浏览器上的刷新按钮或尝试在我们的应用程序中找到其他内容。
      </h6>
      <a-button type="primary" href="/index"> 返回首页 </a-button>
    </a-col>
  </a-row>
</template>

<script setup lang="ts"></script>

<style lang="less" scoped></style>
