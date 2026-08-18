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
  assocConsoleTitle: string; assocConsoleSub: string; verifyAction: string; unverifyAction: string;
  verifiedToast: string; unverifiedToast: string; noRequestsWilaya: string;
  assocPendingTitle: string; assocPendingSub: string;
  assocApplyTitle: string; assocApplySub: string; assocNameLabel: string; assocTypeLabel: string;
  assocTypeRedCrescent: string; assocTypeScouts: string; assocTypeStudent: string; assocTypeOther: string;
  assocApplyCta: string; assocAppliedToast: string;
  consentTitle: string; consentIntro: string; consentPoint1: string; consentPoint2: string; consentPoint3: string;
  consentAgreeLabel: string; consentContinueCta: string; consentRequiredError: string;
  dataRightsTitle: string; dataRightsSub: string; dsrExport: string; dsrCorrection: string; dsrDeletion: string;
  dsrSubmittedToast: string; dsrDetailsPh: string;
  navRequestLabel: string; navVerifyLabel: string;
  eligibleInDays: string; eligibleLabel: string;

  // --- Donor search + contact-sharing consent ---
  donorSearchTitle: string; donorSearchSub: string; allTypesLabel: string;
  includeCooldownLabel: string; noDonorsFound: string; donorSearchDenied: string;
  callLabel: string; numberNotShared: string; numberNotSharedHint: string;
  contactConsentTitle: string; contactConsentBody: string; contactConsentToggle: string;
  contactConsentOn: string; contactConsentOff: string; navDonorsLabel: string;
  skipForNow: string; verifyLaterHint: string;
  hospitalMatched: string; hospitalFreeTextHint: string;
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
    verifyPhoneTitle: "Verify your phone", verifyPhoneSub: "We'll send a code by SMS. This is what keeps requests trustworthy.",
    sendCodeCta: "Send code", sendingCode: "Sending…", codeLabel: "6-digit code",
    verifyCodeCta: "Verify", verifyingCode: "Verifying…", phoneVerifiedToast: "Phone verified",
    invalidPhone: "Enter a valid Algerian mobile number (05/06/07…)",
    verifyRequiredNote: "Verify your phone number before posting a request.",
    assocConsoleTitle: "Association console", assocConsoleSub: "Open requests in {wilaya}",
    verifyAction: "Verify", unverifyAction: "Remove verification",
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
    consentAgreeLabel: "I consent to Qatra processing my blood type and donation history for matching.",
    consentContinueCta: "Agree and continue", consentRequiredError: "Consent is required to continue",
    dataRightsTitle: "Your data", dataRightsSub: "Request a copy, a correction, or deletion",
    dsrExport: "Request a copy of my data", dsrCorrection: "Request a correction", dsrDeletion: "Request deletion",
    dsrSubmittedToast: "Request submitted — we'll get back to you", dsrDetailsPh: "What should we correct or delete?",
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
    hospitalMatched: "Matched to a known hospital — your request will show on the donor map.",
    hospitalFreeTextHint: "Pick from the list to place your request on the map, or type any hospital name.",
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
    verifyPhoneTitle: "Vérifiez votre téléphone", verifyPhoneSub: "Nous envoyons un code par SMS. C'est ce qui rend les demandes fiables.",
    sendCodeCta: "Envoyer le code", sendingCode: "Envoi…", codeLabel: "Code à 6 chiffres",
    verifyCodeCta: "Vérifier", verifyingCode: "Vérification…", phoneVerifiedToast: "Téléphone vérifié",
    invalidPhone: "Saisissez un numéro de mobile algérien valide (05/06/07…)",
    verifyRequiredNote: "Vérifiez votre numéro avant de publier une demande.",
    assocConsoleTitle: "Console association", assocConsoleSub: "Demandes ouvertes à {wilaya}",
    verifyAction: "Vérifier", unverifyAction: "Retirer la vérification",
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
    consentAgreeLabel: "Je consens à ce que Qatra traite mon groupe sanguin et mon historique de dons à des fins de jumelage.",
    consentContinueCta: "Accepter et continuer", consentRequiredError: "Le consentement est nécessaire pour continuer",
    dataRightsTitle: "Vos données", dataRightsSub: "Demander une copie, une correction ou la suppression",
    dsrExport: "Demander une copie de mes données", dsrCorrection: "Demander une correction", dsrDeletion: "Demander la suppression",
    dsrSubmittedToast: "Demande envoyée — nous vous répondrons", dsrDetailsPh: "Que devons-nous corriger ou supprimer ?",
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
    hospitalMatched: "Hôpital reconnu — votre demande apparaîtra sur la carte des donneurs.",
    hospitalFreeTextHint: "Choisissez dans la liste pour apparaître sur la carte, ou saisissez n'importe quel hôpital.",
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
    verifyPhoneTitle: "وثّق رقم هاتفك", verifyPhoneSub: "سنرسل رمزاً عبر رسالة نصية. هذا ما يجعل الطلبات موثوقة.",
    sendCodeCta: "إرسال الرمز", sendingCode: "جارٍ الإرسال…", codeLabel: "الرمز المكوّن من 6 أرقام",
    verifyCodeCta: "تحقّق", verifyingCode: "جارٍ التحقق…", phoneVerifiedToast: "تم توثيق الهاتف",
    invalidPhone: "أدخل رقم هاتف جزائري صالح (05/06/07…)",
    verifyRequiredNote: "وثّق رقم هاتفك قبل نشر طلب.",
    assocConsoleTitle: "لوحة الجمعية", assocConsoleSub: "الطلبات المفتوحة في {wilaya}",
    verifyAction: "توثيق", unverifyAction: "إزالة التوثيق",
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
    consentAgreeLabel: "أوافق على معالجة قطرة لفصيلة دمي وسجل تبرعاتي لأغراض التوفيق.",
    consentContinueCta: "أوافق وأتابع", consentRequiredError: "الموافقة مطلوبة للمتابعة",
    dataRightsTitle: "بياناتك", dataRightsSub: "اطلب نسخة أو تصحيحاً أو حذفاً",
    dsrExport: "طلب نسخة من بياناتي", dsrCorrection: "طلب تصحيح", dsrDeletion: "طلب الحذف",
    dsrSubmittedToast: "أُرسل الطلب — سنعود إليك", dsrDetailsPh: "ما الذي نصححه أو نحذفه؟",
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
    hospitalMatched: "مستشفى معروف — سيظهر طلبك على خريطة المتبرعين.",
    hospitalFreeTextHint: "اختر من القائمة ليظهر طلبك على الخريطة، أو اكتب اسم أي مستشفى.",
  },
};
