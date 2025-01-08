// #region IMPORTS ~
import U from "./utilities.js";
import {K4ItemType} from "./enums";
import {InfluenceKeys} from "./svgdata.js";
// #endregion


interface SVGGradientStopParams {
  offset: number,
  color: string,
  opacity: number;
}
type SVGGradientStop = SVGGradientStopParams & Record<string, number | string>;
interface SVGGradientDef {
  id: string,
  x: [number, number],
  y: [number, number],
  stops: Array<SVGGradientStop | string>;
}
interface GradientDef {fill: Partial<SVGGradientDef>; stroke: Partial<SVGGradientDef>;}

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
export const Archetypes = {
  [K4Archetype.sleeper]: {
    label: "Sleeper",
    tier: ArchetypeTier.asleep,
    [K4ItemType.advantage]: [],
    [K4ItemType.disadvantage]: [],
    [K4ItemType.darksecret]: [],
    description: "",
    occupation: [],
    looks: {},
    relations: []
  },
  [K4Archetype.academic]: {
    label: "Academic",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Academic Network", "Authority", "Elite Education", "Collector", "Data Retrieval", "Expert", "Occult Studies", "Elite Sport (Athletic)", "Elite Sport (Contact)", "Elite Sport (Fencing)"],
    [K4ItemType.disadvantage]: ["Nightmares", "Obsession", "Phobia", "Repressed Memories", "Rationalist", "Stalker"],
    [K4ItemType.darksecret]: ["Forbidden Knowledge", "Guardian", "Occult Experience", "Returned from the Other Side", "Strange Disappearance"],
    description: [
      "You study the world from a desk.",
      "Everything is interconnected via logical rules of causality, yet you suspect something must be wrong. Pieces refuse to fall into the safe, predictable patterns of common scientific models. Worse, shadowy forces silence new and alternative fields of research.",
      "Those who question the scientific establishment and its rational worldview risk disgrace and the destruction of their research, reputation, and revenue.",
      "Do you dare to look for the truth?"
    ].join("<br/><br/>"),
    occupation: ["Professor", "Student", "Ph.D. Candidate", "Teacher", "Public Servant", "Advisor", "Politician", "Author", "Television Show Host", "Aristocrat", "Researcher", "Psychologist", "Archaeologist", "Dilettante", "Antiquarian"],
    looks: {
      clothes: ["tweed", "carefree", "ill-fitting", "mottled", "proper", "suit", "casual", "nerdy", "old-fashioned"],
      face: ["childish", "round", "ravaged", "tired", "pale", "square", "disproportionate", "narrow", "beaky", "ugly", "handsome", "aged", "bearded"],
      eyes: ["skeptical", "arrogant", "analytical", "disinterested", "curious", "shy", "intelligent", "distracted", "authoritarian", "glasses-framed", "tired"],
      body: ["thin", "chubby", "tall", "wispy", "bent", "weak", "athletic", "out of shape", "slow", "angular", "rigid", "impaired", "large bellied", "fat", "short", "compact", "hairy"]
    },
    relations: [
      {
        description: "One of the characters studied at the same campus as you, and you became good friends. Take +1 Relation with each other.",
        in: 1,
        out: 1
      },
      {
        description: "One of the characters is your relative.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters met you at a seminar.",
        in: "",
        out: ""
      },
      {
        description: "You hired one of the characters as an assistant for a research project.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters is your lover. Take Relation +1 or +2 with them.",
        in: "1|2",
        out: ""
      }
    ]
  },
  [K4Archetype.agent]: {
    label: "Agent",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Moles", "Burglar", "Analyst", "Explosives Expert", "Tracer", "Quick Thinker", "Field Agent", "Endure Trauma"],
    [K4ItemType.disadvantage]: ["Lost Identity", "Nightmares", "Obsession", "Rival", "Stalker", "Wanted"],
    [K4ItemType.darksecret]: ["Forbidden Knowledge", "Guardian", "Occult Experience", "Strange Disappearance", "Victim of Medical Experiments"],
    description: [
      "You do whatever is necessary to protect and serve your employer's best interests.",
      "People are simply resources to be used, abused, and expended. Anyone standing in your way must be removed. You gather and analyze information at an almost impossible speed. Threats demand rapid responses, and sometimes there are no good choices.",
      "Your job means accepting great costs, usually in the form of dangers, but also an ever-growing debt to those sacrificed for the greater good.",
      "When this burden finally becomes too heavy, your exits have likely already closed, and 'good' and 'evil' have lost all meaning."
    ].join("<br/><br/>"),
    occupation: ["Open-Source Officer", "Case Officer", "Counterterrorism Analyst", "Analytic Methodologist", "Special Agent", "Security Professional", "Operations Officer", "Collection Management Officer", "Handler", "Infiltrator", "Spy", "Sleeper Agent"],
    looks: {
      clothes: ["suit", "everyday wear", "military uniform", "camo", "trenchcoat", "streetwear", "practical"],
      face: ["scarred", "inconspicuous", "innocent", "grim", "one-eyed", "expressionless", "tense", "wrinkled", "stern", "smiling", "chomping", "squarejawed", "handsome"],
      eyes: ["penetrating", "kind", "hardened", "avoidant", "piercing", "suspicious", "curious", "indifferent", "intelligent", "guilt-laden", "empty"],
      body: ["in shape", "chubby", "large", "emaciated", "flexible", "hard", "sinewy", "average", "right", "short", "quick", "feline", "curled", "mutilated", "scarred", "trembling"]
    },
    relations: [
      {
        description: "One of the characters has been your informant for several years. They take +1 Relation with you.",
        in: "",
        out: 1
      },
      {
        description: "One of the characters is an old friend of yours. Take +1 Relation with each other.",
        in: 1,
        out: 1
      },
      {
        description: "One of the characters is your lover. They take +2 Relation with you, and you choose what Relation you have with them.",
        in: "0|1|2",
        out: 2
      },
      {
        description: "One of the characters is your colleague. Take +1 Relation with them.",
        in: 1,
        out: ""
      }
    ]
  },
  [K4Archetype.artist]: {
    label: "Artist",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Artistic Talent", "Fascination", "Notorious", "Observant", "Body Awareness", "Enhanced Awareness", "Forbidden Inspiration", "Snake Charmer"],
    [K4ItemType.disadvantage]: ["Cursed", "Depression", "Drug Addict", "Nightmares", "Schizophrenia", "Victim of Passion"],
    [K4ItemType.darksecret]: ["Curse", "Heir", "Mental Illness", "Pact with Dark Forces", "Victim of Crime"],
    description: [
      "You exist only to create.",
      "You give yourself, body and soul, over to the arts. You express this desire through many mediums: a hypnotic painting, music trapping the audience in pure ecstasy, books spellbinding their readers, or a model's sculpted flesh are all within your purview.",
      "You have the ability to speak to the souls of others by inviting them into your own, but this ability always comes at a price.",
      "The price is paid by you, be it your sanity or your strength."
    ].join("<br/><br/>"),
    occupation: ["Author", "Dancer", "Actor", "Painter", "Videographer", "Photographer", "Designer", "Model", "Musician", "Singer", "Personal Trainer", "Cosmetologist", "Television Host", "Director", "Reporter", "Blogger"],
    looks: {
      clothes: ["new age", "gothic", "metal", "peacockish", "designer", "bohemian", "worn", "normcore"],
      face: ["haggard", "cute", "pretty", "captivating", "beautiful", "ascetic", "tired", "expressive"],
      eyes: ["easy", "cheerful", "crystal clear", "magnetic", "profound", "burned out", "hypnotizing", "passionate"],
      body: ["cute", "agile", "robust", "emaciated", "sexy", "lanky", "sensual", "warped", "graceful", "voluptuous"]
    },
    relations: [
      {
        description: "One of the characters is involved in your art. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters hurt you.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters is infatuated with you. They take +2 Relation with you.",
        in: "",
        out: 2
      },
      {
        description: "One of the characters commissioned a work of art from you. They take +1 Relation with you.",
        in: "",
        out: 1
      }
    ]
  },
  [K4Archetype.avenger]: {
    label: "Avenger",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Animal Speaker", "Instinct", "Enhanced Awareness", "Intimidating", "Survival Instinct", "Code of Honor", "Eye for an Eye", "Rage"],
    [K4ItemType.disadvantage]: ["!Oath of Revenge", "Mental Compulsion", "Nightmares", "Schizophrenia", "Stalker", "Wanted"],
    [K4ItemType.darksecret]: ["Guardian", "Returned from the Other Side", "Strange Disappearance", "Victim of Crime", "Victim of Medical Experiments"],
    description: [
      "You have been robbed of something dear, be it a loved one, job, family, humanity, honor, memories, or opportunity.",
      "Regardless of what was taken from you, its loss can only be paid for in blood.",
      "The only thing remaining is revenge, and you aren't about to let anything or anyone get in your way, regardless of consequences."
    ].join("<br/><br/>"),
    occupation: ["Homemaker", "Police Officer", "Panhandler", "Unemployed", "Student", "Criminal", "Conspiracy Theorist", "Refugee", "Prison Escapee", "Prize Fighter", "Widow(er)", "Washed-Up Celebrity", "Failed Businessperson", "Science Experiment On The Run"],
    looks: {
      clothes: ["leather", "survival", "filthy", "mismatched", "coat-covered", "casual", "worn"],
      face: ["haggard", "sharp", "neotenic", "scarred", "bony", "thin", "mutilated", "dour"],
      eyes: ["ruthless", "frosty", "indifferent", "desolate", "sorrow-filled", "tired", "mad", "dark"],
      body: ["robust", "deformed", "plump", "mutilated", "slender", "animalistic", "bony", "emaciated", "willowy", "massive", "strong", "youthful"]
    },
    relations: [
      {
        description: "You have entrusted one of the characters with a secret, which could put you away in prison if revealed.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters tried to help you fulfill your oath of revenge. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters has ties to the target of your revenge.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters is connected to your past life somehow.",
        in: "",
        out: ""
      }
    ]
  },
  [K4Archetype.broken]: {
    label: "Broken",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Street Contacts", "Intuitive", "Daredevil", "Contagious Insanity", "Enhanced Awareness", "Magical Intuition", "Sixth Sense", "Wayfinder"],
    [K4ItemType.disadvantage]: ["!Broken", "Drug Addict", "Involuntary Medium", "Obsession", "Schizophrenia", "Stalker"],
    [K4ItemType.darksecret]: ["Forbidden Knowledge", "Mental Illness", "Occult Experience", "Returned from the Other Side", "Victim of Medical Experiments"],
    description: [
      "You have gazed into the Abyss and escaped with your mind in tatters.",
      "You could be a homeless person who subconsciously performs rituals to forgotten gods, a mental patient who became a test subject for experimental medications, or a sinner who was physically dragged down into hell, yet somehow managed to escape back to the land of the living.",
      "You view things and see through the Illusion in ways others do not.",
      "In exchange for your irreparable trauma, you've been granted unique insights about the Truth.",
      "The question is, how far can you trust your own senses?"
    ].join("<br/><br/>"),
    occupation: ["Homeless", "Escaped Mental Patient", "Street Peddler", "Street Performer", "Fence", "Thief", "Police", "Drug Dealer", "Addict", "Street Artist", "Freelance Journalist", "Tattoo Artist", "Abuse Survivor", "Normal Person In The Wrong Place At The Wrong Time"],
    looks: {
      clothes: ["hobo", "streetwear ", "ripped suit", "strange", "ragged and worn", "alternative", "casual", "kinky", "formal", "amulets and fetishes", "dirty"],
      face: ["haggard", "tattooed", "bony", "wild beard and long hair", "grimacing", "cheerful", "sorrowful", "dirty", "scarred", "apprehensive"],
      eyes: ["obscured", "staring", "desolate", "deranged", "frightened", "anxious", "furious", "unfocused", "fearless", "darting", "intense", "carefree"],
      body: ["jerky", "crouching", "feral", "skinny", "large", "tattooed", "scarred", "hairy", "misshapen", "obese", "tall and gangly", "dirty", "unsteady"]
    },
    relations: [
      {
        description: "One of the characters is trying to get you back on your feet again. Take +1 Relation with each other.",
        in: 1,
        out: 1
      },
      {
        description: "One of the characters is your closest friend. Take +2 Relation with them.",
        in: 2,
        out: ""
      },
      {
        description: "One of the characters was the reason you were broken. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "You are angry with one of the characters. Take +1 Relation with them.",
        in: 1,
        out: ""
      }
    ]
  },
  [K4Archetype.careerist]: {
    label: "Careerist",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Awe-Inspiring", "Influential Friends", "Network of Contacts", "Notorious", "Daredevil", "Puppeteer", "At Any Cost", "Opportunist"],
    [K4ItemType.disadvantage]: ["Cursed", "Greedy", "Haunted", "Liar", "Rationalist", "Rival"],
    [K4ItemType.darksecret]: ["Curse", "Guilty of Crime", "Occult Experience", "Pact with Dark Forces", "Responsible for Medical Experiments"],
    description: [
      "You are the consummate brown-nosing backstabber.",
      "Most like you remain stuck in a cubicle farm, performing the same mundane tasks day after day, while a ruthless few climb upwards in the corporate hierarchy.",
      "Potentially, you could also run your own company, fighting for survival against corporate giants.",
      "In a world where nothing is off limits when it comes to advancing your career, success necessitates being willing to do whatever it takes."
    ].join("<br/><br/>"),
    occupation: ["Lawyer", "Businessman", "Office Worker", "Director", "Ceo", "Consultant", "Bureaucrat", "Politician", "Jet Setter", "Yuppie", "Salesman", "Trainee", "Aristocrat"],
    looks: {
      clothes: ["cheap suit", "tailored suit", "chinos and shirt", "latest fashion", "casual", "polo and khakis", "expensive"],
      face: ["pretty", "sharp", "round and sweaty", "dominant", "chiseled", "ruthless", "beautiful", "boring", "flat"],
      eyes: ["attentive", "penetrating", "ruthless", "weary", "cunning", "sharp", "warm", "authoritarian"],
      body: ["slim", "sexy", "lanky", "chubby", "big", "small", "in shape", "thin", "voluptuous"]
    },
    relations: [
      {
        description: "One of the characters assisted you with removing a company rival. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters knows your Dark Secret.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters also works for your boss.",
        in: "",
        out: ""
      },
      {
        description: "You are in love with one of the characters. Take +2 Relation with them.",
        in: 2,
        out: ""
      }
    ]
  },
  [K4Archetype.criminal]: {
    label: "Criminal",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Streetwise", "Burglar", "Escape Artist", "Sixth Sense", "Deadly Stare", "Enforcer", "Gang Leader", "Streetfighter"],
    [K4ItemType.disadvantage]: ["Bad Reputation", "Drug Addict", "Harassed", "Nemesis", "Sexual Neurosis", "Wanted"],
    [K4ItemType.darksecret]: ["Family Secret", "Forbidden Knowledge", "Guilty of Crime", "Occult Experience", "Victim of Crime"],
    description: [
      "Whether mobster, gang member, thief, drug dealer, or hitman, you are driven by two things: your quest for money, and payback for all the shit you've endured during your life.",
      "If you're one of a precious few, your criminality grants you a life of luxury.",
      "Otherwise, you only catch a fleeting glimpse of wealth before someone bigger and meaner takes it all away from you.",
      "It's a dog-eat-dog world."
    ].join("<br/><br/>"),
    occupation: ["Thief", "Robber", "Dealer", "Gang Member", "Homeless", "Prize Fighter", "Corrupt Cop", "Enforcer", "Club Owner", "Extortionist", "Hitman", "Face Of The Operation", "Getaway Driver", "Con Artist", "Mobster", "Dealer", "Muscle For Hire"],
    looks: {
      clothes: ["streetwear", "suit", "biker", "gangsta", "casual", "tracksuit", "exclusively- cut", "worn"],
      face: ["hard", "handsome", "scarred", "battered", "dishonest", "cruel"],
      eyes: ["grim", "calculating", "ruthless", "cold", "mad", "piggish", "dark", "suspicious"],
      body: ["muscular", "lanky", "enormous", "top-heavy", "graceful", "truncated", "maimed", "broken", "plump", "stocky", "wiry"]
    },
    relations: [
      {
        description: "One of the characters hid you from the police or others who were after you. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters is indebted to you.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters is connected to one of your rivals.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters knew you from before your criminal dealings. Take +1 Relation with them.",
        in: 1,
        out: ""
      }
    ]
  },
  [K4Archetype.cursed]: {
    label: "Cursed",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Occult Studies", "Bound", "Magical Intuition", "Death Drive", "Ruthless", "Desperate", "Sealed Fate", "To the Last Breath"],
    [K4ItemType.disadvantage]: ["!Condemned", "Drug Addict", "Greedy", "Haunted", "Nightmares", "Stalker"],
    [K4ItemType.darksecret]: ["Chosen One", "Curse", "Occult Experience", "Pact with Dark Forces", "Returned from the Other Side"],
    description: [
      "You are living on borrowed time.",
      "You might be the unfortunate victim of a deadly disease or the target of a higher power's rage.",
      "Usually, however, you have sealed your own fate by selling your soul for fortune and fame.",
      "Now your time is almost up, and you have realized life itself is the most worthwhile thing you possess.",
      "No price is too high to pay for you to thwart their destiny, even if it means sacrificing others."
    ].join("<br/><br/>"),
    occupation: ["Occultist", "Cult Escapee", "Police Officer", "CEO", "Detective", "Military Officer", "Gangster", "Politician", "Disability Collector", "Amateur Magician", "Celebrity", "Jailbird", "Businessman", "Playboy", "Refugee", "Researcher", "Internet Celebrity"],
    looks: {
      clothes: ["brand name", "unique", "tailored suit", "unconcerned", "trenchcoat and suit", "heavy metal", "designer", "tattered and stained", "uniform", "all black", "foreign", "business casual", "blood-soaked"],
      face: ["haggard", "emaciated", "sharp", "model", "tanned", "smiling", "scarred", "branded", "fleshy", "pale", "flushed", "masculine", "sorrowful", "sickly"],
      eyes: ["desperate", "devious", "hard", "surrendered", "fearless", "burned", "intimidated", "beautiful", "shades", "dark", "tired", "stubborn", "hopeful"],
      body: ["sickly", "well-trained", "tanned", "taut", "shaky", "trembling", "weak", "attractive", "muscular", "slender", "corpulent", "curvy", "crippled", "cowering", "towering", "straight-backed", "dejected"]
    },
    relations: [
      {
        description: "One of the characters knows the fate awaiting you. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "You utilized your prior success to help one of the other characters. They take +1 Relation with you.",
        in: "",
        out: 1
      },
      {
        description: "One of the characters is assisting you in avoiding your fate. Take +2 Relation with each other.",
        in: 2,
        out: 2
      },
      {
        description: "One of the characters is standing in your way, preventing you from avoiding your fate (determine how together).",
        in: "",
        out: ""
      }
    ]
  },
  [K4Archetype.deceiver]: {
    label: "Deceiver",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Erotic", "Impostor", "Seducer", "Backstab", "Eye for Detail", "Intuitive", "Grudge", "Manipulative"],
    [K4ItemType.disadvantage]: ["Cursed", "Greedy", "Liar", "Nemesis", "Sexual Neurosis", "Wanted"],
    [K4ItemType.darksecret]: ["Heir", "Mental Illness", "Occult Experience", "Pact with Dark Forces", "Victim of Crime"],
    description: [
      "He was in love. She finally met Mr. Right. Their futures were certain, the weddings were planned, and everyone felt they were perfect for each other. Then one day, you disappeared — along with his bank account and all of her jewelry.",
      "They were your targets.",
      "You are a manipulator who fools others into trusting you to deprive them of money or services. You are a master of masking your true intentions and feelings, and can become exactly the person your victims want.",
      "You have left a trail of bitter enemies in your wake. When your past catches up to you, will it end in tragedy?"
    ].join("<br/><br/>"),
    occupation: ["Model", "Between Jobs", "Catfisher", "Lover", "Escort", "Heir(Ess)", "Jetsetter", "Party Animal", "Secretary", "Party Planner", "Marriage Swindler", "Con Artist", "Gigolo", "Scammer", "Thief", "Snitch", "Pornstar"],
    looks: {
      clothes: ["tight-fitting", "designer", "sexy", "revealing", "bohemian", "stylish", "trendy", "proper", "peacockish", "exclusively-cut", "distressed", "attention-grabbing"],
      face: ["elfin", "handsome", "neotenic", "youthful", "chiseled", "defined", "soft", "round", "gorgeous", "innocent", "dignified", "cheerful"],
      eyes: ["mischievous", "twinkling", "intense", "vulnerable", "innocent", "pretty", "understanding", "friendly", "large", "penetrating", "warm"],
      body: ["slim", "sexy", "masculine", "curvy", "towering", "sensual", "voluptuous", "petite", "toned", "youthful", "hearty", "tall", "short", "thin", "wiry"]
    },
    relations: [
      {
        description: "One of the characters helped you kill one of your many enemies. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters met you during a rare moment when you were your true self.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters is your current victim. They take +2 Relation with you.",
        in: "",
        out: 2
      },
      {
        description: "One of the characters is attracted to you. They take +1 Relation with you.",
        in: "",
        out: 1
      }
    ]
  },
  [K4Archetype.descendant]: {
    label: "Descendant",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Influential Friends", "Intuitive", "Occult Library", "Artifact", "Bound", "Enhanced Awareness", "Inner Power", "Watchers"],
    [K4ItemType.disadvantage]: ["Cursed", "Haunted", "Nightmares", "Phobia", "Repressed Memories", "Stalker"],
    [K4ItemType.darksecret]: ["Chosen One", "Family Secret", "Heir", "Occult Experience", "Pact with Dark Forces"],
    description: [
      "Blood, soul and heritage weigh heavy on your shoulders.",
      "You are an offspring of some mythic ancestor, a now dead family, a lost god, chosen by a dark cult or maybe the heir of some unknown power. It is the past that haunts you – the Sins of the Fathers. It may be dark pacts, servitude to demons, or a still lingering upbringing filled with abuse and violence.",
      "No matter where you go or hide, your past will eventually catch up to you."
    ].join("<br/><br/>"),
    occupation: ["Antiquarian", "Aristocrat", "Author", "Homeless", "Tattoo Artist", "Occultist", "Sect Escapee", "Preacher", "Heir", "Unemployed", "Office Worker", "Craftsman", "Forester"],
    looks: {
      clothes: ["old fashioned", "casual", "ragged and worn", "tailored suit", "layer upon layer", "odd", "black"],
      face: ["childish", "sharp", "sorrowful", "scarred", "dishonest", "sickly", "pretty", "pronounced", "tense", "round"],
      eyes: ["tired", "indifferent", "anxious", "intense", "suspicious", "fearless", "innocent", "restless", "cunning", "sad"],
      body: ["weak", "strong", "bony", "small", "sickly", "slender", "athletic", "big", "spindly", "hunched", "stiff", "lean"]
    },
    relations: [
      {
        description: "One of the characters grew up alongside you. Take +2 Relation to one another.",
        in: 2,
        out: 2
      },
      {
        description: "You are secretly in love with one of the characters. Take +2 Relation to them.",
        in: 2,
        out: ""
      },
      {
        description: "One of the characters is your contact person.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters is intertwined with your dark secrets. Take +1 Relation with them.",
        in: 1,
        out: ""
      }
    ]
  },
  [K4Archetype.detective]: {
    label: "Detective",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Fast Talk", "Interrogator", "Instinct", "Read a Crowd", "Shadow", "Crime Scene Investigator", "Dreamer", "Enhanced Awareness"],
    [K4ItemType.disadvantage]: ["Drug Addict", "Infirm", "Nightmares", "Repressed Memories", "Stalker"],
    [K4ItemType.darksecret]: ["Forbidden Knowledge", "Guilty of Crime", "Occult Experience", "Returned from the Other Side", "Strange Disappearance"],
    description: [
      "Whether a disillusioned private eye in an office shrouded in clouds of cigarette smoke or a hardened investigator on the homicide unit, you are motivated by your desperate need to find answers.",
      "Meanwhile, your family disintegrates, your friends abandon you, and you fall into a spiral of darkness and addiction.",
      "Your 'noble' search leads you down lonely and dangerous paths best left untrodden."
    ].join("<br/><br/>"),
    occupation: ["Beat Cop", "Private Eye", "Lawyer", "Investigator", "Security Guard", "Investigative Journalist", "Intelligence Officer", "Detective", "Medium", "Hacker", "Cryptologist", "Conspiracy Theorist"],
    looks: {
      clothes: ["suit", "tweed", "trendy", "casual", "severe", "business", "shabby"],
      face: ["friendly", "sharp", "round", "sweaty", "innocent", "determined", "tired"],
      eyes: ["empathic", "indifferent", "squinty", "sharp", "suspicious", "warm", "concerned"],
      body: ["spindly", "fat", "wiry", "stout", "stocky", "muscled"]
    },
    relations: [
      {
        description: "One of the characters saved you from a dangerous situation. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "You helped one of the characters solve a mystery. They take +1 Relation with you.",
        in: "",
        out: 1
      },
      {
        description: "One of the characters is your coworker. Take +1 Relation with them and they take +1 Relation with you.",
        in: 1,
        out: 1
      },
      {
        description: "One of the characters is your informant. Take +1 Relation with them.",
        in: 1,
        out: ""
      }
    ]
  },
  [K4Archetype.doll]: {
    label: "Doll",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Perpetual Victim", "Backstab", "Ice Cold", "Sneak", "Divine", "Magnetic Attraction", "Endure Trauma", "Gritted Teeth"],
    [K4ItemType.disadvantage]: ["!Object of Desire", "Harassed", "Owned", "Phobia", "Sexual Neurosis", "Stalker"],
    [K4ItemType.darksecret]: ["Chosen One", "Guilty of Crime", "Occult Experience", "Victim of Crime", "Victim of Medical Experiments"],
    description: [
      "In the shadows, you stand ready.",
      "You strive to break free, to be human again, to assume control of your own life — while others strive to possess you.",
      "You have lived a life in submission, as an outcast, a prisoner, a freak, or a trophy.",
      "Feelings of emptiness and tragedy reside within you, as well as dreams of hope, love, and happiness – dreams which have been shattered over and over again."
    ].join("<br/><br/>"),
    occupation: ["Child Beauty Contestant", "Model", "Stripper", "Trophy Wife", "Gigolo", "Actor", "Escaped Experiment", "High School Prom Queen", "Vlogger", "Reality TV Celebrity", "Pornstar", "Escort", "Abuse Survivor", "Imprisoned Innocent", "Trafficking Victim"],
    looks: {
      clothes: ["revealing", "frilly and fluffy ", "sexy", "strange", "trendy", "impractical", "spectacular", "gothic", "ornate", "bohemian", "bright", "innocent", "ripped", "sharp clothing"],
      face: ["pretty", "smiling", "sad", "childish", "black and blue", "chiseled", "reassuring", "made-up", "androgynous", "happy"],
      eyes: ["innocent", "beautiful", "spellbinding", "multicolored", "frightened", "purple", "pale", "sapphire blue", "emerald green", "yellow-gold", "hungry", "dispassionate", "large", "veiled", "devastated", "flirtatious"],
      body: ["frail", "attractive", "small", "graceful", "petite", "curvaceous", "athletic", "dignified", "lean and fit", "slender", "willowy", "androgynous", "tall"]
    },
    relations: [
      {
        description: "One of the characters is in love with you. They take +2 Relation with you.",
        in: "",
        out: 2
      },
      {
        description: "You are secretly in love with one of the characters. Take +2 Relation with them.",
        in: 2,
        out: ""
      },
      {
        description: "One of the characters liberated you. Take +1 Relation with each other.",
        in: 1,
        out: 1
      },
      {
        description: "One of the characters is jealous of you.",
        in: "",
        out: ""
      }
    ]
  },
  [K4Archetype.drifter]: {
    label: "Drifter",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Street Contacts", "Driver", "Improviser", "Character Actor", "Vigilant", "Wanderer", "Artifact", "Enhanced Awareness"],
    [K4ItemType.disadvantage]: ["Cursed", "Harassed", "Haunted", "Schizophrenia", "Stalker", "Wanted"],
    [K4ItemType.darksecret]: ["Curse", "Family Secret", "Mental Illness", "Returned from the Other Side", "Rootless"],
    description: [
      "You never stay in one place long enough to feel at home.",
      "The road is your home. It could be an uncontrollable urge to never put down roots, or a reaction to pursuers always on your heels.",
      "You have learned to live with whatever fits in your backpack or the back of your car. What is important to others lacks meaning to you, who never gets attached to anything. Other vagabonds and outcasts are your friends and allies. They seek refuge in rundown motels, boxcars, abandoned homes, and other makeshift shelters.",
      "The eternal question for those who meet you is: What are you running from?"
    ].join("<br/><br/>"),
    occupation: ["Homeless", "Vagabond", "Runaway", "In Witness Protection", "Draft Dodger", "Small-Time Crook", "Backpacker", "Refugee", "Prison Escapee", "Traveling Salesman", "Courier", "Day Laborer", "Outsider"],
    looks: {
      clothes: ["worn", "odd", "biker", "ripped", "practical", "street", "wilderness survival", "layer upon layer", "wrong season", "cheap suit", "hobo clothing"],
      face: ["ravaged", "innocent", "weathered", "pronounced", "filthy", "friendly", "tough", "tattooed", "scarred", "memorable"],
      eyes: ["cloudy", "tired", "restless", "blind", "one-eyed", "bloodshot", "tense", "suspicious", "fearful", "cheerful", "sarcastic", "intelligent"],
      body: ["wiry", "bony", "hobbled", "fast", "dirty", "scarred", "big", "small", "slim", "androgynous", "tall", "disproportionate", "laid back", "tense", "malformed", "twisted", "tattooed", "animalistic"]
    },
    relations: [
      {
        description: "One of the characters lets you stay with them sometimes. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters is an old friend. Take +2 Relation with them.",
        in: 2,
        out: ""
      },
      {
        description: "One of the characters is someone you know in the underworld.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters gives you occasional jobs.",
        in: "",
        out: ""
      }
    ]
  },
  [K4Archetype.fixer]: {
    label: "Fixer",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Forked Tongue", "Streetwise", "Ace Up the Sleeve", "Backstab", "Boss", "Extortionist", "Sixth Sense", "Worldly"],
    [K4ItemType.disadvantage]: ["Competitor", "Cursed", "Greedy", "Jealousy", "Liar", "Stalker"],
    [K4ItemType.darksecret]: ["Forbidden Knowledge", "Guilty of Crime", "Heir", "Pact with Dark Forces", "Victim of Crime"],
    description: [
      "You have all the contacts, and you use them to make quick cash.",
      "Drugs, weapons, illegal prizefights, antiques, cars, apartments – you can set anyone up with whatever they need. But everything you sell comes with a catch. Once you get their hooks in them, you'll never let them go.",
      "As long as there's money involved you don't care about the stakes, and the more successful you are, the more enemies you make along the way.",
      "In the underworld, there are always people hungrily watching you, waiting for the right moment, and willing to step over your body to take your place."
    ].join("<br/><br/>"),
    occupation: ["Mafia Boss", "Business Person", "Real Estate Agent", "Dealer", "Restaurateur", "Club Owner", "Fence", "Loan Shark", "Bookie", "Advisor", "Extortionist", "Criminal", "Consigliere"],
    looks: {
      clothes: ["suit", "street", "leather", "casual", "bizarre", "luxury", "sportswear clothing"],
      face: ["pleasant", "good-looking", "attractive", "bony", "smashed", "innocent", "meaty", "open"],
      eyes: ["cheerful", "calculating", "cold", "servile", "cunning", "tough", "confused", "evaluating"],
      body: ["broad", "athletic", "skinny", "sensual", "skipped leg day", "tall and wiry", "stocky"]
    },
    relations: [
      {
        description: "One of the characters endured a beating to get you out of a bind. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters is indebted to you.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters works for you.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters is a business contact.",
        in: "",
        out: ""
      }
    ]
  },
  [K4Archetype.occultist]: {
    label: "Occultist",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Crafty", "Occult Library", "Dabbler in the Occult", "Dreamer", "Enhanced Awareness", "Exorcist", "Magical Intuition", "Thirst for Knowledge"],
    [K4ItemType.disadvantage]: ["Guilt", "Haunted", "Involuntary Medium", "Nightmares", "Repressed Memories", "Stalker"],
    [K4ItemType.darksecret]: ["Forbidden Knowledge", "Guardian", "Occult Experience", "Pact with Dark Forces", "Visitations"],
    description: [
      "You seek the answers to life's mysteries through occult theories.",
      "Ancient tomes, mad sect leaders, and obscure internet forums speak of different dimensions, magical rituals, otherworldly creatures, and powers that can turn men into gods. You have discovered enough information to begin experimenting with these forces, but not nearly enough to give you any degree of control.",
      "Magic always comes at a high price, and your account is coming due."
    ].join("<br/><br/>"),
    occupation: ["Antiquarian", "Medium", "Exorcist", "Linguist", "Unemployed", "Theologian", "Professor", "Morgue Employee", "Teenager", "Student", "Bureaucrat", "Disability Collector", "Librarian", "Recent Convert", "Thelemic"],
    looks: {
      clothes: ["all black", "suit and trenchcoat", "hippie", "occult symbolism", "casual", "spiritual", "flashy", "shimmery", "tattered", "new age", "peculiar", "discreet", "spectacular"],
      face: ["big bushy beard", "long black hair and pale skin", "bony", "disfigured", "worn", "pretty", "tense", "pallid", "indifferent", "scornful", "bored", "wrinkled or aged"],
      eyes: ["hollow", "lucid", "mad", "piercing", "arresting", "interrogating", "distant", "tired", "defeated", "power-hungry", "sad"],
      body: ["emaciated", "scarred", "broken", "towering", "trembling", "tattooed", "burned", "wispy", "hunched", "lanky", "obese", "stiff", "inviting"]
    },
    relations: [
      {
        description: "One of the characters participated in one of your rituals.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters is your friend. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters assists you with acquiring books, information, and artifacts. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters hates you for doing something to them, despite your love for them. Take +2 Relation with them.",
        in: 2,
        out: ""
      }
    ]
  },
  [K4Archetype.prophet]: {
    label: "Prophet",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Charismatic Aura", "Cult Leader", "Enhanced Awareness", "Exorcist", "Lay on Hands", "Voice of Insanity", "Divine Champion", "Good Samaritan"],
    [K4ItemType.disadvantage]: ["Cursed", "Fanatic", "Harassed", "Involuntary Medium", "Sexual Neurosis", "Stalker"],
    [K4ItemType.darksecret]: ["Chosen One", "Forbidden Knowledge", "Guardian", "Occult Experience", "Visitations"],
    description: [
      "Faith and religion bestow power, whether you're a priest, pastor, imam, rabbi, or other sect leader.",
      "You may have chosen to serve your god, but it could also be a path you've been forced to walk by your family or congregation from an early age. Being on the inside of a religious association provides access to community and a sense of higher purpose.",
      "However, the shadows cast by the Divine's light often hide abuse of power, occultism, perverted doctrine, forced marriages, and the worship of false gods."
    ].join("<br/><br/>"),
    occupation: ["Priest", "Pastor", "Imam", "Rabbi", "Sect Leader", "Sect Member", "Sect Escapee", "Prophet", "Medium", "Witch", "Preacher", "Healer", "Missionary", "Seer", "Cultist", "Idolater", "Iconoclast", "Elder", "Oracle", "Guru"],
    looks: {
      clothes: ["suit", "clerical robes", "orthodox", "organic materials", "bohemian", "casual", "coat and hat", "street", "strange", "worn"],
      face: ["handsome", "smooth", "attractive", "childlike", "dominant", "narrow", "aristocratic", "open", "ascetic"],
      eyes: ["cheerful", "deep", "mad", "wise", "forgiving", "mesmerizing", "piercing", "passionate"],
      body: ["large", "slender", "thin", "small", "spindly", "sickly", "plump", "firm", "energetic", "voluptuous"]
    },
    relations: [
      {
        description: "One of the characters shares your faith.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters denied your god.",
        in: "",
        out: ""
      },
      {
        description: "You saved one of the other character's immortal soul. They take +1 Relation with you.",
        in: "",
        out: 1
      },
      {
        description: "One of the characters is your lover. Take +1 Relation with them.",
        in: 1,
        out: ""
      }
    ]
  },
  [K4Archetype.ronin]: {
    label: "Ronin",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Weapon Master (Melee)", "Weapon Master (Firearms)", "Chameleon", "Exit Strategy", "Manhunter", "Sixth Sense", "Lightning Fast", "Sniper", "Jaded"],
    [K4ItemType.disadvantage]: ["Cursed", "Haunted", "Marked", "Nemesis", "Nightmares", "Wanted"],
    [K4ItemType.darksecret]: ["Curse", "Guardian", "Occult Experience", "Victim of Medical Experiments", "Visitations"],
    description: [
      "You teeter at the edge of a bottomless pit.",
      "When the desperate have run out of options, they hire you to solve the problem. You perform any task where compassion and morality are liabilities, and where mistakes mean prison, death, or worse. You can never trust anyone. Yesterday's employers are tomorrow's potential targets.",
      "Once your hunt has begun, there is no escape for your prey."
    ].join("<br/><br/>"),
    occupation: ["Contract Killer", "Hitman", "Special Agent", "Special Ops", "Military Experiment", "Sniper", "Spree Killer"],
    looks: {
      clothes: ["suit", "discreet", "black", "worn", "concealing", "extravagant", "fashionable", "practical"],
      face: ["emaciated", "expressionless", "mundane", "friendly", "scarred", "tough", "pretty", "smooth"],
      eyes: ["grim", "appraising", "cool", "obscured", "melancholy", "merciless", "challenging"],
      body: ["graceful", "athletic", "small", "scarred", "strong", "massive", "wiry", "emaciated", "toned", "battered"]
    },
    relations: [
      {
        description: "One of the characters knows who you really are. Take +1 Relation with each other.",
        in: 1,
        out: 1
      },
      {
        description: "One of the characters knows your deepest fear.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters owes their life to you. They take +1 Relation with you.",
        in: "",
        out: 1
      },
      {
        description: "You harbor a secret passion for one of the character's partner. Take +2 Relation with that partner.",
        in: 2,
        out: ""
      }
    ]
  },
  [K4Archetype.scientist]: {
    label: "Scientist",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Battlefield Medicine", "Inventor", "Scientist", "Enhanced Awareness", "Genius", "Implanted Messages", "Arcane Researcher", "Workaholic"],
    [K4ItemType.disadvantage]: ["Bad Reputation", "Experiment Gone Wrong", "Fanatic", "Mental Compulsion", "Repressed Memories", "Wanted"],
    [K4ItemType.darksecret]: ["Forbidden Knowledge", "Mental Illness", "Responsible for Medical Experiments", "Returned from the Other Side", "Victim of Medical Experiments"],
    description: [
      "You explore the unknown in the hope of finding answers to the questions of life and the universe.",
      "Your research often leads to dangerous experiments, where the fabric between our dimension and others is temporarily blown aside. In psychology, medicine, physics, chemistry, and various parasciences, these experiments often lead to terrible consequences.",
      "Some might call you mad, but you know this is because they refuse to see the Truth."
    ].join("<br/><br/>"),
    occupation: ["Doctor", "Psychologist", "Surgeon", "Inventor", "Engineer", "Technician", "Therapist", "Physicist"],
    looks: {
      clothes: ["suit", "worn and dirty", "casual", "practical", "coat and hat", "peculiar", "lab coat", "stained", "neat", "durable"],
      face: ["worn", "square", "scarred", "bony", "round and sweaty", "pronounced", "exhausted", "ravaged", "serious"],
      eyes: ["calculating", "dead", "squinting", "burning", "mad", "confused", "commanding"],
      body: ["frail", "angular", "stocky", "overweight", "emaciated", "skinny", "slender", "tall", "hunched", "strange"]
    },
    relations: [
      {
        description: "One of the characters received help from you. They take +1 Relation with you.",
        in: "",
        out: 1
      },
      {
        description: "One of the characters knows details of your dreams.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters volunteered for one of your experiments. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters is involved in your research.",
        in: "",
        out: ""
      }
    ]
  },
  [K4Archetype.seeker]: {
    label: "Seeker",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Parkour", "Access the Dark Net", "Keen-Eyed", "Hacker", "Prepared", "Enhanced Awareness", "Stubborn", "Endure Trauma"],
    [K4ItemType.disadvantage]: ["Cursed", "Haunted", "Nightmares", "Repressed Memories", "Stalker", "Wanted"],
    [K4ItemType.darksecret]: ["Family Secret", "Forbidden Knowledge", "Guardian", "Occult Experience", "Strange Disappearance"],
    description: [
      "You are an explorer of modern, ancient, and forgotten urban myths. You are a blogger, a hacker, a storyteller of the Modern Age.",
      "On the Internet, faceless voices whisper of lies and conspiracies. In abandoned subway stations, someone leaves messages in seemingly meaningless graffiti. If you dig deep enough you'll find the Truth, but most cannot see through the thick fog of misinformation, and we become hopelessly lost in the tempest of propaganda, pornography, and mindless entertainment. You know how to use the Internet to uncover secrets under stones best left unturned.",
      "For you, no price is too great to find the Truth and expose it for public consumption."
    ].join("<br/><br/>"),
    occupation: ["Student", "Unemployed", "Blogger", "Hacker", "Activist", "Academic", "Researcher", "Parapsychologist", "Author", "Journalist", "Thief", "Medium", "Conspiracy Theorist"],
    looks: {
      clothes: ["nerdy", "second-hand", "leather", "alternative", "casual", "durable", "smelly", "comfortable", "stained or ripped"],
      face: ["wrinkled", "lively", "cute", "neotenic", "pale", "grim", "smashed", "innocent"],
      eyes: ["clear", "hard", "tired", "bloodshot", "doubtful", "curious", "avoidant", "suspicious", "evaluating"],
      body: ["lanky", "sinewy", "robust", "fragile", "hefty", "deformed", "wispy", "chubby", "bent", "short", "youthful"]
    },
    relations: [
      {
        description: "You entrusted one of the characters with a secret, which could put you away in prison.",
        in: "",
        out: ""
      },
      {
        description: "You look up to one of the characters. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters saved your life. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "You have discovered one of the characters in the act of something criminal, obscene, or extremely shameful.",
        in: "",
        out: ""
      },
      {
        description: "You befriended one of the characters in the process of assisting them with some supernatural trouble. Give her +1 Relation with you.",
        in: "",
        out: 1
      }
    ]
  },
  [K4Archetype.veteran]: {
    label: "Veteran",
    tier: ArchetypeTier.aware,
    [K4ItemType.advantage]: ["Hunter", "Instinct", "Survivalist", "Voice of Pain", "Martial Arts Expert", "Officer", "Dead Shot", "Hardened"],
    [K4ItemType.disadvantage]: ["Drug Addict", "Haunted", "Nightmares", "Phobia", "Repressed Memories", "Stalker"],
    [K4ItemType.darksecret]: ["Guilty of Crime", "Returned from the Other Side", "Victim of Crime", "Victim of Medical Experiments", "Visitations"],
    description: [
      "You've seen death up close.",
      "You have spent a major part of your life in combat, weapon in hand, and adrenaline coursing through your veins.",
      "You might be an infantry soldier crouching in an Afghanistan foxhole, a SWAT officer carrying out frequent missions against heavily armed criminals, or a civilian from a country devastated by war, now a refugee but still tortured by memories of the conflict."
    ].join("<br/><br/>"),
    occupation: ["Special Agent", "Military Soldier", "Street Soldier", "Mercenary", "Mma Fighter", "Military Officer", "Security Guard", "Body Guard", "Hitman", "War Refugee", "Military Police", "Retiree", "Homeless Vet"],
    looks: {
      clothes: ["street", "athletic wear", "blood-stained", "casual", "camo", "uniform", "practical"],
      face: ["hard", "coarse", "scarred", "weathered", "fragile", "harsh", "disfigured"],
      eyes: ["hardened", "dead", "desolate", "burning", "sorrowful", "angry", "commanding"],
      body: ["compact", "hardy", "scarred", "huge", "hefty", "limber", "tall", "muscular", "sinewy", "strong", "brutalized"]
    },
    relations: [
      {
        description: "One of the characters assisted you when you were in need. Take +1 Relation with them.",
        in: 1,
        out: ""
      },
      {
        description: "One of the characters followed you into battle. Take +1 Relation with each other.",
        in: 1,
        out: 1
      },
      {
        description: "One of the characters listened to your war stories.",
        in: "",
        out: ""
      },
      {
        description: "One of the characters has seen you lose control.",
        in: "",
        out: ""
      }
    ]
  },
  [K4Archetype.abomination]: {
    label: "Abomination",
    tier: ArchetypeTier.enlightened,
    [K4ItemType.advantage]: [],
    [K4ItemType.disadvantage]: [],
    [K4ItemType.darksecret]: [],
    description: "",
    occupation: [],
    looks: {},
    relations: []
  },
  [K4Archetype.deathMagician]: {
    label: "Death Magician",
    tier: ArchetypeTier.enlightened,
    [K4ItemType.advantage]: [],
    [K4ItemType.disadvantage]: [],
    [K4ItemType.darksecret]: [],
    description: "",
    occupation: [],
    looks: {},
    relations: []
  },
  [K4Archetype.disciple]: {
    label: "Disciple",
    tier: ArchetypeTier.enlightened,
    [K4ItemType.advantage]: [],
    [K4ItemType.disadvantage]: [],
    [K4ItemType.darksecret]: [],
    description: "",
    occupation: [],
    looks: {},
    relations: []
  },
  [K4Archetype.dreamMagician]: {
    label: "Dream Magician",
    tier: ArchetypeTier.enlightened,
    [K4ItemType.advantage]: [],
    [K4ItemType.disadvantage]: [],
    [K4ItemType.darksecret]: [],
    description: "",
    occupation: [],
    looks: {},
    relations: []
  },
  [K4Archetype.madnessMagician]: {
    label: "Madness Magician",
    tier: ArchetypeTier.enlightened,
    [K4ItemType.advantage]: [],
    [K4ItemType.disadvantage]: [],
    [K4ItemType.darksecret]: [],
    description: "",
    occupation: [],
    looks: {},
    relations: []
  },
  [K4Archetype.passionMagician]: {
    label: "Passion Magician",
    tier: ArchetypeTier.enlightened,
    [K4ItemType.advantage]: [],
    [K4ItemType.disadvantage]: [],
    [K4ItemType.darksecret]: [],
    description: "",
    occupation: [],
    looks: {},
    relations: []
  },
  [K4Archetype.revenant]: {
    label: "Revenant",
    tier: ArchetypeTier.enlightened,
    [K4ItemType.advantage]: [],
    [K4ItemType.disadvantage]: [],
    [K4ItemType.darksecret]: [],
    description: "",
    occupation: [],
    looks: {},
    relations: []
  },
  [K4Archetype.timeAndSpaceMagician]: {
    label: "Time and Space Magician",
    tier: ArchetypeTier.enlightened,
    [K4ItemType.advantage]: [],
    [K4ItemType.disadvantage]: [],
    [K4ItemType.darksecret]: [],
    description: "",
    occupation: [],
    looks: {},
    relations: []
  }
} as const;

export const Attributes = {
  Active: {
    [K4Attribute.reason]: {},
    [K4Attribute.intuition]: {},
    [K4Attribute.perception]: {},
    [K4Attribute.coolness]: {},
    [K4Attribute.violence]: {},
    [K4Attribute.charisma]: {},
    [K4Attribute.soul]: {}
  },
  Passive: {
    [K4Attribute.fortitude]: {},
    [K4Attribute.willpower]: {},
    [K4Attribute.reflexes]: {}
  }
} as const;
export const HarmButtons = (resolve: (value: {harm: number;}) => void) => {
  const harmButtons: Record<string, DialogButton> = {};
  for (let harm = 1; harm <= 5; harm++) {
    harmButtons[harm] = {
      label: `${String(harm)} Harm`,
      callback: () => {resolve({harm});}
    };
  }
  return harmButtons;
};
// export const AttributeButtons = (resolve: (value: {attribute: K4Roll.RollableAttribute;}) => void) => {
//   const attrButtons: Record<string, DialogButton> = {};
//   [
//     K4Attribute.zero,
//     K4Attribute.willpower,
//     K4Attribute.fortitude,
//     K4Attribute.reflexes,
//     K4Attribute.reason,
//     K4Attribute.perception,
//     K4Attribute.intuition,
//     K4Attribute.coolness,
//     K4Attribute.violence,
//     K4Attribute.charisma,
//     K4Attribute.soul
//   ].forEach((attr) => {
//     attrButtons[attr] = {
//       label: U.loc(`trait.${attr}`),
//       callback: () => {
//         resolve({attribute: attr as K4Roll.RollableAttribute});
//       }
//     };
//   });
//   return attrButtons;
// };


// export const Colors = {
//   // GOLD5
//   GOLD1: "rgb(58, 54, 41)",
//   GOLD2: "rgb(81, 76, 58)",
//   GOLD3: "rgb(104, 97, 74)",
//   GOLD4: "rgb(127, 119, 90)",
//   GOLD5: "rgb(150, 140, 106)",
//   GOLD6: "rgb(177, 164, 125)",
//   GOLD7: "rgb(203, 189, 143)",
//   GOLD8: "rgb(229, 213, 162)",
//   GOLD9: "rgb(255, 243, 204)",

//   // RED5
//   RED1: "rgb(38, 8, 8)",
//   RED2: "rgb(68, 14, 14)",
//   RED3: "rgb(97, 20, 20)",
//   RED4: "rgb(126, 26, 26)",
//   RED5: "rgb(155, 33, 33)",
//   RED6: "rgb(180, 38, 38)",
//   RED7: "rgb(205, 47, 43)",
//   RED8: "rgb(230, 57, 48)",
//   RED9: "rgb(255, 124, 114)",

//   // BLUE5
//   BLUE1: "rgb(9, 18, 29)",
//   BLUE2: "rgb(18, 34, 57)",
//   BLUE3: "rgb(26, 51, 84)",
//   BLUE4: "rgb(34, 68, 112)",
//   BLUE5: "rgb(43, 85, 139)",
//   BLUE6: "rgb(52, 103, 168)",
//   BLUE7: "rgb(61, 121, 197)",
//   BLUE8: "rgb(70, 139, 226)",
//   BLUE9: "rgb(119, 179, 255)",

//   // GREYS
//   GREY0: "rgb(0, 0, 0)",
//   GREY1: "rgb(20, 20, 20)",
//   GREY2: "rgb(47, 47, 47)",
//   GREY3: "rgb(74, 74, 74)",
//   GREY4: "rgb(100, 100, 100)",
//   GREY5: "rgb(127, 127, 127)",
//   GREY6: "rgb(154, 154, 154)",
//   GREY7: "rgb(181, 181, 181)",
//   GREY8: "rgb(208, 208, 208)",
//   GREY9: "rgb(235, 235, 235)",
//   GREY10: "rgb(255, 255, 255)"
// }

export const Colors = {
  // COLOR DEFINITION DATA
  get Defs() {
    return {
      linearGradients: Object.values(U.objMap(
        {
          bgold: {
            fill: {
              stops: [C.Colors.GOLD9, C.Colors.GOLD8]
            },
            stroke: {
              stops: [C.Colors.GREY3, C.Colors.GREY0]
            }
          },
          gold: {
            fill: {
              stops: [C.Colors.GOLD8, C.Colors.GOLD5]
            },
            stroke: {
              stops: [C.Colors.GREY3, C.Colors.GREY0]
            }
          },
          red: {
            fill: {
              stops: [C.Colors.RED8, C.Colors.RED1]
            },
            stroke: {
              stops: [C.Colors.GOLD8, C.Colors.GOLD1]
            }
          },
          grey: {
            fill: {
              stops: [C.Colors.GREY7, C.Colors.GREY3]
            },
            stroke: {
              stops: [C.Colors.GREY0, C.Colors.GREY0]
            }
          },
          blue: {
            fill: {
              stops: [C.Colors.BLUE8, C.Colors.BLUE1]
            },
            stroke: {
              stops: [C.Colors.GOLD8, C.Colors.GOLD1]
            }
          },
          black: {
            fill: {
              stops: [C.Colors.GREY0, C.Colors.GREY0],
            },
            stroke: {
              stops: [C.Colors.GREY1, C.Colors.GREY1]
            }
          },
          white: {
            fill: {
              stops: [C.Colors.GREY10, C.Colors.GREY9],
            },
            stroke: {
              stops: [C.Colors.GREY1, C.Colors.GREY0]
            }
          },
          [K4ItemType.advantage]: {
            fill: {
              stops: [C.Colors.GOLD8, C.Colors.GOLD1]
            },
            stroke: {
              stops: [C.Colors.GOLD5, C.Colors.GOLD1]
            }
          },
          [K4ItemType.darksecret]: {
            fill: {
              stops: [C.Colors.RED1, C.Colors.RED1]
            },
            stroke: {
              stops: [C.Colors.RED8, C.Colors.RED5]
            }
          },
          [K4ItemType.disadvantage]: {
            fill: {
              stops: [C.Colors.GREY5, C.Colors.GREY1]
            },
            stroke: {
              stops: [C.Colors.GREY9, C.Colors.GREY7]
            }
          },
          // [K4ItemType.gear]: {
          //   fill: {
          //     stops: [C.Colors["GOLD8"], C.Colors["GOLD1"]]
          //   },
          //   stroke: {
          //     stops: [C.Colors.GOLD5, C.Colors["GOLD1"]]
          //   }
          // },
          [K4ItemType.move]: {
            fill: {
              stops: [C.Colors.GOLD5, C.Colors.GOLD1]
            },
            stroke: {
              stops: [C.Colors.GOLD8, C.Colors.GOLD8]
            }
          },
          // [K4ItemType.relation]: {
          //   fill: {
          //     stops: [C.Colors["GOLD8"], C.Colors["GOLD1"]]
          //   },
          //   stroke: {
          //     stops: [C.Colors.GOLD5, C.Colors["GOLD1"]]
          //   }
          // },
          [K4ItemType.weapon]: {
            fill: {
              stops: [C.Colors.RED8, C.Colors.RED1]
            },
            stroke: {
              stops: [C.Colors.RED5, C.Colors.RED1]
            }
          }
        },
        (({fill, stroke}: GradientDef, iType: K4ItemType) => {
          return {
            fill: {
              id: `fill-${iType}`,
              x: [0, 1],
              y: [0, 1],
              ...fill,
              stops: (fill.stops ?? []).map((stop, i, stops) => {
                return ({
                  offset: U.pInt(100 * (i / (Math.max(stops.length - 1, 0)))),
                  color: typeof stop === "string" ? stop : stop.color,
                  opacity: 1,
                  ...(typeof stop === "string" ? {} : stop)
                });
              }),
              ...(typeof fill.stops === "string"
                ? {}
                : fill.stops)
            },
            stroke: {
              id: `stroke-${iType}`,
              x: [0, 1],
              y: [0, 1],
              ...stroke,
              stops: (stroke.stops ?? []).map((stop, i, stops) => {
                return {
                  offset: U.pInt(100 * (i / (Math.max(stops.length - 1, 0)))),
                  color: typeof stop === "string" ? stop : stop.color,
                  opacity: 1,
                  ...(typeof stop === "string" ? {} : stop)
                };
              }),
              ...(typeof stroke.stops === "string"
                ? {}
                : stroke.stops)
            }
          };
        }) as MapFunction /*  as mapFunc<valFunc<unknown, GradientDef>, unknown, GradientDef> */
      )/*  as Record<
        K4ItemType,
        {
          fill: Partial<SVGGradientDef>,
          stroke: Partial<SVGGradientDef>;
        }
      > */).map((defs) => Object.values(defs)).flat()
    }
  },

  // GOLD5
  GOLD0: "rgb(29, 27, 20)",
  GOLD1: "rgb(58, 54, 41)",
  GOLD2: "rgb(81, 76, 58)",
  GOLD3: "rgb(104, 97, 74)",
  GOLD4: "rgb(127, 119, 90)",
  GOLD5: "rgb(150, 140, 106)",
  GOLD6: "rgb(177, 164, 125)",
  GOLD7: "rgb(203, 189, 143)",
  GOLD8: "rgb(229, 213, 162)",
  GOLD9: "rgb(255, 243, 204)",
  // GOLD ALIASES
  get ddGOLD() { return this.GOLD0; },
  get dGOLD() { return this.GOLD3; },
  get GOLD() { return this.GOLD5; },
  get bGOLD() { return this.GOLD7; },
  get bbGOLD() { return this.GOLD9; },

  // RED5
  RED0: "rgb(19, 4, 4)",
  RED1: "rgb(38, 8, 8)",
  RED2: "rgb(68, 14, 14)",
  RED3: "rgb(97, 20, 20)",
  RED4: "rgb(126, 26, 26)",
  RED5: "rgb(155, 33, 33)",
  RED6: "rgb(180, 38, 38)",
  RED7: "rgb(205, 47, 43)",
  RED8: "rgb(230, 57, 48)",
  RED9: "rgb(255, 124, 114)",
  // RED ALIASES
  get ddRED() { return this.RED0; },
  get dRED() { return this.RED3; },
  get RED() { return this.RED5; },
  get bRED() { return this.RED7; },
  get bbRED() { return this.RED9; },

  // BLUE5
  BLUE1: "rgb(9, 18, 29)",
  BLUE2: "rgb(18, 34, 57)",
  BLUE3: "rgb(26, 51, 84)",
  BLUE4: "rgb(34, 68, 112)",
  BLUE5: "rgb(43, 85, 139)",
  BLUE6: "rgb(52, 103, 168)",
  BLUE7: "rgb(61, 121, 197)",
  BLUE8: "rgb(70, 139, 226)",
  BLUE9: "rgb(119, 179, 255)",
  // BLUE ALIASES
  get ddBLUE() { return this.BLUE1; },
  get dBLUE() { return this.BLUE3; },
  get BLUE() { return this.BLUE5; },
  get bBLUE() { return this.BLUE7; },
  get bbBLUE() { return this.BLUE9; },

  // GREYS
  GREY0: "rgb(0, 0, 0)",
  GREY1: "rgb(20, 20, 20)",
  GREY2: "rgb(47, 47, 47)",
  GREY3: "rgb(74, 74, 74)",
  GREY4: "rgb(100, 100, 100)",
  GREY5: "rgb(127, 127, 127)",
  GREY6: "rgb(154, 154, 154)",
  GREY7: "rgb(181, 181, 181)",
  GREY8: "rgb(208, 208, 208)",
  GREY9: "rgb(235, 235, 235)",
  GREY10: "rgb(255, 255, 255)",
  // GREY ALIASES
  get dBLACK() { return this.GREY0; },
  get BLACK() { return this.GREY1; },
  get dGREY() { return this.GREY3; },
  get GREY() { return this.GREY5; },
  get bGREY() { return this.GREY7; },
  get WHITE() { return this.GREY9; },
  get bWHITE() { return this.GREY10; }
}


export const ColorFilters = {
  GOLD5: "hue-rotate(-32.63deg) saturate(32%) brightness(65%)",
  GOLD1: "hue-rotate(-32.63deg) saturate(32%) brightness(30%)",
  GOLD8: "hue-rotate(-32.63deg) saturate(32%) brightness(105%)",
  GOLD9: "hue-rotate(-32.63deg) saturate(32%) brightness(125%)",

  RED5: "hue-rotate(290.37deg) saturate(1620%) brightness(62%)",
  RED1: "hue-rotate(290.37deg) saturate(1620%) brightness(28%)",
  RED8: "hue-rotate(289.67deg) saturate(820%) brightness(95%)",
  RED9: "hue-rotate(290.37deg) saturate(1620%)",

  GREY10: "saturate(0)",
  GREY9: "hue-rotate(deg) saturate() brightness()",
  GREY7: "hue-rotate(deg) saturate() brightness()",
  GREY5: "hue-rotate(deg) saturate() brightness()",
  GREY3: "hue-rotate(deg) saturate() brightness()",
  GREY1: "hue-rotate(deg) saturate() brightness()",
  GREY0: "hue-rotate(deg) saturate() brightness()"
};

// export const Ranges = {
//   [AttackRange.arm]: "When you engage an able opponent within arm's reach in close combat,",
//   [AttackRange.arm_room]: "When you engage an able opponent within several steps of you in ranged combat,",
//   [AttackRange.arm_room_field]: "up to a hundred meters away in combat,",
//   [AttackRange.arm_room_field_horizon]: "that you can see at any distance in combat,",
//   [AttackRange.room]: "When you engage an able opponent out of your reach but no farther than a few meters away in ranged combat,",
//   [AttackRange.room_field]: "When you engage an able opponent out of arm's reach, up to a hundred meters away, in ranged combat,",
//   [AttackRange.room_field_horizon]: "When you engage an able opponent out of arm's reach but still visible, however distant, in ranged combat,",
//   [AttackRange.field]: "When you engage an able opponent several to one hundred meters away in ranged combat,",
//   [AttackRange.field_horizon]: "over a hundred meters away in ranged combat,",
//   [AttackRange.horizon]: "at extreme range (over one hundred meters away) in ranged combat,"
// } as const;
export const StabilityConditions: Record<
  string,
  {
    description: string,
    modDef: Record<string, number>;
  }
> = {
  angry: {
    description: "You blame someone or something in your vicinity for whatever happened, and may lash out against them or harbor resentment.",
    modDef: {all: -1}
  },
  sad: {
    description: "You feel sorrow or grief over what happened. You might want to seek solitude or the comfort of a loved one.",
    modDef: {all: -1}
  },
  scared: {
    description: "You feel threatened. You instinctively want to retreat from the situation and seek out a hiding spot.",
    modDef: {all: -1}
  },
  "guilt-ridden": {
    description: "You blame yourself for what transpired, and seek forgiveness from those around you.",
    modDef: {all: -1}
  },
  obsessed: {
    description: "You are paradoxically enthralled by whatever initially caused you stress, now finding it attractive and compelling. You may feel compelled to seek it out or to study it intensely.",
    modDef: {all: -1}
  },
  distracted: {
    description: "You are confused and sidetracked by what threatens you. You cannot stop looking at it, and are inattentive to everything else around you. You take −2 to all rolls in situations where being distracted is an obstacle.",
    modDef: {all: -2}
  },
  haunted: {
    description: "The GM gets 1 Hold they can spend later to haunt you with visions, dreams, or create actual encounters related to whatever caused the trauma.",
    modDef: {all: -1}
  }
};
export const RegExpPatterns = {
  Attributes: [
    ...Object.keys(Attributes.Active),
    ...Object.keys(Attributes.Passive),
    "Attribute"
  ].map((attrStr) => new RegExp(`((?:\\+|\\b)${attrStr.charAt(0).toUpperCase()}${attrStr.slice(1)}\\b)`, "g")),
  BasicPlayerMoves: [
    "\\bAct Under Pressure\\b",
    "\\bAvoid Harm\\b",
    "\\bEndure Injury\\b",
    "\\bEngage in Combat\\b",
    "\\bHelp (Ano|O)ther\\b",
    "\\bHinder (Ano|O)ther\\b",
    "\\bHelp or Hinder (Ano|O)ther\\b",
    "\\bInfluence (Ano|O)ther( PC|NPC)?\\b",
    "\\bInvestigate\\b",
    "\\bKeep It Together\\b",
    "\\bObserve a Situation\\b",
    "\\bRead a Person\\b",
    "\\bSee Through the Illusion\\b"
  ].map((patStr: string | RegExp) => patStr instanceof RegExp
    ? patStr
    : new RegExp(`(${patStr})`, "g")),
  Keywords: [
    /([-+])/g,
    "(\\b|[^ :a-z()]+ )Harm\\b",
    "(\\b|[^ :a-z()]+ )Armor\\b",
    "\\bStability\\b( \\(.?\\d+\\))?",
    "\\bRelation\\b( .?\\d+)?",
    "[^ :a-z()]+ ongoing\\b",
    "\\b(Serious |Critical |\\d+ )?Wounds?\\b",
    "(\\d+\\s+|\\b[Oo]ne\\s+)?\\bExperience"
  ].map((patStr: string | RegExp) => patStr instanceof RegExp
    ? patStr
    : new RegExp(`(${patStr})`, "g")),
  GMText: [
    /\b([Tt]he GM (?:may )?makes? a (?:hard |soft )?Move)\b/g,
    /\b([Tt]he GM takes \d+ Hold)\b/g
  ]
};


const C = {
  SYSTEM_ID: "kult4th",
  SYSTEM_NAME: "Kult: Divinity Lost",
  SYSTEM_FULL_NAME: "Kult: Divinity Lost (4th Edition)",
  TEMPLATE_ROOT: "systems/kult4th/templates",
  Attributes, /* AttributeButtons, */ HarmButtons,
  AttrList: [...Object.keys(Attributes.Passive), ...Object.keys(Attributes.Active)],
  BasicMoves: [
    "Act Under Pressure",
    "Avoid Harm",
    "Endure Injury",
    "Engage in Combat",
    "Help Other",
    "Hinder Other",
    "Influence Other NPC",
    "Influence Other PC",
    "Investigate",
    "Keep It Together",
    "Observe a Situation",
    "Read a Person",
    "See Through the Illusion"
  ],
  Abbreviations: {
    ItemType: {
      [K4ItemType.advantage]: "Av",
      [K4ItemType.disadvantage]: "D",
      [K4ItemType.darksecret]: "DS",
      [K4ItemType.weapon]: "W",
      [K4ItemType.move]: "M",
      [K4ItemType.gear]: "G",
      [K4ItemType.relation]: "R",
      [K4ItemType.gmtracker]: "GM"
    }
  },
  Colors, ColorFilters,
  // Ranges,
  RegExpPatterns,
  imageDefaults: {
    roller: "systems/kult4th/assets/icons/cameron-west.jpg"
  },
  Influences: {
    "Kether": {
      name: "Kether",
      category: K4Influence.archon,
      principle: "Hierarchy",
      img: "systems/kult4th/assets/tarot/major-3-kether.webp",
      keySVG: InfluenceKeys.Kether
    },
    "Chokmah": {
      name: "Chokmah",
      category: K4Influence.archon,
      principle: "Submission",
      img: "systems/kult4th/assets/tarot/major-4-chokmah.webp",
      keySVG: InfluenceKeys.Chokmah
    },
    "Binah": {
      name: "Binah",
      category: K4Influence.archon,
      principle: "Community",
      img: "systems/kult4th/assets/tarot/major-5-binah.webp",
      keySVG: InfluenceKeys.Binah
    },
    "Chesed": {
      name: "Chesed",
      category: K4Influence.archon,
      principle: "Safety",
      img: "systems/kult4th/assets/tarot/major-6-chesed.webp",
      keySVG: InfluenceKeys.Chesed
    },
    "Geburah": {
      name: "Geburah",
      category: K4Influence.archon,
      principle: "Law",
      img: "systems/kult4th/assets/tarot/major-7-geburah.webp",
      keySVG: InfluenceKeys.Geburah
    },
    "Tiphareth": {
      name: "Tiphareth",
      category: K4Influence.archon,
      principle: "Allure",
      img: "systems/kult4th/assets/tarot/major-8-tiphareth.webp",
      keySVG: InfluenceKeys.Tiphareth
    },
    "Netzach": {
      name: "Netzach",
      category: K4Influence.archon,
      principle: "Victory",
      img: "systems/kult4th/assets/tarot/major-9-netzach.webp",
      keySVG: InfluenceKeys.Netzach
    },
    "Hod": {
      name: "Hod",
      category: K4Influence.archon,
      principle: "Honor",
      img: "systems/kult4th/assets/tarot/major-10-hod.webp",
      keySVG: InfluenceKeys.Hod
    },
    "Yesod": {
      name: "Yesod",
      category: K4Influence.archon,
      principle: "Avarice",
      img: "systems/kult4th/assets/tarot/major-11-yesod.webp",
      keySVG: InfluenceKeys.Yesod
    },
    "Malkuth": {
      name: "Malkuth",
      category: K4Influence.archon,
      principle: "Conformity",
      img: "systems/kult4th/assets/tarot/major-12-malkuth.webp",
      keySVG: InfluenceKeys.Malkuth
    },
    "Thaumiel": {
      name: "Thaumiel",
      category: K4Influence.deathAngel,
      principle: "Power",
      img: "systems/kult4th/assets/tarot/major-13-thaumiel.webp",
      keySVG: InfluenceKeys.Thaumiel
    },
    "Chagidiel": {
      name: "Chagidiel",
      category: K4Influence.deathAngel,
      principle: "Abuse",
      img: "systems/kult4th/assets/tarot/major-14-chagidiel.webp",
      keySVG: InfluenceKeys.Chagidiel
    },
    "Sathariel": {
      name: "Sathariel",
      category: K4Influence.deathAngel,
      principle: "Exclusion",
      img: "systems/kult4th/assets/tarot/major-15-sathariel.webp",
      keySVG: InfluenceKeys.Sathariel
    },
    "Gamichicoth": {
      name: "Gamichicoth",
      category: K4Influence.deathAngel,
      principle: "Fear",
      img: "systems/kult4th/assets/tarot/major-16-gamichicoth.webp",
      keySVG: InfluenceKeys.Gamichicoth
    },
    "Golab": {
      name: "Golab",
      category: K4Influence.deathAngel,
      principle: "Torment",
      img: "systems/kult4th/assets/tarot/major-17-golab.webp",
      keySVG: InfluenceKeys.Golab
    },
    "Togarini": {
      name: "Togarini",
      category: K4Influence.deathAngel,
      principle: "Compulsion",
      img: "systems/kult4th/assets/tarot/major-18-togarini.webp",
      keySVG: InfluenceKeys.Togarini
    },
    "Hareb-Serap": {
      name: "Hareb-Serap",
      category: K4Influence.deathAngel,
      principle: "Conflict",
      img: "systems/kult4th/assets/tarot/major-19-hareb-serap.webp",
      keySVG: InfluenceKeys["Hareb-Serap"]
    },
    "Samael": {
      name: "Samael",
      category: K4Influence.deathAngel,
      principle: "Vengeance",
      img: "systems/kult4th/assets/tarot/major-20-samael.webp",
      keySVG: InfluenceKeys.Samael
    },
    "Gamaliel": {
      name: "Gamaliel",
      category: K4Influence.deathAngel,
      principle: "Desire",
      img: "systems/kult4th/assets/tarot/major-21-gamaliel.webp",
      keySVG: InfluenceKeys.Gamaliel
    },
    "Nahemoth": {
      name: "Nahemoth",
      category: K4Influence.deathAngel,
      principle: "Discord",
      img: "systems/kult4th/assets/tarot/major-22-nahemoth.webp",
      keySVG: InfluenceKeys.Nahemoth
    }
  },
  Themes: {
    [K4ItemType.advantage]: "k4-theme-bgold",
    [K4ItemType.disadvantage]: "k4-theme-red",
    [K4ItemType.darksecret]: "k4-theme-dark",
    [K4ItemType.relation]: "k4-theme-blue",
    [K4ItemType.weapon]: "k4-theme-red",
    [K4ItemType.gear]: "k4-theme-white",
    [K4ItemType.move]: "k4-theme-gold",
    [K4ItemType.gmtracker]: "k4-theme-black",
    edge: "k4-theme-blue"
  }
};

export default C;
