import { getUser, updateUser } from "@/lib/db";

export async function getValidAccessToken(email: string): Promise<string | null> {
  const user = getUser(email);
  if (!user || !user.stravaAccessToken) return null;

  if (user.stravaTokenExpiry && new Date(user.stravaTokenExpiry) < new Date()) {
    if (!user.stravaRefreshToken) return null;

    try {
      const response = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: user.stravaRefreshToken,
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();

      updateUser(email, {
        stravaAccessToken: data.access_token,
        stravaRefreshToken: data.refresh_token,
        stravaTokenExpiry: new Date(data.expires_at * 1000).toISOString(),
      });

      return data.access_token;
    } catch {
      return null;
    }
  }

  return user.stravaAccessToken;
}
