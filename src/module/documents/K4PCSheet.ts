// #region IMPORTS ~

import C, {K4Attribute, StabilityConditions, K4ConditionType, K4Stability, K4Archetype, ArchetypeTier, Archetypes} from "../scripts/constants.js";
import U from "../scripts/utilities.js";
import {Dragger, InertiaPlugin, CustomEase, CustomWiggle} from "../libraries.js";
import K4Actor, {K4ActorType} from "./K4Actor.js";
import K4Item, {K4ItemType} from "./K4Item.js";
import K4Dialog, {PromptInputType} from "./K4Dialog.js";
import K4ActiveEffect from "./K4ActiveEffect.js";
import K4Roll from "./K4Roll.js";
import {gsap} from "../libraries.js";
import K4DebugDisplay from "./K4DebugDisplay.js";

// #endregion

const GSAPEFFECTS: Record<string, GSAPEffectDefinition> = {
  gearGeburahRotate: {
    name: "gearGeburahRotate",
    effect: (target, config) => {
      const {duration} = config as {duration: number};
      const outerGear$ = $(target as HTMLElement).find(".svg-gear-geburah");
      const centerSaw$ = $(target as HTMLElement).find(".svg-gear-geburah-center-saw");
      const centerSawRotate = gsap.timeline({repeat: -1})
        .to(centerSaw$, {
          rotation: "-=360",
          duration,
          ease:     "none"
        });

      const tl = U.gsap.timeline({repeat: -1});

      const fifthDuration = duration / 5;
      const pulseDuration = fifthDuration / 5;
      const pulseDelay = pulseDuration * 4;
      tl
        .to(outerGear$, {
          rotation:      "-=20",
          duration:      pulseDuration,
          repeatRefresh: true,
          repeatDelay:   pulseDelay,
          ease:          "back",
          repeat:        -1
        }, 0);

      const warpDelay = fifthDuration / 20;
      const warpDuration = warpDelay * 19;
      tl
        .fromTo(centerSawRotate, {
          timeScale: 8
        }, {
          timeScale:   0.5,
          duration:    warpDuration,
          ease:        "power2",
          repeatDelay: warpDelay,
          // delay:       0.1,
          repeat:      -1
        }, 0);

      return tl;
    },
    defaults: {
      duration: 10
    },
    extendTimeline: false
  },
  gearBinahRotate: {
    name: "gearBinahRotate",
    effect: (target) => {
      const binahTeeth$ = $(target as HTMLElement).find(".svg-gear-binah-outer-teeth");
      const binahInner$ = $(target as HTMLElement).find(".svg-gear-binah-inner-full");
      gsap.set(binahTeeth$, {scale: 0.97});
      return gsap.timeline({repeat: -1})
        .to(binahTeeth$, {
          rotation: "-=360",
          duration: 5,
          repeat:   -1,
          ease:     "none"
        }, 0)
        .to(binahInner$, {
          rotation:      "+=10",
          duration:      0.4,
          repeatRefresh: true,
          repeatDelay:   0.85,
          ease:          "back.out(14)",
          repeat:        -1
        }, 0);
    },
    defaults: {},
    extendTimeline: false
  },
  gearHugeRotate: {
    name: "gearHugeRotate",
    effect: (target, config) => {
      const {duration} = config as {duration: number};
      return gsap.to(target, {
        rotation: "+=360",
        duration,
        ease:     "none",
        repeat:   -1
      });
    },
    defaults: {
      duration: 50
    },
    extendTimeline: false
  },
  breakShard: {
    name:   "breakShard",
    effect: (target, config) => {
      const {stability} = config as {stability: number};
      const target$ = $(target as HTMLElement);
      const shardsMap = {
        7: [
          [13, 4],
          [12, 2, 3, 5, 1]
        ],
        6: [[1, 11], [10]],
        5: [[5], [6]],
        4: [
          [8, 6],
          [9, 7]
        ],
        3: [[10], [0]],
        2: [[3, 12, 2], [0]],
        1: [[7, 9], [0]]
      };
      const getFadingShards = (stabilityNum: number) => {
        const shardNums = shardsMap[stabilityNum as keyof typeof shardsMap][0] ?? [];
        return target$.find(shardNums.map((num) => `#shard-${num}`).join(", "));
      };
      const getShrinkingShards = (stabilityNum: number) => {
        const shardNums = shardsMap[stabilityNum as keyof typeof shardsMap][1] ?? [];
        return target$.find(shardNums.map((num) => `#shard-${num}`).join(", "));
      };
      const fullDuration = 0.5;
      const fadingShardsScaleFullDuration = fullDuration / 5;
      const fadingShardsShiftFullDuration = fullDuration - fadingShardsScaleFullDuration;

      const fadingShards$ = getFadingShards(stability);
      const fadingShardsNum = Array.from(fadingShards$).length;
      const fadingShardsScaleStagger = fadingShardsNum <= 1
        ? 0
        : (0.5 * fadingShardsScaleFullDuration) / (fadingShardsNum - 1);
      const fadingShardsShiftStagger = fadingShardsNum <= 1
        ? 0
        : (0.5 * fadingShardsShiftFullDuration) / (fadingShardsNum - 1);
      const fadingShardsScaleDur = fadingShardsScaleFullDuration - (fadingShardsScaleStagger * (fadingShardsNum - 1));
      const fadingShardsShiftDur = fadingShardsShiftFullDuration - (fadingShardsShiftStagger * (fadingShardsNum - 1));
      const fadingShardsAnimDuration = fadingShardsScaleDur
            + fadingShardsShiftDur
            + (fadingShardsScaleStagger * (fadingShardsNum - 1))
            + (fadingShardsShiftStagger * (fadingShardsNum - 1));

      return gsap.timeline({})
        .to(getShrinkingShards(stability), {transformOrigin: "center center", scale: 1, duration: 0.25, ease: "none"}, 0)
        .set(fadingShards$, {transformOrigin: "right center"}, 0)
        .to(fadingShards$, {
          scaleX:   -1,
          duration: 0.5,
          ease:     "rough({ strength: 2, points: 10, template: power4.in, taper: out, randomize: true, clamp: false })", // "power2.inOut",
          stagger:  0.1
        })
        .to(fadingShards$, {
          xPercent: 700,
          duration: 0.4,
          ease:     "power2.in",
          stagger:  0.1
        });
        // ">-0.75")
    },
    defaults:       {},
    extendTimeline: true
  }
};

const ANIMATIONS = {
  _glitchText(_target: HTMLElement, startingGlitchScale = 1): GsapAnimation {

    const tl = gsap.timeline({
      repeat:      -1,
      repeatDelay: 10,
      reversed:    true,
      onRepeat(this: gsap.core.Timeline & {glitchScale: number}) {
        this.timeScale(this.glitchScale);
      }
    });
    tl.glitchScale = startingGlitchScale;
    tl.to(".glitch", {
      skewX() { return 20 * this.glitchScale; },
      duration() { return 0.1 * this.glitchScale; },
      ease: "power4.inOut"
    })
      .to(".glitch", {duration() { return 0.01 * this.glitchScale; }, skewX: 0, ease: "power4.inOut"})
      .to(".glitch", {duration() { return 0.01 * this.glitchScale; }, opacity: 0})
      .to(".glitch", {duration() { return 0.01 * this.glitchScale; }, opacity: 1})
      .to(".glitch", {duration() { return 0.01 * this.glitchScale; }, x() { return -10 * this.glitchScale; }})
      .to(".glitch", {duration() { return 0.01 * this.glitchScale; }, x: 0})
      .add("split", 0)
      .to(".top", {duration() { return 0.5; }, x() { return -10 * this.glitchScale;}, ease: "power4.inOut"}, "split")
      .to(".bottom", {duration() { return 0.5; }, x() { return 10 * this.glitchScale;}, ease: "power4.inOut"}, "split")
      .to(".glitch", {duration() { return 0.08; }, className: "+=redShadow"}, "split")

      .to("#txt", {duration() { return 0; }, scale() { return 1 + (0.05 * (this.glitchScale - 1)); }}, "split")
      .to("#txt", {duration() { return 0; }, scale: 1}, "+=0.02")

      .to(".glitch", {duration() { return 0.08; }, className: "-=redShadow"}, "+=0.09")
      .to(".glitch", {className: "+=greenShadow", duration: 0.03}, "split")
      .to(".glitch", {className: "-=greenShadow", duration: 0.03}, "+=0.01")

      .to(".top", {duration() { return 0.2; }, x: 0, ease: "power4.inOut"})
      .to(".bottom", {duration() { return 0.2; }, x: 0, ease: "power4.inOut"})

      .to(".glitch", {duration() { return 0.02; }, scaleY() { return 1 + (0.05 * (this.glitchScale - 1));}, ease: "power4.inOut"})
      .to(".glitch", {duration() { return 0.04; }, scaleY: 1, ease: "power4.inOut"});

    return tl;
  },
  hoverNav(target: HTMLElement): GsapAnimation {
    // const navGhostGears$ = $(target).find(".gear-container.gear-ghost-nav");
    const navLens$ = $(target).find(".nav-lens");
    const profileImg$ = $(target).find(".profile-image");
    const profileBg$ = $(target).find(".profile-image-bg");
    const buttonContainer$ = $(target).find(".tabs");
    const buttonSliders$ = $(target).find(".nav-tab-slider");
    const closeButton$ = $(target).find(".header-button.close");
    const minimizeButton$ = $(target).find(".header-button.minimize");
    const flare$ = $(target).find(".nav-flare");
    const form$ = $(target).closest("form");
    const formSiblings$ = form$.siblings();
    const sheetContent$ = form$.find("main");

    const svgs = {
      container:           $(target).find(".nav-svg"),
      outerSpikeContainer: $(target).find(".outer-spikes"),
      outerSpikes:         Array.from($(target).find(".outer-spikes").children()),
      outerSpikePaths:     Array.from($(target).find(".outer-spikes-hover").children())
        .map((spike) => spike.getAttribute("d")),
      innerSpikes:  $(target).find(".inner-spikes"),
      innerMesh:    $(target).find(".inner-mesh"),
      mainRing:     $(target).find(".main-ring"),
      buttonSpikes: $(target).find(".tabs .nav-tab-container .svg-container[class*='nav-spoke'] .svg-def")
    };

    const spikeVars: gsap.TweenVars = {
      // @ts-expect-error MorphSVG does indeed accept functions.
      morphSVG(i: number) { return svgs.outerSpikePaths[i]; },
      scale:    1,
      duration: 0.3,
      ease:     "power2"
    };

    const navTL = gsap.timeline({reversed: true})
      .to(target, {
        scale:    1.2,
        duration: 0.6,
        ease:     "power2"
      }, 0)
      .to(target, {
        x:        "+=20",
        duration: 0.5,
        ease:     "sine.inOut"
      }, 0)
      .to(target, {
        y:        "+=50",
        duration: 0.5,
        ease:     "sine.out"
      }, 0)
      .to($(target).find(".svg-def:not(.main-ring)"), {
        "--K4-icon-fill": C.Colors.GREY1,
        "duration":         0.6,
        "ease":           "sine"
      }, 0)
      .set($(target).find(".svg-def.main-ring"), {
        fill: "url('#nav-main-ring-bg-end-gradient')"
      }, 0.3)
      .to(svgs.mainRing, {
        scale:       1,
        opacity:     1,
        ease:        "sine",
        duration:    0.6,
        strokeWidth: 0,
        stroke:      0
      }, 0)
      .to(svgs.innerMesh, {
        scale:    1,
        ease:     "sine",
        duration: 0.45
      }, 0).to(svgs.innerMesh, {
        opacity:  1,
        ease:     "sine",
        duration: 0.3
      }, 0.15)
      .to(svgs.outerSpikeContainer, {
        scale:    1,
        duration: 0.3,
        ease:     "power2"
      }, 0)
      .to(svgs.outerSpikes, spikeVars, 0)
      .to(svgs.innerSpikes, {
        scale:    1,
        duration: 0.3,
        ease:     "power2"
      }, 0.15).to(svgs.innerSpikes, {
        opacity:  1,
        duration: 0.15,
        ease:     "power2"
      }, 0.2)
      .to(navLens$, {
        rotation: "+=180",
        duration: 0.6,
        ease:     "sine.inOut"
      }, 0).to(navLens$, {
        opacity:  0,
        duration: 0.3,
        ease:     "power2"
      }, 0.3)
      .to(buttonSliders$, {
        y:             "-=85",
        ease:          "sine",
        pointerEvents: "all",
        duration:      0.3,
        stagger:       {
          amount: 0.25,
          from:   "random"
        }
      }, 0.05)
      .from([closeButton$, minimizeButton$], {
        // zIndex: -2,
        pointerEvents: "none",
        filter:        "blur(5px)",
        ease:          "sine",
        duration:      0.6
      }, 0).to([closeButton$, minimizeButton$], {
        opacity:       1,
        duration:      0.3,
        pointerEvents: "all"
      }, 0)
      .to(profileImg$, {
        opacity:  0,
        duration: 0.6,
        ease:     "power2.out"
      }, 0)
      .to(profileBg$, {
        opacity:  0.65, // 0.65,
        duration: 0.6,
        ease:     "sine"
      }, 0)
      .to(buttonContainer$, {
        zIndex:   1,
        ease:     "power3",
        duration: 0.01
      });

    if (U.getSetting("blur")) {
      navTL
        .to([U.getSiblings(target), sheetContent$, formSiblings$], {
          filter:   "blur(5px)",
          duration: 0.5,
          ease:     "back"
        }, 0);
    }

    if (U.getSetting("flare")) {
      navTL
        .to(flare$, {
          scale:    2.3,
          duration: 0.45,
          ease:     "sine"
        }, 0);
    }

    kLog.log("NAV TL", {navTL, target, svgs});

    return navTL;
  },
  hoverNavTab(target: HTMLElement): GsapAnimation {
    const tabLabel$ = $(target).find(".nav-tab-label");
    // const tabAnimation$ = $(target).find(".nav-tab-animation");
    return gsap.timeline({reversed: true})
      .to(tabLabel$, {
        opacity:  1,
        duration: 0.25,
        ease:     "sine"
      }, 0)
      .fromTo(tabLabel$, {
        scale:  3,
        // scaleX: 1.5,
        filter: "blur(10px)"
      }, {
        // scaleY: 2,
        scale:    1,
        filter:   "none",
        duration: 0.35,
        ease:     "power3"
      }, 0);/* .fromTo(
        tabAnimation$,
        {
          scale: 1,
          opacity: 0,
          filter: "blur(10px)"
        },
        {
          scale: 5,
          opacity: 0.75,
          filter: "none",
          duration: 1,
          ease: "back"
        },
        0
      ); */
  },
  hoverStrip(target: HTMLElement, context: JQuery, actor: K4Actor): GsapAnimation {
    const FULL_DURATION = 0.5;

    let stripType: "edge" | K4ItemType.advantage | K4ItemType.disadvantage | K4ItemType.move;
    if ($(target).hasClass("edge-strip")) {
      stripType = "edge";
    } else if ($(target).hasClass("advantage-strip")) {
      stripType = K4ItemType.advantage;
    } else if ($(target).hasClass("disadvantage-strip")) {
      stripType = K4ItemType.disadvantage;
    } else {
      stripType = K4ItemType.move;
    }

    const hoverTargetMain$ = $(context).find($(target).data("hover-target"));
    const stripIcon$ = $(target).children(".icon-container");
    const stripName$ = $(target).find(".strip-name");
    const modifiers$ = $(context).find(".modifiers-report").find(".mod-container");

    const moveName = stripName$.text();
    const move = actor.getItemByName(moveName) as Maybe<K4Item<K4ItemType.move>>;
    let filterIndex = -1;
    let modifier$: Maybe<JQuery>;
    if (move) {
      for (const [i, {filter}] of actor.collapsedRollModifiers.entries()) {
        if (K4ActiveEffect.DoesFilterApplyToMove(filter, move)) {
          filterIndex = i;
          break;
        }
      }
    }
    if (filterIndex >= 0) {
      modifier$ = $(modifiers$[filterIndex]);
    }

    const buttonStrip$ = $(target).find(".button-strip");
    const stripBG$ = $(target).find(".strip-bg");

    if (!buttonStrip$.length) { return gsap.timeline({reversed: true}); }

    // const colorFG = $(target).data("color-fg") || gsap.getProperty(stripToolTip$[0], "color");
    // const colorFG = $(target).css("--K4-strip-color-fg")?.trim() ?? gsap.getProperty(stripToolTip$[0], "color");
    // const colorBG = (String(getContrastingColor(colorFG, 4) || $(target).css("--K4-strip-color-bg")?.trim()) ?? C.Colors.GREY1);
    const colorBase = stripName$.css("color");
    const colorHover = stripType === "edge"
      ? C.Colors.GREY10
      : C.Colors.GREY0;
    const colorShadow = stripType === "edge"
      ? "rgba(3, 247, 249, 0.56)"
      : colorBase;
    const nameShift = U.get(target, "height", "px");

    // kLog.log(`HOVER STRIP: ${$(target).attr("class")}`, {target, colorFG, colorBG, nameShift});

    const tl = gsap
      .timeline({reversed: true})
      .to(stripIcon$, {
        scale:    "+=1",
        duration: FULL_DURATION,
        ease:     "sine"
      }, 0)
      .to(stripBG$, {
        opacity:  1,
        duration: FULL_DURATION,
        ease:     "sine"
      }, 0)
      .to(target, {
        duration: 0.1,
        zIndex:   5000,
        ease:     "none"
      }, 0)
      .to(buttonStrip$, {
        opacity:  1,
        duration: FULL_DURATION / 4,
        ease:     "none"
      }, 0)
      .from(buttonStrip$, {
        width:    0,
        duration: FULL_DURATION,
        ease:     "sine"
      }, 0)
      .fromTo(stripName$, {
        color: colorBase
      }, {
        xPercent:   -100,
        x:          `-=${2 * nameShift}`,
        fontWeight: 900,
        fontStyle:  "normal",
        zIndex:     20,
        duration:   FULL_DURATION,
        color:      colorHover,
        textShadow: [
          ...Array.from({length: 4}).fill(`0 0 15px ${colorShadow}`) as string[],
          ...Array.from({length: 6}).fill(`0 0 5px ${colorShadow}`) as string[],
          ...Array.from({length: 4}).fill(`0 0 2px ${colorShadow}`) as string[]
        ].join(", "),
        ease: "back"
      }, 0);


    // if (stripToolTip$[0]) {
    //   tl.fromTo(stripToolTip$, {
    //     opacity: 0,
    //     scale:   1.5
    //   }, {
    //     opacity:  1,
    //     scale:    1,
    //     y:        "-=10",
    //     duration: 0.75 * FULL_DURATION,
    //     ease:     "power2.in"
    //   }, 0);
    // }

    if (hoverTargetMain$[0]) {
      tl.fromTo(hoverTargetMain$, {
        opacity: 0
      }, {
        opacity:  1,
        duration: FULL_DURATION,
        ease:     "sine"
      }, 0);
    }
    if (modifier$?.[0]) {
      const anim$ = modifier$.find(".status-mod-bg");
      const strong$ = modifier$.find("strong");
      let shadowColor: string;
      let color: string;
      if (modifier$.find("k4-theme-red").length) {
        shadowColor = "220, 65, 65";
        color = C.Colors.RED8;
      } else {
        shadowColor = "220, 220, 65";
        color = C.Colors.GOLD8;
      }
      const textShadow = [
        "0 0 2px rgba(0, 0, 0, 1)",
        "0 0 4px rgba(0, 0, 0, 1)",
        "0 0 4.5px rgba(0, 0, 0, 1)",
        `0 0 8px rgba(${shadowColor}, 0.8)`,
        `0 0 12.5px rgba(${shadowColor}, 0.8)`,
        `0 0 16.5px rgba(${shadowColor}, 0.5)`,
        `0 0 21px rgba(${shadowColor}, 0.5)`,
        `0 0 29px rgba(${shadowColor}, 0.5)`,
        `0 0 41.5px rgba(${shadowColor}, 0.5)`
      ].join(", ");
      tl.fromTo(anim$, {
        autoAlpha: 0
      }, {
        autoAlpha: 1,
        duration:  FULL_DURATION,
        ease:      "sine"
      }, 0)
        .fromTo(strong$, {
          color,
          textShadow: "0 0 0 rgba(0, 0, 0, 0)"
        }, {
          color:    C.Colors.GREY10,
          textShadow,
          duration: FULL_DURATION,
          ease:     "sine"
        }, 0);
    }
    return tl;
  },
  hoverStripButton(target: HTMLElement): GsapAnimation {
    const FULL_DURATION = 0.25;

    const svg$ = $(target).find(".svg-container");
    const tooltipFlare$ = $(target).find(".button-tooltip-flare");

    return gsap.timeline({reversed: true})
      .set(target, {zIndex: 30}, 0.1)
      .to(svg$, {
        filter:   "blur(2px)",
        scale:    5,
        opacity:  0,
        duration: 0.5 * FULL_DURATION,
        ease:     "power2"
      }, 0)
      .to(tooltipFlare$, {
        autoAlpha: 1,
        duration:  0.1,
        ease:      "none"
      }, 0.1)
      .to(tooltipFlare$, {
        scaleX:   0.75,
        scaleY:   1,
        duration: FULL_DURATION - 0.1,
        ease:     "power2"
      }, 0.1);
  }
};

// interface K4PCSheet extends ActorSheet{
//   object: K4Actor<K4ActorType.pc>,
//   get actor(): K4Actor<K4ActorType.pc>
// }
class K4PCSheet extends ActorSheet {
  static PreInitialize() {

    Actors.registerSheet("kult4th", K4PCSheet, {makeDefault: true});

    gsap.registerPlugin(Dragger, InertiaPlugin);

    // Register GSAP Effects
    Object.values(GSAPEFFECTS).forEach((effect) => {
      U.gsap.registerEffect(effect);
    });
  }

  #buildStabilityShardsTimeline(html: JQuery) {
    const shards$ = html.find("#stability-shards, #stability-frame");
    const cracks$ = html.find("#stability-cracks-path");
    const glitchNum$ = html.find("#glitch");
    const gears$ = html.find("#stability-gear-geburah, #stability-gear-binah");
    const anim$ = html.find("#stability-animation-bg img");

    /** Depending on whether the variant rule for Stability is used, break points may be different:
     * == DEFAULT ==
     * Composed: 10
     * Moderate Stress: 8-9
     * Serious Stress: 5-7
     * Critical Stress: 2-4
     * Broken: 1
     *
     * == VARIANT ==
     * Composed: 10
     * Moderate Stress: 8-9
     * Serious Stress: 5-7
     * Critical Stress: 1-4
     * Broken: 0
     */

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    return gsap.timeline({paused: true})
      .fromTo(shards$, {fill: C.Colors.GOLD8, stroke: C.Colors.GOLD8}, {fill: C.Colors.GOLD8, stroke: C.Colors.GOLD8, duration: 0}, 0)
      .fromTo(anim$, {filter: "brightness(0) saturate(1.5)"}, {filter: "brightness(0) saturate(1.5)", duration: 0}, 0)
    // COMPOSED (GOLD5)
    .addLabel("stability10")
      .to(cracks$, {
        morphSVG: html.find<gsap.TweenVars["SVGPathElement"]>("#stability-cracks-9")[0],
        duration: 0.5,
        ease:     "power4"
      }, 0)
      // .fromTo(shards$, {fill: C.Colors.GOLD5, stroke: C.Colors.GOLD5}, {fill: C.Colors.GREY1, stroke: C.Colors.GREY1, duration: 5})
    // MODERATE (GOLD1)
    .to(shards$, {fill: C.Colors.GOLD5, stroke: C.Colors.GOLD5, duration: 0.5}, "<")
    .addLabel("stability9")
      .to(cracks$, {
        morphSVG: html.find<gsap.TweenVars["SVGPathElement"]>("#stability-cracks-8")[0],
        duration: 0.5,
        ease:     "power4"
      })
    .addLabel("stability8")
      .to(cracks$, {
        morphSVG: html.find<gsap.TweenVars["SVGPathElement"]>("#stability-cracks-7")[0],
        duration: 0.5,
        ease:     "power4"
      })
      .breakShard(html, {stability: 7}, "<")
      .to(glitchNum$, {opacity: 1, duration: 0.5, ease: "power4"}, "<")
    // SERIOUS (RED1)
    .to(shards$, {fill: C.Colors.GOLD1, stroke: C.Colors.GOLD1, duration: 0.5}, "<")
    .addLabel("stability7")
      .breakShard(html, {stability: 6})
    .addLabel("stability6")
      .breakShard(html, {stability: 5})
    .addLabel("stability5")
      .breakShard(html, {stability: 4})
      .to(gears$, {opacity: 1, duration: 0.5, ease: "power4"}, "<")
      .to(anim$, {filter: "brightness(0.5) saturate(1.5)", duration: 0.5, ease: "sine"}, "<")
    // CRITICAL (RED9)
    .to(shards$, {fill: C.Colors.RED1, stroke: C.Colors.RED1, duration: 0.5}, "<")
    .addLabel("stability4")
      .breakShard(html, {stability: 3})
      .to(anim$, {filter: "brightness(1) saturate(1.5)", duration: 0.5, ease: "sine"}, "<")
    .addLabel("stability3")
      .breakShard(html, {stability: 2})
      .to(anim$, {filter: "brightness(2) saturate(1.5)", duration: 0.5, ease: "sine"}, "<")
      .to(shards$, {fill: C.Colors.RED8, stroke: C.Colors.RED8, duration: 0.5}, "<")
    .addLabel("stability2")
      .breakShard(html, {stability: 1})
      .to(anim$, {filter: "brightness(10) saturate(1.5)", duration: 0.5, ease: "sine"}, "<")
      .to(shards$, {fill: C.Colors.RED9, stroke: C.Colors.RED9, duration: 0.5}, "<")
    .addLabel("stability1") as gsap.core.Timeline;
    /* eslint-enable */
  }
  _stabilityShardsTimeline: gsap.core.Timeline|undefined = undefined;
  get stabilityShardsTimeline(): gsap.core.Timeline {
    if (!this._stabilityShardsTimeline) {
      throw new Error("Attempt to get stabilityShardsTimeline before html context sent in activateListeners.");
    }
    return this._stabilityShardsTimeline;
  }
  getGlitchRepeatDelay(stability: number = this.actor.system.stability.value): number {
    const delayDistributor = gsap.utils.distribute({
      amount: 20,
      ease:   "sine.inOut"
    });
    const distVals = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((target, i, arr) =>
      delayDistributor(i, arr[i], arr)
    );
    // console.log(`[${stability}] ${distVals[stability]}s`);
    return distVals[stability];
  }
  #buildGlitchTimeline(html: JQuery) {
    const glitch$ = html.find("#shards-svg #glitch");
    const glitchText$ = html.find("#shards-svg .glitch-text");
    const glitchTop$ = html.find("#shards-svg .glitch-top");
    const glitchBottom$ = html.find("#shards-svg .glitch-bottom");

    // gsap.fromTo(glitchText$, {skewX: "random(-15, 5, 1)"}, {skewX: "random(5, 15, 1)", repeatRefresh: true, ease: "rough({strength: 3, points: 250, taper: none, randomize: true, clamp: false})", repeat: -1, yoyo: true, duration: 5});
    return gsap
      .timeline({
        repeat:        -1,
        repeatRefresh: true,
        repeatDelay:   this.getGlitchRepeatDelay()
        // onRepeat: setGlitchRepeatDelay
      })
      .to(glitchText$, {
        duration: 0.1,
        skewX:    "random([20,-20])",
        ease:     "power4.inOut"
      })
      .to(glitchText$, {duration: 0.04, skewX: 0, ease: "power4.inOut"})

      .to(glitchText$, {duration: 0.04, opacity: 0})
      .to(glitchText$, {duration: 0.04, opacity: 1})

      .to(glitchText$, {duration: 0.04, x: "random([20,-20])"})
      .to(glitchText$, {duration: 0.04, x: 0})

      .add("split", 0)

      .to(glitchTop$, {duration: 0.5, x: -30, ease: "power4.inOut"}, "split")
      .to(glitchBottom$, {duration: 0.5, x: 30, ease: "power4.inOut"}, "split")
      .to(
        glitchText$,
        {duration: 0.08, textShadow: "-13px -13px 0px #460e0e"},
        "split"
      )
      .to(glitch$, {duration: 0, scale: 1.2}, "split")
      .to(glitch$, {duration: 0, scale: 1}, "+=0.02")
      .to(
        glitchText$,
        {duration: 0.08, textShadow: "0px 0px 0px #460e0e"},
        "+=0.09"
      )
      .to(
        glitchText$,
        {duration: 0.03, textShadow: "13px 13px 0px #FFF"},
        "split"
      )
      .to(
        glitchText$,
        {duration: 0.08, textShadow: "0px 0px 0px transparent"},
        "+=0.01"
      )
      .to(glitchTop$, {duration: 0.2, x: 0, ease: "power4.inOut"})
      .to(glitchBottom$, {duration: 0.2, x: 0, ease: "power4.inOut"})
      .to(glitchText$, {duration: 0.02, scaleY: 1.1, ease: "power4.inOut"})
      .to(glitchText$, {duration: 0.04, scaleY: 1, ease: "power4.inOut"});
  }


  _glitchTimeline: gsap.core.Timeline|undefined = undefined;
  get glitchTimeline() {
    if (!this._glitchTimeline) {
      throw new Error("Attempt to get glitchTimeline before html context sent in activateListeners.");
    }
    return this._glitchTimeline;
  }



  async changeStability(stabilityDelta: number): Promise<unknown> {
    const newStability = U.clampNum(this.actor.system.stability.value + stabilityDelta, [1, 10]);
    if (newStability === this.actor.system.stability.value) { return undefined; }
    let updateAnim: Maybe<GsapAnimation> = undefined;
    if (this.rendered) {
      this.glitchTimeline.repeatDelay(this.getGlitchRepeatDelay(newStability));
      this.glitchTimeline.restart();
      gsap.set(this.element.find(".stability-count"), {
        text: `${newStability}`
      });
      updateAnim = this.stabilityShardsTimeline.tweenTo(`stability${newStability}`);
    }
    return this.actor.update(
      {"system.stability.value": newStability},
      {updateAnim}
    );
  }


  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [C.SYSTEM_ID, "sheet", "k4-sheet", "k4-actor-sheet", "k4-theme-dgold"],
      tabs:    [
        {navSelector: ".tabs", contentSelector: ".tab-content", initial: "front"}
      ],
      submitOnChange: false
    });
  }

  override get template() {
    return `systems/kult4th/templates/sheets/${this.actor.type}-sheet.hbs`;
  }

  hoverTimeline?: GsapAnimation;
  hoverTimelineTarget?: HTMLElement;
  // devTools = GSDevTools;

  override async getData() {
    const baseContext = await super.getData();

    const context = {
      ...baseContext,
      baseMoves:       this.actor.basicMoves,
      derivedMoves:    this.actor.derivedMoves,
      advantages:      this.actor.advantages,
      disadvantages:   this.actor.disadvantages,
      darksecrets:     this.actor.darkSecrets,
      relations:       this.actor.relations,
      weapons:         this.actor.weapons,
      gear:            this.actor.gear,
      attributes:      this.actor.attributeData,
      curTab:          this.actor.getFlag("kult4th", "sheetTab"),
      statusBarStrips: this.actor.statusBarStrips
    };
    /*DEVCODE*/
    kLog.log("Final Actor Data", context);
    Object.assign(globalThis, {actor: this.actor, sheet: this});
    /*!DEVCODE*/
    return context;
  }







  override setPosition(posData: Partial<Application.Position>) {
    super.setPosition(posData);
    // cqApi.reevaluate();
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
  unClamp(element: HTMLElement) { element.style.cssText = ""; }

  /* Modifier report resizing function
  - accepts the JQuery HTML context of the character sheet
  - locates the modifier report element
  - compares the height of the element to the height of a single row of modifiers (20px)
  - if the height is larger than a single row, first, it adds the "minimal" class to the .modifiers-report element
    - the minimal class sets font size to zero except for <strong> elements, reducing the width of each modifier span
    - it checks again to see how many rows of modifiers there are
    - if there is no change to the number of rows, it removes the minimal class
  - sets the `--num-modifier-rows` on the `.tab.front` element to the number of rows (with or without the minimal class) */
  resizeModifierReport(html: JQuery) {
    // Get the width of the container element
    const container$ = html.find(".tab.front.active");
    if (!container$.length) { return undefined; }
    const formWidth = container$.width() ?? Infinity;
    const report$ = html.find(".modifiers-report");
    if (!report$.length) { return undefined; }
    report$.removeClass("minimal");
    report$.css("width", "");
    const modReportWidth = report$.width() ?? 0;
    let height = report$.height();
    if (modReportWidth > formWidth) {
      report$.css("width", formWidth);
      height = report$.height();
    }
    if (!height) { return undefined; }
    let rows = Math.floor(height / 20);
    if (rows > 1) {
      report$.addClass("minimal");
      height = report$.height()!;
      const newRows = Math.floor(height / 20);
      if (newRows === rows) {
        report$.removeClass("minimal");
      } else {
        rows = newRows;
      }
    }
    html.find(".tab.front").css("--num-modifier-rows", rows);
  }
//   void this.activateChargenArchetypeListeners(html);
//   break;
// }
// case K4CharGenPhase.attributesAndTraits: {
//   void this.activateChargenAttributesAndTraitsListeners(html);
//   break;
// }
// case K4CharGenPhase.details: {
//   void this.activateChargenDetailsListeners(html);
//   break;
// }
// case K4CharGenPhase.relations: {
//   void this.activateChargenRelationsListeners(html);



  // async activateChargenArchetypeListeners(html: JQuery) {
  //   const carouselScene$ = html.find(".archetype-staging");
  //   void this.updateArchetypeExamples(html);
  //   await ANIMATIONS.archetypeCarouselTimeline(carouselScene$, 200, this.actor);

  //   const getUnlistedItemsOfType = (type: K4ItemType.disadvantage|K4ItemType.darksecret) => {
  //     const {archetype} = this.actor;
  //     if (!archetype) { return []; }
  //     const listedTraits: string[] = [];
  //     const cData = this.getArchetypeCarouselData();
  //     if (cData[archetype]?.[type]) {
  //       listedTraits.push(
  //         ...Object.keys(cData[archetype][type])
  //           .map((traitName) => traitName.replace(/^!/, ""))
  //       );
  //     }
  //     return getGame().items
  //       .filter((item: any): item is K4Item<K4ItemType.disadvantage|K4ItemType.darksecret> =>
  //         item.type === type && !listedTraits.includes(item.name)
  //       );
  //   };

  //   // Add listeners to "more" buttons
  //   html.find("button.more-disadvantages").on({
  //     click: async () => {
  //       const item = await K4Dialog.GetUserItemSelection<K4ItemType.disadvantage>({
  //         title: "Select a Disadvantage",
  //         bodyText: "(<strong>Click</strong> to View, <strong>Right</strong>-Click to Select, <strong>Escape</strong> to Cancel.)",
  //         itemList: getUnlistedItemsOfType(K4ItemType.disadvantage)
  //       });
  //       if (item) {
  //         await this.actor.charGenSelect(item.name, false);
  //       }
  //     }
  //   });
  //   html.find("button.more-dark-secrets").on({
  //     click: async () => {
  //       const item = await K4Dialog.GetUserItemSelection<K4ItemType.darksecret>({
  //         title: "Select a Dark Secret",
  //         bodyText: "(<strong>Click</strong> to View, <strong>Right</strong>-Click to Select, <strong>Escape</strong> to Cancel.)",
  //         itemList: getUnlistedItemsOfType(K4ItemType.darksecret)
  //       });
  //       if (item) {
  //         await this.actor.charGenSelect(item.name, false);
  //       }
  //     }
  //   });


  // }
  // async activateChargenAttributesAndTraitsListeners(html: JQuery) {
  //   await Promise.resolve(html);
  // }
  // async activateChargenDetailsListeners(html: JQuery) {
  //   await Promise.resolve(html);
  // }
  // async activateChargenRelationsListeners(html: JQuery) {
  //   await Promise.resolve(html);
  // }
  activateNavMenuListeners(html: JQuery): Array<Tuple<HTMLElement, GsapAnimation>> {
    const self = this;
    const hoverTimelines: Array<Tuple<HTMLElement, GsapAnimation>> = [];
    // Iterate over each nav-panel element to set up animations and styles
    html.find(".nav-panel").each(function() {
      // Remove flare background if the "flare" setting is disabled
      if (!U.getSetting("flare")) {
        gsap.set(self.element.find(".nav-flare"), {background: "none"});
      }
      // Set profile image background to black if animations are disabled
      if (!U.getSetting("animations")) {
        gsap.set(self.element.find(".profile-image-animation"), {background: C.Colors.GREY1});
      }
      // Add hover animation to the hoverTimelines array for nav-panel
      hoverTimelines.push([this, ANIMATIONS.hoverNav(this)]);
    });

    // Iterate over each nav-tab element to set up animations and click listeners
    html.find(".nav-tab")
      .each(function() {
        // Add hover animation to the hoverTimelines array for nav-tab
        hoverTimelines.push([this, ANIMATIONS.hoverNavTab(this)]);
        // Add click listener to activate the corresponding tab when clicked
        $(this).on("click", function() {
          self.activateTab(this.getAttribute("data-tab"));
        });
      });

    return hoverTimelines;
  }

  animateGears(html: JQuery, isEnabled = true) {
    if (isEnabled) {
      // Rotate huge gears
      html.find(".gear-container.gear-huge")
        .each(function() {
          U.gsap.effects.gearHugeRotate(this);
        });
      // Rotate Geburah gears
      html.find(".gear-container.gear-geburah")
        .each(function() {
          U.gsap.effects.gearGeburahRotate(this);
        });
      // Rotate Binah gears
      html.find(".gear-container.gear-binah")
        .each(function() {
          U.gsap.effects.gearBinahRotate(this);
        });
    } else {
      // Remove all gear containers if the setting is disabled
      html.find(".gear-container")
        .remove();
    }
  }

  animateStability(html: JQuery) {
    this._glitchTimeline = this.#buildGlitchTimeline(html);
    this._stabilityShardsTimeline = this.#buildStabilityShardsTimeline(html);
    this.stabilityShardsTimeline.seek(`stability${this.actor.system.stability.value}`);
    gsap.set(html.find("#stability-shards-clip path"), {
      transformOrigin: "center center",
      scale:           1.1,
      display:         "block"
    });
    gsap.set(html.find("#shard-11"), {
      transformOrigin: "left center",
      display:         "block",
      scale:           1.2
    });
    gsap.set(html.find("#stability-shards-clip path"), {
      transformOrigin: "center center"
    });

    gsap.set(html.find("#stability-gear-geburah"), {x: 700, y: 180, scale: 2, transformOrigin: "center center"});
    gsap.set(html.find("#stability-gear-binah"), {x: -200, y: -200, scale: 2, transformOrigin: "center center"});
    gsap.to(html.find("#stability-gear-geburah"), {rotation: "+=360", duration: 10, repeat: -1, ease: "none"});
    gsap.to(html.find("#stability-gear-binah"), {rotation: "-=360", duration: 10, repeat: -1, ease: "rough({strength: 0.2, points: 25, template: sine, taper: out, randomize: true, clamp: false})"});
    gsap.set(html.find("#stability-animation-bg img, .stability-count, #stability-frame"), {opacity: 1});
  }




  activateStabilityListeners(html: JQuery) {
    let clickStatus = false;
    const buttonContainer$ = html.find(".button-container");
    const dblClickCheck = (event: DoubleClickEvent) => {
      event.preventDefault();
      if (clickStatus) { return; }
      clickStatus = true;
      buttonContainer$.off("dblclick");
      void this.changeStability(-1 as number);
    };
    const clickCheck = (event: DoubleClickEvent) => {
      event.preventDefault();
      if (clickStatus) { return; }
      console.log("CLICK");
      buttonContainer$.off("click");
      buttonContainer$.on("dblclick", dblClickCheck.bind(this));
      setTimeout(() => {
        buttonContainer$.off("dblclick");
        clickStatus = false;
        buttonContainer$.on({
          click: clickCheck.bind(this)}
        );
      }, 250);
    };

    buttonContainer$.on({
      click:       clickCheck.bind(this),
      contextmenu: (event) => {
        event.preventDefault();
        void this.changeStability(1 as number);
      }
    });
  }
  animateEdges(html: JQuery) {
    if (this.actor.activeEdges.length) {
      gsap.to(html.find(".edges-header"), {autoAlpha: 1, duration: 0});
      gsap.to(html.find(".edges-count"), {autoAlpha: 1, duration: 0});
      gsap.to(html.find(".edges-source"), {autoAlpha: 1, duration: 0});
      gsap.to(html.find(".edges .hover-strip"), {autoAlpha: 1, duration: 0});
      gsap.to(html.find(".edges-blade-container"), {autoAlpha: 1, duration: 0});

      const numEdges = this.actor.system.edges.value;
      gsap.to(
        html.find(".edges-blade-container svg"),
        {autoAlpha: 1, rotation: 175 + (20 * numEdges), duration: 0}
      );
    }
  }
  animateHoverStrips(html: JQuery): Array<Tuple<HTMLElement, GsapAnimation>> {
    const {actor} = this;
    const hoverTimelines: Array<Tuple<HTMLElement, GsapAnimation>> = [];
    // Add hover animations for hover-strip elements
    html.find(".hover-strip")
    .each(function() {
      hoverTimelines.push([this, ANIMATIONS.hoverStrip(this, html, actor)]);
    });

    // Add hover animations for hover-strip button elements
    html.find(".hover-strip .strip-button")
      .each(function() {
        hoverTimelines.push([this, ANIMATIONS.hoverStripButton(this)]);
      });
    return hoverTimelines;
  }
  activateHoverStripListeners(html: JQuery) {
    const self = this;
    // Add click listeners for elements with data-action="open" to open item sheets
    html.find("*[data-action=\"open\"]")
    .each(function() {
      const itemName = $(this).attr("data-item-name");
      if (itemName) {
        $(this).on("click", () => self.actor.getItemByName(itemName)?.sheet?.render(true));
      }
    });

    // Add click listeners for elements with data-action="roll" to roll item actions
    html.find("*[data-action=\"roll\"]")
      .each(function() {
        const itemName = $(this).attr("data-item-name");
        if (itemName) {
          $(this).on({
            click: () => { void self.actor.roll(itemName); }
          });
        }
      });

    // Add click listeners for elements with data-action="trigger" to trigger item actions
    html.find("*[data-action=\"trigger\"]")
      .each(function() {
        const itemName = $(this).attr("data-item-name");
        if (itemName) {
          $(this).on({
            click: () => { void self.actor.trigger(itemName); }
          });
        }
      });

    // Add click listeners for elements with data-action="chat" to display item summaries in chat
    html.find("*[data-action=\"chat\"]")
      .each(function() {
        const itemName = $(this).attr("data-item-name");
        if (itemName) {
          $(this).on({
            click: () => { void self.actor.getItemByName(itemName)?.displayItemSummary(self.actor.name); }
          });
        }
      });

    // Add click listeners for elements with data-action="drop" to drop items
    html.find("*[data-action=\"drop\"]")
    .each(function() {
      const itemName = $(this).attr("data-item-name");
      if (itemName) {
        $(this).on({
          click: () => { void self.actor.dropItemByName(itemName); }
        });
        return;
      }
      const conditionID = $(this).attr("data-condition-id");
      if (conditionID) {
        $(this).on({
          click: () => { void self.actor.removeCondition(conditionID as IDString); }
        });
        return;
      }
      const woundID = $(this).attr("data-wound-id");
      if (woundID) {
        $(this).on({
          click: () => { void self.actor.removeWound(woundID as IDString); }
        });
        return;
      }
    });
  }
  activateHoverListeners(hoverTimelines: Array<Tuple<HTMLElement, GsapAnimation>>) {
    hoverTimelines.forEach(([target, anim]) => {
      $(target)
        .on("mouseenter", () => {
          anim.timeScale(1);
          anim.reversed(false);
        })
        .on("mouseleave", () => {
          anim.timeScale(2);
          anim.reversed(true);
        });
    });
  }
  applyPlaceholderText(html: JQuery) {
    html.find(".content-editable")
      .each(function() {
        $(this).attr("contenteditable", "false");
        const innerText = $(this).text().trim();

        if ((!innerText && $(this).data("placeholder"))
          || (innerText === $(this).data("placeholder"))) {
          $(this)
            .addClass("placeholder")
            .text($(this).data("placeholder") as string);
        }
      });
  }
  activateResizeListener(html: JQuery) {
    const resizableHandle = html.find(".window-resizable-handle");
    const debouncedResizeModifierReport = foundry.utils.debounce(() => { this.resizeModifierReport(html); }, 1);

    const onMouseMove = () => {
      debouncedResizeModifierReport();
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      this.resizeModifierReport(html); // Final call to ensure the last size is handled
    };

    resizableHandle.on("mousedown", () => {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      this.resizeModifierReport(html); // Initial call to handle the start of the resize
    });

    // Initial call to resizeModifierReport
    requestAnimationFrame(() => { this.resizeModifierReport(html); });
  }
  setActiveTab(html: JQuery) {
    const curTab = this.actor.getFlag("kult4th", "sheetTab");
    html.find(".tab.active").each(function() {
      if (this.getAttribute("data-tab") !== curTab) {
        this.classList.remove("active");
      }
    });
    html.find(`.tab[data-tab="${curTab}"]`).addClass("active");
  }
  activateStatusStripListeners(html: JQuery) {
    const self = this;
    // Add click listeners for wound-add buttons to add a new wound
    html.find("button.wound-add")
      .each(function() {
        $(this).on({
          click: () => {
            // kLog.log("Adding Wound. Button:", this);
            void self.actor.addWound().catch((err: unknown) => { kLog.error(String(err)); });
          }
        });
      });

    // Add click listeners for wound-delete buttons to remove a specific wound
    html.find("button.wound-delete")
      .each(function() {
        const woundID = $(this).data("woundId") as IDString;
        $(this).on({
          click: () => {
            // kLog.log(`Deleting Wound ${woundID}. Button:`, this);
            void self.actor.removeWound(woundID).catch((err: unknown) => { kLog.error(String(err)); });
          }
        });
      });

    // Add click listeners for elements with data-action="toggle-wound-type" to toggle the wound type
    html.find("*[data-action=\"toggle-wound-type\"]")
      .each(function() {
        const woundID = $(this).data("target") as IDString;
        if (woundID) {
          $(this).on({
            click: () => { void self.actor.toggleWound(woundID, "type"); }
          });
        }
      });

    // Add click listeners for elements with data-action="reset-wound-name" to reset the wound name
    html.find("*[data-action=\"reset-wound-name\"]")
      .each(function() {
        const woundID = $(this).data("target") as IDString;
        if (woundID) {
          $(this).on({
            click: () => { void self.actor.resetWoundName(woundID); }
          });
        }
      });

    // Add click listeners for elements with data-action="toggle-wound-stabilize" to toggle wound stabilization
    html.find("*[data-action=\"toggle-wound-stabilize\"]")
      .each(function() {
        const woundID = $(this).data("target") as IDString;
        if (woundID) {
          $(this).on({
            click: () => { void self.actor.toggleWound(woundID, "stabilized"); }
          });
        }
      });

    // Add click listeners for elements with data-action="drop-wound" to remove a specific wound
    html.find("*[data-action=\"drop-wound\"]")
      .each(function() {
        const woundID = $(this).data("target") as IDString;
        if (woundID) {
          $(this).on({
            click: () => { void self.actor.removeWound(woundID); }
          });
        }
      });

    // Add click listeners for elements with data-action="suppress-wound" to remove a specific wound
    html.find("*[data-action=\"suppress-wound\"]")
      .each(function() {
        const woundID = $(this).data("target") as IDString;
        if (woundID) {
          $(this).on({
            click: () => { void self.actor.toggleWound(woundID, "applying"); }
          });
        }
      });

    // Add click listeners for condition-add buttons to add a new condition
    html.find("button.condition-add")
    .each(function() {
      $(this).on({
        click: async () => {
          const type = await K4Dialog.GetUserInput<string>(
            {
              title: "Condition Type",
              bodyText: "Select the type of condition to add:"
            }, {
              input: PromptInputType.buttons,
              inputVals: Object.values(K4ConditionType)
                .map((cType) => U.tCase(cType))
            });
          if (U.isUndefined(type)) {
            return;
          }
          switch (type as K4ConditionType) {
            case K4ConditionType.stability: {
              const label: string|false = await K4Dialog.GetUserInput(
                {
                  title: "Condition Label",
                  bodyText: "Enter the label for the new Stability condition:",
                  subText: "(Preconfigured Conditions: 'Angry', 'Sad', 'Scared', 'Guilt-Ridden', 'Obsessed', 'Distracted', 'Haunted')"
                }, {
                  input: PromptInputType.text
                }
              );
              if (!label) { return; }
              const preconfiguredData = StabilityConditions[U.lCase(label) as keyof typeof StabilityConditions];
              let {description, modDef} = preconfiguredData as Maybe<{description: string, modDef: K4Roll.ModDefinition}> ?? {};
              if (U.isUndefined(description)) {
                description = (await K4Dialog.GetUserInput<string>(
                  {
                    title: "Condition Description",
                    bodyText: `Briefly describe the effects of the '${label}' condition on your mental state:`,
                    subText: "E.g. 'You feel threatened. You instinctively want to retreat from the situation and seek out a hiding spot.'"
                  }, {
                    input: PromptInputType.text
                  }
                )) || undefined;
              }
              if (U.isUndefined(modDef)) {
                const modDefString = await K4Dialog.GetUserInput<string>(
                  {
                    title: "Condition Modifiers",
                    bodyText: "Define what and by how much the condition modifies. Multiple modifiers can be separated by a comma.",
                    subText: "E.g. 'all: -2, disadvantage: -1, See Through the Illusion: 3'"
                  }, {
                    input: PromptInputType.text,
                    defaultVal: "all:-1"
                  }
                );
                modDef = Object.fromEntries(modDefString
                  .split(/\s*,\s*/)
                  .map((mod) => {
                    const [key, val] = mod.split(/\s*:\s*/);
                    return [key, U.pInt(val)];
                  }));
              }
              self.actor.addCondition({
                type: type as K4ConditionType,
                label,
                description,
                modDef
              }).catch((err: unknown) => { kLog.error(String(err)); });
              break;
            }
            case K4ConditionType.other: {
              console.warn("K4ConditionType.other: Unimplemented.");
              break;
            }
          }
        }
      });
    });

    // Add click listeners for condition-delete buttons to remove a specific condition
    html.find("button.condition-delete")
      .each(function() {
        const conditionID = $(this).data("conditionId") as IDString;
        $(this).on("click", () => {
          // kLog.log(`Deleting condition ${conditionID}. Button:`, this);
          self.actor.removeCondition(conditionID).catch((err: unknown) => { kLog.error(String(err)); });
        });
      });

    // Add click listeners for elements with data-action="suppress-condition" to toggle roll applicability
    html.find("*[data-action=\"suppress-condition\"]")
      .each(function() {
        const conditionID = $(this).data("target") as IDString;
        if (conditionID) {
          $(this).on({
            click: () => { void self.actor.toggleCondition(conditionID); }
          });
        }
      });

    // Add click listeners for elements with data-action="reset-condition-name" to reset the condition name
    html.find("*[data-action=\"reset-condition-name\"]")
      .each(function() {
        const conditionID = $(this).data("target") as IDString;
        if (conditionID) {
          $(this).on({
            click: () => { void self.actor.resetConditionName(conditionID); }
          });
        }
      });

    // Add click listeners for elements with data-action="drop-condition" to remove a specific condition
    html.find("*[data-action=\"drop-condition\"]")
      .each(function() {
        const conditionID = $(this).data("target") as IDString;
        if (conditionID) {
          $(this).on({
            click: () => { void self.actor.removeCondition(conditionID); }
          });
        }
      });
  }
  activateToggleStripListeners(html: JQuery) {
    this.actor.toggleableEffects.forEach((effect: any) => { effect.applyToggleListeners(html); });
  }
  activateWindowControlListeners(html: JQuery) {
    const self = this;
    // Add click listeners for close buttons in the header to close the sheet
    html.find(".header-button.close")
      .each(function() {
        $(this).on({
          click: () => { void self.actor.sheet?.close(); }
        });
      });

    // Add click listeners for minimize buttons in the header to toggle minimize/maximize state
    html.find(".header-button.minimize")
      .each(function() {
        $(this).on("click", () => {
          if (self._minimized) {
            self.maximize().catch((err: unknown) => { kLog.error(String(err)); });
          } else {
            self.minimize().catch((err: unknown) => { kLog.error(String(err)); });
          }
        });
      });
  }
  activateContentEditableListeners(html: JQuery) {
    const self = this;
    // Initialize content-editable elements with click, focus, and blur listeners for inline editing
    html.find(".content-editable").each(function() {
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
            elemContent = elem$.html().replace(/<br\s*\/?>/gi, "\n");
            // Remove any other HTML tags
            elemContent = elemContent.replace(/<[^>]*>/g, "");
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
            content = content.replace(/<br\s*\/?>/gi, "\n");
            // Remove any HTML tags that might have been introduced
            content = content.replace(/<[^>]*>/g, "");
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

          if (elem$.hasClass("simple-editor")) {
            // Preserve line breaks by replacing them with <br> tags
            elemHtml = elemHtml
              .replace(/\r?\n/g, "<br>")
              .replace(/(<br>)+$/g, ""); // Remove trailing <br> tags
          }

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
            self.actor.update({[dataField]: elemHtml}).catch((err: unknown) => {
              kLog.error(`Failed to update ${dataField}: ${String(err)}`);
            });
          }
        });
    });
  }

  /**
   * Waits for this.element to be available, up to a maximum of 10 seconds.
   * @returns A Promise that resolves to this.element when it becomes available.
   * @throws Error if this.element is not available after 10 seconds.
   */


  get twitchyEyeSize(): number {
    switch (this.actor.stabilityLevel) {
      case K4Stability.composed: return 0;
      case K4Stability.moderate: return U.randInt(1, 1);
      case K4Stability.serious: return U.randInt(1, 2);
      case K4Stability.broken: return U.randInt(2, 3);
    }
    return 0;
  }
  get twitchyEyeIntensity(): number {
    switch (this.actor.stabilityLevel) {
      case K4Stability.composed: return 0;
      case K4Stability.moderate: return U.randInt(1, 1);
      case K4Stability.serious: return U.randInt(2, 3);
      case K4Stability.broken: return 3;
    }
    return 0;
  }
  _twitchyEyeCurPos = 0;
  get twitchyEyePosition(): number {
    let pos = U.randInt(1, 10);
    while (pos === this._twitchyEyeCurPos) {
      pos = U.randInt(1, 10);
    }
    this._twitchyEyeCurPos = pos;
    return this._twitchyEyeCurPos;
  }
  get twitchyEyeClassString(): string {
    return [
      `size-${this.twitchyEyeSize}`,
      `intensity-${this.twitchyEyeIntensity}`,
      `position-${this.twitchyEyePosition}`
    ].join(" ");
  }

  flashTwitchyEye(html: JQuery) {
    const self = this;
    const eyeContainer$ = html.find("#twitchy-eye");
    const eyeImg$ = eyeContainer$.find("img");
    const tabContent$ = eyeContainer$.closest(".tab-content");

    if (U.gsap.isTweening(eyeContainer$) || U.gsap.isTweening(tabContent$) || U.gsap.isTweening(eyeImg$)) { return; }

    eyeContainer$.attr("class", this.twitchyEyeClassString);
    const repeatDelay = U.randNum(0.5, this.twitchyEyeIntensity + 1, "power2.in");
    kLog.log(`Repeat Delay: ${U.pFloat(repeatDelay, 3)}`);

    U.gsap.timeline({
      repeat: 1,
      repeatDelay,
      yoyo: true
    })
      .fromTo(eyeContainer$, {opacity: 0}, {
        opacity: 1,
        duration: 0.25,
        ease: "power2.out"
      }, 0.25);
  }

  _twitchyEyeTimer: Maybe<NodeJS.Timeout> = undefined;
  startTwitchyEyeTimer(html: JQuery) {
    if (!this.actor.isFinishedCharGen) { return; }
    if (this._twitchyEyeTimer) {
      clearTimeout(this._twitchyEyeTimer);
    }
    if (this.actor.stabilityLevel === K4Stability.composed) {
      return;
    }
    const stability = this.actor.stability;
    const ONE_MINUTE = 6;
    const period = stability * ONE_MINUTE;

    this._twitchyEyeTimer = setTimeout(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime % period === 0) {
        this.flashTwitchyEye(html);
      }
      this.startTwitchyEyeTimer(html);
    }, 1000);
  }
  override activateListeners(html: JQuery) {

    // Call the parent class's activateListeners method to ensure any inherited listeners are also activated
    super.activateListeners(html);
    const self = this;

    // Remove shadows from tab content if the "shadows" setting is disabled
    if (!U.getSetting("shadows")) {
      html.find(".tab-content").each(function() { $(this).css("filter", "none");});
    }

    const hoverTimelines: Array<Tuple<HTMLElement, GsapAnimation>> = [];

    // Activate listeners for the navigation menu
    hoverTimelines.push(...this.activateNavMenuListeners(html));

    // Apply text clamping to each element with the class "clamp-text"
    html.find(".clamp-text").each(function() {
      self.clamp(this);
    });

    // Handle gear animations based on the "gears" setting
    this.animateGears(html.parent(), U.getSetting<boolean>("gears"));

    // Set actor name background to black if animations are disabled
    if (!getGame().settings.get("kult4th", "animations")) {
      gsap.set(this.element.find(".actor-name-bg-anim"), {background: C.Colors.GREY1});
    }

    // Animate stability display
    this.animateStability(html);

    // Activate double-click and right-click listeners for stability display
    this.activateStabilityListeners(html);

    // Animate any edges
    this.animateEdges(html);

    // Animate hover strips
    hoverTimelines.push(...this.animateHoverStrips(html));

    // Activate hover-strip listeners ("open", "roll", "trigger", "chat", "drop")
    this.activateHoverStripListeners(html);

    // Activate hover listeners
    this.activateHoverListeners(hoverTimelines);

    // Initialize content-editable elements with placeholder text if necessary
    this.applyPlaceholderText(html);

    // Add resize listener that calls resizeModifierReport when sheet is resized
    this.activateResizeListener(html);

    // Set active tab
    this.setActiveTab(html);

    // If the sheet is not editable, return early
    if (!this.options.editable) { return undefined; }

    // Activate wound & stability condition listeners
    this.activateStatusStripListeners(html);

    // Activate toggle strip listeners
    this.activateToggleStripListeners(html);

    // Activate listeners for closing & minimizing the sheet
    this.activateWindowControlListeners(html);

    html.find("#item-test-button").on({
      click: this._promptItemSelection(
        Array.from(getGame().items as Collection<K4Item>).filter((item) => item.type === K4ItemType.advantage)
      ).bind(this)
    });

    // Activate listeners for editing "content-editable" elements
    this.activateContentEditableListeners(html);

    // Activate interval timer for twitchy-eye effect
    this.startTwitchyEyeTimer(html);
  }

  override async close() {
    CONFIG.K4.isCharGenInitialized = false;
    return super.close();
  }

  _promptItemSelection(itemList: K4Item[]) {
    return async () => {
      const item = await K4Dialog.GetUserItemSelection<K4ItemType.advantage>({
          title: "Select an Advantage",
          bodyText: "Select an advantage to apply to the actor.",
          subText: "This is some test subtext.",
          itemList
        });
        if (item) {
          void this.actor.createEmbeddedDocuments("Item", [item as K4Item & Record<string, unknown>]);
        }
    };
  }

  override activateTab(tabName: string | null) {
    tabName ??= "front";
    const curTab = this.actor.getFlag("kult4th", "sheetTab");
    if (tabName && tabName !== curTab) {
      this.actor.setFlag("kult4th", "sheetTab", tabName).catch((err: unknown) => { kLog.error(String(err)); });
    }
  }
}



export default K4PCSheet;
