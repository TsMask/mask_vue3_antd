<script setup lang="ts">
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue';
import useLayoutStore from '@/store/modules/layout';
import useUserStore from '@/store/modules/user';
import { useRouter } from 'vue-router';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';

const { changeVisibleLayoutSetting } = useLayoutStore();
const { userName, nickName, avatar, fnLogOut } = useUserStore();
const router = useRouter();

/**头像展开项点击 */
async function fnClick({ key }: MenuInfo) {
  switch (key) {
    case 'layoutSetting':
      changeVisibleLayoutSetting();
      break;
    case 'perfile':
      router.push({ name: 'Profile' });
      break;
    case 'logout':
      await fnLogOut();
      router.push({ name: 'Login' });
      break;
  }
}
</script>

<template>
  <a-space :size="8" align="center">
    <a-dropdown placement="bottomRight" :trigger="['click', 'hover']">
      <div class="user">
        <a-avatar
          shape="circle"
          size="default"
          :src="avatar"
          :alt="userName"
        ></a-avatar>
        <span class="nick">{{ nickName }}</span>
      </div>

      <template #overlay>
        <a-menu @click="fnClick">
          <a-menu-item key="layoutSetting">
            <template #icon>
              <SettingOutlined />
            </template>
            <span>布局设置</span>
          </a-menu-item>
          <a-menu-item key="perfile">
            <template #icon>
              <UserOutlined />
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
    margin-left: 8px;
    font-size: 16px;
  }
}
</style>
