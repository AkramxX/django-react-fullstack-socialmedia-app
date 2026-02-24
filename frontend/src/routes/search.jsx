import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { search_users } from "../api/endpoints";
import {
  Button,
  Input,
  Avatar,
  Card,
  Container,
  Spinner,
} from "../components/ui";
import { HiOutlineSearch, HiOutlineUserGroup } from "react-icons/hi";

const Search = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!search.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const results = await search_users(search);
      setUsers(results);
    } catch {
      console.error("Error searching users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Container size="sm" className="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Search Users
          </h1>
          <p className="mt-1 text-secondary-600">Find people to follow</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            <HiOutlineSearch size={20} />
          </Button>
        </form>

        {/* Results */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <UserCard
                key={user.username}
                username={user.username}
                profile_image={user.profile_image}
                first_name={user.first_name}
                last_name={user.last_name}
              />
            ))
          ) : hasSearched ? (
            <EmptyState message="No users found" />
          ) : null}
        </div>
      </div>
    </Container>
  );
};

const UserCard = ({ username, profile_image, first_name, last_name }) => {
  const nav = useNavigate();

  const handleNav = () => {
    nav(`/${username}`);
  };

  return (
    <Card hoverable padding="md" className="cursor-pointer" onClick={handleNav}>
      <div className="flex items-center gap-4">
        <Avatar
          src={profile_image}
          name={`${first_name} ${last_name}`}
          size="lg"
        />
        <div>
          <p className="font-medium text-secondary-900">
            {first_name} {last_name}
          </p>
          <p className="text-sm text-secondary-600">@{username}</p>
        </div>
      </div>
    </Card>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 mb-4 rounded-full bg-secondary-100 flex items-center justify-center">
      <HiOutlineUserGroup className="w-8 h-8 text-secondary-400" />
    </div>
    <h3 className="text-lg font-medium text-secondary-900">{message}</h3>
    <p className="mt-1 text-secondary-600">Try a different search term</p>
  </div>
);

export default Search;
