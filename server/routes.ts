import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisSchema } from "@shared/schema";
import type { Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'video/mp4', 'video/avi', 'video/mov', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, TIFF images and MP4, AVI, MOV, WEBM videos are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create new analysis
  app.post("/api/analyses", upload.single('image'), async (req, res) => {
    try {
      console.log('Request received:', {
        file: req.file ? { filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype } : null,
        body: req.body,
        headers: req.headers['content-type']
      });
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const analysisData = {
        sampleId: `SA-${Date.now()}`,
        imageUrl: `/uploads/${req.file.filename}`,
        filename: req.file.originalname,
        fileSize: req.file.size,
        analysisStatus: "pending",
        analysisParameters: req.body.parameters ? JSON.parse(req.body.parameters) : {
          minCellSize: 2,
          maxCellSize: 10,
          magnification: 400,
          temperature: 37,
          chamberType: "Makler Chamber"
        },
        concentration: null,
        progressiveMotility: null,
        totalMotility: null,
        vap: null,
        vcl: null,
        vsl: null,
        alh: null,
        bcf: null,
        morphologyScore: null,
        vitalityScore: null,
        overallScore: null,
        totalCells: null,
        motileCells: null,
        progressiveCells: null,
        nonProgressiveCells: null,
        immotileCells: null,
        statisticalData: null,
        processingTime: null,
      };

      const validatedData = insertAnalysisSchema.parse(analysisData);
      const analysis = await storage.createAnalysis(validatedData);
      
      res.status(201).json(analysis);
    } catch (error) {
      console.error("Error creating analysis:", error);
      res.status(500).json({ message: "Failed to create analysis" });
    }
  });

  // Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Get specific analysis
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // Update analysis with results
  app.patch("/api/analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Handle timestamp conversion for database compatibility
      if (updates.completedAt) {
        if (typeof updates.completedAt === 'string') {
          updates.completedAt = new Date(updates.completedAt);
        } else if (updates.completedAt instanceof Date) {
          // Already a Date object, keep as-is
        } else {
          // Remove invalid timestamp
          delete updates.completedAt;
        }
      }
      
      console.log('Updating analysis:', { id, updatesKeys: Object.keys(updates) });
      const analysis = await storage.updateAnalysis(id, updates);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error updating analysis:", error);
      res.status(500).json({ message: "Failed to update analysis", error: error.message });
    }
  });

  // Delete analysis
  app.delete("/api/analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAnalysis(id);
      
      if (!success) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json({ message: "Analysis deleted successfully" });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
