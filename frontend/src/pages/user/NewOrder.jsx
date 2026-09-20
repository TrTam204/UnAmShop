import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { servicesAPI, ordersAPI, formatWalletBalance } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Select, PageLoader } from '../../components/ui';
import PlatformIcon from '../../components/platform/PlatformIcon';
import toast from 'react-hot-toast';

const NewOrder = () => {
  const { walletBalanceVnd, refreshWalletBalance } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceParam = searchParams.get('service');
  const deepLinkAppliedRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submitKeyRef = useRef(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    serviceId: '',
    link: '',
    quantity: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (!serviceParam || !services.length || deepLinkAppliedRef.current === serviceParam) {
      return;
    }

    const service = services.find((item) => item._id === serviceParam);
    if (!service) {
      return;
    }

    deepLinkAppliedRef.current = serviceParam;
    setSelectedCategory(service.category);
    handleServiceChange(service._id);
  }, [serviceParam, services]);

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data.data);
      const uniqueCategories = [...new Set(response.data.data.map((s) => s.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = selectedCategory
    ? services.filter((s) => s.category === selectedCategory)
    : services;

  const handleServiceChange = (serviceId) => {
    const service = services.find((s) => s._id === serviceId);
    setSelectedService(service);
    setFormData((prev) => ({
      ...prev,
      serviceId,
      quantity: service?.min?.toString() || '',
    }));
  };

  const calculateTotal = () => {
    if (!selectedService || !formData.quantity) return 0;
    return Math.ceil(selectedService.rate * parseInt(formData.quantity));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.serviceId || !formData.link || !formData.quantity) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity < selectedService.min || quantity > selectedService.max) {
      toast.error(`Số lượng phải nằm trong khoảng ${selectedService.min} đến ${selectedService.max}`);
      return;
    }

    const total = calculateTotal();
    if (walletBalanceVnd === null || walletBalanceVnd < total) {
      toast.error('Số dư không đủ. Vui lòng nạp tiền.');
      return;
    }

    const normalizedLink = formData.link.trim();
    const nextSubmitKey = submitKeyRef.current ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    submitKeyRef.current = nextSubmitKey;
    setSubmitting(true);

    try {
      await ordersAPI.create({
        serviceId: formData.serviceId,
        link: normalizedLink,
        quantity,
        idempotencyKey: nextSubmitKey,
      });

      await refreshWalletBalance();

      toast.success('Đặt đơn thành công!');
      submitKeyRef.current = null;
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Đặt đơn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đơn mới</h1>
        <p className="text-gray-500 mt-1">Đặt một đơn dịch vụ SMM mới</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <Select
            label="Danh mục"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedService(null);
              setFormData((prev) => ({ ...prev, serviceId: '', quantity: '' }));
            }}
            placeholder="Chọn danh mục"
            options={categories.map((cat) => ({ value: cat, label: cat }))}
          />

          {/* Service */}
          <Select
            label="Dịch vụ"
            value={formData.serviceId}
            onChange={(e) => handleServiceChange(e.target.value)}
            placeholder="Chọn dịch vụ"
            options={filteredServices.map((service) => ({
              value: service._id,
              label: `${service.title} - ${formatWalletBalance(service.rate)} / 1`,
            }))}
          />

          {/* Service Details */}
          {selectedService && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-2 flex items-center gap-3">
                <PlatformIcon slug={selectedService.platformSlug} name={selectedService.platform} size="sm" fallback={selectedService.platform?.slice(0, 2)} />
                <h3 className="font-medium text-gray-900">{selectedService.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Giá:</span>
                  <span className="ml-2 font-medium">{formatWalletBalance(selectedService.rate)} / 1</span>
                </div>
                <div>
                  <span className="text-gray-500">Tối thiểu:</span>
                  <span className="ml-2 font-medium">{selectedService.min}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tối đa:</span>
                  <span className="ml-2 font-medium">{selectedService.max}</span>
                </div>
              </div>
            </div>
          )}

          {/* Link */}
          <Input
            label="Liên kết"
            type="url"
            placeholder="Nhập liên kết mục tiêu"
            value={formData.link}
            onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
            required
          />

          {/* Quantity */}
          <Input
            label="Số lượng"
            type="number"
            placeholder={`Nhập số lượng (${selectedService?.min || 0} - ${selectedService?.max || 0})`}
            value={formData.quantity}
            onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
            min={selectedService?.min}
            max={selectedService?.max}
            required
          />

          {/* Order Summary */}
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Tổng tiền</p>
                <p className="text-2xl font-bold text-primary-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(calculateTotal() || 0))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Số dư của bạn</p>
                <p className={`text-lg font-semibold ${walletBalanceVnd !== null && walletBalanceVnd >= calculateTotal() ? 'text-green-600' : 'text-red-600'}`}>
                  {formatWalletBalance(walletBalanceVnd)}
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            loading={submitting}
            className="w-full"
            size="lg"
            disabled={!selectedService || walletBalanceVnd === null || calculateTotal() > walletBalanceVnd}
          >
            Đặt đơn
          </Button>

          {walletBalanceVnd !== null && calculateTotal() > walletBalanceVnd && (
            <p className="text-center text-sm text-red-500">
              Số dư không đủ.{' '}
              <a href="/add-funds" className="underline">
                Nạp tiền
              </a>
            </p>
          )}
        </form>
      </Card>
    </div>
  );
};

export default NewOrder;
