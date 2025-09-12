import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "../src/generated/prisma/client";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "./config";
import { OAuth2Client } from "google-auth-library";

const prisma = new PrismaClient();

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/users/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await prisma.user.findUnique({
        where: { email: profile.emails![0].value },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: profile.displayName,
            email: profile.emails![0].value,
            profilePhoto: profile.photos![0].value, // save profile photo
            isVerified: true,
            isActive: true,
            password: "",
          },
        });
      }
      done(null, user);
    }
  )
);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
} // Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id); // Store only user ID in session
});
// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
export default passport;
