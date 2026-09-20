import { useEffect, useMemo, useState } from 'react';
import { walletAPI } from '../../services/api';
import { Card, Button, Input, Table, Badge, PageLoader } from '../../components/ui';
import toast from 'react-hot-toast';

const paymentMethods = [
  {
    id: 'vietqr',
    title: 'VietQR / Chuyển khoản ngân hàng',
    description: 'Tạo yêu cầu trước, sau đó chuyển đúng số tiền theo mã tham chiếu hiển thị.',
  },
  {
    id: 'zalo',
    title: 'Liên hệ quản trị qua Zalo',
    description: 'Tạo yêu cầu và liên hệ quản trị để xác nhận thanh toán thủ công.',
  },
];

const statusVariants = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'default',
};

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const AddFunds = () => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vietqr');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [], deposits: [] });
  const [authBoundary, setAuthBoundary] = useState(false);
  const [createdDeposit, setCreatedDeposit] = useState(null);

  const vietQrConfig = {
    bankId: import.meta.env.VITE_VIETQR_BANK_ID,
    accountNumber: import.meta.env.VITE_VIETQR_ACCOUNT_NUMBER,
    accountName: import.meta.env.VITE_VIETQR_ACCOUNT_NAME,
    template: import.meta.env.VITE_VIETQR_TEMPLATE || 'compact2',
  };
  const zaloContactUrl = import.meta.env.VITE_ZALO_CONTACT_URL;

  const qrUrl = useMemo(() => {
    if (
      !createdDeposit ||
      createdDeposit.payment_method !== 'vietqr' ||
      !vietQrConfig.bankId ||
      !vietQrConfig.accountNumber
    ) {
      return null;
    }

    const reference = createdDeposit.payment_reference || createdDeposit.id;
    const query = new URLSearchParams({
      amount: String(createdDeposit.amount_vnd),
      addInfo: reference,
    });

    if (vietQrConfig.accountName) {
      query.set('accountName', vietQrConfig.accountName);
    }

    return `https://img.vietqr.io/image/${vietQrConfig.bankId}-${vietQrConfig.accountNumber}-${vietQrConfig.template}.png?${query.toString()}`;
  }, [createdDeposit, vietQrConfig.accountName, vietQrConfig.accountNumber, vietQrConfig.bankId, vietQrConfig.template]);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const snapshot = await walletAPI.getSupabaseSnapshot();
      setWallet(snapshot);
      setAuthBoundary(false);
    } catch (error) {
      if (error.code === 'SUPABASE_AUTH_REQUIRED') {
        setAuthBoundary(true);
      } else {
        toast.error('Không thể tải dữ liệu ví');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleCreateRequest = async () => {
    const amountVnd = Number(amount);
    if (!Number.isInteger(amountVnd) || amountVnd <= 0) {
      toast.error('Vui lòng nhập số tiền VND hợp lệ');
      return;
    }

    setSubmitting(true);
    try {
      const deposit = await walletAPI.createDepositRequest(amountVnd, paymentMethod);
      setCreatedDeposit(deposit);
      setAmount('');
      await loadWallet();
      toast.success('Yêu cầu nạp tiền đã được tạo');
    } catch (error) {
      if (error.code === 'SUPABASE_AUTH_REQUIRED') {
        setAuthBoundary(true);
      } else {
        toast.error(error.message || 'Tạo yêu cầu nạp tiền thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (depositId) => {
    setCancellingId(depositId);
    try {
      await walletAPI.cancelDepositRequest(depositId);
      if (createdDeposit?.id === depositId) {
        setCreatedDeposit(null);
      }
      await loadWallet();
      toast.success('Yêu cầu nạp tiền đã được hủy');
    } catch (error) {
      toast.error(error.message || 'Hủy yêu cầu nạp tiền thất bại');
    } finally {
      setCancellingId(null);
    }
  };

  const copyReference = async (reference) => {
    await navigator.clipboard.writeText(reference);
    toast.success('Mã tham chiếu đã được sao chép');
  };

  const transactionColumns = [
    {
      key: 'direction',
      title: 'Loại',
      render: (direction) => (
        <Badge variant={direction === 'credit' ? 'success' : 'danger'}>
          {direction === 'credit' ? 'Tín dụng' : 'Ghi nợ'}
        </Badge>
      ),
    },
    { key: 'amount_vnd', title: 'Số tiền', render: (value) => formatVnd(value) },
    { key: 'description', title: 'Mô tả' },
    { key: 'balance_after_vnd', title: 'Số dư sau', render: (value) => formatVnd(value) },
    { key: 'created_at', title: 'Ngày', render: (value) => new Date(value).toLocaleString() },
  ];

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nạp tiền</h1>
        <p className="mt-1 text-gray-500">Nạp VND qua VietQR hoặc liên hệ quản trị qua Zalo.</p>
      </div>

      {authBoundary && (
        <Card className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
          <p className="font-semibold">Tính năng nạp tiền đang chờ xác thực tài khoản.</p>
          <p className="mt-1 text-sm text-amber-700">
            Vui lòng thử lại sau khi tài khoản của bạn được xác thực thành công.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card title="Số dư hiện tại">
            <p className="text-3xl font-bold text-primary-600">
              {authBoundary ? 'Không khả dụng' : formatVnd(wallet.balance)}
            </p>
          </Card>

          <Card title="Phương thức nạp">
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    paymentMethod === method.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{method.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{method.description}</p>
                </button>
              ))}
            </div>

            <Input
              label="Số tiền (VND)"
              type="number"
              min="1"
              step="1"
              placeholder="Nhập số tiền"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-5"
              disabled={authBoundary}
            />

            <Button
              onClick={handleCreateRequest}
              loading={submitting}
              disabled={authBoundary}
              className="mt-5 w-full"
              size="lg"
            >
              Tạo yêu cầu nạp tiền
            </Button>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {createdDeposit && (
            <Card title="Hướng dẫn nạp tiền">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Trạng thái yêu cầu:{' '}
                  <Badge variant={statusVariants[createdDeposit.status] || 'default'}>{createdDeposit.status}</Badge>
                </p>
                <p className="font-semibold">Số tiền: {formatVnd(createdDeposit.amount_vnd)}</p>

                {createdDeposit.payment_method === 'vietqr' ? (
                  <div className="flex flex-col items-start gap-5 sm:flex-row">
                    {qrUrl ? (
                      <img src={qrUrl} alt="VietQR payment QR code" className="h-56 w-56 rounded-lg border" />
                    ) : (
                      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                        Mã QR chưa được cấu hình cho môi trường hiện tại.
                      </p>
                    )}
                    <div className="space-y-2 text-sm">
                      <p>Chuyển đúng số tiền đến ngân hàng đã cấu hình.</p>
                      <p>
                        Mã tham chiếu: <strong>{createdDeposit.payment_reference || createdDeposit.id}</strong>
                      </p>
                      <Button
                        variant="secondary"
                        onClick={() => copyReference(createdDeposit.payment_reference || createdDeposit.id)}
                      >
                        Sao chép mã
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Liên hệ quản trị qua Zalo và gửi kèm mã yêu cầu này:</p>
                    <p className="break-all font-mono text-sm">{createdDeposit.id}</p>
                    {zaloContactUrl ? (
                      <a
                        href={zaloContactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                      >
                        Liên hệ quản trị qua Zalo
                      </a>
                    ) : (
                      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                        Liên kết Zalo chưa được cấu hình cho môi trường hiện tại.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card title="Lịch sử nạp tiền">
            {loading ? (
              <PageLoader />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-3 pr-4">Phương thức</th>
                      <th className="py-3 pr-4">Số tiền</th>
                      <th className="py-3 pr-4">Trạng thái</th>
                      <th className="py-3 pr-4">Ngày</th>
                      <th className="py-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.deposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">{deposit.payment_method === 'vietqr' ? 'VietQR' : 'Zalo Admin'}</td>
                        <td className="py-3 pr-4">{formatVnd(deposit.amount_vnd)}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusVariants[deposit.status] || 'default'}>{deposit.status}</Badge>
                        </td>
                        <td className="py-3 pr-4">{new Date(deposit.created_at).toLocaleString()}</td>
                        <td className="py-3">
                          {deposit.status === 'pending' && (
                            <Button
                              variant="secondary"
                              loading={cancellingId === deposit.id}
                              onClick={() => handleCancel(deposit.id)}
                            >
                              Hủy
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!wallet.deposits.length && !authBoundary && (
                  <p className="py-8 text-center text-gray-500">Chưa có yêu cầu nạp tiền nào.</p>
                )}
              </div>
            )}
          </Card>

          <Card title="Lịch sử giao dịch">
            <Table
              columns={transactionColumns}
              data={wallet.transactions}
              emptyMessage={authBoundary ? 'Dữ liệu sẽ hiển thị khi tài khoản được xác thực.' : 'Chưa có giao dịch nào'}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddFunds;
