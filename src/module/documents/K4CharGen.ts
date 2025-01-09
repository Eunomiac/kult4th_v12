// #region IMPORTS ~
import C, {K4Attribute, StabilityConditions, K4ConditionType, K4Stability, K4Archetype, ArchetypeTier, Archetypes, K4GamePhase} from "../scripts/constants.js";
import U from "../scripts/utilities.js";
import {Dragger, InertiaPlugin, CustomEase, CustomWiggle} from "../libraries.js";
import K4Actor, {K4ActorType, K4AttributeData} from "./K4Actor.js";
import K4Item, {K4ItemType} from "./K4Item.js";
import K4Dialog, {PromptInputType} from "./K4Dialog.js";
import K4ActiveEffect from "./K4ActiveEffect.js";
import K4Roll from "./K4Roll.js";
import {gsap} from "../libraries.js";
import K4GMTracker from "./K4GMTracker.js";
import K4Alert, {AlertType} from "./K4Alert.js";
import K4DebugDisplay from "./K4DebugDisplay.js";
import K4Socket, {UserTargetRef} from "./K4Socket.js";
// #endregion

// #region CONFIGURATION ~
const PIXELS_PER_ROTATION = 1000;
const CAROUSEL_ITEM_WIDTH = 200;
const VALID_ARCHETYPE_TIERS: ArchetypeTier[] = ["aware" as ArchetypeTier];
// #endregion

// #region DEBUG: METHOD DECORATOR ~
function methodLoggingDecorator(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value!;
  descriptor.value = function (this: any, ...args: any[]): any {
    const timeStamp = U.getTimeStamp();
    timeStamp();
    kLog.log(`[${propertyKey}] CALLED with arguments:`, {args});
    const result = originalMethod.apply(this, args);
    kLog.log(`[${propertyKey}] RETURNED after ${timeStamp()}s`, {result});
    return result;
  };
  return descriptor;
}
// #endregion

// #REGION === TYPES === ~
// #region -- TYPES ~

declare global {
  type K4TraitType = K4ItemType.advantage | K4ItemType.disadvantage | K4ItemType.darksecret;
}
namespace Archetype {

  export interface TraitData {
    name: string,
    img: string,
    tooltip: string,
    isSelected: boolean,
    isMandatory: boolean;
  }

  export interface StringData {
    value: string,
    examples?: string;
  }

  export interface ArchetypeData<T extends ArchetypeTier = ArchetypeTier> {
    label: K4Archetype & string,
    img: string,
    tier: T,
    [K4ItemType.advantage]: Partial<Record<K4Attribute, Record<string, TraitData>>>,
    selStringAdvantage: Maybe<string>,
    [K4ItemType.disadvantage]: Record<string, TraitData>,
    selStringDisadvantage: Maybe<string>,
    [K4ItemType.darksecret]: Record<string, TraitData>,
    selStringDarkSecret: Maybe<string>,
    isSelected: boolean;
  }

  export type Data = Partial<Record<K4Archetype, ArchetypeData>>;
}

interface ChargenContext {
  archetypeCarousel: Archetype.Data,
  selectedArchetype: Maybe<K4Archetype>,
  attributes: K4AttributeData[],
  // archetypeAdvantages: Maybe<Partial<Record<K4Attribute, Record<string, Archetype.TraitData>>>>,
  // archetypeDisadvantages: Maybe<Record<string, Archetype.TraitData>>,
  // archetypeDarkSecrets: Maybe<Record<string, Archetype.TraitData>>,
  description: Archetype.StringData,
  occupation: Archetype.StringData,
  looks: {
    clothes: Archetype.StringData,
    face: Archetype.StringData,
    eyes: Archetype.StringData,
    body: Archetype.StringData;
  },
  traitNotes: Record<string, {
    traitType: K4TraitType,
    value: string;
  }>,
  otherPlayerData: Record<IDString, ChargenSummary>;
}

export interface ChargenSummary {
  userName: string,
  userColor: string,
  name: string,
  img: string,
  archetype: K4Archetype|"",
  attributes: Partial<Record<K4Attribute, number>>,
  advantages: K4Item[],
  disadvantages: K4Item[],
  darkSecrets: K4Item[],
  description: string,
  occupation: string,
  looks: {
    clothes: string,
    face: string,
    eyes: string,
    body: string;
  },
  traitNotes: Record<string, string>;
}
// #endregion
// #endregion

// #region === CONSTANTS === ~
const TOTAL_WIDTH = PIXELS_PER_ROTATION;
const MIN_X = -TOTAL_WIDTH / 2;
const MAX_X = TOTAL_WIDTH / 2;
// #endregion

/**
 * Top-level flow of control class that conducts the character generation process.
 */
class K4CharGen {

  static _ValidArchetypes: Maybe<K4Archetype[]>;
  static get ValidArchetypes() {
    return this._ValidArchetypes ?? (this._ValidArchetypes = Object.entries(Archetypes)
      .filter(([_, archetype]) => VALID_ARCHETYPE_TIERS.includes(archetype.tier))
      .map(([k4Archetype, _]) => k4Archetype as K4Archetype));
  }

  static _NumValidArchetypes: Maybe<number>;
  static get NumValidArchetypes() {
    return this._NumValidArchetypes ?? (this._NumValidArchetypes = this.ValidArchetypes.length);
  }

  static _ArchetypeIndexMap: Maybe<Map<K4Archetype, number>>;
  static get ArchetypeIndexMap() {
    return this._ArchetypeIndexMap ?? (this._ArchetypeIndexMap = new Map(
      this.ValidArchetypes
        .map((archetype, index) => [archetype, index])
    ));
  }

  static _NormalizedDistanceMap: Maybe<Map<number, number>>;
  static get NormalizedDistanceMap() {
    if (this._NormalizedDistanceMap) {return this._NormalizedDistanceMap;}

    const halfTotal = this.NumValidArchetypes / 2;
    // A map of all possible values of 'boundIndex - selected', and corresponding normalized distance
    const normalizedDistanceMap = new Map<number, number>();

    // Precompute normalized distances for all possible raw distances
    for (let i = 0; i < this.NumValidArchetypes; i++) {
      // Calculate the raw distance as the absolute value of the index
      const rawDistance = Math.abs(i);

      // Adjust the distance to account for wrapping around the circle
      // If the raw distance is greater than half the total, we "count from the opposite direction"
      const distance = rawDistance > halfTotal
        ? this.NumValidArchetypes - rawDistance
        : rawDistance;

      // Normalize the distance by dividing by half the total number of valid archetypes
      const normalizedDistance = distance / halfTotal;

      // Clamp the normalized distance between 0 and 1 and store it in the map
      normalizedDistanceMap.set(i, U.clampNum(normalizedDistance, [0, 1]));
    }

    this._NormalizedDistanceMap = normalizedDistanceMap;
    return this._NormalizedDistanceMap;
  }

  // static _StyleMap: Maybe<Map<number, Record<Key, string | number>>>;
  // static get StyleMap() {
  //   if (this._StyleMap) {return this._StyleMap;}

  //   const styleMap = new Map<number, Record<Key, string | number>>();

  //   const maxBlur = 5; const minBlur = 0;
  //   const maxBright = 0.8; const minBright = 0.5;
  //   const maxOpacity = 1; const minOpacity = 1;
  //   const maxScale = 1; const minScale = 1;
  //   const maxSaturate = 0.8; const minSaturate = 0.25;

  //   for (let i = 0; i < this.NumValidArchetypes; i++) {
  //     const scaleFactor = this.NormalizedDistanceMap.get(i) ?? 0;

  //     const blur = U.gsap.utils.mapRange(0, 1, minBlur, maxBlur, scaleFactor);
  //     const brightness = U.gsap.utils.mapRange(0, 1, minBright, maxBright, scaleFactor);
  //     const opacity = U.gsap.utils.mapRange(0, 1, minOpacity, maxOpacity, scaleFactor);
  //     const scale = U.gsap.utils.mapRange(0, 1, minScale, maxScale, scaleFactor);
  //     const saturate = U.gsap.utils.mapRange(0, 1, minSaturate, maxSaturate, scaleFactor);

  //     styleMap.set(i, {
  //       filter: `blur(${blur}px) brightness(${brightness}) saturate(${saturate})`,
  //       opacity: U.pFloat(opacity, 2),
  //       scale: U.pFloat(scale, 2)
  //     });
  //   }

  //   // Set default style values as fallback
  //   styleMap.set(-1, {
  //     filter: `blur(${minBlur}px) brightness(${minBright}) saturate(${minSaturate})`,
  //     opacity: U.pFloat(minOpacity, 2),
  //     scale: U.pFloat(minScale, 2)
  //   });

  //   this._StyleMap = styleMap;
  //   return this._StyleMap;
  // }

  static _CarouselRadius: Maybe<number>;
  static get CarouselRadius() {
    if (this._CarouselRadius) {return this._CarouselRadius;}

    const radius = Math.round((CAROUSEL_ITEM_WIDTH / 2) / Math.tan(Math.PI / K4CharGen.NumValidArchetypes));
    this._CarouselRadius = radius;
    return this._CarouselRadius;
  }

  static async PostInitialize() {
    if (getUser().isGM) {return;}
    // Preload getters
    this.ValidArchetypes;
    this.NumValidArchetypes;
    this.ArchetypeIndexMap;
    // this.NormalizedDistanceMap;
    // this.StyleMap;
    this.CarouselRadius;

    Object.assign(globalThis, {Archetypes});

    const gmTracker = await K4GMTracker.Get();
    const user = getUser();
    try {
      const userPC = getActor();
      if (gmTracker.isCharGenFinishedFor(userPC)) {
        return;
      }
      userPC.preInitializeCharGen();
    } catch (error) {
      void K4Alert.Alert({
        type: AlertType.simple,
        target: UserTargetRef.gm,
        skipQueue: false,
        header: `User ${user.name} Owns No Character!`,
        body: "You must create a template PC character, and set this user as its owner before character generation can begin."
      });
      return;
    }
  }

  // archetypeData: Map<K4Archetype, Archetype.Data> = new Map<K4Archetype, Archetype.Data>();
  _user: User;
  _userPC: K4Actor<K4ActorType.pc>;
  constructor(user: User, userPC: K4Actor<K4ActorType.pc>) {
    this._user = user;
    this._userPC = userPC;
  }

  get actor(): K4Actor<K4ActorType.pc> {
    return this._userPC;
  }

  get user(): User {
    return this._user;
  }



  wrapIndex(index: number) {
    return ((index % K4CharGen.NumValidArchetypes) + K4CharGen.NumValidArchetypes) % K4CharGen.NumValidArchetypes;
  }

  wrapRotation(rotation: number) {
    return (((rotation) % 360) + 360) % 360;
  }

  wrapXPos(x: number) {
    return U.gsap.utils.wrap(MIN_X, MAX_X)(x);
  }

  // function revealAndReturn(elem$: JQuery) {
  //   elem$.css({
  //     opacity: 0,
  //     visibility: "visible"
  //   });
  //   return elem$;
  // }

  // function hideAndReturn(elem$: JQuery) {
  //   elem$.css({
  //     opacity: 0,
  //     visibility: "hidden"
  //   });
  //   return elem$;
  // }

  getYRotFromIndex(index: number) {
    const boundIndex = this.wrapIndex(index);
    return U.gsap.utils.mapRange(0, K4CharGen.NumValidArchetypes, 0, 360, boundIndex);
  }

  getIndexFromYRot(rotationY: number) {
    const total = K4CharGen.NumValidArchetypes;
    return U.pInt(U.gsap.utils.mapRange(0, 360, 0, total, this.wrapRotation(rotationY)));
  }

  getYRotFromXPos(x: number) {
    const max = PIXELS_PER_ROTATION / 2;
    return U.gsap.utils.mapRange(-max, max, 0, 360, this.wrapXPos(x));
  }

  getXPosFromYRot(rotationY: number) {
    const max = PIXELS_PER_ROTATION / 2;
    return U.gsap.utils.mapRange(0, 360, -max, max, this.wrapRotation(rotationY));
  }

  getXPosFromIndex(index: number) {
    const max = PIXELS_PER_ROTATION / 2;
    const boundIndex = this.wrapIndex(index);
    return U.gsap.utils.mapRange(0, K4CharGen.NumValidArchetypes, -max, max, boundIndex);
  }

  getIndexFromXPos(x: number) {
    const total = K4CharGen.NumValidArchetypes;
    const max = PIXELS_PER_ROTATION / 2;
    return U.pInt(U.gsap.utils.mapRange(-max, max, 0, total, this.wrapXPos(x)));
  }

  getDistanceFromSelected(index: number, selected: number) {
    const boundIndex = this.wrapIndex(index);
    return Math.abs(boundIndex - selected);
  }

  /**
   * Get the normalized distance from the selected index.
   * This function uses precomputed values for efficiency.
   *
   * @param {number} index - The index to calculate the distance for.
   * @returns {number} - The normalized distance from the selected index.
   */
  getNormalizedDistanceFromSelected(index: number, selected: number) {
    // Look up the precomputed normalized distance from the map
    // If the raw distance is not found in the map, return 0 as a fallback
    return K4CharGen.NormalizedDistanceMap.get(this.getDistanceFromSelected(index, selected)) ?? 0;
  }

  // /**
  //  * Get the style values for a given index and selected index.
  //  * This function uses precomputed values for efficiency.
  //  *
  //  * @param {number} index - The index to calculate the styles for.
  //  * @param {number} selected - The selected index.
  //  * @returns {Record<Key, string|number>} - The style values.
  //  */
  // getDistanceStyles(index: number, selected: number): Record<Key, string | number> {
  //   // Look up the precomputed style values from the map
  //   // If the raw distance is not found in the map, return default styles as a fallback
  //   return K4CharGen.StyleMap.get(this.getDistanceFromSelected(index, selected)) ?? K4CharGen.StyleMap.get(-1 /* default */)!;
  // }

  getElementFromArchetype(context$: JQuery, archetype: K4Archetype) {
    return context$.find(`[data-archetype=${archetype}]`);
  }

  getElementFromIndex(context$: JQuery, index: number) {
    const archetype = K4CharGen.ValidArchetypes[index];
    return this.getElementFromArchetype(context$, archetype);
  }

  precomputeTraitData(traitName: string, traitType: K4TraitType, archetype: K4Archetype | false): Archetype.TraitData {
    // kLog.log("getTraitData", traitName, traitType, archetype);
    // Strip "!" prefix (marking mandatory trait) so traitName can retrieve item
    // const {actor} = this;
    traitName = traitName.replace(/^!/g, "");
    const traitItem = getItems().getName(traitName);
    if (!traitItem) {
      throw new Error(`Trait item "${traitName}" not found`);
    }

    const tData: Archetype.TraitData = {
      name: traitName,
      img: (traitItem.img ?? "").replace(/\(|\)/g, ""),
      tooltip: traitItem.shortDesc,
      get isSelected(): boolean {
        return this.isMandatory || getActor().isCharGenSelected(traitName);
      },
      isMandatory: false
    };

    if (archetype !== false) {

      const archetypeData = {...Archetypes[archetype]};

      if (!(traitType in archetypeData)) {
        throw new Error(`Archetype ${archetype} does not have a ${traitType} section`);
      }

      const archetypeTraits = archetypeData[traitType as keyof typeof archetypeData] as string[];

      // Check whether trait is mandatory for this archetype. If so, set isMandatory.
      const nameIfMandatory = `!${traitName}`;

      if (archetypeTraits.includes(nameIfMandatory)) {
        tData.isMandatory = true;
      }
    }

    return tData;
  }

  #precomputeAllTraitData(archetype: K4Archetype, traitType: K4TraitType) {
    if (![
      K4ItemType.advantage,
      K4ItemType.disadvantage,
      K4ItemType.darksecret
    ].includes(traitType)) {
      throw new Error(`Invalid trait type ${traitType} for getArchetypeTraitData`);
    }
    const archetypeTData = [...Archetypes[archetype][traitType]];

    // For advantages, group the trait data by attribute in form Partial<Record<K4Attribute, Record<string, Archetype.TraitData>>>
    if (traitType === K4ItemType.advantage) {
      const tDataByAttribute: Partial<Record<K4CharAttribute | "none", Record<string, Archetype.TraitData>>> = {};
      for (const traitName of archetypeTData) {
        const tData = this.precomputeTraitData(traitName, traitType, archetype);
        const attr = this.getTraitAttribute(traitName) as K4CharAttribute | "none";
        if (!(attr in tDataByAttribute)) {
          tDataByAttribute[attr] = {};
        }
        tDataByAttribute[attr]![traitName] = tData;
      }

      return tDataByAttribute;
    }

    // Otherwise, we just return the Record<string, TraitData> object
    return Object.fromEntries([
      ...archetypeTData
        .map((traitName) => [traitName.replace(/^!/g, ""), this.precomputeTraitData(traitName, traitType, archetype)])
    ]) as Record<string, Archetype.TraitData>;
  }

  archetypeTraitDataMap = new Map<K4Archetype, {
    [K4ItemType.advantage]: Partial<Record<K4CharAttribute, Record<string, Archetype.TraitData>>>,
    [K4ItemType.disadvantage]: Record<string, Archetype.TraitData>,
    [K4ItemType.darksecret]: Record<string, Archetype.TraitData>;
  }>();

  // Method to precompute the trait data for each archetype
  precomputeAllArchetypeTraitData() {
    for (const archetype of K4CharGen.ValidArchetypes) {
      const archetypeTraitData = {
        [K4ItemType.advantage]: this.#precomputeAllTraitData(archetype, K4ItemType.advantage) as Partial<Record<K4CharAttribute, Record<string, Archetype.TraitData>>>,
        [K4ItemType.disadvantage]: this.#precomputeAllTraitData(archetype, K4ItemType.disadvantage) as Record<string, Archetype.TraitData>,
        [K4ItemType.darksecret]: this.#precomputeAllTraitData(archetype, K4ItemType.darksecret) as Record<string, Archetype.TraitData>
      };
      this.archetypeTraitDataMap.set(archetype, archetypeTraitData);
    }
  }

  /**
   * Get the trait data for a given archetype and trait type.
   * This function uses precomputed values for efficiency.
   *
   * @param {K4TraitType} traitType - The type of trait to get data for.
   * @param {K4Archetype} archetype - The archetype to get data for.
   * @param {K4Attribute} [attribute] - The attribute to filter by (optional).
   * @returns {Partial<Record<K4Attribute, Record<string, Archetype.TraitData>>> | Record<string, Archetype.TraitData>} - The trait data.
   */
  getArchetypeTraitData(traitType: K4TraitType, archetype: K4Archetype, attribute?: K4Attribute) {
    if (![
      K4ItemType.advantage,
      K4ItemType.disadvantage,
      K4ItemType.darksecret
    ].includes(traitType)) {
      throw new Error(`Invalid trait type ${traitType} for getArchetypeTraitData`);
    }

    const traitData = this.archetypeTraitDataMap.get(archetype)?.[traitType];

    if (traitType === K4ItemType.advantage) {
      if (attribute) {
        return (traitData as Partial<Record<K4Attribute, Record<string, Archetype.TraitData>>>)[attribute] ?? {};
      }
      return traitData ?? {};
    } else {
      // For disadvantages and dark secrets, we need to append any off-archetype selections made via the more menu
      const offArchetypeSelections = Object.fromEntries([
        ...this.actor.system.charGen[
          traitType === K4ItemType.disadvantage ? "extraDisadvantages" : "extraDarkSecrets"
        ].map((traitName) => [traitName, this.precomputeTraitData(traitName, traitType, false)])
      ]);
      return {...traitData, ...offArchetypeSelections};
    }
  }

  getStringData(dotKey: string, archetype?: K4Archetype): Archetype.StringData {
    // If no archetype provided, try passing dotKey to actor's system data
    if (!archetype) {
      const sData = U.getProp<string>(
        this.actor.system,
        dotKey.replace(/^system\./, "")
      );
      if (sData) {
        return {value: sData};
      }
    }
    archetype = archetype ?? this.actor.archetype;
    if (!archetype) {return {value: ""};}

    const examples = U.getProp<string[]>(Archetypes[archetype], dotKey) ?? [];

    const sData: Archetype.StringData = {
      value: "",
      examples: Array.isArray(examples) ? examples.join(", ") : ""
    };

    return sData;
  }

  getTraitAttribute(traitName: string): K4Attribute {
    const traitItem = getItems().getName(traitName);
    if (!traitItem) {
      throw new Error(`Trait item "${traitName}" not found`);
    }
    return traitItem.attribute || K4Attribute.zero;
  }

  // Precompute archetype data for all valid archetypes
  archetypeDataMap: Map<K4Archetype, Partial<ValOf<typeof Archetypes[keyof typeof Archetypes]>>> = new Map<K4Archetype, Partial<ValOf<typeof Archetypes[keyof typeof Archetypes]>>>();

  precomputeArchetypeData() {
    for (const [archetype, data] of Object.entries(Archetypes) as Array<Tuple<K4Archetype, ValOf<typeof Archetypes>>>) {
      if (!VALID_ARCHETYPE_TIERS.includes(data.tier)) {
        continue;
      }

      this.archetypeDataMap.set(archetype, {
        label: data.label,
        tier: data.tier,
        img: `systems/kult4th/assets/archetypes/${archetype}.png`,
        [K4ItemType.advantage]: this.archetypeTraitDataMap.get(archetype)![K4ItemType.advantage],
        selStringAdvantage: undefined, // Will be computed dynamically
        [K4ItemType.disadvantage]: this.archetypeTraitDataMap.get(archetype)![K4ItemType.disadvantage],
        selStringDisadvantage: undefined, // Will be computed dynamically
        [K4ItemType.darksecret]: this.archetypeTraitDataMap.get(archetype)![K4ItemType.darksecret],
        selStringDarkSecret: undefined, // Will be computed dynamically
        description: data.description,
        occupation: this.getStringData("occupation", archetype),
        looks: {
          clothes: this.getStringData("looks.clothes", archetype),
          face: this.getStringData("looks.face", archetype),
          eyes: this.getStringData("looks.eyes", archetype),
          body: this.getStringData("looks.body", archetype)
        },
      });
    }
  }



  /**
   * Get the archetype carousel data.
   * This function uses precomputed values for efficiency.
   *
   * @returns {Archetype.Data} - The archetype carousel data.
   */
  getArchetypeCarouselData(): Archetype.Data {
    // First filter Archetypes for those tiers allowed in settings
    /**
     * @todo Implement settings to allow multiple Archetype Tiers
     * (currently defaulting to "aware" only)
     */
    return Object.fromEntries(
      (Object.entries(Archetypes) as Array<Tuple<K4Archetype, ValOf<typeof Archetypes>>>)
        .filter(([_archetype, {tier}]) => VALID_ARCHETYPE_TIERS.includes(tier))
        // Map data to match Archetype.Data
        .map(([archetype, data]: [K4Archetype, ValOf<typeof Archetypes>]) => {
          const advTraitData = this.getArchetypeTraitData(K4ItemType.advantage, archetype) as Partial<Record<K4Attribute, Record<string, Archetype.TraitData>>>;
          const advTraitDataArray = Object.values(advTraitData).flatMap(Object.values) as Archetype.TraitData[];
          const advSelected = advTraitDataArray.filter((traitData) => traitData.isMandatory || traitData.isSelected);
          let selStringAdvantage: Maybe<string> = undefined;
          if (advSelected.length > 3) {
            selStringAdvantage = "<span class='neon-glow-animated-red'>Too Many Advantages!</span> <br> (max: #>text-keyword>THREE<#)";
          } else if (advSelected.length === 0) {
            selStringAdvantage = "Choose #>text-keyword>THREE<# from the list below:";
          } else if (advSelected.length < 3) {
            selStringAdvantage = `Choose #>text-keyword>${U.uCase(U.verbalizeNum(3 - advSelected.length))}<# more:`;
          }

          const disTraitData = this.getArchetypeTraitData(K4ItemType.disadvantage, archetype) as Record<string, Archetype.TraitData>;
          const disTraitDataArray: Archetype.TraitData[] = Object.values(disTraitData);
          const disSelected = disTraitDataArray.filter((traitData) => traitData.isMandatory || traitData.isSelected);
          let selStringDisadvantage: Maybe<string> = undefined;
          if (disSelected.length > 2) {
            selStringDisadvantage = "<span class='neon-glow-animated-red'>Too Many Disadvantages!</span> <br> (max: #>text-keyword>TWO<#)";
          } else if (disSelected.length === 0) {
            selStringDisadvantage = "Choose #>text-keyword>TWO<#. Suggestions:";
          } else if (disSelected.length < 2) {
            selStringDisadvantage = `Choose #>text-keyword>${U.uCase(U.verbalizeNum(2 - disSelected.length))}<# more. Suggestions:`;
          }

          const darkSecretTraitData = this.getArchetypeTraitData(K4ItemType.darksecret, archetype) as Record<string, Archetype.TraitData>;
          const darkSecretTraitDataArray: Archetype.TraitData[] = Object.values(darkSecretTraitData);
          const darkSecretSelected = darkSecretTraitDataArray.filter((traitData) => traitData.isMandatory || traitData.isSelected);
          let selStringDarkSecret: Maybe<string> = undefined;
          if (darkSecretSelected.length === 0) {
            selStringDarkSecret = "Choose #>text-keyword>AT LEAST ONE<#. Suggestions:";
          } else {
            selStringDarkSecret = "(You #>text-keyword>MAY<# choose more.)";
          }
          return [
            archetype,
            {
              label: data.label,
              tier: data.tier,
              img: `systems/kult4th/assets/archetypes/${archetype}.png`,
              [K4ItemType.advantage]: advTraitData,
              selStringAdvantage,
              [K4ItemType.disadvantage]: disTraitData,
              selStringDisadvantage,
              [K4ItemType.darksecret]: darkSecretTraitData,
              selStringDarkSecret,
              description: data.description,
              occupation: this.getStringData("occupation", archetype),
              looks: {
                clothes: this.getStringData("looks.clothes", archetype),
                face: this.getStringData("looks.face", archetype),
                eyes: this.getStringData("looks.eyes", archetype),
                body: this.getStringData("looks.body", archetype)
              },
              isSelected: this.actor.archetype === archetype
            }
          ];
        })
    );
  }

  // getArchetypeCarouselData(): Archetype.Data {
  //   // First filter Archetypes for those tiers allowed in settings
  //   /**
  //    * @todo Implement settings to allow multiple Archetype Tiers
  //    * (currently defaulting to "aware" only)
  //    */
  //   return Object.fromEntries(
  //     (Object.entries(Archetypes) as Array<Tuple<K4Archetype, ValOf<typeof Archetypes>>>)
  //       .filter(([_archetype, {tier}]) => VALID_ARCHETYPE_TIERS.includes(tier))
  //       // Map data to match Archetype.Data
  //       .map(([archetype, data]: [K4Archetype, ValOf<typeof Archetypes>]) => {
  //         const advTraitData = this.getArchetypeTraitData(K4ItemType.advantage, archetype) as Partial<Record<K4Attribute, Record<string, Archetype.TraitData>>>;
  //         const advTraitDataArray = Object.values(advTraitData).flatMap(Object.values) as Archetype.TraitData[];
  //         const advSelected = advTraitDataArray.filter((traitData) => traitData.isMandatory || traitData.isSelected);
  //         let selStringAdvantage: Maybe<string> = undefined;
  //         if (advSelected.length > 3) {
  //           selStringAdvantage = "<span class='neon-glow-animated-red'>Too Many Advantages!</span> <br> (max: #>text-keyword>THREE<#)";
  //         } else if (advSelected.length === 0) {
  //           selStringAdvantage = "Choose #>text-keyword>THREE<# from the list below:";
  //         } else if (advSelected.length < 3) {
  //           selStringAdvantage = `Choose #>text-keyword>${U.uCase(U.verbalizeNum(3 - advSelected.length))}<# more:`;
  //         }

  //         const disTraitData = this.getArchetypeTraitData(K4ItemType.disadvantage, archetype) as Record<string, Archetype.TraitData>;
  //         const disTraitDataArray: Archetype.TraitData[] = Object.values(disTraitData);
  //         const disSelected = disTraitDataArray.filter((traitData) => traitData.isMandatory || traitData.isSelected);
  //         let selStringDisadvantage: Maybe<string> = undefined;
  //         if (disSelected.length > 2) {
  //           selStringDisadvantage = "<span class='neon-glow-animated-red'>Too Many Disadvantages!</span> <br> (max: #>text-keyword>TWO<#)";
  //         } else if (disSelected.length === 0) {
  //           selStringDisadvantage = "Choose #>text-keyword>TWO<#. Suggestions:";
  //         } else if (disSelected.length < 2) {
  //           selStringDisadvantage = `Choose #>text-keyword>${U.uCase(U.verbalizeNum(2 - disSelected.length))}<# more. Suggestions:`;
  //         }

  //         const darkSecretTraitData = this.getArchetypeTraitData(K4ItemType.darksecret, archetype) as Record<string, Archetype.TraitData>;
  //         const darkSecretTraitDataArray: Archetype.TraitData[] = Object.values(darkSecretTraitData);
  //         const darkSecretSelected = darkSecretTraitDataArray.filter((traitData) => traitData.isMandatory || traitData.isSelected);
  //         let selStringDarkSecret: Maybe<string> = undefined;
  //         if (darkSecretSelected.length === 0) {
  //           selStringDarkSecret = "Choose #>text-keyword>AT LEAST ONE<#. Suggestions:";
  //         } else {
  //           selStringDarkSecret = "(You #>text-keyword>MAY<# choose more.)";
  //         }
  //         return [
  //           archetype,
  //           {
  //             label: data.label,
  //             tier: data.tier,
  //             img: `systems/kult4th/assets/archetypes/${archetype}.png`,
  //             [K4ItemType.advantage]: this.getArchetypeTraitData(K4ItemType.advantage, archetype),
  //             selStringAdvantage,
  //             [K4ItemType.disadvantage]: this.getArchetypeTraitData(K4ItemType.disadvantage, archetype),
  //             selStringDisadvantage,
  //             [K4ItemType.darksecret]: this.getArchetypeTraitData(K4ItemType.darksecret, archetype),
  //             selStringDarkSecret,
  //             description: data.description,
  //             occupation: this.getStringData("occupation", archetype),
  //             looks: {
  //               clothes: this.getStringData("looks.clothes", archetype),
  //               face: this.getStringData("looks.face", archetype),
  //               eyes: this.getStringData("looks.eyes", archetype),
  //               body: this.getStringData("looks.body", archetype)
  //             },
  //             isSelected: this.actor.archetype === archetype
  //           }
  //         ];
  //       })
  //   );
  // }

  chargenContext(): ChargenContext {

    /**
     * flagSpace: {
     *   [arch: Archetype]: {
     *     isSelected: boolean,
     *     K4ItemType.advantage: Record<advantageName, boolean>,
     *     K4ItemType.disadvantage: Record<advantageName, boolean>,
     *     occupation: string,
     *     looks: {
     *       clothes: string,
     *       face: string,
     *       eyes: string,
     *       body: string
     *     }
     *   },
     *   locked: {
     *     K4ItemType.advantage: Record<advantageName, boolean> // (obviously will only appear if Archetype doesn't filter it out)
     *   }
     * }
     *
     *
     * (CONTEXT) {
     *   selectedArchetype: Archetype,
     *   K4ItemType.advantage: {
     *     K4Attribute.violence: {
     *       [advantageName]: {
     *          name: string,
     *          img: string,
     *          tooltip: string,
     *          isSelected: boolean,
     *          isSetByLock: boolean
     *       }
     *     }
     *   },
     *
     *
     *   occupation: {
     *     value: string,
     *     examples: string[],
     *     isValueAnExample: boolean,
     *     isSetByLock: boolean
     *   }
     *
     *
     * }
     */
    const selectedArchetype = this.actor.archetype;

    /** == COMPILE DATA FROM OTHER PLAYERS == **/
    const thisUser = getUser();
    const otherUsers = getUsers()
      .filter((user) => user.id !== thisUser.id);
    const [
      _gmUsers,
      otherPlayerUsers
    ] = U.partition<User>(otherUsers, (user) => user.isGM);

    const otherPlayerData = Object.fromEntries(otherPlayerUsers
      .map((user) => {
        const actor = K4Actor.GetCharacter(user);
        if (actor) {
          return [actor.id, actor.chargenSheet.chargenSummary];
        }
        return false;
      })
      .filter(Boolean) as Array<[IDString, ChargenSummary]>);

    return {
      archetypeCarousel: this.getArchetypeCarouselData(),
      selectedArchetype,
      attributes: this.actor.attributeData,
      traitNotes: this.traitNotes,
      // archetypeAdvantages: selectedArchetype
      //   ? this.getArchetypeTraitData(K4ItemType.advantage, selectedArchetype)
      //   : undefined,
      // archetypeDisadvantages: (selectedArchetype
      //   ? this.getArchetypeTraitData(K4ItemType.disadvantage, selectedArchetype)
      //   : undefined) as Maybe<Record<string, Archetype.TraitData>>,
      // archetypeDarkSecrets: (selectedArchetype
      //   ? this.getArchetypeTraitData(K4ItemType.darksecret, selectedArchetype)
      //   : undefined) as Maybe<Record<string, Archetype.TraitData>>,
      description: this.getStringData("description"),
      occupation: this.getStringData("occupation"),
      looks: {
        clothes: this.getStringData("looks.clothes", selectedArchetype),
        face: this.getStringData("looks.face", selectedArchetype),
        eyes: this.getStringData("looks.eyes", selectedArchetype),
        body: this.getStringData("looks.body", selectedArchetype)
      },
      otherPlayerData
    };
  }

  get chargenSummary(): ChargenSummary {

    return {
        name: this.actor.name,
        img: this.actor.img ?? CONST.DEFAULT_TOKEN,
        userName: this.actor.user?.name ?? "",
        userColor: this.actor.user?.color ?? "",
        archetype: this.actor.archetype ?? "",
        attributes: this.actor.attributes,
        ...this.actor.getCharGenSelected(),
        description: this.actor.system.description,
        occupation: this.actor.system.occupation,
        looks: this.actor.system.looks,
        traitNotes: this.actor.system.charGen.traitNotes
    };
  }

  // _chargenSummaries: Record<IDString, ChargenSummary> = {};


  get traitNotes(): Record<string, {traitType: K4TraitType, value: string;}> {
    const selectedArchetype = this.actor.archetype;

    const archetypeCarousel = this.getArchetypeCarouselData();
    const selTraits: Array<{traitType: K4TraitType, traitName: string;}> = [];

    const traitNotes: Record<string, {traitType: K4TraitType, value: string;}> = {};
    if (selectedArchetype) {
      const selArchetypeData = archetypeCarousel[selectedArchetype]!;
      [K4ItemType.advantage, K4ItemType.disadvantage, K4ItemType.darksecret].forEach((traitType) => {
        const traitData = selArchetypeData[traitType as K4TraitType];
        const traitKeys = Object.keys(traitData);
        const selectedTraits = traitKeys.filter((key) => this.actor.isCharGenSelected(key, selectedArchetype));
        selTraits.push(...selectedTraits.map((key) => ({
          traitType: traitType as K4TraitType,
          traitName: key
        })));
      });
      kLog.log("[K4CharGen] selTraits Filtered", {selTraits: [...selTraits], selArchetypeData, selectedArchetype});
      for (const {traitType, traitName} of selTraits) {
        if (traitType === K4ItemType.darksecret) {
          traitNotes[traitName] = {
            traitType,
            value: this.actor.system.charGen.traitNotes[traitName] ?? ""
          };
        }
      }
    }
    return traitNotes;
  }

  // _minDistanceStyles: Maybe<Record<Key, string | number>> = undefined;
  // _maxDistanceStyles: Maybe<Record<Key, string | number>> = undefined;

  // get minDistanceStyles(): Record<Key, string | number> {
  //   if (!this._minDistanceStyles) {
  //     this._minDistanceStyles = this.getDistanceStyles(0, 0);
  //   }
  //   return this._minDistanceStyles;
  // }
  // get maxDistanceStyles(): Record<Key, string | number> {
  //   if (!this._maxDistanceStyles) {
  //     this._maxDistanceStyles = this.getDistanceStyles(0, Math.floor(K4CharGen.NumValidArchetypes / 2));
  //   }
  //   return this._maxDistanceStyles;
  // }

  _element: Maybe<JQuery>;
  get element(): JQuery {
    if (!this._element || this._element.length === 0) {
      this._element = $("#gamephase-overlay .overlay-chargen");
    }
    if (!this._element.length) {
      throw new Error("Cannot find element for K4CharGen. Chargen overlay not found.");
    }
    return this._element;
  }

  // For immediate user feedback, fade in the bg container and the sheet immediately.
  // #getTimeline_revealCarouselBaseBackground(): gsap.core.Timeline {
  //   const bgContainer$ = this.element.find(".pc-initialization-bg");

  //   return U.gsap.timeline()
  //     .to([this.element, bgContainer$], {
  //       autoAlpha: 1,
  //       duration: 0.25,
  //       ease: "power2.out"
  //     });
  // }

  #getTimeline_revealCarouselBackground(): gsap.core.Timeline {
    const container$ = this.element.find(".pc-initialization-bg");
    const mid$ = container$.find(".cityscape-mid");
    const clouds$ = container$.find(".cloud-bg");
    const fore$ = container$.find(".cityscape-fore");

    // kLog.log("[K4PCSheet] #getTimeline_revealCarouselBackground", {container$, mid$, clouds$, fore$});

    // Construct timeline for revealing the background buildings & clouds.
    const tl = U.gsap.timeline({defaults: {ease: "power2.inOut"}})
      .to([this.element, container$], {
        autoAlpha: 1,
        duration: 0.25,
        ease: "power2.out"
      })
      .to(clouds$, {opacity: 0.75, ease: "power2.in", duration: 1}, 0)
      .fromTo(fore$, {autoAlpha: 0}, {autoAlpha: 1, duration: 2}, 1)
      .fromTo(mid$, {autoAlpha: 0}, {autoAlpha: 1, duration: 2}, 2)
      .fromTo(fore$, {filter: "blur(20px) brightness(0)"}, {filter: "blur(1px) brightness(0.8)", duration: 6}, 0)
      .fromTo(fore$, {y: 250, scale: 1}, {y: 150, scale: 1.15, ease: "expoScale(1, 1.15, power2.inOut)", duration: 6}, 0)
      .fromTo(mid$, {y: 200, scale: 0.85}, {y: 150, scale: 1, ease: "expoScale(0.85, 1, power2.inOut)", duration: 6}, 0)
      .fromTo(mid$, {filter: "blur(40px) brightness(0)"}, {filter: "blur(2px) brightness(1)", duration: 6}, 0);

    kLog.log("[K4PCSheet] #getTimeline_revealCarouselBackground", {tl});

    return tl;
  }

  #getTimeline_revealCarouselScene(carouselStaggerDuration = 1): gsap.core.Timeline {
    const container$ = this.element.find(".pc-initialization");
    const carouselScene$ = this.element.find(".archetype-staging");

    const selArchetype = this.actor.archetype ?? K4Archetype.academic;
    const selIndex = K4CharGen.ArchetypeIndexMap.get(selArchetype)!;

    const attributesPanel$ = container$.find(".archetype-panel.attributes");
    const notesPanel$ = container$.find(".archetype-panel.notes");
    const namePanel$ = container$.find(".archetype-panel.actor-name");
    const items$ = carouselScene$.find(".archetype-carousel-item");

    const MAX_DELAY = carouselStaggerDuration;
    const STAGGER_SHIFT = MAX_DELAY / K4CharGen.NumValidArchetypes / 2;
    const delayFunc = U.gsap.utils.mapRange(0, 1, 0, MAX_DELAY);

    const getDelayFromIndex = (index: number) => {
      const nextDistRatio = 1 - this.getNormalizedDistanceFromSelected(this.wrapIndex(index + 1), selIndex);
      const thisDistRatio = 1 - this.getNormalizedDistanceFromSelected(index, selIndex);
      const distRatio = thisDistRatio + (nextDistRatio > thisDistRatio ? STAGGER_SHIFT : 0);
      // const delay = U.gsap.utils.mapRange(0, 1, 0, MAX_DELAY);
      // kLog.log(`[K4PCSheet] Delay (MAX: ${MAX_DELAY}): index '${index}' -> ${nextDistRatio > thisDistRatio ? `[STAGGER: '${STAGGER_SHIFT}']` : ""} distRatio '${distRatio}' -> delay '${delay}'`);
      return delayFunc(distRatio);
    };

    return U.gsap.timeline()
      .call(() => {
        this.updateArchetypeExamples(container$);
      })
      .fromTo(carouselScene$, {
        autoAlpha: 0,
        y: 0,
        scale: 0.7,
        filter: "blur(100px)"
      }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        ease: "power3.out",
        duration: 1
      }, 0)
      .fromTo(container$, {
        autoAlpha: 0,
        filter: "blur(10px)",
        backgroundPosition: "50% 620px, 50% 630px"
      }, {
        autoAlpha: 1,
        filter: "blur(0px)",
        backgroundPosition: "50% 620px, 50% 630px",
        duration: 0.5,
        ease: "none"
      }, 0)
      .fromTo(items$, {
        autoAlpha: 0,
        y: 0,
        scale: 1
      }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        ease: "power2",
        duration: 1,
        delay: getDelayFromIndex
      })
      .fromTo([
        attributesPanel$,
        namePanel$,
        notesPanel$
      ], {
        autoAlpha: 0,
        y: 200
      }, {
        autoAlpha: 1,
        y: 0,
        ease: "power2",
        duration: 1,
        stagger: 0.2
      }, 0);
  }

  // #getTimeline_archetypeStyle_OLD(archetype$: JQuery): gsap.core.Timeline {

  //   if (archetype$.data("archetypeStyleTimeline")) {
  //     return archetype$.data("archetypeStyleTimeline");
  //   }

  //   const archetype = archetype$.attr("data-archetype") as Maybe<K4Archetype>;
  //   if (!archetype) {
  //     throw new Error(`No archetype found for K4PCSheet: ${String(archetype$)}`);
  //   }

  //   const self = this;

  //   const archetypeGreyscaleImg$ = archetype$.find(".archetype-carousel-img.greyscale");

  //   const archetypePanels$ = archetype$.closest(".pc-initialization").find(`.archetype-panels[data-archetype="${archetype}"]`);
  //   const archetypeNamePanel$ = archetypePanels$.find(".archetype-panel-name");
  //   const archetypeThe$ = archetypeNamePanel$.find(".archetype-carousel-the");
  //   const archetypeName$ = archetypeNamePanel$.find(".archetype-carousel-name");
  //   const archetypeDescription$ = archetypePanels$.find(".archetype-panel-description");
  //   const archetypeAdvantages$ = archetypePanels$.find(".archetype-panel-advantages");
  //   const archetypeDisadvantages$ = archetypePanels$.find(".archetype-panel-disadvantages");
  //   const archetypeDarkSecrets$ = archetypePanels$.find(".archetype-panel-darksecrets");

  //   // If not done already, split the description into individual lines
  //   let splitDescription = archetype$.data("splitDescription");
  //   if (!splitDescription) {
  //     // revealAndReturn(archetypeDescription$);
  //     splitDescription = new SplitText(archetypeDescription$, {type: "lines"});
  //     archetype$.data("splitDescription", splitDescription);
  //     // hideAndReturn(archetypeDescription$);
  //   }


  //   const tl = U.gsap.timeline({
  //     paused: true
  //   })
  //     .addLabel("dark")
  //     // .fromTo(archetypeGreyscaleImg$, {
  //     //   // opacity: this.maxDistanceStyles.opacity,
  //     //   // filter: this.maxDistanceStyles.filter,
  //     //   autoAlpha: 1
  //     // }, {
  //     //   // opacity: this.minDistanceStyles.opacity,
  //     //   // filter: this.minDistanceStyles.filter,
  //     //   autoAlpha: 1,
  //     //   duration: 1,
  //     //   ease: "none"
  //     // })
  //     .addLabel("light", 1)
  //     // .set(archetype$, {filter: "none"})
  //     .set(archetypeGreyscaleImg$, {autoAlpha: 0}, 1)
  //     .call(() => {
  //       CONFIG.K4.charGenIsShowing = archetype;
  //       self.updateArchetypeExamples(undefined, archetype);
  //     }, [], "<")
  //     .fromTo(archetype$, {
  //       scale: 1,
  //       // opacity: 1,
  //       autoAlpha: 1
  //     }, {
  //       scale: 1.15,
  //       // opacity: 1,
  //       autoAlpha: 1,
  //       duration: 2,
  //       ease: "power2"
  //     }, 1)
  //     // .fromTo(archetypeImg$, {
  //     // }, {
  //     //   filter: "brightness(1.25) saturate(1)",
  //     //   duration: 2,
  //     //   ease: "power2"
  //     // }, "<")
  //     .set([archetypeNamePanel$, archetypeDescription$], {
  //       visibility: "visible",
  //       opacity: 1
  //     }, 1)
  //     .fromTo([
  //       archetypeThe$,
  //       archetypeName$,
  //       ...splitDescription.lines
  //     ], {
  //       autoAlpha: 0,
  //       x: -100,
  //       // skewX: -65,
  //       // filter: "blur(15px)"
  //     }, {
  //       autoAlpha: 1,
  //       // skewX: 0,
  //       x(this: gsap.core.Timeline, index: number) {
  //         // index = Math.max(0, index - 2);
  //         return gsap.utils.random(0, index * 5);
  //         // return index * 5 + gsap.utils.random(-10, 10);
  //       },
  //       // filter: "blur(0px)",
  //       ease: "power2",
  //       duration: 2,
  //       stagger: {
  //         each: 0.25
  //       }
  //     }, "<")
  //     .fromTo([
  //       archetypeAdvantages$,
  //       archetypeDisadvantages$,
  //       archetypeDarkSecrets$
  //     ], {
  //       autoAlpha: 0,
  //       y: 200
  //     }, {
  //       autoAlpha: 1,
  //       y: 0,
  //       ease: "power2",
  //       onStart() {
  //         const archetypeData = self.getArchetypeCarouselData()[archetype];
  //         if (!archetypeData) {
  //           throw new Error(`No archetype data found for archetype: ${archetype}`);
  //         }
  //         void self.#reRenderTraitPanel(archetype$, archetypeData);
  //       },
  //       duration: 2,
  //       stagger: {
  //         amount: 0.25
  //       }
  //     }, "<")
  //     .addLabel("selected");

  //   // tl.seek("light");

  //   return tl;
  // }

  #getTimeline_archetypeStyle(archetype$: JQuery): gsap.core.Timeline {
  // #getTimeline_archetypeStyle(archetype$: JQuery): Promise<{ timeline: gsap.core.Timeline }> {
    if (archetype$.data("archetypeStyleTimeline")) {
      // return Promise.resolve({timeline: archetype$.data("archetypeStyleTimeline")});
      return archetype$.data("archetypeStyleTimeline");
    }

    const archetype = archetype$.attr("data-archetype") as Maybe<K4Archetype>;
    if (!archetype) {
      throw new Error(`No archetype found for K4PCSheet: ${String(archetype$)}`);
    }
    kLog.log(`Starting timeline creation for archetype: ${archetype}`);
    const self = this;

    // Pre-select all elements at once to reduce DOM queries
    // const elements = {
    //   archetypeGreyscaleImg: archetype$.find(".archetype-carousel-img.greyscale"),
    //   archetypePanels: archetype$.closest(".pc-initialization").find(`.archetype-panels[data-archetype="${archetype}"]`),
    //   archetypeNamePanel: null as JQuery | null,
    //   archetypeThe: null as JQuery | null,
    //   archetypeName: null as JQuery | null,
    //   archetypeDescription: null as JQuery | null,
    //   archetypeAdvantages: null as JQuery | null,
    //   archetypeDisadvantages: null as JQuery | null,
    //   archetypeDarkSecrets: null as JQuery | null
    // };

    // Defer some element selections until they're needed
    // const getElement = (key: keyof typeof elements) => {
    //   if (!elements[key]) {
    //     switch (key) {
    //       case 'archetypeNamePanel':
    //         elements[key] = elements.archetypePanels.find(".archetype-panel-name");
    //         break;
    //       case 'archetypeThe':
    //         elements[key] = elements.archetypeNamePanel!.find(".archetype-carousel-the");
    //         break;
    //       case 'archetypeName':
    //         elements[key] = elements.archetypeNamePanel!.find(".archetype-carousel-name");
    //         break;
    //       case 'archetypeDescription':
    //         elements[key] = elements.archetypePanels.find(".archetype-panel-description");
    //         break;
    //       case 'archetypeAdvantages':
    //         elements[key] = elements.archetypePanels.find(".archetype-panel-advantages");
    //         break;
    //       case 'archetypeDisadvantages':
    //         elements[key] = elements.archetypePanels.find(".archetype-panel-disadvantages");
    //         break;
    //       case 'archetypeDarkSecrets':
    //         elements[key] = elements.archetypePanels.find(".archetype-panel-darksecrets");
    //         break;
    //     }
    //   }
    //   return elements[key]!;
    // };

    // return new Promise<{ timeline: gsap.core.Timeline }>((resolve) => {
      const archetypeGreyscaleImg$ = archetype$.find(".archetype-carousel-img.greyscale");

      const archetypePanels$ = archetype$.closest(".pc-initialization").find(`.archetype-panels[data-archetype="${archetype}"]`);
      const archetypeNamePanel$ = archetypePanels$.find(".archetype-panel-name");
      const archetypeThe$ = archetypeNamePanel$.find(".archetype-carousel-the");
      const archetypeName$ = archetypeNamePanel$.find(".archetype-carousel-name");
      const archetypeDescription$ = archetypePanels$.find(".archetype-panel-description");
      const archetypeAdvantages$ = archetypePanels$.find(".archetype-panel-advantages");
      const archetypeDisadvantages$ = archetypePanels$.find(".archetype-panel-disadvantages");
      const archetypeDarkSecrets$ = archetypePanels$.find(".archetype-panel-darksecrets");

    const tl = U.gsap.timeline({
      paused: true
    })
      .addLabel("dark")
      .fromTo(archetypeGreyscaleImg$, {
        // opacity: this.maxDistanceStyles.opacity,
        // filter: this.maxDistanceStyles.filter,
        autoAlpha: 1
      }, {
        // opacity: this.minDistanceStyles.opacity,
        // filter: this.minDistanceStyles.filter,
        autoAlpha: 1,
        duration: 1,
        ease: "none"
      })
      .addLabel("light")
      // .set(archetype$, {filter: "none"})
      .set(archetypeGreyscaleImg$, {autoAlpha: 0})
      .call(() => {
        CONFIG.K4.charGenIsShowing = archetype;
        self.updateArchetypeExamples(undefined, archetype);
      })
      .fromTo(archetype$, {
        scale: 1,
        // opacity: 1,
        autoAlpha: 1
      }, {
        scale: 1.15,
        // opacity: 1,
        autoAlpha: 1,
        duration: 2,
        ease: "power2"
      })
      // .fromTo(archetypeImg$, {
      // }, {
      //   filter: "brightness(1.25) saturate(1)",
      //   duration: 2,
      //   ease: "power2"
      // }, "<")
      .set([archetypeNamePanel$], {
        visibility: "visible",
        opacity: 1
      })
      .fromTo([
        archetypeThe$,
        archetypeName$,
        archetypeDescription$
        // ...splitDescription.lines
      ], {
        autoAlpha: 0,
        x: -100,
        // skewX: -65,
        // filter: "blur(15px)"
      }, {
        autoAlpha: 1,
        // skewX: 0,
        x(this: gsap.core.Timeline, index: number) {
          index = Math.max(0, index - 2);
          return gsap.utils.random(0, index * 5);
          // return index * 5 + gsap.utils.random(-10, 10);
        },
        // filter: "blur(0px)",
        ease: "power2",
        duration: 2,
        stagger: {
          each: 0.25
        }
      }, "<")
      .fromTo([
        archetypeAdvantages$,
        archetypeDisadvantages$,
        archetypeDarkSecrets$
      ], {
        autoAlpha: 0,
        y: 200
      }, {
        autoAlpha: 1,
        y: 0,
        ease: "power2",
        onStart() {
          const archetypeData = self.getArchetypeCarouselData()[archetype];
          if (!archetypeData) {
            throw new Error(`No archetype data found for archetype: ${archetype}`);
          }
          void self.#reRenderTraitPanel(archetype$, archetypeData);
        },
        duration: 3,
        stagger: {
          amount: 0.25
        }
      }, "<")
      .addLabel("selected");

    // tl.seek("light");

    // archetype$.data("archetypeStyleTimeline", tl);

    return tl;
  }

  #getTimeline_revealCarousel(): gsap.core.Timeline {
  // async #getTimeline_revealCarousel(): Promise<{timeline: gsap.core.Timeline}> {
    // const {timeline: selectedArchetypeTimeline} = await this.#getTimeline_archetypeStyle(this.element.find(`.archetype-carousel-item[data-archetype="${this.actor.archetype ?? K4Archetype.academic}"]`));
    const selectedArchetypeTimeline = this.#getTimeline_archetypeStyle(this.element.find(`.archetype-carousel-item[data-archetype="${this.actor.archetype ?? K4Archetype.academic}"]`));
    // return {timeline: U.gsap.timeline({paused: true})
    return U.gsap.timeline({paused: true})
      .add(this.#getTimeline_revealCarouselBackground())
      .add(this.#getTimeline_revealCarouselScene())
      .add(selectedArchetypeTimeline.tweenTo(selectedArchetypeTimeline.duration(), {duration: 3}).play(), "-=1");
  }

  #getTimeline_traitSelection(traitContainer$: JQuery): gsap.core.Timeline {

    const self = this;

    // Extracts path data string for an ease curve, converting into a simple list of x,y points
    function getEaseSVGData(easeCurve: gsap.EaseFunction) {
      return (CustomEase.getSVGData(easeCurve, {
        width: 1,
        height: 1,
        invertY: true // Keep this true to match SVG coordinate system
      }) as string)
        // The ease string starts with 'M' but contains nothing else except digits and commas:
        .replace(/C/g, "")
        .replace(/ /g, ",");
    }
    // Extracts point pairs of an ease curve
    function getEasePoints(easeCurve: gsap.EaseFunction, steps?: number): Array<Tuple<number>> {
      const points: Array<Tuple<number>> = [];
      if (typeof steps === 'number' && steps > 0) {
        // If steps is provided, sample the ease at regular intervals
        const easeFunc = typeof easeCurve === 'string' ? gsap.parseEase(easeCurve) : easeCurve;
        for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          points.push([progress, easeFunc(progress)]);
        }
        return points;
      } else {
        // If steps is not provided, use the original SVG data parsing method
        const easeData = getEaseSVGData(easeCurve);
        const allValues = easeData.split(/[M,]/).filter(v => v.trim()).map(Number);
        for (let i = 0; i < allValues.length; i += 2) {
          points.push([allValues[i], allValues[i + 1]]);
        }
        return points;
      }
    }
    // Given a list of point pairs, returns {minX, maxX, minY, maxY}
    function getMaxAndMin(points: Array<Tuple<number>>) {
      const xPoints = points.map((p) => p[0]);
      const yPoints = points.map((p) => p[1]);
      return {
        minX: Math.min(0, ...xPoints),
        maxX: Math.max(1, ...xPoints),
        minY: Math.min(0, ...yPoints),
        maxY: Math.max(1, ...yPoints)
      };
    }
    // Given a list of point pairs, will normalize the points to between 0 and 1
    function normalizePoints(points: Array<Tuple<number>>): Array<Tuple<number>> {
      const {minX, maxX, minY, maxY} = getMaxAndMin(points);
      const xMapper = gsap.utils.mapRange(minX, maxX, 0, 1);
      const yMapper = gsap.utils.mapRange(minY, maxY, 0, 1);
      return points.map(([xPoint, yPoint]) => [xMapper(xPoint), yMapper(yPoint)]);
    }
    // Converts point pairs back to string representation of an ease curve
    function getEaseStringFromPoints(points: Array<Tuple<number>>) {
      return `M${points.flat().join(",")}`;
    }

    // Function to create a wiggle ease
    function createWiggleEase(wiggles = 100) {
      const ease = CustomWiggle.create("my-wiggle", { //name
        wiggles,
        type: "random"
      });
      const points = getEasePoints(ease);
      const normalizedPoints = normalizePoints(points);
      const normalizedEaseString = getEaseStringFromPoints(normalizedPoints);
      const normalizedEase = CustomEase.create(`wiggle-${wiggles}`, normalizedEaseString);

      return normalizedEase;
    }

    function createControlledWiggleEase(controlEase: gsap.EaseFunction | string, steps = 100): gsap.EaseFunction {
      controlEase = typeof controlEase === "string" ? gsap.parseEase(controlEase) : controlEase;

      // Create the wiggle ease
      const wiggleEase = createWiggleEase(steps);

      // Extract the points from the wiggle ease
      const wigglePoints = getEasePoints(wiggleEase, steps);

      // Extract the points from the control ease
      const controlPoints = getEasePoints(controlEase, steps);

      // The control ease determines the threshold for the final ease to be 0 or 1:
      const controlledWigglePoints: Array<Tuple<number>> = wigglePoints.map(([wX, wY], i) => {
        const cY = controlPoints[i][1];
        if (cY >= wY) {return [wX, cY];}
        return [wX, 0];
      });

      const controlledWiggleEase = CustomEase.create(`controlledWiggle-${steps}`, getEaseStringFromPoints(controlledWigglePoints));

      // console.log("CONTROLLED WIGGLE EASE", {wigglePoints, controlPoints, controlledWigglePoints});

      return controlledWiggleEase;
    }

    const glowColors: Partial<Record<K4ItemType, string>> = {
      [K4ItemType.advantage]: "neon-glow-animated-gold",
      [K4ItemType.disadvantage]: "neon-glow-animated-red",
      [K4ItemType.darksecret]: "neon-glow-animated-white"
    };
    const traitType = traitContainer$.attr("data-trait-type") as keyof typeof glowColors;
    const glowClass = glowColors[traitType] ?? "";

    let tl = traitContainer$.data("traitSelectionTimeline") as Maybe<gsap.core.Timeline>;
    if (!tl) {
      const traitName$ = traitContainer$.find(".archetype-trait-name");
      const splitTraitName = traitContainer$.data("splitTraitName") as Maybe<SplitText> ?? new SplitText(traitName$, {type: "chars"});
      traitContainer$.data("splitTraitName", splitTraitName);

      const actor = this.actor;
      const trait = traitContainer$.attr("data-trait")!;

      tl = U.gsap.timeline({
        paused: true,
        onReverseComplete() {
          actor.charGenDeselect(trait).then(() => {
            void K4Socket.Call("CharChange_Trait", UserTargetRef.other, getUser().id, actor.id, traitType, trait, false);
          }).catch((err: unknown) => {
            kLog.error(`[K4CharGen] #attachListeners_trait: Error deselecting trait: ${String(err)}`);
          });
          traitContainer$.attr("data-is-selected", "false");
          traitContainer$.removeClass(glowClass);
          void self.reRenderTraitNotesPanels();
        }
      });
      tl
        .addLabel("unselected")
        .to(splitTraitName.chars, {
          color: "rgb(255, 255, 255)",
          fontWeight: 700,
          // textShadow: "0 0 3px rgb(255, 255, 255)",
          ease: createControlledWiggleEase("power2.in", 200),
          duration: 2,
          stagger: {
            each: 0.05,
            ease: "power3.out"
          },
          clearProps: "textShadow"
        })
        .call(() => {
          if (!tl!.reversed()) {
            void actor.charGenSelect(trait);
            traitContainer$.attr("data-is-selected", "true");
            traitContainer$.addClass(glowClass);
            void self.reRenderTraitNotesPanels();
          }
        })
        .addLabel("selected");
    }

    traitContainer$.data("traitSelectionTimeline", tl);
    return tl;
  }

  #attachListeners_trait(traitContainer$: JQuery) {
    const trait = traitContainer$.attr("data-trait");
    if (!trait) {
      throw new Error("[K4CharGen] #attachListeners_trait: Trait is undefined");
    }
    let clickTimer: NodeJS.Timeout | null = null;
    let longPressTriggered = false;
    const glowColors: Partial<Record<K4TraitType, string>> = {
      [K4ItemType.advantage]: "neon-glow-animated-gold",
      [K4ItemType.disadvantage]: "neon-glow-animated-red",
      [K4ItemType.darksecret]: "neon-glow-animated-white"
    };
    const traitType = traitContainer$.attr("data-trait-type") as keyof typeof glowColors;

    if (traitContainer$.attr("data-is-mandatory") === "true" || traitContainer$.attr("data-is-selected") === "true") {
      const tl = this.#getTimeline_traitSelection(traitContainer$);
      void tl.progress(1);
    }

    traitContainer$.on({
      mousedown: () => {
        const isMandatory = traitContainer$.attr("data-is-mandatory") === "true";
        if (isMandatory) {return;}
        const isSelected = traitContainer$.attr("data-is-selected") === "true";
        longPressTriggered = false;
        clickTimer = setTimeout(() => {
          longPressTriggered = true;
        }, 500);
        const tl = this.#getTimeline_traitSelection(traitContainer$);
        kLog.log("MOUSE DOWN", {tl, isSelected, isMandatory, trait, longPressTriggered, clickTimer});
        if (isSelected) {
          // traitContainer$.removeClass(glowClass);
          tl.timeScale(1).reverse();
        } else {
          tl.seek(0.5).timeScale(1).play();
        }
      },
      mouseup: () => {
        const isMandatory = traitContainer$.attr("data-is-mandatory") === "true";
        if (isMandatory) {return;}
        const tl = this.#getTimeline_traitSelection(traitContainer$);
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
        if (tl.isActive()) {
          if (tl.reversed()) {
            tl.timeScale(1).play();
          } else {
            // traitContainer$.removeClass(glowClass);
            tl.timeScale(1).reverse();
          }
        }
      },
      click: async () => {
        if (longPressTriggered) {return;}
        const traitItem = getGame().items.getName(trait) as Maybe<K4Item>;
        if (!traitItem) {return;}
        // Scan the <body> element for all `.k4-item-sheet` elements and derive the highest z-index
        const highestZIndex = Math.max(...$("body").find(".k4-item-sheet").map((_i, sheet) =>
          U.pInt($(sheet).css("z-index"))
        ).toArray());
        this.element.css("z-index", 100);
        if (!traitItem.sheet) {return;}
        if (!traitItem.sheet.rendered) {
          traitItem.sheet.render(true);
          await U.sleep(150);
        }
        $(traitItem.sheet.element).css("z-index", highestZIndex + 1);
        this.element.css("z-index", 100);
      }
    });
  }

  clamp(element: HTMLElement) {
    if ("clamplines" in element.dataset) {
      $clamp(element, {
        clamp: U.pInt(element.dataset.clamplines)
      });
    } else if ("clampheight" in element.dataset) {
      $clamp(element, {
        clamp: element.dataset.clampheight
      });
    } else {
      $clamp(element, {clamp: "auto"});
    }
  }
  unClamp(element: HTMLElement) {element.style.cssText = "";}

  #attachListeners_contentEditable(html: JQuery) {
    const self = this;
    // Initialize content-editable elements with click, focus, and blur listeners for inline editing
    html.find(".content-editable").each(function () {
      $(this)
        .on("click", (clickEvent) => {
          const elem$ = $(clickEvent.currentTarget);
          if (elem$.attr("contenteditable") === "true") {
            return undefined;
          }
          clickEvent.preventDefault();
          let elemContent: string;

          if (elem$.hasClass("simple-editor")) {
            // For simple-editor, preserve HTML content
            elemContent = elem$.html();
            console.log("\n\nRaw HTML content on click (before replacement):", JSON.stringify(elemContent));
            elemContent = elemContent.replace(/<div><br\s*\/?><\/div>/gi, "\n");
            elemContent = elemContent.replace(/<br\s*\/?>/gi, "\n");
            elemContent = elemContent.replace(/<div>/gi, "\n");
            // Remove any other HTML tags
            elemContent = elemContent.replace(/<[^>]*>/g, "");
            console.log("Processed content on click (after replacement):", JSON.stringify(elemContent));
            // Set content using html() to preserve line breaks
            elem$.html(elemContent || "&nbsp;");
          } else {
            // For other elements, use text content
            elemContent = elem$.text().trim();
            elem$.text(elemContent || " ");
          }

          if (elem$.hasClass("placeholder")) {
            elemContent = "";
          }

          elem$
            .removeClass("placeholder")
            .attr({contenteditable: "true"})
            .on("keydown", (keyboardEvent) => {
              if (!elem$.hasClass("simple-editor") && keyboardEvent.key === "Enter") {
                keyboardEvent.preventDefault();
                elem$.trigger("blur");
              }
            });

          // Set content after making element editable
          if (elem$.hasClass("simple-editor")) {
            elem$.html(elemContent || " "); // Use text() to properly escape content
          } else {
            elem$.text(elemContent || " ");
          }

          elem$.trigger("focus");
        })
        .on("focus", (focusEvent) => {
          self.unClamp(focusEvent.currentTarget);
          const element = focusEvent.currentTarget;
          const elem$ = $(element);

          if (elem$.hasClass("simple-editor")) {
            // Convert <br> tags to newlines for editing
            let content = elem$.html();
            console.log("\n\nRaw HTML content on focus (before replacement):", JSON.stringify(content));
            content = content.replace(/<div><br\s*\/?><\/div>/gi, "\n");
            content = content.replace(/<br\s*\/?>/gi, "\n");
            content = content.replace(/<div>/gi, "\n");
            // Remove any HTML tags that might have been introduced
            content = content.replace(/<[^>]*>/g, "");
            console.log("Processed content on focus (after replacement):", JSON.stringify(content));
            // Use html() to set content, preserving line breaks
            elem$.html(content);
          }

          const range = document.createRange();
          const selection = window.getSelection();

          if (selection && !elem$.hasClass("simple-editor")) {
            selection.removeAllRanges();
            range.selectNodeContents(element);
            selection.addRange(range);
          }
        })
        .on("blur", (blurEvent) => {
          blurEvent.preventDefault();
          const {currentTarget} = blurEvent;
          const elem$ = $(currentTarget);

          let elemHtml = elem$.html();

          // Log the raw HTML content for debugging
          console.log("\n\nRaw HTML content on blur:", JSON.stringify(elemHtml));

          if (elem$.hasClass("simple-editor")) {
            // Preserve line breaks by replacing them with <br> tags
            elemHtml = elemHtml
              .replace(/\r?\n/g, "<br>")
              .replace(/(<br>)+$/g, ""); // Remove trailing <br> tags
          }

          // Log the processed HTML content for debugging
          console.log("Processed HTML content on blur:", JSON.stringify(elemHtml));

          // Set placeholder text where content is blank
          if (!elemHtml.trim() && elem$.data("placeholder")) {
            elem$
              .addClass("placeholder")
              .text(elem$.data("placeholder") as string);
            elemHtml = "";
          } else {
            elem$.removeClass("placeholder");
          }

          elem$
            .attr({contenteditable: "false"})
            .off("keydown");
          self.clamp(currentTarget);

          // Sync with actor data
          const dataField = elem$.data("field") as string;
          const curData = U.getProp(self.actor, dataField);
          if (curData !== elemHtml) {
            void K4Socket.Call("CharChange_Text", UserTargetRef.other, getUser().id, getActor().id, dataField, elemHtml);
            self.actor.update({[dataField]: elemHtml}).catch((err: unknown) => {
              kLog.error(`Failed to update ${dataField}: ${String(err)}`);
            });
          }
        });
    });
  }

  #attachListeners_archetypePanels(archetype$: JQuery) {

    const archetype = archetype$.attr("data-archetype") as Maybe<K4Archetype>;
    if (!archetype) {
      throw new Error(`No archetype found for K4PCSheet: ${String(archetype$)}`);
    }
    const archetypePanels$ = archetype$.closest(".pc-initialization").find(`.archetype-panels[data-archetype="${archetype}"]`);
    const getUnlistedItemsOfType = (type: K4ItemType.disadvantage | K4ItemType.darksecret) => {
      const {archetype} = this.actor;
      if (!archetype) {return [];}
      const listedTraits: string[] = [];
      const cData = this.getArchetypeCarouselData();
      if (cData[archetype]?.[type]) {
        listedTraits.push(
          ...Object.keys(cData[archetype][type])
            .map((traitName) => traitName.replace(/^!/, ""))
        );
      }
      return getGame().items
        .filter((item: any): item is K4Item<K4ItemType.disadvantage | K4ItemType.darksecret> =>
          item.type === type && !listedTraits.includes(item.name)
        );
    };
    archetypePanels$.find(".archetype-panel-advantages, .archetype-panel-disadvantages, .archetype-panel-darksecrets")
      .each((_i, panel) => {
        const panel$ = $(panel);
        panel$.find(".archetype-trait-container")
          .each((_i, cont) => {
            this.#attachListeners_trait($(cont));
          });
      });
    // Add listeners to "more" buttons
    archetypePanels$.find("button.more-disadvantages").off("click.k4disadvantages").on("click.k4disadvantages", () => {
      void (async () => {
        const item = await K4Dialog.GetUserItemSelection<K4ItemType.disadvantage>({
          title: "Select a Disadvantage",
          bodyText: "(<strong>Click</strong> to View, <strong>Right</strong>-Click to Select, <strong>Escape</strong> to Cancel.)",
          itemList: getUnlistedItemsOfType(K4ItemType.disadvantage)
        });
        if (item) {
          await this.actor.charGenSelect(item.name, false);
          await this.reRenderTraitNotesPanels();
        }
      })();
    });

    archetypePanels$.find("button.more-dark-secrets").off("click.k4darksecrets").on("click.k4darksecrets", () => {
      void (async () => {
        const item = await K4Dialog.GetUserItemSelection<K4ItemType.darksecret>({
          title: "Select a Dark Secret",
          bodyText: "(<strong>Click</strong> to View, <strong>Right</strong>-Click to Select, <strong>Escape</strong> to Cancel.)",
          itemList: getUnlistedItemsOfType(K4ItemType.darksecret)
        });
        if (item) {
          await this.actor.charGenSelect(item.name, false);
          await this.reRenderTraitNotesPanels();
        }
      })();
    });
  }

  /**
   * Attaches listeners to attribute selector elements.
   * @param {JQuery} html - The jQuery object representing the HTML to search within.
   */
  #attachListeners_attributeSelectors(html: JQuery): void {
    // Find all select elements with class 'attribute-value'
    const attributeSelectors = html.find("select.attribute-value");

    // Attach change event listener to each select element
    attributeSelectors.each((_index: number, element: HTMLElement) => {
      const $select = $(element);
      const dotTarget = $select.attr("name")!;

      $select.off("change").on("change", (event: JQuery.ChangeEvent) => {
        const newValue = $(event.currentTarget).val();

        // Ensure newValue is a string
        if (typeof newValue === "string") {
          // Update the select element's value
          $select.attr("value", newValue);

          // Update the selected attribute of the appropriate option
          $select.find("option").each((_i, option) => {
            if ($(option).val() === newValue) {
              $(option).attr("selected", "selected");
            } else {
              $(option).removeAttr("selected");
            }
          });

          // Log the change for debugging purposes
          console.log(`Attribute value changed to: ${newValue}`);

          getActor().update({[dotTarget]: newValue}, {render: false}).catch((err: unknown) => {
            kLog.error(`Failed to update attribute: ${String(err)}`);
          }).then(() => {
            void K4Socket.Call("CharChange_Attribute", UserTargetRef.other, getUser().id, getActor().id, dotTarget, newValue);
          }).catch((err: unknown) => {
            kLog.error(`Failed to update attribute: ${String(err)}`);
          });

          // Here you can add any additional logic needed when an attribute value changes
          // For example, updating the actor's data or triggering other UI updates
        } else {
          console.error("Invalid attribute value selected");
        }
      });
    });
  }

  updateArchetypeItem(item$: JQuery, rotation: number, selIndex?: number) {
  // async updateArchetypeItem(item$: JQuery, rotation: number, selIndex?: number) {
    const selArchetypeIndex = selIndex ?? this.getIndexFromYRot(rotation);
    const thisIndex = U.pInt(item$.attr("data-index"));
    U.gsap.set(item$[0], {rotationY: -rotation});
    if (thisIndex === selArchetypeIndex) {return;}
    // const {timeline: thisTimeline} = await this.#getTimeline_archetypeStyle(item$);
    const thisTimeline = this.#getTimeline_archetypeStyle(item$);
    // kLog.log(`Updating Seeking Archetype Item '${item$.attr("data-archetype")}' ($${thisIndex}) to ${1 - getNormalizedDistanceFromSelected(thisIndex, selArchetypeIndex)}`);
    thisTimeline.seek(1 - this.getNormalizedDistanceFromSelected(thisIndex, selArchetypeIndex), true).pause();
  }

  async #updateCarouselFromDragger(x: number, isTweening = false) {
    const carousel$ = this.element.find(".archetype-carousel");
    const dragger$ = this.element.find(".archetype-carousel-drag-handle");
    const items$ = carousel$.find(".archetype-carousel-item");
    const wrappedX = this.wrapXPos(x);
    const thisIndex = this.getIndexFromXPos(wrappedX);
    const rotation = isTweening
      ? this.getYRotFromIndex(thisIndex)
      : this.getYRotFromXPos(wrappedX);
    let tl: gsap.core.Tween;
    if (isTweening) {
      tl = U.gsap.to(carousel$, {rotationY: rotation, duration: 0.5, ease: "back.inOut"});
    } else {
      tl = U.gsap.set(carousel$, {rotationY: rotation});
    }
    U.gsap.set(dragger$[0], {x: wrappedX, duration: 0});
    items$.each((_i, item) => {
      this.updateArchetypeItem($(item), rotation, isTweening ? thisIndex : undefined);
    });
    await tl;
  }

  _selArchetypeIndex: Maybe<number> = undefined;
  get selArchetypeIndex(): number {
    if (typeof this._selArchetypeIndex === "number" && this._selArchetypeIndex >= 0) {
      return this._selArchetypeIndex;
    }
    this._selArchetypeIndex = K4CharGen.ArchetypeIndexMap.get(this.actor.archetype ?? K4Archetype.academic);
    if (typeof this._selArchetypeIndex !== "number") {
      throw new Error(`Invalid archetype index: ${String(this._selArchetypeIndex)}`);
    }
    return this._selArchetypeIndex;
  }
  set selArchetypeIndex(index: number) {
    this._selArchetypeIndex = index;
  }
  #constructCarouselDragger(html$: JQuery) {
    const draggerContainer$ = html$.find(".archetype-carousel-dragger");
    const dragger$ = draggerContainer$.find(".archetype-carousel-drag-handle");
    const carousel$ = html$.find(".archetype-carousel");
    const items$ = carousel$.find(".archetype-carousel-item");
    const self = this;

    const getSnappedXPos = (x: number) => {
      const newIndex = this.getIndexFromXPos(this.wrapXPos(x));
      return this.getXPosFromIndex(newIndex);
    };

    const snapToNearestArchetype = async (x: number, isCompleting = false, isUpdating = true) => {
      const newIndex = this.getIndexFromXPos(this.wrapXPos(x));
      this.actor.archetype = K4CharGen.ValidArchetypes[newIndex];
      this.selArchetypeIndex = newIndex;
      if (isUpdating) {
        await this.#updateCarouselFromDragger(this.getXPosFromIndex(newIndex), isCompleting);
      }
      K4DebugDisplay.updateArchetypeInfo(this.actor.archetype, this.selArchetypeIndex, newIndex, newIndex);
      if (isCompleting) {
        focusOn();
      }
      return this.getXPosFromIndex(newIndex);
    };

    const focusOn = (index = this.selArchetypeIndex) => {
      dragger$.css("pointer-events", "none");
      const selectedArchetype = this.getElementFromIndex(carousel$, index);
      const archetype = K4CharGen.ValidArchetypes[index];
      const selectedArchetypeTimeline = this.#getTimeline_archetypeStyle($(selectedArchetype));
      U.gsap.timeline()
        .add(selectedArchetypeTimeline.tweenTo("selected", {duration: 2}))
        .add(() => {void this.reRenderTraitPanels(archetype);}, 1)
        .add(() => {dragger$.css("pointer-events", "auto");});
    };
    const focusOff = (index = this.selArchetypeIndex) => {
      const selectedArchetype = this.getElementFromIndex(carousel$, index);
      const selectedArchetypeTimeline = this.#getTimeline_archetypeStyle($(selectedArchetype));
      void selectedArchetypeTimeline.seek("light", true).pause();
    };

    const dragger = Dragger.create(dragger$, {
      type: "x",
      inertia: true,
      dragResistance: 0.5,
      maxDuration: 0.25,
      // startX: getXPosFromIndex(getIndexOfArchetype(this.actor.archetype ?? K4Archetype.academic)),
      snap: {
        x: function (this: Dragger, value: number) {
          if (!this.isThrowing) {return value;}
          return getSnappedXPos(value);
        }
      },
      onDragStart: function (this: Dragger) {
        focusOff();
      },
      onDrag: function (this: Dragger) {
        void self.#updateCarouselFromDragger(this.x, false);
        // K4DebugDisplay.updateDraggerInfo(this, self.actor, self);
      },
      onDragEnd: function (this: Dragger) {
        if (this.isThrowing) {return;}
        // void self.#updateCarouselFromDragger(this.x, false);
        void snapToNearestArchetype(this.x, true);
      },
      onThrowUpdate: function (this: Dragger) {
        void self.#updateCarouselFromDragger(this.x, false);
        // K4DebugDisplay.updateDraggerInfo(this, self.actor, self);
      },
      onThrowComplete: function (this: Dragger) {
        // void self.#updateCarouselFromDragger(this.x, false);
        void snapToNearestArchetype(this.x, true);
      }
    })[0];

    // void this.#updateCarouselFromDragger(dragger.x, false);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (K4DebugDisplay.IS_DEBUGGING) {
      kLog.log("Dragger Created", {dragger, draggerContainer$, dragger$});

      // Update debug info on each frame
      gsap.ticker.add(() => {
        const x = gsap.getProperty(dragger$[0], "x") as number;
        // updateDebugInfo(carousel$, x);
        // K4DebugDisplay.updateDraggerInfo(Dragger.get(dragger$), this.actor, self);
      });
    }
  }


  // async #constructCarousel_OLD(carouselScene$: JQuery, timeStamp: () => number) {
  //   kLog.log(`${timeStamp()} - ... Gathering JQuery Items`);
  //   const carousel$ = carouselScene$.find(".archetype-carousel");
  //   const items$ = carousel$.find(".archetype-carousel-item");

  //   kLog.log(`${timeStamp()} - ... Setting carousel z-index`);
  //   void U.gsap.set(carousel$, {z: -1 * K4CharGen.CarouselRadius});

  //   kLog.log(`${timeStamp()} - ... Starting Promise.all for items`);
  //   await Promise.all(items$.map(async (i, item) => {
  //     kLog.log(`${timeStamp()} - ... Starting item ${i} processing`);
  //     const item$ = $(item);
  //     kLog.log(`${timeStamp()} - ... Getting timeline for item ${i}`);
  //     const archTimeline = this.#getTimeline_archetypeStyle(item$);
  //     kLog.log(`${timeStamp()} - ... Calculating distance for item ${i}`);
  //     const distFromSelected = this.getNormalizedDistanceFromSelected(i, this.selArchetypeIndex);
  //     kLog.log(`${timeStamp()} - ... Seeking timeline for item ${i}`);
  //     archTimeline.seek(1 - distFromSelected, true);
  //     kLog.log(`${timeStamp()} - ... Calculating rotation for item ${i}`);
  //     const archYRot = this.getYRotFromIndex(i);
  //     kLog.log(`${timeStamp()} - ... Setting transform for item ${i}`);
  //     void U.gsap.set(item, {
  //       transform: `rotateY(${-1 * archYRot}deg) translateZ(${K4CharGen.CarouselRadius}px) rotateY(${archYRot}deg)`
  //     });
  //     kLog.log(`${timeStamp()} - ... Finished item ${i} processing`);
  //   }));
  //   kLog.log(`${timeStamp()} - ... Finished`);
  // }

  async #constructCarousel(carouselScene$: JQuery, timeStamp: () => number) {
    kLog.log(`${timeStamp()} - ... Gathering JQuery Items`);
    const carousel$ = carouselScene$.find(".archetype-carousel");
    const items$ = carousel$.find(".archetype-carousel-item");

    kLog.log(`${timeStamp()} - ... Setting carousel z-index`);
    void U.gsap.set(carousel$, {z: -1 * K4CharGen.CarouselRadius});

    kLog.log(`${timeStamp()} - ... Starting Promise.all for items`);
    const itemPromises = items$.map((i, item) => {
      try {
        kLog.log(`${timeStamp()} - Starting processing for item ${i}`);
        const item$ = $(item);
        kLog.log(`${timeStamp()} - Getting timeline for item ${i}`);
        const archTimeline = this.#getTimeline_archetypeStyle(item$);
        kLog.log(`${timeStamp()} - Got timeline for item ${i}`);
        const distFromSelected = this.getNormalizedDistanceFromSelected(i, this.selArchetypeIndex);
        const archYRot = this.getYRotFromIndex(i);

        kLog.log(`${timeStamp()} - Finished processing for item ${i}`);
        return {item, archTimeline, distFromSelected, archYRot};
      } catch (error) {
        kLog.error(`Error processing item ${i}:`, error);
        throw error; // Re-throw the error to be caught by Promise.all
      }
    });

    try {
      kLog.log(`${timeStamp()} - Waiting for all items to be processed`);
      const processedItems = await Promise.all(itemPromises);
      kLog.log(`${timeStamp()} - All items processed`);

      processedItems.forEach(({item, archTimeline, distFromSelected, archYRot}) => {
        archTimeline.seek(1 - distFromSelected, true);
        void U.gsap.set(item, {
          transform: `rotateY(${-1 * archYRot}deg) translateZ(${K4CharGen.CarouselRadius}px) rotateY(${archYRot}deg)`
        });
      });
    } catch (error) {
      kLog.error("Error processing items:", error);
      throw new Error(`Error processing items: ${String(error)}`);
    }
    kLog.log(`${timeStamp()} - ... Finished`);
  }
  async #reRenderTraitPanel(archetype$: JQuery, panelData: Archetype.ArchetypeData) {
    const htmlContent = await renderTemplate("systems/kult4th/templates/sheets/pc-initialization-archetype-trait-panels.hbs", {data: panelData});
    archetype$.find(".archetype-trait-panels-wrapper").html(htmlContent);
    this.#attachListeners_archetypePanels(archetype$);
  }

  async reRenderTraitPanels(archetype?: K4Archetype) {
    kLog.log("Re-rendering trait panels");
    archetype ??= this.actor.archetype ?? K4Archetype.academic;
    // Use destructuring to separate carousel data into its archetype-specific and archetype-independent components
    const allCarouselData = this.getArchetypeCarouselData();
    const archetypeData = allCarouselData[archetype];
    if (!archetypeData) {
      throw new Error(`No archetype data found for archetype: ${archetype}`);
    }
    const archetype$ = this.element.find(`.archetype-panels[data-archetype="${archetype}"]`);
    await this.#reRenderTraitPanel(archetype$, archetypeData);
  }

  async reRenderTraitNotesPanels(html = this.element) {
    const htmlContent = await renderTemplate("systems/kult4th/templates/gamephase/parts/chargen-trait-notes-editor.hbs", {traitNotes: this.traitNotes});
    html.find(".archetype-sub-panel-wrapper.chargen-trait-notes-editor").html(htmlContent);
    this.#attachListeners_contentEditable(html);
  }

  updateArchetypeExamples(html?: JQuery, archetype?: K4Archetype) {
    html = html ?? this.element;

    archetype = archetype ?? this.actor.archetype;
    if (!archetype) {return;}

    // Prepare the example strings for the selected archetype.
    const archData = Archetypes[archetype];
    const archetypeExamples$ = html.find(".archetype-example-list");
    // kLog.log("[K4PCSheet] archetypeExamples$", {archetypeExamples$, archData});
    archetypeExamples$.each((_i, elem) => {
      const target = $(elem).attr("data-target") as Maybe<string>;
      // kLog.log("[K4PCSheet] archetypeExamples$", {elem, target, archData});
      if (target) {
        const example = U.getProp<string[]>(archData, target);
        // kLog.log("[K4PCSheet] archetypeExamples$", {elem, target, example});
        if (example) {
          $(elem).html(`<span class="archetype-example">${example.join("</span><span class='archetype-example-separator'>◆</span><span class='archetype-example'>")
            }</span>`);
        }
      }
    });
  }


  _isCarouselSceneLoaded = false;
  async preloadCarouselScene() {
    if (this._isCarouselSceneLoaded) {return true;}
    const timeStamp = U.getTimeStamp();


    // kLog.log(`${timeStamp()} - Playing Reveal Carousel Base Background`);
    // void this.#getTimeline_revealCarouselBaseBackground().play();
    kLog.log(`${timeStamp()} - Initializing Carousel Scene`);

    // Construct the carousel by positioning and rotating all elements
    const carouselScene$ = this.element.find(".archetype-staging");
    await this.#constructCarousel(carouselScene$, timeStamp);
    kLog.log(`${timeStamp()} - Carousel Scene Constructed`);

    // Add the carousel drag controller
    this.#constructCarouselDragger(this.element);
    kLog.log(`${timeStamp()} - Carousel Dragger Constructed`);

    // Attach archetype timelines and listeners to their associated elements
    this.element.find(".archetype-carousel-item[data-archetype]").each((_i, archetypeElem) => {
      const archetype$ = $(archetypeElem);
      this.#attachListeners_archetypePanels(archetype$);
    });
    this.#attachListeners_contentEditable(this.element);
    this.#attachListeners_attributeSelectors(this.element);
    kLog.log(`${timeStamp()} - Archetype Timelines Attached`);

    // Update the carousel to match the selected archetype
    await this.#updateCarouselFromDragger(this.getXPosFromIndex(this.selArchetypeIndex), false);
    kLog.log(`${timeStamp()} - Carousel Updated to Selected Archetype`);

    kLog.log(`${timeStamp()} - Carousel Rendered, Returning true`);

    U.gsap.set([
      this.element[0],
      this.element.find(".pc-initialization-bg")[0],
      this.element.find(".pc-initialization")[0]
    ], {
      autoAlpha: 1,
      opacity: 1
    });
    this._isCarouselSceneLoaded = true;

    return true;
  }

  async revealCarouselScene() {
    kLog.log("Revealing Carousel Scene");
    CONFIG.K4.isCharGenInitialized = true;
    const tl = this.#getTimeline_revealCarousel();
    return tl.play();
  }

}

export default K4CharGen;
// export type {ChargenSummary};