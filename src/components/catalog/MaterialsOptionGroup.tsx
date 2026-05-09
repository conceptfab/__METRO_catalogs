'use client';

import { useId } from 'react';
import type { MaterialsConfiguratorOption } from '@/types/catalog';
import { QxText } from '@/components/catalog/QxText';

interface MaterialsOptionGroupProps {
  title: string;
  options: MaterialsConfiguratorOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  variant?: 'primary' | 'secondary';
}

function formatOptionCode(code: string) {
  return code.startsWith('RAL') ? `RAL ${code.slice(3)}` : code;
}

function getOptionLabelParts(option: MaterialsConfiguratorOption) {
  const code = formatOptionCode(option.code);
  const name = option.label.replace(code, '').replace(option.code, '').trim();
  return { code, name };
}

export function MaterialsOptionGroup({
  title,
  options,
  selectedId,
  onSelect,
  variant = 'secondary',
}: MaterialsOptionGroupProps) {
  const titleId = useId();
  const titleClassName =
    variant === 'primary'
      ? 'mb-3 qx-emphasis-title'
      : 'mb-2 font-display text-lg font-normal text-foreground';
  return (
    <div>
      <h3 id={titleId} className={titleClassName}>
        <QxText text={title} />
      </h3>

      <div
        role="group"
        aria-labelledby={titleId}
        className="flex flex-wrap gap-[5px]"
      >
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          const label = getOptionLabelParts(option);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={isSelected}
              className={`relative h-[6.5rem] w-[5rem] sm:h-[9.75rem] sm:w-[7.25rem] shrink-0 border bg-background p-1 pt-[4.5rem] sm:pt-[7rem] text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                isSelected
                  ? 'border-foreground border-2 shadow-[0_0_0_2px_rgba(0,0,0,0.18)]'
                  : 'border-transparent hover:border-foreground/50'
              }`}
            >
              <div
                aria-hidden="true"
                className="absolute left-1 right-1 top-1 aspect-square bg-cover bg-center transition-transform duration-300 hover:scale-105"
                style={{ backgroundImage: `url("${option.thumbnail}")` }}
              />
              <p className="text-[11px] font-medium leading-tight text-foreground sm:text-xs">
                <span className="block"><QxText text={label.code} /></span>
                {label.name && (
                  <span className="block"><QxText text={label.name} /></span>
                )}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
