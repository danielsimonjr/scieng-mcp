import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);

// node_modules/@danielsimonjr/sciengjs/dist/browser/pinned.js
var MERMAID_VERSION = "11.17.2";
var MERMAID_SHA256 = "581ed7d74bd9048d0e3a91363927d72ef22942d7722546b27f7cc29e35390eb8";
var MERMAID_FILE = "mermaid.min.js";
var MERMAID_CDN_URL = `https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.min.js`;
var PLOTLY_VERSION = "4.2.0";
var PLOTLY_SRI = "sha256-/ek5ZKdRG/pUxXRcSbXQ5BcVy94Mxevq4/mgLeA5bK4=";
var PLOTLY_CDN_URL = `https://cdn.jsdelivr.net/npm/plotly.js-dist-min@${PLOTLY_VERSION}/plotly.min.js`;
var THREE_VERSION = "0.187.0";
var THREE_CDN_BASE = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/`;
var THREE_MODULES = [
  { path: "build/three.module.js", url: `${THREE_CDN_BASE}build/three.module.js`, file: "three.module.js", mime: "text/javascript", sha256: "104f56145899722094556490d787aae0617cc2fc3382f31df02d724ea1aee341", sri: "sha256-EE9WFFiZciCUVWSQ14eq4GF8wvwzgvMd8C1yTqGu40E=" },
  { path: "build/three.core.js", url: `${THREE_CDN_BASE}build/three.core.js`, file: "three.core.js", mime: "text/javascript", sha256: "613e370f76638fdef83926642bf256dc9615684922de1ce1f63a8583e5d78578", sri: "sha256-YT43D3Zjj974OSZkK/JW3JYVaEki3hzh9jqFg+XXhXg=" },
  { path: "examples/jsm/controls/OrbitControls.js", url: `${THREE_CDN_BASE}examples/jsm/controls/OrbitControls.js`, file: "three.OrbitControls.js", mime: "text/javascript", sha256: "e7fca2fe9e7670a828af9b28084669a5909445b7f36f1f26cee9bf8f2961c32c", sri: "sha256-5/yi/p52cKgor5soCEZppZCURbfzbx8mzum/jylhwyw=" },
  { path: "examples/jsm/loaders/GLTFLoader.js", url: `${THREE_CDN_BASE}examples/jsm/loaders/GLTFLoader.js`, file: "three.GLTFLoader.js", mime: "text/javascript", sha256: "532ac726e120039acbcd6cf54328c57acbf7b438176afaa6951257126d11bff1", sri: "sha256-UyrHJuEgA5rLzWz1QyjFesv3tDgXavqmlRJXEm0Rv/E=" },
  { path: "examples/jsm/utils/BufferGeometryUtils.js", url: `${THREE_CDN_BASE}examples/jsm/utils/BufferGeometryUtils.js`, file: "three.BufferGeometryUtils.js", mime: "text/javascript", sha256: "7bda2a8ba836b2bcf67cb938d4b9e1bb5d1b1bc616817103ed858c0b58296ce7", sri: "sha256-e9oqi6g2srz2fLk41Lnhu10bG8YWgXED7YWMC1gpbOc=" },
  { path: "examples/jsm/utils/SkeletonUtils.js", url: `${THREE_CDN_BASE}examples/jsm/utils/SkeletonUtils.js`, file: "three.SkeletonUtils.js", mime: "text/javascript", sha256: "b1632a703206c3d830de9fcbe515696770d04b71a15ee6b50afa6d2c3298c86f", sri: "sha256-sWMqcDIGw9gw3p/L5RVpZ3DQS3GhXua1CvptLDKYyG8=" }
];
var THREE_MAIN_URL = THREE_MODULES[0].url;

export {
  MERMAID_SHA256,
  MERMAID_FILE,
  MERMAID_CDN_URL,
  PLOTLY_SRI,
  PLOTLY_CDN_URL,
  THREE_MODULES,
  THREE_MAIN_URL
};
