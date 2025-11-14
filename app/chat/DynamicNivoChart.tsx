"use client";

import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveHeatMap } from "@nivo/heatmap";

interface ChartProps {
  chartSpec: {
    chartType: "bar" | "pie" | "heatmap";
    params: {
      category: string; // X-axis / Label
      metric: string; // Y-axis / Value
    };
  };
  data: any[];
}

// Define a theme for Nivo to match your dark mode
const nivoTheme = {
  textColor: "#ffffff",
  fontSize: 11,
  axis: {
    domain: { line: { stroke: "#777777", strokeWidth: 1 } },
    ticks: { line: { stroke: "#777777", strokeWidth: 1 }, text: { fill: "#ccc" } },
    legend: { text: { fill: "#ccc", fontSize: 12, textTransform: "capitalize" } },
  },
  grid: { line: { stroke: "#444444", strokeWidth: 1 } },
  legends: { text: { fill: "#ccc" } },
  tooltip: {
    container: { background: "#111", color: "#fff", fontSize: 12, border: "1px solid #333" },
  },
};

// Data for heatmap needs to be transformed
// from: [{ day: "Mon", hour: 10, value: 5 }, ...]
// to:   [{ id: "Mon", data: [{ x: 10, y: 5 }, ...] }]
const transformHeatmapData = (flatData: any[]) => {
  const grouped = flatData.reduce((acc, item) => {
    const { day, hour, value } = item;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push({ x: hour, y: value });
    return acc;
  }, {});

  // Nivo heatmap needs ALL days, so we define the order
  const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return dayOrder.map(day => ({
    id: day,
    data: grouped[day] || [], // Use data or empty array
  }));
};


export default function DynamicNivoChart({ chartSpec, data }: ChartProps) {
  const { chartType, params } = chartSpec;

  const renderChart = () => {
    if (!data || data.length === 0) {
      return <p className="text-gray-400">No data available to plot.</p>;
    }
    
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveBar
            data={data}
            keys={[params.metric]}
            indexBy={params.category}
            margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={{ scheme: "paired" }}
            theme={nivoTheme}
            animate={true}
            motionConfig="wobbly" // Animation!
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -30,
              legend: params.category.replace(/_/g, ' '),
              legendPosition: 'middle',
              legendOffset: 50
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: params.metric.replace(/_/g, ' '),
              legendPosition: 'middle',
              legendOffset: -50
            }}
          />
        );
      
      case "pie":
        return (
          <ResponsivePie
            data={data}
            id={params.category} // e.g., "name"
            value={params.metric} // e.g., "students_count"
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ scheme: "spectral" }}
            theme={nivoTheme}
            animate={true}
            motionConfig="slow" // Animation!
            legends={[
                {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 0,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: '#999',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: 'circle',
                }
            ]}
          />
        );
        
      case "heatmap":
        const heatmapData = transformHeatmapData(data);
        return (
          <ResponsiveHeatMap
            data={heatmapData}
            margin={{ top: 30, right: 60, bottom: 60, left: 60 }}
            valueFormat=">-.0s"
            axisTop={null}
            axisRight={null}
            axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Hour of Day',
                legendPosition: 'middle',
                legendOffset: 46
            }}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Day of Week',
                legendPosition: 'middle',
                legendOffset: -50
            }}
            colors={{
              type: 'diverging',
              scheme: 'red_yellow_blue',
              divergeAt: 0.5,
              minValue: 0,
            }}
            theme={nivoTheme}
            animate={true}
            motionConfig="gentle" // Animation!
            emptyColor="#222"
          />
        );

      default:
        return <p>Unsupported chart type: {chartType}</p>;
    }
  };

  return (
    <div className="w-full h-96 bg-gray-800 p-4 rounded-lg">
      {renderChart()}
    </div>
  );
}