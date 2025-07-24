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
  const [playing, setPlaying] = createSignal(false);
  const [strudel, setStrudel] = createSignal<any | null>(null);
  const [tabs, setTabs] = createSignal<TabGroup>({});
  const [activeId, setActiveId] = createSignal<string>("");
  const [playingId, setPlayingId] = createSignal<string>("");
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
    setActiveId(id);
  });

  onRequestSave(handleSaveFile);

  // TODO: Figure out if this is necessary
  onFileSaved((data) => {
    if (!data) return;
    const id = activeId();
    const currentTabs = tabs();
    currentTabs[id].content = data.content;
    currentTabs[id].name = data.name;
    currentTabs[id].path = data.path;
    setTabs({ ...currentTabs });
  });

  onRequestClose(() => handleClose());

  onCleanup(() => {
    removeAllListeners();
    Object.values(editors()).forEach((ed) => ed.dispose());
  });

  onRequestPlay(handlePlay);

  onRequestPause(handlePause);

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
    setActiveId(id);
  }

  async function handleOpenFile() {
    const data = await openFile();
    if (data) {
      const id = crypto.randomUUID();
      const currentTabs = tabs();
      setTabs({ ...currentTabs, [id]: { id, ...data } });
      setActiveId(id);
    }
  }

  function handleSaveFile() {
    const data = tabs()?.[activeId()];
    const editor = editors()?.[data?.id ?? ""];
    if (!data || !editor) return;

    const content = editor.getValue();
    saveFile(data.path, content);
  }

  async function handleClose(_id?: string) {
    const id = _id ?? activeId();
    const tab = tabs()[id];
    const editor = editors()[id];
    if (!id || !tab || !editor) return;

    function destroy() {
      const currentTabs = tabs();
      const currentEditors = editors();
      delete currentTabs[id];
      delete currentEditors[id];
      editor.dispose();
      setTabs({ ...currentTabs });
      setEditors({ ...currentEditors });
      if (tabsArray().length === 0) setActiveId("");
      else setActiveId(tabsArray()[0].id);
    }

    if (tab.content === editor.getValue()) {
      destroy();
    } else {
      const response = await warnBeforeClosing();
      if (response === "show_save_dialog") {
        handleSaveFile();
        requestAnimationFrame(() => destroy());
      } else if (response === "close_without_saving") {
        destroy();
      }
    }
  }

  async function handlePlay() {
    const content = editors()[activeId()]?.getValue();
    if (!content) return;
    if (playingId() && activeId() !== playingId()) {
      console.log("restarting");
      strudel()?.stop();
      await new Promise((r) => setTimeout(r, 100));
    }
    await strudel()?.evaluate(content);
    if (strudel().scheduler.started) {
      setPlaying(true);
      setPlayingId(activeId());

      const selector = ".monaco-mouse-cursor-text > .view-line > span";
      const textEls = document.querySelectorAll(selector);
      if (!textEls) return;
      textEls.forEach((el) =>
        el.animate([{ background: "#0c0c66" }, { background: "transparent" }], {
          duration: 200,
          easing: "steps(1, end)",
        })
      );
    }
  }

  function handlePause() {
    strudel()?.stop();
    setPlaying(false);
    setPlayingId("");
  }

  return (
    <>
      <div id="navbar">
        <Show when={playing()}>
          <p>Playing {tabs()?.[playingId()]?.name ?? ""}</p>
        </Show>
      </div>
      <div id="tab-bar" data-visible={!!tabsArray().length}>
        <Show when={tabsArray().length}>
          <div>
            {tabsArray().map((tab) => (
              <div class="tab">
                <button
                  class="primary-action"
                  onClick={() => setActiveId(tab.id)}
                  data-active={activeId() === tab.id}
                >
                  {tab.name ?? "new file"}
                </button>
                <button
                  class="secondary-action"
                  onClick={() => handleClose(tab.id)}
                  data-active={activeId() === tab.id}
                >
                  <svg viewBox="0 0 16 16" width={16} height={16}>
                    <path
                      d="M 4 4 L 12 12 M 4 12 L 12 4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width={1.5}
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div>
            <button
              class="media"
              aria-label={playing() ? "update" : "play"}
              onClick={handlePlay}
            >
              <svg width="16" height="16" viewBox="0 0 20 20">
                <path
                  data-icon="play"
                  d="M16.4806 9.13176C17.1524 9.51565 17.1524 10.4844 16.4806 10.8682L5.49614 17.1451C4.82948 17.526 4 17.0446 4 16.2768L4 3.72318C4 2.95536 4.82948 2.47399 5.49614 2.85494L16.4806 9.13176Z"
                  fill="currentColor"
                />
                <path
                  data-icon="update"
                  d="M19 10C19 14.9706 14.9706 19 10 19C7.17087 19 4.64922 17.6934 3 15.6543V19H1V13C1 12.7348 1.10543 12.4805 1.29297 12.293C1.48051 12.1054 1.73478 12 2 12H8V14H4.25586C5.52176 15.8143 7.62285 17 10 17C13.866 17 17 13.866 17 10H19ZM19 7C19 7.26522 18.8946 7.5195 18.707 7.70703C18.5195 7.89457 18.2652 8 18 8H12V6H15.7441C14.4782 4.1857 12.3772 3 10 3C6.13401 3 3 6.13401 3 10H1C1 5.02944 5.02944 1 10 1C12.8289 1 15.3508 2.30596 17 4.34473V1H19V7Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button class="media" aria-label="pause" onClick={handlePause}>
              <svg width="16" height="16" viewBox="0 0 20 20">
                <path
                  d="M7 2C7.55228 2 8 2.44772 8 3V17C8 17.5523 7.55228 18 7 18H5C4.44772 18 4 17.5523 4 17V3C4 2.44772 4.44772 2 5 2H7ZM15 2C15.5523 2 16 2.44772 16 3V17C16 17.5523 15.5523 18 15 18H13C12.4477 18 12 17.5523 12 17V3C12 2.44772 12.4477 2 13 2H15Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </Show>
      </div>
      <div id="app" data-editable={Boolean(tabsArray().length)}>
        <Show
          when={tabsArray().length}
          fallback={
            <EditorFallback
              onCreateNewFile={handleCreateNewFile}
              onOpenFile={handleOpenFile}
            />
          }
        >
          <For each={tabsArray()}>
            {(tab) => (
              <div
                id="editor-container"
                ref={(el) => handleInitEditor(el, tab)}
                data-active={activeId() === tab.id}
              />
            )}
          </For>
        </Show>
        <Show when={error()}>
          <button id="error-banner" onClick={() => setError(null)}>
            <p>{error()}</p>
            <svg viewBox="0 0 16 16" width={16} height={16}>
              <path
                d="M 4 4 L 12 12 M 4 12 L 12 4"
                fill="none"
                stroke="currentColor"
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

function EditorFallback({
  onCreateNewFile,
  onOpenFile,
}: {
  onCreateNewFile: () => void;
  onOpenFile: () => Promise<void>;
}) {
  return (
    <div id="editor-fallback" style={{ "z-index": 1 }}>
      <button onclick={onCreateNewFile}>New file</button>
      <button onclick={onOpenFile}>Open file</button>
    </div>
  );
}
