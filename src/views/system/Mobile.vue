<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">移动访问支持</h1>
      <button class="btn-primary" @click="copyLoginLink">复制登录链接</button>
    </div>

    <div class="grid">
      <div class="card">
        <h2 class="card-title">响应式适配说明</h2>
        <ul class="list">
          <li>侧边栏在手机端自动折叠为抽屉模式（现有布局已支持）。</li>
          <li>表格在窄屏下自动转为「卡片列」展示，避免横向滚动。</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="card-title">移动端入口</h2>
        <p class="card-desc">扫码后自动跳转登录页面，使用手机号登录即可</p>
        <div class="qr">
          <div class="qr-box">
            <img
              v-if="loginUrl && !qrError"
              :src="qrCodeSrc"
              alt="扫码访问登录页"
              class="qr-img"
              @error="onQrError"
            />
            <div v-else-if="qrError" class="qr-placeholder">二维码加载失败<br />请直接复制链接</div>
            <div v-else class="qr-placeholder">加载中...</div>
          </div>
          <div class="qr-meta">
            <div class="k">登录页地址</div>
            <div class="v url-text">{{ loginUrl || '-' }}</div>
            <div class="tip">请确保手机与电脑在同一网络；若使用 localhost，请将其替换为电脑局域网 IP（如 192.168.x.x）后再扫码。</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn" @click="copyLoginLink">复制登录链接</button>
          <button class="btn" @click="copyBackend">复制后端API地址</button>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">全局字体大小</h2>
      <p class="card-desc">调整后影响整个系统的文字显示比例</p>
      <div class="font-size-options">
        <button
          v-for="opt in fontScaleOptions"
          :key="opt.value"
          class="scale-btn"
          :class="{ active: fontScale === opt.value }"
          @click="setFontScale(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { API_BASE_URL } from '@/config/api'

const FONT_SCALE_KEY = 'surgilearn_font_scale'

const fontScaleOptions = [
  { value: 100, label: '100%（默认）' },
  { value: 120, label: '120%' },
  { value: 150, label: '150%' },
  { value: 175, label: '175%' },
  { value: 200, label: '200%' }
]

const fontScale = ref(100)
const qrError = ref(false)

const loginUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  const base = origin.replace(/\/$/, '')
  return base + '/login'
})

const qrCodeSrc = computed(() => {
  if (!loginUrl.value || qrError.value) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(loginUrl.value)}`
})

function onQrError() {
  qrError.value = true
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('已复制到剪贴板')
  }
}

const copyLoginLink = () => copyText(loginUrl.value)
const copyBackend = () => copyText(API_BASE_URL)

function setFontScale(value: number) {
  fontScale.value = value
  localStorage.setItem(FONT_SCALE_KEY, String(value))
  const zoomVal = value === 100 ? '1' : (value / 100).toString()
  document.body.style.zoom = zoomVal
}

function initFontScale() {
  const saved = localStorage.getItem(FONT_SCALE_KEY)
  if (saved) {
    const v = parseInt(saved, 10)
    if (fontScaleOptions.some(o => o.value === v)) {
      fontScale.value = v
      if (v !== 100) {
        document.body.style.zoom = (v / 100).toString()
      }
    }
  }
}

onMounted(() => {
  initFontScale()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}
.btn-primary {
  padding: 10px 18px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}
.btn-primary:hover {
  background: #66b1ff;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  margin-bottom: 16px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.card-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.list {
  padding-left: 18px;
  color: var(--text-regular);
  line-height: 1.8;
}
.qr {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.qr-box {
  width: 200px;
  height: 200px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fc;
  flex-shrink: 0;
  overflow: hidden;
}
.qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.qr-placeholder {
  color: var(--text-secondary);
  font-size: 14px;
}
.qr-meta .k {
  font-size: 12px;
  color: var(--text-secondary);
}
.qr-meta .v {
  margin-top: 6px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-all;
}
.url-text {
  font-size: 14px;
}
.tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}
.btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.font-size-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.scale-btn {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.scale-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.scale-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .grid {
    grid-template-columns: 1fr;
  }
  .qr {
    flex-direction: column;
    align-items: flex-start;
  }
  .qr-box {
    width: 180px;
    height: 180px;
  }
  .actions {
    flex-wrap: wrap;
  }
}
</style>
