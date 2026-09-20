import { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';
import {
  Card,
  Table,
  Badge,
  Select,
  Pagination,
  PageLoader,
} from '../../components/ui';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.getAllAdmin({
        page: pagination.page,
        limit: 30,
        status: statusFilter || undefined,
      });
      setOrders(response.data.data);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total,
      });
    } catch (error) {
      toast.error('Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      toast.success('Cập nhật trạng thái đơn hàng thành công');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cập nhật trạng thái thất bại');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', label: 'Đang chờ' },
      processing: { variant: 'info', label: 'Đang xử lý' },
      in_progress: { variant: 'info', label: 'Đang tiến hành' },
      completed: { variant: 'success', label: 'Hoàn thành' },
      partial: { variant: 'warning', label: 'Một phần' },
      cancelled: { variant: 'danger', label: 'Đã hủy' },
      refunded: { variant: 'danger', label: 'Hoàn tiền' },
    };

    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Đang chờ' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'in_progress', label: 'Đang tiến hành' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'partial', label: 'Một phần' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'refunded', label: 'Hoàn tiền' },
  ];

  const columns = [
    {
      key: '_id',
      title: 'Mã đơn',
      render: (id) => <span className="font-mono text-xs">#{id.slice(-8)}</span>,
    },
    {
      key: 'user',
      title: 'Người dùng',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.user?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{row.user?.email}</p>
        </div>
      ),
    },
    {
      key: 'service',
      title: 'Dịch vụ',
      render: (_, row) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">{row.service?.title || 'N/A'}</p>
          <p className="text-xs text-gray-500">{row.service?.category}</p>
        </div>
      ),
    },
    {
      key: 'link',
      title: 'Liên kết',
      render: (link) => (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline truncate block max-w-[150px]"
        >
          {link}
        </a>
      ),
    },
    { key: 'quantity', title: 'SL' },
    {
      key: 'amount',
      title: 'Số tiền',
      render: (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(amount || 0)),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (status, row) => (
        <select
          value={status}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {statusOptions.slice(1).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'providerOrderId',
      title: 'Mã nhà cung cấp',
      render: (id) => (
        <span className="font-mono text-xs">{id || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Ngày',
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div className="fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tất cả đơn hàng</h1>
          <p className="text-gray-500 mt-1">
            Quản lý và theo dõi mọi đơn hàng của khách hàng
          </p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={statusOptions}
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <PageLoader />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={orders}
                emptyMessage="Không tìm thấy đơn hàng nào"
              />
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminOrders;
