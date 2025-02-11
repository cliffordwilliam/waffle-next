"use client";

import { Button } from "@mui/material";
import { signOut } from "../lib/actions";

export function LogoutButton() {
  return <Button onClick={() => signOut()}>Logout</Button>;
}
