// src/index.ts
import process from "process";
import { execa } from "execa";
import { getEditor, defaultEditor } from "env-editor";
import { parseLineColumnPath, stringifyLineColumnPath } from "line-column-path";
import open from "open";
function getEditorInfo(files, options = {}) {
  if (!Array.isArray(files)) {
    throw new TypeError(`Expected an \`Array\`, got ${typeof files}`);
  }
  const editor = options.editor ? getEditor(options.editor) : defaultEditor();
  const editorArguments = [];
  if (["vscode", "vscodium", "cursor", "trae", "windsurf"].includes(editor.id)) {
    editorArguments.push("--goto");
  }
  for (const file of files) {
    const parsed = parseLineColumnPath(file);
    if (["sublime", "atom", "zed", "vscode", "vscodium", "cursor", "trae", "windsurf"].includes(editor.id)) {
      editorArguments.push(stringifyLineColumnPath(parsed));
      if (options.wait) {
        editorArguments.push("--wait");
      }
      continue;
    }
    if (["webstorm", "intellij"].includes(editor.id)) {
      editorArguments.push(stringifyLineColumnPath(parsed, { column: false }));
      if (options.wait) {
        editorArguments.push("--wait");
      }
      continue;
    }
    if (editor.id === "textmate") {
      editorArguments.push(
        "--line",
        stringifyLineColumnPath(parsed, {
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
  const { fallback = true } = options;
  const result = getEditorInfo(files, options);
  const stdio = result.isTerminalEditor ? "inherit" : "ignore";
  try {
    const subprocess = execa(result.binary, result.arguments, {
      detached: true,
      stdio
    });
    await new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
      }, 100);
      subprocess.on("error", async (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          if (fallback) {
            for (const file of files) {
              const parsed = parseLineColumnPath(file);
              await open(parsed.file);
            }
            resolve(true);
          } else {
            reject(error);
          }
        }
      });
      subprocess.on("exit", async (code) => {
        if (!resolved && code !== 0) {
          resolved = true;
          clearTimeout(timeout);
          if (fallback) {
            for (const file of files) {
              const parsed = parseLineColumnPath(file);
              await open(parsed.file);
            }
            resolve(true);
          } else {
            reject(new Error(`Editor exited with code ${code}`));
          }
        }
      });
    });
    if (options.wait) {
      return new Promise((resolve, reject) => {
        subprocess.on("exit", (code) => {
          if (code === 0) {
            resolve(true);
          } else if (fallback) {
            files.forEach(async (file) => {
              const parsed = parseLineColumnPath(file);
              await open(parsed.file);
            });
            resolve(true);
          } else {
            reject(new Error(`Editor exited with code ${code}`));
          }
        });
        subprocess.on("error", (error) => {
          if (fallback) {
            files.forEach(async (file) => {
              const parsed = parseLineColumnPath(file);
              await open(parsed.file);
            });
            resolve(true);
          } else {
            reject(error);
          }
        });
      });
    }
    if (result.isTerminalEditor) {
      subprocess.on("exit", process.exit);
    } else {
      subprocess.unref();
    }
    return true;
  } catch (error) {
    if (fallback) {
      for (const file of files) {
        const parsed = parseLineColumnPath(file);
        await open(parsed.file);
      }
      return true;
    } else {
      throw error;
    }
  }
}
async function tryOpenEditor(files, editorOptions) {
  for (const editorOption of editorOptions) {
    try {
      const res = await openEditor(files, editorOption);
      if (res) {
        return true;
      }
    } catch (e) {
    }
  }
  return false;
}
export {
  openEditor as default,
  getEditorInfo,
  tryOpenEditor
};
