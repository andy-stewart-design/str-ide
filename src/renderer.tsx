import { createSignal, onCleanup, onMount, Show, For } from "solid-js";
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
  const [tabs, setTabs] = createSignal<TabGroup>({});
  const [activeTab, setActiveTab] = createSignal<string>("");
  const [editors, setEditors] = createSignal<EditorGroup>({});
  const [error, setError] = createSignal<string | null>(null);
  const tabsArray = () => Object.values(tabs());

  onMount(async () => {
    const strudel = await prebake({ setError });
    setStrudel(strudel);
  });

  onRequestNewFile(handleCreateNewFile);

  onFileOpened((data) => {
    const id = crypto.randomUUID();
    const currentTabs = tabs();
    setTabs({ ...currentTabs, [id]: { id, ...data } });
    setActiveTab(id);
  });

  onRequestSave(handleSaveFile);

  // TODO: Figure out if this is necessary
  onFileSaved((data) => {
    const id = activeTab();
    const editor = editors()[id];
    if (!data || !editor) return;
    const content = editor.getValue();
    const currentTabs = tabs();
    currentTabs[id].content = content;
    setTabs({ ...currentTabs });
  });

  onRequestClose(async () => {
    const id = activeTab();
    const tab = tabs()[id];
    const editor = editors()[id];

    if (!id || !tab || !editor) return;

    if (tab.content === editor.getValue()) {
      const currentTabs = tabs();
      const currentEditors = editors();
      delete currentTabs[id];
      delete currentEditors[id];
      setTabs({ ...currentTabs });
      setEditors({ ...currentEditors });
      editor.dispose();
      if (tabsArray.length <= 1) setActiveTab("");
    } else {
      const response = await warnBeforeClosing();
      if (response === "show_save_dialog") {
        handleSaveFile();
      } else if (response === "close_without_saving") {
        const currentTabs = tabs();
        const currentEditors = editors();
        delete currentTabs[id];
        delete currentEditors[id];
        setTabs({ ...currentTabs });
        setEditors({ ...currentEditors });
        editor.dispose();
        if (tabsArray.length <= 1) setActiveTab("");
      }
    }
  });

  onCleanup(removeAllListeners);

  onRequestPlay(() => {
    const editor = editors()[activeTab()];
    if (editor) strudel()?.evaluate(editor.getValue());
  });

  onRequestPause(() => strudel()?.stop());

  function handleInitEditor(el: HTMLDivElement, tab: TabData) {
    const newEditor = initMonacoEditor(el);
    const currentEditors = editors();
    setEditors({ ...currentEditors, [tab.id]: newEditor });

    newEditor.setValue(tab.content);
    requestAnimationFrame(() => newEditor.focus());
  }

  function handleCreateNewFile() {
    const id = crypto.randomUUID();
    const currentTabs = tabs();
    const newTab = { id, path: null, name: null, content: "" };
    setTabs({ ...currentTabs, [id]: newTab });
    setActiveTab(id);
  }

  async function handleOpenFile() {
    const data = await openFile();
    if (data) {
      const id = crypto.randomUUID();
      const currentTabs = tabs();
      setTabs({ ...currentTabs, [id]: { id, ...data } });
      setActiveTab(id);
    }
  }

  function handleSaveFile() {
    const data = tabs()?.[activeTab()];
    const editor = editors()?.[data?.id ?? ""];
    if (!data || !editor) return;

    const content = editor.getValue();
    saveFile(data.path, content);
    const currentTabs = tabs();
    currentTabs[data.id].content = content;
    setTabs({ ...currentTabs });
  }

  return (
    <>
      <div id="navbar">
        <Show when={activeTab()}>
          <p>{tabs()[activeTab()]?.path ?? "untitled"}</p>
        </Show>
      </div>
      <div id="app" data-editable={Boolean(tabsArray().length)}>
        <Show when={tabsArray().length}>
          <For each={tabsArray()}>
            {(tab) => (
              <div
                id="editor-container"
                ref={(el) => handleInitEditor(el, tab)}
              />
            )}
          </For>
        </Show>
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
