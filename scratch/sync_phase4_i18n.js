const fs = require('fs');
const path = require('path');

const enPath = path.resolve('frontend/src/lang/en.json');
const hiPath = path.resolve('frontend/src/lang/hi.json');
const asPath = path.resolve('frontend/src/lang/as.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));
const as = JSON.parse(fs.readFileSync(asPath, 'utf8'));

const newEn = {
  empty_state: {
    kicker: "Nothing here yet"
  },
  notifications: {
    bell_title: "Notifications & Security Alerts",
    feed_title: "In-App Security & Health Feed",
    unread_count: "{count} Unread",
    anti_phishing: "Anti-Phishing: Verified alerts always reference your secure in-app portal.",
    no_notifications: "No notifications to display.",
    mark_read: "Mark as read"
  },
  guide: {
    patient_guide: "PATIENT USER GUIDE",
    how_to_use: "How to Use This Section (Step-by-Step):",
    understanding_results: "Understanding Your Results & Key Indicators:",
    quantum_advantage: "Quantum Advantage:",
    close_btn: "Got It, Close Guide"
  },
  ai_doctor: {
    title: "Dr. Quantum 1-on-1 Voice Consultation",
    loading_dossier: "Compiling patient clinical dossier and initializing Dr. Quantum AI...",
    live: "LIVE ({duration})",
    standby: "STANDBY",
    prompt_bp: "Explain my blood pressure and cardiac risk score",
    prompt_lesion: "What did my skin lesion test show?",
    prompt_pneumonia: "Review my pneumonia chest radiograph",
    prompt_meds: "Check my Aspirin and Atorvastatin medications",
    prompt_twin: "Explain my 3D Digital Twin Composite Risk Score",
    camera_standby: "Camera Standby",
    camera_off: "Camera Off",
    duration: "DURATION: {duration}",
    not_in_call: "NOT IN CALL",
    start_call: "Start Consultation",
    end_call: "End Call",
    unmute_mic: "Unmute Microphone",
    mute_mic: "Mute Microphone",
    camera_on: "Turn Camera On",
    camera_off_btn: "Turn Camera Off",
    unmute_speaker: "Unmute Speaker",
    mute_speaker: "Mute Speaker",
    captions_chat: "Captions / Chat",
    ehr_dossier: "My EHR Dossier",
    transcript_title: "Live Conversation Transcript & Captions",
    turns_count: "{count} turns",
    start_talking: "Start talking with Dr. Quantum",
    transcript_hint: "Your voice conversation will be transcribed in real time right here.",
    dr_quantum: "Dr. Quantum (AI)",
    you_patient: "You (Patient)",
    you_speaking: "You (Speaking...)",
    dr_speaking: "Dr. Quantum is speaking...",
    input_placeholder: "Ask Dr. Quantum a health question or type if microphone is muted...",
    send_btn: "Send",
    context_active: "Context Active in Dr. Quantum",
    context_desc: "Medical records are dynamically primed for this voice consultation.",
    profile_metrics: "Clinical Profile & Metrics",
    blood_group: "Blood Group",
    temperature: "Temperature",
    twin_risk: "3D Digital Twin Composite Risk",
    optimal_low: "Optimal / Low Risk",
    recent_inferences: "Recent Clinical Inferences",
    loading_dossier_short: "Loading clinical dossier..."
  }
};

const newHi = {
  empty_state: {
    kicker: "यहाँ अभी कुछ नहीं है"
  },
  notifications: {
    bell_title: "सूचनाएं और सुरक्षा अलर्ट",
    feed_title: "ऐप सुरक्षा और स्वास्थ्य फ़ीड",
    unread_count: "{count} अपठित",
    anti_phishing: "एंटी-फ़िशिंग: सत्यापित अलर्ट हमेशा आपके सुरक्षित इन-ऐप पोर्टल को संदर्भित करते हैं।",
    no_notifications: "प्रदर्शित करने के लिए कोई सूचना नहीं है।",
    mark_read: "पढ़ा हुआ चिह्नित करें"
  },
  guide: {
    patient_guide: "रोगी उपयोगकर्ता मार्गदर्शिका",
    how_to_use: "इस अनुभाग का उपयोग कैसे करें (चरण-दर-चरण):",
    understanding_results: "अपने परिणाम और प्रमुख संकेतक समझें:",
    quantum_advantage: "क्वांटम लाभ:",
    close_btn: "समझ गया, गाइड बंद करें"
  },
  ai_doctor: {
    title: "डॉ. क्वांटम 1-ऑन-1 वॉइस परामर्श",
    loading_dossier: "रोगी का क्लिनिकल डोजियर संकलित किया जा रहा है और डॉ. क्वांटम AI प्रारंभ हो रहा है...",
    live: "लाइव ({duration})",
    standby: "स्टैंडबाय",
    prompt_bp: "मेरा रक्तचाप और हृदय जोखिम स्कोर समझाएं",
    prompt_lesion: "मेरी त्वचा घाव परीक्षण में क्या दिखा?",
    prompt_pneumonia: "मेरे निमोनिया चेस्ट रेडियोग्राफ़ की समीक्षा करें",
    prompt_meds: "मेरी एस्पिरिन और एटोरवास्टेटिन दवाएं जांचें",
    prompt_twin: "मेरा 3D डिजिटल ट्विन समग्र जोखिम स्कोर समझाएं",
    camera_standby: "कैमरा स्टैंडबाय",
    camera_off: "कैमरा बंद",
    duration: "अवधि: {duration}",
    not_in_call: "कॉल में नहीं",
    start_call: "परामर्श शुरू करें",
    end_call: "कॉल समाप्त करें",
    unmute_mic: "माइक्रोफ़ोन अनम्यूट करें",
    mute_mic: "माइक्रोफ़ोन म्यूट करें",
    camera_on: "कैमरा चालू करें",
    camera_off_btn: "कैमरा बंद करें",
    unmute_speaker: "स्पीकर अनम्यूट करें",
    mute_speaker: "स्पीकर म्यूट करें",
    captions_chat: "कैप्शन / चैट",
    ehr_dossier: "मेरा EHR डोजियर",
    transcript_title: "लाइव बातचीत प्रतिलेख और कैप्शन",
    turns_count: "{count} मोड़",
    start_talking: "डॉ. क्वांटम से बात करना शुरू करें",
    transcript_hint: "आपकी वॉइस बातचीत वास्तविक समय में यहाँ लिखी जाएगी।",
    dr_quantum: "डॉ. क्वांटम (AI)",
    you_patient: "आप (रोगी)",
    you_speaking: "आप (बोल रहे हैं...)",
    dr_speaking: "डॉ. क्वांटम बोल रहे हैं...",
    input_placeholder: "डॉ. क्वांटम से स्वास्थ्य प्रश्न पूछें या माइक म्यूट होने पर टाइप करें...",
    send_btn: "भेजें",
    context_active: "डॉ. क्वांटम में संदर्भ सक्रिय",
    context_desc: "इस वॉइस परामर्श के लिए चिकित्सा रिकॉर्ड गतिशील रूप से तैयार किए गए हैं।",
    profile_metrics: "क्लिनिकल प्रोफ़ाइल और मेट्रिक्स",
    blood_group: "रक्त समूह",
    temperature: "तापमान",
    twin_risk: "3D डिजिटल ट्विन समग्र जोखिम",
    optimal_low: "अनुकूलतम / कम जोखिम",
    recent_inferences: "हाल के क्लिनिकल निष्कर्ष",
    loading_dossier_short: "क्लिनिकल डोजियर लोड हो रहा है..."
  }
};

const newAs = {
  empty_state: {
    kicker: "ইয়াত এতিয়ালৈকে একো নাই"
  },
  notifications: {
    bell_title: "জাননী আৰু নিৰাপত্তা সতৰ্কবাৰ্তা",
    feed_title: "ইন-এপ সুৰক্ষা আৰু স্বাস্থ্য ফিড",
    unread_count: "{count} নপঢ়া",
    anti_phishing: "এণ্টি-ফিচিং: সত্যাাপিত সতৰ্কবাৰ্তাই সদায় আপোনাৰ সুৰক্ষিত ইন-এপ পৰ্টেলক উল্লেখ কৰে।",
    no_notifications: "প্ৰদৰ্শন কৰিবলৈ কোনো জাননী নাই।",
    mark_read: "পঢ়া বুলি চিহ্নিত কৰক"
  },
  guide: {
    patient_guide: "ৰোগী ব্যৱহাৰকাৰী সহায়িকা",
    how_to_use: "এই খণ্ডটো কেনেদৰে ব্যৱহাৰ কৰিব (ধাপে ধাপে):",
    understanding_results: "আপোনাৰ ফলাফল আৰু মূল সূচকসমূহ বুজি লওক:",
    quantum_advantage: "কোৱাণ্টাম সুবিধা:",
    close_btn: "বুজি পালোঁ, সহায়িকা বন্ধ কৰক"
  },
  ai_doctor: {
    title: "ডাঃ কোৱাণ্টাম ১-অন-১ ভইচ পৰামৰ্শ",
    loading_dossier: "ৰোগীৰ ক্লিনিকেল ডজিয়াৰ প্ৰস্তুত কৰা হৈছে আৰু ডাঃ কোৱাণ্টাম AI আৰম্ভ হৈছে...",
    live: "লাইভ ({duration})",
    standby: "ষ্টেণ্ডবাই",
    prompt_bp: "মোৰ ৰক্তচাপ আৰু হৃদৰোগৰ আশংকা বুজাই দিয়ক",
    prompt_lesion: "মোৰ ছালৰ ঘাঁ পৰীক্ষাত কি ওলাল?",
    prompt_pneumonia: "মোৰ নিউমোনিয়া বুকুৰ এক্স-ৰে পৰ্যালোচনা কৰক",
    prompt_meds: "মোৰ এছপিৰিন আৰু এটৰভাষ্টেটিন ঔষধ পৰীক্ষা কৰক",
    prompt_twin: "মোৰ ৩ডি ডিজিটেল টুইন সন্মিলিত আশংকা নম্বৰ বুজাই দিয়ক",
    camera_standby: "কেমেৰা ষ্টেণ্ডবাই",
    camera_off: "কেমেৰা বন্ধ",
    duration: "সময়সীমা: {duration}",
    not_in_call: "কলত নাই",
    start_call: "পৰামৰ্শ আৰম্ভ কৰক",
    end_call: "কল সমাপ্ত কৰক",
    unmute_mic: "মাইক্ৰ'ফ'ন অনমিউট কৰক",
    mute_mic: "মাইক্ৰ'ফ'ন মিউট কৰক",
    camera_on: "কেমেৰা অন কৰক",
    camera_off_btn: "কেমেৰা অফ কৰক",
    unmute_speaker: "স্পীকাৰ অনমিউট কৰক",
    mute_speaker: "স্পীকাৰ মিউট কৰক",
    captions_chat: "কেপশ্বন / বাৰ্তালাপ",
    ehr_dossier: "মোৰ EHR ডজিয়াৰ",
    transcript_title: "লাইভ বাৰ্তালাপ প্রতিলিপি আৰু কেপশ্বন",
    turns_count: "{count} টা কথোপকথন",
    start_talking: "ডাঃ কোৱাণ্টামৰ সৈতে কথা পতা আৰম্ভ কৰক",
    transcript_hint: "আপোনাৰ কণ্ঠ বাৰ্তালাপ ইয়াত বাস্তৱ সময়ত প্ৰতিলিপি কৰা হ'ব।",
    dr_quantum: "ডাঃ কোৱাণ্টাম (AI)",
    you_patient: "আপুনি (ৰোগী)",
    you_speaking: "আপুনি (কৈ আছে...)",
    dr_speaking: "ডাঃ কোৱাণ্টামে কথা কৈ আছে...",
    input_placeholder: "ডাঃ কোৱাণ্টামক স্বাস্থ্য প্ৰশ্ন সোধক বা মাইক মিউট থাকিলে টাইপ কৰক...",
    send_btn: "প্ৰেৰণ কৰক",
    context_active: "ডাঃ কোৱাণ্টামত তথ্য সক্ৰিয়",
    context_desc: "এই ভইচ পৰামৰ্শৰ বাবে চিকিৎসা তথ্যসমূহ প্ৰস্তুত কৰা হৈছে।",
    profile_metrics: "ক্লিনিকেল প্ৰফাইল আৰু পৰিমাপ",
    blood_group: "তেজৰ গ্ৰুপ",
    temperature: "উত্তাপ",
    twin_risk: "৩ডি ডিজিটেল টুইন সন্মিলিত আশংকা",
    optimal_low: "সৰ্বোত্তম / কম আশংকা",
    recent_inferences: "শেহতীয়া ক্লিনিকেল সিদ্ধান্তসমূহ",
    loading_dossier_short: "ক্লিনিকেল ডজিয়াৰ লোড হৈ আছে..."
  }
};

Object.assign(en, newEn);
Object.assign(hi, newHi);
Object.assign(as, newAs);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2), 'utf8');
fs.writeFileSync(asPath, JSON.stringify(as, null, 2), 'utf8');

console.log('Synchronized en, hi, as JSONs successfully!');
