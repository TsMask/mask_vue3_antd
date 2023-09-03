export default {
  // 语言
  i18n: '中文',
  hello: '你好',

  // 通用
  common: {
    title: 'Mask Antd Vue3',
    desc: '基于 ant-design-vue + vue3 的管理系统',
    loading: '请稍等...',
    tipTitle: '提示',
  },

  // 全局页脚
  globalFooter: {
    help: '帮助',
    privacy: '隐私',
    term: '条款',
  },

  // 校验
  valid: {
    userNameReg: '账号不能以数字开头，可包含大写小写字母，数字，且不少于5位',
    userNamePlease: '请输入正确登录账号',
    userNameHit: '登录账号',
    passwordReg: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
    passwordPlease: '请输入正确登录密码',
    passwordHit: '登录密码',
    passwordConfirmHit: '确认登录密码',
    phoneReg: '手机号码不正确',
    phonePlease: '请输入正确的手机号码',
    phoneHit: '手机号码',
    codePlease: '请输入正确的验证码',
    codeHit: '验证码',
    codeText: '获取验证码',
    codeSmsSend: '发送成功，请注意查看短信',
  },

  // 页面
  views: {
    login: {
      tabPane1: '账号密码登录',
      tabPane2: '手机号登录',
      registerBtn: '注册账号',
      loginBtn: '登录',
      loginSuccess: '登录成功',
      loginMethod: '其他登录方式：',
      loginMethodWX: '微信扫一扫登录',
      loginMethodQQ: 'QQ扫码登录',
    },
    register: {
      registerBtn: '注册',
      loginBtn: '使用已有账号登录',
      passwordErr: '请正确输入确认密码',
      passwordConfirmErr: '两次输入的密码不一致',
      tipContent: '恭喜您，{username} 账号注册成功！',
      tipBtn: '前往登录',
    },
  },
};
