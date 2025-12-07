import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { userEmail, userName, eventTitle, eventDate, eventLocation, eventTime } =
      await request.json();

    const { data, error } = await resend.emails.send({
      from: "Event Planner <onboarding@resend.dev>", // Use your verified domain later
      to: [userEmail],
      subject: `RSVP Confirmed: ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .event-details {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #667eea;
              }
              .detail-row {
                display: flex;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .detail-row:last-child {
                border-bottom: none;
              }
              .detail-label {
                font-weight: 600;
                color: #6b7280;
                min-width: 100px;
              }
              .detail-value {
                color: #111827;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #6b7280;
                font-size: 14px;
              }
              .emoji {
                font-size: 24px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="emoji">🎉</div>
              <h1 style="margin: 10px 0;">RSVP Confirmed!</h1>
              <p style="margin: 0; opacity: 0.9;">You're all set for this event</p>
            </div>
            
            <div class="content">
              <p>Hi ${userName || "there"},</p>
              
              <p>Great news! Your RSVP has been confirmed for:</p>
              
              <div class="event-details">
                <h2 style="margin-top: 0; color: #111827;">${eventTitle}</h2>
                
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${eventDate}</span>
                </div>
                
                ${
                  eventTime
                    ? `
                <div class="detail-row">
                  <span class="detail-label">🕐 Time:</span>
                  <span class="detail-value">${eventTime}</span>
                </div>
                `
                    : ""
                }
                
                ${
                  eventLocation
                    ? `
                <div class="detail-row">
                  <span class="detail-label">📍 Location:</span>
                  <span class="detail-value">${eventLocation}</span>
                </div>
                `
                    : ""
                }
              </div>
              
              <p>We're excited to see you there! If you need to cancel your RSVP, you can do so from the event page.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  View Event Details
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Event Planner - Making event management simple</p>
              <p style="font-size: 12px; color: #9ca3af;">
                You received this email because you RSVP'd to an event on Event Planner.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}