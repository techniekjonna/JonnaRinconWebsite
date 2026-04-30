import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

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
  const [expandedFilter, setExpandedFilter] = useState<string | null>(
    filters.length > 0 ? filters[0].label : null
  );

  // Prevent body scroll when modal is open
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

  // Count active filters
  const activeFilterCount = filters.filter((f) => f.value !== 'All').length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-white/[0.04]">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <p className="text-xs text-white/40 mt-1">
                  {activeFilterCount} active
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors text-white/60 hover:text-white"
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filters.map((filter) => (
              <div
                key={filter.label}
                className="bg-white/[0.06] border border-white/[0.08] rounded-lg overflow-hidden backdrop-blur-sm hover:bg-white/[0.08] transition-colors"
              >
                {/* Filter Header - Clickable */}
                <button
                  onClick={() =>
                    setExpandedFilter(
                      expandedFilter === filter.label ? null : filter.label
                    )
                  }
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                      {filter.label}
                    </p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {filter.value}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-white/40 transition-transform flex-shrink-0 ${
                      expandedFilter === filter.label ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Filter Options - Expandable */}
                {expandedFilter === filter.label && (
                  <div className="border-t border-white/[0.08] bg-black/20 p-3 space-y-2">
                    {filter.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          filter.onChange(option);
                          // Keep accordion open after selection
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${
                          filter.value === option
                            ? 'bg-white/[0.2] border border-white/[0.3] text-white'
                            : 'bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.12]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-white/[0.08] bg-white/[0.04]">
            <button
              onClick={() => {
                onReset();
                setExpandedFilter(filters.length > 0 ? filters[0].label : null);
              }}
              className="px-4 py-2.5 bg-white/[0.08] border border-white/[0.15] rounded-lg font-bold uppercase tracking-wider text-xs text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/[0.15] border border-white/[0.2] rounded-lg font-bold uppercase tracking-wider text-xs text-white hover:bg-white/[0.25] transition-all backdrop-blur-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

