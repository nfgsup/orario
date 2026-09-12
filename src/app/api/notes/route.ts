import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/notes — list all homework, newest first
export async function GET() {
  try {
    const notes = await db.note.findMany({
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ notes });
  } catch (e) {
    console.error("GET /api/notes error", e);
    return NextResponse.json(
      { error: "Impossibile caricare i compiti" },
      { status: 500 },
    );
  }
}

// POST /api/notes — create a homework entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subject = (body?.subject ?? "").toString().trim();
    const text = (body?.text ?? "").toString().trim();
    const dueDate = body?.dueDate ? body.dueDate.toString().slice(0, 10) : null;

    if (!subject || !text) {
      return NextResponse.json(
        { error: "Materia e descrizione sono obbligatorie" },
        { status: 400 },
      );
    }

    const note = await db.note.create({
      data: { subject, text, dueDate },
    });
    return NextResponse.json({ note });
  } catch (e) {
    console.error("POST /api/notes error", e);
    return NextResponse.json(
      { error: "Impossibile salvare il compito" },
      { status: 500 },
    );
  }
}
