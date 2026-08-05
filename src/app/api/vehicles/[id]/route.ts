// PUT/DELETE /api/vehicles/[id] — 更新与删除车辆

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const brand = String(body.brand || '').trim();
    const series = String(body.series || '').trim();
    if (!brand || !series) {
      return NextResponse.json({ error: '请填写品牌和车系' }, { status: 400 });
    }

    const { rows } = await pool.query<VehicleRow>(
      `update vehicles
       set brand = $1, series = $2, year = $3, engine = $4, transmission = $5,
           mileage = $6, license_plate = $7, notes = $8, updated_at = now()
       where id = $9 and user_id = $10
       returning *`,
      [
        brand,
        series,
        body.year || null,
        body.engine || null,
        body.transmission || null,
        Number(body.mileage) || 0,
        body.licensePlate || null,
        body.notes || null,
        id,
        user.id,
      ]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: '车辆不存在' }, { status: 404 });
    }
    return NextResponse.json({ vehicle: mapVehicle(rows[0]) });
  } catch (error) {
    console.error('[vehicles] update error:', error);
    return NextResponse.json({ error: '保存失败，请稍后重试' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  await pool.query('delete from vehicles where id = $1 and user_id = $2', [id, user.id]);
  return NextResponse.json({ ok: true });
}
