import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth } from "@/lib/firebaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "FirebaseToken",
            credentials: {
                idToken: { label: "Firebase ID Token", type: "text" },
            },
            async authorize(credentials, req) {
                if (!credentials?.idToken) return null;

                try {
                    // 1. Verify the frontend Firebase token securely 
                    const decodedToken = await adminAuth.verifyIdToken(credentials.idToken);
                    const { uid, email, name, picture } = decodedToken;

                    if (!email) return null;

                    // 2. Query our Supabase `users` table to see if this Firebase User has a profile yet
                    const { data: existingUser, error: selectError } = await supabaseAdmin
                        .from('users')
                        .select('*')
                        .eq('firebase_uid', uid)
                        .single();

                    if (existingUser) {
                        // Return user object formatted for the NextAuth session
                        return {
                            id: existingUser.id,           // The Supabase UUID (used for relations)
                            firebase_uid: uid,             // The Firebase String ID
                            email: existingUser.email,
                            name: existingUser.name,
                            role: existingUser.role,       // Extract Supabase 'admin' / 'resident' role
                        };
                    }

                    // 3. User doesn't exist in Supabase yet (First login). Auto-sync them!
                    const { data: newUser, error: insertError } = await supabaseAdmin
                        .from('users')
                        .insert({
                            firebase_uid: uid,
                            email: email,
                            name: name || '',
                            role: 'resident', // Default role for new signups
                        })
                        .select()
                        .single();

                    if (insertError) throw insertError;

                    return {
                        id: newUser.id,
                        firebase_uid: uid,
                        email: newUser.email,
                        name: newUser.name,
                        role: newUser.role,
                    };

                } catch (error) {
                    console.error("Firebase to Supabase NextAuth Error: ", error);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id; // Supabase Postgres UUID
                token.firebase_uid = (user as any).firebase_uid;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                // Add firebase_uid to session securely if needed by frontend
                (session.user as any).firebase_uid = token.firebase_uid;
            }
            return session;
        }
    }
};
