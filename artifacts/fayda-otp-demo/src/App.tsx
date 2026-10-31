import { type FormEvent, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHealthCheck, useStartMockChallenge, useVerifyMockChallenge } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleHelp, Fingerprint, LockKeyhole, RotateCcw, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
type Challenge = { challengeId: string; maskedPhone: string; expiresInSeconds: number; demoOtp: string };
type Verified = { displayName: string; provider: string };

function Home() {
  const [idNumber, setIdNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [verified, setVerified] = useState<Verified | null>(null);
  const [formError, setFormError] = useState('');
  const health = useHealthCheck();
  const startChallenge = useStartMockChallenge();
  const verifyChallenge = useVerifyMockChallenge();
  const stage = verified ? 'complete' : challenge ? 'code' : 'identity';

  function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const safeId = idNumber.trim().toUpperCase();
    if (!/^DEMO-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(safeId)) {
      setFormError('Use a fictional demo ID in the format DEMO-4821-7390.');
      return;
    }
    startChallenge.mutate({ data: { idNumber: safeId } }, {
      onSuccess: (result) => {
        setChallenge({
          challengeId: result.challengeId,
          maskedPhone: result.maskedPhone,
          expiresInSeconds: result.expiresInSeconds,
          demoOtp: result.demoOtp,
        });
        setOtp('');
      },
      onError: () => setFormError('We could not start the mock challenge. Check the service status and try again.'),
    });
  }

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!challenge || !/^\d{6}$/.test(otp)) {
      setFormError('Enter the six-digit mock code shown below.');
      return;
    }
    verifyChallenge.mutate({ data: { challengeId: challenge.challengeId, otp } }, {
      onSuccess: (result) => {
        if (result.verified) {
          setVerified({ displayName: result.displayName, provider: result.provider });
          setOtp('');
        } else {
          setFormError('That code could not be verified. Check it and try again.');
        }
      },
      onError: () => setFormError('The mock code was not accepted. Check the code and try again.'),
    });
  }

  function restart() {
    setIdNumber('');
    setOtp('');
    setChallenge(null);
    setVerified(null);
    setFormError('');
    startChallenge.reset();
    verifyChallenge.reset();
  }

  const serviceState = health.isLoading
    ? { label: 'Checking service', tone: 'loading' }
    : health.isError
      ? { label: 'Service unavailable', tone: 'error' }
      : { label: 'Demo service online', tone: 'online' };

  return (
    <main className="app-shell">
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1240px] flex-col px-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-[hsl(var(--border)/.72)] py-5 sm:py-6">
          <div className="flex items-center gap-3" data-testid="brand-demo-identity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm">
              <Fingerprint size={22} strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-[Manrope] text-[15px] font-extrabold tracking-[-.04em]">ID / VERIFY</div>
              <div className="text-[10px] font-semibold uppercase tracking-[.19em] text-[hsl(var(--muted-foreground))]">Product team sandbox</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.76)] px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))]" data-testid="status-service">
            <span className={`h-2 w-2 rounded-full ${serviceState.tone === 'online' ? 'bg-emerald-600' : serviceState.tone === 'error' ? 'bg-rose-600' : 'animate-pulse bg-amber-500'}`} />
            <span>{serviceState.label}</span>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-9 lg:grid-cols-[.88fr_1.12fr] lg:gap-16 lg:py-12">
          <div className="page-enter max-w-[460px] lg:pb-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.12)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-[hsl(25_56%_35%)]" data-testid="badge-prototype">
              <Sparkles size={13} />
              Prototype · mock flow
            </div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-[hsl(var(--primary))]" data-testid="text-context">A practical verification preview</p>
            <h1 className="font-[Manrope] text-[clamp(2.7rem,6vw,5.1rem)] font-extrabold leading-[.99] tracking-[-.075em] text-[hsl(var(--foreground))]" data-testid="heading-main">
              Sign in, with<br />
              <span className="text-[hsl(var(--primary))]">a little more</span><br />
              certainty.
            </h1>
            <p className="mt-6 max-w-[390px] text-[15px] leading-7 text-[hsl(var(--muted-foreground))]" data-testid="text-intro">
              Explore how an identity-linked one-time code could fit into your product. This sandbox uses fictional records and a simulated code — nothing is sent to a phone.
            </p>

            <div className="mt-8 flex items-start gap-3 border-l-2 border-[hsl(var(--accent))] py-1 pl-4" data-testid="notice-not-official">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" />
              <p className="text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                <strong className="font-bold text-[hsl(var(--foreground))]">Independent prototype.</strong> Not an official Fayda service and not affiliated with any government agency.
              </p>
            </div>

            <div className="mt-10 hidden max-w-[360px] items-center gap-3 sm:flex" aria-label="Demo flow progress" data-testid="progress-flow">
              <StepMarker number="01" label="Identity" active={stage === 'identity'} complete={stage !== 'identity'} />
              <div className="step-line" />
              <StepMarker number="02" label="Code" active={stage === 'code'} complete={stage === 'complete'} />
              <div className="step-line" />
              <StepMarker number="03" label="Verified" active={stage === 'complete'} complete={false} />
            </div>
          </div>

          <div className="page-enter mx-auto w-full max-w-[560px] lg:ml-auto" style={{ animationDelay: '90ms' }}>
            <div className="relative overflow-hidden rounded-[26px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.94)] shadow-[0_26px_80px_-42px_hsl(200_40%_18%/.38)]">
              <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-20 rounded-full border-[22px] border-[hsl(var(--primary)/.05)]" />
              <div className="relative border-b border-[hsl(var(--border)/.75)] px-6 py-5 sm:px-9 sm:py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]" data-testid="text-step-caption">
                      {stage === 'identity' ? 'Step 01 / 03' : stage === 'code' ? 'Step 02 / 03' : 'Step 03 / 03'}
                    </div>
                    <h2 className="mt-1 font-[Manrope] text-xl font-extrabold tracking-[-.045em] sm:text-[23px]" data-testid="heading-step">
                      {stage === 'identity' ? 'Start with a demo ID' : stage === 'code' ? 'Enter your mock code' : 'Demo verified'}
                    </h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                    {stage === 'complete' ? <CheckCircle2 size={22} /> : stage === 'code' ? <LockKeyhole size={21} /> : <Fingerprint size={22} />}
                  </div>
                </div>
              </div>

              {stage === 'identity' && (
                <form onSubmit={requestCode} className="relative px-6 py-6 sm:px-9 sm:py-8" data-testid="form-identity">
                  <p className="mb-6 text-sm leading-6 text-[hsl(var(--muted-foreground))]" data-testid="text-identity-instructions">
                    Use a made-up identifier to begin. Real identity numbers are not accepted in this prototype.
                  </p>
                  <label htmlFor="demo-id" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-[hsl(var(--foreground))]">Fictional demo ID</label>
                  <div className="relative">
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={19} />
                    <input
                      id="demo-id"
                      value={idNumber}
                      onChange={(event) => { setIdNumber(event.target.value.toUpperCase()); setFormError(''); }}
                      placeholder="DEMO-4821-7390"
                      autoComplete="off"
                      maxLength={14}
                      aria-describedby="id-helper"
                      className="h-[58px] w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-12 pr-4 font-mono text-[15px] tracking-[.025em] outline-none transition focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/.12)]"
                      data-testid="input-demo-id"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p id="id-helper" className="text-[11px] text-[hsl(var(--muted-foreground))]" data-testid="text-id-helper">Format: DEMO-0000-0000 · fictional only</p>
                    <button type="button" onClick={() => { setIdNumber('DEMO-4821-7390'); setFormError(''); }} className="shrink-0 text-[11px] font-bold text-[hsl(var(--primary))] underline decoration-[hsl(var(--primary)/.35)] underline-offset-4 hover:decoration-[hsl(var(--primary))]" data-testid="button-fill-demo-id">
                      Use sample ID
                    </button>
                  </div>
                  {formError && <InlineError message={formError} />}
                  {startChallenge.isError && !formError && <InlineError message="The demo challenge could not be started. Try again." />}
                  <button type="submit" disabled={startChallenge.isPending} className="mt-7 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-[0_8px_18px_-10px_hsl(174_47%_24%/.8)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_hsl(174_47%_24%/.75)] disabled:translate-y-0 disabled:opacity-60" data-testid="button-request-code">
                    {startChallenge.isPending ? 'Preparing mock challenge…' : <>Request a mock code <ArrowRight size={17} /></>}
                  </button>
                  <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]" data-testid="note-no-sms">
                    <LockKeyhole size={13} /> No SMS · no live identity service · no saved data
                  </div>
                </form>
              )}

              {stage === 'code' && challenge && (
                <form onSubmit={submitCode} className="relative px-6 py-6 sm:px-9 sm:py-8" data-testid="form-code">
                  <div className="rounded-xl border border-[hsl(var(--primary)/.19)] bg-[hsl(var(--primary)/.055)] p-4" data-testid="notice-code-destination">
                    <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[hsl(var(--primary))]">Simulated delivery destination</p>
                    <p className="mt-1 text-sm font-semibold" data-testid="text-masked-phone">{challenge.maskedPhone}</p>
                    <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">This is a mock destination returned by the demo service. No message was sent.</p>
                  </div>
                  <label htmlFor="otp-code" className="mb-2 mt-6 block text-xs font-bold uppercase tracking-[.13em]">Six-digit mock code</label>
                  <input
                    id="otp-code"
                    value={otp}
                    onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setFormError(''); }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="••••••"
                    className="otp-input h-[62px] w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-5 text-center text-2xl outline-none transition placeholder:tracking-[.32em] focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/.12)]"
                    data-testid="input-otp-code"
                  />
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-[hsl(var(--accent)/.13)] px-3 py-2.5 text-xs leading-5 text-[hsl(var(--foreground))]" data-testid="notice-demo-otp">
                    <CircleHelp size={15} className="mt-0.5 shrink-0 text-[hsl(25_56%_35%)]" />
                    <span>Test convenience only — your <strong>mock-only code</strong> is <code className="mx-1 rounded bg-[hsl(var(--accent)/.18)] px-1.5 py-0.5 font-mono font-bold tracking-wider" data-testid="text-demo-otp">{challenge.demoOtp}</code>. Never use this as a real OTP.</span>
                  </div>
                  <p className="mt-3 text-[11px] text-[hsl(var(--muted-foreground))]" data-testid="text-expiry">Mock challenge expires in {challenge.expiresInSeconds} seconds.</p>
                  {formError && <InlineError message={formError} />}
                  {verifyChallenge.isError && !formError && <InlineError message="Verification did not complete. Check the code and retry." />}
                  <button type="submit" disabled={verifyChallenge.isPending || otp.length !== 6} className="mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-55" data-testid="button-verify-code">
                    {verifyChallenge.isPending ? 'Checking mock code…' : <>Verify demo code <ArrowRight size={17} /></>}
                  </button>
                  <button type="button" onClick={() => { setChallenge(null); setOtp(''); setFormError(''); }} className="mt-4 flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="button-back-to-id">
                    <ArrowLeft size={14} /> Back to demo ID
                  </button>
                </form>
              )}

              {stage === 'complete' && verified && (
                <div className="relative px-6 py-8 sm:px-9 sm:py-10" data-testid="state-demo-success">
                  <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[hsl(153_42%_90%)] text-[hsl(157_46%_30%)]">
                    <Check size={32} strokeWidth={2.4} />
                  </div>
                  <div className="mt-5 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[hsl(var(--primary))]" data-testid="status-verification">Mock verification successful</p>
                    <h3 className="mt-2 font-[Manrope] text-2xl font-extrabold tracking-[-.055em]" data-testid="text-display-name">{verified.displayName}</h3>
                    <p className="mx-auto mt-3 max-w-[350px] text-sm leading-6 text-[hsl(var(--muted-foreground))]" data-testid="text-success-explanation">
                      The fictional identity matched the demo challenge. Your product flow reached its verified state.
                    </p>
                  </div>
                  <div className="mt-7 grid grid-cols-2 gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.7)] p-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[hsl(var(--muted-foreground))]">Provider</p>
                      <p className="mt-1 font-mono text-sm font-medium" data-testid="text-provider">{verified.provider}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[hsl(var(--muted-foreground))]">Result</p>
                      <p className="mt-1 text-sm font-semibold text-[hsl(157_46%_30%)]" data-testid="text-verification-result">Verified · mock</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-start gap-2 rounded-lg border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.09)] p-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]" data-testid="notice-success-prototype">
                    <TriangleAlert size={15} className="mt-0.5 shrink-0 text-[hsl(25_56%_35%)]" />
                    This is a simulated result from a prototype — not proof of real-world identity.
                  </div>
                  <button type="button" onClick={restart} className="mt-7 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm font-bold transition hover:bg-[hsl(var(--secondary))]" data-testid="button-restart-demo">
                    <RotateCcw size={16} /> Run demo again
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-start gap-2 px-1 text-[10px] leading-5 text-[hsl(var(--muted-foreground))]" data-testid="text-data-handling">
              <LockKeyhole size={12} className="mt-0.5 shrink-0" />
              Demo inputs stay in this page's temporary state and are cleared when you restart. No local storage, SMS, or live Fayda API.
            </div>
          </div>
        </section>
        <footer className="flex flex-col gap-2 border-t border-[hsl(var(--border)/.72)] py-4 text-[10px] text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between" data-testid="footer-demo">
          <span>Built for product exploration · Fictional data only</span>
          <span className="font-mono tracking-wide">DEMO ENVIRONMENT / 01</span>
        </footer>
      </div>
    </main>
  );
}

function StepMarker({ number, label, active, complete }: { number: string; label: string; active: boolean; complete: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2" data-testid={`step-${number}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-full font-[DM_Mono] text-[10px] font-medium ${active ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : complete ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}>
        {complete ? <Check size={13} /> : number}
      </span>
      <span className={`text-[10px] font-bold ${active ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>{label}</span>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.07)] px-3 py-2.5 text-xs leading-5 text-[hsl(var(--destructive))]" data-testid="status-form-error">
      <TriangleAlert size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
