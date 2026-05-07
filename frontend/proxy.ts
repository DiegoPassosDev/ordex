import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login"];

const ROLE_ROUTES: Record<string, string[]> = {
  MANAGER: ["/manager"],
  WAITER: ["/waiter"],
  KITCHEN: ["/kitchen"],
  BAR: ["/kitchen"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — deixa passar
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Lê o store do Zustand salvo no cookie/localStorage via cookie
  const authCookie = request.cookies.get("ordex_auth")?.value;

  if (!authCookie) {
    // Sem autenticação — redireciona para login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const auth = JSON.parse(decodeURIComponent(authCookie));
    const state = auth?.state;
    const token = state?.token;
    const employee = state?.employee;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verifica se o funcionário tem permissão para a rota
    if (employee) {
      const role = employee.role as string;
      const allowedPrefixes = ROLE_ROUTES[role] || [];
      const isAllowed = allowedPrefixes.some((prefix) =>
        pathname.startsWith(prefix),
      );

      // Rota de cliente — funcionário não pode acessar
      if (pathname.startsWith("/table") && employee) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      if (!isAllowed) {
        // Redireciona para a rota correta do perfil
        const defaultRoute = allowedPrefixes[0] || "/login";
        return NextResponse.redirect(new URL(defaultRoute, request.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sounds).*)"],
};
