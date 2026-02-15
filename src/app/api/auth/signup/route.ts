import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user + workspace + membership in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-") + "-workspace";

    const workspace = await tx.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        slug,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });

    // Create a default project
    await tx.project.create({
      data: {
        name: "My First Project",
        description: "Get started by creating tables and enriching data.",
        workspaceId: workspace.id,
      },
    });

    return { user, workspace };
  });

  return Response.json(
    {
      success: true,
      data: {
        userId: result.user.id,
        workspaceId: result.workspace.id,
      },
    },
    { status: 201 }
  );
}
