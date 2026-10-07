import { useInfiniteQuery } from '@tanstack/react-query';
import { listPosts } from '@/services/postsApi';
import { feedPosts, type PostsPage } from './cacheEdits';
import { FEED_PAGE_SIZE, POSTS_QUERY_KEY } from './constants';

async function fetchPage({ pageParam }: { pageParam: number }): Promise<PostsPage> {
  const posts = await listPosts({ limit: FEED_PAGE_SIZE, offset: pageParam });
  return { posts, fetched: posts.length };
}

/**
 * The next offset is this page's offset plus what the server sent for it
 * (never the edited or deduped list); a short page means the end.
 */
function nextOffset(lastPage: PostsPage, _all: PostsPage[], lastOffset: number) {
  return lastPage.fetched === FEED_PAGE_SIZE ? lastOffset + lastPage.fetched : undefined;
}

/**
 * The feed, newest first, `FEED_PAGE_SIZE` posts per page from
 * `GET /api/posts`. `data` is the flat list to show, each id once: a post
 * added or removed meanwhile shifts offset paging, so a page can repeat one.
 */
export function usePosts() {
  return useInfiniteQuery({
    queryKey: POSTS_QUERY_KEY,
    queryFn: fetchPage,
    initialPageParam: 0,
    getNextPageParam: nextOffset,
    select: feedPosts,
  });
}
