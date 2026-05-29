// 管理后台 - 数据概览

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileSearch,
  Car,
  Users,
  CarFront,
  TrendingUp,
  ChevronRight,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStats, getDiagnosisSessions, getVehicles, getUsedCarEvaluations } from '@/lib/storage';
import { getAllFaults } from '@/lib/knowledge/graph';
import type { DiagnosisSession } from '@/types/diagnosis';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalVehicles: 0,
    totalEvaluations: 0,
  });
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisSession[]>([]);
  const [faultCount, setFaultCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [statsData, sessions] = await Promise.all([
        getStats(),
        getDiagnosisSessions(),
      ]);

      setStats(statsData);
      setRecentDiagnoses(sessions.slice(0, 5));

      const faults = getAllFaults();
      setFaultCount(faults.length);

      // 按类别统计
      const counts: Record<string, number> = {};
      faults.forEach(f => {
        counts[f.category] = (counts[f.category] || 0) + 1;
      });
      setCategoryCounts(counts);
      setLoaded(true);
    };
    loadData();
  }, []);

  if (!loaded) {
    return <p className="text-muted-foreground">加载中...</p>;
  }

  const statCards = [
    {
      label: '诊断总数',
      value: stats.totalSessions,
      icon: FileSearch,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: '已完成诊断',
      value: stats.completedSessions,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: '注册用户车辆',
      value: stats.totalVehicles,
      icon: Car,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: '二手车评估',
      value: stats.totalEvaluations,
      icon: CarFront,
      color: 'bg-accent/10 text-accent',
    },
    {
      label: '知识库条目',
      value: faultCount,
      icon: LayoutDashboard,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  const categoryNames: Record<string, string> = {
    engine: '发动机',
    transmission: '变速箱',
    chassis: '底盘悬挂',
    braking: '制动系统',
    electrical: '电气系统',
    hvac: '空调系统',
    body: '车身',
    steering: '转向系统',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">数据概览</h1>
        <p className="text-sm text-muted-foreground mt-1">系统运行数据一览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="py-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color} mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 知识库覆盖 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">故障知识库覆盖</CardTitle>
              <Link href="/admin/knowledge" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                管理 <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm">{categoryNames[cat] || cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (count / 20) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between text-sm">
              <span className="text-muted-foreground">总计</span>
              <span className="font-semibold">{faultCount} 条故障知识</span>
            </div>
          </CardContent>
        </Card>

        {/* 最近诊断 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">最近诊断活动</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDiagnoses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">暂无诊断记录</p>
            ) : (
              <div className="space-y-3">
                {recentDiagnoses.map(s => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{s.initialSymptom}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString('zh-CN')} · {s.messages.length} 条消息
                      </p>
                    </div>
                    <Badge
                      variant={s.status === 'completed' ? 'secondary' : 'outline'}
                      className={`text-xs flex-shrink-0 ml-2 ${
                        s.status === 'completed' ? 'bg-green-100 text-green-800' : ''
                      }`}
                    >
                      {s.status === 'completed' ? '已完成' : '进行中'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="mt-6">
        <h2 className="text-base font-semibold mb-3">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/admin/knowledge" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                  <LayoutDashboard className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">管理知识库</p>
                  <p className="text-xs text-muted-foreground">查看和搜索故障条目</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/stats" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">使用统计</p>
                  <p className="text-xs text-muted-foreground">查看使用数据和趋势</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/diagnose" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <FileSearch className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">发起诊断</p>
                  <p className="text-xs text-muted-foreground">测试智能问诊流程</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/seed" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                  <Database className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">预设演示数据</p>
                  <p className="text-xs text-muted-foreground">导入 Demo 用测试数据</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
