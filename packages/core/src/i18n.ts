// Trilingual copy for Qatra (قطرة): English, French (Algeria's lingua franca),
// and Arabic (RTL). Every user-facing string in the redesign is keyed here so
// the UI can switch language at runtime and mirror direction for Arabic.

export type Lang = "en" | "fr" | "ar";

export const LANGS: Lang[] = ["en", "fr", "ar"];

/** Arabic is the only RTL language here. */
export function dir(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}

/** Font stack per language -- Cairo reads far better for Arabic than Jakarta. */
export function fontStack(lang: Lang): string {
  return lang === "ar"
    ? "'Cairo', sans-serif"
    : "'Plus Jakarta Sans', system-ui, sans-serif";
}

export interface Strings {
  tagline: string; imDonor: string; donorSub: string; imHospital: string; hospitalSub: string; trust: string; forDemos: string;
  email: string; password: string; orDemo: string; continueDemo: string;
  welcome: string; eligible: string; eligibleNow: string; donations: string; livesSaved: string; streak: string;
  ramadanTitle: string; ramadanSub: string;
  sosLabel: string; sosTitle: string; units: string; respond: string;
  reserveTitle: string; updatedNow: string; view: string;
  quickActions: string; findRequests: string; findRequestsSub: string;
  compensateTitle: string; compensateSub: string; schedule: string; scheduleSub: string;
  urgentRequests: string; sortedDistance: string; nearby: string; liveMap: string;
  requestDetails: string; requestedBy: string; bloodType: string; unitsNeeded: string;
  distance: string; details: string; posted: string; responseWindow: string;
  away: string; driveParking: string; emergencyPatient: string; directMatch: string; respondRequest: string;
  matchedTitle: string; matchedBody: string;
  location: string; confirmation: string; getDirections: string; backHome: string;
  becomeDonor: string; twoMinutes: string; registerBlurb: string;
  personalInfo: string; fullName: string; age: string; weight: string; eligibilitySection: string; eligibilityConsent: string; agreeTerms: string; completeReg: string;
  profile: string; nextEligible: string; ready: string;
  notifications: string; notifUrgent: string; notifRamadan: string; notifNearby: string;
  history: string; signOut: string; editProfile: string; settingsLabel: string;
  compensateHint: string; compensateBlurb: string;
  patientName: string; patientNamePh: string; patientFile: string; hospitalLabel: string;
  compensateNote: string; compensateCta: string;
  signedInAs: string; activeRequests: string; donorsMatched: string;
  openConsole: string; findDonors: string; findDonorsSub: string;
  navHome: string; navFind: string; navGive: string; navProfile: string;
  urgencyCritical: string; urgencyHigh: string; urgencyMedium: string; urgencyLow: string;
  deskTitle: string; critical: string; fulfilled: string;
  openRequests: string; viewAll: string; donorsNearby: string; compatibleDonors: string;
  deskSosCta: string; deskSosSub: string; deskSosBtn: string;
  deskSosLive: string; deskSosLiveSub: string; dismiss: string;
  dashboard: string; requestsNav: string; donorsNav: string; reserveNav: string;
  bloodRequestsTitle: string; searchPlaceholder: string; filterAll: string; filterNearby: string; newLabel: string;
  compensatePledged: string; thankYouPrefix: string; thankYouSuffix: string;
  patientRowLabel: string; fileRowLabel: string; referenceLabel: string;
  pledging: string; genericError: string;
  saveChanges: string; changesSaved: string; languageLabel: string;
  shareMessage: string; shareLabel: string;
  drivesTitle: string; drivesSub: string;
  urgencyHeader: string; printLabel: string; exportLabel: string;
  downloadCertificate: string; certTitle: string; certIntro: string; certBody: string; certThanks: string;
  phoneLabel: string; wilayaField: string; lastDonationLabel: string;
  preferencesLabel: string; ramadanToggle: string; defaultWilayaLabel: string; allWilayas: string;
  aboutLabel: string; versionLabel: string;
  daysLeft: string; offlineBanner: string;
  noNotifications: string; newRequestTitle: string; patientIdLabel: string;
  publishRequest: string; requestPublished: string; publishing: string;
  sosStartedToast: string; sosStoppedToast: string;
  hospitalsTitle: string; hospitalsSub: string; openInMaps: string; hospSearchPh: string;

  // --- Patient/association model (behind the patientModel feature flag) ---
  verifiedByLabel: string; verifiedShort: string; notVerifiedShort: string; shareVerifiedSuffix: string;
  postRequestTitle: string; postRequestSub: string; hospitalNameOptional: string; contactPhoneLabel: string;
  patientFileOptional: string; postRequestCta: string; posting: string; requestPosted: string;
  verifyPhoneTitle: string; verifyPhoneSub: string; sendCodeCta: string; sendingCode: string;
  codeLabel: string; verifyCodeCta: string; verifyingCode: string; phoneVerifiedToast: string;
  invalidPhone: string; verifyRequiredNote: string;
  verifyWhyTitle: string; verifyWhyBody: string; verifyPhoneFormatHint: string;
  skipConsequence: string; resendIn: string; changeNumber: string;
  flowStepRequest: string; flowStepVerify: string; flowStepPosted: string;
  draftSavedTitle: string; verifyWhyLead: string; postCtaHint: string;
  coverageMapped: string; coverageUnmapped: string;
  postedAsDonorsSee: string; postedWhatNow: string;
  postedGeoMapped: string; postedGeoUnmapped: string;
  postedBadgeNote: string; postedPrivacyNote: string;
  postedShareWhatsApp: string; postedSeeMine: string; postedStartAgain: string;
  assocConsoleTitle: string; assocConsoleSub: string; verifyAction: string; unverifyAction: string;
  verifyAdminsOnly: string;
  verifiedToast: string; unverifiedToast: string; noRequestsWilaya: string;
  assocPendingTitle: string; assocPendingSub: string;
  assocApplyTitle: string; assocApplySub: string; assocNameLabel: string; assocTypeLabel: string;
  assocTypeRedCrescent: string; assocTypeScouts: string; assocTypeStudent: string; assocTypeOther: string;
  assocApplyCta: string; assocAppliedToast: string;
  consentTitle: string; consentIntro: string; consentPoint1: string; consentPoint2: string; consentPoint3: string;
  consentAgreeLabel: string; consentContinueCta: string; consentRequiredError: string;
  consentScope: string; consentNever1: string; consentNever2: string; consentVersionNote: string;
  dataRightsTitle: string; dataRightsSub: string; dsrExport: string; dsrCorrection: string; dsrDeletion: string;
  dsrSubmittedToast: string; dsrDetailsPh: string;
  dsrExportDetail: string; dsrCorrectionDetail: string; dsrDeletionDetail: string;
  dsrDeletionLegal: string; dsrQueueTitle: string;
  assocWilayaHint: string; assocReviewNote: string;
  assocStep1: string; assocStep1Body: string; assocStep2: string; assocStep2Body: string;
  assocStep3: string; assocStep3Body: string;
  assocMeanwhileTitle: string; assocMeanwhile1: string; assocMeanwhile2: string; assocMeanwhile3: string;
  navRequestLabel: string; navVerifyLabel: string;
  eligibleInDays: string; eligibleLabel: string;

  // --- Donor search + contact-sharing consent ---
  donorSearchTitle: string; donorSearchSub: string; allTypesLabel: string;
  includeCooldownLabel: string; noDonorsFound: string; donorSearchDenied: string;
  callLabel: string; numberNotShared: string; numberNotSharedHint: string;
  contactConsentTitle: string; contactConsentBody: string; contactConsentToggle: string;
  contactConsentOn: string; contactConsentOff: string; navDonorsLabel: string;
  skipForNow: string; verifyLaterHint: string;
  hospitalMatched: string; hospitalFreeTextHint: string; hospitalNoDirectoryHint: string;
  blockWho: string; blockWhere: string; blockUrgency: string;
  bloodTypeUnsure: string; contactPhoneHint: string; addFileNumber: string;
  verifyBannerSub: string; postRequestFooter: string;
  urgencyCriticalHint: string; urgencyHighHint: string; urgencyMediumHint: string; urgencyLowHint: string;
  unitsOne: string; unitsTwo: string; unitsFew: string;
  imPatient: string; patientSub: string; demoAsPatient: string; taglinePatient: string;

  // --- Committee hub (Nav B) ---
  navCommittee: string; navCommitteeWaiting: string; committeeTitle: string; committeeVerifyCard: string; committeeVerifySub: string;
  committeeDonorsCard: string; committeeDonorsSub: string; committeeNoneToday: string;
  staleTitle: string; staleBody: string;
}

export const I18N: Record<Lang, Strings> = {
  en: {
    tagline: "Every drop connects a life. Match donors and hospitals across Algeria, in real time.",
    imDonor: "I'm a Donor", donorSub: "Give blood, save up to 3 lives",
    imHospital: "I'm a Hospital", hospitalSub: "Request units, find donors fast",
    trust: "Aligned with national blood-donation guidelines", forDemos: "For demonstrations",
    email: "Email", password: "Password", orDemo: "or", continueDemo: "Continue with demo account",
    welcome: "Welcome back", eligible: "eligible", eligibleNow: "You're eligible to donate",
    donations: "Donations", livesSaved: "Lives saved", streak: "Streak",
    ramadanTitle: "Ramadan night donation", ramadanSub: "Centers open tonight until 3:00 — after Tarawih",
    sosLabel: "SOS · URGENT", sosTitle: "Critical {bloodType} request nearby", units: "units", respond: "Respond",
    reserveTitle: "National reserve", updatedNow: "live", view: "View",
    quickActions: "Quick actions", findRequests: "Find urgent requests", findRequestsSub: "3 near you right now",
    compensateTitle: "Compensate for a patient", compensateSub: "Donate in a patient's name",
    schedule: "Blood drives near you", scheduleSub: "See upcoming donation events",
    urgentRequests: "Urgent requests", sortedDistance: "Sorted by distance", nearby: "nearby", liveMap: "Live map",
    requestDetails: "Request details", requestedBy: "Requested by", bloodType: "Blood type", unitsNeeded: "Units needed",
    distance: "Distance", details: "Details", posted: "Posted", responseWindow: "Response window: 4 hours",
    away: "away", driveParking: "~8 min drive · free parking", emergencyPatient: "Emergency surgery patient",
    directMatch: "Your A+ type is a direct match.", respondRequest: "Respond to request",
    matchedTitle: "You're matched!", matchedBody: "The hospital has been notified. Head over to donate — you could save up to 3 lives today.",
    location: "Location", confirmation: "Confirmation", getDirections: "Get directions", backHome: "Back to home",
    becomeDonor: "Become a donor", twoMinutes: "Takes about 2 minutes",
    registerBlurb: "Your details help us match you with patients in need. Everything stays confidential.",
    personalInfo: "Personal information", fullName: "Full name", age: "Age", weight: "Weight (kg)",
    eligibilitySection: "Eligibility", eligibilityConsent: "I'm in good health, weigh 50kg+, and I'm 18–65 years old.", agreeTerms: "I agree to the terms and privacy policy.", completeReg: "Complete registration",
    profile: "Profile", nextEligible: "Next eligible donation", ready: "Ready",
    notifications: "Notifications", notifUrgent: "Urgent blood requests", notifRamadan: "Ramadan campaigns", notifNearby: "Nearby drives",
    history: "Donation history", signOut: "Sign out", editProfile: "Edit profile", settingsLabel: "Settings",
    compensateHint: "Family replacement", compensateBlurb: "When regional stock is low, a patient's transfusion can be released once someone donates in their name — any blood type counts.",
    patientName: "Patient name", patientNamePh: "e.g. Amel K.", patientFile: "Patient file №", hospitalLabel: "Hospital",
    compensateNote: "You don't need to match the patient's blood type — you're replacing a unit for the shared reserve.",
    compensateCta: "Pledge a compensation donation",
    signedInAs: "Signed in as", activeRequests: "Active requests", donorsMatched: "Donors matched",
    openConsole: "Open the full hospital console", findDonors: "Find donors", findDonorsSub: "Search available donors nearby",
    navHome: "Home", navFind: "Find", navGive: "Give", navProfile: "Profile",
    urgencyCritical: "Critical", urgencyHigh: "High", urgencyMedium: "Medium", urgencyLow: "Low",
    deskTitle: "Requests overview", critical: "Critical", fulfilled: "Fulfilled this month",
    openRequests: "Open requests", viewAll: "View all", donorsNearby: "Donors nearby", compatibleDonors: "compatible donors",
    deskSosCta: "Emergency?", deskSosSub: "Broadcast an SOS to every compatible donor nearby.", deskSosBtn: "Broadcast SOS",
    deskSosLive: "SOS broadcast is live", deskSosLiveSub: "Sent to 12 compatible A+ donors within 5 km", dismiss: "Dismiss",
    dashboard: "Dashboard", requestsNav: "Requests", donorsNav: "Donors", reserveNav: "Reserve",
    bloodRequestsTitle: "Blood requests", searchPlaceholder: "Search patient ID or type…", filterAll: "All", filterNearby: "Nearby", newLabel: "New",
    compensatePledged: "Compensation pledged", thankYouPrefix: "Thank you for standing in for", thankYouSuffix: "Show this reference at the donation desk to release their unit.",
    patientRowLabel: "Patient", fileRowLabel: "File №", referenceLabel: "Reference",
    pledging: "Pledging…", genericError: "Something went wrong",
    saveChanges: "Save changes", changesSaved: "Changes saved", languageLabel: "Language",
    shareMessage: "Urgent: {bloodType} blood needed at {hospital} ({distance} away, {units} units). Every donor counts — please share.",
    shareLabel: "Share",
    drivesTitle: "Blood drives", drivesSub: "Community donation events near you",
    urgencyHeader: "Urgency", printLabel: "Print", exportLabel: "Export CSV",
    downloadCertificate: "Download certificate",
    certTitle: "Certificate of Blood Donation",
    certIntro: "This certifies that",
    certBody: "donated blood on {date} at {location} ({type}, {units} unit(s)).",
    certThanks: "Thank you for this life-saving contribution.",
    phoneLabel: "Phone number", wilayaField: "Wilaya", lastDonationLabel: "Last donation date",
    preferencesLabel: "Preferences", ramadanToggle: "Ramadan mode (night donation banner)",
    defaultWilayaLabel: "Default wilaya for requests", allWilayas: "All wilayas",
    aboutLabel: "About", versionLabel: "Version",
    daysLeft: "days left", offlineBanner: "You're offline — showing the latest saved data",
    noNotifications: "You're all caught up", newRequestTitle: "New blood request", patientIdLabel: "Patient ID",
    publishRequest: "Publish request", requestPublished: "Request published — nearby donors will see it", publishing: "Publishing…",
    sosStartedToast: "SOS broadcast started", sosStoppedToast: "SOS broadcast stopped",
    hospitalsTitle: "Hospitals & blood centers", hospitalsSub: "Find the nearest center", openInMaps: "Open in Google Maps", hospSearchPh: "Search by name or wilaya…",

    verifiedByLabel: "Verified by {association}", verifiedShort: "Verified", notVerifiedShort: "Not verified",
    shareVerifiedSuffix: "Verified by {association} via Qatra.",
    postRequestTitle: "Request blood", postRequestSub: "For a patient or a family member",
    hospitalNameOptional: "Hospital (optional)", contactPhoneLabel: "Contact phone",
    patientFileOptional: "Patient file № (optional)", postRequestCta: "Post request", posting: "Posting…",
    requestPosted: "Request posted — donors nearby will see it",
    verifyPhoneTitle: "Verify your phone", verifyPhoneSub: "We'll send a code by SMS.",
    sendCodeCta: "Send code", sendingCode: "Sending…", codeLabel: "6-digit code",
    verifyCodeCta: "Verify", verifyingCode: "Verifying…", phoneVerifiedToast: "Phone verified",
    invalidPhone: "Enter a valid Algerian mobile number (05/06/07…)",
    verifyWhyTitle: "Why we ask",
    verifyWhyBody: "A donor who drives across the wilaya is trusting that a real person is at the other end of the number.",
    verifyPhoneFormatHint: "Algerian mobile numbers only — 05, 06 or 07.",
    skipConsequence: "You can donate, respond to requests, and use everything else. The one thing that waits is posting a request of your own — that needs a verified number, and you can come back to it any time.",
    resendIn: "Resend in {seconds}", changeNumber: "Change number",
    verifyRequiredNote: "Verify your phone number before posting a request.",
    flowStepRequest: "Request", flowStepVerify: "Verify", flowStepPosted: "Posted",
    draftSavedTitle: "Your request is saved as a draft",
    verifyWhyLead: "This is what keeps requests trustworthy.",
    postCtaHint: "One SMS code, then it goes live.",
    coverageMapped: "{wilaya} is one of the {count} wilayas with hospitals on file — suggestions appear as you type.",
    coverageUnmapped: "{wilaya} has no hospitals on file — type any name and it is accepted as written.",
    postedAsDonorsSee: "As donors see it",
    postedWhatNow: "What happens now",
    postedGeoMapped: "Matching donors in {wilaya} are notified, and your request appears on the donor map.",
    postedGeoUnmapped: "Matching donors in {wilaya} are notified. Your request appears in the list, without a map pin.",
    postedBadgeNote: "A committee in your wilaya may add its badge. Your request is live either way.",
    postedPrivacyNote: "Only your contact number is shown — nothing else from your profile.",
    postedShareWhatsApp: "Share on WhatsApp", postedSeeMine: "See my request", postedStartAgain: "Start again",
    assocConsoleTitle: "Association console", assocConsoleSub: "Open requests in {wilaya}",
    verifyAction: "Verify", unverifyAction: "Remove verification",
    verifyAdminsOnly: "Only your committee's admins can verify a request — verifying signs the association's name to it. Ask an admin to review this one.",
    verifiedToast: "Request verified", unverifiedToast: "Verification removed",
    noRequestsWilaya: "No open requests in this wilaya right now",
    assocPendingTitle: "Awaiting Qatra approval",
    assocPendingSub: "You'll be able to verify requests in your wilaya once your association is approved.",
    assocApplyTitle: "Register an association", assocApplySub: "Croissant-Rouge committee, scout group, or student association",
    assocNameLabel: "Association name", assocTypeLabel: "Type",
    assocTypeRedCrescent: "Croissant-Rouge Algérien", assocTypeScouts: "Scouts", assocTypeStudent: "Student association", assocTypeOther: "Other",
    assocApplyCta: "Submit application", assocAppliedToast: "Application submitted — Qatra will review it",
    consentTitle: "Consent to health data",
    consentIntro: "Qatra needs your explicit permission to handle medical information. This is separate from the general terms, and you can withdraw it at any time.",
    consentPoint1: "Your blood type and donation dates are used to match you with requests.",
    consentPoint2: "Hospitals and verifying associations see only what a match requires — never your full history.",
    consentPoint3: "You can request a copy, a correction, or deletion of your data at any time.",
    consentScope: "Two things only: your blood type, and the dates you gave.",
    consentNever1: "Never used to rank donors, and never shared with an employer or an insurer.",
    consentNever2: "Your phone number is a separate choice, made in your profile, and off unless you turn it on.",
    consentVersionNote: "Text version {version} · we store which version you agreed to",
    consentAgreeLabel: "I consent to Qatra processing my blood type and donation history for matching.",
    consentContinueCta: "Agree and continue", consentRequiredError: "Consent is required to continue",
    dataRightsTitle: "Your data", dataRightsSub: "Request a copy, a correction, or deletion",
    dsrExport: "Request a copy of my data", dsrCorrection: "Request a correction", dsrDeletion: "Request deletion",
    dsrSubmittedToast: "Request submitted — we'll get back to you", dsrDetailsPh: "What should we correct or delete?",
    dsrExportDetail: "A file with your profile, donations and requests · about 5 days",
    dsrCorrectionDetail: "Wrong blood type, wrong donation date, misspelled name",
    dsrDeletionDetail: "Reviewed by a person, then confirmed to you",
    dsrDeletionLegal: "A record that you consented has to stay, by law. Everything else goes.",
    dsrQueueTitle: "Your requests",
    assocWilayaHint: "You'll only be able to vouch for requests in this wilaya.",
    assocReviewNote: "Qatra staff check that the committee exists and that you speak for it. Usually within a week.",
    assocStep1: "Application received", assocStep1Body: "We have it — nothing was lost.",
    assocStep2: "A person is checking it", assocStep2Body: "We confirm the committee exists and that you speak for it. Nothing for you to do.",
    assocStep3: "Committee tab appears", assocStep3Body: "Approved committees can vouch for requests in {wilaya}.",
    assocMeanwhileTitle: "Meanwhile, nothing is on hold",
    assocMeanwhile1: "Respond to requests and donate as usual",
    assocMeanwhile2: "Post a request for a patient",
    assocMeanwhile3: "Share requests to WhatsApp — no badge needed",
    navRequestLabel: "Request", navVerifyLabel: "Verify",
    eligibleInDays: "Eligible in {days} days", eligibleLabel: "Eligible",

    donorSearchTitle: "Find donors", donorSearchSub: "Registered donors in {wilaya}",
    allTypesLabel: "All types", includeCooldownLabel: "Include donors still in cooldown",
    noDonorsFound: "No donors match in this wilaya",
    donorSearchDenied: "Only a verified association can search donors here",
    callLabel: "Call", numberNotShared: "Number not shared",
    numberNotSharedHint: "This donor hasn't agreed to be phoned directly. Reach them through a request instead.",
    contactConsentTitle: "Direct contact", contactConsentBody: "Verified associations can see your phone number and call you about urgent requests matching your blood type. You can turn this off at any time.",
    contactConsentToggle: "Let verified associations call me",
    contactConsentOn: "Associations can now call you", contactConsentOff: "Your number is hidden again",
    navDonorsLabel: "Donors",
    skipForNow: "Skip for now", verifyLaterHint: "You can do this later — but you'll need a verified number before you can post a request.",
    unitsOne: "unit", unitsTwo: "units", unitsFew: "units",
    imPatient: "I need blood", patientSub: "Post a request for a patient or family member", demoAsPatient: "View demo as Patient",
    taglinePatient: "Every drop connects a life. Families ask, associations vouch, donors answer — across Algeria, in real time.",
    navCommittee: "Committee", navCommitteeWaiting: "Committee, {count} awaiting verification", committeeTitle: "Your committee",
    committeeVerifyCard: "Verify requests", committeeVerifySub: "{waiting} waiting",
    committeeDonorsCard: "Find donors", committeeDonorsSub: "Registered donors in {wilaya}",
    committeeNoneToday: "Nothing waiting — the list is clear",
    staleTitle: "{count} open more than a month",
    staleBody: "Nothing closes them automatically. Call the families and clear the list.",
    hospitalMatched: "Matched to a known hospital — your request will show on the donor map.",
    hospitalFreeTextHint: "Pick from the list to place your request on the map, or type any hospital name.",
    hospitalNoDirectoryHint: "We'll use exactly what you typed. Your request goes in the list for this wilaya — no map pin, and no difference to who sees it.",
    blockWho: "Who needs blood", blockWhere: "Where", blockUrgency: "How urgent, and how to reach you",
    bloodTypeUnsure: "Not sure? The hospital's file has it — leave it and call us.",
    contactPhoneHint: "Shown to donors who open your request.",
    addFileNumber: "Add patient file number",
    verifyBannerSub: "One code by SMS. Fill this in first if you like — we'll keep what you typed.",
    postRequestFooter: "Donors in {wilaya} see it straight away. A committee may add its badge later — your request is live either way.",
    urgencyCriticalHint: "needed today", urgencyHighHint: "in the next few days",
    urgencyMediumHint: "planned operation", urgencyLowHint: "no date set yet",
  },
  fr: {
    tagline: "Chaque goutte relie une vie. Reliez donneurs et hôpitaux à travers l'Algérie, en temps réel.",
    imDonor: "Je suis donneur", donorSub: "Donnez votre sang, sauvez 3 vies",
    imHospital: "Je suis un hôpital", hospitalSub: "Demandez des unités, trouvez vite",
    trust: "Conforme aux directives nationales du don de sang", forDemos: "Pour les démonstrations",
    email: "E-mail", password: "Mot de passe", orDemo: "ou", continueDemo: "Continuer en mode démo",
    welcome: "Bon retour", eligible: "éligible", eligibleNow: "Vous pouvez donner",
    donations: "Dons", livesSaved: "Vies sauvées", streak: "Série",
    ramadanTitle: "Don de nuit — Ramadan", ramadanSub: "Centres ouverts ce soir jusqu'à 3h — après les Tarawih",
    sosLabel: "SOS · URGENT", sosTitle: "Demande {bloodType} critique à proximité", units: "unités", respond: "Répondre",
    reserveTitle: "Réserve nationale", updatedNow: "en direct", view: "Voir",
    quickActions: "Actions rapides", findRequests: "Demandes urgentes", findRequestsSub: "3 près de vous",
    compensateTitle: "Compenser pour un patient", compensateSub: "Donner au nom d'un patient",
    schedule: "Collectes près de vous", scheduleSub: "Voir les événements de don à venir",
    urgentRequests: "Demandes urgentes", sortedDistance: "Par distance", nearby: "à proximité", liveMap: "Carte live",
    requestDetails: "Détails de la demande", requestedBy: "Demandé par", bloodType: "Groupe", unitsNeeded: "Unités",
    distance: "Distance", details: "Détails", posted: "Publié", responseWindow: "Fenêtre : 4 heures",
    away: "de distance", driveParking: "~8 min · parking gratuit", emergencyPatient: "Patient en chirurgie urgente",
    directMatch: "Votre groupe A+ correspond.", respondRequest: "Répondre à la demande",
    matchedTitle: "Vous êtes jumelé !", matchedBody: "L'hôpital a été notifié. Rendez-vous pour donner — vous pouvez sauver 3 vies aujourd'hui.",
    location: "Lieu", confirmation: "Confirmation", getDirections: "Itinéraire", backHome: "Accueil",
    becomeDonor: "Devenir donneur", twoMinutes: "Environ 2 minutes",
    registerBlurb: "Vos informations nous aident à vous jumeler avec des patients. Tout reste confidentiel.",
    personalInfo: "Informations", fullName: "Nom complet", age: "Âge", weight: "Poids (kg)",
    eligibilitySection: "Éligibilité", eligibilityConsent: "Je suis en bonne santé, 50kg+, entre 18 et 65 ans.", agreeTerms: "J'accepte les conditions et la politique de confidentialité.", completeReg: "Terminer l'inscription",
    profile: "Profil", nextEligible: "Prochain don possible", ready: "Prêt",
    notifications: "Notifications", notifUrgent: "Demandes urgentes", notifRamadan: "Campagnes Ramadan", notifNearby: "Collectes proches",
    history: "Historique des dons", signOut: "Se déconnecter", editProfile: "Modifier le profil", settingsLabel: "Paramètres",
    compensateHint: "Don compensatoire", compensateBlurb: "Quand le stock régional est bas, la transfusion d'un patient est libérée dès qu'une personne donne en son nom — tout groupe compte.",
    patientName: "Nom du patient", patientNamePh: "ex. Amel K.", patientFile: "Dossier patient №", hospitalLabel: "Hôpital",
    compensateNote: "Pas besoin du même groupe — vous remplacez une unité pour la réserve commune.",
    compensateCta: "Promettre un don de compensation",
    signedInAs: "Connecté en tant que", activeRequests: "Demandes actives", donorsMatched: "Donneurs jumelés",
    openConsole: "Ouvrir la console hôpital", findDonors: "Trouver des donneurs", findDonorsSub: "Donneurs disponibles à proximité",
    navHome: "Accueil", navFind: "Chercher", navGive: "Donner", navProfile: "Profil",
    urgencyCritical: "Critique", urgencyHigh: "Élevée", urgencyMedium: "Moyenne", urgencyLow: "Faible",
    deskTitle: "Vue des demandes", critical: "Critiques", fulfilled: "Satisfaites ce mois",
    openRequests: "Demandes ouvertes", viewAll: "Tout voir", donorsNearby: "Donneurs à proximité", compatibleDonors: "donneurs compatibles",
    deskSosCta: "Urgence ?", deskSosSub: "Diffusez un SOS à chaque donneur compatible proche.", deskSosBtn: "Diffuser un SOS",
    deskSosLive: "Diffusion SOS active", deskSosLiveSub: "Envoyé à 12 donneurs A+ dans un rayon de 5 km", dismiss: "Fermer",
    dashboard: "Tableau de bord", requestsNav: "Demandes", donorsNav: "Donneurs", reserveNav: "Réserve",
    bloodRequestsTitle: "Demandes de sang", searchPlaceholder: "Rechercher un patient ou un groupe…", filterAll: "Tous", filterNearby: "À proximité", newLabel: "Nouveau",
    compensatePledged: "Don de compensation promis", thankYouPrefix: "Merci de vous porter garant pour", thankYouSuffix: "Présentez cette référence au bureau de don pour libérer son unité.",
    patientRowLabel: "Patient", fileRowLabel: "Dossier №", referenceLabel: "Référence",
    pledging: "Envoi…", genericError: "Une erreur s'est produite",
    saveChanges: "Enregistrer", changesSaved: "Modifications enregistrées", languageLabel: "Langue",
    shareMessage: "Urgent : don de sang {bloodType} nécessaire à {hospital} ({distance}, {units} unités). Chaque donneur compte — merci de partager.",
    shareLabel: "Partager",
    drivesTitle: "Collectes de sang", drivesSub: "Événements de don organisés près de chez vous",
    urgencyHeader: "Urgence", printLabel: "Imprimer", exportLabel: "Exporter en CSV",
    downloadCertificate: "Télécharger l'attestation",
    certTitle: "Attestation de don de sang",
    certIntro: "Ceci certifie que",
    certBody: "a donné son sang le {date} à {location} ({type}, {units} unité(s)).",
    certThanks: "Merci pour cette contribution qui sauve des vies.",
    phoneLabel: "Numéro de téléphone", wilayaField: "Wilaya", lastDonationLabel: "Date du dernier don",
    preferencesLabel: "Préférences", ramadanToggle: "Mode Ramadan (bannière don de nuit)",
    defaultWilayaLabel: "Wilaya par défaut pour les demandes", allWilayas: "Toutes les wilayas",
    aboutLabel: "À propos", versionLabel: "Version",
    daysLeft: "jours restants", offlineBanner: "Hors ligne — affichage des dernières données enregistrées",
    noNotifications: "Rien de nouveau", newRequestTitle: "Nouvelle demande de sang", patientIdLabel: "ID patient",
    publishRequest: "Publier la demande", requestPublished: "Demande publiée — les donneurs à proximité la verront", publishing: "Publication…",
    sosStartedToast: "Diffusion SOS lancée", sosStoppedToast: "Diffusion SOS arrêtée",
    hospitalsTitle: "Hôpitaux et centres de sang", hospitalsSub: "Trouvez le centre le plus proche", openInMaps: "Ouvrir dans Google Maps", hospSearchPh: "Rechercher par nom ou wilaya…",

    verifiedByLabel: "Vérifié par {association}", verifiedShort: "Vérifié", notVerifiedShort: "Non vérifié",
    shareVerifiedSuffix: "Vérifié par {association} via Qatra.",
    postRequestTitle: "Demander du sang", postRequestSub: "Pour un patient ou un proche",
    hospitalNameOptional: "Hôpital (facultatif)", contactPhoneLabel: "Téléphone de contact",
    patientFileOptional: "Dossier patient № (facultatif)", postRequestCta: "Publier la demande", posting: "Publication…",
    requestPosted: "Demande publiée — les donneurs à proximité la verront",
    verifyPhoneTitle: "Vérifiez votre téléphone", verifyPhoneSub: "Nous envoyons un code par SMS.",
    sendCodeCta: "Envoyer le code", sendingCode: "Envoi…", codeLabel: "Code à 6 chiffres",
    verifyCodeCta: "Vérifier", verifyingCode: "Vérification…", phoneVerifiedToast: "Téléphone vérifié",
    invalidPhone: "Saisissez un numéro de mobile algérien valide (05/06/07…)",
    verifyWhyTitle: "Pourquoi nous le demandons",
    verifyWhyBody: "Un donneur qui traverse la wilaya fait confiance au fait qu'une vraie personne est au bout du numéro.",
    verifyPhoneFormatHint: "Numéros de mobile algériens uniquement — 05, 06 ou 07.",
    skipConsequence: "Vous pouvez donner, répondre aux demandes et utiliser tout le reste. La seule chose qui attend, c'est publier votre propre demande — cela exige un numéro vérifié, et vous pouvez y revenir quand vous voulez.",
    resendIn: "Renvoyer dans {seconds}", changeNumber: "Changer de numéro",
    verifyRequiredNote: "Vérifiez votre numéro avant de publier une demande.",
    flowStepRequest: "Demande", flowStepVerify: "Vérification", flowStepPosted: "Publiée",
    draftSavedTitle: "Votre demande est enregistrée en brouillon",
    verifyWhyLead: "C'est ce qui rend les demandes fiables.",
    postCtaHint: "Un code SMS, puis elle est publiée.",
    coverageMapped: "{wilaya} fait partie des {count} wilayas dont les hôpitaux sont répertoriés — des suggestions apparaissent à la saisie.",
    coverageUnmapped: "Aucun hôpital répertorié pour {wilaya} — saisissez n'importe quel nom, il sera accepté tel quel.",
    postedAsDonorsSee: "Vue par les donneurs",
    postedWhatNow: "Et maintenant",
    postedGeoMapped: "Les donneurs compatibles à {wilaya} sont prévenus, et votre demande apparaît sur la carte.",
    postedGeoUnmapped: "Les donneurs compatibles à {wilaya} sont prévenus. Votre demande figure dans la liste, sans repère sur la carte.",
    postedBadgeNote: "Un comité de votre wilaya peut ajouter son badge. Votre demande est active dans tous les cas.",
    postedPrivacyNote: "Seul votre numéro de contact est affiché — rien d'autre de votre profil.",
    postedShareWhatsApp: "Partager sur WhatsApp", postedSeeMine: "Voir ma demande", postedStartAgain: "Recommencer",
    assocConsoleTitle: "Console association", assocConsoleSub: "Demandes ouvertes à {wilaya}",
    verifyAction: "Vérifier", unverifyAction: "Retirer la vérification",
    verifyAdminsOnly: "Seuls les administrateurs de votre comité peuvent vérifier une demande — vérifier engage le nom de l'association. Demandez à un administrateur de l'examiner.",
    verifiedToast: "Demande vérifiée", unverifiedToast: "Vérification retirée",
    noRequestsWilaya: "Aucune demande ouverte dans cette wilaya pour le moment",
    assocPendingTitle: "En attente d'approbation",
    assocPendingSub: "Vous pourrez vérifier les demandes de votre wilaya une fois votre association approuvée.",
    assocApplyTitle: "Enregistrer une association", assocApplySub: "Comité du Croissant-Rouge, groupe scout ou association estudiantine",
    assocNameLabel: "Nom de l'association", assocTypeLabel: "Type",
    assocTypeRedCrescent: "Croissant-Rouge Algérien", assocTypeScouts: "Scouts", assocTypeStudent: "Association estudiantine", assocTypeOther: "Autre",
    assocApplyCta: "Envoyer la demande", assocAppliedToast: "Demande envoyée — Qatra va l'examiner",
    consentTitle: "Consentement aux données de santé",
    consentIntro: "Qatra a besoin de votre autorisation explicite pour traiter des informations médicales. C'est distinct des conditions générales, et vous pouvez la retirer à tout moment.",
    consentPoint1: "Votre groupe sanguin et vos dates de don servent à vous jumeler avec des demandes.",
    consentPoint2: "Les hôpitaux et les associations vérificatrices ne voient que le nécessaire — jamais tout votre historique.",
    consentPoint3: "Vous pouvez demander une copie, une correction ou la suppression de vos données à tout moment.",
    consentScope: "Deux choses seulement : votre groupe sanguin et vos dates de don.",
    consentNever1: "Jamais utilisé pour classer les donneurs, jamais transmis à un employeur ou à un assureur.",
    consentNever2: "Votre numéro est un choix distinct, fait dans votre profil, et désactivé tant que vous ne l'activez pas.",
    consentVersionNote: "Version du texte {version} · nous conservons la version que vous avez acceptée",
    consentAgreeLabel: "Je consens à ce que Qatra traite mon groupe sanguin et mon historique de dons à des fins de jumelage.",
    consentContinueCta: "Accepter et continuer", consentRequiredError: "Le consentement est nécessaire pour continuer",
    dataRightsTitle: "Vos données", dataRightsSub: "Demander une copie, une correction ou la suppression",
    dsrExport: "Demander une copie de mes données", dsrCorrection: "Demander une correction", dsrDeletion: "Demander la suppression",
    dsrSubmittedToast: "Demande envoyée — nous vous répondrons", dsrDetailsPh: "Que devons-nous corriger ou supprimer ?",
    dsrExportDetail: "Un fichier avec votre profil, vos dons et vos demandes · environ 5 jours",
    dsrCorrectionDetail: "Groupe sanguin erroné, date de don erronée, nom mal orthographié",
    dsrDeletionDetail: "Examinée par une personne, puis confirmée",
    dsrDeletionLegal: "La preuve de votre consentement doit être conservée, par la loi. Tout le reste est supprimé.",
    dsrQueueTitle: "Vos demandes",
    assocWilayaHint: "Vous ne pourrez vérifier que les demandes de cette wilaya.",
    assocReviewNote: "Qatra vérifie que le comité existe et que vous le représentez. En général sous une semaine.",
    assocStep1: "Demande reçue", assocStep1Body: "Nous l'avons bien — rien n'a été perdu.",
    assocStep2: "Une personne l'examine", assocStep2Body: "Nous confirmons que le comité existe et que vous le représentez. Rien à faire de votre côté.",
    assocStep3: "L'onglet Comité apparaît", assocStep3Body: "Les comités approuvés peuvent vérifier les demandes de {wilaya}.",
    assocMeanwhileTitle: "En attendant, rien n'est bloqué",
    assocMeanwhile1: "Répondez aux demandes et donnez comme d'habitude",
    assocMeanwhile2: "Publiez une demande pour un patient",
    assocMeanwhile3: "Partagez des demandes sur WhatsApp — sans badge",
    navRequestLabel: "Demander", navVerifyLabel: "Vérifier",
    eligibleInDays: "Éligible dans {days} jours", eligibleLabel: "Éligible",

    donorSearchTitle: "Trouver des donneurs", donorSearchSub: "Donneurs inscrits à {wilaya}",
    allTypesLabel: "Tous les groupes", includeCooldownLabel: "Inclure les donneurs en délai d'attente",
    noDonorsFound: "Aucun donneur ne correspond dans cette wilaya",
    donorSearchDenied: "Seule une association vérifiée peut rechercher des donneurs ici",
    callLabel: "Appeler", numberNotShared: "Numéro non partagé",
    numberNotSharedHint: "Ce donneur n'a pas accepté d'être appelé directement. Contactez-le via une demande.",
    contactConsentTitle: "Contact direct", contactConsentBody: "Les associations vérifiées peuvent voir votre numéro et vous appeler pour des demandes urgentes correspondant à votre groupe sanguin. Vous pouvez désactiver cela à tout moment.",
    contactConsentToggle: "Autoriser les associations vérifiées à m'appeler",
    contactConsentOn: "Les associations peuvent vous appeler", contactConsentOff: "Votre numéro est de nouveau masqué",
    navDonorsLabel: "Donneurs",
    skipForNow: "Plus tard", verifyLaterHint: "Vous pouvez le faire plus tard — mais un numéro vérifié est nécessaire pour publier une demande.",
    unitsOne: "unité", unitsTwo: "unités", unitsFew: "unités",
    imPatient: "J'ai besoin de sang", patientSub: "Publier une demande pour un proche", demoAsPatient: "Démo en tant que patient",
    taglinePatient: "Chaque goutte relie une vie. Les familles demandent, les associations vérifient, les donneurs répondent — partout en Algérie.",
    navCommittee: "Comité", navCommitteeWaiting: "Comité, {count} en attente de vérification", committeeTitle: "Votre comité",
    committeeVerifyCard: "Vérifier les demandes", committeeVerifySub: "{waiting} en attente",
    committeeDonorsCard: "Trouver des donneurs", committeeDonorsSub: "Donneurs inscrits à {wilaya}",
    committeeNoneToday: "Rien en attente — la liste est à jour",
    staleTitle: "{count} ouvertes depuis plus d'un mois",
    staleBody: "Rien ne les ferme automatiquement. Appelez les familles et videz la liste.",
    hospitalMatched: "Hôpital reconnu — votre demande apparaîtra sur la carte des donneurs.",
    hospitalFreeTextHint: "Choisissez dans la liste pour apparaître sur la carte, ou saisissez n'importe quel hôpital.",
    hospitalNoDirectoryHint: "Nous utiliserons exactement ce que vous avez saisi. Votre demande figure dans la liste de cette wilaya — sans repère sur la carte, et sans différence sur qui la voit.",
    blockWho: "Qui a besoin de sang", blockWhere: "Où", blockUrgency: "Urgence, et comment vous joindre",
    bloodTypeUnsure: "Vous ne savez pas ? Le dossier de l'hôpital l'indique — laissez et appelez-nous.",
    contactPhoneHint: "Visible par les donneurs qui ouvrent votre demande.",
    addFileNumber: "Ajouter le numéro de dossier",
    verifyBannerSub: "Un code par SMS. Remplissez d'abord si vous préférez — nous gardons ce que vous avez saisi.",
    postRequestFooter: "Les donneurs de {wilaya} la voient immédiatement. Un comité peut ajouter son badge plus tard — votre demande est active dans tous les cas.",
    urgencyCriticalHint: "nécessaire aujourd'hui", urgencyHighHint: "dans les prochains jours",
    urgencyMediumHint: "opération programmée", urgencyLowHint: "pas encore de date",
  },
  ar: {
    tagline: "كل قطرة تصل حياةً. اربط المتبرعين والمستشفيات عبر الجزائر، في الوقت الفعلي.",
    imDonor: "أنا متبرع", donorSub: "تبرّع بالدم، أنقذ حتى 3 أرواح",
    imHospital: "أنا مستشفى", hospitalSub: "اطلب وحدات، اعثر على متبرعين بسرعة",
    trust: "متوافق مع الإرشادات الوطنية للتبرع بالدم", forDemos: "لأغراض العرض التوضيحي",
    email: "البريد الإلكتروني", password: "كلمة المرور", orDemo: "أو", continueDemo: "المتابعة بحساب تجريبي",
    welcome: "مرحباً بعودتك", eligible: "مؤهل", eligibleNow: "يمكنك التبرع الآن",
    donations: "تبرعات", livesSaved: "أرواح أُنقذت", streak: "التتابع",
    ramadanTitle: "تبرع ليلي — رمضان", ramadanSub: "المراكز مفتوحة الليلة حتى 3 صباحاً — بعد التراويح",
    sosLabel: "نداء · عاجل", sosTitle: "طلب {bloodType} حرج قريب منك", units: "وحدات", respond: "استجب",
    reserveTitle: "المخزون الوطني", updatedNow: "مباشر", view: "عرض",
    quickActions: "إجراءات سريعة", findRequests: "الطلبات العاجلة", findRequestsSub: "3 بالقرب منك الآن",
    compensateTitle: "تعويض عن مريض", compensateSub: "تبرّع باسم مريض",
    schedule: "حملات قريبة منك", scheduleSub: "شاهد فعاليات التبرع القادمة",
    urgentRequests: "طلبات عاجلة", sortedDistance: "حسب المسافة", nearby: "بالقرب", liveMap: "خريطة مباشرة",
    requestDetails: "تفاصيل الطلب", requestedBy: "الطالب", bloodType: "الفصيلة", unitsNeeded: "الوحدات",
    distance: "المسافة", details: "التفاصيل", posted: "نُشر", responseWindow: "مدة الاستجابة: 4 ساعات",
    away: "بعيداً", driveParking: "~8 دقائق · موقف مجاني", emergencyPatient: "مريض جراحة طارئة",
    directMatch: "فصيلتك A+ مطابقة تماماً.", respondRequest: "الاستجابة للطلب",
    matchedTitle: "تم التوفيق!", matchedBody: "تم إخطار المستشفى. توجّه للتبرع — قد تنقذ 3 أرواح اليوم.",
    location: "المكان", confirmation: "التأكيد", getDirections: "الاتجاهات", backHome: "الرئيسية",
    becomeDonor: "كن متبرعاً", twoMinutes: "حوالي دقيقتين",
    registerBlurb: "تساعدنا بياناتك في توفيقك مع المرضى المحتاجين. كل شيء يبقى سرياً.",
    personalInfo: "المعلومات الشخصية", fullName: "الاسم الكامل", age: "العمر", weight: "الوزن (كغ)",
    eligibilitySection: "الأهلية", eligibilityConsent: "أنا بصحة جيدة، وزني 50 كغ+، وعمري بين 18 و65 عاماً.", agreeTerms: "أوافق على الشروط وسياسة الخصوصية.", completeReg: "إكمال التسجيل",
    profile: "الملف", nextEligible: "التبرع القادم المتاح", ready: "جاهز",
    notifications: "الإشعارات", notifUrgent: "طلبات الدم العاجلة", notifRamadan: "حملات رمضان", notifNearby: "حملات قريبة",
    history: "سجل التبرعات", signOut: "تسجيل الخروج", editProfile: "تعديل الملف", settingsLabel: "الإعدادات",
    compensateHint: "التبرع التعويضي", compensateBlurb: "عند انخفاض المخزون الجهوي، يُفرَج عن نقل دم المريض بمجرد أن يتبرع شخص باسمه — أي فصيلة تُحتسب.",
    patientName: "اسم المريض", patientNamePh: "مثال: أمل ك.", patientFile: "رقم ملف المريض", hospitalLabel: "المستشفى",
    compensateNote: "لا حاجة لمطابقة الفصيلة — أنت تعوّض وحدة للمخزون المشترك.",
    compensateCta: "التعهد بتبرع تعويضي",
    signedInAs: "مسجّل الدخول باسم", activeRequests: "طلبات نشطة", donorsMatched: "متبرعون مطابقون",
    openConsole: "فتح لوحة المستشفى الكاملة", findDonors: "ابحث عن متبرعين", findDonorsSub: "متبرعون متاحون بالقرب منك",
    navHome: "الرئيسية", navFind: "بحث", navGive: "تبرّع", navProfile: "الملف",
    urgencyCritical: "حرج", urgencyHigh: "مرتفع", urgencyMedium: "متوسط", urgencyLow: "منخفض",
    deskTitle: "نظرة على الطلبات", critical: "حرجة", fulfilled: "مُلبّاة هذا الشهر",
    openRequests: "الطلبات المفتوحة", viewAll: "عرض الكل", donorsNearby: "متبرعون قريبون", compatibleDonors: "متبرعون متوافقون",
    deskSosCta: "حالة طارئة؟", deskSosSub: "أرسل نداء استغاثة لكل متبرع متوافق قريب.", deskSosBtn: "إرسال نداء",
    deskSosLive: "النداء العاجل نشط", deskSosLiveSub: "أُرسل إلى 12 متبرعاً A+ ضمن 5 كم", dismiss: "إغلاق",
    dashboard: "اللوحة", requestsNav: "الطلبات", donorsNav: "المتبرعون", reserveNav: "المخزون",
    bloodRequestsTitle: "طلبات الدم", searchPlaceholder: "ابحث برقم المريض أو الفصيلة…", filterAll: "الكل", filterNearby: "بالقرب", newLabel: "جديد",
    compensatePledged: "تم التعهد بالتعويض", thankYouPrefix: "شكراً لتعويضك عن", thankYouSuffix: "أظهر هذا المرجع عند مكتب التبرع لتحرير وحدته.",
    patientRowLabel: "المريض", fileRowLabel: "رقم الملف", referenceLabel: "المرجع",
    pledging: "جارٍ التعهد…", genericError: "حدث خطأ ما",
    saveChanges: "حفظ التغييرات", changesSaved: "تم حفظ التغييرات", languageLabel: "اللغة",
    shareMessage: "عاجل: مطلوب دم من فصيلة {bloodType} في {hospital} (على بعد {distance}، {units} وحدات). كل متبرع يهم — الرجاء المشاركة.",
    shareLabel: "مشاركة",
    drivesTitle: "حملات التبرع", drivesSub: "فعاليات تبرع مجتمعية بالقرب منك",
    urgencyHeader: "الحالة", printLabel: "طباعة", exportLabel: "تصدير CSV",
    downloadCertificate: "تحميل الشهادة",
    certTitle: "شهادة التبرع بالدم",
    certIntro: "تشهد هذه الوثيقة بأن",
    certBody: "تبرّع بالدم بتاريخ {date} في {location} ({type}، {units} وحدة/وحدات).",
    certThanks: "شكراً لهذه المساهمة التي تنقذ الأرواح.",
    phoneLabel: "رقم الهاتف", wilayaField: "الولاية", lastDonationLabel: "تاريخ آخر تبرع",
    preferencesLabel: "التفضيلات", ramadanToggle: "وضع رمضان (لافتة التبرع الليلي)",
    defaultWilayaLabel: "الولاية الافتراضية للطلبات", allWilayas: "كل الولايات",
    aboutLabel: "حول التطبيق", versionLabel: "الإصدار",
    daysLeft: "يوماً متبقياً", offlineBanner: "أنت غير متصل — تُعرض آخر البيانات المحفوظة",
    noNotifications: "لا إشعارات جديدة", newRequestTitle: "طلب دم جديد", patientIdLabel: "رقم المريض",
    publishRequest: "نشر الطلب", requestPublished: "نُشر الطلب — سيراه المتبرعون القريبون", publishing: "جارٍ النشر…",
    sosStartedToast: "بدأ بث النداء العاجل", sosStoppedToast: "توقف بث النداء العاجل",
    hospitalsTitle: "المستشفيات ومراكز الدم", hospitalsSub: "اعثر على أقرب مركز", openInMaps: "افتح في خرائط جوجل", hospSearchPh: "ابحث بالاسم أو الولاية…",

    verifiedByLabel: "موثّق من {association}", verifiedShort: "موثّق", notVerifiedShort: "غير موثّق",
    shareVerifiedSuffix: "موثّق من {association} عبر قطرة.",
    postRequestTitle: "طلب دم", postRequestSub: "لمريض أو أحد الأقارب",
    hospitalNameOptional: "المستشفى (اختياري)", contactPhoneLabel: "هاتف للتواصل",
    patientFileOptional: "رقم ملف المريض (اختياري)", postRequestCta: "نشر الطلب", posting: "جارٍ النشر…",
    requestPosted: "نُشر الطلب — سيراه المتبرعون القريبون",
    verifyPhoneTitle: "وثّق رقم هاتفك", verifyPhoneSub: "سنرسل رمزاً عبر رسالة نصية.",
    sendCodeCta: "إرسال الرمز", sendingCode: "جارٍ الإرسال…", codeLabel: "الرمز المكوّن من 6 أرقام",
    verifyCodeCta: "تحقّق", verifyingCode: "جارٍ التحقق…", phoneVerifiedToast: "تم توثيق الهاتف",
    invalidPhone: "أدخل رقم هاتف جزائري صالح (05/06/07…)",
    verifyWhyTitle: "لماذا نطلب ذلك",
    verifyWhyBody: "المتبرع الذي يقطع الولاية يثق بأن شخصاً حقيقياً على الطرف الآخر من الرقم.",
    verifyPhoneFormatHint: "أرقام الهاتف الجزائرية فقط — 05 أو 06 أو 07.",
    skipConsequence: "يمكنك التبرع والاستجابة للطلبات واستخدام كل شيء آخر. الشيء الوحيد الذي ينتظر هو نشر طلبك الخاص — وهذا يحتاج رقماً موثّقاً، ويمكنك العودة إليه في أي وقت.",
    resendIn: "إعادة الإرسال خلال {seconds}", changeNumber: "تغيير الرقم",
    verifyRequiredNote: "وثّق رقم هاتفك قبل نشر طلب.",
    flowStepRequest: "الطلب", flowStepVerify: "التوثيق", flowStepPosted: "نُشر",
    draftSavedTitle: "طلبك محفوظ كمسودة",
    verifyWhyLead: "هذا ما يجعل الطلبات جديرة بالثقة.",
    postCtaHint: "رمز واحد عبر رسالة نصية، ثم يُنشر.",
    coverageMapped: "{wilaya} من بين {count} ولاية مسجّلة مستشفياتها — تظهر الاقتراحات أثناء الكتابة.",
    coverageUnmapped: "لا توجد مستشفيات مسجّلة في {wilaya} — اكتب أي اسم وسُيقبل كما هو.",
    postedAsDonorsSee: "كما يراه المتبرعون",
    postedWhatNow: "ماذا يحدث الآن",
    postedGeoMapped: "يُنبّه المتبرعون المطابقون في {wilaya}، ويظهر طلبك على الخريطة.",
    postedGeoUnmapped: "يُنبّه المتبرعون المطابقون في {wilaya}. يظهر طلبك في القائمة، دون علامة على الخريطة.",
    postedBadgeNote: "قد تضيف لجنة في ولايتك شارتها. طلبك فعّال في الحالتين.",
    postedPrivacyNote: "يظهر رقم التواصل الخاص بك فقط — لا شيء آخر من ملفك.",
    postedShareWhatsApp: "المشاركة عبر واتساب", postedSeeMine: "عرض طلبي", postedStartAgain: "البدء من جديد",
    assocConsoleTitle: "لوحة الجمعية", assocConsoleSub: "الطلبات المفتوحة في {wilaya}",
    verifyAction: "توثيق", unverifyAction: "إزالة التوثيق",
    verifyAdminsOnly: "لا يمكن توثيق الطلب إلا لمشرفي لجنتك — فالتوثيق يضع اسم الجمعية على الطلب. اطلب من مشرف مراجعته.",
    verifiedToast: "تم توثيق الطلب", unverifiedToast: "أُزيل التوثيق",
    noRequestsWilaya: "لا توجد طلبات مفتوحة في هذه الولاية حالياً",
    assocPendingTitle: "في انتظار موافقة قطرة",
    assocPendingSub: "ستتمكن من توثيق الطلبات في ولايتك بمجرد الموافقة على جمعيتك.",
    assocApplyTitle: "تسجيل جمعية", assocApplySub: "لجنة الهلال الأحمر، فوج كشفي، أو جمعية طلابية",
    assocNameLabel: "اسم الجمعية", assocTypeLabel: "النوع",
    assocTypeRedCrescent: "الهلال الأحمر الجزائري", assocTypeScouts: "الكشافة", assocTypeStudent: "جمعية طلابية", assocTypeOther: "أخرى",
    assocApplyCta: "إرسال الطلب", assocAppliedToast: "أُرسل الطلب — ستراجعه قطرة",
    consentTitle: "الموافقة على معالجة البيانات الصحية",
    consentIntro: "تحتاج قطرة إلى إذنك الصريح لمعالجة المعلومات الطبية. هذا منفصل عن الشروط العامة، ويمكنك سحبه في أي وقت.",
    consentPoint1: "تُستخدم فصيلة دمك وتواريخ تبرعك لتوفيقك مع الطلبات.",
    consentPoint2: "لا ترى المستشفيات والجمعيات الموثِّقة إلا ما يتطلبه التوفيق — لا سجلّك الكامل.",
    consentPoint3: "يمكنك طلب نسخة من بياناتك أو تصحيحها أو حذفها في أي وقت.",
    consentScope: "شيئان فقط: فصيلة دمك، وتواريخ تبرعك.",
    consentNever1: "لا تُستخدم أبداً لترتيب المتبرعين، ولا تُشارك مع صاحب عمل أو شركة تأمين.",
    consentNever2: "رقم هاتفك خيار منفصل تتحكم فيه من ملفك، ويبقى مغلقاً ما لم تفعّله.",
    consentVersionNote: "إصدار النص {version} · نحفظ الإصدار الذي وافقت عليه",
    consentAgreeLabel: "أوافق على معالجة قطرة لفصيلة دمي وسجل تبرعاتي لأغراض التوفيق.",
    consentContinueCta: "أوافق وأتابع", consentRequiredError: "الموافقة مطلوبة للمتابعة",
    dataRightsTitle: "بياناتك", dataRightsSub: "اطلب نسخة أو تصحيحاً أو حذفاً",
    dsrExport: "طلب نسخة من بياناتي", dsrCorrection: "طلب تصحيح", dsrDeletion: "طلب الحذف",
    dsrSubmittedToast: "أُرسل الطلب — سنعود إليك", dsrDetailsPh: "ما الذي نصححه أو نحذفه؟",
    dsrExportDetail: "ملف يضم ملفك الشخصي وتبرعاتك وطلباتك · نحو 5 أيام",
    dsrCorrectionDetail: "فصيلة دم خاطئة، تاريخ تبرع خاطئ، اسم مكتوب بشكل غير صحيح",
    dsrDeletionDetail: "يراجعها شخص، ثم تُؤكَّد لك",
    dsrDeletionLegal: "يجب الاحتفاظ بسجل موافقتك بحكم القانون. وكل ما عداه يُحذف.",
    dsrQueueTitle: "طلباتك",
    assocWilayaHint: "لن تتمكن من توثيق سوى طلبات هذه الولاية.",
    assocReviewNote: "تتحقق قطرة من وجود اللجنة ومن أنك تمثّلها. عادةً خلال أسبوع.",
    assocStep1: "تم استلام الطلب", assocStep1Body: "وصلنا الطلب — لم يضع شيء.",
    assocStep2: "شخص يراجعه", assocStep2Body: "نتأكد من وجود اللجنة ومن أنك تمثّلها. لا شيء عليك فعله.",
    assocStep3: "تظهر خانة اللجنة", assocStep3Body: "يمكن للجان المعتمدة توثيق طلبات {wilaya}.",
    assocMeanwhileTitle: "في هذه الأثناء، لا شيء متوقف",
    assocMeanwhile1: "استجب للطلبات وتبرّع كالمعتاد",
    assocMeanwhile2: "انشر طلباً لمريض",
    assocMeanwhile3: "شارك الطلبات عبر واتساب — دون حاجة إلى توثيق",
    navRequestLabel: "طلب", navVerifyLabel: "توثيق",
    eligibleInDays: "مؤهل خلال {days} يوماً", eligibleLabel: "مؤهل",

    donorSearchTitle: "البحث عن متبرعين", donorSearchSub: "المتبرعون المسجلون في {wilaya}",
    allTypesLabel: "كل الفصائل", includeCooldownLabel: "إظهار المتبرعين في فترة الانتظار",
    noDonorsFound: "لا يوجد متبرعون مطابقون في هذه الولاية",
    donorSearchDenied: "لا يمكن البحث عن المتبرعين إلا لجمعية موثّقة",
    callLabel: "اتصال", numberNotShared: "الرقم غير مشارَك",
    numberNotSharedHint: "لم يوافق هذا المتبرع على الاتصال المباشر. تواصل معه عبر طلب.",
    contactConsentTitle: "الاتصال المباشر", contactConsentBody: "يمكن للجمعيات الموثّقة رؤية رقم هاتفك والاتصال بك بشأن الطلبات العاجلة المطابقة لفصيلة دمك. يمكنك إيقاف ذلك في أي وقت.",
    contactConsentToggle: "السماح للجمعيات الموثّقة بالاتصال بي",
    contactConsentOn: "يمكن للجمعيات الاتصال بك الآن", contactConsentOff: "تم إخفاء رقمك مجدداً",
    navDonorsLabel: "المتبرعون",
    skipForNow: "لاحقاً", verifyLaterHint: "يمكنك فعل ذلك لاحقاً — لكنك تحتاج رقماً موثّقاً قبل نشر أي طلب.",
    unitsOne: "وحدة", unitsTwo: "وحدتان", unitsFew: "وحدات",
    imPatient: "أحتاج إلى دم", patientSub: "انشر طلباً لمريض أو أحد الأقارب", demoAsPatient: "عرض تجريبي كمريض",
    taglinePatient: "كل قطرة تصل حياةً. العائلات تطلب، الجمعيات توثّق، المتبرعون يستجيبون — عبر الجزائر، في الوقت الفعلي.",
    navCommittee: "اللجنة", navCommitteeWaiting: "اللجنة، {count} بانتظار التحقق", committeeTitle: "لجنتك",
    committeeVerifyCard: "توثيق الطلبات", committeeVerifySub: "{waiting} في الانتظار",
    committeeDonorsCard: "البحث عن متبرعين", committeeDonorsSub: "المتبرعون المسجلون في {wilaya}",
    committeeNoneToday: "لا شيء في الانتظار — القائمة خالية",
    staleTitle: "{count} مفتوحة منذ أكثر من شهر",
    staleBody: "لا شيء يغلقها تلقائياً. اتصل بالعائلات وأفرغ القائمة.",
    hospitalMatched: "مستشفى معروف — سيظهر طلبك على خريطة المتبرعين.",
    hospitalFreeTextHint: "اختر من القائمة ليظهر طلبك على الخريطة، أو اكتب اسم أي مستشفى.",
    hospitalNoDirectoryHint: "سنستخدم ما كتبته تماماً. يظهر طلبك في قائمة هذه الولاية — دون علامة على الخريطة، ودون فرق في من يراه.",
    blockWho: "من يحتاج الدم", blockWhere: "أين", blockUrgency: "مدى الاستعجال، وكيف نتواصل معك",
    bloodTypeUnsure: "لست متأكداً؟ ملف المستشفى يحتويها — اتركها واتصل بنا.",
    contactPhoneHint: "يظهر للمتبرعين الذين يفتحون طلبك.",
    addFileNumber: "إضافة رقم ملف المريض",
    verifyBannerSub: "رمز واحد عبر رسالة نصية. املأ النموذج أولاً إن أردت — سنحتفظ بما كتبته.",
    postRequestFooter: "يراه المتبرعون في {wilaya} فوراً. قد تضيف لجنة توثيقها لاحقاً — وطلبك فعّال في الحالتين.",
    urgencyCriticalHint: "مطلوب اليوم", urgencyHighHint: "خلال الأيام القادمة",
    urgencyMediumHint: "عملية مبرمجة", urgencyLowHint: "لا يوجد تاريخ بعد",
  },
};
