'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
};

type SelectFieldProps = {
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  error?: boolean;
  compact?: boolean;
};

export default function SelectField({
  value,
  options,
  placeholder,
  onChange,
  error = false,
  compact = false,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;

    onChange(option.value);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 bg-white text-left font-bold shadow-sm outline-none transition-all hover:border-primary-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 ${
          compact ? 'min-h-10 px-3 py-2 text-sm' : 'min-h-[54px] px-4 py-3'
        } ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-200'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={compact ? 17 : 20}
          className={`flex-shrink-0 text-primary-700 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-40 mt-2 overflow-y-auto rounded-2xl border-2 border-primary-100 bg-white shadow-2xl ${
            compact ? 'max-h-60 p-1.5' : 'max-h-72 p-2'
          }`}
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => handleSelect(option)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl text-left transition-all ${
                  compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
                } ${
                  selected
                    ? 'bg-primary-600 text-white'
                    : option.disabled
                      ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                      : 'text-gray-800 hover:bg-primary-50 hover:text-primary-800'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{option.label}</span>
                  {option.description && (
                    <span className={`block truncate text-xs font-semibold ${selected ? 'text-white/80' : 'text-gray-500'}`}>
                      {option.description}
                    </span>
                  )}
                </span>
                {selected && <Check size={17} className="flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
