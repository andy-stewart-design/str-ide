import {
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Show,
  For,
} from "solid-js";
import { render } from "solid-js/web";
import { initMonacoEditor } from "@/utils/monaco-editor";
import { prebake } from "@/utils/strudel.js";
import type { FileData } from "@/types/file-data";
import type { Editor } from "@/types/monaco";
import "@/styles/global.css";

interface TabData extends FileData {
  id: string;
}

type TabGroup = Record<string, TabData>;
type EditorGroup = Record<string, Editor>;

const {
  onRequestNewFile,
  openFile,
  onFileOpened,
  saveFile,
  onRequestSave,
  onFileSaved,
  onRequestClose,
  onRequestPlay,
  onRequestPause,
  removeAllListeners,
  warnBeforeClosing,
} = window.electronAPI;

function App() {
  // const [playing, setPlaying] = createSignal(false);
  const [strudel, setStrudel] = createSignal<any | null>(null);
  const [editor, setEditor] = createSignal<Editor | null>(null);
  const [file, setFile] = createSignal<FileData | null>(null);

  const [tabs, setTabs] = createSignal<TabGroup | null>(null);
  const [activeTab, setActiveTab] = createSignal<string | null>(null);
  const [editors, setEditors] = createSignal<EditorGroup | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    const strudel = await prebake({ setError });
    setStrudel(strudel);
  });

  onRequestNewFile(handleCreateNewFile);

  onFileOpened((data) => {
    const id = crypto.randomUUID();
    const currentTabs = tabs() ?? {};
    setTabs({ ...currentTabs, [id]: { id, ...data } });
    editor()?.setValue(data.content);
  });

  onRequestSave(handleSaveFile);

  onFileSaved(setFile);

  onRequestClose(async () => {
    const fileContent = file()?.content;
    const editorContent = editor()?.getValue();

    if (fileContent === editorContent) {
      setFile(null);
      editor()?.setValue("");
    } else {
      const response = await warnBeforeClosing();

      if (response === "show_save_dialog") {
        handleSaveFile();
      } else if (response === "close_without_saving") {
        setFile(null);
        editor()?.setValue("");
      }
    }
  });

  onCleanup(removeAllListeners);

  onRequestPlay(() => strudel()?.evaluate(editor()?.getValue()));

  onRequestPause(() => strudel()?.stop());

  function handleInitEditor(el: HTMLDivElement, tab: TabData) {
    const newEditor = initMonacoEditor(el);
    newEditor.setValue(tab.content);
    newEditor.focus();

    const currentEditors = editors() ?? {};
    setEditors({ ...currentEditors, [tab.id]: newEditor });
  }

  function handleCreateNewFile() {
    const id = crypto.randomUUID();
    const currentTabs = tabs() ?? {};
    const newTab = { id, path: null, name: null, content: "" };
    setTabs({ ...currentTabs, [id]: newTab });
  }

  async function handleOpenFile() {
    const data = await openFile();
    if (data) {
      const id = crypto.randomUUID();
      const currentTabs = tabs() ?? {};
      setTabs({ ...currentTabs, [id]: { id, ...data } });
    }
  }

  function handleSaveFile() {
    const fileData = file();
    // const content = editor()?.getValue();
    // if (!fileData || !content) return;
    // saveFile(fileData.path, content);
  }

  createEffect(() => {
    console.log("The error is of type", typeof error());
    console.log(error()?.toString());
  });

  return (
    <>
      <div id="navbar">
        <Show when={file()}>
          <p>{file()?.path ?? "untitled"}</p>
        </Show>
      </div>
      <div id="app" data-editable={Boolean(file())}>
        <For each={Object.values(tabs() ?? {})}>
          {(tab) => (
            <div
              id="editor-container"
              ref={(el) => handleInitEditor(el, tab)}
            />
          )}
        </For>
        <div id="editor-fallback" style={{ "z-index": 1 }}>
          <button onclick={handleCreateNewFile}>New file</button>
          <button onclick={handleOpenFile}>Open file</button>
        </div>
        <Show when={error()}>
          <button id="error-banner" onClick={() => setError(null)}>
            <p>{error()}</p>
            <svg viewBox="0 0 16 16" width={16} height={16}>
              <path
                d="M 4 4 L 12 12 M 4 12 L 12 4"
                fill="none"
                stroke="white"
                stroke-width={1.5}
              />
            </svg>
          </button>
        </Show>
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
