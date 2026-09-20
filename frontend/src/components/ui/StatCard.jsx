const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => {
  const colors = {
    primary: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-300',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  };

  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">{title}</p>
          <p className="mt-2 text-[28px] font-bold tracking-tight text-[var(--text-primary)]">{value}</p>
          {trend && (
            <div className={`mt-2 flex items-center text-sm ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
