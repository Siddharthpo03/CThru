import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Proactively warm up cloud backend (Render spins down free-tier instances after idle)
export function warmBackend() {
  try {
    fetch(`${API_URL}/health`, { method: "GET" }).catch(() => {});
  } catch {
    // Silent fail for background warmup
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("cthru-token");
  const { timeout = 40000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // If request takes longer than 3.5s, notify user that cloud server is spinning up from cold sleep
  let coldStartToastId = null;
  const coldStartTimer = setTimeout(() => {
    coldStartToastId = toast.loading(
      "Connecting to cloud server... Waking up free-tier backend, please wait a moment.",
      { id: "backend-cold-start" }
    );
  }, 3500);

  const headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    clearTimeout(coldStartTimer);
    if (coldStartToastId) {
      toast.dismiss("backend-cold-start");
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = {
        success: false,
        message: "Invalid server response.",
      };
    }

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    clearTimeout(coldStartTimer);
    if (coldStartToastId) {
      toast.dismiss("backend-cold-start");
    }

    if (error.name === "AbortError") {
      throw new Error(
        "Request timed out. The backend server might still be waking up. Please try again.",
        { cause: error }
      );
    }

    throw error;
  }
}
