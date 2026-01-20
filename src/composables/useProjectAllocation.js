import { ref, computed } from 'vue'

export function useProjectAllocation(otherParticipants) {
  const projectAllocations = ref({})

  const initProjectAllocation = (fileUid, projectName, totalAmount) => {
    const secondary = {}
    otherParticipants.value.forEach(p => { secondary[p.code] = { selected: false, amount: 100 } })
    projectAllocations.value[fileUid] = { projectName, totalAmount, secondary }
  }

  const reinitAllProjects = (fileList) => {
    const newAllocations = {}
    fileList.forEach(file => {
      const old = projectAllocations.value[file.uid]
      if (old) {
        const secondary = {}
        otherParticipants.value.forEach(p => { secondary[p.code] = old.secondary[p.code] || { selected: false, amount: 100 } })
        newAllocations[file.uid] = { ...old, secondary }
      }
    })
    projectAllocations.value = newAllocations
  }

  const removeAllocation = (fileUid) => { delete projectAllocations.value[fileUid] }
  const resetAllocations = () => { projectAllocations.value = {} }

  const getSecondaryTotal = (fileUid) => {
    const alloc = projectAllocations.value[fileUid]
    return alloc ? Object.values(alloc.secondary).filter(s => s.selected).reduce((sum, s) => sum + (s.amount || 0), 0) : 0
  }

  const getPrimaryAmount = (fileUid) => {
    const alloc = projectAllocations.value[fileUid]
    return alloc ? alloc.totalAmount - getSecondaryTotal(fileUid) : 0
  }

  const getSelectedSecondaryCount = (fileUid) => {
    const alloc = projectAllocations.value[fileUid]
    return alloc ? Object.values(alloc.secondary).filter(s => s.selected).length : 0
  }

  const isProjectValid = (fileUid) => getSelectedSecondaryCount(fileUid) >= 2 && getPrimaryAmount(fileUid) >= 0

  const createIsAllProjectsValid = (fileList) => computed(() =>
    fileList.value.length > 0 && fileList.value.every(file => isProjectValid(file.uid))
  )

  const createValidProjectCount = (fileList) => computed(() =>
    fileList.value.filter(file => isProjectValid(file.uid)).length
  )

  const getParticipantTotalAmount = (participantCode, fileList, selectedFirstParticipant) => {
    let total = 0
    fileList.forEach(file => {
      const alloc = projectAllocations.value[file.uid]
      if (!alloc) return
      if (participantCode === selectedFirstParticipant) {
        total += getPrimaryAmount(file.uid)
      } else {
        const sec = alloc.secondary[participantCode]
        if (sec?.selected) total += sec.amount || 0
      }
    })
    return total
  }

  return {
    projectAllocations, initProjectAllocation, reinitAllProjects, removeAllocation, resetAllocations,
    getSecondaryTotal, getPrimaryAmount, getSelectedSecondaryCount, isProjectValid,
    createIsAllProjectsValid, createValidProjectCount, getParticipantTotalAmount
  }
}
