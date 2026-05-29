// 诊断报告 Markdown 解析器
// 将 LLM 输出的 Markdown 报告解析为结构化数据

export interface ParsedReport {
  vehicleSummary: string;
  causes: ParsedCause[];
  overchargeWarnings: string[];
  nextSteps: string[];
  disclaimer: string;
}

export interface ParsedCause {
  name: string;
  probability: 'high' | 'medium' | 'low';
  matchExplanation: string;
  checkItems: string[];
  repairMethod: string;
  parts: { name: string; prices: string }[];
  severity: string;
  canDrive: string;
  overchargeWarnings: string[];
}

/**
 * 清理 LLM 输出：去掉代码块围栏等干扰
 */
function cleanMarkdown(markdown: string): string {
  if (!markdown) return '';

  let cleaned = markdown.trim();

  // 去掉最外层的 ``` 围栏（LLM 有时会把报告包裹在代码块里）
  const fenceMatch = cleaned.match(/^```\w*\s*\n([\s\S]*?)\n```\s*$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  return cleaned;
}

/**
 * 解析 LLM 输出的 Markdown 诊断报告
 */
export function parseDiagnosisReport(markdown: string): ParsedReport {
  const report: ParsedReport = {
    vehicleSummary: '',
    causes: [],
    overchargeWarnings: [],
    nextSteps: [],
    disclaimer: '',
  };

  if (!markdown) return report;

  const md = cleanMarkdown(markdown);

  // 提取车辆信息摘要
  // 支持: ### 📋 车辆信息, ### 车辆信息, ### 车辆基本信息 等
  const vehicleMatch = md.match(/###+\s*📋?\s*车辆[基本]?信息\s*\n([\s\S]*?)(?=###+\s|(?=####\s*原因)|$)/i);
  if (vehicleMatch) {
    report.vehicleSummary = vehicleMatch[1].trim().replace(/^[-*]\s*/gm, '').trim();
  }

  // 提取可能原因 — 支持多种格式
  // 格式1: #### 原因1：故障名（可能性：高）
  // 格式2: #### 原因 1: 故障名（可能性: 高）
  // 格式3: ### 原因1：故障名（可能性：高）
  // 格式4: #### 故障名（可能性：高）
  const causeRegex = /###+\s*原因\s*\d*[：:]\s*(.+?)（可能性[：:]\s*(高|中|低)\s*）([\s\S]*?)(?=###+\s*原因|\s*###+\s*⚠️|\s*###+\s*📝|\s*---\s*$)/gi;

  let causeMatch;
  while ((causeMatch = causeRegex.exec(md)) !== null) {
    const cause = parseOneCause(causeMatch[1], causeMatch[2], causeMatch[3]);
    report.causes.push(cause);
  }

  // 如果没匹配到，尝试宽松模式：#### 故障名（可能性：高）
  if (report.causes.length === 0) {
    const looseCauseRegex = /####\s*(.+?)（可能性[：:]\s*(高|中|低)\s*）([\s\S]*?)(?=####\s|###+\s*⚠️|###+\s*📝|\s*---\s*$)/gi;
    while ((causeMatch = looseCauseRegex.exec(md)) !== null) {
      // 排除"原因"开头的（已经处理过）
      if (causeMatch[1].startsWith('原因')) continue;
      const cause = parseOneCause(causeMatch[1], causeMatch[2], causeMatch[3]);
      report.causes.push(cause);
    }
  }

  // 如果还没匹配到，尝试最简模式
  if (report.causes.length === 0) {
    const simpleCauses = md.match(/(?:可能[的的]?(?:故障)?原因|故障原因)[\s\S]*?(?=###+|⚠️|---|$)/i);
    if (simpleCauses) {
      const lines = simpleCauses[0].split('\n').filter(l => l.trim());
      lines.forEach(line => {
        const match = line.match(/^[-*\d.]+\s*[：:]?\s*(.+?)$/);
        if (match && match[1].length > 2) {
          report.causes.push({
            name: match[1].trim(),
            probability: 'medium',
            matchExplanation: '',
            checkItems: [],
            repairMethod: '',
            parts: [],
            severity: 'moderate',
            canDrive: '需进一步确认',
            overchargeWarnings: [],
          });
        }
      });
    }
  }

  // 提取防被宰提醒 — 支持多种标题格式
  const overchargeSection = md.match(/###+\s*⚠️?\s*防被宰提醒([\s\S]*?)(?=###+\s|---|$)/i)
    || md.match(/###+\s*⚠️\s*防(?:被宰|坑|骗)提[醒示]([\s\S]*?)(?=###+\s|---|$)/i);
  if (overchargeSection) {
    report.overchargeWarnings = extractListItems(overchargeSection[1]);
  }

  // 提取建议下一步
  const nextStepsSection = md.match(/###+\s*📝?\s*建议[下一步行动]*([\s\S]*?)(?=###+\s|---|$)/i);
  if (nextStepsSection) {
    report.nextSteps = extractListItems(nextStepsSection[1]);
  }

  // 提取免责声明
  const disclaimerMatch = md.match(/(?:⚠️\s*)?免责声明[：:]\s*(.+?)(?:\n|$)/i)
    || md.match(/---\s*\n\s*(.+?仅供参考.+?)(?:\n|$)/i);
  if (disclaimerMatch) {
    report.disclaimer = disclaimerMatch[1].trim();
  } else {
    report.disclaimer = '以上诊断结果仅供参考，不构成专业维修建议。具体故障原因和维修方案请咨询专业维修技师。';
  }

  return report;
}

function parseOneCause(name: string, probStr: string, content: string): ParsedCause {
  const probabilityMap: Record<string, 'high' | 'medium' | 'low'> = {
    '高': 'high',
    '中': 'medium',
    '低': 'low',
  };

  const cause: ParsedCause = {
    name: name.trim(),
    probability: probabilityMap[probStr] || 'medium',
    matchExplanation: '',
    checkItems: [],
    repairMethod: '',
    parts: [],
    severity: 'moderate',
    canDrive: '',
    overchargeWarnings: [],
  };

  // 症状匹配说明 — 支持 **症状匹配**： 或 **症状匹配**:
  const matchMatch = content.match(/\*\*症状匹配\*\*\s*[：:]\s*(.+)/i);
  if (matchMatch) cause.matchExplanation = matchMatch[1].trim();

  // 建议检查
  const checkMatch = content.match(/\*\*建议检查\*\*\s*[：:]\s*(.+)/i);
  if (checkMatch) {
    cause.checkItems = checkMatch[1].split(/[,，、]/).map(s => s.replace(/[\[\]]/g, '').trim()).filter(Boolean);
  }

  // 维修方案
  const repairMatch = content.match(/\*\*维修方案\*\*\s*[：:]\s*(.+)/i);
  if (repairMatch) cause.repairMethod = repairMatch[1].trim();

  // 参考价格 — 支持多种格式
  const priceSection = content.match(/\*\*参考价格\*\*\s*[：:]?\s*([\s\S]*?)(?=\n\s*-\s*\*\*|$)/i);
  if (priceSection) {
    const priceLines = priceSection[1].split('\n').filter(l => l.trim());
    priceLines.forEach(line => {
      // 格式: - 原厂件：¥xxx + 工时费 ¥xxx
      // 或:   - 原厂件: ¥xxx-¥xxx + 工时费 ¥xxx
      const partMatch = line.match(/[-*]\s*(.+?)\s*[：:]\s*((?:¥|￥)[\d,，~\-]+(?:\s*(?:\+|加)?\s*工时费?\s*(?:¥|￥)?[\d,，~\-]+)?)/);
      if (partMatch) {
        cause.parts.push({ name: partMatch[1].trim(), prices: partMatch[2].trim() });
      }
    });
  }

  // 严重程度
  const severityMatch = content.match(/\*\*严重程度\*\*\s*[：:]\s*(.+)/i);
  if (severityMatch) cause.severity = severityMatch[1].trim();

  // 能否继续行驶
  const driveMatch = content.match(/\*\*能否继续行驶\*\*\s*[：:]\s*(.+)/i);
  if (driveMatch) cause.canDrive = driveMatch[1].trim();

  return cause;
}

function extractListItems(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^\s*[-*\d.]+\s*/, '').trim())
    .filter(line => line.length > 1 && !line.startsWith('#') && !line.startsWith('---'));
}

/**
 * 检测消息中是否包含诊断报告
 * 使用严格的多条件判断，避免误判追问消息为报告
 *
 * 三个条件：
 * 1. 包含 "诊断报告" 或 "诊断结果" 标题
 * 2. 包含 "可能性：高/中/低" 格式
 * 3. 内容长度 > 500 字符
 *
 * 至少满足 2 个条件才判定为报告
 */
export function isDiagnosisReport(content: string): boolean {
  if (!content || content.length < 100) return false;

  const hasTitle = /(?:诊断报告|诊断结果)/.test(content);
  const hasProbabilityFormat = /可能性[：:]\s*(?:高|中|低)/.test(content);
  const isLongEnough = content.length > 500;

  // Count how many conditions are met
  let score = 0;
  if (hasTitle) score++;
  if (hasProbabilityFormat) score++;
  if (isLongEnough) score++;

  return score >= 2;
}
