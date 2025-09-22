// src/utils/csrf.ts
export const getCSRFToken = () => {
  const name = "csrftoken";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};
