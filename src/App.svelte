<script lang="ts">
  import type { FileData } from "@/types/file-data";
  import type { Editor } from "@/types/monaco";

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

  let tabs = $state<TabGroup>({});
  let activeId = $state("");

  onFileOpened((data) => {
    const id = crypto.randomUUID();
    tabs = { ...tabs, [id]: { id, ...data } };
    activeId = id;
  });
</script>

<div id="navbar"></div>
<div class="tabs"></div>

<style>
  .tabs {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
