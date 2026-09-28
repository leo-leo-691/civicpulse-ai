import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Demo Account",
      credentials: {
        role: { label: "Type 'admin' or 'policymaker'", type: "text", placeholder: "admin" }
      },
      async authorize(credentials) {
        if (credentials?.role === "admin") {
          return { id: "1", name: "Demo Admin", email: "admin@demo.com", role: "admin" }
        }
        if (credentials?.role === "policymaker") {
          return { id: "2", name: "Demo Policymaker", email: "policymaker@demo.com", role: "policymaker" }
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (user && account?.provider === 'credentials') {
        token.role = (user as any).role
        token.id_token = `DEMO_TOKEN_${(user as any).role.toUpperCase()}`
      }
      
      if (account?.provider === 'google') {
        token.id_token = account.id_token
      }

      if (!token.role) {
        const policymakerEmails = (process.env.POLICYMAKER_EMAILS || "").split(",").map(e => e.trim())
        const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim())
        const email = token.email || ""
        let role = "none"
        if (adminEmails.includes(email)) role = "admin"
        else if (policymakerEmails.includes(email)) role = "policymaker"
        token.role = role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
      }
      (session as any).id_token = token.id_token as string
      return session
    }
  },
  session: {
    strategy: "jwt"
  }
})

export { handler as GET, handler as POST }
