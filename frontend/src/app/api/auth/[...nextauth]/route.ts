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
        email: { label: "Demo Email", type: "email", placeholder: "policymaker@demo.com / admin@demo.com" },
        password: { label: "Demo Password", type: "password", placeholder: "policy123 / admin123" }
      },
      async authorize(credentials) {
        if (credentials?.email === "admin@demo.com" && credentials?.password === "admin123") {
          return { id: "1", name: "Demo Admin", email: "admin@demo.com", role: "admin" }
        }
        if (credentials?.email === "policymaker@demo.com" && credentials?.password === "policy123") {
          return { id: "2", name: "Demo Policymaker", email: "policymaker@demo.com", role: "policymaker" }
        }
        if (credentials?.email === "citizen@demo.com" && credentials?.password === "citizen123") {
          return { id: "3", name: "Demo Citizen", email: "citizen@demo.com", role: "citizen" }
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
        let role = "citizen" // Default fallback for all optional Google users
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
  },
  pages: {
    signIn: '/login'
  }
})

export { handler as GET, handler as POST }
