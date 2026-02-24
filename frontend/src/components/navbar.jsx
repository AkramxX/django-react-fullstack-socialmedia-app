import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { IoPersonOutline } from "react-icons/io5";
import { IoMdAddCircleOutline } from "react-icons/io";
import { FaHouse } from "react-icons/fa6";
import {
  IoSearch,
  IoClose,
  IoMenu,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import { IoMdSettings } from "react-icons/io";

import { IconButton } from "./ui";
import { useWebSocketContext } from "../contexts/WebSocketContext";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  // Get unread count from WebSocket context
  let unreadCount = 0;
  try {
    const wsContext = useWebSocketContext();
    unreadCount = wsContext?.unreadCount || 0;
  } catch {
    // Context not available (e.g., not wrapped in provider)
  }

  const handleNavigate = (route) => {
    nav(`/${route}`);
    setIsMobileMenuOpen(false);
  };

  const handleNavigateUser = () => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const username = JSON.parse(userData)["username"];
      nav(`/${username}`);
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    {
      icon: FaHouse,
      label: "Home",
      route: "",
      onClick: () => handleNavigate(""),
    },
    {
      icon: IoSearch,
      label: "Search",
      route: "search",
      onClick: () => handleNavigate("search"),
    },
    {
      icon: IoChatbubbleEllipsesOutline,
      label: "Messages",
      route: "messages",
      onClick: () => handleNavigate("messages"),
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : null,
    },
    {
      icon: IoMdAddCircleOutline,
      label: "Create",
      route: "create/post",
      onClick: () => handleNavigate("create/post"),
    },
    {
      icon: IoPersonOutline,
      label: "Profile",
      route: "profile",
      onClick: handleNavigateUser,
    },
    {
      icon: IoMdSettings,
      label: "Settings",
      route: "settings",
      onClick: () => handleNavigate("settings"),
    },
  ];

  return (
    <>
      {/* Main Navbar */}
      <header className="sticky top-0 z-40 w-full bg-primary-600 shadow-md">
        <nav className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Logo */}
          <button
            onClick={() => handleNavigate("")}
            className="text-xl sm:text-2xl font-bold text-white hover:text-primary-100 transition-colors"
          >
            SocialMedia
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.label} className="relative">
                <IconButton
                  variant="ghost"
                  size="md"
                  ariaLabel={item.label}
                  onClick={item.onClick}
                  className="text-white hover:bg-primary-500 hover:text-white focus:ring-primary-300"
                >
                  <item.icon size={20} />
                </IconButton>
                {/* Badge for unread count */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-bold text-white bg-error-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <IconButton
            variant="ghost"
            size="md"
            ariaLabel={isMobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:bg-primary-500 hover:text-white"
          >
            {isMobileMenuOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
          </IconButton>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
      />
    </>
  );
};

/**
 * Mobile Navigation Drawer Component
 */
const MobileDrawer = ({ isOpen, onClose, navItems }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200">
          <span className="text-lg font-semibold text-secondary-900">Menu</span>
          <IconButton
            variant="ghost"
            size="sm"
            ariaLabel="Close menu"
            onClick={onClose}
          >
            <IoClose size={20} />
          </IconButton>
        </div>

        {/* Navigation Links */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={item.onClick}
                  className="flex items-center gap-3 w-full px-4 py-3 text-secondary-700 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <div className="relative">
                    <item.icon size={20} />
                    {/* Badge for unread count */}
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-error-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
