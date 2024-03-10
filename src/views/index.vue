<script setup lang="ts">
import donate from '@/assets/donate.jpg';
import { PageContainer } from 'antdv-pro-layout';
import useAppStore from '@/store/modules/app';
import useUserStore from '@/store/modules/user';
const userStore = useUserStore();
const { appName, appVersion } = useAppStore();

/**跳转 */
function goTarget(type: string) {
  let url = '';
  if (type === 'code') {
    url = 'https://gitee.com/TsMask/';
  }
  if (type === 'issues') {
    url = 'https://gitee.com/TsMask/mask_vue3_antd/issues';
  }
  window.open(url, '__blank');
}
</script>

<template>
  <PageContainer :breadcrumb="{}" :title="appName" sub-title="by TsMask">
    <template #tags>
      <a-tag>当前版本：{{ appVersion }}</a-tag>
      <a-tag color="magenta"><PayCircleOutlined /> 免费开源</a-tag>
    </template>
    <template #extra>
      <a-button type="primary" @click="goTarget('code')">开源仓库</a-button>
      <a-button type="default" @click="goTarget('issues')">提些建议</a-button>
    </template>
    <template #content>
      <a-space :size="16" align="center">
        <a-avatar
          shape="circle"
          :size="72"
          :src="userStore.getAvatar"
          :alt="userStore.userName"
        ></a-avatar>
        <span class="nickname">
          {{ userStore.nickName }} ，想必你那里一切安好吧。
        </span>
      </a-space>
    </template>
    <template #extraContent>
      <a-space :size="16">
        <a-statistic title="在线用户" :value="545486" />
      </a-space>
    </template>

    <a-row :gutter="16">
      <a-col :lg="16" :md="16" :xs="24">
        <a-card title="项目简介" style="margin-bottom: 16px">
          <a-typography>
            <a-typography-paragraph>
              <a-typography-text mark> Vue3 </a-typography-text>
              技术组合，支持按钮及数据权限，可自定义部门数据权限。
            </a-typography-paragraph>
            <a-typography-paragraph>
              内置模块如：部门管理、角色用户、菜单及按钮授权、数据权限、系统参数、日志管理等，支持在线定时任务配置。
            </a-typography-paragraph>
            <a-typography-paragraph>
              使用 <a-typography-text mark> Ant-Design-Vue </a-typography-text>
              组件库，搭建的前后端分离极速后台管理系统。
            </a-typography-paragraph>
          </a-typography>
        </a-card>
      </a-col>
      <a-col :lg="8" :md="8" :xs="24">
        <a-card title="快速开始" style="margin-bottom: 16px">
          <a-row :gutter="16">
            <a-col :lg="6" :md="12" :xs="24">
              <a-button
                type="link"
                target="_blank"
                title="开发手册"
                href="https://juejin.cn/column/7188761626017792056"
              >
                开发手册
              </a-button>
            </a-col>
            <a-col :lg="6" :md="12" :xs="24">
              <a-button
                type="link"
                target="_blank"
                title="来自Apifox的接口文档"
                href="https://mask-api-midwayjs.apifox.cn/"
              >
                接口文档
              </a-button>
            </a-col>
            <a-col :lg="6" :md="12" :xs="24">
              <a-button
                type="link"
                target="_blank"
                title="Middwayjs版本服务端"
                href="https://gitee.com/TsMask/mask_api_midwayjs"
              >
                Node后端
              </a-button>
            </a-col>
            <a-col :lg="6" :md="12" :xs="24">
              <a-button type="text"> 相关待定 </a-button>
            </a-col>
          </a-row>
        </a-card>
        <a-card title="捐赠鼓励" style="margin-top: 16px">
          <a-image width="100%" :src="donate" />
        </a-card>
      </a-col>
    </a-row>
  </PageContainer>
</template>

<style lang="less" scoped>
.nickname {
  margin-bottom: 12px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
}
</style>
