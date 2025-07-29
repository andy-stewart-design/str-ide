interface HomeScreenProps {
  onCreateNewFile: () => void;
  onOpenFile: () => Promise<void>;
}

function HomeScreen({ onCreateNewFile, onOpenFile }: HomeScreenProps) {
  return (
    <div id="editor-fallback" style={{ "z-index": 1 }}>
      <button onclick={onCreateNewFile}>New file</button>
      <button onclick={onOpenFile}>Open file</button>
    </div>
  );
}

export default HomeScreen;
