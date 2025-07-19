import { createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";
import { initMonacoEditor } from "./utils/monaco-editor";
import { prebake } from "./utils/strudel.js";
import "./styles/global.css";

type Editor = ReturnType<typeof initMonacoEditor>;
type FileData = { path: string; contents: string };

const { openFile, saveFile } = window.electronAPI;

function App() {
  // const [playing, setPlaying] = createSignal(false);
  // const [strudel, setStrudel] = createSignal<unknown | null>(null);
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

    function handleSaveFile() {
      const path = file()?.path;
      const contents = editor()?.getValue();

      if (path && contents) {
        saveFile({ path, contents });
      }
    }

    window.addEventListener("keydown", (e) => {
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        handlePlay();
      } else if (e.key === "≥" && e.altKey) {
        e.preventDefault();
        handlePause();
      } else if (e.key === "s" && e.metaKey) {
        handleSaveFile();
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
          <button onclick={handleClick}>Open file</button>
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
