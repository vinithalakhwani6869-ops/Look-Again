import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface FocusOption {
  value: string;
  label: string;
}

interface FocusFilterDropdownProps {
  value: string;
  options: FocusOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
}

// A monochrome, keyboard-accessible listbox that replaces the native <select>
// (whose opened list uses the browser's blue highlight and breaks the theme).
export const FocusFilterDropdown: React.FC<FocusFilterDropdownProps> = ({
  value,
  options,
  onChange,
  ariaLabel = 'Filter by focus',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const selectedLabel = options[selectedIndex]?.label ?? '';

  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  };

  const closeMenu = (returnFocus = true) => {
    setIsOpen(false);
    if (returnFocus) {
      buttonRef.current?.focus();
    }
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    closeMenu();
  };

  // Close on outside click.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={isOpen ? optionId(activeIndex) : undefined}
        aria-label={ariaLabel}
        className="inline-flex w-full items-center justify-between gap-3 text-xs py-2.5 px-4 rounded-2xl bg-white/10 border border-white/15 text-white focus:outline-hidden focus-visible:border-white backdrop-blur-md cursor-pointer whitespace-nowrap"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-white/15 bg-[#0a0a0a] p-1.5 shadow-2xl outline-none"
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(index)}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs cursor-pointer transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
