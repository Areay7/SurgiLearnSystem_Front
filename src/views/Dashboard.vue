<template>
  <div class="dashboard">
    <h1 class="page-title">系统首页</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.studentCount }}</div>
          <div class="stat-label">用户总数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.trainingCount }}</div>
          <div class="stat-label">课程总数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.questionCount }}</div>
          <div class="stat-label">题库题目</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📹</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.videoCount }}</div>
          <div class="stat-label">视频讲座</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.resourceCount }}</div>
          <div class="stat-label">共享资源</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.examOngoingCount }}</div>
          <div class="stat-label">进行中考试</div>
        </div>
      </div>
    </div>
    
    <div class="content-grid">
      <div class="content-card">
        <h2>最近活动</h2>
        <div v-if="loading" class="loading-state">加载中...</div>
        <ul v-else class="activity-list">
          <li v-for="(item, idx) in activities" :key="idx">{{ item.title }}</li>
          <li v-if="activities.length === 0" class="empty-hint">暂无活动</li>
        </ul>
      </div>
      
      <div class="content-card">
        <h2>快速入口</h2>
        <div class="quick-links">
          <router-link to="/training" class="quick-link">开始培训</router-link>
          <router-link to="/exam" class="quick-link">参加考试</router-link>
          <router-link to="/materials" class="quick-link">查看资料</router-link>
          <router-link to="/videos" class="quick-link">观看视频</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDashboardStats, getDashboardActivities, type DashboardStats, type DashboardActivity } from '@/api/dashboard'

const loading = ref(true)
const stats = ref<DashboardStats>({
  studentCount: 0,
  trainingCount: 0,
  questionCount: 0,
  videoCount: 0,
  resourceCount: 0,
  examOngoingCount: 0
})
const activities = ref<DashboardActivity[]>([])

const loadData = async () => {
  loading.value = true
  try {
    const [statsRes, activitiesRes] = await Promise.all([
      getDashboardStats(),
      getDashboardActivities(5)
    ])
    if (statsRes.code === 200 || statsRes.code === 0) {
      stats.value = (statsRes.data || stats.value) as DashboardStats
    }
    if (activitiesRes.code === 200 || activitiesRes.code === 0) {
      activities.value = (activitiesRes.data || []) as DashboardActivity[]
    }
  } catch (e) {
    console.error('加载首页数据失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.dashboard {
  max-width: 100%;
}

.page-title {
  font-size: 26px;
  font-weight: 500;
  margin-bottom: 28px;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 22px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 26px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.25s ease;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(91, 155, 213, 0.2);
}

.stat-icon {
  font-size: 44px;
  margin-right: 22px;
  opacity: 0.85;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 30px;
  font-weight: 500;
  color: var(--primary-color);
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 400;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 22px;
}

.content-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 26px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.content-card h2 {
  font-size: 17px;
  font-weight: 500;
  margin-bottom: 18px;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.activity-list {
  list-style: none;
  padding: 0;
}

.activity-list li {
  padding: 13px 0;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-regular);
  font-size: 14px;
  line-height: 1.6;
}

.activity-list li:last-child {
  border-bottom: none;
}

.loading-state {
  color: var(--text-secondary);
  font-size: 14px;
  padding: 20px 0;
}

.empty-hint {
  color: var(--text-secondary) !important;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-link {
  display: block;
  padding: 15px;
  background: var(--primary-color);
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.25s ease;
  font-size: 14px;
  font-weight: 400;
}

.quick-link:hover {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-links {
    grid-template-columns: 1fr;
  }
}
</style>

