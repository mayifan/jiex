<template>
  <div class="document-preview" v-if="previewData">
    <div class="preview-container">
      <!-- A4 纸张效果 -->
      <div class="paper-wrapper">
        <div class="paper" ref="paperRef">
          <!-- 页眉 -->
          <div class="paper-header">
            <div class="header-line"></div>
            <div class="header-title">项目结项单</div>
            <div class="header-line"></div>
          </div>

          <!-- 基本信息 -->
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">项目编号：</span>
              <span class="info-value info-underline">{{ previewData.text1 || '' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">项目名称：</span>
              <span class="info-value info-underline">{{ previewData.text3 || '' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">项目周期：</span>
              <span class="info-value info-underline">{{ previewData.text2 || '' }}</span>
            </div>
          </div>

          <!-- 完成情况 -->
          <div class="content-section">
            <div class="content-label">项目完成情况：</div>
            <div class="content-box">{{ previewData.text4 || '' }}</div>
          </div>

          <!-- 参与人员表格 -->
          <div class="table-section">
            <div class="table-label">参与人员及金额分配：</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-seq">序号</th>
                  <th class="col-name">姓名</th>
                  <th class="col-code">工号</th>
                  <th class="col-amount">金额（元）</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, index) in previewData.participants" :key="index">
                  <td class="col-seq">{{ index + 1 }}</td>
                  <td class="col-name">{{ p.name || '' }}</td>
                  <td class="col-code">{{ p.code || '' }}</td>
                  <td class="col-amount">{{ p.amount ?? '' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3" class="total-label">合 计</td>
                  <td class="col-amount total-value">{{ previewData.totalAmount }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- 签字区域 -->
          <div class="sign-section">
            <div class="sign-row">
              <div class="sign-item">
                <span class="sign-label">项目负责人：</span>
                <span class="sign-line"></span>
              </div>
              <div class="sign-item">
                <span class="sign-label">日期：</span>
                <span class="sign-line sign-date"></span>
              </div>
            </div>
            <div class="sign-row">
              <div class="sign-item">
                <span class="sign-label">部门负责人：</span>
                <span class="sign-line"></span>
              </div>
              <div class="sign-item">
                <span class="sign-label">日期：</span>
                <span class="sign-line sign-date"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 状态提示 -->
      <div class="status-bar" :class="previewData.isValid ? 'status-success' : 'status-warning'">
        <span class="status-dot"></span>
        <span>{{ previewData.isValid ? '配置完成，可生成文档' : '请完成右侧配置' }}</span>
      </div>
    </div>
  </div>

  <div class="preview-empty" v-else>
    <div class="empty-paper">
      <IconDocument class="empty-icon" />
    </div>
    <p class="empty-title">结项单预览</p>
    <p class="empty-hint">展开右侧项目卡片查看预览</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconDocument } from '../icons'

defineProps({
  previewData: {
    type: Object,
    default: null
  }
})

const paperRef = ref(null)
</script>

<style scoped>
.document-preview {
  background: #525659;
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-lg);
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.paper-wrapper {
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.paper {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 210 / 297;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  padding: 24px;
  font-family: "SimSun", "宋体", serif;
  font-size: 11px;
  line-height: 1.6;
  color: #000;
  display: flex;
  flex-direction: column;
}

/* 页眉 */
.paper-header {
  text-align: center;
  margin-bottom: 16px;
}

.header-line {
  height: 2px;
  background: #000;
  margin: 4px 0;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 8px;
  padding: 8px 0;
}

/* 基本信息 */
.info-section {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.info-label {
  flex-shrink: 0;
  font-weight: 500;
}

.info-value {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.info-underline {
  border-bottom: 1px solid #000;
  padding-bottom: 2px;
  min-height: 16px;
}

/* 完成情况 */
.content-section {
  margin-bottom: 12px;
}

.content-label {
  font-weight: 500;
  margin-bottom: 4px;
}

.content-box {
  border: 1px solid #000;
  padding: 8px;
  min-height: 48px;
  font-size: 10px;
  line-height: 1.5;
}

/* 表格 */
.table-section {
  margin-bottom: 12px;
  flex: 1;
}

.table-label {
  font-weight: 500;
  margin-bottom: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.data-table th,
.data-table td {
  border: 1px solid #000;
  padding: 6px 4px;
  text-align: center;
}

.data-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.col-seq { width: 15%; }
.col-name { width: 25%; }
.col-code { width: 30%; }
.col-amount { width: 30%; text-align: right; padding-right: 8px !important; }

.total-row {
  font-weight: 600;
}

.total-label {
  text-align: right;
  padding-right: 8px !important;
}

.total-value {
  background: #fffbe6;
}

/* 签字区域 */
.sign-section {
  margin-top: auto;
  padding-top: 12px;
}

.sign-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sign-item {
  display: flex;
  align-items: baseline;
}

.sign-label {
  flex-shrink: 0;
  font-size: 10px;
}

.sign-line {
  width: 80px;
  border-bottom: 1px solid #000;
}

.sign-date {
  width: 100px;
}

/* 状态栏 */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-family: var(--font-body);
}

.status-success {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* 空状态 */
.preview-empty {
  background: #525659;
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  text-align: center;
}

.empty-paper {
  width: 120px;
  aspect-ratio: 210 / 297;
  background: white;
  margin: 0 auto var(--spacing-md);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: #e5e7eb;
}

.empty-title {
  font-family: var(--font-heading);
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}
</style>
