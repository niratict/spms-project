import { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import PropTypes from "prop-types";

const DropdownSelect = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder,
  dataCy,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full rounded-md border ${
            disabled
              ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
              : "bg-white text-gray-800 cursor-pointer border-gray-300 hover:border-blue-500"
          } p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200`}
          data-cy={dataCy}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate text-left pr-8">
            {options.find(opt => opt.value === value)?.label || placeholder}
          </span>
          <div
            className={`absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none`}
          >
            <div
              className={`rounded-lg p-1 transition-all duration-300 ${
                disabled
                  ? "text-gray-400"
                  : "text-blue-600"
              }`}
            >
              {icon || <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
            </div>
          </div>
        </button>
        
        {isOpen && !disabled && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            ></div>
            <div 
              className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-auto"
              style={{ scrollbarWidth: 'thin' }}
              data-cy={`${dataCy}-dropdown`}
            >
              <ul role="listbox">
                {placeholder && (
                  <li
                    className="py-2 px-4 text-gray-500 hover:bg-blue-50 cursor-pointer transition-colors duration-150 flex items-center text-sm"
                    onClick={() => handleSelect("")}
                    data-cy={`${dataCy}-option-placeholder`}
                  >
                    {placeholder}
                  </li>
                )}
                {options.map((option) => (
                  <li
                    key={option.value}
                    className={`py-2 px-4 hover:bg-blue-50 cursor-pointer transition-colors duration-150 flex items-center text-sm ${
                      option.value === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800"
                    }`}
                    onClick={() => handleSelect(option.value)}
                    data-cy={`${dataCy}-option-${option.value}`}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.value === value && (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                    )}
                    <span className={option.value === value ? "ml-0" : "ml-6"}>
                      {option.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

DropdownSelect.propTypes = {
  label: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  dataCy: PropTypes.string,
  icon: PropTypes.node
};

export default DropdownSelect; 