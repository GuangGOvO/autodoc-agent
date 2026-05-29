// 故障知识图谱数据汇总入口

import type { FaultKnowledge } from '@/types/knowledge';

import engineFaults from './faults/engine.json';
import transmissionFaults from './faults/transmission.json';
import chassisFaults from './faults/chassis.json';
import brakingFaults from './faults/braking.json';
import electricalFaults from './faults/electrical.json';
import hvacFaults from './faults/hvac.json';
import bodyFaults from './faults/body.json';
import steeringFaults from './faults/steering.json';

/**
 * 所有故障知识图谱数据（合并所有系统）
 */
export const allFaults: FaultKnowledge[] = [
  ...(engineFaults as FaultKnowledge[]),
  ...(transmissionFaults as FaultKnowledge[]),
  ...(chassisFaults as FaultKnowledge[]),
  ...(brakingFaults as FaultKnowledge[]),
  ...(electricalFaults as FaultKnowledge[]),
  ...(hvacFaults as FaultKnowledge[]),
  ...(bodyFaults as FaultKnowledge[]),
  ...(steeringFaults as FaultKnowledge[]),
];

/**
 * 系统类别中文名称映射
 */
export const categoryNames: Record<string, string> = {
  engine: '发动机',
  transmission: '变速箱',
  chassis: '底盘悬挂',
  braking: '制动系统',
  electrical: '电气系统',
  hvac: '空调系统',
  body: '车身',
  steering: '转向系统',
};
