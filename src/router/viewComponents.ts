import type { RouteComponent } from 'vue-router';

type ViewModuleLoader = () => Promise<{ default: RouteComponent }>;

const viewModules = import.meta.glob('../views/**/*.{vue,tsx}') as Record<
  string,
  ViewModuleLoader
>;

const viewModuleMap = new Map<string, ViewModuleLoader>();
for (const [modulePath, loader] of Object.entries(viewModules)) {
  const componentPath = modulePath.match(/\.\.\/views\/(.+)\.(vue|tsx)$/)?.[1];
  if (!componentPath) continue;
  if (!viewModuleMap.has(componentPath) || modulePath.endsWith('.vue')) {
    viewModuleMap.set(componentPath, loader);
  }
}

export const viewComponentPaths = [...viewModuleMap.keys()].sort();

export function findViewModule(componentPath: string) {
  return viewModuleMap.get(componentPath);
}
