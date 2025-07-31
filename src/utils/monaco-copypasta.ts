// ------------------------------------------------------------------------
// (HOPEFULLY) TEMPORARY FIX FOR BROKEN COPY/PASTE IN ELECTRON
//   -> https://github.com/microsoft/monaco-editor/issues/4855
// ------------------------------------------------------------------------

import * as monaco from "monaco-editor";

declare global {
  interface Window {
    monacoClipboardSegments?: string[] | null;
  }
}

type Editor = ReturnType<typeof monaco.editor.create>;

type MonacoEdit = {
  range: monaco.Range | monaco.Selection;
  text: string;
  forceMoveMarkers?: boolean;
};

export function PolyfillKeyCommands(editor: Editor) {
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
        if (!selection) return;

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
        if (!selection) return;
        const selectedText = editor.getModel()?.getValueInRange(selection);
        if (!selectedText) return;
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
        if (!selection) return;
        let textToCut;
        let rangeToDelete;

        // Check if there's an actual selection (not just cursor position)
        if (selection.isEmpty()) {
          // No selection - cut the entire line
          const position = editor.getPosition();
          const lineNumber = position?.lineNumber;
          const model = editor.getModel();
          if (!model || !lineNumber) return;

          // Get the full line including line ending
          textToCut = model.getLineContent(lineNumber) + "\n";

          // Range to delete the entire line (including line break)
          rangeToDelete = new monaco.Range(lineNumber, 1, lineNumber + 1, 1);
        } else {
          // There's a selection - cut the selected text
          textToCut = editor.getModel()?.getValueInRange(selection);
          rangeToDelete = selection;
        }

        if (textToCut) {
          await navigator.clipboard.writeText(textToCut);
          editor.executeEdits("cut", [
            {
              range: rangeToDelete,
              text: "",
              forceMoveMarkers: true,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to cut:", err);
      }
    },
  });
}
