import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth-forms";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/filmes");

  return (
    <div className="px-4 py-16">
      <RegisterForm />
    </div>
  );
}
