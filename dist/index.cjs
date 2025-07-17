"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => openEditor,
  getEditorInfo: () => getEditorInfo
});
module.exports = __toCommonJS(index_exports);
var import_node_process = __toESM(require("process"), 1);
var import_execa = require("execa");
var import_env_editor = require("env-editor");
var import_line_column_path = require("line-column-path");
var import_open = __toESM(require("open"), 1);
function getEditorInfo(files, options = {}) {
  if (!Array.isArray(files)) {
    throw new TypeError(`Expected an \`Array\`, got ${typeof files}`);
  }
  const editor = options.editor ? (0, import_env_editor.getEditor)(options.editor) : (0, import_env_editor.defaultEditor)();
  const editorArguments = [];
  if (["vscode", "vscodium", "cursor", "trae", "windsurf"].includes(editor.id)) {
    editorArguments.push("--goto");
  }
  for (const file of files) {
    const parsed = (0, import_line_column_path.parseLineColumnPath)(file);
    if (["sublime", "atom", "zed", "vscode", "vscodium", "cursor", "trae", "windsurf"].includes(editor.id)) {
      editorArguments.push((0, import_line_column_path.stringifyLineColumnPath)(parsed));
      if (options.wait) {
        editorArguments.push("--wait");
      }
      continue;
    }
    if (["webstorm", "intellij"].includes(editor.id)) {
      editorArguments.push((0, import_line_column_path.stringifyLineColumnPath)(parsed, { column: false }));
      if (options.wait) {
        editorArguments.push("--wait");
      }
      continue;
    }
    if (editor.id === "textmate") {
      editorArguments.push(
        "--line",
        (0, import_line_column_path.stringifyLineColumnPath)(parsed, {
          file: false
        }),
        parsed.file
      );
      if (options.wait) {
        editorArguments.push("--wait");
      }
      continue;
    }
    if (["vim", "neovim"].includes(editor.id)) {
      editorArguments.push(
        `+call cursor(${parsed.line}, ${parsed.column})`,
        parsed.file
      );
      continue;
    }
    editorArguments.push(parsed.file);
  }
  return {
    binary: editor.binary,
    arguments: editorArguments,
    isTerminalEditor: editor.isTerminalEditor
  };
}
async function openEditor(files, options = {}) {
  const result = getEditorInfo(files, options);
  const stdio = result.isTerminalEditor ? "inherit" : "ignore";
  const subprocess = (0, import_execa.execa)(result.binary, result.arguments, {
    detached: true,
    stdio
  });
  subprocess.on("error", () => {
    const result2 = getEditorInfo(files, {
      ...options,
      editor: ""
    });
    for (const file of result2.arguments) {
      (0, import_open.default)(file);
    }
  });
  if (options.wait) {
    return new Promise((resolve) => {
      subprocess.on("exit", resolve);
    });
  }
  if (result.isTerminalEditor) {
    subprocess.on("exit", import_node_process.default.exit);
  } else {
    subprocess.unref();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getEditorInfo
});
