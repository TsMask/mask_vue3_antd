<template>
  <PageContainer :disable-margin="false">
    <a-result
      status="404"
      title="Hello World"
      sub-title="Sorry, you are not authorized to access this page."
      class="result-box"
    >
      <template #extra>
        <a-button type="primary" @click="handleModal">Modal Click</a-button>
        <!-- 使用useModal获取上下文 -->
        <a-button type="default" @click="handleModalPromiseConfirm">
          Modal With promise
        </a-button>
        <contextHolder />
        <!-- 点击确定后异步关闭对话框，例如提交表单。 -->
        <a-button type="primary" @click="showModal">
          Modal with async logic
        </a-button>
        <a-modal
          v-model:open="open"
          title="Title"
          :confirm-loading="confirmLoading"
          @ok="handleOk"
        >
          <p>{{ modalText }}</p>
        </a-modal>

        <a-tooltip placement="top">
          <template #title>
            <span>prompt text</span>
          </template>
          <a-button type="dashed" @click="handleClick">Message Click</a-button>
        </a-tooltip>
        <a-button type="default" @click="handleNotification">
          Notification box
        </a-button>
        <a-popconfirm
          title="Title"
          @confirm="handleConfirm"
          @cancel="handleCancel"
        >
          <a-button type="primary">Open Popconfirm with Promise</a-button>
        </a-popconfirm>
      </template>

      <a-spin :spinning="spinning" :delay="500">
        <a-alert
          message="Alert message title"
          description="Further details about the context of this alert."
        ></a-alert>
      </a-spin>
      <div class="spin-state">
        Loading state：
        <a-switch v-model:checked="spinning" />
      </div>
    </a-result>
  </PageContainer>
</template>

<script lang="ts" setup>
import { PageContainer } from 'antdv-pro-layout';
import { message, Modal, notification } from 'antdv-next';
import { ExclamationCircleOutlined } from '@antdv-next/icons';
import { createVNode, h, ref } from 'vue';
const [modal, contextHolder] = Modal.useModal();

const spinning = ref<boolean>(false);

function handleClick() {
  message.success('Message Button clicked!');
}

function handleModal() {
  Modal.confirm({
    title: 'Are you sure Modal this task?',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Some descriptions',
    okText: 'Yes',
    okType: 'danger',
    cancelText: 'No',
    onOk() {
      message.warning('Modal Button clicked!');
    },
    onCancel() {},
  });
}

// 使用useModal获取上下文
function handleModalPromiseConfirm() {
  modal.confirm({
    title: 'Are you sure Modal this task?',
    icon: h(ExclamationCircleOutlined),
    content: 'Some descriptions',
    okText: 'Yes',
    okType: 'danger',
    okButtonProps: {
      disabled: true,
    },
    cancelText: 'No',
    onOk() {
      message.warning('Modal Button clicked!');
    },
    onCancel() {
      message.warning('Click on No');
    },
  });
}

function handleConfirm() {
  return new Promise(resolve => {
    setTimeout(() => resolve(true), 3000);
  });
}

function handleCancel() {
  message.error('Click on No');
}

function handleNotification() {
  notification.open({
    title: 'Notification Title',
    description:
      'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
    onClick: () => {
      message.info('Notification Clicked!');
    },
  });
}

// 点击确定后异步关闭对话框，例如提交表单。
const modalText = ref<string>('Content of the modal');
const open = ref<boolean>(false);
const confirmLoading = ref<boolean>(false);
function showModal() {
  open.value = true;
}

function handleOk() {
  modalText.value = 'The modal will be closed after two seconds';
  confirmLoading.value = true;
  setTimeout(() => {
    open.value = false;
    confirmLoading.value = false;
  }, 2000);
}
</script>

<style scoped lang="css">
.spin-state {
  margin-top: 16px;
}

.result-box {
  height: 100%;
  background: rgb(255, 255, 255);
}
[data-theme='dark'] .result-box {
  background: #141414;
}
</style>
