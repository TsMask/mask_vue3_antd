<script lang="ts" setup>
import { message } from 'ant-design-vue';
import { getUserProfile } from '@/api/system/user';
import { reactive, ref, onMounted } from 'vue';
import { parseDateToStr } from '@/utils/DateUtils';
import useUserStore from '@/store/modules/user';

/**Tab标签激活 */
let activeKey = ref<string>('empty');

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
    id: 'Vue',
    title: 'Vue.js - 渐进式 JavaScript 框架 | Vue.js',
    description:
      '基于标准 HTML、CSS 和 JavaScript 构建,提供容易上手的 API 和一流的文档。 性能出色 经过编译器优化、完全响应式的渲染系统,几乎不需要手动优化。',
  },
  {
    id: 'Vue Router',
    title: 'Vue Router | Vue.js 的官方路由',
    description:
      '为Vue.js 提供富有表现力、可配置的、方便的路由，用直观且强大的语法来定义静态或动态路由。',
  },
  {
    id: 'Pinia',
    title: 'Pinia | The intuitive store for Vue.js',
    description:
      'Pinia hooks into Vue devtools to give you an enhanced development experience in both Vue 2 and Vue 3. ',
  },
  {
    id: 'Vite',
    title: 'Vite | 下一代的前端工具链',
    description:
      'Vite(法语意为 "快速的",发音 /vit/,发音同 "veet")是一种新型前端构建工具,能够显著提升前端开发体验',
  },
]);

/**查询用户个人信息 */
function fnGetProfile() {
  getUserProfile().then(res => {
    if (res.code === 200) {
      state.user = res.data;
      state.roleGroup = res.roleGroup;
      state.postGroup = res.postGroup;
      // 头像解析
      state.user.avatar = useUserStore().fnAvatar(state.user.avatar);
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
              <div class="info-top-nickname" :title="state.user.nickName">
                {{ state.user.nickName }}
              </div>
            </div>
          </template>
          <a-descriptions
            size="small"
            layout="vertical"
            :bordered="true"
            :column="1"
          >
            <a-descriptions-item label="手机号码">
              {{ state.user.phonenumber || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="用户邮箱">
              {{ state.user.email || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="所属部门">
              {{ state.user.dept?.deptName || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="拥有岗位">
              <span v-if="state.postGroup.length === 0">-</span>
              <a-tag v-else v-for="v in state.postGroup" :key="v">
                {{ v }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="拥有角色">
              <span v-if="state.roleGroup.length === 0">-</span>
              <a-tag v-else v-for="v in state.roleGroup" :key="v">
                {{ v }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="登录地址">
              {{ state.user.loginIp || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="登录时间">
              <span v-if="+state.user.loginDate > 0">
                {{ parseDateToStr(+state.user.loginDate) }}
              </span>
              <span>-</span>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :lg="18" :md="18" :xs="24">
        <a-card>
          <a-tabs
            tab-position="top"
            :destroy-inactive-tab-pane="true"
            v-model:activeKey="activeKey"
          >
            <a-tab-pane key="list" tab="列表">
              <a-list
                item-layout="horizontal"
                :data-source="listData"
                row-key="id"
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
                        <a-avatar>{{ item.id }}</a-avatar>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
            </a-tab-pane>
            <a-tab-pane key="empty" tab="空状态">
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
    align-self: flex-start;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 100%;
  }
}
</style>
