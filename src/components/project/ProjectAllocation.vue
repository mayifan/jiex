<template>
  <div class="project-allocation">
    <div class="section-header">
      <div class="header-left">
        <IconCurrency class="header-icon" />
        <h3 class="section-title">项目金额分配</h3>
      </div>
      <span class="section-badge" v-if="fileList.length > 0">至少选择2个次要参与者</span>
    </div>

    <div class="projects-container" v-if="fileList.length > 0">
      <div
        v-for="file in fileList"
        :key="file.uid"
        class="project-item"
        :class="{ 'project-valid': isProjectValid(file.uid), 'project-invalid': !isProjectValid(file.uid) }"
      >
        <div class="project-header" @click="toggleCollapse(file.uid)">
          <div class="project-info">
            <h4 class="project-name">{{ projectAllocations[file.uid]?.projectName || '加载中...' }}</h4>
            <div class="project-meta">
              <span class="meta-item">
                <IconMoney class="meta-icon" />
                ¥{{ projectAllocations[file.uid]?.totalAmount || 0 }}
              </span>
              <span class="status-dot" :class="isProjectValid(file.uid) ? 'dot-success' : 'dot-error'"></span>
              <span class="status-text" :class="isProjectValid(file.uid) ? 'text-success' : 'text-error'">
                {{ isProjectValid(file.uid) ? '已配置' : '未完成' }}
              </span>
            </div>
          </div>
          <div class="collapse-toggle">
            <IconChevron class="collapse-icon" :class="{ 'icon-collapsed': isCollapsed(file.uid) }" />
          </div>
        </div>

        <Transition name="collapse">
          <div class="project-body" v-show="!isCollapsed(file.uid)">
          <div class="allocation-row primary-row">
            <div class="row-label">
              <IconUser class="label-icon" />
              <span>主要参与者</span>
            </div>
            <div class="row-content">
              <span class="participant-name">
                {{ firstParticipant?.name }}
                <span class="participant-code">({{ selectedFirstParticipant }})</span>
              </span>
              <span class="amount-badge" :class="{ 'badge-error': getPrimaryAmount(file.uid) < 0 }">
                ¥{{ getPrimaryAmount(file.uid) }}
              </span>
            </div>
          </div>

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
                :class="{ 'item-selected': projectAllocations[file.uid]?.secondary[p.code]?.selected }"
              >
                <el-checkbox
                  v-model="projectAllocations[file.uid].secondary[p.code].selected"
                  :disabled="disabled"
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
                    :disabled="!projectAllocations[file.uid]?.secondary[p.code]?.selected"
                    controls-position="right"
                    size="small"
                  />
                  <span class="input-suffix">元</span>
                </div>
              </div>
            </div>
          </div>

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
        </Transition>
      </div>
    </div>

    <div class="empty-state" v-else>
      <IconFile class="empty-icon" />
      <p class="empty-text">请先上传 Excel 文件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { IconCurrency, IconMoney, IconUser, IconFile, IconChevron } from '../icons'

const props = defineProps({
  fileList: { type: Array, required: true },
  projectAllocations: { type: Object, required: true },
  otherParticipants: { type: Array, required: true },
  firstParticipant: { type: Object, default: null },
  selectedFirstParticipant: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  isProjectValid: { type: Function, required: true },
  getPrimaryAmount: { type: Function, required: true },
  getSecondaryTotal: { type: Function, required: true },
  getSelectedSecondaryCount: { type: Function, required: true }
})

const collapsedProjects = ref({})
const isCollapsed = (uid) => collapsedProjects.value[uid] ?? true
const toggleCollapse = (uid) => { collapsedProjects.value[uid] = !isCollapsed(uid) }

watch(() => props.fileList, (list) => {
  list.forEach(file => {
    if (!(file.uid in collapsedProjects.value)) collapsedProjects.value[file.uid] = true
  })
}, { immediate: true })
</script>

<style scoped>
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

.section-badge {
  background: var(--color-warning-light);
  color: var(--color-warning);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
}

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: white;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s ease-out;
}

.project-header:hover {
  background: var(--color-bg);
}

.project-item.project-collapsed .project-header {
  border-bottom: none;
}

.collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease-out;
}

.collapse-toggle:hover {
  background: var(--color-border);
}

.collapse-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-muted);
  transition: transform 0.3s ease-out;
}

.icon-collapsed {
  transform: rotate(-90deg);
}

/* 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 1000px;
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

.text-success {
  color: var(--color-success) !important;
}

.text-error {
  color: var(--color-error) !important;
}

.project-body {
  padding: var(--spacing-lg);
}

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

@media (max-width: 768px) {
  .secondary-item {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .amount-input-group {
    justify-content: space-between;
  }
}
</style>
