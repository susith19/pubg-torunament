"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          window.location.href = "/login";
        } else {
          setUser(data);
        }
      });
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Email: {user.email}</p>
      <p>UID: {user.uid}</p>
    </div>
  );
}