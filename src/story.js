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
        { id: "enchantress", label: "Glade of Paranor — the Enchantress", nextPromptId: "poll-2-song" },
        { id: "hag", label: "Flamespun Ruins — the Hag", nextPromptId: "poll-2-song" }
      ]
    },
    {
      id: "poll-2-song",
      pollNumber: "2",
      operatorLabel: "Anaax or Kytius song",
      title: "Who should sing the next song?",
      question: "Choose the company’s storyteller.",
      options: [
        { id: "armour-class", label: "“Armour Class” — Anaax", nextPromptId: "poll-3-initiative" },
        { id: "hero-of-the-realm", label: "“Hero of the Realm” — Kytius", nextPromptId: "poll-3-initiative" }
      ]
    },
    {
      id: "poll-3-initiative",
      pollNumber: "3",
      operatorLabel: "Kytius’s initiative",
      title: "What traits do we admire in our heroes?",
      question: "How should Karsis respond to Kytius?",
      options: [
        { id: "initiative", label: "Reward his initiative", nextPromptId: "poll-4-coin-purse" },
        { id: "lesson", label: "Teach him a lesson", nextPromptId: "poll-4-coin-purse" }
      ]
    },
    {
      id: "poll-4-coin-purse",
      pollNumber: "4",
      operatorLabel: "Khulgar’s coin purse",
      title: "An orc reaches for a battle horn.",
      question: "What should Khulgar do?",
      options: [
        { id: "coin-purse", label: "Pick up the coin purse", nextPromptId: "poll-4-5-vial" },
        { id: "run-to-camp", label: "Run back to camp", nextPromptId: "poll-4-5-vial" }
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
        { id: "keep-vial", label: "Rhoswen keeps the vial", nextPromptId: "poll-5-captive" },
        { id: "leave-vial", label: "Rhoswen leaves the vial", nextPromptId: "poll-5-captive" }
      ]
    },
    {
      id: "poll-5-captive",
      pollNumber: "5",
      operatorLabel: "The captive’s fate",
      title: "The captive’s fate is in your hands.",
      question: "What should happen to him?",
      options: [
        { id: "lives", label: "Aye — he lives", nextPromptId: "poll-6-caravan" },
        { id: "dies", label: "Nay — he dies", nextPromptId: "poll-6-caravan" }
      ]
    },
    {
      id: "poll-6-caravan",
      pollNumber: "6",
      operatorLabel: "Travel or caravan",
      title: "A caravan lies ahead.",
      question: "How should the Companions travel?",
      options: [
        { id: "own-pace", label: "Travel at their own pace", nextPromptId: "poll-7-stories" },
        { id: "join-caravan", label: "Join the caravan", nextPromptId: "poll-7-stories" }
      ]
    },
    {
      id: "poll-7-stories",
      pollNumber: "7",
      operatorLabel: "Companion story",
      title: "One Companion will tell their story.",
      question: "Whose story should the company hear?",
      options: [
        { id: "eris", label: "Eris", nextPromptId: "poll-8-song" },
        { id: "khulgar", label: "Khulgar", nextPromptId: "poll-8-song" },
        { id: "kytius", label: "Kytius", nextPromptId: "poll-8-song" },
        { id: "rhoswen", label: "Rhoswen", nextPromptId: "poll-8-song" }
      ]
    },
    {
      id: "poll-8-song",
      pollNumber: "8",
      operatorLabel: "Final song choice",
      title: "Choose the tale that becomes a song.",
      question: "Which song should Anaax sing?",
      options: [
        { id: "loss-and-love", label: "“Loss and Love”", nextPromptId: null },
        { id: "love-and-loss", label: "“Love and Loss”", nextPromptId: null }
      ]
    }
  ]
};
