export async function getGermanTitle(idMal: number, type: 'ANIME' | 'MANGA'): Promise<string | null> {
  try {
    const endpoint = type === 'ANIME' ? `anime/${idMal}` : `manga/${idMal}`;
    const response = await fetch(`https://api.jikan.moe/v4/${endpoint}`);
    
    if (!response.ok) {
      console.warn(`Jikan API failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const titles: { type: string, title: string }[] = data.data?.titles || [];
    
    const germanTitleObj = titles.find(t => t.type === 'German');
    if (germanTitleObj && germanTitleObj.title) {
      return germanTitleObj.title;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to fetch from Jikan API", error);
    return null;
  }
}
