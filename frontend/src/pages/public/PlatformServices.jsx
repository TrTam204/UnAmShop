import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { servicesAPI, formatWalletBalance } from '../../services/api';
import PlatformIcon from '../../components/platform/PlatformIcon';
import { Button, Card, PageLoader } from '../../components/ui';
import {
  HiArrowLeft,
  HiOutlineClock,
  HiOutlineLightningBolt,
  HiOutlineShoppingCart,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { platformPageConfig } from '../../config/platformAssets';

const PlatformServices = () => {
  const { platform } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const slug = platform?.toLowerCase() || '';
  const config = platformPageConfig[slug];
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(Boolean(config));
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let active = true;

    const fetchServices = async () => {
      if (!config) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await servicesAPI.getCatalog({ platformSlug: slug });
        if (active) {
          setServices(response.data.data || []);
        }
      } catch (error) {
        if (active) {
          setServices([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchServices();
    return () => {
      active = false;
    };
  }, [config, slug]);

  const categories = useMemo(
    () => [...new Map(services.map((service) => [service.categorySlug || service.category, service.category])).entries()],
    [services]
  );
  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((service) => (service.categorySlug || service.category) === selectedCategory);

  if (!config) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] px-4 py-20 text-center text-[var(--text-primary)]">
        <h1 className="text-2xl font-bold">Không tìm thấy nền tảng</h1>
        <Link to="/services" className="mt-4 inline-block font-semibold text-indigo-600 dark:text-indigo-300">
          Xem tất cả dịch vụ
        </Link>
      </div>
    );
  }

  const handleOrder = (serviceId) => {
    navigate(isAuthenticated ? `/new-order?service=${serviceId}` : '/login');
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--topbar-bg)] backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tight text-[var(--text-primary)]">ỪnAm <span className="text-indigo-600 dark:text-indigo-300">SHOP</span></Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard"><Button>Bảng điều khiển</Button></Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Đăng nhập</Link>
                <Link to="/register"><Button>Bắt đầu</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="page-shell py-8 md:py-12">
        <Link to="/services" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <HiArrowLeft className="h-5 w-5" /> Tất cả dịch vụ
        </Link>

        <section className="rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 p-6 text-white shadow-lg shadow-indigo-500/20 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <PlatformIcon slug={slug} fallback={config.fallback} size="lg" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-100">{config.subtitle}</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">{config.title}</h1>
              <p className="mt-4 max-w-2xl text-base text-indigo-100 md:text-lg">{config.description}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [HiOutlineLightningBolt, 'Bắt đầu nhanh', 'Chọn dịch vụ phù hợp từ catalog hiện có.'],
            [HiOutlineShieldCheck, 'Quản lý đơn dễ dàng', 'Theo dõi đơn hàng trong một tài khoản.'],
            [HiOutlineClock, 'Hỗ trợ khi cần', 'Liên hệ hỗ trợ khi cần giải đáp.'],
          ].map(([Icon, title, description]) => (
            <Card key={title} className="p-5">
              <Icon className="h-7 w-7 text-indigo-600 dark:text-indigo-300" />
              <h2 className="mt-4 font-bold text-[var(--text-primary)]">{title}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
            </Card>
          ))}
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Catalog</p>
              <h2 className="mt-2 text-3xl font-black text-[var(--text-primary)]">Dịch vụ {config.title}</h2>
              <p className="mt-2 text-[var(--text-secondary)]">Dữ liệu được tải trực tiếp từ catalog đang hoạt động.</p>
            </div>
            {categories.length > 1 && (
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-primary)]"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map(([categorySlug, categoryName]) => (
                  <option key={categorySlug} value={categorySlug}>{categoryName}</option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><PageLoader /></div>
          ) : filteredServices.length === 0 ? (
            <Card className="mt-6 p-10 text-center text-[var(--text-secondary)]">Hiện chưa có dịch vụ {config.title} nào.</Card>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {filteredServices.map((service) => (
                <Card key={service._id} className="flex flex-col justify-between gap-5 p-5 transition hover:-translate-y-0.5 hover:border-indigo-300">
                  <div className="flex gap-4">
                    <PlatformIcon slug={slug} fallback={config.fallback} size="sm" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-[var(--text-primary)]">{service.title}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{service.description || 'Dịch vụ đang hoạt động trên nền tảng này.'}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                        <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-1">Min: {service.minQuantity}</span>
                        <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-1">Max: {service.maxQuantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
                    <div>
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-300">{formatWalletBalance(service.pricePerUnit)} / 1</div>
                      <div className="text-xs text-[var(--text-muted)]">Đơn giá mỗi đơn vị</div>
                    </div>
                    <Button onClick={() => handleOrder(service._id)}>
                      <HiOutlineShoppingCart className="mr-2 h-5 w-5" /> Đặt đơn
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PlatformServices;
