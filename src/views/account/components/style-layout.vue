<script lang="ts" setup>
import { viewTransitionTheme } from 'antdv-pro-layout';
import useLayoutStore from '@/store/modules/layout';
const { proConfig, changeConf, themeConfig, changePrimaryColor } =
  useLayoutStore();

let timerId: any = null;

/**改变主题色 */
function fnColorChange(e: Event) {
  const target = e.target as HTMLInputElement;
  // 需要防抖函数处理
  clearTimeout(timerId);
  timerId = setTimeout(() => {
    if (target.nodeName === 'INPUT') {
      changePrimaryColor(target.value ?? '#1890ff');
    } else {
      changePrimaryColor();
    }
  }, 300);
}

/**手动变更主题-过渡动画 */
function changeTheme(e: any) {
  viewTransitionTheme(isDarkMode => {
    changeConf('theme', isDarkMode ? 'light' : 'dark');
  }, e);
}
</script>

<template>
  <a-divider orientation="left">布局属性</a-divider>
  <a-list item-layout="vertical" size="large" row-key="title">
    <a-list-item>
      整体布局
      <template #actions> 导航模式模块设置 </template>
      <template #extra>
        <a-radio-group
          style="margin-bottom: 12px"
          :value="proConfig.layout"
          @change="(e:any) => changeConf('layout', e.target.value)"
        >
          <a-radio value="side">左侧菜单布局</a-radio>
          <a-radio value="top">顶部菜单布局</a-radio>
          <a-radio value="mix">混合菜单布局</a-radio>
        </a-radio-group>
      </template>
    </a-list-item>
    <a-list-item>
      风格配色
      <template #actions> 整体风格配色设置 </template>
      <template #extra>
        <a-space :size="16" align="end" direction="horizontal">
          <a-button type="primary" size="small" @click="fnColorChange">
            随机
          </a-button>
          <input
            type="color"
            :value="themeConfig?.token?.colorPrimary"
            @input="fnColorChange"
          />
        </a-space>
      </template>
    </a-list-item>
    <a-list-item>
      深色菜单
      <template #actions> 只能改变导航模式的菜单 </template>
      <template #extra>
        <a-switch
          checked-children="是"
          un-checked-children="否"
          :checked="proConfig.menuTheme === 'dark'"
          @change="
            (checked:any) => changeConf('menuTheme', checked ? 'dark' : 'light')
          "
        ></a-switch>
      </template>
    </a-list-item>
    <a-list-item>
      固定顶部导航栏
      <template #actions> 顶部导航栏是否固定，不随滚动条移动 </template>
      <template #extra>
        <a-switch
          checked-children="是"
          un-checked-children="否"
          :checked="proConfig.fixedHeader"
          @change="(checked:any) => changeConf('fixedHeader', checked)"
        ></a-switch>
      </template>
    </a-list-item>
    <a-list-item>
      固定左侧菜单
      <template #actions> 左侧菜单是否固定，仅左侧菜单布局时有效 </template>
      <template #extra>
        <a-switch
          checked-children="是"
          un-checked-children="否"
          :checked="proConfig.fixSiderbar"
          @change="(checked:any) => changeConf('fixSiderbar', checked)"
        ></a-switch>
      </template>
    </a-list-item>
    <a-list-item>
      自动分割菜单
      <template #actions>
        顶部有多级菜单时显示左侧菜单，仅混合菜单布局时有效
      </template>
      <template #extra>
        <a-switch
          checked-children="是"
          un-checked-children="否"
          :checked="proConfig.splitMenus"
          @change="(checked:any) => changeConf('splitMenus', checked)"
        ></a-switch>
      </template>
    </a-list-item>
  </a-list>
  <a-divider orientation="left">内容区域</a-divider>
  <a-list item-layout="vertical" size="large" row-key="title">
    <a-list-item>
      顶栏
      <template #actions> 是否显示顶部导航栏 </template>
      <template #extra>
        <a-switch
          checked-children="显示"
          un-checked-children="隐藏"
          :checked="proConfig.headerRender === undefined"
          @change="
            (checked:any) => changeConf('headerRender', checked === true && undefined)
          "
        ></a-switch>
      </template>
    </a-list-item>
    <a-list-item>
      页脚
      <template #actions> 是否显示底部导航栏 </template>
      <template #extra>
        <a-switch
          checked-children="显示"
          un-checked-children="隐藏"
          :checked="proConfig.footerRender === undefined"
          @change="
            (checked:any) => changeConf('footerRender', checked === true && undefined)
          "
        ></a-switch>
      </template>
    </a-list-item>
    <a-list-item>
      菜单头
      <template #actions> 是否显示左侧菜单栏顶部LOGO区域 </template>
      <template #extra>
        <a-switch
          checked-children="显示"
          un-checked-children="隐藏"
          :checked="proConfig.menuHeaderRender === undefined"
          @change="
            (checked:any) => changeConf('menuHeaderRender', checked === true && undefined)
          "
        ></a-switch>
      </template>
    </a-list-item>
    <a-list-item>
      导航标签项
      <template #actions> 是否显示顶部Tab导航标签项 </template>
      <template #extra>
        <a-switch
          checked-children="显示"
          un-checked-children="隐藏"
          :checked="proConfig.tabRender === undefined"
          @change="
            (checked:any) => changeConf('tabRender', checked === true && undefined)
          "
        ></a-switch>
      </template>
    </a-list-item>
  </a-list>
</template>

<style lang="less" scoped></style>
