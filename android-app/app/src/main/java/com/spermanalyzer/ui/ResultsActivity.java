package com.spermanalyzer.ui;

import android.graphics.Color;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.bumptech.glide.Glide;
import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.data.PieDataSet;
import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.spermanalyzer.R;
import com.spermanalyzer.databinding.ActivityResultsBinding;

import java.util.ArrayList;
import java.util.List;

public class ResultsActivity extends AppCompatActivity {
    private ActivityResultsBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityResultsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setupUI();
        loadResults();
        setupCharts();
    }

    private void setupUI() {
        binding.backButton.setOnClickListener(v -> finish());
        binding.shareButton.setOnClickListener(v -> shareResults());
        binding.exportButton.setOnClickListener(v -> exportResults());
    }

    private void loadResults() {
        // Get results from intent
        String imagePath = getIntent().getStringExtra("imagePath");
        int totalCells = getIntent().getIntExtra("totalCells", 0);
        int motileCells = getIntent().getIntExtra("motileCells", 0);
        int progressiveCells = getIntent().getIntExtra("progressiveCells", 0);
        float motility = getIntent().getFloatExtra("motility", 0f);
        float progressiveMotility = getIntent().getFloatExtra("progressiveMotility", 0f);
        float vap = getIntent().getFloatExtra("vap", 0f);
        float vcl = getIntent().getFloatExtra("vcl", 0f);
        float vsl = getIntent().getFloatExtra("vsl", 0f);
        float alh = getIntent().getFloatExtra("alh", 0f);
        float bcf = getIntent().getFloatExtra("bcf", 0f);

        // Load image
        if (imagePath != null) {
            Glide.with(this)
                .load(imagePath)
                .into(binding.resultImage);
        }

        // Display basic metrics
        binding.totalCellsText.setText("Total Cells: " + totalCells);
        binding.motileCellsText.setText("Motile Cells: " + motileCells);
        binding.progressiveCellsText.setText("Progressive Cells: " + progressiveCells);
        binding.motilityText.setText(String.format("Motility: %.1f%%", motility));
        binding.progressiveMotilityText.setText(String.format("Progressive Motility: %.1f%%", progressiveMotility));

        // Display CASA metrics
        binding.vapText.setText(String.format("VAP: %.1f μm/s", vap));
        binding.vclText.setText(String.format("VCL: %.1f μm/s", vcl));
        binding.vslText.setText(String.format("VSL: %.1f μm/s", vsl));
        binding.alhText.setText(String.format("ALH: %.1f μm", alh));
        binding.bcfText.setText(String.format("BCF: %.1f Hz", bcf));

        // Calculate derived metrics
        float lin = vcl > 0 ? (vsl / vcl) * 100 : 0;
        float str = vap > 0 ? (vsl / vap) * 100 : 0;
        float wob = vcl > 0 ? (vap / vcl) * 100 : 0;

        binding.linText.setText(String.format("LIN: %.1f%%", lin));
        binding.strText.setText(String.format("STR: %.1f%%", str));
        binding.wobText.setText(String.format("WOB: %.1f%%", wob));
    }

    private void setupCharts() {
        setupMotilityChart();
        setupVelocityChart();
    }

    private void setupMotilityChart() {
        int totalCells = getIntent().getIntExtra("totalCells", 0);
        int motileCells = getIntent().getIntExtra("motileCells", 0);
        int progressiveCells = getIntent().getIntExtra("progressiveCells", 0);
        int nonProgressiveCells = motileCells - progressiveCells;
        int immotileCells = totalCells - motileCells;

        List<PieEntry> entries = new ArrayList<>();
        if (progressiveCells > 0) entries.add(new PieEntry(progressiveCells, "Progressive"));
        if (nonProgressiveCells > 0) entries.add(new PieEntry(nonProgressiveCells, "Non-Progressive"));
        if (immotileCells > 0) entries.add(new PieEntry(immotileCells, "Immotile"));

        PieDataSet dataSet = new PieDataSet(entries, "Motility Distribution");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        dataSet.setValueTextColor(Color.WHITE);
        dataSet.setValueTextSize(12f);

        PieData data = new PieData(dataSet);
        binding.motilityChart.setData(data);
        binding.motilityChart.getDescription().setEnabled(false);
        binding.motilityChart.setDrawHoleEnabled(true);
        binding.motilityChart.setHoleColor(Color.TRANSPARENT);
        binding.motilityChart.setTransparentCircleRadius(40f);
        binding.motilityChart.invalidate();
    }

    private void setupVelocityChart() {
        float vap = getIntent().getFloatExtra("vap", 0f);
        float vcl = getIntent().getFloatExtra("vcl", 0f);
        float vsl = getIntent().getFloatExtra("vsl", 0f);

        List<BarEntry> entries = new ArrayList<>();
        entries.add(new BarEntry(0f, vap));
        entries.add(new BarEntry(1f, vcl));
        entries.add(new BarEntry(2f, vsl));

        BarDataSet dataSet = new BarDataSet(entries, "Velocity Parameters (μm/s)");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        dataSet.setValueTextColor(Color.BLACK);
        dataSet.setValueTextSize(12f);

        BarData data = new BarData(dataSet);
        data.setBarWidth(0.5f);

        binding.velocityChart.setData(data);
        binding.velocityChart.getDescription().setEnabled(false);
        binding.velocityChart.getXAxis().setGranularity(1f);
        binding.velocityChart.getXAxis().setValueFormatter((value, axis) -> {
            switch ((int) value) {
                case 0: return "VAP";
                case 1: return "VCL";
                case 2: return "VSL";
                default: return "";
            }
        });
        binding.velocityChart.invalidate();
    }

    private void shareResults() {
        // Implementation for sharing results
        // Could include creating a summary image or PDF
    }

    private void exportResults() {
        // Implementation for exporting results to file
        // Could save as PDF, CSV, or other formats
    }
}