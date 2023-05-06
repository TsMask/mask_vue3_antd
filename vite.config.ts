import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import Compression from "vite-plugin-compression";
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
      port: 6269, // 端口
      host: true, // 暴露到网络地址
      open: false, // 完成后自动跳转浏览器打开
      proxy: {
        // https://cn.vitejs.dev/config/#server-proxy
        '/dev-api': {
          target: 'http://localhost:6275',
          changeOrigin: true,
          rewrite: p => p.replace(/^\/dev-api/, ''),
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
    css: {
      preprocessorOptions: {
        less: {
          // DO NOT REMOVE THIS LINE
          javascriptEnabled: true,
          modifyVars: {
            // hack: `true; @import 'ant-design-vue/dist/antd.variable.less'`,
            // '@primary-color': '#eb2f96', // 全局主色
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
            importStyle: false,
            resolveIcons: true,
            cjs: true, // 避免es模块打包缺失
          }),
        ],
      }),
      // gzip静态压缩文件
      Compression({
        algorithm: 'gzip',
        ext: '.gz',
        disable: false, // 是否禁用
      }),
    ],
  };
});
