import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/dom';

// Clean up after each test to prevent memory leaks
afterEach(() => {
  cleanup();
});
