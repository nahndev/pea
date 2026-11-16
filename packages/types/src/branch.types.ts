export interface Branch {
  id: string;
  name: string;
  slug: string;
}

export interface BranchSummary extends Branch {
  analysisCount: number;
  latestAnalysisAt: string | null;
}
