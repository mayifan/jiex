<template>
  <div class="app-container">
    <!-- 背景纹理 -->
    <div class="bg-texture"></div>

    <!-- 头部 -->
    <header class="app-header">
      <h1 class="app-title">
        <span class="title-icon">◆</span>
        结项单生成器
        <span class="title-badge">JIEX</span>
      </h1>
      <p class="app-subtitle">Excel → Word 智能转换工具</p>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 左侧：文件上传区 -->
      <section class="panel panel-upload" :class="{ 'has-files': fileList.length > 0 }">
        <div class="panel-header">
          <h2 class="panel-title">
            <span class="panel-icon">📁</span>
            文件上传
          </h2>
          <span class="file-count" v-if="fileList.length > 0">
            {{ fileList.length }} 个文件
          </span>
        </div>

        <div class="upload-zone">
          <el-upload
            class="custom-upload"
            drag
            multiple
            :auto-upload="false"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
          >
            <div class="upload-content">
              <div class="upload-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p class="upload-text">拖拽 Excel 文件到此处</p>
              <p class="upload-hint">或点击选择文件 (.xlsx, .xls)</p>
            </div>
          </el-upload>
        </div>

        <!-- 统计信息 -->
        <div class="stats-grid" v-if="fileList.length > 0">
          <div class="stat-card">
            <span class="stat-value">{{ fileList.length }}</span>
            <span class="stat-label">项目数</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ totalProjectAmount }}</span>
            <span class="stat-label">总金额 (元)</span>
          </div>
          <div class="stat-card" :class="{ 'stat-success': allocatedParticipantCount >= 2 }">
            <span class="stat-value">{{ allocatedParticipantCount }}</span>
            <span class="stat-label">参与人数</span>
          </div>
        </div>

        <!-- 空状态提示 -->
        <div class="empty-state" v-else>
          <p>上传 Excel 文件以开始</p>
        </div>
      </section>

      <!-- 右侧：配置区 -->
      <section class="panel panel-config" :class="{ 'panel-disabled': fileList.length === 0 }">
        <!-- Text4 配置 -->
        <div class="config-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">📝</span>
              模板内容
            </h3>
          </div>
          <div class="section-body">
            <el-input
              v-model="text4Content"
              type="textarea"
              :rows="2"
              placeholder="输入 Text4 内容..."
              :disabled="fileList.length === 0"
            />
          </div>
        </div>

        <!-- 参与者管理 -->
        <div class="config-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">👥</span>
              参与者管理
            </h3>
          </div>
          <div class="section-body">
            <!-- 第一参与者选择 -->
            <div class="first-participant">
              <label class="field-label">第1参与者（金额从Excel C17或C18读取）</label>
              <el-select
                v-model="selectedFirstParticipant"
                placeholder="选择第1参与者"
                :disabled="fileList.length === 0"
                @change="initAllocationForm"
              >
                <el-option
                  v-for="p in participants"
                  :key="p.code"
                  :label="`${p.name} (${p.code})`"
                  :value="p.code"
                />
              </el-select>
            </div>

            <!-- 添加新参与者 -->
            <div class="add-participant-form">
              <el-input
                v-model="newParticipant.name"
                placeholder="姓名"
                :disabled="fileList.length === 0"
              />
              <el-input
                v-model="newParticipant.code"
                placeholder="工号"
                :disabled="fileList.length === 0"
              />
              <el-button
                type="primary"
                @click="addParticipant"
                :disabled="fileList.length === 0"
              >
                添加
              </el-button>
            </div>

            <!-- 参与者标签列表 -->
            <div class="participant-tags">
              <el-tag
                v-for="p in participants"
                :key="p.code"
                :type="p.code === selectedFirstParticipant ? 'warning' : 'info'"
                :closable="participants.length > 2 && p.code !== selectedFirstParticipant"
                @close="removeParticipant(p.code)"
              >
                {{ p.name }}
                <span class="tag-code">{{ p.code }}</span>
                <span v-if="p.code === selectedFirstParticipant" class="tag-badge">主</span>
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 金额分配 -->
        <div class="config-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">💰</span>
              次要参与者分配
            </h3>
            <span class="section-hint" v-if="fileList.length > 0">
              每个项目需要至少2个不同的次要参与者
            </span>
          </div>
          <div class="section-body">
            <el-alert
              v-if="willHaveDuplicates"
              title="需要至少2个不同的次要参与者分配到项目"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 16px;"
            />

            <el-alert
              v-if="hasAmountExceedError"
              title="次要参与者金额总和超过了某些项目的总金额"
              type="error"
              :closable="false"
              show-icon
              style="margin-bottom: 16px;"
            />

            <div class="allocation-grid">
              <div
                class="allocation-item"
                v-for="participant in otherParticipants"
                :key="participant.code"
              >
                <label class="allocation-label">{{ participant.name }}</label>
                <div class="allocation-input">
                  <el-input-number
                    v-model="allocationForm[participant.code]"
                    :min="0"
                    :max="fileList.length * 2"
                    :step="1"
                    :precision="0"
                    :disabled="fileList.length === 0"
                    @change="calculateTotal"
                    controls-position="right"
                  />
                  <span class="allocation-unit">次</span>
                </div>
                <div class="allocation-amount-input">
                  <el-input-number
                    v-model="amountForm[participant.code]"
                    :min="0"
                    :step="50"
                    :precision="0"
                    :disabled="fileList.length === 0 || !allocationForm[participant.code]"
                    controls-position="right"
                    placeholder="金额"
                  />
                  <span class="allocation-unit">元/次</span>
                </div>
              </div>
            </div>

            <!-- 分配预览 -->
            <div class="allocation-preview" v-if="fileList.length > 0 && allocatedParticipantCount >= 2">
              <div class="preview-header">分配预览</div>
              <div class="preview-item" v-for="(file, index) in fileList" :key="file.uid">
                <span class="preview-name">项目 {{ index + 1 }}</span>
                <span class="preview-total">总额: {{ projectAmounts[file.uid] || 0 }}元</span>
                <span class="preview-secondary">次要: {{ getSecondaryTotalForProject(index) }}元</span>
                <span class="preview-primary" :class="{ 'preview-warning': getPrimaryAmountForProject(index) < 0 }">
                  主要: {{ getPrimaryAmountForProject(index) }}元
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar">
          <el-button
            size="large"
            @click="resetAll"
            :disabled="fileList.length === 0"
          >
            重置
          </el-button>
          <el-button
            type="primary"
            size="large"
            @click="confirmAllocation"
            :disabled="!isAllocationValid"
            :loading="isGenerating"
          >
            <span v-if="!isGenerating">生成文档</span>
            <span v-else>生成中...</span>
          </el-button>
        </div>
      </section>
    </main>

    <!-- 底部 -->
    <footer class="app-footer">
      <p>每个项目金额从Excel C17读取（如无值则读取C18），每个项目至少有2个不同的次要参与者，主要参与者金额=项目总额-次要参与者金额之和</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import JSZip from 'jszip'

// 生成状态
const isGenerating = ref(false)

// 文件列表
const fileList = ref([])

// 项目金额（从Excel C17读取）
const projectAmounts = ref({})

// text4 默认内容
const text4Content = ref('目前iOS版本和 Android均已上线并完成测试验收。')

// 参与者配置
const participants = ref([
  { name: '马一帆', code: 'SFD17221' },
  { name: '刘纪甲', code: 'SDF21054' },
  { name: '丁少康', code: 'SFD16940' },
  { name: '王鹏', code: 'SFD21724' },
  { name: '盛泉铭', code: 'SFD22678' },
  { name: '刘仲', code: 'SFD16963' }
])

// 选中的第一参与者
const selectedFirstParticipant = ref('SFD17221')

// 其他参与者
const otherParticipants = computed(() => {
  return participants.value.filter(p => p.code !== selectedFirstParticipant.value)
})

// 金额分配表单（次数）
const allocationForm = ref({})

// 金额表单（每次分配的金额）
const amountForm = ref({})

// 初始化分配表单
const initAllocationForm = () => {
  const form = {}
  const amounts = {}
  otherParticipants.value.forEach(p => {
    form[p.code] = allocationForm.value[p.code] || 0
    amounts[p.code] = amountForm.value[p.code] || 100  // 默认每次100元
  })
  allocationForm.value = form
  amountForm.value = amounts
}

// 新增参与者表单
const newParticipant = ref({ name: '', code: '' })

// 添加新参与者
const addParticipant = () => {
  if (!newParticipant.value.name || !newParticipant.value.code) {
    ElMessage.error('请输入参与者姓名和工号')
    return
  }
  if (participants.value.some(p => p.code === newParticipant.value.code)) {
    ElMessage.error('该工号已存在')
    return
  }
  participants.value.push({ ...newParticipant.value })
  newParticipant.value = { name: '', code: '' }
  initAllocationForm()
  ElMessage.success('参与者添加成功')
}

// 删除参与者
const removeParticipant = (code) => {
  if (participants.value.length <= 2) {
    ElMessage.error('至少需要保留2个参与者')
    return
  }
  if (code === selectedFirstParticipant.value) {
    ElMessage.error('不能删除当前的第一参与者')
    return
  }
  participants.value = participants.value.filter(p => p.code !== code)
  delete allocationForm.value[code]
  ElMessage.success('已删除')
}

// 总项目金额（从所有Excel C17汇总）
const totalProjectAmount = computed(() => {
  return Object.values(projectAmounts.value).reduce((sum, val) => sum + (val || 0), 0)
})

// 检查分配的参与者数量
const allocatedParticipantCount = computed(() => {
  return Object.values(allocationForm.value).filter(v => v > 0).length
})

// 总分配次数
const totalAllocationCount = computed(() => {
  return Object.values(allocationForm.value).reduce((sum, val) => sum + (val || 0), 0)
})

// 检查是否会导致人员重复（每个项目需要2个次要参与者）
const willHaveDuplicates = computed(() => {
  // 需要至少2个不同的次要参与者
  return allocatedParticipantCount.value < 2
})

// 预计算每个项目的分配（用于预览和验证）
const projectAllocationPreview = computed(() => {
  if (fileList.value.length === 0 || allocatedParticipantCount.value < 2) {
    return []
  }

  const allocatedOthers = otherParticipants.value.filter(p => allocationForm.value[p.code] > 0)
  const result = []

  // 追踪每个参与者剩余可分配次数
  const remainingCounts = {}
  allocatedOthers.forEach(p => {
    remainingCounts[p.code] = allocationForm.value[p.code] || 0
  })

  for (let i = 0; i < fileList.value.length; i++) {
    const file = fileList.value[i]
    const projectAmount = projectAmounts.value[file.uid] || 0

    // 获取还有剩余次数的参与者
    const availableParticipants = allocatedOthers.filter(p => remainingCounts[p.code] > 0)

    if (availableParticipants.length >= 2) {
      // 按剩余次数排序，优先选择剩余次数多的
      const sorted = [...availableParticipants].sort((a, b) =>
        remainingCounts[b.code] - remainingCounts[a.code]
      )
      const participant2 = sorted[0]
      const participant3 = sorted[1]

      // 扣除次数
      remainingCounts[participant2.code]--
      remainingCounts[participant3.code]--

      // 计算次要参与者金额
      const amount2 = amountForm.value[participant2.code] || 0
      const amount3 = amountForm.value[participant3.code] || 0
      const secondaryTotal = amount2 + amount3
      const primaryAmount = projectAmount - secondaryTotal

      result.push({
        projectAmount,
        participant2: { ...participant2, amount: amount2 },
        participant3: { ...participant3, amount: amount3 },
        secondaryTotal,
        primaryAmount
      })
    } else {
      result.push({
        projectAmount,
        participant2: null,
        participant3: null,
        secondaryTotal: 0,
        primaryAmount: projectAmount
      })
    }
  }

  return result
})

// 获取某个项目的次要参与者总金额
const getSecondaryTotalForProject = (index) => {
  const preview = projectAllocationPreview.value[index]
  return preview ? preview.secondaryTotal : 0
}

// 获取某个项目的主要参与者金额
const getPrimaryAmountForProject = (index) => {
  const preview = projectAllocationPreview.value[index]
  return preview ? preview.primaryAmount : 0
}

// 检查是否有金额超出错误
const hasAmountExceedError = computed(() => {
  return projectAllocationPreview.value.some(p => p.primaryAmount < 0)
})

// 分配是否有效
const isAllocationValid = computed(() => {
  // 需要：有文件、至少2个不同参与者、总分配次数等于项目数*2、金额不超过项目总额
  return fileList.value.length > 0 &&
         !willHaveDuplicates.value &&
         totalAllocationCount.value === fileList.value.length * 2 &&
         !hasAmountExceedError.value
})

// 计算已分配总数
const calculateTotal = () => {
  // 不再需要计算金额，只需要触发响应式更新
}

// 处理文件上传
const handleFileChange = async (uploadFile) => {
  if (!uploadFile.raw.name.match(/\.(xlsx|xls)$/i)) {
    ElMessage.error('请上传Excel文件')
    return false
  }

  try {
    // 读取Excel文件获取C17或C18金额
    const arrayBuffer = await uploadFile.raw.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    // 先读取C17，如果没有值就读取C18
    const amountValue = worksheet['C17']?.v || worksheet['C18']?.v || 0
    const amount = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue) || 0

    // 存储文件和金额
    fileList.value.push(uploadFile)
    projectAmounts.value[uploadFile.uid] = amount

    initAllocationForm()
    ElMessage.success(`已读取项目金额: ${amount} 元`)
  } catch (error) {
    console.error('读取Excel失败:', error)
    ElMessage.error('读取Excel文件失败')
    return false
  }

  return true
}

// 处理文件移除
const handleFileRemove = (file) => {
  fileList.value = fileList.value.filter(f => f.uid !== file.uid)
  delete projectAmounts.value[file.uid]
  if (fileList.value.length === 0) {
    resetAll()
  }
}

// 重置所有
const resetAll = () => {
  fileList.value = []
  projectAmounts.value = {}
  Object.keys(allocationForm.value).forEach(key => {
    allocationForm.value[key] = 0
  })
}

// 确认分配并生成文档
const confirmAllocation = async () => {
  if (!isAllocationValid.value) {
    ElMessage.error('请确保分配正确：需要至少2个不同的次要参与者，且总分配次数等于项目数×2')
    return
  }

  isGenerating.value = true

  try {
    // 直接使用预览数据，确保与界面显示一致
    const firstParticipant = participants.value.find(p => p.code === selectedFirstParticipant.value)
    const previewData = projectAllocationPreview.value

    // 调试：打印预览数据
    console.log('previewData:', JSON.stringify(previewData))

    const projectAllocations = previewData.map(preview => {
      return [
        { ...firstParticipant, amount: preview.primaryAmount },
        preview.participant2,
        preview.participant3
      ]
    })
    const zip = new JSZip()
    const generatedFiles = []

    for (let i = 0; i < fileList.value.length; i++) {
      const file = fileList.value[i]
      const arrayBuffer = await file.raw.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]

      const text1 = worksheet['D1']?.v || ''
      const text2 = worksheet['B6']?.v || ''
      const text3 = worksheet['B4']?.v || ''

      const projectParticipants = projectAllocations[i]

      const response = await fetch('/template.docx')
      if (!response.ok) {
        throw new Error(`模板文件获取失败: ${response.status}`)
      }
      const templateArrayBuffer = await response.arrayBuffer()

      const docZip = new PizZip(templateArrayBuffer)
      const doc = new Docxtemplater(docZip, {
        paragraphLoop: true,
        linebreaks: true
      })

      doc.render({
        text1,
        text2,
        text3,
        text4: text4Content.value,
        name1: projectParticipants[0].name,
        code1: projectParticipants[0].code,
        amount1: projectParticipants[0].amount,
        name2: projectParticipants[1].name,
        code2: projectParticipants[1].code,
        amount2: projectParticipants[1].amount,
        name3: projectParticipants[2].name,
        code3: projectParticipants[2].code,
        amount3: projectParticipants[2].amount,
      })

      const content = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      const fileName = `${text3 || '未命名'}.docx`
      generatedFiles.push({ name: fileName, content })
    }

    for (const file of generatedFiles) {
      zip.file(file.name, file.content)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(zipBlob)
    downloadLink.download = '生成的文档.zip'
    downloadLink.click()
    URL.revokeObjectURL(downloadLink.href)

    ElMessage.success(`成功生成 ${generatedFiles.length} 个文档`)
    resetAll()
  } catch (error) {
    console.error('处理文件时出错：', error)
    ElMessage.error(`处理失败：${error.message}`)
  } finally {
    isGenerating.value = false
  }
}

</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap');

:root {
  --color-bg: #0a0a0f;
  --color-bg-elevated: #12121a;
  --color-bg-card: #1a1a24;
  --color-border: #2a2a3a;
  --color-border-hover: #3a3a4a;
  --color-text: #e8e8f0;
  --color-text-muted: #8888a0;
  --color-accent: #d4a853;
  --color-accent-dim: #b8923f;
  --color-success: #4ade80;
  --color-error: #f87171;
  --color-warning: #fbbf24;
  --font-display: 'Noto Serif SC', serif;
  --font-body: system-ui, -apple-system, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

/* 背景纹理 */
.bg-texture {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

/* 头部 */
.app-header {
  text-align: center;
  margin-bottom: 48px;
  animation: fadeInDown 0.6s ease-out;
}

.app-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.title-icon {
  color: var(--color-accent);
  font-size: 1.5rem;
}

.title-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dim) 100%);
  color: var(--color-bg);
  border-radius: 4px;
  letter-spacing: 0.1em;
}

.app-subtitle {
  color: var(--color-text-muted);
  font-size: 1rem;
  margin-top: 8px;
  letter-spacing: 0.05em;
}

/* 主内容区 */
.main-content {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 面板通用样式 */
.panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.panel:hover::before {
  opacity: 1;
}

.panel-upload {
  animation: fadeInLeft 0.6s ease-out;
}

.panel-config {
  animation: fadeInRight 0.6s ease-out;
}

.panel-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  font-size: 1.25rem;
}

.file-count {
  font-size: 0.875rem;
  padding: 4px 12px;
  background: var(--color-accent);
  color: var(--color-bg);
  border-radius: 20px;
  font-weight: 600;
}

/* 上传区域 */
.upload-zone {
  margin-bottom: 24px;
}

.custom-upload :deep(.el-upload) {
  width: 100%;
}

.custom-upload :deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  min-height: 180px;
  background: var(--color-bg-elevated);
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-upload :deep(.el-upload-dragger:hover) {
  border-color: var(--color-accent);
  background: rgba(212, 168, 83, 0.05);
}

.upload-content {
  text-align: center;
  padding: 24px;
}

.upload-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: var(--color-accent);
}

.upload-icon svg {
  width: 100%;
  height: 100%;
}

.upload-text {
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-2px);
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
  font-family: var(--font-display);
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-success .stat-value {
  color: var(--color-success);
}

.stat-error .stat-value {
  color: var(--color-error);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
  font-style: italic;
}

/* 配置区块 */
.config-section {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--color-border);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 1rem;
}

.section-hint {
  font-size: 0.75rem;
  color: var(--color-accent);
}

.section-body {
  padding: 20px;
}

/* 第一参与者 */
.first-participant {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.first-participant-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.first-participant :deep(.el-select) {
  width: 100%;
}

.first-amount-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.first-amount-input :deep(.el-input-number) {
  width: 120px;
}

.amount-unit {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* 添加参与者表单 */
.add-participant-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  margin-bottom: 16px;
}

/* 参与者标签 */
.participant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.participant-tags :deep(.el-tag) {
  padding: 8px 12px;
  font-size: 0.875rem;
  border-radius: 8px;
}

.tag-code {
  opacity: 0.6;
  margin-left: 4px;
  font-size: 0.75rem;
}

.tag-badge {
  margin-left: 6px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 0.625rem;
}

/* 金额分配网格 */
.allocation-grid {
  display: grid;
  gap: 16px;
}

.allocation-item {
  display: grid;
  grid-template-columns: 80px 1fr 1fr;
  align-items: center;
  gap: 12px;
}

.allocation-label {
  font-weight: 500;
  color: var(--color-text);
}

.allocation-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.allocation-input :deep(.el-input-number) {
  width: 120px;
}

.allocation-unit {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.allocation-amount {
  font-size: 0.875rem;
  color: var(--color-accent);
  min-width: 80px;
  text-align: right;
}

.allocation-amount-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.allocation-amount-input :deep(.el-input-number) {
  width: 120px;
}

/* 分配预览 */
.allocation-preview {
  margin-top: 20px;
  padding: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.preview-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.875rem;
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-name {
  font-weight: 500;
  min-width: 60px;
}

.preview-total {
  color: var(--color-text-muted);
}

.preview-secondary {
  color: var(--color-accent);
}

.preview-primary {
  color: var(--color-success);
  margin-left: auto;
}

.preview-warning {
  color: var(--color-error) !important;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.action-bar :deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dim) 100%);
  border: none;
  padding: 12px 32px;
  font-weight: 600;
}

.action-bar :deep(.el-button--primary:hover) {
  opacity: 0.9;
}

/* 底部 */
.app-footer {
  text-align: center;
  margin-top: 48px;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  border-top: 1px solid var(--color-border);
}

/* Element Plus 覆盖样式 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  background: var(--color-bg-card) !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: none !important;
  color: var(--color-text) !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover),
:deep(.el-select__wrapper:hover) {
  border-color: var(--color-border-hover) !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus),
:deep(.el-select__wrapper.is-focused) {
  border-color: var(--color-accent) !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--color-text) !important;
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: var(--color-text-muted) !important;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: var(--color-bg-elevated) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text) !important;
}

:deep(.el-tag--info) {
  background: var(--color-bg-card);
  border-color: var(--color-border);
  color: var(--color-text);
}

:deep(.el-tag--warning) {
  background: rgba(212, 168, 83, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

:deep(.el-select-dropdown) {
  background: var(--color-bg-card) !important;
  border-color: var(--color-border) !important;
}

:deep(.el-select-dropdown__item) {
  color: var(--color-text) !important;
}

:deep(.el-select-dropdown__item:hover),
:deep(.el-select-dropdown__item.is-hovering) {
  background: var(--color-bg-elevated) !important;
}

:deep(.el-select-dropdown__item.is-selected) {
  color: var(--color-accent) !important;
}

:deep(.el-upload-list__item) {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  margin-top: 8px;
}

:deep(.el-upload-list__item-name) {
  color: var(--color-text);
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .panel-upload {
    order: 1;
  }

  .panel-config {
    order: 2;
  }
}

@media (max-width: 640px) {
  .app-container {
    padding: 20px;
  }

  .app-title {
    font-size: 1.75rem;
    flex-wrap: wrap;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .add-participant-form {
    grid-template-columns: 1fr;
  }

  .allocation-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
