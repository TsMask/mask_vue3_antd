import { login, logout, getInfo } from '@/api/login';
import { getToken, setToken, removeToken } from '@/plugins/AuthToken';
import defaultAvatar from '@/assets/images/default_avatar.png';
import { defineStore } from 'pinia';
import { TOKEN_RESPONSE_FIELD } from '@/constants/TokenConstants';
import { validHttp } from '@/utils/RegularUtils';

/**用户信息类型 */
type UserInfo = {
  /**授权凭证 */
  token: string;
  /**用户名称 */
  userName: string;
  /**用户角色 字符串数组 */
  roles: string[];
  /**用户权限 字符串数组 */
  permissions: string[];
  /**用户头像 */
  avatar: string;
  /**用户昵称 */
  nickName: string;
  /**用户手机号 */
  phonenumber: string;
  /**用户邮箱 */
  email: string;
  /**用户性别 */
  sex: string | undefined;
};

const useUserStore = defineStore('user', {
  state: (): UserInfo => ({
    token: getToken(),
    userName: '',
    roles: [],
    permissions: [],
    avatar: '',
    nickName: '',
    phonenumber: '',
    email: '',
    sex: undefined,
  }),
  getters: {
    // 获取头像
    getAvatar(state) {
      const avatar = state.avatar;
      if (!avatar) {
        return defaultAvatar;
      }
      if (validHttp(avatar)) {
        return avatar;
      }
      const baseApi = import.meta.env.VITE_API_BASE_URL;
      return `${baseApi}${avatar}`;
    },
    // 获取基础信息属性
    getBaseInfo(state) {
      return {
        nickName: state.nickName,
        phonenumber: state.phonenumber,
        email: state.email,
        sex: state.sex,
      };
    },
  },
  actions: {
    // 更新基础信息属性
    setBaseInfo(data: Record<string, any>) {
      this.nickName = data.nickName;
      this.phonenumber = data.phonenumber;
      this.email = data.email;
      this.sex = data.sex;
    },
    // 更新头像
    setAvatar(avatar: string) {
      this.avatar = avatar;
    },
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
      // 用户名称账号
      this.userName = user.userName;
      // 用户头像
      this.avatar = user.avatar;
      // 基础信息
      this.nickName = user.nickName;
      this.phonenumber = user.phonenumber;
      this.email = user.email;
      this.sex = user.sex;

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
