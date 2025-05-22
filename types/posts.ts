export type PostType = {
  id: number;
  author: string;
  contentIPFS: string;
  timestamp: number;
  likesCount: number;
  isDeleted: boolean;
  isLikedByUser?: boolean;
};

export type PostMedia = {
  hash: string;
  url: string | null;
  type: 'image' | 'video' | 'unknown';
};

export type ParsedPostContent = {
  text: string;
  mediaHashes: string[];
  media?: PostMedia[];
};
