import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required = false,
  error,
  helperText,
  icon,
  min,
  max,
  step,
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
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ios-gray-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className={`ios-input ${icon ? 'pl-10' : ''} ${error ? 'border-ios-red ring-ios-red' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-ios-red text-sm mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-ios-gray-600 text-sm mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
