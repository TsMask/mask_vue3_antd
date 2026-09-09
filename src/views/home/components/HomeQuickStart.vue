<template>
  <a-card title="快速开始">
    <a-row :wrap="true">
      <a-col :lg="4" :md="12" :xs="12">
        <a-button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          title="开发手册"
          href="https://juejin.cn/column/7188761626017792056"
        >
          开发手册
        </a-button>
      </a-col>
      <a-col :lg="4" :md="12" :xs="12">
        <a-button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          title="来自Apifox的接口文档"
          href="https://mask-api-midwayjs.apifox.cn/"
        >
          接口文档
        </a-button>
      </a-col>
      <a-col :lg="4" :md="12" :xs="12">
        <a-button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          title="Middwayjs版本服务端"
          href="https://gitee.com/TsMask/mask_api_midwayjs"
        >
          Nodejs后端
        </a-button>
      </a-col>
      <a-col :lg="4" :md="12" :xs="12">
        <a-button
          type="link"
          target="_blank"
          rel="noopener noreferrer"
          title="Gin版本服务端"
          href="https://gitee.com/TsMask/mask_api_gin"
        >
          Golang后端
        </a-button>
      </a-col>
      <a-col :lg="4" :md="12" :xs="12">
        <a-button type="text">相关待定</a-button>
      </a-col>
    </a-row>
  </a-card>
</template>
