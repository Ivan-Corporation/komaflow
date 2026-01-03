import React, { useState } from "react";
import {
  useMintHistory,
  useBurnHistory,
  useTransferHistory,
} from "../hooks/useTokenData";
import {
  ExternalLink,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Search,
  AlertCircle,
  Database,
  RefreshCw,
} from "lucide-react";
import { formatKomaAmount } from "../api/client";

type TabType = "mints" | "burns" | "transfers";

export const EventHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("mints");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("24h");
  const limit = 10;

  const mintQuery = useMintHistory(limit, (page - 1) * limit);
  const burnQuery = useBurnHistory(limit, (page - 1) * limit);
  const transferQuery = useTransferHistory(limit, (page - 1) * limit);

  const getActiveData = () => {
    switch (activeTab) {
      case "mints":
        return mintQuery;
      case "burns":
        return burnQuery;
      case "transfers":
        return transferQuery;
    }
  };

  const { data, isLoading, error } = getActiveData();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const formatAddress = (addressArray: number[] | string) => {
    if (Array.isArray(addressArray)) {
      const hex = addressArray
        .map((num) => num.toString(16).padStart(2, "0"))
        .join("");
      return `0x${hex.slice(0, 8)}...${hex.slice(-6)}`;
    }
    return `${addressArray.slice(0, 10)}...${addressArray.slice(-8)}`;
  };

  const getTabColor = (tab: TabType) => {
    switch (tab) {
      case "mints":
        return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30";
      case "burns":
        return "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border-red-500/30";
      case "transfers":
        return "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30";
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "mints", label: "Mint Events", icon: ExternalLink },
    { id: "burns", label: "Burn Events", icon: Filter },
    { id: "transfers", label: "Transfers", icon: ChevronLeft },
  ];

  const exportData = () => {
    if (!data) return;

    const csv = [
      ["Transaction", "Time", "From", "To", "Amount", "Type"].join(","),
      ...(activeTab === "mints"
        ? data.mints?.map((mint: any) =>
            [
              mint.transaction,
              mint.timestamp,
              formatAddress(mint.minter),
              formatAddress(mint.to),
              mint.amount,
              "MINT",
            ].join(",")
          )
        : []),
      ...(activeTab === "burns"
        ? data.burns?.map((burn: any) =>
            [
              burn.transaction,
              burn.timestamp,
              formatAddress(burn.from),
              "BURN",
              burn.amount,
              "BURN",
            ].join(",")
          )
        : []),
      ...(activeTab === "transfers"
        ? data.transfers?.map((transfer: any) =>
            [
              transfer.transaction,
              transfer.timestamp,
              formatAddress(transfer.from),
              formatAddress(transfer.to),
              transfer.amount,
              "TRANSFER",
            ].join(",")
          )
        : []),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `koma-${activeTab}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const LoadingState = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-16 bg-gradient-to-r from-white/5 to-white/10 rounded-xl animate-pulse"
        ></div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
        <Database className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        No {activeTab.toUpperCase()} Found
      </h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        There are no {activeTab} events to display for the selected time period.
      </p>
    </div>
  );

  const ErrorState = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Failed to Load Data</h3>
      <p className="text-red-400 mb-6 max-w-md mx-auto">
        {error?.toString() || "Unable to load event history"}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 mx-auto"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );

  return (
    <div className="glass-card rounded-3xl p-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Event History</h2>
          <p className="text-gray-400">
            Monitor all token transactions in real-time
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search address or hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em",
                paddingRight: "2.5rem",
              }}
            >
              <option value="24h" className="bg-gray-900 text-white">
                Last 24 hours
              </option>
              <option value="7d" className="bg-gray-900 text-white">
                Last 7 days
              </option>
              <option value="30d" className="bg-gray-900 text-white">
                Last 30 days
              </option>
              <option value="all" className="bg-gray-900 text-white">
                All time
              </option>
            </select>
          </div>

          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${
                activeTab === tab.id
                  ? getTabColor(tab.id) + " font-semibold shadow-lg"
                  : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {data && activeTab === tab.id && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/10">
                  {data.pagination?.total || 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Data Display */}
      {isLoading && <LoadingState />}
      {error && <ErrorState />}

      {data && !isLoading && !error && (
        <>
          {(activeTab === "mints" &&
            (!data.mints || data.mints.length === 0)) ||
          (activeTab === "burns" && (!data.burns || data.burns.length === 0)) ||
          (activeTab === "transfers" &&
            (!data.transfers || data.transfers.length === 0)) ? (
            <EmptyState />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        Transaction
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        Time
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        {activeTab === "mints"
                          ? "Recipient"
                          : activeTab === "burns"
                          ? "From Address"
                          : "From → To"}
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        Amount
                      </th>
                      {activeTab === "mints" && (
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                          Minter
                        </th>
                      )}
                      {activeTab === "transfers" && (
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                          Type
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === "mints" &&
                      data.mints?.map((mint: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <a
                              href={`https://arbiscan.io/tx/${mint.transaction}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-mono text-sm"
                            >
                              {truncateHash(mint.transaction)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm">
                              <div className="text-gray-300">
                                {formatDate(mint.timestamp)}
                              </div>
                              <div className="text-gray-500 text-xs">
                                Block: {mint.block}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-sm bg-white/5 px-3 py-1 rounded-lg">
                              {formatAddress(mint.to)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="font-bold text-blue-300">
                                {mint.amount} KOMA
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-sm text-gray-400">
                              {formatAddress(mint.minter)}
                            </span>
                          </td>
                        </tr>
                      ))}

                    {activeTab === "burns" &&
                      data.burns?.map((burn: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <a
                              href={`https://arbiscan.io/tx/${burn.transaction}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-mono text-sm"
                            >
                              {truncateHash(burn.transaction)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm">
                              <div className="text-gray-300">
                                {formatDate(burn.timestamp)}
                              </div>
                              <div className="text-gray-500 text-xs">
                                Block: {burn.block}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-sm bg-white/5 px-3 py-1 rounded-lg">
                              {formatAddress(burn.from)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <span className="font-bold text-red-300">
                                {burn.amount} KOMA
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {activeTab === "transfers" &&
                      data.transfers?.map((transfer: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <a
                              href={`https://arbiscan.io/tx/${transfer.transaction}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-mono text-sm"
                            >
                              {truncateHash(transfer.transaction)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm">
                              <div className="text-gray-300">
                                {formatDate(transfer.timestamp)}
                              </div>
                              <div className="text-gray-500 text-xs">
                                Block: {transfer.block}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 font-mono text-sm">
                              <span className="bg-white/5 px-3 py-1 rounded-lg">
                                {formatAddress(transfer.from)}
                              </span>
                              <span className="text-gray-500">→</span>
                              <span className="bg-white/5 px-3 py-1 rounded-lg">
                                {formatAddress(transfer.to)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="font-bold text-green-300">
                                {transfer.amount} KOMA
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                              Standard
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              {data.pagination && data.pagination.total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
                  <div className="text-sm text-gray-400">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, data.pagination.total)} of{" "}
                    {data.pagination.total} events
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        {
                          length: Math.min(
                            5,
                            Math.ceil(data.pagination.total / limit)
                          ),
                        },
                        (_, i) => {
                          const pageNum = i + 1;
                          const isCurrent = page === pageNum;
                          const isNearCurrent = Math.abs(page - pageNum) <= 1;
                          const isFirstOrLast =
                            pageNum === 1 ||
                            pageNum ===
                              Math.ceil(data.pagination.total / limit);

                          if (isFirstOrLast || isNearCurrent) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isCurrent
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                    : "border border-white/10 hover:bg-white/5"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }

                          if (
                            pageNum === 2 ||
                            pageNum ===
                              Math.ceil(data.pagination.total / limit) - 1
                          ) {
                            return (
                              <span
                                key={pageNum}
                                className="px-2 text-gray-500"
                              >
                                ...
                              </span>
                            );
                          }

                          return null;
                        }
                      )}
                    </div>

                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!data.pagination.has_more}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Stats Summary */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <p className="text-sm text-blue-300">Total Mints</p>
            <p className="text-2xl font-bold">2</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
            <p className="text-sm text-red-300">Total Burns</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <p className="text-sm text-green-300">Total Transfers</p>
            <p className="text-2xl font-bold">2</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
            <p className="text-sm text-purple-300">Total Volume</p>
            <p className="text-2xl font-bold">1.01 KOMA</p>
          </div>
        </div>
      </div>
    </div>
  );
};
