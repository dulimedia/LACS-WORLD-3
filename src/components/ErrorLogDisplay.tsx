import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { X, AlertCircle } from 'lucide-react';

export function ErrorLogDisplay() {
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<Array<{ timestamp: string; message: string }>>([]);

  useEffect(() => {
    const checkErrors = () => {
      const persistedErrors = logger.getPersistedErrors();
      if (persistedErrors.length > 0) {
        setErrors(persistedErrors);
        setVisible(true);
      }
    };

    checkErrors();
    const interval = setInterval(checkErrors, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!visible || errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-md bg-red-50 border-2 border-red-500 rounded-lg shadow-2xl">
      <div className="flex items-center justify-between p-3 bg-red-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle size={20} />
          <span className="font-semibold">Error Log ({errors.length})</span>
        </div>
        <button
          onClick={() => {
            logger.clearPersistedErrors();
            setVisible(false);
          }}
          className="hover:bg-red-600 rounded p-1"
        >
          <X size={20} />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto p-3 space-y-2">
        {errors.map((error, i) => (
          <div key={i} className="bg-white rounded p-2 border border-red-200 text-xs">
            <div className="text-red-600 font-mono mb-1">
              {new Date(error.timestamp).toLocaleTimeString()}
            </div>
            <div className="text-gray-800 break-words">{error.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
