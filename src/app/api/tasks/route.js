const API_URL = process.env.NEXT_PUBLIC_BACKEND_API ;

export const fetchTaskSchedules = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No token found");
    }
    const res = await fetch(`${API_URL}/task-schedule`, {
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


export const createNewTask = async (payload) => {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No token found");
    }
    const res = await fetch(`${API_URL}/task`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body : JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error("Failed to create data");
    }
    return res.json();
}