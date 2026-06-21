<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <button class="menu-btn" type="button" @click="toggleSidebar" aria-label="打开菜单">
            ☰
          </button>
          <h1 class="logo">{{ systemConfig.systemName || '外科护理主管护师培训学习系统' }} V1.0</h1>
        </div>
        <div class="user-info">
          <span>欢迎，{{ displayName }}</span>
          <button @click="goToProfile" class="profile-btn">个人主页</button>
          <button @click="handleLogout" class="logout-btn">退出</button>
        </div>
      </div>
    </header>
    
    <div class="container">
      <!-- 手机端侧边栏遮罩 -->
      <div v-if="isMobile && sidebarCollapsed" class="sidebar-overlay" @click="closeSidebar"></div>
      <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <nav class="nav-menu">
          <div class="menu-section" v-for="s in menuSections.filter(x => x.showSection)" :key="s.id">
            <h3 class="section-title" :class="{ collapsed: !s.open }" @click="toggleSection(s.id)">
              <span class="section-toggle">{{ s.open ? '▼' : '▶' }}</span>
              {{ s.title }}
            </h3>
            <div class="section-items" v-show="s.open">
              <router-link
                v-for="item in s.items.filter(i => i.show)"
                :key="item.path"
                :to="item.path"
                class="nav-item"
              >
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-text">{{ item.label }}</span>
              </router-link>
            </div>
          </div>
        </nav>
      </aside>
      
      <main class="main-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSystemConfigStore } from '@/stores/systemConfig'
import { useRouter, useRoute } from 'vue-router'
import { getUserInfo } from '@/api/auth'

const sidebarCollapsed = ref(false)
const authStore = useAuthStore()
const systemConfig = useSystemConfigStore()
const router = useRouter()
const route = useRoute()

const isMobile = computed(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches)

const menuSections = ref([
  {
    id: 'home',
    title: '首页',
    open: true,
    showSection: true,
    items: [
      { path: '/dashboard', icon: '🏠', label: '首页', show: true }
    ]
  },
  {
    id: 'interact',
    title: '交流互动',
    open: false,
    showSection: true,
    items: [
      { path: '/forum', icon: '💬', label: '讨论论坛', show: true },
      { path: '/resources', icon: '📚', label: '资源共享平台', show: true },
      { path: '/feedback', icon: '⭐', label: '反馈评价', show: true }
    ]
  },
  {
    id: 'system',
    title: '系统功能',
    open: false,
    showSection: true,
    items: [
      { path: '/certificate', icon: '📜', label: '证书颁发', show: true },
      { path: '/mobile', icon: '📱', label: '移动访问支持', show: true },
      { path: '/settings', icon: '⚙️', label: '系统设置', show: true },
      { path: '/system-settings-options', icon: '🧩', label: '系统设置选项', show: true },
      { path: '/permissions', icon: '👥', label: '用户权限管理', show: true },
      { path: '/backup', icon: '💾', label: '数据备份', show: true }
    ]
  },
  {
    id: 'teaching',
    title: '教学管理',
    open: false,
    showSection: true,
    items: [
      { path: '/training', icon: '🎓', label: '护理培训', show: true },
      { path: '/my-certificates', icon: '🏅', label: '我的证书', show: true },
      { path: '/materials', icon: '📄', label: '学习资料管理', show: true },
      { path: '/schedule', icon: '📅', label: '课程安排设置', show: true },
      { path: '/teaching-class', icon: '🏫', label: '班级管理', show: true },
      { path: '/videos', icon: '🎬', label: '视频讲座播放', show: true },
      { path: '/question-bank', icon: '📝', label: '在线题库', show: true },
      { path: '/exam', icon: '📊', label: '考试系统', show: true },
      { path: '/exam-records', icon: '📋', label: '考试记录', show: true },
      { path: '/progress', icon: '📈', label: '学习进度跟踪', show: true },
      { path: '/students', icon: '👨‍🎓', label: '用户管理', show: true }
    ]
  }
])

function toggleSection(id: string) {
  const s = menuSections.value.find(x => x.id === id)
  if (s) s.open = !s.open
}

function updateItemVisibility() {
  const admin = isAdmin.value
  menuSections.value.forEach(s => {
    if (s.id === 'system') s.showSection = admin
    s.items.forEach(i => {
      if (i.path === '/my-certificates') i.show = !admin
      else if (['/certificate', '/mobile', '/settings', '/system-settings-options', '/permissions', '/backup'].includes(i.path)) i.show = admin
      else if (i.path === '/teaching-class' || i.path === '/students') i.show = admin
      else if (i.path === '/exam-records') i.show = [1, 2, 3].includes(authStore.userType || 0)
      else i.show = true
    })
  })
}

const displayName = computed(() => {
  return authStore.nickname || authStore.userPhone || '管理员'
})

const isAdmin = computed(() => {
  return (authStore.userType || 0) === 1
})

const goToProfile = () => {
  router.push('/profile')
  closeSidebar()
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const toggleSidebar = () => {
  // 手机端：collapsed=true 表示侧边栏滑出
  sidebarCollapsed.value = !sidebarCollapsed.value
}
const closeSidebar = () => {
  if (isMobile.value) sidebarCollapsed.value = false
}

watch(() => route.path, () => {
  if (isMobile.value) closeSidebar()
  // 自动展开包含当前页面的分组
  const path = route.path
  menuSections.value.forEach(s => {
    if (s.items.some(i => path.startsWith(i.path) || path === i.path)) {
      s.open = true
    }
  })
}, { immediate: true })

watch(isAdmin, updateItemVisibility, { immediate: true })

// 页面加载时获取用户信息
onMounted(async () => {
  updateItemVisibility()
  if (authStore.isLoggedIn) authStore.fetchPermissions()
  if (authStore.isLoggedIn && authStore.userPhone) {
    try {
      await authStore.fetchUserInfo()
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #6c9bd1 0%, #5b9bd5 50%, #4a8bc2 100%);
  color: white;
  padding: 0 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-content {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 68px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.menu-btn {
  display: none;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.logo {
  font-size: 19px;
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-info {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-btn {
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.25s ease;
  font-weight: 400;
}

.profile-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1px);
}

.logout-btn {
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.25s ease;
  font-weight: 400;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1px);
}

.container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: var(--card-bg);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  transition: width 0.3s ease;
  box-shadow: 1px 0 2px rgba(0, 0, 0, 0.02);
}

.sidebar.collapsed {
  width: 64px;
}

.nav-menu {
  padding: 20px 0;
}

.menu-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 8px 26px 10px;
  margin: 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.7;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
  border-radius: 6px;
  margin: 0 12px 4px;
}
.section-title:hover {
  background: var(--hover-bg);
  opacity: 1;
}
.section-toggle {
  font-size: 10px;
  opacity: 0.8;
}
.section-items {
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 11px 26px;
  color: var(--text-regular);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  margin: 2px 0;
  border-radius: 0 8px 8px 0;
  font-size: 14px;
}

.nav-item:hover {
  background-color: var(--hover-bg);
  color: var(--primary-color);
  transform: translateX(2px);
}

.nav-item.router-link-active {
  background: linear-gradient(90deg, rgba(91, 155, 213, 0.08) 0%, rgba(91, 155, 213, 0.03) 100%);
  color: var(--primary-color);
  border-left-color: var(--primary-color);
  font-weight: 500;
}

.nav-icon {
  font-size: 17px;
  margin-right: 13px;
  width: 24px;
  text-align: center;
  opacity: 0.8;
}

.nav-text {
  font-size: 14px;
  letter-spacing: 0.2px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background-color: var(--bg-color);
}

.content-wrapper {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -260px;
    z-index: 200;
    height: 100%;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    transition: left 0.25s ease;
  }
  
  .sidebar.collapsed {
    left: 0;
    width: 260px;
  }
  
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    z-index: 150;
    background: rgba(0,0,0,0.45);
  }

  .main-content {
    width: 100%;
  }
  
  .logo {
    font-size: 16px;
    max-width: 50vw;
  }

  .menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .header {
    padding: 0 12px;
  }

  .user-info {
    gap: 8px;
    font-size: 12px;
    white-space: nowrap;
  }

  .profile-btn, .logout-btn {
    padding: 6px 10px;
    font-size: 12px;
  }

  .content-wrapper {
    padding: 12px;
  }
}
</style>

