import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { create_post } from "../api/endpoints";
import { Button, Textarea, Card, Container } from "../components/ui";

const CreatePost = () => {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const MAX_LENGTH = 350;

  const handlePost = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Please write something for your post");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await create_post(description);
      nav("/");
    } catch {
      setError("Failed to create post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="sm" className="py-8">
      <Card padding="lg">
        <form onSubmit={handlePost} className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-secondary-900">
              Create Post
            </h1>
            <p className="mt-2 text-secondary-600">Share what's on your mind</p>
          </div>

          {error && (
            <div className="p-3 text-sm text-error-700 bg-error-50 border border-error-200 rounded-lg">
              {error}
            </div>
          )}

          <Textarea
            label="What's happening?"
            placeholder="Write your post here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            maxLength={MAX_LENGTH}
            showCount
            error={error && !description.trim() ? "This field is required" : ""}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => nav(-1)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!description.trim()}
              className="flex-1"
            >
              Post
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  );
};

export default CreatePost;
