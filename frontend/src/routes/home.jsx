import { useEffect, useState } from "react";
import { get_posts } from "../api/endpoints";
import Post from "../components/post";
import { Button, Spinner, Container } from "../components/ui";
import { HiOutlineNewspaper } from "react-icons/hi2";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(1);

  const fetchData = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    }
    try {
      const data = await get_posts(nextPage);
      setPosts(isLoadMore ? [...posts, ...data.results] : data.results);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch {
      console.error("Error getting posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadMorePosts = () => {
    if (nextPage) {
      fetchData(true);
    }
  };

  return (
    <Container size="md" className="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">Feed</h1>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : posts.length > 0 ? (
          <div className="flex flex-col items-center gap-6">
            {posts.map((post) => (
              <Post
                key={post.id}
                id={post.id}
                username={post.username}
                description={post.description}
                formatted_date={post.formatted_date}
                liked={post.liked}
                like_count={post.like_count}
              />
            ))}

            {/* Load More Button */}
            {nextPage && (
              <Button
                variant="secondary"
                onClick={loadMorePosts}
                isLoading={loadingMore}
                className="w-full max-w-md"
              >
                Load More Posts
              </Button>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </Container>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 mb-4 rounded-full bg-secondary-100 flex items-center justify-center">
      <HiOutlineNewspaper className="w-8 h-8 text-secondary-400" />
    </div>
    <h3 className="text-lg font-medium text-secondary-900">No posts yet</h3>
    <p className="mt-1 text-secondary-600">
      Follow some users to see their posts here!
    </p>
  </div>
);

export default Home;
