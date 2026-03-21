export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/manager/:path*", "/driver/:path*", "/account"],
};
