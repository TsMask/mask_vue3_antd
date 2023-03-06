<script setup lang="ts">
import { BgColorsOutlined } from '@ant-design/icons-vue';
import { changePrimaryColor } from '@/hooks/useTheme';
import useLayoutStore from '@/store/modules/layout';
import { storeToRefs } from 'pinia';
const { visible } = storeToRefs(useLayoutStore());
const { proConfig, changeConf } = useLayoutStore();
</script>

<template>
  <a-drawer
    v-model:visible="visible"
    :width="300"
    placement="right"
    :closable="false"
  >
    <div class="margin-bottom: 24px">
      <h3>导航模式</h3>
      <a-radio-group
        style="margin-bottom: 12px"
        :value="proConfig.layout"
        @change="e => changeConf('layout', e.target.value)"
      >
        <a-radio value="side">左侧菜单布局</a-radio>
        <a-radio value="top">顶部菜单布局</a-radio>
        <a-radio value="mix">混合菜单布局</a-radio>
      </a-radio-group>

      <a-divider />
      <a-row style="margin-bottom: 12px">
        <a-col :span="12">改变主题色</a-col>
        <a-col :span="12" style="text-align: right">
          <a-button
            class="ant-pro-theme-button"
            size="small"
            @click="() => changePrimaryColor()"
            ><BgColorsOutlined />随机</a-button
          >
        </a-col>
      </a-row>
      <a-divider />
      <a-row style="margin-bottom: 12px">
        <a-col :span="12">深色菜单</a-col>
        <a-col :span="12" style="text-align: right">
          <a-switch
            checked-children="开"
            un-checked-children="关"
            :checked="proConfig.navTheme === 'dark'"
            @change="
              checked => changeConf('navTheme', checked ? 'dark' : 'light')
            "
          />
        </a-col>
      </a-row>
      <a-row style="margin-bottom: 12px">
        <a-col :span="12">固定 Header</a-col>
        <a-col :span="12" style="text-align: right">
          <a-switch
            checked-children="开"
            un-checked-children="关"
            :checked="proConfig.fixedHeader"
            @change="checked => changeConf('fixedHeader', checked)"
          />
        </a-col>
      </a-row>
      <a-row style="margin-bottom: 12px">
        <a-col :span="12">固定 左侧菜单</a-col>
        <a-col :span="12" style="text-align: right">
          <a-switch
            checked-children="开"
            un-checked-children="关"
            :checked="proConfig.fixSiderbar"
            @change="checked => changeConf('fixSiderbar', checked)"
          />
        </a-col>
      </a-row>
      <a-row style="margin-bottom: 12px">
        <a-col :span="12">自动分割菜单</a-col>
        <a-col :span="12" style="text-align: right">
          <a-switch
            checked-children="开"
            un-checked-children="关"
            :checked="proConfig.splitMenus"
            @change="checked => changeConf('splitMenus', checked)"
          />
        </a-col>
      </a-row>

      <a-divider />
      <h3>内容区域</h3>
      <a-row style="margin-bottom: 12px">
        <a-col :span="12">顶栏</a-col>
        <a-col :span="12" style="text-align: right">
          <a-switch
            checked-children="开"
            un-checked-children="关"
            :checked="proConfig.headerRender === undefined"
            @change="
              checked =>
                changeConf('headerRender', checked === true && undefined)
            "
          />
        </a-col>
      </a-row>
      <a-row style="margin-bottom: 12px">
        <a-col :span="12">页脚</a-col>
        <a-col :span="12" style="text-align: right">
          <a-switch
            checked-children="开"
            un-checked-children="关"
            :checked="proConfig.footerRender === undefined"
            @change="
              checked =>
                changeConf('footerRender', checked === true && undefined)
            "
          />
        </a-col>
      </a-row>
      <a-row style="margin-bottom: 12px">
        <a-col :span="12">菜单</a-col>
        <a-col :span="12" style="text-align: right">
          <a-switch
            disabled
            checked-children="开"
            un-checked-children="关"
            :checked="proConfig.menu === undefined"
            @change="
              checked => changeConf('menu', checked === true && undefined)
            "
          />
        </a-col>
      </a-row>
      <a-row style="margin-bottom: 12px">
        <a-col :span="12">菜单头</a-col>
        <a-col :span="12" style="text-align: right">
          <a-switch
            checked-children="开"
            un-checked-children="关"
            :checked="proConfig.menuHeaderRender === undefined"
            @change="
              checked =>
                changeConf('menuHeaderRender', checked === true && undefined)
            "
          />
        </a-col>
      </a-row>
    </div>
  </a-drawer>
</template>

<style lang="less">
.ant-pro-theme-button {
  background: var(--ant-primary-color) !important;
  border: var(--ant-primary-color) !important;
  color: #fff !important;
}
</style>
