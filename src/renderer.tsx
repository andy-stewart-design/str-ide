/* eslint-disable import/no-unresolved */
import { createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";
import * as monaco from "monaco-editor";
// @ts-expect-error: Need to figure out why this is erroring here but not in my other vite project
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import theme from "./theme";
import defaultBop from "./boots-and-cats";
import "./index.css";

const { versions, onUpdateCounter, openFile } = window.electronAPI;

function App() {
  const [count, setCount] = createSignal(0);
  let editorContainer: HTMLDivElement;

  onUpdateCounter((v: number) => {
    setCount(count() + v);
  });

  async function handleClick() {
    const { path } = await openFile();
    console.log({ path });
  }

  onMount(() => {
    self.MonacoEnvironment = {
      getWorker() {
        return new tsWorker();
      },
    };

    monaco.editor.defineTheme("NightOwl", theme);

    const editor = monaco.editor.create(editorContainer, {
      value: defaultBop,
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
  });

  return (
    <div id="app">
      {/* <h1>SolidJS Counter</h1>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
      <button onClick={handleClick}>Open file</button>
      <p>
        {`This app is using Chrome (v${versions.chrome}), Node.js (v${versions.node}), and Electron (v${versions.electron})`}
      </p> */}
      <div id="monaco-editor" ref={editorContainer} />
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
} else {
  console.error("[renderer.ts]: Could not find root element in index.html.");
}
