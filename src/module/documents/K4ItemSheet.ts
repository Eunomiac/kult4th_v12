// #region IMPORTS ~
import K4Item from "./K4Item.js";
import C from "../scripts/constants.js";
import U from "../scripts/utilities.js";
import K4Actor, {K4ActorType} from "./K4Actor.js";
import {K4ItemType} from "./K4Item.js";
import K4ActiveEffect from "./K4ActiveEffect.js";
import K4GMTracker from "./K4GMTracker.js";
import {Dragger} from "../libraries.js";
// #endregion

type K4ItemSheetOptions = DocumentSheetOptions & {
  testing: true
};
export default class K4ItemSheet extends ItemSheet {

  static PreInitialize() {
    Items.registerSheet("kult4th", K4ItemSheet, {makeDefault: true});
  }

  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes:   [C.SYSTEM_ID, "sheet", "k4-sheet", "k4-item-sheet"],
      height:    590 * 0.75,
      width:     384 * 0.75,
      resizable: false
    });
  }

  public isUnlocked = false;
  override get item(): K4Item { return super.item as K4Item; }
  override get template() {
    if (this.item.type === K4ItemType.gmtracker) {
      return "systems/kult4th/templates/sheets/gmtracker-sheet.hbs";
    }
    if (this.isUnlocked) {
      return "systems/kult4th/templates/sheets/item-sheet.hbs";
    }
    return "systems/kult4th/templates/sheets/item-sheet-locked.hbs";
  }
  get type() { return this.item.type; }
  get subType() { return this.item.system.subType; }
  get subItems() { return this.item.subItems; }
  get subMoves() { return this.item.subMoves; }

  constructor(item: K4Item, options: Partial<DocumentSheetOptions<Item>> = {}) {
    super(item, options);
    if (this.type === K4ItemType.gmtracker) {
      this.options.classes.push("k4-gmtracker-sheet", "k4-theme-gold");
      this.options.height = null;
      this.options.width = null;
      this.options.resizable = true;
      this.options.top = 20;
      this.options.left = 20;
    } else {
      this.options.classes.push("k4-theme-white");
    }
  }

  override async getData() {
    const context = await super.getData();
    if (this.item.type === K4ItemType.gmtracker) {
      const tracker = await K4GMTracker.Get();
      Object.assign(
        context,
        tracker.getData()
      );
      kLog.log("[Gm Sheet Context]", {context});
    } else {
      Object.assign(
        context,
        {
          rules: this.item.rulesSummary
        }
      );
      kLog.log("[Item Sheet Assigned Context]", {context});
    }
    return context;
  }

  override async close() {
    if (!this.rendered) { return; }
    this.element.css("pointer-events", "none");
    await U.gsap.to(this.element, {
      scale: 0.85,
      x: "+=300",
      y: "-=100",
      // skewX: -40,
      opacity: 0,
      filter: "blur(100px)",
      duration: 0.5,
      ease: "power2"
    });
    return super.close();
  }

  override async activateListeners(html: JQuery): Promise<void> {

    super.activateListeners(html);

    if (this.item.type === K4ItemType.gmtracker) {
      const tracker = await K4GMTracker.Get();
      tracker.activateListeners(html);
      return;
    }

    const self = this;
    const itemDoc = this.document;
    const parentActor: Maybe<K4Actor> = this.actor instanceof K4Actor ? this.actor : undefined;

    if (!this.isUnlocked) {
      // Locate top sheet element
      const sheet$ = html.closest(".sheet");
      // Ensure element (a JQuery object) has pointer events enabled
      sheet$.css("pointerEvents", "all");

      // Remove any other event listeners from sheet$
      sheet$.off("dragstart");
      sheet$.off("dragend");
      sheet$.off("throwupdate");
      sheet$.off("throwcomplete");
      sheet$.off("contextmenu");
      sheet$.off("dblclick");
      sheet$.off("wheel");

      const draggable = new Dragger(sheet$, {
        type: "x,y",
        inertia: true,
        bounds: {
          top: -50,
          left: -50,
          width: window.innerWidth + 100,
          height: window.innerHeight + 100
        },
        allowEventDefault: false,
        dragResistance: 0,
        edgeResistance: 0.85,
        // throwResistance: 1500,
        overshootTolerance: 0.2,
        liveSnap: {
          points: function(this: Dragger, point: Point) {
            return {
              x: U.pInt(point.x),
              y: U.pInt(point.y)
            };
          }
        },
        onDragStart(this: Dragger){
          this.target.classList.add("dragging");
        },
        onDragEnd(this: Dragger){
          this.target.classList.remove("dragging");
        }
      });

      /** We need to add more listeners to the sheet$ object:
       * - a contextmenu listener to close the sheet
       * - a wheel listener to scale the sheet up or down based on the wheel delta
       */
      sheet$.on({
        contextmenu: (ev) => {
          void self.close();
        },
        dblclick: (ev) => {
          void self.close();
        },
        wheel: (ev: WheelEvent) => {
          // Check if there's an ongoing scale animation to prevent multiple scale operations simultaneously
          if (gsap.isTweening(sheet$)) {
            return;
          }
          const origEvent = (ev as WheelEvent & {originalEvent: WheelEvent}).originalEvent;
          const currentScale = U.pFloat(U.get(sheet$[0], "scale") || "1", 2);
          let newScale = currentScale;
          kLog.log("[K4ItemSheet] wheel", {ev, currentScale, newScale, deltaY: ev.deltaY});
          if (origEvent.deltaY < 0) {
            newScale *= 1.4;
          } else {
            newScale /= 1.4;
          }
          // Use GSAP to make a smooth tween
          gsap.to(sheet$, {
            scale: newScale,
            duration: 0.15,
            ease: "none"
          });
        }
      });
    }

    $(() => {

      const height = html.height() ?? 0;

      if (itemDoc.type !== K4ItemType.gmtracker
        && (height > 450 || html.find(".k4-header").length > 0)) {
        html.parent().addClass("wide-content");
      }

      // Function to get the text alignment of an element
      function getTextAlignment(element: JQuery): "left"|"center"|"right" {
        if (element.css("text-align") === "justify") {
          return "left";
        }
        if (["left", "center", "right"].includes(element.css("text-align"))) {
          return element.css("text-align") as "left"|"center"|"right";
        }
        throw new Error(`Invalid text alignment: ${element.css("text-align")}`);
      }

      // Function to set the transform origin based on text alignment
      function getTransformOrigin(element: JQuery): string {
        switch (getTextAlignment(element)) {
          case "left": return "0% 50%";
          case "right": return "100% 50%";
          case "center": return "50% 50%";
        }
      }

      // Function to squeeze text to fit within its container
      function squeezeText(element: JQuery): void {
        // Temporarily set width to auto and white-space to nowrap to measure natural width
        element.css({
          "width": "max-content",
          "white-space": "nowrap"
        });

        const naturalWidth = element.width() ?? 0;
        const containerWidth = element.parent().width() ?? 0;
        const padding = 5; // Allow for 5px padding

        // Calculate the scaleX factor
        const scaleX = Math.min(1, (containerWidth) / (naturalWidth + 5));

        // Reset the width and white-space properties
        element.css({
          "width": "",
          "white-space": ""
        });

        // Apply the scaleX transformation
        element.css({
          "transform": `scaleX(${scaleX})`,
          "transform-origin": "0% 50%"
        });
      }

      // Search for title element, edge notices, hold notices
      html.find(".k4-title.item-title, .k4-header.hold-header, .k4-header.edges-header").each(function() {
        const element = $(this);
        getTransformOrigin(element);
        squeezeText(element);
      });

      // Function to check if the text in the element wraps
      function doesTextWrap(element: JQuery): boolean {
        const lineHeight = parseInt(element.css("line-height"), 10);
        const elementHeight = element.height() ?? 0;
        return elementHeight > lineHeight;
      }

      // Search for any elements with "conditional-center" class. Check if the text contents wrap to another line.
      html.find(".conditional-center").each(function() {
        const element = $(this);
        if (!doesTextWrap(element)) {
          element.addClass("center");
        }
      });

      // Search for any elements with "conditional-center" class. Check if the text contents wrap to another line.
      html.find(".conditional-center").each(function() {
        const element = $(this);
        // Check if the scroll height is greater than the client height, indicating text wrapping.
        if (element.prop("scrollHeight") > element.prop("clientHeight")) {
          element.addClass("center");
        }
      });

      // Quick active effects control for dev purposes
      html.find(".effect-control").on("click", (ev) => {
        if ( self.item.isOwned ) {
          getNotifier().warn(getLocalizer().localize("BITD.EffectWarning"));
          return undefined;
        }
        void K4ActiveEffect.onManageActiveEffect(ev, self.item);
      });



      function createOpenLinkFromName(elem: JQuery|HTMLElement, iName?: string): void {
        if (iName) {
          if (itemDoc.isOwnedItem()) {
            $(elem).on("click", () => parentActor?.getItemByName(iName)?.sheet?.render(true));
          } else {
            $(elem).on("click", () => getItems()
              .find((item) => item.type === K4ItemType.move && item.name === iName)
              ?.sheet?.render(true));
          }
        }
      }

      function createTriggerLinkFromName(elem: JQuery|HTMLElement, iName?: string): void {
        if (iName) {
          if (itemDoc.isOwnedItem()) {
            $(elem).on("click", () => parentActor?.getItemByName(iName)?.sheet?.render(true));
          } else {
            $(elem).on("click", () => getItems()
              .find((item) => item.type === K4ItemType.move && item.name === iName)
              ?.sheet?.render(true));
          }
        }
      }

      function createRollLinkFromName(elem: JQuery|HTMLElement, iName?: string): void {
        if (iName) {
          if (itemDoc.isOwnedItem()) {
            $(elem).on("click", () => { kLog.log(`${parentActor?.name} Rolling (Embedded) ${iName}`); });
          } else {
            $(elem).on("click", () => { kLog.log(`${parentActor?.name} Rolling ${iName}`); });
          }
        }
      }

      function createChatLinkFromName(elem: JQuery|HTMLElement, iName?: string): void {
        if (iName) {
          if (itemDoc.isOwnedItem()) {
            $(elem).on("click", () => { kLog.log(`${parentActor?.name} Chatting (Embedded) ${iName}`); });
          } else {
            $(elem).on("click", () => { kLog.log(`${parentActor?.name} Chatting ${iName}`); });
          }
        }
      }

      function createDeleteLinkFromName(elem: JQuery|HTMLElement, iName?: string): void {
        if (iName) {
          if (itemDoc.isOwnedItem()) {
            $(elem).on("click", () => { kLog.log(`${parentActor?.name} Deleting (Embedded) ${iName}`); });
          } else {
            $(elem).on("click", () => { kLog.log(`${parentActor?.name} Deleting ${iName}`); });
          }
        }
      }
      // getTriggerAnim(html.find(".text-trigger")[0]);

      html.find("*[data-action=\"open\"]")
        .each(function() {
          createOpenLinkFromName(this, $(this).attr("data-item-name"));
        });
      html.find("*[data-action=\"trigger\"]")
        .each(function() {
          createTriggerLinkFromName(this, $(this).attr("data-item-name"));
        });
      html.find("*[data-action=\"roll\"]")
        .each(function() {
          createRollLinkFromName(this, $(this).attr("data-item-name"));
        });
      html.find("*[data-action=\"chat\"]")
        .each(function() {
          createChatLinkFromName(this, $(this).attr("data-item-name"));
        });
      html.find("*[data-action=\"drop\"]")
        .each(function() {
          createDeleteLinkFromName(this, $(this).attr("data-item-name"));
        });
    });
  }
  override _canDragStart(_dragSelector: string) {
    kLog.log("K4ItemSheet._canDragStart", `Not Implemented. _dragSelector: ${_dragSelector}`);
    return false;
  }

  override _canDragDrop(_dropSelector: string) {
    kLog.log("K4ItemSheet._canDragDrop", `Not Implemented. _dropSelector: ${_dropSelector}`);
    return false;
  }

  override _onDragOver(_event: DragEvent) {
    kLog.log("K4ItemSheet._onDragOver", "Not Implemented", {dragEvent: _event});
  }

  override _onDrop(_event: DragEvent) {
    kLog.log("K4ItemSheet._onDrop", "Not Implemented", {dragEvent: _event});
  }

  override _onDragStart(_event: DragEvent) {
    kLog.log("K4ItemSheet._onDragStart", "Not Implemented", {dragEvent: _event});
  }
}