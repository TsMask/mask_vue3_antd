import 'vue-router';
import { MetaRecord, MenuDataItem } from 'antdv-pro-layout';

declare module 'vue-router' {
  interface RouteMeta extends MetaRecord {
    /**请求授权 */
    requiresAuth?: boolean;
    /**权限 */
    permissions?: string[];
    /**角色 */
    roles?: string[];
    /**布局导航树 */
    navigation?: MenuDataItem[];
    /**iframe 原始链接 */
    href?: string;
  }
}
