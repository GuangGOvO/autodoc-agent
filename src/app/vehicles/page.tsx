// 车辆列表页 — 完整实现

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, Plus, Trash2, Edit, Gauge, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVehicles, deleteVehicle, type Vehicle } from '@/lib/storage';
import { ListSkeleton } from '@/components/ui/page-skeleton';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await getVehicles();
      setVehicles(data);
      setLoaded(true);
    };
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这辆车吗？')) {
      await deleteVehicle(id);
      const updated = await getVehicles();
      setVehicles(updated);
    }
  };

  if (!loaded) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 bg-muted rounded w-32 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
          </div>
          <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
        </div>
        <ListSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">我的车辆</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理您的爱车信息，诊断时自动关联获得更精准结果
          </p>
        </div>
        <Link
          href="/vehicles/add"
          className="inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          添加车辆
        </Link>
      </div>

      {/* 车辆列表 */}
      {vehicles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">还没有添加车辆</h3>
            <p className="text-sm text-muted-foreground mb-6">
              添加您的车辆信息，诊断时可以获得更精准的故障分析
            </p>
            <Link
              href="/vehicles/add"
              className="inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              添加第一辆车
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {vehicles.map(vehicle => (
            <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {vehicle.brand} {vehicle.series}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vehicle.year && (
                          <Badge variant="secondary" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {vehicle.year}款
                          </Badge>
                        )}
                        {vehicle.engine && (
                          <Badge variant="secondary" className="gap-1">
                            <Settings className="h-3 w-3" />
                            {vehicle.engine}
                          </Badge>
                        )}
                        {vehicle.transmission && (
                          <Badge variant="outline">{vehicle.transmission}</Badge>
                        )}
                        {vehicle.mileage > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Gauge className="h-3 w-3" />
                            {vehicle.mileage.toLocaleString()} km
                          </Badge>
                        )}
                        {vehicle.licensePlate && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {vehicle.licensePlate}
                          </Badge>
                        )}
                      </div>
                      {vehicle.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{vehicle.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Link
                      href={`/diagnose?vehicleId=${vehicle.id}`}
                      className="inline-flex h-8 items-center px-3 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      诊断
                    </Link>
                    <Link
                      href={`/vehicles/edit/${vehicle.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
