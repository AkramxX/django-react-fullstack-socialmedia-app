import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { update_user, logout } from "../api/endpoints";
import { Button, Input, Textarea, Card, Container } from "../components/ui";

const Settings = () => {
  const storage = JSON.parse(localStorage.getItem("userData"));

  const [formData, setFormData] = useState({
    username: storage?.username || "",
    email: storage?.email || "",
    firstName: storage?.first_name || "",
    lastName: storage?.last_name || "",
    bio: storage?.bio || "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const nav = useNavigate();

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      nav("/login");
    } catch {
      setError("Error logging out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await update_user({
        username: formData.username,
        profile_image: profileImage,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
      });
      localStorage.setItem(
        "userData",
        JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          bio: formData.bio,
        }),
      );
      setSuccess("Profile updated successfully!");
    } catch {
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="sm" className="py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
          <p className="mt-1 text-secondary-600">Manage your account</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleUpdate} className="space-y-5">
            <h2 className="text-lg font-semibold text-secondary-900">
              Profile Information
            </h2>

            {success && (
              <div className="p-3 text-sm text-success-700 bg-success-50 border border-success-200 rounded-lg">
                {success}
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-error-700 bg-error-50 border border-error-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Profile Picture"
                type="file"
                onChange={(e) => setProfileImage(e.target.files[0])}
              />

              <Input
                label="Username"
                type="text"
                value={formData.username}
                onChange={handleChange("username")}
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange("firstName")}
                />
                <Input
                  label="Last Name"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange("lastName")}
                />
              </div>

              <Textarea
                label="Bio"
                value={formData.bio}
                onChange={handleChange("bio")}
                rows={4}
                maxLength={500}
                showCount
                placeholder="Tell us about yourself..."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card padding="lg" className="border-error-200">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Account
          </h2>
          <Button
            variant="danger"
            onClick={handleLogout}
            isLoading={isLoggingOut}
          >
            Log Out
          </Button>
        </Card>
      </div>
    </Container>
  );
};

export default Settings;
