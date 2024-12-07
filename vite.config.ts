import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import Compression from 'vite-plugin-compression';
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
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 500, // 调整区块大小警告限制（以kB为单位）
      rollupOptions: {
        // 输出格式 [name]表示文件名 [hash]表示文件内容hash值 [ext]表示拓展名
        output: {
          // 用于从入口点创建的块
          entryFileNames: '[name].[hash].js',
          // 用于命名代码拆分的块
          chunkFileNames: 'js/[name].[hash].js',
          // 用于输出静态资源的块
          assetFileNames: 'assets/[name].[hash].[ext]',
          manualChunks: id => {
            if (id.indexOf('node_modules') !== -1) {
              return 'vendor/index';
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: ['@ant-design/icons-vue', 'ant-design-vue'],
    },
    plugins: [
      vue(),
      // Vue文件中自动导入组件，dirs目录和antd库
      Components({
        dts: 'src/typings/components.d.ts',
        deep: true,
        dirs: ['src/components'],
        extensions: ['vue', 'tsx'],
        resolvers: [
          AntDesignVueResolver({
            resolveIcons: true,
            importStyle: false,
            cjs: false,
          }),
        ],
      }),
      // gzip静态压缩文件
      Compression({
        verbose: false,
        algorithm: 'gzip',
        ext: '.gz',
        disable: true, // 是否禁用
      }),
    ],
  };
});
