import { repl, evalScope } from "@strudel/core";
import {
  getAudioContext,
  webaudioOutput,
  initAudioOnFirstClick,
  registerSynthSounds,
  registerZZFXSounds,
  samples,
  aliasBank,
  soundMap,
} from "@strudel/webaudio";
import * as SoundFonts from "@strudel/soundfonts";
import { transpiler } from "@strudel/transpiler";

async function prebake({ setError }) {
  initAudioOnFirstClick();

  evalScope(
    import("@strudel/core"),
    import("@strudel/mini"),
    import("@strudel/webaudio"),
    import("@strudel/tonal"),
    import("@strudel/midi")
  );

  // load samples
  const ds = "https://raw.githubusercontent.com/felixroos/dough-samples/main/";
  const ts = "https://raw.githubusercontent.com/todepond/samples/main/";
  await Promise.all([
    registerSynthSounds(),
    registerZZFXSounds(),
    SoundFonts.registerSoundfonts(),
    samples(`${ds}/tidal-drum-machines.json`),
    samples(`${ds}/piano.json`),
    samples(`${ds}/Dirt-Samples.json`),
    samples(`${ds}/EmuSP12.json`),
    samples(`${ds}/vcsl.json`),
    samples(`${ds}/mridangam.json`),
  ]);
  aliasBank(`${ts}/tidal-drum-machines-alias.json`);
  addSynthAliases();

  return repl({
    defaultOutput: webaudioOutput,
    getTime: () => getAudioContext().currentTime,
    transpiler,
    onEvalError: (refErr) => setError(refErr.message), // refErr: ReferenceError
    afterEval: () => setError(null),
    // onUpdateState: () => console.log("[STR-IDE] State updated!!!"),
    // setInterval: () => console.log("[STR-IDE] Setting interval!!!"),
  });
}

export { prebake };

function addSynthAliases() {
  const waveformAliases = [
    ["tri", "triangle"],
    ["sqr", "square"],
    ["saw", "sawtooth"],
    ["sin", "sine"],
  ];

  waveformAliases.forEach(([alias, actual]) =>
    soundMap.set({
      ...soundMap.get(),
      [alias]: soundMap.value[actual.toString()],
    })
  );
}
