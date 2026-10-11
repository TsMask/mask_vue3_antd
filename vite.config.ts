import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 读取环境配置变量，指定前缀
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    // 访问基础路径
    base: env.VITE_HISTORY_BASE_URL,
    // 本地开发服务配置
    server: {
      port: 6265, // 端口
      host: true, // 暴露到网络地址
      open: false, // 完成后自动跳转浏览器打开
      proxy: {
        // https://cn.vitejs.dev/config/#server-proxy
        [env.VITE_API_BASE_URL]: {
          target: 'https://apifoxmock.com/m1/2976680-2519385-default',
          // target: 'http://192.168.56.1:6275',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(env.VITE_API_BASE_URL, ''),
        },
      },
    },
    resolve: {
      // 资源别名
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1200, // 调整区块大小警告限制（以kB为单位）
      rolldownOptions: {
        output: {
          // 用于从入口点创建的块
          entryFileNames: '[name].[hash].js',
          // 用于命名代码拆分的块
          chunkFileNames: 'js/[name].[hash].js',
          // 用于输出静态资源的块
          assetFileNames: 'assets/[name].[hash].[ext]',
          // 用于输出依赖库的块
          codeSplitting: {
            groups: [
              {
                name: 'chunkVue',
                test: /node_modules\/(vue|vue-router|pinia)\//,
              },
              // UI 组件库按路由可达性自动拆分，避免入口整包加载
              { name: 'chunkEcharts', test: /node_modules\/echarts\// },
              {
                name: 'chunkUtil',
                test: /node_modules\/(dayjs|nprogress|file-saver|js-base64|js-cookie)\//,
              },
            ],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['@ant-design/icons-vue', 'ant-design-vue'],
    },
    plugins: [
      vue(),
      // Vue文件中自动导入一层全局组件和antd组件
      Components({
        dts: 'src/typings/components.d.ts',
        globs: ['src/components/*/*.vue'],
        resolvers: [
          AntDesignVueResolver({
            resolveIcons: true,
            importStyle: false,
            cjs: false,
          }),
        ],
      }),
    ],
  };
});
