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

export async function searchMedia(query: string): Promise<AniListMedia[]> {
  const graphqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 12) {
        media(search: $search, sort: POPULARITY_DESC) {
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

  const variables = { search: query };

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
        relations {
          edges {
            relationType
            node {
              id
              type
              title {
                romaji
              }
              status
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
