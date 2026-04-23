let rawData = [];
let filteredData = [];
let chartInstance = null;

// Fetch JSON data on load
document.addEventListener("DOMContentLoaded", () => {
  fetch("data/sales_data.json")
    .then((response) => response.json())
    .then((data) => {
      rawData = data;
      filteredData = data;
      initCategoryFilter();
      renderChart();
      attachEventHandlers();
    })
    .catch((err) => console.error("Error loading JSON:", err));
});

function initCategoryFilter() {
  const categorySelect = document.getElementById("categoryFilter");
  const categories = new Set(rawData.map((d) => d.category));
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function attachEventHandlers() {
  document
    .getElementById("applyFiltersBtn")
    .addEventListener("click", applyFilters);

  document
    .getElementById("resetFiltersBtn")
    .addEventListener("click", () => {
      filteredData = rawData;
      document.getElementById("categoryFilter").value = "all";
      document.getElementById("fromDate").value = "";
      document.getElementById("toDate").value = "";
      renderChart();
    });

  document
    .getElementById("chartType")
    .addEventListener("change", renderChart);

  document
    .getElementById("exportChartBtn")
    .addEventListener("click", exportChartAsImage);
}

function applyFilters() {
  const category = document.getElementById("categoryFilter").value;
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;

  filteredData = rawData.filter((item) => {
    let ok = true;

    if (category !== "all") {
      ok = ok && item.category === category;
    }

    if (fromDate) {
      ok = ok && item.date >= fromDate;
    }

    if (toDate) {
      ok = ok && item.date <= toDate;
    }

    return ok;
  });

  renderChart();
}

// Prepare chart data based on chart type
function getChartConfig() {
  const chartType = document.getElementById("chartType").value;

  if (chartType === "bar") {
    // Bar: total sales per category
    const totalsByCategory = {};
    filteredData.forEach((item) => {
      if (!totalsByCategory[item.category]) {
        totalsByCategory[item.category] = 0;
      }
      totalsByCategory[item.category] += item.sales;
    });

    const labels = Object.keys(totalsByCategory);
    const values = Object.values(totalsByCategory);

    return {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Total Sales by Category",
            data: values
          }
        ]
      }
    };
  } else if (chartType === "line") {
    // Line: sales over time (sorted by date)
    const sorted = [...filteredData].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const labels = sorted.map((d) => d.date);
    const values = sorted.map((d) => d.sales);

    return {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Sales over Time",
            data: values,
            tension: 0.3
          }
        ]
      }
    };
  } else if (chartType === "pie") {
    // Pie: sales by region
    const totalsByRegion = {};
    filteredData.forEach((item) => {
      if (!totalsByRegion[item.region]) {
        totalsByRegion[item.region] = 0;
      }
      totalsByRegion[item.region] += item.sales;
    });

    const labels = Object.keys(totalsByRegion);
    const values = Object.values(totalsByRegion);

    return {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: "Sales by Region",
            data: values
          }
        ]
      }
    };
  } else if (chartType === "scatter") {
    // Scatter: units vs sales
    const points = filteredData.map((item) => ({
      x: item.units,
      y: item.sales
    }));

    return {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Units vs Sales",
            data: points
          }
        ]
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: "Units" }
          },
          y: {
            title: { display: true, text: "Sales" }
          }
        }
      }
    };
  }
}

// Render / re-render chart
function renderChart() {
  const ctx = document.getElementById("mainChart").getContext("2d");

  // Destroy old chart instance if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  const config = getChartConfig();
  chartInstance = new Chart(ctx, {
    ...config,
    options: {
      ...(config.options || {}),
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true }
      }
    }
  });
}

// Export chart as PNG
function exportChartAsImage() {
  if (!chartInstance) return;

  const link = document.createElement("a");
  link.href = chartInstance.toBase64Image();
  link.download = "chart_export.png";
  link.click();
}
