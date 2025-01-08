export enum K4Attribute {
  ask = "ask",
  zero = "zero",
  fortitude = "fortitude",
  reflexes = "reflexes",
  willpower = "willpower",
  reason = "reason",
  intuition = "intuition",
  perception = "perception",
  coolness = "coolness",
  violence = "violence",
  charisma = "charisma",
  soul = "soul"
}

export enum K4Archetype {
  academic = "academic",
  agent = "agent",
  artist = "artist",
  avenger = "avenger",
  broken = "broken",
  careerist = "careerist",
  criminal = "criminal",
  cursed = "cursed",
  deceiver = "deceiver",
  descendant = "descendant",
  detective = "detective",
  doll = "doll",
  drifter = "drifter",
  fixer = "fixer",
  occultist = "occultist",
  prophet = "prophet",
  ronin = "ronin",
  scientist = "scientist",
  seeker = "seeker",
  veteran = "veteran",
  abomination = "abomination",
  deathMagician = "deathMagician",
  disciple = "disciple",
  dreamMagician = "dreamMagician",
  madnessMagician = "madnessMagician",
  passionMagician = "passionMagician",
  revenant = "revenant",
  timeAndSpaceMagician = "timeAndSpaceMagician",
  sleeper = "sleeper"
}

export enum ArchetypeTier {
  asleep = "asleep",
  aware = "aware",
  enlightened = "enlightened",
  awake = "awake"
}
export enum K4Stability {
  composed = "composed",
  moderate = "moderate",
  serious = "serious",
  critical = "critical",
  broken = "broken"
}
export enum K4Influence {
  archon = "archon",
  deathAngel = "deathAngel"
}
export enum K4ConditionType {
  stability = "stability",
  other = "other"
}
export enum K4WoundType {
  serious = "serious",
  critical = "critical",
  stableserious = "stableserious",
  stablecritical = "stablecritical"
}
export enum K4ActorType {
  base = "base",
  pc = "pc",
  npc = "npc"
}

export type ActorType = "pc";

export enum K4ItemType {
  advantage = "advantage",
  disadvantage = "disadvantage",
  move = "move",
  darksecret = "darksecret",
  relation = "relation",
  gear = "gear",
  weapon = "weapon",
  gmtracker = "gmtracker"
}

export enum K4ItemSubType {
  activeRolled = "active-rolled",
  activeStatic = "active-static",
  passive = "passive"
}
export enum K4ItemRange {
  arm = "arm",
  room = "room",
  field = "field",
  horizon = "horizon"
}

export enum K4GamePhase {
  intro = "intro",
  chargen = "chargen",
  preSession = "preSession",
  session = "session",
  postSession = "postSession"
}
export enum K4CharGenPhase {
  archetype = "archetype",
  attributesAndTraits = "attributesAndTraits",
  details = "details",
  relations = "relations",
  finished = "finished"
}
