import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { EventEmitter2 } from "@nestjs/event-emitter";
import { AnalysisEvent, AnalysisSchema, ErrorCode } from "@tomato/constants";
import { AddOnsService } from "../add-ons/add-ons.service";
import { ReposService } from "../repos/repos.service";
import { DatabasesService } from "../databases/databases.service";
import type { StoredFile } from "../files/storage.service";
import { StorageService } from "../files/storage.service";
import { AnalysesRepository } from "./analyses.repository";
import { AnalysesService } from "./analyses.service";

const UPLOAD = {
  fieldname: "api_metric",
  originalname: "a.jsonl",
} as Express.Multer.File;
const STORED_FILE: StoredFile = { file: "a.jsonl", path: "p-1" };

describe("AnalysesService", () => {
  let analysesRepository: jest.Mocked<
    Pick<AnalysesRepository, "create" | "createMany" | "findById">
  >;
  let reposService: jest.Mocked<Pick<ReposService, "findOrCreateByName">>;
  let storageService: jest.Mocked<Pick<StorageService, "save" | "remove">>;
  let databasesService: jest.Mocked<Pick<DatabasesService, "verify">>;
  let addOnsService: jest.Mocked<Pick<AddOnsService, "convert" | "verify">>;
  let eventEmitter2: jest.Mocked<Pick<EventEmitter2, "emit">>;
  let analysesService: AnalysesService;

  beforeEach(() => {
    analysesRepository = { create: jest.fn(), createMany: jest.fn(), findById: jest.fn() };
    reposService = {
      findOrCreateByName: jest
        .fn()
        .mockResolvedValue({ id: "br-1", name: "feat/x" }),
    };
    storageService = {
      save: jest.fn().mockResolvedValue(STORED_FILE),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    databasesService = { verify: jest.fn().mockResolvedValue(undefined) };
    addOnsService = { convert: jest.fn(), verify: jest.fn() };
    eventEmitter2 = { emit: jest.fn() };
    analysesService = new AnalysesService(
      analysesRepository as unknown as AnalysesRepository,
      reposService as unknown as ReposService,
      storageService as unknown as StorageService,
      databasesService as unknown as DatabasesService,
      addOnsService as unknown as AddOnsService,
    );
    Object.assign(analysesService, { eventEmitter2 });
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: BadRequestException) => e);
    return (error as BadRequestException).getResponse();
  };

  it("creates the repo and the analysis from the uploaded files", async () => {
    const analysis = { id: "an-1", repoId: "br-1", ...STORED_FILE };
    analysesRepository.create.mockResolvedValue(analysis as never);

    const result = await analysesService.create(
      { repo: "feat/x", schema: AnalysisSchema.API, title: "Release 1" },
      { api_metric: [UPLOAD] },
    );

    expect(storageService.save).toHaveBeenCalledWith(UPLOAD);
    expect(reposService.findOrCreateByName).toHaveBeenCalledWith("feat/x");
    expect(analysesRepository.create).toHaveBeenCalledWith({
      repoId: "br-1",
      schema: AnalysisSchema.API,
      title: "Release 1",
      file: STORED_FILE,
    });
    expect(storageService.remove).not.toHaveBeenCalled();
    expect(eventEmitter2.emit).toHaveBeenCalledWith(
      AnalysisEvent.CREATED,
      analysis,
    );
    expect(result).toBe(analysis);
  });

  it("stores the upload converted by the add-on instead of the raw file", async () => {
    const converted: StoredFile = { file: "a.jsonl", path: "converted" };
    addOnsService.convert.mockResolvedValue(converted);
    analysesRepository.create.mockResolvedValue({ id: "an-1" } as never);

    await analysesService.create(
      { repo: "feat/x", schema: AnalysisSchema.BUG, title: "Release 1", addOn: "leaneo" },
      { bug_log: [UPLOAD] },
    );

    expect(addOnsService.convert).toHaveBeenCalledWith("leaneo", AnalysisSchema.BUG, UPLOAD);
    expect(storageService.save).not.toHaveBeenCalled();
    expect(analysesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ file: converted }));
  });

  it("saves the upload as is without an add-on", async () => {
    analysesRepository.create.mockResolvedValue({ id: "an-1" } as never);

    await analysesService.create({ repo: "feat/x", schema: AnalysisSchema.API, title: "Release 1" }, { api_metric: [UPLOAD] });

    expect(addOnsService.convert).not.toHaveBeenCalled();
  });

  it("rejects a missing file before touching the database or the disk", async () => {
    await expect(
      codeOf(
        analysesService.create({
          repo: "feat/x",
          schema: AnalysisSchema.API,
          title: "Release 1",
        }),
      ),
    ).resolves.toEqual({
      code: ErrorCode.LOG_FILE_REQUIRED,
    });
    expect(reposService.findOrCreateByName).not.toHaveBeenCalled();
    expect(storageService.save).not.toHaveBeenCalled();
    expect(eventEmitter2.emit).not.toHaveBeenCalled();
  });

  it("reads the bug log of a BUG analysis", async () => {
    const bugLog = { fieldname: "bug_log", originalname: "bug_log.log" } as Express.Multer.File;
    analysesRepository.create.mockResolvedValue({ id: "an-1" } as never);

    await analysesService.create(
      { repo: "feat/x", schema: AnalysisSchema.BUG, title: "Nightly" },
      { api_metric: [UPLOAD], bug_log: [bugLog] },
    );

    expect(storageService.save).toHaveBeenCalledWith(bugLog);
  });

  it("reads the frontend metric log of a FRONTEND analysis", async () => {
    const frontendMetric = { fieldname: "frontend_metric", originalname: "frontend_metric.log" } as Express.Multer.File;
    analysesRepository.create.mockResolvedValue({ id: "an-1" } as never);

    await analysesService.create(
      { repo: "feat/x", schema: AnalysisSchema.FRONTEND, title: "Nightly" },
      { api_metric: [UPLOAD], frontend_metric: [frontendMetric] },
    );

    expect(storageService.save).toHaveBeenCalledWith(frontendMetric);
  });

  it("rejects a BUG analysis sent with an API metric log only", async () => {
    await expect(
      codeOf(
        analysesService.create(
          { repo: "feat/x", schema: AnalysisSchema.BUG, title: "Nightly" },
          { api_metric: [UPLOAD] },
        ),
      ),
    ).resolves.toEqual({ code: ErrorCode.LOG_FILE_REQUIRED });
    expect(storageService.save).not.toHaveBeenCalled();
  });

  it("removes the stored files when creating the analysis fails", async () => {
    analysesRepository.create.mockRejectedValue(new Error("db down"));

    await expect(
      analysesService.create(
        { repo: "feat/x", schema: AnalysisSchema.API, title: "Release 1" },
        { api_metric: [UPLOAD] },
      ),
    ).rejects.toThrow("db down");
    expect(storageService.remove).toHaveBeenCalledWith([STORED_FILE]);
    expect(eventEmitter2.emit).not.toHaveBeenCalled();
  });

  describe("database analysis", () => {
    const dto = {
      repo: "feat/x",
      schema: AnalysisSchema.DATABASE,
      title: "Nightly",
      databaseId: "db-1",
    };

    it("verifies the database and links it without a file", async () => {
      const analysis = { id: "an-1", repoId: "br-1" };
      analysesRepository.create.mockResolvedValue(analysis as never);

      await expect(analysesService.create(dto)).resolves.toBe(analysis);

      expect(databasesService.verify).toHaveBeenCalledWith("db-1");
      expect(analysesRepository.create).toHaveBeenCalledWith({
        repoId: "br-1",
        schema: AnalysisSchema.DATABASE,
        title: "Nightly",
        databaseId: "db-1",
      });
      expect(storageService.save).not.toHaveBeenCalled();
      expect(eventEmitter2.emit).toHaveBeenCalledWith(
        AnalysisEvent.CREATED,
        analysis,
      );
    });

    it("creates nothing when the database is unreachable", async () => {
      databasesService.verify.mockRejectedValue(new Error("unreachable"));

      await expect(analysesService.create(dto)).rejects.toThrow("unreachable");
      expect(reposService.findOrCreateByName).not.toHaveBeenCalled();
      expect(analysesRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("createMany", () => {
    const upload = (fieldname: string) => ({ fieldname, originalname: "a.log" }) as Express.Multer.File;
    const api = { repo: "feat/x", schema: AnalysisSchema.API, title: "Release 1" };
    const bug = { repo: "feat/x", schema: AnalysisSchema.BUG, title: "Release 1" };
    const database = { repo: "main", schema: AnalysisSchema.DATABASE, title: "Nightly", databaseId: "db-1" };

    beforeEach(() => {
      analysesRepository.createMany.mockImplementation(async (items) => items.map((item, index) => ({ id: `an-${index}`, ...item }) as never));
    });

    it("creates every analysis in one call and emits CREATED for each", async () => {
      const apiLog = upload("analyses[0][api_metric]");
      const bugLog = upload("analyses[1][bug_log]");
      const bugStored: StoredFile = { file: "b.log", path: "p-2" };
      storageService.save.mockResolvedValueOnce(STORED_FILE).mockResolvedValueOnce(bugStored);
      reposService.findOrCreateByName.mockImplementation(async (name) => ({ id: `br-${name}`, name, slug: name }));

      const result = await analysesService.createMany({ analyses: [api, bug, database] }, [bugLog, apiLog]);

      expect(reposService.findOrCreateByName.mock.calls).toEqual([["feat/x"], ["main"]]);
      expect(analysesRepository.createMany).toHaveBeenCalledWith([
        { repoId: "br-feat/x", schema: AnalysisSchema.API, title: "Release 1", file: STORED_FILE },
        { repoId: "br-feat/x", schema: AnalysisSchema.BUG, title: "Release 1", file: bugStored },
        { repoId: "br-main", schema: AnalysisSchema.DATABASE, title: "Nightly", databaseId: "db-1" },
      ]);
      expect(storageService.save.mock.calls).toEqual([[apiLog], [bugLog]]);
      expect(eventEmitter2.emit.mock.calls).toEqual(result.map((analysis) => [AnalysisEvent.CREATED, analysis]));
    });

    it("rejects every item when one misses its file, before writing anything", async () => {
      const error = await codeOf(analysesService.createMany({ analyses: [api, bug] }, [upload("analyses[0][api_metric]")]));

      expect(error).toEqual({ code: ErrorCode.LOG_FILE_REQUIRED, details: { "analyses.1": [ErrorCode.LOG_FILE_REQUIRED] } });
      expect(storageService.save).not.toHaveBeenCalled();
      expect(reposService.findOrCreateByName).not.toHaveBeenCalled();
      expect(eventEmitter2.emit).not.toHaveBeenCalled();
    });

    it("rejects an unknown add-on before storing any file", async () => {
      addOnsService.verify.mockImplementation(() => {
        throw new BadRequestException({ code: ErrorCode.ADD_ON_NOT_FOUND });
      });

      const error = await codeOf(
        analysesService.createMany({ analyses: [{ ...api, addOn: "nope" }] }, [upload("analyses[0][api_metric]")]),
      );

      expect(error).toEqual({ code: ErrorCode.ADD_ON_NOT_FOUND, details: { "analyses.0": [ErrorCode.ADD_ON_NOT_FOUND] } });
      expect(storageService.save).not.toHaveBeenCalled();
    });

    it("removes the files already stored when another one fails to convert", async () => {
      addOnsService.convert.mockRejectedValue(new BadRequestException({ code: ErrorCode.LOG_FILE_INVALID }));

      const error = await codeOf(
        analysesService.createMany({ analyses: [api, { ...bug, addOn: "leaneo" }] }, [
          upload("analyses[0][api_metric]"),
          upload("analyses[1][bug_log]"),
        ]),
      );

      expect(error).toEqual({ code: ErrorCode.LOG_FILE_INVALID, details: { "analyses.1": [ErrorCode.LOG_FILE_INVALID] } });
      expect(storageService.remove).toHaveBeenCalledWith([STORED_FILE]);
      expect(analysesRepository.createMany).not.toHaveBeenCalled();
    });

    it("removes the stored files when inserting the analyses fails", async () => {
      analysesRepository.createMany.mockRejectedValue(new Error("db down"));

      await expect(analysesService.createMany({ analyses: [api] }, [upload("analyses[0][api_metric]")])).rejects.toThrow("db down");

      expect(storageService.remove).toHaveBeenCalledWith([STORED_FILE]);
      expect(eventEmitter2.emit).not.toHaveBeenCalled();
    });
  });

  it("throws when the analysis does not exist", async () => {
    analysesRepository.findById.mockResolvedValue(null);
    await expect(codeOf(analysesService.findOne("missing"))).resolves.toEqual({
      code: ErrorCode.ANALYSIS_NOT_FOUND,
    });
  });
});

describe("AnalysesService reads", () => {
  let analysesRepository: jest.Mocked<
    Pick<
      AnalysesRepository,
      | "findDetailById"
      | "findPageByRepo"
      | "findRecentByRepo"
      | "countBySchema"
    >
  >;
  let reposService: jest.Mocked<Pick<ReposService, "findOne">>;
  let analysesService: AnalysesService;

  const createdAt = new Date("2026-10-01T00:00:00.000Z");
  const result = (evaluationStatuses: string[]) => ({
    id: "res-1",
    status: "COMPLETED",
    issueCount: 2,
    metricResults: [
      {
        evaluations: evaluationStatuses.map((evaluationStatus) => ({
          status: evaluationStatus,
        })),
      },
    ],
  });

  beforeEach(() => {
    analysesRepository = {
      findDetailById: jest.fn(),
      findPageByRepo: jest.fn(),
      findRecentByRepo: jest.fn(),
      countBySchema: jest.fn(),
    };
    reposService = {
      findOne: jest.fn().mockResolvedValue({ id: "br-1", name: "feat/x" }),
    };
    analysesService = new AnalysesService(
      analysesRepository as unknown as AnalysesRepository,
      reposService as unknown as ReposService,
      {} as StorageService,
      {} as DatabasesService,
      {} as AddOnsService,
    );
  });

  it("throws ANALYSIS_NOT_FOUND when the analysis does not exist", async () => {
    analysesRepository.findDetailById.mockResolvedValue(null);

    const error = await analysesService
      .findDetail("missing")
      .catch((e: NotFoundException) => e);

    expect((error as NotFoundException).getResponse()).toEqual({
      code: ErrorCode.ANALYSIS_NOT_FOUND,
    });
  });

  it.each([
    [
      { apiData: { file: "a.jsonl", path: "p-1" }, databaseData: null },
      { file: "a.jsonl", database: null },
    ],
    [
      {
        apiData: null,
        databaseData: {
          database: { id: "db-1", name: "Shop", connection: "sealed" },
        },
      },
      {
        file: null,
        database: { id: "db-1", name: "Shop", address: "reader@db:5435/shop" },
      },
    ],
  ])("maps the analysis data into the detail", async (data, expected) => {
    const databasesService = {
      toSummary: jest.fn(({ id, name }) => ({
        id,
        name,
        address: "reader@db:5435/shop",
      })),
    };
    Object.assign(analysesService, { databasesService });
    analysesRepository.findDetailById.mockResolvedValue({
      id: "an-1",
      schema: "API",
      title: "Release 1",
      createdAt,
      results: [],
      repo: { id: "br-1", name: "feat/x" },
      ...data,
    } as never);

    await expect(analysesService.findDetail("an-1")).resolves.toMatchObject(
      expected,
    );
  });

  it.each([
    [[], null],
    [["PASSED", "PASSED"], "PASSED"],
    [["PASSED", "FAILED"], "FAILED"],
  ])(
    "derives the gate status from evaluations %j as %s",
    async (evaluationStatuses, expected) => {
      analysesRepository.findPageByRepo.mockResolvedValue({
        items: [
          {
            id: "an-1",
            schema: "API",
            title: "Release 3",
            createdAt,
            results: [result(evaluationStatuses)],
          },
        ] as never,
        total: 1,
      });

      const page = await analysesService.findByRepo("br-1", {
        schema: AnalysisSchema.API,
        limit: 20,
        offset: 0,
      });

      expect(page.total).toBe(1);
      expect(page.items[0]).toEqual({
        id: "an-1",
        schema: "API",
        title: "Release 3",
        createdAt: createdAt.toISOString(),
        latestResult: {
          id: "res-1",
          status: "COMPLETED",
          issueCount: 2,
          gateStatus: expected,
        },
      });
    },
  );

  it("returns a null latest result when the analysis has not been evaluated", async () => {
    analysesRepository.findPageByRepo.mockResolvedValue({
      items: [
        {
          id: "an-1",
          schema: "API",
          title: "Untitled",
          createdAt,
          results: [],
        },
      ] as never,
      total: 1,
    });

    const page = await analysesService.findByRepo("br-1", {
      schema: AnalysisSchema.API,
      limit: 20,
      offset: 0,
    });

    expect(page.items[0].latestResult).toBeNull();
  });

  it("rejects listing analyses of an unknown repo", async () => {
    reposService.findOne.mockRejectedValue(
      new NotFoundException({ code: ErrorCode.REPO_NOT_FOUND }),
    );

    await expect(
      analysesService.findByRepo("missing", {
        schema: AnalysisSchema.API,
        limit: 20,
        offset: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(analysesRepository.findPageByRepo).not.toHaveBeenCalled();
  });

  describe("countByRepo", () => {
    it("counts analyses per schema and fills missing schemas with zero", async () => {
      analysesRepository.countBySchema.mockResolvedValue([
        { schema: "API", _count: { _all: 3 } },
        { schema: "DATABASE", _count: { _all: 1 } },
      ] as never);

      await expect(analysesService.countByRepo("br-1")).resolves.toEqual({
        API: 3,
        QUERY: 0,
        BUG: 0,
        DATABASE: 1,
        FRONTEND: 0,
      });
      expect(analysesRepository.countBySchema).toHaveBeenCalledWith("br-1");
    });

    it("rejects counting analyses of an unknown repo", async () => {
      reposService.findOne.mockRejectedValue(
        new NotFoundException({ code: ErrorCode.REPO_NOT_FOUND }),
      );

      await expect(
        analysesService.countByRepo("missing"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(analysesRepository.countBySchema).not.toHaveBeenCalled();
    });
  });

  describe("getMetricTrend", () => {
    const metric = (id: string, type: string) => ({
      id,
      type,
      unit: type.endsWith("COUNT") ? "COUNT" : "MILLISECOND",
      description: type,
    });
    const subject = (uuid: string, description: string) => ({
      uuid,
      type: "API",
      description,
    });
    const result = (
      rows: [string, string, ReturnType<typeof subject> | null, number][],
    ) => ({
      metricResults: rows.map(([id, type, subject, value]) => ({
        value,
        subject,
        metric: metric(id, type),
      })),
    });

    it("keys values by metric and subject and orders the trend oldest first", async () => {
      analysesRepository.findRecentByRepo.mockResolvedValue([
        {
          id: "an-2",
          createdAt,
          title: "Untitled",
          results: [result([["m-90", "P90", null, 400]])],
        },
        {
          id: "an-1",
          createdAt,
          title: "Release 5",
          results: [
            result([
              ["m-90", "P90", null, 200],
              ["m-50", "P50", null, 50],
            ]),
          ],
        },
      ] as never);

      const trend = await analysesService.getMetricTrend(
        "br-1",
        AnalysisSchema.API,
        20,
      );

      expect(analysesRepository.findRecentByRepo).toHaveBeenCalledWith(
        "br-1",
        AnalysisSchema.API,
        20,
        [],
      );
      expect(trend.points.map(({ analysisId }) => analysisId)).toEqual([
        "an-1",
        "an-2",
      ]);
      expect(trend.points[0].values).toEqual({ "m-90:": 200, "m-50:": 50 });
      expect(trend.points[1].values).toEqual({ "m-90:": 400 });
      expect(trend.series.map(({ key }) => key)).toEqual(["m-50:", "m-90:"]);
      expect(trend.series[0].metric).toEqual({
        id: "m-50",
        type: "P50",
        unit: "MILLISECOND",
        description: "P50",
      });
    });

    it("keeps endpoint results apart and orders the series like the picks", async () => {
      const m1 = "11111111-1111-1111-1111-111111111111";
      const m2 = "22222222-2222-2222-2222-222222222222";
      const cart = subject(
        "aaaaaaaa-aaaa-5aaa-8aaa-aaaaaaaaaaaa",
        "GET /api/cart",
      );
      const orders = subject(
        "bbbbbbbb-bbbb-5bbb-8bbb-bbbbbbbbbbbb",
        "GET /api/orders",
      );
      analysesRepository.findRecentByRepo.mockResolvedValue([
        {
          id: "an-1",
          createdAt,
          title: "Untitled",
          results: [
            result([
              [m1, "ENDPOINT_P95", cart, 900],
              [m2, "P50", null, 10],
              [m1, "ENDPOINT_P95", orders, 300],
            ]),
          ],
        },
      ] as never);

      const picks = [`${m2}:`, `${m1}:${cart.uuid}`, `${m1}:${orders.uuid}`];
      const trend = await analysesService.getMetricTrend(
        "br-1",
        AnalysisSchema.API,
        20,
        picks,
      );

      expect(analysesRepository.findRecentByRepo).toHaveBeenCalledWith(
        "br-1",
        AnalysisSchema.API,
        20,
        [
          { metricId: m2, subjectUuid: null },
          { metricId: m1, subjectUuid: cart.uuid },
          { metricId: m1, subjectUuid: orders.uuid },
        ],
      );
      expect(trend.series.map(({ key }) => key)).toEqual(picks);
      expect(trend.series[1].subject).toEqual(cart);
      expect(trend.series[0].subject).toBeNull();
      expect(trend.points[0].values[`${m1}:${cart.uuid}`]).toBe(900);
    });
  });
});
