'use client';

import React, { useState, useEffect } from 'react';
import { User, Check, Star, Edit3, ListFilter } from 'lucide-react';

export interface ParticipantOption {
  id?: number | string;
  fullName: string;
  position?: string | null;
  department?: string | null;
}

interface ParticipantSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: ParticipantOption[];
  defaultKey: string;
  defaultFallback?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  helpText?: string;
}

export function ParticipantSelect({
  label,
  value,
  onChange,
  options,
  defaultKey,
  defaultFallback = '',
  placeholder = 'Chọn người tham gia...',
  required = false,
  className = '',
  helpText,
}: ParticipantSelectProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [defaultSaved, setDefaultSaved] = useState<string>('');
  const [justSaved, setJustSaved] = useState(false);

  // When defaultKey changes (e.g. unit changed), sync from localStorage or defaultFallback
  useEffect(() => {
    setIsCustomMode(false);
    try {
      const stored = localStorage.getItem(defaultKey);
      if (stored) {
        setDefaultSaved(stored);
        onChange(stored);
      } else if (defaultFallback) {
        onChange(defaultFallback);
        setDefaultSaved(defaultFallback);
      } else if (options.length > 0) {
        onChange(options[0].fullName);
      }
    } catch {
      // ignore localStorage errors (e.g. incognito)
    }
  }, [defaultKey]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__CUSTOM__') {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      onChange(selected);
      // Automatically save chosen person as default
      if (selected) {
        saveAsDefault(selected);
      }
    }
  };

  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text);
  };

  const saveAsDefault = (nameToSave: string) => {
    if (!nameToSave.trim()) return;
    try {
      localStorage.setItem(defaultKey, nameToSave.trim());
      setDefaultSaved(nameToSave.trim());
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch {
      // ignore
    }
  };

  const isCurrentDefault = !!value && value.trim() === defaultSaved.trim();
  const valueInOptions = options.some(
    (opt) => opt.fullName.trim().toLowerCase() === value.trim().toLowerCase()
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-brand-600" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>

        <div className="flex items-center gap-1.5">
          {justSaved && (
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded animate-fade-in">
              <Check className="w-3 h-3" /> Đã lưu mặc định
            </span>
          )}

          {!isCurrentDefault && value && (
            <button
              type="button"
              onClick={() => saveAsDefault(value)}
              className="text-[11px] text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5 hover:underline cursor-pointer"
              title="Đặt người này làm mặc định cho các lần lập/sửa phiếu tiếp theo"
            >
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>Đặt làm mặc định</span>
            </button>
          )}

          {isCurrentDefault && !justSaved && (
            <span
              className="text-[10px] text-brand-700 bg-brand-50 border border-brand-200/70 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5"
              title="Người này đang được đặt mặc định tự động gọi ra"
            >
              <Star className="w-2.5 h-2.5 fill-brand-500 text-brand-600" />
              <span>Mặc định</span>
            </span>
          )}
        </div>
      </div>

      {!isCustomMode ? (
        <div className="relative flex items-center gap-1.5">
          <select
            value={value}
            onChange={handleSelectChange}
            required={required}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">-- {placeholder} --</option>
            {value && !valueInOptions && (
              <option value={value}>
                {value}
              </option>
            )}
            {options.map((opt, idx) => (
              <option key={opt.id ?? idx} value={opt.fullName}>
                {opt.fullName}
                {opt.position ? ` (${opt.position})` : opt.department ? ` (${opt.department})` : ''}
              </option>
            ))}
            <option value="__CUSTOM__">✍️ Nhập họ tên khác...</option>
          </select>

          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
            title="Nhập tên thủ công"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative flex items-center gap-1.5">
          <input
            type="text"
            value={value}
            onChange={handleCustomTextChange}
            onBlur={() => {
              if (value.trim()) saveAsDefault(value);
            }}
            placeholder="Nhập họ và tên..."
            required={required}
            className="w-full text-xs border border-brand-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />

          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className="px-2 py-2 text-xs text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg font-medium flex items-center gap-1 shrink-0"
            title="Quay lại danh sách chọn"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chọn lại</span>
          </button>
        </div>
      )}

      {helpText && <p className="text-[11px] text-slate-500">{helpText}</p>}
    </div>
  );
}
