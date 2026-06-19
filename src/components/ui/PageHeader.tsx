import { LogoMark } from './LogoMark';

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/** Standard top-of-page header for the inner tabs. */
export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <header className="mb-5 lg:mb-7">
      {/* mobile-only logo; desktop shows it in the sidebar */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <LogoMark size={30} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase italic leading-none tracking-tight text-white lg:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted lg:text-base">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
