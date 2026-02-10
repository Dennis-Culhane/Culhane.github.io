// app/(public)/collaboration-network/CollaborationNetwork.tsx

'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import * as d3 from 'd3';
import type { ArticleWithCategories } from '@/lib/api/articles';

const MAIN_AUTHOR_ALIASES = [
  'Dennis P Culhane',
  'Dennis P. Culhane',
  'Dennis Culhane',
  'Culhane, Dennis P',
  'Culhane, Dennis P.',
  'Culhane, Dennis',
];

interface CollaborationNetworkProps {
  articles: ArticleWithCategories[];
}

interface NetworkNode {
  id: string;
  name: string;
  value: number;
  isMainAuthor: boolean;
}

interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

export function CollaborationNetwork({ articles }: CollaborationNetworkProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const nodeSelectionRef = useRef<d3.Selection<SVGCircleElement, NetworkNode, SVGGElement, unknown> | null>(null);
  const selectedAuthorRef = useRef<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { nodes, links, authorCollaborations, mainAuthorName } = useMemo(() => {
    const isMain = (n: string) =>
      MAIN_AUTHOR_ALIASES.some((a) => n.toLowerCase() === a.toLowerCase());

    const collaborationCount: Record<string, number> = {};
    const collaborationLinks: Record<string, number> = {};
    const authorArticles: Record<string, ArticleWithCategories[]> = {};

    let mainAuthorName = 'Dennis P. Culhane';
    const mainNameCounts: Record<string, number> = {};

    articles.forEach((article) => {
      const authorList = (article.authors ?? '')
        .split(/[,;]/)
        .map((a) => a.trim())
        .filter(Boolean);
      const hasMain = authorList.some(isMain);

      if (hasMain) {
        authorList.forEach((author) => {
          const name = isMain(author) ? mainAuthorName : author;
          if (isMain(author)) {
            mainNameCounts[name] = (mainNameCounts[name] ?? 0) + 1;
          }
          collaborationCount[name] = (collaborationCount[name] ?? 0) + 1;
          if (!authorArticles[name]) authorArticles[name] = [];
          authorArticles[name].push(article);

          if (name !== mainAuthorName) {
            const key = `${mainAuthorName}\x00${name}`;
            collaborationLinks[key] = (collaborationLinks[key] ?? 0) + 1;
          }
        });
      }
    });

    const mainFormat = Object.entries(mainNameCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (mainFormat) mainAuthorName = mainFormat;

    const nodeList: NetworkNode[] = Object.keys(collaborationCount).map((id) => ({
      id,
      name: id,
      value: collaborationCount[id],
      isMainAuthor: id === mainAuthorName,
    }));

    const linkList: NetworkLink[] = Object.entries(collaborationLinks).map(([key, value]) => {
      const [source, target] = key.split('\x00');
      return { source, target, value };
    });

    return {
      nodes: nodeList,
      links: linkList,
      authorCollaborations: authorArticles,
      mainAuthorName,
    };
  }, [articles]);

  const activeAuthor = selectedAuthor ?? mainAuthorName;
  const collaborationArticles = (authorCollaborations[activeAuthor] ?? []).sort((a, b) => {
        const da = a.published_date ? new Date(a.published_date).getTime() : 0;
        const db = b.published_date ? new Date(b.published_date).getTime() : 0;
    return db - da;
  });

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const container = svgRef.current;
    const width = container.clientWidth;
    const height = 600;

    d3.select(container).selectAll('*').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const nodeIds = new Set(nodes.map((n) => n.id));
    const validLinks = links.filter(
      (l) => nodeIds.has(l.source) && nodeIds.has(l.target),
    );

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3.forceLink(validLinks).id((d: unknown) => (d as { id: string }).id).distance(120),
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d: unknown) => Math.sqrt((d as NetworkNode).value) * 6 + 14),
      );

    const link = svg
      .append('g')
      .selectAll('line')
      .data(validLinks)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.35)
      .attr('stroke-width', (d) => Math.min(2, Math.sqrt(d.value)));

    const node = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('class', 'node')
      .attr('r', (d) => Math.sqrt(d.value) * 5 + 5)
      .attr('fill', (d) => (d.isMainAuthor ? '#87CEEB' : '#B0E0E6'))
      .attr('cursor', 'pointer')
      .style('stroke', 'transparent')
      .style('stroke-width', 2)
      .call(
        d3
          .drag<SVGCircleElement, NetworkNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            (d as d3.SimulationNodeDatum & { fx: number }).fx = d.x;
            (d as d3.SimulationNodeDatum & { fy: number }).fy = d.y;
          })
          .on('drag', (event, d) => {
            (d as d3.SimulationNodeDatum & { fx: number }).fx = event.x;
            (d as d3.SimulationNodeDatum & { fy: number }).fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            (d as d3.SimulationNodeDatum & { fx: number }).fx = null;
            (d as d3.SimulationNodeDatum & { fy: number }).fy = null;
          }),
      )
      .on('click', (_, d) => {
        setSelectedAuthor(d.id);
      });

    nodeSelectionRef.current = node;
    selectedAuthorRef.current = selectedAuthor;

    const tooltip = d3.select(container).append('div').attr('id', 'collab-tooltip').style('position', 'absolute').style('pointer-events', 'none').style('opacity', 0).style('background', 'rgba(0,0,0,0.8)').style('color', '#fff').style('padding', '8px 12px').style('border-radius', '4px').style('font-size', '12px').style('z-index', '1000');

    node
      .on('mouseover', function (event, d) {
        d3.select(this).style('stroke', 'rgba(100,150,200,0.8)').style('stroke-width', 2);
        tooltip
          .style('opacity', 1)
          .html(`${d.name}<br/><small>Collaborative Articles: ${d.value}</small>`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function (_, d) {
        const isSelected = d.id === selectedAuthorRef.current;
        d3.select(this)
          .style('stroke', isSelected ? 'rgba(100,150,200,0.9)' : 'transparent')
          .style('stroke-width', isSelected ? 3 : 2);
        tooltip.style('opacity', 0);
      });

    const label = svg
      .append('g')
      .selectAll('text')
      .data(nodes.filter((d) => d.isMainAuthor))
      .join('text')
      .attr('dx', (d) => Math.sqrt(d.value) * 5 + 10)
      .attr('dy', '.35em')
      .text((d) => d.name)
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('pointer-events', 'none')
      .style('fill', 'currentColor');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as { x: number }).x)
        .attr('y1', (d) => (d.source as { y: number }).y)
        .attr('x2', (d) => (d.target as { x: number }).x)
        .attr('y2', (d) => (d.target as { y: number }).y);

      node
        .attr('cx', (d) => {
          const dNode = d as NetworkNode & { x: number; y: number };
          dNode.x = Math.max(20, Math.min(width - 20, dNode.x));
          return dNode.x;
        })
        .attr('cy', (d) => {
          const dNode = d as NetworkNode & { x: number; y: number };
          dNode.y = Math.max(20, Math.min(height - 20, dNode.y));
          return dNode.y;
        });

      label
        .attr('x', (d) => (d as NetworkNode & { x: number }).x)
        .attr('y', (d) => (d as NetworkNode & { y: number }).y);
    });

    return () => {
      nodeSelectionRef.current = null;
      simulation.stop();
      d3.select(container).selectAll('*').remove();
    };
  }, [nodes, links]);

  useEffect(() => {
    selectedAuthorRef.current = selectedAuthor;
    const sel = nodeSelectionRef.current;
    if (!sel) return;
    const term = searchTerm.toLowerCase();
    sel
      .attr('opacity', (d) =>
        !term || d.name.toLowerCase().includes(term) ? 1 : 0.2,
      )
      .style('stroke', (d) =>
        d.id === selectedAuthor ? 'rgba(100,150,200,0.9)' : 'transparent',
      )
      .style('stroke-width', (d) => (d.id === selectedAuthor ? 3 : 2));
  }, [searchTerm, selectedAuthor]);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search collaborator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Card
          sx={{
            p: 2,
            height: 600,
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div ref={svgRef} style={{ width: '100%', height: '100%' }} />
        </Card>
      </Box>

      <Box sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <Card
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            {selectedAuthor ?? mainAuthorName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Collaborative Articles:{' '}
            {selectedAuthor
              ? authorCollaborations[selectedAuthor]?.length ?? 0
              : authorCollaborations[mainAuthorName]?.length ?? 0}
          </Typography>
        </Card>

        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Collaborative Articles
        </Typography>
        <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
          {collaborationArticles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Click an author node to view collaborative articles.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {collaborationArticles.map((article) => (
                <Box
                  key={article.id}
                  component={Link}
                  href={`/article/${article.slug}`}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {article.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {article.published_date
                      ? new Date(article.published_date).toLocaleDateString('en-US')
                      : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
