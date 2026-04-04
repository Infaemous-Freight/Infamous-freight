import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronRight,
  Clock3,
  Globe,
  LayoutDashboard,
  LineChart,
  Lock,
  Mail,
  MapPinned,
  Menu,
  Package,
  Radio,
  Route,
  ScanLine,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Smartphone,
  Truck,
  User,
  Warehouse,
  Zap,
} from "lucide-react";

type NavItem = {
  key: "overview" | "loads" | "fleet" | "command" | "settings";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Load = {
  id: string;
  customer: string;
  lane: string;
  status: string;
  priority: "Critical" | "High" | "Medium";
  eta: string;
  risk: number;
  temp: string;
  revenue: string;
  driver: string;
  trailer: string;
};

type FleetUnit = {
  name: string;
  state: string;
  utilization: number;
  fuel: number;
  health: string;
  location: string;
};

type AlertItem = {
  label: string;
  note: string;
  tone: PillTone;
};

type MetricItem = {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
};

type PillTone = "default" | "danger" | "warning" | "success";

type TabProps = {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string;
};

type TabTriggerProps = {
  children: React.ReactNode;
  value: string;
};

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

function CardHeader({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

function CardTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={className}>{children}</h3>;
}

function CardContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

function Button({
  className = "",
  children,
  onClick,
  variant,
  type = "button",
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "outline" | "ghost";
  type?: "button" | "submit";
}) {
  const variantClass =
    variant === "outline"
      ? "border border-zinc-700"
      : variant === "ghost"
        ? "border border-transparent"
        : "";

  return (
    <button type={type} onClick={onClick} className={`${variantClass} ${className}`.trim()}>
      {children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

function Badge({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <span className={className}>{children}</span>;
}

function Tabs({ className = "", children }: TabProps) {
  return <div className={className}>{children}</div>;
}

function TabsList({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

function TabsTrigger({ children }: TabTriggerProps) {
  return (
    <button type="button" className="rounded-lg px-3 py-2 text-xs text-zinc-300">
      {children}
    </button>
  );
}

const nav: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "loads", label: "Loads", icon: Package },
  { key: "fleet", label: "Fleet", icon: Truck },
  { key: "command", label: "Command", icon: Radio },
  { key: "settings", label: "Settings", icon: Settings },
];

const loads: Load[] = [
  {
    id: "IF-7742",
    customer: "Nova Retail",
    lane: "Memphis -> Phoenix",
    status: "Checkpoint Scan",
    priority: "Critical",
    eta: "05:40",
    risk: 71,
    temp: "Watch",
    revenue: "$7,280",
    driver: "A. Cole",
    trailer: "TR-18",
  },
  {
    id: "IF-9081",
    customer: "Atlas Industrial",
    lane: "Atlanta -> Dallas",
    status: "In Transit",
    priority: "High",
    eta: "02:15",
    risk: 18,
    temp: "Stable",
    revenue: "$4,900",
    driver: "M. Reeves",
    trailer: "TR-44",
  },
  {
    id: "IF-6619",
    customer: "Northline Med",
    lane: "Chicago -> Newark",
    status: "Final Mile",
    priority: "Medium",
    eta: "01:05",
    risk: 29,
    temp: "Stable",
    revenue: "$3,760",
    driver: "S. Kemp",
    trailer: "TR-71",
  },
  {
    id: "IF-6120",
    customer: "Forge Commerce",
    lane: "Miami -> Charlotte",
    status: "Dock Ready",
    priority: "Medium",
    eta: "03:25",
    risk: 24,
    temp: "Stable",
    revenue: "$2,940",
    driver: "T. Lewis",
    trailer: "TR-09",
  },
];

const fleet: FleetUnit[] = [
  { name: "Unit 14", state: "Live", utilization: 94, fuel: 62, health: "Good", location: "I-20 East" },
  { name: "Unit 29", state: "Docking", utilization: 71, fuel: 49, health: "Watch", location: "Dallas Hub" },
  { name: "Unit 31", state: "Hot Lane", utilization: 98, fuel: 83, health: "Good", location: "Phoenix Transfer" },
  { name: "Unit 42", state: "Service", utilization: 34, fuel: 91, health: "Repair", location: "Atlanta Yard" },
];

const alerts: AlertItem[] = [
  { label: "Lane congestion spike", note: "I-20 corridor latency +17 min", tone: "warning" },
  { label: "Margin pressure detected", note: "Fuel burn exceeds model by 6.2%", tone: "danger" },
  { label: "Chain-of-custody verified", note: "Biometric scan matched manifest", tone: "success" },
  { label: "Dock staffing stabilized", note: "Charlotte node back to target throughput", tone: "default" },
];

const metrics: MetricItem[] = [
  { label: "Weekly Loads", value: "24k+", sub: "Production-ready automation", icon: Package },
  { label: "Exception Response", value: "< 2 min", sub: "Median operator action time", icon: Zap },
  { label: "Live Visibility", value: "99.1%", sub: "Fleet telemetry coverage", icon: Globe },
  { label: "On-Time Pulse", value: "96.2%", sub: "Across hot lanes", icon: Clock3 },
];

const coreModules: Array<[React.ComponentType<{ className?: string }>, string, string]> = [
  [Package, "Loads", "Searchable registry, lane state, ETA risk, checkpoint timeline."],
  [Truck, "Fleet", "Utilization, fuel, health, maintenance visibility."],
  [Radio, "Command", "Automation rules, response console, escalation controls."],
  [Smartphone, "Mobile", "Remote access to high-priority load and alert actions."],
];

const operatorBuildoutCards: Array<[React.ComponentType<{ className?: string }>, string, string]> = [
  [Shield, "Security-first", "Access layer styled for serious operations, not generic marketing SaaS."],
  [Route, "Dispatch-ready", "Landing, auth, dashboard, fleet, loads, and command surfaces included."],
  [Smartphone, "Mobile aligned", "Web shell and mobile patterns use the same theme and control language."],
  [Zap, "Fast activation", "New operators reach a usable dashboard immediately after registration."],
];

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,70,22,0.18),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(255,35,0,0.12),transparent_25%),linear-gradient(180deg,#080202_0%,#030000_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,60,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,60,0,0.06)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,rgba(255,80,0,0.8)_0.5px,transparent_0.8px)] [background-size:24px_24px]" />
      <div className="absolute left-[-10%] top-24 h-80 w-80 rounded-full bg-red-600/15 blur-3xl" />
      <div className="absolute bottom-10 right-[-8%] h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-3xl border border-red-500/25 bg-black/70 text-2xl text-red-400 shadow-[0_0_30px_rgba(255,40,0,0.28)]">
      IF
    </div>
  );
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: PillTone }) {
  const classes: Record<PillTone, string> = {
    default: "border-red-500/20 bg-red-500/10 text-red-100",
    danger: "border-red-400/30 bg-red-500/15 text-red-200",
    warning: "border-orange-400/30 bg-orange-500/15 text-orange-100",
    success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-100",
  };

  return (
    <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] ${classes[tone]}`}>
      {children}
    </Badge>
  );
}

function ShellCard({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden border-red-500/20 bg-black/55 shadow-[0_0_42px_rgba(255,40,0,0.08)] backdrop-blur-xl ${className}`}>
      {title && (
        <CardHeader className="border-b border-red-500/10 pb-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm uppercase tracking-[0.28em] text-red-200/90">{title}</CardTitle>
            {action}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

function MetricCard({ item }: { item: MetricItem }) {
  const Icon = item.icon;
  return (
    <Card className="border-red-500/20 bg-black/60 shadow-[0_0_30px_rgba(255,40,0,0.08)] backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-red-300/70">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-red-50">{item.value}</p>
            <p className="mt-2 text-sm text-zinc-400">{item.sub}</p>
          </div>
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-red-300 shadow-[0_0_24px_rgba(255,45,0,0.2)]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-900">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400 shadow-[0_0_16px_rgba(255,45,0,0.45)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function RiskRing({ value }: { value: number }) {
  const dash = 226 - (226 * value) / 100;
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
        <circle cx="50" cy="50" r="36" stroke="rgba(255,75,15,0.12)" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r="36"
          stroke="rgba(255,75,15,0.92)"
          strokeWidth="8"
          fill="none"
          strokeDasharray="226"
          strokeDashoffset={dash}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-red-50">{value}%</div>
    </div>
  );
}

function MobileMockup({ selectedLoad }: { selectedLoad: Load }) {
  const tabs = ["Loads", "Map", "Fleet", "Alerts"];

  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[36px] border border-red-500/20 bg-black/80 p-3 shadow-[0_0_40px_rgba(255,45,0,0.12)]">
      <div className="rounded-[28px] border border-red-500/15 bg-[radial-gradient(circle_at_50%_0%,rgba(255,60,0,0.16),rgba(0,0,0,0.88)_40%,rgba(0,0,0,1)_100%)] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-red-300/70">Remote Ops</p>
            <p className="mt-1 text-lg font-semibold text-red-50">Night Shift</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200">
      IF
          </div>
        </div>

        <div className="rounded-[24px] border border-red-500/20 bg-black/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Primary Load</p>
              <p className="mt-2 font-semibold text-red-50">{selectedLoad.id}</p>
            </div>
            <Pill tone="warning">Live</Pill>
          </div>
          <p className="mt-3 text-sm text-zinc-300">{selectedLoad.lane}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-2.5">
              <p className="text-zinc-500">ETA</p>
              <p className="mt-1 text-red-100">{selectedLoad.eta}</p>
            </div>
            <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-2.5">
              <p className="text-zinc-500">Risk</p>
              <p className="mt-1 text-red-100">{selectedLoad.risk}%</p>
            </div>
            <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-2.5">
              <p className="text-zinc-500">Temp</p>
              <p className="mt-1 text-red-100">{selectedLoad.temp}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-[22px] border border-red-500/15 bg-black/45 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-red-50">Threat Feed</p>
              <AlertTriangle className="h-4 w-4 text-red-300" />
            </div>
            <p className="mt-2 text-xs text-zinc-400">Lane congestion spike detected on I-20 corridor.</p>
          </div>
          <div className="rounded-[22px] border border-red-500/15 bg-black/45 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-red-50">Fleet Pulse</p>
              <Truck className="h-4 w-4 text-red-300" />
            </div>
            <p className="mt-2 text-xs text-zinc-400">3 units on hot lanes. 1 maintenance watch.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-[24px] border border-red-500/15 bg-black/60 p-2">
          {tabs.map((tab, index) => (
            <div
              key={tab}
              className={`rounded-[18px] px-2 py-2 text-center text-[10px] uppercase tracking-[0.18em] ${index === 0 ? "bg-red-500/15 text-red-100" : "text-zinc-500"}`}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthCard({
  mode,
  onSuccess,
  onSwitch,
}: {
  mode: "signin" | "register";
  onSuccess: () => void;
  onSwitch: () => void;
}) {
  return (
    <ShellCard
      title={mode === "signin" ? "Operator Access" : "Create Command Account"}
      action={<Pill tone="warning">Secure</Pill>}
      className="mx-auto max-w-md"
    >
      <div className="space-y-4">
        {mode === "register" && (
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.22em] text-zinc-500">Full Name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                className="h-12 w-full rounded-xl border border-red-500/20 bg-black/50 pl-10 text-red-50 placeholder:text-zinc-600 focus-visible:ring-red-500/30"
                placeholder="Operator name"
              />
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-[0.22em] text-zinc-500">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              className="h-12 w-full rounded-xl border border-red-500/20 bg-black/50 pl-10 text-red-50 placeholder:text-zinc-600 focus-visible:ring-red-500/30"
              placeholder="control@infaemousfreight.com"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-[0.22em] text-zinc-500">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="password"
              className="h-12 w-full rounded-xl border border-red-500/20 bg-black/50 pl-10 text-red-50 placeholder:text-zinc-600 focus-visible:ring-red-500/30"
              placeholder="********"
            />
          </div>
        </div>
        {mode === "register" && (
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.22em] text-zinc-500">Role</label>
            <Tabs defaultValue="dispatcher" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-black/50 p-1">
                <TabsTrigger value="dispatcher">Dispatcher</TabsTrigger>
                <TabsTrigger value="ops">Ops</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        <Button
          onClick={onSuccess}
          className="h-12 w-full rounded-2xl border border-red-500/30 bg-red-500/10 text-red-100 shadow-[0_0_30px_rgba(255,40,0,0.15)] hover:bg-red-500/15"
        >
          {mode === "signin" ? "Enter Command Center" : "Create Account"}
        </Button>
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <button onClick={onSwitch} type="button" className="text-red-200 hover:text-red-100">
            {mode === "signin" ? "Need an account? Register" : "Already have access? Sign in"}
          </button>
          <button type="button" className="hover:text-red-100">
            Reset password
          </button>
        </div>
      </div>
    </ShellCard>
  );
}

function SiteHeader({
  onNavigate,
  inApp = false,
  onOpenMenu,
}: {
  onNavigate: (target: "home" | "signin" | "register" | "app") => void;
  inApp?: boolean;
  onOpenMenu?: () => void;
}) {
  return (
    <div className={`sticky top-0 z-40 border-b border-red-500/10 ${inApp ? "bg-black/70" : "bg-black/40"} backdrop-blur-xl`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <button onClick={() => onNavigate(inApp ? "app" : "home")} type="button" className="flex items-center gap-3 text-left">
          <LogoMark />
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-red-300/70">Infaemous Freight</p>
            <h1 className="text-lg font-semibold tracking-[0.06em] text-red-50">Dispatcher</h1>
          </div>
        </button>

        <div className="hidden items-center gap-3 md:flex">
          {!inApp && (
            <>
              <Button variant="ghost" onClick={() => onNavigate("signin")} className="rounded-2xl text-red-100 hover:bg-red-500/10 hover:text-red-50">
                Sign in
              </Button>
              <Button
                onClick={() => onNavigate("register")}
                className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-100 shadow-[0_0_30px_rgba(255,40,0,0.15)] hover:bg-red-500/15"
              >
                Start free trial
              </Button>
            </>
          )}
          {inApp && (
            <>
              <Pill tone="success">Systems Armed</Pill>
              <Button
                variant="outline"
                className="rounded-2xl border-red-500/25 bg-black/50 px-4 py-2 text-red-100 hover:bg-red-500/10 hover:text-red-50"
              >
                <Bell className="mr-2 inline h-4 w-4" />
                Alerts
              </Button>
            </>
          )}
        </div>

        {onOpenMenu && (
          <Button
            variant="outline"
            onClick={onOpenMenu}
            className="rounded-2xl border-red-500/25 bg-black/50 px-4 py-2 text-red-100 hover:bg-red-500/10 hover:text-red-50 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function LandingPage({ onNavigate }: { onNavigate: (target: "home" | "signin" | "register" | "app") => void }) {
  const selectedLoad = loads[0];

  return (
    <div className="relative">
      <SiteHeader onNavigate={onNavigate} />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="text-[12px] uppercase tracking-[0.42em] text-red-300/70">Production-ready freight platform</p>
            <h2 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.04em] text-red-50 sm:text-6xl lg:text-7xl">
              INFAEMOUS
              <span className="block text-red-200">FREIGHT Dispatcher</span>
            </h2>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-zinc-300">Freight orchestration for teams that move faster than the market.</p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-500">
              Unify quoting, dispatch, live visibility, fleet control, and exception handling into one command surface.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                onClick={() => onNavigate("register")}
                className="h-12 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 text-red-100 shadow-[0_0_30px_rgba(255,40,0,0.15)] hover:bg-red-500/15"
              >
                Start free trial
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("signin")}
                className="h-12 rounded-2xl border-red-500/25 bg-black/50 px-6 text-red-100 hover:bg-red-500/10 hover:text-red-50"
              >
                Sign in
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Pill tone="success">Dispatch</Pill>
              <Pill>Visibility</Pill>
              <Pill tone="warning">Exception Control</Pill>
              <Pill>Fleet Ops</Pill>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
            <ShellCard title="Live Product Signal" action={<Pill tone="warning">Night Mode</Pill>}>
              <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                <div className="rounded-[28px] border border-red-500/20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,60,0,0.18),rgba(0,0,0,0.7)_40%,rgba(0,0,0,0.95)_100%)] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-red-300/70">Route Matrix</p>
                      <p className="mt-2 text-2xl font-semibold text-red-50">{selectedLoad.lane}</p>
                    </div>
                    <Pill tone="danger">{selectedLoad.priority}</Pill>
                  </div>
                  <div className="mt-6 h-44 rounded-[24px] border border-red-500/15 bg-black/45 p-4">
                    <div className="relative h-full overflow-hidden rounded-[18px] border border-red-500/10 bg-black/60">
                      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,65,0,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,65,0,0.12)_1px,transparent_1px)] [background-size:40px_40px]" />
                      <div className="absolute left-[12%] top-[24%] h-3 w-3 rounded-full bg-red-400 shadow-[0_0_20px_6px_rgba(255,60,0,0.6)]" />
                      <div className="absolute left-[35%] top-[46%] h-3 w-3 rounded-full bg-red-300 shadow-[0_0_20px_6px_rgba(255,60,0,0.5)]" />
                      <div className="absolute right-[18%] top-[28%] h-3 w-3 rounded-full bg-orange-300 shadow-[0_0_20px_6px_rgba(255,94,0,0.5)]" />
                      <div className="absolute right-[25%] bottom-[20%] h-3 w-3 rounded-full bg-red-400 shadow-[0_0_20px_6px_rgba(255,60,0,0.6)]" />
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M14 26 C 30 30, 24 40, 37 41 S 55 26, 82 29" fill="none" stroke="rgba(255,70,20,0.9)" strokeWidth="0.7" strokeDasharray="3 2" />
                        <path d="M37 41 C 48 55, 58 70, 75 78" fill="none" stroke="rgba(255,50,0,0.85)" strokeWidth="0.7" strokeDasharray="3 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-3">
                      <p className="text-zinc-500">ETA</p>
                      <p className="mt-2 font-semibold text-red-100">{selectedLoad.eta}</p>
                    </div>
                    <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-3">
                      <p className="text-zinc-500">Risk</p>
                      <p className="mt-2 font-semibold text-red-100">{selectedLoad.risk}%</p>
                    </div>
                    <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-3">
                      <p className="text-zinc-500">Status</p>
                      <p className="mt-2 font-semibold text-red-100">{selectedLoad.status}</p>
                    </div>
                  </div>
                </div>
                <MobileMockup selectedLoad={selectedLoad} />
              </div>
            </ShellCard>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <ShellCard title="Why it wins" action={<Pill tone="success">Operational Fit</Pill>}>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Dispatch control", "Route planning, lane assignment, and exception escalation built for real operators."],
                ["Live telemetry", "Fleet visibility, node health, scan events, and threat detection in one dark-mode surface."],
                ["Automation", "Auto-reroute, response policies, and incident drills without moving between tools."],
                ["Mobile command", "Remote control for loads, alerts, and fleet decisions from the field."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[24px] border border-red-500/15 bg-black/45 p-5">
                  <p className="font-semibold text-red-50">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{copy}</p>
                </div>
              ))}
            </div>
          </ShellCard>

          <ShellCard title="Core modules" action={<Pill>Web + Mobile</Pill>}>
            <div className="space-y-3">
              {coreModules.map(([Icon, title, copy]) => (
                <div key={title} className="rounded-[24px] border border-red-500/15 bg-black/45 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-2.5 text-red-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-50">{title}</p>
                      <p className="mt-1 text-sm text-zinc-400">{copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>
      </section>
    </div>
  );
}

function AppSidebar({ page, setPage }: { page: NavItem["key"]; setPage: (next: NavItem["key"]) => void }) {
  return (
    <aside className="hidden w-[260px] shrink-0 lg:block">
      <div className="sticky top-24 rounded-[32px] border border-red-500/20 bg-black/60 p-5 shadow-[0_0_42px_rgba(255,40,0,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-4 border-b border-red-500/10 pb-5">
          <LogoMark />
          <div>
            <p className="text-[11px] uppercase tracking-[0.42em] text-red-300/70">Command Network</p>
            <h2 className="text-xl font-semibold tracking-[0.08em] text-red-50">Infaemous Freight</h2>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                type="button"
                className={`flex w-full items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition ${active ? "border-red-400/35 bg-red-500/14 text-red-50 shadow-[0_0_24px_rgba(255,40,0,0.12)]" : "border-transparent bg-transparent text-zinc-400 hover:border-red-500/15 hover:bg-red-500/6 hover:text-red-100"}`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-red-300" : "text-zinc-500"}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-[26px] border border-red-500/15 bg-[radial-gradient(circle_at_50%_0%,rgba(255,60,0,0.14),rgba(0,0,0,0.9)_48%)] p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-red-300/70">Executive Signal</p>
          <p className="mt-2 text-lg font-semibold text-red-50">Freight control without blind spots.</p>
          <p className="mt-2 text-sm text-zinc-400">Built for dispatch, fleet visibility, and exception response.</p>
        </div>
      </div>
    </aside>
  );
}

function OverviewPage({ selectedLoad, setSelectedLoad }: { selectedLoad: Load; setSelectedLoad: (load: Load) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.85fr]">
        <ShellCard title="Lane Command Grid" action={<Pill tone="warning">High Heat Corridor</Pill>}>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-red-500/20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,60,0,0.18),rgba(0,0,0,0.7)_40%,rgba(0,0,0,0.95)_100%)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-red-300/70">Live Route Matrix</p>
                  <p className="mt-2 text-2xl font-semibold text-red-50">{selectedLoad.lane}</p>
                </div>
                <div className="rounded-2xl border border-red-500/25 bg-black/40 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Manifest</p>
                  <p className="mt-1 font-medium text-red-100">{selectedLoad.id}</p>
                </div>
              </div>
              <div className="mt-5 h-52 rounded-[22px] border border-red-500/15 bg-black/45 p-4">
                <div className="relative h-full overflow-hidden rounded-[18px] border border-red-500/10 bg-black/60">
                  <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,65,0,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,65,0,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
                  <div className="absolute left-[14%] top-[25%] h-3 w-3 rounded-full bg-red-400 shadow-[0_0_20px_6px_rgba(255,60,0,0.6)]" />
                  <div className="absolute left-[37%] top-[40%] h-3 w-3 rounded-full bg-red-300 shadow-[0_0_20px_6px_rgba(255,60,0,0.5)]" />
                  <div className="absolute right-[18%] top-[28%] h-3 w-3 rounded-full bg-orange-300 shadow-[0_0_20px_6px_rgba(255,94,0,0.5)]" />
                  <div className="absolute right-[25%] bottom-[22%] h-3 w-3 rounded-full bg-red-400 shadow-[0_0_20px_6px_rgba(255,60,0,0.6)]" />
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M14 26 C 30 30, 24 40, 37 41 S 55 26, 82 29" fill="none" stroke="rgba(255,70,20,0.9)" strokeWidth="0.7" strokeDasharray="3 2" />
                    <path d="M37 41 C 48 55, 58 70, 75 78" fill="none" stroke="rgba(255,50,0,0.85)" strokeWidth="0.7" strokeDasharray="3 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-red-500/20 bg-black/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">ETA</p>
                  <p className="mt-2 text-lg font-semibold text-red-50">{selectedLoad.eta}</p>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-black/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Temperature</p>
                  <p className="mt-2 text-lg font-semibold text-red-50">{selectedLoad.temp}</p>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-black/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Priority</p>
                  <p className="mt-2 text-lg font-semibold text-red-50">{selectedLoad.priority}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-red-500/20 bg-black/50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.26em] text-red-300/70">Risk Core</p>
                    <p className="mt-2 text-lg font-semibold text-red-50">Exception Exposure</p>
                  </div>
                  <ShieldAlert className="h-5 w-5 text-red-300" />
                </div>
                <div className="mt-4 flex items-center gap-5">
                  <RiskRing value={selectedLoad.risk} />
                  <div className="space-y-2 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-red-300" /> Route volatility tracked
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-red-300" /> Fleet impact monitored
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinned className="h-4 w-4 text-red-300" /> Scan density active
                    </div>
                  </div>
                </div>
              </div>
              <MobileMockup selectedLoad={selectedLoad} />
            </div>
          </div>
        </ShellCard>

        <ShellCard title="Threat Feed" action={<Pill tone="danger">2 Urgent</Pill>}>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.label} className="rounded-[24px] border border-red-500/15 bg-black/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-red-50">{alert.label}</p>
                    <p className="mt-1 text-sm text-zinc-400">{alert.note}</p>
                  </div>
                  <Pill tone={alert.tone}>{alert.tone}</Pill>
                </div>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>

      <ShellCard title="Priority Load Queue" action={<Pill>Live Manifest</Pill>}>
        <div className="space-y-3">
          {loads.map((load) => (
            <button
              key={load.id}
              onClick={() => setSelectedLoad(load)}
              type="button"
              className={`w-full rounded-[24px] border p-4 text-left transition ${selectedLoad.id === load.id ? "border-red-400/40 bg-red-500/12 shadow-[0_0_32px_rgba(255,40,0,0.12)]" : "border-red-500/15 bg-black/40 hover:bg-red-500/6"}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-red-50">{load.id}</p>
                    <Pill tone={load.priority === "Critical" ? "danger" : load.priority === "High" ? "warning" : "default"}>
                      {load.priority}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{load.lane}</p>
                  <p className="mt-1 text-xs text-zinc-500">{load.customer}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm sm:min-w-[260px]">
                  <div>
                    <p className="text-zinc-500">Status</p>
                    <p className="mt-1 text-red-100">{load.status}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">ETA</p>
                    <p className="mt-1 text-red-100">{load.eta}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-zinc-500">Risk</p>
                      <p className="mt-1 text-red-100">{load.risk}%</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-red-300" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ShellCard>
    </div>
  );
}

function LoadsPage({ selectedLoad, setSelectedLoad }: { selectedLoad: Load; setSelectedLoad: (load: Load) => void }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      loads.filter((load) =>
        `${load.id} ${load.customer} ${load.lane} ${load.status}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <ShellCard title="Load Registry" action={<Pill tone="warning">Searchable</Pill>}>
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-black/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-red-50 outline-none placeholder:text-zinc-600"
              placeholder="Search loads by ID, customer, lane, or status"
            />
          </div>
        </div>
        <div className="space-y-3">
          {filtered.map((load) => (
            <button
              key={load.id}
              onClick={() => setSelectedLoad(load)}
              type="button"
              className={`w-full rounded-[24px] border p-4 text-left transition ${selectedLoad.id === load.id ? "border-red-400/40 bg-red-500/12" : "border-red-500/15 bg-black/40 hover:bg-red-500/6"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-red-50">{load.id}</p>
                  <p className="mt-1 text-sm text-zinc-400">{load.customer}</p>
                  <p className="mt-1 text-xs text-zinc-500">{load.lane}</p>
                </div>
                <div className="text-right">
                  <Pill tone={load.priority === "Critical" ? "danger" : load.priority === "High" ? "warning" : "default"}>
                    {load.priority}
                  </Pill>
                  <p className="mt-2 text-xs text-zinc-500">{load.status}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ShellCard>

      <div className="space-y-6">
        <ShellCard title="Load Command Detail" action={<Pill tone="danger">{selectedLoad.status}</Pill>}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-red-500/15 bg-black/45 p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Manifest</p>
              <p className="mt-2 text-2xl font-semibold text-red-50">{selectedLoad.id}</p>
              <p className="mt-2 text-sm text-zinc-400">{selectedLoad.customer}</p>
              <p className="mt-1 text-sm text-zinc-400">{selectedLoad.lane}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-3">
                  <p className="text-zinc-500">Driver</p>
                  <p className="mt-1 text-red-100">{selectedLoad.driver}</p>
                </div>
                <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-3">
                  <p className="text-zinc-500">Trailer</p>
                  <p className="mt-1 text-red-100">{selectedLoad.trailer}</p>
                </div>
                <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-3">
                  <p className="text-zinc-500">ETA</p>
                  <p className="mt-1 text-red-100">{selectedLoad.eta}</p>
                </div>
                <div className="rounded-2xl border border-red-500/15 bg-red-500/10 p-3">
                  <p className="text-zinc-500">Revenue</p>
                  <p className="mt-1 text-red-100">{selectedLoad.revenue}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-red-500/15 bg-black/45 p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Exception Scoring</p>
              <div className="mt-4 flex items-center gap-4">
                <RiskRing value={selectedLoad.risk} />
                <div className="space-y-2 text-sm text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-red-300" /> Fleet handoff healthy
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-red-300" /> Current visibility uninterrupted
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-300" /> Auto-escalation enabled
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ShellCard>

        <ShellCard
          title="Checkpoint Timeline"
          action={
            <Button className="rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-red-100 hover:bg-red-500/15">
              <ScanLine className="mr-2 inline h-4 w-4" />
              Scan Event
            </Button>
          }
        >
          <div className="space-y-4">
            {["Pickup confirmed", "Cross-dock cleared", "Lane secured", "ETA within target"].map((step, index, arr) => (
              <div key={step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-red-400 shadow-[0_0_18px_rgba(255,60,0,0.55)]" />
                  {index !== arr.length - 1 && <div className="mt-2 h-12 w-px bg-gradient-to-b from-red-500/60 to-transparent" />}
                </div>
                <div className="flex-1 rounded-[22px] border border-red-500/15 bg-black/40 p-4">
                  <p className="font-medium text-red-50">{step}</p>
                  <p className="mt-1 text-sm text-zinc-400">Operational note {index + 1}. Logged by command network.</p>
                </div>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>
    </div>
  );
}

function FleetPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <ShellCard title="Fleet Utilization" action={<Pill>Live Telemetry</Pill>}>
        <div className="grid gap-4 md:grid-cols-2">
          {fleet.map((unit) => (
            <div key={unit.name} className="rounded-[24px] border border-red-500/15 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-red-50">{unit.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">{unit.state}</p>
                  <p className="mt-1 text-xs text-zinc-500">{unit.location}</p>
                </div>
                <Truck className="h-5 w-5 text-red-300" />
              </div>
              <div className="mt-4 space-y-3">
                <DataBar label="Utilization" value={unit.utilization} />
                <DataBar label="Fuel Reserve" value={unit.fuel} />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-zinc-500">Health</span>
                <span className="text-red-100">{unit.health}</span>
              </div>
            </div>
          ))}
        </div>
      </ShellCard>

      <div className="space-y-6">
        <ShellCard title="Facility Network" action={<Pill tone="success">Nodes Online</Pill>}>
          <div className="space-y-3">
            {[
              ["Atlanta Core", "Hub", "1,280/day", "Stable"],
              ["Dallas Relay", "Cross-dock", "840/day", "High Load"],
              ["Phoenix Edge", "Relay", "620/day", "Stable"],
            ].map(([name, type, throughput, status]) => (
              <div key={name} className="rounded-[24px] border border-red-500/15 bg-black/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-50">{name}</p>
                    <p className="mt-1 text-sm text-zinc-400">{type}</p>
                  </div>
                  <Warehouse className="h-5 w-5 text-red-300" />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Throughput</span>
                  <span className="text-red-100">{throughput}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Status</span>
                  <span className="text-red-100">{status}</span>
                </div>
              </div>
            ))}
          </div>
        </ShellCard>

        <ShellCard title="Maintenance Signal">
          <div className="rounded-[28px] border border-red-500/20 bg-[radial-gradient(circle_at_50%_12%,rgba(255,60,0,0.18),rgba(0,0,0,0.82)_45%,rgba(0,0,0,0.95)_100%)] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-red-300/70">Service Window</p>
            <p className="mt-2 text-2xl font-semibold text-red-50">3 units due in next 48 hours</p>
            <p className="mt-2 text-sm text-zinc-400">
              Use predictive scheduling before hot-lane assignments push avoidable downtime into the network.
            </p>
          </div>
        </ShellCard>
      </div>
    </div>
  );
}

function CommandPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <ShellCard title="Automation Rules" action={<Pill tone="warning">Armed</Pill>}>
        <div className="space-y-3">
          {[
            "Auto-reroute when ETA drift exceeds 20 minutes",
            "Escalate cold-chain alerts to human review within 30 seconds",
            "Trigger fallback carrier workflow on failed checkpoint scan",
            "Push delay summaries to customer portal every 15 minutes",
          ].map((rule) => (
            <div key={rule} className="rounded-[24px] border border-red-500/15 bg-black/40 p-4">
              <p className="font-medium text-red-50">{rule}</p>
              <p className="mt-1 text-sm text-zinc-400">Policy active and tied to command center exceptions.</p>
            </div>
          ))}
        </div>
      </ShellCard>

      <ShellCard
        title="Response Console"
        action={<Button className="rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-red-100 hover:bg-red-500/15">Run Drill</Button>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-red-500/15 bg-black/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Threat Level</p>
            <p className="mt-2 text-4xl font-semibold text-red-50">Amber</p>
            <p className="mt-2 text-sm text-zinc-400">Two active loads exceed preferred risk band.</p>
          </div>
          <div className="rounded-[24px] border border-red-500/15 bg-black/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Active Operators</p>
            <p className="mt-2 text-4xl font-semibold text-red-50">07</p>
            <p className="mt-2 text-sm text-zinc-400">Coverage sufficient for overnight exception volume.</p>
          </div>
          <div className="rounded-[24px] border border-red-500/15 bg-black/40 p-4 md:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Control Notes</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Keep control actions separate from passive analytics. Dispatch teams need fast decisions, strong escalation cues, and short response paths.
            </p>
          </div>
        </div>
      </ShellCard>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <ShellCard title="Brand Tokens" action={<Pill>Systemized</Pill>}>
        <div className="space-y-3">
          {[
            ["Void Black", "#050101"],
            ["Carbon Black", "#0A0404"],
            ["Neon Ember", "#FF4D1F"],
            ["Signal Red", "#FF2A00"],
            ["Mist White", "#FFF3EE"],
          ].map(([name, hex]) => (
            <div key={name} className="flex items-center justify-between rounded-[24px] border border-red-500/15 bg-black/40 p-4">
              <div>
                <p className="font-medium text-red-50">{name}</p>
                <p className="mt-1 text-sm text-zinc-400">{hex}</p>
              </div>
              <div className="h-10 w-16 rounded-2xl border border-white/10" style={{ background: hex }} />
            </div>
          ))}
        </div>
      </ShellCard>

      <ShellCard title="Implementation Guidance">
        <div className="space-y-4 text-sm text-zinc-300">
          {[
            ["Layout rule", "Use dense information panels with soft corners, thin neon borders, and strong contrast."],
            ["Motion rule", "Use subtle emergence and glow pulses. Avoid playful easing."],
            ["Product rule", "Separate control actions from monitoring surfaces so operators can act without searching."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-[24px] border border-red-500/15 bg-black/40 p-4">
              <p className="font-medium text-red-50">{title}</p>
              <p className="mt-1">{copy}</p>
            </div>
          ))}
        </div>
      </ShellCard>
    </div>
  );
}

function AppWorkspace({ onNavigate }: { onNavigate: (target: "home" | "signin" | "register" | "app") => void }) {
  const [page, setPage] = useState<NavItem["key"]>("overview");
  const [selectedLoad, setSelectedLoad] = useState<Load>(loads[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const title = nav.find((item) => item.key === page)?.label ?? "Overview";

  return (
    <div className="relative">
      <SiteHeader onNavigate={onNavigate} inApp onOpenMenu={() => setMobileMenuOpen(true)} />

      <AnimatePresence>
        {mobileMenuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-[min(86vw,22rem)] overflow-y-auto border-r border-red-500/20 bg-zinc-950/95 p-4 backdrop-blur lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.36em] text-red-300/70">Navigation</p>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/20 bg-black/50 text-red-100 transition hover:bg-red-500/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Menu className="h-4 w-4" />
                </button>
              </div>
              <AppSidebar
                page={page}
                setPage={(nextPage) => {
                  setPage(nextPage);
                  setMobileMenuOpen(false);
                }}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="hidden lg:block">
          <AppSidebar page={page} setPage={setPage} />
        </div>

        <main className="min-w-0 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.36em] text-red-300/70">Operational Interface</p>
              <h2 className="mt-2 text-3xl font-semibold text-red-50 sm:text-4xl">{title}</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Production-grade freight control surface for dispatch, fleet visibility, and exception response.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Pill tone="success">Systems Armed</Pill>
              <Button className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-100 shadow-[0_0_30px_rgba(255,40,0,0.15)] hover:bg-red-500/15">
                <ScanLine className="mr-2 inline h-4 w-4" />
                Track Load
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-red-500/25 bg-black/50 px-4 py-2 text-red-100 hover:bg-red-500/10 hover:text-red-50"
              >
                <Bell className="mr-2 inline h-4 w-4" />
                Alert Center
              </Button>
            </div>
          </motion.div>

          <div className="grid gap-3 pb-6 lg:hidden">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = page === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  type="button"
                  className={`flex items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition ${active ? "border-red-400/35 bg-red-500/14 text-red-50" : "border-red-500/10 bg-black/40 text-zinc-400"}`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-red-300" : "text-zinc-500"}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
            >
              {page === "overview" && <OverviewPage selectedLoad={selectedLoad} setSelectedLoad={setSelectedLoad} />}
              {page === "loads" && <LoadsPage selectedLoad={selectedLoad} setSelectedLoad={setSelectedLoad} />}
              {page === "fleet" && <FleetPage />}
              {page === "command" && <CommandPage />}
              {page === "settings" && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const [screen, setScreen] = useState<"home" | "signin" | "register" | "app">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = (next: "home" | "signin" | "register" | "app") => {
    setScreen(next);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="relative min-h-screen overflow-hidden">
        <Backdrop />

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            >
              <div className="absolute right-4 top-4 w-[280px] rounded-[28px] border border-red-500/20 bg-black/90 p-4 shadow-[0_0_32px_rgba(255,45,0,0.16)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogoMark />
                    <span className="font-semibold text-red-50">Menu</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} type="button" className="text-zinc-400">
                    Close
                  </button>
                </div>
                <div className="space-y-2">
                  {screen === "app" ? (
                    nav.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-[18px] border border-red-500/10 bg-black/40 px-4 py-3 text-left text-zinc-300"
                      >
                        <item.icon className="h-4 w-4 text-red-300" />
                        {item.label}
                      </button>
                    ))
                  ) : (
                    <>
                      <button
                        onClick={() => navigate("signin")}
                        type="button"
                        className="w-full rounded-[18px] border border-red-500/10 bg-black/40 px-4 py-3 text-left text-zinc-300"
                      >
                        Sign in
                      </button>
                      <button
                        onClick={() => navigate("register")}
                        type="button"
                        className="w-full rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-red-100"
                      >
                        Start free trial
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 min-h-screen">
          {screen === "home" && <LandingPage onNavigate={navigate} />}
          {screen === "signin" && (
            <div className="relative min-h-screen">
              <SiteHeader onNavigate={navigate} onOpenMenu={() => setMobileMenuOpen(true)} />
              <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="grid items-center gap-10 xl:grid-cols-[0.95fr_1.05fr]">
                  <AuthCard mode="signin" onSuccess={() => navigate("app")} onSwitch={() => navigate("register")} />
                  <ShellCard title="Access Layer" action={<Pill tone="success">Verified</Pill>}>
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-red-500/15 bg-black/45 p-5">
                        <p className="font-semibold text-red-50">Role-based access</p>
                        <p className="mt-2 text-sm text-zinc-400">
                          Dispatch, operations, and admin roles map to different command surfaces and controls.
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-red-500/15 bg-black/45 p-5">
                        <p className="font-semibold text-red-50">Audit visibility</p>
                        <p className="mt-2 text-sm text-zinc-400">
                          Operator actions, scan events, and escalation workflows should be recorded end to end.
                        </p>
                      </div>
                      <MobileMockup selectedLoad={loads[0]} />
                    </div>
                  </ShellCard>
                </div>
              </div>
            </div>
          )}
          {screen === "register" && (
            <div className="relative min-h-screen">
              <SiteHeader onNavigate={navigate} onOpenMenu={() => setMobileMenuOpen(true)} />
              <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="grid items-center gap-10 xl:grid-cols-[0.95fr_1.05fr]">
                  <AuthCard mode="register" onSuccess={() => navigate("app")} onSwitch={() => navigate("signin")} />
                  <ShellCard title="Operator Buildout" action={<Pill tone="warning">Provisioning</Pill>}>
                    <div className="grid gap-4 md:grid-cols-2">
                      {operatorBuildoutCards.map(([Icon, title, copy]) => (
                        <div key={title} className="rounded-[24px] border border-red-500/15 bg-black/45 p-5">
                          <div className="w-fit rounded-2xl border border-red-500/20 bg-red-500/10 p-2.5 text-red-300">
                            <Icon className="h-4 w-4" />
                          </div>
                          <p className="mt-4 font-semibold text-red-50">{title}</p>
                          <p className="mt-2 text-sm text-zinc-400">{copy}</p>
                        </div>
                      ))}
                    </div>
                  </ShellCard>
                </div>
              </div>
            </div>
          )}
          {screen === "app" && <AppWorkspace onNavigate={navigate} />}
        </div>
      </div>
    </div>
  );
}
