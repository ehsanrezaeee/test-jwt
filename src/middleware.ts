import createMiddleware from "next-intl/middleware";
import { locales, localePrefix } from "./navigation";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export default async function middleware(request: NextRequest) {
  const accToken = request.cookies.get("CTA1")?.value ?? "";
  const RefToken = request.cookies.get("CTA2")?.value ?? "";
  interface token {
    exp: number;
    iat: number;
    nbf: number;
    sub: string;
    token_uuid: string;
  }

  if (accToken && RefToken) {
    const decodedAcc = jwt.decode(accToken) as token;
    const decodedRef = jwt.decode(RefToken) as token;

    const expirationTimeAcc = decodedAcc?.exp;
    const expirationTimeRef = decodedRef?.exp;
    if (expirationTimeRef <= Date.now() / 1000) {
      if (request.nextUrl.pathname !== "/auth") {
        return NextResponse.redirect(new URL("/auth", request.url));
      }
      const handleI18nRouting = createMiddleware({
        // A list of all locales that are supported
        locales,
        localeDetection: false,
        localePrefix,
        // Used when no locale matches
        defaultLocale: "fa",
      });

      let response = handleI18nRouting(request);

      return response;
    } else if (
      expirationTimeRef > Date.now() / 1000 &&
      expirationTimeAcc <= Date.now() / 1000
    ) {
      const data = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_BACK_END}/api/v2/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token_pair: {
              access_token: accToken,
              refresh_token: RefToken,
            },
          }),
        }
      );

      const res2 = await data.json();

      const handleI18nRouting = createMiddleware({
        // A list of all locales that are supported
        locales,
        localeDetection: false,
        localePrefix,
        // Used when no locale matches
        defaultLocale: "fa",
      });

      let response = handleI18nRouting(request);

      response.cookies.set("CTA1", res2?.result?.token_pair?.access_token);
      response.cookies.set("CTA2", res2?.result?.token_pair?.refresh_token);

      return response;
    } else {
      const handleI18nRouting = createMiddleware({
        // A list of all locales that are supported
        locales,
        localeDetection: false,
        localePrefix,
        // Used when no locale matches
        defaultLocale: "fa",
      });

      let response = handleI18nRouting(request);

      return response;
    }
  } else {
    if (request.nextUrl.pathname !== "/auth") {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  const handleI18nRouting = createMiddleware({
    // A list of all locales that are supported
    locales,
    localeDetection: false,
    localePrefix,
    // Used when no locale matches
    defaultLocale: "fa",
  });

  let response = handleI18nRouting(request);

  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
    "/(fa|en)/:path*",
    "/((?!auth|login|$).*)]",
  ],
};
