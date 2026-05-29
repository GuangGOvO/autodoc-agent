// 诊断报告详情页

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MessageSquare, FileText, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { DiagnosisReportView } from '@/components/report/DiagnosisReportView';
import { getDiagnosisSessionById } from '@/lib/storage';
import type { DiagnosisSession } from '@/types/diagnosis';
import { parseDiagnosisReport, isDiagnosisReport } from '@/lib/reportParser';
import { DetailSkeleton } from '@/components/ui/page-skeleton';

export default function DiagnosisDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<DiagnosisSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      const loadSession = async () => {
        const s = await getDiagnosisSessionById(id);
        setSession(s || null);
        setLoaded(true);
      };
      loadSession();
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

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">未找到诊断记录</h1>
        <p className="text-muted-foreground mb-6">该诊断记录不存在或已被删除</p>
        <Link
          href="/history"
          className="inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回历史
        </Link>
      </div>
    );
  }

  // 查找诊断报告（最后一条 assistant 消息中包含报告格式的内容）
  const reportMessage = [...session.messages].reverse().find(
    m => m.role === 'assistant' && isDiagnosisReport(m.content)
  );
  const parsedReport = reportMessage ? parseDiagnosisReport(reportMessage.content) : null;

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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* 返回按钮 */}
      <Link
        href="/history"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回诊断历史
      </Link>

      {/* 会话信息 */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold mb-1">{session.initialSymptom}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(session.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {session.messages.length} 条消息
                </span>
                <Badge
                  variant={session.status === 'completed' ? 'secondary' : 'outline'}
                  className={session.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                >
                  {session.status === 'completed' ? '已完成' : '进行中'}
                </Badge>
              </div>
            </div>
            {/* 追问按钮 */}
            {session.status === 'completed' && reportMessage && (
              <Link href={`/diagnose?followUpSessionId=${session.id}`}>
                <Button size="sm" variant="secondary" className="gap-1">
                  <HelpCircle className="h-4 w-4" />
                  追问
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 诊断报告（结构化） */}
      {parsedReport && parsedReport.causes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">诊断报告</h2>
          </div>
          <DiagnosisReportView report={parsedReport} rawMarkdown={reportMessage?.content} />
        </div>
      )}

      <Separator className="my-6" />

      {/* 对话记录 */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          完整对话记录
        </h2>
      </div>
      <Card>
        <CardContent className="py-4 divide-y">
          {session.messages.map(msg => (
            <div key={msg.id} className="py-3 first:pt-0 last:pb-0">
              <MessageBubble message={msg} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 还有疑问？基于此诊断继续追问 */}
      {session.status === 'completed' && reportMessage && (
        <Card className="mt-6 border-blue-200 bg-blue-50/50">
          <CardContent className="py-6 text-center">
            <HelpCircle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1">还有疑问？</h3>
            <p className="text-sm text-muted-foreground mb-4">
              对诊断结果有疑问？想了解更多维修细节？可以继续追问 AI 技师
            </p>
            <Link href={`/diagnose?followUpSessionId=${session.id}`}>
              <Button className="gap-1.5">
                <MessageSquare className="h-4 w-4" />
                基于此诊断继续追问
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
