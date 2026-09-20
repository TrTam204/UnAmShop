import { useState, useEffect } from 'react';
import { supabaseAdminAPI } from '../../services/api';
import {
  Card,
  Button,
  Input,
  Table,
  Modal,
  Badge,
  PageLoader,
} from '../../components/ui';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminServices = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providerServices, setProviderServices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    sellingRateVnd: '',
    minQuantity: '',
    maxQuantity: '',
    supportsRefill: false,
    supportsCancel: false,
    primaryProviderServiceId: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchServicesAndMetadata();
  }, []);

  const fetchServicesAndMetadata = async () => {
    setLoading(true);
    try {
      const [serviceRows, categoryRows, providerServiceRows] = await Promise.all([
        supabaseAdminAPI.listServices({ limit: 100, offset: 0 }),
        supabaseAdminAPI.listCategories(),
        supabaseAdminAPI.listProviderServices(),
      ]);

      const normalizedServices = (serviceRows || []).map((service) => ({
        _id: service.id,
        id: service.id,
        name: service.name,
        description: service.description || '',
        categoryId: service.category_id,
        categoryName: service.category_name || 'Không xác định',
        sellingRateVnd: Number(service.selling_rate_vnd || 0),
        minQuantity: service.min_quantity,
        maxQuantity: service.max_quantity,
        supportsRefill: Boolean(service.supports_refill),
        supportsCancel: Boolean(service.supports_cancel),
        primaryProviderServiceId: service.primary_provider_service_id,
        isActive: Boolean(service.is_active),
        sortOrder: service.sort_order,
      }));

      setServices(normalizedServices);
      setCategories((categoryRows || []).map((category) => ({
        id: category.id,
        label: `${category.platforms?.name || category.platform_name || 'Nền tảng'} — ${category.name}`,
        value: category.id,
      })));
      setProviderServices((providerServiceRows || []).map((providerService) => ({
        id: providerService.id,
        label: `${providerService.providers?.name || providerService.provider_name || 'Provider'} — ${providerService.provider_service_id} — ${providerService.raw_name || 'Tên gốc'}`,
        value: providerService.id,
      })));
    } catch (error) {
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (service) => {
    if (!window.confirm(`Ngừng dịch vụ "${service.name}"?`)) {
      return;
    }

    try {
      await supabaseAdminAPI.updateService({
        id: service.id,
        categoryId: service.categoryId,
        name: service.name,
        description: service.description,
        sellingRateVnd: service.sellingRateVnd,
        minQuantity: service.minQuantity,
        maxQuantity: service.maxQuantity,
        supportsRefill: service.supportsRefill,
        supportsCancel: service.supportsCancel,
        primaryProviderServiceId: service.primaryProviderServiceId,
        isActive: false,
        sortOrder: service.sortOrder,
      });
      toast.success('Đã ngừng dịch vụ');
      await fetchServicesAndMetadata();
    } catch (error) {
      toast.error(error.message || 'Không thể ngừng dịch vụ');
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        categoryId: service.categoryId,
        description: service.description || '',
        sellingRateVnd: String(service.sellingRateVnd),
        minQuantity: String(service.minQuantity),
        maxQuantity: String(service.maxQuantity),
        supportsRefill: Boolean(service.supportsRefill),
        supportsCancel: Boolean(service.supportsCancel),
        primaryProviderServiceId: service.primaryProviderServiceId || '',
        isActive: Boolean(service.isActive),
        sortOrder: service.sortOrder || 0,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        categoryId: '',
        description: '',
        sellingRateVnd: '',
        minQuantity: '',
        maxQuantity: '',
        supportsRefill: false,
        supportsCancel: false,
        primaryProviderServiceId: '',
        isActive: true,
        sortOrder: 0,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const minQuantity = Number(formData.minQuantity);
      const maxQuantity = Number(formData.maxQuantity);
      const sellingRateVnd = Number(formData.sellingRateVnd);
      const sortOrder = Number(formData.sortOrder || 0);

      const data = {
        categoryId: formData.categoryId,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        sellingRateVnd,
        minQuantity,
        maxQuantity,
        supportsRefill: Boolean(formData.supportsRefill),
        supportsCancel: Boolean(formData.supportsCancel),
        primaryProviderServiceId: formData.primaryProviderServiceId || null,
        isActive: Boolean(formData.isActive),
        sortOrder,
      };

      if (!data.categoryId) {
        toast.error('Vui lòng chọn danh mục');
        return;
      }

      if (!data.name) {
        toast.error('Vui lòng nhập tên dịch vụ');
        return;
      }

      if (Number.isNaN(sellingRateVnd) || sellingRateVnd <= 0) {
        toast.error('Đơn giá phải lớn hơn 0');
        return;
      }

      if (!Number.isFinite(minQuantity) || !Number.isFinite(maxQuantity) || minQuantity <= 0 || maxQuantity < minQuantity) {
        toast.error('Khoảng số lượng không hợp lệ');
        return;
      }

      if (editingService) {
        await supabaseAdminAPI.updateService({
          id: editingService.id,
          ...data,
        });
        toast.success('Cập nhật dịch vụ thành công');
      } else {
        await supabaseAdminAPI.createService(data);
        toast.success('Tạo dịch vụ thành công');
      }

      setModalOpen(false);
      await fetchServicesAndMetadata();
    } catch (error) {
      toast.error(error.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: '_id',
      title: 'ID',
      render: (id) => <span className="font-mono text-xs">{String(id || '').slice(-6)}</span>,
    },
    {
      key: 'name',
      title: 'Tên dịch vụ',
      render: (name) => <span className="font-medium">{name}</span>,
    },
    { key: 'categoryName', title: 'Danh mục' },
    {
      key: 'sellingRateVnd',
      title: 'Đơn giá',
      render: (value) => `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 2 }).format(Number(value || 0))}`,
    },
    {
      key: 'minQuantity',
      title: 'Tối thiểu/Tối đa',
      render: (_, row) => `${row.minQuantity} / ${row.maxQuantity}`,
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      render: (isActive) => (
        <Badge variant={isActive ? 'success' : 'danger'}>{isActive ? 'Hoạt động' : 'Không hoạt động'}</Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => handleOpenModal(row)} className="rounded p-1 text-blue-600 hover:bg-blue-50">
            <HiOutlinePencil className="h-5 w-5" />
          </button>
          {row.isActive && (
            <button onClick={() => handleDeactivate(row)} className="rounded p-1 text-red-600 hover:bg-red-50" title="Ngừng dịch vụ">
              <HiOutlineTrash className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý dịch vụ</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Thêm, sửa dịch vụ</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <HiOutlinePlus className="mr-2 h-5 w-5" />
          Thêm dịch vụ
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={services} emptyMessage="Không tìm thấy dịch vụ nào" />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Tên dịch vụ" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Danh mục</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </div>

          <Input label="Mô tả" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input label="Đơn giá (₫ / 1 đơn vị)" type="number" step="0.00000001" min="0.00000001" value={formData.sellingRateVnd} onChange={(e) => setFormData({ ...formData, sellingRateVnd: e.target.value })} required />
            <Input label="Tối thiểu" type="number" min="1" value={formData.minQuantity} onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })} required />
            <Input label="Tối đa" type="number" min="1" value={formData.maxQuantity} onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })} required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Dịch vụ nhà cung cấp / định tuyến</label>
            <select
              value={formData.primaryProviderServiceId}
              onChange={(e) => setFormData({ ...formData, primaryProviderServiceId: e.target.value })}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">Chưa định tuyến</option>
              {providerServices.map((providerService) => (
                <option key={providerService.id} value={providerService.id}>{providerService.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 text-sm text-[var(--text-primary)]">
              <input type="checkbox" checked={formData.supportsRefill} onChange={(e) => setFormData({ ...formData, supportsRefill: e.target.checked })} />
              Hỗ trợ refill
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 text-sm text-[var(--text-primary)]">
              <input type="checkbox" checked={formData.supportsCancel} onChange={(e) => setFormData({ ...formData, supportsCancel: e.target.checked })} />
              Hỗ trợ hủy
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 text-sm text-[var(--text-primary)]">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
              Hoạt động
            </label>
          </div>

          <Input label="Thứ tự" type="number" min="0" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={submitting}>
              {editingService ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminServices;
