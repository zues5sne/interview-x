import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getUserId } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getUserId()) redirect("/dashboard");
  return <AuthForm mode="register" />;
}
