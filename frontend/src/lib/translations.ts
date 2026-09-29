export type LanguageCode = 'en' | 'hi' | 'mr' | 'pt';

export interface Translations {
  portalTitle: string;
  multilingualBadge: string;
  portalSubtitle: string;
  optionalSignIn: string;
  signOut: string;
  citizenRole: string;
  dpgBadge: string;

  // Auth Modal
  modalTitle: string;
  modalDesc: string;
  modalSignIn: string;
  modalGuest: string;

  // Tabs
  tabSubmit: string;
  tabStatus: string;
  tabMessaging: string;

  // Presets
  presetsLabel: string;
  presetEn: string;
  presetHi: string;
  presetMr: string;
  presetPt: string;

  // Form Fields
  langLabel: string;
  districtLabel: string;
  puneOption: string;
  gadchiroliOption: string;
  localityLabel: string;
  localityPlaceholder: string;
  descLabel: string;
  recordAudio: string;
  stopRecording: string;
  audioRecorded: string;
  reviewAudio: string;
  reRecord: string;
  clear: string;
  descPlaceholder: string;
  photoLabel: string;
  photoTag: string;
  photoRemove: string;
  photoDesc: string;
  photoAttachPrompt: string;
  photoLimit: string;
  photoReady: string;
  submitBtn: string;
  submittingBtn: string;

  // Steps
  aiProcessing: string;
  stepOf: (s: number) => string;
  step1Title: string;
  step1Running: string;
  step1Desc: string;
  step2Title: string;
  step2Running: string;
  step2Desc: string;
  step3Title: string;
  step3Running: string;
  step3Desc: string;
  step4Title: string;
  step4Running: string;
  step4Desc: string;

  // Submission Result
  resultTitle: string;
  verifiedBadge: string;
  refLabel: string;
  catLabel: string;
  subcatLabel: string;
  sevLabel: string;
  geminiAnalysis: string;
  confidence: string;
  similarDetectedTitle: string;
  similarDetectedLinked: string;
  similarDetectedDesc: string;
  noDuplicateTitle: string;
  noDuplicateDesc: string;

  // Status Tab
  statusPlaceholder: string;
  checkStatusBtn: string;
  checkingStatusBtn: string;
  statusRefTitle: string;
  statusCategory: string;
  statusSubcategory: string;
  statusDistrict: string;
  statusCluster: string;
  statusMerged: string;
  statusPriority: string;
  statusAttachedPhoto: string;
  reportsCount: string;

  // Messaging Tab
  senderPhone: string;
  channelProvider: string;
  channelProviderVal: string;
  inboundBody: string;
  triggerWebhook: string;
  triggeringWebhook: string;
  outboundResponse: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    portalTitle: "Citizen Voice Portal",
    multilingualBadge: "Multilingual Ingestion",
    portalSubtitle: "Direct community signal ingestion via voice audio, photo analysis, text, and WhatsApp.",
    optionalSignIn: "Optional Sign In",
    signOut: "Sign Out",
    citizenRole: "Citizen",
    dpgBadge: "Digital Public Good",

    modalTitle: "Welcome to Citizen Voice",
    modalDesc: "Sign in to track your infrastructure requests across devices, or continue as a guest to submit anonymously.",
    modalSignIn: "Sign In / Create Account",
    modalGuest: "Continue without sign in",

    tabSubmit: "Submit Request",
    tabStatus: "Check Request Status",
    tabMessaging: "WhatsApp / SMS Channel Demo",

    presetsLabel: "Multilingual Demo Presets:",
    presetEn: "🇬🇧 English Text",
    presetHi: "🇮🇳 Hindi Report",
    presetMr: "🇮🇳 Marathi Report",
    presetPt: "🇧🇷 Portuguese (BRICS Demo)",

    langLabel: "Language",
    districtLabel: "District",
    puneOption: "Pune (High Connectivity)",
    gadchiroliOption: "Gadchiroli (Low Mobile Access - Under-Reported)",
    localityLabel: "Locality / Village",
    localityPlaceholder: "Village or Town Name",
    descLabel: "Citizen Description (Voice or Text)",
    recordAudio: "Record Audio (Microphone)",
    stopRecording: "Stop Recording (Listening...)",
    audioRecorded: "Audio recorded and ready for submission",
    reviewAudio: "Review Voice Recording",
    reRecord: "Record Again",
    clear: "✕ Clear",
    descPlaceholder: "Describe the infrastructure issue in your locality (road broken, water supply stopped, hospital roof damaged)...",
    photoLabel: "Upload Infrastructure Photo",
    photoTag: "Gemini Vision",
    photoRemove: "✕ Remove",
    photoDesc: "Attach a photo of the damaged road, pipe leak, power pole, or school to trigger automated multimodal severity verification.",
    photoAttachPrompt: "Click to attach photo or drag file here",
    photoLimit: "PNG, JPG, WEBP up to 5MB",
    photoReady: "Ready for Gemini Multimodal Inspection",
    submitBtn: "Submit Infrastructure Request",
    submittingBtn: "AI Processing & Deduplicating...",

    aiProcessing: "AI processing request...",
    stepOf: (s: number) => `Step ${s} of 4`,
    step1Title: "1. Multi-Language Ingestion & Audio Parsing",
    step1Running: "Processing input...",
    step1Desc: "Normalizing citizen input and preparing the report",
    step2Title: "2. LLM Structured Categorization & Severity",
    step2Running: "Analyzing request...",
    step2Desc: "Identifying infrastructure category, issue type and severity",
    step3Title: "3. Vector Embedding & Deduplication",
    step3Running: "Checking similar reports...",
    step3Desc: "Checking for similar citizen reports using semantic similarity",
    step4Title: "4. Reference ID & District Cluster Registration",
    step4Running: "Preparing request registration...",
    step4Desc: "Registering the request and updating demand information",

    resultTitle: "AI processing complete — Request Ingested!",
    verifiedBadge: "Verified",
    refLabel: "Reference:",
    catLabel: "Category:",
    subcatLabel: "Subcategory:",
    sevLabel: "Severity:",
    geminiAnalysis: "Gemini Multimodal Vision Analysis",
    confidence: "Confidence:",
    similarDetectedTitle: "Similar request detected",
    similarDetectedLinked: "Linked to:",
    similarDetectedDesc: "(Duplicate collapsed, demand score updated).",
    noDuplicateTitle: "No duplicate request detected:",
    noDuplicateDesc: "Logged as a new unique district report.",

    statusPlaceholder: "Enter Reference Code (e.g. #REQ-48213)",
    checkStatusBtn: "Check Status",
    checkingStatusBtn: "Checking...",
    statusRefTitle: "Reference Code",
    statusCategory: "Category:",
    statusSubcategory: "Subcategory:",
    statusDistrict: "District:",
    statusCluster: "Associated Cluster:",
    statusMerged: "Merged Unique Reports:",
    statusPriority: "Cluster Priority Score:",
    statusAttachedPhoto: "Attached Infrastructure Photo:",
    reportsCount: "reports",

    senderPhone: "Sender WhatsApp / Phone Number",
    channelProvider: "Channel Provider",
    channelProviderVal: "Twilio WhatsApp Sandbox",
    inboundBody: "Inbound Message Body",
    triggerWebhook: "Trigger Inbound Webhook Payload",
    triggeringWebhook: "Sending...",
    outboundResponse: "// Outbound Automated Response Pushed to Citizen WhatsApp:"
  },

  hi: {
    portalTitle: "नागरिक आवाज़ पोर्टल",
    multilingualBadge: "बहुभाषी प्रणाली",
    portalSubtitle: "ध्वनि ऑडियो, फोटो विश्लेषण, टेक्स्ट और व्हाट्सएप के माध्यम से सीधे नागरिक समस्याओं का समाधान।",
    optionalSignIn: "वैकल्पिक साइन इन",
    signOut: "साइन आउट",
    citizenRole: "नागरिक",
    dpgBadge: "डिजिटल पब्लिक गुड",

    modalTitle: "नागरिक आवाज़ पोर्टल में आपका स्वागत है",
    modalDesc: "अपने सभी उपकरणों पर अपनी बुनियादी ढांचा शिकायतों को ट्रैक करने के लिए साइन इन करें, या गुमनाम रूप से जारी रखें।",
    modalSignIn: "साइन इन करें / खाता बनाएं",
    modalGuest: "बिना साइन इन किए जारी रखें",

    tabSubmit: "शिकायत दर्ज करें",
    tabStatus: "शिकायत की स्थिति जांचें",
    tabMessaging: "व्हाट्सएप / एसएमएस चैनल डेमो",

    presetsLabel: "बहुभाषी डेमो नमूने:",
    presetEn: "🇬🇧 अंग्रेजी टेक्स्ट",
    presetHi: "🇮🇳 हिंदी रिपोर्ट",
    presetMr: "🇮🇳 मराठी रिपोर्ट",
    presetPt: "🇧🇷 पुर्तगाली (ब्रिक्स डेमो)",

    langLabel: "भाषा",
    districtLabel: "ज़िला",
    puneOption: "पुणे (उच्च कनेक्टिविटी)",
    gadchiroliOption: "गडचिरोली (कम मोबाइल पहुंच - कम दर्ज क्षेत्र)",
    localityLabel: "इलाका / गांव",
    localityPlaceholder: "गांव या कस्बे का नाम",
    descLabel: "समस्या का विवरण (आवाज़ या टेक्स्ट)",
    recordAudio: "ऑडियो रिकॉर्ड करें (माइक)",
    stopRecording: "रिकॉर्डिंग रोकें (सुन रहा है...)",
    audioRecorded: "ऑडियो रिकॉर्ड हो गया है और सबमिट करने के लिए तैयार है",
    reviewAudio: "रिकॉर्ड किया गया ऑडियो सुनें",
    reRecord: "दोबारा रिकॉर्ड करें",
    clear: "✕ हटाएं",
    descPlaceholder: "अपने इलाके की बुनियादी ढांचा समस्या (टूटी सड़क, पानी की आपूर्ति बंद, क्षतिग्रस्त अस्पताल छत) का विस्तार से वर्णन करें...",
    photoLabel: "बुनियादी ढांचा फोटो अपलोड करें",
    photoTag: "जेमिनी विज़न",
    photoRemove: "✕ हटाएं",
    photoDesc: "स्वचालित मल्टीमॉडल गंभीरता सत्यापन के लिए टूटी सड़क, पाइप लीकेज, बिजली के खंभे या स्कूल की फोटो संलग्न करें।",
    photoAttachPrompt: "फोटो संलग्न करने के लिए क्लिक करें या फाइल यहां खींचें",
    photoLimit: "PNG, JPG, WEBP (अधिकतम 5MB)",
    photoReady: "जेमिनी मल्टीमॉडल निरीक्षण के लिए तैयार",
    submitBtn: "बुनियादी ढांचा शिकायत दर्ज करें",
    submittingBtn: "एआई प्रोसेसिंग और डुप्लिकेट जांच जारी है...",

    aiProcessing: "एआई अनुरोध पर प्रक्रिया कर रहा है...",
    stepOf: (s: number) => `चरण ${s} / 4`,
    step1Title: "1. बहुभाषी इनपुट और ऑडियो पार्सिंग",
    step1Running: "इनपुट की जांच जारी...",
    step1Desc: "नागरिक इनपुट का सामान्यीकरण और रिपोर्ट तैयार करना",
    step2Title: "2. एलएलएम संरचित वर्गीकरण और गंभीरता आकलन",
    step2Running: "अनुरोध का विश्लेषण...",
    step2Desc: "बुनियादी ढांचा श्रेणी, समस्या प्रकार और गंभीरता की पहचान",
    step3Title: "3. वेक्टर एम्बेडिंग और डुप्लिकेट पहचान",
    step3Running: "समान रिपोर्टों की जांच...",
    step3Desc: "सिमेंटिक समानता का उपयोग करके समान नागरिक रिपोर्टों की जांच",
    step4Title: "4. संदर्भ कोड और जिला क्लस्टर पंजीकरण",
    step4Running: "अनुरोध पंजीकरण की तैयारी...",
    step4Desc: "शिकायत पंजीकृत करना और मांग डेटा अपडेट करना",

    resultTitle: "एआई विश्लेषण पूर्ण — शिकायत सफलतापूर्वक दर्ज!",
    verifiedBadge: "सत्यापित",
    refLabel: "संदर्भ कोड:",
    catLabel: "श्रेणी:",
    subcatLabel: "उप-श्रेणी:",
    sevLabel: "गंभीरता:",
    geminiAnalysis: "जेमिनी मल्टीमॉडल विज़न विश्लेषण",
    confidence: "सटीकता:",
    similarDetectedTitle: "समान शिकायत पहले से दर्ज है",
    similarDetectedLinked: "से जोड़ा गया:",
    similarDetectedDesc: "(डुप्लिकेट का विलय किया गया, मांग स्कोर अपडेट हुआ)।",
    noDuplicateTitle: "कोई डुप्लिकेट शिकायत नहीं मिली:",
    noDuplicateDesc: "एक नई विशिष्ट जिला शिकायत के रूप में दर्ज की गई।",

    statusPlaceholder: "संदर्भ कोड दर्ज करें (उदा. #REQ-48213)",
    checkStatusBtn: "स्थिति जांचें",
    checkingStatusBtn: "जांच जारी...",
    statusRefTitle: "संदर्भ कोड",
    statusCategory: "श्रेणी:",
    statusSubcategory: "उप-श्रेणी:",
    statusDistrict: "ज़िला:",
    statusCluster: "संबंधित क्लस्टर:",
    statusMerged: "समेकित विशिष्ट रिपोर्ट:",
    statusPriority: "क्लस्टर प्राथमिकता स्कोर:",
    statusAttachedPhoto: "संलग्न बुनियादी ढांचा फोटो:",
    reportsCount: "रिपोर्ट",

    senderPhone: "भेजने वाले का व्हाट्सएप / फोन नंबर",
    channelProvider: "चैनल प्रदाता",
    channelProviderVal: "ट्विलियो व्हाट्सएप सैंडबॉक्स",
    inboundBody: "आने वाले संदेश की सामग्री",
    triggerWebhook: "इनबाउंड वेबहुक पेलोड भेजें",
    triggeringWebhook: "भेज रहा है...",
    outboundResponse: "// नागरिक के व्हाट्सएप पर भेजा गया स्वचालित उत्तर:"
  },

  mr: {
    portalTitle: "नागरिक तक्रार पोर्टल",
    multilingualBadge: "बहुभाषिक प्रणाली",
    portalSubtitle: "व्हॉइस ऑडिओ, फोटो विश्लेषण, मजकूर आणि व्हॉट्सॲपद्वारे थेट नागरिक समस्यांची नोंद व निवारण.",
    optionalSignIn: "ऐच्छिक साइन इन",
    signOut: "साइन आउट",
    citizenRole: "नागरिक",
    dpgBadge: "डिजिटल पब्लिक गुड",

    modalTitle: "नागरिक तक्रार पोर्टलवर आपले स्वागत आहे",
    modalDesc: "आपल्या सर्व उपकरणांवर आपल्या तक्रारींचा पाठपुरावा करण्यासाठी साइन इन करा किंवा अनामिकपणे तक्रार नोंदवा.",
    modalSignIn: "साइन इन करा / खाते तयार करा",
    modalGuest: "साइन इन न करता पुढे जा",

    tabSubmit: "तक्रार नोंदवा",
    tabStatus: "तक्रारीची स्थिती तपासा",
    tabMessaging: "व्हॉट्सॲप / एसएमएस चॅनेल डेमो",

    presetsLabel: "बहुभाषिक डेमो नमुने:",
    presetEn: "🇬🇧 इंग्रजी मजकूर",
    presetHi: "🇮🇳 हिंदी तक्रार",
    presetMr: "🇮🇳 मराठी तक्रार",
    presetPt: "🇧🇷 पोर्तुगीज (ब्रिक्स डेमो)",

    langLabel: "भाषा",
    districtLabel: "जिल्हा",
    puneOption: "पुणे (उच्च कनेक्टिव्हिटी)",
    gadchiroliOption: "गडचिरोली (कमी मोबाइल उपलब्धता - उपेक्षित क्षेत्र)",
    localityLabel: "परिसर / गाव",
    localityPlaceholder: "गाव किंवा शहराचे नाव",
    descLabel: "समस्येचे वर्णन (आवाज किंवा मजकूर)",
    recordAudio: "ऑडिओ रेकॉर्ड करा (माइक)",
    stopRecording: "रेकॉर्डिंग थांबवा (ऐकत आहे...)",
    audioRecorded: "ऑडिओ रेकॉर्ड झाला असून सबमिट करण्यासाठी सज्ज आहे",
    reviewAudio: "रेकॉर्ड केलेला ऑडिओ ऐका",
    reRecord: "पुन्हा रेकॉर्ड करा",
    clear: "✕ हटवा",
    descPlaceholder: "आपल्या परिसरातील पायाभूत सुविधेच्या समस्येचे तपशीलवार वर्णन करा (रस्ता खराब, पाणी पुरवठा बंद, रुग्णालयाचे नुकसान)...",
    photoLabel: "पायाभूत सुविधेचा फोटो अपलोड करा",
    photoTag: "जेमिनी व्हिजन",
    photoRemove: "✕ हटवा",
    photoDesc: "स्वयंचलित मल्टिमोडल तीव्रता पडताळणीसाठी खराब रस्ता, पाईप गळती, विजेचा खांब किंवा शाळेचा फोटो जोडा.",
    photoAttachPrompt: "फोटो जोडण्यासाठी क्लिक करा किंवा फाइल येथे ड्रॅग करा",
    photoLimit: "PNG, JPG, WEBP (कमाल 5MB)",
    photoReady: "जेमिनी मल्टिमोडल तपासणीसाठी सज्ज",
    submitBtn: "पायाभूत सुविधा तक्रार नोंदवा",
    submittingBtn: "एआय प्रक्रिया आणि डुप्लिकेट तपासणी सुरू आहे...",

    aiProcessing: "एआय विनंतीवर प्रक्रिया करत आहे...",
    stepOf: (s: number) => `टप्पा ${s} / 4`,
    step1Title: "1. बहुभाषिक इनपुट आणि ऑडिओ पार्सिंग",
    step1Running: "इनपुट तपासत आहे...",
    step1Desc: "नागरिक इनपुटचे प्रमाणीकरण आणि तक्रार तयारी",
    step2Title: "2. एलएलएम संरचित वर्गीकरण आणि तीव्रता",
    step2Running: "तक्रारीचे विश्लेषण...",
    step2Desc: "पायाभूत सुविधा श्रेणी, समस्येचा प्रकार आणि तीव्रता ओळखणे",
    step3Title: "3. व्हेक्टर एम्बेडिंग आणि डुप्लिकेट तपासणी",
    step3Running: "समान तक्रारींची तपासणी...",
    step3Desc: "सिमॅंटिक साम्य वापरून गावातील समान तक्रारी शोधणे",
    step4Title: "4. संदर्भ कोड आणि जिल्हा क्लस्टर नोंदणी",
    step4Running: "तक्रार नोंदणीची तयारी...",
    step4Desc: "तक्रार नोंदवणे आणि मागणी माहिती अद्ययावत करणे",

    resultTitle: "एआय विश्लेषण पूर्ण — तक्रार यशस्वीरीत्या नोंदवली!",
    verifiedBadge: "पडताळणी पूर्ण",
    refLabel: "संदर्भ कोड:",
    catLabel: "श्रेणी:",
    subcatLabel: "उप-श्रेणी:",
    sevLabel: "तीव्रता:",
    geminiAnalysis: "जेमिनी मल्टिमोडल व्हिजन विश्लेषण",
    confidence: "विश्वासार्हता:",
    similarDetectedTitle: "समान तक्रार आधीच नोंदवलेली आढळली",
    similarDetectedLinked: "शी जोडले गेले:",
    similarDetectedDesc: "(डुप्लिकेट नोंद विलीन केली, मागणी गुण अद्ययावत झाले).",
    noDuplicateTitle: "कोणतीही डुप्लिकेट नोंद आढळली नाही:",
    noDuplicateDesc: "नवीन स्वतंत्र जिल्हा तक्रार म्हणून नोंद केली गेली.",

    statusPlaceholder: "संदर्भ कोड टाका (उदा. #REQ-48213)",
    checkStatusBtn: "स्थिती तपासा",
    checkingStatusBtn: "तपासत आहे...",
    statusRefTitle: "संदर्भ कोड",
    statusCategory: "श्रेणी:",
    statusSubcategory: "उप-श्रेणी:",
    statusDistrict: "जिल्हा:",
    statusCluster: "संबंधित क्लस्टर:",
    statusMerged: "एकत्रित स्वतंत्र तक्रारी:",
    statusPriority: "क्लस्टर प्राधान्यक्रम गुण:",
    statusAttachedPhoto: "जोडलेला पायाभूत सुविधा फोटो:",
    reportsCount: "तक्रारी",

    senderPhone: "पाठवणाऱ्याचा व्हॉट्सॲप / फोन नंबर",
    channelProvider: "चॅनेल प्रदाता",
    channelProviderVal: "ट्विलिओ व्हॉट्सॲप सँडबॉक्स",
    inboundBody: "येणारा संदेश मजकूर",
    triggerWebhook: "इनबाउंड वेबहुक पेलोड पाठवा",
    triggeringWebhook: "पाठवत आहे...",
    outboundResponse: "// नागरिकांच्या व्हॉट्सॲपवर पाठवलेले स्वयंचलित उत्तर:"
  },

  pt: {
    portalTitle: "Portal da Voz do Cidadão",
    multilingualBadge: "Ingestão Multilíngue",
    portalSubtitle: "Canal direto para demandas comunitárias via áudio, análise de fotos, texto e WhatsApp.",
    optionalSignIn: "Entrar (Opcional)",
    signOut: "Sair",
    citizenRole: "Cidadão",
    dpgBadge: "Bem Público Digital",

    modalTitle: "Bem-vindo à Voz do Cidadão",
    modalDesc: "Faça login para acompanhar suas solicitações em todos os dispositivos ou continue como visitante anônimo.",
    modalSignIn: "Entrar / Criar Conta",
    modalGuest: "Continuar sem entrar",

    tabSubmit: "Enviar Solicitação",
    tabStatus: "Verificar Status",
    tabMessaging: "Canal WhatsApp / SMS",

    presetsLabel: "Modelos de Demonstração:",
    presetEn: "🇬🇧 Texto em Inglês",
    presetHi: "🇮🇳 Relatório em Hindi",
    presetMr: "🇮🇳 Relatório em Marata",
    presetPt: "🇧🇷 Português (Demo BRICS)",

    langLabel: "Idioma",
    districtLabel: "Distrito",
    puneOption: "Pune (Alta Conectividade)",
    gadchiroliOption: "Gadchiroli (Baixo Acesso Móvel - Subnotificado)",
    localityLabel: "Localidade / Povoado",
    localityPlaceholder: "Nome da Vila ou Cidade",
    descLabel: "Descrição da Demanda (Voz ou Texto)",
    recordAudio: "Gravar Áudio (Microfone)",
    stopRecording: "Parar Gravação (Ouvindo...)",
    audioRecorded: "Áudio gravado e pronto para envio",
    reviewAudio: "Ouvir Gravação de Voz",
    reRecord: "Gravar Novamente",
    clear: "✕ Limpar",
    descPlaceholder: "Descreva o problema de infraestrutura em sua localidade (estrada danificada, falta de água, posto de saúde danificado)...",
    photoLabel: "Carregar Foto da Infraestrutura",
    photoTag: "Gemini Vision",
    photoRemove: "✕ Remover",
    photoDesc: "Anexe uma foto da estrada danificada, vazamento ou escola para acionar a verificação multimodal de gravidade.",
    photoAttachPrompt: "Clique para anexar foto ou arraste o arquivo aqui",
    photoLimit: "PNG, JPG, WEBP até 5MB",
    photoReady: "Pronto para Inspeção Multimodal Gemini",
    submitBtn: "Enviar Solicitação de Infraestrutura",
    submittingBtn: "Processando IA e Deduplicando...",

    aiProcessing: "A IA está processando a solicitação...",
    stepOf: (s: number) => `Etapa ${s} de 4`,
    step1Title: "1. Ingestão Multilíngue e Análise de Áudio",
    step1Running: "Processando entrada...",
    step1Desc: "Normalizando os dados do cidadão e preparando o relatório",
    step2Title: "2. Categorização Estruturada por LLM e Gravidade",
    step2Running: "Analisando demanda...",
    step2Desc: "Identificando categoria da infraestrutura, tipo e gravidade",
    step3Title: "3. Embedding Vetorial e Deduplicação",
    step3Running: "Verificando relatos similares...",
    step3Desc: "Buscando relatórios semelhantes por similaridade semântica",
    step4Title: "4. Código de Referência e Registro no Cluster",
    step4Running: "Preparando registro...",
    step4Desc: "Registrando a solicitação e atualizando os dados de demanda",

    resultTitle: "Processamento de IA concluído — Solicitação Ingerida!",
    verifiedBadge: "Verificado",
    refLabel: "Referência:",
    catLabel: "Categoria:",
    subcatLabel: "Subcategoria:",
    sevLabel: "Gravidade:",
    geminiAnalysis: "Análise Visual Multimodal Gemini",
    confidence: "Confiança:",
    similarDetectedTitle: "Solicitação similar detectada",
    similarDetectedLinked: "Vinculado a:",
    similarDetectedDesc: "(Duplicata agregada, pontuação de demanda atualizada).",
    noDuplicateTitle: "Nenhuma duplicata detectada:",
    noDuplicateDesc: "Registrado como um novo relatório exclusivo do distrito.",

    statusPlaceholder: "Digite o Código de Referência (ex: #REQ-48213)",
    checkStatusBtn: "Verificar Status",
    checkingStatusBtn: "Buscando...",
    statusRefTitle: "Código de Referência",
    statusCategory: "Categoria:",
    statusSubcategory: "Subcategoria:",
    statusDistrict: "Distrito:",
    statusCluster: "Cluster Associado:",
    statusMerged: "Relatórios Únicos Agrupados:",
    statusPriority: "Pontuação de Prioridade do Cluster:",
    statusAttachedPhoto: "Foto Anexa da Infraestrutura:",
    reportsCount: "relatórios",

    senderPhone: "Número do WhatsApp / Telefone do Remetente",
    channelProvider: "Provedor do Canal",
    channelProviderVal: "Sandbox Twilio WhatsApp",
    inboundBody: "Corpo da Mensagem Recebida",
    triggerWebhook: "Disparar Carga Útil do Webhook",
    triggeringWebhook: "Enviando...",
    outboundResponse: "// Resposta Automática Enviada para o WhatsApp do Cidadão:"
  }
};
