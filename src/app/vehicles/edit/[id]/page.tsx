// 编辑车辆页面

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { VehicleForm } from '@/components/vehicle/VehicleForm';
import { getVehicleById, saveVehicle, type Vehicle } from '@/lib/storage';
import { DetailSkeleton } from '@/components/ui/page-skeleton';

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      const loadVehicle = async () => {
        const v = await getVehicleById(id);
        setVehicle(v || null);
        setLoaded(true);
      };
      loadVehicle();
    }
  }, [id]);

  const handleSubmit = async (data: Parameters<typeof saveVehicle>[0]) => {
    await saveVehicle({ ...data, id });
    router.push('/vehicles');
  };

  if (!loaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">未找到该车辆</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <VehicleForm
        initialData={vehicle}
        onSubmit={handleSubmit}
        submitLabel="保存修改"
      />
    </div>
  );
}
