package com.spermanalyzer.models;

import android.util.Log;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DeepSORTTracker {
    private static final String TAG = "DeepSORTTracker";
    private static final int MAX_DISAPPEARED_FRAMES = 10;
    private static final float IOU_THRESHOLD = 0.3f;
    private static final int MAX_TRACK_LENGTH = 100;

    private Map<Integer, Track> tracks;
    private int nextTrackId;
    private KalmanFilter kalmanFilter;

    public static class Track {
        public int id;
        public List<Detection> detections;
        public Detection currentDetection;
        public int disappearedFrames;
        public long lastUpdateTime;
        public String motilityType;
        public float[] velocity;
        public boolean isActive;

        public Track(int id, YOLOv8Model.Detection detection) {
            this.id = id;
            this.detections = new ArrayList<>();
            this.currentDetection = new Detection(detection);
            this.disappearedFrames = 0;
            this.lastUpdateTime = System.currentTimeMillis();
            this.motilityType = detection.className;
            this.velocity = new float[]{0, 0};
            this.isActive = true;
            this.detections.add(this.currentDetection);
        }

        public void update(YOLOv8Model.Detection newDetection) {
            if (detections.size() > 0) {
                Detection lastDetection = detections.get(detections.size() - 1);
                long timeDiff = System.currentTimeMillis() - lastUpdateTime;
                
                if (timeDiff > 0) {
                    velocity[0] = (newDetection.x - lastDetection.x) / timeDiff * 1000; // pixels/sec
                    velocity[1] = (newDetection.y - lastDetection.y) / timeDiff * 1000;
                }
            }
            
            this.currentDetection = new Detection(newDetection);
            this.detections.add(this.currentDetection);
            this.disappearedFrames = 0;
            this.lastUpdateTime = System.currentTimeMillis();
            this.motilityType = newDetection.className;
            
            // Keep track history manageable
            if (detections.size() > MAX_TRACK_LENGTH) {
                detections.remove(0);
            }
        }

        public void markDisappeared() {
            disappearedFrames++;
            if (disappearedFrames > MAX_DISAPPEARED_FRAMES) {
                isActive = false;
            }
        }

        public float getVelocityMagnitude() {
            return (float) Math.sqrt(velocity[0] * velocity[0] + velocity[1] * velocity[1]);
        }

        public float getTotalDistance() {
            if (detections.size() < 2) return 0;
            
            float totalDistance = 0;
            for (int i = 1; i < detections.size(); i++) {
                Detection prev = detections.get(i - 1);
                Detection curr = detections.get(i);
                float dx = curr.x - prev.x;
                float dy = curr.y - prev.y;
                totalDistance += Math.sqrt(dx * dx + dy * dy);
            }
            return totalDistance;
        }

        public float getStraightLineDistance() {
            if (detections.size() < 2) return 0;
            
            Detection first = detections.get(0);
            Detection last = detections.get(detections.size() - 1);
            float dx = last.x - first.x;
            float dy = last.y - first.y;
            return (float) Math.sqrt(dx * dx + dy * dy);
        }
    }

    public static class Detection {
        public float x, y, width, height;
        public float confidence;
        public String className;
        public long timestamp;

        public Detection(YOLOv8Model.Detection detection) {
            this.x = detection.x;
            this.y = detection.y;
            this.width = detection.width;
            this.height = detection.height;
            this.confidence = detection.confidence;
            this.className = detection.className;
            this.timestamp = System.currentTimeMillis();
        }
    }

    public DeepSORTTracker() {
        tracks = new HashMap<>();
        nextTrackId = 1;
        kalmanFilter = new KalmanFilter();
    }

    public List<Track> update(List<YOLOv8Model.Detection> detections) {
        Log.d(TAG, "Updating tracker with " + detections.size() + " detections");

        // Predict next positions for existing tracks
        predictTracks();

        // Match detections to existing tracks
        Map<Integer, Integer> matches = matchDetectionsToTracks(detections);

        // Update matched tracks
        for (Map.Entry<Integer, Integer> match : matches.entrySet()) {
            int trackId = match.getKey();
            int detectionIndex = match.getValue();
            Track track = tracks.get(trackId);
            if (track != null) {
                track.update(detections.get(detectionIndex));
            }
        }

        // Mark unmatched tracks as disappeared
        for (Track track : tracks.values()) {
            if (!matches.containsKey(track.id)) {
                track.markDisappeared();
            }
        }

        // Create new tracks for unmatched detections
        for (int i = 0; i < detections.size(); i++) {
            if (!matches.containsValue(i)) {
                Track newTrack = new Track(nextTrackId++, detections.get(i));
                tracks.put(newTrack.id, newTrack);
                Log.d(TAG, "Created new track " + newTrack.id + " for " + newTrack.motilityType);
            }
        }

        // Remove inactive tracks
        tracks.entrySet().removeIf(entry -> !entry.getValue().isActive);

        return new ArrayList<>(tracks.values());
    }

    private void predictTracks() {
        // Use Kalman filter to predict next positions
        for (Track track : tracks.values()) {
            if (track.isActive && track.detections.size() > 1) {
                kalmanFilter.predict(track);
            }
        }
    }

    private Map<Integer, Integer> matchDetectionsToTracks(List<YOLOv8Model.Detection> detections) {
        Map<Integer, Integer> matches = new HashMap<>();
        
        // Simple greedy matching based on IoU
        for (Track track : tracks.values()) {
            if (!track.isActive) continue;
            
            int bestDetectionIndex = -1;
            float bestIoU = 0;
            
            for (int i = 0; i < detections.size(); i++) {
                YOLOv8Model.Detection detection = detections.get(i);
                float iou = calculateIoU(track.currentDetection, detection);
                
                if (iou > IOU_THRESHOLD && iou > bestIoU) {
                    bestIoU = iou;
                    bestDetectionIndex = i;
                }
            }
            
            if (bestDetectionIndex != -1) {
                matches.put(track.id, bestDetectionIndex);
            }
        }
        
        return matches;
    }

    private float calculateIoU(Detection det1, YOLOv8Model.Detection det2) {
        float left = Math.max(det1.x - det1.width/2, det2.x - det2.width/2);
        float top = Math.max(det1.y - det1.height/2, det2.y - det2.height/2);
        float right = Math.min(det1.x + det1.width/2, det2.x + det2.width/2);
        float bottom = Math.min(det1.y + det1.height/2, det2.y + det2.height/2);
        
        if (left < right && top < bottom) {
            float intersectionArea = (right - left) * (bottom - top);
            float area1 = det1.width * det1.height;
            float area2 = det2.width * det2.height;
            float unionArea = area1 + area2 - intersectionArea;
            return intersectionArea / unionArea;
        }
        return 0;
    }

    public List<Track> getActiveTracks() {
        List<Track> activeTracks = new ArrayList<>();
        for (Track track : tracks.values()) {
            if (track.isActive) {
                activeTracks.add(track);
            }
        }
        return activeTracks;
    }

    public void reset() {
        tracks.clear();
        nextTrackId = 1;
        Log.d(TAG, "Tracker reset");
    }

    // Simple Kalman Filter implementation
    private static class KalmanFilter {
        public void predict(Track track) {
            // Simple prediction based on last velocity
            if (track.velocity[0] != 0 || track.velocity[1] != 0) {
                float dt = 0.033f; // Assuming 30 FPS
                track.currentDetection.x += track.velocity[0] * dt;
                track.currentDetection.y += track.velocity[1] * dt;
            }
        }
    }
}