import { defineStore } from 'pinia';
import {
  RouteComponent,
  RouteLocationRaw,
  RouteMeta,
  RouteRecordRaw,
} from 'vue-router';
import { getRouters } from '@/api/router';
import BasicLayout from '@/layouts/BasicLayout.vue';
import BlankLayout from '@/layouts/BlankLayout.vue';
import LinkLayout from '@/layouts/LinkLayout.vue';
import {
  MENU_COMPONENT_BASIC_LAYOUT,
  MENU_COMPONENT_BLANK_LAYOUT,
  MENU_COMPONENT_LINK_LAYOUT,
} from '@/constants/MenuConstants';

type RouterStore = {
  /**动态路由数据 */
  buildRouterData: RouteRecordRaw[];
};

const useRouterStore = defineStore('router', {
  state: (): RouterStore => ({
    buildRouterData: [],
  }),
  actions: {
    async generateRoutes() {
      const res = await getRouters();
      const buildRoutes = buildRouters(res.data.concat());
      this.buildRouterData = buildRoutes;
      return buildRoutes;
    },
  },
});

/**异步路由类型 */
type RecordRaws = {
  path: string;
  name: string;
  meta: RouteMeta;
  component: string;
  children: RecordRaws[];
};

/**
 * 构建动态路由
 *
 * 遍历后台配置的路由菜单，转换为组件路由菜单
 *
 * @param recordRaws 异步路由列表
 * @returns 可添加的路由列表
 */
function buildRouters(recordRaws: RecordRaws[]): RouteRecordRaw[] {
  const routers: RouteRecordRaw[] = [];
  for (const item of recordRaws) {
    // TODO 需要重整结构
    if (item.meta.link) continue;
    item.meta.icon = 'icon-pcduan';

    // 有子菜单进行递归并设置重定向到首个子菜单
    let children: RouteRecordRaw[] = [];
    let redirect: RouteLocationRaw = '';
    if (item.children && item.children.length > 0) {
      children = buildRouters(item.children);
      // 嵌套路由重定向需要子菜单拼接父级路径
      const firstChildPath = children[0].path;
      if (firstChildPath.startsWith('/')) {
        redirect = firstChildPath;
      } else {
        redirect = `${item.path}/${firstChildPath}`;
      }
    }
    // 路由页面组件
    let component: RouteComponent = {};
    if (item.component) {
      const comp = item.component;
      if (comp === MENU_COMPONENT_BASIC_LAYOUT) {
        component = BasicLayout;
      } else if (comp === MENU_COMPONENT_BLANK_LAYOUT) {
        component = BlankLayout;
      } else if (comp === MENU_COMPONENT_LINK_LAYOUT) {
        component = LinkLayout;
      } else {
        // 指定页面视图，一般用于显示子菜单
        component = findView(comp);
      }
    }
    // 构建路由
    const router: RouteRecordRaw = {
      path: item.path,
      name: item.name,
      meta: item.meta,
      component: component,
      redirect: redirect,
      children: children,
    };
    routers.push(router);
  }
  return routers;
}

/**
 * 查找页面模块
 *
 * 查找 `/views/system/menu/index.vue`
 *
 * 参数值为 `system/menu/index`
 *
 * @param dirName 组件路径
 * @returns 路由懒加载函数
 */
function findView(dirName: string) {
  let view = () => {};
  for (const dir in views) {
    const viewDirName = dir.split('views/')[1].split('.vue')[0];
    if (viewDirName === dirName) {
      view = () => views[dir]();
      break;
    }
  }
  return view;
}

// 匹配views里面所有的.vue文件
const views = import.meta.glob('./../../views/**/*.vue');

export default useRouterStore;
