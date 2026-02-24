import { useAuth } from "../contexts/useAuth";
import { Navigate } from "react-router-dom";
import { Spinner } from "./ui";

const PrivateRoute = ({ children }) => {
  const { auth, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }
  if (auth) {
    return children;
  } else {
    return <Navigate to="/login" />;
  }
};
export default PrivateRoute;
