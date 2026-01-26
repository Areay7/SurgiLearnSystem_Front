<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">学习进度跟踪</h1>
      <button class="btn-primary">导出报表</button>
    </div>

    <div class="filters">
      <select class="select">
        <option>全部班级</option>
        <option>2026 春季班</option>
        <option>外科专项班</option>
      </select>
      <select class="select">
        <option>全部维度</option>
        <option>课程进度</option>
        <option>练习完成</option>
        <option>考试通过</option>
      </select>
      <input class="search-input" placeholder="搜索学员..." />
    </div>

    <div class="cards">
      <div class="card metric">
        <div class="k">平均课程完成率</div>
        <div class="v">72%</div>
      </div>
      <div class="card metric">
        <div class="k">平均练习完成率</div>
        <div class="v">64%</div>
      </div>
      <div class="card metric">
        <div class="k">考试通过率</div>
        <div class="v">86%</div>
      </div>
      <div class="card metric">
        <div class="k">待跟进学员</div>
        <div class="v">18</div>
      </div>
    </div>

    <div class="card">
      <div class="table">
        <div class="tr th">
          <div class="td">学员</div>
          <div class="td">班级</div>
          <div class="td">课程完成</div>
          <div class="td">练习完成</div>
          <div class="td">考试通过</div>
          <div class="td actions">操作</div>
        </div>
        <div class="tr" v-for="r in rows" :key="r.id">
          <div class="td name">
            <div class="title">{{ r.name }}</div>
            <div class="sub">最近学习：{{ r.lastStudy }}</div>
          </div>
          <div class="td">{{ r.className }}</div>
          <div class="td">
            <div class="bar">
              <div class="fill" :style="{ width: r.course + '%' }" />
            </div>
            <div class="pct">{{ r.course }}%</div>
          </div>
          <div class="td">
            <div class="bar">
              <div class="fill" :style="{ width: r.practice + '%' }" />
            </div>
            <div class="pct">{{ r.practice }}%</div>
          </div>
          <div class="td">
            <span class="badge" :class="r.exam ? 'ok' : 'warn'">{{ r.exam ? '已通过' : '未通过' }}</span>
          </div>
          <div class="td actions">
            <button class="btn">详情</button>
            <button class="btn">提醒</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Row = {
  id: string
  name: string
  className: string
  course: number
  practice: number
  exam: boolean
  lastStudy: string
}

const rows: Row[] = [
  { id: 'p-001', name: '张三', className: '2026 春季班', course: 80, practice: 72, exam: true, lastStudy: '2026-01-20 21:10' },
  { id: 'p-002', name: '王五', className: '外科专项班', course: 55, practice: 40, exam: false, lastStudy: '2026-01-18 09:02' },
  { id: 'p-003', name: '赵六', className: '2026 春季班', course: 92, practice: 88, exam: true, lastStudy: '2026-01-21 08:40' }
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
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.search-input,
.select {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.search-input {
  flex: 1;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
}
.tr {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr 1fr 1fr 0.8fr 1fr;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}
.tr:last-child {
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
.name .title {
  font-weight: 600;
  color: var(--text-primary);
}
.name .sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.bar {
  height: 8px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, #66b1ff 100%);
}
.pct {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
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
.badge.warn {
  border-color: rgba(230, 162, 60, 0.35);
  background: rgba(230, 162, 60, 0.12);
  color: #b36a00;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn {
  padding: 6px 10px;
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
.hint {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}
@media (max-width: 980px) {
  .filters {
    flex-direction: column;
  }
  .tr {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .th {
    display: none;
  }
  .actions {
    justify-content: flex-start;
  }
}
</style>


