<template>
  <div class="exam-page">
    <div class="page-header">
      <h1 class="page-title">考试系统</h1>
      <div class="header-actions">
        <button class="btn-primary" @click="openAddDialog">创建考试</button>
        <button class="btn-action" @click="handleDeleteSelected" v-if="selectedIds.length > 0">删除选中</button>
      </div>
    </div>
    
    <!-- 统计信息 -->
    <div class="stats">
      <div class="stat card">
        <div class="k">今日考试场次</div>
        <div class="v">{{ stats.todayCount }}</div>
      </div>
      <div class="stat card">
        <div class="k">进行中</div>
        <div class="v">{{ stats.ongoingCount }}</div>
      </div>
      <div class="stat card">
        <div class="k">待阅卷</div>
        <div class="v">{{ stats.pendingCount }}</div>
      </div>
      <div class="stat card">
        <div class="k">合格率</div>
        <div class="v">{{ stats.passRate }}%</div>
      </div>
    </div>
    
    <div class="exam-content">
      <!-- 搜索表单 -->
      <div class="search-form">
        <div class="form-row">
          <div class="form-item">
            <label>搜索关键字：</label>
            <input 
              type="text" 
              placeholder="请输入考试名称或类型" 
              class="form-input" 
              v-model="searchForm.searchText" 
            />
          </div>
          <div class="form-item">
            <label>考试类型：</label>
            <input 
              type="text" 
              placeholder="请输入考试类型" 
              class="form-input" 
              v-model="searchForm.examType" 
            />
          </div>
          <div class="form-item">
            <label>状态：</label>
            <select class="form-input" v-model="searchForm.status">
              <option value="">全部状态</option>
              <option value="未开始">未开始</option>
              <option value="进行中">进行中</option>
              <option value="已结束">已结束</option>
              <option value="待阅卷">待阅卷</option>
            </select>
          </div>
          <div class="form-item">
            <label>考试日期：</label>
            <input 
              type="date" 
              class="form-input" 
              v-model="searchForm.examDate" 
            />
          </div>
          <div class="form-actions">
            <button class="btn-query" @click="handleSearch" :disabled="loading">查询</button>
            <button class="btn-reset" @click="handleReset" :disabled="loading">重置</button>
          </div>
        </div>
      </div>
      
      <!-- 表格展示 -->
      <div class="table-container" v-if="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th width="50">
                <input 
                  type="checkbox" 
                  @change="handleSelectAll"
                  :checked="selectedIds.length === exams.length && exams.length > 0"
                />
              </th>
              <th width="60">序号</th>
              <th width="200">操作</th>
              <th width="100">ID</th>
              <th width="250">考试名称</th>
              <th width="120">考试类型</th>
              <th width="180">考试时间</th>
              <th width="100">时长(分钟)</th>
              <th width="80">总分</th>
              <th width="80">及格分</th>
              <th width="80">题量</th>
              <th width="100">状态</th>
              <th width="180">创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="exams.length === 0">
              <td colspan="13" class="empty-state">
                <p>暂无数据</p>
              </td>
            </tr>
            <tr v-for="(row, index) in exams" :key="row.id || index" class="table-row">
              <td>
                <input type="checkbox" :value="row.id" v-model="selectedIds" />
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>
                <button class="btn-link" @click="openEditDialog(row)">编辑</button>
                <button class="btn-link" @click="openSelectQuestionsDialog(row)">选择题目</button>
                <button class="btn-link" @click="startExam(row)" v-if="row.status === '进行中' || row.status === '未开始'">开始考试</button>
                <button class="btn-link btn-danger" @click="handleDeleteSingle(row)">删除</button>
              </td>
              <td>{{ row.examId || row.id || '-' }}</td>
              <td class="exam-name">{{ row.examName || '-' }}</td>
              <td>{{ row.examType || '-' }}</td>
              <td>
                <div>{{ formatDate(row.examDate) }}</div>
                <div class="time-info">{{ row.startTime || '' }} - {{ row.endTime || '' }}</div>
              </td>
              <td>{{ row.duration || 0 }}</td>
              <td>{{ row.totalScore || 0 }}</td>
              <td>{{ row.passScore || 0 }}</td>
              <td>{{ getQuestionCount(row.questionIds) }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(row.status)">
                  {{ row.status || '未开始' }}
                </span>
              </td>
              <td>{{ formatDateTime(row.createTime) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="loading-state">
        <p>加载中...</p>
      </div>
      
      <div class="pagination">
        <button class="page-btn" @click="prevPage" :disabled="currentPage === 1 || loading">上一页</button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页（共 {{ total }} 条）</span>
        <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages || loading">下一页</button>
      </div>
    </div>
    
    <!-- 新增/编辑对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="showDialog = false">
      <div class="dialog edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '创建考试' : '编辑考试' }}</h3>
          <button class="close-btn" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="edit-form">
            <div class="form-group">
              <label>考试名称 *</label>
              <input
                type="text"
                class="form-input"
                placeholder="请输入考试名称"
                v-model="editForm.examName"
                maxlength="200"
                :disabled="saving"
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>考试类型</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入考试类型"
                  v-model="editForm.examType"
                  maxlength="100"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>考试日期 *</label>
                <input
                  type="date"
                  class="form-input"
                  v-model="examDateStr"
                  :disabled="saving"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>开始时间</label>
                <input
                  type="time"
                  class="form-input"
                  v-model="editForm.startTime"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>结束时间</label>
                <input
                  type="time"
                  class="form-input"
                  v-model="editForm.endTime"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>时长(分钟) *</label>
                <input
                  type="number"
                  class="form-input"
                  placeholder="请输入时长"
                  v-model.number="editForm.duration"
                  min="1"
                  :disabled="saving"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>总分 *</label>
                <input
                  type="number"
                  class="form-input"
                  placeholder="请输入总分"
                  v-model.number="editForm.totalScore"
                  min="1"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>及格分 *</label>
                <input
                  type="number"
                  class="form-input"
                  placeholder="请输入及格分"
                  v-model.number="editForm.passScore"
                  min="0"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>状态</label>
                <select class="form-input" v-model="editForm.status" :disabled="saving">
                  <option value="未开始">未开始</option>
                  <option value="进行中">进行中</option>
                  <option value="已结束">已结束</option>
                  <option value="待阅卷">待阅卷</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>已选题目数量：{{ getQuestionCount(editForm.questionIds) }}</label>
              <div class="form-hint">点击"选择题目"按钮从题库中选择题目</div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showDialog = false" :disabled="saving">取消</button>
          <button class="btn-confirm" @click="handleSave" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 选择题目对话框 -->
    <div v-if="showSelectQuestionsDialog" class="dialog-overlay" @click="showSelectQuestionsDialog = false">
      <div class="dialog select-questions-dialog" @click.stop>
        <div class="dialog-header">
          <h3>选择题目</h3>
          <button class="close-btn" @click="showSelectQuestionsDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="question-selector">
            <div class="selector-filters">
              <div class="form-item">
                <label>搜索：</label>
                <input 
                  type="text" 
                  placeholder="搜索题目内容" 
                  class="form-input" 
                  v-model="questionSearchForm.searchText" 
                />
              </div>
              <div class="form-item">
                <label>类型：</label>
                <select class="form-input" v-model="questionSearchForm.questionType">
                  <option value="">全部</option>
                  <option value="单选">单选题</option>
                  <option value="多选">多选题</option>
                  <option value="判断">判断题</option>
                </select>
              </div>
              <div class="form-item">
                <label>分类：</label>
                <input 
                  type="text" 
                  placeholder="分类" 
                  class="form-input" 
                  v-model="questionSearchForm.category" 
                />
              </div>
              <button class="btn-query" @click="loadQuestions" :disabled="loadingQuestions">查询</button>
            </div>
            
            <div class="questions-list-header">
              <div class="list-actions">
                <button class="btn-small" @click="selectAllQuestions" v-if="availableQuestions.length > 0">全选</button>
                <button class="btn-small" @click="clearSelection">清空</button>
                <span class="selection-info">已选择 {{ selectedQuestionIds.length }} / {{ availableQuestions.length }}</span>
              </div>
            </div>
            
            <div class="questions-list" v-if="!loadingQuestions">
              <div class="question-item" v-for="q in availableQuestions" :key="q.id">
                <label class="question-checkbox">
                  <input
                    type="checkbox"
                    :value="q.id"
                    v-model="selectedQuestionIds"
                    @change="updateSelectedQuestions"
                  />
                  <div class="question-content">
                    <div class="question-header">
                      <span class="question-type">{{ getQuestionTypeName(q.questionType) }}</span>
                      <span class="question-score">分值：{{ q.score || 0 }}</span>
                      <span class="question-category" v-if="q.category">{{ q.category }}</span>
                      <button class="btn-preview" @click.stop="previewQuestion(q)">预览</button>
                    </div>
                    <div class="question-text">{{ q.questionContent }}</div>
                    <div class="question-options" v-if="q.questionType === '单选' || q.questionType === '多选'">
                      <span v-if="q.optionA">A. {{ q.optionA }}</span>
                      <span v-if="q.optionB">B. {{ q.optionB }}</span>
                      <span v-if="q.optionC">C. {{ q.optionC }}</span>
                      <span v-if="q.optionD">D. {{ q.optionD }}</span>
                    </div>
                  </div>
                </label>
              </div>
              <div v-if="availableQuestions.length === 0" class="empty-state">
                <p>暂无题目</p>
              </div>
            </div>
            <div v-else class="loading-state">
              <p>加载中...</p>
            </div>
            
            <div class="selected-summary">
              <strong>已选择 {{ selectedQuestionIds.length }} 道题目</strong>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showSelectQuestionsDialog = false" :disabled="saving">取消</button>
          <button class="btn-confirm" @click="confirmSelectQuestions" :disabled="selectedQuestionIds.length === 0 || saving">
            {{ saving ? '保存中...' : '确认选择' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 题目预览对话框 -->
    <div v-if="showPreviewDialog" class="dialog-overlay" @click="showPreviewDialog = false">
      <div class="dialog preview-dialog" @click.stop>
        <div class="dialog-header">
          <h3>题目预览</h3>
          <button class="close-btn" @click="showPreviewDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="preview-content" v-if="previewQuestionData">
            <div class="preview-item">
              <strong>题目类型：</strong>{{ getQuestionTypeName(previewQuestionData.questionType) }}
            </div>
            <div class="preview-item">
              <strong>题目内容：</strong>{{ previewQuestionData.questionContent }}
            </div>
            <div class="preview-item" v-if="previewQuestionData.questionType !== '判断'">
              <strong>选项：</strong>
              <div class="options-list">
                <div v-if="previewQuestionData.optionA">A. {{ previewQuestionData.optionA }}</div>
                <div v-if="previewQuestionData.optionB">B. {{ previewQuestionData.optionB }}</div>
                <div v-if="previewQuestionData.optionC">C. {{ previewQuestionData.optionC }}</div>
                <div v-if="previewQuestionData.optionD">D. {{ previewQuestionData.optionD }}</div>
              </div>
            </div>
            <div class="preview-item" v-if="previewQuestionData.questionType === '判断'">
              <strong>选项：</strong>
              <div class="options-list">
                <div>A. {{ previewQuestionData.optionA }}</div>
                <div>B. {{ previewQuestionData.optionB }}</div>
              </div>
            </div>
            <div class="preview-item">
              <strong>正确答案：</strong>{{ previewQuestionData.correctAnswer }}
            </div>
            <div class="preview-item" v-if="previewQuestionData.explanation">
              <strong>解析：</strong>{{ previewQuestionData.explanation }}
            </div>
            <div class="preview-item">
              <strong>分类：</strong>{{ previewQuestionData.category || '-' }}
            </div>
            <div class="preview-item">
              <strong>难度：</strong>{{ previewQuestionData.difficulty || '-' }}
            </div>
            <div class="preview-item">
              <strong>分值：</strong>{{ previewQuestionData.score || 0 }}
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showPreviewDialog = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Exam } from '@/api/exam'
import { addExam, deleteExam, getExamList, updateExam } from '@/api/exam'
import type { QuestionBank } from '@/api/questionBank'
import { getQuestionBankList } from '@/api/questionBank'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const loadingQuestions = ref(false)
const showPreviewDialog = ref(false)
const previewQuestionData = ref<QuestionBank | null>(null)

const exams = ref<Exam[]>([])
const selectedIds = ref<number[]>([])

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const totalPages = computed(() => {
  const t = Math.ceil(total.value / pageSize.value)
  return t <= 0 ? 1 : t
})

const stats = reactive({
  todayCount: 0,
  ongoingCount: 0,
  pendingCount: 0,
  passRate: 0
})

const searchForm = reactive({
  searchText: '',
  examType: '',
  status: '',
  examDate: ''
})

const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editForm = reactive<Exam>({
  examName: '',
  examType: '',
  examDate: undefined,
  startTime: '',
  endTime: '',
  duration: 0,
  totalScore: 0,
  passScore: 0,
  questionIds: '',
  status: '未开始'
})

const examDateStr = ref('')

const showSelectQuestionsDialog = ref(false)
const availableQuestions = ref<QuestionBank[]>([])
const selectedQuestionIds = ref<number[]>([])
const questionSearchForm = reactive({
  searchText: '',
  questionType: '',
  category: ''
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const response = await getExamList({
      page: currentPage.value,
      limit: pageSize.value,
      searchText: searchForm.searchText || undefined,
      examType: searchForm.examType || undefined,
      status: searchForm.status || undefined,
      examDate: searchForm.examDate || undefined
    })
    
    if (response.code === 0 || response.code === 200) {
      exams.value = response.data || []
      total.value = response.count || 0
      updateStats()
    } else {
      console.error('加载数据失败:', response.msg)
      alert(response.msg || '加载数据失败')
    }
  } catch (error: any) {
    console.error('加载数据错误:', error)
    alert(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

// 更新统计信息
const updateStats = () => {
  const today = new Date().toISOString().split('T')[0]
  stats.todayCount = exams.value.filter(e => {
    const examDate = e.examDate ? new Date(e.examDate).toISOString().split('T')[0] : ''
    return examDate === today
  }).length
  
  stats.ongoingCount = exams.value.filter(e => e.status === '进行中').length
  stats.pendingCount = exams.value.filter(e => e.status === '待阅卷').length
  
  // 计算合格率（这里简化处理，实际应该从考试结果中计算）
  stats.passRate = 86 // 示例值
}

// 查询
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.searchText = ''
  searchForm.examType = ''
  searchForm.status = ''
  searchForm.examDate = ''
  currentPage.value = 1
  loadData()
}

// 全选
const handleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = exams.value.map(e => e.id!).filter(id => id !== undefined)
  } else {
    selectedIds.value = []
  }
}

// 打开新增对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  Object.assign(editForm, {
    id: undefined,
    examName: '',
    examType: '',
    examDate: undefined,
    startTime: '',
    endTime: '',
    duration: 0,
    totalScore: 0,
    passScore: 0,
    questionIds: '',
    status: '未开始'
  })
  examDateStr.value = ''
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (row: Exam) => {
  dialogMode.value = 'edit'
  Object.assign(editForm, { ...row })
  examDateStr.value = row.examDate ? new Date(row.examDate).toISOString().split('T')[0] : ''
  showDialog.value = true
}

// 打开选择题目对话框
const openSelectQuestionsDialog = (row: Exam) => {
  if (!row.id) {
    alert('请先保存考试信息')
    return
  }
  
  // 保存当前考试信息到editForm，以便后续更新
  Object.assign(editForm, { ...row })
  examDateStr.value = row.examDate ? new Date(row.examDate).toISOString().split('T')[0] : ''
  
  selectedQuestionIds.value = []
  if (row.questionIds) {
    try {
      // 尝试解析为JSON数组
      const ids = JSON.parse(row.questionIds)
      if (Array.isArray(ids)) {
        selectedQuestionIds.value = ids.map(id => Number(id))
      } else {
        // 如果不是数组，尝试按逗号分隔
        selectedQuestionIds.value = row.questionIds.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id))
      }
    } catch {
      // 如果解析失败，按逗号分隔
      selectedQuestionIds.value = row.questionIds.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id))
    }
  }
  loadQuestions()
  showSelectQuestionsDialog.value = true
}

// 加载题目列表
const loadQuestions = async () => {
  loadingQuestions.value = true
  try {
    const response = await getQuestionBankList({
      page: 1,
      limit: 1000, // 加载所有题目
      searchText: questionSearchForm.searchText || undefined,
      questionType: questionSearchForm.questionType || undefined,
      category: questionSearchForm.category || undefined
    })
    
    if (response.code === 0 || response.code === 200) {
      availableQuestions.value = response.data || []
    } else {
      console.error('加载题目失败:', response.msg)
    }
  } catch (error: any) {
    console.error('加载题目错误:', error)
  } finally {
    loadingQuestions.value = false
  }
}

// 更新选中的题目
const updateSelectedQuestions = () => {
  // 这个方法在checkbox change时自动调用，selectedQuestionIds已经更新
}

// 全选题目
const selectAllQuestions = () => {
  selectedQuestionIds.value = availableQuestions.value.map(q => q.id!).filter(id => id !== undefined)
}

// 清空选择
const clearSelection = () => {
  selectedQuestionIds.value = []
}

// 预览题目
const previewQuestion = (question: QuestionBank) => {
  previewQuestionData.value = question
  showPreviewDialog.value = true
}

// 开始考试
const startExam = (exam: Exam) => {
  if (!exam.id) {
    alert('考试ID不存在')
    return
  }
  if (!exam.questionIds || exam.questionIds.trim() === '') {
    alert('该考试还没有选择题目，请先选择题目')
    return
  }
  // 跳转到考试答题页面
  router.push(`/exam-taking/${exam.id}`)
}

// 确认选择题目
const confirmSelectQuestions = async () => {
  if (selectedQuestionIds.value.length === 0) {
    alert('请至少选择一道题目')
    return
  }
  
  if (!editForm.id) {
    alert('考试ID不存在，请先保存考试信息')
    showSelectQuestionsDialog.value = false
    return
  }
  
  saving.value = true
  try {
    // 将选中的题目ID保存为JSON数组格式
    const questionIdsJson = JSON.stringify(selectedQuestionIds.value)
    
    // 立即更新到数据库
    const data = {
      id: editForm.id,
      questionIds: questionIdsJson
    }
    
    const response = await updateExam(data)
    
    if (response.code === 200 || response.code === 0) {
      alert('题目选择成功')
      editForm.questionIds = questionIdsJson
      showSelectQuestionsDialog.value = false
      // 刷新列表数据
      loadData()
    } else {
      alert('保存失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    console.error('保存题目选择错误:', error)
    alert('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}

// 保存
const handleSave = async () => {
  if (!editForm.examName?.trim()) {
    alert('请输入考试名称')
    return
  }
  if (!examDateStr.value) {
    alert('请选择考试日期')
    return
  }
  if (!editForm.duration || editForm.duration <= 0) {
    alert('请输入有效的考试时长')
    return
  }
  if (!editForm.totalScore || editForm.totalScore <= 0) {
    alert('请输入有效的总分')
    return
  }
  if (editForm.passScore === undefined || editForm.passScore < 0) {
    alert('请输入有效的及格分')
    return
  }
  if (editForm.passScore > editForm.totalScore) {
    alert('及格分不能大于总分')
    return
  }
  
  saving.value = true
  try {
    const data = { ...editForm }
    // 设置考试日期（只发送日期部分，格式：yyyy-MM-dd）
    if (examDateStr.value) {
      data.examDate = examDateStr.value
    }
    
    let response
    if (dialogMode.value === 'add') {
      response = await addExam(data)
    } else {
      response = await updateExam(data)
    }
    
    if (response.code === 200 || response.code === 0) {
      alert(dialogMode.value === 'add' ? '创建成功' : '更新成功')
      showDialog.value = false
      loadData()
    } else {
      alert(response.msg || '操作失败')
    }
  } catch (error: any) {
    console.error('保存错误:', error)
    alert(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 删除单个
const handleDeleteSingle = (row: Exam) => {
  if (!row.id) return
  if (confirm(`确定要删除考试 "${row.examName}" 吗？`)) {
    handleDelete([row.id])
  }
}

// 删除选中
const handleDeleteSelected = () => {
  if (selectedIds.value.length === 0) {
    alert('请选择要删除的记录')
    return
  }
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`)) {
    handleDelete(selectedIds.value)
  }
}

// 执行删除
const handleDelete = async (ids: number[]) => {
  loading.value = true
  try {
    const response = await deleteExam(ids.join(','))
    if (response.code === 200 || response.code === 0) {
      alert('删除成功')
      selectedIds.value = []
      loadData()
    } else {
      alert(response.msg || '删除失败')
    }
  } catch (error: any) {
    console.error('删除错误:', error)
    alert(error.message || '删除失败')
  } finally {
    loading.value = false
  }
}

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadData()
  }
}

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadData()
  }
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  } catch {
    return dateStr
  }
}

// 格式化日期时间
const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-')
  } catch {
    return dateStr
  }
}

// 获取题目数量
const getQuestionCount = (questionIds?: string) => {
  if (!questionIds) return 0
  try {
    const ids = JSON.parse(questionIds)
    return Array.isArray(ids) ? ids.length : 0
  } catch {
    // 如果不是JSON，尝试按逗号分隔
    return questionIds.split(',').filter(id => id.trim()).length
  }
}

// 获取状态样式类
const getStatusClass = (status?: string) => {
  if (status === '进行中') return 'ongoing'
  if (status === '待阅卷') return 'pending'
  if (status === '已结束') return 'ended'
  return 'not-started'
}

// 获取题目类型名称
const getQuestionTypeName = (questionType?: string) => {
  if (questionType === '单选') return '单选题'
  if (questionType === '多选') return '多选题'
  if (questionType === '判断') return '判断题'
  return questionType || '-'
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.exam-page {
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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

.btn-action {
  padding: 10px 20px;
  background: white;
  color: var(--text-regular);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-action:hover {
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat .k {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

.stat .v {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-color);
}

.search-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
  flex: 1;
}

.form-item label {
  font-size: 14px;
  color: var(--text-secondary);
}

.form-input {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.form-input:disabled {
  background: #f5f7fa;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.btn-query, .btn-reset {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-query {
  background: var(--primary-color);
  color: white;
}

.btn-query:hover {
  background: #66b1ff;
}

.btn-reset {
  background: white;
  color: var(--text-regular);
  border: 1px solid var(--border-color);
}

.btn-reset:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f5f7fa;
}

.data-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
  white-space: nowrap;
}

.data-table td {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  color: var(--text-regular);
  font-size: 14px;
}

.exam-name {
  font-weight: 600;
  color: var(--text-primary);
}

.time-info {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.not-started {
  background: #f5f7fa;
  color: var(--text-secondary);
}

.status-badge.ongoing {
  background: rgba(230, 162, 60, 0.12);
  color: #b36a00;
  border: 1px solid rgba(230, 162, 60, 0.35);
}

.status-badge.pending {
  background: rgba(64, 158, 255, 0.12);
  color: #1d7fd7;
  border: 1px solid rgba(64, 158, 255, 0.35);
}

.status-badge.ended {
  background: #f5f7fa;
  color: var(--text-secondary);
}

.btn-link {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
  transition: all 0.3s;
}

.btn-link:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-link.btn-danger:hover {
  border-color: var(--danger-color);
  color: var(--danger-color);
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

.page-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.select-questions-dialog {
  max-width: 1000px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-primary);
}

.dialog-body {
  padding: 20px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-hint {
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 4px;
}

.question-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.questions-list-header {
  padding: 12px;
  background: #f7f9fc;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-small {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.btn-small:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.selection-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.btn-preview {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.btn-preview:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.question-category {
  padding: 2px 8px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
}

.question-options {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.preview-dialog {
  max-width: 700px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-item {
  padding: 12px;
  background: #f7f9fc;
  border-radius: 6px;
}

.preview-item strong {
  color: var(--text-primary);
  margin-right: 8px;
}

.options-list {
  margin-top: 8px;
  padding-left: 16px;
}

.options-list div {
  margin: 4px 0;
  color: var(--text-regular);
}

.selector-filters {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.questions-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
}

.question-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #f7f9fc;
  border-radius: 6px;
}

.question-checkbox {
  display: flex;
  gap: 12px;
  cursor: pointer;
  align-items: flex-start;
}

.question-checkbox input[type="checkbox"] {
  margin-top: 4px;
  cursor: pointer;
}

.question-content {
  flex: 1;
}

.question-header {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.question-type {
  padding: 2px 8px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
}

.question-score {
  font-size: 12px;
  color: var(--text-secondary);
}

.question-text {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
}

.selected-summary {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  text-align: center;
  color: var(--primary-color);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel, .btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-cancel {
  background: white;
  color: var(--text-regular);
  border: 1px solid var(--border-color);
}

.btn-cancel:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-cancel:disabled, .btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .stats {
    grid-template-columns: 1fr;
  }
  
  .dialog {
    width: 95%;
    max-height: 95vh;
  }
}
</style>
