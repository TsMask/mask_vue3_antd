import { login, logout, getInfo } from '@/api/login';
import { getToken, setToken, removeToken } from '@/plugins/AuthToken';
import defaultAvatar from '@/assets/images_default/avatar.png';
import { defineStore } from 'pinia';
import { TOKEN_RESPONSE_FIELD } from '@/constants/TokenConstants';

/**用户信息类型 */
type UserInfo = {
  /**授权凭证 */
  token: string;
  /**用户名称 */
  userName: string;
  /**用户昵称 */
  nickName: string;
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
    userName: '',
    nickName: '',
    avatar: '',
    roles: [],
    permissions: [],
  }),
  actions: {
    // 登录
    async fnLogin(loginBody: Record<string, string>) {
      const res = await login(loginBody);
      if (res[TOKEN_RESPONSE_FIELD]) {
        setToken(res.token);
        this.token = res.token;
      }
      return res;
    },
    // 获取用户信息
    async fnGetInfo() {
      const res = await getInfo();
      const user = res.user;

      this.userName = user.userName;
      this.nickName = user.nickName;

      // 头像初始化
      if (user.avatar) {
        const baseApi = import.meta.env.VITE_APP_BASE_API;
        this.avatar = `${baseApi}/${user.avatar}`;
      } else {
        this.avatar = defaultAvatar;
      }

      // 验证返回的roles是否是一个非空数组
      if (res.roles && res.roles.length > 0) {
        this.roles = res.roles;
        this.permissions = res.permissions;
      } else {
        this.roles = ['ROLE_DEFAULT'];
        this.permissions = [];
      }

      return res;
    },
    // 退出系统
    async fnLogOut() {
      await logout();
      this.token = '';
      this.roles = [];
      this.permissions = [];
      removeToken();
    },
  },
});

export default useUserStore;
