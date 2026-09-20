import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Buildings, ChartLineUp, Checks, Compass, House, List, NotePencil, ShieldCheck, Sparkle, UserCircle, X } from '@phosphor-icons/react';
import type { Page } from '../types';
import { navigation, type NavigationId } from '../lib/navigation';
import { catalogueCoverage } from '../lib/catalogue';

type Placement = 'bottom' | 'top' | 'right' | 'left';
interface Step {
  id: string;
  title: string;
  body: ReactNode;
  icon: ReactNode;
  /** Page to open before this step; the target is only looked for once it is showing. */
  page?: Page;
  /** `data-tour` attribute of the element to spotlight; without one the card sits in the middle. */
  target?: string;
  placement?: Placement;
  /** Which menu section the step lives in, for the "where to find it" line. */
  nav?: NavigationId;
  where?: string;
}
interface Props {
  page: Page;
  mobile: boolean;
  firstName: string;
  /** Empty when a guest replays the tour; the copy then avoids claiming an account. */
  email: string;
  /** University opened for the "check my chances" step. */
  universityId: string;
  navigate: (page: Page) => void;
  onClose: (reason: 'finished' | 'skipped') => void;
}
interface Box { top: number; left: number; width: number; height: number }

const PAD = 8;
const GAP = 14;
const MARGIN = 16;

function buildSteps({ mobile, firstName, email, universityId }: Omit<Props, 'page' | 'navigate' | 'onClose'>): Step[] {
  const sections = (
    <ul className="tour-sections" aria-label="Sections of the menu">
      {navigation.map(({ id, label, icon: Icon }) => <li key={id}><Icon size={17} /> {label}</li>)}
    </ul>
  );
  return [
    {
      id: 'welcome',
      icon: <Sparkle size={22} weight="duotone" />,
      title: firstName ? `Welcome to Rasta, ${firstName}.` : 'Welcome to Rasta.',
      body: <>
        <p>{email ? 'Your progress now saves to your Google account, so you can pick up on any phone or laptop.' : 'Everything here is free. Sign in with Google whenever you want your progress to follow you to another device.'}</p>
        <p>Here is a two-minute tour of where everything lives. Skip it whenever you like; you can replay it from <strong>How to apply</strong>.</p>
      </>,
    },
    {
      id: 'menu',
      icon: mobile ? <List size={22} /> : <House size={22} />,
      title: 'Everything lives in the menu.',
      body: mobile
        ? <><p>Tap the <strong>☰</strong> button at the top left to open it. Seven sections, in the order you will use them:</p>{sections}</>
        : <p>Seven sections, in the order you will use them. The one you are in is highlighted, and <strong>Your data</strong> at the bottom exports a backup.</p>,
      page: 'dashboard',
      target: mobile ? 'menu-button' : 'menu',
      placement: mobile ? 'bottom' : 'right',
    },
    {
      id: 'dashboard',
      icon: <House size={22} />,
      title: 'Dashboard: your progress at a glance.',
      body: <p>Three steps to tick off: build your profile, find universities, prepare applications. Underneath sit your NET target, your wishlist and a suggested next step.</p>,
      page: 'dashboard',
      target: 'journey',
      nav: 'dashboard',
    },
    {
      id: 'profile',
      icon: <UserCircle size={22} />,
      title: 'My profile: grades, tests and activities.',
      body: <>
        <p>Add your Matric or O Level results and your FSc or A Level results (predicted grades are fine), the test scores you actually have, and up to 10 activities.</p>
        <p>Press <strong>Add grades</strong>, fill in, <strong>Done</strong>. Every chance and plan on Rasta reads from this page.</p>
      </>,
      page: 'profile',
      target: 'grades',
      nav: 'profile',
    },
    {
      id: 'universities',
      icon: <Buildings size={22} />,
      title: `Universities: ${(catalogueCoverage.Pakistan + catalogueCoverage.USA).toLocaleString()} to explore.`,
      body: <p>Every HEC-recognised university in Pakistan ({catalogueCoverage.Pakistan}) and every four-year US university ({catalogueCoverage.USA.toLocaleString()}). Search by name or city, filter by SAT policy and scholarships, and tap the bookmark to add one to your wishlist. Tap a card to open it.</p>,
      page: 'universities',
      target: 'explore',
      nav: 'universities',
    },
    {
      id: 'chances',
      icon: <Sparkle size={22} />,
      title: 'Check my chances, with the working shown.',
      body: <p>A university page shows its acceptance rate, SAT range, costs and scholarships. <strong>Check my chances</strong> then gives an honest estimate from your profile: how the number was reached, and what would move it.</p>,
      page: `university/${universityId}`,
      target: 'chances',
      nav: 'universities',
      where: 'Universities → open any university',
    },
    {
      id: 'planner',
      icon: <ChartLineUp size={22} />,
      title: 'Score planner: work backwards from a target.',
      body: <p>Pick NUST NET, the FAST NU test or the SAT, move the score and watch your aggregate change. Choose a wishlist university to see the benchmark you are aiming at.</p>,
      page: 'planner',
      target: 'planner',
      nav: 'planner',
    },
    {
      id: 'essays',
      icon: <NotePencil size={22} />,
      title: 'Essay studio: your story, your voice.',
      body: <p>Start a draft, set a word target and use <strong>Find your story</strong> to shape an outline. <strong>Polish with AI</strong> tidies grammar and flow without changing what you said; you choose <strong>Keep</strong> or <strong>Revert</strong>. Activities on your profile get the same <strong>Improve with AI</strong> button.</p>,
      page: 'essays',
      target: 'essays',
      nav: 'essays',
    },
    {
      id: 'applications',
      icon: <Checks size={22} />,
      title: 'My applications: deadlines and checklists.',
      body: <p>Add each university you are applying to, set its deadline and tick off the steps as you go. On a university page, <strong>Create my checklist</strong> does this for you.</p>,
      page: 'applications',
      target: 'applications',
      nav: 'applications',
    },
    {
      id: 'guide',
      icon: <Compass size={22} />,
      title: 'How to apply, step by step.',
      body: <p>The route for universities in Pakistan and for the US, IBCC equivalence explained, official links, and where to find free help and financial aid. The tour lives here too.</p>,
      page: 'guide',
      target: 'guide',
      nav: 'guide',
    },
    {
      id: 'account',
      icon: <ShieldCheck size={22} />,
      title: 'Your account and your data.',
      body: <>
        <p>{email ? <>Signed in as <strong>{email}</strong>. Everything you change saves to your Google account automatically.</> : <><strong>Sign in</strong> with Google to keep your progress with your account instead of only this browser.</>} The switch next to it changes between light and dark.</p>
        <p><strong>Your data</strong> in the menu exports a backup file or clears your workspace.{email ? ' Sign out on a shared device.' : ''}</p>
      </>,
      target: 'account',
      placement: 'bottom',
      where: 'Top right of every page',
    },
    {
      id: 'done',
      icon: <Sparkle size={22} weight="duotone" />,
      title: 'That is the tour.',
      body: <p>Start by adding your grades. Every chance and plan gets sharper with each detail you add.</p>,
    },
  ];
}

export default function Tour({ page, mobile, firstName, email, universityId, navigate, onClose }: Props) {
  const steps = useMemo(() => buildSteps({ mobile, firstName, email, universityId }), [mobile, firstName, email, universityId]);
  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];
  const last = index === steps.length - 1;
  const [target, setTarget] = useState<Element | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; placement: Placement; caret: number } | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // Where to return on skip: the page showing while the welcome step is open (it never navigates itself).
  const startPage = useRef(page);
  useEffect(() => {
    if (index === 0) startPage.current = page;
  }, [index, page]);
  const close = useRef(onClose);
  close.current = onClose;

  // Open the step's page first; the target is looked for only once that page is showing.
  const currentPage = useRef(page);
  currentPage.current = page;
  const go = useRef(navigate);
  go.current = navigate;
  useEffect(() => {
    if (step.page && step.page !== currentPage.current) go.current(step.page);
  }, [index, step.page]);

  useEffect(() => {
    if (step.page && step.page !== page) return;
    let frame = 0;
    const started = performance.now();
    const look = () => {
      const element = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      if (element) {
        element.scrollIntoView({ block: mobile ? 'start' : 'center', inline: 'nearest', behavior: 'instant' });
        if (mobile) window.scrollBy({ top: -72, behavior: 'instant' });
        setTarget(element);
        heading.current?.focus({ preventScroll: true });
      } else if (step.target && performance.now() - started < 1500) frame = requestAnimationFrame(look);
      else {
        setTarget(null);
        heading.current?.focus({ preventScroll: true });
      }
    };
    look();
    return () => cancelAnimationFrame(frame);
  }, [index, step.page, step.target, page, mobile]);

  // Keep the spotlight on the element through scrolling, resizing and layout changes.
  useLayoutEffect(() => {
    if (!target) { setBox(null); return; }
    const measure = () => {
      // A page swap detaches the old element; hold the last box until the next target is found.
      if (!target.isConnected) return;
      const rect = target.getBoundingClientRect();
      setBox({ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 });
    };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(target);
    observer?.observe(document.body);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [target]);

  // Place the card beside the spotlight on wide screens; on phones it is a bottom sheet.
  useLayoutEffect(() => {
    if (!box || mobile || !card.current) { setPosition(null); return; }
    const { width: cw, height: ch } = card.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const fits: Record<Placement, boolean> = {
      bottom: box.top + box.height + GAP + ch <= vh - MARGIN,
      top: box.top - GAP - ch >= MARGIN,
      right: box.left + box.width + GAP + cw <= vw - MARGIN,
      left: box.left - GAP - cw >= MARGIN,
    };
    const order: Placement[] = [step.placement ?? 'bottom', 'bottom', 'top', 'right', 'left'];
    const fitted = order.find(option => fits[option]);
    const placement = fitted ?? 'bottom';
    // A tall target on a short screen: bring it to the top so the card has room underneath.
    // The scroll event re-measures the box, which runs this again with the new geometry.
    if (!fitted && box.top > MARGIN + 24) window.scrollBy({ top: box.top - MARGIN - 24, behavior: 'instant' });
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
    const centerX = box.left + box.width / 2, centerY = box.top + box.height / 2;
    let top: number, left: number;
    if (placement === 'bottom' || placement === 'top') {
      top = placement === 'bottom' ? box.top + box.height + GAP : box.top - GAP - ch;
      left = clamp(centerX - cw / 2, MARGIN, vw - MARGIN - cw);
      top = clamp(top, MARGIN, vh - MARGIN - ch);
    } else {
      left = placement === 'right' ? box.left + box.width + GAP : box.left - GAP - cw;
      top = clamp(centerY - ch / 2, MARGIN, vh - MARGIN - ch);
    }
    const caret = placement === 'bottom' || placement === 'top' ? clamp(centerX - left, 22, cw - 22) : clamp(centerY - top, 22, ch - 22);
    setPosition(previous => previous && previous.top === top && previous.left === left && previous.placement === placement && previous.caret === caret ? previous : { top, left, placement, caret });
  }, [box, mobile, step.placement, index]);

  const finish = (reason: 'finished' | 'skipped', destination?: Page) => {
    const next = destination ?? startPage.current;
    close.current(reason);
    if (next !== page) navigate(next);
  };
  const back = () => setIndex(value => Math.max(0, value - 1));
  const forward = () => (last ? finish('finished', 'profile') : setIndex(value => value + 1));

  // Keys are handled at document level: a click on the dimmed backdrop can leave focus on <body>.
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); finish('skipped'); return; }
    if (event.key === 'ArrowRight' && !last) { event.preventDefault(); forward(); return; }
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); back(); return; }
    if (event.key !== 'Tab' || !card.current) return;
    const items = Array.from(card.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]'));
    if (!items.length) return;
    const first = items[0], end = items[items.length - 1];
    const inside = card.current.contains(document.activeElement);
    if (event.shiftKey && (!inside || document.activeElement === first || document.activeElement === heading.current)) { event.preventDefault(); end.focus(); }
    else if (!event.shiftKey && (!inside || document.activeElement === end)) { event.preventDefault(); first.focus(); }
  };
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keys.current(event);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);

  const section = step.nav ? navigation.find(item => item.id === step.nav) : undefined;
  const where = step.where ?? (section ? section.label : undefined);
  const WhereIcon = section?.icon ?? ShieldCheck;
  const anchored = Boolean(box) && !mobile;
  const style = anchored ? (position ? { top: position.top, left: position.left, '--caret': `${position.caret}px` } as React.CSSProperties : { visibility: 'hidden' as const }) : undefined;

  return (
    <div className="tour-root" data-step={step.id} onClick={event => { if (!card.current?.contains(event.target as Node)) heading.current?.focus({ preventScroll: true }); }}>
      {box ? <div className="tour-hole" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} aria-hidden="true" /> : <div className="tour-backdrop" aria-hidden="true" />}
      <div className={`tour-layer ${anchored ? 'anchored' : 'centered'} ${mobile ? 'sheet' : ''}`}>
        <div
          ref={card}
          className={`tour-card ${anchored ? 'anchored' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          data-placement={anchored && position ? position.placement : undefined}
          style={style}
        >
          {anchored && position && <span className="tour-caret" aria-hidden="true" />}
          <div className="tour-top">
            <span className="tour-count">Step {index + 1} of {steps.length}</span>
            <button type="button" className="tour-skip" onClick={() => finish('skipped')} aria-label="Close the tour"><X size={18} /></button>
          </div>
          <div className="tour-progress" aria-hidden="true"><i style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
          <div className="tour-content" key={index}>
            <div className="tour-heading">
              <span className="tour-icon">{step.icon}</span>
              <h2 id="tour-title" ref={heading} tabIndex={-1}>{step.title}</h2>
            </div>
            <div className="tour-body">{step.body}</div>
            {where && (
              <p className="tour-where">
                <WhereIcon size={15} />
                <span>{section ? <><strong>{mobile ? '☰ Menu' : 'Menu'}</strong> → {where}</> : <><strong>Where:</strong> {where}</>}</span>
              </p>
            )}
          </div>
          <div className="tour-actions">
            {index === 0 ? (
              <>
                <button type="button" className="button secondary" onClick={() => finish('skipped')}>Skip the tour</button>
                <button type="button" className="button" onClick={forward}>Show me around <ArrowRight size={17} /></button>
              </>
            ) : last ? (
              <>
                <button type="button" className="button secondary" onClick={() => finish('finished')}>Done</button>
                <button type="button" className="button" onClick={forward}>Add my grades <ArrowRight size={17} /></button>
              </>
            ) : (
              <>
                <button type="button" className="button secondary" onClick={back}><ArrowLeft size={16} /> Back</button>
                <button type="button" className="button" onClick={forward}>Next <ArrowRight size={17} /></button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
