import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook to detect barcode scanner input
 * Barcode scanners typically send input very quickly followed by Enter
 * This hook detects fast keyboard input patterns typical of USB/wireless barcode scanners
 * @param {Function} onScan - Callback when barcode is scanned
 * @param {Object} options - Configuration options
 * @returns {Object} - Scanner state and methods
 */
export const useBarcodeScanner = (onScan, options = {}) => {
  const {
    minLength = 3, // Minimum barcode length
    maxLength = 50, // Maximum barcode length
    timeout = 100, // Timeout in ms to detect scanner input (scanners type very fast)
    enabled = true, // Enable/disable scanner detection
    ignoreInputs = false, // If true, ignore input events from actual input fields
  } = options;

  const inputBuffer = useRef('');
  const timeoutRef = useRef(null);
  const lastInputTime = useRef(0);
  const isScanningRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);

  const clearBuffer = useCallback(() => {
    inputBuffer.current = '';
    isScanningRef.current = false;
    setIsScanning(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      // Only process if scanner detection is enabled
      if (!enabled) return;

      // Skip if user is typing in an input field (unless ignoreInputs is false)
      if (ignoreInputs) {
        const target = event.target;
        const isInputField = 
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('contenteditable') === 'true';
        
        if (isInputField) {
          return;
        }
      }

      const now = Date.now();
      const timeSinceLastInput = now - lastInputTime.current;

      // If Enter is pressed and we have input, it's likely a scanner
      if (event.key === 'Enter' && inputBuffer.current.length >= minLength) {
        event.preventDefault();
        event.stopPropagation();
        
        const barcode = inputBuffer.current.trim();
        if (barcode.length >= minLength && barcode.length <= maxLength) {
          isScanningRef.current = true;
          setIsScanning(true);
          onScan(barcode);
          clearBuffer();
        }
        return;
      }

      // Detect fast input (scanner typing)
      // Scanners typically send characters very quickly (< 50ms between keystrokes)
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        // If time since last input is very short (< 50ms), likely scanner input
        if (timeSinceLastInput < 50) {
          isScanningRef.current = true;
          setIsScanning(true);
        }

        // Add character to buffer
        inputBuffer.current += event.key;

        // Limit buffer size
        if (inputBuffer.current.length > maxLength) {
          inputBuffer.current = inputBuffer.current.slice(-maxLength);
        }

        // Clear buffer if too much time passes (user typing normally)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          // If no Enter was pressed, clear buffer (user was typing)
          if (!isScanningRef.current) {
            clearBuffer();
          }
        }, timeout);

        lastInputTime.current = now;
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        // User is editing, clear scanner detection
        clearBuffer();
      } else if (event.key === 'Escape') {
        // Allow escape to clear scanner buffer
        clearBuffer();
      }
    },
    [enabled, minLength, maxLength, timeout, onScan, clearBuffer, ignoreInputs]
  );

  useEffect(() => {
    if (!enabled) {
      clearBuffer();
      return;
    }

    // Add global keydown listener with capture to catch events early
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      clearBuffer();
    };
  }, [enabled, handleKeyDown, clearBuffer]);

  return {
    isScanning,
    clearBuffer,
  };
};

