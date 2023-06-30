<script setup lang="ts">
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { useRouter } from 'vue-router';
import useUserStore from '@/store/modules/user';
const userStore = useUserStore();
const router = useRouter();

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
      :trigger="['click']"
    >
      <a-button type="text">
        <template #icon>
          <a-badge :count="123" :overflow-count="99">
            <BellOutlined :style="{ fontSize: '20px' }" />
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
          <GithubOutlined :style="{ fontSize: '20px' }" />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip>
      <template #title>文档手册</template>
      <a-button type="text" href="https://juejin.cn/column/7188761626017792056" target="_blank">
        <template #icon>
          <QuestionCircleOutlined :style="{ fontSize: '20px' }" />
        </template>
      </a-button>
    </a-tooltip>

    <a-dropdown placement="bottomRight" :trigger="['click', 'hover']">
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
