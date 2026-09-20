import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowLeft, HiOutlineBookOpen, HiOutlineCash, HiOutlineChatAlt2, HiOutlineQuestionMarkCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const supportCards = [
  {
    title: 'Hướng dẫn tạo đơn',
    description: 'Các bước nhanh để tạo đơn hàng và theo dõi tiến độ hiệu quả.',
    icon: HiOutlineBookOpen,
    to: '/new-order',
    loggedOutTo: '/login',
  },
  {
    title: 'Hướng dẫn nạp tiền',
    description: 'Thực hiện nạp tiền với VietQR hoặc hỗ trợ thủ công qua Zalo.',
    icon: HiOutlineCash,
    to: '/add-funds',
    loggedOutTo: '/login',
  },
  {
    title: 'Câu hỏi thường gặp',
    description: 'Đáp án nhanh cho các thắc mắc phổ biến trong quá trình vận hành.',
    icon: HiOutlineQuestionMarkCircle,
    target: 'faq',
  },
  {
    title: 'Liên hệ hỗ trợ',
    description: 'Gửi yêu cầu hỗ trợ và nhận phản hồi nhanh từ đội ngũ quản trị.',
    icon: HiOutlineChatAlt2,
    target: 'contact-form',
  },
];

const faqItems = [
  { q: 'Làm sao để tạo đơn?', a: 'Chọn nền tảng, chọn dịch vụ phù hợp, nhập liên kết và số lượng, sau đó xác nhận đơn và kiểm tra số dư ví trước khi đặt.' },
  { q: 'Tôi nạp tiền bằng cách nào?', a: 'Bạn có thể tạo yêu cầu nạp tiền qua VietQR hoặc liên hệ quản trị qua Zalo để xác nhận thủ công.' },
  { q: 'Vì sao yêu cầu nạp tiền đang chờ duyệt?', a: 'Yêu cầu đang chờ quản trị xác nhận giao dịch theo thời gian thực. Sau khi được duyệt, số dư ví sẽ cập nhật tự động.' },
  { q: 'Có thể hủy yêu cầu nạp tiền không?', a: 'Nếu trạng thái vẫn đang chờ duyệt, bạn có thể hủy yêu cầu trực tiếp từ danh sách nạp tiền.' },
  { q: 'Vì sao một dịch vụ chưa thể đặt?', a: 'Dịch vụ có thể chưa được bật, chưa định tuyến nhà cung cấp, hoặc không phù hợp với số lượng bạn nhập. Hãy kiểm tra lại catalog hoặc liên hệ hỗ trợ.' },
];

const Contact = () => {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);

  const backLink = isAuthenticated ? '/dashboard' : '/';
  const backText = isAuthenticated ? 'Về bảng điều khiển' : 'Quay lại';

  const supportLink = useMemo(() => {
    if (!isAuthenticated) {
      return '/login';
    }

    return '/dashboard';
  }, [isAuthenticated]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const mailto = `mailto:support@unamshop.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Họ và tên: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
    window.location.href = mailto;
    setLoading(false);
  };

  const handleCardClick = (card) => {
    if (card.target === 'faq') {
      document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (card.target === 'contact-form') {
      document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    window.location.href = isAuthenticated ? card.to : card.loggedOutTo;
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="page-shell py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to={backLink} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <HiArrowLeft className="h-4 w-4" />
            {backText}
          </Link>
          {!isAuthenticated && (
            <Link to="/login" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border)]">
              Đăng nhập
            </Link>
          )}
          {isAuthenticated && (
            <Link to={supportLink} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border)]">
              Về bảng điều khiển
            </Link>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {supportCards.map(({ title, description, icon: Icon, ...card }) => (
            <button
              key={title}
              type="button"
              onClick={() => handleCardClick(card)}
              className="cursor-pointer rounded-[22px] border border-[var(--border)] bg-[var(--card-bg)] p-5 text-left shadow-[var(--shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-300">
                Xem thêm
                <span aria-hidden="true">→</span>
              </span>
            </button>
          ))}
        </div>

        <div id="faq-section" className="mt-8 rounded-[28px] border border-[var(--border)] bg-[var(--card-bg)] p-5 md:p-6">
          <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Câu hỏi thường gặp</div>
          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = expandedIndex === index;
              return (
                <div key={item.q} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[var(--text-primary)]"
                  >
                    <span className="font-medium">{item.q}</span>
                    <span className="text-lg text-[var(--text-muted)]">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && <p className="px-4 pb-4 text-sm leading-6 text-[var(--text-secondary)]">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div id="contact-form" className="mt-8 rounded-[28px] border border-[var(--border)] bg-[var(--card-bg)] p-5 md:p-6">
          <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Liên hệ hỗ trợ</div>
          <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span>Hoặc liên hệ qua Zalo:</span>
            <a href="https://zalo.me/0325620501" target="_blank" rel="noreferrer" className="font-medium text-indigo-600 dark:text-indigo-300">0325620501</a>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Họ và tên</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-indigo-500 focus:outline-none"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-indigo-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Chủ đề</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-indigo-500 focus:outline-none"
                placeholder="Mô tả vấn đề của bạn"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Tin nhắn</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-indigo-500 focus:outline-none"
                placeholder="Hãy cho chúng tôi biết thêm về yêu cầu của bạn..."
              />
            </div>
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
