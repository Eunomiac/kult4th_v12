// #region IMPORTS ~
import K4Item from "./K4Item";
import C, {Archetypes} from "../scripts/constants.js";
import {K4ItemType, K4Attribute, K4Archetype, ArchetypeTier, K4Stability, K4ConditionType, K4WoundType, K4ActorType, K4CharGenPhase, type K4CharAttribute} from "../scripts/enums";
import ActorDataModel_PC from "../dataModels/documents/ActorDataModel_PC";
import ActorDataModel_NPC from "../dataModels/documents/ActorDataModel_NPC";
import U from "../scripts/utilities.js";
// #endregion


// #region === TYPES === ~
declare global {

  export namespace K4Actor {

    export type System<Type extends K4ActorType> =
      Type extends K4ActorType.pc ? ActorDataModel_PC
    : Type extends K4ActorType.npc ? ActorDataModel_NPC
    : never;

    export type OfType<Type extends K4ActorType> = K4Actor & {system: System<Type>};
  }
}
// #endregion

// #region === K4ACTOR CLASS ===
export default class K4Actor extends Actor {
    // #region INITIALIZATION ~
    /**
     * Pre-Initialization of the K4Actor class. This method should be run during the "init" hook.
     *
     * - Registers the K4Actor class as the system's Actor document class.
     * - Customizes the sidebar icon for the Actor directory
     */
    static PreInitialize() {

      Object.assign(CONFIG.Actor.dataModels, {
        pc: ActorDataModel_PC,
        npc: ActorDataModel_NPC
      })

      // Customize the sidebar icon for the Actor directory
      CONFIG.Actor.sidebarIcon = "fa-regular fa-people-group";
    }
    /**
     * Initialization of a K4Actor instance. This method should be run during the actor's "_onCreate" method.
     *
     * - Creates the basic player move items for the character.
     * - Creates the singleton "Wounds" and "Stability" K4ActiveEffects.
     */
    async initMovesAndEffects() {
      if (!this.isType(K4ActorType.pc)) {return;}

      // eslint-disable-next-line @typescript-eslint/require-await
      await (async () => {
        const promises: Array<Promise<unknown>> = [];

        // Dynamically import PACKS to avoid circular dependency
        // const { PACKS } = await import("./scripts/data.js");

        // // Create the basic moves for the character
        // if (this.basicMoves.length === 0) {
        //   promises.push(this.createEmbeddedDocuments("Item", PACKS.basicPlayerMoves));
        // }

        // // Create the dynamic ActiveEffect to handle wound modifiers
        // promises.push(K4ActiveEffect.CreateFromBuildData(
        //   {
        //     parentData: K4ActiveEffect.BuildEffectData({
        //       name: "Wounds",
        //       dynamic: "wounds",
        //       canToggle: false,
        //       inStatusBar: true,
        //       icon: "systems/kult4th/assets/icons/wounds/wound-serious.svg",
        //       tooltip: "<center><h2>Wounds</h2></center><p>Your wounds affect your ability to fight and survive, while suffering clouds your mind.</p><p>(<em><strong>Note:</strong> Suppress wounds individually to exclude them from applying to your next roll.)</em></p>"
        //     }),
        //     changeData: []
        //   }, this))

        // // Create the dynamic ActiveEffect for stability modifiers
        // promises.push(K4ActiveEffect.CreateFromBuildData(
        //   {
        //     parentData: K4ActiveEffect.BuildEffectData({
        //       name: "Stability",
        //       dynamic: "stability",
        //       canToggle: false,
        //       inStatusBar: true,
        //       icon: "systems/kult4th/assets/icons/modifiers/stability-critical.svg",
        //       tooltip: "<center><h2>Stability</h2></center><p>Your mental stability affects your ability to act and think clearly, even as it liberates you from the Illusion.</p>"
        //     }),
        //     changeData: []
        //   }, this));

        // // Create the dynamic ActiveEffect for stability condition modifiers
        // promises.push(K4ActiveEffect.CreateFromBuildData(
        //   {
        //     parentData: K4ActiveEffect.BuildEffectData({
        //       name: "Stability Conditions",
        //       dynamic: "stabilityConditions",
        //       canToggle: false,
        //       inStatusBar: true,
        //       icon: "systems/kult4th/assets/icons/conditions/stability.svg",
        //       tooltip: "<center><h2>Stability Conditions</h2></center><p>Recent traumas have afflicted you with one or more Stability Conditions, which may or may not apply to any given roll.</p><p>(<em><strong>Note:</strong> Suppress Stability Conditions individually to exclude them from applying to your next roll.)</em></p>"
        //     }),
        //     changeData: []
        //   }, this));

        // // Create the dynamic ActiveEffect for armor modifiers
        // promises.push(K4ActiveEffect.CreateFromBuildData(
        //   {
        //     parentData: K4ActiveEffect.BuildEffectData({
        //       name: "Armor",
        //       dynamic: "armor",
        //       statusCategory: "armor",
        //       canToggle: false,
        //       inStatusBar: true,
        //       icon: "systems/kult4th/assets/icons/modifiers/armor.svg",
        //       tooltip: "<center><h2>Armor</h2></center><p>You are wearing armor that protects you from harm, conferring a bonus to your %insert.docLink.Endure Injury% rolls.</p>"
        //     }),
        //     changeData: []
        //   }, this));

        // await Promise.all(promises);

      })()
    }
    // #endregion

    // #region STATIC METHODS ~
    /**
     * Retrieves the player character owned by the given user.
     * @param {User} user - The user whose player character to retrieve.
     * @returns {K4Actor | undefined} The player character owned by the user, or undefined if not found.
     * @throws {Error} If the user ID cannot be determined.
     */
    static GetCharacter(user: User): Maybe<K4Actor.OfType<K4ActorType.pc>> {
      if (!user.id) {
        throw new Error("Unable to determine ID of user.");
      }
      const playerCharacters = getActors().filter((actor): actor is K4Actor.OfType<K4ActorType.pc> => actor.isType(K4ActorType.pc));
      const ownedPlayerCharacter = playerCharacters.find((actor: K4Actor.OfType<K4ActorType.pc>) => actor.ownership[user.id as IDString] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
      return ownedPlayerCharacter;
    }

    // #region Type Guards ~
    /**
     * Type guard to check if the actor is of a specific type.
     * @param {T} type - The type to check against.
     * @returns {boolean} True if the actor is of the specified type.
     */
    isType<T extends K4ActorType>(actorType: T): this is K4Actor.OfType<T> {
      return this.type === actorType
    }
    // #endregion

    // #region GETTERS ~
    get user(): Maybe<User> {
      if (!this.isType(K4ActorType.pc)) {return undefined;}
      const ownerID = (Object.keys(this.ownership))
        .filter((id: IDString) => (getGame().users.get(id) as Maybe<User>)?.isGM === false)
        .find((id: IDString) => this.ownership[id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
      if (!ownerID) {return undefined;}
      return getGame().users.get(ownerID) as Maybe<User>;
    }

    // get summaryData(): K4Actor.SummaryData {
    //   if (this.is(K4ActorType.pc)) {
    //     return {
    //       name: this.name,
    //       img: this.img,
    //       archetype: this.archetype,
    //       attributes: this.attributes,
    //       advantages: [],
    //       disadvantages: [],
    //       darkSecrets: [],
    //       occupation: this.system.occupation,
    //       description: this.system.description,
    //       notes: this.system.notes
    //     }
    //   } else {
    //     return {
    //       name: this.name,
    //       img: this.img,
    //       description: this.system.description,
    //       notes: this.system.notes
    //     }
    //   }
    // }
    // #region -- Embedded Item Search & Retrieval Methods ~


    /**
     * Retrieves items of a specific type.
     * @param {Type} type - The type of items to retrieve.
     * @returns {Array<K4Item.OfType<Type>>} An array of items of the specified type.
     */
    getItemsOfType<Type extends K4ItemType>(type: Type): Array<K4Item.OfType<Type>> {
      return ([...this.items] as K4Item[]).filter((item: K4Item): item is K4Item.OfType<Type> => item.isType(type));
    }
    /**
     * Retrieves an item by its name.
     * @param {string} iName - The name of the item.
     * @returns {K4Item | undefined} The item if found, otherwise undefined.
     */
    getItemByName(iName: string): K4Item | undefined {
      return this.items.find((item: K4Item) => item.name === iName);
    }
    /**
     * Retrieves a move by its name.
     * @param {string} mName - The name of the move.
     * @returns {K4Item | undefined} The move if found, otherwise undefined.
     */
    getMoveByName(mName: string) {
      if (!this.isType(K4ActorType.pc)) {return undefined;}
      return this.system.moves.find((move: K4Item) => move.name === mName);
    }
    /**
     * Retrieves items by their source ID.
     * @param {string} sourceID - The source ID of the items.
     * @returns {K4Item.SubItem[]} An array of sub-items with the specified source ID.
     */
    // getItemsBySource(sourceID: string): Array<K4Item & K4Item.SubItem> {
    //   return this.items.filter((item: K4Item): item is K4Item & K4Item.SubItem => {
    //     if (!("parentItem" in item.system)) {return false;}
    //     const {parentItem} = item.system;
    //     return item.isSubItem() && parentItem?.id === sourceID;
    //   });
    // }

    /**
     * Retrieves items by a variety of filters.
     * If any item is found with a name or id that matches the filter string, it is returned alone as a 'perfect match'.
     * Otherwise, all items matching the type, subType, or id of the parent item are returned in an array.
     *
     * @param {K4ItemType} [type] - The type of items to filter. If not provided, all items are considered.
     * @param {string} filter - The filter to apply to the items.
     * @returns {K4Item[]} - An array of matching items.
     */
    getItemsByFilter(filter: string): K4Item[];
    getItemsByFilter<Type extends K4ItemType>(type: Type, filter: string): Array<K4Item.OfType<Type>>;
    getItemsByFilter<Type extends K4ItemType>(arg1: Type | string, arg2?: string): Array<K4Item | K4Item.OfType<Type>> {
      /**
       * Filters items based on a provided filter string.
       *
       * @param {string} filterString - The filter string to match against item properties.
       * @param {K4Item[]} itemPool - The pool of items to filter.
       * @returns {K4Item[]} - An array of matched items. If no matches are found, an empty array is returned.
       */
      function filterItems(filterString: string, itemPool: K4Item[]): K4Item[] {
        const filteredItems: K4Item[] = [];
        for (const item of itemPool) {
          if ([
            item.name,
            item.id
          ].includes(filterString)) {
            return [item];
          }
          if ([
            item.type,
            "subType" in item.system ? item.system["subType"] : "",
            item.parentID ?? ""
          ].includes(filterString)) {
            filteredItems.push(item);
          }
        };
        return filteredItems;
      }

      return filterItems(
        arg2 ?? arg1,
        arg2 ? this.getItemsOfType(arg1 as Type) : [...this.items]
      );
    }
    // #endregion

    // #endregion

    // // #region CHARGEN ~
    // getCharGenSelected(archetype?: K4Archetype) {
    //   if (this.type !== K4ActorType.pc) {return {advantages: [], disadvantages: [], darkSecrets: []};}
    //   const pcData = this.system as K4Actor.System<K4ActorType.pc>;
    //   archetype = (archetype ?? pcData.archetype) || K4Archetype.academic;
    //   let {selAdvantages, selDisadvantages, selDarkSecrets, extraDisadvantages, extraDarkSecrets} = pcData.charGen;

    //   selAdvantages = selAdvantages.map((adv) => adv.replace(/^!?/, ""));
    //   selDisadvantages = selDisadvantages.map((dis) => dis.replace(/^!?/, ""));
    //   selDarkSecrets = selDarkSecrets.map((ds) => ds.replace(/^!?/, ""));

    //   const archetypeData = {...Archetypes[archetype]};
    //   const archAdvantages = archetypeData[K4ItemType.advantage] as unknown as string[];

    //   const archDisadvantages = archetypeData[K4ItemType.disadvantage] as unknown as string[];
    //   const mandatoryArchDisadvantages = archDisadvantages
    //     .filter((dis) => dis.startsWith("!"))
    //     .map((dis) => dis.replace(/^!?/, ""));
    //   const archDarkSecrets = archetypeData[K4ItemType.darksecret] as unknown as string[];

    //   selAdvantages = selAdvantages.filter((adv) => archAdvantages.includes(adv));
    //   selDisadvantages = U.unique([
    //     ...mandatoryArchDisadvantages,
    //     ...selDisadvantages.filter((dis) => archDisadvantages.includes(dis))
    //   ]);
    //   selDarkSecrets = selDarkSecrets.filter((ds) => archDarkSecrets.includes(ds));

    //   const allAdvantages = selAdvantages
    //     .map((adv) => adv.replace(/^!?/, ""))
    //     .map((adv) => getItems().getName(adv)!);
    //   const allDisadvantages = U.unique([
    //     ...selDisadvantages,
    //     ...extraDisadvantages
    //   ])
    //     .map((dis) => dis.replace(/^!?/, ""))
    //     .map((dis) => getItems().getName(dis)!);
    //   const allDarkSecrets = U.unique([
    //     ...selDarkSecrets,
    //     ...extraDarkSecrets
    //   ])
    //     .map((ds) => ds.replace(/^!?/, ""))
    //     .map((ds) => getItems().getName(ds)!);

    //   return {
    //     advantages: allAdvantages,
    //     disadvantages: allDisadvantages,
    //     darkSecrets: allDarkSecrets
    //   }
    // }
    // isCharGenSelected(traitName: string, archetype?: K4Archetype) {
    //   if (this.type !== K4ActorType.pc) {return false;}
    //   const pcData = this.system as K4Actor.System<K4ActorType.pc>;
    //   let {selAdvantages, selDisadvantages, selDarkSecrets, extraDisadvantages, extraDarkSecrets} = pcData.charGen;
    //   selAdvantages = selAdvantages.map((adv) => adv.replace(/^!?/, ""));
    //   selDisadvantages = selDisadvantages.map((dis) => dis.replace(/^!?/, ""));
    //   selDarkSecrets = selDarkSecrets.map((ds) => ds.replace(/^!?/, ""));
    //   traitName = traitName.replace(/^!?/, "");
    //   if (archetype) {
    //     const archetypeData = {...Archetypes[archetype]};
    //     const archAdvantages = archetypeData[K4ItemType.advantage] as unknown as string[];
    //     const archDisadvantages = archetypeData[K4ItemType.disadvantage] as unknown as string[];
    //     const archDarkSecrets = archetypeData[K4ItemType.darksecret] as unknown as string[];
    //     selAdvantages = selAdvantages.filter((adv) => archAdvantages.includes(adv));
    //     selDisadvantages = selDisadvantages.filter((dis) => archDisadvantages.includes(dis));
    //     selDarkSecrets = selDarkSecrets.filter((ds) => archDarkSecrets.includes(ds));
    //   }
    //   return [
    //     ...selAdvantages,
    //     ...selDisadvantages,
    //     ...selDarkSecrets,
    //     ...extraDisadvantages,
    //     ...extraDarkSecrets
    //   ].includes(traitName);
    // }

    // _chargenSheet: Maybe<K4CharGen>;
    // get chargenSheet(): K4CharGen {
    //   if (!this.user) {
    //     throw new Error(`Cannot initialize chargen sheet for actor ${this.id}: Actor has no user.`)
    //   }
    //   if (!this.isType(K4ActorType.pc)) {
    //     throw new Error(`Cannot initialize chargen sheet for actor ${this.id}: Actor is not a PC.`)
    //   }
    //   if (!this._chargenSheet) {
    //     this._chargenSheet = new K4CharGen(this.user, this);
    //   }
    //   return this._chargenSheet;
    // }

    // preInitializeCharGen() {
    //   if (!this.user) {
    //     throw new Error(`Cannot initialize chargen sheet for actor ${this.id}: Actor has no user.`)
    //   }
    //   if (!this.isType(K4ActorType.pc)) {
    //     throw new Error(`Cannot initialize chargen sheet for actor ${this.id}: Actor is not a PC.`)
    //   }
    //   this.chargenSheet.precomputeAllArchetypeTraitData();
    //   this.chargenSheet.precomputeArchetypeData();
    // }

    // async charGenSelect(traitName: string, isArchetype = true, isSilent = false) {
    //   if (!this.isType(K4ActorType.pc)) {return;}
    //   const pcData = this.system;
    //   let {selAdvantages, selDisadvantages, selDarkSecrets, extraDisadvantages, extraDarkSecrets} = pcData.charGen;
    //   const item = getGame().items.getName(traitName) as Maybe<K4Item>;
    //   if (!item) { return; }
    //   switch (item.type) {
    //     case K4ItemType.advantage: {
    //       if (selAdvantages.includes(traitName)) { break; }
    //       selAdvantages = U.unique([...selAdvantages, traitName]);
    //       await this.update({"system.charGen.selAdvantages": selAdvantages}, {render: false});
    //       if (!isSilent) {
    //         void K4Socket.Call("CharChange_Trait", UserTargetRef.other, this.user!.id, this.id, K4ItemType.advantage, traitName, true, true);
    //         await this.chargenSheet.reRenderTraitPanels();
    //       }
    //       break;
    //     }
    //     case K4ItemType.disadvantage: {
    //       if (isArchetype) {
    //         if (selDisadvantages.includes(traitName)) { break; }
    //         selDisadvantages = U.unique([...selDisadvantages, traitName]);
    //         await this.update({"system.charGen.selDisadvantages": selDisadvantages}, {render: false});
    //         if (!isSilent) {
    //           void K4Socket.Call("CharChange_Trait", UserTargetRef.other, this.user!.id, this.id, K4ItemType.disadvantage, traitName, true, true);
    //           await this.chargenSheet.reRenderTraitPanels();
    //         }
    //       } else {
    //         if (extraDisadvantages.includes(traitName)) { break; }
    //         extraDisadvantages = U.unique([...extraDisadvantages, traitName]);
    //         await this.update({"system.charGen.extraDisadvantages": extraDisadvantages}, {render: false});
    //         if (!isSilent) {
    //           void K4Socket.Call("CharChange_Trait", UserTargetRef.other, this.user!.id, this.id, K4ItemType.disadvantage, traitName, true, false);
    //           await this.chargenSheet.reRenderTraitPanels();
    //         }
    //       }
    //       break;
    //     }
    //     case K4ItemType.darksecret: {
    //       if (isArchetype) {
    //         if (selDarkSecrets.includes(traitName)) { break; }
    //         selDarkSecrets = U.unique([...selDarkSecrets, traitName]);
    //         await this.update({"system.charGen.selDarkSecrets": selDarkSecrets}, {render: false});
    //         if (!isSilent) {
    //           void K4Socket.Call("CharChange_Trait", UserTargetRef.other, this.user!.id, this.id, K4ItemType.disadvantage, traitName, true, true);
    //           await this.chargenSheet.reRenderTraitPanels();
    //         }
    //       } else {
    //         if (extraDarkSecrets.includes(traitName)) { break; }
    //         extraDarkSecrets = U.unique([...extraDarkSecrets, traitName]);
    //         await this.update({"system.charGen.extraDarkSecrets": extraDarkSecrets}, {render: false});
    //         if (!isSilent) {
    //           void K4Socket.Call("CharChange_Trait", UserTargetRef.other, this.user!.id, this.id, K4ItemType.disadvantage, traitName, true, false);
    //           await this.chargenSheet.reRenderTraitPanels();
    //         }
    //       }
    //       break;
    //     }
    //   }
    // }

    // async charGenDeselect(traitName: string) {
    //   if (!this.isType(K4ActorType.pc)) {return;}
    //   const pcData = this.system;
    //   const {selAdvantages, selDisadvantages, selDarkSecrets, extraDisadvantages, extraDarkSecrets} = pcData.charGen;
    //   if (selAdvantages.includes(traitName)) {
    //     U.pullElement(selAdvantages, traitName);
    //     void K4Socket.Call("CharChange_Trait", UserTargetRef.other, this.user!.id, this.id, K4ItemType.advantage, traitName, false);
    //     await this.update({"system.charGen.selAdvantages": selAdvantages}, {render: false});
    //     await this.chargenSheet.reRenderTraitPanels();
    //   } else if ([...selDisadvantages, ...extraDisadvantages].includes(traitName)) {
    //     U.pullElement(selDisadvantages, traitName);
    //     U.pullElement(extraDisadvantages, traitName);
    //     void K4Socket.Call("CharChange_Trait", UserTargetRef.other, this.user!.id, this.id, K4ItemType.disadvantage, traitName, false);
    //     await this.update({
    //       "system.charGen.selDisadvantages": selDisadvantages,
    //       "system.charGen.extraDisadvantages": extraDisadvantages
    //     }, {render: false});
    //     await this.chargenSheet.reRenderTraitPanels();
    //   } else if ([...selDarkSecrets, ...extraDarkSecrets].includes(traitName)) {
    //     U.pullElement(selDarkSecrets, traitName);
    //     U.pullElement(extraDarkSecrets, traitName);
    //     void K4Socket.Call("CharChange_Trait", UserTargetRef.other, this.user!.id, this.id, K4ItemType.darksecret, traitName, false);
    //     await this.update({
    //       "system.charGen.selDarkSecrets": selDarkSecrets,
    //       "system.charGen.extraDarkSecrets": extraDarkSecrets
    //     }, {render: false});
    //     await this.chargenSheet.reRenderTraitPanels();
    //   }
    // }
    // // #endregion



  //   // #region STABILITY & WOUNDS ~
  //   /**
  //    * Changes the stability of the actor by a specified delta.
  //    * @param {number} delta - The change in stability.
  //    */
  //   async changeStability(delta: number) {
  //     if (delta && this.isType(K4ActorType.pc)) {
  //       const {value, min, max} = this.system.stability;
  //       if (U.clampNum(value + delta, [min, max]) !== value) {
  //         await this.update({"system.stability.value": U.clampNum(value + delta, [min, max])});
  //       }
  //     }
  //   }
  //   async addCondition(data: Partial<K4Actor.Components.Condition>) {
  //     if (!this.isType(K4ActorType.pc)) { return; }
  //     const {label, description, type, modDef} = data;
  //     if (!label) {
  //       throw new Error("Cannot add a condition without a label.");
  //     }
  //     if (U.isUndefined(modDef)) {
  //       throw new Error("Cannot add a condition without a mod definitions object.");
  //     }
  //     const conditionData: K4Actor.Components.Condition = {
  //       id: U.getID(),
  //       label,
  //       description: description ?? "",
  //       type: type ?? K4ConditionType.stability,
  //       modDef,
  //       isApplyingToRolls: true
  //     };
  //     await this.update({[`system.conditions.${conditionData.id}`]: conditionData});
  //   }
  //   /**
  //    * Adds a wound to the actor.
  //    * @param {K4WoundType} [type] - The type of the wound.
  //    * @param {string} [label] - A brief description of the wound.
  //    */
  //   async addWound(type?: K4WoundType, label?: string) {
  //     if (this.isType(K4ActorType.pc)) {
  //       const woundData: K4Actor.Components.Wound = {
  //         id: U.getID(),
  //         label: label ?? "",
  //         isCritical: type === K4WoundType.critical,
  //         isStabilized: false,
  //         isApplyingToRolls: true
  //       };
  //       let isWoundUpgrading = false;
  //       // If the wound is serious, check if the actor has more than the maximum number of allowed serious wounds
  //       if (!woundData.isCritical && this.wounds_serious.length >= this.system.maxWounds.serious) {
  //         // If the actor has reached the limit for serious wounds, upgrade the wound to critical
  //         woundData.isCritical = true;
  //         isWoundUpgrading = true;
  //       }
  //       // If critical, check if actor already has a critical wound; if so, reject the wound and alert the players
  //       if (woundData.isCritical) {
  //         if (this.wounds_critical.length) {
  //           if (isWoundUpgrading) {
  //             getNotifier().error(`${this.name} has already suffered ${U.verbalizeNum(this.wounds_serious.length)} serious wounds and a critical wound: They can withstand no further injury.`);
  //           } else {
  //             getNotifier().error(`${this.name} has already suffered a critical wound and cannot withstand another.`);
  //           }
  //           return;
  //         }
  //         if (isWoundUpgrading) {
  //           getNotifier().warn(`${this.name} already has ${U.verbalizeNum(this.wounds_serious.length)} serious wounds, and suffers a CRITICAL WOUND instead!`);
  //         } else {
  //           getNotifier().warn(`${this.name} suffers a CRITICAL WOUND!`);
  //         }
  //       } else {
  //         getNotifier().warn(`${this.name} suffers a Serious Wound!`);
  //       }
  //       kLog.log("Starting Wounds", U.objClone(this.system.wounds));
  //       await this.update({[`system.wounds.${woundData.id}`]: woundData});
  //       kLog.log("Updated Wounds", U.objClone(this.system.wounds));
  //     }
  //   }

  //   /**
  //    * Toggles the type, stabilization state, or applicability to rolls of a wound.
  //    * @param {IDString} id - The ID of the wound.
  //    * @param {"type"|"stabilized"|"applying"} toggleSwitch - The property to toggle.
  //    */
  //   async toggleWound(id: IDString, toggleSwitch: "type" | "stabilized" | "applying") {
  //     const woundData = this.wounds[id];
  //     if (woundData) {
  //       switch (toggleSwitch) {
  //         case "type": {
  //           await this.update({[`system.wounds.${id}.isCritical`]: !woundData.isCritical});
  //           break;
  //         }
  //         case "stabilized": {
  //           await this.update({[`system.wounds.${id}.isStabilized`]: !woundData.isStabilized});
  //           break;
  //         }
  //         case "applying": {
  //           await this.update({[`system.wounds.${id}.isApplyingToRolls`]: !woundData.isApplyingToRolls});
  //           break;
  //         }
  //         // no default
  //       }
  //     }
  //   }
  //   /**
  //   * Resets the name of a wound.
  //   * @param {string} id - The ID of the wound.
  //   */
  //  async resetWoundName(id: IDString) {
  //    const woundData = this.wounds[id];
  //    if (woundData) {
  //      await this.update({[`system.wounds.${id}.label`]: ""});
  //    }
  //  }
  //   /**
  //    * Removes a wound from the actor.
  //    * @param {string} id - The ID of the wound.
  //    */
  //   async removeWound(id: IDString) {
  //     if (this.isType(K4ActorType.pc)) {
  //       kLog.log("Starting Wounds", U.objClone(this.system.wounds));
  //       await this.update({[`system.wounds.-=${id}`]: null});
  //       kLog.log("Updated Wounds", this.system.wounds);
  //     }
  //   }
  //   /**
  //    * Toggles the applicability of a condition to rolls..
  //    * @param {IDString} id - The ID of the wound.
  //    */
  //     async toggleCondition(id: IDString) {
  //       const conditionData = this.conditions[id];
  //       if (conditionData) {
  //         await this.update({[`system.conditions.${id}.isApplyingToRolls`]: !conditionData.isApplyingToRolls});
  //       }
  //     }
  //   /**
  //    * Resets the name of a condition.
  //    * @param {string} id - The ID of the condition.
  //    */
  //   async resetConditionName(id: IDString) {
  //     const conditionData = this.conditions[id];
  //     if (conditionData) {
  //       await this.update({[`system.conditions.${id}.label`]: ""});
  //     }
  //   }
  //     /**
  //    * Removes a condition from the actor.
  //    * @param {string} id - The ID of the wound.
  //    */
  //   async removeCondition(id: IDString) {
  //     if (this.isType(K4ActorType.pc)) {
  //       kLog.log("Starting Conditions", U.objClone(this.system.conditions));
  //       await this.update({[`system.conditions.-=${id}`]: null});
  //       kLog.log("Updated Conditions", this.system.conditions);
  //     }
  //   }
  //   // #endregion

  //   // #region EDGES ~
  //   async updateEdges(edges: number, source?: K4Item) {
  //     if (!this.isType(K4ActorType.pc)) {return;}
  //     const sourceName = source ? source.parentName : this.system.edges.sourceName;
  //     if (this.sheet?.rendered) {
  //       const html = $(this.sheet.element);
  //       await new Promise((resolve) => {
  //         gsap.to(
  //           html.find(".edges-blade-container svg"),
  //           {autoAlpha: 1, rotation: 175 + (20 * edges), duration: 1.5, ease: "back", onComplete: resolve}
  //         );
  //         if (edges === 0) {
  //           gsap.to(html.find(".edges-header"), {autoAlpha: 0, duration: 1});
  //           gsap.to(html.find(".edges-count"), {autoAlpha: 0, duration: 1});
  //           gsap.to(html.find(".edges-source"), {autoAlpha: 0, duration: 1});
  //           gsap.to(html.find(".edges .hover-strip"), {autoAlpha: 0, duration: 1});
  //           gsap.to(html.find(".edges-blade-container"), {autoAlpha: 0, duration: 1});
  //         }
  //       });
  //     }
  //     await this.update({
  //       "system.edges.sourceName": sourceName,
  //       "system.edges.value": edges
  //     });
  //   }
  //   async spendEdge() {
  //     if (!this.isType(K4ActorType.pc) || !this.system.edges.value) {return;}
  //     await this.updateEdges(this.system.edges.value - 1);
  //   }
  //   async gainEdge() {
  //     if (!this.isType(K4ActorType.pc) || !this.system.edges.sourceName) {return;}
  //     await this.updateEdges(this.system.edges.value + 1);
  //   }
  //   async clearEdges(): Promise<void> {
  //     if (!this.isType(K4ActorType.pc)) {return;}
  //     await this.updateEdges(0);
  //   }
  //   // #endregion

    /**
     * Deletes an item by its name.
     * @param {string} iName - The name of the item.
     * @returns {Promise<void>} A promise that resolves when the item is deleted.
     */
    async dropItemByName(iName: string) {
      return [...this.items].find((item: K4Item): item is K4Item => item.name === iName)?.delete();
    }
    // // #region -- ROLLS & TRIGGERED RESULTS -- ~
    // /**
    //  * Prompts the user to select an attribute using a dialog.
    //  * @param {string | undefined} message - Optional message to display in the dialog.
    //  * @returns {Promise<K4Roll.RollableAttribute | null>} The selected attribute or null if no selection is made.
    //  */
    // async askForAttribute(message?: string): Promise<K4Roll.RollableAttribute | null> {
    //   const content = await renderTemplate(
    //     U.getTemplatePath("dialog", "ask-for-attribute"),
    //     {
    //       id: this.id,
    //       message
    //     }
    //   );
    //   const userOutput = await new Promise<{attribute: K4Roll.RollableAttribute;}>((resolve) => {
    //     new Dialog(
    //       {
    //         title: "Attribute Selection",
    //         content,
    //         default: K4Attribute.zero,
    //         buttons: C.AttributeButtons(resolve)
    //       },
    //       {
    //         classes: [C.SYSTEM_ID, "dialog", "attribute-selection"]
    //       }
    //     ).render(true);
    //   });
    //   if (userOutput.attribute in K4Attribute) {
    //     return userOutput.attribute;
    //   } else {
    //     return null;
    //   }
    // }
    // public async roll(rollSource: string) {
    //   const item = this.getItemByName(rollSource);
    //   if (!item) {
    //     throw new Error(`No item found with name '${rollSource}'`);
    //   }
    //   await item.rollItem();
    // }
    // public async trigger(rollSource: string) {
    //   const item = this.getItemByName(rollSource);
    //   if (!item) {
    //     throw new Error(`No item found with name '${rollSource}'`);
    //   }
    //   await item.triggerItem();
    // }
    // // #endregion



    // #region OVERRIDES: _onCreate, prepareData, _onDelete ~

    async _onEndScene() {
      await this.update({
        // Clear all edges
        "system.edges.sourceName": "",
        "system.edges.value": 0
      });
    }

    override _onCreate(...params: Parameters<Actor["_onCreate"]>) {
      super._onCreate(...params);
      if (!getUser().isGM) { return; }
      if (this.type !== K4ActorType.pc) {return;}

      // Set the default tab for the character sheet
      void this.setFlag("kult4th", "sheetTab", "front");

      void this.initMovesAndEffects();

      // Register a custom end-of-scene hook
      Hooks.on("endScene", this._onEndScene.bind(this));
    }

    /**
     * Overrides the update method to handle a closing animation that should not be interrupted.
     * If closing animation provided, and sheet is rendered, update will proceed silently and sheet
     * will be rerendered once the animation completes.
     *  - as options.updateAnim   *
     **/
    override async update(data: Record<string, unknown>, options: Record<string, unknown> & {updateAnim?: GsapAnimation;} = {}): Promise<Maybe<this>> {

      const {updateAnim, ...updateOptions} = options;
      if (updateAnim && this.sheet?.rendered) {
        const updatePromise = super.update(data, {
          ...updateOptions,
          render: false
        });
        await Promise.all([
          updatePromise,
          new Promise((resolve) => {
            updateAnim
              .then(resolve)
              .catch((error: unknown) => { console.error(error) })
          })
        ]);
        this.sheet.render();
        return updatePromise;
      }
      return super.update(data, updateOptions);
    }
    // #endregion
  }
  // #endregion

// #endregion
