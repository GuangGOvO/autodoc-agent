// 注册页面

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signUp, checkUsernameAvailable } from '@/lib/auth';
import { Check, X, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 防抖检查用户名是否可用
  const checkUsername = useCallback(async (name: string) => {
    if (name.length < 2) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');

    // 防抖
    await new Promise(resolve => setTimeout(resolve, 500));

    const available = await checkUsernameAvailable(name);
    setUsernameStatus(available ? 'available' : 'taken');
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
    checkUsername(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证
    if (username.length < 2 || username.length > 20) {
      setError('用户名需要 2-20 个字符');
      return;
    }

    if (password.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (usernameStatus === 'taken') {
      setError('用户名已被占用，请换一个');
      return;
    }

    setLoading(true);

    const { user, error } = await signUp(email, password, username);

    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    if (user) {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">注册 AutoDoc</CardTitle>
          <CardDescription>创建账号，开始使用 AI 汽车诊断</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="输入用户名（2-20字符）"
                  value={username}
                  onChange={handleUsernameChange}
                  required
                  className="pr-10"
                />
                {usernameStatus === 'checking' && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === 'available' && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {usernameStatus === 'taken' && (
                  <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </div>
              {usernameStatus === 'taken' && (
                <p className="text-xs text-red-600">用户名已被占用</p>
              )}
              {usernameStatus === 'available' && (
                <p className="text-xs text-green-600">用户名可用</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少 6 个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || usernameStatus === 'taken'}>
              {loading ? '注册中...' : '注册'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              已有账号？{' '}
              <Link href="/login" className="text-primary hover:underline">
                立即登录
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
