"use client";
import Button from "@mui/material/Button";
import { editCookie } from "@/app/lib/actions";
import { useState, useEffect } from "react";

export default function Home() {
  const [res, setRes] = useState("");

  useEffect(() => {
    const getWaffles = async () => {
      const data = await editCookie();
      setRes(data);
    };
    getWaffles();
  }, []);

  return (
    <>
      <Button variant="contained" onClick={() => editCookie()}>
        Update cookies
      </Button>
      {JSON.stringify(res)}
    </>
  );
}
