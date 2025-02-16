"use client";
import { fetchWithAuth } from "@/app/lib/actions";
import { useEffect, useState } from "react";

export default function Home() {
  const [res, setRes] = useState("");

  useEffect(() => {
    const getData = async () => {
      const data = await fetchWithAuth("/waffles");
      setRes(data);
    };
    getData();
  }, []);

  return JSON.stringify(res);
}
