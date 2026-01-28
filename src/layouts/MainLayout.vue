<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <button class="menu-btn" type="button" @click="toggleSidebar" aria-label="打开菜单">
            ☰
          </button>
          <h1 class="logo">外科护理主管护师培训学习系统 V1.0</h1>
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
          <div class="menu-section">
            <h3 class="section-title">首页</h3>
            <router-link to="/dashboard" class="nav-item">
              <span class="nav-icon">🏠</span>
              <span class="nav-text">首页</span>
            </router-link>
          </div>
          
          <div class="menu-section">
            <h3 class="section-title">交流互动</h3>
            <router-link to="/forum" class="nav-item">
              <span class="nav-icon">💬</span>
              <span class="nav-text">讨论论坛</span>
            </router-link>
            <router-link to="/resources" class="nav-item">
              <span class="nav-icon">📚</span>
              <span class="nav-text">资源共享平台</span>
            </router-link>
            <router-link to="/feedback" class="nav-item">
              <span class="nav-icon">⭐</span>
              <span class="nav-text">反馈评价</span>
            </router-link>
          </div>
          
          <div class="menu-section" v-if="isAdmin">
            <h3 class="section-title">系统功能</h3>
            <router-link to="/certificate" class="nav-item">
              <span class="nav-icon">📜</span>
              <span class="nav-text">证书颁发</span>
            </router-link>
            <router-link to="/mobile" class="nav-item">
              <span class="nav-icon">📱</span>
              <span class="nav-text">移动访问支持</span>
            </router-link>
            <router-link to="/settings" class="nav-item">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">系统设置</span>
            </router-link>
            <router-link to="/permissions" class="nav-item">
              <span class="nav-icon">👥</span>
              <span class="nav-text">用户权限管理</span>
            </router-link>
            <router-link to="/backup" class="nav-item">
              <span class="nav-icon">💾</span>
              <span class="nav-text">数据备份</span>
            </router-link>
          </div>
          
          <div class="menu-section">
            <h3 class="section-title">教学管理</h3>
            <router-link to="/training" class="nav-item">
              <span class="nav-icon">🎓</span>
              <span class="nav-text">护理培训</span>
            </router-link>
            <router-link to="/materials" class="nav-item">
              <span class="nav-icon">📄</span>
              <span class="nav-text">学习资料管理</span>
            </router-link>
            <router-link to="/schedule" class="nav-item">
              <span class="nav-icon">📅</span>
              <span class="nav-text">课程安排设置</span>
            </router-link>
            <router-link to="/videos" class="nav-item">
              <span class="nav-icon">🎬</span>
              <span class="nav-text">视频讲座播放</span>
            </router-link>
            <router-link to="/question-bank" class="nav-item">
              <span class="nav-icon">📝</span>
              <span class="nav-text">在线题库</span>
            </router-link>
            <router-link to="/exam" class="nav-item">
              <span class="nav-icon">📊</span>
              <span class="nav-text">考试系统</span>
            </router-link>
            <router-link to="/students" class="nav-item">
              <span class="nav-icon">👨‍🎓</span>
              <span class="nav-text">学员记录管理</span>
            </router-link>
            <router-link to="/progress" class="nav-item">
              <span class="nav-icon">📈</span>
              <span class="nav-text">学习进度跟踪</span>
            </router-link>
            <router-link to="/instructors" class="nav-item">
              <span class="nav-icon">👨‍🏫</span>
              <span class="nav-text">讲师分配</span>
            </router-link>
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
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { getUserInfo } from '@/api/auth'

const sidebarCollapsed = ref(false)
const authStore = useAuthStore()
const router = useRouter()

const isMobile = computed(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches)

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

// 页面加载时获取用户信息
onMounted(async () => {
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
  padding: 0 26px 10px;
  margin: 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.7;
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

