import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth } from "@/lib/firebaseAdmin";
import { adminDb } from "@/lib/firebaseAdmin";

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
                    const { uid, email, name } = decodedToken;

                    if (!email) return null;

                    // 2. Check and sync user profile in Firebase Realtime Database
                    const userRef = adminDb.ref(`users/${uid}`);
                    const userSnapshot = await userRef.get();

                    if (userSnapshot.exists()) {
                        const existingUser = userSnapshot.val();
                        return {
                            id: uid,
                            firebase_uid: uid,
                            email: existingUser.email || email,
                            name: existingUser.name || name || '',
                            role: existingUser.role || 'resident',
                        };
                    }

                    const newUser = {
                        id: uid,
                        firebase_uid: uid,
                        email,
                        name: name || '',
                        role: 'resident',
                        createdAt: new Date().toISOString(),
                    };

                    await userRef.set(newUser);

                    return {
                        id: uid,
                        firebase_uid: uid,
                        email: newUser.email,
                        name: newUser.name,
                        role: newUser.role,
                    };

                } catch (error) {
                    console.error("Firebase NextAuth Error: ", error);
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
                token.id = user.id;
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
