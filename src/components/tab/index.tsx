import type { Accessor } from "solid-js";
import type { FileData } from "@/types/file-data";

interface TabData extends FileData {
  id: string;
}

interface TabProps {
  tab: TabData;
  onClick: () => void;
  onClose: () => void;
  activeId: Accessor<string>;
}

function Tab({ tab, onClick, onClose, activeId }: TabProps) {
  return (
    <div class="tab">
      <button
        class="primary-action"
        onClick={onClick}
        data-active={activeId() === tab.id}
      >
        {tab.name ?? "new file"}
      </button>
      <button
        class="secondary-action"
        onClick={onClose}
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
  );
}

export default Tab;
