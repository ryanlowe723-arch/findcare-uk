/**
 * Symptom → specialist triage data.
 * Pure client-side: body area → common problems → recommended practitioner
 * types + search keywords + urgency guidance.
 */

export const BODY_AREAS = [
  { id: 'knee',     label: 'Knee' },
  { id: 'back',     label: 'Back & spine' },
  { id: 'shoulder', label: 'Shoulder & arm' },
  { id: 'ankle',    label: 'Ankle & foot' },
  { id: 'neck',     label: 'Neck' },
  { id: 'hip',      label: 'Hip & pelvis' },
  { id: 'head',     label: 'Head & mind' },
  { id: 'general',  label: 'General health' },
]

export const PROBLEMS = {
  knee: [
    {
      id: 'knee-sport',
      label: 'Sports injury (twist, impact, sudden pain)',
      types: ['Sports Medicine', 'Physiotherapist'],
      keywords: 'knee injury',
      advice: 'Sudden twisting injuries with swelling can indicate ligament damage (ACL/MCL) or meniscus tears. A sports medicine doctor can diagnose; a physiotherapist guides recovery.',
      redFlag: 'If the knee gives way, locks completely, or you heard a loud pop with immediate swelling, seek same-day assessment.',
    },
    {
      id: 'knee-gradual',
      label: 'Gradual pain (worse with activity or stairs)',
      types: ['Physiotherapist'],
      keywords: 'knee pain',
      advice: 'Gradual-onset knee pain is often patellofemoral pain or early arthritis. Physiotherapy is the first-line treatment with strong evidence behind it.',
    },
    {
      id: 'knee-postop',
      label: 'Recovering after knee surgery',
      types: ['Physiotherapist'],
      keywords: 'post-surgical rehab',
      advice: 'Structured post-surgical rehabilitation dramatically improves outcomes after ACL reconstruction or knee replacement.',
    },
  ],
  back: [
    {
      id: 'back-acute',
      label: 'Sudden back pain or spasm',
      types: ['Physiotherapist', 'Osteopath', 'Chiropractor'],
      keywords: 'back pain',
      advice: 'Most acute back pain settles within 6 weeks. Physios, osteopaths, and chiropractors all treat acute mechanical back pain — choose based on availability and reviews.',
      redFlag: 'If you have numbness around the groin, loss of bladder/bowel control, or weakness in both legs, go to A&E immediately — these are emergency symptoms.',
    },
    {
      id: 'back-chronic',
      label: 'Long-term / recurring back pain',
      types: ['Physiotherapist', 'Sports Medicine'],
      keywords: 'chronic pain',
      advice: 'Chronic back pain responds best to active rehabilitation and graded exercise rather than passive treatments alone.',
    },
    {
      id: 'back-sciatica',
      label: 'Pain radiating down the leg (sciatica)',
      types: ['Physiotherapist', 'Osteopath'],
      keywords: 'sciatica',
      advice: 'Leg-dominant pain often comes from nerve root irritation. Most cases improve with conservative care over 6–12 weeks.',
      redFlag: 'Progressive leg weakness or numbness needs urgent medical review.',
    },
  ],
  shoulder: [
    {
      id: 'shoulder-pain',
      label: 'Shoulder pain or stiffness',
      types: ['Physiotherapist', 'Sports Medicine'],
      keywords: 'shoulder pain',
      advice: 'Rotator cuff problems and frozen shoulder are the most common causes. Early physiotherapy prevents long-term stiffness.',
    },
    {
      id: 'shoulder-dislocation',
      label: 'Dislocation or instability',
      types: ['Sports Medicine', 'Physiotherapist'],
      keywords: 'shoulder instability',
      advice: 'After a first dislocation, specialist assessment reduces the chance of recurrence — particularly important for under-25s.',
      redFlag: 'A currently dislocated shoulder needs A&E — do not attempt to relocate it yourself.',
    },
  ],
  ankle: [
    {
      id: 'ankle-sprain',
      label: 'Ankle sprain or twist',
      types: ['Physiotherapist', 'Sports Medicine'],
      keywords: 'ankle sprain',
      advice: 'Most sprains heal in 2–6 weeks, but rehabilitation prevents the 30% recurrence rate. If you cannot bear weight at all, get an X-ray first.',
      redFlag: 'Unable to take 4 steps, or pain directly on the ankle bones? Get same-day assessment to rule out fracture.',
    },
    {
      id: 'foot-pain',
      label: 'Foot or heel pain',
      types: ['Physiotherapist'],
      keywords: 'heel pain',
      advice: 'Plantar fasciitis and Achilles problems are very common and respond well to loading programmes from a physiotherapist.',
    },
  ],
  neck: [
    {
      id: 'neck-pain',
      label: 'Neck pain or stiffness',
      types: ['Physiotherapist', 'Osteopath', 'Chiropractor'],
      keywords: 'neck pain',
      advice: 'Most neck pain is mechanical and improves with movement, posture work, and manual therapy.',
      redFlag: 'Neck pain after significant trauma (car accident, fall from height) needs urgent medical assessment.',
    },
    {
      id: 'neck-headache',
      label: 'Headaches from the neck',
      types: ['Physiotherapist', 'Osteopath'],
      keywords: 'cervicogenic headache',
      advice: 'Headaches that start at the base of the skull and worsen with neck movement often respond to targeted neck treatment.',
    },
  ],
  hip: [
    {
      id: 'hip-pain',
      label: 'Hip or groin pain',
      types: ['Physiotherapist', 'Sports Medicine'],
      keywords: 'hip pain',
      advice: 'Hip pain in active adults is often tendon-related or early joint changes. Accurate diagnosis guides very different treatments.',
    },
  ],
  head: [
    {
      id: 'mental-health',
      label: 'Stress, anxiety, or low mood',
      types: ['Psychologist'],
      keywords: 'anxiety',
      advice: 'Talking therapies have strong evidence for anxiety and depression. Many psychologists offer video consultations for faster access.',
      redFlag: 'If you are having thoughts of harming yourself, call 999, the Samaritans on 116 123, or text SHOUT to 85258 — available 24/7 and free.',
    },
    {
      id: 'concussion',
      label: 'Concussion / head knock during sport',
      types: ['Sports Medicine'],
      keywords: 'concussion',
      advice: 'Graduated return-to-play protocols after concussion need specialist supervision.',
      redFlag: 'Worsening headache, repeated vomiting, confusion, or drowsiness after a head injury → A&E immediately.',
    },
  ],
  general: [
    {
      id: 'general-checkup',
      label: 'General check-up or unexplained symptoms',
      types: ['GP'],
      keywords: '',
      advice: 'A GP is the right starting point for unexplained or general symptoms — they can examine, investigate, and refer onwards.',
    },
    {
      id: 'nutrition',
      label: 'Diet, weight, or nutrition support',
      types: ['Nutritionist'],
      keywords: 'nutrition',
      advice: 'A registered nutritionist can build a personalised plan for weight management, sports performance, or medical diets.',
    },
    {
      id: 'urgent',
      label: 'Urgent — I need to see someone today',
      types: [],
      keywords: '',
      emergency: true,
      advice: 'We can show you every practitioner near you offering emergency or same-day slots right now.',
      redFlag: 'For chest pain, severe breathing difficulty, signs of stroke, or heavy bleeding, call 999 — do not book online.',
    },
  ],
}
