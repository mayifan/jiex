<template>
  <div class="container">
    <!-- 步骤1: 上传文件 -->
    <div v-if="currentStep === 'upload'">
      <el-upload
        class="upload-demo"
        drag
        multiple
        :auto-upload="false"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
        :file-list="fileList"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            请上传Excel文件，支持.xlsx和.xls格式
          </div>
        </template>
      </el-upload>

      <el-button
        type="primary"
        :disabled="fileList.length === 0"
        @click="goToAllocation"
        class="process-btn"
      >
        下一步：分配金额
      </el-button>
    </div>

    <!-- 步骤2: 分配金额 -->
    <div v-if="currentStep === 'allocation'" class="allocation-container">
      <el-card class="allocation-card">
        <template #header>
          <div class="card-header">
            <h3>金额分配</h3>
            <el-button type="text" @click="backToUpload">返回上传</el-button>
          </div>
        </template>

        <div class="stats-info">
          <el-alert
            title="说明：每个项目固定850元。第1个参与者固定650元，其他2人共200元。您可以新增参与者，并选择谁作为第1个参与者。"
            type="info"
            :closable="false"
            style="margin-bottom: 20px;"
          />

          <el-alert
            v-if="willHaveDuplicates && allocatedParticipantCount > 0"
            title="警告：每个项目需要2个不同的参与者！"
            description="当前分配会导致同一个项目中出现相同的参与者。请至少为2个不同的参与者分配金额。"
            type="warning"
            :closable="false"
            style="margin-bottom: 20px;"
            show-icon
          />

          <!-- text4 输入框 -->
          <el-card style="margin-bottom: 20px;">
            <template #header>
              <div class="card-header">
                <h4>模板内容配置</h4>
              </div>
            </template>
            <el-form-item label="Text4 内容：" label-width="120px">
              <el-input
                v-model="text4Content"
                type="textarea"
                :rows="3"
                placeholder="请输入 text4 内容"
                style="width: 100%;"
              />
            </el-form-item>
          </el-card>

          <!-- 参与者管理 -->
          <el-card class="participant-management" style="margin-bottom: 20px;">
            <template #header>
              <div class="card-header">
                <h4>参与者管理</h4>
              </div>
            </template>

            <!-- 选择第一参与者 -->
            <el-form-item label="第1个参与者（650元）：" label-width="150px">
              <el-select v-model="selectedFirstParticipant" placeholder="请选择" @change="initAllocationForm">
                <el-option
                  v-for="p in participants"
                  :key="p.code"
                  :label="`${p.name} (${p.code})`"
                  :value="p.code"
                />
              </el-select>
            </el-form-item>

            <!-- 新增参与者 -->
            <div class="add-participant">
              <el-form inline>
                <el-form-item label="姓名：">
                  <el-input v-model="newParticipant.name" placeholder="请输入姓名" style="width: 150px;" />
                </el-form-item>
                <el-form-item label="工号：">
                  <el-input v-model="newParticipant.code" placeholder="请输入工号" style="width: 150px;" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="addParticipant">添加参与者</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 参与者列表 -->
            <div class="participant-list">
              <el-tag
                v-for="p in participants"
                :key="p.code"
                :type="p.code === selectedFirstParticipant ? 'success' : 'info'"
                closable
                :disable-transitions="false"
                @close="removeParticipant(p.code)"
                style="margin-right: 10px; margin-bottom: 10px;"
              >
                {{ p.name }} ({{ p.code }})
                <span v-if="p.code === selectedFirstParticipant"> - 第1参与者</span>
              </el-tag>
            </div>
          </el-card>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="项目数量">{{ projectCount }} 个</el-descriptions-item>
            <el-descriptions-item label="每个项目金额">850 元</el-descriptions-item>
            <el-descriptions-item label="需分配总额">{{ totalAmount }} 元（{{ totalAmount / 100 }} 百元）</el-descriptions-item>
            <el-descriptions-item :label="`${participants.find(p => p.code === selectedFirstParticipant)?.name || '第1参与者'}金额`">每项目 {{ mayifanAmount }} 元（自动计算）</el-descriptions-item>
            <el-descriptions-item label="已分配">{{ allocatedAmount }} 元（{{ allocatedAmount / 100 }} 百元）</el-descriptions-item>
            <el-descriptions-item label="剩余">
              <span :class="{ 'error-text': remainingAmount < 0 }">
                {{ remainingAmount }} 元（{{ remainingAmount / 100 }} 百元）
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="participants-list">
          <h4>其他参与者金额分配（按百元为单位，{{ participants.find(p => p.code === selectedFirstParticipant)?.name }}固定在每个项目第1位）</h4>
          <el-form :model="allocationForm" label-width="120px">
            <el-form-item
              v-for="participant in otherParticipants"
              :key="participant.code"
              :label="participant.name"
            >
              <el-input-number
                v-model="allocationForm[participant.code]"
                :min="0"
                :step="1"
                :precision="0"
                @change="calculateTotal"
              />
              <span class="unit-hint">百元 ({{ (allocationForm[participant.code] || 0) * 100 }} 元)</span>
            </el-form-item>
          </el-form>
        </div>

        <div class="allocation-actions">
          <el-button @click="backToUpload">取消</el-button>
          <el-button
            type="primary"
            @click="confirmAllocation"
            :disabled="!isAllocationValid"
          >
            确认分配并生成文档
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import JSZip from 'jszip'

// 步骤管理
const currentStep = ref('upload') // 'upload' | 'allocation'

// 文件列表
const fileList = ref([])

// text4 默认内容
const text4Content = ref('目前iOS版本和 Android均已上线并完成测试验收。')

// 参与者配置（可动态添加）
const participants = ref([
  { name: '马一帆', code: 'SFD17221' },
  { name: '刘纪甲', code: 'SDF21054' },
  { name: '丁少康', code: 'SFD16940' },
  { name: '王鹏', code: 'SFD21724' },
  { name: '盛泉铭', code: 'SFD22678' },
  { name: '刘仲', code: 'SFD16963' }
])

// 选中的第一参与者（默认马一帆）
const selectedFirstParticipant = ref('SFD17221')

// 其他参与者（除第一参与者外）
const otherParticipants = computed(() => {
  return participants.value.filter(p => p.code !== selectedFirstParticipant.value)
})

// 金额分配表单（动态生成）
const allocationForm = ref({})

// 初始化分配表单
const initAllocationForm = () => {
  const form = {}
  otherParticipants.value.forEach(p => {
    form[p.code] = allocationForm.value[p.code] || 0
  })
  allocationForm.value = form
}

// 新增参与者表单
const newParticipant = ref({
  name: '',
  code: ''
})

// 添加新参与者
const addParticipant = () => {
  if (!newParticipant.value.name || !newParticipant.value.code) {
    ElMessage.error('请输入参与者姓名和工号！')
    return
  }

  // 检查工号是否重复
  if (participants.value.some(p => p.code === newParticipant.value.code)) {
    ElMessage.error('该工号已存在！')
    return
  }

  participants.value.push({
    name: newParticipant.value.name,
    code: newParticipant.value.code
  })

  // 重置表单
  newParticipant.value = { name: '', code: '' }

  // 重新初始化分配表单
  initAllocationForm()

  ElMessage.success('参与者添加成功！')
}

// 删除参与者
const removeParticipant = (code) => {
  if (participants.value.length <= 2) {
    ElMessage.error('至少需要保留2个参与者！')
    return
  }

  if (code === selectedFirstParticipant.value) {
    ElMessage.error('不能删除当前选中的第一参与者！')
    return
  }

  participants.value = participants.value.filter(p => p.code !== code)

  // 删除对应的分配金额
  delete allocationForm.value[code]

  ElMessage.success('参与者删除成功！')
}

// 项目统计
const projectCount = ref(0)
const totalAmount = computed(() => projectCount.value * 200) // 每个项目至少200元（给其他2人）
const allocatedAmount = ref(0)
const remainingAmount = computed(() => totalAmount.value - allocatedAmount.value)

// 检查分配的参与者数量（有金额的人数）
const allocatedParticipantCount = computed(() => {
  return Object.values(allocationForm.value).filter(v => v > 0).length
})

// 检查是否会导致人员重复
const willHaveDuplicates = computed(() => {
  return allocatedParticipantCount.value < 2
})

// 分配是否有效
const isAllocationValid = computed(() => {
  return remainingAmount.value === 0 && allocatedAmount.value > 0 && !willHaveDuplicates.value
})

// 计算马一帆每个项目的金额（850 - 平均分配给其他人的金额）
const mayifanAmount = computed(() => {
  if (projectCount.value === 0) return 650
  const avgOthersAmount = allocatedAmount.value / projectCount.value
  return 850 - avgOthersAmount
})

// 处理文件上传
const handleFileChange = (uploadFile) => {
  if (!uploadFile.raw.name.match(/\.(xlsx|xls)$/i)) {
    ElMessage.error('请上传Excel文件！')
    return false
  }
  fileList.value.push(uploadFile)
  return true
}

// 进入金额分配步骤
const goToAllocation = () => {
  projectCount.value = fileList.value.length
  initAllocationForm()
  currentStep.value = 'allocation'
  ElMessage.info(`共上传了 ${projectCount.value} 个项目，需分配 ${totalAmount.value} 元给其他参与者`)
}

// 返回上传步骤
const backToUpload = () => {
  currentStep.value = 'upload'
  // 重置分配表单
  Object.keys(allocationForm.value).forEach(key => {
    allocationForm.value[key] = 0
  })
  allocatedAmount.value = 0
}

// 计算已分配总额
const calculateTotal = () => {
  allocatedAmount.value = Object.values(allocationForm.value).reduce((sum, val) => sum + (val || 0), 0) * 100
}

// 确认分配并生成文档
const confirmAllocation = async () => {
  if (!isAllocationValid.value) {
    ElMessage.error('金额分配不正确！请确保分配总额等于总金额。')
    return
  }

  try {
    // 获取有金额分配的其他参与者
    const allocatedOthers = otherParticipants.value.filter(p => allocationForm.value[p.code] > 0)

    if (allocatedOthers.length === 0) {
      ElMessage.error('至少需要为一个参与者分配金额！')
      return
    }

    // 为每个项目分配参与者
    const projectAllocations = distributeParticipants(fileList.value.length, allocatedOthers)

    const zip = new JSZip()
    const generatedFiles = []

    for (let i = 0; i < fileList.value.length; i++) {
      const file = fileList.value[i]
      console.log('开始处理文件:', file.raw.name)

      const arrayBuffer = await file.raw.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]

      // 读取指定单元格的值
      const text1 = worksheet['D1']?.v || ''
      const text2 = worksheet['B6']?.v || ''
      const text3 = worksheet['B4']?.v || ''

      console.log('从Excel读取的数据:', { text1, text2, text3 })

      // 使用该项目的参与者分配
      const projectParticipants = projectAllocations[i]
      console.log('项目参与者:', projectParticipants)

      // 获取模板文件
      const response = await fetch('/template.docx')
      if (!response.ok) {
        throw new Error(`模板文件获取失败: ${response.status} ${response.statusText}`)
      }
      const templateArrayBuffer = await response.arrayBuffer()

      // 创建新的Word文档
      const docZip = new PizZip(templateArrayBuffer)
      const doc = new Docxtemplater(docZip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [
          {
            name: 'alignment',
            set(options) {
              if (options.tag === 'text2') {
                options.scope._paragraph = {
                  alignment: 'left'
                };
              }
              return null;
            }
          }
        ]
      });

      // 替换模板中的文本，注意金额字段可能需要更新模板
      const data = {
        text1: text1,
        text2: text2,
        text3: text3,
        text4: text4Content.value,
        name1: projectParticipants[0].name, // 马一帆
        code1: projectParticipants[0].code,
        amount1: projectParticipants[0].amount, // 马一帆的金额
        name2: projectParticipants[1].name,
        code2: projectParticipants[1].code,
        amount2: projectParticipants[1].amount,
        name3: projectParticipants[2].name,
        code3: projectParticipants[2].code,
        amount3: projectParticipants[2].amount,
      }
      console.log('准备替换的数据:', data)

      doc.render(data)

      // 生成新文档
      const content = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      const fileName = `${text3 || '未命名'}.docx`
      generatedFiles.push({ name: fileName, content })
      console.log('文档生成成功:', fileName)
    }

    // 将所有生成的文件添加到压缩包
    for (const file of generatedFiles) {
      zip.file(file.name, file.content)
    }

    // 生成压缩包
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    console.log('压缩包生成成功，大小:', zipBlob.size, '字节')

    // 下载压缩包
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(zipBlob)
    downloadLink.download = '生成的文档.zip'
    downloadLink.click()
    URL.revokeObjectURL(downloadLink.href)

    ElMessage.success('文件处理完成！')

    // 重置状态
    fileList.value = []
    currentStep.value = 'upload'
    Object.keys(allocationForm.value).forEach(key => {
      allocationForm.value[key] = 0
    })
    allocatedAmount.value = 0
  } catch (error) {
    console.error('处理文件时出错：', error)
    ElMessage.error(`处理文件时出错：${error.message}`)
  }
}

// 根据分配的金额分配参与者到各个项目
const distributeParticipants = (projectCount, allocatedOthers) => {
  const result = []

  // 获取第一参与者
  const firstParticipant = participants.value.find(p => p.code === selectedFirstParticipant.value)

  // 为每个参与者创建一个计数器，记录还需要分配的次数
  const participantCounts = {}
  allocatedOthers.forEach(p => {
    participantCounts[p.code] = allocationForm.value[p.code] || 0
  })

  // 为每个项目分配参与者
  for (let i = 0; i < projectCount; i++) {
    const projectParticipants = []

    // 第1个人：选中的第一参与者
    const firstParticipantAmount = 650

    // 找出还有剩余次数的参与者
    const availableParticipants = allocatedOthers.filter(p => participantCounts[p.code] > 0)

    if (availableParticipants.length >= 2) {
      // 随机选择2个不同的参与者
      const shuffled = [...availableParticipants].sort(() => Math.random() - 0.5)
      const participant2 = shuffled[0]
      const participant3 = shuffled[1]

      // 减少计数
      participantCounts[participant2.code]--
      participantCounts[participant3.code]--

      projectParticipants.push(
        { ...firstParticipant, amount: firstParticipantAmount },
        { ...participant2, amount: 100 },
        { ...participant3, amount: 100 }
      )
    } else if (availableParticipants.length === 1) {
      // 只有1个参与者有剩余，必须重复使用
      const participant2 = availableParticipants[0]

      // 减少计数（使用2次）
      participantCounts[participant2.code] = Math.max(0, participantCounts[participant2.code] - 2)

      projectParticipants.push(
        { ...firstParticipant, amount: firstParticipantAmount },
        { ...participant2, amount: 100 },
        { ...participant2, amount: 100 }
      )
    } else {
      // 没有可用参与者（理论上不会发生）
      const fallback = allocatedOthers[0]
      projectParticipants.push(
        { ...firstParticipant, amount: firstParticipantAmount },
        { ...fallback, amount: 100 },
        { ...fallback, amount: 100 }
      )
    }

    result.push(projectParticipants)
  }

  return result
}
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: 40px auto;
  padding: 20px;
}

.process-btn {
  margin-top: 20px;
  width: 100%;
}

.upload-demo {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  padding: 20px;
}

.allocation-container {
  width: 100%;
}

.allocation-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.stats-info {
  margin-bottom: 30px;
}

.error-text {
  color: #f56c6c;
  font-weight: bold;
}

.participants-list {
  margin: 30px 0;
}

.participants-list h4 {
  margin-bottom: 20px;
  color: #303133;
}

.unit-hint {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}

.allocation-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.participant-management h4 {
  margin: 0;
}

.add-participant {
  margin: 20px 0;
}

.participant-list {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  min-height: 50px;
}
</style>