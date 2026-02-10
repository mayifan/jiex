<template>
  <section class="initiation-page">
    <section class="initiation-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">立项单参数</h2>
          <p class="card-desc">输入多个 Number + 项目名称，系统按固定模板批量生成立项单。</p>
        </div>
      </div>

      <section class="batch-section">
        <div class="batch-header">
          <h3 class="sub-title">批量立项清单</h3>
          <span class="batch-count">共 {{ projectRows.length }} 条</span>
        </div>

        <el-input
          v-model="batchInputText"
          type="textarea"
          :rows="6"
          placeholder="每行一条，支持格式：DOC-MP-47524-项目名称 或 47524,项目名称"
          class="batch-textarea"
        />

        <div class="batch-actions">
          <el-button @click="replaceRowsFromInput" :disabled="isGenerating || isAiGenerating">解析并覆盖清单</el-button>
          <el-button @click="appendRowsFromInput" :disabled="isGenerating || isAiGenerating">解析并追加清单</el-button>
          <el-button
            type="primary"
            plain
            :loading="isAiGenerating"
            :disabled="isGenerating || isOcrProcessing || isAiGenerating || projectRows.length === 0"
            @click="generateAllContentWithAi"
          >
            {{ isAiGenerating ? 'AI生成中...' : 'AI批量生成Content' }}
          </el-button>
          <el-upload
            class="ocr-upload"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :disabled="isGenerating || isOcrProcessing || isAiGenerating"
            :on-change="onOcrImageChange"
          >
            <el-button :loading="isOcrProcessing">{{ isOcrProcessing ? '识别中...' : '截图识别追加' }}</el-button>
          </el-upload>
          <el-button type="danger" plain @click="clearRows" :disabled="isGenerating || isAiGenerating || projectRows.length === 0">清空清单</el-button>
        </div>

        <div
          class="quick-import-zone"
          :class="{ 'zone-active': isDropZoneActive, 'zone-disabled': isGenerating || isOcrProcessing || isAiGenerating }"
          tabindex="0"
          @dragenter.prevent="onImportZoneDragEnter"
          @dragover.prevent="onImportZoneDragOver"
          @dragleave.prevent="onImportZoneDragLeave"
          @drop.prevent="onImportZoneDrop"
          @paste="onImportZonePaste"
        >
          <p class="zone-title">拖拽/粘贴快速导入</p>
          <p class="zone-text">可拖拽图片截图或文本到这里，也可先点击后 Ctrl/Cmd + V 粘贴截图/文本。</p>
        </div>

        <p class="batch-hint">截图识别支持中英混合。首次识别会下载语言包，耗时会稍长。</p>

        <el-table :data="projectRows" size="small" border empty-text="暂无立项数据，请先输入或截图识别" class="rows-table">
          <el-table-column label="Number" min-width="170">
            <template #default="scope">
              <el-input v-model="scope.row.number" @blur="normalizeRow(scope.row)" placeholder="例如 47524" />
            </template>
          </el-table-column>

          <el-table-column label="项目名称" min-width="340">
            <template #default="scope">
              <el-input v-model="scope.row.productName" @blur="normalizeRow(scope.row)" placeholder="请输入项目名称" />
            </template>
          </el-table-column>

          <el-table-column label="自动生成的 Content 预览" min-width="420">
            <template #default="scope">
              <span class="content-preview">{{ getContentByRow(scope.row) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="150" align="center">
            <template #default="scope">
              <div class="row-actions">
                <el-button
                  link
                  type="primary"
                  :loading="Boolean(aiGeneratingRowMap[scope.row.id])"
                  :disabled="isAiGenerating || isGenerating || isOcrProcessing"
                  @click="generateRowContentWithAi(scope.row)"
                >
                  AI生成
                </el-button>
                <el-button link type="danger" @click="removeRow(scope.$index)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <div class="participant-block">
        <ParticipantManager
          :participants="props.participants"
          :selected-first-participant="props.selectedFirstParticipant"
          :new-participant="props.newParticipant"
          :disabled="isGenerating || isAiGenerating"
          :get-participant-total="() => 0"
          :show-amount="false"
          primary-hint=""
          @update:selected-first-participant="emit('update:selectedFirstParticipant', $event)"
          @update:new-participant-name="emit('update:newParticipantName', $event)"
          @update:new-participant-code="emit('update:newParticipantCode', $event)"
          @add="emit('addParticipant')"
          @remove="emit('removeParticipant', $event)"
        />
      </div>

      <el-form :model="form" label-position="top" class="initiation-form">
        <div class="form-grid two-columns">
          <el-form-item label="项目负责人 {OwnerName}（主要参与者，仅 1 人）" required>
            <el-select v-model="ownerCode" placeholder="请选择主要参与者" class="w-full">
              <el-option
                v-for="participant in props.participants"
                :key="participant.code"
                :label="participantLabel(participant)"
                :value="participant.code"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="项目成员 {Merber}（次要参与者，可多选）">
            <el-select
              v-model="form.memberCodes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择次要参与者"
              class="w-full"
            >
              <el-option
                v-for="participant in secondaryParticipantOptions"
                :key="participant.code"
                :label="participantLabel(participant)"
                :value="participant.code"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="Content 模板（未使用AI时作为默认值，支持占位符 {ProductName}）" required>
          <el-input
            v-model="form.contentTemplate"
            type="textarea"
            :rows="4"
            placeholder="例如：围绕{ProductName}进行立项，完成需求分析、方案设计、开发测试与发布验收。"
          />
        </el-form-item>

        <div class="date-header">
          <h3 class="sub-title">计划时间（5 个 Date 默认值已自动填充）</h3>
          <el-button text type="primary" @click="recalculateMiddleDates">按起止日期重新均分中间 3 个日期</el-button>
        </div>

        <div class="form-grid five-columns">
          <el-form-item label="{StartDate}">
            <el-date-picker
              v-model="form.startDate"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY/MM/DD"
              placeholder="开始日期"
              class="date-picker"
            />
          </el-form-item>

          <el-form-item label="{Date1}">
            <el-date-picker
              v-model="form.date1"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY/MM/DD"
              placeholder="日期 1"
              class="date-picker"
            />
          </el-form-item>

          <el-form-item label="{Date2}">
            <el-date-picker
              v-model="form.date2"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY/MM/DD"
              placeholder="日期 2"
              class="date-picker"
            />
          </el-form-item>

          <el-form-item label="{Date3}">
            <el-date-picker
              v-model="form.date3"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY/MM/DD"
              placeholder="日期 3"
              class="date-picker"
            />
          </el-form-item>

          <el-form-item label="{EndDate}">
            <el-date-picker
              v-model="form.endDate"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY/MM/DD"
              placeholder="结束日期"
              class="date-picker"
            />
          </el-form-item>
        </div>

        <div class="form-grid two-columns">
          <el-form-item label="项目激励 {Amount}">
            <el-input-number v-model="form.amount" :min="0" :step="10" :precision="0" controls-position="right" />
          </el-form-item>

          <el-form-item label="输出说明">
            <el-input :value="outputDescription" readonly />
          </el-form-item>
        </div>
      </el-form>

      <div class="actions">
        <el-button size="large" @click="resetTemplateSettings" :disabled="isGenerating || isAiGenerating">重置模板默认值</el-button>
        <el-button type="primary" size="large" :loading="isGenerating" @click="generateFiles" :disabled="isAiGenerating">
          {{ isGenerating ? '生成中...' : '批量生成立项单' }}
        </el-button>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import JSZip from 'jszip'
import ParticipantManager from '../participant/ParticipantManager.vue'
import { requestInitiationContent } from '../../services/deepseekContent'

const props = defineProps({
  participants: { type: Array, required: true },
  selectedFirstParticipant: { type: String, required: true },
  newParticipant: { type: Object, required: true }
})

const emit = defineEmits([
  'update:selectedFirstParticipant',
  'update:newParticipantName',
  'update:newParticipantCode',
  'addParticipant',
  'removeParticipant'
])

const DAY_IN_MS = 24 * 60 * 60 * 1000
const TEMPLATE_URL = encodeURI('/立项模板.xlsx')
const TEMPLATE_STORAGE_KEY = 'keeson-initiation-template-settings-v1'
const SPECIAL_PROJECT_KEYWORD = '国外设备售后及参数调整'
const SPECIAL_PROJECT_CONTENT = `每月处理国外售后反馈的异常问题，如睡眠报告不准、睡眠报告不出、打鼾误干预、打鼾不干预、闹钟触发不抬起、一键入眠无报告、传感器无数据上报等一系列问题，需要对用户的操作、设备的信息、睡眠报告等进行分析，并给出解决方案。
1.使用售后系统对设备进行参数调整，打鼾干预参数、放大倍率、工作模式、打鼾干预抬起速率；
2.使用PlotLV工具进行分析睡眠报告的离床参数，可以针对睡眠报告不准的问题进行解决；
3.使用数据导出工具，对设备一整晚的睡眠报告详细数据进行导出，可以分析体动、打鼾包数据量是否准确。
目前iOS版本和 Android均已上线并完成测试验收。
特此申请项目奖励，请领导批示！”`

const pad = (num) => String(num).padStart(2, '0')
const formatIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const isoToDayNumber = (isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS)
}
const dayNumberToIso = (dayNumber) => {
  const date = new Date(dayNumber * DAY_IN_MS)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

const toDisplayDate = (isoDate) => (isoDate ? isoDate.replaceAll('-', '/') : '')
const participantLabel = (participant) => `${participant.name} (${participant.code})`

const normalizeOcrDigits = (value = '') => String(value)
  .replace(/[Oo]/g, '0')
  .replace(/[Il|]/g, '1')
  .replace(/[Ss]/g, '5')
  .replace(/[Bb]/g, '8')

const normalizeNumber = (value = '') => normalizeOcrDigits(value)
  .replace(/^DOC[-_ ]?MP[-_ ]?/i, '')
  .replace(/[^0-9]/g, '')

const compactChineseSpacing = (value = '') => {
  let next = value
  let prev = ''
  while (next !== prev) {
    prev = next
    next = next.replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, '$1')
  }
  return next
}

const normalizeProjectTechTerms = (value = '') => String(value)
  .replace(/([A-Za-z0-9])[|｜](?=[A-Za-z0-9])/g, '$1I')
  .replace(/MZ\s*[|｜]\s*MAID/gi, 'MZI MAID')
  .replace(/A\s*P\s*P/gi, 'APP')
  .replace(/i\s*[oO0dD]\s*[sS5]/g, 'iOS')
  .replace(/(^|[^A-Za-z0-9])(ODS|0DS|IDS|iDS|lDS|1DS|lOS|IOS|i0S)(?=[^A-Za-z0-9]|$)/gi, '$1iOS')
  .replace(/iOS\s*[庙廟亩市寺]\s*[,，]?\s*端/g, 'iOS端')
  .replace(/iOS\s*[庙廟亩市寺](?=\s|$|[,.，。;；])/g, 'iOS端')
  .replace(/iOS\s*[庙廟亩市寺]/g, 'iOS端')
  .replace(/iOS\s*端/g, 'iOS端')
  .replace(/iOS\s*[,，]\s*端/g, 'iOS端')
  .replace(/[,，]\s*(?=iOS端开发)/g, '')

const normalizeProjectName = (value = '') => normalizeProjectTechTerms(compactChineseSpacing(String(value)
  .replace(/\u3000/g, ' ')
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/[，]/g, ',')
  .replace(/[：]/g, ':')
  .replace(/[;；]+/g, '，')
  .replace(/[—–]/g, '-')
  .replace(/\s+/g, ' ')
  .replace(/[,，]\s*(?=iOS端开发)/g, '')
  .replace(/^[,，:：=._\-\s]+/, '')
  .trim()))

const createRowId = () => `row-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

const mergeRowsByNumber = (rows) => {
  const rowMap = new Map()
  rows.forEach((row) => {
    const number = normalizeNumber(row.number)
    const productName = normalizeProjectName(row.productName)
    if (!number || number.length < 4 || !productName) return

    const existing = rowMap.get(number)
    if (!existing || productName.length > existing.productName.length) {
      rowMap.set(number, { number, productName })
    }
  })
  return Array.from(rowMap.values())
}

const sanitizeRawLine = (line = '') => String(line)
  .replace(/\u3000/g, ' ')
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/[，]/g, ',')
  .replace(/[：]/g, ':')
  .replace(/[—–]/g, '-')
  .replace(/[。｡]/g, '.')
  .replace(/^[•·●◦▪▶►\-*]+\s*/, '')
  .trim()

const parseProjectLine = (line) => {
  const rawLine = sanitizeRawLine(line)
  if (!rawLine) return null

  const lastDocPrefix = Array.from(rawLine.matchAll(/DOC\s*[-_ ]*MP/ig)).pop()
  const baseLine = lastDocPrefix ? rawLine.slice(lastDocPrefix.index) : rawLine
  const withoutPrefix = baseLine.replace(/^DOC\s*[-_ ]*MP/i, '')

  const numberMatch = withoutPrefix.match(/([0-9OIlSsBb]{4,10})/) || baseLine.match(/([0-9OIlSsBb]{4,10})/)
  if (!numberMatch) return null

  const number = normalizeNumber(numberMatch[1])
  if (number.length < 4) return null

  const numberIndex = withoutPrefix.search(/([0-9OIlSsBb]{4,10})/)
  const nameSource = numberIndex >= 0
    ? withoutPrefix.slice(numberIndex + numberMatch[1].length)
    : baseLine.slice(baseLine.indexOf(numberMatch[1]) + numberMatch[1].length)

  const productName = normalizeProjectName(nameSource.replace(/^DOC\s*[-_ ]*MP/i, ''))
  if (!productName) return null

  return { number, productName }
}

const parseBatchText = (inputText) => {
  const rows = []
  const invalidLines = []

  inputText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parsed = parseProjectLine(line)
      if (!parsed) {
        invalidLines.push(line)
        return
      }
      rows.push(parsed)
    })

  return { rows: mergeRowsByNumber(rows), invalidLines }
}

const loadStoredTemplateSettings = () => {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const calculateMiddleDates = (startDate, endDate) => {
  const startDay = isoToDayNumber(startDate)
  const endDay = isoToDayNumber(endDate)
  const validEndDay = endDay > startDay ? endDay : startDay + 4
  const step = (validEndDay - startDay) / 4

  return {
    date1: dayNumberToIso(Math.round(startDay + step)),
    date2: dayNumberToIso(Math.round(startDay + step * 2)),
    date3: dayNumberToIso(Math.round(startDay + step * 3))
  }
}

const buildDefaultDates = () => {
  const today = new Date()
  const startDate = formatIsoDate(today)
  const nextMonth25 = new Date(today.getFullYear(), today.getMonth() + 1, 25)
  const endDate = formatIsoDate(nextMonth25)
  return {
    startDate,
    endDate,
    ...calculateMiddleDates(startDate, endDate)
  }
}

const buildDefaultTemplateForm = () => {
  const defaultDates = buildDefaultDates()
  return {
    memberCodes: [],
    contentTemplate: '围绕“{ProductName}”进行立项，完成需求分析、方案设计、开发测试与发布验收，确保项目按计划高质量交付。',
    ...defaultDates,
    amount: 850
  }
}

const storedSettings = loadStoredTemplateSettings()

const createTemplateForm = () => {
  const defaults = buildDefaultTemplateForm()
  const memberCodes = Array.isArray(storedSettings.memberCodes) ? storedSettings.memberCodes : defaults.memberCodes
  return {
    ...defaults,
    memberCodes,
    contentTemplate: storedSettings.contentTemplate || defaults.contentTemplate,
    startDate: storedSettings.startDate || defaults.startDate,
    date1: storedSettings.date1 || defaults.date1,
    date2: storedSettings.date2 || defaults.date2,
    date3: storedSettings.date3 || defaults.date3,
    endDate: storedSettings.endDate || defaults.endDate,
    amount: Number.isFinite(Number(storedSettings.amount)) ? Number(storedSettings.amount) : defaults.amount
  }
}

const form = ref(createTemplateForm())
const batchInputText = ref('')
const projectRows = ref([])
const isGenerating = ref(false)
const isOcrProcessing = ref(false)
const isAiGenerating = ref(false)
const aiGeneratingRowMap = ref({})
const isDropZoneActive = ref(false)

const ownerCode = computed({
  get: () => props.selectedFirstParticipant,
  set: (value) => emit('update:selectedFirstParticipant', value)
})

if (storedSettings.ownerCode && props.participants.some((participant) => participant.code === storedSettings.ownerCode)) {
  emit('update:selectedFirstParticipant', storedSettings.ownerCode)
}

const participantMap = computed(() => new Map(props.participants.map((participant) => [participant.code, participant])))

const secondaryParticipantOptions = computed(() => (
  props.participants.filter((participant) => participant.code !== ownerCode.value)
))

const sanitizeMemberCodes = (codes) => {
  const seen = new Set()
  return codes.filter((code) => {
    if (code === ownerCode.value) return false
    if (!participantMap.value.has(code)) return false
    if (seen.has(code)) return false
    seen.add(code)
    return true
  })
}

const isSpecialAfterSalesProject = (projectName = '') => normalizeProjectName(projectName)
  .replace(/\s+/g, '')
  .includes(SPECIAL_PROJECT_KEYWORD)

const buildContentByProjectName = (projectName) => {
  const safeName = normalizeProjectName(projectName)
  if (isSpecialAfterSalesProject(safeName)) {
    return SPECIAL_PROJECT_CONTENT
  }

  return form.value.contentTemplate
    .replaceAll('{ProductName}', safeName)
    .replaceAll('{ProjectName}', safeName)
    .trim()
}

const getContentByRow = (row) => (row?.aiContent || buildContentByProjectName(row?.productName || '')).trim()

const setRowAiGenerating = (rowId, isLoading) => {
  if (!rowId) return

  const nextState = { ...aiGeneratingRowMap.value }
  if (isLoading) {
    nextState[rowId] = true
  } else {
    delete nextState[rowId]
  }
  aiGeneratingRowMap.value = nextState
}

const outputDescription = computed(() => {
  if (projectRows.value.length === 0) return '暂无可生成项目'
  if (projectRows.value.length === 1) return '将下载 1 个 .xlsx 立项单文件'
  return `将下载 1 个 ZIP，包含 ${projectRows.value.length} 个立项单文件`
})

const persistTemplateSettings = () => {
  const payload = {
    ownerCode: ownerCode.value,
    memberCodes: form.value.memberCodes,
    contentTemplate: form.value.contentTemplate,
    startDate: form.value.startDate,
    date1: form.value.date1,
    date2: form.value.date2,
    date3: form.value.date3,
    endDate: form.value.endDate,
    amount: form.value.amount
  }
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore localStorage failures and keep form usable.
  }
}

watch(
  () => ownerCode.value,
  () => {
    form.value.memberCodes = sanitizeMemberCodes(form.value.memberCodes)
    persistTemplateSettings()
  }
)

watch(
  () => props.participants.map((participant) => participant.code).join('|'),
  () => {
    form.value.memberCodes = sanitizeMemberCodes(form.value.memberCodes)
    if (!participantMap.value.has(ownerCode.value) && props.participants.length > 0) {
      emit('update:selectedFirstParticipant', props.participants[0].code)
    }
  }
)

watch(
  () => [form.value.startDate, form.value.endDate],
  ([startDate, endDate]) => {
    if (!startDate || !endDate) return
    Object.assign(form.value, calculateMiddleDates(startDate, endDate))
    persistTemplateSettings()
  }
)

watch(
  () => ({
    memberCodes: form.value.memberCodes,
    contentTemplate: form.value.contentTemplate,
    date1: form.value.date1,
    date2: form.value.date2,
    date3: form.value.date3,
    amount: form.value.amount
  }),
  () => persistTemplateSettings(),
  { deep: true }
)

const normalizeRow = (row) => {
  row.number = normalizeNumber(row.number)
  const normalizedName = normalizeProjectName(row.productName)
  if (row.productName !== normalizedName) {
    row.aiContent = ''
  }
  row.productName = normalizedName
}

const applyParsedRows = (rows, mode = 'replace') => {
  const sourceMap = new Map()
  const baseRows = mode === 'append' ? projectRows.value : []

  baseRows.forEach((row) => {
    const number = normalizeNumber(row.number)
    const productName = normalizeProjectName(row.productName)
    if (!number || !productName) return
    sourceMap.set(number, { ...row, number, productName })
  })

  rows.forEach((row) => {
    const number = normalizeNumber(row.number)
    const productName = normalizeProjectName(row.productName)
    if (!number || !productName) return
    const existing = sourceMap.get(number)
    if (existing) {
      if (existing.productName !== productName) {
        existing.aiContent = ''
      }
      existing.productName = productName
    } else {
      sourceMap.set(number, { id: createRowId(), number, productName, aiContent: '' })
    }
  })

  projectRows.value = Array.from(sourceMap.values())

  const validIds = new Set(projectRows.value.map((row) => row.id).filter(Boolean))
  const nextLoadingState = {}
  Object.keys(aiGeneratingRowMap.value).forEach((rowId) => {
    if (validIds.has(rowId)) {
      nextLoadingState[rowId] = true
    }
  })
  aiGeneratingRowMap.value = nextLoadingState
}

const parseInput = (mode = 'replace') => {
  const { rows, invalidLines } = parseBatchText(batchInputText.value)
  if (rows.length === 0) {
    ElMessage.error('未解析到有效项目，请检查输入格式')
    return false
  }

  applyParsedRows(rows, mode)

  if (invalidLines.length > 0) {
    ElMessage.warning(`已导入 ${rows.length} 条，忽略 ${invalidLines.length} 条无法识别的数据`)
  } else {
    ElMessage.success(`已导入 ${rows.length} 条项目`)
  }

  return true
}

const replaceRowsFromInput = () => parseInput('replace')
const appendRowsFromInput = () => parseInput('append')

const generateRowContentWithAi = async (row, { silentSuccess = false } = {}) => {
  const rowId = row?.id || createRowId()
  row.id = rowId
  row.number = normalizeNumber(row.number)
  row.productName = normalizeProjectName(row.productName)

  if (!row.productName) {
    ElMessage.warning('请先填写项目名称后再使用AI生成')
    return false
  }

  setRowAiGenerating(rowId, true)
  try {
    row.aiContent = await requestInitiationContent(row.productName)
    if (!silentSuccess) {
      ElMessage.success(`已生成 ${row.productName} 的Content`)
    }
    return true
  } catch (error) {
    ElMessage.error(`AI生成失败：${error.message}`)
    return false
  } finally {
    setRowAiGenerating(rowId, false)
  }
}

const generateAllContentWithAi = async () => {
  const rows = getValidRows()
  if (!rows || rows.length === 0) {
    ElMessage.error('请先导入至少 1 条项目')
    return
  }

  isAiGenerating.value = true
  try {
    let successCount = 0
    for (const row of projectRows.value) {
      const done = await generateRowContentWithAi(row, { silentSuccess: true })
      if (done) successCount += 1
    }

    if (successCount === 0) {
      ElMessage.error('未生成任何Content，请检查配置后重试')
      return
    }

    if (successCount === projectRows.value.length) {
      ElMessage.success(`AI已完成 ${successCount} 条Content生成`)
      return
    }

    ElMessage.warning(`AI已生成 ${successCount}/${projectRows.value.length} 条Content`)
  } finally {
    isAiGenerating.value = false
  }
}

const removeRow = (index) => {
  projectRows.value.splice(index, 1)
  const validIds = new Set(projectRows.value.map((row) => row.id).filter(Boolean))
  const nextLoadingState = {}
  Object.keys(aiGeneratingRowMap.value).forEach((rowId) => {
    if (validIds.has(rowId)) {
      nextLoadingState[rowId] = true
    }
  })
  aiGeneratingRowMap.value = nextLoadingState
}

const clearRows = () => {
  projectRows.value = []
  aiGeneratingRowMap.value = {}
}

const recalculateMiddleDates = () => {
  if (!form.value.startDate || !form.value.endDate) {
    ElMessage.warning('请先选择开始和结束日期')
    return
  }
  Object.assign(form.value, calculateMiddleDates(form.value.startDate, form.value.endDate))
  persistTemplateSettings()
}

const resetTemplateSettings = () => {
  const defaults = buildDefaultTemplateForm()
  form.value = {
    ...defaults,
    memberCodes: sanitizeMemberCodes([])
  }
  persistTemplateSettings()
}

const getValidRows = () => {
  const normalized = projectRows.value.map((row) => {
    const number = normalizeNumber(row.number)
    const productName = normalizeProjectName(row.productName)
    return { ...row, number, productName }
  })

  const invalid = normalized.filter((row) => !row.number || !row.productName)
  if (invalid.length > 0) {
    ElMessage.error('请补全所有项目的 Number 和项目名称')
    return null
  }

  const duplicateNumbers = normalized
    .map((row) => row.number)
    .filter((number, index, arr) => arr.indexOf(number) !== index)

  if (duplicateNumbers.length > 0) {
    ElMessage.error(`存在重复 Number：${Array.from(new Set(duplicateNumbers)).join('、')}`)
    return null
  }

  return normalized
}

const buildPayloads = () => {
  const rows = getValidRows()
  if (!rows || rows.length === 0) {
    ElMessage.error('请先导入至少 1 条项目')
    return null
  }

  const owner = participantMap.value.get(ownerCode.value)
  if (!owner) {
    ElMessage.error('请先在参与者管理中选择项目负责人')
    return null
  }

  const contentTemplate = form.value.contentTemplate.trim()
  const hasFallbackRows = rows.some((row) => !row.aiContent?.trim())
  if (hasFallbackRows && !contentTemplate) {
    ElMessage.error('请填写 Content 模板，或先为所有项目生成AI内容')
    return null
  }

  const requiredDates = ['startDate', 'date1', 'date2', 'date3', 'endDate']
  const hasMissingDate = requiredDates.some((key) => !form.value[key])
  if (hasMissingDate) {
    ElMessage.error('请补全 5 个日期字段')
    return null
  }

  const members = sanitizeMemberCodes(form.value.memberCodes)
    .map((code) => participantMap.value.get(code)?.name)
    .filter(Boolean)
    .join('、')

  return rows.map((row) => {
    const content = getContentByRow(row)
    return {
      fileName: `DOC-MP-${row.number}.xlsx`,
      placeholders: {
        Number: row.number,
        ProductName: row.productName,
        OwnerName: owner.name,
        Merber: members,
        Content: content,
        StartDate: toDisplayDate(form.value.startDate),
        Date1: toDisplayDate(form.value.date1),
        Date2: toDisplayDate(form.value.date2),
        Date3: toDisplayDate(form.value.date3),
        EndDate: toDisplayDate(form.value.endDate),
        Amount: form.value.amount ?? 0
      }
    }
  })
}

const applyTemplateReplacements = async (templateArrayBuffer, placeholders) => {
  const zip = await JSZip.loadAsync(templateArrayBuffer)
  const xmlPaths = Object.keys(zip.files).filter((path) => path.endsWith('.xml'))
  let replacedCount = 0

  await Promise.all(xmlPaths.map(async (path) => {
    const file = zip.file(path)
    if (!file) return

    const content = await file.async('string')
    let updated = content

    Object.entries(placeholders).forEach(([key, value]) => {
      const token = `{${key}}`
      const next = updated.split(token).join(String(value))
      if (next !== updated) {
        const parts = updated.split(token)
        replacedCount += parts.length - 1
        updated = next
      }
    })

    if (updated !== content) {
      zip.file(path, updated)
    }
  }))

  if (replacedCount === 0) {
    throw new Error('模板中未找到可替换的占位符，请确认模板文件')
  }

  return zip.generateAsync({ type: 'uint8array' })
}

const downloadBlob = (blob, fileName) => {
  const link = document.createElement('a')
  const objectUrl = URL.createObjectURL(blob)
  link.href = objectUrl
  link.download = fileName
  link.click()
  URL.revokeObjectURL(objectUrl)
}

const generateFiles = async () => {
  const payloads = buildPayloads()
  if (!payloads) return

  isGenerating.value = true
  try {
    const response = await fetch(TEMPLATE_URL)
    if (!response.ok) throw new Error(`模板文件读取失败: ${response.status}`)
    const templateArrayBuffer = await response.arrayBuffer()

    if (payloads.length === 1) {
      const content = await applyTemplateReplacements(templateArrayBuffer, payloads[0].placeholders)
      const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      downloadBlob(blob, payloads[0].fileName)
      ElMessage.success(`已生成 ${payloads[0].fileName}`)
      return
    }

    const outputZip = new JSZip()
    for (const payload of payloads) {
      const content = await applyTemplateReplacements(templateArrayBuffer, payload.placeholders)
      outputZip.file(payload.fileName, content)
    }

    const zipBlob = await outputZip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, `DOC-MP-批量立项-${formatIsoDate(new Date())}.zip`)
    ElMessage.success(`已生成 ${payloads.length} 个立项单`)
  } catch (error) {
    console.error('批量生成立项单失败:', error)
    ElMessage.error(`生成失败：${error.message}`)
  } finally {
    isGenerating.value = false
  }
}

const extractRowsFromText = (rawText) => {
  const normalizedText = String(rawText || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')

  const parsedFromLines = parseBatchText(normalizedText)

  const regexRows = []
  const regex = /DOC[-_\s]*MP[^0-9A-Za-z]{0,8}([0-9OIlSsBb]{4,10})\s*[-—:：,，.= ]*\s*([^\n]+)/gi
  let match = regex.exec(normalizedText)
  while (match) {
    regexRows.push({
      number: normalizeNumber(match[1]),
      productName: normalizeProjectName(match[2])
    })
    match = regex.exec(normalizedText)
  }

  return {
    rows: mergeRowsByNumber([...parsedFromLines.rows, ...regexRows]),
    invalidLines: parsedFromLines.invalidLines
  }
}

const appendRowsToInputText = (rows) => {
  const lines = rows.map((row) => `DOC-MP-${row.number}-${row.productName}`)
  if (lines.length === 0) return
  const prefix = batchInputText.value.trim()
  batchInputText.value = prefix ? `${prefix}\n${lines.join('\n')}` : lines.join('\n')
}

const appendRowsFromRawText = (rawText, sourceLabel = '文本') => {
  const content = (rawText || '').trim()
  if (!content) return 0

  const { rows } = extractRowsFromText(content)
  if (rows.length === 0) {
    ElMessage.warning(`${sourceLabel}未提取到有效项目，请检查格式`)
    return 0
  }

  applyParsedRows(rows, 'append')
  appendRowsToInputText(rows)
  ElMessage.success(`${sourceLabel}导入成功，已追加 ${rows.length} 条项目`)
  return rows.length
}

const preprocessImageForOcr = (imageFile) => new Promise((resolve, reject) => {
  const imageUrl = URL.createObjectURL(imageFile)
  const image = new Image()

  image.onload = () => {
    try {
      const maxDimension = 3200
      const scale = Math.max(1, Math.min(2.2, maxDimension / Math.max(image.width, image.height)))
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        throw new Error('无法创建图像处理上下文')
      }

      ctx.drawImage(image, 0, 0, width, height)
      const imageData = ctx.getImageData(0, 0, width, height)
      const { data } = imageData

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.4 + 128))
        const value = contrast > 188 ? 255 : (contrast < 55 ? 0 : contrast)
        data[i] = value
        data[i + 1] = value
        data[i + 2] = value
      }

      ctx.putImageData(imageData, 0, 0)
      URL.revokeObjectURL(imageUrl)
      resolve(canvas)
    } catch (error) {
      URL.revokeObjectURL(imageUrl)
      reject(error)
    }
  }

  image.onerror = () => {
    URL.revokeObjectURL(imageUrl)
    reject(new Error('图片读取失败'))
  }

  image.src = imageUrl
})

const recognizeRowsFromImageFile = async (imageFile) => {
  if (!imageFile || !imageFile.type?.startsWith('image/')) return []

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('chi_sim+eng')
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1'
    })

    const originalResult = await worker.recognize(imageFile)
    const originalText = originalResult?.data?.text || ''

    await worker.setParameters({
      tessedit_pageseg_mode: '11',
      preserve_interword_spaces: '1'
    })
    const sparseResult = await worker.recognize(imageFile)
    const sparseText = sparseResult?.data?.text || ''

    let enhancedText = ''
    try {
      const processedCanvas = await preprocessImageForOcr(imageFile)
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
        preserve_interword_spaces: '1'
      })
      const enhancedResult = await worker.recognize(processedCanvas)
      enhancedText = enhancedResult?.data?.text || ''
    } catch (error) {
      console.warn('OCR 图像预处理失败，回退原图识别：', error)
    }

    const mergedRows = [
      ...extractRowsFromText(originalText).rows,
      ...extractRowsFromText(sparseText).rows,
      ...extractRowsFromText(enhancedText).rows
    ]

    return mergeRowsByNumber(mergedRows)
  } finally {
    await worker.terminate()
  }
}

const appendRowsFromImages = async (imageFiles, sourceLabel = '截图') => {
  const files = Array.from(imageFiles || []).filter((file) => file?.type?.startsWith('image/'))
  if (files.length === 0) {
    ElMessage.warning(`${sourceLabel}中未检测到图片文件`)
    return 0
  }

  isOcrProcessing.value = true
  try {
    const collectedRows = []
    for (const file of files) {
      const rows = await recognizeRowsFromImageFile(file)
      collectedRows.push(...rows)
    }

    const normalizedRows = mergeRowsByNumber(collectedRows)
    if (normalizedRows.length === 0) {
      ElMessage.warning(`${sourceLabel}识别完成，但未提取到有效项目`)
      return 0
    }

    applyParsedRows(normalizedRows, 'append')
    appendRowsToInputText(normalizedRows)
    ElMessage.success(`${sourceLabel}识别成功，已追加 ${normalizedRows.length} 条项目`)
    return normalizedRows.length
  } catch (error) {
    console.error('截图识别失败:', error)
    ElMessage.error('截图识别失败，请检查网络或直接粘贴文本')
    return 0
  } finally {
    isOcrProcessing.value = false
  }
}

const onOcrImageChange = async (uploadFile) => {
  if (!uploadFile?.raw) return
  await appendRowsFromImages([uploadFile.raw], '截图')
}

const onImportZoneDragEnter = () => {
  if (isGenerating.value || isOcrProcessing.value) return
  isDropZoneActive.value = true
}

const onImportZoneDragOver = () => {
  if (isGenerating.value || isOcrProcessing.value) return
  isDropZoneActive.value = true
}

const onImportZoneDragLeave = () => {
  isDropZoneActive.value = false
}

const onImportZoneDrop = async (event) => {
  isDropZoneActive.value = false
  if (isGenerating.value || isOcrProcessing.value) return

  const dataTransfer = event.dataTransfer
  if (!dataTransfer) return

  const files = Array.from(dataTransfer.files || [])
  const imageFiles = files.filter((file) => file.type?.startsWith('image/'))
  const text = dataTransfer.getData('text/plain') || ''

  let imported = 0
  if (text.trim()) {
    imported += appendRowsFromRawText(text, '拖拽文本')
  }
  if (imageFiles.length > 0) {
    imported += await appendRowsFromImages(imageFiles, '拖拽截图')
  }
  if (imported === 0) {
    ElMessage.warning('请拖入文本或图片截图')
  }
}

const getClipboardImageFiles = (clipboardData) => Array.from(clipboardData?.items || [])
  .filter((item) => item.kind === 'file')
  .map((item) => item.getAsFile())
  .filter((file) => file && file.type?.startsWith('image/'))

const isEditableTarget = (target) => {
  if (!(target instanceof Element)) return false
  if (target.closest('.quick-import-zone')) return true
  if (target.closest('[contenteditable="true"]')) return true
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

const onImportZonePaste = async (event) => {
  if (isGenerating.value || isOcrProcessing.value) return

  const clipboard = event.clipboardData
  if (!clipboard) return

  const text = clipboard.getData('text/plain') || ''
  if (text.trim()) {
    event.preventDefault()
    appendRowsFromRawText(text, '粘贴文本')
    return
  }

  const imageFiles = getClipboardImageFiles(clipboard)
  if (imageFiles.length > 0) {
    event.preventDefault()
    await appendRowsFromImages(imageFiles, '粘贴截图')
  }
}

const onGlobalPaste = async (event) => {
  if (event.defaultPrevented) return
  if (isGenerating.value || isOcrProcessing.value) return

  const clipboard = event.clipboardData
  if (!clipboard) return

  const imageFiles = getClipboardImageFiles(clipboard)
  if (imageFiles.length > 0) {
    event.preventDefault()
    await appendRowsFromImages(imageFiles, '全局粘贴截图')
    return
  }

  const text = clipboard.getData('text/plain') || ''
  if (!text.trim()) return
  if (isEditableTarget(event.target)) return

  const { rows } = extractRowsFromText(text)
  if (rows.length === 0) return

  event.preventDefault()
  appendRowsFromRawText(text, '全局粘贴文本')
}

onMounted(() => {
  window.addEventListener('paste', onGlobalPaste)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', onGlobalPaste)
})
</script>

<style scoped>
.initiation-page {
  width: 100%;
}

.initiation-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-lg);
}

.card-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  margin: 0;
  color: var(--color-text);
}

.card-desc {
  margin: var(--spacing-xs) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.batch-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  background: var(--color-bg);
}

.batch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.batch-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.batch-textarea {
  margin-bottom: var(--spacing-sm);
}

.batch-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.quick-import-zone {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  background: rgba(37, 99, 235, 0.03);
  outline: none;
  transition: all 0.2s ease-out;
}

.quick-import-zone.zone-active {
  border-color: var(--color-primary);
  background: rgba(37, 99, 235, 0.08);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.quick-import-zone.zone-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.zone-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.zone-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.batch-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0 0 var(--spacing-sm);
}

.rows-table {
  width: 100%;
}

.content-preview {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.5;
  white-space: pre-line;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.participant-block {
  margin-bottom: var(--spacing-lg);
}

.initiation-form :deep(.el-form-item) {
  margin-bottom: var(--spacing-md);
}

.initiation-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--color-text);
}

.form-grid {
  display: grid;
  gap: var(--spacing-md);
}

.two-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.five-columns {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.sub-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 0.9375rem;
  color: var(--color-text);
}

.date-header {
  margin: var(--spacing-md) 0 var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.date-picker,
.w-full {
  width: 100%;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 1200px) {
  .five-columns {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .two-columns,
  .five-columns {
    grid-template-columns: 1fr;
  }

  .card-header,
  .date-header,
  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .batch-actions {
    flex-direction: column;
  }
}
</style>
