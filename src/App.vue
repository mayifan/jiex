<template>
  <div class="app-container">
    <!-- 头部导航栏 -->
    <nav class="app-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <svg class="brand-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="brand-text">结项单生成器</span>
          <span class="brand-badge">PRO</span>
        </div>
        <div class="nav-stats" v-if="fileList.length > 0">
          <div class="nav-stat-item">
            <span class="stat-label">项目数</span>
            <span class="stat-value">{{ fileList.length }}</span>
          </div>
          <div class="nav-stat-item">
            <span class="stat-label">已配置</span>
            <span class="stat-value" :class="{ 'text-success': validProjectCount === fileList.length, 'text-warning': validProjectCount < fileList.length }">{{ validProjectCount }}/{{ fileList.length }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- 页面标题区 -->
    <header class="page-header">
      <h1 class="page-title">Excel → Word 智能转换</h1>
      <p class="page-description">上传Excel文件，自动生成格式化的Word结项文档</p>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 文件上传卡片 -->
      <section class="upload-card">
        <div class="card-header">
          <div class="header-left">
            <svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13 3v6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h2 class="card-title">文件上传</h2>
          </div>
          <span class="file-badge" v-if="fileList.length > 0">{{ fileList.length }} 个文件</span>
        </div>

        <div class="upload-area">
          <el-upload
            class="upload-dragger"
            drag
            multiple
            :auto-upload="false"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
          >
            <div class="upload-inner">
              <svg class="upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 18a4.6 4.4 0 010-9 5 4.5 0 0111 2h1a3.5 3.5 0 010 7h-13z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 15l3-3m0 0l3 3m-3-3v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <p class="upload-title">拖拽文件到此处上传</p>
              <p class="upload-subtitle">或点击选择Excel文件</p>
              <p class="upload-hint">支持 .xlsx 和 .xls 格式，可同时上传多个文件</p>
            </div>
          </el-upload>
        </div>

        <!-- 统计信息 -->
        <div class="stats-row" v-if="fileList.length > 0">
          <div class="stat-item">
            <div class="stat-icon stat-icon-primary">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ fileList.length }}</div>
              <div class="stat-label">项目总数</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon stat-icon-success">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ totalProjectAmount }}</div>
              <div class="stat-label">总金额</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon" :class="validProjectCount === fileList.length ? 'stat-icon-success' : 'stat-icon-warning'">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ validProjectCount }}/{{ fileList.length }}</div>
              <div class="stat-label">已配置</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 配置区域 -->
      <section class="config-card" :class="{ 'card-disabled': fileList.length === 0 }">
        <!-- 模板内容配置 -->
        <div class="config-section">
          <div class="section-header">
            <div class="header-left">
              <svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <h3 class="section-title">模板内容</h3>
            </div>
          </div>
          <el-input
            v-model="text4Content"
            type="textarea"
            :rows="3"
            placeholder="输入模板内容..."
            :disabled="fileList.length === 0"
            class="content-textarea"
          />
        </div>

        <!-- 参与者管理 -->
        <div class="config-section">
          <div class="section-header">
            <div class="header-left">
              <svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <h3 class="section-title">参与者管理</h3>
            </div>
          </div>

          <!-- 第一参与者选择 -->
          <div class="form-group">
            <label class="form-label">主要参与者 <span class="label-hint">（金额从Excel C17或C18读取）</span></label>
            <el-select
              v-model="selectedFirstParticipant"
              placeholder="选择主要参与者"
              :disabled="fileList.length === 0"
              @change="reinitAllProjects"
              class="w-full"
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
          <div class="form-group">
            <label class="form-label">添加参与者</label>
            <div class="add-participant-row">
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
                class="add-btn"
              >
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4v16m8-8H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                添加
              </el-button>
            </div>
          </div>

          <!-- 参与者列表 -->
          <div class="participants-list">
            <div
              v-for="p in participants"
              :key="p.code"
              class="participant-chip"
              :class="{ 'chip-primary': p.code === selectedFirstParticipant }"
            >
              <div class="chip-content">
                <span class="chip-name">{{ p.name }}</span>
                <span class="chip-code">{{ p.code }}</span>
              </div>
              <span v-if="p.code === selectedFirstParticipant" class="chip-badge">主要</span>
              <button
                v-else-if="participants.length > 2"
                @click="removeParticipant(p.code)"
                class="chip-remove"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 项目金额分配 -->
        <div class="config-section">
          <div class="section-header">
            <div class="header-left">
              <svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <h3 class="section-title">项目金额分配</h3>
            </div>
            <span class="section-badge" v-if="fileList.length > 0">至少选择2个次要参与者</span>
          </div>

          <!-- 项目列表 -->
          <div class="projects-container" v-if="fileList.length > 0">
            <div
              v-for="file in fileList"
              :key="file.uid"
              class="project-item"
              :class="{ 'project-valid': isProjectValid(file.uid), 'project-invalid': !isProjectValid(file.uid) }"
            >
              <!-- 项目头部 -->
              <div class="project-header">
                <div class="project-info">
                  <h4 class="project-name">{{ projectAllocations[file.uid]?.projectName || '加载中...' }}</h4>
                  <div class="project-meta">
                    <span class="meta-item">
                      <svg class="meta-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                      </svg>
                      ¥{{ projectAllocations[file.uid]?.totalAmount || 0 }}
                    </span>
                    <span class="status-dot" :class="isProjectValid(file.uid) ? 'dot-success' : 'dot-error'"></span>
                    <span class="status-text" :class="isProjectValid(file.uid) ? 'text-success' : 'text-error'">
                      {{ isProjectValid(file.uid) ? '已配置' : '未完成' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 项目主体 -->
              <div class="project-body">
                <!-- 主要参与者 -->
                <div class="allocation-row primary-row">
                  <div class="row-label">
                    <svg class="label-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                    </svg>
                    <span>主要参与者</span>
                  </div>
                  <div class="row-content">
                    <span class="participant-name">
                      {{ participants.find(p => p.code === selectedFirstParticipant)?.name }}
                      <span class="participant-code">({{ selectedFirstParticipant }})</span>
                    </span>
                    <span class="amount-badge" :class="{ 'badge-error': getPrimaryAmount(file.uid) < 0 }">
                      ¥{{ getPrimaryAmount(file.uid) }}
                    </span>
                  </div>
                </div>

                <!-- 次要参与者 -->
                <div class="secondary-section">
                  <div class="section-label">
                    次要参与者
                    <span class="label-count" :class="{ 'count-success': getSelectedSecondaryCount(file.uid) >= 2, 'count-warning': getSelectedSecondaryCount(file.uid) < 2 }">
                      已选 {{ getSelectedSecondaryCount(file.uid) }}/至少2
                    </span>
                  </div>
                  <div class="secondary-list">
                    <div
                      v-for="p in otherParticipants"
                      :key="p.code"
                      class="secondary-item"
                      :class="{ 'item-selected': projectAllocations[file.uid].secondary[p.code].selected }"
                    >
                      <el-checkbox
                        v-model="projectAllocations[file.uid].secondary[p.code].selected"
                        :disabled="fileList.length === 0"
                        class="secondary-checkbox"
                      >
                        {{ p.name }}
                      </el-checkbox>
                      <div class="amount-input-group">
                        <el-input-number
                          v-model="projectAllocations[file.uid].secondary[p.code].amount"
                          :min="0"
                          :step="100"
                          :precision="0"
                          :disabled="!projectAllocations[file.uid].secondary[p.code].selected"
                          controls-position="right"
                          size="small"
                        />
                        <span class="input-suffix">元</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 汇总信息 -->
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">次要参与者总额</span>
                    <span class="summary-value">¥{{ getSecondaryTotal(file.uid) }}</span>
                  </div>
                  <div class="summary-row summary-primary">
                    <span class="summary-label">主要参与者金额</span>
                    <span class="summary-value" :class="{ 'value-error': getPrimaryAmount(file.uid) < 0 }">
                      ¥{{ getPrimaryAmount(file.uid) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div class="empty-state" v-else>
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p class="empty-text">请先上传 Excel 文件</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button
            size="large"
            @click="resetAll"
            :disabled="fileList.length === 0"
            class="btn-reset"
          >
            <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            重置
          </el-button>
          <el-button
            type="primary"
            size="large"
            @click="confirmAllocation"
            :disabled="!isAllProjectsValid"
            :loading="isGenerating"
            class="btn-generate"
          >
            <svg v-if="!isGenerating" class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
            <span>{{ isGenerating ? '生成中...' : '生成文档' }}</span>
          </el-button>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="page-footer">
      <p class="footer-text">每个项目金额从Excel C17读取（如无值则读取C18），每个项目至少有2个不同的次要参与者</p>
      <p class="footer-text">主要参与者金额 = 项目总额 - 次要参与者金额之和</p>
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
  { name: '刘仲', code: 'SFD16963' },
  { name: '陈瑞垟', code: 'SFD21730' },
  { name: '何佳飞', code: 'SFD23771' }
])

// 选中的第一参与者
const selectedFirstParticipant = ref('SFD17221')

// 其他参与者
const otherParticipants = computed(() => {
  return participants.value.filter(p => p.code !== selectedFirstParticipant.value)
})

// 项目分配数据结构
// { [fileUid]: { projectName, totalAmount, secondary: { [code]: { selected, amount } } } }
const projectAllocations = ref({})

// 初始化项目分配数据
const initProjectAllocation = (fileUid, projectName, totalAmount) => {
  const secondary = {}
  otherParticipants.value.forEach(p => {
    secondary[p.code] = { selected: false, amount: 100 }
  })
  projectAllocations.value[fileUid] = {
    projectName,
    totalAmount,
    secondary
  }
}

// 重新初始化所有项目的分配（当第一参与者改变时）
const reinitAllProjects = () => {
  const newAllocations = {}
  fileList.value.forEach(file => {
    const oldAlloc = projectAllocations.value[file.uid]
    if (oldAlloc) {
      const secondary = {}
      otherParticipants.value.forEach(p => {
        // 保留之前的选择和金额（如果存在）
        const old = oldAlloc.secondary[p.code]
        secondary[p.code] = old || { selected: false, amount: 100 }
      })
      newAllocations[file.uid] = {
        ...oldAlloc,
        secondary
      }
    }
  })
  projectAllocations.value = newAllocations
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
  reinitAllProjects()
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
  reinitAllProjects()
  ElMessage.success('已删除')
}

// 总项目金额（从所有Excel C17汇总）
const totalProjectAmount = computed(() => {
  return Object.values(projectAmounts.value).reduce((sum, val) => sum + (val || 0), 0)
})

// 计算某个项目的次要参与者总金额
const getSecondaryTotal = (fileUid) => {
  const alloc = projectAllocations.value[fileUid]
  if (!alloc) return 0
  return Object.values(alloc.secondary)
    .filter(s => s.selected)
    .reduce((sum, s) => sum + (s.amount || 0), 0)
}

// 计算某个项目的主要参与者金额
const getPrimaryAmount = (fileUid) => {
  const alloc = projectAllocations.value[fileUid]
  if (!alloc) return 0
  return alloc.totalAmount - getSecondaryTotal(fileUid)
}

// 计算某个项目选中的次要参与者数量
const getSelectedSecondaryCount = (fileUid) => {
  const alloc = projectAllocations.value[fileUid]
  if (!alloc) return 0
  return Object.values(alloc.secondary).filter(s => s.selected).length
}

// 检查某个项目是否有效
const isProjectValid = (fileUid) => {
  const selectedCount = getSelectedSecondaryCount(fileUid)
  const primaryAmount = getPrimaryAmount(fileUid)
  return selectedCount >= 2 && primaryAmount >= 0
}

// 检查所有项目是否有效
const isAllProjectsValid = computed(() => {
  if (fileList.value.length === 0) return false
  return fileList.value.every(file => isProjectValid(file.uid))
})

// 计算已配置有效的项目数
const validProjectCount = computed(() => {
  return fileList.value.filter(file => isProjectValid(file.uid)).length
})

// 处理文件上传
const handleFileChange = async (uploadFile) => {
  if (!uploadFile.raw.name.match(/\.(xlsx|xls)$/i)) {
    ElMessage.error('请上传Excel文件')
    return false
  }

  try {
    // 读取Excel文件获取C17或C18金额和项目名称
    const arrayBuffer = await uploadFile.raw.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    // 先读取C17，如果没有值就读取C18
    const amountValue = worksheet['C17']?.v || worksheet['C18']?.v || 0
    const amount = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue) || 0
    // 读取项目名称（B4）
    const projectName = worksheet['B4']?.v || '未命名项目'

    // 存储文件和金额
    fileList.value.push(uploadFile)
    projectAmounts.value[uploadFile.uid] = amount

    // 初始化项目分配
    initProjectAllocation(uploadFile.uid, projectName, amount)

    ElMessage.success(`已读取项目: ${projectName}，金额: ${amount} 元`)
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
  delete projectAllocations.value[file.uid]
  if (fileList.value.length === 0) {
    resetAll()
  }
}

// 重置所有
const resetAll = () => {
  fileList.value = []
  projectAmounts.value = {}
  projectAllocations.value = {}
}

// 确认分配并生成文档
const confirmAllocation = async () => {
  if (!isAllProjectsValid.value) {
    ElMessage.error('请确保每个项目至少有2个次要参与者，且金额分配正确')
    return
  }

  isGenerating.value = true

  try {
    const firstParticipant = participants.value.find(p => p.code === selectedFirstParticipant.value)
    const zip = new JSZip()
    const generatedFiles = []

    for (let i = 0; i < fileList.value.length; i++) {
      const file = fileList.value[i]
      const alloc = projectAllocations.value[file.uid]

      // 获取选中的次要参与者
      const selectedSecondary = Object.entries(alloc.secondary)
        .filter(([code, data]) => data.selected)
        .map(([code, data]) => {
          const p = participants.value.find(p => p.code === code)
          return { ...p, amount: data.amount }
        })

      // 确保有至少2个次要参与者
      if (selectedSecondary.length < 2) {
        ElMessage.error(`项目 ${alloc.projectName} 需要至少2个次要参与者`)
        isGenerating.value = false
        return
      }

      // 读取Excel数据
      const arrayBuffer = await file.raw.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]

      const text1 = worksheet['D1']?.v || ''
      const text2 = worksheet['B6']?.v || ''
      const text3 = worksheet['B4']?.v || ''

      // 准备参与者数据（主要参与者 + 前2个次要参与者）
      const primaryAmount = getPrimaryAmount(file.uid)
      const projectParticipants = [
        { ...firstParticipant, amount: primaryAmount },
        selectedSecondary[0],
        selectedSecondary[1]
      ]

      // 加载模板并生成文档
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
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');

/* CSS变量 - 基于SaaS企业级配色 */
:root {
  /* 主色调 */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-light: #DBEAFE;
  --color-secondary: #3B82F6;
  --color-cta: #F97316;
  --color-cta-hover: #EA580C;

  /* 状态颜色 */
  --color-success: #10B981;
  --color-success-light: #D1FAE5;
  --color-warning: #F59E0B;
  --color-warning-light: #FEF3C7;
  --color-error: #EF4444;
  --color-error-light: #FEE2E2;

  /* 中性色 */
  --color-bg: #F8FAFC;
  --color-bg-card: #FFFFFF;
  --color-text: #1E293B;
  --color-text-muted: #64748B;
  --color-border: #E2E8F0;
  --color-border-hover: #CBD5E1;

  /* 字体 */
  --font-heading: 'Poppins', 'Noto Sans SC', sans-serif;
  --font-body: 'Open Sans', 'Noto Sans SC', sans-serif;

  /* 间距 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* 圆角 */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* 阴影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
/* 主容器 */
.app-container {
  min-height: 100vh;
  padding-bottom: var(--spacing-2xl);
}

/* 导航栏 */
.app-nav {
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.brand-icon {
  width: 28px;
  height: 28px;
  color: var(--color-primary);
}

.brand-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.brand-badge {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
}

.nav-stats {
  display: flex;
  gap: var(--spacing-lg);
}

.nav-stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary);
}

.text-success {
  color: var(--color-success) !important;
}

.text-warning {
  color: var(--color-warning) !important;
}

/* 页面标题 */
.page-header {
  max-width: 1280px;
  margin: var(--spacing-2xl) auto var(--spacing-xl);
  padding: 0 var(--spacing-xl);
  text-align: center;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.page-description {
  font-size: 1.125rem;
  color: var(--color-text-muted);
}

/* 主内容区 */
.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--spacing-xl);
}

/* 卡片通用样式 */
.upload-card,
.config-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease-out;
}

.upload-card:hover,
.config-card:hover {
  box-shadow: var(--shadow-md);
}

.card-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 卡片头部 */
.card-header,
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-icon {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
}

.card-title,
.section-title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.file-badge {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
}

.section-badge {
  background: var(--color-warning-light);
  color: var(--color-warning);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
}

/* 上传区域 */
.upload-area {
  margin-bottom: var(--spacing-lg);
}

.upload-dragger :deep(.el-upload) {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  min-height: 200px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.03), rgba(59, 130, 246, 0.03));
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  transition: all 0.2s ease-out;
}

.upload-dragger :deep(.el-upload-dragger:hover) {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(59, 130, 246, 0.05));
}

.upload-inner {
  text-align: center;
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-lg);
  color: var(--color-primary);
  stroke-width: 1.5;
}

.upload-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.upload-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* 统计行 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease-out;
  cursor: default;
}

.stat-item:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 20px;
  height: 20px;
}

.stat-icon-primary {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.stat-icon-success {
  background: var(--color-success-light);
  color: var(--color-success);
}

.stat-icon-warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-item .stat-value {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.stat-item .stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: none;
  letter-spacing: normal;
}

/* 配置区域 */
.config-section {
  margin-bottom: var(--spacing-xl);
}

.config-section:last-of-type {
  margin-bottom: 0;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.label-hint {
  font-weight: 400;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.w-full {
  width: 100%;
}

.content-textarea :deep(.el-textarea__inner) {
  font-family: var(--font-body);
  font-size: 0.875rem;
}

/* 添加参与者 */
.add-participant-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--spacing-sm);
  align-items: end;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 参与者列表 */
.participants-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.participant-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  transition: all 0.2s ease-out;
}

.participant-chip:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-sm);
}

.chip-primary {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.chip-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.chip-name {
  font-weight: 600;
  color: var(--color-text);
}

.chip-code {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.chip-badge {
  background: var(--color-primary);
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
}

.chip-remove {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease-out;
}

.chip-remove:hover {
  color: var(--color-error);
}

.chip-remove svg {
  width: 100%;
  height: 100%;
}

/* 项目列表 */
.projects-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.project-item {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.2s ease-out;
}

.project-item:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-md);
}

.project-valid {
  border-left: 4px solid var(--color-success);
}

.project-invalid {
  border-left: 4px solid var(--color-error);
}

.project-header {
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  border-bottom: 1px solid var(--color-border);
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.project-name {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.project-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.meta-icon {
  width: 16px;
  height: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-success {
  background: var(--color-success);
}

.dot-error {
  background: var(--color-error);
}

.status-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.text-error {
  color: var(--color-error) !important;
}

.project-body {
  padding: var(--spacing-lg);
}

/* 分配行 */
.allocation-row {
  margin-bottom: var(--spacing-lg);
}

.primary-row {
  background: var(--color-primary-light);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.row-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
}

.label-icon {
  width: 16px;
  height: 16px;
}

.row-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.participant-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.participant-code {
  font-weight: 400;
  color: var(--color-text-muted);
}

.amount-badge {
  background: var(--color-success);
  color: white;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
}

.badge-error {
  background: var(--color-error);
}

/* 次要参与者 */
.secondary-section {
  margin-bottom: var(--spacing-lg);
}

.section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-md);
}

.label-count {
  background: var(--color-bg);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

.count-success {
  background: var(--color-success-light);
  color: var(--color-success);
}

.count-warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.secondary-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.secondary-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-md);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease-out;
}

.secondary-item:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-sm);
}

.item-selected {
  background: rgba(37, 99, 235, 0.02);
  border-color: var(--color-primary);
}

.secondary-checkbox :deep(.el-checkbox__label) {
  font-size: 0.875rem;
  font-weight: 500;
}

.amount-input-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.input-suffix {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* 汇总信息 */
.summary-section {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
}

.summary-row + .summary-row {
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
}

.summary-primary {
  background: var(--color-bg);
  margin: 0 calc(-1 * var(--spacing-md));
  padding: var(--spacing-md);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.summary-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.summary-value {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.value-error {
  color: var(--color-error) !important;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-md);
  color: var(--color-border-hover);
  stroke-width: 1.5;
}

.empty-text {
  font-size: 0.875rem;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-lg);
}

.btn-reset,
.btn-generate {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: var(--font-heading);
  font-weight: 600;
  transition: all 0.2s ease-out;
}

.btn-reset .btn-icon,
.btn-generate .btn-icon {
  width: 18px;
  height: 18px;
}

/* 页脚 */
.page-footer {
  max-width: 1280px;
  margin: var(--spacing-2xl) auto 0;
  padding: var(--spacing-lg) var(--spacing-xl);
  text-align: center;
  border-top: 1px solid var(--color-border);
}

.footer-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: var(--spacing-xs) 0;
}

/* Element Plus 覆盖样式 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  background: white;
  border: 1px solid var(--color-border);
  box-shadow: none;
  border-radius: var(--radius-md);
  transition: all 0.2s ease-out;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover),
:deep(.el-select__wrapper:hover) {
  border-color: var(--color-border-hover);
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus),
:deep(.el-select__wrapper.is-focused) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--color-text);
  font-family: var(--font-body);
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: var(--color-text-muted);
}

:deep(.el-button) {
  border-radius: var(--radius-md);
  font-family: var(--font-heading);
  font-weight: 600;
  transition: all 0.2s ease-out;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
  color: white;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

:deep(.el-button--primary:active) {
  transform: translateY(0);
}

:deep(.el-input-number) {
  width: 140px;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

:deep(.el-checkbox__label) {
  color: var(--color-text);
  font-weight: 500;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

:deep(.el-select-dropdown) {
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-lg);
}

:deep(.el-upload-list) {
  margin-top: var(--spacing-md);
}

:deep(.el-upload-list__item) {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  transition: all 0.2s ease-out;
}

:deep(.el-upload-list__item:hover) {
  background: var(--color-bg);
  border-color: var(--color-border-hover);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .nav-stats {
    display: none;
  }

  .page-title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .nav-container,
  .page-header,
  .main-content,
  .page-footer {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-description {
    font-size: 1rem;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .add-participant-row {
    grid-template-columns: 1fr;
  }

  .secondary-item {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .amount-input-group {
    justify-content: space-between;
  }

  .action-buttons {
    flex-direction: column-reverse;
  }

  .action-buttons button {
    width: 100%;
  }
}

/* 动画 - 尊重用户的motion偏好设置 */
@media (prefers-reduced-motion: no-preference) {
  * {
    transition-timing-function: ease-out;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 可访问性增强 */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  :root {
    --color-border: #94A3B8;
    --color-text-muted: #475569;
  }
}
</style>
