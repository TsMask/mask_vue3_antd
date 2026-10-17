import { computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { MenuDataItem } from 'antdv-pro-layout';
import { HOME_PATH } from '@/constants/router';

type BreadcrumbRoute = {
  path: string;
  breadcrumbName: string;
};

function isPathPrefix(menuPath: string, routePath: string) {
  if (menuPath === routePath) return true;
  return routePath.startsWith(
    menuPath.endsWith('/') ? menuPath : `${menuPath}/`
  );
}

function findNavigationTrail(
  menus: MenuDataItem[],
  routePath: string,
  parentTrail: MenuDataItem[] = []
): MenuDataItem[] | undefined {
  for (const menu of menus) {
    const trail = [...parentTrail, menu];
    if (menu.path === routePath) return trail;

    if (isPathPrefix(menu.path, routePath)) {
      return (
        findNavigationTrail(menu.children ?? [], routePath, trail) ?? trail
      );
    }
  }
  return undefined;
}

/** 将根路由中的语义化菜单转换为侧边栏、面包屑可用的布局状态。 */
export function useNavigation() {
  const router = useRouter();

  const navigationMenus = computed(() => {
    const rootRoute = router.currentRoute.value.matched.find(
      route => route.path === '/'
    );
    return rootRoute?.meta.navigation ?? [];
  });

  const activeTrail = computed(
    () =>
      findNavigationTrail(
        navigationMenus.value,
        router.currentRoute.value.path
      ) ?? []
  );

  const navigationState = reactive({
    openKeys: [] as string[],
    selectedKeys: [] as string[],
  });

  watch(
    activeTrail,
    trail => {
      navigationState.openKeys = trail.slice(0, -1).map(item => item.path);
      const selectedMenu = trail.at(-1);
      navigationState.selectedKeys = selectedMenu ? [selectedMenu.path] : [];
    },
    { immediate: true }
  );

  const breadcrumb = computed<BreadcrumbRoute[]>(() => {
    const route = router.currentRoute.value;
    const trail = activeTrail.value;
    const items = trail
      .filter(item => item.path !== HOME_PATH)
      .map(item => ({
        path: item.path,
        breadcrumbName: item.meta?.title || '-',
      }));
    const last = items[items.length - 1];

    if (
      (!last || last.path !== route.path) &&
      route.path !== HOME_PATH &&
      route.path !== '/'
    ) {
      items.push({
        path: route.path,
        breadcrumbName: route.meta.title || '-',
      });
    }
    return items;
  });

  return {
    navigationMenus,
    breadcrumb,
    navigationState,
  };
}
