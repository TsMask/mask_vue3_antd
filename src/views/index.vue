<script setup lang="ts">
import useAppStore from '@/store/modules/app';
const { systemName, systemVersion } = useAppStore();

/**跳转链接 */
function goTarget(url: string) {
  window.open(url, '__blank');
}
</script>

<template>
  <a-card>
    <a-row :gutter="18">
      <a-col :span="12">
        <a-typography>
          <a-typography-title>{{ systemName }}</a-typography-title>
          <a-typography-paragraph>
            Vue 生态中 Ant-Design-Vue 组件库进行搭建的后台管理系统，对接基于
            Node 的 Midwayjs 框架开发的后端接口服务。解决 Node
            搭建后端系统的需求。
          </a-typography-paragraph>
          <a-typography-paragraph>
            当期版本：
            <a-typography-text code>{{ systemVersion }}</a-typography-text>
          </a-typography-paragraph>

          <a-typography-paragraph>
            <a-row :gutter="20">
              <a-col span="4">
                <a-button
                  type="primary"
                  @click="
                    goTarget('https://gitee.com/TsMask/mask_api_midwayjs')
                  "
                  >API仓库</a-button
                >
              </a-col>
              <a-col span="4">
                <a-button
                  type="default"
                  @click="goTarget('https://gitee.com/TsMask/mask_antd_vue3')"
                  >UI仓库</a-button
                >
              </a-col>
            </a-row>
          </a-typography-paragraph>
        </a-typography>
      </a-col>
      <a-col :span="12">
        <a-row>
          <a-col :span="12">
            <h2>技术选型</h2>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="6">
            <h4>后端技术</h4>
            <ul>
              <li>Midwayjs</li>
              <li>JWT</li>
              <li>Mysql</li>
              <li>Redis</li>
              <li>Bull</li>
              <li>...</li>
            </ul>
          </a-col>
          <a-col :span="6">
            <h4>前端技术</h4>
            <ul>
              <li>Vue</li>
              <li>Pinia</li>
              <li>Ant-Design-Vue</li>
              <li>Less</li>
              <li>...</li>
            </ul>
          </a-col>
        </a-row>
      </a-col>
    </a-row>
  </a-card>
</template>

<style scoped></style>
