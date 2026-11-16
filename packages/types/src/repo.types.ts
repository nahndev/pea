export interface Repo {
  id: string;
  name: string;
  slug: string;
}

export interface RepoSummary extends Repo {
  analysisCount: number;
  latestAnalysisAt: string | null;
}
