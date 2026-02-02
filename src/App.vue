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
  const savedFontScale = localStorage.getItem('surgilearn_font_scale')
  if (savedFontScale) {
    const v = parseInt(savedFontScale, 10)
    if (v && v !== 100) document.body.style.zoom = (v / 100).toString()
  }
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

