import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Card,
  Button,
  Input,
  Table,
  Modal,
  Badge,
  Pagination,
  PageLoader,
} from '../../components/ui';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    walletBalance: '',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers({
        page: pagination.page,
        limit: 20,
        search: search || undefined,
      });
      setUsers(response.data.data);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total,
      });
    } catch (error) {
      toast.error('Không thể lấy dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleOpenModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      walletBalance: user.walletBalance.toString(),
      isActive: user.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await adminAPI.updateUser(editingUser._id, {
        ...formData,
        walletBalance: parseFloat(formData.walletBalance),
      });
      toast.success('Cập nhật người dùng thành công');
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cập nhật người dùng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này không?')) return;

    try {
      await adminAPI.deleteUser(id);
      toast.success('Xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Xóa người dùng thất bại');
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Người dùng',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {row.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Vai trò',
      render: (role) => (
        <Badge variant={role === 'admin' ? 'primary' : 'default'}>
          {role === 'admin' ? 'Quản trị' : 'Người dùng'}
        </Badge>
      ),
    },
    {
      key: 'walletBalance',
      title: 'Số dư',
      render: (balance) => (
        <span className="font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(balance || 0))}</span>
      ),
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
      key: 'createdAt',
      title: 'Tham gia',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: 'Actions',
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

  return (
    <div className="fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500 mt-1">Xem và quản lý tài khoản người dùng</p>
        </div>
        <form onSubmit={handleSearch} className="mt-4 md:mt-0 flex gap-2">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button type="submit">Tìm kiếm</Button>
        </form>
      </div>

      <Card>
        {loading ? (
          <PageLoader />
        ) : (
          <>
            <Table columns={columns} data={users} emptyMessage="Không tìm thấy người dùng nào" />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          </>
        )}
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Chỉnh sửa người dùng"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Họ và tên"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị</option>
              </select>
            </div>
            <Input
              label="Số dư ví"
              type="number"
              step="0.01"
              value={formData.walletBalance}
              onChange={(e) =>
                setFormData({ ...formData, walletBalance: e.target.value })
              }
              required
            />
          </div>
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
              Tài khoản đang hoạt động
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={submitting}>
              Update User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
