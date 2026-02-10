import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'

export function useDocumentGeneration() {
  const isGenerating = ref(false)

  const expandParticipantRows = (templateArrayBuffer, participantCount) => {
    const zip = new PizZip(templateArrayBuffer)
    if (participantCount <= 3) return zip

    const documentXmlPath = 'word/document.xml'
    const xmlFile = zip.file(documentXmlPath)
    if (!xmlFile) return zip

    let xml = xmlFile.asText()
    const marker = '{name3}'
    const markerIndex = xml.indexOf(marker)
    if (markerIndex === -1) return zip

    const rowOpenTagRegex = /<w:tr(?:\s[^>]*)?>/g
    let rowStart = -1
    let rowMatch = rowOpenTagRegex.exec(xml)
    while (rowMatch && rowMatch.index < markerIndex) {
      rowStart = rowMatch.index
      rowMatch = rowOpenTagRegex.exec(xml)
    }

    const rowEnd = xml.indexOf('</w:tr>', markerIndex)
    if (rowStart === -1 || rowEnd === -1) return zip

    const rowTemplate = xml.slice(rowStart, rowEnd + '</w:tr>'.length)
    let extraRows = ''

    for (let i = 4; i <= participantCount; i += 1) {
      const row = rowTemplate
        .replaceAll('{name3}', `{name${i}}`)
        .replaceAll('{code3}', `{code${i}}`)
        .replaceAll('{amount3}', `{amount${i}}`)
        .replaceAll('{job3}', `{job${i}}`)
        .replace('<w:t>3</w:t>', `<w:t>${i}</w:t>`)

      extraRows += row
    }

    xml = `${xml.slice(0, rowEnd + '</w:tr>'.length)}${extraRows}${xml.slice(rowEnd + '</w:tr>'.length)}`
    zip.file(documentXmlPath, xml)
    return zip
  }

  const buildTemplateData = ({ text1, text2, text3, text4Content, jobContents, projectParticipants }) => {
    const data = { text1, text2, text3, text4: text4Content }

    const resolveJob = (index) => {
      const input = (jobContents?.[`job${index}`] || '').trim()
      const fallback = index === 1 ? '开发' : '协助开发'
      return input || fallback
    }

    projectParticipants.forEach((participant, index) => {
      const n = index + 1
      data[`name${n}`] = participant?.name || ''
      data[`code${n}`] = participant?.code || ''
      data[`amount${n}`] = participant?.amount ?? ''
      data[`job${n}`] = resolveJob(n)
    })

    return data
  }

  const generateDocuments = async ({ fileList, projectAllocations, participants, selectedFirstParticipant, text4Content, jobContents, getPrimaryAmount, onSuccess }) => {
    isGenerating.value = true
    try {
      const firstParticipant = participants.find(p => p.code === selectedFirstParticipant)
      if (!firstParticipant) throw new Error('未找到主要参与者，请重新选择')
      const participantMap = new Map(participants.map((participant) => [participant.code, participant]))

      const zip = new JSZip()
      const generatedFiles = []
      const response = await fetch('/template.docx')
      if (!response.ok) throw new Error(`模板文件获取失败: ${response.status}`)
      const templateArrayBuffer = await response.arrayBuffer()

      for (const file of fileList) {
        const alloc = projectAllocations[file.uid]
        const selectedSecondary = Object.entries(alloc.secondary)
          .filter(([, data]) => data.selected)
          .map(([code, data]) => {
            const participant = participantMap.get(code)
            return participant ? { ...participant, amount: data.amount } : null
          })
          .filter(Boolean)

        if (selectedSecondary.length < 2) {
          ElMessage.error(`项目 ${alloc.projectName} 需要至少2个次要参与者`)
          return false
        }

        const wb = XLSX.read(await file.raw.arrayBuffer())
        const ws = wb.Sheets[wb.SheetNames[0]]
        const [text1, text2, text3] = [ws['D1']?.v || '', ws['B6']?.v || '', ws['B4']?.v || '']
        const primaryAmount = getPrimaryAmount(file.uid)
        const projectParticipants = [{ ...firstParticipant, amount: primaryAmount }, ...selectedSecondary]

        const templateZip = expandParticipantRows(templateArrayBuffer, projectParticipants.length)
        const doc = new Docxtemplater(templateZip, { paragraphLoop: true, linebreaks: true })
        doc.render(buildTemplateData({ text1, text2, text3, text4Content, jobContents, projectParticipants }))

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
