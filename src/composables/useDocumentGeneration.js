import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'

export function useDocumentGeneration() {
  const isGenerating = ref(false)

  const generateDocuments = async ({ fileList, projectAllocations, participants, selectedFirstParticipant, text4Content, getPrimaryAmount, onSuccess }) => {
    isGenerating.value = true
    try {
      const firstParticipant = participants.find(p => p.code === selectedFirstParticipant)
      const zip = new JSZip()
      const generatedFiles = []

      for (const file of fileList) {
        const alloc = projectAllocations[file.uid]
        const selectedSecondary = Object.entries(alloc.secondary)
          .filter(([, data]) => data.selected)
          .map(([code, data]) => ({ ...participants.find(p => p.code === code), amount: data.amount }))

        if (selectedSecondary.length < 2) {
          ElMessage.error(`项目 ${alloc.projectName} 需要至少2个次要参与者`)
          isGenerating.value = false
          return false
        }

        const wb = XLSX.read(await file.raw.arrayBuffer())
        const ws = wb.Sheets[wb.SheetNames[0]]
        const [text1, text2, text3] = [ws['D1']?.v || '', ws['B6']?.v || '', ws['B4']?.v || '']
        const primaryAmount = getPrimaryAmount(file.uid)
        const projectParticipants = [{ ...firstParticipant, amount: primaryAmount }, selectedSecondary[0], selectedSecondary[1]]

        const response = await fetch('/template.docx')
        if (!response.ok) throw new Error(`模板文件获取失败: ${response.status}`)

        const doc = new Docxtemplater(new PizZip(await response.arrayBuffer()), { paragraphLoop: true, linebreaks: true })
        doc.render({
          text1, text2, text3, text4: text4Content,
          name1: projectParticipants[0].name, code1: projectParticipants[0].code, amount1: projectParticipants[0].amount,
          name2: projectParticipants[1].name, code2: projectParticipants[1].code, amount2: projectParticipants[1].amount,
          name3: projectParticipants[2].name, code3: projectParticipants[2].code, amount3: projectParticipants[2].amount,
        })

        generatedFiles.push({
          name: `${text3 || '未命名'}.docx`,
          content: doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
        })
      }

      generatedFiles.forEach(f => zip.file(f.name, f.content))
      const link = document.createElement('a')
      link.href = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }))
      link.download = '生成的文档.zip'
      link.click()
      URL.revokeObjectURL(link.href)

      ElMessage.success(`成功生成 ${generatedFiles.length} 个文档`)
      onSuccess?.()
      return true
    } catch (error) {
      console.error('处理文件时出错：', error)
      ElMessage.error(`处理失败：${error.message}`)
      return false
    } finally {
      isGenerating.value = false
    }
  }

  return { isGenerating, generateDocuments }
}
