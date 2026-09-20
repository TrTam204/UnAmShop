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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary-600">ỪnAm SHOP</Link>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Bảng điều khiển
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
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
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center text-primary-200 hover:text-white mb-4">
            <HiArrowLeft className="w-5 h-5 mr-2" />
            Quay lại trang chủ
          </Link>
          <h1 className="text-4xl font-bold mb-4">Tất cả dịch vụ</h1>
          <p className="text-xl text-primary-100 max-w-2xl">
            Khám phá danh sách dịch vụ SMM đầy đủ với mức giá cạnh tranh.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                        {service.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {service.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{service.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Min: {service.minQuantity}</span>
                      <span>Max: {service.maxQuantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(service.pricePerUnit || 0))}
                      </div>
                      <div className="text-gray-500 text-sm">mỗi 1000</div>
                    </div>
                    <button
                      onClick={() => handleOrder(service._id)}
                      className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
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
