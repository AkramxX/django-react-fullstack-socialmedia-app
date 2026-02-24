import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  get_user_profile_data,
  get_users_posts,
  toggleFollow,
  start_conversation,
} from "../api/endpoints";
import Post from "../components/post";
import { Button, Avatar, Spinner, Container } from "../components/ui";
import { HiOutlinePhotograph } from "react-icons/hi";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";

const UserProfile = () => {
  const get_username_from_url = () => {
    const url_split = window.location.pathname.split("/");
    return url_split[url_split.length - 1];
  };

  const [username, setUsername] = useState(get_username_from_url());

  useEffect(() => {
    setUsername(get_username_from_url());
  }, []);

  return (
    <Container size="lg" className="py-8">
      <div className="space-y-10">
        <UserDetails username={username} />
        <UserPosts username={username} />
      </div>
    </Container>
  );
};

const UserDetails = ({ username }) => {
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isOurProfile, setIsOurProfile] = useState(false);
  const [following, setFollowing] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const navigate = useNavigate();

  const handleToggleFollow = async () => {
    const data = await toggleFollow(username);
    if (data.now_following) {
      setFollowerCount(followerCount + 1);
      setFollowing(true);
    } else {
      setFollowerCount(followerCount - 1);
      setFollowing(false);
    }
  };

  const handleEditProfile = () => {
    navigate("/settings");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await get_user_profile_data(username);
        setBio(data.bio);
        setProfileImage(data.profile_image);
        setFollowerCount(data.followers_count);
        setFollowingCount(data.following_count);
        setIsOurProfile(data.is_our_profile);
        setFollowing(data.following);
        setCanMessage(data.can_message || false);
      } catch {
        console.log("error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <Avatar
          src={profileImage}
          name={username}
          size="xl"
          className="w-28 h-28 sm:w-36 sm:h-36 ring-4 ring-white shadow-lg"
        />

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-secondary-900">@{username}</h1>

          {/* Stats */}
          <div className="flex justify-center sm:justify-start gap-6 mt-4">
            <div className="text-center">
              <p className="text-xl font-semibold text-secondary-900">
                {followerCount}
              </p>
              <p className="text-sm text-secondary-600">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-secondary-900">
                {followingCount}
              </p>
              <p className="text-sm text-secondary-600">Following</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
            {isOurProfile ? (
              <Button variant="secondary" onClick={handleEditProfile}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant={following ? "secondary" : "primary"}
                  onClick={handleToggleFollow}
                >
                  {following ? "Unfollow" : "Follow"}
                </Button>
                {canMessage && (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      setStartingConversation(true);
                      try {
                        const result = await start_conversation(username);
                        navigate(`/messages/${result.id}`);
                      } catch (err) {
                        console.error("Failed to start conversation:", err);
                      } finally {
                        setStartingConversation(false);
                      }
                    }}
                    disabled={startingConversation}
                  >
                    <IoChatbubbleEllipsesOutline className="mr-1.5" size={18} />
                    Message
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-secondary-700 leading-relaxed max-w-2xl">{bio}</p>
      )}
    </div>
  );
};

const UserPosts = ({ username }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsData = await get_users_posts(username);
        setPosts(postsData);
      } catch {
        console.error("Error getting user posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [username]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-secondary-100 flex items-center justify-center">
          <HiOutlinePhotograph className="w-8 h-8 text-secondary-400" />
        </div>
        <h3 className="text-lg font-medium text-secondary-900">No posts yet</h3>
        <p className="mt-1 text-secondary-600">
          When posts are created, they'll show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-secondary-900 mb-4">Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
};

export default UserProfile;
