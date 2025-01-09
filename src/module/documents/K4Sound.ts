// #region IMPORTS ~
import C from "../scripts/constants.js";
import U from "../scripts/utilities.js";
import {AlertPaths} from "../scripts/svgdata.js";
import K4Actor from "./K4Actor.js";
import {K4RollResult} from "./K4Roll.js";
import K4ActiveEffect from "./K4ActiveEffect.js";
// #endregion

// #REGION === TYPES, ENUMS, INTERFACE AUGMENTATION === ~
// #region -- ENUMS ~

// #endregion
// #region -- TYPES ~
namespace K4Sound {
}
// #endregion
// #endregion

// #region === K4Sound CLASS ===
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class K4Sound {
  static readonly Sounds: Partial<Record<string, HTMLAudioElement>> = {
    "slow-hit": new Audio("systems/kult4th/assets/sounds/Slow Hit 02.wav"),
    "subsonic-stinger": new Audio("systems/kult4th/assets/sounds/Sub Sonic Stinger 01.wav")
  };

  private static readonly loadedSounds: Set<string> = new Set<string>();

  static PreInitialize() {

    Object.assign(globalThis, {K4Sound});
    // Preload all sounds
    return Promise.all(
      Object.keys(this.Sounds)
        .map(this.preload.bind(this))
    );
  }

  static preload(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = this.Sounds[key];
      if (!audio) {
        console.error(`Sound ${key} not found`);
        reject(new Error(`Sound ${key} not found`));
        return;
      }
      audio.preload = "auto";
      audio.oncanplaythrough = () => {
        this.loadedSounds.add(key);
        resolve();
      };
      audio.onerror = () => { reject(new Error(`Failed to load sound ${key}`)); };
      audio.load();
    });
  }

  static play(key: string, options: { volume?: number; loop?: boolean } = {}): void {
    if (!this.loadedSounds.has(key)) {
      console.warn(`Sound ${key} is not preloaded. It may play with a delay.`);
    }
    const audio = this.Sounds[key];
    if (!audio) {
      console.error(`Sound ${key} not found`);
      return;
    }
    audio.volume = options.volume ?? 1;
    audio.loop = options.loop ?? false;

    // Play globally using Foundry's AudioHelper
    void AudioHelper.play({
      src: audio.src,
      volume: audio.volume,
      loop: audio.loop
    }, true);
  }

  static unload(key: string): void {
    const audio = this.Sounds[key];
    if (!audio) {
      console.error(`Sound ${key} not found`);
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
    this.loadedSounds.delete(key);
  }

  static unloadAll() {
    return Promise.all(
      Object.keys(this.Sounds)
        .map(this.unload.bind(this))
    );
  }
}
// #ENDREGION

// #region EXPORTS ~
export default K4Sound;
// #endregion
