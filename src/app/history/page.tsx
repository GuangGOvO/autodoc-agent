// 诊断历史页面

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileSearch, Clock, MessageSquare, Trash2, Search, ChevronRight, PlayCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getDiagnosisSessions, deleteDiagnosisSession } from '@/lib/storage';
import type { DiagnosisSession } from '@/types/diagnosis';
import { isDiagnosisReport } from '@/lib/reportParser';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [filtered, setFiltered] = useState<DiagnosisSession[]>([]);
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await getDiagnosisSessions();
      setSessions(data);
      setFiltered(data);
      setLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(sessions);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      sessions.filter(s =>
        s.initialSymptom.toLowerCase().includes(q) ||
        s.messages.some(m => m.content.toLowerCase().includes(q))
      )
    );
  }, [search, sessions]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这条诊断记录吗？')) {
      await deleteDiagnosisSession(id);
      const updated = await getDiagnosisSessions();
      setSessions(updated);
      setFiltered(updated);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `今天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `昨天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `${days}天前`;
    }
    return d.toLocaleDateString('zh-CN');
  };

  const hasReport = (session: DiagnosisSession) => {
    return session.messages.some(m => m.role === 'assistant' && isDiagnosisReport(m.content));
  };

  if (!loaded) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页头 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">诊断历史</h1>
        <p className="text-sm text-muted-foreground mt-1">
          查看过往的诊断记录，随时回顾车辆健康状况
        </p>
      </div>

      {/* 搜索框 */}
      {sessions.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索诊断记录..."
            className="pl-9"
          />
        </div>
      )}

      {/* 列表 */}
      {sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
              <FileSearch className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">暂无诊断记录</h3>
            <p className="text-sm text-muted-foreground mb-6">
              完成一次智能诊断后，记录会自动保存在这里
            </p>
            <Link
              href="/diagnose"
              className="inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              开始诊断
            </Link>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">没有找到匹配的诊断记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const isCompleted = session.status === 'completed';
            const isReport = hasReport(session);

            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* 左侧内容 */}
                    <Link href={`/diagnose/${session.id}`} className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                          <FileSearch className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-1">{session.initialSymptom}</h3>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(session.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {session.messages.length} 条消息
                            </span>
                            {isReport && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 bg-green-100 text-green-800">
                                有报告
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs px-1.5 py-0 h-4 ${
                                isCompleted ? 'border-green-300 text-green-700' : 'border-amber-300 text-amber-700'
                              }`}
                            >
                              {isCompleted ? '已完成' : '进行中'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* 右侧操作按钮 */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* 进行中 → 继续问诊 */}
                      {!isCompleted && (
                        <Link href={`/diagnose?sessionId=${session.id}`}>
                          <Button size="sm" variant="default" className="h-8 gap-1 text-xs">
                            <PlayCircle className="h-3.5 w-3.5" />
                            继续问诊
                          </Button>
                        </Link>
                      )}

                      {/* 已完成 → 查看详情 + 追问 */}
                      {isCompleted && (
                        <>
                          <Link href={`/diagnose/${session.id}`}>
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                              <ChevronRight className="h-3.5 w-3.5" />
                              详情
                            </Button>
                          </Link>
                          {isReport && (
                            <Link href={`/diagnose?followUpSessionId=${session.id}`}>
                              <Button size="sm" variant="secondary" className="h-8 gap-1 text-xs">
                                <HelpCircle className="h-3.5 w-3.5" />
                                追问
                              </Button>
                            </Link>
                          )}
                        </>
                      )}

                      {/* 删除 */}
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
