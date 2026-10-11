import defaultAvatar from '@/assets/images/default_avatar.png';
import {
  login,
  loginByPhone,
  getInfo,
  logout as logoutApi,
} from '@/api/auth';
import {
  delAccessToken,
  delRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/utils/tokenStorage';
import { defineStore } from 'pinia';
import { validHttp } from '@/utils/regular';
import { RESULT_CODE_SUCCESS } from '@/constants/result';
import { CACHE_SESSION_FETCH } from '@/constants/cacheKeys';
import { sessionRemove } from '@/utils/cacheSession';
import {
  SYS_PERMISSION_SYSTEM,
  SYS_ROLE_SYSTEM_KEY,
} from '@/constants/system';
import useDictStore from '@/store/modules/dict';

/** 用户信息类型 */
type UserInfo = {
  /** 用户ID */
  user_id: number;
  /** 登录账号 */
  user_name: string;
  /** 用户角色 字符串数组 */
  roles: string[];
  /** 用户权限 字符串数组 */
  permissions: string[];
  /** 用户头像 */
  user_avatar: string;
  /** 用户昵称 */
  user_nick: string;
  /** 用户手机号 */
  user_phone: string;
  /** 用户邮箱 */
  user_email: string;
  /** 用户性别 */
  user_gender: string | undefined;
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
  if (validHttp(avatar) || avatar.startsWith('//')) {
    return avatar;
  }
  const baseApi = import.meta.env.VITE_API_BASE_URL;
  return `${baseApi}${avatar}`;
}

/**
 * 校验用户角色或权限列表
 * @param userList 当前用户拥有的角色或权限
 * @param required 页面或指令要求的角色或权限
 * @param systemKey 内置系统角色或权限标识
 * @param matchAll true 时需全部包含，否则包含任一即可
 */
function matchAuthList(
  userList: string[],
  required: string[],
  systemKey: string,
  matchAll: boolean
): boolean {
  if (!required || required.length === 0) return false;
  if (!userList || userList.length === 0) return false;
  if (userList.includes(systemKey)) return true;
  return matchAll
    ? required.every(item => userList.includes(item))
    : required.some(item => userList.includes(item));
}

const useUserStore = defineStore('user', {
  state: (): UserInfo => ({
    user_id: 0,
    user_name: '',
    roles: [],
    permissions: [],
    user_avatar: '',
    user_nick: '',
    user_phone: '',
    user_email: '',
    user_gender: '0',
  }),
  getters: {
    /**
     * 获取正确头像地址
     * @param state 内部属性不用传入
     * @returns 头像地址url
     */
    getAvatar(state) {
      return parseAvatar(state.user_avatar);
    },
    /**
     * 获取基础信息属性
     * @param state 内部属性不用传入
     * @returns 基础信息
     */
    getBaseInfo(state) {
      return {
        user_nick: state.user_nick,
        user_phone: state.user_phone,
        user_email: state.user_email,
        user_gender: state.user_gender,
        user_avatar: state.user_avatar,
      };
    },
    /** 只需含有其中权限 */
    hasPermissions(state) {
      return (permissions: string[]) =>
        matchAuthList(
          state.permissions,
          permissions,
          SYS_PERMISSION_SYSTEM,
          false
        );
    },
    /** 需同时包含全部权限 */
    matchPermissions(state) {
      return (permissions: string[]) =>
        matchAuthList(
          state.permissions,
          permissions,
          SYS_PERMISSION_SYSTEM,
          true
        );
    },
    /** 只需含有其中角色 */
    hasRoles(state) {
      return (roles: string[]) =>
        matchAuthList(state.roles, roles, SYS_ROLE_SYSTEM_KEY, false);
    },
    /** 需同时包含全部角色 */
    matchRoles(state) {
      return (roles: string[]) =>
        matchAuthList(state.roles, roles, SYS_ROLE_SYSTEM_KEY, true);
    },
  },
  actions: {
    /** 清理令牌、用户状态与会话缓存；标签栏由调用方清理。 */
    clearAuthState() {
      delAccessToken();
      delRefreshToken();
      sessionRemove(CACHE_SESSION_FETCH);
      this.$reset();
      useDictStore().clearDict();
    },
    /** 主动退出：无论服务端撤销结果如何，都完成本地退出。 */
    async fnLogout() {
      try {
        return await logoutApi();
      } finally {
        this.clearAuthState();
      }
    },
    /**
     * 更新基础信息属性
     * @param data 变更信息
     */
    setBaseInfo(data: Record<string, any>) {
      this.user_nick = data.user_nick;
      this.user_phone = data.user_phone;
      this.user_email = data.user_email;
      this.user_gender = data.user_gender;
      this.user_avatar = data.user_avatar;
    },
    /**
     * 更新头像
     * @param avatar 上传后的地址
     */
    setAvatar(user_avatar: string) {
      this.user_avatar = user_avatar;
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
      const loginRequest = loginBody.phone
        ? loginByPhone(loginBody)
        : login(loginBody);
      const res = await loginRequest;
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        setAccessToken(res.data.access_token, res.data.expires_in);
        setRefreshToken(res.data.refresh_token, res.data.refresh_expires_in);
      }
      return res;
    },
    /**
     * 获取用户信息
     *
     * 成功时填充 store 状态；失败时抛出异常，由路由守卫 catch 处理重定向到登录页。
     * 认证失败时由路由守卫调用 clearAuthState 统一清理。
     *
     * @returns 响应结果
     * @throws 获取失败时抛出错误
     */
    async fnGetInfo() {
      const res = await getInfo();
      if (res.code === RESULT_CODE_SUCCESS && res.data) {
        const { user, roles, permissions } = res.data;
        // 用户ID
        this.user_id = user.id;
        // 登录账号
        this.user_name = user.user_name;
        // 用户头像
        this.user_avatar = user.user_avatar;
        // 基础信息
        this.user_nick = user.user_nick;
        this.user_phone = user.user_phone;
        this.user_email = user.user_email;
        this.user_gender = user.user_gender;

        // 验证返回的roles是否是一个非空数组
        if (Array.isArray(roles) && roles.length > 0) {
          this.roles = roles;
          this.permissions = permissions;
        } else {
          this.roles = ['ROLE_DEFAULT'];
          this.permissions = [];
        }

        return res;
      }
      // 获取信息失败，抛出让路由守卫 catch 处理
      throw new Error(res.msg || '获取用户信息失败');
    },
  },
});

export default useUserStore;
