import SVGDATA from "../scripts/svgdata";
import {K4WoundType, K4ConditionType, K4ItemType} from "../scripts/enums";


declare global {
  interface StripButtonData {
    icon: keyof typeof SVGDATA,
    dataset: Record<string, string>,
    buttonClasses?: string[],
    tooltip?: string
  }
  interface HoverStripData {
    id: string,
    type: K4ItemType | K4WoundType | K4ConditionType | "edge",
    display: string,
    icon: string,
    isGlowing?: "red"|"blue"|"gold"|false,
    stripClasses: string[],
    buttons: StripButtonData[],
    dataset?: Record<string, string>,
    dataTarget?: string,
    placeholder?: string,
    tooltip?: string
  }
}
