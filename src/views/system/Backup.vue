<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">数据备份</h1>
      <button class="btn-primary">立即备份</button>
    </div>

    <div class="cards">
      <div class="card metric">
        <div class="k">最近一次备份</div>
        <div class="v">2026-01-20 02:10</div>
        <div class="sub">类型：自动 · 耗时：38s</div>
      </div>
      <div class="card metric">
        <div class="k">备份策略</div>
        <div class="v">每日 02:00</div>
        <div class="sub">保留：30 天 · 存储：对象存储</div>
      </div>
      <div class="card metric">
        <div class="k">备份状态</div>
        <div class="v ok">正常</div>
        <div class="sub">本页为前端界面示例</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2 class="card-title">备份策略配置</h2>
        <div class="form">
          <div class="field">
            <div class="label">自动备份</div>
            <div class="value">
              <label class="switch"><input type="checkbox" checked /><span class="slider" /></label>
            </div>
          </div>
          <div class="field">
            <div class="label">备份时间</div>
            <div class="value">
              <select class="select">
                <option>02:00</option>
                <option>03:00</option>
                <option>04:00</option>
              </select>
            </div>
          </div>
          <div class="field">
            <div class="label">保留天数</div>
            <div class="value">
              <select class="select">
                <option>7</option>
                <option>14</option>
                <option selected>30</option>
                <option>90</option>
              </select>
            </div>
          </div>
          <div class="field">
            <div class="label">存储位置</div>
            <div class="value">
              <select class="select">
                <option>本地磁盘（开发）</option>
                <option>对象存储（推荐）</option>
              </select>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="btn">保存配置</button>
          <button class="btn">测试备份</button>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">备份记录</h2>
        <div class="table">
          <div class="tr th">
            <div class="td">时间</div>
            <div class="td">类型</div>
            <div class="td">大小</div>
            <div class="td">状态</div>
            <div class="td actions">操作</div>
          </div>
          <div class="tr" v-for="b in backups" :key="b.id">
            <div class="td">{{ b.time }}</div>
            <div class="td">{{ b.type }}</div>
            <div class="td">{{ b.size }}</div>
            <div class="td">
              <span class="badge" :class="b.status === '成功' ? 'ok' : 'danger'">{{ b.status }}</span>
            </div>
            <div class="td actions">
              <button class="btn">下载</button>
              <button class="btn">恢复</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type BackupRow = { id: string; time: string; type: '自动' | '手动'; size: string; status: '成功' | '失败' }

const backups: BackupRow[] = [
  { id: 'b-001', time: '2026-01-20 02:10', type: '自动', size: '128MB', status: '成功' },
  { id: 'b-002', time: '2026-01-19 02:10', type: '自动', size: '127MB', status: '成功' },
  { id: 'b-003', time: '2026-01-18 15:33', type: '手动', size: '126MB', status: '成功' }
]
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
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.metric {
  padding: 16px;
}
.k {
  color: var(--text-secondary);
  font-size: 12px;
}
.v {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}
.v.ok {
  color: var(--success-color);
}
.sub {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
}
.card-title {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  color: var(--text-primary);
}
.form {
  padding: 14px 16px;
  display: grid;
  gap: 12px;
}
.field {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}
.label {
  color: var(--text-regular);
  font-size: 14px;
}
.select {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.actions {
  padding: 0 16px 16px;
  display: flex;
  gap: 8px;
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
.table .tr {
  display: grid;
  grid-template-columns: 1.4fr 0.7fr 0.6fr 0.7fr 1fr;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}
.table .tr:last-child {
  border-bottom: none;
}
.th {
  background: #f7f9fc;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}
.td {
  color: var(--text-regular);
  font-size: 14px;
}
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-secondary);
}
.badge.ok {
  border-color: rgba(103, 194, 58, 0.35);
  background: rgba(103, 194, 58, 0.1);
  color: #3f9c1f;
}
.badge.danger {
  border-color: rgba(245, 108, 108, 0.35);
  background: rgba(245, 108, 108, 0.12);
  color: #d64545;
}
.actions .btn + .btn {
  margin-left: 0;
}
.actions .td {
  justify-content: flex-end;
}
.hint {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cfd6e4;
  transition: 0.2s;
  border-radius: 999px;
}
.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 999px;
}
input:checked + .slider {
  background-color: var(--primary-color);
}
input:checked + .slider:before {
  transform: translateX(20px);
}

@media (max-width: 980px) {
  .table .tr {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .th {
    display: none;
  }
  .actions {
    flex-wrap: wrap;
  }
}
</style>


