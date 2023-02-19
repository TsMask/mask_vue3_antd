<template>
  <div class="wscn-http404-container">
    <div class="wscn-http404"> 
      <div class="bullshit">
        <div class="bullshit__oops">
          404错误!
        </div>
        <div class="bullshit__headline">
          {{ message }}
        </div>
        <div class="bullshit__info">
          对不起，您正在寻找的页面不存在。尝试检查URL的错误，然后按浏览器上的刷新按钮或尝试在我们的应用程序中找到其他内容。
        </div>
        <router-link to="/index" class="bullshit__return-home">
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>import { computed } from 'vue';

let message = computed(() => {
  return '找不到网页！'
})
</script>

<style lang="less" scoped> 
</style>
