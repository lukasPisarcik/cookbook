# Imports and exports

Applies to: every `.ts` and `.svelte` file.

## `$lib` alias

SvelteKit aliases `src/lib` to `$lib`. Always use it for cross-module imports:

```ts
// Good
import { Patient } from '$lib/schemas';
import { log } from '$lib/helpers/logger';

// Bad — breaks when files move
import { Patient } from '../../lib/schemas';
```

## Barrel files

Each top-level folder under `src/lib/` has an `index.ts` that re-exports its public API:

- `src/lib/schemas/index.ts` re-exports `./schemas`
- `src/lib/helpers/index.ts` re-exports each helper
- `src/lib/components/index.ts` re-exports the UI primitives
- `src/lib/index.ts` re-exports the server-safe modules (schemas, helpers, errors, dictionary)

Browser-only modules (`stores`, `essentials`) are imported from their specific path, not the root `$lib` barrel, so they don't leak into SSR contexts.

```ts
// Good
import { themeStore } from '$lib/stores';
import { Header } from '$lib/essentials';

// Bad — could pull a browser dependency into a server file
import { themeStore } from '$lib';
```

## Import order

Group imports by origin, blank line between groups:

```ts
// 1. Node / SvelteKit / external libs
import { onMount } from 'svelte';
import { z } from 'zod';

// 2. $lib / $app
import { Patient } from '$lib/schemas';
import { Button } from '$lib/components';

// 3. Relative imports (sparingly)
import { localHelper } from './helpers';

// 4. Type-only imports (TS will collapse if you mix; Prettier sorts)
import type { ComponentProps } from 'svelte';
```

Prettier + ESLint enforce most of this — run `bun run format` to fix violations.
