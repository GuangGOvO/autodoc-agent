// 预设演示数据 — 用于比赛 Demo 展示

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  saveVehicle,
  getVehicles,
  deleteVehicle,
  getDiagnosisSessions,
  deleteDiagnosisSession,
  createDiagnosisSession,
  addMessageToSession,
  updateDiagnosisSession,
  getUsedCarEvaluations,
  deleteUsedCarEvaluation,
  saveUsedCarEvaluation,
} from '@/lib/storage';
import type { ChatMessage, DiagnosisSession } from '@/types/diagnosis';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// 预设车辆
const demoVehicles = [
  {
    brand: '大众',
    series: '朗逸',
    year: '2020',
    engine: '1.5L',
    transmission: '6AT',
    mileage: 45000,
    licensePlate: '鄂A·88888',
    notes: '日常通勤用车',
  },
  {
    brand: '丰田',
    series: '卡罗拉',
    year: '2021',
    engine: '1.8L双擎',
    transmission: 'E-CVT',
    mileage: 32000,
    licensePlate: '鄂A·66666',
    notes: '混动版，省油',
  },
  {
    brand: '比亚迪',
    series: '秦PLUS',
    year: '2023',
    engine: '1.5L DM-i',
    transmission: 'E-CVT',
    mileage: 18000,
    licensePlate: '鄂A·12345',
    notes: '新能源混动',
  },
];

// 预设诊断会话
const demoSessions: {
  initialSymptom: string;
  status: 'in_progress' | 'completed';
  daysAgo: number;
  messages: { role: 'user' | 'assistant'; content: string }[];
}[] = [
  {
    initialSymptom: '冷启动时发动机抖动明显，热车后好转',
    status: 'completed',
    daysAgo: 3,
    messages: [
      {
        role: 'user',
        content: '我的车是大众朗逸2020款1.5L。最近早上冷启动的时候发动机抖动很明显，等热车几分钟就好多了，这是什么问题？',
      },
      {
        role: 'assistant',
        content: '您好！冷启动抖动是比较常见的问题。我需要再了解几个细节：\n\n1. 这个抖动持续多久了？是最近才出现还是一直都有？\n2. 除了抖动，有没有其他症状，比如怠速不稳、加速无力、或者故障灯亮？\n3. 最近一次保养是什么时候？有没有换过火花塞？',
      },
      {
        role: 'user',
        content: '大概有一两周了，之前没这么明显。怠速的时候转速表会上下波动，大概700-900之间晃。故障灯没亮。上次保养是半年前，没换火花塞。',
      },
      {
        role: 'assistant',
        content: '了解了，转速波动说明怠速控制可能有问题。再确认一下：\n\n1. 车子目前跑了多少公里？\n2. 加油的时候有没有感觉顿挫或者动力不足？\n3. 最近加的油品有没有变化？',
      },
      {
        role: 'user',
        content: '跑了45000公里，加油还算正常，就是冷车的时候抖。油一直加的中石化92号。',
      },
      {
        role: 'assistant',
        content: `## 🔍 诊断报告

### 📋 车辆信息
- 品牌车型：大众朗逸 2020款 1.5L
- 表显里程：45,000公里
- 症状：冷启动发动机抖动，怠速不稳（700-900rpm波动），热车后好转
- 持续时间：1-2周

### ⚙️ 可能的故障原因

#### 原因1：节气门积碳（可能性：高）
- **症状匹配**：冷启动抖动+怠速波动是节气门积碳的典型表现，积碳导致进气不畅，ECU无法精确控制怠速
- **建议检查**：节气门开度数据、进气道积碳情况
- **维修方案**：清洗节气门+进气道，必要时做电脑匹配
- **参考价格**：
  - 4S店：¥300-500（含工时）
  - 修理厂：¥150-250（含工时）
- **严重程度**：轻微
- **能否继续行驶**：可以，但建议尽快处理

#### 原因2：火花塞老化（可能性：中）
- **症状匹配**：45000公里如果从未更换火花塞，点火效率下降会导致冷启动混合气燃烧不充分
- **建议检查**：拆检火花塞电极间隙和烧蚀情况
- **维修方案**：更换4支火花塞
- **参考价格**：
  - 原厂件：¥40/支 × 4 + 工时¥80 = ¥240
  - 品牌件（NGK）：¥25/支 × 4 + 工时¥80 = ¥180
- **严重程度**：轻微
- **能否继续行驶**：可以

#### 原因3：点火线圈老化（可能性：低）
- **症状匹配**：点火线圈性能衰减也会导致冷启动缺火抖动，但通常伴随加速顿挫
- **建议检查**：读取各缸失火数据、检查点火线圈外观
- **维修方案**：更换故障的点火线圈
- **参考价格**：
  - 原厂件：¥350/个 + 工时¥50
  - 品牌件：¥150/个 + 工时¥50
- **严重程度**：中等
- **能否继续行驶**：可以，但建议尽快检修

### ⚠️ 防被宰提醒
- 不要被忽悠"换整个进气歧管"，清洗节气门就能解决大部分积碳问题
- 4S店可能推荐做"全套进气系统清洗"（¥800-1500），实际上普通清洗节气门就够了
- 火花塞4万公里更换是正常的，但如果4S店报价超过¥400就偏贵了
- 如果修理厂说要点火线圈"全部换掉"，要求先读失火数据确认哪个缸有问题

### 📝 建议下一步
1. 先去修理厂清洗节气门（¥150-250），这是最可能的原因
2. 同时让师傅检查火花塞状况，如果电极间隙过大就一起换掉
3. 清洗后跑几天观察，如果还有抖动再检查点火线圈

---
⚠️ 免责声明：以上诊断结果仅供参考，不构成专业维修建议。具体故障原因和维修方案请咨询专业维修技师。`,
      },
    ],
  },
  {
    initialSymptom: '刹车时有尖锐的金属摩擦声',
    status: 'completed',
    daysAgo: 7,
    messages: [
      {
        role: 'user',
        content: '我的丰田卡罗拉2021款，最近踩刹车的时候有尖锐的吱吱声，像是金属摩擦的声音。',
      },
      {
        role: 'assistant',
        content: `## 🔍 诊断报告

### 📋 车辆信息
- 品牌车型：丰田卡罗拉 2021款 1.8L双擎
- 症状：踩刹车时出现尖锐金属摩擦声

### ⚙️ 可能的故障原因

#### 原因1：刹车片磨损到极限（可能性：高）
- **症状匹配**：尖锐金属声是刹车片磨损指示器（铁片）接触刹车盘的典型声音，说明刹车片已经磨到极限
- **建议检查**：检查前后刹车片厚度（低于3mm需更换）
- **维修方案**：更换前/后刹车片
- **参考价格**：
  - 原厂件：¥400-600/对 + 工时¥150
  - 品牌件（博世/天合）：¥200-350/对 + 工时¥150
- **严重程度**：中等（继续行驶可能损伤刹车盘）
- **能否继续行驶**：建议尽快检修，避免损伤刹车盘

#### 原因2：刹车盘表面不平（可能性：低）
- **症状匹配**：刹车盘表面有沟槽或变形也会产生异响
- **建议检查**：检查刹车盘表面平整度
- **维修方案**：光盘（车削修复）或更换刹车盘
- **参考价格**：
  - 光盘：¥100-200/个
  - 更换刹车盘：¥500-800/对 + 工时¥200
- **严重程度**：中等
- **能否继续行驶**：建议尽快检修

### ⚠️ 防被宰提醒
- 先检查是前刹还是后刹响，不要前后都换
- 如果刹车盘没有明显沟槽，不需要"光盘"或换盘
- 不要被推荐做"刹车系统深度保养"（¥500+），换刹车片就够了
- 品牌件（博世、天合）质量不输原厂，价格便宜一半

### 📝 建议下一步
1. 尽快去修理厂检查刹车片厚度
2. 如果确实磨损到极限，更换刹车片即可
3. 同时检查刹车盘状况，没有沟槽就不用处理

---
⚠️ 免责声明：以上诊断结果仅供参考，不构成专业维修建议。具体故障原因和维修方案请咨询专业维修技师。`,
      },
    ],
  },
  {
    initialSymptom: '空调出风口有异味，制冷效果变差',
    status: 'completed',
    daysAgo: 14,
    messages: [
      {
        role: 'user',
        content: '卡罗拉空调开的时候有一股霉味，而且感觉没以前凉了。',
      },
      {
        role: 'assistant',
        content: `## 🔍 诊断报告

### 📋 车辆信息
- 品牌车型：丰田卡罗拉 2021款
- 症状：空调出风有霉味 + 制冷效果下降

### ⚙️ 可能的故障原因

#### 原因1：空调滤芯脏污 + 蒸发箱发霉（可能性：高）
- **症状匹配**：霉味几乎100%是蒸发箱或风道发霉导致，制冷差可能同时是滤芯堵塞影响风量
- **建议检查**：检查空调滤芯、蒸发箱状况
- **维修方案**：更换空调滤芯 + 蒸发箱清洗
- **参考价格**：
  - 空调滤芯：¥50-120 + 工时¥30
  - 蒸发箱清洗：¥150-300
- **严重程度**：轻微
- **能否继续行驶**：可以

#### 原因2：制冷剂不足（可能性：中）
- **症状匹配**：制冷效果下降也可能是制冷剂泄漏导致不足
- **建议检查**：检查制冷剂压力、管路有无渗漏
- **维修方案**：补充制冷剂，如有漏点需修复
- **参考价格**：
  - 补充制冷剂：¥150-300
  - 修复漏点：¥300-800
- **严重程度**：轻微
- **能否继续行驶**：可以

### ⚠️ 防被宰提醒
- "空调系统深度清洗"报价超过¥500就偏贵了，正常¥200-300
- 不要盲目加氟（制冷剂），先查有没有漏点
- 空调滤芯自己都能换，网购¥30-50，4S店要¥150+

### 📝 建议下一步
1. 先换空调滤芯（最简单最便宜）
2. 做蒸发箱清洗除霉
3. 如果还制冷不好，再检查制冷剂

---
⚠️ 免责声明：以上诊断结果仅供参考，不构成专业维修建议。具体故障原因和维修方案请咨询专业维修技师。`,
      },
    ],
  },
  {
    initialSymptom: '方向盘高速时抖动',
    status: 'in_progress',
    daysAgo: 1,
    messages: [
      {
        role: 'user',
        content: '我的比亚迪秦PLUS跑高速的时候方向盘抖动，速度到100以上就比较明显。',
      },
      {
        role: 'assistant',
        content: '高速方向盘抖动需要排查几个方面。请问：\n\n1. 抖动是在特定速度区间（比如100-120km/h）最明显，还是越快越抖？\n2. 踩刹车的时候抖动会加重吗？\n3. 最近有没有补过胎或者换过轮胎？',
      },
      {
        role: 'user',
        content: '大概100到120之间最明显，再快反而好一些。踩刹车没有加重。上个月补过一次后轮。',
      },
      {
        role: 'assistant',
        content: '有特定速度区间+补过胎，大概率是轮胎动平衡的问题。还需要确认一下：\n\n1. 补的是后轮，但方向盘抖一般是前轮的问题。前轮最近有没有做过动平衡？\n2. 车子有没有跑偏的感觉？',
      },
    ],
  },
];

// 预设二手车评估
const demoUsedCar = {
  input: {
    brand: '本田',
    series: '思域',
    year: '2019',
    mileage: 6.8,
    askingPrice: 7.5,
    description: '2019年5月上牌，一手车，全程4S店保养，无事故无水泡。平时上下班代步，保养记录齐全。因换新能源车出售，车况良好，内饰9成新。',
    color: '白色',
    transferCount: 0,
  },
  reportMarkdown: `## 🚗 二手车车况评估报告

### 📋 车辆信息
- 品牌车型：本田思域
- 年款：2019款
- 表显里程：6.8万公里
- 卖家报价：¥7.5万
- 过户次数：0次（一手车）
- 颜色：白色

### 📊 综合评分：78 分（良好）

### 💰 价格分析
- **合理价格区间**：¥6.8万 - ¥8.2万
- **卖家报价评估**：合理 — 报价在市场价区间内，略高于中位价

### 🔧 该车型常见坑点
- 1.5T发动机机油增多问题（2016-2018款较多，2019款已改善但仍需留意）
- CVT变速箱在激烈驾驶时可能出现过热保护
- 底盘隔音一般，高速风噪胎噪较大
- 原厂刹车偏软，制动距离较长

### 🔍 建议重点检查
- 检查机油液面是否偏高（机油增多症状）
- 检查CVT变速箱油颜色和里程，确认是否按时更换
- 检查底盘有无托底痕迹
- 试驾时注意CVT在急加速时是否有打滑感
- 检查轮胎磨损是否均匀（判断四轮定位状态）

### ⚠️ 可疑点 / 风险提示
- "全程4S店保养"需要核实保养记录，可通过本田官方APP查询
- 6.8万公里对于5年车龄属于偏高使用（年均1.36万），需确认是否长途用车为主
- 卖车原因"换新能源"比较常见且合理，但仍建议确认是否有隐性故障

### ✅ 优势 / 亮点
- 一手车，无过户记录，车况相对可控
- 白色是思域最保值颜色之一
- 2019款是十代思域中期改款，品质较早期款有提升
- 思域保值率在紧凑型车中属于第一梯队

### 📝 购买建议
这辆2019款思域整体车况评估为良好，卖家报价在合理范围内。建议：
1. 要求卖家提供4S店保养记录截图或授权查询
2. 找第三方检测机构做一次全面检查（约¥300-500）
3. 重点试驾CVT变速箱和检查机油状况
4. 如果车况确认良好，可以尝试谈到¥7万-7.2万
5. 过户前确认无抵押、无违章

---
⚠️ 免责声明：以上评估结果仅供参考，不构成专业评估意见。建议到正规检测机构做全面检查后再做购买决定。`,
};

export default function SeedDataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    vehicles: number;
    sessions: number;
    evaluations: number;
  } | null>(null);
  const [existingData, setExistingData] = useState({
    vehicles: 0,
    sessions: 0,
    evaluations: 0,
  });
  const [cleared, setCleared] = useState(false);

  // 检查现有数据
  const checkExisting = async () => {
    const [vehicles, sessions, evaluations] = await Promise.all([
      getVehicles(),
      getDiagnosisSessions(),
      getUsedCarEvaluations(),
    ]);
    setExistingData({
      vehicles: vehicles.length,
      sessions: sessions.length,
      evaluations: evaluations.length,
    });
  };

  useEffect(() => {
    checkExisting();
  }, []);

  // 清除所有数据
  const handleClearAll = async () => {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;

    const [vehicles, sessions, evaluations] = await Promise.all([
      getVehicles(),
      getDiagnosisSessions(),
      getUsedCarEvaluations(),
    ]);

    // 清除车辆
    await Promise.all(vehicles.map(v => deleteVehicle(v.id)));
    // 清除诊断
    await Promise.all(sessions.map(s => deleteDiagnosisSession(s.id)));
    // 清除评估
    await Promise.all(evaluations.map(e => deleteUsedCarEvaluation(e.id)));

    setCleared(true);
    await checkExisting();
  };

  // 导入演示数据
  const handleSeedDemo = async () => {
    setLoading(true);
    setResult(null);

    try {
      // 添加车辆
      let vehicleCount = 0;
      for (const v of demoVehicles) {
        await saveVehicle(v);
        vehicleCount++;
      }

      // 添加诊断会话
      let sessionCount = 0;
      for (const s of demoSessions) {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - s.daysAgo);

        const messages: ChatMessage[] = s.messages.map((m, i) => ({
          id: generateId(),
          role: m.role,
          content: m.content,
          timestamp: new Date(createdAt.getTime() + i * 60000).toISOString(),
        }));

        const session: DiagnosisSession = {
          id: generateId(),
          status: s.status,
          initialSymptom: s.initialSymptom,
          messages,
          createdAt: createdAt.toISOString(),
          updatedAt: new Date(createdAt.getTime() + messages.length * 60000).toISOString(),
        };

        await createDiagnosisSession(session.initialSymptom);
        // 添加消息到会话
        for (const msg of messages) {
          await addMessageToSession(session.id, msg);
        }
        if (session.status === 'completed') {
          await updateDiagnosisSession(session.id, { status: 'completed' });
        }
        sessionCount++;
      }

      // 添加二手车评估
      let evalCount = 0;
      await saveUsedCarEvaluation({
        input: demoUsedCar.input,
        reportMarkdown: demoUsedCar.reportMarkdown,
      });
      evalCount++;

      setResult({
        vehicles: vehicleCount,
        sessions: sessionCount,
        evaluations: evalCount,
      });

      await checkExisting();
    } catch (error) {
      console.error('Seed error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回管理后台
        </Link>
        <h1 className="text-2xl font-bold">预设演示数据</h1>
        <p className="text-sm text-muted-foreground mt-1">
          导入预设数据用于比赛 Demo 展示
        </p>
      </div>

      {/* 当前数据状态 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            当前数据状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{existingData.vehicles}</p>
              <p className="text-xs text-muted-foreground">车辆</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{existingData.sessions}</p>
              <p className="text-xs text-muted-foreground">诊断会话</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{existingData.evaluations}</p>
              <p className="text-xs text-muted-foreground">二手车评估</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预设数据内容 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">将导入的演示数据</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {demoVehicles.length}
              </span>
              辆示例车辆
            </h3>
            <div className="flex flex-wrap gap-2">
              {demoVehicles.map((v, i) => (
                <Badge key={i} variant="outline">
                  {v.brand} {v.series} {v.year}款
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {demoSessions.length}
              </span>
              个诊断会话（{demoSessions.filter(s => s.status === 'completed').length} 已完成）
            </h3>
            <ul className="space-y-1">
              {demoSessions.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Badge
                    variant={s.status === 'completed' ? 'secondary' : 'outline'}
                    className={`text-xs ${s.status === 'completed' ? 'bg-green-100 text-green-800' : ''}`}
                  >
                    {s.status === 'completed' ? '已完成' : '进行中'}
                  </Badge>
                  <span className="line-clamp-1">{s.initialSymptom}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                1
              </span>
              个二手车评估
            </h3>
            <p className="text-sm text-muted-foreground">
              {demoUsedCar.input.brand} {demoUsedCar.input.series} {demoUsedCar.input.year}款 · {demoUsedCar.input.mileage}万公里 · 报价{demoUsedCar.input.askingPrice}万
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSeedDemo} disabled={loading} className="flex-1">
          {loading ? (
            '导入中...'
          ) : result ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              已导入（车辆{result.vehicles} + 诊断{result.sessions} + 评估{result.evaluations}）
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              导入演示数据
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleClearAll} className="flex-shrink-0">
          <Trash2 className="mr-2 h-4 w-4 text-red-500" />
          清除所有数据
        </Button>
      </div>

      {cleared && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
          <CheckCircle className="h-4 w-4" />
          所有本地数据已清除
        </div>
      )}

      {result && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
          <CheckCircle className="h-4 w-4" />
          演示数据导入成功！可以前往
          <Link href="/history" className="text-primary underline">诊断历史</Link>
          、
          <Link href="/vehicles" className="text-primary underline">我的车辆</Link>
          或
          <Link href="/used-car" className="text-primary underline">二手车评估</Link>
          查看。
        </div>
      )}

      {/* 注意事项 */}
      <Card className="mt-6 border-amber-200 bg-amber-50/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">注意事项</p>
              <ul className="space-y-1 text-xs">
                <li>• 演示数据保存在浏览器 localStorage 中，清除浏览器数据会丢失</li>
                <li>• 多次点击"导入"会重复添加数据，建议先清除再导入</li>
                <li>• 演示时建议先在诊断页面实际走一遍 AI 对话流程，效果更好</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
