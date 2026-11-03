import type { SciengConfig } from "@danielsimonjr/sciengjs";

// scripts/bundle.mjs defines this flag as true. An unbundled run leaves `__SCIENG_BUNDLED__` undefined.
declare const __SCIENG_BUNDLED__: boolean | undefined;

/**
 * Returns the engine config that reads the assets from the folder beside the given module.
 * Pass the import.meta.url of the module as moduleUrl.
 */
export function bundledEngineConfig(moduleUrl: string): Partial<SciengConfig> {
  return { assetsUrl: new URL("./assets/", moduleUrl).href };
}

/**
 * Returns the engine config for every engine call.
 * The bundle sends its assets folder. An unbundled run sends no assets key, so the engine uses its own assets folder.
 */
export function engineConfig(): Partial<SciengConfig> {
  if (typeof __SCIENG_BUNDLED__ !== "undefined" && __SCIENG_BUNDLED__) {
    return bundledEngineConfig(import.meta.url);
  }
  return {};
}
