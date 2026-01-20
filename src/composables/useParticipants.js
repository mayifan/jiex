import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

export function useParticipants() {
  const participants = ref([
    { name: '马一帆', code: 'SFD17221' },
    { name: '刘纪甲', code: 'SDF21054' },
    { name: '丁少康', code: 'SFD16940' },
    { name: '王鹏', code: 'SFD21724' },
    { name: '盛泉铭', code: 'SFD22678' },
    { name: '刘仲', code: 'SFD16963' },
    { name: '陈瑞垟', code: 'SFD21730' },
    { name: '何佳飞', code: 'SFD23771' }
  ])

  const selectedFirstParticipant = ref('SFD17221')
  const newParticipant = ref({ name: '', code: '' })

  const otherParticipants = computed(() => participants.value.filter(p => p.code !== selectedFirstParticipant.value))
  const firstParticipant = computed(() => participants.value.find(p => p.code === selectedFirstParticipant.value))

  const addParticipant = (onSuccess) => {
    const { name, code } = newParticipant.value
    if (!name || !code) return ElMessage.error('请输入参与者姓名和工号'), false
    if (participants.value.some(p => p.code === code)) return ElMessage.error('该工号已存在'), false
    participants.value.push({ name, code })
    newParticipant.value = { name: '', code: '' }
    ElMessage.success('参与者添加成功')
    onSuccess?.()
    return true
  }

  const removeParticipant = (code, onSuccess) => {
    if (participants.value.length <= 2) return ElMessage.error('至少需要保留2个参与者'), false
    if (code === selectedFirstParticipant.value) return ElMessage.error('不能删除当前的第一参与者'), false
    participants.value = participants.value.filter(p => p.code !== code)
    ElMessage.success('已删除')
    onSuccess?.()
    return true
  }

  return {
    participants, selectedFirstParticipant, newParticipant,
    otherParticipants, firstParticipant,
    addParticipant, removeParticipant
  }
}
