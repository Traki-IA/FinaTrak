import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthForm from "./AuthForm";

export default async function AuthPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <AuthForm />;
}
