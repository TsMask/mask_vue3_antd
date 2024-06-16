import { createApp } from 'vue';
import store from './store';
import App from './App.vue';
import router from './router';
import directive from './directive';
import 'antdv-pro-layout/dist/style.css';
// 样式四选一
// 全局样式-默认主题色
import "ant-design-vue/dist/antd.min.css";
// 全局样式-暗黑主题色
// import "ant-design-vue/dist/antd.dark.min.css";
// 全局样式-紧凑主题色
// import "ant-design-vue/dist/antd.compact.min.css";
// 全局样式-变量风格配色（明亮主题色）
// import 'ant-design-vue/dist/antd.variable.min.css';

const app = createApp(App);
app.use(store);
app.use(router);
app.use(directive);

app.mount('#app');
