// #region IMPORTS ~
// import U from "../scripts/utilities.js";
// import C, {K4Attribute} from "../scripts/constants.js";
// import K4Item, {K4ItemType, K4ItemSubType} from "./K4Item.js";
// import K4Actor, {K4ActorType} from "./K4Actor.js";
// import K4ChatMessage from "./K4ChatMessage.js";
import K4ActiveEffect from "./K4ActiveEffect.js";
// #endregion

// #REGION === TYPES, ENUMS, INTERFACE AUGMENTATION === ~
// #region -- ENUMS ~ // #endregion
// #region -- TYPES ~

declare global {

  namespace K4Scene {  }
}
// #endregion
// #region -- INTERFACE AUGMENTATION ~
// interface K4Scene {
//   get name(): string;
//   get id(): IDString;
//   get uuid(): UUIDString;
// }
// #endregion
// #ENDREGION

class K4Scene extends Scene {
  // #region INITIALIZATION ~
  /**
   * Pre-Initialization of the K4Scene class. This method should be run during the "init" hook.
   *
   * @returns {Promise<void>} A promise that resolves when the hook is registered.
   */
  static async PreInitialize(): Promise<void> {
    /* Insert PreInitiailize Steps Here */
  }
  // #endregion
  // #region Type Guards ~ #endregion

  // #region GETTERS & SETTERS ~
  // get effects(): EmbeddedCollection<K4ActiveEffect, K4Scene> {
  //   return new EmbeddedCollection<K4ActiveEffect, K4Scene>(this, "effects");
  // }

  // #endregion

  // #region === CONSTRUCTOR ===  #ENDREGION

  // #region PRIVATE METHODS ~= #endregion

  // #REGION === PUBLIC METHODS === // #ENDREGION
}


// #region EXPORTS ~
export default K4Scene;
// #endregion