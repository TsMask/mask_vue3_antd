import { login, logout, getInfo } from '@/api/login';
import { getToken, setToken, removeToken } from '@/plugins/AuthToken';
import defaultAvatar from '@/assets/images/profile.png';
import { defineStore } from 'pinia';

/**用户信息类型 */
type UserInfo = {
  /**授权凭证 */
  token: string;
  /**用户名称 */
  name: string;
  /**用户头像 */
  avatar: string;
  /**用户角色 字符串数组 */
  roles: string[];
  /**用户权限 字符串数组 */
  permissions: string[];
};

const useUserStore = defineStore('user', {
  state: (): UserInfo => ({
    token: getToken(),
    name: '',
    avatar: '',
    roles: [],
    permissions: [],
  }),
  actions: {
    // 登录
    async toLogin(loginBody: Record<string, object>) {
      const res = await login(loginBody);
      setToken(res.token);
      this.token = res.token;
    },
    // 获取用户信息
    async toGetInfo() {
      const res = await getInfo();
      const user = res.user;
      const avatar =
        user.avatar == '' || user.avatar == null
          ? defaultAvatar
          : import.meta.env.VITE_APP_BASE_API + user.avatar;

      if (res.roles && res.roles.length > 0) {
        // 验证返回的roles是否是一个非空数组
        this.roles = res.roles;
        this.permissions = res.permissions;
      } else {
        this.roles = ['ROLE_DEFAULT'];
      }
      this.name = user.userName;
      this.avatar = avatar;

      return res;
    },
    // 退出系统
    async toLogOut() {
      await logout();
      this.token = '';
      this.roles = [];
      this.permissions = [];
      removeToken();
    },
  },
});

export default useUserStore;
