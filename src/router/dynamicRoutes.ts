import type { RouteComponent, RouteRecordRaw, Router } from 'vue-router';
import {
  clearMenuItem,
  getMenuData,
  type MenuDataItem,
} from 'antdv-pro-layout';
import { getAuthMenus } from '@/api/auth';
import { isSuccess } from '@/api/httpClient';
import { findViewModule } from './viewComponents';
import { staticRoutes } from './staticRoutes';

// 与静态路由保持一致，布局统一懒加载
const LinkLayout = () => import('@/layouts/LinkLayout.vue');

type AuthMenu = {
  id: number;
  kind: 'directory' | 'page' | 'iframe' | 'external';
  title: string;
  path: string;
  icon?: string;
  hidden?: boolean;
  cache?: boolean;
  target?: '_blank' | '_self';
  component?: string;
  children?: AuthMenu[];
};

type MenuRouteArtifacts = {
  routes: RouteRecordRaw[];
  navigation: MenuDataItem[];
};

type MenuCompileState = {
  routes: RouteRecordRaw[];
  routeNames: Set<string | symbol>;
  routePaths: Set<string>;
};

type CompiledMenu = {
  navigation?: MenuDataItem;
  redirectPath?: string;
};

type AccessRoutes = {
  isReady: () => boolean;
  install: () => Promise<void>;
  reset: () => void;
};

function resolveComponent(componentPath: string): RouteComponent {
  const viewModule = findViewModule(componentPath);
  if (viewModule) return viewModule;

  throw new Error(`Menu component does not match a view: ${componentPath}`);
}

function getIframePath(menu: AuthMenu) {
  return `/iframe-${menu.id}`;
}

function getMenuPath(menu: AuthMenu) {
  return menu.kind === 'iframe' ? getIframePath(menu) : menu.path;
}

function getRouteName(menu: AuthMenu) {
  if (menu.kind === 'page') {
    const componentName = menu.component?.split('/').pop();
    if (!componentName) {
      throw new Error(`Page menu has no component: ${menu.title}`);
    }
    return componentName;
  }
  if (menu.kind === 'iframe') return `Iframe_${menu.id}`;
  return undefined;
}

function createMenuRouteArtifacts(
  menus: AuthMenu[],
  reservedRouteNames: ReadonlySet<string | symbol>,
  reservedRoutePaths: ReadonlySet<string>
): MenuRouteArtifacts {
  const state: MenuCompileState = {
    routes: [],
    routeNames: new Set(reservedRouteNames),
    routePaths: new Set(reservedRoutePaths),
  };

  function compileMenu(menu: AuthMenu): CompiledMenu {
    const routePath = getMenuPath(menu);
    const routeName = getRouteName(menu);

    if (menu.kind !== 'external') {
      if (!routePath.startsWith('/')) {
        throw new Error(
          `Menu path must be absolute: ${menu.title} ${routePath}`
        );
      }
      if (state.routePaths.has(routePath)) {
        throw new Error(`Dynamic route path is duplicated: ${routePath}`);
      }
      state.routePaths.add(routePath);
    }

    if (routeName) {
      if (state.routeNames.has(routeName)) {
        throw new Error(`Dynamic route name is duplicated: ${routeName}`);
      }
      state.routeNames.add(routeName);
    }

    const children = (menu.children ?? []).map(compileMenu);
    const navigationChildren = children
      .map(child => child.navigation)
      .filter((item): item is MenuDataItem => Boolean(item));

    let redirectPath: string | undefined;
    if (menu.kind === 'directory') {
      redirectPath = children.find(
        child => child.navigation && child.redirectPath
      )?.redirectPath;
      if (redirectPath) {
        state.routes.push({
          path: routePath,
          redirect: redirectPath,
          meta: {
            title: menu.title,
            icon: menu.icon?.startsWith('icon-') ? menu.icon : '',
            cache: menu.cache === true,
            hideInMenu: menu.hidden === true,
          },
        });
      }
    } else if (menu.kind === 'page') {
      if (!menu.component) {
        throw new Error(`Page menu has no component: ${menu.title}`);
      }
      state.routes.push({
        path: routePath,
        name: routeName,
        meta: {
          title: menu.title,
          icon: menu.icon?.startsWith('icon-') ? menu.icon : '',
          cache: menu.cache === true,
          hideInMenu: menu.hidden === true,
        },
        component: resolveComponent(menu.component),
      });
      redirectPath = menu.hidden ? undefined : routePath;
    } else if (menu.kind === 'iframe') {
      state.routes.push({
        path: routePath,
        name: routeName,
        meta: {
          title: menu.title,
          icon: menu.icon?.startsWith('icon-') ? menu.icon : '',
          cache: menu.cache === true,
          hideInMenu: menu.hidden === true,
          href: menu.path,
        },
        component: LinkLayout,
      });
      redirectPath = menu.hidden ? undefined : routePath;
    }

    if (
      menu.hidden ||
      (menu.kind === 'directory' && !navigationChildren.length)
    ) {
      return { redirectPath };
    }

    return {
      redirectPath,
      navigation: {
        path: routePath,
        name:
          menu.kind === 'directory'
            ? `Directory_${menu.id}`
            : menu.kind === 'external'
              ? `External_${menu.id}`
              : routeName,
        meta: {
          title: menu.title,
          icon: menu.icon?.startsWith('icon-') ? menu.icon : '',
          target: menu.kind === 'external' ? menu.target : undefined,
        },
        children: navigationChildren.length ? navigationChildren : undefined,
      },
    };
  }

  const compiledMenus = menus.map(compileMenu);
  return {
    routes: state.routes,
    navigation: compiledMenus
      .map(menu => menu.navigation)
      .filter((item): item is MenuDataItem => Boolean(item)),
  };
}

function createDynamicRootRoute(
  authMenus: AuthMenu[],
  router: Router
): RouteRecordRaw {
  const rootRoute = getStaticRootRoute();
  if (!rootRoute) throw new Error('Frontend root route is missing');

  const currentRoutes = router.getRoutes();
  const reservedRouteNames = new Set(
    currentRoutes.flatMap(route => (route.name ? [route.name] : []))
  );
  const reservedRoutePaths = new Set(currentRoutes.map(route => route.path));
  const { routes, navigation } = createMenuRouteArtifacts(
    authMenus,
    reservedRouteNames,
    reservedRoutePaths
  );
  const staticNavigation = getMenuData(clearMenuItem([rootRoute])).menuData;

  return {
    ...rootRoute,
    meta: {
      ...rootRoute.meta,
      navigation: [...staticNavigation, ...navigation],
    },
    children: [...(rootRoute.children ?? []), ...routes],
  };
}

function getStaticRootRoute() {
  const rootRoute = staticRoutes.find(route => route.path === '/');
  return rootRoute;
}

function restoreStaticRootRoute(router: Router) {
  const rootRoute = getStaticRootRoute();
  if (rootRoute) router.addRoute(rootRoute);
}

async function fetchAuthMenus(): Promise<AuthMenu[]> {
  const result = await getAuthMenus();
  if (!isSuccess(result) || !Array.isArray(result.data)) {
    throw new Error(result.msg || 'Failed to get auth menus');
  }
  return result.data;
}

export function createAccessRoutes(router: Router): AccessRoutes {
  let ready = false;
  let installPromise: Promise<void> | null = null;
  let installVersion = 0;

  return {
    isReady: () => ready,
    install() {
      if (ready) return Promise.resolve();
      if (installPromise) return installPromise;

      const version = ++installVersion;
      installPromise = fetchAuthMenus()
        .then(authMenus => {
          if (version !== installVersion) return;
          router.addRoute(createDynamicRootRoute(authMenus, router));
          ready = true;
        })
        .catch(error => {
          if (version !== installVersion) return;
          installPromise = null;
          throw error;
        });

      return installPromise;
    },
    reset() {
      installVersion++;
      installPromise = null;
      if (!ready) return;

      restoreStaticRootRoute(router);
      ready = false;
    },
  };
}
