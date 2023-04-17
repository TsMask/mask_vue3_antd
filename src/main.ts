import { createApp } from 'vue';
import store from './store';
import App from './App.vue';
import router from './router';
import '@ant-design-vue/pro-layout/dist/style.css';
import 'ant-design-vue/dist/antd.variable.min.css';
import ProLayout, { PageContainer } from '@ant-design-vue/pro-layout';
import permsDirective from './directive/permsDirective';
import rolesDirective from './directive/rolesDirective';

const app = createApp(App);
app.use(store);
app.use(router);

// 全局组件
app.use(ProLayout);
app.use(PageContainer);

// 自定义指令
app.directive('perms', permsDirective);
app.directive('roles', rolesDirective);

app.mount('#app');
