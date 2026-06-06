# Project Guidelines

## Tech Stack

Vue 3.5 + TypeScript 6 + Vite 8 + Ant Design Vue 4.2 + Pinia 3 + Vue Router 5. Path alias ``@`` -> ``./src``.

HTTP uses a **custom ``fetch`` wrapper** (not axios) — see ``src/plugins/http-fetch.ts``. API response shape: ``{ code: string, msg: string, data: any }``, success code is ``200001``.

## Build and Dev

```bash
npm install --registry https://registry.npmmirror.com
npm run dev       # dev server on port 6265
npm run build     # vue-tsc type check + vite build
npm run preview   # preview production build
```

No ESLint, Prettier, or test framework configured — rely on TypeScript strict mode and consistent patterns.

## Architecture

```text
src/
  api/          # API functions by backend module, each calls request() directly
  components/   # Auto-registered global components (unplugin-vue-components)
  constants/    # Pure constant modules by responsibility
  directive/    # v-perms, v-roles custom directives
  hooks/        # Composition API reusable hooks (the core pattern)
  layouts/      # BasicLayout / BlankLayout / LinkLayout
  plugins/      # HTTP fetch wrapper, token management
  router/       # Static + dynamic routes, guard logic
  store/        # Pinia stores, Options API style
  utils/        # Pure utility functions
  views/        # Page views, organized by backend module
```

## Key Patterns

### CRUD Page Assembly (follow this order)

Most list pages combine these hooks — see ``src/views/system/post/index.vue`` as the canonical reference:

```ts
// 1. Dict setup (if needed)
const { dict } = useDictSetup({ keyMap: { sysNormalDisable: "sys_normal_disable" } });

// 2. Query params
const { queryParams, handleQuery, resetQuery } = useQueryParams(
  { postCode: "", postName: "", statusFlag: undefined, pageNum: 1, pageSize: 20 },
  () => { resetPage(); fetchList(); },
);

// 3. Pagination (onChange syncs queryParams + calls fetchList)
const { pagination, resetPage, clampPage } = usePagination({
  onChange: (page, pageSize) => { queryParams.pageNum = page; queryParams.pageSize = pageSize; fetchList(); },
});

// 4. List query (paginationRef auto-syncs total)
const { listData, loading, fetch: fetchList } = useListQuery({
  paginationRef: pagination,
  queryFn: () => listPost(toRaw(queryParams)),
});

// 5. Table UI state
const { tableState, setTableSize, rowClassName, setSelectedRowKeys } = useTableUI();

// 6. CRUD modal (openView / openEdit handle fetch + form assignment)
const { modal, formCtl, openView, openEdit, close } = useCrudModal({
  initForm: () => ({ postId: undefined, postCode: "", postName: "", ... }),
  rules: { postName: [{ required: true, message: "请输入岗位名称" }] },
});

// 7. Submit action
const { execute: submitExecute, loading: isSubmitting } = useAction({
  action: (form) => form.postId ? updatePost(form) : addPost(form),
  successText: "操作成功",
  onSuccess() { close(); fetchList(); },
});
```

Open detail/edit modal — one-liners:

```ts
function handleView(id) { openView(id, getPost, "岗位信息"); }
function handleEdit(id?) { openEdit(id, getPost, "添加岗位", "修改岗位"); }
```

Delete with page clamp:

```ts
confirmAction({
  content: `确认删除?`,
  action: (id) => delPost(id), variables: id, successText: "删除成功",
  onSuccess() {
    const count = String(id).split(",").length;
    if (!clampPage(count)) fetchList();
  },
});
```

### Hooks Reference

All hooks live in ``src/hooks/``:

| Hook | Purpose | Key Returns |
|------|---------|-------------|
| ``useQueryParams`` | Reactive query params with search/reset | ``queryParams``, ``handleQuery``, ``resetQuery`` |
| ``usePagination`` | Table pagination UI config | ``pagination``, ``resetPage``, ``clampPage`` |
| ``useListQuery`` | List data fetching + loading state | ``listData``, ``total``, ``loading``, ``fetch`` |
| ``useTableUI`` | Table size/striped/selection state | ``tableState``, ``setTableSize``, ``rowClassName`` |
| ``useCrudModal`` | Modal state + form lifecycle | ``modal``, ``formCtl``, ``openView``, ``openEdit``, ``close`` |
| ``useAction`` | Async action with loading/success/error feedback | ``execute``, ``loading`` |
| ``useDetailQuery`` | Detail data fetch on demand | ``detail``, ``loading``, ``fetch`` |
| ``useDictSetup`` | Dict data loading with type-safe keys | ``dict``, ``dictLoading``, ``loadDicts`` |

``confirmAction`` (from ``useAction.ts``) — Modal.confirm + auto feedback for dangerous operations (delete, clear, force-logout).

### API Layer

Functions live in ``src/api/<module>/<resource>.ts``, following RESTful naming:

- ``listXxx(query)`` -> GET list (response: ``{ rows: T[], total: number }``)
- ``getXxx(id)`` -> GET detail
- ``addXxx(data)`` -> POST
- ``updateXxx(data)`` -> PUT
- ``delXxx(id)`` -> DELETE

### State Management

Pinia stores use **Options API style** (``defineStore('name', { state, getters, actions })``). Store modules: ``user``, ``router``, ``app``, ``dict``, ``layout``, ``tabs``.

### Routing

Static routes in ``src/router/routes.ts``. Dynamic routes come from backend ``/router`` endpoint and are injected via ``router.addRoute()``. New pages require registration in the component mapping table in ``src/router/index.ts``.

### Permissions

- ``v-perms="['module:resource:action']"`` or ``v-perms:has="['...']"`` — has any permission -> show
- ``v-perms:math="['a','b']"`` — must have all permissions
- ``v-roles="['admin']"`` — role-based
- Super admin: role ``system`` or permission ``*:*:*``

Permission directives **remove DOM nodes** (not ``v-if``), so removed elements cannot dynamically restore.

### KeepAlive Caching

Pages are cached when route ``meta.cache: true``. The cache list is managed by ``tabsStore.getCaches``. Component ``name`` must match — set via ``fnComponentSetName`` in ``BasicLayout.vue``.

## Global Components

Auto-registered via ``unplugin-vue-components`` (no manual import needed):

| Component | Purpose |
|-----------|---------|
| ``DictTag`` | Render dict value as colored tag |
| ``IconFont`` | Custom iconfont icon |
| ``CronModal`` | Cron expression editor |
| ``LinkiFrame`` | Embedded iframe for linked pages |
| ``UploadModal`` | File upload dialog |

Ant Design Vue components and icons are also auto-imported via the resolver.

## Conventions

- Use ``toRaw()`` when passing reactive query params to API calls
- Token stored in Cookie (``antdv_access`` / ``antdv_refresh``), not localStorage
- Response success code is ``200001`` (not ``200`` or ``0``)
- Components under ``src/components/`` are auto-registered globally — no manual import needed
- Dynamic route component strings must be registered in the mapping table in ``src/router/index.ts``
- Menu icons use custom iconfont; Ant Design icons are auto-imported via resolver
- Use ``paginationRef: pagination`` in ``useListQuery`` to auto-sync total; do not compute total manually
- Use ``clampPage(deletedCount)`` after delete to handle empty-page edge case
