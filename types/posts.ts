export type PostType = {
  id: number;
  author: string;
  contentIPFS: string;
  timestamp: number;
  likesCount: number;
  isDeleted: boolean;
  isLikedByUser?: boolean;
};
