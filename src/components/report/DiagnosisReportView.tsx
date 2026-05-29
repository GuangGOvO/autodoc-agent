// 诊断报告结构化展示组件 — 带可视化增强

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Wrench, ShieldAlert, ArrowRight, Info, Star, ThumbsUp, ThumbsDown, Activity } from 'lucide-react';
import { type ParsedReport, type ParsedCause } from '@/lib/reportParser';

interface DiagnosisReportViewProps {
  report: ParsedReport;
  rawMarkdown?: string;
}

// ==================== 概率配置 ====================

const probabilityConfig = {
  high: { label: '可能性高', className: 'bg-red-100 text-red-800 border-red-200', barColor: 'bg-red-500', barWidth: '90%' },
  medium: { label: '可能性中', className: 'bg-amber-100 text-amber-800 border-amber-200', barColor: 'bg-amber-500', barWidth: '60%' },
  low: { label: '可能性低', className: 'bg-blue-100 text-blue-800 border-blue-200', barColor: 'bg-blue-500', barWidth: '30%' },
};

// ==================== 严重程度配置 ====================

const severityConfig = {
  severe: { emoji: '🔴', label: '严重', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' },
  moderate: { emoji: '🟡', label: '中等', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' },
  minor: { emoji: '🟢', label: '轻微', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300' },
};

function getSeverity(s: string) {
  if (s.includes('严重')) return severityConfig.severe;
  if (s.includes('中等')) return severityConfig.moderate;
  return severityConfig.minor;
}

// ==================== 总体风险评估 ====================

type RiskLevel = 'safe' | 'attention' | 'danger';

function assessRisk(causes: ParsedCause[]): { level: RiskLevel; topCause: string; color: string; bg: string; border: string; label: string } {
  if (causes.length === 0) {
    return { level: 'attention', topCause: '暂无诊断结果', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', label: '注意' };
  }

  const hasHighProb = causes.some(c => c.probability === 'high');
  const hasSevere = causes.some(c => c.severity.includes('严重'));
  const hasCantDrive = causes.some(c =>
    c.canDrive.includes('否') || c.canDrive.includes('停') || c.canDrive.includes('不可')
  );

  if (hasSevere || hasCantDrive) {
    return {
      level: 'danger',
      topCause: causes[0].name,
      color: 'text-red-800',
      bg: 'bg-red-50',
      border: 'border-red-400',
      label: '危险',
    };
  }
  if (hasHighProb) {
    return {
      level: 'attention',
      topCause: causes[0].name,
      color: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-400',
      label: '注意',
    };
  }
  return {
    level: 'safe',
    topCause: causes[0].name,
    color: 'text-green-800',
    bg: 'bg-green-50',
    border: 'border-green-400',
    label: '安全',
  };
}

// ==================== 价格解析 ====================

function parsePriceNum(priceStr: string): number {
  // 提取价格字符串中的第一个数字，例如 "¥300 + 工时费 ¥100" → 300
  const match = priceStr.match(/[\d,，]+/);
  if (!match) return 0;
  return parseInt(match[0].replace(/[,，]/g, ''), 10) || 0;
}

// ==================== 价格柱状图 ====================

function PriceBarChart({ parts }: { parts: { name: string; prices: string }[] }) {
  if (parts.length === 0) return null;

  // 取第一个配件的价格做柱状图
  const firstPart = parts[0];
  // 尝试解析三种件的价格
  const oemMatch = parts.find(p => p.name.includes('原厂'));
  const brandMatch = parts.find(p => p.name.includes('品牌'));
  const afterMatch = parts.find(p => p.name.includes('副厂'));

  const bars: { label: string; value: number; display: string; isBrand: boolean }[] = [];

  if (oemMatch) bars.push({ label: '原厂件', value: parsePriceNum(oemMatch.prices), display: oemMatch.prices, isBrand: false });
  if (brandMatch) bars.push({ label: '品牌件', value: parsePriceNum(brandMatch.prices), display: brandMatch.prices, isBrand: true });
  if (afterMatch) bars.push({ label: '副厂件', value: parsePriceNum(afterMatch.prices), display: afterMatch.prices, isBrand: false });

  // 如果无法识别三种件，回退到按顺序展示
  if (bars.length === 0) {
    const labels = ['原厂件', '品牌件', '副厂件'];
    parts.forEach((p, i) => {
      bars.push({
        label: labels[i] || p.name,
        value: parsePriceNum(p.prices),
        display: p.prices,
        isBrand: i === 1,
      });
    });
  }

  const maxVal = Math.max(...bars.map(b => b.value), 1);

  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground mb-2">
        价格参考{parts.length > 1 ? `（${firstPart.name}）` : ''}
      </p>
      <div className="flex items-end gap-3 h-28 px-2">
        {bars.map(bar => {
          const pct = Math.max((bar.value / maxVal) * 100, 15);
          return (
            <div key={bar.label} className="flex-1 h-full flex flex-col items-center">
              {/* 价格标签 */}
              <span className="text-xs font-medium text-foreground whitespace-nowrap mb-1">
                ¥{bar.value}
              </span>
              {/* 柱状区域 — flex-1 提供明确高度，justify-end 让柱子从底部生长 */}
              <div className="flex-1 w-full flex flex-col justify-end items-center">
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    bar.isBrand ? 'bg-accent' : 'bg-primary/40'
                  }`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              {/* 推荐标签 */}
              {bar.isBrand && (
                <Badge className="bg-accent text-white text-xs px-1.5 py-0 h-4 whitespace-nowrap mt-1">
                  性价比推荐
                </Badge>
              )}
              {/* 件名 */}
              <span className={`text-xs mt-1 ${bar.isBrand ? 'font-semibold text-accent' : 'text-muted-foreground'}`}>
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* 详细价格列表 */}
      {parts.length > 1 && (
        <div className="bg-muted/50 rounded-lg p-2.5 mt-3 space-y-1">
          {parts.map((part, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{part.name}</span>
              <span className="font-medium text-primary">{part.prices}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 反馈区域 ====================

function ReportFeedback() {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    setSubmitted(true);
  };

  const handleRating = (star: number) => {
    setRating(star);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1.5" />
        <p className="text-sm font-medium text-green-700">感谢您的反馈！</p>
        <p className="text-xs text-muted-foreground">您的意见帮助我们持续改进诊断质量</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 点赞/点踩 */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2.5">这份诊断对您有帮助吗？</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => handleFeedback('up')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-colors ${
              feedback === 'up'
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'hover:bg-muted border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            有帮助
          </button>
          <button
            onClick={() => handleFeedback('down')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-colors ${
              feedback === 'down'
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'hover:bg-muted border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
            没帮助
          </button>
        </div>
      </div>

      {/* 星级评分 */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1.5">为诊断质量打分</p>
        <div className="flex justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-colors"
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  (hoverRating || rating) >= star
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-border hover:text-amber-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export function DiagnosisReportView({ report }: DiagnosisReportViewProps) {
  const risk = assessRisk(report.causes);

  return (
    <div className="space-y-6">

      {/* ===== 总体评估卡片 ===== */}
      {report.causes.length > 0 && (
        <Card className={`border-2 ${risk.border} ${risk.bg} overflow-hidden relative ${risk.level === 'danger' ? 'animate-danger-pulse' : ''}`}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-4">
              {/* 风险图标 */}
              <div className={`flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl ${
                risk.level === 'danger' ? 'bg-red-200' : risk.level === 'attention' ? 'bg-amber-200' : 'bg-green-200'
              }`}>
                {risk.level === 'danger' ? (
                  <AlertTriangle className={`h-7 w-7 text-red-700 ${risk.level === 'danger' ? 'animate-blink' : ''}`} />
                ) : risk.level === 'attention' ? (
                  <Activity className="h-7 w-7 text-amber-700" />
                ) : (
                  <CheckCircle className="h-7 w-7 text-green-700" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${risk.bg} ${risk.color} ${risk.border} border`}>
                    综合风险：{risk.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">最可能的故障</p>
                <h3 className={`text-xl font-bold ${risk.color} leading-tight`}>
                  {risk.topCause}
                </h3>
                {report.causes.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    另有 {report.causes.length - 1} 个可能原因
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== 车辆信息 ===== */}
      {report.vehicleSummary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              车辆信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.vehicleSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* ===== 可能原因列表 ===== */}
      {report.causes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            可能的故障原因
          </h3>
          {report.causes.map((cause, idx) => {
            const pConfig = probabilityConfig[cause.probability];
            const sev = getSeverity(cause.severity);

            return (
              <Card key={idx} className="border-l-4 border-l-primary">
                <CardContent className="pt-5">
                  {/* 标题行 */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-base">{cause.name}</h4>
                    <Badge className={pConfig.className}>
                      {pConfig.label}
                    </Badge>
                  </div>

                  {/* 可能性进度条 */}
                  <div className="mb-4">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pConfig.barColor}`}
                        style={{ width: pConfig.barWidth }}
                      />
                    </div>
                  </div>

                  {/* 严重程度 + 能否行驶 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className={`${sev.border} ${sev.color} gap-1`}>
                      <span>{sev.emoji}</span>
                      <span>{cause.severity || sev.label}</span>
                    </Badge>
                    {cause.canDrive && (
                      <Badge
                        variant="outline"
                        className={
                          cause.canDrive.includes('否') || cause.canDrive.includes('停') || cause.canDrive.includes('不可')
                            ? 'border-red-300 text-red-700 gap-1'
                            : 'border-green-300 text-green-700 gap-1'
                        }
                      >
                        {cause.canDrive.includes('否') || cause.canDrive.includes('停') || cause.canDrive.includes('不可') ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {cause.canDrive.includes('否') || cause.canDrive.includes('停') || cause.canDrive.includes('不可')
                          ? '不建议继续行驶'
                          : '可继续行驶'}
                      </Badge>
                    )}
                  </div>

                  {/* 症状匹配 */}
                  {cause.matchExplanation && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">症状匹配</p>
                      <p className="text-sm">{cause.matchExplanation}</p>
                    </div>
                  )}

                  {/* 建议检查 */}
                  {cause.checkItems.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">建议检查</p>
                      <ul className="text-sm space-y-1">
                        {cause.checkItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 维修方案 */}
                  {cause.repairMethod && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">维修方案</p>
                      <p className="text-sm">{cause.repairMethod}</p>
                    </div>
                  )}

                  {/* 参考价格 — 柱状图 */}
                  {cause.parts.length > 0 && (
                    <PriceBarChart parts={cause.parts} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== 防被宰提醒 ===== */}
      {report.overchargeWarnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <ShieldAlert className="h-5 w-5" />
              防被宰提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.overchargeWarnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-orange-900">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ===== 建议下一步 ===== */}
      {report.nextSteps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              建议下一步
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {report.nextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* ===== 免责声明 ===== */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground">
          ⚠️ {report.disclaimer}
        </p>
      </div>

      {/* ===== 反馈区域 ===== */}
      <Card className="border-dashed">
        <CardContent className="py-5">
          <ReportFeedback />
        </CardContent>
      </Card>
    </div>
  );
}
