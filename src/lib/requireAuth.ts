import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";


type Role = "admin" | "resident";

type AuthenticatedHandler = (
    req: Request,
    context: any,
    session: any
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler, allowedRoles?: Role[]) {
    return async (req: Request, context: any) => {
        try {
            const session = await getServerSession(authOptions);

            if (!session || !session.user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
                return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
            }


            return await handler(req, context, session);
        } catch (error) {
            console.error("[API_ERROR]", error);
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    };
}
