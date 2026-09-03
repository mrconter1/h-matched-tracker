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

const BRAND = 'hsl(var(--brand))';

type ShapeProps = RechartsScatterProps & { cx?: number; cy?: number; payload: ScatterPoint };

type TooltipPayload = { payload: ScatterPoint };

function PointTooltip({ active, payload }: TooltipProps<number, string> & { payload?: TooltipPayload[] }) {
  const point = active && payload?.find(p => p.payload?.name)?.payload;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-border bg-popover/95 p-3 text-sm shadow-lg backdrop-blur">
      <p className="font-medium">
        {point.name}
        {point.contested && (
          <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            contested
          </span>
        )}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-muted-foreground">
        <dt>Released</dt>
        <dd className="text-foreground">{point.releaseDate}</dd>
        <dt>H-matched</dt>
        <dd className="text-foreground">{point.solvedDate}</dd>
        {point.model && (
          <>
            <dt>By</dt>
            <dd className="text-foreground">{point.model}</dd>
          </>
        )}
        <dt>Gap</dt>
        <dd className="font-medium text-brand">{formatDurationShort(point.timeToSolve)}</dd>
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
    const minX = Math.floor(Math.min(...points.map(p => p.released))) - 1;
    const maxX = thisYear + 1;
    const maxY = Math.ceil(Math.max(...points.map(p => p.timeToSolve))) + 1;
    return { minX, maxX, minY: -1, maxY };
  }, [points]);
  const trend = useMemo(() => calculateTrendLine(points, bounds), [points, bounds]);

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const start = Math.ceil(bounds.minX / 5) * 5;
    for (let x = start; x <= bounds.maxX; x += isMobile ? 5 : 2) ticks.push(x);
    return ticks;
  }, [bounds, isMobile]);

  if (!mounted) return <div className="h-[420px]" aria-hidden />;

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 24, right: isMobile ? 12 : 32, left: isMobile ? 0 : 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.6} />
          <XAxis
            type="number"
            dataKey="released"
            name="Release year"
            domain={[bounds.minX, bounds.maxX]}
            ticks={xTicks}
            tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Benchmark release year',
              position: 'insideBottom',
              offset: -6,
              style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
            }}
          />
          <YAxis
            type="number"
            dataKey="timeToSolve"
            name="Years to h-match"
            domain={[bounds.minY, bounds.maxY]}
            tickCount={bounds.maxY - bounds.minY + 1}
            tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 28 : 44}
            label={
              isMobile
                ? undefined
                : {
                    value: 'Years from release to h-match',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 4,
                    style: { textAnchor: 'middle', fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
                  }
            }
          />
          <Tooltip content={<PointTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />
          {trend.length === 2 && (
            <Line
              type="linear"
              dataKey="trend"
              data={trend}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={0.6}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              name="Linear fit (solved only)"
            />
          )}
          <Scatter
            data={points}
            dataKey="timeToSolve"
            name="Benchmark"
            isAnimationActive={false}
            label={
              isMobile
                ? false
                : {
                    dataKey: 'name',
                    position: 'top',
                    offset: 10,
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 10,
                  }
            }
            shape={(props: RechartsScatterProps) => {
              const { cx, cy, payload } = props as ShapeProps;
              const r = isMobile ? 4 : 5;
              return (
                <g className="cursor-pointer">
                  {payload.isLatest && (
                    <circle cx={cx} cy={cy} r={r + 5} fill={BRAND} fillOpacity={0.18} />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={payload.contested ? 'hsl(var(--card))' : BRAND}
                    stroke={payload.contested ? 'hsl(38 92% 50%)' : BRAND}
                    strokeWidth={payload.contested ? 2 : 1}
                  />
                </g>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
