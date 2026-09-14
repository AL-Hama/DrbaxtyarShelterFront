import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const savedUser = localStorage.getItem("user");

            if (
                savedUser &&
                savedUser !== "undefined" &&
                savedUser !== "null"
            ) {
                setUser(JSON.parse(savedUser));
            } else {
                localStorage.removeItem("user");
            }
        } catch (error) {
            console.error("Failed to load user:", error);

            localStorage.removeItem("user");
            setUser(null);
        }
    }, []);

    const login = (userData, token) => {
        try {
            localStorage.setItem(
                "user",
                JSON.stringify(userData || null)
            );

            if (token) {
                localStorage.setItem("token", token);
            }

            setUser(userData);
        } catch (error) {
            console.error("Login error:", error);
        }
    };

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}