// 故障知识图谱类型定义

export type Severity = 'critical' | 'warning' | 'info';
export type FaultSeverity = 'critical' | 'moderate' | 'minor';
export type SystemCategory =
  | 'engine'       // 发动机
  | 'transmission' // 变速箱
  | 'chassis'      // 底盘悬挂
  | 'braking'      // 制动系统
  | 'electrical'   // 电气系统
  | 'hvac'         // 空调系统
  | 'body'         // 车身
  | 'steering';    // 转向系统

export interface PartPrice {
  name: string;           // 配件名称
  oemPrice: number;       // 原厂件价格
  aftermarketPrice: number; // 副厂件价格
  brandPrice: number;     // 品牌件价格
}

export interface CauseEntry {
  name: string;                  // 故障名称
  probability: number;           // 0-1 概率权重
  explanation: string;           // 为什么这个症状指向这个原因
  checkItems: string[];          // 建议检查项目
  repairMethod: string;          // 维修方案
  parts: PartPrice[];            // 配件价格
  laborHours: number;            // 标准工时
  severity: FaultSeverity;       // 严重程度
  canDrive: boolean;             // 是否可继续行驶
  overchargeWarnings: string[];  // 防被宰提醒
}

export interface SymptomEntry {
  description: string;           // 症状描述（自然语言）
  keywords: string[];            // 关键词（用于匹配）
  conditions: string[];          // 发生条件
  severity: Severity;
}

export interface FaultKnowledge {
  id: string;                    // 唯一标识
  category: SystemCategory;      // 大类
  subcategory: string;           // 子类
  symptoms: SymptomEntry[];      // 症状描述
  possibleCauses: CauseEntry[];  // 可能原因列表
  relatedFaultCodes: string[];   // 关联OBD故障码
  commonInModels: string[];      // 高发车型
  tsbReferences: string[];       // 技术服务通报编号
}
