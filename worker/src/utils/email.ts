export async function sendEmail(
  apiKey: string,
  data: { to: string; subject: string; html: string }
): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'noreply@saas-app.com',
      to: data.to,
      subject: data.subject,
      html: data.html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}
