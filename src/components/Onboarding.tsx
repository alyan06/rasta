import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GraduationCap, ShieldCheck } from '@phosphor-icons/react';
import ThemeToggle from './ThemeToggle';
import type { Profile } from '../types';
import type { Theme } from '../hooks/useTheme';

interface Props { profile: Profile; onComplete: (profile: Profile) => void; onExplore: () => void; onSignIn: () => void; theme: Theme; setTheme: (theme: Theme) => void; signedIn?: boolean }
const questions = ['What should we call you?', 'Did you study Matric or O Levels?', 'What are you studying next?', 'Have you received your final result?'];
export default function Onboarding({ profile, onComplete, onExplore, onSignIn, theme, setTheme, signedIn }: Props) {
  const [step, setStep] = useState(-1);
  const [name, setName] = useState(profile.isDemo ? '' : profile.name);
  const [secondary, setSecondary] = useState<'matric' | 'olevel'>(profile.secondary ?? 'matric');
  const [higher, setHigher] = useState<'fsc' | 'alevel'>(profile.higherSecondary ?? 'fsc');
  const [stage, setStage] = useState<'completed' | 'awaiting'>('awaiting');
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  const question = step === 3 ? `Have you received your ${higher === 'alevel' ? 'A Level' : 'FSc'} result?` : questions[step];
  function finish(result: 'completed' | 'awaiting') {
    onComplete({ ...profile, name: name.trim(), city: profile.isDemo ? '' : profile.city, secondary, higherSecondary: higher, curriculum: higher === 'alevel' ? 'alevel' : 'fsc', stage: result, isDemo: false, onboardingCompleted: true, ssc: profile.isDemo ? '' : profile.ssc, hssc: profile.isDemo ? '' : profile.hssc, predictedHssc: '', oLevels: profile.isDemo ? [] : profile.oLevels, aLevels: profile.isDemo ? [] : profile.aLevels, activityEntries: profile.isDemo ? [] : profile.activityEntries, activities: profile.isDemo ? '' : profile.activities, net: profile.isDemo ? '' : profile.net, nu: profile.isDemo ? '' : profile.nu, sat: profile.isDemo ? '' : profile.sat, budget: profile.isDemo ? '' : profile.budget, familyIncome: profile.isDemo ? '' : profile.familyIncome });
  }
  return <div className="onboarding-shell">
    <header className="onboarding-header"><a href="#dashboard" className="wordmark" onClick={e => e.preventDefault()}><img src="/favicon.svg" alt=""/><span>rasta<span className="brand-period">.</span></span></a><ThemeToggle theme={theme} setTheme={setTheme} /></header>
    <main className="onboarding-main">
      <div className="onboarding-symbol"><GraduationCap size={36} weight="duotone"/></div>
      {step === -1 ? <section className="welcome-step"><span className="onboarding-eyebrow">Made for students in Pakistan</span><h1 ref={heading} tabIndex={-1}>Your university journey<br/>starts here.</h1><p>Find universities, understand your chances, and make a plan. Start with a few simple questions.</p><button className="button onboarding-primary" onClick={() => setStep(0)}>Set up my profile <ArrowRight size={20}/></button>{!signedIn && <button className="button secondary google-button" onClick={onSignIn}><span className="google-letter" aria-hidden="true">G</span> Sign in with Google</button>}<button className="text-button explore-sample" onClick={onExplore}>Explore a sample profile first <ArrowUpRightSmall/></button><span className="onboarding-privacy"><ShieldCheck size={16}/>Your grades and story stay yours.</span></section> : <section className="onboarding-step" key={step}>
        <div className="onboarding-progress"><span>Question {step + 1} of 4</span><div>{questions.map((_, index) => <i key={index} className={index <= step ? 'done' : ''}/>)}</div></div>
        <h1 ref={heading} tabIndex={-1} className="animated-question" aria-label={question}><span aria-hidden="true">{question?.split('').map((letter, index) => <span className="question-letter" key={index} style={{ '--letter-delay': `${Math.min(index * 12, 420)}ms` } as React.CSSProperties}>{letter}</span>)}</span></h1>
        {step === 0 && <form className="onboarding-options" onSubmit={e => { e.preventDefault(); if (!name.trim()) { setError('Please enter your name.'); return; } setError(''); setStep(1); }}><label className="field"><span>Your name</span><input autoComplete="given-name" maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ayesha" aria-invalid={!!error}/></label>{error && <p className="field-error" role="alert">{error}</p>}<button className="button onboarding-primary" type="submit">Continue <ArrowRight size={19}/></button></form>}
        {step === 1 && <div className="onboarding-options choice-options">{([{ value:'matric', title:'Matric', detail:'SSC · Board exams' },{ value:'olevel', title:'O Levels', detail:'Cambridge / Edexcel' }] as const).map(option => <button className="onboarding-choice" key={option.value} onClick={() => { setSecondary(option.value); setHigher(option.value === 'matric' ? 'fsc' : 'alevel'); setStep(2); }}><span><strong>{option.title}</strong><small>{option.detail}</small></span><ArrowRight size={20}/></button>)}</div>}
        {step === 2 && <div className="onboarding-options choice-options">{([{ value:'fsc', title:'FSc / Intermediate', detail:'FSc, ICS, FA or ICom' },{ value:'alevel', title:'A Levels', detail:'Cambridge / Edexcel' }] as const).map(option => <button className="onboarding-choice" key={option.value} onClick={() => { setHigher(option.value); setStep(3); }}><span><strong>{option.title}</strong><small>{option.detail}</small></span><ArrowRight size={20}/></button>)}</div>}
        {step === 3 && <><p className="onboarding-question-help">If you’re still waiting, you can enter your predicted grades.</p><div className="onboarding-options choice-options"><button className="onboarding-choice" onClick={() => { setStage('completed'); setStep(4); }}><span><strong>Yes, I have my results</strong><small>Use my received grades</small></span><Check size={20}/></button><button className="onboarding-choice" onClick={() => { setStage('awaiting'); setStep(4); }}><span><strong>Not yet</strong><small>Use my predicted grades</small></span><ArrowRight size={20}/></button></div></>}
        {step === 4 && <div className="onboarding-review"><h2>You’re all set, {name.trim().split(' ')[0]}.</h2><p>{secondary === 'olevel' ? 'O Levels' : 'Matric'} → {higher === 'alevel' ? 'A Levels' : 'FSc / Intermediate'} · {stage === 'completed' ? 'Results received' : 'Predicted results'}</p><button className="button onboarding-primary" onClick={() => finish(stage)}>Add my grades <ArrowRight size={20}/></button></div>}
        <button className="text-button onboarding-back" onClick={() => setStep(s => s - 1)}><ArrowLeft size={17}/> Back</button>
      </section>}
    </main><footer className="onboarding-footer"><span>Free tools. A clearer path.</span><span>راستہ · Find your way</span></footer>
  </div>;
}
function ArrowUpRightSmall(){return <ArrowRight size={15}/>}
