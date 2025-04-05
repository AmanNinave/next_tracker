const API_URL = process.env.NEXT_PUBLIC_BACKEND_API ;

export const fetchTasks = async () => {
  const res = await fetch(`${API_URL}/tasks`);
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
};

export const login = async (username, password) => {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            username,
            password,
            grant_type: "password", // ✅ required by OAuth2PasswordRequestForm
        }).toString(),
    });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  return res.json();
}