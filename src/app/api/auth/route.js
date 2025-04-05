const API_URL = process.env.NEXT_PUBLIC_BACKEND_API ;
import { NextResponse } from "next/server";

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
  const response = await res.json();

  if (!response.access_token) {
      throw new Error("No access token received");
  }

  return response;
}