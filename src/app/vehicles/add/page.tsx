// 添加车辆页面

'use client';

import { useRouter } from 'next/navigation';
import { VehicleForm } from '@/components/vehicle/VehicleForm';
import { saveVehicle } from '@/lib/storage';

export default function AddVehiclePage() {
  const router = useRouter();

  const handleSubmit = async (data: Parameters<typeof saveVehicle>[0]) => {
    await saveVehicle(data);
    router.push('/vehicles');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <VehicleForm onSubmit={handleSubmit} submitLabel="添加车辆" />
    </div>
  );
}
