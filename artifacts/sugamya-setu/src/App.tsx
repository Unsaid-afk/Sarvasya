import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetBuilding, useGetDashboardSummary, useListBuildings, useRunComplianceCheck, useSubmitAudit, getGetBuildingQueryKey, getGetDashboardSummaryQueryKey, getListBuildingsQueryKey } from '@workspace/api-client-react';
import type { Building, BuildingDetail, ComplianceInput, ComplianceReport, Gap, AuditInput } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Check, ChevronRight, CircleAlert, ClipboardCheck, Compass, FileCheck2, FileUp, Footprints, Info, Landmark, LayoutDashboard, Loader2, MapPin, Menu, Search, Send, ShieldCheck, Star, X, Volume2, Eye, Contrast, Camera, CameraOff, Navigation } from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/audit', label: 'Architect audit', icon: FileCheck2 },
  { href: '/inspections', label: 'Field inspection', icon: ClipboardCheck },
];

function BrandMark() {
  return <div className="flex items-center gap-3">
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] shadow-sm">
      <Landmark size={22} strokeWidth={2.5} />
      <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[hsl(var(--sidebar))] bg-[#32805e]" />
    </div>
    <div>
      <div className="font-display text-xl font-bold tracking-tight">Sugamya Setu</div>
      <div className="font-data text-[9px] uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.62)]">Access for all</div>
    </div>
  </div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [reading, setReading] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.toggle('color-inverted', inverted);
    return () => {
      document.documentElement.classList.remove('high-contrast', 'color-inverted');
      window.speechSynthesis?.cancel();
    };
  }, [highContrast, inverted]);
  const readPage = () => {
    if (!('speechSynthesis' in window)) return;
    if (reading) {
      window.speechSynthesis.cancel();
      setReading(false);
      return;
    }
    const text = document.querySelector('main')?.textContent?.replace(/\s+/g, ' ').trim();
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 5000));
    utterance.rate = 0.95;
    utterance.onend = () => setReading(false);
    window.speechSynthesis.speak(utterance);
    setReading(true);
  };
  return <div className="civic-shell">
    <aside className="civic-nav desktop-nav bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))]">
      <BrandMark />
      <div className="mt-14 mb-3 px-3 font-data text-[10px] uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.48)]">Workspace</div>
      <nav className="space-y-1" aria-label="Primary navigation">
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`nav-link flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${location === href ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.72)] hover:bg-[hsl(var(--sidebar-accent)/.7)] hover:text-[hsl(var(--sidebar-foreground))]'}`}>
          <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{location === href && <ChevronRight className="ml-auto" size={15} />}
        </Link>)}
      </nav>
      <div className="mt-auto hidden rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.45)] p-4 md:block">
        <div className="mb-3 flex items-center gap-2 text-[hsl(var(--accent))]"><ShieldCheck size={17} /><span className="font-data text-[10px] uppercase tracking-[.13em]">Public record</span></div>
        <p className="text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.68)]">Every status is backed by an audit trail. Last updated records stay visible to everyone.</p>
      </div>
      <div className="mt-5 border-t border-[hsl(var(--sidebar-border))] pt-4 text-[10px] text-[hsl(var(--sidebar-foreground)/.48)]">Ministry of Housing &amp; Urban Affairs<br />India • 2024</div>
    </aside>
    <div className="civic-main">
      <header className="mobile-nav items-center justify-between bg-[hsl(var(--sidebar))] px-4 py-4 text-[hsl(var(--sidebar-foreground))]">
        <BrandMark />
        <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle navigation" data-testid="button-toggle-navigation" className="rounded-lg p-2 hover:bg-[hsl(var(--sidebar-accent))]">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </header>
      {menuOpen && <nav className="mobile-nav flex-col gap-1 bg-[hsl(var(--sidebar))] px-4 pb-4 text-[hsl(var(--sidebar-foreground))]">
        {navItems.map(({ href, label, icon: Icon }) => <Link onClick={() => setMenuOpen(false)} key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[hsl(var(--sidebar-accent))]"><Icon size={18} />{label}</Link>)}
      </nav>}
      <main>{children}</main>
      <div className="accessibility-toolbar" aria-label="Accessibility tools">
        <button type="button" onClick={readPage} aria-pressed={reading} title={reading ? 'Stop reading' : 'Read this page aloud'} data-testid="button-read-aloud"><Volume2 size={16} /><span>{reading ? 'Stop reading' : 'Read aloud'}</span></button>
        <button type="button" onClick={() => setHighContrast((value) => !value)} aria-pressed={highContrast} title="Toggle high contrast" data-testid="button-high-contrast"><Contrast size={16} /><span>Contrast</span></button>
        <button type="button" onClick={() => setInverted((value) => !value)} aria-pressed={inverted} title="Toggle color inversion" data-testid="button-invert-colors"><Eye size={16} /><span>Invert</span></button>
      </div>
    </div>
  </div>;
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: ReactNode; description: string; children?: ReactNode }) {
  return <section className="paper-grid border-b border-[hsl(var(--border))] px-5 py-9 md:px-10 md:py-12">
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="animate-rise"><div className="mb-3 font-data text-[10px] font-medium uppercase tracking-[.2em] text-[hsl(var(--primary))]">{eyebrow}</div><h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-balance md:text-6xl">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))] md:text-base">{description}</p></div>
      {children && <div className="animate-rise stagger-2">{children}</div>}
    </div>
  </section>;
}

function StatusBadge({ status }: { status: Building['status'] }) {
  const labels = { green: 'Compliant', amber: 'Needs attention', red: 'Action required' };
  return <span data-testid={`status-building-${status}`} className="inline-flex items-center gap-2 rounded-full border border-current/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.11em]">
    <span className={`status-dot status-${status}`} />{labels[status]}
  </span>;
}

function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent?: string }) {
  return <div className="relative overflow-hidden rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic">
    <div className={`absolute left-0 top-0 h-1 w-full ${accent ?? 'bg-[hsl(var(--primary))]'}`} /><div className="font-data text-[10px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">{label}</div>
    <div data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`} className="metric-number mt-3 text-4xl font-bold">{value}</div><div className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{note}</div>
  </div>;
}

function LoadingState({ label = 'Loading public records' }: { label?: string }) {
  return <div className="space-y-4" data-testid="state-loading"><div className="skeleton h-20 rounded-xl" /><div className="skeleton h-20 rounded-xl" /><div className="flex items-center gap-2 pt-1 text-xs text-[hsl(var(--muted-foreground))]"><Loader2 size={14} className="animate-spin" />{label}</div></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="rounded-xl border border-[#e3b8b2] bg-[#f9e9e5] p-6 text-[#823b35]" data-testid="state-error"><div className="flex items-center gap-2 font-bold"><CircleAlert size={18} /> Records unavailable</div><p className="mt-2 text-sm">We could not connect to the public register. Please try again.</p><button onClick={onRetry} type="button" data-testid="button-retry" className="mt-4 rounded-lg bg-[#823b35] px-4 py-2 text-xs font-bold text-[#fff8ed] transition-transform hover:-translate-y-0.5">Try again</button></div>;
}

function EmptyState({ query }: { query?: string }) {
  return <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] p-12 text-center" data-testid="state-empty"><Search className="mx-auto text-[hsl(var(--muted-foreground))]" size={28} /><h3 className="mt-4 font-display text-xl font-bold">No buildings found</h3><p className="mx-auto mt-2 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">{query ? `Nothing matched “${query}”. Try a neighbourhood or a different status.` : 'The directory is ready for its first verified record.'}</p></div>;
}

function StarRating({ rating }: { rating: number }) {
  return <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`} data-testid="rating-stars">{[0, 1, 2, 3, 4].map((index) => <Star key={index} size={15} fill={index < Math.round(rating) ? 'currentColor' : 'none'} className={index < Math.round(rating) ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--border))]'} />)}<span className="ml-1 font-data text-xs">{rating.toFixed(1)}</span></div>;
}

function BuildingRow({ building }: { building: Building }) {
  return <Link href={`/buildings/${building.id}`} data-testid={`link-building-${building.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[hsl(var(--border))] px-4 py-4 transition-colors hover:bg-[hsl(var(--secondary)/.5)] md:grid-cols-[1.45fr_1fr_auto_auto]">
    <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-bold group-hover:text-[hsl(var(--primary))]">{building.name}</h3><span className="hidden font-data text-[9px] text-[hsl(var(--muted-foreground))] md:inline">#{building.id}</span></div><p className="mt-1 flex items-center gap-1 truncate text-xs text-[hsl(var(--muted-foreground))]"><MapPin size={12} />{building.address}</p></div>
    <div className="hidden text-xs text-[hsl(var(--muted-foreground))] md:block">{building.builder}</div><StarRating rating={building.rating} /><div className="col-span-2 flex items-center justify-between md:col-span-1"><StatusBadge status={building.status} /><ChevronRight size={17} className="text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1" /></div>
  </Link>;
}

function Dashboard() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'green' | 'amber' | 'red'>('all');
  const params = useMemo(() => ({ ...(query ? { query } : {}), ...(status !== 'all' ? { status } : {}) }), [query, status]);
  const buildingsQuery = useListBuildings(params, { query: { queryKey: getListBuildingsQueryKey(params) } });
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const buildings = buildingsQuery.data ?? [];
  const summary = summaryQuery.data;
  return <div>
    <PageHeader eyebrow="National accessibility register / 01" title={<>A clearer way to<br /><span className="text-[hsl(var(--primary))]">find your way in.</span></>} description="A public record of how India’s public buildings welcome every person. Check before you go, and help us keep the record honest.">
      <Link href="/audit" data-testid="link-start-audit" className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-civic transition-transform hover:-translate-y-0.5">Run a compliance check <ChevronRight size={16} /></Link>
    </PageHeader>
    <div className="mx-auto max-w-[1240px] px-5 py-7 md:px-10 md:py-9">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Buildings mapped" value={summary ? String(summary.buildings) : '—'} note="Across public jurisdictions" />
        <Metric label="Verified recently" value={summary ? String(summary.verified) : '—'} note="Audited and published" accent="bg-[#32805e]" />
        <Metric label="Open gaps" value={summary ? String(summary.openGaps) : '—'} note="Across the directory" accent="bg-[#c28b1b]" />
        <Metric label="Average rating" value={summary ? summary.averageRating.toFixed(1) : '—'} note={summary ? `Updated ${new Date(summary.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Awaiting register'} accent="bg-[hsl(var(--accent))]" />
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0 animate-rise stagger-1">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="font-data text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">Open directory</div><h2 className="mt-1 font-display text-3xl font-bold">Public buildings</h2></div><div className="text-xs text-[hsl(var(--muted-foreground))]">{buildings.length} records in view</div></div>
          <div className="overflow-hidden rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] shadow-civic">
            <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.32)] p-3 md:flex-row"><label className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><input data-testid="input-building-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search building, neighbourhood or builder" className="h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-[hsl(var(--muted-foreground))] focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]" /></label><select data-testid="select-building-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]"><option value="all">All statuses</option><option value="green">Compliant</option><option value="amber">Needs attention</option><option value="red">Action required</option></select></div>
            <div className="hidden grid-cols-[1.45fr_1fr_auto_auto] gap-4 border-b border-[hsl(var(--border))] px-4 py-3 font-data text-[9px] uppercase tracking-[.13em] text-[hsl(var(--muted-foreground))] md:grid"><span>Building</span><span>Builder</span><span>Rating</span><span>Status</span></div>
            {buildingsQuery.isLoading ? <div className="p-4"><LoadingState /></div> : buildingsQuery.isError ? <div className="p-4"><ErrorState onRetry={() => buildingsQuery.refetch()} /></div> : buildings.length ? buildings.map((building) => <BuildingRow key={building.id} building={building} />) : <div className="p-4"><EmptyState query={query} /></div>}
          </div>
        </section>
        <aside className="animate-rise stagger-2">
          <div className="mb-4 flex items-center justify-between"><div><div className="font-data text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">Transparency log</div><h2 className="mt-1 font-display text-2xl font-bold">Recent activity</h2></div><Info size={17} className="text-[hsl(var(--muted-foreground))]" /></div>
          <div className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-4 shadow-civic"><ActivityItem color="green" title="New audit verified" text="Kalyan Mandapam • Bhubaneswar" date="Today, 09:42" /><ActivityItem color="amber" title="Gap reported" text="District Library • Pune" date="Yesterday, 16:18" /><ActivityItem color="teal" title="Record updated" text="Civic Centre • Bengaluru" date="12 Jun, 11:06" /><div className="mt-3 border-t border-[hsl(var(--border))] pt-3"><Link href="/inspections" data-testid="link-view-inspections" className="flex items-center justify-between text-xs font-bold text-[hsl(var(--primary))]">Submit a field report <ChevronRight size={15} /></Link></div></div>
          <div className="mt-5 rounded-xl bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))]"><Compass size={23} className="mb-8 text-[hsl(var(--accent))]" /><h3 className="font-display text-xl font-bold">Already at a building?</h3><p className="mt-2 text-xs leading-5 text-[hsl(var(--primary-foreground)/.7)]">Your first-hand observation can improve someone else’s visit.</p><Link href="/inspections" data-testid="link-report-access" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[hsl(var(--accent))]">Report access <ChevronRight size={14} /></Link></div>
        </aside>
      </div>
    </div>
  </div>;
}

function ActivityItem({ color, title, text, date }: { color: 'green' | 'amber' | 'teal'; title: string; text: string; date: string }) {
  return <div className="flex gap-3 border-b border-[hsl(var(--border))] py-3 last:border-0"><span className={`mt-1 h-2 w-2 flex-none rounded-full ${color === 'green' ? 'bg-[#32805e]' : color === 'amber' ? 'bg-[#c28b1b]' : 'bg-[hsl(var(--primary))]'}`} /><div className="min-w-0"><div className="text-xs font-bold">{title}</div><div className="mt-1 truncate text-[11px] text-[hsl(var(--muted-foreground))]">{text}</div><div className="mt-2 font-data text-[9px] text-[hsl(var(--muted-foreground))]">{date}</div></div></div>;
}

function DetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const buildingQuery = useGetBuilding(id, { query: { enabled: Boolean(id), queryKey: getGetBuildingQueryKey(id) } });
  if (buildingQuery.isLoading) return <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-10"><LoadingState label="Loading building record" /></div>;
  if (buildingQuery.isError || !buildingQuery.data) return <div className="mx-auto max-w-[760px] px-5 py-12 md:px-10"><ErrorState onRetry={() => buildingQuery.refetch()} /></div>;
  return <BuildingDetailPage building={buildingQuery.data} />;
}

function BuildingDetailPage({ building }: { building: BuildingDetail }) {
  const [selectedWayfinding, setSelectedWayfinding] = useState(building.wayfinding[0]?.id);
  const selected = building.wayfinding.find((item) => item.id === selectedWayfinding);
  return <div>
    <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.45)] px-5 py-4 md:px-10"><div className="mx-auto flex max-w-[1240px] items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Link href="/" data-testid="link-back-directory" className="hover:text-[hsl(var(--primary))]">Directory</Link><ChevronRight size={13} /><span className="truncate">{building.name}</span></div></div>
    <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-10 md:py-11">
      <div className="flex flex-col gap-6 border-b border-[hsl(var(--border))] pb-8 md:flex-row md:items-end md:justify-between"><div><div className="font-data text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">Building record / {building.id}</div><h1 data-testid="text-building-name" className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">{building.name}</h1><p className="mt-3 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"><MapPin size={15} />{building.address}</p></div><div className="flex flex-wrap items-center gap-4"><StatusBadge status={building.status} /><StarRating rating={building.rating} /></div></div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6"><section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-6"><div className="flex items-center justify-between"><div><div className="font-data text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">At a glance</div><h2 className="mt-1 font-display text-2xl font-bold">Accessibility features</h2></div><Footprints className="text-[hsl(var(--primary))]" /></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{building.accessibleFeatures.map((feature, index) => <div key={`${feature}-${index}`} data-testid={`feature-${index}`} className="flex items-center gap-3 rounded-lg bg-[hsl(var(--secondary)/.5)] px-3 py-3 text-sm"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dcefe5] text-[#26734e]"><Check size={14} strokeWidth={3} /></span>{feature}</div>)}</div></section>
          <ComplianceReportCard report={building.report} />
          <section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-6"><div className="font-data text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">Independent field report</div><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-display text-2xl font-bold">{building.audit.summary}</h2><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Submitted by {building.audit.auditorName} • {new Date(building.audit.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] ${building.audit.status === 'verified' ? 'status-open' : 'status-limited'}`}>{building.audit.status}</span></div><div className="mt-5 flex items-center gap-3 border-t border-[hsl(var(--border))] pt-4 text-xs text-[hsl(var(--muted-foreground))]"><ShieldCheck size={16} className="text-[#32805e]" />Audit trail is publicly verifiable</div></section>
        </div>
        <div className="space-y-6"><WayfindingPanel building={building} selectedWayfinding={selectedWayfinding} setSelectedWayfinding={setSelectedWayfinding} selected={selected} /><section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))] shadow-civic md:p-6"><div className="flex items-center gap-2 text-[hsl(var(--accent))]"><Landmark size={18} /><span className="font-data text-[10px] uppercase tracking-[.16em]">Record ownership</span></div><div className="mt-5 grid grid-cols-2 gap-5"><div><div className="text-[10px] text-[hsl(var(--primary-foreground)/.6)]">Builder</div><div className="mt-1 text-sm font-bold">{building.builder}</div></div><div><div className="text-[10px] text-[hsl(var(--primary-foreground)/.6)]">Last audited</div><div className="mt-1 text-sm font-bold">{new Date(building.lastAudit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div><div><div className="text-[10px] text-[hsl(var(--primary-foreground)/.6)]">Auditor</div><div className="mt-1 text-sm font-bold">{building.auditor}</div></div><div><div className="text-[10px] text-[hsl(var(--primary-foreground)/.6)]">Coordinates</div><div className="mt-1 font-data text-xs font-bold">{building.coordinates.lat.toFixed(3)}, {building.coordinates.lng.toFixed(3)}</div></div></div></section></div>
      </div>
    </div>
  </div>;
}

function WayfindingPanel({ building, selectedWayfinding, setSelectedWayfinding, selected }: { building: BuildingDetail; selectedWayfinding?: string; setSelectedWayfinding: (id: string) => void; selected?: BuildingDetail['wayfinding'][number] }) {
  const [mode, setMode] = useState<'map' | 'video'>('map');
  return <section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-6"><div className="flex items-center justify-between"><div><div className="font-data text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">Inside the building</div><h2 className="mt-1 font-display text-2xl font-bold">Wayfinding</h2></div><Compass className="text-[hsl(var(--primary))]" /></div><div className="mt-4 flex rounded-lg bg-[hsl(var(--secondary)/.6)] p-1" role="tablist"><button type="button" onClick={() => setMode('map')} aria-selected={mode === 'map'} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${mode === 'map' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}><Navigation size={14} />Floor plan</button><button type="button" onClick={() => setMode('video')} aria-selected={mode === 'video'} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${mode === 'video' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}><Camera size={14} />Assistive view</button></div>{mode === 'map' ? <><div className="relative mt-5 aspect-[1.1] overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[#eef1e5] paper-grid"><div className="absolute left-[12%] top-[12%] h-[23%] w-[31%] border-2 border-[hsl(var(--primary)/.5)] bg-[#fbfaf1]/75" /><div className="absolute right-[10%] top-[16%] h-[40%] w-[25%] border-2 border-[hsl(var(--primary)/.5)] bg-[#fbfaf1]/75" /><div className="absolute bottom-[11%] left-[13%] h-[27%] w-[56%] border-2 border-[hsl(var(--primary)/.5)] bg-[#fbfaf1]/75" /><div className="absolute bottom-[16%] right-[8%] h-10 w-10 rounded-full border-2 border-dashed border-[hsl(var(--primary)/.6)]" />{building.wayfinding.map((item) => <button type="button" key={item.id} onClick={() => setSelectedWayfinding(item.id)} data-testid={`button-wayfinding-${item.id}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#fff9ec] p-1.5 shadow transition-transform hover:scale-110 ${selectedWayfinding === item.id ? 'z-10 scale-125 bg-[hsl(var(--primary))] text-white' : item.status === 'open' ? 'bg-[#32805e] text-white' : item.status === 'limited' ? 'bg-[#c28b1b] text-white' : 'bg-[#b74740] text-white'}`}><MapPin size={13} fill="currentColor" /></button>)}</div>{selected && <div className="mt-4 rounded-lg bg-[hsl(var(--secondary)/.55)] p-4"><div className="flex items-center justify-between"><div className="font-bold text-sm">{selected.label}</div><span className={`status-${selected.status} rounded-full px-2 py-1 text-[9px] font-bold uppercase`}>{selected.status}</span></div><div className="mt-1 font-data text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{selected.type}</div><p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{selected.note}</p></div>}</> : <AssistiveView building={building} />}</section>;
}

function AssistiveView({ building }: { building: BuildingDetail }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('Ready to guide you through the accessible route.');
  const speak = (text: string) => {
    setMessage(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };
  const toggleCamera = async () => {
    if (active) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setActive(false);
      speak('Assistive camera paused.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setActive(true);
        speak('Camera active. Proceed five metres straight. Accessible ramp ahead to your left.');
      }
    } catch {
      speak('Camera access is unavailable. Showing simulated guidance instead.');
    }
  };
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  return <div className="mt-5"><div className="relative aspect-[1.1] overflow-hidden rounded-lg bg-[#142a2b]"><video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${active ? 'opacity-100' : 'opacity-0'}`} /><div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#224546] via-[#183536] to-[#0e2223]"><div className="text-center text-white/75"><Camera size={32} className="mx-auto mb-3 text-[hsl(var(--accent))]" /><p className="font-data text-[9px] uppercase tracking-[.18em]">{active ? 'Live camera feed' : 'Simulated assistive AR view'}</p><p className="mt-2 text-xs text-white/55">Guidance is based on the published wayfinding record.</p></div></div>{active && <div className="absolute inset-x-4 top-4 rounded-lg border border-[hsl(var(--accent)/.65)] bg-black/45 px-3 py-2 text-xs font-bold text-white">Ramp ahead · 5 m · left</div>}<div className="absolute inset-x-4 bottom-4 flex items-center justify-between"><span className="rounded-full bg-black/45 px-3 py-2 text-[10px] font-bold text-white"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#72d19a]" />{active ? 'Guidance live' : 'Preview mode'}</span><button type="button" onClick={toggleCamera} data-testid="button-toggle-camera" className="flex items-center gap-2 rounded-lg bg-[hsl(var(--accent))] px-3 py-2 text-xs font-bold text-[hsl(var(--foreground))]">{active ? <CameraOff size={14} /> : <Camera size={14} />}{active ? 'Stop camera' : 'Start camera'}</button></div></div><div className="mt-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.55)] p-4"><div className="flex items-start gap-3"><Volume2 size={17} className="mt-0.5 flex-none text-[hsl(var(--primary))]" /><div><div className="text-xs font-bold">Live announcement</div><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{message}</p></div></div><button type="button" onClick={() => speak(`Proceed to the ${building.wayfinding[0]?.label ?? 'accessible entrance'}. ${building.wayfinding[0]?.note ?? ''}`)} data-testid="button-announce-route" className="mt-4 flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))]">Announce next checkpoint <Volume2 size={14} /></button></div></div>;
}

function ComplianceReportCard({ report }: { report: ComplianceReport }) {
  return <section className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><div className="flex h-24 w-24 flex-none flex-col items-center justify-center rounded-full border-[10px] border-[#32805e]/20 border-t-[#32805e]"><span data-testid="text-compliance-score" className="font-data text-2xl font-bold">{report.score}</span><span className="text-[9px] uppercase text-[hsl(var(--muted-foreground))]">score</span></div><div><div className="font-data text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">Compliance report</div><h2 className="mt-1 font-display text-2xl font-bold">{report.rating.toFixed(1)} / 5.0 · {report.gaps.length ? 'A few things to fix' : 'Ready for everyone'}</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{report.summary}</p><p className="mt-2 font-data text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Checked {new Date(report.checkedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div></div>{report.gaps.length > 0 && <div className="mt-6 border-t border-[hsl(var(--border))] pt-4"><div className="mb-2 text-xs font-bold">Open recommendations</div>{report.gaps.map((gap) => <GapRow gap={gap} key={gap.id} />)}</div>}</section>;
}

function GapRow({ gap }: { gap: Gap }) {
  return <div className="flex gap-3 border-t border-[hsl(var(--border))] py-3"><span className={`mt-1 h-2 w-2 flex-none rounded-full ${gap.severity === 'critical' ? 'bg-[#b74740]' : gap.severity === 'moderate' ? 'bg-[#c28b1b]' : 'bg-[hsl(var(--primary))]'}`} /><div><div className="text-xs font-bold">{gap.title}</div><div className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{gap.recommendation}</div><div className="mt-1 font-data text-[9px] uppercase text-[hsl(var(--muted-foreground))]">{gap.reference} • {gap.severity}</div></div></div>;
}

function AuditPage() {
  const compliance = useRunComplianceCheck();
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [form, setForm] = useState({ builderName: '', buildingName: '', rampSlope: '8.33', doorWidth: '900', liftAvailable: true, accessibleRestrooms: true, tactilePath: false, blueprintName: '' });
  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); const data: ComplianceInput = { builderName: form.builderName, buildingName: form.buildingName, rampSlope: Number(form.rampSlope), doorWidth: Number(form.doorWidth), liftAvailable: form.liftAvailable, accessibleRestrooms: form.accessibleRestrooms, tactilePath: form.tactilePath, ...(form.blueprintName ? { blueprintName: form.blueprintName } : {}) }; compliance.mutate({ data }, { onSuccess: setReport }); };
  return <div><PageHeader eyebrow="Architect workspace / 02" title={<>Test the plan<br /><span className="text-[hsl(var(--primary))]">before the build.</span></>} description="Upload a blueprint reference and check key access dimensions against the public accessibility ruleset. This is a quick first pass, not a substitute for a site audit." /><div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-8 md:px-10 lg:grid-cols-[1fr_380px]">
    <form onSubmit={submit} className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-7"><div className="mb-7 flex items-center gap-3 border-b border-[hsl(var(--border))] pb-5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><FileCheck2 size={18} /></div><div><h2 className="font-display text-2xl font-bold">Structural inputs</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">All fields are checked securely in one pass.</p></div></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Builder / organisation" value={form.builderName} onChange={(v) => update('builderName', v)} placeholder="e.g. CPWD regional office" testId="input-builder-name" required /><Field label="Building name" value={form.buildingName} onChange={(v) => update('buildingName', v)} placeholder="e.g. Ward office, Sector 12" testId="input-building-name" required /><Field label="Ramp slope" suffix="%" type="number" value={form.rampSlope} onChange={(v) => update('rampSlope', v)} testId="input-ramp-slope" required /><Field label="Clear door width" suffix="mm" type="number" value={form.doorWidth} onChange={(v) => update('doorWidth', v)} testId="input-door-width" required /></div><div className="mt-6"><label htmlFor="blueprint" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--primary)/.45)] bg-[hsl(var(--secondary)/.32)] p-5 text-center transition-colors hover:bg-[hsl(var(--secondary))]"><FileUp size={22} className="text-[hsl(var(--primary))]" /><span className="mt-2 text-xs font-bold">{form.blueprintName || 'Attach blueprint reference'}</span><span className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">PDF, DWG or image • optional for this check</span><input id="blueprint" type="file" className="sr-only" data-testid="input-blueprint" onChange={(event) => update('blueprintName', event.target.files?.[0]?.name ?? '')} /></label></div><div className="mt-7 space-y-3 border-t border-[hsl(var(--border))] pt-6"><Toggle label="Lift available and operational" checked={form.liftAvailable} onChange={(v) => update('liftAvailable', v)} testId="toggle-lift" /><Toggle label="Accessible restroom on every public floor" checked={form.accessibleRestrooms} onChange={(v) => update('accessibleRestrooms', v)} testId="toggle-restrooms" /><Toggle label="Continuous tactile guidance path" checked={form.tactilePath} onChange={(v) => update('tactilePath', v)} testId="toggle-tactile" /></div><button disabled={compliance.isPending} type="submit" data-testid="button-run-compliance" className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70">{compliance.isPending ? <><Loader2 size={16} className="animate-spin" />Checking dimensions…</> : <><ShieldCheck size={16} />Run compliance check</>}</button>{compliance.isError && <p data-testid="text-compliance-error" className="mt-3 text-center text-xs text-[#a53f3a]">The checker could not complete. Please review your inputs and try again.</p>}</form>
    <div className="lg:pt-1">{report ? <div className="animate-rise"><div className="mb-3 font-data text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">Result / just now</div><ComplianceReportCard report={report} /><button type="button" onClick={() => setReport(null)} data-testid="button-new-compliance" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-xs font-bold hover:bg-[hsl(var(--secondary))]"><ClipboardCheck size={15} />Check another plan</button></div> : <InfoPanel title="What this checks" icon={<ShieldCheck size={20} />} items={['Ramp slope at or below 1:12', 'Clear door width for mobility devices', 'Vertical access via lift', 'Restroom and tactile path provision']} />}</div>
  </div></div>;
}

function Field({ label, value, onChange, placeholder, suffix, type = 'text', required, testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; suffix?: string; type?: string; required?: boolean; testId: string }) {
  return <label className="block text-xs font-bold">{label}{required && <span className="ml-1 text-[#b74740]">*</span>}<div className="relative mt-2"><input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} data-testid={testId} className="h-11 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm font-medium outline-none placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]" />{suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 font-data text-[10px] text-[hsl(var(--muted-foreground))]">{suffix}</span>}</div></label>;
}

function Toggle({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: (value: boolean) => void; testId: string }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold"><span>{label}</span><button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} data-testid={testId} className={`relative h-6 w-11 flex-none rounded-full transition-colors ${checked ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted-foreground)/.35)]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-[hsl(var(--card))] shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} /></button></label>;
}

function InfoPanel({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return <div className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-civic"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">{icon}</div><h2 className="mt-5 font-display text-2xl font-bold">{title}</h2><ul className="mt-5 space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm text-[hsl(var(--muted-foreground))]"><Check size={16} className="mt-0.5 flex-none text-[#32805e]" />{item}</li>)}</ul><div className="mt-7 border-t border-[hsl(var(--border))] pt-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]">The check follows the Harmonised Guidelines and Space Standards for Barrier-Free Built Environment.</div></div>;
}

function InspectionsPage() {
  const buildingsQuery = useListBuildings(undefined, { query: { queryKey: getListBuildingsQueryKey(undefined) } });
  const submitAudit = useSubmitAudit();
  const [form, setForm] = useState<AuditInput>({ buildingId: '', auditorName: '', summary: '' });
  const [submitted, setSubmitted] = useState(false);
  const update = (key: keyof AuditInput, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); submitAudit.mutate({ data: form }, { onSuccess: () => setSubmitted(true) }); };
  if (submitted) return <div className="mx-auto max-w-[720px] px-5 py-16 md:px-10"><div className="animate-rise rounded-2xl border border-[#b9d6c3] bg-[#edf7ef] p-8 text-center shadow-civic"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#32805e] text-white"><Check size={27} /></div><div className="mt-5 font-data text-[10px] uppercase tracking-[.18em] text-[#26734e]">Report received</div><h1 className="mt-2 font-display text-4xl font-bold text-[#173b2c]">Thank you for making access visible.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#426b55]">Your field note has been added to the review queue. Verified observations help people plan their visit with confidence.</p><button type="button" onClick={() => { setSubmitted(false); setForm({ buildingId: '', auditorName: '', summary: '' }); }} data-testid="button-submit-another-audit" className="mt-7 rounded-lg bg-[#26734e] px-5 py-3 text-sm font-bold text-white">Submit another report</button></div></div>;
  return <div><PageHeader eyebrow="Field workspace / 03" title={<>You were there.<br /><span className="text-[hsl(var(--primary))]">Tell us what you saw.</span></>} description="A two-minute field report can make the public record more useful. Share what worked, what did not, and what someone should know before arriving." /><div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-8 md:px-10 lg:grid-cols-[1fr_380px]"><form onSubmit={submit} className="rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 shadow-civic md:p-7"><div className="mb-7 border-b border-[hsl(var(--border))] pb-5"><div className="font-data text-[10px] uppercase tracking-[.16em] text-[hsl(var(--primary))]">New observation</div><h2 className="mt-1 font-display text-2xl font-bold">Field inspection report</h2></div><label className="block text-xs font-bold">Building<span className="ml-1 text-[#b74740]">*</span><select required value={form.buildingId} onChange={(event) => update('buildingId', event.target.value)} data-testid="select-audit-building" className="mt-2 h-11 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]"><option value="">Select the building you visited</option>{buildingsQuery.data?.map((building) => <option key={building.id} value={building.id}>{building.name} — {building.address}</option>)}</select></label><div className="mt-5"><Field label="Your name or organisation" value={form.auditorName} onChange={(value) => update('auditorName', value)} placeholder="e.g. Asha Rao, Access Now" testId="input-auditor-name" required /></div><label className="mt-5 block text-xs font-bold">What did you observe?<span className="ml-1 text-[#b74740]">*</span><textarea required minLength={1} value={form.summary} onChange={(event) => update('summary', event.target.value)} data-testid="textarea-audit-summary" placeholder="Describe the entrance, routes, facilities or barriers you encountered…" className="mt-2 min-h-36 w-full resize-y rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] p-3 text-sm leading-6 outline-none placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:ring-2 focus:ring-[hsl(var(--ring)/.3)]" /></label>{submitAudit.isError && <p data-testid="text-audit-error" className="mt-3 text-xs text-[#a53f3a]">This report could not be submitted. Please try again.</p>}<button disabled={submitAudit.isPending} type="submit" data-testid="button-submit-audit" className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 disabled:opacity-70">{submitAudit.isPending ? <><Loader2 size={16} className="animate-spin" />Submitting report…</> : <><Send size={16} />Publish field report</>}</button></form><div><InfoPanel title="A useful note is specific" icon={<Footprints size={20} />} items={['Mention the entrance you used', 'Name a route or facility clearly', 'Say what would help next time', 'Keep people, not just buildings, in mind']} /></div></div></div>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Dashboard} /><Route path="/buildings/:id" component={DetailPage} /><Route path="/audit" component={AuditPage} /><Route path="/inspections" component={InspectionsPage} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell><Router /></Shell></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;