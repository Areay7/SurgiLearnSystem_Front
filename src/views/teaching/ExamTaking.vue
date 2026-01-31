<template>
  <div class="exam-taking-page">
    <div class="exam-header">
      <div class="exam-info">
        <h2 class="exam-title">{{ examInfo.examName || '考试中' }}</h2>
        <div class="exam-meta">
          <span>考试时长：{{ examInfo.duration || 0 }} 分钟</span>
          <span>总分：{{ examInfo.totalScore || 0 }} 分</span>
          <span>及格分：{{ examInfo.passScore || 0 }} 分</span>
        </div>
      </div>
      <div class="timer-section">
        <div class="timer" :class="{ 'timer-warning': remainingTime < 300, 'timer-danger': remainingTime < 60 }">
          <div class="timer-label">剩余时间</div>
          <div class="timer-value">{{ formatTime(remainingTime) }}</div>
        </div>
      </div>
    </div>
    
    <div class="exam-content">
      <div class="question-panel">
        <div class="question-header">
          <div class="question-number">
            第 {{ currentQuestionIndex + 1 }} 题 / 共 {{ questions.length }} 题
          </div>
          <div class="question-type-badge" :class="getQuestionTypeClass(currentQuestion?.questionType)">
            {{ getQuestionTypeName(currentQuestion?.questionType) }}
          </div>
        </div>
        
        <div class="question-body" v-if="currentQuestion">
          <div class="question-content">
            {{ currentQuestion.questionContent }}
          </div>
          
          <!-- 单选题 -->
          <div v-if="currentQuestion.questionType === '单选'" class="answer-options">
            <label 
              v-for="opt in getAvailableOptions(currentQuestion)" 
              :key="opt.value"
              class="option-item"
              :class="{ 'selected': userAnswers[currentQuestion.id!] === opt.value }"
            >
              <input
                type="radio"
                :name="`question-${currentQuestion.id}`"
                :value="opt.value"
                v-model="userAnswers[currentQuestion.id!]"
                @change="saveAnswer"
              />
              <span class="option-label">{{ opt.value }}.</span>
              <span class="option-text">{{ opt.text }}</span>
            </label>
          </div>
          
          <!-- 多选题 -->
          <div v-if="currentQuestion.questionType === '多选'" class="answer-options">
            <label 
              v-for="opt in getAvailableOptions(currentQuestion)" 
              :key="opt.value"
              class="option-item"
              :class="{ 'selected': isMultiSelected(currentQuestion.id!, opt.value) }"
            >
              <input
                type="checkbox"
                :value="opt.value"
                v-model="multiSelectAnswers[currentQuestion.id!]"
                @change="updateMultiAnswer(currentQuestion.id!)"
              />
              <span class="option-label">{{ opt.value }}.</span>
              <span class="option-text">{{ opt.text }}</span>
            </label>
          </div>
          
          <!-- 判断题 -->
          <div v-if="currentQuestion.questionType === '判断'" class="answer-options">
            <label 
              class="option-item"
              :class="{ 'selected': userAnswers[currentQuestion.id!] === '正确' }"
            >
              <input
                type="radio"
                :name="`question-${currentQuestion.id}`"
                value="正确"
                v-model="userAnswers[currentQuestion.id!]"
                @change="saveAnswer"
              />
              <span class="option-label">A.</span>
              <span class="option-text">{{ currentQuestion.optionA }}</span>
            </label>
            <label 
              class="option-item"
              :class="{ 'selected': userAnswers[currentQuestion.id!] === '错误' }"
            >
              <input
                type="radio"
                :name="`question-${currentQuestion.id}`"
                value="错误"
                v-model="userAnswers[currentQuestion.id!]"
                @change="saveAnswer"
              />
              <span class="option-label">B.</span>
              <span class="option-text">{{ currentQuestion.optionB }}</span>
            </label>
          </div>
        </div>
        
        <div class="question-footer">
          <button class="btn-nav" @click="prevQuestion" :disabled="currentQuestionIndex === 0">上一题</button>
          <button class="btn-nav" @click="nextQuestion" :disabled="currentQuestionIndex === questions.length - 1">下一题</button>
        </div>
      </div>
      
      <div class="sidebar">
        <div class="question-nav">
          <div class="nav-header">题目导航</div>
          <div class="nav-grid">
            <button
              v-for="(q, index) in questions"
              :key="q.id"
              class="nav-item"
              :class="{
                'current': index === currentQuestionIndex,
                'answered': hasAnswer(q.id!),
                'marked': markedQuestions.includes(q.id!)
              }"
              @click="goToQuestion(index)"
            >
              {{ index + 1 }}
            </button>
          </div>
        </div>
        
        <div class="answer-summary">
          <div class="summary-item">
            <span>已答题：</span>
            <strong>{{ answeredCount }} / {{ questions.length }}</strong>
          </div>
          <div class="summary-item">
            <span>未答题：</span>
            <strong>{{ questions.length - answeredCount }}</strong>
          </div>
        </div>
        
        <div class="exam-actions">
          <button class="btn-save" @click="saveAnswer">保存答案</button>
          <button class="btn-submit" @click="confirmSubmit">提交试卷</button>
        </div>
      </div>
    </div>
    
    <!-- 提交确认对话框 -->
    <div v-if="showSubmitDialog" class="dialog-overlay" @click="showSubmitDialog = false">
      <div class="dialog submit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>确认提交</h3>
        </div>
        <div class="dialog-body">
          <p>确定要提交试卷吗？提交后将无法继续答题。</p>
          <div class="submit-summary">
            <div>已答题：{{ answeredCount }} / {{ questions.length }}</div>
            <div>未答题：{{ questions.length - answeredCount }}</div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showSubmitDialog = false">取消</button>
          <button class="btn-confirm" @click="submitExam">确认提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Exam } from '@/api/exam'
import { getExamDetail, getExamList } from '@/api/exam'
import type { QuestionBank } from '@/api/questionBank'
import { getQuestionBankDetail } from '@/api/questionBank'
import type { ExamResult } from '@/api/examResult'
import { getExamResultByExamAndStudent, saveAnswer as saveAnswerApi, startExam as startExamApi, submitExam as submitExamApi } from '@/api/examResult'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const examId = ref<number>(Number(route.params.id))
const examInfo = ref<Exam>({})
const questions = ref<QuestionBank[]>([])
const currentQuestionIndex = ref(0)
const userAnswers = reactive<Record<number, string>>({})
const multiSelectAnswers = reactive<Record<number, string[]>>({})
const markedQuestions = ref<number[]>([])
const examResult = ref<ExamResult | null>(null)
const remainingTime = ref(0) // 剩余时间（秒）
const timerInterval = ref<number | null>(null)
const showSubmitDialog = ref(false)
const saving = ref(false)

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value]
})

const answeredCount = computed(() => {
  return questions.value.filter(q => hasAnswer(q.id!)).length
})

// 加载考试信息
const loadExamInfo = async () => {
  try {
    const response = await getExamDetail(examId.value)
    console.log('加载考试信息响应:', response)
    
    if (response.code === 200 || response.code === 0) {
      if (response.data) {
        examInfo.value = response.data
        console.log('考试信息:', examInfo.value)
        
        // 检查是否有题目
        if (!examInfo.value.questionIds || examInfo.value.questionIds.trim() === '') {
          alert('该考试还没有选择题目')
          router.back()
          return
        }
        
        await loadQuestions()
        await initExamResult()
      } else {
        alert('加载考试信息失败：数据为空')
        router.back()
      }
    } else {
      alert('加载考试信息失败：' + (response.msg || '未知错误'))
      router.back()
    }
  } catch (error: any) {
    console.error('加载考试信息错误:', error)
    alert('加载考试信息失败：' + error.message)
    router.back()
  }
}

// 加载题目
const loadQuestions = async () => {
  if (!examInfo.value.questionIds) {
    alert('该考试没有题目')
    router.back()
    return
  }
  
  try {
    let questionIds: number[] = []
    try {
      questionIds = JSON.parse(examInfo.value.questionIds)
    } catch {
      questionIds = examInfo.value.questionIds.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id))
    }
    
    if (questionIds.length === 0) {
      alert('该考试没有题目')
      router.back()
      return
    }
    
    // 批量加载题目详情
    const questionPromises = questionIds.map(id => getQuestionBankDetail(id))
    const responses = await Promise.all(questionPromises)
    
    const loadedQuestions: QuestionBank[] = []
    responses.forEach((res, index) => {
      if (res.code === 200 || res.code === 0) {
        if (res.data) {
          loadedQuestions.push(res.data)
        }
      } else {
        console.warn(`加载题目 ${questionIds[index]} 失败:`, res.msg)
      }
    })
    
    // 按照原始顺序排序
    const questionMap = new Map(loadedQuestions.map(q => [q.id, q]))
    questions.value = questionIds.map(id => questionMap.get(id)).filter(q => q !== undefined) as QuestionBank[]
    // 初始化多选题的选项数组，确保 v-model 绑定正常
    questions.value.forEach(q => {
      if (q?.questionType === '多选' && q.id != null && !(q.id in multiSelectAnswers)) {
        multiSelectAnswers[q.id] = []
      }
    })
    
    if (questions.value.length === 0) {
      alert('无法加载题目')
      router.back()
    }
  } catch (error: any) {
    console.error('加载题目错误:', error)
    alert('加载题目失败：' + error.message)
    router.back()
  }
}

// 初始化考试结果
const initExamResult = async () => {
  if (!authStore.userPhone) {
    alert('请先登录')
    router.push('/login')
    return
  }
  
  console.log('开始初始化考试结果，考试ID:', examId.value, '学员ID:', authStore.userPhone)
  
  try {
    // 检查是否已有考试记录
    const existingResponse = await getExamResultByExamAndStudent(examId.value, authStore.userPhone)
    console.log('获取考试结果响应:', existingResponse)
    
    if (existingResponse.code === 200 || existingResponse.code === 0) {
      // 检查数据是否存在且有ID
      if (existingResponse.data && existingResponse.data.id) {
        examResult.value = existingResponse.data
        console.log('找到已有考试记录:', examResult.value)
        
        // 如果已完成，跳转到结果页面
        if (examResult.value.status === '已完成') {
          alert('您已经完成该考试')
          router.back()
          return
        }
        
        // 加载已有答案
        loadExistingAnswers()
        
        // 计算剩余时间
        if (examResult.value.startTime && examInfo.value.duration) {
          try {
            const startTimeStr = examResult.value.startTime
            const startTime = new Date(startTimeStr).getTime()
            const now = Date.now()
            
            if (isNaN(startTime)) {
              throw new Error('开始时间格式错误: ' + startTimeStr)
            }
            
            const elapsed = Math.floor((now - startTime) / 1000) // 已用秒数
            const totalSeconds = (examInfo.value.duration || 0) * 60
            remainingTime.value = Math.max(0, totalSeconds - elapsed)
            
            console.log('恢复考试记录:')
            console.log('  - 开始时间:', startTimeStr, '(', new Date(startTime).toISOString(), ')')
            console.log('  - 当前时间:', new Date(now).toISOString())
            console.log('  - 已用时间:', elapsed, '秒')
            console.log('  - 总时长:', totalSeconds, '秒')
            console.log('  - 剩余时间:', remainingTime.value, '秒')
          } catch (error: any) {
            console.error('计算剩余时间错误:', error)
            // 如果计算失败，使用完整时长
            remainingTime.value = (examInfo.value.duration || 0) * 60
            console.log('计算失败，使用完整时长:', remainingTime.value, '秒')
          }
        } else {
          // 如果没有开始时间，使用完整时长
          remainingTime.value = (examInfo.value.duration || 0) * 60
          console.log('没有开始时间，使用完整时长:', remainingTime.value, '秒')
        }
      } else {
        // 没有找到记录，创建新的考试记录
        console.log('未找到考试记录，创建新记录')
        await createExamResult()
      }
    } else {
      // API返回错误，创建新的考试记录
      console.log('获取考试结果失败，创建新记录，错误:', existingResponse.msg)
      await createExamResult()
    }
    
    // 启动计时器
    if (remainingTime.value > 0) {
      console.log('启动计时器，剩余时间:', remainingTime.value, '秒')
      startTimer()
    } else {
      console.error('剩余时间为0或负数，无法开始考试')
      alert('考试时间已到或无效')
      router.back()
    }
  } catch (error: any) {
    console.error('初始化考试结果错误:', error)
    alert('初始化考试失败：' + (error.message || '未知错误'))
    router.back()
  }
}

// 创建考试记录
const createExamResult = async () => {
  try {
    const duration = examInfo.value.duration || 0
    if (duration <= 0) {
      throw new Error('考试时长无效，无法开始考试')
    }
    
    const examResultData: ExamResult = {
      examId: examId.value,
      examName: examInfo.value.examName,
      studentId: authStore.userPhone,
      studentName: authStore.nickname || authStore.userPhone,
      totalScore: examInfo.value.totalScore || 0,
      passScore: examInfo.value.passScore || 0,
      status: '进行中',
      answers: '{}'
    }
    
    console.log('创建考试记录:', examResultData)
    const response = await startExamApi(examResultData)
    console.log('创建考试记录响应:', response)
    
    if (response.code === 200 || response.code === 0) {
      if (response.data) {
        examResult.value = response.data as ExamResult
        console.log('考试记录创建成功:', examResult.value)
        
        // 设置剩余时间为完整考试时长
        remainingTime.value = duration * 60
        console.log('考试时长:', duration, '分钟，剩余时间:', remainingTime.value, '秒')
        
        // 确保剩余时间大于0
        if (remainingTime.value <= 0) {
          throw new Error('考试时长无效，无法开始考试')
        }
      } else {
        throw new Error('创建考试记录失败：返回数据为空')
      }
    } else {
      throw new Error(response.msg || '创建考试记录失败')
    }
  } catch (error: any) {
    console.error('创建考试记录错误:', error)
    throw error
  }
}

// 加载已有答案
const loadExistingAnswers = () => {
  if (!examResult.value?.answers) return
  
  try {
    const answers = JSON.parse(examResult.value.answers)
    Object.keys(answers).forEach(key => {
      const questionId = Number(key)
      const answer = answers[key]
      const question = questions.value.find(q => q.id === questionId)
      
      if (question?.questionType === '多选') {
        if (typeof answer === 'string') {
          multiSelectAnswers[questionId] = answer.split(',').map(a => a.trim())
          userAnswers[questionId] = answer
        } else if (Array.isArray(answer)) {
          multiSelectAnswers[questionId] = answer
          userAnswers[questionId] = answer.join(',')
        }
      } else {
        userAnswers[questionId] = String(answer)
      }
    })
  } catch (error) {
    console.error('加载答案错误:', error)
  }
}

// 启动计时器
const startTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  console.log('启动计时器，剩余时间:', remainingTime.value, '秒')
  
  timerInterval.value = window.setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      // 时间到，自动提交
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
      alert('考试时间已到，系统将自动提交试卷')
      submitExam()
    }
  }, 1000)
}

// 格式化时间
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 获取可用选项
const getAvailableOptions = (question: QuestionBank) => {
  const options = []
  if (question.optionA) options.push({ value: 'A', text: question.optionA })
  if (question.optionB) options.push({ value: 'B', text: question.optionB })
  if (question.optionC) options.push({ value: 'C', text: question.optionC })
  if (question.optionD) options.push({ value: 'D', text: question.optionD })
  return options
}

// 更新多选题答案
const updateMultiAnswer = (questionId: number) => {
  const selected = multiSelectAnswers[questionId] || []
  userAnswers[questionId] = selected.sort().join(',')
  saveAnswer()
}

// 检查是否已选择（多选题）
const isMultiSelected = (questionId: number, value: string) => {
  return multiSelectAnswers[questionId]?.includes(value) || false
}

// 检查是否有答案（单选/判断：userAnswers；多选：multiSelectAnswers 或 userAnswers）
const hasAnswer = (questionId: number) => {
  const question = questions.value.find(q => q.id === questionId)
  if (question?.questionType === '多选') {
    const multi = multiSelectAnswers[questionId]
    if (multi && multi.length > 0) return true
    const single = userAnswers[questionId]
    return single != null && String(single).trim() !== ''
  }
  return userAnswers[questionId] != null && String(userAnswers[questionId]).trim() !== ''
}

// 保存答案
const saveAnswer = async () => {
  if (!examResult.value) return
  
  saving.value = true
  try {
    const answersJson = JSON.stringify(userAnswers)
    const response = await saveAnswerApi({
      id: examResult.value.id,
      answers: answersJson
    })
    
    if (response.code === 200 || response.code === 0) {
      // 保存成功，可选提示
      const btn = document.querySelector('.btn-save') as HTMLButtonElement
      if (btn) {
        const orig = btn.textContent
        btn.textContent = '已保存'
        setTimeout(() => { btn.textContent = orig }, 1500)
      }
    }
  } catch (error: any) {
    console.error('保存答案错误:', error)
    alert('保存失败：' + (error?.message || '请重试'))
  } finally {
    saving.value = false
  }
}

// 上一题
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

// 跳转到指定题目
const goToQuestion = (index: number) => {
  currentQuestionIndex.value = index
}

// 确认提交
const confirmSubmit = () => {
  showSubmitDialog.value = true
}

// 提交考试
const submitExam = async () => {
  if (!examResult.value) return
  
  saving.value = true
  try {
    const answersJson = JSON.stringify(userAnswers)
    const response = await submitExamApi({
      id: examResult.value.id,
      answers: answersJson
    })
    
    if (response.code === 200 || response.code === 0) {
      showSubmitDialog.value = false
      const result = response.data as ExamResult
      const name = result?.studentName || authStore.nickname || authStore.userPhone || '学员'
      const score = result?.obtainedScore ?? 0
      const total = result?.totalScore ?? examInfo.value.totalScore ?? 0
      const passScore = result?.passScore ?? examInfo.value.passScore ?? 0
      const passed = score >= passScore
      const msg = `${name}，本次的考试成绩为 ${score} 分${total > 0 ? `（满分 ${total} 分）` : ''}，${passed ? '及格' : '未及格'}。`
      alert(msg)
      router.push('/exam')
    } else {
      alert('提交失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    console.error('提交考试错误:', error)
    alert('提交失败：' + error.message)
  } finally {
    saving.value = false
    showSubmitDialog.value = false
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
  if (questionType === '单选') return 'single'
  if (questionType === '多选') return 'multiple'
  if (questionType === '判断') return 'judge'
  return ''
}

onMounted(() => {
  console.log('ExamTaking页面加载，考试ID:', examId.value)
  if (!examId.value || isNaN(examId.value)) {
    alert('无效的考试ID')
    router.back()
    return
  }
  loadExamInfo()
})

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})
</script>

<style scoped>
.exam-taking-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.exam-header {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.exam-title {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: var(--text-primary);
}

.exam-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: var(--text-secondary);
}

.timer-section {
  display: flex;
  align-items: center;
}

.timer {
  text-align: center;
  padding: 16px 24px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 2px solid #1890ff;
}

.timer-warning {
  background: #fff7e6;
  border-color: #fa8c16;
}

.timer-danger {
  background: #fff1f0;
  border-color: #f5222d;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.timer-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.timer-value {
  font-size: 28px;
  font-weight: 700;
  color: #1890ff;
}

.timer-warning .timer-value {
  color: #fa8c16;
}

.timer-danger .timer-value {
  color: #f5222d;
}

.exam-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.question-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.question-number {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.question-type-badge {
  padding: 6px 12px;
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

.question-content {
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: 24px;
  font-weight: 500;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.option-item:hover {
  border-color: var(--primary-color);
  background: #f0f9ff;
}

.option-item.selected {
  border-color: var(--primary-color);
  background: #e6f7ff;
}

.option-item input[type="radio"],
.option-item input[type="checkbox"] {
  margin-right: 12px;
  margin-top: 2px;
  cursor: pointer;
}

.option-label {
  font-weight: 600;
  color: var(--primary-color);
  margin-right: 8px;
  min-width: 20px;
}

.option-text {
  flex: 1;
  color: var(--text-regular);
  line-height: 1.5;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.btn-nav {
  padding: 10px 24px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-nav:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-nav {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nav-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.nav-item {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-item:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.nav-item.current {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.nav-item.answered {
  background: #f6ffed;
  border-color: #52c41a;
  color: #52c41a;
}

.nav-item.marked {
  background: #fff7e6;
  border-color: #fa8c16;
}

.answer-summary {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-regular);
}

.summary-item strong {
  color: var(--text-primary);
}

.exam-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-save {
  padding: 12px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-save:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-submit {
  padding: 12px;
  border: none;
  background: var(--primary-color);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-submit:hover {
  background: #66b1ff;
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
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-body {
  padding: 20px;
}

.submit-summary {
  margin-top: 16px;
  padding: 12px;
  background: #f7f9fc;
  border-radius: 6px;
}

.submit-summary div {
  margin: 4px 0;
  font-size: 14px;
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

.btn-cancel:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
}

.btn-confirm:hover {
  background: #66b1ff;
}

@media (max-width: 1024px) {
  .exam-content {
    grid-template-columns: 1fr;
  }
  
  .exam-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
