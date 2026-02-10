import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const PARTICIPANT_STORAGE_KEY = 'keeson-participants-v1'

const defaultParticipants = [
  { name: '马一帆', code: 'SFD17221' },
  { name: '刘纪甲', code: 'SDF21054' },
  { name: '丁少康', code: 'SFD16940' },
  { name: '王鹏', code: 'SFD21724' },
  { name: '盛泉铭', code: 'SFD22678' },
  { name: '刘仲', code: 'SFD16963' },
  { name: '陈瑞垟', code: 'SFD21730' },
  { name: '何佳飞', code: 'SFD23771' }
]

const defaultFirstParticipantCode = defaultParticipants[0].code

const sanitizeParticipants = (list) => {
  if (!Array.isArray(list)) return []

  const seenCodes = new Set()
  return list
    .map((participant) => ({
      name: String(participant?.name || '').trim(),
      code: String(participant?.code || '').trim()
    }))
    .filter((participant) => participant.name && participant.code)
    .filter((participant) => {
      if (seenCodes.has(participant.code)) return false
      seenCodes.add(participant.code)
      return true
    })
}

const loadParticipantState = () => {
  try {
    const raw = localStorage.getItem(PARTICIPANT_STORAGE_KEY)
    if (!raw) {
      return {
        participants: defaultParticipants,
        selectedFirstParticipant: defaultFirstParticipantCode
      }
    }

    const parsed = JSON.parse(raw)
    const participants = sanitizeParticipants(parsed?.participants)
    const normalizedParticipants = participants.length >= 2 ? participants : defaultParticipants

    const savedFirstCode = String(parsed?.selectedFirstParticipant || '').trim()
    const selectedFirstParticipant = normalizedParticipants.some((participant) => participant.code === savedFirstCode)
      ? savedFirstCode
      : normalizedParticipants[0].code

    return {
      participants: normalizedParticipants,
      selectedFirstParticipant
    }
  } catch {
    return {
      participants: defaultParticipants,
      selectedFirstParticipant: defaultFirstParticipantCode
    }
  }
}

const persistParticipantState = (participants, selectedFirstParticipant) => {
  try {
    localStorage.setItem(
      PARTICIPANT_STORAGE_KEY,
      JSON.stringify({
        participants,
        selectedFirstParticipant
      })
    )
  } catch {
    // Ignore persistence failures (e.g. storage quota/full private mode).
  }
}

export function useParticipants() {
  const cachedState = loadParticipantState()
  const participants = ref(cachedState.participants)
  const selectedFirstParticipant = ref(cachedState.selectedFirstParticipant)
  const newParticipant = ref({ name: '', code: '' })

  const otherParticipants = computed(() => participants.value.filter((participant) => participant.code !== selectedFirstParticipant.value))
  const firstParticipant = computed(() => participants.value.find((participant) => participant.code === selectedFirstParticipant.value))

  watch(
    [participants, selectedFirstParticipant],
    () => {
      persistParticipantState(participants.value, selectedFirstParticipant.value)
    },
    { deep: true }
  )

  const fail = (message) => {
    ElMessage.error(message)
    return false
  }

  const addParticipant = (onSuccess) => {
    const name = String(newParticipant.value.name || '').trim()
    const code = String(newParticipant.value.code || '').trim()

    if (!name || !code) return fail('请输入参与者姓名和工号')
    if (participants.value.some((participant) => participant.code === code)) return fail('该工号已存在')

    participants.value.push({ name, code })
    newParticipant.value = { name: '', code: '' }
    ElMessage.success('参与者添加成功')
    onSuccess?.()
    return true
  }

  const removeParticipant = (code, onSuccess) => {
    if (participants.value.length <= 2) return fail('至少需要保留2个参与者')
    if (code === selectedFirstParticipant.value) return fail('不能删除当前的第一参与者')

    participants.value = participants.value.filter((participant) => participant.code !== code)
    ElMessage.success('已删除')
    onSuccess?.()
    return true
  }

  return {
    participants,
    selectedFirstParticipant,
    newParticipant,
    otherParticipants,
    firstParticipant,
    addParticipant,
    removeParticipant
  }
}
