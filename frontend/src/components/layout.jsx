import Navbar from "./navbar";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
};

export default Layout;
