<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">我的证书</h1>
      <button class="btn-action" @click="load" :disabled="loading">刷新</button>
    </div>

    <div class="card list" v-if="!loading">
      <div class="row" v-for="c in list" :key="c.id">
        <div class="icon">🏅</div>
        <div class="info">
          <div class="title">{{ c.certificateType || '培训证书' }}</div>
          <div class="sub">
            <span>培训：{{ c.trainingCourse || '-' }}</span>
            <span>颁发：{{ formatDate(c.issueDate) }}</span>
            <span>机构：{{ c.organization || '-' }}</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn" @click="openPreview(c)">查看</button>
          <button class="btn primary" @click="printCertificate(c)">打印/导出</button>
        </div>
      </div>
      <div v-if="list.length === 0" class="empty">暂无证书</div>
    </div>
    <div v-else class="loading">加载中...</div>

    <div class="pagination">
      <button class="page-btn" @click="prevPage" :disabled="page===1 || loading">上一页</button>
      <span class="page-info">第 {{ page }} 页（共 {{ total }} 条）</span>
      <button class="page-btn" @click="nextPage" :disabled="loading || list.length < pageSize">下一页</button>
    </div>

    <div v-if="showPreview" class="dialog-overlay" @click="closePreview">
      <div class="dialog preview-dialog" @click.stop>
        <div class="dialog-header">
          <h3>证书预览</h3>
          <button class="close-btn" @click="closePreview">×</button>
        </div>
        <div class="dialog-body">
          <div class="preview-scale">
            <div class="certificate-sheet">
              <div class="sheet-inner">
                <div class="sheet-title">{{ previewItem?.certificateType || '培训证书' }}</div>
                <div class="sheet-body">
                  <div class="p body-text">{{ defaultContent(previewItem) }}</div>
                </div>
                <div class="sheet-footer">
                  <div class="org">{{ previewItem?.organization || 'SurgiLearn 培训中心' }}</div>
                  <div class="issue-date">{{ formatDate(previewItem?.issueDate) }}</div>
                </div>
                <img v-if="previewStampUrl" class="stamp" :src="previewStampUrl" alt="stamp" />
                <div class="border-corner tl"></div>
                <div class="border-corner tr"></div>
                <div class="border-corner bl"></div>
                <div class="border-corner br"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn primary" @click="printCertificate(previewItem!)" :disabled="!previewItem">打印/导出</button>
          <button class="btn-cancel" @click="closePreview">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { API_BASE_URL } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import { listMyCertificates, type CertificateIssue } from '@/api/certificate'

const auth = useAuthStore()
const loading = ref(false)
const list = ref<CertificateIssue[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const holderId = computed(() => auth.userPhone || '')

const showPreview = ref(false)
const previewItem = ref<CertificateIssue | null>(null)

const previewStampUrl = computed(() => {
  if (!previewItem.value?.stampPath) return ''
  return previewItem.value.stampPath.startsWith('http')
    ? previewItem.value.stampPath
    : `${API_BASE_URL}/CertificateIssueController/stamp/${previewItem.value.stampPath}`
})

const formatDate = (s?: string) => {
  if (!s) return '-'
  try { return new Date(s).toLocaleDateString('zh-CN').replaceAll('/','-') } catch { return s }
}

const defaultContent = (c?: CertificateIssue | null) => {
  const name = c?.holderName || '______'
  const date = c?.issueDate ? formatDate(c.issueDate) : '20xx年x月'
  const course = c?.trainingCourse || '______'
  return `${name}同志：\n\n${'　'.repeat(5)}于${date}参加${course}培训，并已完成全部课程，经考核合格，\n特发此证。`
}

const load = async () => {
  if (!holderId.value) return
  loading.value = true
  try {
    const res = await listMyCertificates(holderId.value, { page: page.value, limit: pageSize.value })
    list.value = res.data || []
    total.value = res.count || 0
  } finally {
    loading.value = false
  }
}

const prevPage = () => { if (page.value > 1) { page.value--; load() } }
const nextPage = () => { page.value++; load() }

const openPreview = (c: CertificateIssue) => { previewItem.value = c; showPreview.value = true }
const closePreview = () => { showPreview.value = false; previewItem.value = null }

const printCertificate = (c: CertificateIssue) => {
  const w = window.open('', '_blank')
  if (!w) return
  const stamp = c.stampPath ? (c.stampPath.startsWith('http') ? c.stampPath : `${API_BASE_URL}/CertificateIssueController/stamp/${c.stampPath}`) : ''
  const name = c.holderName || '______'
  const date = c.issueDate ? formatDate(c.issueDate) : '20xx年x月'
  const course = c.trainingCourse || '______'
  const org = c.organization || 'SurgiLearn 培训中心'
  const title = c.certificateType || '培训证书'
  const html = `
  <html><head><title>证书</title>
  <style>
    @page{margin:15mm 12mm 25mm 12mm;}
    *{margin:0;padding:0;box-sizing:border-box;}
    body{margin:0;padding:0;font-family:Arial,'PingFang SC','Microsoft YaHei',sans-serif;background:#fff;}
    .sheet{width:850px;height:560px;margin:0 auto;position:relative;background:#fff;page-break-inside:avoid;}
    .sheet-inner{position:relative;height:100%;padding:24px;background:#fff;}
    .sheet-inner:before{content:'';position:absolute;top:16px;left:16px;right:16px;bottom:28px;border:3px solid #c7a45d;border-radius:12px;}
    .corner{position:absolute;width:30px;height:30px;border:3px solid #c7a45d;}
    .corner.tl{left:16px;top:16px;border-right:none;border-bottom:none;border-radius:12px 0 0 0;}
    .corner.tr{right:16px;top:16px;border-left:none;border-bottom:none;border-radius:0 12px 0 0;}
    .corner.bl{left:16px;bottom:28px;border-right:none;border-top:none;border-radius:0 0 0 12px;}
    .corner.br{right:16px;bottom:28px;border-left:none;border-top:none;border-radius:0 0 12px 0;}
    .title{position:relative;font-size:46px;letter-spacing:10px;text-align:center;margin-top:0;color:#2c3e50;font-weight:800;}
    .body{position:relative;margin-top:4.2em;font-size:18px;line-height:2;color:#2c3e50;padding:0 70px;}
    .body .p1{margin-bottom:1em;}
    .body .p2{margin-left:5em;}
    .body .p3{margin-top:0.3em;}
    .footer{position:absolute;left:70px;right:70px;bottom:105px;font-size:17px;color:#2c3e50;text-align:right;}
    .org{margin-bottom:6px;}
    .stamp{position:absolute;right:70px;bottom:155px;width:160px;opacity:0.9;filter:drop-shadow(0 6px 8px rgba(0,0,0,0.15));}
    @media print{body{background:#fff;}.sheet{box-shadow:none;margin:0 auto;}}
  </style></head><body onload="window.print()">
    <div class="sheet">
      <div class="sheet-inner">
        <div class="title">${title}</div>
        <div class="body">
          <div class="p1">${name}同志：</div>
          <div class="p2">于${date}参加${course}培训，并已完成全部课程，经考核合格，</div>
          <div class="p3">特发此证。</div>
        </div>
        <div class="footer">
          <div class="org">${org}</div>
          <div>${formatDate(c.issueDate)}</div>
        </div>
        ${stamp ? `<img class="stamp" src="${stamp}" />` : ''}
        <div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner bl"></div>
        <div class="corner br"></div>
      </div>
    </div>
  </body></html>`
  w.document.write(html)
  w.document.close()
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px; }
.page-title { font-size:24px; font-weight:600; color:var(--text-primary); }
.btn-action { padding:10px 14px; border:1px solid var(--border-color); background:#fff; border-radius:10px; cursor:pointer; }
.card.list { background:#fff; border-radius:12px; border:1px solid var(--border-color); overflow:hidden; }
.row { display:flex; gap:12px; padding:14px; border-bottom:1px solid var(--border-color); align-items:flex-start; }
.row:last-child{border-bottom:none;}
.icon{font-size:24px;}
.info{flex:1; min-width:0;}
.title{font-weight:700; color:var(--text-primary); margin-bottom:6px;}
.sub{display:flex; flex-wrap:wrap; gap:10px; color:var(--text-secondary); font-size:12px;}
.actions{display:flex; gap:8px;}
.btn{padding:8px 12px; border:1px solid var(--border-color); background:#fff; border-radius:10px; cursor:pointer;}
.btn.primary{background:var(--primary-color); border-color:var(--primary-color); color:#fff;}
.empty{padding:20px; text-align:center; color:var(--text-secondary);}
.pagination{display:flex; justify-content:center; gap:12px; margin-top:16px; flex-wrap:wrap;}
.page-btn{padding:10px 14px; border:1px solid var(--border-color); background:#fff; border-radius:10px; cursor:pointer;}
.page-info{color:var(--text-secondary); font-size:13px;}

.dialog-overlay{position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000;}
.dialog{background:#fff; width:92%; max-width:960px; max-height:90vh; overflow:auto; border-radius:14px;}
.dialog-header{display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid var(--border-color);}
.close-btn{background:none; border:none; font-size:24px; cursor:pointer;}
.dialog-body{padding:16px;}
.dialog-footer{display:flex; justify-content:flex-end; gap:10px; padding:16px; border-top:1px solid var(--border-color);}
.btn-cancel{padding:10px 14px; border:1px solid var(--border-color); background:#fff; border-radius:10px; cursor:pointer;}

/* 证书预览样式（复用 Certificate.vue 的结构，保持一致） */
.preview-scale{display:flex; justify-content:center;}
.certificate-sheet{width:860px; aspect-ratio: 1123/794; background:#fff; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,0.12); overflow:hidden;}
.sheet-inner{position:relative; height:100%; padding:28px; background:linear-gradient(180deg,#fffdf6 0%, #ffffff 35%, #fffdf6 100%);}
.sheet-inner:before{content:''; position:absolute; inset:18px; border:3px solid #c7a45d; border-radius:14px;}
.sheet-title{position:relative; text-align:center; font-size:44px; letter-spacing:16px; margin-top:18px; color:#2c3e50; font-weight:800;}
.sheet-body{position:relative; margin-top:4.2em; padding:0 50px; font-size:18px; line-height:2; color:#2c3e50;}
.sheet-body .p.body-text{white-space:pre-wrap; text-align:justify; line-height:2;}
.sheet-footer{position:absolute; left:70px; right:70px; bottom:70px; display:flex; justify-content:flex-end; color:#2c3e50; font-weight:600; text-align:right;}
.stamp{position:absolute; right:120px; bottom:90px; width:150px; opacity:0.9; filter: drop-shadow(0 8px 10px rgba(0,0,0,0.15));}
.border-corner{position:absolute; width:34px; height:34px; border:3px solid #c7a45d;}
.border-corner.tl{left:18px; top:18px; border-right:none; border-bottom:none; border-radius:14px 0 0 0;}
.border-corner.tr{right:18px; top:18px; border-left:none; border-bottom:none; border-radius:0 14px 0 0;}
.border-corner.bl{left:18px; bottom:18px; border-right:none; border-top:none; border-radius:0 0 0 14px;}
.border-corner.br{right:18px; bottom:18px; border-left:none; border-top:none; border-radius:0 0 14px 0;}

@media (max-width: 768px){
  .page-header{flex-direction:column; align-items:flex-start;}
  .btn-action{width:100%;}
  .row{flex-direction:column;}
  .actions{width:100%;}
  .actions .btn{flex:1;}
  .certificate-sheet{width:100%;}
}
</style>

