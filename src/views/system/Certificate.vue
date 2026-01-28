<template>
  <div class="certificate-page">
    <div class="page-header">
      <h1 class="page-title">证书颁发</h1>
      <button class="btn-primary" @click="openIssueDialog">颁发新证书</button>
    </div>
    
    <div class="certificate-content">
      <div class="filter-bar">
        <input v-model="searchText" type="text" placeholder="搜索学员姓名..." class="search-input" @keyup.enter="load" />
        <button class="btn-action" @click="load" :disabled="loading">查询</button>
      </div>
      
      <div class="certificate-list">
        <div class="certificate-item" v-for="c in list" :key="c.id">
          <div class="certificate-icon">📜</div>
          <div class="certificate-info">
            <h3 class="certificate-name">{{ c.certificateType || '培训证书' }}</h3>
            <p class="certificate-details">
              <span>学员：{{ c.holderName || '-' }}</span>
              <span>证书编号：{{ c.certificateId || c.id }}</span>
              <span>颁发日期：{{ formatDate(c.issueDate) }}</span>
            </p>
          </div>
          <div class="certificate-actions">
            <button class="btn-view" @click="openPreview(c)">查看</button>
            <button class="btn-download" @click="printCertificate(c)">打印/导出</button>
            <button class="btn-print" @click="removeOne(c)" :disabled="!c.id">删除</button>
          </div>
        </div>
      </div>
      
      <div class="pagination">
        <button class="page-btn" @click="prevPage" :disabled="page===1 || loading">上一页</button>
        <span class="page-info">第 {{ page }} 页（共 {{ total }} 条）</span>
        <button class="page-btn" @click="nextPage" :disabled="loading || list.length < pageSize">下一页</button>
      </div>
    </div>

    <!-- 颁发/编辑证书 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog issue-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '颁发新证书' : '编辑证书' }}</h3>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="issue-grid">
            <div class="form">
              <div class="form-group">
                <label>颁发对象 *</label>
                <div class="recipient-row">
                  <select class="form-input recipient-type" v-model="recipientType">
                    <option :value="1">学员</option>
                    <option :value="2">讲师</option>
                  </select>
                  <input class="form-input" v-model="form.holderName" placeholder="请选择或输入姓名" />
                  <button class="btn-action" @click="openRecipientDialog">选择</button>
                </div>
                <div class="tip" v-if="form.holderId">已绑定：{{ form.holderId }}</div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>颁发日期</label>
                  <input class="form-input" type="date" v-model="issueDateStr" />
                </div>
                <div class="form-group">
                  <label>培训名称 *</label>
                  <input class="form-input" v-model="form.trainingCourse" placeholder="例如：外科护理培训" />
                </div>
              </div>
              <div class="form-group">
                <label>证书类型</label>
                <input class="form-input" v-model="form.certificateType" placeholder="例如：结业证书" />
              </div>
              <div class="form-group">
                <label>颁发机构</label>
                <input class="form-input" v-model="form.organization" placeholder="例如：SurgiLearn 培训中心" />
              </div>

              <div class="form-group">
                <label>盖章图片（固定位置）</label>
                <div class="stamp-row">
                  <input type="file" ref="stampInputRef" class="hidden" accept=".png,.jpg,.jpeg,.webp" @change="onStampChange" />
                  <button class="btn-action" @click="triggerStamp">选择盖章图片</button>
                  <span class="stamp-hint">{{ stampStatus }}</span>
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-primary" @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
              </div>
            </div>

            <!-- 证书预览（固定尺寸） -->
            <div class="preview-wrap">
              <div class="preview-scale">
                <div class="certificate-sheet" id="certificate-preview">
                  <div class="sheet-inner">
                    <div class="sheet-title">培训证书</div>

                    <div class="sheet-body">
                      <div class="p">
                        <span class="name">{{ form.holderName || '______' }}</span> 同志：
                        <br />
                        <span class="line2">
                          于<span class="date">{{ formatCNDate(issueDateStr) }}</span>
                          参加<span class="course">{{ form.trainingCourse || '______' }}</span>培训，并已完成全部课程，
                        </span>
                        <br />
                        经考核合格，特此发证。
                      </div>
                      <!-- 去掉可编辑正文模块，统一使用固定模板文案 -->
                    </div>

                    <div class="sheet-footer">
                      <div class="footer-left">
                        <div class="org">{{ form.organization || 'SurgiLearn 培训中心' }}</div>
                        <div class="issue-date">{{ formatCNDate(issueDateStr) }}</div>
                      </div>
                    </div>

                    <!-- 固定盖章位置：在地址与日期正上方居右 -->
                    <img v-if="stampPreviewUrl" class="stamp" :src="stampPreviewUrl" alt="stamp" />
                    <div class="border-corner tl"></div>
                    <div class="border-corner tr"></div>
                    <div class="border-corner bl"></div>
                    <div class="border-corner br"></div>
                  </div>
                </div>
              </div>
              <div class="preview-tip">预览为固定尺寸证书；打印/导出请点击列表里的“打印/导出”。</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 选择颁发对象（学员/讲师） -->
    <div v-if="showRecipientDialog" class="dialog-overlay" @click="closeRecipientDialog">
      <div class="dialog recipient-dialog" @click.stop>
        <div class="dialog-header">
          <h3>选择{{ recipientType === 1 ? '学员' : '讲师' }}</h3>
          <button class="close-btn" @click="closeRecipientDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="recipient-toolbar">
            <input class="search-input" v-model="recipientSearch" :placeholder="recipientType === 1 ? '搜索学员姓名/手机号/员工号' : '搜索讲师姓名/手机号/员工号'" @keyup.enter="loadRecipients" />
            <button class="btn-action" @click="loadRecipients" :disabled="recipientLoading">查询</button>
          </div>
          <div class="recipient-list">
            <button class="recipient-item" v-for="u in recipients" :key="u.id" @click="chooseRecipient(u)">
              <div class="r-name">{{ u.studentName }}</div>
              <div class="r-meta">
                <span>手机号：{{ u.phone || '-' }}</span>
                <span>员工号：{{ u.employeeId || '-' }}</span>
                <span>科室：{{ u.department || '-' }}</span>
              </div>
            </button>
            <div v-if="!recipientLoading && recipients.length === 0" class="empty">没有找到匹配的人员</div>
          </div>
          <div class="pagination mini">
            <button class="page-btn" @click="prevRecipientPage" :disabled="recipientPage===1 || recipientLoading">上一页</button>
            <span class="page-info">第 {{ recipientPage }} 页</span>
            <button class="page-btn" @click="nextRecipientPage" :disabled="recipientLoading || recipients.length < recipientPageSize">下一页</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看证书（弹窗预览+打印） -->
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
                <div class="sheet-title">培训证书</div>
                <div class="sheet-body">
                  <div class="p">{{ previewItem?.contentText || defaultContent(previewItem) }}</div>
                </div>
                <div class="sheet-footer">
                  <div class="footer-left">
                    <div class="org">{{ previewItem?.organization || 'SurgiLearn 培训中心' }}</div>
                    <div class="issue-date">{{ formatDate(previewItem?.issueDate) }}</div>
                  </div>
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
          <button class="btn-primary" @click="printCertificate(previewItem!)" :disabled="!previewItem">打印/导出</button>
          <button class="btn-cancel" @click="closePreview">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { API_BASE_URL } from '@/config/api'
import { addCertificateIssue, deleteCertificateIssue, listCertificateIssues, updateCertificateIssue, uploadCertificateStamp, type CertificateIssue } from '@/api/certificate'
import { getStudentsList, type Students } from '@/api/students'

const loading = ref(false)
const saving = ref(false)
const list = ref<CertificateIssue[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchText = ref('')

const showDialog = ref(false)
const dialogMode = ref<'add'|'edit'>('add')
const stampInputRef = ref<HTMLInputElement | null>(null)
const stampPreviewUrl = ref<string>('')
const stampStatus = ref('未选择')

const showPreview = ref(false)
const previewItem = ref<CertificateIssue | null>(null)

const recipientType = ref<1 | 2>(1) // 1-学员 2-讲师（Students.userType）
const showRecipientDialog = ref(false)
const recipientSearch = ref('')
const recipientLoading = ref(false)
const recipients = ref<Students[]>([])
const recipientPage = ref(1)
const recipientPageSize = ref(10)

const form = reactive<CertificateIssue>({
  holderName: '',
  holderId: '',
  trainingCourse: '',
  certificateType: '培训证书',
  organization: 'SurgiLearn 培训中心',
  certificateStatus: '已颁发'
})
const issueDateStr = ref<string>(new Date().toISOString().slice(0,10))

const defaultContent = (c?: CertificateIssue | null) => {
  const name = c?.holderName || '______'
  const date = c?.issueDate ? formatDate(c.issueDate) : '20xx年x月'
  const course = c?.trainingCourse || '______'
  return `${name}同志：\n    于${date}参加${course}培训，并已完成全部课程，\n经考核合格，特此发证。`
}

const formatCNDate = (d?: string) => {
  if (!d) return '20xx年x月'
  const [y,m,dd] = d.split('-')
  return `${y}年${Number(m)}月${Number(dd)}日`
}
const formatDate = (s?: string) => {
  if (!s) return '-'
  try { return new Date(s).toLocaleDateString('zh-CN').replaceAll('/','-') } catch { return s }
}

const previewStampUrl = computed(() => {
  if (!previewItem.value?.stampPath) return ''
  // stampPath 既可能是 key，也可能是完整路径/URL，这里优先走 key 预览
  return previewItem.value.stampPath.startsWith('http')
    ? previewItem.value.stampPath
    : `${API_BASE_URL}/CertificateIssueController/stamp/${previewItem.value.stampPath}`
})

const load = async () => {
  loading.value = true
  try {
    const res = await listCertificateIssues({ page: page.value, limit: pageSize.value, searchText: searchText.value || undefined })
    list.value = res.data || []
    total.value = res.count || 0
  } finally {
    loading.value = false
  }
}

const prevPage = () => { if (page.value > 1) { page.value--; load() } }
const nextPage = () => { page.value++; load() }

const openIssueDialog = () => {
  dialogMode.value = 'add'
  Object.assign(form, {
    id: undefined,
    holderName: '',
    holderId: '',
    trainingCourse: '',
    certificateType: '培训证书',
    organization: 'SurgiLearn 培训中心',
    certificateStatus: '已颁发'
  })
  issueDateStr.value = new Date().toISOString().slice(0,10)
  stampPreviewUrl.value = ''
  form.stampPath = undefined
  stampStatus.value = '未选择'
  showDialog.value = true
}

const closeDialog = () => { showDialog.value = false }

const openRecipientDialog = () => {
  recipientPage.value = 1
  showRecipientDialog.value = true
  loadRecipients()
}
const closeRecipientDialog = () => { showRecipientDialog.value = false }
const prevRecipientPage = () => { if (recipientPage.value > 1) { recipientPage.value--; loadRecipients() } }
const nextRecipientPage = () => { recipientPage.value++; loadRecipients() }

const loadRecipients = async () => {
  recipientLoading.value = true
  try {
    const res = await getStudentsList({
      page: recipientPage.value,
      limit: recipientPageSize.value,
      searchText: recipientSearch.value || undefined,
      userType: recipientType.value
    })
    recipients.value = res.data || []
  } finally {
    recipientLoading.value = false
  }
}

const chooseRecipient = (u: Students) => {
  form.holderName = u.studentName
  form.holderId = (u.phone && u.phone.trim()) ? u.phone.trim() : (u.studentId != null ? String(u.studentId) : '')
  showRecipientDialog.value = false
}

const triggerStamp = () => stampInputRef.value?.click()

const onStampChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  stampStatus.value = '上传中...'
  try {
    const res = await uploadCertificateStamp(file)
    if (res.code === 0 || res.code === 200) {
      const key = res.data as any as string
      form.stampPath = key
      stampPreviewUrl.value = `${API_BASE_URL}/CertificateIssueController/stamp/${key}`
      stampStatus.value = '已选择'
    } else {
      stampStatus.value = '上传失败'
      alert(res.msg || '上传失败')
    }
  } catch (err: any) {
    stampStatus.value = '上传失败'
    alert(err.message || '上传失败')
  } finally {
    ;(e.target as HTMLInputElement).value = ''
  }
}

const save = async () => {
  if (!form.holderName?.trim()) return alert('请输入姓名')
  if (!form.holderId?.trim()) return alert('请选择颁发对象（需绑定手机号/ID）')
  if (!form.trainingCourse?.trim()) return alert('请输入培训名称')
  saving.value = true
  try {
    form.issueDate = issueDateStr.value ? `${issueDateStr.value} 00:00:00` : undefined
    const payload = { ...form }
    const res = dialogMode.value === 'add'
      ? await addCertificateIssue(payload)
      : await updateCertificateIssue(payload)
    if (res.code === 0 || res.code === 200) {
      alert('保存成功')
      showDialog.value = false
      await load()
    } else {
      alert(res.msg || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

const openPreview = (c: CertificateIssue) => {
  previewItem.value = c
  showPreview.value = true
}
const closePreview = () => { showPreview.value = false; previewItem.value = null }

const removeOne = async (c: CertificateIssue) => {
  if (!c.id) return
  if (!confirm('确定删除该证书记录吗？')) return
  const res = await deleteCertificateIssue(String(c.id))
  if (res.code === 0 || res.code === 200) {
    alert('删除成功')
    load()
  } else {
    alert(res.msg || '删除失败')
  }
}

const printCertificate = (c: CertificateIssue) => {
  // 简化：打开新窗口并打印
  const w = window.open('', '_blank')
  if (!w) return
  const stamp = c.stampPath ? (c.stampPath.startsWith('http') ? c.stampPath : `${API_BASE_URL}/CertificateIssueController/stamp/${c.stampPath}`) : ''
  const name = c.holderName || '______'
  const date = c.issueDate ? formatDate(c.issueDate) : '20xx年x月'
  const course = c.trainingCourse || '______'
  const org = c.organization || 'SurgiLearn 培训中心'
  const html = `
  <html><head><title>证书</title>
  <style>
    @page{margin:12mm;}
    body{margin:0;padding:0;font-family:Arial,'PingFang SC','Microsoft YaHei',sans-serif;background:#f3f4f6;}
    .sheet{width:900px;height:620px;margin:20px auto;position:relative;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,0.18);border-radius:16px;overflow:hidden;}
    .sheet-inner{position:relative;height:100%;padding:28px;background:linear-gradient(180deg,#fffdf6 0%,#ffffff 35%,#fffdf6 100%);}
    .sheet-inner:before{content:'';position:absolute;top:18px;left:18px;right:18px;bottom:46px;border:3px solid #c7a45d;border-radius:14px;}
    .corner{position:absolute;width:34px;height:34px;border:3px solid #c7a45d;}
    .corner.tl{left:18px;top:18px;border-right:none;border-bottom:none;border-radius:14px 0 0 0;}
    .corner.tr{right:18px;top:18px;border-left:none;border-bottom:none;border-radius:0 14px 0 0;}
    .corner.bl{left:18px;bottom:18px;border-right:none;border-top:none;border-radius:0 0 0 14px;}
    .corner.br{right:18px;bottom:18px;border-left:none;border-top:none;border-radius:0 0 14px 0;}
    .title{position:relative;font-size:54px;letter-spacing:16px;text-align:center;margin-top:20px;color:#2c3e50;font-weight:800;}
    .body{position:relative;margin-top:60px;font-size:22px;line-height:1.9;color:#2c3e50;padding:0 80px;}
    .line2{display:inline-block;margin-left:5em;}
    .footer{position:absolute;left:80px;right:80px;bottom:70px;font-size:18px;color:#2c3e50;text-align:right;}
    .org{margin-bottom:8px;}
    .stamp{position:absolute;right:140px;bottom:95px;width:170px;opacity:0.9;filter:drop-shadow(0 8px 10px rgba(0,0,0,0.15));}
  </style></head><body onload="window.print()">
    <div class="sheet">
      <div class="sheet-inner">
        <div class="title">培训证书</div>
        <div class="body">
          <div>${name}同志：</div>
          <div class="line2">于${date}参加${course}培训，并已完成全部课程，</div>
          <div>经考核合格，特此发证。</div>
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
.certificate-page { max-width: 100%; }

.page-header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px; }
.page-title { font-size:24px; font-weight:800; color:var(--text-primary); letter-spacing:0.5px; }

.btn-primary { padding:10px 18px; background:var(--primary-color); color:#fff; border:none; border-radius:10px; cursor:pointer; font-size:14px; transition:transform .12s, background .2s; }
.btn-primary:hover { background:#66b1ff; transform:translateY(-1px); }

.btn-action { padding:10px 14px; border:1px solid var(--border-color); background:#fff; border-radius:10px; cursor:pointer; font-size:14px; transition:all .2s; }
.btn-action:hover { border-color:var(--primary-color); color:var(--primary-color); }

.filter-bar { display:flex; gap:12px; margin-bottom:14px; }
.search-input { flex:1; padding:10px 14px; border:1px solid var(--border-color); border-radius:10px; font-size:14px; background:#fff; }

.certificate-list { background:#fff; border-radius:12px; overflow:hidden; border:1px solid var(--border-color); box-shadow:0 10px 30px rgba(0,0,0,0.06); }
.certificate-item { display:flex; align-items:flex-start; padding:16px; border-bottom:1px solid var(--border-color); gap:14px; }
.certificate-item:last-child { border-bottom:none; }
.certificate-icon { font-size:32px; line-height:1; }
.certificate-info { flex:1; min-width:0; }
.certificate-name { font-size:16px; font-weight:800; color:var(--text-primary); margin:0 0 6px; }
.certificate-details { display:flex; gap:12px; font-size:12px; color:var(--text-secondary); flex-wrap:wrap; }
.certificate-actions { display:flex; gap:8px; flex-wrap:wrap; }

.btn-view, .btn-download, .btn-print { padding:8px 12px; border:1px solid var(--border-color); background:#fff; border-radius:10px; cursor:pointer; font-size:13px; transition:all .2s; }
.btn-view:hover { border-color:var(--primary-color); color:var(--primary-color); }
.btn-download { background:var(--success-color); color:#fff; border-color:var(--success-color); }
.btn-download:hover { filter:brightness(1.03); }
.btn-print { background:var(--info-color); color:#fff; border-color:var(--info-color); }
.btn-print:hover { filter:brightness(1.03); }

.pagination { display:flex; justify-content:center; align-items:center; gap:12px; margin-top:14px; flex-wrap:wrap; }
.page-btn { padding:10px 14px; border:1px solid var(--border-color); background:#fff; border-radius:10px; cursor:pointer; transition:all .2s; }
.page-btn:hover { border-color:var(--primary-color); color:var(--primary-color); }
.page-info { color:var(--text-secondary); font-size:13px; }

/* dialogs */
.dialog-overlay{position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000;}
.dialog{background:#fff; width:92%; max-width:1100px; max-height:90vh; overflow:auto; border-radius:14px; box-shadow:0 18px 60px rgba(0,0,0,0.2);}
.dialog-header{display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid var(--border-color);}
.dialog-body{padding:16px;}
.dialog-footer{display:flex; justify-content:flex-end; gap:10px; padding:16px; border-top:1px solid var(--border-color);}
.close-btn{background:none; border:none; font-size:24px; cursor:pointer;}
.btn-cancel{padding:10px 14px; border:1px solid var(--border-color); background:#fff; border-radius:10px; cursor:pointer;}

/* issue editor */
.issue-grid{display:grid; grid-template-columns: 420px 1fr; gap:16px; align-items:start;}
.form{background:linear-gradient(180deg,#ffffff 0%, #fbfbff 100%); border:1px solid var(--border-color); border-radius:14px; padding:14px;}
.form-group{margin-bottom:12px;}
.form-row{display:grid; grid-template-columns:1fr 1fr; gap:12px;}
.form-input{width:100%; padding:10px 12px; border:1px solid var(--border-color); border-radius:10px; font-size:14px;}
.tip{margin-top:6px; font-size:12px; color:var(--text-secondary);}
.form-actions{display:flex; justify-content:flex-end; margin-top:10px;}
.recipient-row{display:flex; gap:10px; align-items:center;}
.recipient-type{max-width:110px;}
.stamp-row{display:flex; gap:10px; align-items:center; flex-wrap:wrap;}
.stamp-hint{font-size:12px; color:var(--text-secondary);}

/* certificate preview */
.preview-wrap{background:#fff; border:1px solid var(--border-color); border-radius:14px; padding:14px;}
.preview-scale{display:flex; justify-content:center;}
.certificate-sheet{width:860px; aspect-ratio:1123/794; background:#fff; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,0.12); overflow:hidden;}
.sheet-inner{position:relative; height:100%; padding:28px; background:linear-gradient(180deg,#fffdf6 0%, #ffffff 35%, #fffdf6 100%);}
.sheet-inner:before{content:''; position:absolute; inset:18px; border:3px solid #c7a45d; border-radius:14px;}
.sheet-inner:after{content:'SurgiLearn'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:86px; letter-spacing:6px; color:rgba(199,164,93,0.10); transform:rotate(-12deg); font-weight:800; pointer-events:none;}
.sheet-title{position:relative; text-align:center; font-size:44px; letter-spacing:16px; margin-top:18px; color:#2c3e50; font-weight:800;}
.sheet-body{position:relative; margin-top:44px; padding:0 50px; font-size:18px; line-height:1.9; color:#2c3e50;}
.sheet-body .name,.sheet-body .date,.sheet-body .course{font-weight:800;}
.sheet-body .line2{display:inline-block; margin-left:5em;}
.custom-text{white-space:pre-wrap; margin-top:12px; padding:10px 12px; background:rgba(99,102,241,0.06); border:1px dashed rgba(99,102,241,0.35); border-radius:12px;}
.sheet-footer{position:absolute; left:70px; right:70px; bottom:70px; display:flex; justify-content:flex-end; color:#2c3e50; font-weight:600;}
.footer-left{display:flex; flex-direction:column; align-items:flex-end; gap:8px; text-align:right;}
.stamp{position:absolute; right:110px; bottom:90px; width:150px; opacity:0.9; filter: drop-shadow(0 8px 10px rgba(0,0,0,0.15));}
.border-corner{position:absolute; width:34px; height:34px; border:3px solid #c7a45d;}
.border-corner.tl{left:18px; top:18px; border-right:none; border-bottom:none; border-radius:14px 0 0 0;}
.border-corner.tr{right:18px; top:18px; border-left:none; border-bottom:none; border-radius:0 14px 0 0;}
.border-corner.bl{left:18px; bottom:18px; border-right:none; border-top:none; border-radius:0 0 0 14px;}
.border-corner.br{right:18px; bottom:18px; border-left:none; border-top:none; border-radius:0 0 14px 0;}
.preview-tip{margin-top:10px; font-size:12px; color:var(--text-secondary); text-align:center;}

/* recipient picker */
.recipient-toolbar{display:flex; gap:10px; align-items:center;}
.recipient-list{margin-top:12px; border:1px solid var(--border-color); border-radius:12px; overflow:hidden;}
.recipient-item{width:100%; text-align:left; background:#fff; border:0; border-bottom:1px solid var(--border-color); padding:12px 14px; cursor:pointer;}
.recipient-item:hover{background:rgba(99,102,241,0.06);}
.recipient-item:last-child{border-bottom:none;}
.r-name{font-weight:800; color:var(--text-primary); margin-bottom:4px;}
.r-meta{display:flex; flex-wrap:wrap; gap:10px; font-size:12px; color:var(--text-secondary);}
.empty{padding:16px; text-align:center; color:var(--text-secondary);}
.pagination.mini{margin-top:12px;}

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .filter-bar { flex-direction: column; }
  .certificate-item { flex-direction: column; }
  .certificate-actions { width: 100%; }
  .issue-grid{grid-template-columns:1fr;}
  .form-row{grid-template-columns:1fr;}
  .recipient-row{flex-direction:column; align-items:stretch;}
  .recipient-type{max-width:100%;}
  .certificate-sheet{width:100%;}
}
</style>

