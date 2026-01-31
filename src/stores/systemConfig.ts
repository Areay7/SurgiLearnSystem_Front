import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDisplayConfig } from '@/api/settings'

const DEFAULT_NAME = '外科护理主管护师培训学习系统'

export const useSystemConfigStore = defineStore('systemConfig', () => {
  const systemName = ref(DEFAULT_NAME)
  const systemLogo = ref('')
  const loaded = ref(false)

  const fetchDisplayConfig = async () => {
    if (loaded.value) return
    try {
      const res = await getDisplayConfig()
      if (res?.data) {
        systemName.value = res.data.systemName || DEFAULT_NAME
        systemName.value = systemName.value.trim() || DEFAULT_NAME
        systemLogo.value = res.data.systemLogo || ''
        loaded.value = true
      }
    } catch {
      systemName.value = DEFAULT_NAME
      loaded.value = true
    }
  }

  /** 刷新配置（例如在系统设置保存后调用） */
  const refresh = async () => {
    loaded.value = false
    await fetchDisplayConfig()
  }

  return { systemName, systemLogo, loaded, fetchDisplayConfig, refresh }
})
