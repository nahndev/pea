import { Injectable } from '@nestjs/common';
import type { SubjectView } from '@tomato/types';
import { type SubjectSource, toSubjectView } from './subject';
import { SubjectsRepository } from './subjects.repository';

@Injectable()
export class SubjectsService {
  constructor(private readonly subjectsRepository: SubjectsRepository) {}

  async createMany(subjects: SubjectSource[]): Promise<number> {
    const unique = [...new Map(subjects.map((subject) => [subject.uuid, subject])).values()];
    if (!unique.length) return 0;
    return this.subjectsRepository.createMany(unique);
  }

  async findByMetric(metricId: string): Promise<SubjectView[]> {
    const subjects = await this.subjectsRepository.findByMetric(metricId);
    return subjects.map(toSubjectView);
  }

  async findByAnalysisResult(analysisResultId: string): Promise<SubjectView[]> {
    const subjects = await this.subjectsRepository.findByAnalysisResult(analysisResultId);
    return subjects.map(toSubjectView);
  }
}
