"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginFormState } from "./definitions";
import { z } from "zod";

const LoginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { message: "Be at least 8 characters long" })
    .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
    .regex(/[0-9]/, { message: "Contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Contain at least one special character.",
    })
    .trim(),
});

export async function signIn(prevState: LoginFormState, formData: FormData) {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    // To render form input err msg
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/authentication/sign-in`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      // To render nest err
      return {
        message: data.message as string,
      };
    }

    // Save to cookies
    const cookieStore = await cookies();
    cookieStore.set("accessToken", data.accessToken);
    cookieStore.set("refreshToken", data.refreshToken);
  } catch (error) {
    // To render cannot connect ot nest err
    return { message: `Error: Unable to connect to server. ${error}` };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
) {
  console.log(`Fetching: ${endpoint}`);
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  const fetchData = async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok) return data;

      if (response.status === 401 || data.message === "Unauthorized") {
        console.log("Token expired, attempting refresh...");
        return null;
      }

      return data;
    } catch (error) {
      return `Error: Unable to connect to server. ${error}`;
    }
  };

  const data = await fetchData(accessToken!);
  if (data !== null) return data;

  try {
    console.log("Refreshing tokens...");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/authentication/refresh-tokens`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );
    if (response.ok) {
      const newTokens: { accessToken: string; refreshToken: string } =
        await response.json();
      cookieStore.set("accessToken", newTokens.accessToken);
      cookieStore.set("refreshToken", newTokens.refreshToken);
      accessToken = newTokens.accessToken;

      return await fetchData(accessToken);
    }
  } catch (error) {
    return `Error: Unable to refresh token. ${error}`;
  }

  console.log("Refresh failed, returning error...");
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  revalidatePath("/login");
  redirect("/login");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  revalidatePath("/login");
  redirect("/login");
}
