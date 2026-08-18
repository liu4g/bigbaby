import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getOptionalSupabaseEnv } from "@/lib/supabase/env";

const protectedPrefixes = [
  "/dashboard",
  "/vocabulary",
  "/grammar",
  "/reading",
  "/practice",
  "/jlpt",
  "/progress",
  "/profile"
];

const authOnlyWhenLoggedOut = ["/login", "/register"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isLoggedOutAuthPath(pathname: string) {
  return authOnlyWhenLoggedOut.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAuthPreviewEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_PREVIEW_MODE === "true";
}

function buildLoginRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", requestedPath);

  return redirectUrl;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getOptionalSupabaseEnv();

  if (isAuthPreviewEnabled()) {
    if (isLoggedOutAuthPath(request.nextUrl.pathname)) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  }

  if (!env) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      const loginUrl = buildLoginRedirect(request);
      loginUrl.searchParams.set("message", "supabase-config-required");
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  const supabase = createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  if (user && isLoggedOutAuthPath(request.nextUrl.pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
