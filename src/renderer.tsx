import { createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";
import { initMonacoEditor } from "./utils/monaco-editor";
import "./styles/global.css";

type Editor = ReturnType<typeof initMonacoEditor>;
type FileData = {
  path: string;
  contents: string;
};

const { openFile } = window.electronAPI;

function App() {
  const [editor, setEditor] = createSignal<Editor | null>(null);
  const [file, setFile] = createSignal<FileData | null>(null);
  let editorContainer: HTMLDivElement;

  async function handleClick() {
    const fileData = await openFile();
    if (fileData.canceled === false) {
      setFile({ path: fileData.path, contents: fileData.contents });
      editor()?.setValue(fileData.contents);
    }
  }

  onMount(() => {
    const monacoEditor = initMonacoEditor(editorContainer);
    setEditor(monacoEditor);
  });

  return (
    <div id="app" data-editable={Boolean(file())}>
      <div id="editor-container" ref={editorContainer} />
      <div id="editor-fallback" style={{ "z-index": 1 }}>
        <button onclick={handleClick}>Open file</button>
      </div>
    </div>
  );
}

const root = document.getElementById("root");

if (root) {
  render(() => <App />, root);
} else {
  console.error("[renderer.ts]: Could not find root element in index.html.");
}
