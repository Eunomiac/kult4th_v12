// #region IMPORTS ~
import C, {K4Attribute, K4ConditionType, K4WoundType} from "../scripts/constants.js";
import {K4ActorType, K4ItemType, K4ItemRange} from "../scripts/enums";
import U from "../scripts/utilities.js";
import {formatForKult} from "../scripts/helpers.js";
import K4Actor from "./K4Actor.js";
import K4Item from "./K4Item.js";
import K4Roll from "./K4Roll.js";
import K4Scene from "./K4Scene.js";
import K4ChatMessage from "./K4ChatMessage.js";
import K4Dialog, {PromptInputType} from "./K4Dialog.js";
import K4Alert, {AlertType} from "./K4Alert.js";
import {UserTargetRef} from "./K4Socket.js";
// #endregion

// #region -- TYPES, ENUMS & FLAG CONFIGURATION -- ~
// #region ENUMS ~

/** == EFFECT SOURCE ==
 * The category of entity, event or circumstance that empowers the Effect, that is ultimately responsible for removing it when it no longer applies.
 * An Effect's Source is usually, but not always, the entity that created the Effect.
 */
enum EffectSourceType {
  ownedItem = "ownedItem", // The Effect is applied by an item owned by the Actor. REMOVAL: the item is removed from the Actor.
  moveResult = "moveResult", // The Effect was applied by a move result, either triggered or rolled. REMOVAL: Must be specified (default = single-use, toggleable effect)
  claimedResult = "claimedResult", // The Effect was applied by clicking on an effect link in a move result chat card. REMOVAL: Must be specified (default = single-use, toggleable effect)
  scene = "scene", // The Effect was applied by a K4Scene document to all actors present. REMOVAL: when the Scene ends.
  actor = "actor", // The Effect is created by the Actor and applied directly when the Actor is created. REMOVAL: Never.
  gm = "gm" // The Effect is applied by the GM manually to selected actors via the GM Screen. REMOVAL: no automatic removal; manually controlled by the GM
}

/** == EFFECT DURATION ==
 * The duration of the Effect, which determines when it is automatically removed.
 */
enum EffectDuration {
  instant = "instant", // The Effect is instant, and is never actually created: instead of being created, its changes are permanently applied
  ongoing = "ongoing", // The Effect is ongoing and is not automatically removed by duration checks (its removal, if not permanent, must be handled elsewhere).
  limited = "limited", // The Effect has a limited number of uses (defined in the uses property) and is then removed.
                          // - "ongoing" effects can also have a uses property, but they are not removed when uses.value === uses.max (i.e. they can be "refilled")
  scene = "scene", // The Effect is applied for the duration of the active Scene and is removed when the Scene ends.
  session = "session", // The Effect is applied for the duration of the active Session and is removed when the Session ends.
}

/** == EFFECT RESET ON ==
 * For 'canToggle' effects, the conditions under which the effect is reset to its default state. *
 */
enum EffectResetOn {
  never = "never", // The effect is never reset to its default state, and will retain its toggle state indefinitely.
  onUse = "onUse", // The effect is reset to its default state whenever it is used (i.e. when it is applied to a roll or triggered result)
  onScene = "onScene", // The effect is reset to its default state whenever the active Scene changes
  onSession = "onSession", // The effect is reset to its default state whenever the active Session changes
  onSheetOpen = "onSheetOpen" // The effect is reset to its default state whenever the Actor's character sheet is opened
}

/** == USER REF ==
 * For 'ChatSelect' effects that allow users to select options, the users who should be able to interact with the list keys.
 */
enum UserRef {
  gm = "gm", // the gamemaster
  self = "self", // The actor-owner of the chat message
  other = "other", // All other actors
  any = "any", // Anyone
  gm_target = "gm_target", // One or more specifically-targeted PC actors, selected via dialog window presnted to the GM.
  self_target = "self_target", // One or more specifically-targeted PC actors, selected via dialog window presnted to the actor-owner of the chat message.
}


// #endregion
// #region TYPES ~
namespace K4Change {
  export type Source = EffectChangeData;

   namespace Modes {
    export type ModifyMove =
      "PushElement"|
      "AppendText";
    export type ModifyTracker =
      "Add"|
      "Subtract";
    export type ModifyAttack =
      "Add"|
      "Subtract"|
      "Set"
    export type ModifyProperty =
      "Add"|
      "Subtract"|
      "Set"|
      "Downgrade"|
      "PushElement";
    export type ModifyRoll =
      "Add"|
      "Subtract";
    export type ModifyChange =
      "Add"|
      "Subtract"|
      "Set";
  }

  export namespace Schema {

    interface Base {
      permanent?: boolean, // Whether the change's effects should apply once, permanently, and not be removed when the effect is removed.
      alerts?: Array<Partial<K4Alert.Data>> // Optional array of data objects defining alerts that will be fired when this change is appled.
                                            // Alerts with the same user-targets will be run sequentially.
    }

    export type Alert = Partial<K4Alert.Data> & {target: UserTargetRef};
    export interface CreateAttack extends Base {
      filter: ValueOrArray<string>, // Filter to determine the type(s) of weapons to add this attack to. Refer to TAGS on the weapon (e.g. "sword"), or use a hyphen to check a property (e.g. "range-arm"). Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      name: string, // Name of the attack
      tags: ValueOrArray<string> // Tags to apply to the attack
      range: ValueOrArray<K4ItemRange> // Range(s) of the attack.
      harm: number, // The harm value of the attack
      special?: string, // Any special rules associated with the attack
      ammo?: number, // Ammo usage of the attack
    }
    export interface CreateItem<T extends K4ItemType> extends Base, Omit<K4Item.Schema<T>, "type"> {
      type: T, // Type of item being created
      img: string, // Image to give item being created
      name: string, // Name of item being created
    }
    export interface DeleteItem extends Base {
      filter: ValueOrArray<string>, // Filter to determine the type(s) of items to delete. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
    }
    export interface CreateTracker extends Base {
      name: string, // Name of the tracker being created
      target: `FLAGS.${string}` // Where to store the tracker data on the active effect
      imgFolder: string, // Folder path to the images for the tracker. Must include one .webp folder for each possible value (including min and max), named "0.webp", "1.webp", etc.
      min: number, // Minimum value of the tracker
      max: number, // Maximum value of the tracker
      startValue: number, // Initial value of the tracker
    }
    export interface DeleteTracker extends Base {
      filter: ValueOrArray<string>, // Filter to determine the tracker(s) to delete. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
    }

    export interface CreateCondition extends Base {
      label: string, // The name of the condition, appearing on hover strips and as headers in tooltips.
      description: string, // A longer description of the condition -- the bodies of tooltips
      type: K4ConditionType, // The type of condition
      modDef: K4Roll.ModDefinition // An object literal of roll modifiers in the form Record<filter, number>
    }

    export interface DeleteCondition extends Base {
      filter: ValueOrArray<string>, // Filter to determine the type(s) of conditions to delete. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
    }
    export interface CreateWound extends Base {
      name: string,
      isCritical: boolean
    }
    export interface StabilizeWound extends Base {
      filter: ValueOrArray<string>, // Filter to determine the wound(s) to stabilize. Precede with a '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
    }
    export interface DeleteWound extends Base {
      filter: ValueOrArray<string>, // Filter to determine the wound(s) to stabilize. Precede with a '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
    }
    export interface ModifyTracker extends Base {
      filter: ValueOrArray<string>, // Filter to determine the tracker(s) to modify. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      target: string, // The property of the tracker data to modify (e.g. "value")
      mode: Modes.ModifyTracker, // The mode of modification to use
      value: SystemScalar, // The value to apply to the modification
    }
    export interface ModifyAttack extends Base {
      filter: ValueOrArray<string>, // Filter to determine the type(s) of attacks to modify. Refer to TAGS on the ATTACK (e.g. "sword"), or use a hyphen to check a property (e.g. "range-arm"). Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      target: string, // Dotkey target of property to modify (e.g. "harm")
      mode: Modes.ModifyAttack, // Mode of the custom function to use
      value: SystemScalar, // Value to apply to the modification
    }
    export interface ModifyMove extends Base {
      filter: ValueOrArray<string>, // Filter to determine the type(s) of attacks to modify. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      target: string, // Dotkey target of property to modify (e.g. "system.lists.questions.items")
      mode: Modes.ModifyMove, // Mode of the custom function to use
      value: SystemScalar, // Value to apply to the modification
    }
    export interface ModifyRoll extends Base {
      filter: ValueOrArray<string>, // Filter to determine the type(s) of rolls this change applies to. Can be "all", an item type, a specific item name, or the attribute rolled. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters).
      mode: Modes.ModifyRoll, // Mode of the custom function to use
      value: SystemScalar // Value to apply to the modification
      name?: string // If defined, will override merging display of all changes into the parent effect, isolating this change as its own displayed entity.
      tooltip?: string // Optional override to effect's tooltip when showing this change in a roll result report.

      // Optional properties for "prompt" values
      title?: string,
      bodyText?: string,
      subText?: string,
      input?: PromptInputType, // Type of input requested
      inputVals?: SystemScalar[], // Values for buttons or other input types
      default?: string, // Default value if prompt window closed; if undefined, item creation is cancelled
    }
    export interface ModifyProperty extends Base {
      filter: ValueOrArray<string>, // Filter to determine the type(s) of attacks to modify. Almost always "actor". Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      target: string, // Dotkey target of property to modify (e.g. "system.modifiers.wounds_critical.1.all")
      mode: Modes.ModifyProperty, // Mode of the custom function to use
      value: unknown, // Value to apply to the modification
    }
    export interface ModifyChange extends Base {
      filter: ValueOrArray<string>, // Filter identifying the ORIGIN ITEM bearing the ActiveEffect that contains the Change to be modified
      target: string, // Dotkey path ending with "effects", to the array containing the Change to be modified
      changeFilter: ValueOrArray<string>, // Filter identifying the Change to be modified within the targeted changeData array
      mode: Modes.ModifyChange, // Mode of the custom function to use on the Change
      changeTarget: string, // Dotkey path within the Change to the property to modify
      value: SystemScalar, // Value to apply to the modification
    }
    export interface PromptForData extends Base {
      filter: "player"|"gm", // To whom the prompt window is shown.
      title: string,
      bodyText: string,
      subText?: string,
      target: `FLAGS.${string}`, // where to store data on active effect
      input: PromptInputType, // Type of input requested
      inputVals?: SystemScalar[], // Values for buttons or other input types
      default?: string, // Default value if prompt window closed; if undefined, item creation is cancelled
    }
    export interface RequireItem extends Base {
      filter: ValueOrArray<string>, // Name of required item(s)
    }
    export interface ChatSelect extends Base {
      /* Effect must have this change as its first change. All subsequent changes will be mapped to the referenced list and represent the final applied effect once one of them is selected. */
      userSelect: UserRef[], // A list of users who should be able to interact with the list keys
      userTarget: UserRef[], // A list of users who should be the target of the selected effect
      listRef: string, // A keyword reference to the list on the creating item
    }

    export type AnySchema = Alert|CreateAttack|CreateItem<K4ItemType>|CreateTracker|DeleteTracker|CreateCondition|DeleteCondition|CreateWound|StabilizeWound|DeleteWound|ModifyTracker|ModifyAttack|ModifyMove|ModifyProperty|ModifyChange|PromptForData|RequireItem|ModifyRoll|ChatSelect;

    export type Any = Record<string, unknown> & AnySchema;
  }

  export namespace CustomFunc {
    export type Name = keyof typeof CUSTOM_FUNCTIONS;

    export type Data<N extends keyof typeof CUSTOM_FUNCTIONS, T extends K4ItemType = K4ItemType> =
      N extends "Alert" ? Schema.Alert :
      N extends "CreateAttack" ? Schema.CreateAttack :
      N extends "CreateItem" ? Schema.CreateItem<T> :
      N extends "CreateTracker" ? Schema.CreateTracker :
      N extends "DeleteTracker" ? Schema.DeleteTracker :
      N extends "CreateCondition" ? Schema.CreateCondition :
      N extends "DeleteCondition" ? Schema.DeleteCondition :
      N extends "CreateWound" ? Schema.CreateWound :
      N extends "StabilizeWound" ? Schema.StabilizeWound :
      N extends "DeleteWound" ? Schema.DeleteWound :
      N extends "ModifyTracker" ? Schema.ModifyTracker :
      N extends "ModifyAttack" ? Schema.ModifyAttack :
      N extends "ModifyMove" ? Schema.ModifyMove :
      N extends "ModifyProperty" ? Schema.ModifyProperty :
      N extends "ModifyChange" ? Schema.ModifyChange :
      N extends "PromptForData" ? Schema.PromptForData :
      N extends "RequireItem" ? Schema.RequireItem :
      N extends "ModifyRoll" ? Schema.ModifyRoll :
      N extends "ChatSelect" ? Schema.ChatSelect :
      never;

    export type AnyData = Schema.Any;
  }

  export type CustomFunc = (this: K4Change, actor: K4Actor|K4Roll, data: Schema.Any, isPermanent?: boolean) => Promise<boolean>;
}
namespace K4ActiveEffect {
  export type StatusBarCategory = keyof typeof DYNAMIC_CHANGES|K4ItemType;

  // export type Origin =
  //    K4Item<K4ItemType.move>
  //   |K4Item<K4ItemType.advantage>
  //   |K4Item<K4ItemType.disadvantage>
  //   |K4Item<K4ItemType.gear>
  //   |K4Item<K4ItemType.weapon>
  //   |K4Item<K4ItemType.gmtracker>
  //   |K4Actor
  //   |K4ChatMessage;
    // |K4Scene;

  // export type CustomFunctionActor = (
  //   this: K4Change,
  //   parent: K4Actor,
  //   data: K4Change.Schema.Any
  // ) => Promise<boolean>;

  // export type CustomFunctionRoll = (
  //   this: K4Change,
  //   parent: K4Roll,
  //   data: K4Change.Schema.ModifyRoll
  // ) => Promise<boolean>;

  // export type CustomFunction = CustomFunctionActor | CustomFunctionRoll;

  export interface BuildData {
    parentData: ParentData,
    changeData: foundry.abstract.Eff[]
  }
  export interface ChatSelectionData {
    listRef: string, // Must match a key in its parent item's system.lists
    listIndex: number, // The index in the lists array corresponding to the element this Effect is attached to
    userSelectors: UserRef[], // An array of User-types that can interact with and select this element
    userTargets: UserRef[] // An array of User-types that will have this effect transferred to them on selection
  }

  export interface ParentData {
    canToggle: boolean, // Whether the user can toggle this effect on/off
    inStatusBar: boolean, // Whether the effect should be displayed in the status bar (default = false UNLESS canToggle = true)
    uses: number, // Number of uses of the effect before it is disabled or requires refill (0 = infinite).
    canRefill: boolean, // Whether the effect's uses can be refilled or if it should be deleted when uses = max
    isUnique: boolean, // Whether the effect is unique (only one copy can be on any Actor at a time)
    duration: EffectDuration, // If/when the effect should be automatically removed ("ongoing" for never)
    defaultState: boolean, // Whether a toggleable effect is enabled by default
    resetOn: EffectResetOn, // When the effect should reset to its default state (or resetTo)
    resetTo: boolean, // Overrides the default state when the effect resets
    statusLabel: string; // The label to display on the status bar (default = "")
    tooltip: string; // The tooltip to display when hovering over the effect in the status bar OR in the chat card

    name?: string, // The principal name of the Effect. Appears in tooltips and in chat roll results. If undefined, effect takes the name of its origin item.
    dynamic?: keyof typeof DYNAMIC_CHANGES, // A list of dynamically-generated changes that should be refreshed each time the effect is applied. Possible values: "wounds", "stability", "stabilityConditions", "armor"
    statusCategory?: StatusBarCategory, // Optional override of automatically-determined category of the effect, used to group similar effects in the actor's character sheet
    icon?: string, // The icon to display on the status bar. If undefined, takes icon of origin item.
    from?: string, // Optional override for the default "#>text-keyword>{sourceName}<#" component (is prefixed with 'from')

    onChatSelection?: ChatSelectionData // If present, ActiveEffect is linked to an element in a list on its source document. When that document renders results (rolled or triggered) to chat, the Effect will attach a listener to its list element for the appropriate Users, should it appear. If that element is selected by a User, the effect will transfer to the target(s), deleting this property in the process and thus behaving in all ways like a normal Effect from then on.
  }


  export namespace Components {
    export namespace EffectSource {
      interface Base {
        type: EffectSourceType;
        docUUID: UUIDString;
      }

      interface DocSource extends Base {
        type: Exclude<EffectSourceType, EffectSourceType.moveResult|EffectSourceType.claimedResult>
      }
      interface ResultSource extends Base {
        type: EffectSourceType.moveResult;
        chatID: IDString;
      }
      interface ClaimedSource extends Base {
        type: EffectSourceType.claimedResult;
        chatID: IDString;
        index: number;
      }
      export type Ref = DocSource|ResultSource|ClaimedSource;
    }
    export namespace Effect {
      /**
       * Base interface for an Effect.
       */
      interface Base extends Omit<ParentData, "uses"|"from"> {
        name: string; // The principal name of the Effect. Appears in tooltips and in chat roll results.
        dynamic?: keyof typeof DYNAMIC_CHANGES, // A list of dynamically-generated changes that should be refreshed each time the effect is applied. Possible values: "wounds", "stability", "stabilityConditions"
        uses?: ValueMax; // Defines and tracks how many times the Effect can be used (i.e. to modify a roll or triggered static ability)
                         // - if undefined, the Effect is not limited-use
        effectSource: Components.EffectSource.Ref; // Identifies the category of entity, event or circumstance that empowers the Effect, and that is ultimately responsible for removing it when it no longer applies.
        fromText: string; // A reference to the source of the effect in FormatForKult form
      }

      export interface StatusBarData {
        canToggle: boolean, // Whether the effect can be toggled
        isEnabled: boolean, // Whether the effect is active and should be applied to rolls
        inStatusBar: true, // Whether the effect should be displayed in the status bar
        benefit?: "pos"|"neg"|"neutral"; // The benefit of the effect
        statusIcon: string; // The icon to display on the toggle modifier button.
        statusLabel: string; // The label to display next to the toggle button in the actor's character sheet (default = "")
        statusBarCategory: StatusBarCategory; // The category of the effect, used to group similar effects in the actor's character sheet
        statusTooltip?: string; // Optional override of 'tooltip' for the toggle button tooltip, if different from chat message tooltip
      }

      export interface ToggleData extends Omit<StatusBarData, "canToggle"> {
        canToggle: true;
        isLocked: boolean; // Whether the effect has been manually locked to its current state, ignoring 'resetOn'.
        defaultState: boolean; // Whether the effect is enabled by default when applied. (default = true)
        resetOn: EffectResetOn; // The conditions under which the effect is reset to its default state (default = "never")
        resetTo: boolean; // The state to which the effect is reset when resetOn conditions are met (default = defaultState)
      }

      /**
       * Interface for effects that can be toggled.
       */
      export interface CanToggle extends Omit<Base, "resetOn"|"resetTo">, ToggleData {
        canToggle: true;
        inStatusBar: true;
      }

      /**
       * Interface for effects that cannot be toggled but appear in the status bar.
       */
      export interface CannotToggle extends Base, StatusBarData {
        canToggle: false;
        inStatusBar: true;
      }

      /**
       * Interface for effects that don't appear in the status bar (and can't be toggled).
       */
      export interface NoStatusBar extends Base {
        canToggle: false;
        inStatusBar: false;
      }
    }
  }

  export type FlagData = Components.Effect.CanToggle|Components.Effect.CannotToggle|Components.Effect.NoStatusBar;

  // export type Data = ActiveEffectData & {
  //   flags: {
  //     kult4th: {
  //       data: FlagData
  //     }
  //   }
  // }

  namespace StatusContext {
    interface Base extends Components.Effect.StatusBarData {
      id: string; // The id of the effect
      benefit: "pos"|"neg"|"neutral"; // The benefit of the effect
      isLeftMod: boolean; // Whether this mod is singled out on the left side of the modifier strip
    }
    export interface CannotToggle extends Base {
      statusValue: string; // The value displayed next to the toggle button in the actor's character sheet (default = "")
      statusValueGlow: string; // The neon glow class to be applied to any value shown (default = "")
    }
    export type CanToggle = Components.Effect.ToggleData & CannotToggle;
  }

  export type StatusContext = StatusContext.CannotToggle | StatusContext.CanToggle;
}
// #endregion
// #endregion --

// #region === CUSTOM FUNCTIONS FOR MODE EffectMode.Custom ===

/**
 * Helper function to apply an update to a document.
 * If the update is permanent, it will be saved to the document.
 * Otherwise, it will be temporarily set using setProperty.
 *
 * @param {foundry.abstract.Document.Any} doc - The document to update.
 * @param {Key} key - The key of the property to update.
 * @param {unknown} value - The value to set for the property.
 * @param {boolean} isPermanent - Whether the update is permanent.
 * @returns {Promise<void>} - A promise that resolves when the update is complete.
 */
async function applyUpdate(doc: K4Actor|K4Item, key: Key, value: unknown, isPermanent: boolean): Promise<void> {
  // Log the update details for debugging purposes
  kLog.log(`Updating document with key: ${String(key)}, value: ${String(value)}, isPermanent: ${String(isPermanent)}`, { doc, key, value, isPermanent });

  // If the update is permanent, use the document's update method to save the change
  if (isPermanent) {
    await doc.update({[key]: value});
  } else {
    // Otherwise, use setProperty to temporarily set the value
    foundry.utils.setProperty(doc, String(key), value);
  }
}

/**
 * Recursively iterates through all values in the provided data object.
 * Whenever a string is found, it replaces it with the return value of `formatForKult`.
 *
 * @param {Record<string, unknown>} data - The data object to parse.
 * @param {K4Actor} actor - The actor to use for formatting strings.
 * @returns {Promise<void>} - A promise that resolves when the parsing is complete.
 */
async function parseData<T extends K4Change.Schema.AnySchema>(data: T, actor: K4Actor): Promise<T> {
  /**
   * Helper function to recursively parse a schema object against an actor document, resolving all %insert.actor...% calls and passing all strings through formatForKult().
   *
   * @param {unknown} value - The current value to parse.
   * @returns {Promise<unknown>} - A promise that resolves to the parsed value.
   */
  async function recursiveParse(value: unknown): Promise<unknown> {
    if (typeof value === "string") {
      // If the value is a string, format it using formatForKult
      return formatForKult(value, actor);
    } else if (Array.isArray(value)) {
      // If the value is an array, recursively parse each element
      return Promise.all(value.map(recursiveParse));
    } else if (value && typeof value === "object") {
      // If the value is an object, recursively parse each property
      const entries = await Promise.all(
        Object.entries(value).map(async ([key, val]) => [key, await recursiveParse(val)])
      );
      return Object.fromEntries(entries) as unknown;
    }
    // If the value is neither a string, array, nor object, return it as is
    return value;
  }

  // Start the recursive parsing with the provided data object
  return recursiveParse(data) as Promise<T>;
}


const CUSTOM_FUNCTIONS = {
  async Alert(this: K4Change, actor: K4Actor, data: K4Change.Schema.Alert): Promise<boolean> {
    data = await parseData(data, actor);
    await Promise.all(K4Alert.Alert(data));
    return Promise.resolve(true);
  },
  async CreateAttack(this: K4Change, actor: K4Actor, data: K4Change.Schema.CreateAttack): Promise<boolean> {
    const {
      filter, // Filter to determine the type(s) of weapons to add this attack to. Refer to TAGS on the weapon (e.g. "sword"), or use a hyphen to check a property (e.g. "range-arm"). Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      name, // Name of the attack
      tags, // Tags to apply to the attack
      range, // Range(s) of the attack.
      harm, // The harm value of the attack
      special, // Any special rules associated with the attack
      ammo, // Ammo usage of the attack
    } = await parseData(data, actor);
    return Promise.resolve(true);
  },
  async CreateItem(this: K4Change, actor: K4Actor, data: K4Change.Schema.CreateItem<K4ItemType>): Promise<boolean> {
    const {
      type, // Type of item being created
      img, // Image to give item being created
      name, // Name of item being created
      ...itemData // Item creation data
    } = await parseData(data, actor);

    // Check if the item already exists
    const existingItem = actor.items.getName(name);
    if (existingItem) {
      return true;
    }

    const newItem = (await actor.createEmbeddedDocuments("Item", [{
      name,
      img,
      type,
      system: itemData
    }]))?.pop() as Maybe<K4Item>;

    if (!newItem?.id) {
      return false;
    }

    // Log the id of the item to FLAGS.itemToRemove, so it can be deleted later
    await this.parentEffect?.flagSet<IDString>("itemToRemove", newItem.id);

    return true;
  },
  async DeleteItem(this: K4Change, actor: K4Actor, data: K4Change.Schema.DeleteItem): Promise<void> {

    const {
      filter // Filter to determine the type(s) of items to delete. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
    } = await parseData(data, actor);

    const filters = [data.filter].flat();
    const idsToDelete: IDString[] = [];
    for (const filter of filters) {
      idsToDelete.push(
        ...actor.getItemsByFilter(filter)
          .map((item) => item.id)
      )
    }
    if (idsToDelete.length === 0) {
      return;
    }
    await actor.deleteEmbeddedDocuments("Item", idsToDelete);
    return;
  },
  async CreateTracker(this: K4Change, actor: K4Actor, data: K4Change.Schema.CreateTracker): Promise<boolean> {
    // Log a custom id to FLAGS.trackerId

    const {
      name, // Name of the tracker being created
      target, // Where to store the tracker data on the active effect
      imgFolder, // Folder path to the images for the tracker. Must include one .webp folder for each possible value (including min and max), named "0.webp", "1.webp", etc.
      min, // Minimum value of the tracker
      max, // Maximum value of the tracker
      startValue // Initial value of the tracker
    } = await parseData(data, actor);

    return Promise.resolve(true);
  },
  async DeleteTracker(this: K4Change, actor: K4Actor, data: K4Change.Schema.DeleteTracker): Promise<boolean> {

    const {
      filter // Filter to determine the tracker(s) to delete. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
    } = await parseData(data, actor);

    return Promise.resolve(true);
  },
  async CreateCondition(this: K4Change, actor: K4Actor, data: K4Change.Schema.CreateCondition): Promise<boolean> {
    data = await parseData(data, actor);
    await actor.addCondition(data);
    return Promise.resolve(true);
  },
  async DeleteCondition(this: K4Change, actor: K4Actor, data: K4Change.Schema.DeleteCondition): Promise<boolean> {
    data = await parseData(data, actor);
    return Promise.resolve(true);
  },
  async CreateWound(this: K4Change, actor: K4Actor, data: K4Change.Schema.CreateWound): Promise<boolean> {
    const {name, isCritical} = await parseData(data, actor);
    await actor.addWound(
      isCritical ? K4WoundType.critical : K4WoundType.serious,
      name
    )
    return Promise.resolve(true);
  },
  async StabilizeWound(this: K4Change, actor: K4Actor, data: K4Change.Schema.StabilizeWound): Promise<boolean> {
    data = await parseData(data, actor);
    return Promise.resolve(true);
  },
  async DeleteWound(this: K4Change, actor: K4Actor, data: K4Change.Schema.DeleteWound): Promise<boolean> {
    data = await parseData(data, actor);
    return Promise.resolve(true);
  },
  async ModifyTracker(this: K4Change, actor: K4Actor, data: K4Change.Schema.ModifyTracker): Promise<boolean> {

    const {
      filter, // Filter to determine the tracker(s) to modify. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      target, // The property of the tracker data to modify (e.g. "value")
      mode, // The mode of modification to use
      value // The value to apply to the modification
    } = await parseData(data, actor);


    return Promise.resolve(true);
  },
  async ModifyAttack(this: K4Change, actor: K4Actor, data: K4Change.Schema.ModifyAttack): Promise<boolean> {

    const {
      filter, // Filter to determine the type(s) of attacks to modify. Refer to TAGS on the ATTACK (e.g. "sword"), or use a hyphen to check a property (e.g. "range-arm"). Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      target, // Dotkey target of property to modify (e.g. "harm")
      mode, // Mode of the custom function to use
      value // Value to apply to the modification
    } = await parseData(data, actor);


    return Promise.resolve(true);
  },
  async ModifyMove(this: K4Change, actor: K4Actor, data: K4Change.Schema.ModifyMove): Promise<boolean> {
    if (!(actor.is(K4ActorType.pc))) {
      throw new Error(`Invalid actor for ModifyMove: ${String(actor)}`);
    }

    const {
      permanent,
      filter, // Filter to determine the type(s) of attacks to modify. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      target, // Dotkey target of property to modify (e.g. "system.lists.questions.items")
      mode, // Mode of the custom function to use
      value // Value to apply to the modification
    } = await parseData(data, actor);

    if (!filter) {
      throw new Error(`Invalid data for ModifyMove: ${JSON.stringify(data)}`);
    }
    [filter].flat(1).forEach((f) => {
      actor.getItemsByFilter(K4ItemType.move, f)
        .forEach((move): void => {
          switch (mode) {
            case "PushElement": {
              if (!target) {
                throw new Error(`No target provided for PushElement: ${JSON.stringify(data)}`);
              }
              const targetArray = U.getProp<SystemScalar[]>(move, target);
              if (!Array.isArray(targetArray)) {
                throw new Error(`Invalid target array for PushElement: '${target}'`);
              }
              if (U.isUndefined(value)) { return undefined; }
              targetArray.push([
                value,
                this.parentEffect!.eData.fromText
              ].join("&nbsp;"));
              void applyUpdate(move, target, targetArray, permanent ?? false);
              break;
            }
            case "AppendText": {
              if (!target) {
                throw new Error(`No target provided for AppendText: ${JSON.stringify(data)}`);
              }
              const targetString = U.getProp<string>(move, target);
              if (typeof targetString !== "string") {
                throw new Error(`Invalid target for AppendText: '${target}'`);
              }
              void applyUpdate(move, target, [
                targetString,
                String(value),
                this.parentEffect!.eData.fromText
              ].join("&nbsp;"), permanent ?? false);
              break;
            }
          }
        });
    });
    return true;
  },
  async ModifyProperty(this: K4Change, actor: K4Actor, data: K4Change.Schema.ModifyProperty): Promise<boolean> {
    if (!(actor.is(K4ActorType.pc))) {
      throw new Error(`Invalid actor for ModifyProperty: ${String(actor)}`);
    }

    let {
      permanent, // Whether change should be permanently applied
      filter, // Filter to determine the type(s) of attacks to modify. Almost always "actor". Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters)
      target, // Dotkey target of property to modify (e.g. "system.modifiers.wounds_critical.1.all")
      mode, // Mode of the custom function to use
      value // Value to apply to the modification
    } = await parseData(data, actor);

    if (!filter || !target) {
      throw new Error(`Invalid data for ModifyProperty: ${JSON.stringify(data)}`);
    }
    if (filter === "actor") {
      let curVal: unknown = U.getProp<unknown>(actor, target);
      switch (mode) {
        case "Subtract":
        case "Add": {
          value = U.castToScalar(value);
          curVal = U.castToScalar(curVal);
          if (typeof value !== "number" || typeof curVal !== "number") {
            throw new Error(`Invalid values for ModifyProperty 'Add': current = '${curVal as SystemScalar}', value = '${value as SystemScalar}'`);
          }
          if (mode === "Subtract") {
            value = curVal - value;
          } else {
            value = curVal + value;
          }
          break;
        }
        case "Set": break;
        case "Downgrade": {
          value = U.castToScalar(value);
          curVal = U.castToScalar(curVal);
          if (typeof value === "string") {
            throw new Error(`Invalid string value for Downgrade: '${value}'`);
          } else if (typeof value === "boolean") {
            value = Boolean(curVal) && value;
          } else if (typeof curVal === "number" && typeof value === "number" && value > curVal) {
            return true;
          }
          break;
        }
        case "PushElement": {
          if (Array.isArray(curVal)) {
            value = [
              ...curVal.map(U.castToScalar),
              U.castToScalar(value)
            ];
            break;
          }
          throw new Error(`Target of 'PushElement' operation must be an array, but '${target}' is a '${typeof curVal}'.`)
        }
      }
      await applyUpdate(actor, target, value, permanent ?? false);
      return true;
    }
    if (filter === "gmtracker") {
      kLog.log("ModifyPropert filter 'gmtracker' not implemented. Data: ", {actor, data});
      return true;
    }
    throw new Error(`Unrecognized filter for ModifyProperty: ${String(filter)}`);
  },
  async ModifyChange(this: K4Change, actor: K4Actor, data: K4Change.Schema.ModifyChange): Promise<boolean> {
    if (!(actor.is(K4ActorType.pc))) {
      throw new Error(`Invalid actor for ModifyChange: ${String(actor)}`);
    }

    let {
      filter, // Filter identifying the ORIGIN ITEM bearing the ActiveEffect that contains the Change to be modified
      target, // Dotkey path ending with "effects", to the array containing the Change to be modified
      changeFilter, // Filter identifying the Change to be modified within the targeted changeData array
      mode, // Mode of the custom function to use on the Change
      changeTarget, // Dotkey path within the Change to the property to modify
      value // Value to apply to the modification
    } = await parseData(data, actor);

    value = U.castToScalar(String(value));
    if (!filter || !target) {
      throw new Error(`Invalid data for ModifyChange: ${JSON.stringify(data)}`);
    }

    return true;
  },
  async PromptForData(this: K4Change, actor: K4Actor, data: K4Change.Schema.PromptForData): Promise<boolean> {
    if (!(actor.is(K4ActorType.pc))) {
      throw new Error(`Invalid actor for ModifyMove: ${String(actor)}`);
    }

    const {
      filter, // Either 'player' or 'gm'
      title,
      bodyText,
      subText,
      target, // where to store data on active effect
      input, // Type of input requested
      inputVals, // Values for buttons or other input types
      default: defaultVal, // Default value if prompt window closed; if undefined, item creation is cancelled
    } = await parseData(data, actor);

    if (typeof target !== "string") {
      throw new Error(`No key provided for PromptForData: ${JSON.stringify(data)}`);
    }
    if (typeof title !== "string") {
      throw new Error(`No title provided for PromptForData: ${JSON.stringify(data)}`);
    }
    if (typeof input !== "string") {
      throw new Error(`No input type provided for PromptForData: ${JSON.stringify(data)}`);
    }

    const user = filter === "gm"
      ? getUsers().find((user: User) => user.isGM)
      : actor.user;
    if (!user) {
      throw new Error(`[Prompt for Data] Unable to resolve user from filter '${filter}'.`)
    }



    const userInput = await K4Dialog.GetUserInput(
      {
        user,
        title,
        bodyText,
        subText
      },
      {
        input: input as PromptInputType.buttons,
        inputVals: inputVals!,
        defaultVal: defaultVal as SystemScalar
      }
    );
    if (userInput === false) { return false; }
    if (target.startsWith("FLAGS")) {
      const flagKey = target.split(".").slice(2).join(".");
      await this.parentEffect!.flagSet(flagKey, userInput);
      return true;
    }
    throw new Error(`Unrecognized key for PromptForData: ${target}`);
  },
  async RequireItem(this: K4Change, actor: K4Actor, data: K4Change.Schema.RequireItem): Promise<boolean> {
    if (!(actor.is(K4ActorType.pc))) {
      throw new Error(`Invalid actor for ModifyMove: ${String(actor)}`);
    }
    const {
      filter // Name of required item(s)
    } = await parseData(data, actor);
    if (typeof filter !== "string") {
      throw new Error(`No filter provided for RequireItem: ${JSON.stringify(data)}`);
    }
    const items = actor.getItemsByFilter(filter);
    if (items.length === 0) {
      // The required item is not found. Alert the user, and return false.
      await Promise.all(K4Alert.Alert({
        type: AlertType.simple,
        target: UserTargetRef.self,
        skipQueue: false,
        header: `Missing Prerequisite: '${filter}'`,
        displayDuration: 5,
        body: `You currently lack #>text-keyword>${filter}<#, which is a prerequisite for gaining #>text-keyword>${this.name}<#`
      }));
      return false;
    }
    return true;
  },
  async ModifyRoll(this: K4Change, roll: K4Roll, data: K4Change.Schema.ModifyRoll): Promise<boolean> {
    if (!this.isInstantiated()) {
      throw new Error("Custom function ModifyRoll called without a valid K4Change instance.");
    }
    if (!(roll instanceof K4Roll)) {
      throw new Error(`Invalid roll for ModifyRoll: ${String(roll)}`);
    }

    let {
      filter, // Filter to determine the type(s) of rolls this change applies to. Can be "all", an item type, a specific item name, or the attribute rolled. Precede with an '!' to negate the filter. ALL filters must apply (create a new change for "or" filters).
      mode, // Mode of the custom function to use
      value, // Value to apply to the modification
      name, // Optional override to effect's label when showing this change in a roll result report.
      tooltip, // Optional override to effect's tooltip when showing this change in a roll result report.

      /* Parameters for value === "prompt" roll modifiers */
      title, // Title for the prompt
      bodyText, // Body text for the prompt
      subText, // Sub text for the prompt
      input, // Type of input requested
      inputVals, // Values for buttons or other input types
      default: defaultVal, // Default value if prompt window closed; if undefined, item creation is cancelled
    } = await parseData(data, roll.actor);

    const filters = [filter].flat();

    if (!filters.some((f) => roll.doesFilterApply(f))) {
      return true;
    }

    if (typeof value === "string") {
      if (value === "prompt") {
        const {user} = roll.actor;
        if (!user) {
          throw new Error(`Rolling Actor '${roll.actor.name}' has no user!`);
        }
        let userOutput: SystemScalar | false = false;
        if (U.isDefined(defaultVal)) {
          userOutput = await K4Dialog.GetUserInput(
            {
              user,
              title: title!,
              bodyText: bodyText!,
              subText
            },
            {
              input: input as PromptInputType.buttons,
              inputVals: inputVals!,
              defaultVal: defaultVal as SystemScalar
            }
          );
        } else {
          userOutput = await K4Dialog.GetUserInput(
            {
              title: title!,
              bodyText: bodyText!,
              subText
            },
            {
              input: input as PromptInputType.buttons,
              inputVals: inputVals!
            }
          );
        }
        if (userOutput === false) {
          return false; // User cancelled dialog; return false to cancel roll.
        }
        value = userOutput;
      } else if (value.startsWith("actor")) {
        const {actor} = roll;
        value = U.castToScalar(getProperty(actor, value.slice(6)));
      }
    }
    switch (mode) {
      case "Subtract":
        if (typeof value !== "number") {
          throw new Error(`Invalid value for ModifyRoll 'Subtract': ${value}`);
        }
        value = -1 * value;
        // falls through
      case "Add": {
        if (typeof value !== "number") {
          throw new Error(`Invalid value for ModifyRoll 'Add': ${value}`);
        }
        roll.modifiers.push({
          id:           this.id,
          filter:       this.filter,
          name:         name ?? this.customFunctionData.name as Maybe<string> ?? this.parentEffect.eData.name,
          tooltip:      tooltip ?? this.tooltip,
          value,
          cssClasses:   [
            value >= 0 ? "k4-theme-gold" : "k4-theme-red"
          ]
        });
        break;
      }
    }
    return true;
  }
} as const;
// #endregion

// #region === DYNAMIC CHANGE GENERATION ===
type DynamicChangeGenerator = (effect: K4ActiveEffect) => K4Change[];
const DYNAMIC_CHANGES = {
  armor: (effect: K4ActiveEffect) => {
    if (!effect.isOwnedByActor(K4ActorType.pc)) { return []; }
    // if (!effect.actor) { return []; }
    if (effect.actor.system.armor === 0) { return []; }
    return [
      new K4Change(
        K4ActiveEffect.BuildChangeData("ModifyRoll", {
          filter: "Endure Injury",
          mode: "Add",
          value: effect.actor.system.armor
        }), effect
      )
    ];
  },
  wounds: (effect: K4ActiveEffect) => {
    if (!effect.isOwnedByActor(K4ActorType.pc)) { return []; }
    return effect.actor.woundModData
      .map((woundData) => {
        if (woundData.value === 0) {
          return undefined;
        }
        return new K4Change(
          K4ActiveEffect.BuildChangeData("ModifyRoll", {
              filter: woundData.filter,
              mode: "Add",
              value: woundData.value
            }), effect
        );
      })
      .filter(Boolean) as K4Change[];
  },
  stability: (effect: K4ActiveEffect) => {
    if (!effect.isOwnedByActor(K4ActorType.pc)) { return []; }
    return effect.actor.stabilityModData.map((stabilityData) => {
      if (stabilityData.value === 0) {
        return undefined;
      }
      return new K4Change(
        K4ActiveEffect.BuildChangeData("ModifyRoll", {
            filter: stabilityData.filter,
            mode: "Add",
            value: stabilityData.value
          }), effect
        );
      })
      .filter(Boolean) as K4Change[];
  },
  stabilityConditions: (effect: K4ActiveEffect) => {
    if (!effect.isOwnedByActor(K4ActorType.pc)) { return []; }
    return effect.actor.stabilityConditionModData
      .map((stabilityConditionData) => {
        if (stabilityConditionData.value === 0) {
          return undefined;
        }
        return new K4Change(
          K4ActiveEffect.BuildChangeData("ModifyRoll", {
            filter: stabilityConditionData.filter,
            mode: "Add",
            value: stabilityConditionData.value,
            name: stabilityConditionData.name,
            tooltip: stabilityConditionData.tooltip
          }), effect
        );
      })
      .filter(Boolean) as K4Change[];
  }
} as const;
// #endregion

// #region === K4CHANGE CLASS ===
/**
 * A utility class wrapper around the changes array of a K4ActiveEffect, providing methods for
 * compiling, filtering, and applying changes to a parent K4Actor.
 */
class K4Change implements EffectChangeData {
  // #region STATIC METHODS ~

  // #endregion

  // #region Effect Change Data Properties ~
  key: string;
  value: string;
  mode: number;
  priority: number | null | undefined;
  // #endregion

  // #region GETTERS & SETTERS ~
  isInstantiated(): this is typeof this & {id: string, parentEffect: K4ActiveEffect} {
    return Boolean(this.parentEffect);
  }
  get id(): Maybe<string> {
    if (!this.isInstantiated()) { return undefined; }
    return `${this.parentEffect.id}_${this.index}`;
  }
  isOwnedByActor(): this is typeof this & {actor: K4Actor, parentEffect: K4ActiveEffect & {actor: K4Actor}} {
    return this.parentEffect?.actor !== undefined;
  }
  get index(): number {
    if (!this.isInstantiated()) { return -1; }
    return this.parentEffect.changes.findIndex((change) => change.value === this.value);
  }
  get isEnabled(): boolean {
    if (!this.isInstantiated()) { return false; }
    return this.parentEffect.isEnabled;
  }
  get actor(): Maybe<K4Actor> {
    if (!this.isOwnedByActor()) { return undefined; }
    return this.parentEffect.actor;
  }
  get originItem(): Maybe<K4Item> {
    if (!this.isInstantiated()) { return undefined; }
    return this.parentEffect.originItem;
  }
  get isPromptOnCreate(): boolean {
    return ["PromptForData"].includes(this.customFunctionName);
  }
  get isPromptOnRoll(): boolean {
    return this.isRollModifier() && this.customFunctionData.value === "prompt";
  }
  get isRequireItemCheck(): boolean {
    return ["RequireItem"].includes(this.customFunctionName);
  }
  get isPermanentChange(): boolean {
    return this.isAlert || this.customFunctionData.permanent === true;
  }
  get isAlert(): boolean {
    return this.customFunctionName === "Alert";
  }
  get isSystemModifier(): boolean {
    return !this.isPromptOnCreate
      && !this.isRequireItemCheck
      && !this.isPermanentChange
      && !this.isAlert
      && !this.isRollModifier();
  }
  isRollModifier(): this is this & {modData: K4Roll.ModData} {
    return this.customFunctionName === "ModifyRoll";
  }
  get filter(): K4Attribute|K4ItemType|string {
    return this.customFunctionData.filter as Maybe<string> ?? "all";
  }
  get name(): string {
    if (["wounds", "stability"].includes(String(this.customFunctionData.value))) {
      return U.tCase(this.customFunctionData.value);
    }
    if (typeof this.customFunctionData.name === "string") {
      return this.customFunctionData.name;
    }
    return this.originItem?.name ?? "";
  }
  get tooltip(): string {
    let tooltipText: string = this.customFunctionData.tooltip as Maybe<string>
      ?? this.customFunctionData.tooltip as Maybe<string>
      ?? this.parentEffect?.eData.tooltip
      ?? "";
    if (!tooltipText.includes('<p>')) {
      tooltipText = [
        `<h2>${this.customFunctionData.name as Maybe<string> ?? this.parentEffect?.eData.name ?? this.name}</h2>`,
        `<p>${tooltipText}</p>`
      ].join("");
    }
    return tooltipText;
  }
  _promptedValue?: SystemScalar;
  get finalValue(): Maybe<SystemScalar> {
    const {value} = this.customFunctionData;
    if (value === "prompt") {
      return this._promptedValue;
    }
    if (!this.isOwnedByActor()) {
      if (!U.isSystemScalar(value)) { return undefined; }
      return value;
    }
    if (typeof value === "string" && value.startsWith("actor.")) {
      return U.getProp<SystemScalar>(this.actor, value.slice(6));
    }
    return U.castToScalar(value);
  }
  get modData(): K4Roll.ModData {
    if (!this.isInstantiated()) {
      throw new Error(`Invalid K4Change instance for modData: ${String(this)}`);
    }
    if (typeof this.finalValue !== "number") {
      throw new Error(`Invalid finalValue for K4Change '${this.finalValue}' (should it be in the status bar?)`);
    }
    return {
      id:           this.id,
      filter:       this.filter,
      name:        this.customFunctionData.name as Maybe<string> ?? this.name,
      tooltip:      this.tooltip,
      value:        this.finalValue,
      cssClasses:   [
        this.finalValue >= 0 ? "k4-theme-gold" : "k4-theme-red"
      ]
    };
  }
  isCollapsible() {
    return this.isRollModifier() && typeof this.finalValue === "number" && this.customFunctionData.inStatusBar !== false;
  }  // #endregion

  // #region CONSTRUCTOR
  customFunctionName: keyof typeof CUSTOM_FUNCTIONS;
  customFunction: K4Change.CustomFunc;
  #customFunctionData: K4Change.CustomFunc.AnyData;

  get customFunctionData(): K4Change.CustomFunc.AnyData {
    if (this.parentEffect?.originItem) {
      // For each value that is a string, run it through formatForKult, using the embedded origin item as context.
      for (const [key, val] of Object.entries(this.#customFunctionData)) {
        if (typeof val === "string") {
          this.#customFunctionData[key] = formatForKult(val, this.parentEffect.originItem);
        }
      }
    }
    return this.#customFunctionData;
  }

  parentEffect?: K4ActiveEffect;
  constructor(data: EffectChangeData, effect?: K4ActiveEffect) {
    const {key, mode, value} = data;
    if (mode !== CONST.ACTIVE_EFFECT_MODES.CUSTOM) {
      throw new Error(`[new K4Change] Attempted K4Change construction for non-custom effect: ${JSON.stringify(data)}`);
    }
    if (!(key in CUSTOM_FUNCTIONS)) {
      throw new Error(`[new K4Change] Unrecognized custom function key: ${key}`);
    }
    this.key = key;
    this.value = value;
    this.parentEffect = effect;
    this.mode = mode;
    this.customFunctionName = key as KeyOf<typeof CUSTOM_FUNCTIONS>;
    this.customFunction = CUSTOM_FUNCTIONS[this.customFunctionName].bind(this) as K4Change.CustomFunc;

    this.#customFunctionData = this.#parseCustomFunctionData(value);
  }
  // #endregion

  #parseCustomFunctionData(value: string): K4Change.CustomFunc.AnyData {
    const {parentEffect} = this;
    if (!parentEffect) {
      throw new Error(`[K4Change.#parseCustomFunctionData] No valid parentEffect found for '${this.customFunctionName}' K4Change`);
    }
    value = value.replace(/FLAGS(?!\.[\w-]{16}\.)/g, `FLAGS.${parentEffect.id}`);
    return JSON.parse(value) as K4Change.CustomFunc.AnyData;
  }

  async apply(parent: K4Actor): Promise<string|boolean>
  async apply(parent: K4Roll): Promise<boolean>
  async apply(parent: K4Actor|K4Roll): Promise<string|boolean> {
    const {parentEffect} = this;
    if (!parentEffect) {
      throw new Error(`[K4Change.apply] No valid parentEffect found for '${this.customFunctionName}' K4Change`);
    }
    if (parent.is(K4ActorType.pc)) {
      return this.customFunction(parent, this.customFunctionData, this.isPermanentChange);
    }
    return this.customFunction(parent, this.customFunctionData);
  }
}
// #endregion

// #region === K4ACTIVEEFFECT CLASS ===
/**
 * The active effect itself can be applied using Foundry's standard logic, resulting in changes
 * arrays that contain mode:0 custom functions where key is the function name, and value is the
 * function string.
 *
 * Effects defined in the system.rules schema of an item are created as embedded
 * effects on the item, and set to be transferrable to any owning actor.
 *
 * Effects defined in the system.results schema of an item are instead created as embedded effects
 * directly on the actor when the associated result is triggered.
 *
 * Changes are generally parsed and applied during the owning actor's prepareData() method, ensuring
 * all changes do not make permanent changes to the actor's data, simplifying the process of removal.
 * This includes changes made to other items owned by the actor. Changes that apply modifiers to dice
 * rolls determine whether they should be displayed in the status bar of the actor's sheet and/or whether
 * the actor can toggle them on and off at this step. When the actor makes a roll, these changes are
 * iterated through and applied during the roll process.
 */
class K4ActiveEffect extends ActiveEffect {

  static ResolveEffectSource(origin: K4ActiveEffect.Origin, chatSelectIndex?: number): K4ActiveEffect.FlagData["effectSource"] {

    /** K4ActiveEffect.Origin:
     *
     *  K4Item<K4ItemType.move>
     *  K4Item<K4ItemType.advantage>
     *  K4Item<K4ItemType.disadvantage>
     *  K4Item<K4ItemType.gear>
     *  K4Item<K4ItemType.weapon>
     *  K4Item<K4ItemType.gmtracker>
     *
     *  K4Actor<K4ActorType.pc>
     *
     *  K4Scene
     *
     *  K4ChatMessage;
     */

    /**
     *   ownedItem = "ownedItem", // The Effect is applied by an item owned by the Actor. REMOVAL: the item is removed from the Actor.
          moveResult = "moveResult", // The Effect was applied by a move result, either triggered or rolled. REMOVAL: Must be specified (default = single-use, toggleable effect)
          claimedResult = "claimedResult", // The Effect was applied by clicking on an effect link in a move result chat card. REMOVAL: Must be specified (default = single-use, toggleable effect)
          scene = "scene", // The Effect was applied by a K4Scene document to all actors present. REMOVAL: when the Scene ends.
          actor = "actor", // The Effect is created by the Actor and applied directly when the Actor is created. REMOVAL: Never.
          gm = "gm" // The Effect is applied by the GM manually to selected actors via the GM Screen. REMOVAL: no automatic removal; manually controlled by the GM
     */

    if (origin instanceof K4Item) {
      if (origin.is(K4ItemType.gmtracker)) {
        // GM Tracker effect applied by GM
        return {
          type: EffectSourceType.gm,
          docUUID: origin.uuid
        };
      }
      if (origin.is(
        K4ItemType.move,
        K4ItemType.advantage,
        K4ItemType.disadvantage,
        K4ItemType.gear,
        K4ItemType.weapon
      )) {
        // Origin is an item that will transfer its effects to an owning actor.
        return {
          type: EffectSourceType.ownedItem,
          docUUID: origin.uuid
        };
      }
    }

    if ("is" in origin && origin.is(K4ActorType.pc)) {
      // ActiveEffect is being created directly on an Actor
      return {
        type: EffectSourceType.actor,
        docUUID: origin.uuid
      };
    }

    if (origin instanceof K4ChatMessage) {
      if (!origin.isResult) {
        throw new Error(`Chat message ${origin.id} is not a Result and cannot create an ActiveEffect.`);
      }
      // ActiveEffect is being applied by the result of a rolled or triggered move
      const docUUID = origin.sourceItem?.uuid;
      if (!docUUID) {
        throw new Error(`Unable to derive sourceItem from chat message '${origin.id}'`);
      }
      if (U.isNumber(chatSelectIndex)) {
        // ActiveEffect is being applied by the selection of a list element in a chat result
        return {
          type: EffectSourceType.claimedResult,
          docUUID,
          chatID: origin.id,
          index: chatSelectIndex
        };
      }
      // Otherwise, effect is being applied automatically
      return {
        type: EffectSourceType.moveResult,
        docUUID,
        chatID: origin.id
      };
    }

    // if (origin instanceof K4Scene) {
    //   // ActiveEFfect is being applied by a K4Scene to actors present in that scene.
    //   return {
    //     type: EffectSourceType.scene,
    //     docUUID: origin.uuid
    //   };
    // }

    throw new Error(`Invalid origin type for ActiveEffect: ${String(origin)}`);
  }

  static ResolveEffectLabel(parentData: K4ActiveEffect.BuildData["parentData"], origin: K4ActiveEffect.Origin, explicitOnly?: false): string
  static ResolveEffectLabel(parentData: K4ActiveEffect.BuildData["parentData"], origin: K4ActiveEffect.Origin, explicitOnly: true): Maybe<string>
  static ResolveEffectLabel(parentData: K4ActiveEffect.BuildData["parentData"], origin: K4ActiveEffect.Origin, explicitOnly = false): Maybe<string> {
    let effectName: Maybe<string> = parentData.name;
    if (effectName ?? explicitOnly) { return effectName; }

    if (
         origin instanceof K4Item
      || origin instanceof K4Scene
      || ("is" in origin && origin.is(K4ActorType.pc))
    ) {
      effectName = origin.name;
    }
    if (origin instanceof K4ChatMessage) {
      return origin.sourceItem?.name;
    }
    return effectName;
  }

  /**
   * Parses the parent data of an ActiveEffect to generate its extended data.
   *
   * This method takes the parent data of an ActiveEffect and the origin of the effect as input.
   * It processes the parent data to determine the effect's source, label, uses, and other properties.
   * The method returns an object of type `K4ActiveEffect.ExtendedData`, which represents the extended data of the ActiveEffect.
   *
   * The method first extracts the effect source from the origin using the `#resolveEffectSource` method.
   * It then determines the effect's label using the `#resolveEffectName` method.
   * The method also processes the `uses` property of the parent data to determine the effect's usage limits.
   * Additionally, it constructs a string indicating the source of the effect using the `from` property of the parent data.
   *
   * If the effect is meant to be displayed in the status bar, the method sets up the necessary properties for its display.
   * This includes determining the status bar category, toggle state, and other display properties.
   *
   * The method returns an object of type `K4ActiveEffect.ExtendedData`, which includes all the processed properties.
   *
   * @param {K4ActiveEffect.BuildData["parentData"]} parentData - The parent data of the ActiveEffect.
   * @param {K4ActiveEffect.Origin} origin - The origin of the ActiveEffect.
   * @returns {K4ActiveEffect.FlagData} The extended data of the ActiveEffect.
   */
  static ParseParentData(parentData: K4ActiveEffect.BuildData["parentData"], origin: K4ActiveEffect.Origin): K4ActiveEffect.FlagData {
    const {uses: usageMax, from, dynamic, onChatSelection, ...baseExtData} = parentData;
    const effectSource = this.ResolveEffectSource(origin, onChatSelection?.listIndex);
    const name = this.ResolveEffectLabel(parentData, origin);
    let uses: Maybe<ValueMax> = undefined;
    if (U.isDefined(usageMax) && usageMax > 0) {
      uses = {
        min: 0,
        max: usageMax,
        value: 0
      };
    }

    const fromText: string = origin instanceof K4ChatMessage
      ? ""
      : [
          "(from ",
          from ?? `%insert.docLink.${origin.name}%`,
          ")"
        ].join("");
    if (parentData.inStatusBar) {
      let statusBarCategory: K4ActiveEffect.StatusBarCategory;
      if (parentData.statusCategory) {
        statusBarCategory = parentData.statusCategory;
      } else if (dynamic) {
        statusBarCategory = dynamic;
      } else if (origin instanceof K4Item) {
        statusBarCategory = origin.type;
      } else {
        statusBarCategory = K4ItemType.move;
      }

      if (parentData.canToggle) {

        return {
          ...baseExtData,
          dynamic,
          canToggle: true,
          inStatusBar: true,
          isLocked: false,
          isEnabled: parentData.defaultState,
          statusBarCategory,
          statusIcon: parentData.icon ?? `systems/${C.SYSTEM_ID}/assets/icons/modifiers/default-neutral.svg`,
          statusLabel: parentData.statusLabel,
          statusTooltip: parentData.tooltip,
          name,
          uses,
          effectSource,
          fromText
        };
      } else {
        return {
          ...baseExtData,
          dynamic,
          canToggle: false,
          inStatusBar: true,
          isEnabled: true,
          statusBarCategory,
          statusIcon: parentData.icon ?? `systems/${C.SYSTEM_ID}/assets/icons/modifiers/default-neutral.svg`,
          name,
          uses,
          effectSource,
          fromText
        };
      }
    } else {
      return {
        ...baseExtData,
        dynamic,
        canToggle: false,
        inStatusBar: false,
        name,
        uses,
        effectSource,
        fromText
      };
    }
  }

  /**
   * Converts a set ('effectDataSet') of BuildData objects into an array of K4ActiveEffects, when
   * given an Origin-type document ('origin') and an optional target PC or GMTracker target ('target')
   * to enable dynamic parsing of each generic BuildData object against the dynamic origin and target documents.
   *
   * Each BuildData object is parsed via K4ActiveEffect.#parseEffectData(data: BuildData, origin: Origin)
   *
   * If the effectDataSet is an array, it will create an array of K4ActiveEffect instances.
   * If the effectDataSet is a single object, it will create a single K4ActiveEffect instance.
   * If the origin is a K4ChatMessage, it will create the effect for the actor of the chat message.
   * If the effect is unique, it will delete any existing effect with the same name.
   * The effect will be created with the provided effectDataSet, origin, and target.
   * If the effect is linked to an element in a list on its source document, it will attach a listener to its list element for the appropriate Users.
   * If that element is selected by a User, the effect will transfer to the target(s), deleting this property in the process and thus behaving in all ways like a normal Effect from then on.
   * The created effects will be returned as an array.
   *
   * @param {ValueOrArray<K4ActiveEffect.BuildData>} effectDataSet - The data to build the effects from.
   * @param {K4ActiveEffect.Origin} origin - The origin of the effects.
   * @param {K4Actor<K4ActorType.pc>|K4Item<K4ItemType.gmtracker>} [target] - The target of the effects. If not provided, the origin will be used as the target.
   * @returns {Promise<K4ActiveEffect[]>} - A promise that resolves with an array of the created K4ActiveEffect instances.
   */
  static async CreateFromBuildData(
    effectDataSet: ValueOrArray<K4ActiveEffect.BuildData>,
    origin: K4ActiveEffect.Origin,
    target?: K4Actor<K4ActorType.pc>|K4Item<K4ItemType.gmtracker>
  ): Promise<K4ActiveEffect[]> {
    if (Array.isArray(effectDataSet)) {
      const effects = await Promise.all(effectDataSet.map((data) => this.CreateFromBuildData(data, origin, target)));
      return effects.flat();
    }

    // kLog.log(reportName, "Initial Parameters", {effectDataSet, origin, target});

    const effectExtendedData = this.ParseParentData(effectDataSet.parentData, origin);
    // kLog.log(reportName, "After #parseEffectData", {effectExtendedData});

    let effectHost = target ?? origin;
    if (effectHost instanceof K4ChatMessage) {
      effectHost = effectHost.actor as K4Actor<K4ActorType.pc>;
    }

    // If the effect is unique, delete any existing effect with the same name
    if (effectExtendedData.isUnique) {
      const existingEffect = effectHost.effects
        .find((effect) => effect.name === effectExtendedData.name);
      if (existingEffect) {
        await existingEffect.delete();
      }
    }

    const effect = (await effectHost.createEmbeddedDocuments("ActiveEffect", [{
      origin:   origin.uuid,
      name:    effectExtendedData.name,
      transfer: origin.uuid !== target?.uuid,
      disabled: false,
      changes:  effectDataSet.changeData,
      flags: {
        kult4th: {
          data: effectExtendedData
        }
      }
    }]))?.pop() as Maybe<K4ActiveEffect>;

    if (!effect) { return []; }

    kLog.log("[CreateFromBuildData]", {effectUUID: effect.uuid, changes: U.objClone(effect.changes)});

    return [effect];
  }


  static DoesFilterApplyToMove(filter: string, move: K4Item<K4ItemType.move>): boolean {
    if (filter === "all") { return true; }
    if (filter === move.parentType as string) { return true; }
    if (filter === move.name) { return true; }
    if (filter === move.parentName) { return true; }
    return false;
  }

  /**
   * Type guard to check if the effect can be toggled.
   * @returns {boolean} - True if the effect can be toggled, false otherwise.
   */
  canToggle(): this is { eData: {canToggle: true} } {
    return this.eData.canToggle;
  }
  inStatusBar(): this is { eData: {inStatusBar: true} } {
    return this.eData.inStatusBar;
  }

  get defaultState(): boolean { return this.canToggle() ? this.eData.defaultState : true; }
  get isLocked(): boolean { return this.canToggle() ? this.eData.isLocked : false; }
  set isLocked(value: boolean) { void this.flagSet<boolean>("data.isLocked", value);}
  get isEnabled(): boolean { return this.canToggle() ? this.eData.isEnabled : true; }
  get isNonZero(): boolean {
    return this.getCustomChanges()
      .some((change) => change.finalValue !== 0);
  }
  get resetOn(): EffectResetOn { return this.canToggle() ? this.eData.resetOn : EffectResetOn.never; }
  get resetTo(): boolean { return this.canToggle() ? this.eData.resetTo : this.defaultState; }
  get statusBarCategory(): K4ActiveEffect.StatusBarCategory {
    if (this.eData.dynamic) { return this.eData.dynamic; }
    if (this.originItem instanceof K4Item) {
      return this.originItem.type;
    }
    return K4ItemType.move;
  }
  get statusIcon(): string {
    if (!this.isOwnedByActor()) { return ""; }
    if (!this.inStatusBar()) { return ""; }
    if (this.eData.icon) { return this.eData.icon; }
    if (this.eData.statusIcon) { return this.eData.statusIcon; }
    return this.originItem?.img ?? `systems/${C.SYSTEM_ID}/assets/icons/modifiers/default-${this.benefit}.svg`;
  }
  get statusLabel(): string { return this.inStatusBar() ? this.eData.statusLabel : ""; }
  get statusTooltip(): string { return this.inStatusBar() ? (this.eData.statusTooltip ?? this.eData.tooltip) : ""; }
  get effectDuration(): EffectDuration { return this.eData.duration; }
  get isUnique(): boolean { return this.eData.isUnique; }
  get uses(): Maybe<ValueMax> { return this.eData.uses; }
  get canRefill(): Maybe<boolean> { return this.eData.canRefill; }
  get effectSource(): K4ActiveEffect.Components.EffectSource.Ref { return this.eData.effectSource; }
  get fromText(): string { return this.eData.fromText; }
  get benefit(): "pos"|"neg"|"neutral" {
    const numPosChanges = this.getCustomChanges()
      .filter((change) => typeof change.finalValue === "number" && change.finalValue > 0).length;
    const numNegChanges = this.getCustomChanges()
      .filter((change) => typeof change.finalValue === "number" && change.finalValue < 0).length;
    if (numPosChanges && numNegChanges) { return "neutral"; }
    if (numPosChanges) { return "pos"; }
    if (numNegChanges) { return "neg"; }
    return "neutral";
  }
  get value(): Maybe<number> {
    if (!this.inStatusBar()) { return undefined; }
    const valueChanges = this.getCustomChanges()
      .filter((change): change is K4Change & {finalValue: number} => typeof change.finalValue === "number");
    if (valueChanges.length === 1) {
      return valueChanges[0].finalValue;
    }
    return undefined;
  }
  get statusValue(): string {
    if (U.isUndefined(this.value)) { return ""; }
    if (!U.isNumber(this.value)) { return ""; }

    return U.signNum(this.value, "", "+");
  }
  get statusValueGlow(): string {
    if (!this.inStatusBar()) { return ""; }
    if (U.isUndefined(this.value)) { return "neon-glow-soft-gold"; }
    if (this.value > 0) { return "neon-glow-soft-blue"; }
    if (this.value < 0) { return "neon-glow-soft-red"; }
    return "neon-glow-soft-gold";
  }
  get statusBarContext(): Maybe<K4ActiveEffect.StatusContext> {
    if (!this.isInstantiated()) { return undefined; }
    if (!this.inStatusBar()) { return undefined; }
    if (!this.isOwnedByActor()) { return undefined; }
    if (this.canToggle()) {
      return {
        id:              this.id,
        canToggle:       true,
        inStatusBar:     true,
        isEnabled:       this.isEnabled,
        defaultState:    this.defaultState,
        resetOn:         this.resetOn,
        resetTo:         this.resetTo,
        isLocked:        this.isLocked,
        benefit:         this.benefit,
        statusIcon:      this.statusIcon,
        statusBarCategory:  this.statusBarCategory,
        isLeftMod: ["stability", "wounds", "stabilityConditions", "armor"].includes(this.statusBarCategory),
        statusLabel:     this.statusLabel,
        statusTooltip:   this.statusTooltip,
        statusValue:     this.statusValue,
        statusValueGlow: this.statusValueGlow
      };
    }
    return {
      id:              this.id,
      canToggle:       false,
      inStatusBar:     true,
      isEnabled:       this.isEnabled,
      benefit:         this.benefit,
      statusIcon:      this.statusIcon,
      statusBarCategory:  this.statusBarCategory,
      isLeftMod: ["stability", "wounds", "stabilityConditions", "armor"].includes(this.statusBarCategory),
      statusLabel:     this.statusLabel,
      statusTooltip:   this.statusTooltip,
      statusValue:     this.statusValue,
      statusValueGlow: this.statusValueGlow
    };
  }

  getApplicableRollModifiers(roll: K4Roll): K4Change[] {
    return this.getCustomChanges()
      .filter((change) => change.isRollModifier()
        && roll.doesFilterApply(change.filter));
  }
  doesEffectApply(roll: K4Roll): boolean {
    return this.isEnabled && this.getApplicableRollModifiers(roll).length > 0;
  }
  // #region INITIALIZATION ~
  static PreInitialize() {
    CONFIG.ActiveEffect.documentClass = K4ActiveEffect;
    // DocumentSheetConfig.unregisterSheet(ActiveEffect, "core", ActiveEffectConfig);
    // DocumentSheetConfig.registerSheet(ActiveEffect, "kult4th", K4ActiveEffectSheet, {makeDefault: true});

    Hooks.on("createActiveEffect", async (effect: K4ActiveEffect) => {
      if (!getUser().isGM) { return; }
      kLog.display(`[on CreateActiveEffect] ${effect.name}`, {
        effect,
        origin:             effect.origin,
        ownedByActor:       effect.isOwnedByActor(),
        hasItemOrigin:      effect.hasItemOrigin(),
        originDoc:          effect.origin ? fromUuidSync(effect.origin) : null,
        isItemOwned:        effect.hasItemOrigin() ? effect.originItem.isOwnedItem() : false,
        requireItemChanges: effect.requireItemChanges,
        permanentChanges:   effect.permanentChanges
      });

      // If this effect is not embedded in an actor, do nothing
      if (!effect.isOwnedByActor()) { return true; }

      // If the effect has no custom changes, do nothing.
      if (!effect.getCustomChanges().length) { return true; }

      const originItem = fromUuidSync(effect.origin) as Maybe<K4Item>;

      /* === PROCESS CUSTOM CHANGES - Apply & Filter Changes by Custom Function Needs === */
      let k4Changes: K4Change[] = [...effect.getCustomChanges()];
      let onceChanges: K4Change[] = [];
      kLog.log("Changes Step 0", {k4Changes: [...k4Changes], onceChanges: [...onceChanges]});
      /* === PROCESS CUSTOM CHANGES: STEP 1 - RequireItem Prerequisite Check === */
      // Filter out and run now any "RequireItem" changes. If any of them fail, remove both the ActiveEffect and the embedded Item.
      ([onceChanges, k4Changes] = U.partition<K4Change>(k4Changes, (change: K4Change) => change.isRequireItemCheck))
      kLog.log("Changes Step 1 (RequireItem)", {k4Changes: [...k4Changes], onceChanges: [...onceChanges]});
      if (onceChanges.some(async (change) => !(await change.apply(effect.actor)))) {
        await originItem?.delete();
        return false;
      }

      /* === PROCESS CUSTOM CHANGES: STEP 2 - PromptForData Check === */
      // PromptForData changes are resolved by querying the User for input when they are embedded within an Actor owned by that User -- i.e. right now.
      // Though there is only one 'PromptForData' custom function currently defined, this structure allows for future expansion.
      // (Note: The "PromptForData" function will only run once; if the data it is seeking is already written to the actor's flags, it will do nothing.)
      kLog.log("Changes Step 2 (PromptForData)", {k4Changes: [...k4Changes], onceChanges: [...onceChanges]});
      ([onceChanges, k4Changes] = U.partition<K4Change>(k4Changes, (change: K4Change) => change.isPromptOnCreate))
      for (const change of onceChanges) {
        await change.apply(effect.actor);
      }

      /* === PROCESS CUSTOM CHANGES: STEP 3 - Permanent Effects Check === */
      // If any changes are permanent, apply them now and remove them from the effects array.
      ([onceChanges, k4Changes] = U.partition<K4Change>(k4Changes, (change: K4Change) => change.isPermanentChange && !effect.eData.onChatSelection));
      kLog.log("Changes Step 3 (PermanentChanges)", {k4Changes: [...k4Changes], onceChanges: [...onceChanges]});
      await Promise.all(onceChanges
        .map((change) => change.apply(effect.actor)));

      // If the number of remaining effects is zero, delete the effect.
      if (k4Changes.length === 0) {
        return false;
      }

      // Otherwise, update the new active effect with the filtered change list.
      await effect.update({"changes": k4Changes});
      return true;
    });
  }
  // #endregion
  static async onManageActiveEffect(event: ClickEvent, owner: K4Actor|K4Item, action?: string) {
    event.preventDefault();
    const a = event.currentTarget;
    action ??= a.dataset.action;
    if (action === "create") {
      return await owner.createEmbeddedDocuments("ActiveEffect", [{
        name:   owner.name,
        icon:   owner.img,
        origin: owner.uuid
      }]);
    }
    const effect = owner.effects.get(a.dataset.target ?? "") as Maybe<K4ActiveEffect>;
    if (!effect) { return null; }
    switch ( action ) {
      case "edit": return effect.sheet?.render(true);
      case "delete": return effect.delete();
      case "toggle": return effect.toggleEnabled();
      case "lock": return effect.toggleLock();
      case "reset": return effect.reset();
      case "use": return effect.use();
      default: return null;
    }
  }

  override async delete(options?: Record<string, unknown>) {
    if (this.isOwnedByActor() && this.id) {
      await this.actor.deleteEmbeddedDocuments("ActiveEffect", [this.id]);
      /**
       * @todo Have to also implement removal of created items/attacks/etc
       */
      return this;
    }
    return super.delete(options);
  }

  async toggleEnabled(value = !this.isEnabled, isForcing = false) {
    if (!this.canToggle()) { return undefined; }
    if (this.isLocked && !isForcing) { return undefined; }
    const promises: Array<Promise<unknown>> = [
      this.flagSet<boolean>("data.isEnabled", value)
    ];
    if (this.isLocked && isForcing) {
      promises.push(this.toggleLock(false));
    }
    return Promise.all(promises);
  }
  async toggleLock(value = !this.isLocked) {
    if (!this.canToggle()) { return undefined; }
    return this.flagSet<boolean>("data.isLocked", value);
  }
  override async reset(resetTo = this.resetTo, isForcing = false) {
    if (this.isLocked && !isForcing) { return undefined; }
    const promises: Array<Promise<unknown>> = [];
    if (this.isLocked && isForcing) {
      promises.push(this.toggleLock(false));
    }
    if (resetTo !== this.isEnabled) {
      promises.push(this.toggleEnabled(resetTo, true));
    }
    return Promise.all(promises);
  }
  async use() {
    const promises: Array<Promise<unknown>> = [];

    if (this.canToggle() && this.resetOn === EffectResetOn.onUse) {
      promises.push(this.reset(this.resetTo, true));
    }
    if (U.isDefined(this.uses)) {
      if ((this.uses.value + 1) >= this.uses.max) {
        if (this.canRefill) {
          promises.push(this.toggleEnabled(false, true));
          promises.push(this.toggleLock(true));
        } else {
          promises.push(this.delete());
        }
      } else {
        promises.push(this.flagSet<number>("data.uses.value", this.uses.value + 1));
      }
    }

    return Promise.all(promises);
  }
  async applyToRoll(roll: K4Roll) {
    if (!this.doesEffectApply(roll)) { return undefined; }
    let returnVal = true;
    for (const change of this.getApplicableRollModifiers(roll)) {
      if (!(await change.apply(roll))) {
        returnVal = false;
        break;
      }
    }
    if (!returnVal) { return false; }
    void this.use();
    return returnVal;
  }

  // #region GETTERS & SETTERS ~
  isInstantiated(): this is typeof this & {id: string} {
    return Boolean(this.id);
  }
  isOwned(): this is {origin: string, parent: K4Actor|K4Item} {
    return Boolean(this.parent);
  }
  isOwnedByActor<T extends K4ActorType = K4ActorType>(type?: T): this is {origin: string, parent: K4Actor<T>, actor: K4Actor<T>} {
    if (!this.isOwned()) { return false; }
    if (type && this.parent.type !== type) { return false; }
    if (this.parent instanceof Item) { return false; }
    return this.parent.is(K4ActorType.pc);
  }
  isOwnedByItem<T extends K4ItemType = K4ItemType>(type?: T): this is {origin: string, owner: K4Item<T>, originItem: K4Item<T>} {
    if (!this.isOwned()) { return false; }
    if (type && (this.parent as K4Item).type !== type) { return false; }
    return this.parent instanceof K4Item;
  }
  hasItemOrigin(): this is {origin: string, owner: K4Actor|K4Item, originItem: K4Item} {
    return this.isOwned() && this.origin.includes("Item");
  }
  get originItem(): Maybe<K4Item> {
    if (!this.hasItemOrigin()) { return undefined; }
    return fromUuidSync(this.origin) as Maybe<K4Item>;
  }
  get owner(): Maybe<K4Actor|K4Item> {
    return this.isOwnedByActor() ? this.actor : this.originItem;
  }
  get actor(): Maybe<K4Actor> {
    if (!this.isOwnedByActor()) { return undefined; }
    return this.parent;
    // const [_, actorId] = this.origin.split(".");
    // return getGame().actors.get(actorId);
  }
  get eData(): K4ActiveEffect.FlagData {
    const eData = this.flagGet<K4ActiveEffect.FlagData>("data");
    if (!eData) {
      throw new Error(`ActiveEffect ${this.id} has no extended data.`);
    }
    return eData;
  }

  getCustomChanges(): K4Change[] {
    const changes: K4Change[] = [];
    if (this.eData.dynamic) {
      changes.push(...DYNAMIC_CHANGES[this.eData.dynamic](this));
    } else {
      changes.push(...this.changes
        .filter((change) => change.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM)
        .map((change) => new K4Change(change, this))
      );
    }
    return changes;
  }
  getCustomChange(id: string): Maybe<K4Change> {
    return this.getCustomChanges().find((change) => change.id === id);
  }
  get enabledCustomChanges(): K4Change[] {
    return this.getCustomChanges().filter((change) => change.isEnabled);
  }
  get requireItemChanges() {
    return this.enabledCustomChanges.filter((change) => change.isRequireItemCheck);
  }
  get permanentChanges() {
    return this.enabledCustomChanges.filter((change) => change.isPermanentChange);
  }
  get promptForDataChanges() {
    return this.enabledCustomChanges.filter((change) => change.isPromptOnCreate);
  }
  get modifyRollChanges() {
    return this.enabledCustomChanges.filter((change) => change.isRollModifier());
  }
  get systemChanges() {
    return this.enabledCustomChanges.filter((change) => change.isSystemModifier);
  }
  // #endregion

  // #region PRIVATE METHODS ~

  // #endregion

  // #REGION === PUBLIC METHODS ===
  flagGet<T>(key: string): Maybe<T> {
    return this.flags.kult4th[key] as Maybe<T>;
  }
  // override async setFlag<T>(namespace: string, key: string, val: T): Promise<this>
  async flagSet<T>(key: string, val: T): Promise<this> {
  // override async setFlag<T>(...args: [string, string, T] | [string, T]): Promise<this> {

    if (!this.owner) {
      throw new Error(`Cannot get flag '${key}' from ActiveEffect with no owner.`);
    }
    await this.owner.updateEmbeddedDocuments("ActiveEffect", [{
      _id:                           this.id,
      [`flags.kult4th.${key}`]: val
    }]);
    return this;
  }

  async updateChangeValue(index: number, value: string) {
    if (!this.owner) {
      throw new Error(`Cannot update change value for ActiveEffect with no owner.`);
    }
    if (!this.changes[index]) {
      throw new Error(`Cannot update change value for ActiveEffect with no change at index ${index}.`);
    }
    this.changes[index].value = value;
    await this.owner.updateEmbeddedDocuments("ActiveEffect", [{
      _id: this.id,
      changes: this.changes
    }]);
  }

  applyToggleListeners(html: JQuery) {
    if (!this.canToggle()) { return; }
    const button$ = html.find(`[data-target="${this.id}"]`);
    button$
      .on({
        click: async (event: ClickEvent) => {
          event.preventDefault();
          if (!this.owner) { return; }
          await K4ActiveEffect.onManageActiveEffect(event, this.owner);
        },
        dblclick: async (event: ClickEvent) => {
          event.preventDefault();
          if (!this.owner) { return; }
          if (this.isLocked) {
            const {value, max} = this.uses ?? {};
            if (U.isDefined(value) && value === max) { return; }
            await K4ActiveEffect.onManageActiveEffect(event, this.owner, "lock");
            return;
          }
          await K4ActiveEffect.onManageActiveEffect(event, this.owner, "toggle");
          await K4ActiveEffect.onManageActiveEffect(event, this.owner, "lock");
        },
        contextmenu: async (event: ClickEvent) => {
          event.preventDefault();
          if (!this.owner) { return; }
          await K4ActiveEffect.onManageActiveEffect(event, this.owner, "reset");
        }
      });
  }
  // #ENDREGION

  static BuildEffectData(data?: Partial<K4ActiveEffect.ParentData>): K4ActiveEffect.ParentData {
    data ??= {};
    const canToggle = Boolean(data.canToggle);
    const inStatusBar = canToggle || Boolean(data.inStatusBar);
    if (U.isUndefined(data.tooltip) && inStatusBar) {
      throw new Error(`No tooltip provided for status bar ActiveEffect: ${JSON.stringify(data)}`);
    }
    return {
      canToggle,
      inStatusBar,
      uses: data.uses ?? 0,
      canRefill: (data.uses ?? 0) > 0
        ? Boolean(data.canRefill)
        : false,
      isUnique: data.isUnique ?? true,
      duration: data.duration ?? EffectDuration.ongoing,
      defaultState: data.defaultState ?? true,
      resetOn: data.resetOn ?? ((data.uses ?? 0) > 0 ? EffectResetOn.onUse : EffectResetOn.never),
      resetTo: data.resetTo ?? data.defaultState ?? true,
      statusLabel: data.statusLabel ?? "",
      tooltip: data.tooltip ?? "",

      name: data.name ?? undefined,
      dynamic: data.dynamic ?? undefined,
      icon: data.icon ?? undefined,
      from: data.from ?? undefined,
      onChatSelection: data.onChatSelection ?? undefined
    };
  }

  static BuildChangeData<N extends K4Change.CustomFunc.Name, T extends K4ItemType = K4ItemType>(funcName: N, value: K4Change.CustomFunc.Data<N, T>): EffectChangeData {
    return {
      key: funcName,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: JSON.stringify(value),
      priority: undefined
    };
  }
}

// #region -- INTERFACE AUGMENTATION ~
// interface K4ActiveEffect {
//   icon: string,
//   origin: string,
//   changes: EffectChangeData[],
//   parent: K4Actor|K4Item|null,
//   updateSource(updateData: {changes: EffectChangeData[]}): Promise<void>,
//   flags: {
//     kult4th: {
//       data: K4ActiveEffect.FlagData
//     }
//   }
// }
// #endregion
// #region EXPORTS ~
export default K4ActiveEffect;
export {K4Change, EffectSourceType, EffectDuration, EffectResetOn, PromptInputType, UserRef};
// #endregion