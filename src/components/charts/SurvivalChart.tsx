"use client"

import React, { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Benchmark } from '@/data/benchmarks';
import { survivalByCohort, survivalGrid } from '@/lib/survival';
import { useIsMobile, useMounted } from '@/lib/useMediaQuery';

const MUTED = 'hsl(var(--muted-foreground))';
const axisTick = { fontSize: 11, fill: MUTED };
const axisLabel = { fontSize: 11, fill: MUTED };

/** Four steps of one hue, oldest cohort lightest. Tokens so both themes work. */
export const COHORT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

export function SurvivalChart({ data }: { data: Benchmark[] }) {
  const isMobile = useIsMobile();
  const mounted = useMounted();

  const cohorts = useMemo(() => survivalByCohort(data), [data]);
  const rows = useMemo(() => survivalGrid(cohorts), [cohorts]);

  if (!mounted) return <div className="h-[400px]" aria-hidden />;

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 4, right: isMobile ? 10 : 24, left: isMobile ? 0 : 8, bottom: 16 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.7} vertical={false} />
          <XAxis
            type="number"
            dataKey="t"
            domain={[0, 'dataMax']}
            tickCount={isMobile ? 6 : 11}
            tickFormatter={(v: number) => v.toFixed(0)}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{ value: 'Years since release', position: 'insideBottom', offset: -8, style: axisLabel }}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 32 : 42}
            label={
              isMobile
                ? undefined
                : { value: 'Share not yet h-matched', angle: -90, position: 'insideLeft', offset: 2, style: { ...axisLabel, textAnchor: 'middle' as const } }
            }
          />
          <ReferenceLine
            y={0.5}
            stroke={MUTED}
            strokeOpacity={0.6}
            strokeDasharray="3 3"
            label={{ value: 'median', position: 'right', fontSize: 10, fill: MUTED }}
          />
          <Tooltip
            formatter={(value: number) => `${Math.round(value * 100)}%`}
            labelFormatter={(value: number) => `${Number(value).toFixed(1)} years after release`}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 4,
              fontSize: 12,
            }}
            itemStyle={{ padding: 0 }}
          />
          <Legend verticalAlign="top" height={isMobile ? 52 : 28} iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
          {cohorts.map((cohort, index) => (
            <Line
              key={cohort.key}
              type="stepAfter"
              dataKey={cohort.key}
              name={`${cohort.label} (n=${cohort.curve.n}, ${cohort.curve.events} h-matched)`}
              stroke={COHORT_COLORS[index % COHORT_COLORS.length]}
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
