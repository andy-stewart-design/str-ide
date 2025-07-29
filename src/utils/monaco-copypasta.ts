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
  editor.addAction({
    id: "custom-paste",
    label: "Paste",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
    run: async (editor) => {
      try {
        const clipboardText = await navigator.clipboard.readText();
        const selections = editor.getSelections();
        const edits: MonacoEdit[] = [];
        if (!selections) return;

        // Check if we have stored segments from a previous multi-cursor copy
        const hasStoredSegments =
          window.monacoClipboardSegments &&
          window.monacoClipboardSegments.length === selections.length;

        if (hasStoredSegments) {
          // Smart paste - match each segment to each cursor
          // Process selections from bottom to top to maintain correct order
          [...selections].reverse().forEach((selection, reverseIndex) => {
            const index = selections.length - 1 - reverseIndex;
            edits.push({
              range: selection,
              text: window.monacoClipboardSegments![index],
              forceMoveMarkers: true,
            });
          });
        } else {
          // Regular paste - split clipboard content by lines if multiple cursors
          const clipboardLines = clipboardText.split("\n");

          if (
            selections.length > 1 &&
            clipboardLines.length === selections.length
          ) {
            // If we have the same number of lines as cursors, paste each line to each cursor
            // Process selections from bottom to top to maintain correct order
            [...selections].reverse().forEach((selection, reverseIndex) => {
              const index = selections.length - 1 - reverseIndex;
              edits.push({
                range: selection,
                text: clipboardLines[index],
                forceMoveMarkers: true,
              });
            });
          } else {
            // Default behavior - paste the same content at each cursor
            selections.forEach((selection) => {
              edits.push({
                range: selection,
                text: clipboardText,
                forceMoveMarkers: true,
              });
            });
          }
        }

        editor.executeEdits("paste", edits);

        // Clear stored segments after paste
        window.monacoClipboardSegments = null;
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
        const selections = editor.getSelections(); // Get all selections
        const model = editor.getModel();
        let textToCopy = "";
        if (!selections || !model) return;

        selections.forEach((selection, index) => {
          if (selection.isEmpty()) {
            // No selection - copy the entire line
            const lineNumber = selection.startLineNumber;
            textToCopy += model.getLineContent(lineNumber);
          } else {
            // Copy selected text
            textToCopy += model.getValueInRange(selection);
          }

          // Add newline between multiple selections (except last one)
          if (index < selections.length - 1) {
            textToCopy += "\n";
          }
        });

        await navigator.clipboard.writeText(textToCopy);
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
        const selections = editor.getSelections();
        const model = editor.getModel();
        const textSegments: string[] = [];
        const edits: MonacoEdit[] = [];
        if (!selections || !model) return;

        selections.forEach((selection) => {
          let textToCut: string;
          let rangeToDelete: monaco.Range;

          if (selection.isEmpty()) {
            // No selection - cut the entire line
            const position = selection.getStartPosition();
            const lineNumber = position.lineNumber;

            textToCut = model.getLineContent(lineNumber);
            textSegments.push(textToCut);

            // Range to delete the entire line (including line break)
            rangeToDelete = new monaco.Range(lineNumber, 1, lineNumber + 1, 1);
          } else {
            // There's a selection - cut the selected text
            textToCut = model.getValueInRange(selection);
            textSegments.push(textToCut);
            rangeToDelete = selection;
          }

          edits.push({
            range: rangeToDelete,
            text: "",
            forceMoveMarkers: true,
          });
        });

        // Store segments and copy to clipboard
        const combinedText = textSegments.join("\n");
        await navigator.clipboard.writeText(combinedText);
        window.monacoClipboardSegments = textSegments;

        // Execute all cuts
        editor.executeEdits("cut", edits);
      } catch (err) {
        console.error("Failed to cut:", err);
      }
    },
  });
}
