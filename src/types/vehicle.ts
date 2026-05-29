// 车型数据库类型定义

export interface MaintenanceItem {
  name: string;         // 保养项目名称
  intervalKm: number;   // 保养间隔（公里）
  intervalMonths: number; // 保养间隔（月）
  estimatedPrice: number; // 预估价格
}

export interface VehicleModel {
  brand: string;          // 品牌
  series: string;         // 车系
  yearRange: string;      // 年款范围
  engine: string;         // 发动机型号
  transmission: string;   // 变速箱类型
  knownIssues: string[];  // 该车型已知通病（关联 FaultKnowledge.id）
  maintenanceSchedule: MaintenanceItem[]; // 保养周期
}
