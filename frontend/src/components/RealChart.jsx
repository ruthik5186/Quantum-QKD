import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * RealChart Component (Ronas IT Clean Edition):
 * Production-grade HTML5 Canvas graphs powered by Chart.js.
 * Renders real Bell inequality CHSH S-statistic and QBER with actual axes,
 * grid lines, crosshairs, and live points in a crisp light design.
 */
export default function RealChart({ rounds = [], currentRound = null, isDark = false }) {
  const [activeMetric, setActiveMetric] = useState('both'); // 'both' | 'chsh' | 'qber'

  // Take recent 50 rounds for smooth, readable real-time plotting
  const sample = rounds.slice(-50);
  const labels = sample.map((r) => `R${r.round_num}`);

  const chshData = sample.map((r) => r.chsh_s);
  const qberData = sample.map((r) => Number((r.qber * 100).toFixed(2)));

  // CHSH Chart configuration
  const chshChartData = {
    labels,
    datasets: [
      {
        label: 'CHSH S-statistic',
        data: chshData,
        borderColor: '#5e67ea',
        backgroundColor: 'rgba(94, 103, 234, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: sample.length > 30 ? 2 : 3.5,
        pointHoverRadius: 6,
        pointBackgroundColor: sample.map((r) => (r.chsh_s < 2.0 || r.anomaly_flagged ? '#ef4444' : '#5e67ea')),
        pointBorderColor: '#ffffff',
      },
      {
        label: 'Classical Limit (S = 2.0)',
        data: Array(sample.length).fill(2.0),
        borderColor: '#f59e0b',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Quantum Max (2√2 ≈ 2.83)',
        data: Array(sample.length).fill(2.8284),
        borderColor: '#8b5cf6',
        borderWidth: 1.2,
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const chshOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: {
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: isDark ? '#94a3b8' : '#717892', font: { family: 'monospace', size: 9 }, maxTicksLimit: 10 },
      },
      y: {
        min: 1.0,
        max: 3.2,
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: isDark ? '#94a3b8' : '#717892', font: { family: 'monospace', size: 10 }, stepSize: 0.4 },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: isDark ? '#f8fafc' : '#151722', font: { size: 10, family: 'Outfit, sans-serif' }, boxWidth: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: isDark ? '#141926' : '#ffffff',
        titleColor: '#5e67ea',
        bodyColor: isDark ? '#f8fafc' : '#151722',
        borderColor: isDark ? '#252f44' : '#e2e7f4',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(4)}`,
        },
      },
    },
  };

  // QBER Chart configuration
  const qberChartData = {
    labels,
    datasets: [
      {
        label: 'QBER Error Rate (%)',
        data: qberData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: sample.length > 30 ? 2 : 3.5,
        pointHoverRadius: 6,
        pointBackgroundColor: sample.map((r) => (r.qber > 0.11 || r.anomaly_flagged ? '#ef4444' : '#10b981')),
        pointBorderColor: '#ffffff',
      },
      {
        label: 'Abort Limit (11%)',
        data: Array(sample.length).fill(11.0),
        borderColor: '#f87171',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const qberOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: {
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: isDark ? '#94a3b8' : '#717892', font: { family: 'monospace', size: 9 }, maxTicksLimit: 10 },
      },
      y: {
        min: 0,
        max: 40,
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
        ticks: {
          color: isDark ? '#94a3b8' : '#717892',
          font: { family: 'monospace', size: 10 },
          callback: (val) => `${val}%`,
          stepSize: 10,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: isDark ? '#f8fafc' : '#151722', font: { size: 10, family: 'Outfit, sans-serif' }, boxWidth: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: isDark ? '#141926' : '#ffffff',
        titleColor: '#ef4444',
        bodyColor: isDark ? '#f8fafc' : '#151722',
        borderColor: isDark ? '#252f44' : '#e2e7f4',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(2)}%`,
        },
      },
    },
  };

  return (
    <div className="space-y-3.5">
      {/* Metric Selector Tabs */}
      <div className={`flex items-center justify-between border-b pb-2 ${
        isDark ? 'border-[#1e2638]' : 'border-[#edf0f8]'
      }`}>
        <span className={`text-[11px] font-extrabold uppercase tracking-wider font-mono ${
          isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
        }`}>
          Live Telemetry ({sample.length} rounds)
        </span>
        <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
          isDark ? 'bg-[#0f131e] border-[#252f44]' : 'bg-[#f0f3fa] border-[#dce2f9]'
        }`}>
          <button
            onClick={() => setActiveMetric('both')}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${
              activeMetric === 'both'
                ? 'bg-[#5e67ea] text-white shadow-xs'
                : isDark
                ? 'text-[#94a3b8] hover:text-white'
                : 'text-[#334155] hover:text-[#0f172a]'
            }`}
          >
            Dual View
          </button>
          <button
            onClick={() => setActiveMetric('chsh')}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${
              activeMetric === 'chsh'
                ? 'bg-[#5e67ea] text-white shadow-xs'
                : isDark
                ? 'text-[#94a3b8] hover:text-white'
                : 'text-[#334155] hover:text-[#0f172a]'
            }`}
          >
            CHSH (S)
          </button>
          <button
            onClick={() => setActiveMetric('qber')}
            className={`px-2.5 py-1 rounded-lg transition font-bold ${
              activeMetric === 'qber'
                ? 'bg-[#5e67ea] text-white shadow-xs'
                : isDark
                ? 'text-[#94a3b8] hover:text-white'
                : 'text-[#334155] hover:text-[#0f172a]'
            }`}
          >
            QBER (%)
          </button>
        </div>
      </div>

      {/* CHSH Canvas Graph */}
      {(activeMetric === 'both' || activeMetric === 'chsh') && (
        <div className={`border rounded-2xl p-3 shadow-xs transition-colors ${
          isDark ? 'bg-[#0f131e] border-[#252f44]' : 'bg-[#f8fafd] border-[#dce2f9]'
        }`}>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className={`font-extrabold ${isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}`}>
              Bell CHSH Correlation (S)
            </span>
            <span className={`font-mono text-[11px] font-extrabold ${
              isDark ? 'text-[#a5b4fc]' : 'text-[#5e67ea]'
            }`}>
              Current: {(currentRound?.chsh_s ?? 2.828).toFixed(4)}
            </span>
          </div>
          <div className="h-44 w-full">
            {sample.length > 0 ? (
              <Line data={chshChartData} options={chshOptions} />
            ) : (
              <div className={`h-full flex items-center justify-center text-xs font-bold ${
                isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
              }`}>
                Awaiting quantum round transmission data...
              </div>
            )}
          </div>
        </div>
      )}

      {/* QBER Canvas Graph */}
      {(activeMetric === 'both' || activeMetric === 'qber') && (
        <div className={`border rounded-2xl p-3 shadow-xs transition-colors ${
          isDark ? 'bg-[#0f131e] border-[#252f44]' : 'bg-[#f8fafd] border-[#dce2f9]'
        }`}>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className={`font-extrabold ${isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}`}>
              Quantum Bit Error Rate (QBER)
            </span>
            <span className="font-mono text-[11px] text-[#ef4444] font-extrabold">
              Current: {((currentRound?.qber ?? 0.0) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="h-40 w-full">
            {sample.length > 0 ? (
              <Line data={qberChartData} options={qberOptions} />
            ) : (
              <div className={`h-full flex items-center justify-center text-xs font-bold ${
                isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
              }`}>
                Awaiting quantum round transmission data...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
