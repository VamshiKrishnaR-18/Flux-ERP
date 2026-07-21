import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/axios";
import {
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  X,
} from "lucide-react";
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { toast } from "sonner";

import { type Invoice } from "@erp/types";
import { EmptyState } from "../../components/EmptyState";
import { TableSkeleton } from "../../components/Skeleton";
import { StatusBadge } from "../../components/StatusBadge";
import { useQuery } from "@tanstack/react-query";

type Density = "compact" | "relaxed";

const invoiceListStyles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, color: "#111", fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottom: "1px solid #F3F4F6",
  },
  colNumber: { width: "18%" },
  colClient: { width: "32%" },
  colDate: { width: "16%" },
  colStatus: { width: "14%" },
  colTotal: { width: "20%", textAlign: "right" },
});

const InvoiceListPDF = ({
  invoices,
  currencySymbol,
}: {
  invoices: Invoice[];
  currencySymbol: string;
}) => (
  <Document>
    <Page size="A4" style={invoiceListStyles.page}>
      <Text style={invoiceListStyles.title}>Invoices</Text>
      <View style={invoiceListStyles.tableHeader}>
        <Text style={invoiceListStyles.colNumber}>Number</Text>
        <Text style={invoiceListStyles.colClient}>Client</Text>
        <Text style={invoiceListStyles.colDate}>Date</Text>
        <Text style={invoiceListStyles.colStatus}>Status</Text>
        <Text style={invoiceListStyles.colTotal}>Total</Text>
      </View>
      {invoices.map((inv) => {
        const client = inv.clientId as unknown as { name?: string };
        const number = `${(inv as unknown as { invoicePrefix?: string }).invoicePrefix ?? ""}${inv.number ?? ""}`;
        return (
          <View key={inv._id} style={invoiceListStyles.row}>
            <Text style={invoiceListStyles.colNumber}>{number}</Text>
            <Text style={invoiceListStyles.colClient}>
              {client?.name || "Unknown Client"}
            </Text>
            <Text style={invoiceListStyles.colDate}>
              {new Date(inv.date).toLocaleDateString()}
            </Text>
            <Text style={invoiceListStyles.colStatus}>{inv.status}</Text>
            <Text style={invoiceListStyles.colTotal}>
              {currencySymbol}
              {inv.total.toFixed(2)}
            </Text>
          </View>
        );
      })}
    </Page>
  </Document>
);

export default function InvoiceList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [density, setDensity] = useState<Density>("relaxed");
  const [page, setPage] = useState(1);

  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const filterLabel = useMemo(() => {
    if (month && year) {
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleString("default", { month: "long", year: "numeric" });
    }
    return null;
  }, [month, year]);

  // Settings for Currency
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data.data;
    },
  });

  const currencySymbol =
    settingsData?.currency === "EUR"
      ? "€"
      : settingsData?.currency === "GBP"
        ? "£"
        : settingsData?.currency === "INR"
          ? "₹"
          : "$";

  // Fetch Invoices
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices", page, month, year],
    queryFn: async () => {
      let url = `/invoices?page=${page}&limit=10`;
      if (month && year) {
        url += `&month=${month}&year=${year}`;
      }
      const res = await api.get(url);
      return res.data;
    },
  });

  

  const invoices = invoicesData?.data ?? [];
  const totalPages = invoicesData?.data?.pagination?.totalPages ?? 1;

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await api.get("/invoices/export/csv", {
        responseType: "blob",
      });
      const disposition =
        (res.headers?.["content-disposition"] as string | undefined) ?? "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const fallback = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      const filename = match?.[1] ?? fallback;

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("CSV exported");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const res = await api.get("/invoices?limit=10000");
      const allInvoices = res.data.data as Invoice[];
      const blob = await pdf(
        <InvoiceListPDF
          invoices={allInvoices}
          currencySymbol={currencySymbol}
        />,
      ).toBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exported");
    } catch {
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 lg:p-10 transition-colors duration-200">
      <main className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
              Invoices
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">
              Manage and track your client billings
            </p>
            {filterLabel && (
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-500/20 animate-in zoom-in duration-300">
                  Showing invoices for {filterLabel}
                  <button
                    onClick={() => {
                      searchParams.delete("month");
                      searchParams.delete("year");
                      setSearchParams(searchParams);
                    }}
                    className="hover:bg-blue-100 dark:hover:bg-blue-500/20 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setDensity("compact")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${density === "compact" ? "bg-black dark:bg-slate-100 text-white dark:text-slate-900" : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
              >
                Compact
              </button>
              <button
                onClick={() => setDensity("relaxed")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${density === "relaxed" ? "bg-black dark:bg-slate-100 text-white dark:text-slate-900" : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
              >
                Relaxed
              </button>
            </div>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-60 w-full sm:w-auto"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export PDF
            </button>
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-60 w-full sm:w-auto"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export CSV
            </button>
            <button
              onClick={() => navigate("/invoices/new")}
              className="bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" /> New Invoice
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-800">
            <TableSkeleton rows={10} cols={6} />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-500">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th
                      className={`px-6 text-xs uppercase tracking-wider font-semibold ${density === "compact" ? "py-3" : "py-5"}`}
                    >
                      Number
                    </th>
                    <th
                      className={`px-6 text-xs uppercase tracking-wider font-semibold ${density === "compact" ? "py-3" : "py-5"}`}
                    >
                      Client
                    </th>
                    <th
                      className={`px-6 text-xs uppercase tracking-wider font-semibold ${density === "compact" ? "py-3" : "py-5"}`}
                    >
                      Date
                    </th>
                    <th
                      className={`px-6 text-xs uppercase tracking-wider font-semibold ${density === "compact" ? "py-3" : "py-5"}`}
                    >
                      Due Date
                    </th>
                    <th
                      className={`px-6 text-xs uppercase tracking-wider font-semibold ${density === "compact" ? "py-3" : "py-5"}`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-6 text-xs uppercase tracking-wider font-semibold text-right ${density === "compact" ? "py-3" : "py-5"}`}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <EmptyState
                          title="No invoices found"
                          description="Once you've added clients and products, you can create your first invoice here to start tracking revenue."
                          icon={FileText}
                          actionLabel="Create Invoice"
                          onAction={() => navigate("/invoices/new")}
                          stepNumber={3}
                          secondaryActionLabel="Learn about billing"
                          onSecondaryAction={() =>
                            window.open(
                              "https://docs.example.com/billing",
                              "_blank",
                            )
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv: Invoice) => {
                      const client = inv.clientId as unknown as {
                        name: string;
                      };
                      return (
                        <tr
                          key={inv._id}
                          onClick={() => navigate(`/invoices/${inv._id}`)}
                          className="group hover:bg-gray-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-200"
                        >
                          <td
                            className={`px-6 ${density === "compact" ? "py-2.5" : "py-5"}`}
                          >
                            <span className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              #{(inv as any).invoicePrefix || ""}
                              {inv.number}
                            </span>
                          </td>
                          <td
                            className={`px-6 ${density === "compact" ? "py-2.5" : "py-5"}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-gray-900 dark:text-slate-100 font-semibold">
                                {client?.name || "Unknown Client"}
                              </span>
                              {density === "relaxed" && (
                                <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">
                                  ID: {inv._id.slice(-6)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td
                            className={`px-6 text-gray-600 dark:text-slate-400 text-sm ${density === "compact" ? "py-2.5" : "py-5"}`}
                          >
                            {new Date(inv.date).toLocaleDateString(undefined, {
                              dateStyle: "medium",
                            })}
                          </td>
                          <td
                            className={`px-6 text-gray-600 dark:text-slate-400 text-sm ${density === "compact" ? "py-2.5" : "py-5"}`}
                          >
                            {new Date(inv.expiredDate).toLocaleDateString(
                              undefined,
                              { dateStyle: "medium" },
                            )}
                          </td>
                          <td
                            className={`px-6 ${density === "compact" ? "py-2.5" : "py-5"}`}
                          >
                            <StatusBadge status={inv.status} />
                          </td>
                          <td
                            className={`px-6 text-right ${density === "compact" ? "py-2.5" : "py-5"}`}
                          >
                            <span className="font-black text-gray-900 dark:text-slate-100 text-base">
                              {currencySymbol}
                              {inv.total.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
              {invoices.length === 0 ? (
                <div className="py-20 text-center px-6">
                  <EmptyState
                    title="No invoices found"
                    description="Once you've added clients and products, you can create your first invoice here."
                    icon={FileText}
                    actionLabel="Create Invoice"
                    onAction={() => navigate("/invoices/new")}
                  />
                </div>
              ) : (
                invoices.map((inv: Invoice) => {
                  const client = inv.clientId as unknown as { name: string };
                  return (
                    <div
                      key={inv._id}
                      onClick={() => navigate(`/invoices/${inv._id}`)}
                      className="p-6 active:bg-gray-50 dark:active:bg-slate-800 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            #{(inv as any).invoicePrefix || ""}
                            {inv.number}
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
                            {client?.name || "Unknown Client"}
                          </span>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            Issued:{" "}
                            {new Date(inv.date).toLocaleDateString(undefined, {
                              dateStyle: "short",
                            })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            Due:{" "}
                            {new Date(inv.expiredDate).toLocaleDateString(
                              undefined,
                              { dateStyle: "short" },
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-gray-900 dark:text-slate-100">
                            {currencySymbol}
                            {inv.total.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/20">
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  Page{" "}
                  <span className="font-medium text-gray-900 dark:text-slate-100">
                    {page}
                  </span>{" "}
                  of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all bg-white dark:bg-slate-900 shadow-sm"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all bg-white dark:bg-slate-900 shadow-sm"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
