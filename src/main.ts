import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import "@ant-design-vue/pro-layout/dist/style.css";
import 'ant-design-vue/dist/antd.variable.min.css';
import ProLayout, { PageContainer } from '@ant-design-vue/pro-layout';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ProLayout);
app.use(PageContainer);

app.mount('#app');
