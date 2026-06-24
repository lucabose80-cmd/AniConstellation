'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { TrackingData } from '@/lib/tracking';
import { AniListMedia } from '@/lib/anilist';
import { Box, Typography, Paper } from '@mui/material';

interface NodeData {
  id: string;
  name: string;
  img: string;
  val: number;
  data?: TrackingData;
  isRecommendation?: boolean;
  fx?: number;
  fy?: number;
}

interface LinkData {
  source: string;
  target: string;
  label?: string;
  isCounterpart?: boolean;
}

interface ConstellationMapProps {
  trackingData: TrackingData[];
  recommendations?: AniListMedia[];
  onNodeClick: (id: number) => void;
  filterBy: 'GENRES' | 'ROMANCE' | 'RATING' | 'ALL';
}

export default function ConstellationMap({ trackingData, recommendations = [], onNodeClick, filterBy }: ConstellationMapProps) {
  const [graphData, setGraphData] = useState<{ nodes: NodeData[], links: LinkData[] }>({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoverNode, setHoverNode] = useState<NodeData | null>(null);
  const [hoverLink, setHoverLink] = useState<LinkData | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
      
      const handleResize = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
          });
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const nodes: NodeData[] = trackingData.map(item => ({
      id: item.mediaId.toString(),
      name: item.title || 'Unknown',
      img: item.coverImage || '',
      val: item.evaluation?.overallScore || 2,
      data: item
    }));

    // Add recommendation nodes (spawn closer to center in a ring)
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    recommendations.forEach((rec, index) => {
      const angle = (index / recommendations.length) * 2 * Math.PI;
      const radius = 250;
      nodes.push({
        id: `rec-${rec.id}`,
        name: rec.title.english || rec.title.romaji,
        img: rec.coverImage.large,
        val: 8,
        isRecommendation: true,
        fx: centerX + radius * Math.cos(angle),
        fy: centerY + radius * Math.sin(angle)
      });
    });

    const links: LinkData[] = [];
    
    // Create links based on filter
    const regularNodes = nodes.filter(n => !n.isRecommendation);
    for (let i = 0; i < regularNodes.length; i++) {
      for (let j = i + 1; j < regularNodes.length; j++) {
        const dataA = regularNodes[i].data;
        const dataB = regularNodes[j].data;
        
        // Counterpart Link
        if (dataA && dataB && dataA.title === dataB.title && dataA.type !== dataB.type) {
          links.push({
            source: regularNodes[i].id,
            target: regularNodes[j].id,
            label: 'Adaptation',
            isCounterpart: true
          });
          continue; // Skip other similarity checks for counterparts
        }
        
        // Franchise / Sequel Link
        if (dataA && dataB && dataA.type === dataB.type && dataA.title.length > 3 && dataB.title.length > 3) {
          if (dataA.title.startsWith(dataB.title) || dataB.title.startsWith(dataA.title)) {
             links.push({
               source: regularNodes[i].id,
               target: regularNodes[j].id,
               label: 'Franchise / Serie',
               isCounterpart: true // Re-use the dashed yellow line style
             });
             continue;
          }
        }

        let similarity = 0;
        let reasons: string[] = [];
        
        if (filterBy === 'ALL' || filterBy === 'GENRES') {
          const genresA = dataA?.classification?.genres || [];
          const genresB = dataB?.classification?.genres || [];
          const sharedGenres = genresA.filter(g => genresB.includes(g));
          if (sharedGenres.length > 1) {
            similarity += sharedGenres.length;
            reasons.push(`Geteilte Genres (${sharedGenres.join(', ')})`);
          }
        }
        
        if (filterBy === 'ALL' || filterBy === 'ROMANCE') {
          if (dataA?.classification?.romanceLevel && 
              dataA.classification.romanceLevel !== 'None' &&
              dataA.classification.romanceLevel === dataB?.classification?.romanceLevel) {
            similarity += 3;
            reasons.push(`Romance-Level: ${dataA.classification.romanceLevel}`);
          }
        }

        if (filterBy === 'ALL' || filterBy === 'RATING') {
          const diff = Math.abs((dataA?.evaluation?.overallScore || 0) - (dataB?.evaluation?.overallScore || 0));
          if (diff <= 1 && (dataA?.evaluation?.overallScore || 0) > 7) {
            similarity += 2;
            reasons.push(`Beide Top-Tier bewertet`);
          }
        }

        if (similarity > 1) {
          links.push({
            source: regularNodes[i].id,
            target: regularNodes[j].id,
            label: reasons.join(' \n ')
          });
        }
      }
    }

    setGraphData({ nodes, links });
  }, [trackingData, recommendations, dimensions, filterBy]);

  // Helper to draw a 5-point star
  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const size = Math.max(3, node.val);
    const outerRadius = size * 1.5;
    const innerRadius = size * 0.7;
    
    // Draw Glow
    if (node.isRecommendation) {
      drawStar(ctx, node.x, node.y, 5, outerRadius * 1.8, innerRadius * 1.8);
      ctx.fillStyle = `rgba(255, 215, 0, 0.4)`; // Gold glow
      ctx.fill();
    } else if (node.val > 7) {
      drawStar(ctx, node.x, node.y, 5, outerRadius * 1.8, innerRadius * 1.8);
      ctx.fillStyle = `rgba(255, 215, 0, ${Math.min(0.6, (node.val - 6) * 0.15)})`;
      ctx.fill();
    }

    // Draw Star Base
    drawStar(ctx, node.x, node.y, 5, outerRadius, innerRadius);
    ctx.fillStyle = '#FFD700'; // Gold center
    ctx.fill();
    
    // Draw stroke
    ctx.strokeStyle = node.isRecommendation ? '#FFF' : '#B8860B';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Score Badge Below Star
    const label = node.isRecommendation ? 'NEU' : `${node.val.toFixed(1)}`;
    const fontSize = Math.max(8, size * 0.9);
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    
    // Background Pill
    const paddingX = 4;
    const paddingY = 2;
    const badgeY = node.y + outerRadius + 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(
      node.x - textWidth / 2 - paddingX, 
      badgeY, 
      textWidth + paddingX * 2, 
      fontSize + paddingY * 2,
      4
    );
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, node.x, badgeY + paddingY + 1);

  }, []);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;
    if (typeof start !== 'object' || typeof end !== 'object') return;

    // Line drawing
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = link.isCounterpart ? 'rgba(255, 215, 0, 0.8)' : 'rgba(208, 188, 255, 0.25)';
    ctx.lineWidth = link.isCounterpart ? 2 : 1;
    if (link.isCounterpart) ctx.setLineDash([5, 5]); // Dashed line for adaptations
    else ctx.setLineDash([]);
    ctx.stroke();

    // Text label in the middle, only if hovered
    const isHovered = hoverLink && 
                      ((hoverLink.source as any).id === start.id && (hoverLink.target as any).id === end.id);

    if (link.label && isHovered) {
      const midX = start.x + (end.x - start.x) / 2;
      const midY = start.y + (end.y - start.y) / 2;
      
      const fontSize = 10;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      
      // Handle multiline text
      const lines = link.label.split(' \n ');
      let maxWidth = 0;
      lines.forEach((line: string) => {
        const w = ctx.measureText(line).width;
        if (w > maxWidth) maxWidth = w;
      });
      
      const padding = 6;
      const bgWidth = maxWidth + padding * 2;
      const bgHeight = (lines.length * (fontSize + 4)) + padding;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.roundRect(midX - bgWidth / 2, midY - bgHeight / 2, bgWidth, bgHeight, 6);
      ctx.fill();
      ctx.strokeStyle = link.isCounterpart ? 'rgba(255, 215, 0, 0.5)' : 'rgba(208, 188, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = link.isCounterpart ? '#FFD700' : '#EADDFF';
      
      const startY = midY - (lines.length * (fontSize + 4)) / 2 + (fontSize / 2) + 2;
      lines.forEach((line: string, idx: number) => {
        ctx.fillText(line, midX, startY + idx * (fontSize + 4));
      });
    }
  }, [hoverLink]);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle at center, #2B1B54 0%, #0F0A1F 100%)' }}>
      {graphData.nodes.length > 0 ? (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          nodeRelSize={2}
          onNodeHover={(node: any) => setHoverNode(node || null)}
          onLinkHover={(link: any) => setHoverLink(link || null)}
          linkHoverPrecision={10}
          onNodeClick={(node: any) => onNodeClick(parseInt(node.id.toString().replace('rec-', '')))}
          backgroundColor="transparent"
          linkDirectionalParticles={0}
          linkDirectionalParticleWidth={1.5}
        />
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="text.secondary">No works tracked yet. Use the search to add some!</Typography>
        </Box>
      )}

      {hoverNode && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 250,
            p: 2,
            pointerEvents: 'none',
            borderRadius: 2,
            bgcolor: 'background.paper',
            zIndex: 10
          }}
        >
          {hoverNode.img && (
            <Box 
              component="img" 
              src={hoverNode.img} 
              sx={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 1, mb: 1 }} 
            />
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} noWrap>
            {hoverNode.name}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
            Score: {hoverNode.val} / 10
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
