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
  MENU_COMPONENT_LAYOUT_BASIC,
  MENU_COMPONENT_LAYOUT_BLANK,
  MENU_COMPONENT_LAYOUT_LINK,
} from '@/constants/menu-constants';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';

/**路由构建参数类型 */
type RouterStore = {
  /**初始的根路由数据 */
  rootRouterData: RouteRecordRaw[];
  /**动态路由数据 */
  buildRouterData: RouteRecordRaw[];
};

const useRouterStore = defineStore('router', {
  state: (): RouterStore => ({
    rootRouterData: [],
    buildRouterData: [],
  }),
  actions: {
    /**
     * 记录初始根节点菜单数据
     * @param data 初始数据
     * @returns 初始数据
     */
    setRootRouterData(data: RouteRecordRaw[]) {
      if (this.rootRouterData.length <= 0) {
        this.rootRouterData = data;
      }
      return this.rootRouterData;
    },
    /**
     * 动态路由列表数据生成
     * @returns 生成的路由菜单
     */
    async generateRoutes() {
      const res = await getRouters();
      if (res.code === RESULT_CODE_SUCCESS && Array.isArray(res.data)) {
        const buildRoutes = buildRouters(res.data.concat());
        this.buildRouterData = buildRoutes;
        return buildRoutes;
      }
      return [];
    },
  },
});

/**异步路由类型 */
type RecordRaws = {
  path: string;
  name: string;
  meta: RouteMeta;
  redirect: RouteLocationRaw;
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
    // 路由页面组件
    let component: RouteComponent = {};
    if (item.component) {
      const comp = item.component;
      if (comp === MENU_COMPONENT_LAYOUT_BASIC) {
        component = BasicLayout;
      } else if (comp === MENU_COMPONENT_LAYOUT_BLANK) {
        component = BlankLayout;
      } else if (comp === MENU_COMPONENT_LAYOUT_LINK) {
        component = LinkLayout;
      } else {
        // 指定页面视图，一般用于显示子菜单
        component = findView(comp);
      }
    }

    // 有子菜单进行递归
    let children: RouteRecordRaw[] = [];
    if (item.children && item.children.length > 0) {
      children = buildRouters(item.children);
    }

    // 对元数据特殊参数进行处理
    let metaIcon = (item.meta?.icon as string) || '';
    if (!metaIcon.startsWith('icon-')) {
      metaIcon = '';
    }
    item.meta = Object.assign(item.meta, {
      icon: metaIcon,
    });

    // 构建路由
    const router: RouteRecordRaw = {
      path: item.path,
      name: item.name,
      meta: item.meta,
      redirect: item.redirect,
      component: component,
      children: children,
    };
    routers.push(router);
  }
  return routers;
}

/**匹配views里面所有的.vue或.tsx文件 */
const views = import.meta.glob('./../../views/**/*.{vue,tsx}');

/**
 * 查找页面模块
 *
 * 查找 `/views/system/menu/index.vue` 或 `/views/system/menu/index.tsx`
 *
 * 参数值为 `system/menu/index`
 *
 * @param dirName 组件路径
 * @returns 路由懒加载函数
 */
function findView(dirName: string) {
  for (const dir in views) {
    let viewDirName = '';
    const component = dir.match(/views\/(.+)\.(vue|tsx)/);
    if (component && component.length === 3) {
      viewDirName = component[1];
    }
    if (viewDirName === dirName) {
      return () => views[dir]();
    }
  }
  return () => import('@/views/error/404.vue');
}

export default useRouterStore;
