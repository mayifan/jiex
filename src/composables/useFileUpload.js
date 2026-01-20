import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

export function useFileUpload(initProjectAllocation) {
  const fileList = ref([])
  const projectAmounts = ref({})

  const totalProjectAmount = computed(() => Object.values(projectAmounts.value).reduce((sum, val) => sum + (val || 0), 0))
  const isDisabled = computed(() => fileList.value.length === 0)

  const handleFileChange = async (uploadFile) => {
    if (!uploadFile.raw.name.match(/\.(xlsx|xls)$/i)) {
      return ElMessage.error('请上传Excel文件'), false
    }
    try {
      const arrayBuffer = await uploadFile.raw.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const ws = workbook.Sheets[workbook.SheetNames[0]]
      const amountValue = ws['C17']?.v || ws['C18']?.v || 0
      const amount = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue) || 0
      const projectName = ws['B4']?.v || '未命名项目'

      fileList.value.push(uploadFile)
      projectAmounts.value[uploadFile.uid] = amount
      initProjectAllocation?.(uploadFile.uid, projectName, amount)
      ElMessage.success(`已读取项目: ${projectName}，金额: ${amount} 元`)
      return true
    } catch (error) {
      console.error('读取Excel失败:', error)
      return ElMessage.error('读取Excel文件失败'), false
    }
  }

  const handleFileRemove = (file, removeAllocation, onEmpty) => {
    fileList.value = fileList.value.filter(f => f.uid !== file.uid)
    delete projectAmounts.value[file.uid]
    removeAllocation?.(file.uid)
    if (fileList.value.length === 0) onEmpty?.()
  }

  const resetFiles = () => {
    fileList.value = []
    projectAmounts.value = {}
  }

  return { fileList, projectAmounts, totalProjectAmount, isDisabled, handleFileChange, handleFileRemove, resetFiles }
}
