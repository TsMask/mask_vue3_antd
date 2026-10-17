<script setup lang="ts">
import type { MenuInfo, MenuProps, SizeType, TabsProps } from 'antdv-next';
import {
  viewTransitionTheme,
  GlobalSearch,
  useMediaScreen,
  type SearchFlatItem,
} from 'antdv-pro-layout';
import { toggle, isFullscreen } from '@/utils/fullscreen';
import { computed, h, ref } from 'vue';
import {
  BellOutlined,
  FontSizeOutlined,
  FrownOutlined,
  FullscreenOutlined,
  GithubOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@antdv-next/icons';
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
const noticeOpen = ref(false);
const screenSize = useMediaScreen();
const isPhoneScreen = computed(
  () => screenSize.value === 'xs' || screenSize.value === 'sm'
);

const noticeTabs: TabsProps['items'] = [
  { key: '1', label: '通知（41）' },
  { key: '2', label: '消息（231）' },
  { key: '3', label: '待办（1）' },
];

const componentSizeMenuItems: MenuProps['items'] = [
  { key: 'large', label: '大号' },
  { key: 'middle', label: '中号' },
  { key: 'small', label: '小号' },
];

const accountMenuItems: MenuProps['items'] = [
  {
    key: 'profile',
    label: '个人中心',
    icon: () => h(UserOutlined),
  },
  {
    key: 'settings',
    label: '个人设置',
    icon: () => h(SettingOutlined),
  },
  { type: 'divider' },
  {
    key: 'logout',
    label: '退出登录',
    icon: () => h(LogoutOutlined),
  },
];

const phoneActionMenuItems = computed<MenuProps['items']>(() => [
  { key: 'notices', label: '通知中心', icon: () => h(BellOutlined) },
  { key: 'search', label: '搜索菜单', icon: () => h(SearchOutlined) },
  { key: 'theme', label: '主题明暗', icon: () => h(FrownOutlined) },
  {
    key: 'fullscreen',
    label: '全屏切换',
    icon: () => h(FullscreenOutlined),
  },
  { key: 'componentSize', label: '组件尺寸', children: componentSizeMenuItems },
  { key: 'repository', label: '开源仓库', icon: () => h(GithubOutlined) },
  {
    key: 'document',
    label: '文档手册',
    icon: () => h(QuestionCircleOutlined),
  },
  { type: 'divider' },
  {
    key: 'account',
    label: userStore.user_nick || '个人账号',
    icon: () => h(UserOutlined),
    children: accountMenuItems,
  },
]);

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

function handlePhoneActionMenuClick(info: MenuInfo) {
  switch (info.key) {
    case 'notices':
      noticeOpen.value = true;
      break;
    case 'search':
      searchOpen.value = true;
      break;
    case 'theme':
      changeTheme(info.domEvent);
      break;
    case 'fullscreen':
      toggle();
      break;
    case 'repository':
      window.open('https://gitee.com/TsMask', '_blank', 'noopener,noreferrer');
      break;
    case 'document':
      window.open(
        'https://juejin.cn/column/7188761626017792056',
        '_blank',
        'noopener,noreferrer'
      );
      break;
    case 'large':
    case 'middle':
    case 'small':
      handleComponentSize(info);
      break;
    default:
      handleAccountMenuClick(info);
  }
}
</script>

<template>
  <div class="right-content">
    <a-space v-if="!isPhoneScreen" :size="12" align="center">
      <a-popover placement="bottomRight" :trigger="['click']">
        <a-button type="text" style="color: inherit">
          <template #icon>
            <a-badge :count="9999" :overflow-count="99" style="color: inherit">
              <BellOutlined />
            </a-badge>
          </template>
        </a-button>
        <template #content :style="{ padding: 0 }">
          <a-tabs
            centered
            :tabBarStyle="{ width: '336px' }"
            :items="noticeTabs"
          >
            <template #contentRender="{ item }">
              <div v-if="item.key === '1'">
                Content of Tab 通知
                <a-button type="link" block>查看更多</a-button>
              </div>
              <div v-else-if="item.key === '2'">
                Content of Tab 消息
                <a-button type="link" block>查看更多</a-button>
              </div>
              <div v-else>
                Content of Tab 待办
                <a-button type="link" block>查看更多</a-button>
              </div>
            </template>
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
        <template #title>主题明暗</template>
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
        <a-dropdown placement="bottomRight" :trigger="['click']">
          <a-button type="text" style="color: inherit">
            <template #icon>
              <FontSizeOutlined />
            </template>
          </a-button>
          <template #popupRender>
            <a-menu
              :selected-keys="[appStore.componentSize as string]"
              :items="componentSizeMenuItems"
              @click="handleComponentSize"
            />
          </template>
        </a-dropdown>
      </a-tooltip>

      <a-dropdown placement="bottomRight" :trigger="['click']">
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
        <template #popupRender>
          <a-menu :items="accountMenuItems" @click="handleAccountMenuClick" />
        </template>
      </a-dropdown>
    </a-space>

    <a-dropdown v-else placement="bottomRight" :trigger="['click']">
      <a-button
        type="text"
        class="phone-action-trigger"
        :aria-label="'更多操作'"
      >
        <a-avatar
          shape="circle"
          size="default"
          :src="userStore.getAvatar"
          :alt="userStore.user_name"
        />
      </a-button>
      <template #popupRender>
        <a-menu
          :items="phoneActionMenuItems"
          :selected-keys="[appStore.componentSize as string]"
          @click="handlePhoneActionMenuClick"
        />
      </template>
    </a-dropdown>

    <GlobalSearch
      v-if="isPhoneScreen"
      v-model:open="searchOpen"
      :iconfont-url="scriptUrl"
      :placeholder="'搜索菜单'"
      :empty-text="'未找到相关菜单'"
      :labels="{ toggle: '打开搜索', select: '选择', close: '关闭' }"
      @select="handleSearchSelect"
    />

    <a-modal
      v-if="isPhoneScreen"
      v-model:open="noticeOpen"
      :title="'通知中心'"
      :width="'min(92vw, 392px)'"
      :footer="null"
      :styles="{ body: { maxHeight: '60vh', overflow: 'auto' } }"
    >
      <a-tabs centered :items="noticeTabs">
        <template #contentRender="{ item }">
          <div v-if="item.key === '1'">
            Content of Tab {{ '通知' }}
            <a-button type="link" block>{{ '查看更多' }}</a-button>
          </div>
          <div v-else-if="item.key === '2'">
            Content of Tab {{ '消息' }}
            <a-button type="link" block>{{ '查看更多' }}</a-button>
          </div>
          <div v-else>
            Content of Tab {{ '待办' }}
            <a-button type="link" block>{{ '查看更多' }}</a-button>
          </div>
        </template>
      </a-tabs>
    </a-modal>
  </div>
</template>

<style scoped>
.right-content {
  display: flex;
  align-items: center;
  min-width: 0;
}

.phone-action-trigger {
  color: inherit;
  padding: 0;
}

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
