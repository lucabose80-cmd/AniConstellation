const ANILIST_API_URL = 'https://graphql.anilist.co';

export interface AniListMedia {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    large: string;
  };
  type: 'ANIME' | 'MANGA';
  format: string;
  status: string;
  relations?: {
    edges: Array<{
      relationType: string;
      node: AniListMedia;
    }>;
  };
}

export async function searchMedia(query: string, type: 'ANIME' | 'MANGA' = 'ANIME'): Promise<AniListMedia[]> {
  const graphqlQuery = `
    query ($search: String, $type: MediaType) {
      Page(page: 1, perPage: 20) {
        media(search: $search, type: $type, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          type
          format
          status
        }
      }
    }
  `;

  const variables = { search: query, type };

  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query: graphqlQuery, variables }),
  });

  const data = await response.json();
  return data.data?.Page?.media || [];
}

export async function getMediaDetails(id: number): Promise<AniListMedia | null> {
  const graphqlQuery = `
    query ($id: Int) {
      Media(id: $id) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        type
        format
        status
        genres
        description
        relations {
          edges {
            relationType
            node {
              id
              type
              title {
                romaji
                english
              }
            }
          }
        }
      }
    }
  `;

  const variables = { id };

  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query: graphqlQuery, variables }),
  });

  const data = await response.json();
  return data.data?.Media || null;
}

export async function getRecommendations(genres: string[], excludeIds: number[]): Promise<AniListMedia[]> {
  const graphqlQuery = `
    query ($genres: [String], $excludeIds: [Int]) {
      Page(page: 1, perPage: 10) {
        media(genre_in: $genres, id_not_in: $excludeIds, sort: SCORE_DESC, type: ANIME) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          type
          format
          status
        }
      }
    }
  `;

  const variables = { genres, excludeIds };

  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query: graphqlQuery, variables }),
  });

  const data = await response.json();
  return data.data?.Page?.media || [];
}
