"use client"

import React, { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import type { Props as RechartsScatterProps } from 'recharts/types/component/DefaultLegendContent';
import type { Benchmark } from '@/data/benchmarks';
import { calculateTrendLine, formatDurationShort, prepareScatterData, type ScatterPoint } from '@/lib/benchmarkStats';
import { useIsMobile, useMounted } from '@/lib/useMediaQuery';

const INK = 'hsl(var(--foreground))';
const MUTED = 'hsl(var(--muted-foreground))';
const BRAND = 'hsl(var(--brand))';

const axisTick = { fontSize: 11, fill: MUTED };
const axisLabel = { fontSize: 11, fill: MUTED };

type ShapeProps = RechartsScatterProps & { cx?: number; cy?: number; payload: ScatterPoint };
type TooltipPayload = { payload: ScatterPoint };

function PointTooltip({ active, payload }: TooltipProps<number, string> & { payload?: TooltipPayload[] }) {
  const point = active && payload?.find(p => p.payload?.name)?.payload;
  if (!point) return null;
  return (
    <div className="rounded border border-border bg-popover text-popover-foreground p-3 text-xs shadow-lg">
      <p className="font-medium">
        {point.name}
        {point.contested && <span className="ml-1.5 text-muted-foreground">(contested)</span>}
      </p>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-muted-foreground">
        <dt>Released</dt>
        <dd className="tabular text-foreground">{point.releaseDate}</dd>
        <dt>H-matched</dt>
        <dd className="tabular text-foreground">{point.solvedDate}</dd>
        {point.model && (
          <>
            <dt>By</dt>
            <dd className="text-foreground">{point.model}</dd>
          </>
        )}
        <dt>Interval</dt>
        <dd className="tabular font-medium text-foreground">{formatDurationShort(point.timeToSolve)}</dd>
      </dl>
    </div>
  );
}

export function TimeToSolveChart({ data }: { data: Benchmark[] }) {
  const isMobile = useIsMobile();
  const mounted = useMounted();

  const points = useMemo(() => prepareScatterData(data), [data]);
  const bounds = useMemo(() => {
    const thisYear = new Date().getUTCFullYear();
    return {
      minX: Math.floor(Math.min(...points.map(p => p.released))) - 1,
      maxX: thisYear + 1,
      minY: -1,
      maxY: Math.ceil(Math.max(...points.map(p => p.timeToSolve))) + 1,
    };
  }, [points]);
  const trend = useMemo(() => calculateTrendLine(points, bounds), [points, bounds]);

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = isMobile ? 5 : 2;
    for (let x = Math.ceil(bounds.minX / step) * step; x <= bounds.maxX; x += step) ticks.push(x);
    return ticks;
  }, [bounds, isMobile]);

  if (!mounted) return <div className="h-[400px]" aria-hidden />;

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 20, right: isMobile ? 10 : 24, left: isMobile ? 0 : 8, bottom: 16 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.7} vertical={false} />
          <ReferenceLine y={0} stroke={MUTED} strokeDasharray="3 3" strokeOpacity={0.7} />
          <XAxis
            type="number"
            dataKey="released"
            domain={[bounds.minX, bounds.maxX]}
            ticks={xTicks}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{ value: 'Benchmark release year', position: 'insideBottom', offset: -8, style: axisLabel }}
          />
          <YAxis
            type="number"
            dataKey="timeToSolve"
            domain={[bounds.minY, bounds.maxY]}
            tickCount={bounds.maxY - bounds.minY + 1}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 26 : 40}
            label={
              isMobile
                ? undefined
                : { value: 'Years to h-match', angle: -90, position: 'insideLeft', offset: 2, style: { ...axisLabel, textAnchor: 'middle' as const } }
            }
          />
          <Tooltip content={<PointTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />
          {trend.length === 2 && (
            <Line
              type="linear"
              dataKey="trend"
              data={trend}
              stroke={MUTED}
              strokeWidth={1}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
          <Scatter
            data={points}
            dataKey="timeToSolve"
            isAnimationActive={false}
            label={
              isMobile
                ? false
                : { dataKey: 'name', position: 'top', offset: 8, fill: MUTED, fontSize: 9 }
            }
            shape={(props: RechartsScatterProps) => {
              const { cx, cy, payload } = props as ShapeProps;
              const r = 3.5;
              // Open circle for a contested h-match, filled for a clean one, brand for the newest.
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={payload.isLatest ? r + 1 : r}
                  fill={payload.contested ? 'hsl(var(--card))' : payload.isLatest ? BRAND : INK}
                  stroke={payload.isLatest ? BRAND : INK}
                  strokeWidth={1}
                  className="cursor-pointer"
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
