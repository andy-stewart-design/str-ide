import * as monaco from "monaco-editor";
// @ts-expect-error: Need to figure out why this is erroring here but not in my other vite project
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import theme from "./monaco-theme";
import { PolyfillKeyCommands } from "./monaco-copypasta";

function initMonacoEditor(container: HTMLElement) {
  self.MonacoEnvironment = {
    getWorker() {
      return new tsWorker();
    },
  };

  monaco.editor.defineTheme("StrudelTheme", theme);

  const editor = monaco.editor.create(container, {
    value: "",
    language: "typescript",
    theme: "StrudelTheme",
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
    padding: { top: 16 },
    automaticLayout: true,
    stickyScroll: { enabled: false },
    folding: false,
  });

  PolyfillKeyCommands(editor);

  // ------------------------------------------------------------------------

  return editor;
}

export { initMonacoEditor };
