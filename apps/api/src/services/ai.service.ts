import type { IssueCategory, IssuePriority } from '../models/issue.model.js';

export interface AIService {
  categorizeIssue(input: { title: string; description: string }): Promise<IssueCategory | undefined>;
  recommendPriority(input: { title: string; description: string }): Promise<IssuePriority | undefined>;
  summarizeIssue(input: { title: string; description: string }): Promise<string | undefined>;
  deriveAnalyticsInsights(input: { metrics: Record<string, number> }): Promise<string[]>;
}

/** A safe no-op default. Providers and keys belong only in API-side adapters. */
export const noOpAIService: AIService = {
  async categorizeIssue() { return undefined; },
  async recommendPriority() { return undefined; },
  async summarizeIssue() { return undefined; },
  async deriveAnalyticsInsights() { return []; },
};

export const aiService: AIService = noOpAIService;
