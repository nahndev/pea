import { AnalysisContext } from '../../analysis-contexts/entities/analysis-context.entity';

export class Analysis {
  id: string;
  mergeRequestId: string;
  commitSha: string;
  createdAt: Date;
}

export class AnalysisWithContexts extends Analysis {
  contexts: AnalysisContext[];
}
