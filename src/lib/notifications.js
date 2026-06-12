import { supabase } from './supabase'

/**
 * Fire-and-forget email notifications via the `notify` Supabase Edge Function.
 * Every call is wrapped so a missing/unconfigured function never breaks the UX.
 */
async function invoke(payload) {
  try {
    await supabase.functions.invoke('notify', { body: payload })
  } catch {
    // Edge function not deployed / email not configured — silently skip.
  }
}

export function notifyBookingConfirmed({ booking, slot, practitioner }) {
  return invoke({
    type: 'booking_confirmed',
    to: booking.patient_email,
    practitioner_email: practitioner.email,
    data: {
      patient_name: booking.patient_name,
      practitioner_name: `${practitioner.title} ${practitioner.name}`,
      date: slot.date,
      time: slot.start_time?.slice(0, 5),
      appointment_type: slot.appointment_type,
      cancellation_token: booking.cancellation_token,
    },
  })
}

export function notifyPractitionerApproved({ email, name }) {
  return invoke({
    type: 'practitioner_approved',
    to: email,
    data: { name },
  })
}

export function notifyPractitionerRejected({ email, name, reason }) {
  return invoke({
    type: 'practitioner_rejected',
    to: email,
    data: { name, reason },
  })
}

export function notifyNewEnquiry({ practitioner, enquiry }) {
  return invoke({
    type: 'new_enquiry',
    to: practitioner.email,
    data: {
      practitioner_name: `${practitioner.title} ${practitioner.name}`,
      sender_name: enquiry.sender_name,
      sender_email: enquiry.sender_email,
      message: enquiry.message,
    },
  })
}
