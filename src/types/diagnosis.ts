// 诊断会话类型定义

export interface DiagnosisReport {
  vehicleSummary: string;                    // 车辆信息摘要
  causes: DiagnosisCause[];                  // 可能原因列表
  overchargeWarnings: string[];              // 防被宰提醒
  nextSteps: string[];                       // 建议下一步行动
  disclaimer: string;                        // 免责声明
  rawMarkdown?: string;                      // 原始 Markdown 输出（用于解析和回显）
}

export interface DiagnosisCause {
  faultName: string;                 // 故障名称
  probability: 'high' | 'medium' | 'low'; // 可能性评级
  matchExplanation: string;          // 症状匹配说明
  checkItems: string[];              // 建议检查项目
  repairMethod: string;              // 维修方案
  parts: {
    name: string;
    oemPrice: number;
    aftermarketPrice: number;
    brandPrice: number;
  }[];
  laborHours: number;                // 标准工时
  severity: 'critical' | 'moderate' | 'minor';
  canDrive: boolean;                 // 是否可继续行驶
  overchargeWarnings: string[];      // 该故障的防被宰提醒
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DiagnosisSession {
  id: string;
  status: 'in_progress' | 'completed';
  initialSymptom: string;
  messages: ChatMessage[];
  report?: DiagnosisReport;
  createdAt: string;
  updatedAt: string;
}
