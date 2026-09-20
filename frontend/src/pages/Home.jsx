import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineCash,
  HiOutlineSupport,
  HiOutlineChartBar,
  HiOutlineUserGroup,
} from 'react-icons/hi';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: HiOutlineLightningBolt,
      title: 'Giao hàng tức thời',
      description: 'Nhận đơn nhanh chóng nhờ hệ thống tự động hóa hiện đại.',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Chất lượng cao',
      description: 'Dịch vụ premium giúp tăng trưởng mạng xã hội bền vững.',
    },
    {
      icon: HiOutlineCash,
      title: 'Giá hợp lý',
      description: 'Mức giá cạnh tranh cùng tỷ lệ tốt nhất thị trường.',
    },
    {
      icon: HiOutlineSupport,
      title: 'Hỗ trợ 24/7',
      description: 'Hỗ trợ khách hàng mọi lúc mọi nơi cho mọi thắc mắc.',
    },
    {
      icon: HiOutlineChartBar,
      title: 'Theo dõi thời gian thực',
      description: 'Theo dõi đơn hàng theo thời gian thực với cập nhật rõ ràng.',
    },
    {
      icon: HiOutlineUserGroup,
      title: 'Được tin tưởng bởi hàng nghìn khách hàng',
      description: 'Tham gia cùng hàng nghìn khách hàng đã tăng trưởng thành công.',
    },
  ];

  const services = [
    { name: 'Instagram Followers', price: '10.000đ', per: '1000' },
    { name: 'YouTube Views', price: '15.000đ', per: '1000' },
    { name: 'Facebook Likes', price: '8.000đ', per: '1000' },
    { name: 'Twitter Followers', price: '12.000đ', per: '1000' },
    { name: 'Telegram Members', price: '20.000đ', per: '1000' },
    { name: 'TikTok Followers', price: '14.000đ', per: '1000' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="brand-wordmark text-2xl tracking-tight">
            ỪnAm <span>SHOP</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                Bảng điều khiển
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                >
                  Bắt đầu
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <section className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 px-4 py-20 text-white">
          <div className="mx-auto max-w-7xl text-center">
            <div className="mb-5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-sky-50 backdrop-blur-sm">
              SMM chuyên nghiệp • 24/7
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              Tăng trưởng mạng xã hội
              <span className="mt-2 block text-sky-100">của bạn ngay hôm nay</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-sky-100 md:text-xl">
              ỪnAm SHOP là nền tảng SMM hàng đầu cho mọi nhu cầu quảng bá mạng xã hội. Nhận follower, like,
              view và nhiều dịch vụ khác với mức giá ưu đãi.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to={isAuthenticated ? '/new-order' : '/register'}
                className="rounded-xl bg-white px-8 py-3 text-base font-semibold text-sky-700 shadow-lg transition hover:bg-slate-100"
              >
                Đặt đơn ngay
              </Link>
              <Link
                to="/services"
                className="rounded-xl border border-white/40 bg-white/5 px-8 py-3 text-base font-semibold text-white transition hover:bg-white hover:text-sky-700"
              >
                Xem dịch vụ
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                ['50K+', 'Khách hàng hài lòng'],
                ['1M+', 'Đơn đã hoàn thành'],
                ['100+', 'Dịch vụ có sẵn'],
                ['24/7', 'Hỗ trợ khách hàng'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm">
                  <div className="text-3xl font-black text-sky-600 md:text-4xl">{value}</div>
                  <div className="mt-2 text-sm text-slate-600">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Vì sao chọn chúng tôi?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                Chúng tôi mang đến dịch vụ SMM tốt nhất với giao hàng tức thời, tính minh bạch và hỗ trợ nhanh chóng.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Dịch vụ phổ biến
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                Khám phá các dịch vụ SMM được ưa chuộng nhất với mức giá cạnh tranh.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-sky-200 hover:bg-white hover:shadow-md">
                  <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-sky-600">{service.price}</span>
                    <span className="text-sm text-slate-500">/ {service.per}</span>
                  </div>
                  <Link
                    to={isAuthenticated ? '/new-order' : '/register'}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    Đặt đơn ngay
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link to="/services" className="text-base font-semibold text-sky-600 underline-offset-4 hover:underline">
                Xem tất cả dịch vụ →
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 px-4 py-20 text-white">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              Sẵn sàng tăng trưởng mạng xã hội của bạn?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sky-100">
              Tham gia cùng hàng nghìn khách hàng đã hài lòng và bắt đầu tăng trưởng ngay hôm nay.
            </p>
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="mt-8 inline-flex rounded-xl bg-white px-8 py-3 text-base font-bold text-sky-700 shadow-lg transition hover:bg-slate-100"
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 px-4 py-10 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div>
            <div className="brand-wordmark text-2xl text-white">
              ỪnAm <span>SHOP</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Đối tác tin cậy cho việc tăng trưởng và quảng bá mạng xã hội.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-base font-semibold text-white">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white">Trang chủ</Link></li>
              <li><Link to="/services" className="hover:text-white">Dịch vụ</Link></li>
              <li><Link to="/login" className="hover:text-white">Đăng nhập</Link></li>
              <li><Link to="/register" className="hover:text-white">Đăng ký</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-base font-semibold text-white">Thông tin</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-white">Chính sách bảo mật</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-white">Điều khoản sử dụng</Link></li>
              <li><Link to="/refund-policy" className="hover:text-white">Chính sách hoàn tiền</Link></li>
              <li><Link to="/contact" className="hover:text-white">Liên hệ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-base font-semibold text-white">Hotline</h4>
            <ul className="space-y-2 text-sm">
              <li>support@unamshop.com</li>
              <li>+84 912 345 678</li>
              <li>Hỗ trợ 24/7</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
          © 2025 ỪnAm SHOP. Bản quyền thuộc về ỪnAm SHOP.
        </div>
      </footer>
    </div>
  );
};

export default Home;
