const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`card-surface rounded-[18px] ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            {title && <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 text-[var(--text-secondary)]">{children}</div>
    </div>
  );
};

export default Card;
