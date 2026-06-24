'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { TrackingData } from '@/lib/tracking';
import { Box, Typography, Paper } from '@mui/material';

interface NodeData {
  id: string;
  name: string;
  img: string;
  val: number;
  data: TrackingData;
}

interface LinkData {
  source: string;
  target: string;
}

interface ConstellationMapProps {
  trackingData: TrackingData[];
  onNodeClick: (id: number) => void;
}

export default function ConstellationMap({ trackingData, onNodeClick }: ConstellationMapProps) {
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
      val: item.evaluation?.overallScore || 2, // Size based on score
      data: item
    }));

    const links: LinkData[] = [];
    
    // Create links between items that share genres or romance level to create clusters
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let similarity = 0;
        
        // Match genres
        const genresA = nodes[i].data.classification?.genres || [];
        const genresB = nodes[j].data.classification?.genres || [];
        const sharedGenres = genresA.filter(g => genresB.includes(g)).length;
        if (sharedGenres > 0) similarity += sharedGenres;
        
        // Match romance level
        if (nodes[i].data.classification?.romanceLevel && 
            nodes[i].data.classification?.romanceLevel !== 'None' &&
            nodes[i].data.classification?.romanceLevel === nodes[j].data.classification?.romanceLevel) {
          similarity += 2;
        }

        if (similarity > 1) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id
          });
        }
      }
    }

    setGraphData({ nodes, links });
  }, [trackingData]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const size = Math.max(2, node.val);
    
    // Draw glow for high scores
    if (node.val > 7) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = `rgba(208, 188, 255, ${Math.min(0.8, (node.val - 6) * 0.15)})`;
      ctx.fill();
    }

    // Draw node background
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#D0BCFF'; // Primary MD3 color
    ctx.fill();
    
    // Draw stroke
    ctx.strokeStyle = '#381E72';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {graphData.nodes.length > 0 ? (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          nodeRelSize={2}
          onNodeHover={(node: any) => setHoverNode(node || null)}
          onNodeClick={(node: any) => onNodeClick(parseInt(node.id))}
          linkColor={() => 'rgba(208, 188, 255, 0.15)'}
          backgroundColor="#1C1B1F"
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
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {hoverNode.name}
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="bold">
            Score: {hoverNode.val} / 10
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
