<template>
  <nav class="app-nav">
    <div class="nav-container">
      <div class="nav-brand">
        <IconDocument class="brand-icon" />
        <span class="brand-text">Keeson 结项工具</span>
        <span class="brand-badge">PRO</span>
      </div>
      <div class="nav-stats" v-if="fileCount > 0">
        <div class="nav-stat-item">
          <span class="stat-label">项目数</span>
          <span class="stat-value">{{ fileCount }}</span>
        </div>
        <div class="nav-stat-item">
          <span class="stat-label">已配置</span>
          <span class="stat-value" :class="{ 'text-success': validCount === fileCount, 'text-warning': validCount < fileCount }">
            {{ validCount }}/{{ fileCount }}
          </span>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { IconDocument } from '../icons'

defineProps({
  fileCount: {
    type: Number,
    default: 0
  },
  validCount: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
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

@media (max-width: 1024px) {
  .nav-stats {
    display: none;
  }
}

@media (max-width: 768px) {
  .nav-container {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }
}
</style>
