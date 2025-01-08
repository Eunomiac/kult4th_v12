import U from "./utilities.js";

// Define custom effect types
interface TooltipEffectConfig {
  duration: number;
}

// Define custom effects
U.gsap.registerEffect({
  name: "tooltipFadeUp",
  effect: (targets: gsap.TweenTarget, config: TooltipEffectConfig) =>
    U.gsap.fromTo(targets, {
      autoAlpha: 0,
      y: 10
    }, {
      autoAlpha: 1,
      y: 0,
      duration: config.duration,
      ease: "power2.out"
    }
  ),
  defaults: { duration: 0.3 },
  extendTimeline: true,
});

U.gsap.registerEffect({
  name: "tooltipFadeDown",
  effect: (targets: gsap.TweenTarget, config: TooltipEffectConfig) =>
    U.gsap.fromTo(targets, {
      autoAlpha: 0,
      y: -10
    }, {
      autoAlpha: 1,
      y: 0,
      duration: config.duration,
      ease: "power2.out"
    }
  ),
  defaults: { duration: 0.3 },
  extendTimeline: true,
});

U.gsap.registerEffect({
  name: "tooltipFadeLeft",
  effect: (targets: gsap.TweenTarget, config: TooltipEffectConfig) =>
    U.gsap.fromTo(targets, {
      autoAlpha: 0,
      x: 10
    }, {
      autoAlpha: 1,
      x: 0,
      duration: config.duration,
      ease: "power2.out"
    }
  ),
  defaults: { duration: 0.3 },
  extendTimeline: true,
});

U.gsap.registerEffect({
  name: "tooltipFadeRight",
  effect: (targets: gsap.TweenTarget, config: TooltipEffectConfig) =>
    U.gsap.fromTo(targets, {
      autoAlpha: 0,
      x: -10
    }, {
      autoAlpha: 1,
      x: 0,
      duration: config.duration,
      ease: "power2.out"
    }
  ),
  defaults: { duration: 0.3 },
  extendTimeline: true,
});

// Define types
interface TooltipPool {
  elements: JQuery[];
  inUse: Set<JQuery>;
}

interface TooltipAnimation {
  timeline: gsap.core.Timeline;
  originalPosition: { x: number; y: number };
}

interface TooltipTriggerInfo {
  boundingRect: DOMRect;
  clonedTooltip: JQuery;
}

interface Position {
  x: number;
  y: number;
}

type EffectName = "tooltipFadeUp" | "tooltipFadeDown" | "tooltipFadeLeft" | "tooltipFadeRight";

// Constants
const ISDEBUGGING = false;
const POOL_SIZE = 10;
const REVERSE_TIMEOUT = 500; // milliseconds
const REVERSE_TIMESCALE = 2;
const CLEANUP_INTERVAL = 1000; // milliseconds

let tooltipPool: TooltipPool;
const activeTooltips = new Map<JQuery, TooltipAnimation>();
const activeTriggers = new Map<JQuery, TooltipTriggerInfo>();

const OUTLINE_COLORS = {
  NEW: 'lime',
  UNREVERSE: 'cyan',
  REVERSING: 'yellow',
  CLEARED: 'red'
};

/**
 * Gets the current state of a tooltip trigger.
 * @param trigger$ - The jQuery object representing the tooltip trigger.
 * @returns The current state of the trigger.
 */
function getTriggerState(trigger$: JQuery): keyof typeof OUTLINE_COLORS | null {
  const outlineColor = trigger$.css('outline-color');
  return Object.entries(OUTLINE_COLORS)
    .find(([_, color]) => color === outlineColor)?.[0] as Maybe<keyof typeof OUTLINE_COLORS>
    ?? null;
}

/**
 * Updates the outline of a tooltip trigger.
 * @param trigger$ - The jQuery object representing the tooltip trigger.
 * @param state - The state of the trigger.
 */
function updateTriggerOutline(trigger$: JQuery, state: keyof typeof OUTLINE_COLORS | null): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!ISDEBUGGING) { return undefined; } // ... condition isn't unnecessary, it's just set by constant in this file
  trigger$.css('outline', state ? `2px solid ${OUTLINE_COLORS[state]}` : 'none');
}

/**
 * Initializes the tooltip overlay and creates a pool of tooltip elements.
 * @param html$ - The jQuery object representing the HTML container.
 */
const InitializeTooltips = (html$: JQuery): void => {
  // console.log("Initializing tooltip system");

  const overlay = $("<div>").attr("id", "kult-tooltips").css({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 9999,
  });
  $("body").append(overlay);

  tooltipPool = createTooltipPool(overlay);

  // Attach event listeners using event delegation
  html$.on("mouseenter", ".tooltip-trigger", handleTooltipTrigger);
  html$.on("mousemove", handleMouseMove);

  // Start the periodic cleanup
  setInterval(periodicCleanup, CLEANUP_INTERVAL);

  // console.log("Tooltip system initialized");
};
/**
 * Generates a unique ID for a tooltip element.
 * @returns The generated unique ID.
 */
function generateUniqueId(): string {
  return `tooltip-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Creates a pool of tooltip elements.
 * @param container - The jQuery object representing the container for tooltips.
 * @returns The created tooltip pool.
 */
function createTooltipPool(container: JQuery): TooltipPool {
  const pool: TooltipPool = {
    elements: [],
    inUse: new Set(),
  };

  for (let i = 0; i < POOL_SIZE; i++) {
    const tooltipElement = $("<div>").addClass("tooltip-clone").css("visibility", "hidden");
    container.append(tooltipElement);
    pool.elements.push(tooltipElement);
  }

  return pool;
}

/**
 * Handles the mouseenter event for tooltip triggers.
 * @param event - The mouseenter event.
 */
function handleTooltipTrigger(event: JQuery.MouseEnterEvent): void {
  const trigger$ = $(event.currentTarget as HTMLElement);
  // console.log(`Tooltip trigger activated for: ${trigger$.attr('class')}`);

  // Always remove the 'CLEARED' state when a trigger is activated
  if (trigger$.css('outline-color') === OUTLINE_COLORS.CLEARED) {
    updateTriggerOutline(trigger$, null);
  }

  let tooltipId = trigger$.data('tooltip-id') as string | null;
  let existingTooltip$: JQuery | null = null;

  if (tooltipId) {
    existingTooltip$ = $(`#${tooltipId}`);
  }

  if (!existingTooltip$?.length) {
    // Scenario 1: No existing tooltip. So we create a new one.
    const tooltip$ = trigger$.find(".tooltip");
    if (tooltip$.length === 0) {
      console.error(`Tooltip element not found for: ${trigger$.attr('class')}`);
      return undefined;
    }

    const clonedTooltip$ = cloneTooltipToOverlay(tooltip$);
    if (!clonedTooltip$) {
      console.warn(`Failed to clone tooltip for: ${trigger$.attr('class')}`);
      return undefined;
    }

    tooltipId = generateUniqueId();
    clonedTooltip$.attr('id', tooltipId);
    trigger$.data('tooltip-id', tooltipId);

    // console.log(`Cloned new tooltip: ${tooltipId}`);
    existingTooltip$ = clonedTooltip$;
    updateTriggerOutline(trigger$, 'NEW');

    const effectName = positionOverlayTooltip(existingTooltip$, trigger$);
    if (!effectName) {
      console.warn(`Failed to position tooltip: ${existingTooltip$.attr('class')}`);
      return undefined;
    }
    generateTooltipHoverAnimation(existingTooltip$, { x: event.clientX, y: event.clientY }, effectName);
    const boundingRect = trigger$[0]?.getBoundingClientRect();
    if (!boundingRect) {
      console.warn(`Failed to get bounding rect for trigger: ${trigger$.attr('class')}`);
      return undefined;
    }

    activeTriggers.set(trigger$, {
      boundingRect,
      clonedTooltip: existingTooltip$
    });
  } else {
    // Scenario 2: There is an existing tooltip. We play it, which will either unreverse it or do nothing.
    const existingAnimation = activeTooltips.get(existingTooltip$);
    // if (!existingAnimation) {
    //   throw new Error(`Tooltip animation not found for: ${tooltipId}`);
    // }
    existingAnimation?.timeline.timeScale(1).play();
  }

  // Reverse all other tooltips
  activeTooltips.forEach((animation, activeTooltip$) => {
    if (!animation.timeline.reversed() && activeTooltip$.attr('id') !== tooltipId) {
      // console.log(`Reversing tooltip: ${activeTooltip$.attr('id')}`);
      animation.timeline.timeScale(REVERSE_TIMESCALE).reverse();
      const reversingTrigger$ = $(`[data-tooltip-id="${activeTooltip$.attr('id')}"]`);
      updateTriggerOutline(reversingTrigger$, 'REVERSING');
    }
  });
}
/**
 * Clones a tooltip to the overlay.
 * @param tooltip$ - The jQuery object representing the original tooltip.
 * @returns The cloned tooltip jQuery object, or null if no tooltip is available in the pool.
 */
function cloneTooltipToOverlay(tooltip$: JQuery): JQuery | null {
  const availableTooltip = tooltipPool.elements.find(
    (element) => !tooltipPool.inUse.has(element)
  ) ?? tooltipPool.elements[0]; // Use the first tooltip if none are available

  if (!availableTooltip) {
    console.warn(`No available tooltip found for: ${tooltip$.attr('class')}`);
    return null;
  }

  tooltipPool.inUse.add(availableTooltip);
  availableTooltip.html(tooltip$.html()).show();
  // console.log(`Using tooltip from pool: ${availableTooltip.attr('id') ?? 'new'}`);
  return availableTooltip;
}

/**
 * Positions the cloned tooltip in the overlay relative to its trigger.
 * @param tooltip$ - The jQuery object representing the cloned tooltip.
 * @param tooltipTrigger$ - The jQuery object representing the tooltip trigger.
 * @returns The name of the effect to be used for the tooltip animation.
 */
function positionOverlayTooltip(tooltip$: JQuery, tooltipTrigger$: JQuery): Maybe<EffectName> {
  const triggerRect = tooltipTrigger$[0]?.getBoundingClientRect();
  if (!triggerRect) {
    console.warn(`Failed to get bounding rect for trigger: ${tooltipTrigger$.attr('class')}`);
    return undefined;
  }
  const tooltipRect = tooltip$[0]?.getBoundingClientRect();
  if (!tooltipRect) {
    console.warn(`Failed to get bounding rect for tooltip: ${tooltip$.attr('class')}`);
    return undefined;
  }
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  let top: number;
  let left: number;
  let effectName: EffectName = "tooltipFadeUp"; // Default effect

  // Try positioning above
  if (triggerRect.top - tooltipRect.height > 0) {
    top = triggerRect.top - tooltipRect.height - 10;
    left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
  }
  // Try positioning below
  else if (triggerRect.bottom + tooltipRect.height < windowHeight) {
    top = triggerRect.bottom + 10;
    left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
    effectName = "tooltipFadeDown";
  }
  // Try positioning to the left
  else if (triggerRect.left - tooltipRect.width > 0) {
    top = triggerRect.top;
    left = triggerRect.left - tooltipRect.width - 10;
    effectName = "tooltipFadeLeft";
  }
  // Position to the right as last resort
  else {
    top = triggerRect.top;
    left = triggerRect.right + 10;
    effectName = "tooltipFadeRight";
  }

  // Ensure the tooltip stays within the window bounds
  top = Math.max(0, Math.min(top, windowHeight - tooltipRect.height));
  left = Math.max(0, Math.min(left, windowWidth - tooltipRect.width));

  tooltip$.css({ top, left });
  return effectName;
}

/**
 * Generates and starts the hover animation for a tooltip.
 * @param tooltip$ - The jQuery object representing the cloned tooltip.
 * @param originalPosition - The original mouse position when the tooltip was triggered.
 * @param effectName - The name of the effect to be used for the tooltip animation.
 */
function generateTooltipHoverAnimation(
  tooltip$: JQuery,
  originalPosition: Position,
  effectName: EffectName
): void {
  const timeline = U.gsap.timeline()
    .add((U.gsap.effects[effectName] as GSAPEffectFunction)(tooltip$))

  const animation: TooltipAnimation = {
    timeline,
    originalPosition,
  };

  activeTooltips.set(tooltip$, animation);

  timeline.eventCallback("onComplete", () => {
    updateTriggerOutline($(`[data-tooltip-id="${tooltip$.attr('id')}"]`), 'NEW');
  });

  timeline.eventCallback("onReverseComplete", () => {
    cleanupTooltip(tooltip$);
  });
}

/**
 * Handles mouse movement to check if tooltips should be reversed.
 * @param event - The mousemove event.
 */
function handleMouseMove(event: JQuery.MouseMoveEvent): void {

  activeTriggers.forEach((triggerInfo, trigger$) => {
    const animation = activeTooltips.get(triggerInfo.clonedTooltip);
    if (!animation) { return };

    const isInsideTrigger = (
      event.clientX >= triggerInfo.boundingRect.left &&
      event.clientX <= triggerInfo.boundingRect.right &&
      event.clientY >= triggerInfo.boundingRect.top &&
      event.clientY <= triggerInfo.boundingRect.bottom
    );

    if (!isInsideTrigger && !animation.timeline.reversed()) {
      animation.timeline.timeScale(REVERSE_TIMESCALE).reverse();
      updateTriggerOutline(trigger$, 'REVERSING');

      // Set a timeout to force cleanup if the reverse animation doesn't complete
      setTimeout(() => {
        if (getTriggerState(trigger$) === 'REVERSING') {
          // console.log(`Forcing cleanup for stuck reversing tooltip: ${trigger$.attr('class')}`);
          cleanupTooltip(triggerInfo.clonedTooltip);
        }
      }, REVERSE_TIMEOUT);
    } else if (isInsideTrigger && animation.timeline.reversed()) {
      animation.timeline.timeScale(1).play();
      updateTriggerOutline(trigger$, 'UNREVERSE');
    }
  });
}

/**
 * Cleans up a tooltip after its animation is complete.
 * @param tooltip$ - The jQuery object representing the cloned tooltip.
 */
function cleanupTooltip(tooltip$: JQuery): void {
  // console.log(`Cleaning up tooltip: ${tooltip$.attr('id')}`);
  tooltip$.hide();
  tooltipPool.inUse.delete(tooltip$);
  activeTooltips.delete(tooltip$);

  activeTriggers.forEach((triggerInfo, trigger$) => {
    if (triggerInfo.clonedTooltip.is(tooltip$)) {
      // console.log(`Removing trigger association: ${trigger$.data('tooltip-id')}`);
      trigger$.removeData('tooltip-id');
      activeTriggers.delete(trigger$);
      updateTriggerOutline(trigger$, 'CLEARED');
    }
  });
}

/**
 * Periodically checks for stuck tooltips and forces cleanup.
 * This is a workaround for cases where the mouseleave event is not triggered.
 */
function periodicCleanup(): void {
  // console.log("Running periodic cleanup");
  activeTriggers.forEach((triggerInfo, trigger$) => {
    const currentState = getTriggerState(trigger$);
    if (currentState === 'REVERSING' || currentState === 'UNREVERSE') {
      // console.log(`Forcing cleanup for stuck tooltip: ${trigger$.attr('class')}`);
      cleanupTooltip(triggerInfo.clonedTooltip);
    }
  });
}

export default InitializeTooltips;
