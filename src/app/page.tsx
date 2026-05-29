// 首页

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuickDiagnose } from '@/components/home/QuickDiagnose';
import {
  MessageSquare,
  ShieldAlert,
  Wrench,
  FileSearch,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CarFront,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ===== Hero 区域 ===== */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background pt-16 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center max-w-3xl relative">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            AI 驱动 · 智能诊断 · 防被宰
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-5 leading-[1.2] tracking-tight">
            修车前，先问 <span className="text-accent">AutoDoc</span>
          </h1>

          <p className="text-xl md:text-2xl font-semibold text-primary mb-5">
            让每一分钱都花在刀刃上
          </p>

          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            描述车辆问题，AI 技师帮您分析故障原因、给出维修方案和参考价格，
            附带防被宰提醒，修车不再踩坑。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link href="/diagnose" className={buttonVariants({ size: 'lg', className: 'text-base px-8 h-12' })}>
              <MessageSquare className="mr-2 h-5 w-5" />
              开始智能诊断
            </Link>
            <Link href="/used-car" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'text-base px-8 h-12' })}>
              <CarFront className="mr-2 h-5 w-5" />
              二手车评估
            </Link>
          </div>

          {/* 数据亮点 */}
          <div className="inline-flex items-center gap-6 md:gap-8 text-sm text-muted-foreground bg-white/80 backdrop-blur rounded-full px-6 py-2.5 shadow-sm border">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-primary">42+</span>
              <span>故障知识</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-primary">8</span>
              <span>大系统</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-accent" />
              <span>防被宰</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 快速体验入口 ===== */}
      <QuickDiagnose />

      {/* ===== 真实案例对比 ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              修车被宰有多常见？
            </h2>
            <p className="text-base text-muted-foreground max-w-lg mx-auto">
              每年数千万车主遭遇过度维修，AutoDoc 帮您识别套路、理性消费
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 案例 1 - 被宰 */}
            <Card className="border-red-200 overflow-hidden">
              <div className="bg-red-50 px-5 py-3 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-800">没有 AutoDoc</span>
                </div>
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-10 flex-shrink-0 pt-0.5">车主</span>
                  <p className="text-sm bg-muted/60 rounded-lg px-3 py-2 flex-1">
                    发动机故障灯亮了，去4S店检查
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-red-600 w-10 flex-shrink-0 pt-0.5">4S店</span>
                  <p className="text-sm bg-red-50 rounded-lg px-3 py-2 text-red-900 flex-1">
                    需要更换整个发动机控制模块，费用 <strong>¥8,500</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-10 flex-shrink-0 pt-0.5">结果</span>
                  <p className="text-sm text-red-700 flex-1">
                    花了 8500 元，后来发现只是个氧传感器，<strong>200 元</strong>就能解决
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 案例 2 - 用 AutoDoc */}
            <Card className="border-green-200 overflow-hidden">
              <div className="bg-green-50 px-5 py-3 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-800">使用 AutoDoc 后</span>
                </div>
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-10 flex-shrink-0 pt-0.5">车主</span>
                  <p className="text-sm bg-muted/60 rounded-lg px-3 py-2 flex-1">
                    发动机故障灯亮了
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-primary w-10 flex-shrink-0 pt-0.5">AI</span>
                  <div className="text-sm bg-primary/5 rounded-lg px-3 py-2 flex-1">
                    <p>最可能是氧传感器故障（概率 60%），维修费 ¥150-350</p>
                    <p className="mt-1.5 text-accent font-medium text-xs">
                      ⚠️ 防被宰：不要被忽悠换整个ECU，先读OBD故障码
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-10 flex-shrink-0 pt-0.5">结果</span>
                  <p className="text-sm text-green-700 flex-1">
                    让修理厂先读故障码，确认是氧传感器，<strong>省了 ¥8,000+</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== 核心功能 ===== */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            核心功能
          </h2>
          <p className="text-base text-muted-foreground text-center mb-10 max-w-lg mx-auto">
            三大核心能力，让修车不再信息不对称
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                  <MessageSquare className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">多轮智能对话</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  像和专业技师聊天一样，AI 追问关键细节，精准定位故障原因
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-4">
                  <Wrench className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-base font-semibold mb-2">透明报价</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  原厂件 / 品牌件 / 副厂件三种价格参考，修车心里有数
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 mx-auto mb-4">
                  <ShieldAlert className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="text-base font-semibold mb-2">防被宰提醒</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  揭露常见过度维修套路，标注可疑建议，帮您避开陷阱
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 附加功能 — 简洁两列 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 flex-shrink-0">
                  <CarFront className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-0.5">二手车车况快评</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI 评估车况、分析可疑点、给出合理价格区间
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                  <FileSearch className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-0.5">诊断历史回顾</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    记录自动保存，随时回顾车辆健康状况
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== 使用流程 ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            三步搞定车辆诊断
          </h2>
          <p className="text-base text-muted-foreground text-center mb-12 max-w-md mx-auto">
            简单三步，让修车变得透明
          </p>

          <div className="relative">
            {/* 连接线（桌面端） */}
            <div className="hidden md:block absolute top-6 left-[16.6%] right-[16.6%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
              {[
                {
                  step: '1',
                  title: '描述症状',
                  desc: '用大白话告诉 AI 你的车怎么了',
                },
                {
                  step: '2',
                  title: 'AI 追问分析',
                  desc: 'AI 追问关键信息，结合知识库分析',
                },
                {
                  step: '3',
                  title: '获取诊断报告',
                  desc: '获得原因、方案、价格和防坑指南',
                },
              ].map(item => (
                <div key={item.step} className="text-center relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-lg font-bold mx-auto mb-4 shadow-lg shadow-primary/20 relative z-10">
                    {item.step}
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/diagnose" className={buttonVariants({ size: 'lg', className: 'px-8' })}>
              立即体验
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 常见套路揭秘 ===== */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-orange-50/60 to-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-accent" />
              <h2 className="text-2xl md:text-3xl font-bold">修车常见套路</h2>
            </div>
            <p className="text-base text-muted-foreground">AutoDoc 内置防被宰知识库，帮您识别这些陷阱</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: '小病变大修',
                desc: '传感器故障说成模块损坏，¥200 零件要你 ¥8000 换总成',
              },
              {
                title: '以换代修',
                desc: '明明可以修复的部件，直接让你换新件，多花几倍的钱',
              },
              {
                title: '虚报工时',
                desc: '1小时的活报3小时工时费，工时单价还往高了算',
              },
              {
                title: '副厂件收原厂价',
                desc: '用副厂件、翻新件冒充原厂件，收你原厂件的价格',
              },
            ].map((item, idx) => (
              <Card key={idx} className="border-orange-200/60 bg-white">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 知识库覆盖 ===== */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            覆盖 8 大汽车系统
          </h2>
          <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
            42+ 故障类型，涵盖中国市场最常见的车型故障
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { name: '发动机', count: '20+' },
              { name: '变速箱', count: '4+' },
              { name: '底盘悬挂', count: '3+' },
              { name: '制动系统', count: '4+' },
              { name: '电气系统', count: '4+' },
              { name: '空调系统', count: '3+' },
              { name: '车身', count: '2+' },
              { name: '转向系统', count: '2+' },
            ].map(sys => (
              <Card key={sys.name} className="bg-white">
                <CardContent className="py-3 text-center">
                  <p className="text-xl font-bold text-primary">{sys.count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sys.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Link href="/diagnose" className={buttonVariants({ size: 'lg' })}>
            <MessageSquare className="mr-2 h-5 w-5" />
            立即诊断您的车辆问题
          </Link>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            常见问题
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'AutoDoc 的诊断结果准确吗？',
                a: '基于 AI 大模型和结构化知识库分析，能给出较为可靠的参考。但准确诊断需要专业设备现场检查，结果仅供参考。',
              },
              {
                q: '价格数据从哪里来？',
                a: '参考公开的汽车配件市场行情和《汽车维修工时定额标准》，标注原厂件/品牌件/副厂件三种价格。实际价格因地区和渠道而异。',
              },
              {
                q: '可以替代去4S店检查吗？',
                a: 'AutoDoc 定位是"修车前的预诊断"，帮您心里有数，避免被过度维修。不能替代专业技师的现场检查。',
              },
              {
                q: '支持哪些车型？',
                a: '覆盖大众、丰田、本田、日产、比亚迪、特斯拉、哈弗等主流品牌。即使车型不在列表中，AI 也能基于通用知识分析。',
              },
            ].map((item, idx) => (
              <Card key={idx} className="bg-muted/20">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 免责声明 ===== */}
      <section className="py-6 bg-muted/40 border-t">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⚠️ AutoDoc 智驾医生提供的所有诊断结果、维修方案和价格信息仅供参考，不构成专业维修建议。
            具体故障原因和维修方案请咨询专业维修技师。
          </p>
        </div>
      </section>
    </div>
  );
}
