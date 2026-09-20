import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-primary-600">ỪnAm SHOP</Link>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Đăng nhập</Link>
              <Link to="/register" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700">
                Bắt đầu
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-primary-200 hover:text-white mb-4">
            <HiArrowLeft className="w-5 h-5 mr-2" />
            Quay lại trang chủ
          </Link>
          <h1 className="text-4xl font-bold">Chính sách hoàn tiền</h1>
          <p className="text-primary-100 mt-2">Cập nhật lần cuối: 4 tháng 12, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 legal-content">
          <h2>1. Điều kiện hoàn tiền</h2>
          <p>
            Chúng tôi muốn bạn hài lòng với dịch vụ của mình. Hoàn tiền có thể được cấp trong các trường hợp sau:
          </p>
          <ul>
            <li>Đơn hàng chưa bắt đầu trong vòng 72 giờ</li>
            <li>Cung cấp sai dịch vụ</li>
            <li>Thanh toán trùng lặp</li>
            <li>Lỗi kỹ thuật từ phía chúng tôi</li>
          </ul>

          <h2>2. Trường hợp không hoàn tiền</h2>
          <p>Hoàn tiền sẽ KHÔNG được cấp cho:</p>
          <ul>
            <li>Đơn hàng đã hoàn thành hoặc đã xử lý một phần</li>
            <li>Giảm follower/like/view sau khi giao hàng (đây là điều bình thường)</li>
            <li>Tài khoản bị khóa hoặc xóa bởi nền tảng mạng xã hội</li>
            <li>Liên kết hoặc thông tin người dùng cung cấp không chính xác</li>
            <li>Thay đổi ý định sau khi đặt đơn</li>
            <li>Dịch vụ mua trong chương trình khuyến mãi (trừ khi có quy định khác)</li>
          </ul>

          <h2>3. Hoàn tiền một phần</h2>
          <p>
            Nếu một đơn hàng chỉ được thực hiện một phần và không thể hoàn thành, khoản hoàn tiền một phần có thể được cấp
            cho phần chưa giao. Số tiền hoàn lại sẽ được tính dựa trên số lượng còn lại.
          </p>

          <h2>4. Tín dụng ví</h2>
          <p>
            Trong hầu hết các trường hợp, khoản hoàn tiền được phê duyệt sẽ được cộng vào số dư ví ỪnAm SHOP thay vì phương
            thức thanh toán ban đầu. Tín dụng ví có thể được sử dụng cho đơn hàng trong tương lai.
          </p>

          <h2>5. Cách yêu cầu hoàn tiền</h2>
          <p>Để yêu cầu hoàn tiền:</p>
          <ol>
            <li>Đăng nhập vào tài khoản của bạn</li>
            <li>Vào Lịch sử đơn hàng</li>
            <li>Tìm đơn hàng cần hoàn tiền</li>
            <li>Liên hệ đội ngũ hỗ trợ với mã đơn và lý do hoàn tiền</li>
          </ol>

          <h2>6. Thời gian xử lý</h2>
          <p>
            Yêu cầu hoàn tiền thường được xử lý trong vòng 24-48 giờ làm việc. Nếu được phê duyệt, tín dụng ví sẽ được cộng
            ngay lập tức. Hoàn tiền qua ngân hàng (nếu có) có thể mất 5-7 ngày làm việc để hiển thị trong tài khoản của bạn.
          </p>

          <h2>7. Giải quyết tranh chấp</h2>
          <p>
            Nếu bạn không đồng ý với quyết định hoàn tiền, bạn có thể khiếu nại bằng cách liên hệ với đội ngũ hỗ trợ. Chúng tôi
            sẽ xem xét và đưa ra quyết định cuối cùng trong vòng 72 giờ.
          </p>

          <h2>8. Chargeback</h2>
          <p>
            Nếu bạn thực hiện chargeback mà không liên hệ trước với bộ phận hỗ trợ, tài khoản của bạn có thể bị đình chỉ vĩnh viễn.
            Chúng tôi khuyến khích bạn liên hệ với chúng tôi trước để giải quyết mọi vấn đề.
          </p>

          <h2>9. Liên hệ</h2>
          <p>
            Để yêu cầu hoàn tiền hoặc hỏi về chính sách này, vui lòng liên hệ với chúng tôi:
          </p>
          <ul>
            <li>Email: support@unamshop.com</li>
            <li>Điện thoại: +84 912 345 678</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 ỪnAm SHOP. Bản quyền thuộc về ỪnAm SHOP.</p>
        </div>
      </footer>
    </div>
  );
};

export default RefundPolicy;
