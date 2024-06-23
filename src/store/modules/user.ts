import defaultAvatar from '@/assets/images/default_avatar.png';
import useLayoutStore from './layout';
import { login, logout, getInfo } from '@/api/login';
import { getToken, setToken, removeToken } from '@/plugins/auth-token';
import { defineStore } from 'pinia';
import { TOKEN_RESPONSE_FIELD } from '@/constants/token-constants';
import { validHttp } from '@/utils/regular-utils';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';

/**用户信息类型 */
type UserInfo = {
  /**授权凭证 */
  token: string;
  /**用户ID */
  userId: string;
  /**登录账号 */
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

/**
 * 格式解析头像地址
 * @param avatar 头像路径
 * @returns url地址
 */
function parseAvatar(avatar: string): string {
  if (!avatar) {
    return defaultAvatar;
  }
  if (validHttp(avatar)) {
    return avatar;
  }
  const baseApi = import.meta.env.VITE_API_BASE_URL;
  return `${baseApi}${avatar}`;
}

const useUserStore = defineStore('user', {
  state: (): UserInfo => ({
    token: getToken(),
    userId: '',
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
    /**
     * 获取正确头像地址
     * @param state 内部属性不用传入
     * @returns 头像地址url
     */
    getAvatar(state) {
      return parseAvatar(state.avatar);
    },
    /**
     * 获取基础信息属性
     * @param state 内部属性不用传入
     * @returns 基础信息
     */
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
    /**
     * 更新基础信息属性
     * @param data 变更信息
     */
    setBaseInfo(data: Record<string, any>) {
      this.nickName = data.nickName;
      this.phonenumber = data.phonenumber;
      this.email = data.email;
      this.sex = data.sex;
    },
    /**
     * 更新头像
     * @param avatar 上传后的地址
     */
    setAvatar(avatar: string) {
      this.avatar = avatar;
    },
    /**
     * 获取正确头像地址
     * @param avatar
     */
    fnAvatar(avatar: string) {
      return parseAvatar(avatar);
    },
    // 登录
    async fnLogin(loginBody: Record<string, string>) {
      const res = await login(loginBody);
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        const token = res.data[TOKEN_RESPONSE_FIELD];
        setToken(token);
        this.token = token;
      }
      return res;
    },
    // 获取用户信息
    async fnGetInfo() {
      const res = await getInfo();
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        const { user, roles, permissions } = res.data;
        // 用户ID
        this.userId = user.userId;
        // 登录账号
        this.userName = user.userName;
        // 用户头像
        this.avatar = user.avatar;
        // 基础信息
        this.nickName = user.nickName;
        this.phonenumber = user.phonenumber;
        this.email = user.email;
        this.sex = user.sex;

        // 验证返回的roles是否是一个非空数组
        if (Array.isArray(roles) && roles.length > 0) {
          this.roles = roles;
          this.permissions = permissions;
        } else {
          this.roles = ['ROLE_DEFAULT'];
          this.permissions = [];
        }

        // 水印文字信息=用户昵称 手机号
        let waterMarkContent = this.nickName;
        if (this.phonenumber) {
          waterMarkContent = `${this.nickName} ${this.phonenumber}`;
        }
        useLayoutStore().changeWaterMark(waterMarkContent);
      }
      // 网络错误时退出登录状态
      if (res.code === 500) {
        removeToken();
        window.location.reload();
      }
      return res;
    },
    // 退出系统
    async fnLogOut() {
      try {
        await logout();
      } catch (error) {
        throw error;
      } finally {
        this.token = '';
        this.roles = [];
        this.permissions = [];
        removeToken();
      }
    },
  },
});

export default useUserStore;
