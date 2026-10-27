import { defineConfig } from 'vitest/config';

import { browserTestConfig } from '../../vitest.browser.config';

export default defineConfig({ test: browserTestConfig });
