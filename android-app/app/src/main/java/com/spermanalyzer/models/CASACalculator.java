package com.spermanalyzer.models;

import android.util.Log;

import java.util.ArrayList;
import java.util.List;

public class CASACalculator {
    private static final String TAG = "CASACalculator";
    private static final float PIXEL_TO_MICRON_RATIO = 0.25f; // Assuming 400x magnification
    private static final int MIN_TRACK_LENGTH = 3; // Minimum track length for velocity calculation

    public static class CASAMetrics {
        public float concentration; // cells/mL
        public float motility; // % motile cells
        public float progressiveMotility; // % progressive motile cells
        public float vap; // Average path velocity (μm/s)
        public float vcl; // Curvilinear velocity (μm/s)
        public float vsl; // Straight line velocity (μm/s)
        public float alh; // Amplitude of lateral head displacement (μm)
        public float bcf; // Beat cross frequency (Hz)
        public float lin; // Linearity (VSL/VCL)
        public float str; // Straightness (VSL/VAP)
        public float wob; // Wobble (VAP/VCL)
        public int totalCells;
        public int motileCells;
        public int progressiveCells;
        public int nonProgressiveCells;
        public int immotileCells;
        
        public CASAMetrics() {
            // Initialize all values to 0
        }
    }

    public static class CellAnalysis {
        public float vap, vcl, vsl, alh, bcf, lin, str, wob;
        public String motilityGrade;
        public float pathLength;
        public float displacement;
        public boolean isMotile;
        public boolean isProgressive;
        
        public CellAnalysis() {
            // Initialize
        }
    }

    public CASACalculator() {
        // Constructor
    }

    public CASAMetrics calculateMetrics(List<DeepSORTTracker.Track> tracks) {
        Log.d(TAG, "Calculating CASA metrics for " + tracks.size() + " tracks");
        
        CASAMetrics metrics = new CASAMetrics();
        List<CellAnalysis> cellAnalyses = new ArrayList<>();
        
        // Analyze each track
        for (DeepSORTTracker.Track track : tracks) {
            if (track.detections.size() >= MIN_TRACK_LENGTH) {
                CellAnalysis analysis = analyzeCellTrack(track);
                cellAnalyses.add(analysis);
            }
        }
        
        // Calculate overall metrics
        metrics.totalCells = cellAnalyses.size();
        metrics.motileCells = 0;
        metrics.progressiveCells = 0;
        metrics.nonProgressiveCells = 0;
        metrics.immotileCells = 0;
        
        float totalVAP = 0, totalVCL = 0, totalVSL = 0, totalALH = 0, totalBCF = 0;
        int motileCount = 0;
        
        for (CellAnalysis analysis : cellAnalyses) {
            if (analysis.isMotile) {
                metrics.motileCells++;
                totalVAP += analysis.vap;
                totalVCL += analysis.vcl;
                totalVSL += analysis.vsl;
                totalALH += analysis.alh;
                totalBCF += analysis.bcf;
                motileCount++;
                
                if (analysis.isProgressive) {
                    metrics.progressiveCells++;
                } else {
                    metrics.nonProgressiveCells++;
                }
            } else {
                metrics.immotileCells++;
            }
        }
        
        // Calculate percentages and averages
        if (metrics.totalCells > 0) {
            metrics.motility = (float) metrics.motileCells / metrics.totalCells * 100;
            metrics.progressiveMotility = (float) metrics.progressiveCells / metrics.totalCells * 100;
        }
        
        if (motileCount > 0) {
            metrics.vap = totalVAP / motileCount;
            metrics.vcl = totalVCL / motileCount;
            metrics.vsl = totalVSL / motileCount;
            metrics.alh = totalALH / motileCount;
            metrics.bcf = totalBCF / motileCount;
            
            // Calculate derived parameters
            metrics.lin = metrics.vcl > 0 ? metrics.vsl / metrics.vcl : 0;
            metrics.str = metrics.vap > 0 ? metrics.vsl / metrics.vap : 0;
            metrics.wob = metrics.vcl > 0 ? metrics.vap / metrics.vcl : 0;
        }
        
        // Calculate concentration (simplified)
        metrics.concentration = calculateConcentration(metrics.totalCells);
        
        Log.d(TAG, "CASA metrics calculated - Total: " + metrics.totalCells + 
                   ", Motile: " + metrics.motileCells + 
                   ", Progressive: " + metrics.progressiveCells);
        
        return metrics;
    }

    private CellAnalysis analyzeCellTrack(DeepSORTTracker.Track track) {
        CellAnalysis analysis = new CellAnalysis();
        
        if (track.detections.size() < MIN_TRACK_LENGTH) {
            return analysis;
        }
        
        // Calculate total path length (curvilinear distance)
        analysis.pathLength = track.getTotalDistance() * PIXEL_TO_MICRON_RATIO;
        
        // Calculate straight line displacement
        analysis.displacement = track.getStraightLineDistance() * PIXEL_TO_MICRON_RATIO;
        
        // Calculate time span in seconds
        long startTime = track.detections.get(0).timestamp;
        long endTime = track.detections.get(track.detections.size() - 1).timestamp;
        float timeSpan = (endTime - startTime) / 1000.0f;
        
        if (timeSpan > 0) {
            // Calculate velocities
            analysis.vcl = analysis.pathLength / timeSpan; // Curvilinear velocity
            analysis.vsl = analysis.displacement / timeSpan; // Straight line velocity
            analysis.vap = calculateVAP(track, timeSpan); // Average path velocity
            
            // Calculate other parameters
            analysis.alh = calculateALH(track);
            analysis.bcf = calculateBCF(track, timeSpan);
            
            // Calculate derived ratios
            analysis.lin = analysis.vcl > 0 ? analysis.vsl / analysis.vcl : 0;
            analysis.str = analysis.vap > 0 ? analysis.vsl / analysis.vap : 0;
            analysis.wob = analysis.vcl > 0 ? analysis.vap / analysis.vcl : 0;
        }
        
        // Determine motility status
        analysis.isMotile = analysis.vcl > 5.0f; // Threshold for motility
        analysis.isProgressive = analysis.isMotile && analysis.vsl > 25.0f && analysis.str > 0.8f;
        
        // Assign motility grade
        if (analysis.isProgressive) {
            analysis.motilityGrade = analysis.vsl > 50.0f ? "A" : "B";
        } else if (analysis.isMotile) {
            analysis.motilityGrade = "C";
        } else {
            analysis.motilityGrade = "D";
        }
        
        return analysis;
    }

    private float calculateVAP(DeepSORTTracker.Track track, float timeSpan) {
        if (track.detections.size() < 3) return 0;
        
        // Apply smoothing to the track
        List<DeepSORTTracker.Detection> smoothedTrack = smoothTrack(track.detections);
        
        // Calculate distance along smoothed path
        float smoothedDistance = 0;
        for (int i = 1; i < smoothedTrack.size(); i++) {
            DeepSORTTracker.Detection prev = smoothedTrack.get(i - 1);
            DeepSORTTracker.Detection curr = smoothedTrack.get(i);
            float dx = curr.x - prev.x;
            float dy = curr.y - prev.y;
            smoothedDistance += Math.sqrt(dx * dx + dy * dy);
        }
        
        smoothedDistance *= PIXEL_TO_MICRON_RATIO;
        return smoothedDistance / timeSpan;
    }

    private List<DeepSORTTracker.Detection> smoothTrack(List<DeepSORTTracker.Detection> track) {
        List<DeepSORTTracker.Detection> smoothed = new ArrayList<>();
        
        if (track.size() < 3) return track;
        
        // Apply simple moving average
        smoothed.add(track.get(0)); // Keep first point
        
        for (int i = 1; i < track.size() - 1; i++) {
            DeepSORTTracker.Detection prev = track.get(i - 1);
            DeepSORTTracker.Detection curr = track.get(i);
            DeepSORTTracker.Detection next = track.get(i + 1);
            
            DeepSORTTracker.Detection smoothedPoint = new DeepSORTTracker.Detection(
                new YOLOv8Model.Detection(
                    (prev.x + curr.x + next.x) / 3,
                    (prev.y + curr.y + next.y) / 3,
                    curr.width, curr.height, curr.confidence, 0, curr.className
                )
            );
            smoothed.add(smoothedPoint);
        }
        
        smoothed.add(track.get(track.size() - 1)); // Keep last point
        return smoothed;
    }

    private float calculateALH(DeepSORTTracker.Track track) {
        if (track.detections.size() < 3) return 0;
        
        List<Float> deviations = new ArrayList<>();
        
        for (int i = 1; i < track.detections.size() - 1; i++) {
            DeepSORTTracker.Detection prev = track.detections.get(i - 1);
            DeepSORTTracker.Detection curr = track.detections.get(i);
            DeepSORTTracker.Detection next = track.detections.get(i + 1);
            
            // Calculate perpendicular distance from point to line
            float deviation = calculatePerpendicularDistance(curr, prev, next);
            deviations.add(deviation * PIXEL_TO_MICRON_RATIO);
        }
        
        // Calculate mean deviation
        float sum = 0;
        for (float deviation : deviations) {
            sum += deviation;
        }
        
        return deviations.size() > 0 ? sum / deviations.size() : 0;
    }

    private float calculatePerpendicularDistance(DeepSORTTracker.Detection point, 
                                               DeepSORTTracker.Detection lineStart, 
                                               DeepSORTTracker.Detection lineEnd) {
        float A = point.x - lineStart.x;
        float B = point.y - lineStart.y;
        float C = lineEnd.x - lineStart.x;
        float D = lineEnd.y - lineStart.y;
        
        float dot = A * C + B * D;
        float lenSq = C * C + D * D;
        
        if (lenSq == 0) return 0;
        
        float param = dot / lenSq;
        float xx = lineStart.x + param * C;
        float yy = lineStart.y + param * D;
        
        float dx = point.x - xx;
        float dy = point.y - yy;
        
        return (float) Math.sqrt(dx * dx + dy * dy);
    }

    private float calculateBCF(DeepSORTTracker.Track track, float timeSpan) {
        if (track.detections.size() < 4) return 0;
        
        // Count zero crossings in lateral displacement
        int crossings = 0;
        float previousDeviation = 0;
        
        for (int i = 1; i < track.detections.size() - 1; i++) {
            DeepSORTTracker.Detection prev = track.detections.get(i - 1);
            DeepSORTTracker.Detection curr = track.detections.get(i);
            DeepSORTTracker.Detection next = track.detections.get(i + 1);
            
            float deviation = calculatePerpendicularDistance(curr, prev, next);
            
            if (i > 1 && Math.signum(deviation) != Math.signum(previousDeviation)) {
                crossings++;
            }
            
            previousDeviation = deviation;
        }
        
        return crossings / timeSpan; // Frequency in Hz
    }

    private float calculateConcentration(int cellCount) {
        // Simplified concentration calculation
        // In real implementation, this would depend on chamber volume, dilution factor, etc.
        float chamberVolume = 0.1f; // mL
        float dilutionFactor = 1.0f;
        
        return (cellCount * dilutionFactor) / chamberVolume / 1000000; // Convert to millions/mL
    }
}