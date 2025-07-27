import { createSignal, onCleanup, onMount, Show, For } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { render } from "solid-js/web";
import Shader from "@/components/shader";
import { AnimatedVisualizer, Play, Pause, Eye } from "@/components/icons";
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
type ShaderState = "unmounted" | "playing" | "paused";

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
  onRequestPlayVisuals,
  onRequestPauseVisuals,
  removeAllListeners,
  warnBeforeClosing,
} = window.electronAPI;

function App() {
  const [tabs, setTabs] = createStore<TabGroup>({});
  const [editors, setEditors] = createStore<EditorGroup>({});
  const [playing, setPlaying] = createSignal(false);
  const [strudel, setStrudel] = createSignal<any | null>(null);
  const [activeId, setActiveId] = createSignal<string>("");
  const [playingId, setPlayingId] = createSignal<string>("");
  const [shaderState, setShaderState] = createSignal<ShaderState>("unmounted");
  const [error, setError] = createSignal<string | null>(null);
  const tabsArray = () => Object.values(tabs);

  onMount(async () => {
    const strudel = await prebake({ setError });
    setStrudel(strudel);
  });

  onRequestNewFile(handleCreateNewFile);

  onFileOpened((data) => {
    const id = crypto.randomUUID();
    setTabs({ ...tabs, [id]: { id, ...data } });
    setActiveId(id);
  });

  onRequestSave(handleSaveFile);

  onFileSaved((data) => {
    if (!data) return;
    const handleUpdateTabs = (tabs: TabGroup) => {
      const id = activeId();
      tabs[id].content = data.content;
      tabs[id].name = data.name;
      tabs[id].path = data.path;
    };
    setTabs(produce(handleUpdateTabs));
  });

  onRequestClose(() => handleClose());

  onCleanup(() => {
    removeAllListeners();
    Object.values(editors).forEach((ed) => ed.dispose());
  });

  onRequestPlay(handlePlay);

  onRequestPlayVisuals(() => toggleShaderState("playing"));
  onRequestPauseVisuals(() => toggleShaderState("paused"));

  onRequestPause(handlePause);

  function handleInitEditor(el: HTMLDivElement, tab: TabData) {
    const newEditor = initMonacoEditor(el);
    newEditor.setValue(tab.content);
    requestAnimationFrame(() => newEditor.focus());
    setEditors({ ...editors, [tab.id]: newEditor });
  }

  function handleCreateNewFile() {
    const id = crypto.randomUUID();
    const newTab = { id, path: null, name: null, content: "" };
    setTabs({ ...tabs, [id]: newTab });
    setActiveId(id);
  }

  async function handleOpenFile() {
    const data = await openFile();
    if (data) {
      const id = crypto.randomUUID();
      setTabs({ ...tabs, [id]: { id, ...data } });
      setActiveId(id);
    }
  }

  function handleSaveFile() {
    const data = tabs[activeId()];
    const editor = editors[data?.id ?? ""];
    if (!data || !editor) return;

    const content = editor.getValue();
    saveFile(data.path, content);
  }

  async function handleClose(_id?: string) {
    const id = _id ?? activeId();
    const tab = tabs[id];
    const editor = editors[id];
    if (!id || !tab || !editor) return;

    function destroy() {
      editor.dispose();
      setTabs(produce((draft) => delete draft[id]));
      setEditors(produce((draft) => delete draft[id]));
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
    const content = editors[activeId()]?.getValue();
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

      const selector =
        '.editor-container[data-active="true"] .monaco-mouse-cursor-text > .view-line > span';
      const textEls = document.querySelectorAll(selector);
      if (!textEls) return;
      textEls.forEach((el) =>
        // el.animate([{ background: "#0c0c66" }, { background: "transparent" }], {
        el.animate([{ background: "#0000FF" }, { background: "transparent" }], {
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

  function toggleShaderState(next?: ShaderState) {
    if (next) setShaderState(next);
    else setShaderState((c) => (c === "playing" ? "paused" : "playing"));
  }

  return (
    <>
      <Show when={shaderState() !== "unmounted"}>
        <Shader playState={shaderState} />
      </Show>
      <div id="navbar">
        <Show when={playingId()}>
          <p>Playing {tabs[playingId()]?.name ?? ""}</p>
        </Show>
      </div>
      <div id="tab-bar">
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
            <button class="media" onClick={handlePlay}>
              <Show when={playing()} fallback={<Play />}>
                <AnimatedVisualizer />
              </Show>
            </button>
            <button class="media" aria-label="pause" onClick={handlePause}>
              <Pause />
            </button>
            <button
              class="media"
              aria-label="visual"
              onClick={() => toggleShaderState()}
            >
              <Eye />
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
                class="editor-container"
                ref={(el) => handleInitEditor(el, tab)}
                data-active={activeId() === tab.id}
                inert={activeId() !== tab.id}
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
