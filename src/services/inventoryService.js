const API_URL = "http://localhost:5000/api/inventory";

const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
});

export async function getInventory() {
    const res = await fetch(API_URL, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        throw new Error("Failed to fetch inventory");
    }

    return res.json();
}

export async function getInventoryStats() {
    const res = await fetch(
        `${API_URL}/stats`,
        {
            headers: getAuthHeaders()
        }
    );

    if (!res.ok) {
        throw new Error("Failed to fetch stats");
    }

    return res.json();
}

export async function createInventoryItem(data) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        throw new Error("Failed to create item");
    }

    return res.json();
}

export async function updateInventoryItem(id, data) {
    const res = await fetch(
        `${API_URL}/${id}`,
        {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        }
    );

    if (!res.ok) {
        throw new Error("Failed to update item");
    }

    return res.json();
}

export async function deleteInventoryItem(id) {
    const res = await fetch(
        `${API_URL}/${id}`,
        {
            method: "DELETE",
            headers: getAuthHeaders()
        }
    );

    if (!res.ok) {
        throw new Error("Failed to delete item");
    }

    return res.json();
}