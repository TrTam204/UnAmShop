import { useState, useEffect } from 'react';
import { servicesAPI } from '../../services/api';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    rate: '',
    min: '',
    max: '',
    providerServiceId: '',
    isActive: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data.data);
    } catch (error) {
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        title: service.title,
        category: service.category,
        description: service.description || '',
        rate: service.rate.toString(),
        min: service.min.toString(),
        max: service.max.toString(),
        providerServiceId: service.providerServiceId,
        isActive: service.isActive,
      });
    } else {
      setEditingService(null);
      setFormData({
        title: '',
        category: '',
        description: '',
        rate: '',
        min: '',
        max: '',
        providerServiceId: '',
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...formData,
        rate: parseFloat(formData.rate),
        min: parseInt(formData.min),
        max: parseInt(formData.max),
      };

      if (editingService) {
        await servicesAPI.update(editingService._id, data);
        toast.success('Cập nhật dịch vụ thành công');
      } else {
        await servicesAPI.create(data);
        toast.success('Tạo dịch vụ thành công');
      }

      setModalOpen(false);
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa dịch vụ này không?')) return;

    try {
      await servicesAPI.delete(id);
      toast.success('Xóa dịch vụ thành công');
      fetchServices();
    } catch (error) {
      toast.error('Xóa dịch vụ thất bại');
    }
  };

  const columns = [
    {
      key: '_id',
      title: 'ID',
      render: (id) => <span className="font-mono text-xs">{id.slice(-6)}</span>,
    },
    {
      key: 'title',
      title: 'Tiêu đề',
      render: (title) => <span className="font-medium">{title}</span>,
    },
    { key: 'category', title: 'Category' },
    {
      key: 'rate',
      title: 'Giá',
      render: (rate) => `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(rate || 0))}/1000`,
    },
    {
      key: 'min',
      title: 'Tối thiểu/Tối đa',
      render: (_, row) => `${row.min} / ${row.max}`,
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      render: (isActive) => (
        <Badge variant={isActive ? 'success' : 'danger'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          >
            <HiOutlinePencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <HiOutlineTrash className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý dịch vụ</h1>
          <p className="text-gray-500 mt-1">Thêm, sửa hoặc xóa dịch vụ</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <HiOutlinePlus className="w-5 h-5 mr-2" />
          Thêm dịch vụ
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={services}
          emptyMessage="Không tìm thấy dịch vụ nào"
        />
      </Card>

      {/* Service Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tiêu đề"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Danh mục"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Instagram Followers"
            required
          />
          <Input
            label="Mô tả"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Giá (mỗi 1000)"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              required
            />
            <Input
              label="Tối thiểu"
              type="number"
              value={formData.min}
              onChange={(e) => setFormData({ ...formData, min: e.target.value })}
              required
            />
            <Input
              label="Tối đa"
              type="number"
              value={formData.max}
              onChange={(e) => setFormData({ ...formData, max: e.target.value })}
              required
            />
          </div>
          <Input
            label="Mã dịch vụ nhà cung cấp"
            value={formData.providerServiceId}
            onChange={(e) =>
              setFormData({ ...formData, providerServiceId: e.target.value })
            }
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingService ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminServices;
