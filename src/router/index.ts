import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      // 交流互动模块
      {
        path: 'forum',
        name: 'Forum',
        component: () => import('@/views/interaction/Forum.vue'),
        meta: { title: '讨论论坛' }
      },
      {
        path: 'forum/:id',
        name: 'ForumDetail',
        component: () => import('@/views/interaction/ForumDetail.vue'),
        meta: { title: '讨论详情' }
      },
      {
        path: 'resources',
        name: 'Resources',
        component: () => import('@/views/interaction/Resources.vue'),
        meta: { title: '资源共享平台' }
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: () => import('@/views/interaction/Feedback.vue'),
        meta: { title: '反馈评价' }
      },
      // 系统功能模块
      {
        path: 'certificate',
        name: 'Certificate',
        component: () => import('@/views/system/Certificate.vue'),
        meta: { title: '证书颁发' }
      },
      {
        path: 'mobile',
        name: 'Mobile',
        component: () => import('@/views/system/Mobile.vue'),
        meta: { title: '移动访问支持' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/system/Settings.vue'),
        meta: { title: '系统设置' }
      },
      {
        path: 'permissions',
        name: 'Permissions',
        component: () => import('@/views/system/Permissions.vue'),
        meta: { title: '用户权限管理' }
      },
      {
        path: 'backup',
        name: 'Backup',
        component: () => import('@/views/system/Backup.vue'),
        meta: { title: '数据备份' }
      },
      // 教学管理模块
      {
        path: 'training',
        name: 'Training',
        component: () => import('@/views/teaching/Training.vue'),
        meta: { title: '护理培训' }
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/teaching/Materials.vue'),
        meta: { title: '学习资料管理' }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/teaching/Schedule.vue'),
        meta: { title: '课程安排设置' }
      },
      {
        path: 'videos',
        name: 'Videos',
        component: () => import('@/views/teaching/Videos.vue'),
        meta: { title: '视频讲座播放' }
      },
      {
        path: 'question-bank',
        name: 'QuestionBank',
        component: () => import('@/views/teaching/QuestionBank.vue'),
        meta: { title: '在线题库' }
      },
      {
        path: 'exam',
        name: 'Exam',
        component: () => import('@/views/teaching/Exam.vue'),
        meta: { title: '考试系统' }
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('@/views/teaching/Students.vue'),
        meta: { title: '学员记录管理' }
      },
      {
        path: 'progress',
        name: 'Progress',
        component: () => import('@/views/teaching/Progress.vue'),
        meta: { title: '学习进度跟踪' }
      },
      {
        path: 'instructors',
        name: 'Instructors',
        component: () => import('@/views/teaching/Instructors.vue'),
        meta: { title: '讲师分配' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人主页' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查token是否存在
  const token = localStorage.getItem('token')
  if (token) {
    authStore.isLoggedIn = true
    authStore.userPhone = localStorage.getItem('userPhone') || ''
  }
  
  // 如果路由需要认证但用户未登录，跳转到登录页
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } 
  // 如果已登录用户访问登录页，跳转到首页
  else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
  } 
  else {
    next()
  }
})

export default router

