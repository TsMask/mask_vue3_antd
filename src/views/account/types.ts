export type AccountProfileData = {
  user: Record<string, any>;
  role_group: string[];
  post_group: string[];
};

/** 提供字段结构稳定的空资料，避免首次渲染访问嵌套字段报错 */
export function createEmptyProfile(): AccountProfileData {
  return {
    user: {},
    role_group: [],
    post_group: [],
  };
}
