<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">移动访问支持</h1>
      <button class="btn-primary">生成二维码</button>
    </div>

    <div class="grid">
      <div class="card">
        <h2 class="card-title">响应式适配说明</h2>
        <ul class="list">
          <li>侧边栏在手机端自动折叠为抽屉模式（现有布局已支持）。</li>
          <li>表格在窄屏下自动转为"卡片列"展示，避免横向滚动。</li>
        </ul>
      </div>

      <div class="card">
        <h2 class="card-title">移动端入口</h2>
        <div class="qr">
          <div class="qr-box">
            <div class="qr-fake">QR</div>
          </div>
          <div class="qr-meta">
            <div class="k">访问地址</div>
            <div class="v">http://localhost:5173</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn">复制链接</button>
          <button class="btn">下载二维码</button>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">移动端体验清单（建议）</h2>
      <div class="chips">
        <span class="chip">大字号模式</span>
        <span class="chip">手势返回</span>
        <span class="chip">拍照上传资料</span>
        <span class="chip">扫码考试</span>
        <span class="chip">学习提醒</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

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
  padding: 16px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.list {
  padding-left: 18px;
  color: var(--text-regular);
  line-height: 1.8;
}
.qr {
  display: flex;
  gap: 14px;
  align-items: center;
}
.qr-box {
  width: 120px;
  height: 120px;
  border-radius: 10px;
  border: 1px dashed var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fc;
}
.qr-fake {
  font-weight: 800;
  color: var(--text-secondary);
  letter-spacing: 2px;
}
.qr-meta .k {
  font-size: 12px;
  color: var(--text-secondary);
}
.qr-meta .v {
  margin-top: 6px;
  font-weight: 600;
  color: var(--text-primary);
}
.tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
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
.chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.chip {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #ecf5ff;
  color: var(--primary-color);
  border: 1px solid rgba(64, 158, 255, 0.25);
}
</style>


