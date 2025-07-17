import { analyses, type Analysis, type InsertAnalysis } from "@shared/schema";

export interface IStorage {
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined>;
  getAllAnalyses(): Promise<Analysis[]>;
  deleteAnalysis(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private analyses: Map<number, Analysis>;
  private currentId: number;

  constructor() {
    this.analyses = new Map();
    this.currentId = 1;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentId++;
    const analysis: Analysis = {
      sampleId: insertAnalysis.sampleId,
      imageUrl: insertAnalysis.imageUrl,
      filename: insertAnalysis.filename,
      fileSize: insertAnalysis.fileSize,
      analysisStatus: insertAnalysis.analysisStatus || "pending",
      concentration: insertAnalysis.concentration || null,
      progressiveMotility: insertAnalysis.progressiveMotility || null,
      totalMotility: insertAnalysis.totalMotility || null,
      vap: insertAnalysis.vap || null,
      vcl: insertAnalysis.vcl || null,
      vsl: insertAnalysis.vsl || null,
      alh: insertAnalysis.alh || null,
      bcf: insertAnalysis.bcf || null,
      morphologyScore: insertAnalysis.morphologyScore || null,
      vitalityScore: insertAnalysis.vitalityScore || null,
      overallScore: insertAnalysis.overallScore || null,
      totalCells: insertAnalysis.totalCells || null,
      motileCells: insertAnalysis.motileCells || null,
      progressiveCells: insertAnalysis.progressiveCells || null,
      nonProgressiveCells: insertAnalysis.nonProgressiveCells || null,
      immotileCells: insertAnalysis.immotileCells || null,
      analysisParameters: insertAnalysis.analysisParameters,
      statisticalData: insertAnalysis.statisticalData || null,
      processingTime: insertAnalysis.processingTime || null,
      id,
      createdAt: new Date(),
      completedAt: null,
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined> {
    const existing = this.analyses.get(id);
    if (!existing) return undefined;

    const updated: Analysis = { ...existing, ...updates };
    this.analyses.set(id, updated);
    return updated;
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async deleteAnalysis(id: number): Promise<boolean> {
    return this.analyses.delete(id);
  }
}

export const storage = new MemStorage();
