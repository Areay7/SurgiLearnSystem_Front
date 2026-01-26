<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">视频讲座播放</h1>
      <button class="btn-primary">上传视频</button>
    </div>

    <div class="layout">
      <div class="player card">
        <div class="player-box">
          <div class="play-icon">▶</div>
          <div class="player-title">{{ current.title }}</div>
          <div class="player-sub">时长：{{ current.duration }} · 主讲：{{ current.instructor }}</div>
        </div>
        <div class="player-actions">
          <button class="btn">倍速 1.0x</button>
          <button class="btn">清晰度 720p</button>
          <button class="btn">收藏</button>
        </div>
      </div>

      <div class="list card">
        <div class="list-head">
          <input class="search-input" placeholder="搜索视频..." />
          <select class="select">
            <option>全部专题</option>
            <option>外科基础</option>
            <option>感染控制</option>
            <option>护理管理</option>
          </select>
        </div>
        <div class="items">
          <button
            class="item"
            v-for="v in videos"
            :key="v.id"
            :class="{ active: v.id === current.id }"
            @click="current = v"
          >
            <div class="thumb">🎬</div>
            <div class="info">
              <div class="title">{{ v.title }}</div>
              <div class="sub">主讲：{{ v.instructor }} · {{ v.duration }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Video = {
  id: string
  title: string
  instructor: string
  duration: string
}

const videos: Video[] = [
  { id: 'v-001', title: '围手术期护理要点（上）', instructor: '李讲师', duration: '34:12' },
  { id: 'v-002', title: '伤口护理与感染控制', instructor: '王讲师', duration: '28:45' },
  { id: 'v-003', title: '护理管理：培训与考核闭环', instructor: '周讲师', duration: '41:09' }
]

const current = ref<Video>(videos[0])
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

.layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.player {
  padding: 16px;
}
.player-box {
  height: 360px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0f172a 0%, #1f2a44 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  position: relative;
}
.play-icon {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  margin-bottom: 14px;
}
.player-title {
  font-weight: 600;
  font-size: 18px;
  text-align: center;
  padding: 0 12px;
}
.player-sub {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}
.player-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.list-head {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 10px;
}
.search-input,
.select {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.search-input {
  flex: 1;
}
.items {
  max-height: 450px;
  overflow: auto;
}
.item {
  width: 100%;
  display: flex;
  gap: 12px;
  padding: 12px;
  border: none;
  background: white;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.3s;
}
.item:hover {
  background: #f5f7fa;
}
.item.active {
  background: #ecf5ff;
}
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.info .title {
  font-weight: 600;
  color: var(--text-primary);
}
.info .sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.hint {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}

@media (max-width: 1000px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .player-box {
    height: 260px;
  }
}
</style>


