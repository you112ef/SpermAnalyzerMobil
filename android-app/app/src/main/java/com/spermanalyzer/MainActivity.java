package com.spermanalyzer;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.spermanalyzer.databinding.ActivityMainBinding;
import com.spermanalyzer.ui.CameraActivity;
import com.spermanalyzer.ui.ResultsActivity;

public class MainActivity extends AppCompatActivity {
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1001;
    private static final int STORAGE_PERMISSION_REQUEST_CODE = 1002;
    
    private ActivityMainBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setupUI();
        checkPermissions();
    }

    private void setupUI() {
        binding.btnTakePhoto.setOnClickListener(v -> {
            if (hasPermissions()) {
                startCameraActivity(false);
            } else {
                requestPermissions();
            }
        });

        binding.btnRecordVideo.setOnClickListener(v -> {
            if (hasPermissions()) {
                startCameraActivity(true);
            } else {
                requestPermissions();
            }
        });

        binding.btnViewResults.setOnClickListener(v -> {
            Intent intent = new Intent(this, ResultsActivity.class);
            startActivity(intent);
        });

        binding.btnAbout.setOnClickListener(v -> {
            // Show about dialog
            showAboutDialog();
        });
    }

    private void startCameraActivity(boolean isVideo) {
        Intent intent = new Intent(this, CameraActivity.class);
        intent.putExtra("isVideo", isVideo);
        startActivity(intent);
    }

    private boolean hasPermissions() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
               ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    private void checkPermissions() {
        if (!hasPermissions()) {
            requestPermissions();
        }
    }

    private void requestPermissions() {
        String[] permissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE
        };
        
        ActivityCompat.requestPermissions(this, permissions, CAMERA_PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Permissions granted", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Camera permission is required for analysis", Toast.LENGTH_LONG).show();
            }
        }
    }

    private void showAboutDialog() {
        // Implementation for about dialog
        Toast.makeText(this, "Sperm Analyzer AI v1.0\n100% Offline AI Analysis", Toast.LENGTH_LONG).show();
    }
}