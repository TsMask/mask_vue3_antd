<script setup lang="ts">
import { parseDateToStr } from '@/utils/date';
import type { AccountProfileData } from '../accountProfile';

defineProps<{
  profile: AccountProfileData;
}>();
</script>

<template>
  <a-card :body-style="{ padding: '0px' }" class="profile-card">
    <template #title>
      <div class="profile-header">
        <div class="profile-number">No：{{ profile.user.id || '-' }}</div>
        <a-avatar
          shape="circle"
          :size="96"
          :src="profile.user.user_avatar"
          :alt="profile.user.user_name"
        />
        <div class="profile-nickname" :title="profile.user.user_nick">
          {{ profile.user.user_nick }}
        </div>
      </div>
    </template>

    <a-descriptions size="small" layout="vertical" :bordered="true" :column="1">
      <a-descriptions-item label="手机号码">
        {{ profile.user.user_phone || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="用户邮箱">
        {{ profile.user.user_email || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="所属部门">
        {{ profile.user.dept?.dept_name || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="拥有岗位">
        <span v-if="!profile.post_group.length">-</span>
        <a-tag v-for="post in profile.post_group" :key="post">
          {{ post }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="拥有角色">
        <span v-if="!profile.role_group.length">-</span>
        <a-tag v-for="role in profile.role_group" :key="role">
          {{ role }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="登录地址">
        {{ profile.user.user_login_ip || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="登录时间">
        <span v-if="+profile.user.user_login_time > 0">
          {{ parseDateToStr(+profile.user.user_login_time) }}
        </span>
        <span v-else>-</span>
      </a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>

<style scoped>
.profile-card {
  margin-bottom: 16px;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.profile-number {
  align-self: flex-start;
  margin-bottom: 16px;
  font-size: 14px;
}

.profile-nickname {
  width: 100%;
  margin-top: 16px;
  overflow: hidden;
  align-self: flex-start;
  text-align: center;
  text-overflow: ellipsis;
  font-size: 24px;
}
</style>
