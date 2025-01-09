// #region IMPORTS ~
import C, {K4Attribute} from "../scripts/constants.js";
import U from "../scripts/utilities.js";
import K4Actor, {K4ActorType} from "./K4Actor.js";
import {gsap} from "../libraries.js";
// #endregion

const ANIMATIONS = {
  hoverNav(target: HTMLElement): GsapAnimation {
    const headerButtons = target.getElementsByClassName("header-button");
    return gsap
      .timeline({
        reversed: true
      }).to(
        target,
        {
          scale:    1.25,
          x:        10,
          y:        20,
          duration: 0.5,
          ease:     "back"
        },
        0
      ).to(
        U.getSiblings(target),
        {
          opacity:  0.75,
          filter:   "blur(5px)",
          duration: 0.5,
          ease:     "back"
        },
        0
      ).to(
        headerButtons,
        {
          scale:    0.75,
          y:        -100,
          duration: 0.5,
          stagger:  0.1,
          ease:     "back.out(3)"
          // opacity: 1
        },
        0
      );
  },
  hoverTab(target: HTMLElement): GsapAnimation {
    const tabLabel$ = $(target).find(".nav-tab-label");
    const tabAnimation$ = $(target).find(".nav-tab-animation");
    return gsap
      .timeline({
        reversed: true
      }).fromTo(
        tabLabel$,
        {
          scale:   3,
          opacity: 0,
          filter:  "blur(10px)"
        },
        {
          scale:    2,
          opacity:  1,
          filter:   "none",
          duration: 1,
          ease:     "back"
        },
        0
      ).fromTo(
        tabAnimation$,
        {
          scale:   1,
          opacity: 0,
          filter:  "blur(10px)"
        },
        {
          scale:    5,
          opacity:  0.75,
          filter:   "none",
          duration: 1,
          ease:     "back"
        },
        0
      );
  },
  hoverMove(target: HTMLElement): GsapAnimation {
    const FULL_DURATION = 0.5;

    const attribute = $(target).data("attribute") as K4Attribute;
    const itemText$ = $(target).find(".item-text");
    const itemIcon$ = $(target).find(".item-icon");
    const toolTip$ = $(target).find(".trigger-tooltip");
    const tl = gsap
      .timeline({
        reversed: true
      }).fromTo(
        itemIcon$,
        {
          borderRadius: 25,
          overflow:     "hidden"
        },
        {
          width:           "100%",
          borderRadius:    0,
          duration:        FULL_DURATION,
          backgroundColor: C.Colors.GOLD8,
          ease:            "sine"
        },
        0
      ).fromTo(
        itemText$,
        {
          x:          0,
          width:      "auto",
          opacity:    1,
          color:      C.Colors.GOLD5,
          textShadow: 0
        },
        {
          x:          -(parseInt(`${gsap.getProperty(itemText$[0], "width")}`, 10)) - 40,
          width:      0,
          color:      C.Colors.GREY1,
          textShadow: [
            ...Array.from({length: 4}).fill(`0 0 15px ${C.Colors.GOLD8}`),
            ...Array.from({length: 6}).fill(`0 0 5px ${C.Colors.GOLD8}`),
            ...Array.from({length: 4}).fill(`0 0 2px ${C.Colors.GOLD8}`)
          ].join(", "),
          duration: FULL_DURATION,
          ease:     "back"
        },
        0
      ).set(
        itemText$,
        {
          opacity: 0
        },
        0.01
      )
      .to(
        itemText$,
        {
          opacity:  1,
          duration: FULL_DURATION - 0.01,
          ease:     "sine"
        },
        0.01
      ).fromTo(
        toolTip$,
        {
          opacity: 0,
          bottom:  30,
          scale:   1.5
        },
        {
          opacity:  1,
          bottom:   30,
          scale:    1,
          duration: 0.75 * FULL_DURATION,
          ease:     "power2.in"
        },
        0
      );

    if ((attribute in C.Attributes.Active) || (attribute in C.Attributes.Passive)) {
      const context$ = $(target).closest(".tab-content");
      const animation$ = context$.find(`.subsection.attributes .attribute-box[data-attribute="${attribute}"] img`);
      tl
        .fromTo(
          animation$,
          {
            opacity: 0
          },
          {
            opacity:  1,
            duration: FULL_DURATION,
            ease:     "sine"
          },
          0
        );
      // .fromTo(
      //   animation$,
      //   {
      //     filter: "blur(40px)"
      //   },
      //   {
      //     filter: "none",
      //     duration: FULL_DURATION,
      //     ease: "sine"
      //   },
      //   0
      // );
    }

    return tl;
  }
};

// interface K4NPCSheet extends ActorSheet {
//   object: K4Actor<K4ActorType.npc>;
//   get actor(): K4Actor<K4ActorType.npc>;
// }

class K4NPCSheet extends ActorSheet {
  static PreInitialize() {
    Actors.registerSheet("kult4th", K4NPCSheet, {makeDefault: true, types: [K4ActorType.npc]});
  }

  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [C.SYSTEM_ID, "sheet", "k4-sheet", "k4-actor-sheet", "k4-theme-gold"],
      tabs:    [
        {navSelector: ".tabs", contentSelector: ".tab-content", initial: "front"}
      ]
    });
  }
  readonly _template = "systems/kult4th/templates/sheets/npc-sheet.hbs";
  override get template() { return this._template; }

  hoverTimeline?: GsapAnimation;
  hoverTimelineTarget?: HTMLElement;
  // devTools = GSDevTools;

  override async getData() {
    const baseData = await super.getData();
    const context = {
      ...baseData,
      actorData:     this.actor.system,
      baseMoves:     this.actor.basicMoves,
      derivedMoves:  this.actor.derivedMoves,
      advantages:    this.actor.advantages,
      disadvantages: this.actor.disadvantages,
      darksecrets:   this.actor.darkSecrets,
      relations:     this.actor.relations,
      weapons:       this.actor.weapons,
      gear:          this.actor.gear,
      attributes:    this.actor.attributeData
    };
    /*DEVCODE*/kLog.log("Final Context", context);/*!DEVCODE*/
    return context;
  }

  handleMouseMove(event: JQuery.MouseMoveEvent, navPanel: HTMLElement, hoverTimeline: gsap.core.Timeline) {
    if (!$(navPanel).data("isHovered")) { return undefined; }
    const animParams: gsap.TweenVars = {};
    const panelElem = document.elementsFromPoint(event.clientX, event.clientY).find((elem) => $(elem).hasClass("nav-panel"));
    if (!panelElem) {
      $(navPanel).data({isHovered: false});
      gsap.to(navPanel, {
        rotationX: 0,
        rotationY: 0,
        duration:  2,
        ease:      "power3.out"
      });
      hoverTimeline.reversed(true);
    } else {
      const maxX = $(navPanel).width() ?? 0;
      const maxY = $(navPanel).height() ?? 0;

      if (!maxX || !maxY) { return undefined; }

      const posX = U.pInt(event.clientX) - (this.position.left ?? 0); // event.offsetX;
      const posY = U.pInt(event.clientY) - (this.position.top ?? 0); // event.offsetY;

      const percentX = (100 / (maxX / posX)) - 50;
      const percentY = (100 / (maxY / posY)) - 50;

      const maxRotX = 10;
      const maxRotY = 10;

      const rotX = (maxRotY / 100) * percentY;
      const rotY = (-maxRotX / 100) * percentX;

      gsap.to(navPanel, {
        rotationX: rotX,
        rotationY: rotY,
        ease:      "back.out",
        duration:  0.5
      });
    }
  }

  override activateListeners(html: JQuery) {
    const ISDEBUGGING = false;

    super.activateListeners(html);

    kLog.log("ACTOR SHEET HTML OBJECT", html);
    const hoverTimelines: Array<[HTMLElement, GsapAnimation]> = [];

    const [navPanel] = html.find(".nav-panel");

    $(navPanel).each(() => {

      gsap.set(navPanel, {
        xPercent:             -50,
        yPercent:             -50,
        transformPerspective: 1000,
        perspective:          600,
        transformStyle:       "preserve-3d"
      });
      const hoverTimeline = ANIMATIONS.hoverNav(navPanel);

      $(navPanel).on("mouseenter", () => {
        if (!$(navPanel).data("isHovered")) {
          $(navPanel).data({isHovered: true});
          hoverTimeline.reversed(false);
        }
      });

      $(document).on("mousemove", this.handleMouseMove.bind(this));
    });

    html.find(".nav-tab")
      .each(function() {
        gsap.set(this, {xPercent: -50, yPercent: -50, opacity: 1});
        hoverTimelines.push([this, ANIMATIONS.hoverTab(this)]);
      });

    hoverTimelines.forEach(([target, anim]) => {
      $(target)
        .on({
          mouseenter: () => { anim.reversed(false); },
          mouseleave: () => { anim.reversed(true); }
        });
      });

  }
}

// interface K4NPCSheet {
//   object: K4Actor<K4ActorType.npc>,
//   _actor: K4Actor<K4ActorType.npc>
// }

export default K4NPCSheet;