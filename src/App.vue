<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useSystemConfigStore } from '@/stores/systemConfig'

const systemConfig = useSystemConfigStore()

onMounted(() => {
  systemConfig.fetchDisplayConfig()
})

watch(() => systemConfig.systemName, (name) => {
  document.title = name ? `${name} V1.0` : '外科护理主管护师培训学习系统 V1.0'
}, { immediate: true })
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>

