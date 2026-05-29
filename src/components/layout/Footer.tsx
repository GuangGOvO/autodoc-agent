// 底部栏

import Link from 'next/link';
import { Car, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* 品牌 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-lg text-primary mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Car className="h-4 w-4" />
              </div>
              AutoDoc 智驾医生
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              AI 驱动的汽车自助预诊断工具。通过多轮对话帮您分析车辆故障，
              给出维修方案和参考价格，让您修车不再踩坑。
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">快速开始</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/diagnose" className="hover:text-primary transition-colors">
                  智能诊断
                </Link>
              </li>
              <li>
                <Link href="/used-car" className="hover:text-primary transition-colors">
                  二手车评估
                </Link>
              </li>
              <li>
                <Link href="/vehicles" className="hover:text-primary transition-colors">
                  我的车辆
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-primary transition-colors">
                  诊断历史
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">关于</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/admin" className="hover:text-primary transition-colors">
                  管理后台
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  反馈建议
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              © 2026 AutoDoc 智驾医生 · "经开智造" AI 智能体大赛参赛作品
            </p>
            <p>
              ⚠️ 本工具仅提供参考信息，不构成专业维修建议
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
