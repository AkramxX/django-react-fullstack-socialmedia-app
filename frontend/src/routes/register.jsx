import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/endpoints";
import { Button, Input, Card } from "../components/ui";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(
        formData.username,
        formData.email,
        formData.firstName,
        formData.lastName,
        formData.password,
      );
      navigate("/login");
    } catch {
      setErrors({ submit: "Registration failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNav = () => {
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
      <Card className="w-full max-w-md" padding="lg">
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-secondary-900">
              Create an account
            </h1>
            <p className="mt-2 text-secondary-600">Join SocialHub today</p>
          </div>

          {errors.submit && (
            <div className="p-3 text-sm text-error-700 bg-error-50 border border-error-200 rounded-lg">
              {errors.submit}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange("username")}
              error={errors.username}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange("email")}
              error={errors.email}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                error={errors.firstName}
              />

              <Input
                label="Last Name"
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                error={errors.lastName}
              />
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange("password")}
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              error={errors.confirmPassword}
            />
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Create Account
            </Button>

            <p className="text-center text-sm text-secondary-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={handleNav}
                className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Register;
