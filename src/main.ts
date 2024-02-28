import { createApp } from 'vue';
import store from './store';
import App from './App.vue';
import router from './router';
import directive from './directive';
import 'antdv-pro-layout/dist/style.css';
import 'ant-design-vue/dist/reset.css';

const app = createApp(App);
app.use(store);
app.use(router);
app.use(directive);

app.mount('#app');
