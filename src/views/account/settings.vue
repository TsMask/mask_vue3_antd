<script lang="ts" setup>
import BaseInfo from './components/base-info.vue';
import ResetPasswd from './components/reset-passwd.vue';
import { ref } from 'vue';
import { getLocalColor, changePrimaryColor } from '@/hooks/useTheme';

/**Tab标签激活 */
let activeKey = ref<string>('base-info');

/**改变主题色 */
function fnColorChange(e: any) {
  if (!e.target) return;
  changePrimaryColor(e.target.value ?? '#1890ff');
}
</script>

<template>
  <page-container>
    <a-card>
      <a-tabs tab-position="left" v-model:activeKey="activeKey">
        <a-tab-pane key="base-info" tab="基础信息">
          <BaseInfo></BaseInfo>
        </a-tab-pane>
        <a-tab-pane key="reset-passwd" tab="重置密码">
          <ResetPasswd></ResetPasswd>
        </a-tab-pane>
        <a-tab-pane key="style-layout" tab="个性化">
          <a-list item-layout="vertical" size="large" row-key="title">
            <a-list-item>
              风格配色
              <template #actions> 整体风格配色设置 </template>
              <template #extra>
                <input
                  type="color"
                  :value="getLocalColor()"
                  @input="fnColorChange"
                />
              </template>
            </a-list-item>
          </a-list>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </page-container>
</template>

<style lang="less" scoped></style>
