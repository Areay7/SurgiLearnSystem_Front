<template>
  <div class="certificate-page">
    <div class="page-header">
      <h1 class="page-title">证书颁发</h1>
      <button class="btn-primary">颁发新证书</button>
    </div>
    
    <div class="certificate-content">
      <div class="filter-bar">
        <input type="text" placeholder="搜索学员姓名..." class="search-input" />
        <select class="filter-select">
          <option>全部证书类型</option>
          <option>结业证书</option>
          <option>培训证书</option>
          <option>资质证书</option>
        </select>
      </div>
      
      <div class="certificate-list">
        <div class="certificate-item" v-for="i in 6" :key="i">
          <div class="certificate-icon">📜</div>
          <div class="certificate-info">
            <h3 class="certificate-name">外科护理主管护师培训结业证书</h3>
            <p class="certificate-details">
              <span>学员：张{{ i }}</span>
              <span>证书编号：CERT-2024-00{{ i }}</span>
              <span>颁发日期：2024-01-15</span>
            </p>
          </div>
          <div class="certificate-actions">
            <button class="btn-view">查看</button>
            <button class="btn-download">下载</button>
            <button class="btn-print">打印</button>
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
.certificate-page {
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

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.certificate-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.certificate-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  gap: 20px;
}

.certificate-item:last-child {
  border-bottom: none;
}

.certificate-icon {
  font-size: 48px;
}

.certificate-info {
  flex: 1;
}

.certificate-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.certificate-details {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.certificate-actions {
  display: flex;
  gap: 8px;
}

.btn-view, .btn-download, .btn-print {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-view:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-download {
  background: var(--success-color);
  color: white;
  border-color: var(--success-color);
}

.btn-download:hover {
  background: #85ce61;
}

.btn-print {
  background: var(--info-color);
  color: white;
  border-color: var(--info-color);
}

.btn-print:hover {
  background: #a6a9ad;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
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
  .certificate-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .certificate-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>

