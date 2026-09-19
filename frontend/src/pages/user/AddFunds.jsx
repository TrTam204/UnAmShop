import { useEffect, useMemo, useState } from 'react';
import { walletAPI } from '../../services/api';
import { Card, Button, Input, Table, Badge, PageLoader } from '../../components/ui';
import toast from 'react-hot-toast';

const paymentMethods = [
  {
    id: 'vietqr',
    title: 'VietQR / Bank Transfer',
    description: 'Create a pending request, then transfer the exact amount using the displayed reference.',
  },
  {
    id: 'zalo',
    title: 'Contact Admin via Zalo',
    description: 'Create a request, then contact admin so the payment can be confirmed manually.',
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
        toast.error('Failed to load wallet data');
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
      toast.error('Enter a positive whole VND amount');
      return;
    }

    setSubmitting(true);
    try {
      const deposit = await walletAPI.createDepositRequest(amountVnd, paymentMethod);
      setCreatedDeposit(deposit);
      setAmount('');
      await loadWallet();
      toast.success('Deposit request created');
    } catch (error) {
      if (error.code === 'SUPABASE_AUTH_REQUIRED') {
        setAuthBoundary(true);
      } else {
        toast.error(error.message || 'Failed to create deposit request');
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
      toast.success('Deposit request cancelled');
    } catch (error) {
      toast.error(error.message || 'Failed to cancel deposit request');
    } finally {
      setCancellingId(null);
    }
  };

  const copyReference = async (reference) => {
    await navigator.clipboard.writeText(reference);
    toast.success('Transfer reference copied');
  };

  const transactionColumns = [
    {
      key: 'direction',
      title: 'Type',
      render: (direction) => (
        <Badge variant={direction === 'credit' ? 'success' : 'danger'}>
          {direction === 'credit' ? 'Credit' : 'Debit'}
        </Badge>
      ),
    },
    { key: 'amount_vnd', title: 'Amount', render: (value) => formatVnd(value) },
    { key: 'description', title: 'Description' },
    { key: 'balance_after_vnd', title: 'Balance After', render: (value) => formatVnd(value) },
    { key: 'created_at', title: 'Date', render: (value) => new Date(value).toLocaleString() },
  ];

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Funds</h1>
        <p className="text-gray-500 mt-1">Deposit VND by VietQR or contact admin via Zalo.</p>
      </div>

      {authBoundary && (
        <Card className="mb-6">
          <p className="font-semibold text-gray-900">Supabase Auth is required for wallet deposits.</p>
          <p className="text-sm text-gray-600 mt-1">
            The current app login still uses the legacy Express session. Deposits remain disabled until the Supabase Auth cutover is enabled; no anonymous wallet path is used.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card title="Current Balance">
            <p className="text-3xl font-bold text-primary-600">
              {authBoundary ? 'Unavailable' : formatVnd(wallet.balance)}
            </p>
          </Card>

          <Card title="Deposit Method">
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full text-left rounded-lg border p-4 transition-colors ${
                    paymentMethod === method.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{method.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                </button>
              ))}
            </div>

            <Input
              label="Amount (VND)"
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-5"
              disabled={authBoundary}
            />

            <Button
              onClick={handleCreateRequest}
              loading={submitting}
              disabled={authBoundary}
              className="w-full mt-5"
              size="lg"
            >
              Create Deposit Request
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {createdDeposit && (
            <Card title="Deposit Instructions">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Request status: <Badge variant={statusVariants[createdDeposit.status] || 'default'}>{createdDeposit.status}</Badge>
                </p>
                <p className="font-semibold">Amount: {formatVnd(createdDeposit.amount_vnd)}</p>

                {createdDeposit.payment_method === 'vietqr' ? (
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    {qrUrl ? (
                      <img src={qrUrl} alt="VietQR payment QR code" className="w-56 h-56 border rounded-lg" />
                    ) : (
                      <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-4">
                        VietQR destination is not configured for this deployment.
                      </p>
                    )}
                    <div className="space-y-2 text-sm">
                      <p>Transfer the exact amount to the configured bank destination.</p>
                      <p>Reference: <strong>{createdDeposit.payment_reference || createdDeposit.id}</strong></p>
                      <Button
                        variant="secondary"
                        onClick={() => copyReference(createdDeposit.payment_reference || createdDeposit.id)}
                      >
                        Copy Reference
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Contact admin via Zalo and include this request ID:</p>
                    <p className="font-mono text-sm break-all">{createdDeposit.id}</p>
                    {zaloContactUrl ? (
                      <a
                        href={zaloContactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Contact Admin via Zalo
                      </a>
                    ) : (
                      <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-4">
                        Zalo contact destination is not configured for this deployment.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card title="Deposit History">
            {loading ? (
              <PageLoader />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-3 pr-4">Method</th>
                      <th className="py-3 pr-4">Amount</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.deposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">{deposit.payment_method === 'vietqr' ? 'VietQR' : 'Zalo Admin'}</td>
                        <td className="py-3 pr-4">{formatVnd(deposit.amount_vnd)}</td>
                        <td className="py-3 pr-4"><Badge variant={statusVariants[deposit.status] || 'default'}>{deposit.status}</Badge></td>
                        <td className="py-3 pr-4">{new Date(deposit.created_at).toLocaleString()}</td>
                        <td className="py-3">
                          {deposit.status === 'pending' && (
                            <Button
                              variant="secondary"
                              loading={cancellingId === deposit.id}
                              onClick={() => handleCancel(deposit.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!wallet.deposits.length && !authBoundary && (
                  <p className="py-8 text-center text-gray-500">No deposit requests yet.</p>
                )}
              </div>
            )}
          </Card>

          <Card title="Transaction History">
            <Table columns={transactionColumns} data={wallet.transactions} emptyMessage={authBoundary ? 'Available after Supabase Auth is enabled' : 'No transactions yet'} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddFunds;
