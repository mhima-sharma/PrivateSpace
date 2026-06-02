import { redirect } from "next/navigation";

// "/" is a protected route. Unauthenticated visitors are bounced to /login by
// middleware; authenticated ones land on the private dashboard.
export default function Home() {
  redirect("/dashboard");
}
