import { Dragger, InertiaPlugin } from "../libraries.js";
import K4CharGen from "./K4CharGen.js";
import U from "../scripts/utilities.js";
import K4Actor from "./K4Actor.js";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class K4DebugDisplay {
  public static readonly IS_DEBUGGING = false;
  private static readonly displays = new Map<string, JQuery>();


  static Initialize(): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!K4DebugDisplay.IS_DEBUGGING) { return };
    this.createDisplay("archetypeInfo", "Archetype Info");
    this.createDisplay("draggerInfo", "Dragger Info");
  }

  private static createDisplay(id: string, title: string): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!K4DebugDisplay.IS_DEBUGGING) { return };

    this.displays.set(id, $("<span />"));

    const display = $(`<div id="${id}" class="k4-debug-display">
      <h3>${title}</h3>
      <pre></pre>
    </div>`).css({
      position: "fixed",
      top: `${this.displays.size * 120}px`,
      left: "10px",
      width: "300px",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      color: "white",
      padding: "10px",
      borderRadius: "5px",
      zIndex: "9999",
      fontSize: "12px",
      fontFamily: "monospace",
      pointerEvents: "none"
    });
    this.displays.set(id, display);

    $("body").css({"position": "relative"}).append(display);
  }

  static updateArchetypeInfo(archetype: string, selectedIndex: number, arrayIndex: number, elementIndex: number): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!K4DebugDisplay.IS_DEBUGGING) { return };
    if (!archetype) { return; }
    const display = this.displays.get("archetypeInfo");
    if (display) {
      // if (archetype) {
        display.find("pre").text(
          `Name: ${archetype}\n` +
          `Selected Index: ${selectedIndex}\n` +
          `Array Index: ${arrayIndex}\n` +
          `Element Index: ${elementIndex}`
        );
      // }
    }
  }

  static updateDraggerInfo(dragger: Maybe<Dragger>, actor: K4Actor, charGen: K4CharGen): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!K4DebugDisplay.IS_DEBUGGING) { return };
    if (!dragger) { return; }
    const dragger$ = $(dragger.target);
    const container$ = dragger$.closest(".pc-initialization");
    const carousel$ = container$.find(".archetype-carousel");
    const items$ = carousel$.find(".archetype-carousel-item");
    const dragContainer$ = dragger$.closest(".archetype-carousel-dragger");


    const PIXELS_PER_ROTATION = 1000;
    const xMin = -0.5 * PIXELS_PER_ROTATION;
    const xMax = 0.5 * PIXELS_PER_ROTATION;

    const xPos = U.pFloat(dragger.x, 2);
    const yRot = U.pFloat(U.get(carousel$[0], "rotationY"), 0);
    const chosenArchetype = actor.archetype;
    const chosenArchetypeIndex = U.pInt(carousel$.find(`[data-archetype="${chosenArchetype}"]`).attr("data-index"));
    const usingArchetypeIndex = charGen.getIndexFromYRot(yRot);
    const usingArchetype = carousel$.find(`[data-index="${usingArchetypeIndex}"]`).attr("data-archetype")!;
    const lines: string[] = [
      `XPOS: ${U.padNum(xPos, 2)} (min: ${xMin}, max: ${xMax})`,
      `YROT: ${U.padNum(yRot, 0)}`,
      `INDEX - CHOSEN: ${chosenArchetypeIndex} (${chosenArchetype})`,
      `INDEX - USING: ${usingArchetypeIndex} (${usingArchetype})`,
      `DISTANCE: ${U.pFloat(charGen.getNormalizedDistanceFromSelected(usingArchetypeIndex, chosenArchetypeIndex), 2)}`,
      `TOTAL: ${items$.length}`,
      " ",
      `getYRotFromIndex: ${U.pInt(charGen.getYRotFromIndex(usingArchetypeIndex))}`,
      `getIndexFromYRot: ${charGen.getIndexFromYRot(yRot)}`,
      `getYRotFromXPos: ${U.pInt(charGen.getYRotFromXPos(xPos))}`,
      `getXPosFromYRot: ${U.pFloat(charGen.getXPosFromYRot(yRot), 2)}`,
      `getIndexFromXPos: ${charGen.getIndexFromXPos(xPos)}`,
      `getXPosFromIndex: ${U.pFloat(charGen.getXPosFromIndex(usingArchetypeIndex), 2)}`,
      `Velocity: ${InertiaPlugin.getVelocity(dragger.target, "x").toFixed(2)}`,
      `Is Dragging: ${dragger.isDragging}`,
      `Is Pressed: ${dragger.isPressed}`
    ];

    const display = this.displays.get("draggerInfo");
    if (display) {
      display.find("pre").text(
        lines.join("\n")
      );
    }
  }
}

export default K4DebugDisplay;