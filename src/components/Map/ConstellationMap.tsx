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
        let similarity = 0;
        const dataA = regularNodes[i].data;
        const dataB = regularNodes[j].data;
        
        if (filterBy === 'ALL' || filterBy === 'GENRES') {
          const genresA = dataA?.classification?.genres || [];
          const genresB = dataB?.classification?.genres || [];
          const sharedGenres = genresA.filter(g => genresB.includes(g)).length;
          if (sharedGenres > 1) similarity += sharedGenres;
        }
        
        if (filterBy === 'ALL' || filterBy === 'ROMANCE') {
          if (dataA?.classification?.romanceLevel && 
              dataA.classification.romanceLevel !== 'None' &&
              dataA.classification.romanceLevel === dataB?.classification?.romanceLevel) {
            similarity += 3;
          }
        }

        if (filterBy === 'ALL' || filterBy === 'RATING') {
          const diff = Math.abs((dataA?.evaluation?.overallScore || 0) - (dataB?.evaluation?.overallScore || 0));
          if (diff <= 1 && (dataA?.evaluation?.overallScore || 0) > 7) {
            similarity += 2;
          }
        }

        if (similarity > 1) {
          links.push({
            source: regularNodes[i].id,
            target: regularNodes[j].id
          });
        }
      }
    }

    setGraphData({ nodes, links });
  }, [trackingData, recommendations, dimensions, filterBy]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const size = Math.max(2, node.val);
    
    if (node.isRecommendation) {
      // Draw golden glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = `rgba(255, 215, 0, 0.4)`; // Gold
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FFD700'; // Gold center
      ctx.fill();
    } else {
      // Draw standard glow for high scores
      if (node.val > 7) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 2, 0, 2 * Math.PI, false);
        ctx.fillStyle = `rgba(208, 188, 255, ${Math.min(0.8, (node.val - 6) * 0.15)})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#D0BCFF'; // Primary MD3 color
      ctx.fill();
    }
    
    // Draw stroke
    ctx.strokeStyle = node.isRecommendation ? '#FFD700' : '#381E72';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Score
    const label = node.isRecommendation ? 'NEU' : `${node.val.toFixed(1)}`;
    const fontSize = size * 0.8;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // White text with black outline for readability
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeText(label, node.x, node.y);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, node.x, node.y);

  }, []);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle at center, #2B1B54 0%, #0F0A1F 100%)' }}>
      {graphData.nodes.length > 0 ? (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          nodeRelSize={2}
          onNodeHover={(node: any) => setHoverNode(node || null)}
          onNodeClick={(node: any) => onNodeClick(parseInt(node.id.toString().replace('rec-', '')))}
          linkColor={() => 'rgba(208, 188, 255, 0.25)'}
          backgroundColor="transparent"
          linkDirectionalParticles={2}
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
