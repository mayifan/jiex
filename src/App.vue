<template>
  <div class="app-container">
    <AppNav
      :file-count="fileList.length"
      :valid-count="validProjectCount"
    />

    <header class="page-header">
      <h1 class="page-title">Keeson 结项工具</h1>
      <p class="page-description">上传Excel文件，自动生成格式化的Word结项文档</p>
    </header>

    <main class="main-content">
      <FileUpload
        :file-list="fileList"
        :total-amount="totalProjectAmount"
        :valid-count="validProjectCount"
        @change="onFileChange"
        @remove="handleFileRemove"
      />

      <section class="config-card" :class="{ 'card-disabled': isDisabled }">
        <div class="config-section">
          <div class="section-header">
            <div class="header-left">
              <IconEdit class="header-icon" />
              <h3 class="section-title">模板内容</h3>
            </div>
          </div>
          <el-input
            v-model="text4Content"
            type="textarea"
            :rows="3"
            placeholder="输入模板内容..."
            :disabled="isDisabled"
            class="content-textarea"
          />
        </div>

        <div class="config-section">
          <ParticipantManager
            :participants="participants"
            :selected-first-participant="selectedFirstParticipant"
            :new-participant="newParticipant"
            :disabled="isDisabled"
            :get-participant-total="getParticipantTotal"
            @update:selected-first-participant="onFirstParticipantChange"
            @update:new-participant-name="newParticipant.name = $event"
            @update:new-participant-code="newParticipant.code = $event"
            @add="addParticipant(reinitProjects)"
            @remove="(code) => removeParticipant(code, reinitProjects)"
          />
        </div>

        <div class="config-section">
          <ProjectAllocation
            :file-list="fileList"
            :project-allocations="projectAllocations"
            :other-participants="otherParticipants"
            :first-participant="firstParticipant"
            :selected-first-participant="selectedFirstParticipant"
            :disabled="isDisabled"
            :is-project-valid="isProjectValid"
            :get-primary-amount="getPrimaryAmount"
            :get-secondary-total="getSecondaryTotal"
            :get-selected-secondary-count="getSelectedSecondaryCount"
          />
        </div>

        <div class="action-buttons">
          <el-button
            size="large"
            @click="resetAll"
            :disabled="isDisabled"
            class="btn-reset"
          >
            <IconReset class="btn-icon" />
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
            <IconPen v-if="!isGenerating" class="btn-icon" />
            <span>{{ isGenerating ? '生成中...' : '生成文档' }}</span>
          </el-button>
        </div>
      </section>
    </main>

    <footer class="page-footer">
      <p class="footer-text">每个项目金额从Excel C17读取（如无值则读取C18），每个项目至少有2个不同的次要参与者</p>
      <p class="footer-text">主要参与者金额 = 项目总额 - 次要参与者金额之和</p>
    </footer>

    <!-- 固定浮动的金额汇总面板 -->
    <div class="floating-summary" v-if="fileList.length > 0">
      <div class="summary-header">
        <IconMoney class="summary-icon" />
        <span>金额汇总</span>
      </div>
      <div class="summary-list">
        <div
          v-for="p in participants"
          :key="p.code"
          class="summary-item"
          :class="{ 'item-primary': p.code === selectedFirstParticipant }"
        >
          <span class="summary-name">{{ p.name }}</span>
          <span class="summary-amount">¥{{ getParticipantTotal(p.code) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { AppNav, FileUpload, ParticipantManager, ProjectAllocation } from './components'
import { IconEdit, IconReset, IconPen, IconMoney } from './components/icons'
import { useParticipants, useProjectAllocation, useFileUpload, useDocumentGeneration } from './composables'

const text4Content = ref('目前iOS版本和 Android均已上线并完成测试验收。')

const {
  participants,
  selectedFirstParticipant,
  newParticipant,
  otherParticipants,
  firstParticipant,
  addParticipant,
  removeParticipant
} = useParticipants()

const {
  projectAllocations,
  initProjectAllocation,
  reinitAllProjects,
  removeAllocation,
  resetAllocations,
  getSecondaryTotal,
  getPrimaryAmount,
  getSelectedSecondaryCount,
  isProjectValid,
  createIsAllProjectsValid,
  createValidProjectCount,
  getParticipantTotalAmount
} = useProjectAllocation(otherParticipants)

const {
  fileList,
  totalProjectAmount,
  isDisabled,
  handleFileChange: onFileChange,
  handleFileRemove: onFileRemove,
  resetFiles
} = useFileUpload(initProjectAllocation)

const { isGenerating, generateDocuments } = useDocumentGeneration()

const isAllProjectsValid = createIsAllProjectsValid(fileList)
const validProjectCount = createValidProjectCount(fileList)

const getParticipantTotal = (code) => getParticipantTotalAmount(code, fileList.value, selectedFirstParticipant.value)
const handleFileRemove = (file) => onFileRemove(file, removeAllocation, resetAll)
const reinitProjects = () => reinitAllProjects(fileList.value)

const onFirstParticipantChange = (value) => {
  selectedFirstParticipant.value = value
  reinitProjects()
}

const resetAll = () => {
  resetFiles()
  resetAllocations()
}

const confirmAllocation = async () => {
  if (!isAllProjectsValid.value) {
    ElMessage.error('请确保每个项目至少有2个次要参与者，且金额分配正确')
    return
  }

  await generateDocuments({
    fileList: fileList.value,
    projectAllocations: projectAllocations.value,
    participants: participants.value,
    selectedFirstParticipant: selectedFirstParticipant.value,
    text4Content: text4Content.value,
    getPrimaryAmount,
    onSuccess: resetAll
  })
}
</script>

<style>
@import './styles/index.css';
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  padding-bottom: var(--spacing-2xl);
}

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

.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--spacing-xl);
}

/* 固定浮动汇总面板 */
.floating-summary {
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-md);
  min-width: 180px;
  max-width: 240px;
  z-index: 100;
}

.floating-summary .summary-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: var(--font-heading);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-sm);
}

.floating-summary .summary-icon {
  width: 14px;
  height: 14px;
  color: var(--color-primary);
}

.floating-summary .summary-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.floating-summary .summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
}

.floating-summary .summary-item.item-primary {
  background: var(--color-primary-light);
}

.floating-summary .summary-name {
  color: var(--color-text);
  font-weight: 500;
}

.floating-summary .summary-amount {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--color-success);
}

.config-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease-out;
}

.config-card:hover {
  box-shadow: var(--shadow-md);
}

.card-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.config-section {
  margin-bottom: var(--spacing-xl);
}

.config-section:last-of-type {
  margin-bottom: 0;
}

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

.section-title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.content-textarea :deep(.el-textarea__inner) {
  font-family: var(--font-body);
  font-size: 0.875rem;
}

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

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
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

  .action-buttons {
    flex-direction: column-reverse;
  }

  .action-buttons button {
    width: 100%;
  }

  .floating-summary {
    bottom: var(--spacing-md);
    right: var(--spacing-md);
    left: var(--spacing-md);
    max-width: none;
  }
}
</style>
