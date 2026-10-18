import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          // Server Components dobijaju obnovljenu sesiju
          // već tokom obrade ovog zahteva.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          // Pregledač čuva obnovljenu sesiju za naredne zahteve.
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Proverava token i po potrebi pokreće obnavljanje sesije.
  // Pravo pristupa i aktivnost zaposlenog proverava access.js.
  const { error } = await supabase.auth.getClaims();

  if (error && error.name !== "AuthSessionMissingError") {
    // Ne ispisujemo tokene niti sadržaj kolačića.
    console.warn("Provera sesije u middleware-u nije uspela:", {
      name: error.name,
      status: error.status,
      code: error.code,
    });
  }

  // Odgovori povezani sa sesijom ne smeju biti javno keširani.
  response.headers.set("Cache-Control", "private, no-store");

  return response;
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf)$).*)",
  ],
};
