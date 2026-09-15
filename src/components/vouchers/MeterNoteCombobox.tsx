'use client';

import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export const METER_NOTE_SUGGESTIONS = [
  'Lắp mới khách hàng',
  'Bảo hành khách hàng',
  'Bảo hành block',
  'Thay ĐH Tổng',
  'Tách Block',
  'Phát triển block',
];

interface MeterNoteComboboxProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function MeterNoteCombobox({
  value,
  onChange,
  placeholder = 'Ghi chú / Mục đích...',
  className = '',
}: MeterNoteComboboxProps) {
  const uniqueId = useId();
  const datalistId = `meter-notes-${uniqueId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div
      className={`relative flex items-stretch rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all ${className}`}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={datalistId}
        className="w-full text-xs px-2.5 py-1.5 rounded-l-lg bg-transparent font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
      />

      <div className="relative flex items-center border-l border-slate-200 bg-slate-50 rounded-r-lg hover:bg-slate-100 transition-colors">
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value);
            }
          }}
          className="h-full opacity-0 absolute inset-0 w-full cursor-pointer z-10"
          title="Chọn từ 6 gợi ý ghi chú chuẩn (hoặc tự sửa ở ô bên trái)"
        >
          <option value="" disabled>
            -- 6 Gợi Ý Ghi Chú Chuẩn --
          </option>
          {METER_NOTE_SUGGESTIONS.map((s, idx) => (
            <option key={idx} value={s}>
              {idx + 1}. {s}
            </option>
          ))}
        </select>
        <div className="px-2 py-1 flex items-center gap-0.5 text-slate-500 pointer-events-none">
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </div>

      <datalist id={datalistId}>
        {METER_NOTE_SUGGESTIONS.map((s, idx) => (
          <option key={idx} value={s} />
        ))}
      </datalist>
    </div>
  );
}
