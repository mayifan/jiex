<template>
  <section class="upload-card">
    <div class="card-header">
      <div class="header-left">
        <IconFile class="header-icon" />
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
        :on-change="(file) => emit('change', file)"
        :on-remove="(file) => emit('remove', file)"
        :file-list="fileList"
      >
        <div class="upload-inner">
          <IconUpload class="upload-icon" />
          <p class="upload-title">拖拽文件到此处上传</p>
          <p class="upload-subtitle">或点击选择Excel文件</p>
          <p class="upload-hint">支持 .xlsx 和 .xls 格式，可同时上传多个文件</p>
        </div>
      </el-upload>
    </div>

    <div class="stats-row" v-if="fileList.length > 0">
      <div class="stat-item">
        <div class="stat-icon stat-icon-primary">
          <IconDocument />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ fileList.length }}</div>
          <div class="stat-label">项目总数</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon stat-icon-success">
          <IconCurrency />
        </div>
        <div class="stat-content">
          <div class="stat-value">¥{{ totalAmount }}</div>
          <div class="stat-label">总金额</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon" :class="validCount === fileList.length ? 'stat-icon-success' : 'stat-icon-warning'">
          <IconCheck />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ validCount }}/{{ fileList.length }}</div>
          <div class="stat-label">已配置</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { IconFile, IconUpload, IconDocument, IconCurrency, IconCheck } from '../icons'

defineProps({
  fileList: { type: Array, required: true },
  totalAmount: { type: Number, default: 0 },
  validCount: { type: Number, default: 0 }
})

const emit = defineEmits(['change', 'remove'])
</script>

<style scoped>
.upload-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease-out;
}

.upload-card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
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

.card-title {
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
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
