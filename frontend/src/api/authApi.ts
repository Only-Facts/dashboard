
export async function verifyEmail(token: string): Promise<void> {
  const response = await fetch("/api/auth/verify-email", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      token,
    }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error(
        "This verification link is invalid, expired or already used."
      );
    }

    throw new Error(
      "Unable to verify your email. Please try again."
    );
  }
}
