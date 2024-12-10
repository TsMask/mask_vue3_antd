<script setup lang="ts">
import { useRoute } from 'vue-router';
import { reactive, ref, onMounted, toRaw } from 'vue';
import { PageContainer } from 'antdv-pro-layout';
import { ProModal } from 'antdv-pro-modal';
import { message, Modal, Form } from 'ant-design-vue/lib';
import { SizeType } from 'ant-design-vue/lib/config-provider';
import { MenuInfo } from 'ant-design-vue/lib/menu/src/interface';
import { ColumnsType } from 'ant-design-vue/lib/table';
import {
  listNotice,
  getNotice,
  delNotice,
  addNotice,
  updateNotice,
} from '@/api/system/notice';
import { parseDateToStr } from '@/utils/date-utils';
import useDictStore from '@/store/modules/dict';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';
const { getDict } = useDictStore();
const route = useRoute();

/**路由标题 */
let title = ref<string>(route.meta.title ?? '标题');

/**字典数据 */
let dict: {
  /**公告类型 */
  sysNoticeType: DictType[];
  /**公告状态 */
  sysNoticeStatus: DictType[];
} = reactive({
  sysNoticeType: [],
  sysNoticeStatus: [],
});

/**查询参数 */
let queryParams = reactive({
  /**公告标题 */
  noticeTitle: '',
  /**创建者 */
  createBy: undefined,
  /**公告类型 */
  noticeType: undefined,
  /**公告状态 */
  statusFlag: undefined,
  /**当前页数 */
  pageNum: 1,
  /**每页条数 */
  pageSize: 20,
});

/**查询参数重置 */
function fnQueryReset() {
  Object.assign(queryParams, {
    noticeTitle: '',
    createBy: '',
    noticeType: undefined,
    statusFlag: undefined,
    pageNum: 1,
    pageSize: 20,
  });
  tablePagination.current = 1;
  tablePagination.pageSize = 20;
  fnGetList();
}

/**表格状态类型 */
type TabeStateType = {
  /**加载等待 */
  loading: boolean;
  /**紧凑型 */
  size: SizeType;
  /**斑马纹 */
  striped: boolean;
  /**搜索栏 */
  seached: boolean;
  /**记录数据 */
  data: object[];
  /**勾选记录 */
  selectedRowKeys: (string | number)[];
};

/**表格状态 */
let tableState: TabeStateType = reactive({
  loading: false,
  size: 'middle',
  striped: false,
  seached: false,
  data: [],
  selectedRowKeys: [],
});

/**表格字段列 */
let tableColumns: ColumnsType = [
  {
    title: '公告编号',
    dataIndex: 'noticeId',
    align: 'left',
    width: 100,
  },
  {
    title: '公告标题',
    dataIndex: 'noticeTitle',
    align: 'left',
    width: 300,
  },
  {
    title: '公告类型',
    dataIndex: 'noticeType',
    key: 'noticeType',
    align: 'left',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'statusFlag',
    key: 'statusFlag',
    align: 'left',
    width: 100,
  },
  {
    title: '创建者',
    dataIndex: 'createBy',
    align: 'left',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    align: 'left',
    width: 150,
    customRender(opt) {
      if (+opt.value <= 0) return '';
      return parseDateToStr(+opt.value);
    },
  },
  {
    title: '操作',
    key: 'noticeId',
    align: 'left',
  },
];

/**表格分页器参数 */
let tablePagination = reactive({
  /**当前页数 */
  current: 1,
  /**每页条数 */
  pageSize: 20,
  /**默认的每页条数 */
  defaultPageSize: 20,
  /**指定每页可以显示多少条 */
  pageSizeOptions: ['10', '20', '50', '100'],
  /**只有一页时是否隐藏分页器 */
  hideOnSinglePage: false,
  /**是否可以快速跳转至某页 */
  showQuickJumper: true,
  /**是否可以改变 pageSize */
  showSizeChanger: true,
  /**数据总数 */
  total: 0,
  showTotal: (total: number) => `总共 ${total} 条`,
  onChange: (page: number, pageSize: number) => {
    tablePagination.current = page;
    tablePagination.pageSize = pageSize;
    queryParams.pageNum = page;
    queryParams.pageSize = pageSize;
    fnGetList();
  },
});

/**表格紧凑型变更操作 */
function fnTableSize({ key }: MenuInfo) {
  tableState.size = key as SizeType;
}

/**表格斑马纹 */
function fnTableStriped(_record: unknown, index: number): any {
  return tableState.striped && index % 2 === 1 ? 'table-striped' : undefined;
}

/**表格多选 */
function fnTableSelectedRowKeys(keys: (string | number)[]) {
  tableState.selectedRowKeys = keys;
}

/**对话框对象信息状态类型 */
type ModalStateType = {
  /**详情框是否显示 */
  visibleByView: boolean;
  /**新增框或修改框是否显示 */
  visibleByEdit: boolean;
  /**标题 */
  title: string;
  /**表单数据 */
  form: Record<string, any>;
  /**确定按钮 loading */
  confirmLoading: boolean;
};

/**对话框对象信息状态 */
let modalState: ModalStateType = reactive({
  visibleByView: false,
  visibleByEdit: false,
  title: '公告',
  form: {
    noticeId: undefined,
    noticeTitle: '',
    noticeContent: '',
    noticeType: '2',
    statusFlag: '1',
    delFlag: '0',
    remark: '',
    createBy: undefined,
    createTime: undefined,
    updateBy: undefined,
    updateTime: undefined,
  },
  confirmLoading: false,
});

/**对话框内表单属性和校验规则 */
const modalStateForm = Form.useForm(
  modalState.form,
  reactive({
    noticeTitle: [
      { required: true, min: 2, max: 50, message: '请正确输入公告标题' },
    ],
    noticeType: [{ required: true, message: '请选择公告类型' }],
    noticeContent: [
      {
        required: true,
        min: 2,
        max: 3000,
        message: '请正确输入公告内容，限10-3000个字符',
      },
    ],
  })
);

/**
 * 对话框弹出显示为 查看
 * @param noticeId 公告id
 */
function fnModalVisibleByVive(noticeId: string | number) {
  if (!noticeId) {
    message.error({
      content: '获取公告信息失败',
      duration: 3,
    });
    return;
  }
  if (modalState.confirmLoading) return;
  const hide = message.loading('正在打开...', 0);
  modalState.confirmLoading = true;
  getNotice(noticeId)
    .then(res => {
      if (res.code === RESULT_CODE_SUCCESS) {
        Object.assign(modalState.form, res.data);
        modalState.title = '公告信息';
        modalState.visibleByView = true;
      } else {
        message.error({
          content: '获取公告信息失败',
          duration: 3,
        });
      }
    })
    .finally(() => {
      hide();
      modalState.confirmLoading = false;
    });
}

/**
 * 对话框弹出显示为 新增或者修改
 * @param noticeId 公告id, 不传为新增
 */
function fnModalVisibleByEdit(noticeId?: string | number) {
  if (!noticeId) {
    modalStateForm.resetFields();
    modalState.title = '添加公告';
    modalState.visibleByEdit = true;
  } else {
    if (modalState.confirmLoading) return;
    const hide = message.loading('正在打开...', 0);
    modalState.confirmLoading = true;
    getNotice(noticeId)
      .then(res => {
        if (res.code === RESULT_CODE_SUCCESS) {
          Object.assign(modalState.form, res.data);
          modalState.title = '修改公告';
          modalState.visibleByEdit = true;
        } else {
          message.error({
            content: '获取公告信息失败',
            duration: 3,
          });
        }
      })
      .finally(() => {
        hide();
        modalState.confirmLoading = false;
      });
  }
}

/**
 * 对话框弹出确认执行函数
 * 进行表达规则校验
 */
function fnModalOk() {
  modalStateForm
    .validate()
    .then(() => {
      const hide = message.loading('请稍等...', 0);
      modalState.confirmLoading = true;
      const form = toRaw(modalState.form);
      const notice = form.noticeId ? updateNotice(form) : addNotice(form);
      notice
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `${modalState.title}成功`,
              duration: 3,
            });
            fnGetList(1);
            fnModalCancel();
          } else {
            message.error({
              content: `${res.msg}`,
              duration: 3,
            });
          }
        })
        .finally(() => {
          hide();
          modalState.confirmLoading = false;
        });
    })
    .catch(e => {
      message.error({
        content: `请正确填写 ${e.errorFields.length} 处必填信息！`,
        duration: 3,
      });
    });
}

/**
 * 对话框弹出关闭执行函数
 * 进行表达规则校验
 */
function fnModalCancel() {
  modalState.visibleByEdit = false;
  modalState.visibleByView = false;
  modalStateForm.resetFields();
}

/**
 * 公告删除
 * @param noticeId 公告编号ID
 */
function fnRecordDelete(noticeId: string = '0') {
  if (noticeId === '0') {
    noticeId = tableState.selectedRowKeys.join(',');
  }
  Modal.confirm({
    title: '提示',
    content: `确认删除公告编号为 【${noticeId}】 的数据项?`,
    onOk() {
      const hide = message.loading('请稍等...', 0);
      delNotice(noticeId)
        .then(res => {
          if (res.code === RESULT_CODE_SUCCESS) {
            message.success({
              content: `删除成功`,
              duration: 3,
            });
            fnGetList();
          } else {
            message.error({
              content: `${res.msg}`,
              duration: 3,
            });
          }
        })
        .finally(() => {
          hide();
        });
    },
  });
}

/**查询公告列表, pageNum初始页数 */
function fnGetList(pageNum?: number) {
  if (tableState.loading) return;
  tableState.loading = true;
  if (pageNum) {
    queryParams.pageNum = pageNum;
  }
  listNotice(toRaw(queryParams)).then(res => {
    if (res.code === RESULT_CODE_SUCCESS) {
      // 取消勾选
      if (tableState.selectedRowKeys.length > 0) {
        tableState.selectedRowKeys = [];
      }
      const { total, rows } = res.data;
      tablePagination.total = total;
      tableState.data = rows;
    }
    tableState.loading = false;
  });
}

onMounted(() => {
  // 初始字典数据
  Promise.allSettled([
    getDict('sys_notice_type'),
    getDict('sys_notice_status'),
  ]).then(resArr => {
    if (resArr[0].status === 'fulfilled') {
      dict.sysNoticeType = resArr[0].value;
    }
    if (resArr[1].status === 'fulfilled') {
      dict.sysNoticeStatus = resArr[1].value;
    }
  });
  // 获取列表数据
  fnGetList();
});
</script>

<template>
  <PageContainer :title="title">
    <template #content>
      <a-typography-paragraph>
        发布公告给內部用户的通知。
      </a-typography-paragraph>
    </template>

    <a-card
      v-show="tableState.seached"
      :bordered="false"
      :body-style="{ marginBottom: '24px', paddingBottom: 0 }"
    >
      <!-- 表格搜索栏 -->
      <a-form :model="queryParams" name="queryParams" layout="horizontal">
        <a-row :gutter="16">
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="公告标题" name="noticeTitle">
              <a-input
                v-model:value="queryParams.noticeTitle"
                allow-clear
                placeholder="请输入公告标题"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="创建者" name="createBy">
              <a-input
                v-model:value="queryParams.createBy"
                allow-clear
                placeholder="请输入创建者"
              ></a-input>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="公告类型" name="noticeType">
              <a-select
                v-model:value="queryParams.noticeType"
                allow-clear
                placeholder="请选择公告类型"
                :options="dict.sysNoticeType"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item label="公告状态" name="statusFlag">
              <a-select
                v-model:value="queryParams.statusFlag"
                allow-clear
                placeholder="请选择公告状态"
                :options="dict.sysNoticeStatus"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :xs="24">
            <a-form-item>
              <a-space :size="8">
                <a-button type="primary" @click.prevent="fnGetList(1)">
                  <template #icon><SearchOutlined /></template>
                  搜索
                </a-button>
                <a-button type="default" @click.prevent="fnQueryReset">
                  <template #icon><ClearOutlined /></template>
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-card :bordered="false" :body-style="{ padding: '0px' }">
      <!-- 插槽-卡片左侧侧 -->
      <template #title>
        <a-space :size="8" align="center">
          <a-button
            type="primary"
            @click.prevent="fnModalVisibleByEdit()"
            v-perms:has="['system:notice:add']"
          >
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
          <a-button
            type="default"
            danger
            :disabled="tableState.selectedRowKeys.length <= 0"
            @click.prevent="fnRecordDelete()"
            v-perms:has="['system:notice:remove']"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
        </a-space>
      </template>

      <!-- 插槽-卡片右侧 -->
      <template #extra>
        <a-space :size="8" align="center">
          <a-tooltip placement="topRight">
            <template #title>搜索栏</template>
            <a-switch
              v-model:checked="tableState.seached"
              checked-children="显"
              un-checked-children="隐"
              size="small"
            />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>表格斑马纹</template>
            <a-switch
              v-model:checked="tableState.striped"
              checked-children="开"
              un-checked-children="关"
              size="small"
            />
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>刷新</template>
            <a-button type="text" @click.prevent="fnGetList()">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip placement="topRight">
            <template #title>密度</template>
            <a-dropdown placement="bottomRight" trigger="click">
              <a-button type="text">
                <template #icon><ColumnHeightOutlined /></template>
              </a-button>
              <template #overlay>
                <a-menu
                  :selected-keys="[tableState.size as string]"
                  @click="fnTableSize"
                >
                  <a-menu-item key="default">默认</a-menu-item>
                  <a-menu-item key="middle">中等</a-menu-item>
                  <a-menu-item key="small">紧凑</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-tooltip>
        </a-space>
      </template>

      <!-- 表格列表 -->
      <a-table
        class="table"
        row-key="noticeId"
        :columns="tableColumns"
        :loading="tableState.loading"
        :data-source="tableState.data"
        :size="tableState.size"
        :row-class-name="fnTableStriped"
        :pagination="tablePagination"
        :scroll="{
          x: tableColumns.length * 120,
          scrollToFirstRowOnChange: true,
        }"
        :row-selection="{
          type: 'checkbox',
          selectedRowKeys: tableState.selectedRowKeys,
          onChange: fnTableSelectedRowKeys,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'noticeType'">
            <DictTag :options="dict.sysNoticeType" :value="record.noticeType" />
          </template>
          <template v-if="column.key === 'statusFlag'">
            <DictTag
              :options="dict.sysNoticeStatus"
              :value="record.statusFlag"
            />
          </template>
          <template v-if="column.key === 'noticeId'">
            <a-space :size="8" align="center">
              <a-tooltip placement="topRight">
                <template #title>查看详情</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByVive(record.noticeId)"
                  v-perms:has="['system:notice:query']"
                >
                  <template #icon><ProfileOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>编辑</template>
                <a-button
                  type="link"
                  @click.prevent="fnModalVisibleByEdit(record.noticeId)"
                  v-perms:has="['system:notice:edit']"
                >
                  <template #icon><FormOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip placement="topRight">
                <template #title>删除</template>
                <a-button
                  type="link"
                  @click.prevent="fnRecordDelete(record.noticeId)"
                  v-perms:has="['system:notice:remove']"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情框 -->
    <ProModal
      :drag="true"
      :width="800"
      :visible="modalState.visibleByView"
      :title="modalState.title"
      @cancel="fnModalCancel"
    >
      <a-form layout="horizontal" :label-col="{ span: 6 }" :label-wrap="true">
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="公告类型" name="noticeType">
              <DictTag
                :options="dict.sysNoticeType"
                :value="modalState.form.noticeType"
              />
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="公告状态" name="statusFlag">
              <DictTag
                :options="dict.sysNoticeStatus"
                :value="modalState.form.statusFlag"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="公告标题"
          name="noticeTitle"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          {{ modalState.form.noticeTitle }}
        </a-form-item>
        <a-form-item
          label="公告内容"
          name="noticeContent"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          {{ modalState.form.noticeContent }}
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button key="cancel" @click="fnModalCancel">关闭</a-button>
      </template>
    </ProModal>

    <!-- 新增框或修改框 -->
    <ProModal
      :drag="true"
      :destroyOnClose="true"
      :width="800"
      :keyboard="false"
      :mask-closable="false"
      :visible="modalState.visibleByEdit"
      :title="modalState.title"
      :confirm-loading="modalState.confirmLoading"
      @ok="fnModalOk"
      @cancel="fnModalCancel"
    >
      <a-form
        name="modalStateForm"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :label-wrap="true"
      >
        <a-row :gutter="16">
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item
              label="公告类型"
              name="noticeType"
              v-bind="modalStateForm.validateInfos.noticeType"
            >
              <a-select
                v-model:value="modalState.form.noticeType"
                default-value="1"
                placeholder="公告类型"
                :options="dict.sysNoticeType"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :lg="12" :md="12" :xs="24">
            <a-form-item label="公告状态" name="statusFlag">
              <a-select
                v-model:value="modalState.form.statusFlag"
                default-value="0"
                placeholder="公告状态"
                :options="dict.sysNoticeStatus"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item
          label="公告标题"
          name="noticeTitle"
          v-bind="modalStateForm.validateInfos.noticeTitle"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-input
            v-model:value="modalState.form.noticeTitle"
            allow-clear
            placeholder="请输入公告标题"
            :maxlength="50"
          ></a-input>
        </a-form-item>
        <a-form-item
          label="公告内容"
          name="noticeContent"
          v-bind="modalStateForm.validateInfos.noticeContent"
          :label-col="{ span: 3 }"
          :label-wrap="true"
        >
          <a-textarea
            v-model:value="modalState.form.noticeContent"
            :auto-size="{ minRows: 4, maxRows: 14 }"
            :maxlength="3000"
            :show-count="true"
            placeholder="请输入公告内容"
          />
        </a-form-item>
      </a-form>
    </ProModal>
  </PageContainer>
</template>

<style lang="less" scoped>
.table :deep(.table-striped) td {
  background-color: #fafafa;
}

.table :deep(.ant-pagination) {
  padding: 0 24px;
}
</style>
