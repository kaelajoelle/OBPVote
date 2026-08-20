export const story = {
  startPromptId: "poll-1-opening-location",
  prompts: [
    {
      id: "poll-1-opening-location",
      pollNumber: "1",
      operatorLabel: "Opening location",
      title: "Where should we begin?",
      question: "Choose the Companions’ first path.",
      options: [
        { id: "enchantress", label: "Glade of Paranor — the Enchantress", nextPromptId: "poll-2-song", scriptColor: "BLOSSOM", stageColor: "#d989a6", stageLabel: "ENCHANTRESS", pageNumber: 10, stageDirection: "Follow the Glade of Paranor branch" },
        { id: "hag", label: "Flamespun Ruins — the Hag", nextPromptId: "poll-2-song", scriptColor: "OLIVE", stageColor: "#1f5a42", stageLabel: "HAG", pageNumber: 7, stageDirection: "Follow the Flamespun Ruins branch" }
      ]
    },
    {
      id: "poll-2-song",
      pollNumber: "2",
      operatorLabel: "Anaax or Kytius song",
      title: "Who should sing the next song?",
      question: "Choose the Companions’ storyteller.",
      options: [
        { id: "armour-class", label: "Anaax — a bard of great renown", nextPromptId: "poll-3-initiative", scriptColor: "TANGERINE", stageColor: "#ff9900", stageLabel: "ANAAX", pageNumber: 23, stageDirection: "Continue with “Armour Class” — Anaax" },
        { id: "hero-of-the-realm", label: "Kytius — just Kytius", nextPromptId: "poll-3-initiative", scriptColor: "CORAL", stageColor: "#e06666", stageLabel: "KYTIUS", pageNumber: 25, stageDirection: "Continue with “Hero of the Realm” — Kytius" }
      ]
    },
    {
      id: "poll-3-initiative",
      pollNumber: "3",
      operatorLabel: "Kytius’s initiative",
      title: "What traits do we admire in our heroes?",
      question: "",
      options: [
        { id: "initiative", label: "Reward his initiative", nextPromptId: "poll-4-coin-purse", scriptColor: "RED", stageColor: "#cc0000", stageLabel: "INITIATIVE", pageNumber: 43, stageDirection: "Continue with the Initiative branch" },
        { id: "lesson", label: "Teach him a lesson", nextPromptId: "poll-4-coin-purse", scriptColor: "BLUE", stageColor: "#1155cc", stageLabel: "TEACH HIM A LESSON", pageNumber: 45, stageDirection: "Continue with the Teach Him a Lesson branch" }
      ]
    },
    {
      id: "poll-4-coin-purse",
      pollNumber: "4",
      operatorLabel: "Khulgar’s coin purse",
      title: "An orc reaches for a battle horn.",
      question: "What should Khulgar do?",
      options: [
        { id: "coin-purse", label: "Pick up the coin purse", nextPromptId: "poll-4-5-vial", scriptColor: "BLACK", stageColor: "#000000", stageLabel: "RING", pageNumber: 55, stageDirection: "Khulgar has the ring" },
        { id: "run-to-camp", label: "Don’t chance it", nextPromptId: "poll-4-5-vial", scriptColor: "BLACK", stageColor: "#000000", stageLabel: "NO RING", pageNumber: 55, stageDirection: "Khulgar does not have the ring" }
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
        { id: "keep-vial", label: "Rhoswen keeps the vial", nextPromptId: "poll-5-captive", scriptColor: null, stageColor: "#d5aa58", stageLabel: "KEEP THE VIAL", pageNumber: 58, stageDirection: "Rhoswen keeps the vial" },
        { id: "leave-vial", label: "Rhoswen leaves the vial", nextPromptId: "poll-5-captive", scriptColor: null, stageColor: "#d5aa58", stageLabel: "LEAVE THE VIAL", pageNumber: 58, stageDirection: "Rhoswen leaves the vial" }
      ]
    },
    {
      id: "poll-5-captive",
      pollNumber: "5",
      operatorLabel: "The captive’s fate",
      title: "The captive’s fate is in your hands.",
      question: "What should happen to him?",
      options: [
        { id: "lives", label: "He Lives", nextPromptId: "poll-6-caravan", scriptColor: "PURPLE", stageColor: "#704b91", stageLabel: "HE LIVES", pageNumber: 62, stageDirection: "Follow the He Lives branch" },
        { id: "dies", label: "He Dies", nextPromptId: "poll-6-caravan", scriptColor: "GREEN", stageColor: "#3b7a57", stageLabel: "HE DIES", pageNumber: 62, stageDirection: "Follow the He Dies branch" }
      ]
    },
    {
      id: "poll-6-caravan",
      pollNumber: "6",
      operatorLabel: "Travel or caravan",
      title: "A caravan lies ahead.",
      question: "How should the Companions travel?",
      options: [
        { id: "own-pace", label: "Travel at their own pace", nextPromptId: "poll-7-stories", scriptColor: "LILAC", stageColor: "#9666d5", stageLabel: "OWN PACE", pageNumber: 90, stageDirection: "Follow the Travel at Their Own Pace direction" },
        { id: "join-caravan", label: "Join the caravan", nextPromptId: "poll-7-stories", scriptColor: "DUCK EGG", stageColor: "#5d8aa8", stageLabel: "JOIN THE CARAVAN", pageNumber: 90, stageDirection: "Follow the Join the Caravan direction" }
      ]
    },
    {
      id: "poll-7-stories",
      pollNumber: "7",
      operatorLabel: "Companion story",
      title: "One Companion will tell their story.",
      question: "Whose story should the Caravan hear?",
      options: [
        { id: "eris", label: "Eris", nextPromptId: "poll-8-song", scriptColor: "BRIGHT GREEN", stageColor: "#73b35a", stageLabel: "ERIS", pageNumber: 93, stageDirection: "Continue with Eris’s story" },
        { id: "khulgar", label: "Khulgar", nextPromptId: "poll-8-song", scriptColor: "NAVY", stageColor: "#243a69", stageLabel: "KHULGAR", pageNumber: 94, stageDirection: "Continue with Khulgar’s story" },
        { id: "kytius", label: "Kytius", nextPromptId: "poll-8-song", scriptColor: "DEEP PURPLE", stageColor: "#4c2d73", stageLabel: "KYTIUS", pageNumber: 95, stageDirection: "Continue with Kytius’s story" },
        { id: "rhoswen", label: "Rhoswen", nextPromptId: "poll-8-song", scriptColor: "TEAL", stageColor: "#247b7b", stageLabel: "RHOSWEN", pageNumber: 96, stageDirection: "Continue with Rhoswen’s story" }
      ]
    },
    {
      id: "poll-8-song",
      pollNumber: "8",
      operatorLabel: "Final song choice",
      title: "Choose the tale that becomes a song.",
      question: "Which song should Anaax sing?",
      options: [
        { id: "loss-and-love", label: "“Loss and Love”", nextPromptId: null, scriptColor: "GREY", stageColor: "#bebfc5", stageLabel: "HOW DO YOU WANT TO DO THIS", pageNumber: 107, stageDirection: "Continue with “How Do You Want To Do This?”" },
        { id: "love-and-loss", label: "“Love and Loss”", nextPromptId: null, scriptColor: "BURGUNDY", stageColor: "#660000", stageLabel: "LA DITTY HEY", pageNumber: 109, stageDirection: "Continue with “La Ditty Hey”" }
      ]
    }
  ]
};
