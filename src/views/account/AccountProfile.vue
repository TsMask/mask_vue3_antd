<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { message } from 'antdv-next';
import { PageContainer } from 'antdv-pro-layout';
import { getUserProfile } from '@/api/profile';
import { isSuccess } from '@/api/httpClient';
import useUserStore from '@/store/modules/user';
import AccountProfileCard from './components/AccountProfileCard.vue';
import AccountProfileTabs from './components/AccountProfileTabs.vue';
import { createEmptyProfile, type AccountProfileData } from './accountProfile';

const userStore = useUserStore();
const loading = ref(true);
const profile = ref<AccountProfileData>(createEmptyProfile());

/** 加载个人资料，并将后端头像地址转换成当前环境可访问地址 */
async function handleGetProfile() {
  loading.value = true;
  try {
    const res = await getUserProfile();
    if (!isSuccess(res) || !res.data?.user) {
      message.error({
        content: res.msg || '获取个人信息失败',
        duration: 3,
      });
      return;
    }

    const { user, role_group, post_group } = res.data;
    user.user_avatar = userStore.fnAvatar(user.user_avatar);
    profile.value = {
      user,
      role_group: role_group || [],
      post_group: post_group || [],
    };
  } catch (error: any) {
    message.error({
      content: error?.message || '获取个人信息失败',
      duration: 3,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(handleGetProfile);
</script>

<template>
  <PageContainer :loading="loading">
    <a-row :gutter="16">
      <a-col :lg="6" :md="6" :xs="24">
        <AccountProfileCard :profile="profile" />
      </a-col>
      <a-col :lg="18" :md="18" :xs="24">
        <AccountProfileTabs @refresh="handleGetProfile" />
      </a-col>
    </a-row>
  </PageContainer>
</template>
