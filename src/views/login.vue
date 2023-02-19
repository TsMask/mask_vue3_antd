<template>
    <input type="text" name="username" v-model="loginForm.username">
    <input type="text" name="password" v-model="loginForm.password">
    <input type="text" name="code" v-model="loginForm.code">
    <img :src="codeUrl" @click="getCode" class="login-code-img" />
<button @click.prevent="handleLogin">登录</button>
  </template>
  
  <script lang="ts" setup>
  import { getCodeImg } from "@/api/login";
import router from "@/router";
//   import Cookies from "js-cookie";
//   import { encrypt, decrypt } from "@/utils/jsencrypt";
  import useUserStore from '@/store/modules/user'
import { ref } from "vue";
//   import defaultSettings from '@/settings'

  const loginForm = ref({
    username: "admin",
    password: "admin@1234",
    rememberMe: false,
    code: "",
    uuid: ""
  });
    const codeUrl = ref("");
  //   // 验证码开关
  const captchaEnabled = ref(true);
const userStore = useUserStore()
function handleLogin(){
 // 调用action的登录方法
 userStore.login(loginForm.value).then(() => {
        //   router.push({ path: redirect.value || "/" });
        }).catch(() => {
        //   loading.value = false;
          // 重新获取验证码
          if (captchaEnabled.value) {
            getCode();
          }
        });
}


//   const userStore = useUserStore()
//   const router = useRouter();
//   const { proxy } = getCurrentInstance();
  

  
//   const loginRules = {
//     username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
//     password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
//     code: [{ required: true, trigger: "change", message: "请输入验证码" }]
//   };
  

//   const loading = ref(false);

//   // 注册开关
//   const register = ref(true);
//   const redirect = ref(undefined);
  
//   function handleLogin() {
//     proxy.$refs.loginRef.validate(valid => {
//       if (valid) {
//         loading.value = true;
//         // 勾选了需要记住密码设置在 cookie 中设置记住用户名和密码
//         if (loginForm.value.rememberMe) {
//           Cookies.set("username", loginForm.value.username, { expires: 30 });
//           Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 });
//           Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 });
//         } else {
//           // 否则移除
//           Cookies.remove("username");
//           Cookies.remove("password");
//           Cookies.remove("rememberMe");
//         }
//         // 调用action的登录方法
//         userStore.login(loginForm.value).then(() => {
//           router.push({ path: redirect.value || "/" });
//         }).catch(() => {
//           loading.value = false;
//           // 重新获取验证码
//           if (captchaEnabled.value) {
//             getCode();
//           }
//         });
//       }
//     });
//   }
  
  function getCode() {
    getCodeImg().then(res => {
      captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled;
      if (captchaEnabled.value) {
        if (res.img.includes('svg')) {
          codeUrl.value = res.img;
        } else {
          codeUrl.value = "data:image/gif;base64," + res.img;
        }
        loginForm.value.uuid = res.uuid;
      }
    });
  }
  
//   function getCookie() {
//     const username = Cookies.get("username");
//     const password = Cookies.get("password");
//     const rememberMe = Cookies.get("rememberMe");
//     loginForm.value = {
//       username: username === undefined ? loginForm.value.username : username,
//       password: password === undefined ? loginForm.value.password : decrypt(password),
//       rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
//     };
//   }
  
  getCode();
//   getCookie();
  </script>
  