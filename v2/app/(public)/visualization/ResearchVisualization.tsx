// app/(public)/visualization/ResearchVisualization.tsx

'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import GroupIcon from '@mui/icons-material/Group';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import type { ArticleWithCategories } from '@/lib/api/articles';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const EXCLUDED_CATEGORY = 'Dissertation';
const CHART_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgb(59, 130, 246)' },
  { bg: 'rgba(16, 185, 129, 0.7)', border: 'rgb(16, 185, 129)' },
  { bg: 'rgba(139, 92, 246, 0.7)', border: 'rgb(139, 92, 246)' },
  { bg: 'rgba(249, 115, 22, 0.7)', border: 'rgb(249, 115, 22)' },
  { bg: 'rgba(236, 72, 153, 0.7)', border: 'rgb(236, 72, 153)' },
  { bg: 'rgba(20, 184, 166, 0.7)', border: 'rgb(20, 184, 166)' },
];

interface ResearchVisualizationProps {
  articles: ArticleWithCategories[];
}

export function ResearchVisualization({ articles }: ResearchVisualizationProps) {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());

  const stats = useMemo(() => {
    const totalPapers = articles.length;
    const uniqueCategories = new Set<string>();
    const uniqueAuthors = new Set<string>();
    articles.forEach((a) => {
      (a.categories ?? []).forEach((c) => uniqueCategories.add(c));
      (a.authors ?? '')
        .split(/[,;]/)
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((auth) => uniqueAuthors.add(auth));
    });
    return {
      totalPapers,
      totalCategories: uniqueCategories.size,
      totalCoauthors: uniqueAuthors.size,
    };
  }, [articles]);

  const timelineData = useMemo(() => {
    const yearCounts: Record<string, number> = {};
    articles.forEach((a) => {
      const date = a.published_date;
      if (date) {
        const year = String(date).substring(0, 4);
        yearCounts[year] = (yearCounts[year] ?? 0) + 1;
      }
    });
    const years = Object.keys(yearCounts).sort();
    return { labels: years, data: years.map((y) => yearCounts[y] ?? 0) };
  }, [articles]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => {
      (a.categories ?? []).forEach((c) => {
        counts[c] = (counts[c] ?? 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [articles]);

  const categoryTimelineData = useMemo(() => {
    const filtered = articles.filter(
      (a) =>
        !(a.categories ?? []).includes(EXCLUDED_CATEGORY),
    );
    const years = new Set<string>();
    const byCategoryYear: Record<string, Record<string, number>> = {};
    filtered.forEach((a) => {
      const date = a.published_date;
      if (date) {
        const year = String(date).substring(0, 4);
        years.add(year);
      }
      (a.categories ?? []).forEach((cat) => {
        if (!byCategoryYear[cat]) byCategoryYear[cat] = {};
        const year = date ? String(date).substring(0, 4) : '';
        if (year) {
          byCategoryYear[cat][year] = (byCategoryYear[cat][year] ?? 0) + 1;
        }
      });
    });
    const sortedYears = Array.from(years).sort();
    return { sortedYears, byCategoryYear };
  }, [articles]);

  const coauthorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const MAIN = 'Dennis P. Culhane';
    const aliases = ['Dennis P Culhane', 'Dennis P. Culhane', 'Dennis Culhane'];
    const isMain = (n: string) =>
      aliases.some((a) => n.toLowerCase() === a.toLowerCase());

    articles.forEach((a) => {
      const authors = (a.authors ?? '')
        .split(/[,;]/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (authors.some(isMain)) {
        authors.forEach((auth) => {
          counts[auth] = (counts[auth] ?? 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .filter(([name]) => !isMain(name))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [articles]);

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const timelineChartData = {
    labels: timelineData.labels,
    datasets: [
      {
        label: 'Publications',
        data: timelineData.data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const categoryChartData = {
    labels: categoryCounts.map(([n]) => n),
    datasets: [
      {
        data: categoryCounts.map(([_, c]) => c),
        backgroundColor: categoryCounts.map(
          (_, i) => CHART_COLORS[i % CHART_COLORS.length].bg,
        ),
        borderColor: categoryCounts.map(
          (_, i) => CHART_COLORS[i % CHART_COLORS.length].border,
        ),
        borderWidth: 1,
      },
    ],
  };

  const categoryDatasets = Array.from(activeCategories).map((cat, i) => {
    const { sortedYears, byCategoryYear } = categoryTimelineData;
    const series = byCategoryYear[cat];
    const data = sortedYears.map((y) => series?.[y] ?? 0);
    const color = CHART_COLORS[i % CHART_COLORS.length];
    return {
      label: cat,
      data,
      borderColor: color.border,
      backgroundColor: color.bg.replace('0.7', '0.2'),
      fill: true,
      tension: 0.3,
    };
  });

  const categoryTimelineChartData = {
    labels: categoryTimelineData.sortedYears,
    datasets: categoryDatasets,
  };

  const coauthorChartData = {
    labels: coauthorCounts.map(([n]) => n),
    datasets: [
      {
        label: 'Collaborative Articles',
        data: coauthorCounts.map(([_, c]) => c),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        <StatCard
          icon={<MenuBookIcon />}
          label="Total Articles"
          value={stats.totalPapers}
        />
        <StatCard
          icon={<CategoryIcon />}
          label="Research Fields"
          value={stats.totalCategories}
        />
        <StatCard
          icon={<GroupIcon />}
          label="Co-authors"
          value={stats.totalCoauthors}
        />
      </Box>

      {/* Publication Timeline */}
      <Card sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Publication Timeline
        </Typography>
        <Box sx={{ height: 350 }}>
          <Bar data={timelineChartData} options={{ ...chartOptions }} />
        </Box>
      </Card>

      {/* Research Field Trends */}
      <Card sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
          <Typography variant="h6">Research Field Trends</Typography>
          {activeCategories.size > 0 && (
            <Chip
              label="Clear Selected"
              onClick={() => setActiveCategories(new Set())}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click category labels to add/remove from the chart.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {categoryCounts.map(([name]) => (
            <Chip
              key={name}
              label={name}
              onClick={() => toggleCategory(name)}
              variant={activeCategories.has(name) ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>
        <Box sx={{ height: 350 }}>
          <Line data={categoryTimelineChartData} options={{ ...chartOptions }} />
        </Box>
      </Card>

      {/* Distribution + Top Collaborators */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Card sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Research Field Distribution
          </Typography>
          <Box sx={{ height: 300 }}>
            <Doughnut
              data={categoryChartData}
              options={{
                ...chartOptions,
                plugins: { legend: { position: 'right' as const } },
              }}
            />
          </Box>
        </Card>

        <Card sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Top Collaborators
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar
              data={coauthorChartData}
              options={{
                ...chartOptions,
                indexAxis: 'y' as const,
              }}
            />
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card sx={{ p: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
