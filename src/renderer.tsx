import { createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";
import { initMonacoEditor } from "@/utils/monaco-editor";
import { prebake } from "@/utils/strudel.js";
import type { FileData } from "@/types/file-data";
import type { Editor } from "@/types/monaco";
import "@/styles/global.css";

const { onFileOpened, openFile, onRequestSave } = window.electronAPI;

function App() {
  // const [playing, setPlaying] = createSignal(false);
  // const [strudel, setStrudel] = createSignal<unknown | null>(null);
  const [editor, setEditor] = createSignal<Editor | null>(null);
  const [file, setFile] = createSignal<FileData | null>(null);
  let editorContainer: HTMLDivElement;

  async function handleOpenFile() {
    const data = await openFile();
    if (data) {
      setFile(data);
      editor()?.setValue(data.content);
    }
  }

  onFileOpened((data) => {
    setFile(data);
    editor()?.setValue(data.content);
  });

  onRequestSave(() => {
    const content = editor().getValue();
    setFile((c) => ({ ...c, content }));
    return { path: file().path, content };
  });

  onMount(async () => {
    const strudel = await prebake();
    const monacoEditor = initMonacoEditor(editorContainer);
    // setStrudel(strudel);
    setEditor(monacoEditor);

    function handlePlay() {
      strudel.evaluate(editor().getValue());
      // setPlaying(true);
    }

    function handlePause() {
      strudel.stop();
      // setPlaying(false);
    }

    window.addEventListener("keydown", (e) => {
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        handlePlay();
      } else if (e.key === "≥" && e.altKey) {
        e.preventDefault();
        handlePause();
      } else if (e.key === "w" && e.metaKey) {
        setFile(null);
      }
    });
  });

  return (
    <>
      <div id="navbar" />
      <div id="app" data-editable={Boolean(file())}>
        <div id="editor-container" ref={editorContainer} />
        <div id="editor-fallback" style={{ "z-index": 1 }}>
          <button onclick={handleOpenFile}>Open file</button>
        </div>
      </div>
    </>
  );
}

const root = document.getElementById("root");

if (root) {
  render(() => <App />, root);
} else {
  console.error("[renderer.ts]: Could not find root element in index.html.");
}
