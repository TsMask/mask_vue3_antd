export default {
  // 语言
  i18n: 'English',
  hello: 'Hello',

  // 通用
  common: {
    title: 'Mask Antd Vue3',
    desc: 'Management system based on ant design vue+vue3',
    loading: 'Please wait...',
    tipTitle: 'Prompt',
  },

  // 全局页脚
  globalFooter: {
    help: 'Help',
    privacy: 'Privacy',
    term: 'Term',
  },

  // 校验
  valid: {
    userNameReg:
      'The account cannot start with a number and can contain uppercase and lowercase letters, numbers, and no less than 5 digits.',
    userNamePlease: 'Please enter the correct login account',
    userNameHit: 'Login account',
    passwordReg:
      'The password should contain at least uppercase and lowercase letters, numbers, special symbols, and no less than 6 digits.',
    passwordPlease: 'Please enter the correct login password',
    passwordHit: 'Login password',
    passwordConfirmHit: 'Confirm login password',
    phoneReg: 'Incorrect phone number',
    phonePlease: 'Please enter the correct phone number',
    phoneHit: 'Mobile number',
    codePlease: 'Please enter the correct verification code',
    codeHit: 'Verification code',
    codeText: 'Obtain verification code',
    codeSmsSend: 'Successfully sent, please pay attention to checking the SMS',
  },

  // 页面
  views: {
    login: {
      tabPane1: 'Account password login',
      tabPane2: 'Login with phone number',
      registerBtn: 'Register an account',
      loginBtn: 'Login',
      loginSuccess: 'Login successful',
      loginMethod: 'Other login methods:',
      loginMethodWX: 'WeChat Scan Login',
      loginMethodQQ: 'QQ Scan Code Login',
    },
    register: {
      registerBtn: 'Register',
      loginBtn: 'Log in with an existing account',
      passwordErr: 'Please enter the correct confirmation password',
      passwordConfirmErr: 'The two passwords entered do not match',
      tipContent: 'Congratulations, {username} account registration succeeded!',
      tipBtn: 'Go to login',
    },
  },
};
