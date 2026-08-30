<script lang="ts" setup>
import { viewTransitionTheme } from 'antdv-pro-layout';
import useLayoutStore from '@/store/modules/layout';

const { proConfig, themeConfig, changeConf, changePrimaryColor } =
  useLayoutStore();

const themeOptions = [
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' },
];

const menuThemeOptions = [
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' },
];

const layoutOptions = [
  { label: '侧边', value: 'side' },
  { label: '顶部', value: 'top' },
  { label: '混合', value: 'mix' },
];

const siderMenuTypeOptions = [
  { label: '经典', value: 'sub' },
  { label: '分组', value: 'group' },
];

const colorOptions = [
  { label: '科技蓝', value: '#1677ff' },
  { label: '拂晓蓝', value: '#1890ff' },
  { label: '薄暮', value: '#f5222d' },
  { label: '火山', value: '#fa541c' },
  { label: '日暮', value: '#faad14' },
  { label: '明青', value: '#13c2c2' },
  { label: '极光绿', value: '#52c41a' },
  { label: '极客蓝', value: '#2f54eb' },
  { label: '酱紫', value: '#722ed1' },
];

function changeThemeMode(mode: 'light' | 'dark') {
  if (proConfig.theme === mode) return;
  viewTransitionTheme(() => {
    changeConf('theme', mode);
    changeConf('menuTheme', mode);
  });
}

function changeLayout(mode: 'side' | 'top' | 'mix') {
  if (proConfig.layout === mode) return;
  changeConf('layout', mode);
  if (mode !== 'mix') {
    changeConf('splitMenus', false);
  }
}
</script>

<template>
  <a-flex vertical :gap="24" class="style-layout">
    <a-form layout="vertical">
      <a-typography-title :level="5">主题风格</a-typography-title>
      <a-row :gutter="[16, 0]">
        <a-col :xs="24" :md="12">
          <a-form-item label="整体风格">
            <a-segmented
              block
              :value="proConfig.theme"
              :options="themeOptions"
              @change="(value: any) => changeThemeMode(value)"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="12">
          <a-form-item label="菜单风格">
            <a-segmented
              block
              :value="proConfig.menuTheme"
              :options="menuThemeOptions"
              @change="(value: any) => changeConf('menuTheme', value)"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="12">
          <a-form-item label="主题色">
            <a-select
              :value="themeConfig.token?.colorPrimary"
              :options="colorOptions"
              @change="(value: any) => changePrimaryColor(value)"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>

    <a-divider />

    <a-form layout="vertical">
      <a-typography-title :level="5">导航布局</a-typography-title>
      <a-row :gutter="[16, 0]">
        <a-col :xs="24" :md="12">
          <a-form-item label="导航模式">
            <a-segmented
              block
              :value="proConfig.layout"
              :options="layoutOptions"
              @change="(value: any) => changeLayout(value)"
            />
          </a-form-item>
        </a-col>
        <a-col v-if="proConfig.layout !== 'top'" :xs="24" :md="12">
          <a-form-item label="侧边菜单类型">
            <a-segmented
              block
              :value="proConfig.siderMenuType"
              :options="siderMenuTypeOptions"
              @change="(value: any) => changeConf('siderMenuType', value)"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>

    <a-divider />

    <a-form layout="vertical">
      <a-typography-title :level="5">布局设置</a-typography-title>
      <a-row :gutter="[16, 0]">
        <a-col :xs="24" :md="8">
          <a-form-item label="固定顶栏">
            <a-switch
              :checked="proConfig.fixedHeader"
              @change="(checked: any) => changeConf('fixedHeader', checked)"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-form-item label="固定侧边菜单">
            <a-switch
              :disabled="proConfig.layout === 'top'"
              :checked="proConfig.fixSiderbar"
              @change="(checked: any) => changeConf('fixSiderbar', checked)"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-form-item label="自动分割菜单">
            <a-switch
              :disabled="proConfig.layout !== 'mix'"
              :checked="proConfig.splitMenus"
              @change="(checked: any) => changeConf('splitMenus', checked)"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-flex>
</template>

<style scoped>
.style-layout {
  width: 100%;
  max-width: 560px;
}
</style>
