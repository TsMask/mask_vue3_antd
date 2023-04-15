<script lang="ts" setup>
import { message } from 'ant-design-vue';
import { getUserProfile } from '@/api/system/user';
import { reactive, ref, onMounted } from 'vue';
import { parseDateToStr } from '@/utils/DateUtils';
import defaultAvatar from '@/assets/images/default_avatar.png';

/**Tab标签激活 */
let activeKey = ref<string>('1');

/**个人信息数据状态 */
let state = reactive<{
  user: Record<string, any>;
  postGroup: string[];
  roleGroup: string[];
}>({
  user: {},
  postGroup: [],
  roleGroup: [],
});

/**列表数据 */
let listData = ref([
  {
    title: 'Vue',
    description: 'vue',
  },
  {
    title: 'Pina',
    description: 'Pina',
  },
  {
    title: 'Vite',
    description: 'Vite',
  },
]);

/**查询用户个人信息 */
function fnGetProfile() {
  getUserProfile().then(res => {
    if (res.code === 200) {
      state.user = res.data;
      state.roleGroup = res.roleGroup;
      state.postGroup = res.postGroup;
      // 头像初始化
      let avatar = state.user.avatar;
      if (avatar) {
        const baseApi = import.meta.env.VITE_API_BASE_URL;
        avatar = `${baseApi}${avatar}`;
      } else {
        avatar = defaultAvatar;
      }
      state.user.avatar = avatar;
    } else {
      message.error(res.msg, 3);
    }
  });
}

onMounted(() => {
  // 获取信息
  fnGetProfile();
});
</script>

<template>
  <page-container>
    <a-row :gutter="16">
      <a-col :lg="6" :md="6" :xs="24">
        <a-card :body-style="{ padding: '0px' }">
          <template #title>
            <div class="info-top">
              <div class="info-top-no">No：{{ state.user.userId }}</div>
              <a-avatar
                shape="circle"
                :size="96"
                :src="state.user.avatar"
                :alt="state.user.userName"
              ></a-avatar>
              <div class="info-top-nickname">{{ state.user.nickName }}</div>
            </div>
          </template>
          <a-descriptions
            size="small"
            layout="vertical"
            :bordered="true"
            :column="1"
          >
            <a-descriptions-item label="手机号码">
              {{ state.user.phonenumber }}
            </a-descriptions-item>
            <a-descriptions-item label="用户邮箱">
              {{ state.user.email }}
            </a-descriptions-item>
            <a-descriptions-item label="所属部门">
              {{ state.user.dept?.deptName }}
            </a-descriptions-item>
            <a-descriptions-item label="拥有岗位">
              <a-tag v-for="v in state.postGroup" :key="v">{{ v }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="拥有角色">
              <a-tag v-for="v in state.roleGroup" :key="v">{{ v }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="登录地址">
              {{ state.user.loginIp }}
            </a-descriptions-item>
            <a-descriptions-item label="登录时间">
              {{ parseDateToStr(+state.user.loginDate) }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :lg="18" :md="18" :xs="24">
        <a-card>
          <a-tabs tab-position="top" v-model:activeKey="activeKey">
            <a-tab-pane key="1" tab="列表">
              <a-list
                item-layout="horizontal"
                :data-source="listData"
                row-key="title"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #title>
                        {{ item.title }}
                      </template>
                      <template #description>
                        {{ item.description }}
                      </template>
                      <template #avatar>
                        <a-avatar>{{ item.title }}</a-avatar>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
            </a-tab-pane>
            <a-tab-pane key="2" tab="空状态">
              <a-empty>
                <template #description> 暂无数据，尝试刷新看看 </template>
                <a-button type="primary">刷新</a-button>
              </a-empty>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>
  </page-container>
</template>

<style lang="less" scoped>
.info-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  &-no {
    align-self: flex-start;
    font-size: 14px;
    margin-bottom: 16px;
  }
  &-nickname {
    margin-top: 16px;
    font-size: 24px;
  }
}
</style>
