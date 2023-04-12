<template>
  <page-container title="Version" sub-title="show current project dependencies">
    <template #content>
      <strong>Content Area</strong>
    </template>
    <template #extra>
      <strong>Extra Area</strong>
    </template>
    <template #extraContent>
      <strong>ExtraContent Area</strong>
    </template>
    <template #tags>
      <a-tag>Tag1</a-tag>
      <a-tag color="pink">Tag2</a-tag>
    </template>
    <a-card title="Info">
      <p v-for="i in 50" :key="i">
        text block...
        <a-tag>{{ i }}</a-tag>
      </p>
    </a-card>
  </page-container>
</template>

<script lang="ts" setup></script>
