export const story = {
  startPromptId: "forest-path",
  prompts: [
    {
      id: "forest-path",
      title: "The road divides beneath the ancient trees.",
      question: "Which path should the company take?",
      options: [
        { id: "lanterns", label: "Follow the lanterns", nextPromptId: "gate-choice" },
        { id: "river", label: "Follow the river", nextPromptId: "bridge-choice" }
      ]
    },
    {
      id: "gate-choice",
      title: "A silver gate bars the lantern road.",
      question: "How should the company answer its guardian?",
      options: [
        { id: "truth", label: "Tell the truth", nextPromptId: null },
        { id: "riddle", label: "Offer a riddle", nextPromptId: null }
      ]
    },
    {
      id: "bridge-choice",
      title: "The river bridge begins to vanish.",
      question: "What will the company sacrifice to cross?",
      options: [
        { id: "time", label: "Precious time", nextPromptId: null },
        { id: "secret", label: "A guarded secret", nextPromptId: null }
      ]
    }
  ]
};
