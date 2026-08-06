import { Check } from 'lucide-react';

export interface FilterOptions {
  is24Hours: boolean;
  isAccessible: boolean;
  hasChangingTable: boolean;
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const toggleFilter = (key: keyof FilterOptions) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '16px 20px',
      }}
    >
      <h3 className="font-h2" style={{ color: 'var(--color-text-main)', marginBottom: 12 }}>
        가려내기
      </h3>
      <div className="flex flex-wrap" style={{ gap: 8 }}>
        <FilterChip
          label="24시간 운영"
          checked={filters.is24Hours}
          onClick={() => toggleFilter('is24Hours')}
        />
        <FilterChip
          label="장애인 이용 가능"
          checked={filters.isAccessible}
          onClick={() => toggleFilter('isAccessible')}
        />
        <FilterChip
          label="기저귀 교환대"
          checked={filters.hasChangingTable}
          onClick={() => toggleFilter('hasChangingTable')}
        />
      </div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  checked: boolean;
  onClick: () => void;
}

function FilterChip({ label, checked, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center font-button"
      style={{
        gap: 6,
        height: 36,
        padding: '0 14px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-bg-default)',
        color: checked ? '#fff' : 'var(--color-text-sub)',
        border: `1px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
        transition: 'all 0.2s',
      }}
    >
      {checked && <Check className="w-3.5 h-3.5" strokeWidth={2.2} />}
      <span>{label}</span>
    </button>
  );
}
