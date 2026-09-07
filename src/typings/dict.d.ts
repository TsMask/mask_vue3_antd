/** 字典选项 */
type DictType = {
  /** 显示文案 */
  label: string;
  /** 存储值；远程字典与后端约定，本地枚举与接口契约绑定 */
  value: string;
  /** 附加样式类名，DictTag 渲染时挂到标签上 */
  tag_class?: string;
  /** 标签颜色预设，如 success / error */
  tag_type?: string;
};
