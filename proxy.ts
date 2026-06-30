import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        authorized: ({ token, req }) => {
            if (!token) return false;

            if (req.nextUrl.pathname.startsWith("/admin")) {
                return token.role === "Admin";
            }

            return true;
        },
    },
});

export const config = {
    matcher: ["/staff/:path*", "/admin/:path*"],
};
