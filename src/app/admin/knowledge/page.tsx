// 管理后台 - 知识库管理

'use client';

import { useState, useMemo } from 'react';
import { Search, BookOpen, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getAllFaults } from '@/lib/knowledge/graph';
import { categoryNames } from '@/data';
import type { FaultKnowledge } from '@/types/knowledge';

const categoryColors: Record<string, string> = {
  engine: 'bg-red-100 text-red-800',
  transmission: 'bg-blue-100 text-blue-800',
  chassis: 'bg-green-100 text-green-800',
  braking: 'bg-amber-100 text-amber-800',
  electrical: 'bg-purple-100 text-purple-800',
  hvac: 'bg-cyan-100 text-cyan-800',
  body: 'bg-pink-100 text-pink-800',
  steering: 'bg-orange-100 text-orange-800',
};

export default function KnowledgePage() {
  // 知识库为静态数据，用惰性初始化一次加载，避免 setState-in-effect
  const [faults] = useState<FaultKnowledge[]>(() => getAllFaults());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = faults;

    if (selectedCategory !== 'all') {
      result = result.filter(f => f.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(fault =>
        fault.id.toLowerCase().includes(q) ||
        fault.subcategory.toLowerCase().includes(q) ||
        fault.symptoms.some(s =>
          s.description.toLowerCase().includes(q) ||
          s.keywords.some(k => k.toLowerCase().includes(q))
        ) ||
        fault.possibleCauses.some(c => c.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [faults, selectedCategory, search]);

  // 类别统计
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    faults.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return counts;
  }, [faults]);

  const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const severityNames: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    info: '提示',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">知识库管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          共 {faults.length} 条故障知识，覆盖 {Object.keys(categoryStats).length} 个系统
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索故障ID、子类、症状关键词..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-white border-primary'
                : 'border-border hover:border-primary'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            全部 ({faults.length})
          </button>
          {Object.entries(categoryStats).map(([cat, count]) => (
            <button
              key={cat}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white border-primary'
                  : 'border-border hover:border-primary'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryNames[cat] || cat} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* 知识库列表 */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">没有找到匹配的故障知识</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(fault => {
            const isExpanded = expandedId === fault.id;
            const totalCauses = fault.possibleCauses.length;
            const totalSymptoms = fault.symptoms.length;

            return (
              <Card key={fault.id} className="overflow-hidden">
                {/* 折叠头部 */}
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : fault.id)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-muted-foreground">{fault.id}</span>
                            <Badge className={`text-xs px-1.5 py-0 h-4 ${categoryColors[fault.category] || ''}`}>
                              {categoryNames[fault.category] || fault.category}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-medium line-clamp-1">{fault.subcategory}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{totalSymptoms} 个症状</span>
                            <span>{totalCauses} 个原因</span>
                            {fault.relatedFaultCodes.length > 0 && (
                              <span>OBD: {fault.relatedFaultCodes.slice(0, 2).join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </button>

                {/* 展开详情 */}
                {isExpanded && (
                  <>
                    <Separator />
                    <CardContent className="py-4 space-y-4">
                      {/* 症状列表 */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          症状描述
                        </h4>
                        <div className="space-y-2">
                          {fault.symptoms.map((s, i) => (
                            <div key={i} className="bg-muted/50 rounded-lg p-3">
                              <p className="text-sm mb-1">{s.description}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {s.keywords.map((k, j) => (
                                  <Badge key={j} variant="outline" className="text-xs px-1.5 py-0 h-4">
                                    {k}
                                  </Badge>
                                ))}
                                <Badge className={`text-xs px-1.5 py-0 h-4 ${severityColors[s.severity] || ''}`}>
                                  {severityNames[s.severity] || s.severity}
                                </Badge>
                              </div>
                              {s.conditions.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  条件：{s.conditions.join('、')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 可能原因 */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <Wrench className="h-4 w-4 text-primary" />
                          可能原因 ({totalCauses})
                        </h4>
                        <div className="space-y-3">
                          {fault.possibleCauses.map((cause, i) => (
                            <div key={i} className="border rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h5 className="text-sm font-medium">{cause.name}</h5>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
                                    概率 {Math.round(cause.probability * 100)}%
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs px-1.5 py-0 h-4 ${
                                      cause.severity === 'critical'
                                        ? 'border-red-300 text-red-700'
                                        : cause.severity === 'moderate'
                                        ? 'border-amber-300 text-amber-700'
                                        : 'border-green-300 text-green-700'
                                    }`}
                                  >
                                    {cause.severity === 'critical' ? '严重' : cause.severity === 'moderate' ? '中等' : '轻微'}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{cause.explanation}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">检查项：</span>
                                  {cause.checkItems.join('、')}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">工时：</span>
                                  {cause.laborHours}h
                                  <span className="mx-1">|</span>
                                  <span className="text-muted-foreground">可行驶：</span>
                                  {cause.canDrive ? (
                                    <CheckCircle className="inline h-3 w-3 text-green-500" />
                                  ) : (
                                    <span className="text-red-500">否</span>
                                  )}
                                </div>
                              </div>
                              {/* 配件价格 */}
                              {cause.parts.length > 0 && (
                                <div className="mt-2 bg-muted/50 rounded p-2">
                                  <p className="text-xs text-muted-foreground mb-1">配件价格参考：</p>
                                  {cause.parts.map((part, j) => (
                                    <div key={j} className="flex justify-between text-xs">
                                      <span>{part.name}</span>
                                      <span>
                                        原厂 ¥{part.oemPrice} / 品牌 ¥{part.brandPrice} / 副厂 ¥{part.aftermarketPrice}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* 防被宰 */}
                              {cause.overchargeWarnings.length > 0 && (
                                <div className="mt-2">
                                  {cause.overchargeWarnings.map((w, j) => (
                                    <p key={j} className="text-xs text-orange-700 flex items-start gap-1">
                                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      {w}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 高发车型 */}
                      {fault.commonInModels.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">高发车型</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {fault.commonInModels.map((model, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {model}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* OBD 故障码 */}
                      {fault.relatedFaultCodes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">关联 OBD 故障码</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {fault.relatedFaultCodes.map((code, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-mono">
                                {code}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 底部统计 */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        显示 {filtered.length} / {faults.length} 条知识
      </div>
    </div>
  );
}
