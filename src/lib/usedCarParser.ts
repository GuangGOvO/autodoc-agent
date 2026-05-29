// 二手车评估报告解析器

export interface ParsedUsedCarReport {
  vehicleInfo: string;
  overallScore: number;        // 0-100
  scoreLabel: string;          // 优秀/良好/一般/较差
  priceRange: string;          // 合理价格区间
  askingPriceVerdict: string;  // 偏高/合理/偏低
  commonIssues: string[];      // 该车型常见坑点
  keyInspections: string[];    // 建议重点检查项
  suspiciousPoints: string[];  // 卖家描述中的可疑点
  advantages: string[];        // 优势/亮点
  summary: string;             // 总结建议
  disclaimer: string;
}

/**
 * 解析 LLM 输出的二手车评估报告 Markdown
 */
export function parseUsedCarReport(markdown: string): ParsedUsedCarReport {
  const report: ParsedUsedCarReport = {
    vehicleInfo: '',
    overallScore: 0,
    scoreLabel: '',
    priceRange: '',
    askingPriceVerdict: '',
    commonIssues: [],
    keyInspections: [],
    suspiciousPoints: [],
    advantages: [],
    summary: '',
    disclaimer: '以上评估结果仅供参考，不构成专业评估意见。建议到正规检测机构做全面检查后再做购买决定。',
  };

  if (!markdown) return report;

  // 提取车辆信息
  const vehicleMatch = markdown.match(/###\s*📋?\s*车辆(?:基本)?信息([\s\S]*?)(?=###|$)/i);
  if (vehicleMatch) {
    report.vehicleInfo = vehicleMatch[1].trim().replace(/^[-*]\s*/gm, '').trim();
  }

  // 提取综合评分
  const scoreMatch = markdown.match(/(?:综合评分|车况评分)[：:]\s*(\d{1,3})\s*分?/i)
    || markdown.match(/评分[：:]?\s*(\d{1,3})/i);
  if (scoreMatch) {
    report.overallScore = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
  }

  // 评分等级
  const labelMatch = markdown.match(/(?:评分|车况)[等级]*[：:]\s*(优秀|良好|一般|较差)/i)
    || markdown.match(/(优秀|良好|一般|较差)/);
  if (labelMatch && labelMatch[1]) {
    report.scoreLabel = labelMatch[1].trim();
  } else if (report.overallScore > 0) {
    if (report.overallScore >= 85) report.scoreLabel = '优秀';
    else if (report.overallScore >= 70) report.scoreLabel = '良好';
    else if (report.overallScore >= 50) report.scoreLabel = '一般';
    else report.scoreLabel = '较差';
  }

  // 合理价格区间
  const priceMatch = markdown.match(/(?:合理价格|参考价格|价格区间)[：:]\s*(.+)/i)
    || markdown.match(/(?:¥|￥)\s*[\d,.]+\s*(?:万|元)?\s*[-~至]\s*(?:¥|￥)?\s*[\d,.]+/);
  if (priceMatch) {
    report.priceRange = priceMatch[0].trim().replace(/^.*?[：:]\s*/, '');
  }

  // 要价判断
  const verdictMatch = markdown.match(/(?:要价|售价|报价)[判断评估]*[：:]\s*(.+)/i);
  if (verdictMatch) {
    report.askingPriceVerdict = verdictMatch[1].trim();
  }

  // 常见坑点
  report.commonIssues = extractSection(markdown, /(?:常见(?:坑点|问题|通病)|该车型?常见问题)([\s\S]*?)(?=###|$)/i);

  // 重点检查
  report.keyInspections = extractSection(markdown, /(?:重点检查|建议检查|检查要点)([\s\S]*?)(?=###|$)/i);

  // 可疑点
  report.suspiciousPoints = extractSection(markdown, /(?:可疑(?:点|之处)|需要注意|风险(?:点|提示))([\s\S]*?)(?=###|$)/i);

  // 优势
  report.advantages = extractSection(markdown, /(?:优势|亮点|优点)([\s\S]*?)(?=###|$)/i);

  // 总结
  const summaryMatch = markdown.match(/###\s*(?:📝\s*)?(?:总结|建议|购买建议)([\s\S]*?)(?=---|⚠️|$)/i)
    || markdown.match(/(?:总体建议|最终建议)[：:]\s*([\s\S]*?)(?=---|⚠️|$)/i);
  if (summaryMatch) {
    report.summary = summaryMatch[1].trim().replace(/^[-*\d.]+\s*/gm, '').trim();
  }

  // 免责声明
  const disclaimerMatch = markdown.match(/(?:⚠️\s*)?免责声明[：:]\s*(.+?)(?:\n|$)/i);
  if (disclaimerMatch) {
    report.disclaimer = disclaimerMatch[1].trim();
  }

  return report;
}

function extractSection(markdown: string, regex: RegExp): string[] {
  const match = markdown.match(regex);
  if (!match) return [];

  return match[1]
    .split('\n')
    .map(line => line.replace(/^\s*[-*\d.]+\s*/, '').trim())
    .filter(line => line.length > 2 && !line.startsWith('#'));
}

/**
 * 检测消息是否包含二手车评估报告
 */
export function isUsedCarReport(content: string): boolean {
  return /(?:车况评估|二手车评估|评估报告)/.test(content) &&
    /(?:综合评分|车况评分|合理价格|价格区间)/.test(content);
}
