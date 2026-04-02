import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, X } from 'lucide-react';

interface Option {
  id: string | number;
  name: string;
}

interface CustomSelectProps {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string | number | (string | number)[];
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string | number | (string | number)[]) => void;
  hideLabel?: boolean;
  multiple?: boolean;
  icon?: React.ElementType;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  name, 
  label, 
  options, 
  defaultValue, 
  placeholder = 'Chọn một lựa chọn...',
  required = false,
  onChange,
  hideLabel = false,
  multiple = false,
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>(() => {
    if (defaultValue === undefined) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter(o => 
    selectedIds.some(id => String(id) === String(o.id))
  );

  useEffect(() => {
    if (defaultValue === undefined) {
      setSelectedIds([]);
    } else {
      setSelectedIds(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
    }
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (id: string | number) => {
    let newIds: (string | number)[];
    if (multiple) {
      const exists = selectedIds.some(sid => String(sid) === String(id));
      if (exists) {
        newIds = selectedIds.filter(sid => String(sid) !== String(id));
      } else {
        newIds = [...selectedIds, id];
      }
    } else {
      newIds = [id];
      setIsOpen(false);
    }
    setSelectedIds(newIds);
    if (onChange) {
      onChange(multiple ? newIds : newIds[0]);
    }
  };

  const handleRemoveOption = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    handleToggleOption(id);
  };

  return (
    <div className="group relative" ref={containerRef}>
      {!hideLabel && (
        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
          {label}
        </label>
      )}
      
      {/* Hidden inputs for form compatibility */}
      {selectedIds.length === 0 && required && <input type="hidden" name={name} value="" required />}
      {selectedIds.map((id, idx) => (
        <input key={idx} type="hidden" name={name} value={id} />
      ))}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border ${isOpen ? 'border-brand ring-4 ring-brand/5 shadow-lg shadow-brand/5' : 'border-slate-200 hover:border-slate-300'} rounded-2xl transition-all text-left focus:outline-none min-h-[44px] shadow-sm`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {Icon && (
            <Icon size={18} className={`shrink-0 ${isOpen ? 'text-brand' : 'text-slate-400'}`} />
          )}
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 pr-2">
            {selectedOptions.length > 0 ? (
              multiple ? (
                selectedOptions.map(option => (
                  <span 
                    key={option.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-brand/10 text-brand text-xs font-bold rounded-lg whitespace-nowrap"
                  >
                    {option.name}
                    <X 
                      size={14} 
                      className="hover:text-brand-dark cursor-pointer transition-colors" 
                      onClick={(e) => handleRemoveOption(e, option.id)}
                    />
                  </span>
                ))
              ) : (
                <span className="text-slate-900 font-medium truncate">
                  {selectedOptions[0].name}
                </span>
              )
            ) : (
              <span className="text-slate-400 font-medium whitespace-nowrap">
                {placeholder}
              </span>
            )}
          </div>
        </div>
        <ChevronDown 
          size={18} 
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-[300] left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden py-1.5"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400 italic text-center">
                  Không có dữ liệu
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = selectedIds.some(id => String(id) === String(option.id));
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleToggleOption(option.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-brand/5 text-brand'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {option.name}
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
