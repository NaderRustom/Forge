import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { tables: true } },
        },
      },
    },
  });

  // If user has one project, redirect directly to it
  const allProjects = workspaces.flatMap((w) => w.projects);
  if (allProjects.length === 1) {
    redirect(`/project/${allProjects[0].id}/chat`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-6 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Projects</h1>
        </div>

        {workspaces.map((workspace) => (
          <div key={workspace.id} className="mb-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-400">
              {workspace.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {workspace.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}/chat`}
                  className="rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
                    {project.name}
                  </h3>
                  <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {project.description || "No description"}
                  </p>
                  <span className="text-xs text-zinc-400">
                    {project._count.tables} table{project._count.tables !== 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {allProjects.length === 0 && (
          <div className="text-center text-zinc-400">
            <p>No projects yet. Sign up to get started with a default project.</p>
          </div>
        )}
      </div>
    </div>
  );
}
