import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth-forms";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/filmes");

  return (
    <div className="px-4 py-16">
      <LoginForm />
    </div>
  );
}
