<script setup lang="ts">
import { PayCircleOutlined } from '@ant-design/icons-vue';
import donate from '@/assets/donate.jpg';
import useAppStore from '@/store/modules/app';
import useUserStore from '@/store/modules/user';
const userStore = useUserStore();
const { systemName, systemVersion } = useAppStore();
let logoutTime = Date.now() + 1000 * 60 * 60 * 2; // 正式环境2小时，todo接口时间

/**跳转 */
function fnTo(type: string) {
  if (type === 'code') {
    window.open('https://gitee.com/TsMask/', '__blank');
  }
  if (type === 'issues') {
    window.open('https://gitee.com/TsMask/mask_antd_vue3/issues', '__blank');
  }
}
</script>

<template>
  <page-container :title="systemName" sub-title="by TsMask">
    <template #tags>
      <a-tag>当前版本：{{ systemVersion }}</a-tag>
      <a-tag color="red"><PayCircleOutlined /> 免费开源</a-tag>
    </template>
    <template #extra>
      <a-button type="primary" @click="fnTo('code')">开源仓库</a-button>
      <a-button type="default" @click="fnTo('issues')">提些建议</a-button>
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
          {{ userStore.nickName }} ，祝你开心每一天！
        </span>
      </a-space>
    </template>
    <template #extraContent>
      <a-space :size="8">
        <a-statistic-countdown
          title="登录有效期倒计时"
          :value="logoutTime"
          format="HH:mm:ss:SSS"
        />
      </a-space>
    </template>

    <a-row :gutter="16">
      <a-col :lg="16" :md="16" :xs="24">
        <a-card title="项目简介">
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
        <a-card title="快速开始">
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
  </page-container>
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
