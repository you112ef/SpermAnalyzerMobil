import { pgTable, text, serial, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  sampleId: text("sample_id").notNull(),
  imageUrl: text("image_url").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  analysisStatus: text("analysis_status").notNull().default("pending"), // pending, processing, completed, failed
  
  // CASA Metrics
  concentration: real("concentration"), // cells/mL
  progressiveMotility: real("progressive_motility"), // percentage
  totalMotility: real("total_motility"), // percentage
  vap: real("vap"), // Average Path Velocity (μm/s)
  vcl: real("vcl"), // Curvilinear Velocity (μm/s)
  vsl: real("vsl"), // Straight Line Velocity (μm/s)
  alh: real("alh"), // Amplitude Lateral Head (μm)
  bcf: real("bcf"), // Beat Cross Frequency (Hz)
  
  // Quality metrics
  morphologyScore: real("morphology_score"), // percentage
  vitalityScore: real("vitality_score"), // percentage
  overallScore: real("overall_score"), // percentage
  
  // Cell counts
  totalCells: integer("total_cells"),
  motileCells: integer("motile_cells"),
  progressiveCells: integer("progressive_cells"),
  nonProgressiveCells: integer("non_progressive_cells"),
  immotileCells: integer("immotile_cells"),
  
  // Analysis parameters
  analysisParameters: jsonb("analysis_parameters"), // min/max cell size, etc.
  
  // Statistical data
  statisticalData: jsonb("statistical_data"), // means, std devs, etc.
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  processingTime: real("processing_time"), // seconds
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
