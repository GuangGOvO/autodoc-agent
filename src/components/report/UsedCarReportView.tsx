// 二手车评估报告结构化展示组件

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CarFront,
  AlertTriangle,
  CheckCircle,
  Wrench,
  ShieldAlert,
  TrendingUp,
  Info,
  Star,
} from 'lucide-react';
import { type ParsedUsedCarReport } from '@/lib/usedCarParser';

interface UsedCarReportViewProps {
  report: ParsedUsedCarReport;
  rawMarkdown?: string;
}

const scoreColors: Record<string, string> = {
  '优秀': 'text-green-600',
  '良好': 'text-blue-600',
  '一般': 'text-amber-600',
  '较差': 'text-red-600',
};

export function UsedCarReportView({ report, rawMarkdown }: UsedCarReportViewProps) {
  const scoreColor = scoreColors[report.scoreLabel] || 'text-foreground';

  return (
    <div className="space-y-6">
      {/* 综合评分大卡片 */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">车况综合评分</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold">{report.overallScore || '--'}</span>
                <span className="text-xl opacity-90 mb-1">分</span>
              </div>
              {report.scoreLabel && (
                <p className="text-sm mt-2 opacity-90">车况等级：{report.scoreLabel}</p>
              )}
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
              <CarFront className="h-10 w-10" />
            </div>
          </div>
        </div>

        {/* 价格分析 */}
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">价格分析</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">合理价格区间</p>
              <p className="text-lg font-bold text-primary">{report.priceRange || '评估中...'}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">卖家报价评估</p>
              <p className={`text-lg font-bold ${
                report.askingPriceVerdict.includes('偏高') ? 'text-red-600' :
                report.askingPriceVerdict.includes('偏低') ? 'text-green-600' :
                'text-blue-600'
              }`}>
                {report.askingPriceVerdict || '评估中...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 车辆信息 */}
      {report.vehicleInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              车辆信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.vehicleInfo}</p>
          </CardContent>
        </Card>
      )}

      {/* 可疑点 / 风险提示 — 醒目展示 */}
      {report.suspiciousPoints.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              可疑点 / 风险提示
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.suspiciousPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-red-900">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 常见坑点 */}
      {report.commonIssues.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Wrench className="h-5 w-5" />
              该车型常见坑点
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.commonIssues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 重点检查项 */}
      {report.keyInspections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              建议重点检查
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.keyInspections.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 优势 / 亮点 */}
      {report.advantages.length > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-green-800">
              <Star className="h-5 w-5" />
              优势 / 亮点
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.advantages.map((adv, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 购买建议 */}
      {report.summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              购买建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* 免责声明 */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground">
          ⚠️ {report.disclaimer}
        </p>
      </div>
    </div>
  );
}
