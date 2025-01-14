// #region IMPORTS ~
import LogRocket from 'logrocket';
import K4Config from "./scripts/config.js";
import K4Actor from "./documents/K4Actor.js";
import K4Item from "./documents/K4Item.js";
// import K4ItemSheet from "./documents/K4ItemSheet.js";
// import K4PCSheet from "./documents/K4PCSheet.js";
// import K4NPCSheet from "./documents/K4NPCSheet.js";
// import K4ActiveEffect from "./documents/K4ActiveEffect.js";
import C, {Colors, Archetypes} from "./scripts/constants.js";
import {K4ActorType, K4ItemType, K4Archetype} from "./scripts/enums";
import InitializePopovers from "./scripts/popovers.js";
import U from "./scripts/utilities.js";
import {formatForKult, registerHandlebarHelpers as RegisterHandlebarHelpers} from "./scripts/helpers.js";
import registerSettings from "./scripts/settings.js";
import registerConsoleLogger from "./scripts/logger";
// import K4Alert from "./documents/K4Alert.js";
// import K4Sound from "./documents/K4Sound.js";
// import K4Roll from "./documents/K4Roll.js";
// import K4Dialog from "./documents/K4Dialog.js";
// import K4Socket from "./documents/K4Socket.js";
// import K4DebugDisplay from "./documents/K4DebugDisplay.js";
// import K4CharGen from "./documents/K4CharGen.js";
// import K4GMTracker from "./documents/K4GMTracker.js";

// import InitializeLibraries, {gsap} from "./libraries.js";
// import K4ChatMessage from "./documents/K4ChatMessage.js";
// #endregion

// #region === CONSTANTS === ~
const InitializableClasses = {
  K4Actor,
  // K4PCSheet,
  // K4NPCSheet,

  K4Item,
  // K4ItemSheet,

  // K4ChatMessage,
  // K4ActiveEffect,
  // K4Roll,
  // K4Dialog,
  // K4Sound,
  // K4Alert,
  // K4DebugDisplay,
  // K4GMTracker,
  // K4CharGen,
  // K4Socket
 } as const;
// #endregion

// #region === TYPES === ~

// #endregion

Object.assign(globalThis, {
  getGame: function getGame(): Game {
    if (!(game instanceof Game)) {
      throw new Error("Game is not ready");
  }
    return game;
  },

  /**
   * Retrieves the collection of all K4Actor instances in the game.
   * @returns A Collection of K4Actor instances.
   * @throws Error if the Actors collection is not ready.
   */
  getActors: function getActors(): Actors {
    const actors = getGame().actors as Maybe<Actors>;
    if (!actors) {
      throw new Error("Actors collection is not ready");
    }
    return actors;
  },

  /**
   * Retrieves the collection of all K4Item instances in the game.
   * @returns A Collection of K4Item instances.
   * @throws Error if the Items collection is not ready.
   */
  getItems: function getItems(): Items {
    const items = getGame().items as Maybe<Items>;
    if (!items) {
      throw new Error("Items collection is not ready");
    }
    return items;
  },

  /**
   * Retrieves the collection of all K4ChatMessage instances in the game.
   * @returns A Collection of K4ChatMessage instances.
   * @throws Error if the Messages collection is not ready.
   */
  getMessages: function getMessages(): Messages {
    const messages = getGame().messages as Maybe<Messages>;
    if (!messages) {
      throw new Error("Messages collection is not ready");
    }
    return messages;
  },

  /**
   * Retrieves the collection of all User instances in the game.
   * @returns A Collection of User instances.
   * @throws Error if the Users collection is not ready.
   */
  getUsers: function getUsers(): Users {
    const users = getGame().users as Maybe<Users>;
    if (!users) {
      throw new Error("Users collection is not ready");
    }
    return users;
  },

  /**
   * Retrieves the client settings for the game.
   * @returns The client settings.
   * @throws Error if the settings are not ready.
   */
  getSettings: function getSettings(): ClientSettings {
    const settings = getGame().settings as Maybe<ClientSettings>;
    if (!settings) {
      throw new Error("Settings are not ready");
    }
    return settings;
  },

  /**
   * Retrieves the user for the game.
   * @returns The user.
   * @throws Error if the user is not ready.
   */
  getUser: function getUser(): User {
    const user = getGame().user;
    return user;
  },

  /**
   * Retrieves the user's PC for the game.
   * @returns The user's PC.
   * @throws Error if the user's PC is not ready.
   */
  getActor: function getActor(): K4Actor {
    const userID: IDString = getUser().id as IDString;
    const pcs = getActors().filter((actor: K4Actor) => actor.type === K4ActorType.pc);
    const userPC = pcs.find((pc) => pc.ownership[userID] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
    if (!userPC) {
      throw new Error(`User ${getUser().name} has no PC associated with them.`);
    }
    return userPC;
  },

  /**
   * Retrieves the localizer for the game.
   * @returns The localizer.
   * @throws Error if the localizer is not ready.
   */
  getLocalizer: function getLocalizer(): Localization {
    const loc = getGame().i18n as Maybe<Localization>;
    if (!loc) {
      throw new Error("I18n is not ready");
    }
    return loc;
  },

  /**
   * Retrieves the notifier for the game.
   * @returns The notifier.
   * @throws Error if the notifier is not ready.
   */
  getNotifier: function getNotifier(): Notifications {
    const notif = ui.notifications;
    if (!notif) {
      throw new Error("Notifications are not ready");
    }
    return notif;
  }
});

/* #DEVCODE */
const DEV_DEBUG_CONFIG = {
  isRunningDevCode: false, // true,
  isDebuggingHooks: true,
  isDisablingCompatibilityWarnings: true,
  isRunningCSSPerformanceMonitor: false,
  isDebuggingChargen: false,
  isDisablingCharGen: false
};
// #region === DEVELOPMENT CODE === ~
function GlobalAssignment() {
  Hooks.once("ready", () => {
    const ACTOR = getGame().actors.values().next().value as Maybe<K4Actor>;
    const ITEM = getGame().items.values().next().value as Maybe<K4Item>;
    const EMBED = ACTOR?.items.values().next().value as Maybe<K4Item>;
    const ACTORSHEET = ACTOR?.sheet;

    // eslint-disable-next-line @typescript-eslint/require-await
    void (async () => {

      // Dynamically import data.js for initializing and building Item documents during development (will become packs for production)
      // const {BUILD_ITEMS_FROM_DATA, PACKS} = await import("./scripts/data.js");

      const whichArchetypesHave = (traitName: string) => {
        return Object.values(Archetypes)
            .filter(({advantage, disadvantage, darksecret}) =>
                [...advantage, ...disadvantage, ...darksecret]
                    .map((tName) => tName.replace(/^!/,""))
                    .includes(traitName))
            .map(({label}) => label);
      }
      const isTraitUnique = (traitName: string, archetype: K4Archetype) => {
        const archetypesThatHaveTrait = whichArchetypesHave(traitName);
        return archetypesThatHaveTrait.length === 1;
      }
      const getArchetypeReport = () => {
        return Object.fromEntries([K4ItemType.advantage, K4ItemType.disadvantage, K4ItemType.darksecret].map((tType: K4ItemType) => [tType, Object.fromEntries((getGame().items as Collection<K4Item>).filter((item) => item.type === tType).map((item) => [item.name, whichArchetypesHave(item.name)]))]));
      }

      Object.assign(globalThis, {
        gsap,
        U,
        C,
        ActorSheet,
        formatForKult,
        ACTOR, ITEM, EMBED, ACTORSHEET,
        ENTITIES: [ACTOR, ITEM, EMBED],
        ...InitializableClasses,
        // PACKS,
        // getItemSystemReport,
        // getSubItemSystemReport,
        // getUniqueValuesForSystemKey,
        // getUniqueEffects: () => getUniqueValuesForSystemKey(PACKS.all, "rules.effects"),
        // findRepresentativeSubset,
        // checkSubsetCoverage,
        // findUniqueKeys,
        // BUILD_ITEMS_FROM_DATA,
        // whichArchetypesHave,
        // isTraitUnique,
        //getArchetypeReport
      });
    })();
  });


  Hooks.once("socketlib.ready", () => {
    Object.assign(globalThis, {
      socketlib,
    });
  });

}
function InitLogRocketCSSPerformanceMonitor() {
  if (!DEV_DEBUG_CONFIG.isRunningCSSPerformanceMonitor) { return; }
  LogRocket.init('vodsl0/kult4th-for-foundry-vtt');
  kLog.display("Initialized LogRocket CSS performance monitor", 0);
}
function InitCharGenToggleButton() {
  if (!DEV_DEBUG_CONFIG.isDebuggingChargen) { return; }
  // Create toggle button
  const toggleButton = document.createElement("button");
  toggleButton.textContent = "";
  toggleButton.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 19999;
    opacity: 0.3;
    transition: opacity 0.3s;
    width: 30px;
    height: 30px;
    font-size: 10px;
    background-color: var(--toggle-color, #333);
    color: white;
    border: none;
    border-radius: 50%;
    outline: 2px solid var(--toggle-color, #000);
    cursor: pointer;
  `;

  // Add hover effect
  toggleButton.addEventListener("mouseenter", () => toggleButton.style.opacity = "1");
  toggleButton.addEventListener("mouseleave", () => toggleButton.style.opacity = "0.3");

  // Add click listener to toggle config value
  toggleButton.addEventListener("click", () => {
    CONFIG.K4.debug.isDisablingCharGen = !CONFIG.K4.debug.isDisablingCharGen;
    toggleButton.style.setProperty("--toggle-color", CONFIG.K4.debug.isDisablingCharGen ? "red" : "#333");
  });

  // Append button to body
  document.body.appendChild(toggleButton);
}
function SetDevelopmentConfig() {
  if (!getUser().isGM) { return; }
  // Disable Compatibility Warnings
  if (DEV_DEBUG_CONFIG.isDisablingCompatibilityWarnings) {
    CONFIG.compatibility.mode = CONST.COMPATIBILITY_MODES.SILENT;
  }

  // Toggle Character Creation Features for Debugging

  CONFIG.K4.debug.isDisablingCharGen = DEV_DEBUG_CONFIG.isDisablingCharGen;

  // Hook debugging
  CONFIG.debug.hooks = DEV_DEBUG_CONFIG.isDebuggingHooks;
}
function RunDevelopmentInitCode() {

  Hooks.once("ready", SetDevelopmentConfig);

  // Initialize Character Creation Toggle Button
  InitCharGenToggleButton();

  // Enable LogRocket CSS Performance Monitoring
  InitLogRocketCSSPerformanceMonitor();

  // Setup ready hook to register variables to the global scope for debugging.
  GlobalAssignment();
}
if (DEV_DEBUG_CONFIG.isRunningDevCode) {
  RunDevelopmentInitCode();
}
// #endregion
/* !DEVCODE */


enum InitializerMethod {
  PreInitialize = "PreInitialize",
  Initialize = "Initialize",
  PostInitialize = "PostInitialize"
}

async function RunInitializer(methodName: InitializerMethod) {
  return Promise.all(
    Object.values(InitializableClasses).filter(
      (doc): doc is typeof doc & Record<InitializerMethod, () => Promise<void>> =>
        methodName in doc
    ).map((doc) => doc[methodName]())
  );
}

async function PreloadHBSTemplates() {
  const templatePaths = [
    ...U.getTemplatePath("sheets/gmtracker-phases", [
      "intro",
      "chargen",
      "preSession",
      "session",
      "postSession"
    ]),
    ...U.getTemplatePath("sheets/gmtracker-phases/parts", [
      "player-column"
    ]),
    ...U.getTemplatePath("gamephase", [
      "overlay-master",
      "overlay-intro",
      "overlay-chargen",
      "overlay-preSession",
      "overlay-session",
      "overlay-postSession"
    ]),
    ...U.getTemplatePath("gamephase/parts", [
      "chargen-trait-editor",
      "chargen-trait-notes-editor",
      "other-player-summary-block"
    ]),
    ...U.getTemplatePath("globals", [
      "svg-defs",
      "color-defs"
    ]),
    ...U.getTemplatePath("sheets", [
      "pc-sheet",
      "npc-sheet",
      "item-sheet",
      "item-sheet-locked",
      "gmtracker-sheet",
      "pc-initialization",
      "pc-initialization-archetype",
      "pc-initialization-archetype-trait-panels"
    ]),
    ...U.getTemplatePath("components", [
      "hover-strip",
      "item-list",
      "rules-block",
      "roll-result",
      "attribute-box",
      "pc-actor-name",
      "pc-nav-menu",
      "svg",
      "icon",
      "toggle-box",
      "edges-blade-container",
      "stability-shards-overlay",
      "collapsed-modifiers-strip",
      "modifier-toggleable",
      "modifier-untoggleable"
    ]),
    ...U.getTemplatePath("partials", [
      "item-block",
      "subitem-block",
      "player-block"
    ]),
    ...U.getTemplatePath("sidebar", [
      "chat-message",
      "result-attribute",
      "result-rolled",
      "result-static",
      "chat-input-control-panel"
    ]),
    ...U.getTemplatePath("dialog", [
      "ask-for-attribute",
      "ask-for-harm",
      "ask-for-text",
      "ask-for-buttons",
      "ask-for-confirm",
      "ask-for-item"
    ]),
    ...U.getTemplatePath("alerts", [
      "alert-simple",
      "alert-card"
    ])
  ];

  return loadTemplates(templatePaths);
}
async function GenerateColorDefs() {
  $(".vtt.game.system-kult4th").prepend(await renderTemplate(
    U.getTemplatePath("globals", "color-defs"),
    {
      colors: C.Colors,
      colorFilters: C.ColorFilters
    }
  ));
}
async function GenerateSVGDefs() {
  $(".vtt.game.system-kult4th").prepend(await renderTemplate(
    U.getTemplatePath("globals", "svg-defs"),
    Colors.Defs
  ));
}

/**
 * Sets up a MutationObserver to monitor the DOM for the appearance of the notifications container.
 * Once the container is found, it sets up mutation observers to watch for the specified notification texts,
 * and removes them from the DOM when found.
 *
 * @param {string[]} notificationTexts - Array of texts to identify target notifications
 * @returns {void}
 */
function MuteNotifications(notificationTexts: string[]) {

  // Create a MutationObserver to watch for the notifications container
  const notificationsObserver = new MutationObserver((mutations) => {

    mutations.forEach((mutation) => {

      mutation.addedNodes.forEach((node) => {
        // Check if the added node is the notifications container
        if (node.nodeType === Node.ELEMENT_NODE
            && node instanceof HTMLElement
            && node.id === 'notifications'
        ) {

          // Create a new MutationObserver instance for the notifications
          const observer = new MutationObserver((mutations) => {

            // For each mutation (change) in the observed element
            mutations.forEach((mutation) => {

              // Check each node that was added
              mutation.addedNodes.forEach((node) => {
                // Check if the added node is a target notification
                if (node.nodeType === Node.ELEMENT_NODE
                    && node instanceof HTMLElement
                    && node.classList.contains('notification')
                    && notificationTexts.some(text => node.textContent?.includes(text))
                ) {
                  // If it's a target notification, remove it from the DOM
                  node.remove();
                }
              });
            });

          });


          // Start observing the notifications container for changes to its direct children
          observer.observe(node, { childList: true });

          // Disconnect this observer since we no longer need to watch for the notifications container
          notificationsObserver.disconnect();
        }
      });
    });
  });

  // Start observing the document body for added nodes
  notificationsObserver.observe(document.body, { childList: true, subtree: true });
}

/**
 * Automatically disables the canvas for all connected clients during the "init" hook.
 * (Kult4th for Foundry does not use the Canvas, replacing it with the Stage.)
 *
 * @returns {Promise<void>}
 */
async function DisableClientCanvas() {
  // Wait until the "noCanvas" setting exists
  kLog.log("Disabling Canvas for this client.");
  while (!getGame().settings.settings.has("core.noCanvas")) {
    await U.sleep(100); // Wait for 100ms before checking again
  }

  if (!getGame().settings.get("core", "noCanvas")) {
    // Set the canvas-disabled setting to true for all connected clients
    await getGame().settings.set("core", "noCanvas", true);
  }
  kLog.log("Canvas has been disabled for all clients.");
}

Hooks.on("init", () => {

  // Register logging function and announce initialization to console.
  registerConsoleLogger();
  kLog.display("Initializing 'Kult: Divinity Lost 4th Edition' for Foundry VTT", 0);

  // Preload Handlebars Templates
  void PreloadHBSTemplates();

  // Register settings (including debug settings necessary for kLog)
  registerSettings();

  // Define the "K4" namespace within the CONFIG object, and assign basic system configuration package.
  // CONFIG.K4 = K4Config;

  // Initialize Libraries
  // InitializeLibraries();

  // Initialize Tooltips Overlay
  InitializePopovers($("body"));

  // Register Handlebar Helpers
  RegisterHandlebarHelpers();

  // Monitor notifications for canvas disabled and minimum screen size warnings
  MuteNotifications([
    "because the game Canvas is disabled.",
    "requires a minimum screen resolution"
  ]);

  // Unregister default sheets
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);

  // Asynchronous operations, run in parallel
  const parallelAsyncFunctions = [
    // Call 'PreInitialize' on all relevant classes
    RunInitializer(InitializerMethod.PreInitialize),
    // Generate CSS Color Definitions
    GenerateColorDefs(),
    // Generate CSS SVG Definitions
    GenerateSVGDefs()
  ];

  void Promise.all(parallelAsyncFunctions);
});

Hooks.on("ready", () => {

  void (async () => {
    // Call Initialize on all relevant classes
    await RunInitializer(InitializerMethod.Initialize);

    // Disable client canvas
    void DisableClientCanvas();

    // Initialize collection objects
    // getGame().rolls = new Collection<K4Roll>();

    // Call PostInitialize on all relevant classes
    await RunInitializer(InitializerMethod.PostInitialize);

    // // Get GM Tracker instance
    // const tracker = await K4GMTracker.Get();

    // // Actions for player (non-GM) users -- overlays
    // if (!getUser().isGM) {

    //   // Initialize appropriate overlay given tracker phase
    //   await tracker.preloadOverlay();
    //   await tracker.displayOverlay();

    //   // Further actions only trigger for GM users
    //   return;
    // }

    // // Render GM Tracker sheet for GM
    // tracker.render(true);
  })();
});


// #region ░░░░░░░[SocketLib]░░░░ SocketLib Initialization ░░░░░░░ ~
// Hooks.once("socketlib.ready", () => {
//   socketlib.registerSystem("kult4th");
//   Object.values(InitializableClasses).filter(
//     (doc): doc is typeof doc & {SocketFunctions: Record<string, SocketFunction>} =>
//       "SocketFunctions" in doc
//   ).forEach((doc) => {
//     K4Socket.RegisterSocketFunctions(doc.SocketFunctions);
//   });
// });
// #endregion ░░░░[SocketLib]░░░░
