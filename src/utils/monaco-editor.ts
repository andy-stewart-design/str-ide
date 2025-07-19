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

  const editor = monaco.editor.create(container, {
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

  // ------------------------------------------------------------------------
  // (HOPEFULLY) TEMPORARY FIX FOR BROKEN COPY/PASTE IN ELECTRON
  //   -> https://github.com/microsoft/monaco-editor/issues/4855
  // ------------------------------------------------------------------------

  editor.addAction({
    id: "custom-paste",
    label: "Paste",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
    run: async (editor) => {
      try {
        const clipboardText = await navigator.clipboard.readText();
        const selection = editor.getSelection();
        editor.executeEdits("paste", [
          {
            range: selection,
            text: clipboardText,
            forceMoveMarkers: true,
          },
        ]);
      } catch (err) {
        console.error("Failed to paste:", err);
      }
    },
  });

  editor.addAction({
    id: "custom-copy",
    label: "Copy",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC],
    run: async (editor) => {
      try {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        await navigator.clipboard.writeText(selectedText);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
  });

  editor.addAction({
    id: "custom-cut",
    label: "Cut",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX],
    run: async (editor) => {
      try {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        await navigator.clipboard.writeText(selectedText);
        editor.executeEdits("cut", [
          {
            range: selection,
            text: "",
            forceMoveMarkers: true,
          },
        ]);
      } catch (err) {
        console.error("Failed to cut:", err);
      }
    },
  });

  // ------------------------------------------------------------------------

  return editor;
}

export { initMonacoEditor };
