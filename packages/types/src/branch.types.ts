export interface Branch {
  id: string;
  name: string;
}

export interface BranchSummary extends Branch {
  analysisCount: number;
  latestAnalysisAt: string;
}
