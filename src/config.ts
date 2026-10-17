/**
 * CAMPUSOS CENTRAL CONFIG
 * Most college identity, UI labels, features, counts, slider items and integrations are configured here.
 * Supabase publishable keys and Cloudinary unsigned upload presets are intended for browser use.
 * NEVER place a Supabase service_role key or other secret in this file.
 */
export const CONFIG = {
  college: {
    name: 'Fulbariya College',
    shortName: 'CampusOS',
    banglaName: 'ফুলবাড়ীয়া কলেজ, ময়মনসিংহ',
    tagline: 'Smart Campus, Better Future',
    established: '1972',
    eiin: '111516',
    nuCode: '5215',
    address: 'College Road, Fulbaria, Mymensingh 2216, Bangladesh',
    phone: '',
    email: '',
    logoUrl: '',
    // Replace with a real college photo URL or upload using the admin panel.
    heroFallbackImage: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1800&q=85',
  },
  theme: { navy: '#0a1655', navyDeep: '#07102e', gold: '#f2d27b', goldDark: '#d4af37', page: '#f4f7fc' },
  integrations: {
    supabaseUrl: 'https://dpbbsfppjmgvzsopmdww.supabase.co',
    supabasePublishableKey: 'sb_publishable_O0gApiitS1P9graqe1cjKA_f8KJRUD7',
    cloudinaryCloudName: 'awxusvtg',
    cloudinaryUploadPreset: 'college_unsigned',
    cloudinaryFolder: 'fulbariya-college',
    cloudinaryUploadUrl: 'https://api.cloudinary.com/v1_1/awxusvtg/image/upload',
  },
  features: {
    pwaInstall: true,
    offlineShell: true,
    studentPortal: true,
    teacherPortal: true,
    adminPortal: true,
    bncc: true,
    scouts: true,
    bloodDonation: true,
    gallery: true,
    results: true,
    routines: true,
    notices: true,
    departmentSlider: true,
    // Browser app uses these as fallback display counters until database values are available.
    fallbackCounters: { students: '2,850+', teachers: '120+', departments: '25+', years: '50+' },
  },
  navigation: [
    { label: 'Home', href: '#home' }, { label: 'About', href: '#about' }, { label: 'Departments', href: '#departments' },
    { label: 'Notices', href: '#notices' }, { label: 'Campus Life', href: '#campus-life' }, { label: 'Contact', href: '#contact' },
  ],
  departments: [
    { name: 'Zoology', subtitle: ' প্রাণিবিজ্ঞান', icon: '🧬' },
    { name: 'Botany', subtitle: 'উদ্ভিদবিজ্ঞান', icon: '🌿' },
    { name: 'Chemistry', subtitle: 'রসায়ন', icon: '⚗️' },
    { name: 'Physics', subtitle: 'পদার্থবিজ্ঞান', icon: '🔭' },
    { name: 'Mathematics', subtitle: 'গণিত', icon: '📐' },
    { name: 'Accounting', subtitle: 'হিসাববিজ্ঞান', icon: '📊' },
  ],
  sliderFallback: [
    { title: 'A place to learn and grow', subtitle: 'Knowledge, character and opportunity — together.', image: '' },
    { title: 'Discover your potential', subtitle: 'Explore academic life at Fulbariya College.', image: '' },
  ],
};
