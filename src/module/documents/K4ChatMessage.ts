// #region IMPORTS ~
import C from "../scripts/constants.js";
import U from "../scripts/utilities.js";
import K4Actor, {K4ActorType} from "./K4Actor.js";
import K4Item, {K4ItemType} from "./K4Item.js";
import {K4RollResult} from "./K4Roll.js";
import K4ActiveEffect, {UserRef} from "./K4ActiveEffect.js";
import K4GMTracker from "../documents/K4GMTracker.js";
// #endregion

// #region TYPES ~
namespace K4ChatMessage {
  export interface FlagData {
    kult4th: {
      cssClasses: string[];
      isSummary: boolean;
      isAnimated: boolean;
      isRoll: boolean;
      isTrigger: boolean;
      isEdge: boolean;
      rollOutcome?: K4RollResult;
      rollData?: K4Roll.Serialized.Base;
      chatSelectListeners?: Record<
        string, // the listRef
        {
          // The necessary parameters to run the listener and construct the onSelect() callback
        }
      >,
      chatSelectValue?: number // The index of the selected value
    }
  }

  // export interface ConstructorData extends Omit<ChatMessageDataConstructorData, "flags"> {
  //   flags: FlagData & Record<string, unknown>;
  // }

}
// #endregion
// #region -- INTERFACE AUGMENTATION ~
// interface K4ChatMessage {
//   get id(): IDString;
// }
// #endregion
// #endregion

function getStaggerList(stagger?: number | number[], defaultStagger?: number|number[]): number[] {
  if (Array.isArray(stagger)) {
    return stagger;
  }
  const length = Array.isArray(defaultStagger) ? defaultStagger.length : 10;
  if (typeof stagger === "number") {
    return (Array.from({length})).fill(stagger) as number[];
  }
  if (Array.isArray(defaultStagger)) {
    return defaultStagger;
  }
  if (U.isNumber(defaultStagger)) {
    return (Array.from({length})).fill(defaultStagger) as number[];
  }
  return (Array.from({length})).fill(0) as number[];
}

const MASTERTIMELINES = {
  animateRollResult: (message$: JQuery, msg: K4ChatMessage, stagger?: ValueOrArray<number>) => {
    const staggers = getStaggerList(
      stagger,
      [
        0.5,      // intro line stagger
        1,        // source line stagger
        1,        // dice stagger
        0,        // modifiers stagger
        0,        // total stagger
        1.75,      // outcome stagger
        1,        // window scroll stagger
        0,        // success/fail stagger
        0         // results stagger
      ]
    );

    // Determine the current and maximum height of the message for scrolling purposes
    const messageContent$ = message$.find(".message-content");
    const results$ = message$.find(".roll-dice-results ~ div, .roll-dice-results ~ label, .roll-dice-results ~ h2, .roll-dice-results ~ ul li");
    const curHeight = message$.height() ?? 0;
    results$.css({
      display: "block",
      visibility: "visible",
      opacity: 0
    });
    let endHeight = message$.height() ?? 0;
    if (endHeight > 800) {
      messageContent$.css({"--chat-font-size-large": "12px", "--chat-line-height-large": "16px"})
      endHeight = message$.height() ?? 0;
    }
    results$.css({
      display: "none",
      visibility: "hidden",
      opacity: ""
    });
    message$.css({minHeight: curHeight, maxHeight: curHeight});
    messageContent$.css({minHeight: curHeight, maxHeight: curHeight});

    kLog.log(`Current Height: ${curHeight}; End Height: ${endHeight}`);

    const tl = U.gsap.timeline()
      .add(CHILD_TIMELINES.animateCharName(message$))
      .add(CHILD_TIMELINES.animateIntroLine(message$), `<+=${staggers[0]}`)
      .add(CHILD_TIMELINES.animateSource(message$), `<+=${staggers[1] ?? U.getLast(staggers)}`)
      .add(CHILD_TIMELINES.animateDice(message$), `<+=${staggers[2] ?? U.getLast(staggers)}`)
      .add(CHILD_TIMELINES.animateModifiers(message$), `<+=${staggers[3] ?? U.getLast(staggers)}`)
      .add(CHILD_TIMELINES.animateTotal(message$), `<+=${staggers[4] ?? U.getLast(staggers)}`)
      .add(CHILD_TIMELINES.animateOutcome(message$), `<+=${staggers[5] ?? U.getLast(staggers)}`)
      .add(CHILD_TIMELINES.animateWindowSize(message$, curHeight, endHeight), `<+=${staggers[6] ?? U.getLast(staggers)}`);

    if (message$.hasClass("roll-failure")) {
      tl.add(CHILD_TIMELINES.animateToFailure(message$), `<+=${staggers[7] ?? U.getLast(staggers)}`);
    } else if (message$.hasClass("roll-success")) {
      tl.add(CHILD_TIMELINES.animateToSuccess(message$), `<+=${staggers[7] ?? U.getLast(staggers)}`);
    } else if (message$.hasClass("roll-partial")) {
      tl.add(CHILD_TIMELINES.animateToPartial(message$), `<+=${staggers[7] ?? U.getLast(staggers)}`);
    }

    tl.add(CHILD_TIMELINES.animateResults(message$, msg), `<+=${staggers[8] ?? U.getLast(staggers)}`);

    if (msg.onSelectEffectData.length && !msg.wasOnSelectSelected) {
      tl.call(() => { void msg.applySelectionListeners(); })
    } else {
      tl.call(() => {
        msg.addClass(["not-animating"]);
      }, [], ">+=5")
    }
    tl.addLabel("revealed");


    return tl;
  },
  animateTriggerResult: (message$: JQuery, msg: K4ChatMessage, stagger?: ValueOrArray<number>) => {

    const staggers = getStaggerList(stagger, [
      0.5,      // intro line stagger
      1,        // source line stagger
      // 1,        // dice stagger
      // 0,        // modifiers stagger
      // 0,        // total stagger
      // 1.75,      // outcome stagger
      // 1,        // window scroll stagger
      0,        // success/fail stagger
      0         // results stagger
    ]);

    return U.gsap.timeline()
      .add(CHILD_TIMELINES.animateCharName(message$))
      .add(CHILD_TIMELINES.animateIntroLine(message$), `<+=${staggers[0]}`)
      .add(CHILD_TIMELINES.animateSource(message$), `<+=${staggers[1] ?? U.getLast(staggers)}`)
      .add(CHILD_TIMELINES.animateToSuccess(message$), `<+=${staggers[7] ?? U.getLast(staggers)}`)
      .add(CHILD_TIMELINES.animateResults(message$, msg), `<+=${staggers[8] ?? U.getLast(staggers)}`)
      .addLabel("revealed");
  },
}

const CHILD_TIMELINES = {
  animateCharName(message$: JQuery): gsap.core.Timeline {
    // const messageContent$ = message$.find(".message-content");
    const dropCap$ = message$.find(".drop-cap");
    const charName$ = message$.find(".roll-char-name");

    // Split the character name into individual letters
    const splitCharName = new SplitText(charName$, { type: "chars" });
    // Set chatName$ to visibility: visible
    charName$.css("visibility", "visible");

    // Return a timeline that staggers the reveal of both the dropcap and the letters of the character name
    return U.gsap.timeline({
      clearProps: "all",
      onReverseComplete() {
        splitCharName.revert();
      }
    })
      .fromTo(dropCap$, {
        autoAlpha: 0,
        filter: "blur(100px)",
        scale: 5,
        x: -200,
        y: -100,
      }, {
        autoAlpha: 1,
        filter: "blur(0px)",
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "power3"
      })
      .fromTo(splitCharName.chars, {
        autoAlpha: 0,
        skewX: -65,
        x: -80,
        filter: "blur(15px)"
      }, {
        autoAlpha: 1,
        skewX: 0,
        x: 0,
        filter: "blur(0px)",
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out"
      }, 0);
  },
  animateIntroLine(message$: JQuery): gsap.core.Timeline {
    const introLine$ = message$.find(".roll-intro-line");
    const attrTerm$ = message$.find(".text-attributename").attr("style", "");
    const attrFlare$ = message$.find(".roll-term-container[class*='attribute']");

    const splitIntroLine = new SplitText(introLine$, { type: "words" });
    // Set introLine$ to visibility: visible
    introLine$.css("visibility", "visible");

    return U.gsap.timeline({
      onReverseComplete() {
        splitIntroLine.revert();
      }
    })
      .fromTo(splitIntroLine.words, {
        autoAlpha: 0,
        x: -100,
        filter: "blur(50px)"
      }, {
        autoAlpha: 1,
        x: 0,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.1
      }, 0)
      .fromTo(attrTerm$, {
          filter: "brightness(1) saturate(1)",
          display: "inline-block",
          scale: 1
      }, {
          filter: "saturate(2) brightness(1.5) ",
          scale: 1.35,
          repeat: 1,
          yoyo: true,
          duration: 0.5,
          ease: "power2.inOut"
      }, "<25%")
      .fromTo(attrFlare$, {
        y: -100,
        scale: 0.64,
        autoAlpha: 0
      }, {
        y: 0,
        scale: 0.64,
        autoAlpha: 1,
        ease: "elastic",
        duration: 2
      }, "-=45%")
      // Call a delayed slow-shrink of the attribute flare a callback so that it doesn't change the timeline's duration
      .call(() => {
        U.gsap.fromTo(attrFlare$,
          {
            y: 0
          }, {
            y: -10,
            ease: "back.out",
            delay: 3,
            duration: 5
          });
      });
  },
  animateSource(message$: JQuery, stagger = 0): gsap.core.Timeline {
    const sourceHeader$ = message$.find(".roll-source-header");
    const sourceName$ = message$.find(".roll-source-name");
    const sourceIcon$ = message$.find(".icon-container.icon-base");

    // Extract RGB values from source header's border color, then define an rgba value with 0 alpha
    const borderRGB = sourceHeader$.css("border-top-color").match(/\d+/g)?.join(",") ?? "255,255,255";
    const borderColorStart = `rgba(${borderRGB}, 0)`;
    const borderColorEnd = `rgba(${borderRGB}, 1)`;

    const tl = U.gsap.timeline()
      .fromTo(sourceHeader$, {
          autoAlpha: 0,
          borderColor: borderColorStart,
      }, {
          autoAlpha: 1,
          borderColor: borderColorEnd,
          delay: 0,
          background: "#000000",
          duration: 0.25,
          ease: "power2.out"
      });

    if (stagger > 0) {
      // Split the source name into individual words
      const splitSourceNameWords = new SplitText(sourceName$, { type: "words" });
      // Set sourceName$ to visibility: visible
      sourceName$.css("visibility", "visible");

      // Add the source name animation to the timeline
      tl.add(U.gsap.timeline({
        onReverseComplete() {
          splitSourceNameWords.revert();
        }
      })
        .fromTo(splitSourceNameWords.words, {
          autoAlpha: 0,
          x: 0,
          scale: 2,
          filter: "blur(1px) brightness(2)"
        }, {
          autoAlpha: 1,
          x: 0,
          scale: 1,
          filter: "blur(0px) brightness(1)",
          duration: 0.5,
          ease: "power2.out",
          stagger
        }), 0.15);
    } else {
      tl
        .fromTo(sourceName$, {
          autoAlpha: 0,
          x: 0,
          scale: 2,
          filter: "blur(1px) brightness(5)"
        }, {
          autoAlpha: 1,
          x: 0,
          scale: 1,
          filter: "blur(0px) brightness(1)",
          duration: 0.5,
          ease: "power2.out",
          stagger
        }, 0.25);
    }

    return tl
      .fromTo(sourceIcon$, {
          autoAlpha: 0,
          x: -100,
          y: 0,
          scale: 1,
          filter: "blur(50px)"
        }, {
          autoAlpha: 1,
          scale: 1,
          x: 0,
          y: 0,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out"
        }, ">-25%");
  },
  animateDice(message$: JQuery): gsap.core.Timeline {
    const d10s$ = message$.find(".roll-d10");
    const d10BGs$ = d10s$.children(".d10-animation");
    const d10Videos = Array.from(d10BGs$.children("video"));
    d10Videos.forEach((video, index) => {
      video.loop = true;
      video.muted = true;
      video.playbackRate = 0.5 + (0.25 * index);
      video.style.display = "block";
    });
    const [d10VideoA, d10VideoB] = d10Videos;

    return U.gsap.timeline()
      .fromTo(d10s$, {
        transformOrigin: "center center",
        scale: 1.5,
        y: -20,
        filter: "brightness(2) blur(5px)"
      }, {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        filter: "brightness(1) blur(0px)",
        ease: "power2.out",
        duration: 0.5,
        stagger: 0.25
      })
      // Manually stagger the play calls for each video
      .call(() => { d10VideoA.currentTime = 0; void d10VideoA.play() }, undefined, 0.25)
      .call(() => { d10VideoB.currentTime = 0; void d10VideoB.play() }, undefined, 0.75)
      // Call a delayed slow-shrink of the dice within a callback so that it doesn't change the timeline's duration
      .call(() => {
        U.gsap.fromTo(d10s$, {
          scale: 1
        }, {
          y: -10,
          scale: 0.8,
          ease: "back.out",
          delay: 3,
          duration: 5
        });
      });
  },
  animateModifiers(message$: JQuery): gsap.core.Timeline {
    const modifiers$ = message$.find(".roll-modifiers .roll-mod");

    return U.gsap.timeline()
      .fromTo(modifiers$, {
        autoAlpha: 0,
        x: -100,
        filter: "blur(50px)"
      }, {
        autoAlpha: 1,
        x: 0,
        filter: "blur(0px)",
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      });
  },
  animateTotal(message$: JQuery): gsap.core.Timeline {
    const msgContainer$ = message$.find(".message-content");
    const gearContainer$ = message$.find(".roll-total-gear");
    kLog.log("Gear Containers: ", {msgContainer$, gearContainer$});
    const middleGear$ = gearContainer$.find("[class*='middle-ring']");
    const outerGear$ = gearContainer$.find("[class*='outer-ring']");
    const totalNum$ = message$.find(".roll-total-number");

    return U.gsap.timeline()
      // Timeline: Outer Gear Component
      .fromTo(outerGear$, {
        scale: 5,
        filter: "blur(15px)"
      }, {
        autoAlpha: 0.85,
        scale: 1,
        filter: "blur(1.5px)",
        ease: "power2.inOut",
        duration: 1,
        onStart() {
          msgContainer$.css("overflow", "visible");
          gearContainer$.css("overflow", "visible");
        },
        onComplete() {
          msgContainer$.css("overflow", "");
          gearContainer$.css("overflow", "");
          U.gsap.to(outerGear$, {
            rotation: "+=360",
            repeat: -1,
            duration: 30,
            ease: "none"
          });
        }
      })

      // Timeline: Middle Gear Component
      .fromTo(middleGear$, {
        scale: 2
      }, {
        rotation: "+=360",
        scale: 1,
        autoAlpha: 1,
        ease: "power3.out",
        duration: 1
      }, 0)
      .to(middleGear$, {
        scale: 1.25,
        duration: 0.5,
        repeat: 1,
        ease: "power2.in",
        yoyo: true,
        onComplete() {
          U.gsap.to(middleGear$, {
            rotation:      "-=20",
            duration:      0.4,
            repeatRefresh: true,
            repeatDelay:   1.6,
            ease:          "back.out(5)",
            repeat:        -1
          })
        }
      })

      // Timeline: Total Number Component
      .fromTo(totalNum$, {
        transformOrigin: "center center",
        // skewX: -25,
        scale: 1.25,
        // x: 100,
        autoAlpha: 0,
        xPercent: -50,
        yPercent: -50,
        filter: "blur(50px) brightness(5)"
    }, {
        autoAlpha: 1,
        // skewX: 0,
        // x: 0,
        scale: 1,
        filter: "blur(0px) brightness(1)",
        ease: "power2.inOut",
        duration: 1
    }, ">-=1.15");
  },
  animateOutcome(message$: JQuery): gsap.core.Timeline {
    const outcome$ = message$.find(".roll-outcome > *");
    return U.gsap.timeline()
      .fromTo(outcome$, {
        transformOrigin: "center center",
        skewX: -25,
        scale: 1,
        x: 100,
        autoAlpha: 0,
        filter: "blur(50px)"
      }, {
        autoAlpha: 1,
        skewX: 0,
        x: 0,
        scale: 1,
        filter: "blur(0px)",
        ease: "power2.inOut",
        duration: 1
    });
  },
  animateWindowSize(message$: JQuery, curHeight: number, maxHeight: number): gsap.core.Timeline {
    const messageContent$ = message$.find(".message-content");
    const results$ = message$.find(".roll-dice-results ~ div, .roll-dice-results ~ label, .roll-dice-results ~ h2, .roll-dice-results ~ ul li");
    // const curHeight = message$.height() ?? 0;
    // results$.css({
    //   display: "block",
    //   visibility: "visible",
    //   opacity: 0
    // });
    // Timeline: Expand chat message to its full height
    return U.gsap.timeline()
      .set(results$, {
        display: "block",
        visibility: "visible",
        opacity: 0
      })
      .fromTo([message$, messageContent$], {
        maxHeight: curHeight
      }, {
        maxHeight,
        duration: 1,
        onUpdate() {
          const newHeight = message$.height() ?? curHeight;
          if (newHeight !== curHeight) {
            K4ChatMessage.ChatLog$[0].scrollTo({
              top: K4ChatMessage.ChatLog$[0].scrollHeight + (newHeight - curHeight)
            });
            curHeight = newHeight;
          }
        }
      });
  },
  animateToSuccess(message$: JQuery): gsap.core.Timeline {
    const msgBgBase$ = message$.find(".message-bg.bg-base");
    message$.find(".message-bg.bg-success").css("visibility", "visible");


    const msgDropCap$ = message$.find(".drop-cap");
    const msgCharName$ = message$.find(".roll-char-name *");
    const msgIntroLine$ = message$.find(".roll-intro-line *");
    const msgAttrName$ = message$.find(".roll-intro-line .text-attributename *");
    const msgIconBase$ = message$.find(".icon-container.icon-base");
    const msgIconSuccess$ = message$.find(".icon-container.icon-success");

    const msgSource = message$.find(".roll-source-header");
    const msgSourceName$ = msgSource.find(".roll-source-name .roll-source-text");
    const msgGears = message$.find(".roll-total-gear > img");
    const msgTotal = message$.find(".roll-total-number");
    const msgOutcomeMain = message$.find(".roll-outcome .roll-outcome-main");
    const msgOutcomeSub = message$.find(".roll-outcome .roll-outcome-sub");
    const msgTextToBrightGold = message$.find(".roll-source-source-name .roll-source-text, .roll-dice-results ~ * *");

    return U.gsap.timeline({ease: "power3.in", clearProps: true})
      .to(msgBgBase$, {autoAlpha: 0, duration: 1, ease: "power2.inOut"})
      .to(msgIconSuccess$, {autoAlpha: 1, duration: 0.25, ease: "power2.inOut"}, 0)
      .to(msgCharName$, {color: C.Colors.GOLD8, duration: 1, ease: "power2.inOut"}, 0)
      .to(msgIntroLine$, {color: C.Colors.GOLD8, duration: 1, ease: "power2.inOut"}, 0)
      .to(msgAttrName$, {color: C.Colors.GOLD8, filter: "brightness(3) saturate(1.5)", duration: 1, ease: "power2.inOut"}, 0)
      .fromTo(msgDropCap$, {filter: "sepia(0) brightness(1) hue-rotate(0deg) saturate(1) contrast(1) drop-shadow(0px 0px 0px rgba(0, 0, 0, 0)"}, {filter: `sepia(0) brightness(1.5) contrast(5) drop-shadow(2px 2px 2px ${C.Colors.GREY0})`, duration: 1}, 0)
        // .fromTo(msgAttrFlare, {filter: "sepia(0) brightness(1) hue-rotate(0deg) saturate(1) contrast(1)"}, {filter: "sepia(5) brightness(0.25) saturate(5) hue-rotate(-45deg) saturate(3) brightness(1) contrast(1)", duration: 1}, 0)
        .fromTo(msgGears, {filter: "blur(1.5px) sepia(0) brightness(1) hue-rotate(0deg) saturate(1) contrast(1)"}, {filter: "blur(1.5px) brightness(1.5) saturate(0.5)", duration: 1}, 0)
        .fromTo(msgTotal, {filter: "brightness(1) saturate(1) contrast(1)"}, {filter: "brightness(1.5) saturate(2) contrast(1)", duration: 1}, 0)
        .to(msgIconBase$, {autoAlpha: 0, duration: 1}, 0)


        .to(msgSource, {opacity: 0, duration: 0.5, ease: "power2.out"}, 0)
        .set(msgSource, {borderTopColor: C.Colors.GOLD9, borderBottomColor: C.Colors.GOLD9, background: "transparent url('/systems/kult4th/assets/backgrounds/texture-gold.webp') repeat repeat center center/300px"}, 0.5)
        .to(msgSource, {opacity: 1, duration: 0.5, ease: "power2.out"}, 0.5)

        .fromTo(msgSourceName$, {
          textShadow: "0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0)"},  {
          color: C.Colors.GREY0,
          textShadow: `0 0 5px ${C.Colors.GOLD8}, 0 0 5px ${C.Colors.GOLD8}, 0 0 5px ${C.Colors.GOLD8}, 0 0 5px ${C.Colors.GOLD8}, 0 0 5px ${C.Colors.GOLD8}, 0 0 5px ${C.Colors.GOLD8}`
        }, 0)
        .to(msgOutcomeMain, {filter: "saturate(0.25)", color: "rgb(255, 255, 255)", textShadow: "0 0 2px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.8), 0 0 4.5px rgba(255, 255, 255, 0.8), 0 0 8px rgba(220, 220, 65, 0.8), 0 0 12.5px rgba(220, 220, 65, 0.8), 0 0 16.5px rgba(220, 220, 65, 0.5), 0 0 21px rgba(220, 220, 65, 0.5), 0 0 29px rgba(220, 220, 65, 0.5), 0 0 41.5px rgba(220, 220, 65, 0.5)", duration: 1, onComplete() {
          msgOutcomeMain.addClass("neon-glow-animated-gold");
          msgOutcomeMain.attr("style", "color: rgb(255, 255, 255); visibility: visible; filter: saturate(0.45)");
        }}, 0)
        .to(msgOutcomeSub, {color: C.Colors.GOLD9, textShadow: "none", duration: 1}, 0)
        .to(msgTextToBrightGold, {color: C.Colors.GOLD8, duration: 1}, 0);
  },
  animateToFailure(message$: JQuery): gsap.core.Timeline {
    /*  const {duration, stagger, ease} = config as {duration: number, stagger: number, ease: string};
      duration: 1,
      stagger: 0,
      ease: "power3.in" */
    const msgBgBase$ = message$.find(".message-bg.bg-base");
    message$.find(".message-bg.bg-fail").css("visibility", "visible");


    const msgDropCap$ = message$.find(".drop-cap");
    const msgAttrFlare = message$.find(".roll-term-container[class*='attribute-']");
    const msgCharName$ = message$.find(".roll-char-name *");
    const msgIntroLine$ = message$.find(".roll-intro-line *");
    const msgAttrName$ = message$.find(".roll-intro-line .text-attributename *");
    const msgIconBase$ = message$.find(".icon-container.icon-base");
    const msgIconFail$ = message$.find(".icon-container.icon-fail");

    const msgSource = message$.find(".roll-source-header");
    const msgSourceName$ = msgSource.find(".roll-source-name .roll-source-text");
    const msgGears = message$.find(".roll-total-gear > img");
    const msgTotal = message$.find(".roll-total-number");
    const msgOutcomeMain = message$.find(".roll-outcome .roll-outcome-main");
    const msgOutcomeSub = message$.find(".roll-outcome .roll-outcome-sub");
    const msgTextToRed = message$.find(".roll-source-source-name .roll-source-text, .roll-dice-results ~ * *");
    // const msgTextToBlack = message$.find(".roll-source-name .roll-source-text");
    return U.gsap.timeline({ease: "power3.in", clearProps: true})
      .to(msgBgBase$, {autoAlpha: 0, duration: 1, ease: "power2.inOut"})
      .to(msgIconFail$, {autoAlpha: 1, duration: 0.25, ease: "power2.inOut"}, 0)
      .to(msgCharName$, {color: C.Colors.RED8, duration: 1, ease: "power2.inOut"}, 0)
      .to(msgIntroLine$, {color: C.Colors.RED8, duration: 1, ease: "power2.inOut"}, 0)
      .to(msgAttrName$, {color: C.Colors.RED8, filter: "brightness(3) saturate(1.5)", duration: 1, ease: "power2.inOut"}, 0)
      .fromTo(msgDropCap$, {filter: "sepia(0) brightness(1) hue-rotate(0deg) saturate(1) contrast(1) drop-shadow(0px 0px 0px rgba(0, 0, 0, 0)"}, {filter: `sepia(0) brightness(0.5) saturate(3) hue-rotate(-45deg) saturate(1) contrast(5) drop-shadow(2px 2px 2px ${C.Colors.GREY0})`, duration: 1}, 0)
        // .fromTo(msgAttrFlare, {filter: "sepia(0) brightness(1) hue-rotate(0deg) saturate(1) contrast(1)"}, {filter: "sepia(5) brightness(0.25) saturate(5) hue-rotate(-45deg) saturate(3) brightness(1) contrast(1)", duration: 1}, 0)
        .fromTo(msgGears, {filter: "blur(1.5px) sepia(0) brightness(1) hue-rotate(0deg) saturate(1) contrast(1)"}, {filter: "blur(1.5px) sepia(5) brightness(0.65) saturate(5) hue-rotate(-45deg) contrast(2)", duration: 1}, 0)
        .fromTo(msgTotal, {filter: "brightness(1) saturate(1) contrast(1)"}, {filter: "brightness(0.75) saturate(2) contrast(1)", duration: 1}, 0)
        .to(msgIconBase$, {autoAlpha: 0, duration: 1}, 0)

        .to(msgSource, {opacity: 0, duration: 0.5, ease: "power2.out"}, 0)
        .set(msgSource, {borderTopColor: C.Colors.RED9, borderBottomColor: C.Colors.RED9, background: "transparent url('/systems/kult4th/assets/backgrounds/texture-red.webp') repeat repeat center center/300px"}, 0.5)
        .to(msgSource, {opacity: 1, duration: 0.5, ease: "power2.out"}, 0.5)
        .fromTo(msgSourceName$, {
          textShadow: "0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0), 0 0 0 rgb(0, 0, 0)"},  {
          color: C.Colors.GREY0,
          textShadow: `0 0 5px ${C.Colors.RED8}, 0 0 5px ${C.Colors.RED8}, 0 0 5px ${C.Colors.RED8}, 0 0 5px ${C.Colors.RED8}, 0 0 5px ${C.Colors.RED8}, 0 0 5px ${C.Colors.RED8}`
        }, 0)
        .to(msgOutcomeMain, {color: "rgb(255, 255, 255)", textShadow: "0 0 2px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.8), 0 0 4.5px rgba(255, 255, 255, 0.8), 0 0 8px rgba(220, 65, 65, 0.8), 0 0 12.5px rgba(220, 65, 65, 0.8), 0 0 16.5px rgba(220, 65, 65, 0.5), 0 0 21px rgba(220, 65, 65, 0.5), 0 0 29px rgba(220, 65, 65, 0.5), 0 0 41.5px rgba(220, 65, 65, 0.5)", duration: 1, onComplete() {
          msgOutcomeMain.addClass("neon-glow-animated-red");
          msgOutcomeMain.attr("style", "color: rgb(255, 255, 255); visibility: visible");
        }}, 0)
        .to(msgOutcomeSub, {color: C.Colors.RED9, textShadow: "none", duration: 1}, 0)
        .to(msgTextToRed, {color: C.Colors.RED8, duration: 1}, 0);
  },
  animateToPartial(message$: JQuery): gsap.core.Timeline {

  const msgBgBase$ = message$.find(".message-bg.bg-base");
  message$.find(".message-bg.bg-partial").css("visibility", "visible");


  const msgDropCap$ = message$.find(".drop-cap");
  const msgAttrFlare = message$.find(".roll-term-container[class*='attribute-']");
  const msgCharName$ = message$.find(".roll-char-name *");
  const msgIntroLine$ = message$.find(".roll-intro-line *");
  const msgAttrName$ = message$.find(".roll-intro-line .text-attributename *");
  const msgIconBase$ = message$.find(".icon-container.icon-base");
  const msgIconPartial$ = message$.find(".icon-container.icon-partial");

  const msgSource = message$.find(".roll-source-header");
  const msgSourceName$ = msgSource.find(".roll-source-name .roll-source-text");
  const msgGears = message$.find(".roll-total-gear > img");
  const msgTotal = message$.find(".roll-total-number");
  const msgOutcomeMain = message$.find(".roll-outcome .roll-outcome-main");
  const msgOutcomeSub = message$.find(".roll-outcome .roll-outcome-sub");
  const msgTextToGrey = message$.find(".roll-source-source-name .roll-source-text, .roll-dice-results ~ * *");

  return U.gsap.timeline({ease: "power3.in", clearProps: true})
    .to(msgBgBase$, {autoAlpha: 0, duration: 1, ease: "power2.inOut"})
    .to(msgIconPartial$, {autoAlpha: 1, filter: "grayscale(1)", duration: 0.25, ease: "power2.inOut"}, 0)
    .to(msgCharName$, {color: C.Colors.GREY10, duration: 1, ease: "power2.inOut"}, 0)
    .to(msgIntroLine$, {color: C.Colors.GREY10, duration: 1, ease: "power2.inOut"}, 0)
    .to(msgAttrName$, {color: C.Colors.GREY10, filter: "brightness(3)", duration: 1, ease: "power2.inOut"}, 0)
    .fromTo(msgDropCap$, {filter: "sepia(0) brightness(1) hue-rotate(0deg) saturate(1) contrast(1) drop-shadow(0px 0px 0px rgba(0, 0, 0, 0)"}, {filter: `grayscale(1) sepia(0) brightness(1) contrast(1) drop-shadow(2px 2px 2px ${C.Colors.GREY0})`, duration: 1}, 0)
      .fromTo(msgAttrFlare, {filter: "sepia(0) brightness(1) hue-rotate(0deg) saturate(1) contrast(1)"}, {filter: "grayscale(1)", duration: 1}, 0)
      .fromTo(msgGears, {filter: "blur(1.5px) sepia(0) brightness(1) hue-rotate(0deg) saturate(1) contrast(1)"}, {filter: "grayscale(1) blur(1.5px) brightness(1)", duration: 1}, 0)
      .fromTo(msgTotal, {filter: "brightness(1) saturate(1) contrast(1)"}, {filter: "brightness(1) saturate(1) contrast(1) grayscale(1)", duration: 1}, 0)
      .to(msgIconBase$, {autoAlpha: 0, duration: 1}, 0)
      .to(msgSource, {filter: "grayscale(1)", duration: 1}, 0)
      .to(msgSourceName$, {color: C.Colors.GREY9}, 0)
      .to(msgOutcomeMain, {color: C.Colors.GREY9, duration: 1}, 0)
      .to(msgOutcomeSub, {color: C.Colors.GREY9, duration: 1}, 0)
      .to(msgTextToGrey, {color: C.Colors.GREY9, duration: 1}, 0);
},
  animateResults(message$: JQuery, msg: K4ChatMessage): gsap.core.Timeline {

    const results$ = message$.find([
      ".roll-dice-results ~ div",
      ".roll-dice-results ~ label",
      ".roll-dice-results ~ h2",
      ".roll-dice-results ~ ul li"
    ].join(", "));

    // // Split results$ into lines
    // const splitResultLines = new SplitText(results$, { type: "lines" });
    // // Set results$ to visibility: visible
    // results$.css("visibility", "visible");

    return U.gsap.timeline({})
      .fromTo(results$, {
      // .fromTo(splitResultLines.lines, {
        autoAlpha: 0,
        filter: "blur(10px)"
      }, {
        autoAlpha: 1,
        filter: "blur(0px)",
        ease: "power2.out",
        duration: 1,
        stagger: 0.25
      }, 0)
  }
}
// #region === K4ChatMessage CLASS ===
class K4ChatMessage extends ChatMessage {
  // #region INITIALIZATION ~
  static async GenerateInputPanel(html: JQuery): Promise<void> {

  // Convert the template into a jQuery object
    const buttonHtml = $(await renderTemplate(
      U.getTemplatePath("sidebar", "chat-input-control-panel"),
      {}
    ));
    // Find the chat form in the rendered HTML
    const chatForm = html.find("#chat-form").attr("data-type", "ic");
    // Append the control panel to the chat form
    chatForm.append(buttonHtml);

    // Add click event listener for the In-Character button
    buttonHtml.find("#ic").on("click", (event: ClickEvent) => {
      event.preventDefault(); // Prevent the default form submission
      getNotifier().info("Message is In-Character"); // Notify the user
      chatForm.attr("data-type", "ic"); // Set the data-type attribute to "ic"
    });
    // Add click event listener for the Out-of-Character button
    buttonHtml.find("#ooc").on("click", (event: ClickEvent) => {
      event.preventDefault(); // Prevent the default form submission
      getNotifier().info("Message is Out-of-Character"); // Notify the user
      chatForm.attr("data-type", "ooc"); // Set the data-type attribute to "ooc"
    });
    // Add click event listener for the GM Whisper button
    buttonHtml.find("#gm").on("click", (event: ClickEvent) => {
      event.preventDefault(); // Prevent the default form submission
      getNotifier().info("Message will be Whispered to the GM"); // Notify the user
      chatForm.attr("data-type", "gm"); // Set the data-type attribute to "gm"
    });
  }

  static RegisterGsapEffects() {
    // Object.entries(GSAPEFFECTS).forEach(([name, effect]) => {
    //   U.gsap.registerEffect({name, ...effect});
    // });
  }

  static get ChatLog$(): JQuery {
    return $("#chat-log");
  }

  static GetMessage(ref: string|JQuery|HTMLElement): Maybe<K4ChatMessage> {
    if (typeof ref === "string") {
      return getGame().messages.get(ref) as Maybe<K4ChatMessage>;
    } else if (ref instanceof HTMLElement) {
      const message$ = $(ref).closest(".chat-message");
      const messageId = String(message$.data("messageId"));
      return getGame().messages.get(messageId) as Maybe<K4ChatMessage>;
    } else {
      const messageId = String($(ref).data("messageId"));
      return getGame().messages.get(messageId) as Maybe<K4ChatMessage>;
    }
  }
  /**
  * Pre-Initialization of the K4ChatMessage class. This method should be run during the "init" hook.
  *
  * - Registers the K4ChatMessage class as the system's ChatMessage document class.
  * - Sets the sidebar icon for the Chat tab to a microphone icon.
  * - Sets the default template for system chat messages to the "sidebar/chat-message" template.
  * - Registers a "renderChatLog" hook to add a control panel to the chat input panel for players to select the message type.
  * - Registers a "renderChatMessage" hook to apply custom CSS classes to chat messages based on their flags.
  */
  static PreInitialize() {

    // Register the K4ChatMessage class as the document type for ChatMessage
    CONFIG.ChatMessage.documentClass = K4ChatMessage;

    // Customize the sidebar icon for the Chat tab
    CONFIG.ChatMessage.sidebarIcon = "fa-regular fa-microphone-lines";

    // Set the default template for system chat messages
    CONFIG.ChatMessage.template = U.getTemplatePath("sidebar", "chat-message");

    // Register GSAP effects
    K4ChatMessage.RegisterGsapEffects();

    // Register a hook to run when the chat log is rendered
    Hooks.on("renderChatLog", async (_log: ChatLog, html: JQuery, _options: unknown) => {
      // Generate the button panel for setting input type
      await K4ChatMessage.GenerateInputPanel(html);
    });

    // Assign object to the global scope for development purposes
    Object.assign(globalThis, {K4ChatMessage, MASTERTIMELINES, CHILD_TIMELINES});

    // Register a hook to run when a chat message is rendered
    Hooks.on("renderChatMessage", async (message: K4ChatMessage, html) => {
      // kLog.log(`RENDERING ${message.isLastMessage ? "LAST " : ""}CHAT MESSAGE`, message);
      // Apply custom CSS classes to the chat message based on its flags
      message.applyFlagCSSClasses(html);

      // Fix any popovers
      void message.fixPopovers(html);

      // Introduce a brief pause to let the DOM settle
      await U.sleep(500);


      // If this is the last chat message, animate it and freeze any animations of currently-animating messages
      if (message.isLastMessage) {
        message.animate();
        getMessages()
          .filter((msg) => msg.isAnimated && msg.id !== message.id)
          .forEach((msg) => { msg.freeze(); });
      } else {
        // Otherwise, kill all tweens and hide video elements
        message.freeze();
      }
    });
  }
  // #endregion

  animationTimeline?: gsap.core.Timeline;
  get timelinePromise(): Promise<void> {
    if (this.animationTimeline) { return Promise.resolve(); }
    // if (!this.isAnimated) { return Promise.resolve(undefined); }
    // Return a promise that checks every 250ms for _animationTimeline and resolves when it is defined.
    return new Promise((resolve, reject) => {
      // kLog.display("Awaiting Timeline Promise...");
      const intervalId = setInterval(() => {
        if (this.animationTimeline) {
          // kLog.display("Timeline Promise Resolved!", {timeline: this.animationTimeline});
          clearInterval(intervalId); // Stop checking
          clearTimeout(timeoutId); // Clear the timeout
          resolve(); // Resolve the promise
        }
        // kLog.display("Awaiting Timeline Promise...", {timeline: this.animationTimeline})
      }, 250);

      // Set a timeout to reject the promise after 10 seconds
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId); // Stop checking
        reject(new Error("Timed out waiting for _animationTimeline to be defined"));
      }, 10000); // 10 seconds
    });
  }
  get animationsPromise(): Promise<void> {
    if (!this.isAnimated) {
      // kLog.display("Message isn't animated: Resolving.");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // kLog.display("Awaiting Timeline", {message: this, timelinePromise: this.timelinePromise});
      void this.timelinePromise.then(() => {
        // kLog.display("Timeline Promise Resolved!");
        const timeline = this.animationTimeline;
        if (!timeline) { return undefined; }
        const labelTime = timeline.labels.revealed;
        const watchLabel = () => {
          if (timeline.time() >= labelTime) {
            // kLog.display(`Message Animation Complete! (timeline.time = ${timeline.time()})`);
            resolve();
            return undefined;
          }
          // kLog.display(`Awaiting Message Animation (timeline.time = ${timeline.time()})...`);
          setTimeout(watchLabel, 250);
        };
        watchLabel();
      });
    });
  }
  get cssClasses(): string[] {
    return (this as K4ChatMessage).getFlag("kult4th", "cssClasses");
  }

  get isAnimated(): boolean {
    return !(this as K4ChatMessage).getFlag("kult4th", "cssClasses").includes("not-animating");
  }
  set isAnimated(value: boolean) {
    if (value) {
      this.remClass("not-animating");
      if (!this.animationTimeline) {
        this.animate();
      }
    } else {
      this.addClass("not-animating");
    }
  }

  animate() {
    if (!this.isAnimated) { return; }
    this.freeze(false);
    if (this.isChatRoll()) {
      this.animationTimeline = MASTERTIMELINES.animateRollResult(this.elem$, this);
    } else if (this.isChatTrigger) {
      this.animationTimeline = MASTERTIMELINES.animateTriggerResult(this.elem$, this);
    }
  }
  freeze(isPermanent = true) {
    this.videoElements.css("display", "none");
    if (isPermanent) {
      this.addClass("not-animating");
    }
    if (!this.isAnimated) { return; }
    if (!this.animationTimeline) {
      if (isPermanent) {
        this.isAnimated = false;
      }
      return;
    }
    this.animationTimeline.seek("end");
    this.animationTimeline.kill();
    if (isPermanent) {
      this.isAnimated = false;
    }
  }

  // #region STATIC METHODS ~
  /**
   * Given a string, will return the URL to the drop cap image for the first character of that string.
   * @param {string} content - The string to extract the first character from.
   * @returns {string} The URL to the drop cap image for the first character of the string.
   */
  static GetDropCap(content: string): string {
    if (!content.length) {
      return ""
    };
    return `systems/kult4th/assets/chat/dropcaps/${content.slice(0, 1).toUpperCase()}.png`;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async #resolveUserSelectors(ref: UserRef): Promise<User[]> {
    const users = getGame().users as Collection<User>;
    if (ref === UserRef.any) {
      return Array.from(users);
    }
    if (ref === UserRef.gm) {
      return users.filter((user) => user.isGM);
    }
    const curUser = users.get(this.user.id ?? "");
    if (!curUser) {
      throw new Error(`Unable to derive user from chat message '${this.id}'.`);
    }
    if (ref === UserRef.self) {
      return [curUser];
    }
    if (ref === UserRef.other) {
      return users.filter((user) => user.id !== curUser.id);
    }
    throw new Error(`Resolution of user reference '${ref}' is not yet implemented.`);
  }

  async #resolveUserTargets(ref: UserRef): Promise<Array<K4Actor<K4ActorType.pc>|K4Item<K4ItemType.gmtracker>>> {
    const users = await this.#resolveUserSelectors(ref);
    return Promise.all(users.map(async (user) => {
      if (user.isGM) {
        return (await K4GMTracker.Get()).item;
      }
      const {character} = user;
      if (!(character instanceof K4Actor)) {
        throw new Error(`User '${user.id}' has no character.`);
      }
      if (!character.is(K4ActorType.pc)) {
        throw new Error(`User '${user.id}' has a non-PC character.`);
      }
      return character;
    }));
  }
  // #endregion

  // #region GETTERS & SETTERS ~

  get elem$(): JQuery {
    return K4ChatMessage.ChatLog$.find(`[data-message-id="${this.id}"]`);
  }
  get videoElements(): JQuery {
    return this.elem$.find("video");
  }
  get previousMessage(): Maybe<K4ChatMessage> {
    const prevMessage = this.elem$.prev(".chat-message");
    if (!prevMessage.length) { return undefined; }
    return K4ChatMessage.GetMessage(prevMessage);
  }
  get isLastMessage(): boolean {
    return this.id === U.getLast(Array.from(getMessages())).id;
  }
  isChatRoll(): this is typeof this & {outcome: K4RollResult} {
    return (this as K4ChatMessage).getFlag("kult4th", "isRoll");
  }
  get isChatTrigger(): boolean {
    return (this as K4ChatMessage).getFlag("kult4th", "isTrigger");
  }
  get isResult(): boolean {
    return Boolean(this.isChatRoll() || this.isChatTrigger);
  }
  get outcome(): Maybe<K4RollResult> {
    if (this.isChatTrigger) {
      return K4RollResult.completeSuccess;
    }
    if (this.isChatRoll()) {
      return (this as K4ChatMessage).getFlag("kult4th", "rollOutcome");
    }
    return undefined;
  }
  get rollData(): K4Roll.Serialized.Base {
    return (this as K4ChatMessage).getFlag("kult4th", "rollData");
  }
  get actorID(): Maybe<string> {
    return this.speaker.actor ?? this.rollData.data.actorID;
  }
  get actor(): Maybe<K4Actor> {
    if (!this.actorID) { return undefined; }
    return getActors().get(this.actorID);
  }
  get sourceItemID(): Maybe<string> {
    return this.rollData.source;
  }
  get sourceItem(): Maybe<K4Item> {
    if (!this.sourceItemID) { return undefined; }
    const baseItem = getGame().items.get(this.sourceItemID);
    if (baseItem) { return baseItem; }
    if (this.actor) {
      const ownedItemUUID = `Actor.${this.actorID}.Item.${this.sourceItemID}`;
      const ownedItem = fromUuidSync(ownedItemUUID);
      if (ownedItem) { return ownedItem as K4Item; }
    }
    return undefined;
  }
  // #endregion

  // #region HTML PARSING
  static CapitalizeFirstLetter(content: string): string {

    // Parse the stringified HTML content into a DOM element
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    // Function to capitalize the first letter of a text node
    const capitalizeTextNode = (textNode: Text) => {
      if (textNode.textContent) {
        textNode.textContent = textNode.textContent.charAt(0).toUpperCase() + textNode.textContent.slice(1);
      }
    };

    // Find the element that immediately follows .roll-source-header
    const rollSourceHeader = doc.querySelector(".roll-source-header");

    if (rollSourceHeader) {
      const nextElement = rollSourceHeader.nextElementSibling;

      if (nextElement) {
        // Traverse the child nodes to find the first text node with content
        const walker = document.createTreeWalker(nextElement, NodeFilter.SHOW_TEXT, {
          // Only accept text nodes with non-whitespace content
          acceptNode: (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        });

        const firstTextNode = walker.nextNode();

        if (firstTextNode) {
          capitalizeTextNode(firstTextNode as Text);
        }
      }
    }

    // Serialize the modified DOM back to a string
    return doc.body.innerHTML;
  }
  async fixPopovers(html?: JQuery) {
    await Promise.all(Array.from((html ?? this.elem$).find("[style*='anchor-name']")).map((mod) => {
      const mod$ = $(mod);
      const popover$ = mod$.next();
      // popover$.css("display", "none");
      mod$.attr("popovertarget", popover$.attr("id") ?? "");
      popover$.attr("popover", "");
      // popover$.css("display", "flex");
    }));
  }
  addClass(this: K4ChatMessage, cls: ValueOrArray<string>, html?: JQuery) {
    const classes = [cls].flat();
    const curClasses = this.getFlag("kult4th", "cssClasses");
    if (classes.some((newCls) => !curClasses.includes(newCls))) {
      void this.setFlag("kult4th", "cssClasses", U.unique([...this.cssClasses, ...classes]))
          .then(() => { this.applyFlagCSSClasses(html); });
    }
  }
  remClass(this: K4ChatMessage, cls: ValueOrArray<string>, html?: JQuery) {
    const remClasses = [cls].flat();
    const curClasses = this.getFlag("kult4th", "cssClasses");
    if (remClasses.some((remCls) => curClasses.includes(remCls))) {
      void this.setFlag("kult4th", "cssClasses", this.cssClasses.filter((c) => !remClasses.includes(c)))
          .then(() => { this.applyFlagCSSClasses(html); });
    }
  }
  applyFlagCSSClasses(html?: JQuery) {
    (html ?? this.elem$).addClass(this.cssClasses.join(" "));
  }
  get onSelectEffectData(): K4ActiveEffect.BuildData[] {
    if (!this.outcome) { return []; }
    if (!this.sourceItem?.hasResults()) { return []; }
    if (!("results" in this.sourceItem.system)) { return []; }
    const theseResults = this.sourceItem.system.results[this.outcome];
    if (!theseResults || !("effects" in theseResults)) { return []; }
    const {effects} = theseResults;
    if (!effects) { return []; }
    return effects
      .filter((effect) => this.isDisplayingList(effect.parentData.onChatSelection?.listRef ?? "NULL"))
  }
  get wasOnSelectSelected(): boolean {
    return this.cssClasses.some((cls) => cls.includes("chat-selected-"));
  }
  isDisplayingList(listRef: string): boolean {
    return this.elem$.find(`ul.list-${listRef}`).length > 0;
  }
  async applySelectionListeners() {
    return Promise.all(
      this.onSelectEffectData.map(async (buildData) => {
        if (!buildData.parentData.onChatSelection) { return; }
        const {onChatSelection: {listRef, listIndex, userSelectors, userTargets}, ...parentData} = buildData.parentData;
        const selectorUserIDs = (await Promise.all(
          userSelectors.map((uRef) => this.#resolveUserSelectors(uRef))
        )).flat().map((user) => user.id!).filter(Boolean);

        // If this user isn't eligible to select from the list, don't apply selectors.
        if (!selectorUserIDs.includes(getUser().id!)) { return; }

        // Otherwise, create the callback function that will be triggered if this element is selected
        const onSelect = async () => {
          const targets: Array<K4Actor<K4ActorType.pc>|K4Item<K4ItemType.gmtracker>> = (await Promise.all(
            userTargets.map((uRef) => this.#resolveUserTargets(uRef))
          )).flat();
          await Promise.all(
            targets.map((target) => K4ActiveEffect.CreateFromBuildData({
              parentData,
              changeData: buildData.changeData
            }, this, target))
          )
        };

        // Then apply the selection listener
        this.applySelectionListener(listRef, listIndex, onSelect);
      })
    );
  }

  applySelectionListener(listRef: string, listIndex: number, onSelect: () => Promise<void>) {
    const self = this;
    const ul$ = this.elem$.find(`ul.list-${listRef}`);
    const container$ = ul$.closest(".message-content");
    const liSiblings = Array.from(ul$.children("li"));
    const li = U.pullIndex(liSiblings, listIndex);
    if (!li) {
      throw new Error(`Unable to find li element at index ${listIndex} of list ${listRef} in message ${this.id}.`);
    }
    const li$ = $(li);
    const liSiblings$ = $(liSiblings);
    const colors: Record<string, string> = {};
    switch (this.outcome) {
      case K4RollResult.completeSuccess: {
        colors.bright = C.Colors.GOLD9;
        colors.med = C.Colors.GOLD8;
        colors.dark = C.Colors.GOLD1;
        break;
      }
      case K4RollResult.partialSuccess: {
        colors.bright = C.Colors.GREY10;
        colors.med = C.Colors.GREY9;
        colors.dark = C.Colors.GREY1;
        break;
      }
      case K4RollResult.failure: {
        colors.bright = C.Colors.RED9;
        colors.med = C.Colors.RED8;
        colors.dark = C.Colors.RED1;
        break;
      }
      default: {
        throw new Error(`Unable to derive outcome for chat message '${this.id}'`);
      }
    }
    // Initialize CSS styles
    U.gsap.set(li$, {
      pointerEvents: "auto",
      position: "relative",
      opacity: 0,
      filter: "brightness(0.5) blur(10px)",
      scale: 1
    });
    U.gsap.set(container$, {
      overflow: "visible"
    });

    const listTimeline = U.gsap.timeline({paused: true})
      .addLabel("hidden")
      .to(li$,
      {
        opacity: 1,
        filter: "brightness(1) blur(0px)",
        duration: 1,
        ease: "power2.out"
      }, 0)
      .addLabel("start")
      .addLabel("blurred", 0.5)
      .to(li$,
      {
        x: -10,
        filter: "brightness(2) blur(0px)",
        scale: 1.1,
        duration: 0.5,
        ease: "power2.inOut"
      })
      .addLabel("hovered")
      .to(li$,
        {
        x: -70,
        background: "rgba(0, 0, 0, 1)",
        scale: 1.5,
        onStart() {
          liSiblings$.each((_, el) => {
            const timeline = $(el).data("timeline") as Maybe<gsap.core.Timeline>;
            if (timeline) {
              timeline.tweenTo("blurred");
            }
          });
        },
        onReverseComplete() {
          liSiblings$.each((_, el) => {
            const timeline = $(el).data("timeline") as Maybe<gsap.core.Timeline>;
            if (timeline) {
              timeline.tweenTo("start");
            }
          });
        },
        onComplete() {
          liSiblings$.each((_, el) => {
            const timeline = $(el).data("timeline") as Maybe<gsap.core.Timeline>;
            if (timeline) {
              timeline.tweenTo("hidden");
            }
          });
          $([li$, liSiblings$]).css("pointer-events", "none");
        },
        duration: 2,
        ease: "slow"
      })
      .addLabel("holdComplete")
      .to(li$,
        {
        x: -120,
        scale: 2,
        filter: "brightness(5) blur(5px)",
        onComplete(this: gsap.core.Timeline) {
          liSiblings$.each((_, el) => {
            const timeline = $(el).data("timeline") as Maybe<gsap.core.Timeline>;
            if (timeline) {
              timeline.tweenTo("blurred");
            }
          });
          listTimeline.seek("start");
          li$.css("pointer-events", "none");
          onSelect().then(() => {
            self.addClass(["not-animating", `chat-selected-${listIndex}`]);
          }).catch((err: unknown) => { throw new Error(String(err)); });
        },
        duration: 0.5,
        ease: "power2.out"
      })
      .to(li$,
      {
        opacity: 0,
        ease: "power2.out",
        duration: 0.5
      }, ">-=0.5")
      .addLabel("triggerComplete");

    listTimeline.seek("start");

    li$.data("timeline", listTimeline);

    kLog.log("animateListOptions", {
      liSiblings$,
      li$,
      listTimeline,
      listRef,
      listIndex,
      label: listTimeline.currentLabel()
    });

    li$.on("mouseenter", () => {
      // Only play timeline if the timeline is at or after the "start" label
      if (["start", "hovered"].includes(listTimeline.currentLabel())) {
        listTimeline.timeScale(1);
        listTimeline.reversed(false);
        void listTimeline.tweenTo("hovered")
          .then(() => listTimeline.pause());
      }
    });
    li$.on("mouseleave", () => {
      // Only reverse the timeline if the timeline is at or after the "start" or "hovered" labels
      if (["start", "hovered"].includes(listTimeline.currentLabel())) {
        listTimeline.timeScale(2);
        listTimeline.reversed(true);
        void listTimeline.tweenTo("start")
          .then(() => listTimeline.pause());
      }
    });
    li$.on("mousedown", () => {
      // Do nothing if timeline is already at or past "holdComplete"
      if (listTimeline.currentLabel() === "holdComplete") {
        return;
      }
      listTimeline.timeScale(1);
      listTimeline.reversed(false);
      void listTimeline.tweenTo("triggerComplete")
        .then(() => listTimeline.pause());
    });
    li$.on("mouseup", () => {
      // Do nothing unless timeline is at or past "hovered"
      if (listTimeline.currentLabel() !== "hovered") {
        return;
      }
      listTimeline.timeScale(2);
      listTimeline.reversed(true);
      void listTimeline.tweenTo("hovered")
        .then(() => listTimeline.pause());
    });
  }
  // #endregion

}


// #ENDREGION

// #region EXPORTS ~
export default K4ChatMessage;
// #endregion
