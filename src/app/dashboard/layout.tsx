import { LogoutButton } from "../ui/sign-out-button";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LogoutButton />
      {children}
    </>
  );
}
