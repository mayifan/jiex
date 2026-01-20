<template>
  <div class="participant-manager">
    <div class="section-header">
      <div class="header-left">
        <IconUsers class="header-icon" />
        <h3 class="section-title">参与者管理</h3>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">主要参与者 <span class="label-hint">（金额从Excel C17或C18读取）</span></label>
      <el-select
        :model-value="selectedFirstParticipant"
        placeholder="选择主要参与者"
        :disabled="disabled"
        @update:model-value="$emit('update:selectedFirstParticipant', $event)"
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

    <div class="form-group">
      <label class="form-label">添加参与者</label>
      <div class="add-participant-row">
        <el-input
          :model-value="newParticipant.name"
          placeholder="姓名"
          :disabled="disabled"
          @update:model-value="$emit('update:newParticipantName', $event)"
        />
        <el-input
          :model-value="newParticipant.code"
          placeholder="工号"
          :disabled="disabled"
          @update:model-value="$emit('update:newParticipantCode', $event)"
        />
        <el-button
          type="primary"
          @click="$emit('add')"
          :disabled="disabled"
          class="add-btn"
        >
          <IconPlus class="btn-icon" />
          添加
        </el-button>
      </div>
    </div>

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
        <span class="chip-amount">¥{{ getParticipantTotal(p.code) }}</span>
        <span v-if="p.code === selectedFirstParticipant" class="chip-badge">主要</span>
        <button
          v-else-if="participants.length > 2"
          @click="$emit('remove', p.code)"
          class="chip-remove"
        >
          <IconClose />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconUsers, IconPlus, IconClose } from '../icons'

defineProps({
  participants: { type: Array, required: true },
  selectedFirstParticipant: { type: String, required: true },
  newParticipant: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  getParticipantTotal: { type: Function, default: () => 0 }
})

defineEmits([
  'update:selectedFirstParticipant',
  'update:newParticipantName',
  'update:newParticipantCode',
  'add',
  'remove'
])
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

.chip-amount {
  font-family: var(--font-heading);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-success);
  background: var(--color-success-light);
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
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

@media (max-width: 768px) {
  .add-participant-row {
    grid-template-columns: 1fr;
  }
}
</style>
