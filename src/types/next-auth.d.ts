import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;          // Supabase UUID
            firebase_uid: string; // Original Firebase string User ID
            role: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        firebase_uid: string;
        role: string;
    }
}
