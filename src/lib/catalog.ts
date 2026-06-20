export type Topic = {
  id: string;
  label: string;
  description: string;
  emoji: string;
};

export const TOPICS: Topic[] = [
  {
    id: "manual",
    label: "Manual Testing",
    description: "Test case design, kiểm thử thủ công, bug reporting",
    emoji: "📝",
  },
  {
    id: "automation",
    label: "Test Automation",
    description: "Selenium, Playwright, Cypress, framework automation",
    emoji: "🤖",
  },
  {
    id: "api",
    label: "API Testing",
    description: "REST, Postman, kiểm thử API, status code, contract testing",
    emoji: "🔌",
  },
  {
    id: "performance",
    label: "Performance Testing",
    description: "JMeter, k6, load/stress testing, đo hiệu năng",
    emoji: "⚡",
  },
  {
    id: "fundamentals",
    label: "QA Fundamentals",
    description: "STLC, SDLC, test levels, test types, quy trình QA",
    emoji: "📚",
  },
  {
    id: "mobile",
    label: "Mobile Testing",
    description: "Kiểm thử ứng dụng iOS/Android, Appium, real device",
    emoji: "📱",
  },
];

export const LEVELS = [
  { id: "junior", label: "Junior (Fresher / < 2 năm)" },
  { id: "middle", label: "Middle (2-4 năm)" },
  { id: "senior", label: "Senior (> 4 năm)" },
] as const;

export const LANGUAGES = [
  { id: "vi", label: "Tiếng Việt" },
  { id: "en", label: "English" },
] as const;

export const MAX_QUESTIONS = 6;

export function topicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

export function levelLabel(id: string): string {
  return LEVELS.find((l) => l.id === id)?.label ?? id;
}
