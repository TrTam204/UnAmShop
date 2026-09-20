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
      toast.success('YĂªu cáº§u náº¡p tiá»n Ä‘Ă£ Ä‘Æ°á»£c táº¡o');
    } catch (error) {
      if (error.code === 'SUPABASE_AUTH_REQUIRED') {
        setAuthBoundary(true);
      } else {
        toast.error(error.message || 'Táº¡o yĂªu cáº§u náº¡p tiá»n tháº¥t báº¡i');
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
      toast.success('YĂªu cáº§u náº¡p tiá»n Ä‘Ă£ Ä‘Æ°á»£c há»§y');
    } catch (error) {
      toast.error(error.message || 'Há»§y yĂªu cáº§u náº¡p tiá»n tháº¥t báº¡i');
    } finally {
      setCancellingId(null);
    }
  };

  const copyReference = async (reference) => {
    await navigator.clipboard.writeText(reference);
    toast.success('MĂ£ chuyá»ƒn khoáº£n Ä‘Ă£ Ä‘Æ°á»£c sao chĂ©p');
  };

  const transactionColumns = [
    {
      key: 'direction',
      title: 'Loáº¡i',
      render: (direction) => (
        <Badge variant={direction === 'credit' ? 'success' : 'danger'}>
          {direction === 'credit' ? 'TĂ­n dá»¥ng' : 'Ghi ná»£'}
        </Badge>
      ),
    },
    { key: 'amount_vnd', title: 'Sá»‘ tiá»n', render: (value) => formatVnd(value) },
    { key: 'description', title: 'MĂ´ táº£' },
    { key: 'balance_after_vnd', title: 'Sá»‘ dÆ° sau', render: (value) => formatVnd(value) },
    { key: 'created_at', title: 'NgĂ y', render: (value) => new Date(value).toLocaleString() },
  ];

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Náº¡p tiá»n</h1>
        <p className="text-gray-500 mt-1">Náº¡p VND qua VietQR hoáº·c liĂªn há»‡ quáº£n trá»‹ qua Zalo.</p>
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
          <Card title="Sá»‘ dÆ° hiá»‡n táº¡i">
            <p className="text-3xl font-bold text-primary-600">
              {authBoundary ? 'Unavailable' : formatVnd(wallet.balance)}
            </p>
          </Card>

          <Card title="PhÆ°Æ¡ng thá»©c náº¡p">
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
              label="Sá»‘ tiá»n (VND)"
              type="number"
              min="1"
              step="1"
              placeholder="Nháº­p sá»‘ tiá»n"
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
              Táº¡o yĂªu cáº§u náº¡p tiá»n
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {createdDeposit && (
            <Card title="HÆ°á»›ng dáº«n náº¡p tiá»n">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Tráº¡ng thĂ¡i yĂªu cáº§u: <Badge variant={statusVariants[createdDeposit.status] || 'default'}>{createdDeposit.status}</Badge>
                </p>
                <p className="font-semibold">Sá»‘ tiá»n: {formatVnd(createdDeposit.amount_vnd)}</p>

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
                      <p>Chuyá»ƒn Ä‘Ăºng sá»‘ tiá»n Ä‘áº¿n ngĂ¢n hĂ ng Ä‘Ă£ cáº¥u hĂ¬nh.</p>
                      <p>MĂ£ tham chiáº¿u: <strong>{createdDeposit.payment_reference || createdDeposit.id}</strong></p>
                      <Button
                        variant="secondary"
                        onClick={() => copyReference(createdDeposit.payment_reference || createdDeposit.id)}
                      >
                        Sao chĂ©p mĂ£
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">LiĂªn há»‡ quáº£n trá»‹ qua Zalo vĂ  gá»­i kĂ¨m mĂ£ yĂªu cáº§u nĂ y:</p>
                    <p className="font-mono text-sm break-all">{createdDeposit.id}</p>
                    {zaloContactUrl ? (
                      <a
                        href={zaloContactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        LiĂªn há»‡ quáº£n trá»‹ qua Zalo
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

          <Card title="Lá»‹ch sá»­ náº¡p tiá»n">
            {loading ? (
              <PageLoader />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-3 pr-4">PhÆ°Æ¡ng thá»©c</th>
                      <th className="py-3 pr-4">Sá»‘ tiá»n</th>
                      <th className="py-3 pr-4">Tráº¡ng thĂ¡i</th>
                      <th className="py-3 pr-4">NgĂ y</th>
                      <th className="py-3">HĂ nh Ä‘á»™ng</th>
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
                              Há»§y
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!wallet.deposits.length && !authBoundary && (
                  <p className="py-8 text-center text-gray-500">ChÆ°a cĂ³ yĂªu cáº§u náº¡p tiá»n nĂ o.</p>
                )}
              </div>
            )}
          </Card>

          <Card title="Lá»‹ch sá»­ giao dá»‹ch">
            <Table columns={transactionColumns} data={wallet.transactions} emptyMessage={authBoundary ? 'Sáº½ kháº£ dá»¥ng sau khi Supabase Auth Ä‘Æ°á»£c kĂ­ch hoáº¡t' : 'ChÆ°a cĂ³ giao dá»‹ch nĂ o'} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddFunds;
