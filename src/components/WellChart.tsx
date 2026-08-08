import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
    getHistory,
    getForecastXGB,
    getForecastTabIclZeroShot,
    getTestResultsXGB,
    getTestResultsTabIclZeroShot
} from "../api/api";

const GAP_THRESHOLD_DAYS = 60;
const GAP_THRESHOLD_MS = GAP_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

const COLORS = {
    history: "#2563eb",
    xgb: "#dc2626",
    tabicl: "#16a34a"
};

type Point = [number, number | null];

function insertGapBreaks(points: Point[], thresholdMs: number): Point[] {
    if (points.length === 0) return points;

    const result: Point[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
        const [prevTime] = points[i - 1];
        const [currTime] = points[i];

        if (currTime - prevTime > thresholdMs) {
            const midTime = prevTime + (currTime - prevTime) / 2;
            result.push([midTime, null]);
        }

        result.push(points[i]);
    }

    return result;
}

function WellChart({ wellId }: { wellId: string }) {
    const [history, setHistory] = useState<any[]>([]);
    const [forecastXGB, setForecastXGB] = useState<any[]>([]);
    const [forecastTabIclZeroShot, setForecastTabIclZeroShot] = useState<any[]>([]);
    const [testResultsXGB, setTestResultsXGB] = useState<any[]>([]);
    const [testResultsTabIclZeroShot, setTestResultsTabIclZeroShot] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [visibleGroups, setVisibleGroups] = useState({
        history: true,
        xgb: true,
        tabicl: true
    });

    useEffect(() => {
            setIsLoading(true);

            Promise.all([
                getHistory(wellId),
                getForecastXGB(wellId),
                getForecastTabIclZeroShot(wellId),
                getTestResultsXGB(wellId),
                getTestResultsTabIclZeroShot(wellId)
            ]).then(([h, fXGB, fTabICL, tXGB, tTabICL]) => {
                setHistory(h.data);
                setForecastXGB(fXGB.data);
                setForecastTabIclZeroShot(fTabICL.data);
                setTestResultsXGB(tXGB.data);
                setTestResultsTabIclZeroShot(tTabICL.data);
                setIsLoading(false);
            });
        }, [wellId]);

    const toggleGroup = (group: keyof typeof visibleGroups) => {
        setVisibleGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    };

    const sortedHistory = [...history].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const rawHistoryData: Point[] = sortedHistory.map((x) => [
        new Date(x.date).getTime(),
        x.GWL !== null && !isNaN(Number(x.GWL)) ? Number(Number(x.GWL).toFixed(2)) : null
    ]);

    const historyData = insertGapBreaks(rawHistoryData, GAP_THRESHOLD_MS);

    const lastHistoryPoint = sortedHistory[sortedHistory.length - 1];

    const rawForecastXGBData: Point[] = forecastXGB.map((x) => [
        new Date(x.forecast_date).getTime(),
        x.predicted_gwl !== null && !isNaN(Number(x.predicted_gwl)) ? Number(Number(x.predicted_gwl).toFixed(2)) : null
    ]);

    const rawForecastTabIclZeroShotData: Point[] = forecastTabIclZeroShot.map((x) => [
        new Date(x.forecast_date).getTime(),
        x.predicted_gwl !== null && !isNaN(Number(x.predicted_gwl)) ? Number(Number(x.predicted_gwl).toFixed(2)) : null
    ]);

    const forecastXGBData: Point[] = lastHistoryPoint
        ? [
              [
                  new Date(lastHistoryPoint.date).getTime(),
                  lastHistoryPoint.GWL !== null && !isNaN(Number(lastHistoryPoint.GWL))
                      ? Number(Number(lastHistoryPoint.GWL).toFixed(2))
                      : null
              ],
              ...rawForecastXGBData
          ]
        : rawForecastXGBData;

    const forecastTabIclZeroShotData: Point[] = lastHistoryPoint
        ? [
              [
                  new Date(lastHistoryPoint.date).getTime(),
                  lastHistoryPoint.GWL !== null && !isNaN(Number(lastHistoryPoint.GWL))
                      ? Number(Number(lastHistoryPoint.GWL).toFixed(2))
                      : null
              ],
              ...rawForecastTabIclZeroShotData
          ]
        : rawForecastTabIclZeroShotData;

    const testResultsXGBData: Point[] = [...testResultsXGB]
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .map((x) => [
            new Date(x.target_date).getTime(),
            x.predicted_gwl !== null && !isNaN(Number(x.predicted_gwl)) ? Number(Number(x.predicted_gwl).toFixed(2)) : null
        ]);

    const testResultsTabIclZeroShotData: Point[] = [...testResultsTabIclZeroShot]
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .map((x) => [
            new Date(x.target_date).getTime(),
            x.predicted_gwl !== null && !isNaN(Number(x.predicted_gwl)) ? Number(Number(x.predicted_gwl).toFixed(2)) : null
        ]);

    const values = [
        ...historyData.map((x) => x[1]),
        ...forecastXGBData.map((x) => x[1]),
        ...forecastTabIclZeroShotData.map((x) => x[1]),
        ...testResultsXGBData.map((x) => x[1]),
        ...testResultsTabIclZeroShotData.map((x) => x[1])
    ].filter((x): x is number => x !== null && !isNaN(Number(x)));

    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 1;

    const margin = Math.max((maxValue - minValue) * 0.2, 0.5);

    const series = [
        visibleGroups.history && {
            name: "Historique",
            type: "line",
            data: historyData,
            smooth: true,
            showSymbol: false,
            connectNulls: false,
            lineStyle: { color: COLORS.history, width: 2 },
            itemStyle: { color: COLORS.history }
        },
        visibleGroups.xgb && {
            name: "XGBoost — prévision",
            type: "line",
            data: rawForecastXGBData,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: COLORS.xgb, width: 3 },
            itemStyle: { color: COLORS.xgb }
        },
        visibleGroups.xgb && {
            name: "XGBoost — test",
            type: "line",
            data: testResultsXGBData,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: COLORS.xgb, width: 2, type: "dashed" },
            itemStyle: { color: COLORS.xgb }
        },
        visibleGroups.tabicl && {
            name: "TabICL Zero-Shot — prévision",
            type: "line",
            data: rawForecastTabIclZeroShotData,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: COLORS.tabicl, width: 3 },
            itemStyle: { color: COLORS.tabicl }
        },
        visibleGroups.tabicl && {
            name: "TabICL Zero-Shot — test",
            type: "line",
            data: testResultsTabIclZeroShotData,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: COLORS.tabicl, width: 2, type: "dashed" },
            itemStyle: { color: COLORS.tabicl }
        }
    ].filter(Boolean);

    const option = {
        animationDuration: 0,

        tooltip: {
            trigger: "axis",
            valueFormatter: (value: any) => (value !== null && value !== undefined ? Number(value).toFixed(2) : "-")
        },

        dataZoom: [
            { type: "inside", start: 50, end: 100 },
            { type: "slider", start: 50, end: 100, height: 18, bottom: 10 }
        ],

        grid: {
            left: 60,
            right: 30,
            top: 20,
            bottom: 80
        },

        xAxis: {
            type: "time",
            boundaryGap: false,
            axisLabel: { rotate: 45 }
        },

        yAxis: {
            type: "value",
            min: Number((minValue - margin).toFixed(2)),
            max: Number((maxValue + margin).toFixed(2)),
            axisLabel: {
                formatter: (value: number) => value.toFixed(2)
            }
        },

        series
    };

    if (isLoading) {
            return (
                <div className="well-chart-container p-3 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-sm font-sans flex items-center justify-center" style={{ height: 350 }}>
                    <span className="text-sm text-slate-400">Chargement…</span>
                </div>
            );
        }

    return (
        <div className="well-chart-container p-3 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-sm font-sans">
            <div className="flex flex-wrap items-center gap-5 mb-3 pb-3 border-b border-slate-200">
                <LegendToggle
                    label="Historique"
                    color={COLORS.history}
                    checked={visibleGroups.history}
                    onChange={() => toggleGroup("history")}
                />
                <LegendToggle
                    label="XGBoost (prévision + test)"
                    color={COLORS.xgb}
                    checked={visibleGroups.xgb}
                    onChange={() => toggleGroup("xgb")}
                />
                <LegendToggle
                    label="TabICL Zero-Shot (prévision + test)"
                    color={COLORS.tabicl}
                    checked={visibleGroups.tabicl}
                    onChange={() => toggleGroup("tabicl")}
                />
            </div>

            <ReactECharts
                option={option}
                notMerge={true}
                style={{
                    height: 350,
                    width: "100%"
                }}
                opts={{
                    renderer: "canvas"
                }}
            />
        </div>
    );
}

function LegendToggle({
    label,
    color,
    checked,
    onChange
}: {
    label: string;
    color: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label
            className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-opacity ${
                checked ? "opacity-100" : "opacity-45"
            }`}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                style={{ accentColor: color }}
            />
            <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
            />
            {label}
        </label>
    );
}

export default WellChart;