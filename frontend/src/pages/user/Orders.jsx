import { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';
import { Card, Table, Badge, Pagination, Select, PageLoader } from '../../components/ui';

const Orders = () => {
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
      const response = await ordersAPI.getAll({
        page: pagination.page,
        limit: 20,
        status: statusFilter || undefined,
      });
      setOrders(response.data.data);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const columns = [
    {
      key: '_id',
      title: 'Mã đơn',
      render: (id) => (
        <span className="font-mono text-xs">#{id.slice(-8)}</span>
      ),
    },
    {
      key: 'service',
      title: 'Dịch vụ',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.service?.title || 'N/A'}</p>
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
          className="text-primary-600 hover:underline truncate block max-w-[200px]"
        >
          {link}
        </a>
      ),
    },
    { key: 'quantity', title: 'Số lượng' },
    {
      key: 'amount',
      title: 'Số tiền',
      render: (amount) => <span className="font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(amount || 0))}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (status) => getStatusBadge(status),
    },
    {
      key: 'createdAt',
      title: 'Ngày',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

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

  return (
    <div className="fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
          <p className="text-gray-500 mt-1">Xem tất cả đơn hàng của bạn</p>
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
            <Table
              columns={columns}
              data={orders}
              emptyMessage="Không tìm thấy đơn hàng nào"
            />
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

export default Orders;
