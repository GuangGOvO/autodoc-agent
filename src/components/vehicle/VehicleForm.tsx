// 车辆表单组件 — 添加/编辑车辆

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, Car } from 'lucide-react';
import Link from 'next/link';
import vehicleModels from '@/data/vehicles.json';
import type { Vehicle } from '@/lib/storage';

interface VehicleFormProps {
  initialData?: Vehicle;
  onSubmit: (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  submitLabel?: string;
}

export function VehicleForm({ initialData, onSubmit, submitLabel = '保存车辆' }: VehicleFormProps) {
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [series, setSeries] = useState(initialData?.series || '');
  const [year, setYear] = useState(initialData?.year || '');
  const [engine, setEngine] = useState(initialData?.engine || '');
  const [transmission, setTransmission] = useState(initialData?.transmission || '');
  const [mileage, setMileage] = useState(initialData?.mileage?.toString() || '');
  const [licensePlate, setLicensePlate] = useState(initialData?.licensePlate || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // 所有品牌
  const brands = useMemo(() => {
    const set = new Set<string>();
    vehicleModels.forEach(m => set.add(m.brand));
    return Array.from(set);
  }, []);

  // 当前品牌下的车系
  const seriesList = useMemo(() => {
    if (!brand) return [];
    return vehicleModels.filter(m => m.brand === brand);
  }, [brand]);

  // 当前车系的选项
  const currentModel = useMemo(() => {
    return vehicleModels.find(m => m.brand === brand && m.series === series);
  }, [brand, series]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !series) return;
    onSubmit({
      brand,
      series,
      year,
      engine,
      transmission,
      mileage: parseInt(mileage) || 0,
      licensePlate,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>{initialData ? '编辑车辆' : '添加车辆'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 品牌选择 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">品牌 *</label>
            <div className="flex flex-wrap gap-2">
              {brands.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => { setBrand(b); setSeries(''); setYear(''); setEngine(''); setTransmission(''); }}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    brand === b
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* 车系选择 */}
          {brand && seriesList.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">车系 *</label>
              <div className="flex flex-wrap gap-2">
                {seriesList.map(m => (
                  <button
                    key={m.series}
                    type="button"
                    onClick={() => { setSeries(m.series); setYear(''); setEngine(''); setTransmission(''); }}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      series === m.series
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {m.series}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 年款 */}
          {currentModel && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">年款</label>
              <div className="flex flex-wrap gap-2">
                {currentModel.years.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      year === y
                        ? 'bg-accent text-white border-accent'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {y}款
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 排量/动力 */}
          {currentModel && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">排量/动力</label>
              <div className="flex flex-wrap gap-2">
                {currentModel.engines.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEngine(e)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      engine === e
                        ? 'bg-accent text-white border-accent'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 变速箱 */}
          {currentModel && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">变速箱</label>
              <div className="flex flex-wrap gap-2">
                {currentModel.transmissions.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTransmission(t)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      transmission === t
                        ? 'bg-accent text-white border-accent'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 里程和车牌 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">当前里程 (km)</label>
              <Input
                type="number"
                value={mileage}
                onChange={e => setMileage(e.target.value)}
                placeholder="例如: 50000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">车牌号</label>
              <Input
                value={licensePlate}
                onChange={e => setLicensePlate(e.target.value)}
                placeholder="例如: 鄂A12345"
              />
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">备注</label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="例如: 二手车购入，2023年做过大保养"
            />
          </div>

          {/* 选中的车辆预览 */}
          {brand && series && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">车辆预览</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{brand}</Badge>
                <Badge variant="secondary">{series}</Badge>
                {year && <Badge>{year}款</Badge>}
                {engine && <Badge>{engine}</Badge>}
                {transmission && <Badge>{transmission}</Badge>}
                {mileage && <Badge variant="outline">{Number(mileage).toLocaleString()}km</Badge>}
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/vehicles"
              className="inline-flex h-8 items-center gap-1.5 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              取消
            </Link>
            <Button type="submit" disabled={!brand || !series}>
              <Save className="mr-1 h-4 w-4" />
              {submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
