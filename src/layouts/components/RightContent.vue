<script setup lang="ts">
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import type { SizeType } from 'ant-design-vue/es/config-provider';
import { toggle, isFullscreen } from '@/utils/fullscreen-utils';
import { useRouter } from 'vue-router';
import useUserStore from '@/store/modules/user';
import useAppStore from '@/store/modules/app';
const userStore = useUserStore();
const appStore = useAppStore();
const router = useRouter();

/**组件尺寸点击选择 */
function fnComponentSize({ key }: MenuInfo) {
  appStore.setComponentSize(key as SizeType);
}

/**头像展开项点击 */
function fnClick({ key }: MenuInfo) {
  switch (key) {
    case 'settings':
      router.push({ name: 'Settings' });
      break;
    case 'profile':
      router.push({ name: 'Profile' });
      break;
    case 'logout':
      userStore.fnLogOut().finally(() => router.push({ name: 'Login' }));
      break;
  }
}
</script>

<template>
  <a-space :size="12" align="center">
    <a-popover
      overlayClassName="head-notice"
      placement="bottomRight"
      trigger="click"
    >
      <a-button type="text">
        <template #icon>
          <a-badge :count="9999" :overflow-count="99">
            <BellOutlined />
          </a-badge>
        </template>
      </a-button>
      <template #content :style="{ padding: 0 }">
        <a-tabs centered :tabBarStyle="{ width: '336px' }">
          <a-tab-pane key="1" tab="通知（41）">
            Content of Tab 通知
            <a-button type="link" block>查看更多</a-button>
          </a-tab-pane>
          <a-tab-pane key="2" tab="消息（231）">
            Content of Tab 消息
            <a-button type="link" block>查看更多</a-button>
          </a-tab-pane>
          <a-tab-pane key="3" tab="待办（1）">
            Content of Tab 待办
            <a-button type="link" block>查看更多</a-button>
          </a-tab-pane>
        </a-tabs>
      </template>
    </a-popover>

    <a-tooltip>
      <template #title>开源仓库</template>
      <a-button type="text" href="https://gitee.com/TsMask" target="_blank">
        <template #icon>
          <GithubOutlined />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip>
      <template #title>文档手册</template>
      <a-button
        type="text"
        href="https://juejin.cn/column/7188761626017792056"
        target="_blank"
      >
        <template #icon>
          <QuestionCircleOutlined />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip>
      <template #title>全屏显示</template>
      <a-button type="text" @click="toggle">
        <template #icon>
          <FullscreenExitOutlined v-if="isFullscreen()" />
          <FullscreenOutlined v-else />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip>
      <template #title>组件尺寸</template>
      <a-dropdown placement="bottom" trigger="click">
        <a-button type="text">
          <template #icon><FontSizeOutlined /></template>
        </a-button>
        <template #overlay>
          <a-menu
            :selected-keys="[appStore.componentSize as string]"
            @click="fnComponentSize"
          >
            <a-menu-item key="large">大号</a-menu-item>
            <a-menu-item key="middle">中号</a-menu-item>
            <a-menu-item key="small">小号</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </a-tooltip>

    <a-dropdown placement="bottomRight" trigger="click">
      <div class="user">
        <a-avatar
          shape="circle"
          size="default"
          :src="userStore.getAvatar"
          :alt="userStore.userName"
        ></a-avatar>
        <span class="nick">
          {{ userStore.nickName }}
        </span>
      </div>
      <template #overlay>
        <a-menu @click="fnClick">
          <a-menu-item key="profile">
            <template #icon>
              <UserOutlined />
            </template>
            <span>个人中心</span>
          </a-menu-item>
          <a-menu-item key="settings">
            <template #icon>
              <SettingOutlined />
            </template>
            <span>个人设置</span>
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="logout">
            <template #icon>
              <LogoutOutlined />
            </template>
            <span>退出登录</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </a-space>
</template>

<style lang="less" scoped>
.user {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
  .nick {
    padding-left: 8px;
    padding-right: 16px;
    font-size: 16px;
    max-width: 164px;
    white-space: nowrap;
    text-align: start;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
</style>
