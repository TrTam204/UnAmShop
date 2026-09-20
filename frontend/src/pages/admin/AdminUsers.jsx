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
import { HiOutlinePencil, HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'suspended', label: 'Tạm khóa' },
  { value: 'banned', label: 'Bị khóa' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const statusBadge = (status) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'suspended':
      return 'warning';
    case 'banned':
      return 'danger';
    default:
      return 'default';
  }
};

const statusText = (status) => {
  switch (status) {
    case 'active':
      return 'Hoạt động';
    case 'suspended':
      return 'Tạm khóa';
    case 'banned':
      return 'Bị khóa';
    default:
      return status || 'Không xác định';
  }
};

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await supabaseAdminAPI.listProfiles({
        search: search || undefined,
        role: roleFilter === 'all' ? null : roleFilter,
        status: statusFilter === 'all' ? null : statusFilter,
        limit: 100,
        offset: 0,
      });
      setUsers((response || []).map((user) => ({
        _id: user.user_id,
        id: user.user_id,
        name: user.full_name || user.email,
        email: user.email,
        role: user.role,
        status: user.status,
        walletBalance: Number(user.balance_vnd || 0),
        createdAt: user.created_at,
      })));
    } catch (error) {
      toast.error('Không thể lấy dữ liệu người dùng');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const handleOpenModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!editingUser) {
        return;
      }

      await supabaseAdminAPI.updateProfileAccess(editingUser._id, formData.role, formData.status);
      await supabaseAdminAPI.updateProfileDetails(editingUser._id, formData.name);
      toast.success('Cập nhật người dùng thành công');
      setModalOpen(false);
      await fetchUsers();
    } catch (error) {
      const safeMessage = error?.message || error?.response?.data?.error || 'Cập nhật người dùng thất bại';
      toast.error(safeMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const trimmedName = formData.name.trim();
      const trimmedEmail = formData.email.trim().toLowerCase();

      if (!trimmedName || !trimmedEmail) {
        toast.error('Vui lòng nhập họ tên và email');
        return;
      }

      await supabaseAdminAPI.inviteUser({
        full_name: trimmedName,
        email: trimmedEmail,
        role: formData.role,
        status: formData.status,
      });
      toast.success(`Đã gửi lời mời tới ${trimmedEmail}`);
      setInviteModalOpen(false);
      setFormData({ name: '', email: '', role: 'user', status: 'active' });
      await fetchUsers();
    } catch (error) {
      const safeMessage = error?.message || error?.response?.data?.error || 'Không thể gửi lời mời';
      toast.error(safeMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Người dùng',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
            {row.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">{row.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.email}</p>
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
      key: 'status',
      title: 'Trạng thái',
      render: (status) => <Badge variant={statusBadge(status)}>{statusText(status)}</Badge>,
    },
    {
      key: 'walletBalance',
      title: 'Số dư',
      render: (balance) => <span className="font-medium">{formatCurrency(balance)}</span>,
    },
    {
      key: 'createdAt',
      title: 'Tham gia',
      render: (date) => (date ? new Date(date).toLocaleDateString('vi-VN') : '—'),
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (_, row) => (
        <button
          onClick={() => handleOpenModal(row)}
          className="rounded p-1 text-blue-600 hover:bg-blue-50"
        >
          <HiOutlinePencil className="h-5 w-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý người dùng</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Danh sách, vai trò và trạng thái tài khoản</p>
        </div>
        <Button onClick={() => { setFormData({ name: '', email: '', role: 'user', status: 'active' }); setInviteModalOpen(true); }}>
          <HiOutlinePlus className="mr-2 h-5 w-5" />
          + Thêm người dùng
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo email hoặc họ tên..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] py-2.5 pl-10 pr-4 text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
          <div className="md:w-44">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="user">Người dùng</option>
              <option value="admin">Quản trị</option>
            </select>
          </div>
          <div className="md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="all">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? <PageLoader /> : <Table columns={columns} data={users} emptyMessage="Không tìm thấy người dùng nào" />}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Chỉnh sửa người dùng">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Họ và tên" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Email" type="email" value={formData.email} disabled />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Vai trò</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" loading={submitting}>Cập nhật</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Thêm người dùng">
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input label="Họ và tên" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Vai trò</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setInviteModalOpen(false)}>Hủy</Button>
            <Button type="submit" loading={submitting}>Gửi lời mời</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
