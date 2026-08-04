// 个人中心

'use client';

import { useState, useEffect } from 'react';
import { User, Car, FileSearch, Save, Settings, CarFront } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUserProfile, saveUserProfile, getStats, getDiagnosisSessions } from '@/lib/storage';
import type { UserProfile } from '@/lib/storage';
import type { DiagnosisSession } from '@/types/diagnosis';
import { DetailSkeleton } from '@/components/ui/page-skeleton';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({ name: '', phone: '', email: '', avatarUrl: '' });
  const [stats, setStats] = useState({ totalSessions: 0, completedSessions: 0, totalVehicles: 0, totalEvaluations: 0 });
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [p, s, sessions] = await Promise.all([
        getUserProfile(),
        getStats(),
        getDiagnosisSessions(),
      ]);
      if (p) setProfile(p);
      setStats(s);
      setRecentDiagnoses(sessions.slice(0, 5));
      setLoaded(true);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    await saveUserProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">个人中心</h1>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-2">
              <FileSearch className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">总诊断次数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 mx-auto mb-2">
              <Settings className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{stats.completedSessions}</p>
            <p className="text-xs text-muted-foreground">已完成诊断</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 mx-auto mb-2">
              <Car className="h-5 w-5 text-accent" />
            </div>
            <p className="text-2xl font-bold">{stats.totalVehicles}</p>
            <p className="text-xs text-muted-foreground">我的车辆</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 mx-auto mb-2">
              <CarFront className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{stats.totalEvaluations}</p>
            <p className="text-xs text-muted-foreground">二手车评估</p>
          </CardContent>
        </Card>
      </div>

      {/* 个人信息 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            个人信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">昵称</label>
            <Input
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              placeholder="输入您的昵称"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">手机号</label>
            <Input
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
              placeholder="输入手机号"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">邮箱</label>
            <Input
              value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
              placeholder="输入邮箱地址"
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            <Save className="mr-1 h-4 w-4" />
            {saved ? '已保存 ✓' : '保存信息'}
          </Button>
        </CardContent>
      </Card>

      {/* 最近诊断 */}
      {recentDiagnoses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-primary" />
              最近诊断
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDiagnoses.map((s: DiagnosisSession) => (
                <a
                  key={s.id}
                  href={`/diagnose/${s.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="text-sm line-clamp-1">{s.initialSymptom}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                    {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                  </Badge>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 版本信息 */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>AutoDoc 智驾医生 v0.1.0</p>
        <p className="mt-1">本工具仅提供参考信息，不构成专业维修建议</p>
      </div>
    </div>
  );
}
