import { DuckDBInstance } from "@duckdb/node-api";
import { Injectable } from "@nestjs/common";
import { AnalysisContextType } from "@tomato/constants";
import type { AnalysisContext, Rule } from "../../../generated/client";
import { StorageService } from "../../files/storage.service";
import { API_METRIC_DURATION_COLUMN } from "../rules.constants";
import type { RuleHandler, RuleIssue } from "./rule-handler.types";

const PERCENTILE = 0.9;

@Injectable()
export class P90Handler implements RuleHandler {
  constructor(private readonly storageService: StorageService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    if (context.type !== AnalysisContextType.API_METRIC) return [];

    const { thresholdMs } = rule.config as { thresholdMs?: number };
    if (typeof thresholdMs !== "number") return [];

    const p90 = await this.percentile(
      this.storageService.resolve(context.path),
    );
    if (p90 === null || p90 <= thresholdMs) return [];

    return [
      {
        ruleId: rule.id,
        analysisContextId: context.id,
        description: `P90 ${p90.toFixed(1)}ms exceeds threshold ${thresholdMs}ms`,
      },
    ];
  }

  private async percentile(path: string): Promise<number | null> {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();
    try {
      const source = `read_json('${path.replaceAll("'", "''")}', format = 'newline_delimited', columns = {${API_METRIC_DURATION_COLUMN}: 'DOUBLE'})`;
      const reader = await connection.runAndReadAll(
        `SELECT quantile_cont(${API_METRIC_DURATION_COLUMN}, ${PERCENTILE}) AS value FROM ${source}`,
      );
      const [row] = reader.getRowObjects();
      return row?.value === null || row?.value === undefined
        ? null
        : Number(row.value);
    } finally {
      connection.closeSync();
      instance.closeSync();
    }
  }
}
