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
  type?: string;
  fx?: number;
  fy?: number;
}

interface LinkData {
  source: string;
  target: string;
  label?: string;
  linkType: 'ADAPTATION' | 'FRANCHISE' | 'THEMATIC';
}

interface ConstellationMapProps {
  trackingData: TrackingData[];
  recommendations?: AniListMedia[];
  onNodeClick: (id: number) => void;
  filterBy: 'GENRES' | 'ROMANCE' | 'RATING' | 'ALL' | 'SOURCE';
}

export default function ConstellationMap({ trackingData, recommendations = [], onNodeClick, filterBy }: ConstellationMapProps) {
  const [graphData, setGraphData] = useState<{ nodes: NodeData[], links: LinkData[] }>({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
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
        type: rec.type,
        fx: centerX + radius * Math.cos(angle),
        fy: centerY + radius * Math.sin(angle)
      });
    });

    const finalLinks: LinkData[] = [];
    const simLinks: Array<{ source: string; target: string; similarity: number; label: string }> = [];
    
    // Helpers to define families (Counterparts & Franchises)
    const isSameFranchise = (a: any, b: any) => Boolean(a && b && a.title.length > 3 && b.title.length > 3 && (a.title.startsWith(b.title) || b.title.startsWith(a.title)));

    // Create links based on filter
    const regularNodes = nodes.filter(n => !n.isRecommendation);
    for (let i = 0; i < regularNodes.length; i++) {
      for (let j = i + 1; j < regularNodes.length; j++) {
        const dataA = regularNodes[i].data;
        const dataB = regularNodes[j].data;
        if (!dataA || !dataB) continue;
        
        // Always connect family members directly
        if (isSameFranchise(dataA, dataB)) {
          const isAdaptation = dataA.type !== dataB.type;
          finalLinks.push({
            source: regularNodes[i].id,
            target: regularNodes[j].id,
            label: isAdaptation ? 'Adaptation' : 'Franchise / Serie',
            linkType: isAdaptation ? 'ADAPTATION' : 'FRANCHISE'
          });
          continue; 
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

        if (filterBy === 'SOURCE') {
          if (dataA?.type && dataA.type === dataB?.type) {
            similarity += 2;
            reasons.push(`Medium: ${dataA.type === 'ANIME' ? 'Anime' : 'Manga'}`);
          }
        }

        if (similarity > 1) {
          simLinks.push({
            source: regularNodes[i].id,
            target: regularNodes[j].id,
            similarity,
            label: reasons.join(' \n ')
          });
        }
      }
    }

    // Filter redundant similarity links to the same family
    const linksToRemove = new Set<typeof simLinks[0]>();

    for (let i = 0; i < regularNodes.length; i++) {
      const nodeId = regularNodes[i].id;
      const connectedLinks = simLinks.filter(l => (l.source === nodeId || l.target === nodeId) && !linksToRemove.has(l));
      
      for (let x = 0; x < connectedLinks.length; x++) {
        for (let y = x + 1; y < connectedLinks.length; y++) {
          const linkX = connectedLinks[x];
          const linkY = connectedLinks[y];
          
          if (linksToRemove.has(linkX) || linksToRemove.has(linkY)) continue;

          const targetX = linkX.source === nodeId ? linkX.target : linkX.source;
          const targetY = linkY.source === nodeId ? linkY.target : linkY.source;

          const nodeX = regularNodes.find(n => n.id === targetX);
          const nodeY = regularNodes.find(n => n.id === targetY);
          
          if (nodeX && nodeY && isSameFranchise(nodeX.data, nodeY.data)) {
            // Node i is connecting to two members of the same franchise. Drop the weaker link.
            let dropLink;
            if (linkX.similarity < linkY.similarity) {
              dropLink = linkX;
            } else if (linkX.similarity > linkY.similarity) {
              dropLink = linkY;
            } else {
              // Tie-breaker: Overall score
              const scoreX = nodeX.data?.evaluation?.overallScore || 0;
              const scoreY = nodeY.data?.evaluation?.overallScore || 0;
              if (scoreX < scoreY) {
                dropLink = linkX;
              } else {
                dropLink = linkY;
              }
            }
            linksToRemove.add(dropLink);
          }
        }
      }
    }

    // Combine finalLinks with the remaining simLinks
    simLinks.forEach(link => {
      if (!linksToRemove.has(link)) {
        finalLinks.push({ source: link.source, target: link.target, label: link.label, linkType: 'THEMATIC' });
      }
    });

    setGraphData({ nodes, links: finalLinks });
  }, [trackingData, recommendations, dimensions, filterBy]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-600); // Mehr Platz zwischen den Nodes
      fgRef.current.d3Force('link').distance((link: any) => {
        if (link.linkType === 'ADAPTATION') return 10;
        if (link.linkType === 'FRANCHISE') return 40;
        return 180; // THEMATIC far apart
      });
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const size = Math.max(3, node.val);
    const isManga = node.data?.type === 'MANGA' || node.type === 'MANGA';
    
    // Base Colors
    const colorFill = isManga ? '#00E5FF' : '#FFD700';
    const colorStroke = isManga ? '#006064' : '#5D4037';
    
    // Draw Glow
    if (node.val > 7 || node.isRecommendation) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 2.5, 0, 2 * Math.PI, false);
      const intensity = node.isRecommendation ? 0.6 : Math.min(0.6, (node.val - 5) * 0.15);
      ctx.fillStyle = isManga ? `rgba(0, 229, 255, ${intensity})` : `rgba(255, 215, 0, ${intensity})`;
      ctx.fill();
    }

    // Draw Node Base
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = colorFill;
    ctx.fill();
    
    // Draw stroke
    ctx.strokeStyle = node.isRecommendation ? '#FFF' : colorStroke;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Score Badge Below Star
    const typeIndicator = node.data?.type === 'MANGA' || node.type === 'MANGA' ? 'M' : 'A';
    const scoreText = node.isRecommendation ? 'NEU' : `${node.val.toFixed(1)}`;
    const label = `${typeIndicator} | ${scoreText}`;
    const fontSize = Math.max(8, size * 0.9);
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    
    // Background Pill
    const paddingX = 4;
    const paddingY = 2;
    const badgeY = node.y + size + 4;
    
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

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    if (link.linkType === 'ADAPTATION') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // Bright energy beam
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
    } else if (link.linkType === 'FRANCHISE') {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'; // Solid gold for franchise
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
    } else {
      // THEMATIC - Antike Sternenkarte Style
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Semi-transparent white
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]); // Dashed line
    }
    
    ctx.stroke();
    // Reset line dash for next renders just in case
    ctx.setLineDash([]);
  }, []);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle at center, #1B1035 0%, #080414 100%)' }}>
      {/* Optional: Add some CSS stars for background texture */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3, pointerEvents: 'none', backgroundImage: 'radial-gradient(#FFF 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      {graphData.nodes.length > 0 ? (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          nodeRelSize={2}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
          onNodeHover={(node: any) => setHoverNode(node || null)}
          linkLabel={(link: any) => link.label ? `<div style="background: rgba(0,0,0,0.85); border: 1px solid rgba(255,255,255,0.2); padding: 8px; border-radius: 8px; font-family: Inter, sans-serif; font-size: 12px; color: #fff; text-align: center;">${link.label.replace(/\n/g, '<br/>')}</div>` : ''}
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
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {hoverNode.data?.type === 'MANGA' || hoverNode.type === 'MANGA' ? 'Manga' : 'Anime'}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
            Score: {hoverNode.val} / 10
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
