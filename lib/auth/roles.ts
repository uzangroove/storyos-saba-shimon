export type AppRole = "ADMIN" | "OPERATOR";

export type AppUserProfile = {
  authUserId: string;
  email: string;
  displayName: string | null;
  role: AppRole;
  active: boolean;
};

export function homeForRole(role: AppRole) {
  return role === "ADMIN" ? "/management" : "/operator";
}

export function canAccessPath(role: AppRole, pathname: string) {
  if (pathname.startsWith("/management")) return role === "ADMIN";
  if (pathname.startsWith("/operator")) return role === "ADMIN" || role === "OPERATOR";
  return true;
}
