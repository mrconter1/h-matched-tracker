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

export const COHORT_COLORS = ['hsl(210 80% 60%)', 'hsl(160 60% 45%)', 'hsl(35 90% 55%)', 'hsl(340 70% 60%)'];

export function SurvivalChart({ data }: { data: Benchmark[] }) {
  const isMobile = useIsMobile();
  const mounted = useMounted();

  const cohorts = useMemo(() => survivalByCohort(data), [data]);
  const rows = useMemo(() => survivalGrid(cohorts), [cohorts]);

  if (!mounted) return <div className="h-[420px]" aria-hidden />;

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: isMobile ? 12 : 32, left: isMobile ? 0 : 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="t"
            domain={[0, 'dataMax']}
            tickCount={isMobile ? 6 : 11}
            tickFormatter={(v: number) => v.toFixed(0)}
            tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{
              value: 'Years since benchmark release',
              position: 'insideBottom',
              offset: -6,
              style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
            }}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 34 : 44}
            label={
              isMobile
                ? undefined
                : {
                    value: 'Still not h-matched',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 4,
                    style: { textAnchor: 'middle', fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
                  }
            }
          />
          <ReferenceLine
            y={0.5}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.5}
            strokeDasharray="4 4"
            label={{ value: 'median', position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            formatter={(value: number) => `${Math.round(value * 100)}%`}
            labelFormatter={(value: number) => `${Number(value).toFixed(1)} years after release`}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
            }}
            itemStyle={{ padding: 0 }}
          />
          <Legend verticalAlign="top" height={isMobile ? 56 : 32} iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          {cohorts.map((cohort, index) => (
            <Line
              key={cohort.key}
              type="stepAfter"
              dataKey={cohort.key}
              name={`${cohort.label} (n=${cohort.curve.n}, ${cohort.curve.events} solved)`}
              stroke={COHORT_COLORS[index % COHORT_COLORS.length]}
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
