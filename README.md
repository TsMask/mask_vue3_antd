# 基于 Ant-Design-Vue + Vue3 的管理系统

[![star](https://gitee.com/TsMask/mask_antd_vue3/badge/star.svg?theme=dark)](https://gitee.com/TsMask/mask_antd_vue3/stargazers)
![Build Vite](https://img.shields.io/badge/Build-Vite-green.svg)
![Build Vue3](https://img.shields.io/badge/Build-Vue3-green.svg)
![Build MaskApi](https://img.shields.io/badge/Build-MaskApi-orange.svg)
![Release V0.2.4](https://img.shields.io/badge/Release-V0.2.4-orange.svg)
![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## 简介

该项目选择 [RuoYi-Vue3](https://github.com/yangzongzhuan/RuoYi-Vue3) 进行功能适配。

- 系统布局使用 [@ant-design-vue/pro-layout](https://github.com/vueComponent/pro-components)
- 图标来源 [@ant-design/icons-vue](https://ant.design/components/icon)
- 菜单图标使用自定义iconfont `font_8d5l8fzk5b87iudi.js`图标文件

## 项目文档

- 项目代码进行服务器部署的网站 => [在线预览](http://124.223.91.248:8102/#/)
- `Apifox` 提供mock服务和程序接口文档 => [接口文档](https://mask-api-midwayjs.apifox.cn/)
- `Mask管理系统` 文档专栏，相关使用和开发升级文档。 => [专栏](https://juejin.cn/column/7188761626017792056/)

### 前端

- `Vue3-Element` 仓库地址 => [mask_element_vue3](https://gitee.com/TsMask/mask_element_vue3)
- `Vue3-Antd` 仓库地址 => [mask_antd_vue3](https://gitee.com/TsMask/mask_antd_vue3)

### 后端

- `Node-Midwayjs` 仓库地址 => [mask_api_midwayjs](https://gitee.com/TsMask/mask_api_midwayjs)
- `Go-Gin` 仓库地址 => [mask_api_gin](https://gitee.com/TsMask/mask_api_gin)

## 程序命令

项目目录下 `.env.[环境]` 文件对应环境的一些配置，启动前请检查文件内是否配置正确。

```bash
# 使用阿里源可以加速下载依赖库
npm install --registry https://registry.npmmirror.com
```

### 开发 development

```bash
# 检查配置参数 .env.development 和 vite.config.ts
npm install                 # 安装项目所需依赖
npm run dev                 # 开发模式启动项目
Local http://localhost:6269 # 启动成功后得到服务访问地址
```

### 部署 production

```bash
# 检查配置参数 .env.development
npm install        # 安装项目所需依赖
npm run build      # 构建生产项目代码
```

## 内置功能

1. 用户管理：用户是系统操作者，该功能主要完成系统用户配置。
2. 部门管理：配置系统组织机构，树结构展现支持数据权限。
3. 岗位管理：配置系统用户所属担任职务。
4. 菜单管理：配置系统菜单，操作权限，按钮权限标识等。
5. 角色管理：角色菜单权限分配、设置角色按机构进行数据范围权限划分。
6. 字典管理：对系统中经常使用的一些较为固定的数据进行维护。
7. 参数管理：对系统动态配置常用参数。
8. 通知公告：系统通知公告信息发布维护。
9. 操作日志：系统正常操作日志记录和查询；系统异常信息日志记录和查询。
10. 登录日志：系统登录日志记录查询包含登录异常。
11. 在线用户：当前系统中活跃用户状态监控。
12. 调度任务：在线（添加、修改、删除）任务调度包含执行结果日志。
13. 服务监控：监视当前系统CPU、内存、磁盘、堆栈等相关信息。
14. 缓存监控：对系统的缓存信息查询，命令统计。

> 有任何问题或者建议，可以在 [_Issues_](https://gitee.com/TsMask/mask_api_midwayjs/issues) 或通过QQ群：[_57242844_](https://jq.qq.com/?_wv=1027&k=z6Y4YQcB) 提出想法。  
> 如果觉得项目对您有帮助，可以来个Star ⭐
