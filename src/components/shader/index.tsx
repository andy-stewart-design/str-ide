import {
  Accessor,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import Shdr from "shdr";
import frag from "@/assets/default.frag?raw";

type ShaderState = "unmounted" | "playing" | "paused";

function Shader({ playState }: { playState: Accessor<ShaderState> }) {
  const [shader, setShader] = createSignal<Shdr | null>(null);
  const [loaded, setLoaded] = createSignal(false);
  const isVisible = () => loaded() && playState() === "playing";
  let container: HTMLDivElement | undefined;

  createEffect(() => {
    const shdr = shader();
    const isLoaded = loaded();
    if (!shdr || !isLoaded) return;

    if (playState() === "paused" && !shdr.paused) {
      shdr.pause();
    } else if (playState() === "playing" && shdr.paused) {
      shdr.play();
    }
  });

  onMount(() => {
    if (!container) return;
    const uniforms = { webcam: "webcam" };
    const shdr = new Shdr({ container, uniforms, frag, glVersion: 1 });
    shdr.onLoad = () => setLoaded(true);
    setShader(shdr);
  });

  onCleanup(() => shader()?.destroy());

  return <div id="vis-container" data-visible={isVisible()} ref={container} />;
}

export default Shader;
