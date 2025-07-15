/* eslint-disable import/no-unresolved */
import * as monaco from "monaco-editor";
// @ts-expect-error: Need to figure out why this is erroring here but not in my other vite project
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import theme from "./monaco-theme";

function initMonacoEditor(container: HTMLElement) {
  self.MonacoEnvironment = {
    getWorker() {
      return new tsWorker();
    },
  };

  monaco.editor.defineTheme("NightOwl", theme);

  return monaco.editor.create(container, {
    value: "",
    language: "typescript",
    theme: "NightOwl",
    minimap: {
      enabled: false,
    },
    autoClosingQuotes: "always",
    autoClosingBrackets: "always",
    renderValidationDecorations: "off",
    parameterHints: {
      enabled: false,
    },
    quickSuggestions: false,
    hover: {
      enabled: false,
    },
    fontSize: 14,
    automaticLayout: true,
  });
}

export { initMonacoEditor };
