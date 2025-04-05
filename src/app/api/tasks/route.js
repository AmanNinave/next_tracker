const API_URL = process.env.NEXT_PUBLIC_BACKEND_API ;

export const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No token found");
    }
    const res = await fetch(`${API_URL}/tasks`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    if (!res.ok) {
        throw new Error("Failed to fetch data");
    }
    return res.json();
}
