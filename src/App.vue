<template>
  <div class="container">
    <el-upload
      class="upload-demo"
      drag
      multiple
      :auto-upload="false"
      accept=".xlsx,.xls"
      :on-change="handleFileChange"
      :file-list="fileList"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        拖拽文件到此处或 <em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          请上传Excel文件，支持.xlsx和.xls格式
        </div>
      </template>
    </el-upload>

    <el-button
      type="primary"
      :disabled="fileList.length === 0"
      @click="processFiles"
      class="process-btn"
    >
      开始处理
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import JSZip from 'jszip'

const fileList = ref([])

const handleFileChange = (uploadFile) => {
  if (!uploadFile.raw.name.match(/\.(xlsx|xls)$/i)) {
    ElMessage.error('请上传Excel文件！')
    return false
  }
  fileList.value.push(uploadFile)
  return true
}

const processFiles = async () => {
  try {
    const zip = new JSZip()
    const generatedFiles = []

    for (const file of fileList.value) {
      console.log('开始处理文件:', file.raw.name)
      const arrayBuffer = await file.raw.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]

      // 读取指定单元格的值
      const text1 = worksheet['D1']?.v || ''
      const text2 = worksheet['B6']?.v || ''
      const text3 = worksheet['B4']?.v || ''

      console.log('从Excel读取的数据:', { text1, text2, text3 })

      // 获取模板文件
      const response = await fetch('/template.docx')
      if (!response.ok) {
        throw new Error(`模板文件获取失败: ${response.status} ${response.statusText}`)
      }
      const templateArrayBuffer = await response.arrayBuffer()
      console.log('模板文件获取成功，大小:', templateArrayBuffer.byteLength, '字节')

      // 创建新的Word文档
      const docZip = new PizZip(templateArrayBuffer)
      const doc = new Docxtemplater(docZip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [
          {
            name: 'alignment',
            set(options) {
              if (options.tag === 'text2') {
                options.scope._paragraph = {
                  alignment: 'left'
                };
              }
              return null;
            }
          }
        ]
      });

      // 替换模板中的文本
      const data = {
        text1: text1,
        text2: text2,
        text3: text3,
      }
      console.log('准备替换的数据:', data)

      doc.render(data)

      // 生成新文档
      const content = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      const fileName = `${text3 || '未命名'}.docx`
      generatedFiles.push({ name: fileName, content })
      console.log('文档生成成功:', fileName)
    }

    // 将所有生成的文件添加到压缩包
    for (const file of generatedFiles) {
      zip.file(file.name, file.content)
    }

    // 生成压缩包
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    console.log('压缩包生成成功，大小:', zipBlob.size, '字节')

    // 下载压缩包
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(zipBlob)
    downloadLink.download = '生成的文档.zip'
    downloadLink.click()
    URL.revokeObjectURL(downloadLink.href)
    console.log('压缩包下载链接已创建')

    ElMessage.success('文件处理完成！')
    fileList.value = []
  } catch (error) {
    console.error('处理文件时出错：', error)
    ElMessage.error(`处理文件时出错：${error.message}`)
  }
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

.process-btn {
  margin-top: 20px;
  width: 100%;
}

.upload-demo {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  padding: 20px;
}
</style>