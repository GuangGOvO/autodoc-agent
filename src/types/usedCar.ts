// 二手车评估类型定义

export interface UsedCarInput {
  brand: string;
  series: string;
  year: string;
  mileage: number;          // 万公里
  askingPrice: number;      // 万元
  description: string;      // 卖家描述
  color?: string;
  transferCount?: number;   // 过户次数
}

export interface UsedCarEvaluation {
  id: string;
  input: UsedCarInput;
  reportMarkdown: string;
  createdAt: string;
}
