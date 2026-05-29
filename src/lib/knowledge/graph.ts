// 知识图谱查询引擎

import type { FaultKnowledge } from '@/types/knowledge';
import { allFaults } from '@/data';

/**
 * 获取所有故障知识数据
 */
export function getAllFaults(): FaultKnowledge[] {
  return allFaults;
}

/**
 * 根据 ID 获取单个故障知识
 */
export function getFaultById(id: string): FaultKnowledge | undefined {
  return allFaults.find(f => f.id === id);
}

/**
 * 根据类别获取故障知识
 */
export function getFaultsByCategory(category: string): FaultKnowledge[] {
  return allFaults.filter(f => f.category === category);
}

/**
 * 根据关键词搜索故障知识
 */
export function searchFaults(query: string): FaultKnowledge[] {
  const q = query.toLowerCase();
  return allFaults.filter(fault => {
    // 搜索症状描述和关键词
    const symptomMatch = fault.symptoms.some(s =>
      s.description.toLowerCase().includes(q) ||
      s.keywords.some(k => k.toLowerCase().includes(q)) ||
      s.conditions.some(c => c.toLowerCase().includes(q))
    );
    // 搜索故障原因名称
    const causeMatch = fault.possibleCauses.some(c =>
      c.name.toLowerCase().includes(q)
    );
    // 搜索子类
    const subcategoryMatch = fault.subcategory.toLowerCase().includes(q);

    return symptomMatch || causeMatch || subcategoryMatch;
  });
}
