<template>
  <div class="question-bank-page">
    <div class="page-header">
      <h1 class="page-title">在线题库</h1>
      <div class="header-actions">
        <button class="btn-primary" @click="openAddDialog">新增试题</button>
        <button class="btn-action" @click="handleDeleteSelected" v-if="selectedIds.length > 0">删除选中</button>
      </div>
    </div>
    
    <div class="question-bank-content">
      <!-- 搜索表单 -->
      <div class="search-form">
        <div class="form-row">
          <div class="form-item">
            <label>搜索关键字：</label>
            <input 
              type="text" 
              placeholder="请输入题目内容或分类" 
              class="form-input" 
              v-model="searchForm.searchText" 
            />
          </div>
          <div class="form-item">
            <label>题目类型：</label>
            <select class="form-input" v-model="searchForm.questionType">
              <option value="">全部题型</option>
              <option value="单选">单选题</option>
              <option value="多选">多选题</option>
              <option value="判断">判断题</option>
            </select>
          </div>
          <div class="form-item">
            <label>分类：</label>
            <input 
              type="text" 
              placeholder="请输入分类" 
              class="form-input" 
              v-model="searchForm.category" 
            />
          </div>
          <div class="form-item">
            <label>难度：</label>
            <select class="form-input" v-model="searchForm.difficulty">
              <option value="">全部难度</option>
              <option value="基础">基础</option>
              <option value="提高">提高</option>
              <option value="挑战">挑战</option>
            </select>
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
                  :checked="selectedIds.length === questions.length && questions.length > 0"
                />
              </th>
              <th width="60">序号</th>
              <th width="180">操作</th>
              <th width="100">ID</th>
              <th width="300">题目内容</th>
              <th width="100">题型</th>
              <th width="100">分类</th>
              <th width="100">难度</th>
              <th width="80">分值</th>
              <th width="180">创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="questions.length === 0">
              <td colspan="10" class="empty-state">
                <p>暂无数据</p>
              </td>
            </tr>
            <tr v-for="(row, index) in questions" :key="row.id || index" class="table-row">
              <td>
                <input type="checkbox" :value="row.id" v-model="selectedIds" />
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>
                <button class="btn-link" @click="openPreviewDialog(row)">预览</button>
                <button class="btn-link" @click="openEditDialog(row)">编辑</button>
                <button class="btn-link btn-danger" @click="handleDeleteSingle(row)">删除</button>
              </td>
              <td>{{ row.questionId || row.id || '-' }}</td>
              <td class="question-content">{{ row.questionContent || '-' }}</td>
              <td>
                <span :class="getQuestionTypeClass(row.questionType)">
                  {{ getQuestionTypeName(row.questionType) }}
                </span>
              </td>
              <td>{{ row.category || '-' }}</td>
              <td>
                <span class="difficulty-badge" :class="getDifficultyClass(row.difficulty)">
                  {{ row.difficulty || '-' }}
                </span>
              </td>
              <td>{{ row.score || 0 }}</td>
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
          <h3>{{ dialogMode === 'add' ? '新增试题' : '编辑试题' }}</h3>
          <button class="close-btn" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="edit-form">
            <div class="form-group">
              <label>题目类型 *</label>
              <select class="form-input" v-model="editForm.questionType" :disabled="saving" @change="onQuestionTypeChange">
                <option value="">请选择</option>
                <option value="单选">单选题</option>
                <option value="多选">多选题</option>
                <option value="判断">判断题</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>题目内容 *</label>
              <textarea
                class="form-input form-textarea"
                placeholder="请输入题目内容"
                v-model="editForm.questionContent"
                maxlength="1000"
                :disabled="saving"
                rows="3"
              ></textarea>
            </div>
            
            <!-- 选项 -->
            <div class="options-section" v-if="editForm.questionType">
              <div class="form-group" v-if="editForm.questionType !== '判断'">
                <label>选项A *</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入选项A"
                  v-model="editForm.optionA"
                  maxlength="500"
                  :disabled="saving"
                />
              </div>
              <div class="form-group" v-if="editForm.questionType !== '判断'">
                <label>选项B *</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入选项B"
                  v-model="editForm.optionB"
                  maxlength="500"
                  :disabled="saving"
                />
              </div>
              <div class="form-group" v-if="editForm.questionType !== '判断'">
                <label>选项C</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入选项C（可选）"
                  v-model="editForm.optionC"
                  maxlength="500"
                  :disabled="saving"
                />
              </div>
              <div class="form-group" v-if="editForm.questionType !== '判断'">
                <label>选项D</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入选项D（可选）"
                  v-model="editForm.optionD"
                  maxlength="500"
                  :disabled="saving"
                />
              </div>
              
              <!-- 判断题选项 -->
              <div class="form-group" v-if="editForm.questionType === '判断'">
                <label>选项A（正确）*</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入选项A（通常为'正确'）"
                  v-model="editForm.optionA"
                  maxlength="500"
                  :disabled="saving"
                />
              </div>
              <div class="form-group" v-if="editForm.questionType === '判断'">
                <label>选项B（错误）*</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入选项B（通常为'错误'）"
                  v-model="editForm.optionB"
                  maxlength="500"
                  :disabled="saving"
                />
              </div>
            </div>
            
            <!-- 正确答案 -->
            <div class="form-group">
              <label>正确答案 *</label>
              <!-- 单选题 -->
              <div v-if="editForm.questionType === '单选'" class="answer-options">
                <label class="radio-label" v-for="opt in getAvailableOptions()" :key="opt.value">
                  <input
                    type="radio"
                    :value="opt.value"
                    v-model="editForm.correctAnswer"
                    :disabled="saving"
                  />
                  <span>{{ opt.label }}</span>
                </label>
              </div>
              <!-- 多选题 -->
              <div v-if="editForm.questionType === '多选'" class="answer-options">
                <label class="checkbox-label" v-for="opt in getAvailableOptions()" :key="opt.value">
                  <input
                    type="checkbox"
                    :value="opt.value"
                    v-model="multiSelectAnswer"
                    :disabled="saving"
                    @change="updateMultiSelectAnswer"
                  />
                  <span>{{ opt.label }}</span>
                </label>
              </div>
              <!-- 判断题 -->
              <div v-if="editForm.questionType === '判断'" class="answer-options">
                <label class="radio-label">
                  <input
                    type="radio"
                    value="正确"
                    v-model="editForm.correctAnswer"
                    :disabled="saving"
                  />
                  <span>正确</span>
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    value="错误"
                    v-model="editForm.correctAnswer"
                    :disabled="saving"
                  />
                  <span>错误</span>
                </label>
              </div>
              <div v-if="!editForm.questionType" class="form-hint">请先选择题目类型</div>
            </div>
            
            <div class="form-group">
              <label>解析</label>
              <textarea
                class="form-input form-textarea"
                placeholder="请输入题目解析（可选）"
                v-model="editForm.explanation"
                maxlength="1000"
                :disabled="saving"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>分类</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入分类"
                  v-model="editForm.category"
                  maxlength="100"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>难度</label>
                <select class="form-input" v-model="editForm.difficulty" :disabled="saving">
                  <option value="">请选择</option>
                  <option value="基础">基础</option>
                  <option value="提高">提高</option>
                  <option value="挑战">挑战</option>
                </select>
              </div>
              <div class="form-group">
                <label>分值</label>
                <input
                  type="number"
                  class="form-input"
                  placeholder="请输入分值"
                  v-model.number="editForm.score"
                  min="0"
                  :disabled="saving"
                />
              </div>
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
    
    <!-- 预览对话框 -->
    <div v-if="showPreviewDialog" class="dialog-overlay" @click="showPreviewDialog = false">
      <div class="dialog preview-dialog" @click.stop>
        <div class="dialog-header">
          <h3>题目预览</h3>
          <button class="close-btn" @click="showPreviewDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="preview-content" v-if="previewQuestion">
            <div class="preview-item">
              <strong>题目类型：</strong>{{ getQuestionTypeName(previewQuestion.questionType) }}
            </div>
            <div class="preview-item">
              <strong>题目内容：</strong>{{ previewQuestion.questionContent }}
            </div>
            <div class="preview-item" v-if="previewQuestion.questionType !== '判断'">
              <strong>选项：</strong>
              <div class="options-list">
                <div v-if="previewQuestion.optionA">A. {{ previewQuestion.optionA }}</div>
                <div v-if="previewQuestion.optionB">B. {{ previewQuestion.optionB }}</div>
                <div v-if="previewQuestion.optionC">C. {{ previewQuestion.optionC }}</div>
                <div v-if="previewQuestion.optionD">D. {{ previewQuestion.optionD }}</div>
              </div>
            </div>
            <div class="preview-item" v-if="previewQuestion.questionType === '判断'">
              <strong>选项：</strong>
              <div class="options-list">
                <div>A. {{ previewQuestion.optionA }}</div>
                <div>B. {{ previewQuestion.optionB }}</div>
              </div>
            </div>
            <div class="preview-item">
              <strong>正确答案：</strong>{{ previewQuestion.correctAnswer }}
            </div>
            <div class="preview-item" v-if="previewQuestion.explanation">
              <strong>解析：</strong>{{ previewQuestion.explanation }}
            </div>
            <div class="preview-item">
              <strong>分类：</strong>{{ previewQuestion.category || '-' }}
            </div>
            <div class="preview-item">
              <strong>难度：</strong>{{ previewQuestion.difficulty || '-' }}
            </div>
            <div class="preview-item">
              <strong>分值：</strong>{{ previewQuestion.score || 0 }}
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
import type { QuestionBank } from '@/api/questionBank'
import { addQuestionBank, deleteQuestionBank, getQuestionBankList, updateQuestionBank } from '@/api/questionBank'

const loading = ref(false)
const saving = ref(false)

const questions = ref<QuestionBank[]>([])
const selectedIds = ref<number[]>([])

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const totalPages = computed(() => {
  const t = Math.ceil(total.value / pageSize.value)
  return t <= 0 ? 1 : t
})

const searchForm = reactive({
  searchText: '',
  questionType: '',
  category: '',
  difficulty: ''
})

const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editForm = reactive<QuestionBank>({
  questionContent: '',
  questionType: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: '',
  explanation: '',
  category: '',
  difficulty: '',
  score: 0
})

const multiSelectAnswer = ref<string[]>([])

const showPreviewDialog = ref(false)
const previewQuestion = ref<QuestionBank | null>(null)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const response = await getQuestionBankList({
      page: currentPage.value,
      limit: pageSize.value,
      searchText: searchForm.searchText || undefined,
      questionType: searchForm.questionType || undefined,
      category: searchForm.category || undefined,
      difficulty: searchForm.difficulty || undefined
    })
    
    if (response.code === 0 || response.code === 200) {
      questions.value = response.data || []
      total.value = response.count || 0
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

// 查询
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.searchText = ''
  searchForm.questionType = ''
  searchForm.category = ''
  searchForm.difficulty = ''
  currentPage.value = 1
  loadData()
}

// 全选
const handleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = questions.value.map(q => q.id!).filter(id => id !== undefined)
  } else {
    selectedIds.value = []
  }
}

// 打开新增对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  Object.assign(editForm, {
    id: undefined,
    questionContent: '',
    questionType: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    explanation: '',
    category: '',
    difficulty: '',
    score: 0
  })
  multiSelectAnswer.value = []
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (row: QuestionBank) => {
  dialogMode.value = 'edit'
  Object.assign(editForm, {
    ...row
  })
  
  // 处理多选题答案
  if (row.questionType === '多选' && row.correctAnswer) {
    multiSelectAnswer.value = row.correctAnswer.split(',').map(s => s.trim())
  } else {
    multiSelectAnswer.value = []
  }
  
  showDialog.value = true
}

// 打开预览对话框
const openPreviewDialog = (row: QuestionBank) => {
  previewQuestion.value = { ...row }
  showPreviewDialog.value = true
}

// 题目类型变化
const onQuestionTypeChange = () => {
  editForm.correctAnswer = ''
  multiSelectAnswer.value = []
  
  // 判断题默认选项
  if (editForm.questionType === '判断') {
    if (!editForm.optionA) editForm.optionA = '正确'
    if (!editForm.optionB) editForm.optionB = '错误'
  }
}

// 获取可用选项
const getAvailableOptions = () => {
  const options = []
  if (editForm.optionA) options.push({ value: 'A', label: 'A' })
  if (editForm.optionB) options.push({ value: 'B', label: 'B' })
  if (editForm.optionC) options.push({ value: 'C', label: 'C' })
  if (editForm.optionD) options.push({ value: 'D', label: 'D' })
  return options
}

// 更新多选题答案
const updateMultiSelectAnswer = () => {
  editForm.correctAnswer = multiSelectAnswer.value.sort().join(',')
}

// 保存
const handleSave = async () => {
  if (!editForm.questionContent?.trim()) {
    alert('请输入题目内容')
    return
  }
  if (!editForm.questionType) {
    alert('请选择题目类型')
    return
  }
  if (!editForm.correctAnswer) {
    alert('请选择正确答案')
    return
  }
  
  // 验证选项
  if (editForm.questionType !== '判断') {
    if (!editForm.optionA?.trim() || !editForm.optionB?.trim()) {
      alert('至少需要填写选项A和选项B')
      return
    }
  } else {
    if (!editForm.optionA?.trim() || !editForm.optionB?.trim()) {
      alert('判断题需要填写选项A和选项B')
      return
    }
  }
  
  saving.value = true
  try {
    const data = { ...editForm }
    
    // 处理多选题答案
    if (data.questionType === '多选' && multiSelectAnswer.value.length > 0) {
      data.correctAnswer = multiSelectAnswer.value.sort().join(',')
    }
    
    let response
    if (dialogMode.value === 'add') {
      response = await addQuestionBank(data)
    } else {
      response = await updateQuestionBank(data)
    }
    
    if (response.code === 200 || response.code === 0) {
      alert(dialogMode.value === 'add' ? '新增成功' : '更新成功')
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
const handleDeleteSingle = (row: QuestionBank) => {
  if (!row.id) return
  if (confirm(`确定要删除题目 "${row.questionContent?.substring(0, 20)}..." 吗？`)) {
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
    const response = await deleteQuestionBank(ids.join(','))
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

// 获取题目类型名称
const getQuestionTypeName = (questionType?: string) => {
  if (questionType === '单选') return '单选题'
  if (questionType === '多选') return '多选题'
  if (questionType === '判断') return '判断题'
  return questionType || '-'
}

// 获取题目类型样式类
const getQuestionTypeClass = (questionType?: string) => {
  if (questionType === '单选') return 'question-type-badge single'
  if (questionType === '多选') return 'question-type-badge multiple'
  if (questionType === '判断') return 'question-type-badge judge'
  return ''
}

// 获取难度样式类
const getDifficultyClass = (difficulty?: string) => {
  if (difficulty === '基础') return 'easy'
  if (difficulty === '提高') return 'medium'
  if (difficulty === '挑战') return 'hard'
  return ''
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.question-bank-page {
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

.form-textarea {
  resize: vertical;
  min-height: 80px;
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

.question-content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.question-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.question-type-badge.single {
  background: #e6f7ff;
  color: #1890ff;
}

.question-type-badge.multiple {
  background: #f6ffed;
  color: #52c41a;
}

.question-type-badge.judge {
  background: #fff7e6;
  color: #fa8c16;
}

.difficulty-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-badge.easy {
  background: rgba(103, 194, 58, 0.1);
  color: #3f9c1f;
  border: 1px solid rgba(103, 194, 58, 0.35);
}

.difficulty-badge.medium {
  background: rgba(230, 162, 60, 0.12);
  color: #b36a00;
  border: 1px solid rgba(230, 162, 60, 0.35);
}

.difficulty-badge.hard {
  background: rgba(245, 108, 108, 0.12);
  color: #d64545;
  border: 1px solid rgba(245, 108, 108, 0.35);
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

.preview-dialog {
  max-width: 700px;
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
}

.options-section {
  background: #f7f9fc;
  padding: 16px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.answer-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

.radio-label, .checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.radio-label input[type="radio"],
.checkbox-label input[type="checkbox"] {
  cursor: pointer;
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
  
  .dialog {
    width: 95%;
    max-height: 95vh;
  }
}
</style>
