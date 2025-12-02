import React from 'react';

const Header = ({ title, subtitle, rightAction }) => {
  return (
    <header className="sticky top-0 bg-white dark:bg-ios-gray-900 border-b border-ios-gray-200 dark:border-ios-gray-700 z-40 safe-area-top w-full">
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-ios-gray-900 dark:text-white truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 mt-1 truncate">{subtitle}</p>
            )}
          </div>
          {rightAction && <div className="ml-4 flex-shrink-0">{rightAction}</div>}
        </div>
      </div>
    </header>
  );
};

export default Header;