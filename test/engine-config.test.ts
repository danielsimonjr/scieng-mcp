// The engine config of the server. The bundle reads the engine assets from the folder beside its index.mjs.
// An unbundled run (the tests) sends no assets key, so the engine uses its own assets folder.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bundledEngineConfig, engineConfig } from "../src/engine-config.ts";

test("a bundled module points the engine at the assets folder beside it", () => {
  assert.deepEqual(bundledEngineConfig("file:///C:/plugin/bundle/index.mjs"), {
    assetsUrl: "file:///C:/plugin/bundle/assets/",
  });
});

test("outside the bundle the engine config is empty, so the engine uses its own assets folder", () => {
  assert.deepEqual(engineConfig(), {});
});
