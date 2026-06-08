import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface FilterOption {
  label: string;
  options: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
}

interface FilterModalProps {
  filters: FilterOption[];
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
}

export default function FilterModal({
  filters,
  isOpen,
  onClose,
  onReset,
}: FilterModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeFilterCount = filters.filter((f) => f.value !== 'All').length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal — clicks inside don't bubble to backdrop */}
      <div
        className="fixed inset-0 flex items-end sm:items-center justify-center z-50 sm:p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full sm:max-w-sm bg-[#111] border border-white/[0.10] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
          style={{ maxHeight: '80dvh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-red-600 rounded-full px-2 py-0.5">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/[0.1] rounded-lg transition-colors text-white/50 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Filters — compact rows */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filters.map((filter) => (
              <div key={filter.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                  {filter.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {filter.options.map((option) => {
                    const isSelected = filter.value === option;
                    return (
                      <button
                        key={String(option)}
                        onClick={() => filter.onChange(option)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : 'bg-white/[0.06] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.12]'
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                        {String(option)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t border-white/[0.06] flex-shrink-0">
            <button
              onClick={onReset}
              className="px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl font-bold uppercase tracking-wider text-xs text-white/50 hover:text-white hover:bg-white/[0.12] transition-all"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white text-black rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-white/90 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
