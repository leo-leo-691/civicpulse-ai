import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
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
      session.user.role = token.role as string
      session.id_token = token.id_token as string
      return session
    }
  },
  session: {
    strategy: "jwt"
  }
})

export { handler as GET, handler as POST }
