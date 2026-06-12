// Supabase Edge Function: transactional email via Resend
// Deploy: supabase functions deploy notify
// Secret: supabase secrets set RESEND_API_KEY=re_xxx SITE_URL=https://your-domain.com

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SITE_URL = Deno.env.get('SITE_URL') || 'https://findcare-uk.vercel.app'
const FROM = Deno.env.get('EMAIL_FROM') || 'FindCare UK <noreply@findcare.uk>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function template(type: string, data: Record<string, string>): { subject: string; html: string } {
  const wrap = (body: string) => `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="font-size: 20px; font-weight: 800; color: #1E3A8A; margin-bottom: 24px;">FindCare UK</div>
      ${body}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
      <p style="font-size: 12px; color: #94a3b8;">FindCare UK — the UK healthcare practitioner directory.</p>
    </div>`

  switch (type) {
    case 'booking_confirmed':
      return {
        subject: `Booking confirmed with ${data.practitioner_name}`,
        html: wrap(`
          <h2 style="color: #0f172a;">Your appointment is confirmed ✓</h2>
          <p>Hi ${data.patient_name},</p>
          <p>Your <strong>${data.appointment_type}</strong> with <strong>${data.practitioner_name}</strong> is booked for:</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 16px;">
            <strong>${data.date}</strong> at <strong>${data.time}</strong>
          </div>
          <p>Need to cancel? <a href="${SITE_URL}/cancel-booking?token=${data.cancellation_token}" style="color: #1E3A8A;">Cancel your booking here</a>.</p>
        `),
      }
    case 'practitioner_approved':
      return {
        subject: 'Your FindCare UK listing is live',
        html: wrap(`
          <h2 style="color: #0f172a;">Welcome aboard, ${data.name}!</h2>
          <p>Your listing has been approved and is now visible to patients searching in your area.</p>
          <p><a href="${SITE_URL}/dashboard" style="display: inline-block; background: #1E3A8A; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700;">Open your dashboard</a></p>
          <p style="font-size: 14px; color: #475569;">Tip: add your weekly availability so patients can book you directly — listings with online booking get significantly more patient contact.</p>
        `),
      }
    case 'practitioner_rejected':
      return {
        subject: 'Update on your FindCare UK application',
        html: wrap(`
          <p>Hi ${data.name},</p>
          <p>Unfortunately we couldn't approve your listing at this time.${data.reason ? ` Reason: ${data.reason}` : ''}</p>
          <p>If you believe this is a mistake or can provide additional verification, just reply to this email.</p>
        `),
      }
    case 'new_enquiry':
      return {
        subject: `New patient enquiry from ${data.sender_name}`,
        html: wrap(`
          <h2 style="color: #0f172a;">New enquiry</h2>
          <p>Hi ${data.practitioner_name}, you have a new enquiry:</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px;"><strong>${data.sender_name}</strong> (${data.sender_email})</p>
            <p style="margin: 0; color: #475569;">${data.message}</p>
          </div>
          <p>Reply directly to <a href="mailto:${data.sender_email}">${data.sender_email}</a> or view it in your <a href="${SITE_URL}/dashboard" style="color: #1E3A8A;">dashboard</a>.</p>
        `),
      }
    default:
      return { subject: 'FindCare UK notification', html: wrap('<p>You have a new notification.</p>') }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, practitioner_email, data } = await req.json()

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ sent: false, reason: 'not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { subject, html } = template(type, data || {})

    const recipients = [to]
    // Booking confirmations also notify the practitioner
    if (type === 'booking_confirmed' && practitioner_email) {
      recipients.push(practitioner_email)
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: recipients, subject, html }),
    })

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ sent: false, error: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
