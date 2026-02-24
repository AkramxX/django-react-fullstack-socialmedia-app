import axios from "axios";
import { API_URL } from "../constants/constants";
import { useNavigate } from "react-router-dom";

const BASE_URL = API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original_request = error.config;

    if (error.response?.status === 401 && !original_request._retry) {
      original_request._retry = true;

      try {
        await refresh_token();
        return api(original_request);
      } catch (refreshError) {
        // Clear local storage and redirect to login if token refresh fails
        localStorage.removeItem("userData");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export const get_user_profile_data = async (username) => {
  const response = await api.get(`/user/${username}/`);

  return response.data;
};

const refresh_token = async () => {
  const response = await api.post("/token/refresh/");
  return response.data;
};

export const login = async (username, password) => {
  const response = await api.post("/token/", { username, password });
  return response.data;
};

export const register = async (
  username,
  email,
  firstName,
  lastName,
  password,
) => {
  const response = await api.post("/register/", {
    username: username,
    email: email,
    first_name: firstName,
    last_name: lastName,
    password: password,
  });
  return response.data;
};

export const get_auth = async () => {
  const response = await api.get(`/authenticated/`);
  return response.data;
};

export const toggleFollow = async (username) => {
  const response = await api.post("/toggle_follow/", { username: username });
  return response.data;
};

export const get_users_posts = async (username) => {
  const response = await api.get(`/posts/${username}/`);
  return response.data;
};

export const toggleLike = async (id) => {
  const response = await api.post("/toggle_like/", { id: id });
  return response.data;
};

export const create_post = async (description) => {
  const response = await api.post("/create_post/", {
    description: description,
  });
  return response.data;
};

export const get_posts = async (num) => {
  const response = await api.get(`/all_posts/?page=${num}`);
  return response.data;
};

export const search_users = async (search) => {
  const response = await api.get(`/search/?query=${search}`);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/logout/");
  localStorage.removeItem("userData");
  return response.data;
};

export const update_user = async (values) => {
  const response = await api.patch("/update_profile/", values, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ==================== Messaging Endpoints ====================

export const get_conversations = async () => {
  const response = await api.get("/conversations/");
  return response.data;
};

export const get_conversation = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}/`);
  return response.data;
};

export const start_conversation = async (username) => {
  const response = await api.post("/conversations/start/", { username });
  return response.data;
};

export const get_messages = async (conversationId, before = null) => {
  let url = `/conversations/${conversationId}/messages/`;
  if (before) {
    url += `?before=${before}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const send_message = async (receiverUsername, content) => {
  const response = await api.post("/messages/", {
    receiver_username: receiverUsername,
    content: content,
  });
  return response.data;
};

export const mark_messages_read = async (conversationId) => {
  const response = await api.patch(`/conversations/${conversationId}/read/`);
  return response.data;
};

export const get_unread_count = async () => {
  const response = await api.get("/messages/unread-count/");
  return response.data;
};
