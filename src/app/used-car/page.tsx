// 二手车车况快评页面

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CarFront,
  Send,
  ArrowLeft,
  RotateCcw,
  FileSearch,
  ChevronRight,
  Trash2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { UsedCarReportView } from '@/components/report/UsedCarReportView';
import { parseUsedCarReport, isUsedCarReport } from '@/lib/usedCarParser';
import {
  getUsedCarEvaluations,
  saveUsedCarEvaluation,
  deleteUsedCarEvaluation,
} from '@/lib/storage';
import type { UsedCarEvaluation, UsedCarInput } from '@/types/usedCar';
import vehiclesData from '@/data/vehicles.json';

const brands = [...new Set(vehiclesData.map(v => v.brand))];

export default function UsedCarPage() {
  // 表单状态
  const [brand, setBrand] = useState('');
  const [series, setSeries] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [transferCount, setTransferCount] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');

  // 流式输出状态
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [evaluationDone, setEvaluationDone] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // 历史记录
  const [evaluations, setEvaluations] = useState<UsedCarEvaluation[]>([]);
  const [loaded, setLoaded] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const evals = await getUsedCarEvaluations();
      setEvaluations(evals);
      setLoaded(true);
    };
    loadData();
  }, []);

  // 根据品牌获取车系
  const seriesOptions = brand
    ? [...new Set(vehiclesData.filter(v => v.brand === brand).map(v => v.series))]
    : [];

  // 根据车系获取年份
  const yearOptions = brand && series
    ? vehiclesData.find(v => v.brand === brand && v.series === series)?.years || []
    : [];

  // 滚动到结果
  const scrollToResult = useCallback(() => {
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  // 提交评估
  const handleEvaluate = async () => {
    if (!brand || !series || !year || !mileage || !askingPrice || !description.trim()) {
      return;
    }

    const input: UsedCarInput = {
      brand,
      series,
      year,
      mileage: parseFloat(mileage),
      askingPrice: parseFloat(askingPrice),
      description: description.trim(),
      color: color || undefined,
      transferCount: transferCount ? parseInt(transferCount) : undefined,
    };

    setIsEvaluating(true);
    setStreamContent('');
    setEvaluationDone(false);
    scrollToResult();

    try {
      const response = await fetch('/api/used-car/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '评估请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamContent(fullContent);
              }
            } catch {
              // 忽略
            }
          }
        }
      }

      // 评估完成，保存
      const saved = await saveUsedCarEvaluation({ input, reportMarkdown: fullContent });
      setSavedId(saved.id);
      setEvaluationDone(true);
      const evals = await getUsedCarEvaluations();
      setEvaluations(evals);
    } catch (error) {
      setStreamContent(`抱歉，评估过程中出现错误：${error instanceof Error ? error.message : '请稍后重试'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  // 重置
  const handleReset = () => {
    setBrand('');
    setSeries('');
    setYear('');
    setMileage('');
    setAskingPrice('');
    setTransferCount('');
    setColor('');
    setDescription('');
    setStreamContent('');
    setEvaluationDone(false);
    setSavedId(null);
  };

  // 删除历史
  const handleDeleteEval = async (id: string) => {
    if (confirm('确定要删除这条评估记录吗？')) {
      await deleteUsedCarEvaluation(id);
      const evals = await getUsedCarEvaluations();
      setEvaluations(evals);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canSubmit = brand && series && year && mileage && askingPrice && description.trim().length >= 5 && !isEvaluating;

  // 解析报告
  const parsedReport = streamContent ? parseUsedCarReport(streamContent) : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* 页头 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <CarFront className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">二手车车况快评</h1>
            <p className="text-sm text-muted-foreground">
              输入车辆信息和卖家描述，AI 帮您评估车况、识别风险
            </p>
          </div>
        </div>
      </div>

      {/* 评估表单 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">车辆信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 品牌选择 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">品牌 *</label>
            <div className="flex flex-wrap gap-2">
              {brands.map(b => (
                <button
                  key={b}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    brand === b
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:border-primary hover:text-primary'
                  }`}
                  onClick={() => {
                    setBrand(b);
                    if (b !== brand) { setSeries(''); setYear(''); }
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* 车系选择 */}
          {brand && seriesOptions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">车系 *</label>
              <div className="flex flex-wrap gap-2">
                {seriesOptions.map(s => (
                  <button
                    key={s}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      series === s
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:border-primary hover:text-primary'
                    }`}
                    onClick={() => {
                      setSeries(s);
                      if (s !== series) setYear('');
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 年款选择 */}
          {series && yearOptions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">年款 *</label>
              <div className="flex flex-wrap gap-2">
                {yearOptions.map(y => (
                  <button
                    key={y}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      year === y
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:border-primary hover:text-primary'
                    }`}
                    onClick={() => setYear(y)}
                  >
                    {y}款
                  </button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* 数字输入行 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">里程 (万公里) *</label>
              <Input
                type="number"
                value={mileage}
                onChange={e => setMileage(e.target.value)}
                placeholder="如 5.2"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">报价 (万元) *</label>
              <Input
                type="number"
                value={askingPrice}
                onChange={e => setAskingPrice(e.target.value)}
                placeholder="如 8.5"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">过户次数</label>
              <Input
                type="number"
                value={transferCount}
                onChange={e => setTransferCount(e.target.value)}
                placeholder="如 1"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">颜色</label>
              <Input
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="如 白色"
              />
            </div>
          </div>

          {/* 卖家描述 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              卖家描述 * <span className="text-xs text-muted-foreground font-normal">（至少5个字）</span>
            </label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="粘贴或输入卖家的描述，包括车况、维修记录、出险情况、卖车原因等&#10;&#10;例如：2020年上牌，一手车，全程4S店保养，无事故无水泡，轻微剐蹭已修复，因换车出售..."
              className="min-h-[120px]"
              rows={5}
            />
          </div>

          {/* 提交按钮 */}
          <Button
            onClick={handleEvaluate}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {isEvaluating ? (
              <>评估中，请稍候...</>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-5 w-5" />
                开始 AI 评估
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 评估结果 */}
      {streamContent && (
        <div ref={resultRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              评估结果
            </h2>
            <div className="flex items-center gap-2">
              {isEvaluating && (
                <Badge variant="secondary" className="animate-pulse">生成中...</Badge>
              )}
              {evaluationDone && (
                <Badge className="bg-green-100 text-green-800 border-green-200">已完成</Badge>
              )}
              {evaluationDone && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  重新评估
                </Button>
              )}
            </div>
          </div>

          {/* 结构化报告 */}
          {parsedReport && (parsedReport.overallScore > 0 || parsedReport.suspiciousPoints.length > 0) ? (
            <UsedCarReportView report={parsedReport} rawMarkdown={streamContent} />
          ) : (
            <Card>
              <CardContent className="py-4">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{streamContent}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 历史评估记录 */}
      {loaded && evaluations.length > 0 && !isEvaluating && (
        <div className="mt-8">
          <Separator className="mb-6" />
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            评估记录
          </h2>
          <div className="space-y-3">
            {evaluations.map(ev => (
              <Card key={ev.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/used-car/${ev.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 flex-shrink-0">
                          <CarFront className="h-4 w-4 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium line-clamp-1">
                            {ev.input.brand} {ev.input.series} {ev.input.year}款
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{ev.input.mileage}万公里</span>
                            <span>报价{ev.input.askingPrice}万</span>
                            <span>{formatDate(ev.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleDeleteEval(ev.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                      <Link
                        href={`/used-car/${ev.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
