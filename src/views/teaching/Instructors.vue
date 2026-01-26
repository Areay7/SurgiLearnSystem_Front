<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">讲师分配</h1>
      <button class="btn-primary">新建分配</button>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">待分配课程</div>
        <div class="list">
          <div class="row" v-for="c in pendingCourses" :key="c.id">
            <div class="left">
              <div class="title">{{ c.title }}</div>
              <div class="sub">班级：{{ c.className }} · 时间：{{ c.time }}</div>
            </div>
            <button class="btn">分配</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">讲师列表</div>
        <div class="list">
          <div class="row" v-for="t in teachers" :key="t.id">
            <div class="left">
              <div class="title">{{ t.name }}</div>
              <div class="sub">擅长：{{ t.skills.join(' / ') }} · 当前课程：{{ t.current }}</div>
            </div>
            <button class="btn">查看</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card table-card">
      <div class="card-title">分配记录</div>
      <div class="table">
        <div class="tr th">
          <div class="td">课程</div>
          <div class="td">讲师</div>
          <div class="td">班级</div>
          <div class="td">时间</div>
          <div class="td">状态</div>
          <div class="td actions">操作</div>
        </div>
        <div class="tr" v-for="r in records" :key="r.id">
          <div class="td">{{ r.course }}</div>
          <div class="td">{{ r.teacher }}</div>
          <div class="td">{{ r.className }}</div>
          <div class="td">{{ r.time }}</div>
          <div class="td">
            <span class="badge" :class="r.status === '已确认' ? 'ok' : 'warn'">{{ r.status }}</span>
          </div>
          <div class="td actions">
            <button class="btn">调整</button>
            <button class="btn danger">撤销</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type PendingCourse = { id: string; title: string; className: string; time: string }
type Teacher = { id: string; name: string; skills: string[]; current: number }
type Record = { id: string; course: string; teacher: string; className: string; time: string; status: '待确认' | '已确认' }

const pendingCourses: PendingCourse[] = [
  { id: 'pc-001', title: '术后疼痛管理与护理评估', className: '2026 春季班', time: '2026-01-25 19:30' },
  { id: 'pc-002', title: '伤口换药实操要点', className: '外科专项班', time: '2026-01-26 14:00' }
]

const teachers: Teacher[] = [
  { id: 't-001', name: '李讲师', skills: ['外科基础', '围手术期护理'], current: 3 },
  { id: 't-002', name: '王讲师', skills: ['感染控制', '伤口护理'], current: 2 },
  { id: 't-003', name: '周讲师', skills: ['护理管理', '教学设计'], current: 1 }
]

const records: Record[] = [
  { id: 'r-001', course: '伤口处理与感染控制', teacher: '王讲师', className: '外科专项班', time: '2026-01-20 14:00', status: '已确认' },
  { id: 'r-002', course: '外科护理基础：术前评估', teacher: '李讲师', className: '2026 春季班', time: '2026-01-22 19:30', status: '待确认' }
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
  overflow: hidden;
}
.card-title {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  color: var(--text-primary);
}
.list .row {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}
.list .row:last-child {
  border-bottom: none;
}
.left .title {
  font-weight: 600;
  color: var(--text-primary);
}
.left .sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  white-space: nowrap;
}
.btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.btn.danger:hover {
  border-color: var(--danger-color);
  color: var(--danger-color);
}
.table-card {
  padding-bottom: 4px;
}
.table .tr {
  display: grid;
  grid-template-columns: 1.6fr 0.9fr 0.9fr 1fr 0.8fr 1.2fr;
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
.hint {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 12px;
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
    justify-content: flex-start;
  }
}
</style>


