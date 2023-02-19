import 'vue-router';
import { MetaRecord, MenuDataItem } from '@ant-design-vue/pro-layout';

declare module 'vue-router' {
  interface RouteMeta extends MetaRecord {
    requiresAuth?: boolean;
  }
}
