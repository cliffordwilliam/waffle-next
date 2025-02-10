"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignInFormSchema, SignInFormState } from "./definitions";

export async function signIn(prevState: SignInFormState, formData: FormData) {
  const validatedFields = SignInFormSchema.safeParse({
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

export async function editCookie() {
  console.log("getting cookies");
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  try {
    console.log("fetch waffle 1st try");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/waffles`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    if (
      !response.ok &&
      data.message !== "Unauthorized" &&
      data.statusCode !== 401
    ) {
      console.log(
        "Nest said im authorized but it gave me bad res, maybe i req bad?"
      );
      return data;
    }

    if (response.ok) {
      console.log("Success get waffle first try!");
      return data;
    }
  } catch (error) {
    console.log("First try to get waffle fail, cannot connect to nest");
    return `Error: Unable to connect to server. ${error}`;
  }

  let newTokens;
  try {
    console.log("Trying to use refresh tokens");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/authentication/refresh-tokens`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      console.log("My refresh token did not work, Stolen? Expired?");
      return data;
    }
    newTokens = data;
    cookieStore.set("accessToken", data.accessToken);
    cookieStore.set("refreshToken", data.refreshToken);
  } catch (error) {
    return `Error: Unable to connect to server. ${error}`;
  }

  console.log(`old access token ${accessToken}`);
  console.log(`new access token ${newTokens.accessToken}`);
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/waffles`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${newTokens.accessToken}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return `Error: Unable to connect to server. ${error}`;
  }
}
