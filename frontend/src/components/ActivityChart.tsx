import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Database,
  AlertCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  useMintHistory,
  useBurnHistory,
  useTransferHistory,
} from "../hooks/useTokenData";

interface ChartDataPoint {
  time: string;
  mints: number;
  burns: number;
  transfers: number;
}

interface StatsData {
  total_mints: number;
  total_burns: number;
  total_transfers: number;
  mints_count: number;
  burns_count: number;
  transfers_count: number;
}

export const ActivityChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState("24h");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const { data: mintData, isLoading: mintLoading } = useMintHistory(100, 0);
  const { data: burnData, isLoading: burnLoading } = useBurnHistory(100, 0);
  const { data: transferData, isLoading: transferLoading } = useTransferHistory(
    100,
    0
  );

  const processChartData = () => {
    try {
      setLoading(true);
      setError(null);

      const allEvents: Array<{
        timestamp: string;
        type: "mint" | "burn" | "transfer";
        amount: number;
      }> = [];

      // Add mints
      if (mintData?.mints) {
        mintData.mints.forEach((mint: any) => {
          allEvents.push({
            timestamp: mint.timestamp,
            type: "mint",
            amount: parseFloat(mint.amount),
          });
        });
      }

      // Add burns
      if (burnData?.burns) {
        burnData.burns.forEach((burn: any) => {
          allEvents.push({
            timestamp: burn.timestamp,
            type: "burn",
            amount: parseFloat(burn.amount),
          });
        });
      }

      // Add transfers
      if (transferData?.transfers) {
        transferData.transfers.forEach((transfer: any) => {
          allEvents.push({
            timestamp: transfer.timestamp,
            type: "transfer",
            amount: parseFloat(transfer.amount),
          });
        });
      }

      if (allEvents.length === 0) {
        setError("No transaction data available");
        setChartData([]);
        setStats(null);
        return;
      }

      // Sort events by timestamp
      allEvents.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );



      // Group data based on timeframe
      const groupedData: { [key: string]: ChartDataPoint } = {};

      allEvents.forEach((event) => {
        const date = new Date(event.timestamp);
        let timeKey = "";

        switch (timeframe) {
          case "24h":
            // Group by hour for last 24 hours
            timeKey = date
              .toLocaleTimeString("en-US", {
                hour: "2-digit",
                hour12: false,
                minute: "2-digit",
              })
              .replace(":00", ":00");
            break;
          case "7d":
            // Group by day for last 7 days
            timeKey = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              weekday: "short",
            });
            break;
          case "30d":
            // Group by day for last 30 days
            timeKey = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            break;
          case "90d":
            // Group by week for last 90 days
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
            timeKey = `Week of ${weekStart.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}`;
            break;
          default:
            // Default to daily grouping
            timeKey = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
        }

        if (!groupedData[timeKey]) {
          groupedData[timeKey] = {
            time: timeKey,
            mints: 0,
            burns: 0,
            transfers: 0,
          };
        }

        switch (event.type) {
          case "mint":
            groupedData[timeKey].mints += event.amount;
            break;
          case "burn":
            groupedData[timeKey].burns += event.amount;
            break;
          case "transfer":
            groupedData[timeKey].transfers += event.amount;
            break;
        }
      });

      // Convert to array
      let chartDataArray = Object.values(groupedData);

      // Sort by time based on timeframe
      chartDataArray.sort((a, b) => {
        if (timeframe === "24h") {
          // Extract hour from "HH:00" format
          const hourA = parseInt(a.time.split(":")[0]);
          const hourB = parseInt(b.time.split(":")[0]);
          return hourA - hourB;
        } else if (timeframe === "90d") {
          // Extract date from "Week of MMM DD" format
          const dateA = new Date(a.time.replace("Week of ", ""));
          const dateB = new Date(b.time.replace("Week of ", ""));
          return dateA.getTime() - dateB.getTime();
        } else {
          // For other formats, try to parse as date
          const dateA = new Date(a.time);
          const dateB = new Date(b.time);
          return dateA.getTime() - dateB.getTime();
        }
      });

      // If we have too many points for 90d view, aggregate further
      if (timeframe === "90d" && chartDataArray.length > 15) {
        const aggregated: { [key: string]: ChartDataPoint } = {};
        const weeksPerBucket = Math.ceil(chartDataArray.length / 12); // Aim for ~12 points

        chartDataArray.forEach((point, index) => {
          const bucketIndex = Math.floor(index / weeksPerBucket);
          const bucketKey = `Week ${bucketIndex + 1}`;

          if (!aggregated[bucketKey]) {
            aggregated[bucketKey] = {
              time: bucketKey,
              mints: 0,
              burns: 0,
              transfers: 0,
            };
          }

          aggregated[bucketKey].mints += point.mints;
          aggregated[bucketKey].burns += point.burns;
          aggregated[bucketKey].transfers += point.transfers;
        });

        chartDataArray = Object.values(aggregated);
      }

      // Calculate stats
      const totalMints = allEvents
        .filter((e) => e.type === "mint")
        .reduce((sum, e) => sum + e.amount, 0);

      const totalBurns = allEvents
        .filter((e) => e.type === "burn")
        .reduce((sum, e) => sum + e.amount, 0);

      const totalTransfers = allEvents
        .filter((e) => e.type === "transfer")
        .reduce((sum, e) => sum + e.amount, 0);

      setChartData(chartDataArray);
      setStats({
        total_mints: totalMints,
        total_burns: totalBurns,
        total_transfers: totalTransfers,
        mints_count: allEvents.filter((e) => e.type === "mint").length,
        burns_count: allEvents.filter((e) => e.type === "burn").length,
        transfers_count: allEvents.filter((e) => e.type === "transfer").length,
      });
    } catch (error) {
      console.error("Error processing chart data:", error);
      setError("Failed to process transaction data");
      setChartData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mintLoading && !burnLoading && !transferLoading) {
      processChartData();
    }
  }, [mintLoading, burnLoading, transferLoading, timeframe]);

  const COLORS = ["#3B82F6", "#EF4444", "#10B981"];

  const NoDataMessage = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
        <Database className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Transaction Data</h3>
      <p className="text-gray-400 mb-4 max-w-md">
        There are no transactions to display for the selected time period.
      </p>
    </div>
  );

  const LoadingState = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded w-1/4"></div>
      <div className="h-64 bg-white/5 rounded-2xl"></div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/5 rounded-xl"></div>
        ))}
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce(
        (sum: number, entry: any) => sum + parseFloat(entry.value),
        0
      );

      return (
        <div className="glass-card p-4 border border-white/20 rounded-xl shadow-2xl min-w-[220px] backdrop-blur-lg">
          <div className="mb-2 pb-2 border-b border-white/10">
            <p className="text-sm font-semibold text-gray-300">{label}</p>
          </div>

          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-400">{entry.name}</span>
                </div>
                <span className="font-semibold">
                  {parseFloat(entry.value).toFixed(8)}
                </span>
              </div>
            ))}
          </div>

          {total > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total</span>
                <span className="font-bold text-lg">
                  {total.toFixed(8)} KOMA
                </span>
              </div>
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-500">
            Click and drag to zoom • Scroll to pan
          </div>
        </div>
      );
    }
    return null;
  };

  if (mintLoading || burnLoading || transferLoading || loading) {
    return (
      <div className="glass-card rounded-3xl p-8">
        <LoadingState />
      </div>
    );
  }

  if (error || !chartData.length) {
    return (
      <div className="glass-card rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Activity Analytics</h2>
              <p className="text-gray-400">
                Real-time token activity visualization
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {["24h", "7d", "30d", "90d"].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeframe === period
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Activity Data</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {error || "No transaction activity recorded yet."}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={processChartData}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare pie chart data
  const pieData = stats
    ? [
        { name: "Mints", value: stats.total_mints, color: "#3B82F6" },
        { name: "Burns", value: stats.total_burns, color: "#EF4444" },
        { name: "Transfers", value: stats.total_transfers, color: "#10B981" },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="glass-card rounded-3xl p-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Activity Analytics</h2>
            <p className="text-gray-400">
              Real-time token activity visualization
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["24h", "7d", "30d", "90d"].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg transition-all ${
                timeframe === period
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {period}
            </button>
          ))}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Updated just now</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Over Time Chart - Main Chart (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                Activity Timeline
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({timeframe})
                </span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Real-time tracking of mints, burns, and transfers
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">
                {chartData.length} time points
              </div>
              <div className="text-xs text-gray-500 mt-1">Updated just now</div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient
                    id="mintsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="burnsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="transfersGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  strokeOpacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  fontSize={11}
                  tick={{ fill: "#9CA3AF" }}
                  tickLine={{ stroke: "#4B5563" }}
                  axisLine={{ stroke: "#4B5563" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tick={{ fill: "#9CA3AF" }}
                  tickLine={{ stroke: "#4B5563" }}
                  axisLine={{ stroke: "#4B5563" }}
                  tickFormatter={(value) => `${parseFloat(value).toFixed(2)}`}
                  width={60}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "#4B5563",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mints"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#mintsGradient)"
                  name="Mints"
                  dot={{
                    stroke: "#3B82F6",
                    strokeWidth: 2,
                    r: 3,
                    fill: "#0f172a",
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    fill: "#3B82F6",
                    stroke: "#0f172a",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="burns"
                  stroke="#EF4444"
                  strokeWidth={3}
                  fill="url(#burnsGradient)"
                  name="Burns"
                  dot={{
                    stroke: "#EF4444",
                    strokeWidth: 2,
                    r: 3,
                    fill: "#0f172a",
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    fill: "#EF4444",
                    stroke: "#0f172a",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="transfers"
                  stroke="#10B981"
                  strokeWidth={3}
                  fill="url(#transfersGradient)"
                  name="Transfers"
                  dot={{
                    stroke: "#10B981",
                    strokeWidth: 2,
                    r: 3,
                    fill: "#0f172a",
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    fill: "#10B981",
                    stroke: "#0f172a",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend moved to bottom for better visibility */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <span className="text-sm text-gray-300">Mints</span>
              <span className="text-sm text-gray-500 ml-1">
                ({stats?.mints_count || 0})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600"></div>
              <span className="text-sm text-gray-300">Burns</span>
              <span className="text-sm text-gray-500 ml-1">
                ({stats?.burns_count || 0})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>
              <span className="text-sm text-gray-300">Transfers</span>
              <span className="text-sm text-gray-500 ml-1">
                ({stats?.transfers_count || 0})
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Hover over points for details • Click and drag to zoom
            </div>
          </div>
        </div>

        {/* Volume Distribution Chart - Side Chart (1/3 width) */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">Volume Distribution</h3>
            <p className="text-sm text-gray-500">Total volume by category</p>
          </div>
          <div className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false} // Remove labels from pie slices
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#0f172a"
                        strokeWidth={3}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      backdropFilter: "blur(10px)",
                      padding: "12px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                      minWidth: "180px",
                    }}
                    labelStyle={{
                      color: "#D1D5DB",
                      fontWeight: "600",
                      fontSize: "13px",
                      marginBottom: "4px",
                    }}
                  />
                  {/* Center text */}
                  <text
                    x="50%"
                    y="45%"
                    textAnchor="middle"
                    fill="#D1D5DB"
                    fontSize={16}
                    fontWeight="600"
                  >
                    Total
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize={14}
                  >
                    {(
                      (stats?.total_mints || 0) +
                      (stats?.total_burns || 0) +
                      (stats?.total_transfers || 0)
                    ).toFixed(2)}
                  </text>
                  <text
                    x="50%"
                    y="70%"
                    textAnchor="middle"
                    fill="#6B7280"
                    fontSize={12}
                  >
                    KOMA
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage />
            )}
          </div>

          {/* Compact Legend for Pie Chart */}
          {pieData.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-white/10">
              {pieData.map((entry, index) => {
                const percent =
                  (entry.value /
                    ((stats?.total_mints || 0) +
                      (stats?.total_burns || 0) +
                      (stats?.total_transfers || 0))) *
                  100;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-300">
                        {entry.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {entry.value.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {percent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats Summary */}
      {stats && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border-l-4 border-blue-500 hover:transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-blue-300">Total Mints</p>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                  {stats.mints_count}
                </div>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">
              {stats.total_mints.toFixed(8)} KOMA
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Average:{" "}
              {(stats.total_mints / Math.max(stats.mints_count, 1)).toFixed(8)}{" "}
              KOMA per mint
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border-l-4 border-red-500 hover:transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-red-300">Total Burns</p>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                  {stats.burns_count}
                </div>
                {stats.burns_count > 0 ? (
                  <TrendingUp className="w-5 h-5 text-red-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            <p className="text-3xl font-bold">
              {stats.total_burns.toFixed(8)} KOMA
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {stats.burns_count === 0
                ? "No burn activity recorded"
                : "Average burn amount shown"}
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border-l-4 border-green-500 hover:transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-green-300">
                Transfer Volume
              </p>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                  {stats.transfers_count}
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">
              {stats.total_transfers.toFixed(8)} KOMA
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Average:{" "}
              {(
                stats.total_transfers / Math.max(stats.transfers_count, 1)
              ).toFixed(8)}{" "}
              KOMA per transfer
            </p>
          </div>
        </div>
      )}

      {/* Data Summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span>
              Showing data from {chartData.length} time points • Last update:{" "}
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={processChartData}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};
