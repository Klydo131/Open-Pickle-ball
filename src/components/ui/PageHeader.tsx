import { LogoMark } from './LogoMark';

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/** Standard top-of-page header for the inner tabs. */
export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <header className="mb-5">
      <div className="mb-4 flex items-center justify-between">
        <LogoMark size={30} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase italic leading-none tracking-tight text-white">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
