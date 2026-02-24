import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toggleLike } from "../api/endpoints";
import { Card, IconButton } from "./ui";

const Post = ({
  id,
  username,
  description,
  formatted_date,
  liked,
  like_count,
}) => {
  const [clientLiked, setClientLiked] = useState(liked);
  const [clientLikeCount, setClientLikeCount] = useState(like_count);
  const navigate = useNavigate();

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    const data = await toggleLike(id);
    if (data.now_liked) {
      setClientLiked(true);
      setClientLikeCount(clientLikeCount + 1);
    } else {
      setClientLiked(false);
      setClientLikeCount(clientLikeCount - 1);
    }
  };

  const handleNavigateToProfile = () => {
    navigate(`/${username}`);
  };

  return (
    <Card
      padding="none"
      hoverable
      className="w-full max-w-md overflow-hidden transition-transform hover:scale-[1.01]"
    >
      {/* Header */}
      <div
        onClick={handleNavigateToProfile}
        className="flex items-center px-4 py-3 bg-secondary-50 border-b border-secondary-200 cursor-pointer hover:bg-secondary-100 transition-colors"
      >
        <span className="text-sm font-medium text-secondary-700">
          @{username}
        </span>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-50 p-6">
        <p className="text-center text-secondary-800 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary-50 border-t border-secondary-200">
        <div className="flex items-center gap-2">
          <IconButton
            variant={clientLiked ? "danger" : "ghost"}
            size="sm"
            ariaLabel={clientLiked ? "Unlike post" : "Like post"}
            onClick={handleToggleLike}
            className={clientLiked ? "text-error-500 hover:text-error-600" : ""}
          >
            {clientLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
          </IconButton>
          <span className="text-sm font-medium text-secondary-600">
            {clientLikeCount}
          </span>
        </div>
        <span className="text-sm text-secondary-500">{formatted_date}</span>
      </div>
    </Card>
  );
};

export default Post;
