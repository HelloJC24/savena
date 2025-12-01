import React from 'react';

const Select = ({ 
  label, 
  value, 
  onChange, 
  options = [],
  placeholder = 'Select an option',
  required = false,
  error,
  ...props 
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="ios-label">
          {label}
          {required && <span className="text-ios-red ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`ios-input appearance-none bg-no-repeat bg-right pr-10 ${error ? 'border-ios-red ring-ios-red' : ''}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: '1.5rem',
          backgroundPosition: 'right 0.5rem center',
        }}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-ios-red text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default Select;
