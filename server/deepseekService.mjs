const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

const SPECIAL_PROJECT_KEYWORD = '国外设备售后及参数调整'
const SPECIAL_PROJECT_CONTENT = `每月处理国外售后反馈的异常问题，如睡眠报告不准、睡眠报告不出、打鼾误干预、打鼾不干预、闹钟触发不抬起、一键入眠无报告、传感器无数据上报等一系列问题，需要对用户的操作、设备的信息、睡眠报告等进行分析，并给出解决方案。
1.使用售后系统对设备进行参数调整，打鼾干预参数、放大倍率、工作模式、打鼾干预抬起速率；
2.使用PlotLV工具进行分析睡眠报告的离床参数，可以针对睡眠报告不准的问题进行解决；
3.使用数据导出工具，对设备一整晚的睡眠报告详细数据进行导出，可以分析体动、打鼾包数据量是否准确。
目前iOS版本和 Android均已上线并完成测试验收。
特此申请项目奖励，请领导批示！”`

const FALLBACK_ITEMS = [
  '适配新床型遥控能力，完成基础连接与控制链路打通。',
  '根据后端接口动态绘制遥控界面，确保按键和指令映射准确。',
  '新增床型配置时保持兼容，不影响现有床型功能稳定性。',
  '适配主控反馈协议，覆盖按摩、灯控等核心状态回传。'
]

const ensureSentence = (value = '') => {
  const content = String(value).trim().replace(/[。！？；,，]+$/g, '')
  return content ? `${content}。` : ''
}

const normalizeSummary = (summary, projectName) => {
  const fallback = `新增${projectName}床遥控适配，使用ErgoMotion4.0 APP实现连接、控制与反馈能力闭环。`
  return ensureSentence(summary) || fallback
}

const normalizeItems = (items = []) => {
  const seen = new Set()
  const merged = []
  items.forEach((item) => {
    const normalized = ensureSentence(item)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    merged.push(normalized)
  })

  while (merged.length < 4) {
    merged.push(FALLBACK_ITEMS[merged.length])
  }

  return merged.slice(0, 6)
}

const normalizeProjectKey = (projectName = '') => String(projectName).replace(/\s+/g, '')
const isSpecialAfterSalesProject = (projectName = '') => normalizeProjectKey(projectName).includes(SPECIAL_PROJECT_KEYWORD)

const formatContent = (projectName, summary, items) => {
  const intro = `${projectName}主要包含以下内容：`
  const list = normalizeItems(items)
    .map((item, index) => `${index + 1}、${item}`)
    .join('\n')

  return `${normalizeSummary(summary, projectName)}\n${intro}\n${list}`
}

const parseJsonFromText = (text = '') => {
  const content = String(text || '').trim()
  if (!content) return null

  try {
    return JSON.parse(content)
  } catch {
    // Try to parse JSON block when model includes markdown wrappers.
  }

  const matched = content.match(/\{[\s\S]*\}/)
  if (!matched) return null

  try {
    return JSON.parse(matched[0])
  } catch {
    return null
  }
}

const parseTextFallback = (text = '') => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return { summary: '', items: [] }

  const summary = lines[0].replace(/^[\-\d.、\s]+/, '')
  const items = lines
    .slice(1)
    .map((line) => line.replace(/^\d+[、.\-\s]*/, '').trim())
    .filter(Boolean)

  return { summary, items }
}

const buildMessages = (projectName) => [
  {
    role: 'system',
    content: '你是iOS立项文案助手。请仅返回JSON对象，不要输出任何额外解释。'
  },
  {
    role: 'user',
    content: `请围绕项目“${projectName}”生成立项单Content，严格返回以下JSON结构：{"summary":"一句话总结","items":["点1","点2","点3","点4"]}。要求：1）summary只写1句话；2）items写4-6条，每条聚焦适配开发工作，例如遥控器适配、动态UI、床型兼容、主控反馈、UUID与指令链路；3）必须是中文。`
  }
]

const parseDeepSeekContent = (rawContent = '') => {
  const parsedJson = parseJsonFromText(rawContent)
  if (parsedJson) {
    const summary = typeof parsedJson.summary === 'string' ? parsedJson.summary : ''
    const items = Array.isArray(parsedJson.items) ? parsedJson.items : []
    return { summary, items }
  }

  return parseTextFallback(rawContent)
}

const parseErrorDetails = async (response) => {
  try {
    const errorPayload = await response.json()
    return errorPayload?.error?.message || errorPayload?.error || response.statusText
  } catch {
    return response.statusText
  }
}

export const requestDeepSeekContent = async (projectName) => {
  const safeProjectName = String(projectName || '').trim()
  if (!safeProjectName) {
    throw new Error('项目名称不能为空')
  }

  if (isSpecialAfterSalesProject(safeProjectName)) {
    return SPECIAL_PROJECT_CONTENT
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('服务端未配置 DEEPSEEK_API_KEY，无法调用 DeepSeek')
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: buildMessages(safeProjectName)
    })
  })

  if (!response.ok) {
    const details = await parseErrorDetails(response)
    throw new Error(`DeepSeek请求失败(${response.status})：${details || '未知错误'}`)
  }

  const payload = await response.json()
  const rawContent = payload?.choices?.[0]?.message?.content || ''
  const { summary, items } = parseDeepSeekContent(rawContent)

  return formatContent(safeProjectName, summary, items)
}
