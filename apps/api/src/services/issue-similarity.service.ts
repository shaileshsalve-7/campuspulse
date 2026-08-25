import { Issue } from '../models/issue.model.js';

function terms(value: string): Set<string> {
  return new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
}

function overlap(first: Set<string>, second: Set<string>): number {
  const union = new Set([...first, ...second]);
  if (!union.size) return 0;
  let shared = 0;
  first.forEach((term) => { if (second.has(term)) shared += 1; });
  return shared / union.size;
}

export interface SimilarIssue { id: string; title: string; category: string; status: string; upvoteCount: number; similarity: number; }

/** Deterministic baseline. Replace this boundary with embeddings without changing issue routes. */
export async function findSimilarIssues(input: { title: string; description: string; category?: string }): Promise<SimilarIssue[]> {
  const source = terms(`${input.title} ${input.description}`);
  const candidates = await Issue.find({ ...(input.category ? { category: input.category } : {}), status: { $ne: 'REJECTED' } }).sort({ upvoteCount: -1, createdAt: -1 }).limit(80).select('title description category status upvoteCount').lean();
  return candidates.map((candidate) => ({ id: candidate._id.toString(), title: candidate.title, category: candidate.category, status: candidate.status, upvoteCount: candidate.upvoteCount, similarity: overlap(source, terms(`${candidate.title} ${candidate.description}`)) })).filter((candidate) => candidate.similarity >= 0.22).sort((left, right) => right.similarity - left.similarity).slice(0, 5);
}
