import { defineStore } from 'pinia';

const useAppStore = defineStore('app', {
  state: () => ({
    systemName: import.meta.env.VITE_APP_SYSTEM_NAME,
    title: '',
  }),
  actions: {
    // 设置网页标题
    setTitle(title: string) {
      if (title) {
        document.title = title + ' - ' + this.systemName;
      } else {
        document.title = this.systemName;
      }
    },
  },
});

export default useAppStore;
