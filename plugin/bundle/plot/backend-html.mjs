import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  plotlyPageHtml
} from "../chunk-USVSPPCS.mjs";
import {
  PLOTLY_CDN_URL,
  PLOTLY_SRI
} from "../chunk-UDEV2G2S.mjs";
import {
  readPlotFigure,
  readPlotOptions
} from "../chunk-TQ56VOOR.mjs";
import "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/plot/backend-html.js
async function render(request) {
  const { lenient } = readPlotOptions(request.options, ["lenient"]);
  const { figure, warnings } = readPlotFigure(String(request.source), { lenient });
  const title = figure.layout.title?.text;
  const html = plotlyPageHtml(figure, PLOTLY_CDN_URL, PLOTLY_SRI, typeof title === "string" && title !== "" ? title : "plot");
  return { bytes: new TextEncoder().encode(html), warnings };
}
export {
  render
};
