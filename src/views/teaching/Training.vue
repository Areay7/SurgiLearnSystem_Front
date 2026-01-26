<template>
  <div class="training-page">
    <div class="page-header">
      <h1 class="page-title">护理培训</h1>
      <button class="btn-primary">创建培训</button>
    </div>
    
    <div class="training-content">
      <div class="training-cards">
        <div class="training-card" v-for="i in 6" :key="i">
          <div class="card-header">
            <h3 class="card-title">外科护理基础培训 {{ i }}</h3>
            <span class="card-status" :class="i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'ongoing' : 'upcoming'">
              {{ i % 3 === 0 ? '已完成' : i % 3 === 1 ? '进行中' : '即将开始' }}
            </span>
          </div>
          <p class="card-description">
            本课程涵盖外科护理的基本理论、实践技能和案例分析，适合初级护理人员学习。
          </p>
          <div class="card-info">
            <span>👨‍🏫 讲师：李老师</span>
            <span>👨‍🎓 学员：{{ 20 + i * 5 }}人</span>
            <span>📅 开始：2024-01-{{ 10 + i }}</span>
          </div>
          <div class="card-actions">
            <button class="btn-view">查看详情</button>
            <button class="btn-join">参加培训</button>
          </div>
        </div>
      </div>
      
      <div class="pagination">
        <button class="page-btn">上一页</button>
        <span class="page-info">第 1 页，共 3 页</span>
        <button class="page-btn">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.training-page {
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-primary {
  padding: 10px 20px;
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

.training-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.training-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.training-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.card-status.ongoing {
  background: #ecf5ff;
  color: var(--primary-color);
}

.card-status.completed {
  background: #f0f9ff;
  color: var(--success-color);
}

.card-status.upcoming {
  background: #fef0f0;
  color: var(--warning-color);
}

.card-description {
  color: var(--text-regular);
  line-height: 1.6;
  margin-bottom: 16px;
  font-size: 14px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-view, .btn-join {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-view {
  background: white;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-view:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-join {
  background: var(--primary-color);
  color: white;
}

.btn-join:hover {
  background: #66b1ff;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

@media (max-width: 768px) {
  .training-cards {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>

