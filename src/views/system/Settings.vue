<template>
  <div class="settings-page">
    <h1 class="page-title">系统设置</h1>
    
    <div class="settings-content">
      <div class="settings-tabs">
        <button class="tab-btn active">基本设置</button>
        <button class="tab-btn">通知设置</button>
        <button class="tab-btn">安全设置</button>
        <button class="tab-btn">数据备份</button>
      </div>
      
      <div class="settings-panel">
        <div class="setting-section">
          <h3 class="section-title">基本设置</h3>
          <div class="setting-item">
            <label class="setting-label">系统名称</label>
            <input type="text" class="setting-input" value="外科护理主管护师培训学习系统" />
          </div>
          <div class="setting-item">
            <label class="setting-label">系统Logo</label>
            <div class="upload-area">
              <span>点击上传Logo</span>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">每页显示数量</label>
            <select class="setting-select">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
        </div>
        
        <div class="setting-section">
          <h3 class="section-title">通知设置</h3>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" checked /> 邮件通知
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" checked /> 短信通知
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" /> 系统内通知
            </label>
          </div>
        </div>
        
        <div class="setting-section">
          <h3 class="section-title">安全设置</h3>
          <div class="setting-item">
            <label class="setting-label">密码最小长度</label>
            <input type="number" class="setting-input" value="8" />
          </div>
          <div class="setting-item">
            <label class="setting-label">登录失败锁定次数</label>
            <input type="number" class="setting-input" value="5" />
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" checked /> 启用双因素认证
            </label>
          </div>
        </div>
        
        <div class="setting-section">
          <h3 class="section-title">数据备份</h3>
          <div class="setting-item">
            <label class="setting-label">自动备份频率</label>
            <select class="setting-select">
              <option>每天</option>
              <option>每周</option>
              <option>每月</option>
            </select>
          </div>
          <div class="setting-item">
            <label class="setting-label">备份保留天数</label>
            <input type="number" class="setting-input" value="30" />
          </div>
          <div class="backup-actions">
            <button class="btn-backup">立即备份</button>
            <button class="btn-restore">恢复备份</button>
          </div>
        </div>
        
        <div class="settings-actions">
          <button class="btn-save">保存设置</button>
          <button class="btn-reset">重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.settings-page {
  max-width: 100%;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.settings-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.tab-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.settings-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.setting-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border-color);
}

.setting-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  font-size: 14px;
  color: var(--text-regular);
  margin-bottom: 8px;
}

.setting-input, .setting-select {
  width: 100%;
  max-width: 400px;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
}

.upload-area {
  padding: 40px;
  border: 2px dashed var(--border-color);
  border-radius: 6px;
  text-align: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.backup-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-backup, .btn-restore {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-backup {
  background: var(--primary-color);
  color: white;
}

.btn-backup:hover {
  background: #66b1ff;
}

.btn-restore {
  background: var(--warning-color);
  color: white;
}

.btn-restore:hover {
  background: #ebb563;
}

.settings-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.btn-save {
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-save:hover {
  background: #66b1ff;
}

.btn-reset {
  padding: 12px 24px;
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-reset:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .backup-actions, .settings-actions {
    flex-direction: column;
  }
  
  .btn-backup, .btn-restore, .btn-save, .btn-reset {
    width: 100%;
  }
}
</style>

