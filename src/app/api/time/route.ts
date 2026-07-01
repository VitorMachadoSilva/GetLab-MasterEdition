import { NextResponse } from 'next/server';
import {
  addDaysToDateInput,
  businessTimeZone,
  getDateInputValueInTimeZone,
} from '@/lib/business-time';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  const today = getDateInputValueInTimeZone(now, businessTimeZone);

  return NextResponse.json({
    now: now.toISOString(),
    timeZone: businessTimeZone,
    today,
    tomorrow: addDaysToDateInput(today, 1),
  });
}
