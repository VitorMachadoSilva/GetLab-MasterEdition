import { NextResponse } from 'next/server';

// API que retorna o horário do servidor no fuso de São Paulo
export async function GET() {
  const now = new Date();

  // Converter para horário de Brasília (UTC-3)
  const saoPauloTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );

  return NextResponse.json({
    timestamp: saoPauloTime.getTime(),
    date: saoPauloTime.toISOString(),
    timezone: 'America/Sao_Paulo',
    year: saoPauloTime.getFullYear(),
    month: saoPauloTime.getMonth() + 1,
    day: saoPauloTime.getDate(),
    hours: saoPauloTime.getHours(),
    minutes: saoPauloTime.getMinutes(),
    seconds: saoPauloTime.getSeconds(),
  });
}