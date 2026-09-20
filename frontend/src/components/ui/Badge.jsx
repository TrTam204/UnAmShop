const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-[var(--surface-strong)] text-[var(--text-secondary)]',
    primary: 'bg-[var(--primary-soft)] text-[var(--primary)]',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-300',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
