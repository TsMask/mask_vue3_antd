import { defineStore } from 'pinia';

const useAppStore = defineStore('app', {
  state: () => ({
    title: '',
    sidebar: {
      opened: true,
      withoutAnimation: false,
      hide: false,
    },
    device: 'desktop',
    size: 'default',
  }),
  actions: {
    toggleSideBar(withoutAnimation) {
      if (this.sidebar.hide) {
        return false;
      }
      this.sidebar.opened = !this.sidebar.opened;
      this.sidebar.withoutAnimation = withoutAnimation;
    },
    closeSideBar({ withoutAnimation }) {
      this.sidebar.opened = false;
      this.sidebar.withoutAnimation = withoutAnimation;
    },
    toggleDevice(device) {
      this.device = device;
    },
    setSize(size) {
      this.size = size;
    },
    toggleSideBarHide(status) {
      this.sidebar.hide = status;
    },
    // 设置网页标题
    setTitle(title) {
      this.title = title;
      const appTitle = import.meta.env.VITE_APP_TITLE;
      if (title) {
        document.title = title + ' - ' + appTitle;
      } else {
        document.title = appTitle;
      }
    },
  },
});

export default useAppStore;
