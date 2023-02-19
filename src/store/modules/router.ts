import { defineStore } from 'pinia';
import { RouteComponent, RouteLocationRaw, RouteRecordRaw } from 'vue-router';
import { getRouters } from '@/api/router';
import BasicLayout from '@/layouts/BasicLayout.vue';
import BlankLayout from '@/layouts/BlankLayout.vue';
import LinkLayout from '@/layouts/LinkLayout.vue';
import {
  MENU_COMPONENT_BASIC_LAYOUT,
  MENU_COMPONENT_BLANK_LAYOUT,
  MENU_COMPONENT_LINK_LAYOUT,
} from '@/constants/MenuConstants';
import { constantRoutes } from '@/router';
import { MenuDataItem } from '@ant-design-vue/pro-layout/dist/typings';

// 匹配views里面所有的.vue文件
const views = import.meta.glob('./../../views/**/*.vue');

const useRouterStore = defineStore('router', {
  state: () => ({
    /**菜单列表 */
    menuData: [] as MenuDataItem[],
  }),
  actions: {
    setMenuData(menuData: MenuDataItem[]) {
      this.menuData = menuData;
    },
    // setDefaultRoutes(routes) {
    //   this.defaultRoutes = constantRoutes.concat(routes);
    // },
    // setTopbarRoutes(routes) {
    //   this.topbarRouters = routes;
    //   console.log(this.routes);
    // },
    // setSidebarRouters(routes) {
    //   this.menuDataList = routes;
    // },
    async generateRoutes() {
      const res = await getRouters();
      // 序列化去除副作用
      const recordRaws = JSON.parse(JSON.stringify(res.data));
      const buildRoutes = buildRouters(recordRaws);
      // this.setSidebarRouters(buildRoutes);
      console.log('generateRoutes', buildRoutes);

      const menuData = generateMenuData(buildRoutes);
      this.setMenuData(menuData);
      console.log(menuData);
      // const defaultRoutes = filterAsyncRouter(defaultData, false, true);
      // console.log('generateRoutes2', defaultRoutes2);
      return buildRoutes;
      // return new Promise(resolve => {
      //   // 向后端请求路由数据
      //   getRouters().then(res => {
      //     const sdata = JSON.parse(JSON.stringify(res.data));
      //     const rdata = JSON.parse(JSON.stringify(res.data));
      //     const defaultData = JSON.parse(JSON.stringify(res.data));
      //     const sidebarRoutes = filterAsyncRouter(sdata);
      //     const rewriteRoutes = filterAsyncRouter(rdata, false, true);
      //     const defaultRoutes = filterAsyncRouter(defaultData);
      //     // const asyncRoutes = filterDynamicRoutes(dynamicRoutes)
      //     // asyncRoutes.forEach(route => { router.addRoute(route) })
      //     this.setRoutes(rewriteRoutes);
      //     this.setSidebarRouters(constantRoutes.concat(sidebarRoutes));
      //     this.setDefaultRoutes(sidebarRoutes);
      //     this.setTopbarRoutes(defaultRoutes);
      //     resolve(rewriteRoutes);
      //   });
      // });
    },
  },
});

function generateMenuData(buildRoutes: RouteRecordRaw[]): MenuDataItem[] {
  let menuData: MenuDataItem[] = [];
  // 获取根路由作为菜单节点
  const indexRoute = constantRoutes.find(item => item.path === '/');
  if (indexRoute && indexRoute.children) {
    const indexRouteMenuData = buildMenuData(indexRoute.children);
    const buildRoutesMenuData = buildMenuData(buildRoutes);
    menuData = indexRouteMenuData.concat(buildRoutesMenuData);
  }
  return menuData;
}

function buildMenuData(routes: RouteRecordRaw[]): MenuDataItem[] {
  const menuDataItem: MenuDataItem[] = [];
  for (const route of routes) {
    // TODO 需要重整结构
    if (route.meta.link) continue;
    route.meta.icon = 'icon-pcduan';

    let children: MenuDataItem[] = [];
    // 是否有子菜单进行递归
    if (route.children && route.children.length > 0) {
      children = buildMenuData(route.children);
    }
    // 添加到数据项
    menuDataItem.push({
      path: route.path,
      name: route.name,
      meta: route.meta,
      children: children,
    });
  }
  return menuDataItem;
}

/**异步路由类型 */
type RecordRaws = {
  path: string;
  name: string;
  meta: Record<string, any>;
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

export default useRouterStore;
