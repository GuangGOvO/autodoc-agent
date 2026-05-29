// 管理后台 - 使用统计

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  FileSearch,
  TrendingUp,
  Car,
  CarFront,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getDiagnosisSessions, getVehicles, getUsedCarEvaluations, Vehicle } from '@/lib/storage';
import type { DiagnosisSession } from '@/types/diagnosis';
import type { UsedCarEvaluation } from '@/types/usedCar';

export default function StatsPage() {
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [usedCarEvals, setUsedCarEvals] = useState<UsedCarEvaluation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [s, v, e] = await Promise.all([
        getDiagnosisSessions(),
        getVehicles(),
        getUsedCarEvaluations(),
      ]);
      setSessions(s);
      setVehicles(v);
      setUsedCarEvals(e);
      setLoaded(true);
    };
    loadData();
  }, []);

  // 按日统计诊断数量（最近7天）
  const dailyStats = useMemo(() => {
    const stats: { date: string; label: string; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = i === 0 ? '今天' : i === 1 ? '昨天' : `${d.getMonth() + 1}/${d.getDate()}`;
      const count = sessions.filter(s => s.createdAt.startsWith(dateStr)).length;
      stats.push({ date: dateStr, label, count });
    }

    return stats;
  }, [sessions]);

  const maxDaily = Math.max(...dailyStats.map(d => d.count), 1);

  // 热门症状关键词
  const topSymptoms = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      const words = s.initialSymptom
        .replace(/[，。！？、]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2);
      words.forEach(w => {
        counts[w] = (counts[w] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [sessions]);

  // 诊断完成率
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const completionRate = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0;

  // 平均消息数
  const avgMessages = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.messages.length, 0) / sessions.length * 10) / 10
    : 0;

  // 车辆品牌分布
  const brandDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => {
      counts[v.brand] = (counts[v.brand] || 0) + 1;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [vehicles]);

  // 二手车评估统计
  const usedCarStats = useMemo(() => {
    const brands: Record<string, number> = {};
    usedCarEvals.forEach(e => {
      brands[e.input.brand] = (brands[e.input.brand] || 0) + 1;
    });
    return Object.entries(brands).sort(([, a], [, b]) => b - a);
  }, [usedCarEvals]);

  if (!loaded) {
    return <p className="text-muted-foreground">加载中...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">使用统计</h1>
        <p className="text-sm text-muted-foreground mt-1">系统使用数据分析和趋势</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <FileSearch className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">诊断</span>
            </div>
            <p className="text-2xl font-bold">{sessions.length}</p>
            <p className="text-xs text-muted-foreground">总诊断次数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-xs text-muted-foreground">完成率</span>
            </div>
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">{completedCount}/{sessions.length} 完成</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-muted-foreground">消息</span>
            </div>
            <p className="text-2xl font-bold">{avgMessages}</p>
            <p className="text-xs text-muted-foreground">平均对话轮数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <CarFront className="h-5 w-5 text-accent" />
              <span className="text-xs text-muted-foreground">评估</span>
            </div>
            <p className="text-2xl font-bold">{usedCarEvals.length}</p>
            <p className="text-xs text-muted-foreground">二手车评估</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近7天诊断趋势 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              最近 7 天诊断趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyStats.every(d => d.count === 0) ? (
              <p className="text-sm text-muted-foreground py-8 text-center">暂无诊断数据</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {dailyStats.map(day => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{day.count}</span>
                    <div className="w-full bg-muted rounded-t relative" style={{ height: '120px' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-t transition-all"
                        style={{ height: `${(day.count / maxDaily) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 热门症状关键词 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              热门症状关键词
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSymptoms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {topSymptoms.map(([word, count], idx) => (
                  <div key={word} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 text-right">{idx + 1}</span>
                    <span className="text-sm flex-1">{word}</span>
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${(count / topSymptoms[0][1]) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 车辆品牌分布 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              用户车辆品牌分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brandDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">暂无车辆数据</p>
            ) : (
              <div className="space-y-2">
                {brandDistribution.map(([brand, count]) => (
                  <div key={brand} className="flex items-center justify-between">
                    <span className="text-sm">{brand}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(count / vehicles.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 二手车评估品牌分布 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CarFront className="h-4 w-4 text-accent" />
              二手车评估品牌分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usedCarStats.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">暂无评估数据</p>
            ) : (
              <div className="space-y-2">
                {usedCarStats.map(([brand, count]) => (
                  <div key={brand} className="flex items-center justify-between">
                    <span className="text-sm">{brand}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(count / usedCarEvals.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 诊断会话详情 */}
      {sessions.length > 0 && (
        <div className="mt-6">
          <Separator className="mb-6" />
          <h2 className="text-base font-semibold mb-4">全部诊断会话</h2>
          <Card>
            <CardContent className="py-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4">症状</th>
                      <th className="pb-2 pr-4">消息数</th>
                      <th className="pb-2 pr-4">状态</th>
                      <th className="pb-2">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 max-w-[200px] truncate">{s.initialSymptom}</td>
                        <td className="py-2 pr-4">{s.messages.length}</td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant={s.status === 'completed' ? 'secondary' : 'outline'}
                            className={`text-xs ${s.status === 'completed' ? 'bg-green-100 text-green-800' : ''}`}
                          >
                            {s.status === 'completed' ? '已完成' : '进行中'}
                          </Badge>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
