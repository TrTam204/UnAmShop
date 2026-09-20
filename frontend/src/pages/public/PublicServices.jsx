import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { servicesAPI } from '../../services/api';
import {
  HiOutlineSearch,
  HiOutlineShoppingCart,
  HiArrowLeft,
} from 'react-icons/hi';

const PublicServices = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        servicesAPI.getCatalog(),
        servicesAPI.getCatalogCategories(),
      ]);
      setServices(servicesRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOrder = (serviceId) => {
    if (isAuthenticated) {
      navigate(`/new-order?service=${serviceId}`);
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--topbar-bg)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-black text-[var(--text-primary)]">ỪnAm <span className="text-indigo-600 dark:text-indigo-300">SHOP</span></Link>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-2 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
                >
                  Bảng điều khiển
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-2 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
                  >
                    Bắt đầu
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="mb-4 inline-flex items-center text-indigo-100 hover:text-white">
            <HiArrowLeft className="w-5 h-5 mr-2" />
            Quay lại trang chủ
          </Link>
          <h1 className="text-4xl font-bold mb-4">Tất cả dịch vụ</h1>
          <p className="max-w-2xl text-xl text-indigo-100">
            Khám phá danh sách dịch vụ SMM đầy đủ với mức giá cạnh tranh.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] py-3 pl-10 pr-4 text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Không tìm thấy dịch vụ nào.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredServices.map((service) => (
              <div
                key={service._id}
                className="rounded-[20px] border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm transition-shadow hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-200">
                        {service.category}
                      </span>
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                      {service.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">{service.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-[var(--text-muted)]">
                      <span>Min: {service.minQuantity}</span>
                      <span>Max: {service.maxQuantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 8 }).format(Number(service.pricePerUnit || 0))}
                      </div>
                      <div className="text-sm text-[var(--text-muted)]">/ 1 đơn vị</div>
                    </div>
                    <button
                      onClick={() => handleOrder(service._id)}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-3 font-medium text-white transition hover:brightness-110"
                    >
                      <HiOutlineShoppingCart className="w-5 h-5" />
                      Đặt đơn
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 ỪnAm SHOP. Bản quyền thuộc về ỪnAm SHOP.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicServices;
