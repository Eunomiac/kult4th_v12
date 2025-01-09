// #region IMPORTS ~
import U from "../scripts/utilities.js";
import C, {K4Attribute} from "../scripts/constants.js";
import K4Item, {K4ItemType, K4ItemSubType} from "./K4Item.js";
import K4Actor, {K4ActorType} from "./K4Actor.js";
import K4ChatMessage from "./K4ChatMessage.js";
// #endregion

// #REGION === TYPES, ENUMS, INTERFACE AUGMENTATION === ~
// #region -- ENUMS ~
enum K4RollResult {
  completeSuccess = "completeSuccess",
  partialSuccess = "partialSuccess",
  failure = "failure"
}
enum K4RollType {
  attribute = "attribute",
  move = "move"
}
// #endregion
// #region -- TYPES ~

declare global {

  namespace K4Roll {
    export type Attribute = K4Attribute;
    export type RollableAttribute = K4CharAttribute|K4Attribute.zero;
    export type Source = K4Item.Active|K4Roll.Attribute;
    export type ModFilter = "all"|K4ItemType.advantage|K4ItemType.disadvantage|string;
    export type ModDefinition = Record<ModFilter, number>;

    export interface ModData {
      id: string,
      filter: "all"|K4ItemType.advantage|K4ItemType.disadvantage|string,
      value: number,
      name: string,
      tooltip: string,
      cssClasses: string[]
    }

    namespace ConstructorData {
      export interface Base {
        data?: {
          id: IDString,
          actorID: IDString
        },
        source: K4Roll.Source|string
      }
      export interface ItemSource extends Base {
        source: K4Item.Active|string
      }
      export interface AttrSource extends Base {
        source: K4Roll.Attribute
        img: string
      }
    }

    export type ConstructorData = ConstructorData.ItemSource | ConstructorData.AttrSource;

    namespace Data {
      export interface Base extends ConstructorData.Base {
        attribute: K4Roll.RollableAttribute,
        attrVal: number,
        modifiers: K4Roll.ModData[]
      }
      export interface ItemSource extends Base {
        source: K4Item.Active
      }
      export interface AttrSource extends Base {
        source: K4Roll.RollableAttribute,
        img: string
      }
    }

    export type Data = Data.ItemSource | Data.AttrSource;

    namespace Context {

      export interface Base {
        cssClass: string,
        dice: [number, number],
        total: number,
        source: K4Roll.RollableAttribute|K4Item.Active,
        attribute: K4Roll.RollableAttribute,
        attrVal: number,
        attrType: "active"|"passive"|"zero",
        modifiers: ModData[],
        rollerName: string,
        rollerImg: string,
        result: K4Item.Components.ResultData,
        outcome: K4RollResult
      }
      export interface ItemSource extends Base {
        source: K4Item.Active,
        sourceType: K4ItemType,
        sourceName: string,
        sourceImg: string
      }
      export interface AttrSource extends Base {
        source: K4Roll.RollableAttribute
      }
    }
    export type Context = Context.ItemSource | Context.AttrSource;

    export namespace Serialized {
      export interface Base {
        class: "K4Roll",
        source: string,
        attribute: K4Attribute,
        formula: string,
        terms: object[],
        total?: number,
        dice: object[],
        result: string,
        options: unknown,
        evaluated: boolean,
        modifiers: K4Roll.ModData[],
        data: {
          id: IDString,
          actorID: IDString
        };
      }
    }
  }
}
// #endregion
// #region -- INTERFACE AUGMENTATION ~
// interface K4Roll {
//   result: string
// }
// #endregion
// #ENDREGION

class K4Roll extends Roll<{id: IDString, actorID: IDString}> {
  // #region INITIALIZATION ~
  /**
   * Pre-Initialization of the K4Roll class. This method should be run during the "init" hook.
   *
   * @returns {Promise<void>} A promise that resolves when the hook is registered.
   */
  static PreInitialize(): void {
    // Initialize rolls collection
    getGame().rolls = new Collection<K4Roll>();
    /* Insert PreInitiailize Steps Here */
  }
  // #endregion
  // #region Type Guards ~
  /**
   * Type guard to check if the actor is of a specific type.
   * @param {T} type - The type to check against.
   * @returns {boolean} True if the actor is of the specified type.
   */
  is<T extends K4ActorType = K4ActorType>(type: T): this is K4Actor<T> {
    // @ts-expect-error -- Unable to resolve 'this.type' and 'type' to the same type.
    return this.type === type;
  }
  // #endregion

  static GenerateFromStorage(storedData: K4Roll.Serialized.Base): K4Roll {

    const roll = new K4Roll(storedData as K4Roll.ConstructorData);
    roll.modifiers = storedData.modifiers;
    roll._attribute = storedData.attribute as K4Roll.RollableAttribute;
    roll.terms = storedData.terms.map((termData) => foundry.dice.terms.RollTerm.fromData(termData as Record<string, unknown>));
    roll._dice = storedData.dice.map((dieData) => foundry.dice.terms.Die.fromData(dieData as Record<string, unknown>)) as foundry.dice.terms.DiceTerm[];
    roll._total = storedData.total;
    roll._evaluated = storedData.evaluated;
    // roll.result = storedData.result;

    return roll;
  }
  static CheckSource(rollData: K4Roll.ConstructorData, actor: K4Actor): {
    type: K4RollType,
    img: string,
    attribute: Promise<K4Roll.RollableAttribute|null>|K4Roll.RollableAttribute,
    attrVal: number,
    source: K4Roll.Source
  } {
    if (typeof rollData.source === "string") {
      let attrVal: Maybe<number> = undefined;
      switch (rollData.source as K4Attribute & string) {
        case K4Attribute.ask: {
          throw new Error("Need to implement ask-for-attribute prompt in K4Actor, where it can be awaited.")
          /* return {
            type: K4RollType.attribute,
            img: (rollData as K4Roll.ConstructorData_AttrSource).img,
            attribute: actor.askForAttribute(),
            source: rollData.source
          }; */
        }
        case K4Attribute.zero:
          attrVal = 0;
          // falls through
        case K4Attribute.charisma:
        case K4Attribute.coolness:
        case K4Attribute.fortitude:
        case K4Attribute.intuition:
        case K4Attribute.perception:
        case K4Attribute.reason:
        case K4Attribute.reflexes:
        case K4Attribute.soul:
        case K4Attribute.violence:
        case K4Attribute.willpower: {
          attrVal ??= actor.attributes[rollData.source as K4CharAttribute];
          return {
            type: K4RollType.attribute,
            img: (rollData as K4Roll.ConstructorData.AttrSource).img,
            attribute: rollData.source as K4Roll.RollableAttribute,
            attrVal,
            source: rollData.source as K4Attribute
          };
        }
        default: {
          // Assume an item reference by UUID, ID or name
          const item = fromUuidSync(rollData.source) as Maybe<K4Item>
            ?? actor.items.get(rollData.source) as Maybe<K4Item>
            ?? actor.getItemByName(rollData.source) as Maybe<K4Item>
          if (!item?.isActiveItem()) {
            throw new Error(`Unrecognized rollData.source: ${rollData.source}`);
          }
          rollData.source = item;
        }
      }
    }

    if (rollData.source instanceof K4Item && rollData.source.isActiveItem() && "attribute" in rollData.source.system) {
      const {attribute} = rollData.source.system;
      if (attribute === K4Attribute.ask) {
        throw new Error("Need to implement ask-for-attribute prompt in K4Actor, where it can be awaited. Both for generic asks and item.system.attribute = 'ask' cases.")
      }
      return {
        type: K4RollType.move,
        img: rollData.source.img ?? CONST.DEFAULT_TOKEN,
        attribute,
        attrVal: attribute === K4Attribute.zero ? 0 : actor.attributes[attribute],
        source: rollData.source
      }
    }
    throw new Error(`Unable to parse attribute from rollData.source: ${JSON.stringify(rollData.source, null, 2)}`);
  }
  // #region GETTERS & SETTERS ~
  public get id() {
    return this.data.id;
  }
  public actor: K4Actor<K4ActorType.pc>;
  public img: string;
  public _attribute: Promise<K4Roll.RollableAttribute|null>|K4Roll.RollableAttribute;
  public type: K4RollType;
  public source: K4Roll.Attribute|K4Item<K4Item.Types.Active>;
  public isCancelled = false;
  public get sourceName(): string {
    if (this.type === K4RollType.attribute) {
      return U.tCase(this.attribute);
    }
    return (this.source as K4Item & K4Item.Active).name;
  }
  public get attribute(): K4Roll.RollableAttribute|null {
    if (this._attribute instanceof Promise) {
      throw new Error("Attribute promise is not yet resolved.");
    }
    return this._attribute;
  }
  _attrVal?: number;
  public get attrVal(): number {
    if (this._attrVal === undefined) {
      if (this.attribute === null) {
        throw new Error("Attempt to derive attribute value of a cancelled (prompt return === null) roll.");
      }
      if (this.attribute === K4Attribute.zero) {
        this._attrVal = 0;
      } else {
        this._attrVal = this.actor.attributes[this.attribute];
      }
    }
    return this._attrVal;
  }
  public get attrName(): string {
    if (this.attribute === null) {
      throw new Error("Attempt to derive attribute name of a cancelled (prompt return === null) roll.");
    }
    return U.tCase(this.attribute);
  }
  public get sourceType() {
    if (!(this.source instanceof K4Item)) { return undefined; }
    if (!this.source.isSubItem()) { return undefined; }
    return this.source.parentType;
  }
  public get outcome(): K4RollResult {
    if (!this._evaluated) {
      throw new Error("Cannot get result of a roll that has not been evaluated.");
    }
    const total = this.total!;
    if (total >= 15) {
      return K4RollResult.completeSuccess;
    }
    if (total > 9) {
      return K4RollResult.partialSuccess;
    }
    return K4RollResult.failure;
  }

  // #endregion

  // #region === CONSTRUCTOR ===
  constructor(rollData: K4Roll.ConstructorData, actor?: K4Actor<K4ActorType.pc>) {
    const id = rollData.data?.id ?? U.getID();
    actor ??= getGame().actors.get(rollData.data?.actorID ?? "") as Maybe<K4Actor<K4ActorType.pc>>;
    if (!actor) {
      throw new Error(`Unable to find actor for roll ${id}`);
    }
    const {img, type, attribute, attrVal, source} = K4Roll.CheckSource(rollData, actor);
    super(`2d10 + ${attrVal}`, {id, actorID: actor.id});
    this.actor = actor;
    this.img = img;
    this.type = type;
    this._attribute = attribute;
    this.source = source as K4Item<K4Item.Types.Active>;
    this.data.id = id;
    this.data.actorID = actor.id;
    getGame().rolls.set(id, this);
    kLog.log("K4Roll created", {rollData, actor, roll: this});
  }

  // #ENDREGION

  // #region PRIVATE METHODS ~=


  // #endregion

  // #REGION === PUBLIC METHODS ===


  // #ENDREGION
  doesFilterApply(filter: K4Roll.ModFilter): boolean {
    if (filter === "all") { return true; }
    if (this.sourceType as Maybe<string> === filter) { return true; }
    if (this.sourceName === filter) { return true; }
    return false;
  }
  getOutcomeData(): K4Item.Components.ResultData {
    if (this.source instanceof K4Item) {
      if (this.source.system.subType !== K4ItemSubType.activeRolled) {
        throw new Error(`Roll source must be of subType activeRolled: ${this.source.name} is of subType ${this.source.system.subType}`);
      }
      const {results} = (this.source as K4Item.Active).system;
      const outcome = results[this.outcome];
      if (!outcome) {
        throw new Error(`No result found for outcome: ${this.outcome} in ${this.source.name}`);
      }
      return outcome;
    }
    return {
      result: ""
    }
  }

  public modifiers: K4Roll.ModData[] = [];

  override get total(): Maybe<number> {
    if (typeof super.total !== "number") { return super.total; }
    return Math.max(0, super.total);
  }

  public chatMessage?: foundry.abstract.Document.ToConfiguredStored<typeof K4ChatMessage>;

  public async evaluateToChat(): Promise<foundry.abstract.Document.ToConfiguredStored<typeof K4ChatMessage>|false> {

    // Collect all applicable K4ActiveEffects
    const applicableEffects = this.actor.effects
      .filter((effect) => effect.doesEffectApply(this));

    kLog.log("Applicable Effects", {roll: this, applicableEffects});

    for (const effect of applicableEffects) {
      if (await effect.applyToRoll(this) === false) {
        return false;
      }
    }

    // Insert the modTerm into the roll's terms
    this.terms.push(
      new foundry.dice.terms.OperatorTerm({operator: "+", options: {}}),
      new foundry.dice.terms.NumericTerm({
        number: this.modifiers.reduce((acc, mod) => acc + mod.value, 0),
        options: {}
      })
    );

    kLog.log("EVALUATING ROLL", {roll: this});

    await super.evaluate();

    // getGame().dice3d.showForRoll(this); // Can't include if disabling canvas.

    this.chatMessage = (await this.displayToChat());

    return this.chatMessage ?? false;
  }

  public async displayToChat() {
    // if (!this._evaluated) {
    //   throw new Error("Cannot display a roll that has not been evaluated.");
    // }
    const themeCSSClasses: string[] = [];
    const templateData: K4Roll.Context = {
      cssClass: "",
      dice: this.dice[0].results.map((dResult) => dResult.result) as [number, number],
      total: this.total!,
      attribute: this.attribute!,
      attrVal: this.attrVal,
      attrType: this.attribute! in C.Attributes.Active ? "active" : "passive",
      modifiers: this.modifiers,
      rollerName: this.actor.name,
      rollerImg: this.actor.img ?? "icons/svg/mystery-man.svg",
      result: this.getOutcomeData(),
      outcome: this.outcome,
      ...(this.source instanceof K4Item && this.source.isActiveItem())
      ? {
        source: this.source,
        sourceType: this.source.parentType,
        sourceName: this.source.name,
        sourceImg: this.source.img ?? "icons/svg/mystery-man.svg"
      }
      : {
        source: this.source as K4Roll.RollableAttribute
      }
    };
    const cssClasses = ["chat-roll-result"];
    if (this.source instanceof K4Item && this.source.isActiveItem()) {
      cssClasses.push(`${this.source.parentType}-roll`);
    }
    switch (this.outcome) {
      case K4RollResult.completeSuccess: {
        cssClasses.push("roll-success");
        themeCSSClasses.push("k4-theme-gold", "roll-success");
        break;
      }
      case K4RollResult.partialSuccess: {
        cssClasses.push("roll-partial");
        themeCSSClasses.push("k4-theme-gold", "roll-partial");
        break;
      }
      case K4RollResult.failure: {
        cssClasses.push("roll-failure");
        themeCSSClasses.push("k4-theme-gold", "roll-failure");
        break;
      }
      default: throw new Error("Invalid roll result");
    }
    if (templateData.rollerName.startsWith("M") || templateData.rollerName.startsWith("W")) {
      cssClasses.push("wide-drop-cap");
    }
    // cssClasses.push(`mod-rows-${Math.ceil(rollData.modifiers.length / 2)}`);
    // if (this.sourceName.length > 22) {
    //   cssClasses.push("ultra-condensed");
    // } else if (this.sourceName.length > 18) {
    //   cssClasses.push("condensed");
    // }
    templateData.cssClass = cssClasses.join(" ");
    const messageData = await this.toMessage({}, {create: false});
    kLog.log("DISPLAYING ROLL RESULT", {roll: this, templateData, messageData});
    const content = await renderTemplate(
      U.getTemplatePath("sidebar", "result-rolled"),
      templateData
    );

    // this._renderedChatMessage =


    return (await K4ChatMessage.create({
      content,
      speaker: K4ChatMessage.getSpeaker(),
      flags: {
        kult4th: {
          cssClasses: themeCSSClasses,
          isSummary: false,
          isAnimated: true,
          isRoll: true,
          isTrigger: false,
          rollOutcome: this.outcome,
          isEdge: false,
          rollData: this.serializeForStorage()
        }
      }
    })) as foundry.abstract.Document.ToConfiguredStored<typeof K4ChatMessage>;
  }

    /**
   * Serialize the roll data for storage
   * @returns {object} Serialized roll data
   */
    serializeForStorage(): K4Roll.Serialized.Base {
      let source: string;
      if (this.source instanceof K4Item) {
        source = this.source.id;
      } else {
        source = this.source;
      }
      return {
        class: "K4Roll",
        source,
        formula: this.formula,
        modifiers: this.modifiers,
        attribute: this.attribute as K4Attribute,
        terms: this.terms.map((term) => term.toJSON()),
        total: this.total,
        dice: this.dice.map((die) => die.toJSON()),
        result: this.result,
        options: this.options,
        evaluated: this._evaluated,
        data: {
          ...this.data,
          id: this.id,
          actorID: this.actor.id
        }
      };
    }
}


// #region EXPORTS ~
export default K4Roll;

export {K4RollType, K4RollResult}
// #endregion