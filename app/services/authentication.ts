import axios from "axios";
import { createCookieSessionStorage, redirect } from "remix";
import { User } from "~/models/User";

type LoginForm = {
  email: string;
  password: string;
};

const sessionSecret = process.env["SESSION_SECRET"] || "secrettoken";

const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_session",
    // normally you want this to be `secure: true`
    // but that doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function createUserSession(
  token: string,
  userId: number,
  redirectTo: string
) {
  const session = await storage.getSession();
  session.set("token", token);
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function loginUser(loginForm: LoginForm) {
  let session;
  try {
    session = await axios.put<{
      message: string;
      token: string;
      userId: number;
    }>("/session", loginForm);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return new Error(`${err.response?.data?.message || err.message}`);
    }
    throw err;
  }

  if (!session) {
    return new Error("Unable to find user");
  }

  return session.data;
}

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId: number = session.get("userId");
  if (!userId || typeof userId !== "number") {
    return null;
  }
  return userId;
}

export async function getToken(request: Request) {
  const session = await getUserSession(request);
  const token: string = session.get("token");
  if (!token || typeof token !== "string") {
    return null;
  }
  return token;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId: number = session.get("userId");
  if (!userId || typeof userId !== "number") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}
