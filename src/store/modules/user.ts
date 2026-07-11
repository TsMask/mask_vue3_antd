import defaultAvatar from '@/assets/images/default_avatar.png';
import useLayoutStore from './layout';
import { login, logout, getInfo } from '@/api/auth';
import {
  delAccessToken,
  delRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/plugins/auth-token';
import { defineStore } from 'pinia';
import { validHttp } from '@/utils/regular-utils';
import { RESULT_CODE_SUCCESS } from '@/constants/result-constants';

/** 用户信息类型 */
type UserInfo = {
  /** 用户ID */
  userId: string;
  /** 登录账号 */
  userName: string;
  /** 用户角色 字符串数组 */
  roles: string[];
  /** 用户权限 字符串数组 */
  permissions: string[];
  /** 用户头像 */
  avatar: string;
  /** 用户昵称 */
  nickName: string;
  /** 用户手机号 */
  phone: string;
  /** 用户邮箱 */
  email: string;
  /** 用户性别 */
  gender: string | undefined;
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
    userId: '',
    userName: '',
    roles: [],
    permissions: [],
    avatar: '',
    nickName: '',
    phone: '',
    email: '',
    gender: undefined,
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
        phone: state.phone,
        email: state.email,
        gender: state.gender,
        avatar: state.avatar,
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
      this.phone = data.phone;
      this.email = data.email;
      this.gender = data.gender;
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
        setAccessToken(res.data.accessToken, res.data.refreshExpiresIn);
        setRefreshToken(res.data.refreshToken, res.data.refreshExpiresIn);
      }
      return res;
    },
    /**
     * 获取用户信息
     *
     * 成功时填充 store 状态；失败时抛出异常，由路由守卫 catch 处理重定向到登录页。
     * 不再在函数内部调用 window.location.reload()，避免与路由守卫产生无限重定向。
     *
     * @returns 响应结果
     * @throws 获取失败时抛出错误
     */
    async fnGetInfo() {
      const res = await getInfo();
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        const { user, roles, permissions } = res.data;
        // 用户ID
        this.userId = user.id;
        // 登录账号
        this.userName = user.userName;
        // 用户头像
        this.avatar = user.userAvatar;
        // 基础信息
        this.nickName = user.userNick;
        this.phone = user.userPhone;
        this.email = user.userEmail;
        this.gender = user.userGender;

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
        if (this.phone) {
          waterMarkContent = `${this.nickName} ${this.phone}`;
        }
        useLayoutStore().changeWaterMark(waterMarkContent);
        return res;
      }
      // 获取信息失败，抛出让路由守卫 catch 处理
      throw new Error(res.msg || '获取用户信息失败');
    },
    /**
     * 退出系统
     *
     * 无论退出接口是否成功，都清除本地 token 和用户状态。
     * 不再重新抛出 API 错误，确保调用方可以安全地 await 而不会抛异常。
     */
    async fnLogOut() {
      try {
        await logout();
      } catch {
        // 忽略登出接口错误，本地状态已在 finally 中清理
      } finally {
        this.roles = [];
        this.permissions = [];
        delAccessToken();
        delRefreshToken();
      }
    },
  },
});

export default useUserStore;
