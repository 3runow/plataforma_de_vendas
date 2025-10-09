import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
    const decoded = jwt.verify(token as string, JWT_SECRET) as {
      id: number;
      email: string;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) return redirect("/login");

    const isAdmin = user.role === "admin";

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 border rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold">
            {isAdmin ? "Você é ADMIN" : "Você não é ADM"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">{`Olá, ${user.name}`}</p>
        </div>
      </div>
    );
  } catch (err) {
    redirect("/login");
  }
}
