const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-4">
      <div className="absolute inset-0 z-[90] bg-[var(--overlay)] transition-opacity" onClick={onClose} />

        <div
          className={`relative z-[100] my-4 max-h-[90vh] w-full ${sizes[size]} overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] text-left shadow-xl transition-all`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
            <button onClick={onClose} className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4">{children}</div>
        </div>
    </div>
  );
};

export default Modal;
