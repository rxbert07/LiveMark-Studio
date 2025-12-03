import {
  parse
} from "./chunk-G5EXJGMH.js";
import "./chunk-DVGCIB4H.js";
import "./chunk-PAC7GLS3.js";
import "./chunk-XGG4P4DP.js";
import "./chunk-ADTUEMIM.js";
import "./chunk-TBEWIGZ6.js";
import "./chunk-WK6HWB7O.js";
import "./chunk-GYKGZKQ2.js";
import "./chunk-GJN5GOB2.js";
import "./chunk-MRATNVDV.js";
import {
  package_default
} from "./chunk-AG2D4KHT.js";
import {
  selectSvgElement
} from "./chunk-RQVLCEN3.js";
import "./chunk-SGZ3JTF4.js";
import {
  configureSvgSize
} from "./chunk-DWFV72UV.js";
import "./chunk-ZSPGELVN.js";
import "./chunk-63E7Z24X.js";
import {
  __name,
  log
} from "./chunk-QACTWSLY.js";
import "./chunk-DI52DQAC.js";

// node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-ER5ION4S.mjs
var parser = {
  parse: __name(async (input) => {
    const ast = await parse("info", input);
    log.debug(ast);
  }, "parse")
};
var DEFAULT_INFO_DB = {
  version: package_default.version + (true ? "" : "-tiny")
};
var getVersion = __name(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};
var draw = __name((text, id, version) => {
  log.debug("rendering info diagram\n" + text);
  const svg = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };
var diagram = {
  parser,
  db,
  renderer
};
export {
  diagram
};
//# sourceMappingURL=infoDiagram-ER5ION4S-VXNXX4PC.js.map
