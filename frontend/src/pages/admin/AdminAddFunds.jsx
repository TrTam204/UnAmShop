import { useEffect, useMemo, useState } from 'react';
import { supabaseAdminAPI } from '../../services/api';
import { Card, Button, Input, Table, Badge } from '../../components/ui';
import { HiOutlineRefresh, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getStatusVariant = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    default:
      return 'default';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'Chờ duyệt';
    case 'approved':
      return 'Đã duyệt';
    case 'rejected':
      return 'Từ chối';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status || 'Không xác định';
  }
};

const AdminAddFunds = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await supabaseAdminAPI.listDeposits({
        status: statusFilter === 'all' ? null : statusFilter,
        limit: 100,
        offset: 0,
      });
      setRequests(Array.isArray(response) ? response : []);
    } catch (error) {
      toast.error(error.message || 'Không thể tải danh sách duyệt nạp tiền');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return requests;
    }

    return requests.filter((row) => {
      const haystack = [row.email, row.full_name, row.payment_reference, row.payment_method]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [requests, search]);

  const handleApprove = async (requestId) => {
    if (!window.confirm('Duyệt yêu cầu nạp tiền này?')) {
      return;
    }

    setProcessingId(requestId);
    try {
      await supabaseAdminAPI.approveDeposit(requestId);
      toast.success('Đã duyệt khoản nạp tiền');
      await loadRequests();
    } catch (error) {
      toast.error(error.message || 'Duyệt nạp tiền thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const adminNote = window.prompt('Ghi chú từ chối (tuỳ chọn)', '');
    if (adminNote === null) {
      return;
    }

    setProcessingId(requestId);
    try {
      await supabaseAdminAPI.rejectDeposit(requestId, adminNote || null);
      toast.success('Đã từ chối khoản nạp tiền');
      await loadRequests();
    } catch (error) {
      toast.error(error.message || 'Từ chối nạp tiền thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
    {
      key: 'created_at',
      title: 'Thời gian',
      render: (value) => new Date(value).toLocaleString('vi-VN'),
    },
    {
      key: 'email',
      title: 'Người dùng',
      render: (_, row) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{row.full_name || 'Không rõ'}</div>
          <div className="text-xs text-[var(--text-muted)]">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'amount_vnd',
      title: 'Số tiền',
      render: (value) => <span className="font-semibold">{formatCurrency(value)}</span>,
    },
    {
      key: 'payment_method',
      title: 'Phương thức',
      render: (value) => (value === 'vietqr' ? 'VietQR' : value === 'zalo' ? 'Zalo' : value || '—'),
    },
    {
      key: 'payment_reference',
      title: 'Mã tham chiếu',
      render: (value) => value || '—',
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (status) => <Badge variant={getStatusVariant(status)}>{getStatusLabel(status)}</Badge>,
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (_, row) => {
        if (row.status !== 'pending') {
          return <span className="text-xs text-[var(--text-muted)]">Đã xử lý</span>;
        }

        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() => handleApprove(row.id)}
              loading={processingId === row.id}
            >
              <HiOutlineCheck className="mr-1 h-4 w-4" />
              Duyệt
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleReject(row.id)}
              loading={processingId === row.id}
            >
              <HiOutlineX className="mr-1 h-4 w-4" />
              Từ chối
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="fade-in">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Duyệt nạp tiền</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Xác nhận yêu cầu nạp tiền an toàn bằng RPC</p>
        </div>
        <Button variant="secondary" onClick={loadRequests} loading={loading}>
          <HiOutlineRefresh className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <Input
              placeholder="Tìm theo email, tên, mã tham chiếu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="md:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-3 text-sm text-[var(--text-primary)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredRequests}
          loading={loading}
          emptyMessage="Không có yêu cầu nạp tiền nào"
        />
      </Card>
    </div>
  );
};

export default AdminAddFunds;
