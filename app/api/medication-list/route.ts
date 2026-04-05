import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getMedicationList, addMedicationItem, deleteMedicationItem } from '@/lib/db';

export async function GET() {
    try {
        const list = await getMedicationList();
        return NextResponse.json(list);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch medication list' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { type, name } = body; 

        if (!type || !name) {
            return NextResponse.json({ error: 'Missing type or name' }, { status: 400 });
        }

        const res = await addMedicationItem(type, name);
        if (!res.success) throw new Error("Failed to add");

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add medication' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Missing name' }, { status: 400 });
        }

        const res = await deleteMedicationItem(name);
        if (!res.success) throw new Error("Failed to delete");

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete medication' }, { status: 500 });
    }
}
