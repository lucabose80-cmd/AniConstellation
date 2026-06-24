export interface JikanData {
  germanTitle: string | null;
  synopsis: string | null;
  score: number | null;
}

export async function getJikanData(idMal: number, type: 'ANIME' | 'MANGA'): Promise<JikanData> {
  const defaultData = { germanTitle: null, synopsis: null, score: null };
  try {
    const endpoint = type === 'ANIME' ? `anime/${idMal}` : `manga/${idMal}`;
    const response = await fetch(`https://api.jikan.moe/v4/${endpoint}`);
    
    if (!response.ok) {
      console.warn(`Jikan API failed with status: ${response.status}`);
      return defaultData;
    }

    const data = await response.json();
    const titles: { type: string, title: string }[] = data.data?.titles || [];
    
    const germanTitleObj = titles.find(t => t.type === 'German');
    
    return {
      germanTitle: (germanTitleObj && germanTitleObj.title) ? germanTitleObj.title : null,
      synopsis: data.data?.synopsis || null,
      score: data.data?.score || null
    };
  } catch (error) {
    console.error("Failed to fetch from Jikan API", error);
    return defaultData;
  }
}
