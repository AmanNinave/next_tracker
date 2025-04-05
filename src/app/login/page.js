"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/api/auth/route";

const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_API;


export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const router = useRouter();
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login(formData.username, formData.password);
      
      if (response.access_token) {
        localStorage.setItem("token", response.access_token);
        router.push("/"); // Redirect to home page
      }
      console.log("Login Response:", response);
    } catch (error) {
      console.error("Login Failed:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-center text-2xl font-bold">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              type="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full py-2 bg-blue-600 text-white rounded-lg ${loading ? "opacity-50" : ""}`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
