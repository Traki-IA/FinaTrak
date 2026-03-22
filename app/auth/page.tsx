import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthForm from "./AuthForm";

export default async function AuthPage() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthForm />;
}
