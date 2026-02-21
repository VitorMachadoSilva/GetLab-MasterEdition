'use client';

import { useState, useEffect, useRef } from 'react';

interface ServerTimeData {
  timestamp: number;
  date: string;
  timezone: string;
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useServerTime() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [synced, setSynced] = useState(false);
  const offsetRef = useRef(0); // ref para acesso imediato sem depender do state

  // Sincronizar com servidor ao montar
  useEffect(() => {
    const syncWithServer = async () => {
      try {
        const response = await fetch('/api/time');
        const data: ServerTimeData = await response.json();

        const clientTime = Date.now();
        const serverTime = data.timestamp;
        offsetRef.current = serverTime - clientTime;

        setSynced(true);
        console.log(`⏰ Sincronizado com servidor (SP). Offset: ${offsetRef.current}ms`);
      } catch (error) {
        console.error('Erro ao sincronizar com servidor:', error);
        setSynced(true);
      }
    };

    syncWithServer();
  }, []);

  // Atualizar relógio a cada segundo usando sempre o ref (sem stale closure)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date(Date.now() + offsetRef.current));
    }, 1000);

    return () => clearInterval(timer);
  }, []); // sem dependência de offset no array — o ref garante valor sempre fresco

  // Retorna o horário atual corrigido em tempo real (lê o ref, não o state)
  const getNow = () => new Date(Date.now() + offsetRef.current);

  // Retorna data no formato YYYY-MM-DD já no horário de SP
  const getLocalDateString = () => {
    const d = getNow();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    currentTime,
    synced,
    getLocalDateString,
    getNow,
  };
}