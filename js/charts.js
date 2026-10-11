/**
 * MoneyMate - Charts Module
 * Renders interactive Donut and Monthly Trend charts using Chart.js with canvas fallback support.
 */

window.MoneyMate = window.MoneyMate || {};

(function () {
  'use strict';

  let categoryChartInstance = null;
  let trendChartInstance = null;

  const Charts = {
    isChartJsAvailable() {
      return typeof window.Chart !== 'undefined';
    },

    getThemeColors() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      return {
        isDark,
        text: isDark ? '#CBD5E1' : '#475569',
        grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        tooltipBg: isDark ? '#1E293B' : '#0F172A',
        tooltipText: '#FFFFFF',
        barExpense: '#F87171',
        barExpenseHover: '#EF4444',
        barIncome: '#34D399',
        barIncomeHover: '#10B981'
      };
    },

    renderCategoryDonut(canvasElement, categorySpendData) {
      if (!canvasElement) return;

      const categories = Object.keys(categorySpendData);
      const values = Object.values(categorySpendData);

      if (categories.length === 0 || values.every(v => v === 0)) {
        this.renderEmptyChart(canvasElement, 'No expenses recorded this month');
        return;
      }

      const colors = categories.map(cat => window.MoneyMate.Categories.getColor(cat));
      const theme = this.getThemeColors();

      if (this.isChartJsAvailable()) {
        if (categoryChartInstance) {
          categoryChartInstance.destroy();
        }

        const ctx = canvasElement.getContext('2d');
        categoryChartInstance = new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: categories,
            datasets: [{
              data: values,
              backgroundColor: colors,
              borderColor: theme.isDark ? '#111827' : '#FFFFFF',
              borderWidth: 2,
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: theme.text,
                  font: { family: 'inherit', size: 12, weight: '500' },
                  padding: 14,
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                backgroundColor: theme.tooltipBg,
                titleColor: theme.tooltipText,
                bodyColor: theme.tooltipText,
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: function (context) {
                    const val = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const pct = Math.round((val / total) * 100);
                    const formatted = window.MoneyMate.UI ? window.MoneyMate.UI.formatCurrency(val) : '₹' + val;
                    return ` ${context.label}: ${formatted} (${pct}%)`;
                  }
                }
              }
            },
            cutout: '68%'
          }
        });
      } else {
        this.drawCanvasDonutFallback(canvasElement, categories, values, colors, theme);
      }
    },

    renderMonthlyTrend(canvasElement, trendData) {
      if (!canvasElement) return;

      const theme = this.getThemeColors();

      if (this.isChartJsAvailable()) {
        if (trendChartInstance) {
          trendChartInstance.destroy();
        }

        const ctx = canvasElement.getContext('2d');
        trendChartInstance = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: trendData.labels,
            datasets: [
              {
                label: 'Income',
                data: trendData.incomes,
                backgroundColor: theme.barIncome,
                borderRadius: 6,
                maxBarThickness: 32
              },
              {
                label: 'Expenses',
                data: trendData.expenses,
                backgroundColor: theme.barExpense,
                borderRadius: 6,
                maxBarThickness: 32
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                align: 'end',
                labels: {
                  color: theme.text,
                  font: { family: 'inherit', size: 12, weight: '500' },
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                backgroundColor: theme.tooltipBg,
                titleColor: theme.tooltipText,
                bodyColor: theme.tooltipText,
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: function (context) {
                    const formatted = window.MoneyMate.UI ? window.MoneyMate.UI.formatCurrency(context.raw) : '₹' + context.raw;
                    return ` ${context.dataset.label}: ${formatted}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: theme.text, font: { size: 11 } }
              },
              y: {
                grid: { color: theme.grid },
                ticks: {
                  color: theme.text,
                  font: { size: 11 },
                  callback: function (value) {
                    if (value >= 1000) {
                      return (value / 1000).toFixed(0) + 'k';
                    }
                    return value;
                  }
                }
              }
            }
          }
        });
      } else {
        this.drawCanvasTrendFallback(canvasElement, trendData, theme);
      }
    },

    renderEmptyChart(canvas, message) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(message, w / 2, h / 2);
    },

    drawCanvasDonutFallback(canvas, labels, values, colors, theme) {
      const ctx = canvas.getContext('2d');
      const w = canvas.parentElement.clientWidth || 320;
      const h = 260;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const total = values.reduce((a, b) => a + b, 0);
      if (total === 0) return;

      const centerX = w / 2;
      const centerY = 110;
      const radius = 80;
      const innerRadius = 52;
      let startAngle = -Math.PI / 2;

      for (let i = 0; i < values.length; i++) {
        const sliceAngle = (values[i] / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = colors[i] || '#6366F1';
        ctx.fill();
        startAngle += sliceAngle;
      }

      const legendY = 210;
      let startX = 20;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      labels.slice(0, 5).forEach((lbl, i) => {
        ctx.fillStyle = colors[i] || '#6366F1';
        ctx.fillRect(startX, legendY, 10, 10);
        ctx.fillStyle = theme.text;
        ctx.fillText(lbl, startX + 14, legendY + 5);
        startX += ctx.measureText(lbl).width + 30;
      });
    },

    drawCanvasTrendFallback(canvas, trendData, theme) {
      const ctx = canvas.getContext('2d');
      const w = canvas.parentElement.clientWidth || 400;
      const h = 260;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const maxVal = Math.max(
        ...trendData.expenses,
        ...trendData.incomes,
        1000
      );

      const paddingLeft = 45;
      const paddingBottom = 40;
      const chartWidth = w - paddingLeft - 20;
      const chartHeight = h - paddingBottom - 20;
      const barGroupWidth = chartWidth / trendData.labels.length;
      const barWidth = Math.min(18, (barGroupWidth - 10) / 2);

      ctx.strokeStyle = theme.grid;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, h - paddingBottom);
      ctx.lineTo(w - 20, h - paddingBottom);
      ctx.stroke();

      trendData.labels.forEach((lbl, i) => {
        const groupX = paddingLeft + i * barGroupWidth + 6;
        const incHeight = (trendData.incomes[i] / maxVal) * chartHeight;
        const expHeight = (trendData.expenses[i] / maxVal) * chartHeight;

        ctx.fillStyle = theme.barIncome;
        ctx.fillRect(groupX, h - paddingBottom - incHeight, barWidth, incHeight);

        ctx.fillStyle = theme.barExpense;
        ctx.fillRect(groupX + barWidth + 4, h - paddingBottom - expHeight, barWidth, expHeight);

        ctx.fillStyle = theme.text;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, groupX + barWidth, h - paddingBottom + 16);
      });
    },

    refreshTheme() {
      const currentStats = window.MoneyMate.Expenses.getMonthStats();
      const donutCanvas = document.getElementById('category-donut-chart');
      if (donutCanvas) {
        this.renderCategoryDonut(donutCanvas, currentStats.categorySpend);
      }

      const trendData = window.MoneyMate.Expenses.getTrendData(6);
      const trendCanvas = document.getElementById('monthly-trend-chart');
      if (trendCanvas) {
        this.renderMonthlyTrend(trendCanvas, trendData);
      }
    }
  };

  window.MoneyMate.Charts = Charts;
  window.SpendWise = window.SpendWise || {};
  window.SpendWise.Charts = Charts;
})();
