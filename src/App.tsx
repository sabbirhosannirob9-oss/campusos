 import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, GraduationCap, Image as ImageIcon, LogIn, Menu, ShieldCheck, Sparkles, Users, X, Zap, Download, LoaderCircle, Mail, MapPin, Phone, Search, Settings, School, FlaskConical, Trophy, HeartPulse, Compass, ExternalLink, Trash2, Megaphone } from 'lucide-react';
import { CONFIG } from './config';
import { supabase, supabaseReady, uploadCollegeImage } from './lib/supabase';

type Notice = { id: string; title: string; body?: string; category?: string; published_at?: string; created_at?: string; file_url?: string; is_published?: boolean; is_in_ticker?: boolean };
type Slide = { id?: string; title: string; subtitle?: string; image_url?: string; button_label?: string; button_url?: string; is_active?: boolean };
type Profile = { id: string; full_name?: string; role?: string; email?: string };
const sampleNotices: Notice[] = [
  { id: 'n1', title: 'Welcome to the new CampusOS portal', body: 'The college website and campus portal are being refreshed for students, teachers and visitors.', category: 'General', published_at: new Date().toISOString() },
  { id: 'n2', title: 'Academic notice and examination updates', body: 'Please check the official notice board regularly for verified academic announcements.', category: 'Academic', published_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'n3', title: 'Campus clubs and student activities', body: 'Explore BNCC, Scouts, blood donation and other campus activities.', category: 'Event', published_at: new Date(Date.now() - 86400000 * 5).toISOString() },
];
const fmtDate = (value?: string) => { if (!value) return 'Recent'; const d = new Date(value); return Number.isNaN(d.getTime()) ? 'Recent' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };

export default function App() {
  const [notices, setNotices] = useState<Notice[]>(sampleNotices);
  const [slides, setSlides] = useState<Slide[]>(CONFIG.sliderFallback.map((s) => ({ title: s.title, subtitle: s.subtitle, image_url: s.image || CONFIG.college.heroFallbackImage })));
  const [slideIndex, setSlideIndex] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installVisible, setInstallVisible] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [portal, setPortal] = useState<'student' | 'teacher' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'notices' | 'slides'>('notices');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftCategory, setDraftCategory] = useState('General');
  const [draftImage, setDraftImage] = useState<File | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [showAllNotices, setShowAllNotices] = useState(false);
  const currentSlide = slides[slideIndex] || slides[0];

  useEffect(() => {
    const onBeforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event); setInstallVisible(true); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    const onInstalled = () => { setInstallVisible(false); setInstallPrompt(null); };
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstall); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadPublicData() {
      if (!supabaseReady) return;
      const [noticeRes, slideRes] = await Promise.all([
        supabase.from('campus_notices').select('id,title,body,category,published_at,created_at,file_url,is_published,is_in_ticker').eq('is_published', true).order('published_at', { ascending: false }).limit(10),
        supabase.from('campus_hero_slides').select('id,title,subtitle,image_url,button_label,button_url,is_active').eq('is_active', true).order('sort_order', { ascending: true }).limit(6),
      ]);
      if (!alive) return;
      if (!noticeRes.error && noticeRes.data?.length) setNotices(noticeRes.data as Notice[]);
      if (!slideRes.error && slideRes.data?.length) { setSlides(slideRes.data as Slide[]); setSlideIndex(0); }
    }
    loadPublicData();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { void loadProfile(session.user.id, session.user.email || ''); }
      else setProfile(null);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session?.user) void loadProfile(data.session.user.id, data.session.user.email || ''); });
    return () => { alive = false; authListener.subscription.unsubscribe(); };
  }, []);

  async function loadProfile(id: string, userEmail: string) {
    const { data } = await supabase.from('campus_profiles').select('id,full_name,role,email').eq('id', id).maybeSingle();
    setProfile(data ? { ...data, email: data.email || userEmail } as Profile : { id, email: userEmail, role: 'student' });
  }

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setSlideIndex((i) => (i + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const filteredNotices = useMemo(() => notices.filter((n) => `${n.title} ${n.body || ''} ${n.category || ''}`.toLowerCase().includes(search.toLowerCase())), [notices, search]);
  const tickerNotices = useMemo(() => notices.filter(n => n.is_in_ticker).slice(0, 5), [notices]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setAuthBusy(true); setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    if (error) setAuthMessage(error.message);
    else { setAuthMessage('Signed in. Loading your portal…'); setAuthOpen(false); }
  }
  async function logout() { await supabase.auth.signOut(); setProfile(null); setAdminOpen(false); setAuthOpen(false); }
  
  async function publishNotice(event: React.FormEvent) {
    event.preventDefault(); if (!profile || profile.role !== 'admin') { setAdminMessage('Admin access is required.'); return; }
    setAdminBusy(true); setAdminMessage('');
    const { error } = await supabase.from('campus_notices').insert({ title: draftTitle.trim(), body: draftBody.trim(), category: draftCategory, is_published: true, published_at: new Date().toISOString(), created_by: profile.id, is_in_ticker: true });
    setAdminBusy(false);
    if (error) setAdminMessage(error.message); 
    else { 
      setAdminMessage('Notice published.'); 
      setDraftTitle(''); setDraftBody(''); 
      const { data } = await supabase.from('campus_notices').select('id,title,body,category,published_at,created_at,file_url,is_published,is_in_ticker').eq('is_published', true).order('published_at', { ascending: false }).limit(10); 
      if (data) setNotices(data as Notice[]); 
    }
  }

  async function deleteNotice(id: string) {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    setAdminBusy(true);
    const { error } = await supabase.from('campus_notices').delete().eq('id', id);
    setAdminBusy(false);
    if (error) setAdminMessage(error.message);
    else {
      setAdminMessage('Notice deleted.');
      setNotices(notices.filter(n => n.id !== id));
    }
  }

  async function publishSlide(event: React.FormEvent) {
    event.preventDefault(); if (!profile || profile.role !== 'admin') { setAdminMessage('Admin access is required.'); return; }
    setAdminBusy(true); setAdminMessage('');
    try {
      let image_url = '';
      if (draftImage) image_url = await uploadCollegeImage(draftImage);
      if (!image_url) throw new Error('Choose an image to upload.');
      const { error } = await supabase.from('campus_hero_slides').insert({ title: draftTitle.trim(), subtitle: draftBody.trim(), image_url, is_active: true, sort_order: 50, created_by: profile.id });
      if (error) throw error;
      setAdminMessage('Slide uploaded. Refreshing page data…');
      const { data } = await supabase.from('campus_hero_slides').select('id,title,subtitle,image_url,button_label,button_url,is_active').eq('is_active', true).order('sort_order', { ascending: true }).limit(6);
      if (data?.length) { setSlides(data as Slide[]); setSlideIndex(0); }
      setDraftTitle(''); setDraftBody(''); setDraftImage(null);
    } catch (e) { setAdminMessage(e instanceof Error ? e.message : 'Upload failed.'); }
    finally { setAdminBusy(false); }
  }

  async function installApp() {
    if (!installPrompt) { setInstallVisible(false); return; }
    await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); setInstallVisible(false);
  }

  const nav = CONFIG.navigation;
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#home" aria-label="Fulbaria College home"><span className="brand-mark"><GraduationCap size={25}/></span><span><strong>{CONFIG.college.name}</strong><small>{CONFIG.college.tagline}</small></span></a>
      <nav className={`desktop-nav ${mobileMenu ? 'nav-open' : ''}`}>{nav.map((item) => <a key={item.href} href={item.href} onClick={() => setMobileMenu(false)}>{item.label}</a>)}</nav>
      <div className="top-actions">{profile ? <button className="btn btn-outline btn-small" onClick={() => profile.role === 'admin' ? setAdminOpen(true) : setAuthOpen(true)}>{profile.full_name || profile.role || 'My portal'}</button> : <button className="btn btn-outline btn-small" onClick={() => setAuthOpen(true)}><LogIn size={15}/> Login</button>}<a className="btn btn-gold btn-small get-started" href="#portals">Explore portal <ArrowRight size={15}/></a><button className="icon-button mobile-menu-button" aria-label="Toggle menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button></div>
    </header>

    <main>
      <section id="home" className="hero-section">
        <AnimatePresence mode="wait"><motion.div key={slideIndex} className="hero-bg" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,14,43,.96) 0%, rgba(5,14,43,.78) 42%, rgba(5,14,43,.12) 100%), url("${currentSlide?.image_url || CONFIG.college.heroFallbackImage}")` }} initial={{ opacity: .5 }} animate={{ opacity: 1 }} exit={{ opacity: .4 }} transition={{ duration: .6 }}/></AnimatePresence>
        <div className="hero-content"><div className="eyebrow"><span className="eyebrow-dot"/> {CONFIG.college.banglaName}</div><motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>Welcome to<br/><em>{CONFIG.college.name}</em></motion.h1><p className="hero-copy">{currentSlide?.subtitle || 'A modern college management platform connecting students, teachers and administration in one place.'}</p><div className="hero-buttons"><a className="btn btn-gold" href="#about">Discover Campus <ArrowRight size={17}/></a><button className="btn btn-glass" onClick={() => setAuthOpen(true)}><LogIn size={17}/> Open portal</button></div><div className="hero-meta"><span><ShieldCheck size={15}/> Trusted campus information</span><span><Zap size={15}/> Built for mobile</span></div></div>
        <div className="hero-controls"><button className="icon-button" aria-label="Previous slide" onClick={() => setSlideIndex((i) => (i - 1 + slides.length) % slides.length)}><ChevronLeft/></button><div className="slide-dots">{slides.map((s, i) => <button key={`${s.title}-${i}`} aria-label={`Slide ${i + 1}`} className={i === slideIndex ? 'active' : ''} onClick={() => setSlideIndex(i)}/>)}</div><button className="icon-button" aria-label="Next slide" onClick={() => setSlideIndex((i) => (i + 1) % slides.length)}><ChevronRight/></button></div>
      </section>

      {/* NOTICE TICKER */}
      {tickerNotices.length > 0 && (
        <div style={{ background: 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', padding: '10px 18px', gap: '15px', borderBottom: '2px solid var(--gold)' }}>
          <span style={{ background: 'var(--gold)', color: 'var(--navy)', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}><Megaphone size={12}/> আপডেট</span>
          <div className="ticker-wrap" style={{ overflow: 'hidden', flex: 1, display: 'flex', whiteSpace: 'nowrap' }}>
            <div className="ticker" style={{ display: 'inline-block', paddingLeft: '100%', animation: 'ticker 25s linear infinite', fontSize: '13px' }}>
              {tickerNotices.map((n) => <span key={n.id} style={{ marginRight: '40px' }}>• {n.title}</span>)}
            </div>
          </div>
          <style>{`@keyframes ticker { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } } .ticker:hover { animation-play-state: paused !important; cursor: pointer; }`}</style>
        </div>
      )}

      <section className="portal-strip" id="portals"><PortalCard icon={<GraduationCap/>} title="Student Portal" body="Access academic information, notices and results." onClick={() => { setPortal('student'); setAuthOpen(true); }}/><PortalCard icon={<BookOpen/>} title="Teacher Portal" body="Manage classes, attendance and student progress." onClick={() => { setPortal('teacher'); setAuthOpen(true); }}/><PortalCard icon={<Settings/>} title="Admin Panel" body="Manage college content and campus information." onClick={() => { setPortal('admin'); setAuthOpen(true); }}/><PortalCard icon={<School/>} title="College Website" body="Discover departments, activities and campus news." onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}/></section>

      <section id="about" className="section about-section"><div className="about-image-wrap"><img src={CONFIG.college.heroFallbackImage} alt="College campus"/><div className="image-caption"><span className="caption-icon"><School size={20}/></span><span><b>A community built on learning</b><small>Since {CONFIG.college.established}</small></span></div></div><div className="about-copy"><span className="section-kicker">ABOUT OUR COLLEGE</span><h2>Tradition, excellence,<br/><em>and a brighter future.</em></h2><p>CampusOS brings the college community together with a modern digital experience for academic information, campus activities and official updates.</p><div className="feature-list"><Feature icon={<CheckCircle2/>} title="Academic community" text="Students, teachers and departments in one place."/><Feature icon={<ShieldCheck/>} title="Reliable information" text="A central place for official notices and updates."/><Feature icon={<Zap/>} title="Mobile-friendly access" text="Designed to work smoothly across devices."/></div><a className="text-link" href="#departments">Explore departments <ArrowRight size={17}/></a></div></section>

      <section className="stats-band" aria-label="College statistics">{[{ icon: <Users/>, value: CONFIG.features.fallbackCounters.students, label: 'Students' }, { icon: <GraduationCap/>, value: CONFIG.features.fallbackCounters.teachers, label: 'Teachers' }, { icon: <BookOpen/>, value: CONFIG.features.fallbackCounters.departments, label: 'Departments' }, { icon: <CalendarDays/>, value: CONFIG.features.fallbackCounters.years, label: 'Years of legacy' }].map((s) => <div className="stat-item" key={s.label}><span className="stat-icon">{s.icon}</span><strong>{s.value}</strong><small>{s.label}</small></div>)}</section>

      <section id="departments" className="section departments-section"><div className="section-heading"><div><span className="section-kicker">LEARN YOUR WAY</span><h2>Explore our <em>departments</em></h2><p>Find your subject, discover your interests and build your future.</p></div><a href="#contact" className="text-link">All departments <ArrowRight size={16}/></a></div><div className="department-grid">{CONFIG.departments.map((d, i) => <motion.article whileHover={{ y: -5 }} className={`department-card tone-${i % 4}`} key={d.name}><span className="department-emoji">{d.icon}</span><h3>{d.name}</h3><p>{d.subtitle}</p><span className="card-arrow"><ArrowRight size={17}/></span></motion.article>)}</div></section>

      <section id="notices" className="section notices-section"><div className="section-heading"><div><span className="section-kicker">CAMPUS UPDATES</span><h2>Latest <em>notices</em></h2><p>Official updates and important announcements in one place.</p></div><button className="btn btn-outline" onClick={() => setShowAllNotices(!showAllNotices)}>{showAllNotices ? 'Show less' : 'View all'} <ArrowRight size={16}/></button></div><div className="notice-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notices..." aria-label="Search notices"/></div><span className="notice-count"><Bell size={15}/> {filteredNotices.length} updates</span></div><div className="notice-list">{(showAllNotices ? filteredNotices : filteredNotices.slice(0, 3)).map((n, i) => <article className="notice-row" key={n.id}><div className={`notice-symbol notice-${i % 4}`}><Bell size={20}/></div><div className="notice-main"><div className="notice-tags"><span>{n.category || 'General'}</span><time>{fmtDate(n.published_at || n.created_at)}</time></div><h3>{n.title}</h3><p>{n.body || 'Please open the official notice board for further information.'}</p>{n.file_url && <a href={n.file_url} target="_blank" rel="noreferrer" className="text-link">View attachment <ExternalLink size={14}/></a>}</div><ArrowRight className="notice-arrow" size={18}/></article>)}{filteredNotices.length === 0 && <div className="empty-state">No notices match your search.</div>}</div><p className="data-note">{supabaseReady ? 'Showing published notices from the college database when available.' : 'Showing sample notices.'}</p></section>

      <section id="campus-life" className="section campus-section"><div className="section-heading"><div><span className="section-kicker">BEYOND THE CLASSROOM</span><h2>Make campus <em>count</em></h2><p>Learning, leadership, service and belonging.</p></div></div><div className="activity-grid">{CONFIG.features.bncc && <Activity icon={<Compass/>} title="BNCC" text="Build leadership, discipline and a spirit of service." tint="blue"/>}{CONFIG.features.scouts && <Activity icon={<Trophy/>} title="Scouts" text="Learn teamwork, practical skills and community responsibility." tint="gold"/>}{CONFIG.features.bloodDonation && <Activity icon={<HeartPulse/>} title="Blood donation" text="Connect campus volunteers with meaningful service." tint="rose"/>}{CONFIG.features.gallery && <Activity icon={<ImageIcon/>} title="Campus gallery" text="Celebrate events, achievements and college life." tint="green"/>}</div></section>

      <section className="cta-section"><div className="cta-icon"><Sparkles size={26}/></div><div><span className="section-kicker">YOUR CAMPUS, CONNECTED</span><h2>Everything starts with <em>curiosity.</em></h2><p>Open your portal to explore academic updates and campus resources.</p></div><button className="btn btn-gold" onClick={() => setAuthOpen(true)}>Access portal <ArrowRight size={17}/></button></section>
    </main>

    <footer id="contact" className="footer"><div className="footer-main"><div className="brand footer-brand"><span className="brand-mark"><GraduationCap size={25}/></span><span><strong>{CONFIG.college.name}</strong><small>{CONFIG.college.tagline}</small></span></div><p>A modern digital gateway for the college community.</p><div className="footer-address"><span><MapPin size={15}/>{CONFIG.college.address}</span>{CONFIG.college.phone && <span><Phone size={15}/>{CONFIG.college.phone}</span>}{CONFIG.college.email && <span><Mail size={15}/>{CONFIG.college.email}</span>}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {CONFIG.college.name}.</span><span>Built for learning. Designed for everyone.</span></div></footer>

    {installVisible && CONFIG.features.pwaInstall && <motion.div className="install-banner" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><span className="install-icon"><Download/></span><div><b>Install CampusOS</b><small>Add the college portal to your home screen.</small></div><button className="btn btn-gold btn-small" onClick={installApp}>Install</button><button className="icon-button" aria-label="Dismiss install prompt" onClick={() => setInstallVisible(false)}><X size={17}/></button></motion.div>}

    {authOpen && <Modal title="Welcome to CampusOS" subtitle="Sign in to continue to your campus portal." onClose={() => { setAuthOpen(false); setAuthMessage(''); }}><div className="portal-tabs">{(['student','teacher','admin'] as const).map((r) => <button key={r} className={portal === r ? 'selected' : ''} onClick={() => setPortal(r)}>{r[0].toUpperCase() + r.slice(1)}</button>)}</div><form className="auth-form" onSubmit={login}><label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="username"/></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" autoComplete="current-password"/></label><button className="btn btn-navy btn-full" disabled={authBusy}>{authBusy ? <LoaderCircle className="spin" size={17}/> : <LogIn size={17}/>} Sign in to {portal} portal</button>{authMessage && <p className="form-message">{authMessage}</p>}<p className="form-footnote">Accounts must be created and assigned the correct role by an authorized administrator. Public sign-up is intentionally disabled.</p></form></Modal>}

    {profile && (profile.role === 'student' || profile.role === 'teacher') && <div className="signed-in-pill"><CheckCircle2 size={16}/> Signed in as {profile.full_name || profile.email || profile.role}<button onClick={logout}>Sign out</button></div>}

    {adminOpen && <Modal title="CampusOS Admin" subtitle={`Signed in as ${profile?.email || 'administrator'}`} onClose={() => setAdminOpen(false)} wide><div className="admin-tabs"><button className={adminTab === 'notices' ? 'selected' : ''} onClick={() => { setAdminTab('notices'); setAdminMessage(''); }}>Manage notices</button><button className={adminTab === 'slides' ? 'selected' : ''} onClick={() => { setAdminTab('slides'); setAdminMessage(''); }}>Hero slider</button><button className="admin-logout" onClick={logout}>Sign out</button></div>
    
    {profile?.role !== 'admin' ? <div className="empty-state"><ShieldCheck size={25}/><b>Administrator permission required</b><p>Your account role is not admin. Ask the database owner to assign the role securely.</p></div> : 
    
    adminTab === 'notices' ? (
      <div>
        <form className="auth-form" onSubmit={publishNotice} style={{ marginBottom: '20px' }}>
          <label>Notice title<input required value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="e.g. Examination schedule"/></label>
          <label>Category<select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}><option>General</option><option>Academic</option><option>Examination</option><option>Admission</option><option>Event</option></select></label>
          <label>Details<textarea rows={3} value={draftBody} onChange={(e) => setDraftBody(e.target.value)} placeholder="Write the official announcement..."/></label>
          <button className="btn btn-navy btn-full" disabled={adminBusy}>{adminBusy ? 'Publishing…' : 'Publish notice'}</button>
          {adminMessage && <p className="form-message">{adminMessage}</p>}
        </form>
        <h4 style={{ margin: '15px 0 10px', fontSize: '12px' }}>Recent Notices</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notices.map(n => (
             <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px solid #eaeaea' }}>
               <div style={{ fontSize: '11px' }}><b>{n.title}</b><br/><span style={{color:'#888'}}>{n.category} | {fmtDate(n.published_at)}</span></div>
               <button onClick={() => deleteNotice(n.id)} style={{ background: '#ffebee', color: '#c62828', border: 0, padding: '8px', borderRadius: '6px', display: 'grid', placeItems: 'center' }} disabled={adminBusy}><Trash2 size={16}/></button>
             </div>
          ))}
        </div>
      </div>
    ) : (
      <form className="auth-form" onSubmit={publishSlide}><label>Slide title<input required value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Welcome to our campus"/></label><label>Subtitle<input value={draftBody} onChange={(e) => setDraftBody(e.target.value)} placeholder="Short supporting text"/></label><label>Campus image<input type="file" accept="image/*" onChange={(e) => setDraftImage(e.target.files?.[0] || null)} required/></label><p className="form-footnote">Image uploads use the unsigned Cloudinary preset.</p><button className="btn btn-navy btn-full" disabled={adminBusy}>{adminBusy ? 'Uploading…' : 'Upload and publish slide'}</button>{adminMessage && <p className="form-message">{adminMessage}</p>}</form>
    )}
    </Modal>}
  </div>;
}

function PortalCard({ icon, title, body, onClick }: { icon: React.ReactNode; title: string; body: string; onClick: () => void }) { return <motion.button whileHover={{ y: -4 }} className="portal-card" onClick={onClick}><span className="portal-icon">{icon}</span><span className="portal-title">{title}</span><span className="portal-body">{body}</span><ArrowRight className="portal-arrow" size={17}/></motion.button>; }
function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="feature-item"><span>{icon}</span><div><b>{title}</b><small>{text}</small></div></div>; }
function Activity({ icon, title, text, tint }: { icon: React.ReactNode; title: string; text: string; tint: string }) { return <article className="activity-card"><span className={`activity-icon ${tint}`}>{icon}</span><h3>{title}</h3><p>{text}</p><span className="activity-link">Campus activity <ArrowRight size={15}/></span></article>; }
function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><motion.section className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><button className="modal-close icon-button" onClick={onClose} aria-label="Close"><X/></button><div className="modal-heading"><span className="brand-mark"><GraduationCap size={23}/></span><h2>{title}</h2><p>{subtitle}</p></div>{children}</motion.section></div>; }