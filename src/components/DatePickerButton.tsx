'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

type DatePickerButtonProps = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  className?: string;
};

const monthNames = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(value: string) {
  return parseDateInput(value).toLocaleDateString('pt-BR');
}

export default function DatePickerButton({
  value,
  onChange,
  min,
  className = '',
}: DatePickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseDateInput(value);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const date = parseDateInput(value);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const firstWeekday = firstDay.getDay();
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstWeekday);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dateValue = formatDateInput(date);

      return {
        date,
        value: dateValue,
        inMonth: date.getMonth() === visibleMonth.getMonth(),
        selected: dateValue === value,
        disabled: Boolean(min && dateValue < min),
      };
    });
  }, [min, value, visibleMonth]);

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const handleSelect = (dateValue: string) => {
    onChange(dateValue);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${open ? 'z-[9999]' : 'z-10'} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-800 shadow-sm transition-all hover:border-primary-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
        aria-expanded={open}
      >
        <Calendar size={18} className="text-primary-700" />
        {formatDateLabel(value)}
      </button>

      {open && (
        <div className="absolute left-0 z-[10000] mt-2 w-72 rounded-2xl border-2 border-primary-100 bg-white p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-700 hover:bg-primary-50"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-sm font-black text-gray-900">
              {monthNames[visibleMonth.getMonth()]} de {visibleMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-700 hover:bg-primary-50"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((weekday, index) => (
              <div key={`${weekday}-${index}`} className="py-1 text-xs font-black text-gray-500">
                {weekday}
              </div>
            ))}

            {days.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleSelect(day.value)}
                disabled={day.disabled}
                className={`h-9 rounded-lg text-sm font-bold transition-all ${
                  day.selected
                    ? 'bg-primary-600 text-white shadow-sm'
                    : day.inMonth
                      ? 'text-gray-800 hover:bg-primary-50 hover:text-primary-700'
                      : 'text-gray-400 hover:bg-gray-50'
                } disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent`}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
