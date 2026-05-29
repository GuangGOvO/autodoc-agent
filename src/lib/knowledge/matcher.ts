// 症状匹配算法

import type { FaultKnowledge, SymptomEntry } from '@/types/knowledge';
import { allFaults } from '@/data';

interface MatchResult {
  fault: FaultKnowledge;
  symptom: SymptomEntry;
  score: number;        // 匹配得分 0-1
  matchedKeywords: string[]; // 匹配到的关键词
}

/**
 * 对用户输入进行症状匹配，返回排序后的匹配结果
 */
export function matchSymptoms(userInput: string, topK: number = 5): MatchResult[] {
  const input = userInput.toLowerCase();
  const results: MatchResult[] = [];

  for (const fault of allFaults) {
    for (const symptom of fault.symptoms) {
      const { score, matchedKeywords } = calculateMatchScore(input, symptom);
      if (score > 0) {
        results.push({
          fault,
          symptom,
          score,
          matchedKeywords,
        });
      }
    }
  }

  // 按得分排序，去重（每个 fault 只保留最高分的 symptom）
  const dedupedMap = new Map<string, MatchResult>();
  for (const result of results.sort((a, b) => b.score - a.score)) {
    if (!dedupedMap.has(result.fault.id)) {
      dedupedMap.set(result.fault.id, result);
    }
  }

  return Array.from(dedupedMap.values()).slice(0, topK);
}

/**
 * 计算单条症状与用户输入的匹配得分
 */
function calculateMatchScore(
  input: string,
  symptom: SymptomEntry
): { score: number; matchedKeywords: string[] } {
  let score = 0;
  const matchedKeywords: string[] = [];

  // 1. 关键词精确匹配（权重最高）
  for (const keyword of symptom.keywords) {
    if (input.includes(keyword.toLowerCase())) {
      score += 0.3;
      matchedKeywords.push(keyword);
    }
  }

  // 2. 症状描述模糊匹配
  const descWords = symptom.description
    .toLowerCase()
    .replace(/[，。！？、（）\s]+/g, ' ')
    .split(' ')
    .filter(w => w.length >= 2);

  for (const word of descWords) {
    if (input.includes(word)) {
      score += 0.1;
    }
  }

  // 3. 发生条件匹配
  for (const condition of symptom.conditions) {
    if (input.includes(condition.toLowerCase())) {
      score += 0.15;
      matchedKeywords.push(condition);
    }
  }

  // 4. 严重程度加权
  if (symptom.severity === 'critical') {
    score *= 1.2;
  }

  // 归一化到 0-1
  score = Math.min(score, 1);

  return { score, matchedKeywords };
}

/**
 * 获取与用户输入最相关的故障知识（供 LLM 上下文使用）
 */
export function getRelevantKnowledge(userInput: string, topK: number = 5): FaultKnowledge[] {
  const matches = matchSymptoms(userInput, topK);
  return matches.map(m => m.fault);
}
