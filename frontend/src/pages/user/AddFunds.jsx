import { useEffect, useMemo, useState } from 'react';
import { walletAPI } from '../../services/api';
import { formatWalletBalance } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Table, Badge, PageLoader } from '../../components/ui';
import toast from 'react-hot-toast';

const paymentMethods = [
  {
    id: 'vietqr',
    title: 'Chuyển khoản / VietQR',
    description: 'Chuyển đúng số tiền theo mã tham chiếu VietQR được sinh tự động.',
  },
  {
    id: 'zalo',
    title: 'Liên hệ Admin qua Zalo',
    description: 'Tạo yêu cầu và xác nhận thanh toán thủ công với admin qua Zalo.',
  },
];

const statusLabels = {
  pending: 'Đang chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
};

const statusVariants = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'default',
};

const MIN_DEPOSIT_AMOUNT = 10000;
const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const AddFunds = () => {
  const { walletBalanceVnd, refreshWalletBalance } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vietqr');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [], deposits: [] });
  const [authBoundary, setAuthBoundary] = useState(false);
  const [createdDeposit, setCreatedDeposit] = useState(null);

  const vietQrConfig = {
    bankId: import.meta.env.VITE_VIETQR_BANK_ID || 'VCB',
    accountNumber: import.meta.env.VITE_VIETQR_ACCOUNT_NUMBER || '1032888088',
    accountName: import.meta.env.VITE_VIETQR_ACCOUNT_NAME || 'NGUYEN HO TRUONG TAM',
    template: import.meta.env.VITE_VIETQR_TEMPLATE || 'compact2',
  };
  const zaloContactUrl = import.meta.env.VITE_ZALO_CONTACT_URL || 'https://zalo.me/0325620501';

  const qrUrl = useMemo(() => {
    if (!createdDeposit || createdDeposit.payment_method !== 'vietqr' || !vietQrConfig.bankId || !vietQrConfig.accountNumber) {
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
      await refreshWalletBalance();
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
  }, [refreshWalletBalance]);

  const handleCreateRequest = async () => {
    const amountVnd = Number(amount);
    if (!Number.isInteger(amountVnd) || amountVnd < MIN_DEPOSIT_AMOUNT) {
      toast.error('Số tiền nạp tối thiểu là 10.000 ₫');
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
        const message = error?.message || 'Tạo yêu cầu nạp tiền thất bại';
        toast.error(message);
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

  const copyValue = async (value, label) => {
    await navigator.clipboard.writeText(value);
    toast.success(`Đã sao chép ${label}`);
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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Nạp tiền</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Nạp VND qua VietQR hoặc liên hệ quản trị qua Zalo.</p>
      </div>

      {authBoundary && (
        <Card className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
          <p className="font-semibold">Tính năng nạp tiền đang chờ xác thực tài khoản.</p>
          <p className="mt-1 text-sm text-amber-700">Vui lòng thử lại sau khi tài khoản của bạn được xác thực thành công.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
              <Card title="Số dư hiện tại">
            <p className="text-3xl font-bold text-[var(--primary)]">{authBoundary ? '—' : formatWalletBalance(walletBalanceVnd)}</p>
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
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  <p className="font-semibold text-[var(--text-primary)]">{method.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{method.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-3 flex flex-wrap gap-2">
                {quickAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    {formatVnd(preset)}
                  </button>
                ))}
              </div>

              <Input
                label="Số tiền (VND)"
                type="number"
                min={MIN_DEPOSIT_AMOUNT}
                step="1"
                placeholder="Nhập số tiền"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={authBoundary}
              />
            </div>

            <Button onClick={handleCreateRequest} loading={submitting} disabled={authBoundary} className="mt-5 w-full" size="lg">
              Tạo yêu cầu nạp tiền
            </Button>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {createdDeposit && (
            <Card title="Hướng dẫn nạp tiền">
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Trạng thái yêu cầu:{' '}
                  <Badge variant={statusVariants[createdDeposit.status] || 'default'}>
                    {statusLabels[createdDeposit.status] || createdDeposit.status}
                  </Badge>
                </p>

                {createdDeposit.payment_method === 'vietqr' ? (
                  <div className="flex flex-col gap-5 rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 md:flex-row md:items-stretch">
                    <div className="vietqr-frame flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      {qrUrl ? (
                        <img src={qrUrl} alt="VietQR payment QR code" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700">
                          Mã QR chưa được cấu hình cho môi trường hiện tại.
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 text-sm text-[var(--text-secondary)]">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Ngân hàng</div>
                        <div className="mt-1 text-base font-semibold text-[var(--text-primary)]">{vietQrConfig.bankId || 'VCB'}</div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Số tài khoản</div>
                        <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                          <span className="font-medium text-[var(--text-primary)]">{vietQrConfig.accountNumber}</span>
                          <button type="button" onClick={() => copyValue(vietQrConfig.accountNumber, 'số tài khoản')} className="text-xs font-medium text-indigo-600 dark:text-indigo-300">Sao chép</button>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Chủ tài khoản</div>
                        <div className="mt-1 text-base font-semibold text-[var(--text-primary)]">{vietQrConfig.accountName}</div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Số tiền</div>
                        <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                          <span className="font-medium text-[var(--text-primary)]">{formatVnd(createdDeposit.amount_vnd)}</span>
                          <button type="button" onClick={() => copyValue(String(createdDeposit.amount_vnd), 'số tiền')} className="text-xs font-medium text-indigo-600 dark:text-indigo-300">Sao chép</button>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Nội dung chuyển khoản</div>
                        <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                          <span className="font-medium text-[var(--text-primary)] break-all">{createdDeposit.payment_reference || createdDeposit.id}</span>
                          <button type="button" onClick={() => copyValue(createdDeposit.payment_reference || createdDeposit.id, 'nội dung chuyển khoản')} className="text-xs font-medium text-indigo-600 dark:text-indigo-300">Sao chép</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--text-secondary)]">Liên hệ quản trị qua Zalo và gửi kèm mã yêu cầu này:</p>
                    <p className="break-all font-mono text-sm text-[var(--text-primary)]">{createdDeposit.id}</p>
                    {zaloContactUrl ? (
                      <a href={zaloContactUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
                        Liên hệ quản trị qua Zalo
                      </a>
                    ) : (
                      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">Liên kết Zalo chưa được cấu hình cho môi trường hiện tại.</p>
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
                    <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                      <th className="py-3 pr-4">Phương thức</th>
                      <th className="py-3 pr-4">Số tiền</th>
                      <th className="py-3 pr-4">Trạng thái</th>
                      <th className="py-3 pr-4">Ngày</th>
                      <th className="py-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.deposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-3 pr-4 text-[var(--text-primary)]">{deposit.payment_method === 'vietqr' ? 'VietQR' : 'Zalo Admin'}</td>
                        <td className="py-3 pr-4 text-[var(--text-primary)]">{formatVnd(deposit.amount_vnd)}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusVariants[deposit.status] || 'default'}>
                            {statusLabels[deposit.status] || deposit.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-[var(--text-primary)]">{new Date(deposit.created_at).toLocaleString()}</td>
                        <td className="py-3">
                          {deposit.status === 'pending' && (
                            <Button variant="secondary" loading={cancellingId === deposit.id} onClick={() => handleCancel(deposit.id)}>
                              Hủy
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!wallet.deposits.length && !authBoundary && (
                  <p className="py-8 text-center text-[var(--text-muted)]">Chưa có yêu cầu nạp tiền nào.</p>
                )}
              </div>
            )}
          </Card>

          <Card title="Lịch sử giao dịch">
            <Table columns={transactionColumns} data={wallet.transactions} emptyMessage={authBoundary ? 'Dữ liệu sẽ hiển thị khi tài khoản được xác thực.' : 'Chưa có giao dịch nào'} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddFunds;
