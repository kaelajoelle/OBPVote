export const story = {
  startPromptId: "poll-1-opening-location",
  prompts: [
    {
      id: "poll-1-opening-location",
      pollNumber: "1",
      operatorLabel: "Opening location",
      title: "Where will tonight’s adventure begin?",
      question: "Choose the company’s first path.",
      options: [
        { id: "enchantress", label: "Glade of Paranor — the Enchantress", nextPromptId: "poll-2-song", scriptColor: "BLOSSOM", stageColor: "#d989a6", stageDirection: "Follow the Glade of Paranor branch" },
        { id: "hag", label: "Flamespun Ruins — the Hag", nextPromptId: "poll-2-song", scriptColor: "DARK GREEN", stageColor: "#1f5a42", stageDirection: "Follow the Flamespun Ruins branch" }
      ]
    },
    {
      id: "poll-2-song",
      pollNumber: "2",
      operatorLabel: "Anaax or Kytius song",
      title: "Who should sing the next song?",
      question: "Choose the company’s storyteller.",
      options: [
        { id: "armour-class", label: "“Armour Class” — Anaax", nextPromptId: "poll-3-initiative", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Continue with “Armour Class” — Anaax" },
        { id: "hero-of-the-realm", label: "“Hero of the Realm” — Kytius", nextPromptId: "poll-3-initiative", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Continue with “Hero of the Realm” — Kytius" }
      ]
    },
    {
      id: "poll-3-initiative",
      pollNumber: "3",
      operatorLabel: "Kytius’s initiative",
      title: "What traits do we admire in our heroes?",
      question: "How should Karsis respond to Kytius?",
      options: [
        { id: "initiative", label: "Reward his initiative", nextPromptId: "poll-4-coin-purse", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Continue with the Initiative branch" },
        { id: "lesson", label: "Teach him a lesson", nextPromptId: "poll-4-coin-purse", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Continue with the Teach Him a Lesson branch" }
      ]
    },
    {
      id: "poll-4-coin-purse",
      pollNumber: "4",
      operatorLabel: "Khulgar’s coin purse",
      title: "An orc reaches for a battle horn.",
      question: "What should Khulgar do?",
      options: [
        { id: "coin-purse", label: "Pick up the coin purse", nextPromptId: "poll-4-5-vial", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Khulgar picks up the coin purse" },
        { id: "run-to-camp", label: "Run back to camp", nextPromptId: "poll-4-5-vial", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Khulgar runs back to camp" }
      ]
    },
    {
      id: "poll-4-5-vial",
      pollNumber: "4.5",
      operatorLabel: "Rhoswen’s vial (conditional)",
      special: true,
      title: "Rhoswen has found a mysterious vial.",
      question: "What should she do with it?",
      options: [
        { id: "keep-vial", label: "Rhoswen keeps the vial", nextPromptId: "poll-5-captive", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Rhoswen keeps the vial" },
        { id: "leave-vial", label: "Rhoswen leaves the vial", nextPromptId: "poll-5-captive", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Rhoswen leaves the vial" }
      ]
    },
    {
      id: "poll-5-captive",
      pollNumber: "5",
      operatorLabel: "The captive’s fate",
      title: "The captive’s fate is in your hands.",
      question: "What should happen to him?",
      options: [
        { id: "lives", label: "Aye — he lives", nextPromptId: "poll-6-caravan", scriptColor: "PURPLE", stageColor: "#704b91", stageDirection: "Follow the He Lives branch" },
        { id: "dies", label: "Nay — he dies", nextPromptId: "poll-6-caravan", scriptColor: "GREEN", stageColor: "#3b7a57", stageDirection: "Follow the He Dies branch" }
      ]
    },
    {
      id: "poll-6-caravan",
      pollNumber: "6",
      operatorLabel: "Travel or caravan",
      title: "A caravan lies ahead.",
      question: "How should the Companions travel?",
      options: [
        { id: "own-pace", label: "Travel at their own pace", nextPromptId: "poll-7-stories", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Follow the Travel at Their Own Pace direction" },
        { id: "join-caravan", label: "Join the caravan", nextPromptId: "poll-7-stories", scriptColor: null, stageColor: "#d5aa58", stageDirection: "Follow the Join the Caravan direction" }
      ]
    },
    {
      id: "poll-7-stories",
      pollNumber: "7",
      operatorLabel: "Companion story",
      title: "One Companion will tell their story.",
      question: "Whose story should the company hear?",
      options: [
        { id: "eris", label: "Eris", nextPromptId: "poll-8-song", scriptColor: "BRIGHT GREEN", stageColor: "#73b35a", stageDirection: "Continue with Eris’s story" },
        { id: "khulgar", label: "Khulgar", nextPromptId: "poll-8-song", scriptColor: "NAVY", stageColor: "#243a69", stageDirection: "Continue with Khulgar’s story" },
        { id: "kytius", label: "Kytius", nextPromptId: "poll-8-song", scriptColor: "DEEP PURPLE", stageColor: "#4c2d73", stageDirection: "Continue with Kytius’s story" },
        { id: "rhoswen", label: "Rhoswen", nextPromptId: "poll-8-song", scriptColor: "TEAL", stageColor: "#247b7b", stageDirection: "Continue with Rhoswen’s story" }
      ]
    },
    {
      id: "poll-8-song",
      pollNumber: "8",
      operatorLabel: "Final song choice",
      title: "Choose the tale that becomes a song.",
      question: "Which song should Anaax sing?",
      options: [
        { id: "loss-and-love", label: "“Loss and Love”", nextPromptId: null, scriptColor: null, stageColor: "#d5aa58", stageDirection: "Continue with “Loss and Love”" },
        { id: "love-and-loss", label: "“Love and Loss”", nextPromptId: null, scriptColor: null, stageColor: "#d5aa58", stageDirection: "Continue with “Love and Loss”" }
      ]
    }
  ]
};
