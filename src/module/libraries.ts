const { default: gsap, MotionPathPlugin } = await import(
  foundry.utils.getRoute("scripts/greensock/esm/all.js")
) as { default: typeof import("gsap"), MotionPathPlugin: unknown }; // Use 'unknown' instead of 'any'

export { gsap, MotionPathPlugin };
