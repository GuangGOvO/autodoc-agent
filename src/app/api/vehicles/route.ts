// GET/POST /api/vehicles — 车辆列表与新增

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getServerUser } from '@/lib/serverAuth';

interface VehicleRow {
  id: string;
  brand: string;
  series: string;
  year: string | null;
  engine: string | null;
  transmission: string | null;
  mileage: string | number;
  license_plate: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapVehicle(row: VehicleRow) {
  return {
    id: row.id,
    brand: row.brand,
    series: row.series,
    year: row.year || '',
    engine: row.engine || '',
    transmission: row.transmission || '',
    mileage: Number(row.mileage) || 0,
    licensePlate: row.license_plate || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { rows } = await pool.query<VehicleRow>(
    'select * from vehicles where user_id = $1 order by created_at desc',
    [user.id]
  );
  return NextResponse.json({ vehicles: rows.map(mapVehicle) });
}

export async function POST(request: NextRequest) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  try {
    const body = await request.json();
    const brand = String(body.brand || '').trim();
    const series = String(body.series || '').trim();
    if (!brand || !series) {
      return NextResponse.json({ error: '请填写品牌和车系' }, { status: 400 });
    }

    const { rows } = await pool.query<VehicleRow>(
      `insert into vehicles (user_id, brand, series, year, engine, transmission, mileage, license_plate, notes)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning *`,
      [
        user.id,
        brand,
        series,
        body.year || null,
        body.engine || null,
        body.transmission || null,
        Number(body.mileage) || 0,
        body.licensePlate || null,
        body.notes || null,
      ]
    );
    return NextResponse.json({ vehicle: mapVehicle(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error('[vehicles] create error:', error);
    return NextResponse.json({ error: '保存失败，请稍后重试' }, { status: 500 });
  }
}
