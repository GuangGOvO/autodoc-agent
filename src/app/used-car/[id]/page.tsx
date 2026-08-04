// 二手车评估报告详情页

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CarFront, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UsedCarReportView } from '@/components/report/UsedCarReportView';
import { getUsedCarEvaluationById } from '@/lib/storage';
import { parseUsedCarReport } from '@/lib/usedCarParser';
import type { UsedCarEvaluation } from '@/types/usedCar';
import { DetailSkeleton } from '@/components/ui/page-skeleton';

export default function UsedCarDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [evaluation, setEvaluation] = useState<UsedCarEvaluation | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      const loadEvaluation = async () => {
        const e = await getUsedCarEvaluationById(id);
        setEvaluation(e || null);
        setLoaded(true);
      };
      loadEvaluation();
    }
  }, [id]);

  if (!loaded) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="h-5 bg-muted rounded w-24 mb-4 animate-pulse" />
        <DetailSkeleton />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">未找到评估记录</h1>
        <p className="text-muted-foreground mb-6">该评估记录不存在或已被删除</p>
        <Link
          href="/used-car"
          className="inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回二手车评估
        </Link>
      </div>
    );
  }

  const parsedReport = parseUsedCarReport(evaluation.reportMarkdown);
  const input = evaluation.input;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* 返回按钮 */}
      <Link
        href="/used-car"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回二手车评估
      </Link>

      {/* 车辆信息摘要 */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 flex-shrink-0">
                <CarFront className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-semibold mb-1">
                  {input.brand} {input.series} {input.year}款
                </h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span>{input.mileage}万公里</span>
                  <span>报价 ¥{input.askingPrice}万</span>
                  {input.transferCount !== undefined && (
                    <span>过户{input.transferCount}次</span>
                  )}
                  {input.color && <span>{input.color}</span>}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(evaluation.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 评估报告 */}
      <UsedCarReportView report={parsedReport} rawMarkdown={evaluation.reportMarkdown} />
    </div>
  );
}
