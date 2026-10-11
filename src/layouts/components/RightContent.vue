<script setup lang="ts">
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface';
import type { SizeType } from 'ant-design-vue/es/config-provider';
import {
  viewTransitionTheme,
  GlobalSearch,
  type SearchFlatItem,
} from 'antdv-pro-layout';
import { toggle, isFullscreen } from '@/utils/fullscreen';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import useUserStore from '@/store/modules/user';
import useAppStore from '@/store/modules/app';
import { clearTabsView } from '@/hooks/useTabsView';
import { useLayoutSettings } from '@/layouts/hooks/useLayoutSettings';
import { scriptUrl } from '@/assets/js/icon_font_8d5l8fzk5b87iudi';
const { proConfig, changeConfig } = useLayoutSettings();
const userStore = useUserStore();
const appStore = useAppStore();
const router = useRouter();
const searchOpen = ref(false);

// 手动变更主题-过渡动画
function changeTheme(e: any) {
  viewTransitionTheme(isDarkMode => {
    const themeMode = isDarkMode ? 'light' : 'dark';
    changeConfig('theme', themeMode);
  }, e);
}

/**组件尺寸点击选择 */
function handleComponentSize({ key }: MenuInfo) {
  appStore.setComponentSize(key as SizeType);
}

/** 全局搜索结果跳转 */
function handleSearchSelect(item: SearchFlatItem) {
  if (item.isExternal) {
    if (item.target === '_blank') {
      window.open(item.path, item.target, 'noopener,noreferrer');
    } else {
      window.location.href = item.path;
    }
    return;
  }
  router.push(item.path);
}

/** 退出后回到登录页，动态路由由路由守卫统一还原。 */
async function handleLogout() {
  try {
    clearTabsView();
    await userStore.fnLogout();
  } finally {
    await router.replace({ path: '/login' });
  }
}

/**头像展开项点击 */
function handleAccountMenuClick({ key }: MenuInfo) {
  switch (key) {
    case 'settings':
      router.push({ name: 'AccountSettings' });
      break;
    case 'profile':
      router.push({ name: 'AccountProfile' });
      break;
    case 'logout':
      handleLogout();
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
      <a-button type="text" style="color: inherit">
        <template #icon>
          <a-badge :count="9999" :overflow-count="99" style="color: inherit">
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

    <a-tooltip placement="bottomRight">
      <template #title>开源仓库</template>
      <a-button
        type="text"
        style="color: inherit"
        href="https://gitee.com/TsMask"
        target="_blank"
      >
        <template #icon>
          <GithubOutlined />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip placement="bottomRight">
      <template #title>文档手册</template>
      <a-button
        type="text"
        style="color: inherit"
        href="https://juejin.cn/column/7188761626017792056"
        target="_blank"
      >
        <template #icon>
          <QuestionCircleOutlined />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip placement="bottomRight">
      <template #title>搜索菜单</template>
      <a-button type="text" style="color: inherit" @click="searchOpen = true">
        <template #icon>
          <SearchOutlined />
        </template>
      </a-button>
    </a-tooltip>
    <GlobalSearch
      v-model:open="searchOpen"
      :iconfont-url="scriptUrl"
      placeholder="搜索菜单"
      empty-text="未找到相关菜单"
      :labels="{ toggle: '打开搜索', select: '选择', close: '关闭' }"
      @select="handleSearchSelect"
    />

    <a-tooltip placement="bottomRight">
      <template #title>主题明暗模式</template>
      <a-button type="text" style="color: inherit" @click="changeTheme">
        <template #icon>
          <FrownOutlined v-if="proConfig.theme === 'dark'" />
          <MehOutlined v-else />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip placement="bottomRight">
      <template #title>全屏显示</template>
      <a-button type="text" style="color: inherit" @click="toggle">
        <template #icon>
          <FullscreenExitOutlined v-if="isFullscreen()" />
          <FullscreenOutlined v-else />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip placement="right">
      <template #title>组件尺寸</template>
      <a-dropdown placement="bottomRight" trigger="click">
        <a-button type="text" style="color: inherit">
          <template #icon>
            <FontSizeOutlined />
          </template>
        </a-button>
        <template #overlay>
          <a-menu
            :selected-keys="[appStore.componentSize as string]"
            @click="handleComponentSize"
          >
            <a-menu-item key="large">大号</a-menu-item>
            <a-menu-item key="middle">中号</a-menu-item>
            <a-menu-item key="small">小号</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </a-tooltip>

    <a-dropdown placement="bottomRight" trigger="click">
      <div class="account-user">
        <a-avatar
          shape="circle"
          size="default"
          :src="userStore.getAvatar"
          :alt="userStore.user_name"
        ></a-avatar>
        <span class="account-nickname">
          {{ userStore.user_nick }}
        </span>
      </div>
      <template #overlay>
        <a-menu @click="handleAccountMenuClick">
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

<style scoped>
.account-user {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
}

.account-user .account-nickname {
  padding-left: 8px;
  font-size: 16px;
  max-width: 164px;
  white-space: nowrap;
  text-align: start;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
