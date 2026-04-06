"use client";

import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from "@classroom/ui-components";
import {
  LucideActivity,
  LucideArrowLeft,
  LucideBarChart4,
  LucideDownload,
  LucidePieChart,
  LucideTrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";

type CellValue = string | number | boolean | null;
type DataRow = Record<string, CellValue>;
type ColumnType = "numeric" | "text" | "boolean" | "mixed" | "empty";

interface NumericColumnSummary {
  column: string;
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
}

interface ColumnQuality {
  column: string;
  missing: number;
  filled: number;
  completeness: number;
  type: ColumnType;
  uniqueValues: number;
}

interface ChartDatum {
  name: string;
  value: number;
}

interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  missingCells: number;
  filledCells: number;
  completeness: number;
  numericSummaries: NumericColumnSummary[];
  columnQuality: ColumnQuality[];
  categoryColumn?: string;
  categoryDistribution: ChartDatum[];
  focusNumericColumn?: string;
  numericDistribution: ChartDatum[];
}

const NULLISH = /^(na|n\/a|null|undefined|none|nil|-)$/i;
const BAR_COLORS = ["#2563eb", "#0ea5e9", "#14b8a6", "#22c55e", "#f59e0b", "#f97316", "#ef4444", "#0891b2"];
const MAX_PREVIEW_ROWS = 12;

function formatHeader(value: unknown, index: number): string {
  const clean = String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return clean.length > 0 ? clean : `Column ${index + 1}`;
}

function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();

  return headers.map((header) => {
    const current = seen.get(header) ?? 0;
    seen.set(header, current + 1);
    return current === 0 ? header : `${header} (${current + 1})`;
  });
}

function normalizeCell(value: unknown): CellValue {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  const clean = String(value).replace(/\s+/g, " ").trim();
  if (!clean || NULLISH.test(clean)) return null;

  if (/^(true|false)$/i.test(clean)) {
    return clean.toLowerCase() === "true";
  }

  const withoutSeparators = clean.replace(/,/g, "");
  if (/^-?\d+(\.\d+)?$/.test(withoutSeparators) && !/^0\d+/.test(withoutSeparators)) {
    const parsed = Number(withoutSeparators);
    return Number.isFinite(parsed) ? parsed : clean;
  }

  return clean;
}

async function parseSpreadsheet(file: File): Promise<{ headers: string[]; rows: DataRow[] }> {
  const fileBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(fileBuffer, { type: "array", cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("No worksheet found in this file.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false,
  });

  if (matrix.length === 0) {
    throw new Error("The uploaded file is empty.");
  }

  const rawHeaderRow = Array.isArray(matrix[0]) ? matrix[0] : [];
  const headers = dedupeHeaders(rawHeaderRow.map((value, index) => formatHeader(value, index)));

  const rows = matrix
    .slice(1)
    .map((rawRow) => {
      const rowArray = Array.isArray(rawRow) ? rawRow : [];
      const row: DataRow = {};
      headers.forEach((header, index) => {
        row[header] = normalizeCell(rowArray[index]);
      });
      return row;
    })
    .filter((row) => headers.some((header) => row[header] !== null));

  return { headers, rows };
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function buildHistogram(values: number[], bucketCount = 6): ChartDatum[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [{ name: `${min}`, value: values.length }];
  }

  const bucketSize = (max - min) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const start = min + index * bucketSize;
    const end = index === bucketCount - 1 ? max : start + bucketSize;
    return { start, end, count: 0 };
  });

  values.forEach((value) => {
    const bucketIndex =
      value === max ? bucketCount - 1 : Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
    buckets[bucketIndex].count += 1;
  });

  return buckets.map((bucket) => ({
    name: `${bucket.start.toFixed(1)}-${bucket.end.toFixed(1)}`,
    value: bucket.count,
  }));
}

function buildDatasetProfile(headers: string[], rows: DataRow[]): DatasetProfile {
  const rowCount = rows.length;
  const columnCount = headers.length;
  const totalCells = rowCount * columnCount;

  let missingCells = 0;
  const columnQuality: ColumnQuality[] = [];
  const numericSummaries: NumericColumnSummary[] = [];

  headers.forEach((column) => {
    const values = rows.map((row) => row[column]);
    const filledValues = values.filter((value): value is Exclude<CellValue, null> => value !== null);
    const missing = rowCount - filledValues.length;
    missingCells += missing;

    const numericValues = filledValues.filter((value): value is number => typeof value === "number");
    const textValues = filledValues.filter((value): value is string => typeof value === "string");
    const booleanValues = filledValues.filter((value): value is boolean => typeof value === "boolean");

    let type: ColumnType = "mixed";
    if (filledValues.length === 0) type = "empty";
    else if (numericValues.length === filledValues.length) type = "numeric";
    else if (textValues.length === filledValues.length) type = "text";
    else if (booleanValues.length === filledValues.length) type = "boolean";

    const uniqueValues = new Set(filledValues.map((value) => String(value).trim().toLowerCase())).size;

    columnQuality.push({
      column,
      missing,
      filled: filledValues.length,
      completeness: rowCount === 0 ? 0 : (filledValues.length / rowCount) * 100,
      type,
      uniqueValues,
    });

    if (numericValues.length > 0) {
      const mean = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
      numericSummaries.push({
        column,
        count: numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        mean,
        median: calculateMedian(numericValues),
        stdDev: calculateStdDev(numericValues, mean),
      });
    }
  });

  const filledCells = totalCells - missingCells;
  const completeness = totalCells === 0 ? 0 : (filledCells / totalCells) * 100;

  const categoryCandidates = columnQuality
    .filter(
      (column) =>
        column.type === "text" &&
        column.uniqueValues >= 2 &&
        column.uniqueValues <= Math.max(2, Math.min(rowCount, 30))
    )
    .sort((a, b) => b.completeness - a.completeness);

  const categoryColumn = categoryCandidates[0]?.column;
  const categoryDistribution: ChartDatum[] = [];

  if (categoryColumn) {
    const distributionMap = new Map<string, number>();

    rows.forEach((row) => {
      const value = row[categoryColumn];
      if (typeof value !== "string" || value.length === 0) return;
      distributionMap.set(value, (distributionMap.get(value) ?? 0) + 1);
    });

    distributionMap.forEach((value, name) => {
      categoryDistribution.push({ name, value });
    });

    categoryDistribution.sort((a, b) => b.value - a.value);
  }

  const focusNumericColumn =
    numericSummaries.find((summary) => /score|mark|grade|percent|rating|time|duration|attendance/i.test(summary.column))
      ?.column ?? numericSummaries[0]?.column;

  const numericDistribution = focusNumericColumn
    ? buildHistogram(rows.map((row) => row[focusNumericColumn]).filter((value): value is number => typeof value === "number"))
    : [];

  return {
    rowCount,
    columnCount,
    missingCells,
    filledCells,
    completeness,
    numericSummaries: numericSummaries.sort((a, b) => b.mean - a.mean),
    columnQuality: columnQuality.sort((a, b) => b.completeness - a.completeness),
    categoryColumn,
    categoryDistribution: categoryDistribution.slice(0, 8),
    focusNumericColumn,
    numericDistribution,
  };
}

function formatNumber(value: number, digits = 2): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
}

function encodeCsvValue(value: CellValue | string): string {
  if (value === null) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function getTypeBadgeClass(type: ColumnType): string {
  if (type === "numeric") return "bg-blue-100 text-blue-700";
  if (type === "text") return "bg-cyan-100 text-cyan-700";
  if (type === "boolean") return "bg-amber-100 text-amber-700";
  if (type === "empty") return "bg-slate-100 text-slate-600";
  return "bg-emerald-100 text-emerald-700";
}

function getCellClass(value: CellValue): string {
  if (value === null) return "bg-rose-50 text-rose-600";
  if (typeof value === "number") return "bg-blue-50 text-blue-700";
  if (typeof value === "boolean") return "bg-amber-50 text-amber-700";
  return "bg-white text-slate-700";
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const previewRows = useMemo(() => rows.slice(0, MAX_PREVIEW_ROWS), [rows]);

  const numericAverageChart = useMemo(() => {
    if (!profile) return [];
    return profile.numericSummaries.slice(0, 8).map((summary) => ({
      name: summary.column,
      value: Number(summary.mean.toFixed(2)),
    }));
  }, [profile]);

  const qualityPieData = useMemo(() => {
    if (!profile) return [];
    return [
      { name: "Filled", value: profile.filledCells },
      { name: "Missing", value: profile.missingCells },
    ];
  }, [profile]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const uploaded = event.target.files?.[0];
    if (!uploaded) return;

    setError(null);
    setIsParsing(true);

    try {
      const { headers: parsedHeaders, rows: parsedRows } = await parseSpreadsheet(uploaded);

      if (parsedRows.length === 0) {
        throw new Error("No usable rows found. Ensure your file has a header row and at least one data row.");
      }

      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setProfile(buildDatasetProfile(parsedHeaders, parsedRows));
      setFileName(uploaded.name);
    } catch (parseError) {
      setHeaders([]);
      setRows([]);
      setProfile(null);
      setFileName(uploaded.name);
      setError(parseError instanceof Error ? parseError.message : "Unable to parse this file.");
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  const resetDataset = () => {
    setHeaders([]);
    setRows([]);
    setProfile(null);
    setFileName("");
    setError(null);
  };

  const exportCleanedCsv = () => {
    if (headers.length === 0 || rows.length === 0) return;

    const csvLines = [
      headers.map((header) => encodeCsvValue(header)).join(","),
      ...rows.map((row) => headers.map((header) => encodeCsvValue(row[header])).join(",")),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const baseName = fileName.replace(/\.(csv|xlsx|xls)$/i, "") || "cleaned_dataset";
    link.href = url;
    link.download = `${baseName}_cleaned.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/teacher")}>
          <LucideArrowLeft size={18} />
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Data Import and Analytics</h1>
          <p className="text-slate-500">Upload CSV or Excel, auto-clean it, and get visual statistics instantly.</p>
        </div>

        <div className="flex-1" />

        <Button onClick={exportCleanedCsv} disabled={rows.length === 0} className="flex items-center gap-2">
          <LucideDownload size={18} />
          Export Cleaned CSV
        </Button>
      </div>

      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <LucideActivity size={18} className="text-blue-600" />
            Upload Source File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            htmlFor="analytics-file-upload"
            className="block cursor-pointer rounded-xl border border-dashed border-blue-300 bg-white px-6 py-8 text-center transition-colors hover:border-blue-500 hover:bg-blue-50"
          >
            <span className="block text-base font-semibold text-slate-900">Drop a file here or click to browse</span>
            <span className="mt-1 block text-sm text-slate-500">Supports .csv, .xlsx, .xls</span>
            <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              First worksheet is used for Excel files
            </span>
          </label>

          <input
            id="analytics-file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm text-slate-600">
              File: <span className="font-semibold text-slate-900">{fileName || "None selected"}</span>
            </p>

            <div className="flex gap-2">
              {rows.length > 0 && (
                <Button variant="secondary" onClick={resetDataset}>
                  Clear
                </Button>
              )}
              <span
                className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold ${
                  isParsing
                    ? "bg-amber-100 text-amber-700"
                    : rows.length > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {isParsing ? "Processing..." : rows.length > 0 ? "Ready" : "Waiting for file"}
              </span>
            </div>
          </div>

          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        </CardContent>
      </Card>

      {profile && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Rows"
              value={profile.rowCount.toLocaleString()}
              subLabel="Detected data entries"
              icon={<LucideActivity size={18} className="text-blue-600" />}
              accentClass="text-blue-700"
            />
            <MetricCard
              label="Columns"
              value={profile.columnCount.toLocaleString()}
              subLabel="Structured fields"
              icon={<LucideBarChart4 size={18} className="text-indigo-600" />}
              accentClass="text-indigo-700"
            />
            <MetricCard
              label="Completeness"
              value={`${profile.completeness.toFixed(1)}%`}
              subLabel={`${profile.missingCells.toLocaleString()} missing cells`}
              icon={<LucideTrendingUp size={18} className="text-emerald-600" />}
              accentClass="text-emerald-700"
            />
            <MetricCard
              label="Numeric Columns"
              value={profile.numericSummaries.length.toLocaleString()}
              subLabel="Eligible for statistics"
              icon={<LucidePieChart size={18} className="text-amber-600" />}
              accentClass="text-amber-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {profile.categoryColumn ? `Top categories in ${profile.categoryColumn}` : "Category distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.categoryDistribution.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profile.categoryDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                        <RechartsTooltip
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{
                            borderRadius: "0.5rem",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
                          }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {profile.categoryDistribution.map((item, index) => (
                            <Cell key={`${item.name}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No suitable text column with repeated categories was found.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {profile.focusNumericColumn
                    ? `Distribution for ${profile.focusNumericColumn}`
                    : "Numeric distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.numericDistribution.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profile.numericDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "0.5rem",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
                          }}
                        />
                        <Line
                          dataKey="value"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ r: 3, fill: "#1d4ed8" }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Add at least one numeric column to view distribution charts.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Column Average Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {numericAverageChart.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={numericAverageChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                        <RechartsTooltip
                          formatter={(value) => [formatNumber(Number(value)), "Average"]}
                          contentStyle={{
                            borderRadius: "0.5rem",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
                          }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {numericAverageChart.map((item, index) => (
                            <Cell key={`${item.name}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No numeric columns available for aggregate comparison.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Quality Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {qualityPieData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={qualityPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#fb7185" />
                        </Pie>
                        <Legend />
                        <RechartsTooltip
                          formatter={(value) => [Number(value).toLocaleString(), "Cells"]}
                          contentStyle={{
                            borderRadius: "0.5rem",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No quality metrics available yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Numeric Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.numericSummaries.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Column</th>
                          <th className="px-3 py-2 text-right">Count</th>
                          <th className="px-3 py-2 text-right">Min</th>
                          <th className="px-3 py-2 text-right">Mean</th>
                          <th className="px-3 py-2 text-right">Median</th>
                          <th className="px-3 py-2 text-right">Max</th>
                          <th className="px-3 py-2 text-right">Std Dev</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profile.numericSummaries.map((summary) => (
                          <tr key={summary.column}>
                            <td className="px-3 py-2 font-medium text-slate-900">{summary.column}</td>
                            <td className="px-3 py-2 text-right">{summary.count}</td>
                            <td className="px-3 py-2 text-right">{formatNumber(summary.min)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-blue-700">{formatNumber(summary.mean)}</td>
                            <td className="px-3 py-2 text-right">{formatNumber(summary.median)}</td>
                            <td className="px-3 py-2 text-right">{formatNumber(summary.max)}</td>
                            <td className="px-3 py-2 text-right">{formatNumber(summary.stdDev)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Numeric statistics appear after detecting numeric columns.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Column Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.columnQuality.map((column) => (
                    <div key={column.column} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{column.column}</p>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getTypeBadgeClass(column.type)}`}>
                          {column.type}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                        <span>{column.filled} filled</span>
                        <span>{column.missing} missing</span>
                        <span>{column.uniqueValues} unique</span>
                      </div>

                      <Progress value={column.completeness} className="mt-2 h-2 bg-slate-200 [&>div]:bg-blue-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cleaned Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      {headers.map((header) => (
                        <th key={header} className="whitespace-nowrap px-3 py-2 text-left font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row, rowIndex) => (
                      <tr key={`preview-row-${rowIndex}`} className="hover:bg-slate-50">
                        {headers.map((header) => {
                          const value = row[header];
                          return (
                            <td key={`${header}-${rowIndex}`} className={`whitespace-nowrap px-3 py-2 ${getCellClass(value)}`}>
                              {value === null ? "Missing" : String(value)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > MAX_PREVIEW_ROWS && (
                <p className="mt-3 text-xs text-slate-500">
                  Showing first {MAX_PREVIEW_ROWS} rows out of {rows.length.toLocaleString()}.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  subLabel,
  icon,
  accentClass,
}: {
  label: string;
  value: string;
  subLabel: string;
  icon: ReactNode;
  accentClass: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${accentClass}`}>{value}</div>
        <p className="mt-1 text-xs text-slate-500">{subLabel}</p>
      </CardContent>
    </Card>
  );
}
