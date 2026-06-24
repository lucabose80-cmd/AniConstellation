import { TrackingData } from './tracking';
import { AniListMedia, getRecommendations } from './anilist';

export async function generateRecommendations(
  selectedReferences: TrackingData[],
  allTrackedMedia: TrackingData[]
): Promise<AniListMedia[]> {
  if (selectedReferences.length === 0) return [];

  // Calculate genre weights based on overall score
  const genreWeights: Record<string, number> = {};

  selectedReferences.forEach(item => {
    const score = item.evaluation?.overallScore || 5;
    const genres = item.classification?.genres || [];
    
    genres.forEach(genre => {
      if (!genreWeights[genre]) {
        genreWeights[genre] = 0;
      }
      genreWeights[genre] += score;
    });
  });

  // Sort genres by weight
  const sortedGenres = Object.entries(genreWeights)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  // Take top 3-4 genres to form a precise query
  const topGenres = sortedGenres.slice(0, 4);

  // Collect all tracked IDs to exclude them from the API query
  const excludeIds = allTrackedMedia.map(item => item.mediaId);

  if (topGenres.length === 0) return [];

  // Fetch from AniList
  return await getRecommendations(topGenres, excludeIds);
}
