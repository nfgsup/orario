import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/notes/[id] — toggle done / update fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: { done?: boolean; text?: string; dueDate?: string | null } = {};
    if (typeof body?.done === "boolean") data.done = body.done;
    if (typeof body?.text === "string") data.text = body.text;
    if (body?.dueDate !== undefined) {
      data.dueDate = body.dueDate ? String(body.dueDate).slice(0, 10) : null;
    }

    const note = await db.note.update({
      where: { id },
      data,
    });
    return NextResponse.json({ note });
  } catch (e) {
    console.error("PATCH /api/notes/[id] error", e);
    return NextResponse.json(
      { error: "Impossibile aggiornare il compito" },
      { status: 500 },
    );
  }
}

// DELETE /api/notes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.note.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/notes/[id] error", e);
    return NextResponse.json(
      { error: "Impossibile eliminare il compito" },
      { status: 500 },
    );
  }
}
