// 首页快速体验入口

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const QUICK_SYMPTOMS = [
  '发动机抖动',
  '刹车异响',
  '空调不制冷',
  '仪表盘亮故障灯',
];

export function QuickDiagnose() {
  const router = useRouter();
  const [symptom, setSymptom] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSubmit = () => {
    const trimmed = symptom.trim();
    if (!trimmed) return;
    setIsNavigating(true);
    router.push(`/diagnose?symptom=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="border-2 border-primary/20 shadow-lg shadow-primary/5 overflow-hidden">
          {/* 顶部渐变条 */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

          <CardContent className="pt-6 pb-7">
            {/* 标题 */}
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold">试试 AI 诊断</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              输入一个症状，立即体验 AI 智能问诊，无需登录
            </p>

            {/* 输入框 + 发送按钮 */}
            <div className="flex gap-2 mb-4">
              <Input
                value={symptom}
                onChange={e => setSymptom(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述车辆问题，例如：冷启动时发动机抖动..."
                className="flex-1 h-11 text-sm"
                disabled={isNavigating}
              />
              <Button
                onClick={handleSubmit}
                disabled={!symptom.trim() || isNavigating}
                className="h-11 px-5 gap-1.5"
              >
                {isNavigating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">开始诊断</span>
              </Button>
            </div>

            {/* 快捷标签 */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-0.5">热门症状：</span>
              {QUICK_SYMPTOMS.map(s => (
                <button
                  key={s}
                  onClick={() => setSymptom(s)}
                  className="px-3 py-1 text-xs rounded-full border border-border hover:border-accent hover:bg-accent/10 hover:text-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
