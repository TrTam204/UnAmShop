import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';

const PrivacyPolicy = () => {
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
          <h1 className="text-4xl font-bold">Chính sách bảo mật</h1>
          <p className="text-primary-100 mt-2">Cập nhật lần cuối: 4 tháng 12, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 legal-content">
          <h2>1. Thông tin chúng tôi thu thập</h2>
          <p>
            Chúng tôi thu thập thông tin bạn cung cấp trực tiếp cho chúng tôi, chẳng hạn khi bạn tạo tài khoản,
            đặt đơn hoặc liên hệ hỗ trợ. Điều này có thể bao gồm:
          </p>
          <ul>
            <li>Họ tên và địa chỉ email</li>
            <li>Thông tin thanh toán</li>
            <li>URL tài khoản mạng xã hội để thực hiện đơn hàng</li>
            <li>Sở thích giao tiếp và thông báo</li>
          </ul>

          <h2>2. Cách chúng tôi sử dụng thông tin</h2>
          <p>Chúng tôi sử dụng thông tin thu thập để:</p>
          <ul>
            <li>Xử lý và hoàn tất đơn hàng của bạn</li>
            <li>Gửi xác nhận đơn hàng và cập nhật trạng thái</li>
            <li>Trả lời ý kiến và câu hỏi của bạn</li>
            <li>Cải thiện dịch vụ và phát triển tính năng mới</li>
            <li>Ngăn chặn giao dịch gian lận và bảo vệ chống hoạt động bất hợp pháp</li>
          </ul>

          <h2>3. Chia sẻ thông tin</h2>
          <p>
            Chúng tôi không bán, trao đổi hoặc chuyển thông tin cá nhân của bạn cho bên thứ ba trừ khi cần thiết
            để cung cấp dịch vụ. Bao gồm chia sẻ thông tin với:
          </p>
          <ul>
            <li>Nhà cung cấp dịch vụ hỗ trợ thực hiện đơn hàng</li>
            <li>Bộ xử lý thanh toán cho giao dịch an toàn</li>
            <li>Cơ quan chức năng khi theo yêu cầu pháp luật</li>
          </ul>

          <h2>4. Bảo mật dữ liệu</h2>
          <p>
            Chúng tôi áp dụng các biện pháp bảo mật phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập trái phép,
            thay đổi, tiết lộ hoặc phá hủy. Bao gồm mã hóa, máy chủ an toàn và kiểm toán bảo mật định kỳ.
          </p>

          <h2>5. Cookie</h2>
          <p>
            Chúng tôi sử dụng cookie và các công nghệ tương tự để cải thiện trải nghiệm trên website, phân tích lưu lượng
            truy cập và cá nhân hóa nội dung. Bạn có thể kiểm soát tùy chọn cookie trong trình duyệt của mình.
          </p>

          <h2>6. Quyền của bạn</h2>
          <p>Bạn có quyền:</p>
          <ul>
            <li>Truy cập thông tin cá nhân của mình</li>
            <li>Chỉnh sửa dữ liệu không chính xác</li>
            <li>Yêu cầu xóa dữ liệu của mình</li>
            <li>Từ chối nhận thông tin tiếp thị</li>
          </ul>

          <h2>7. Thay đổi chính sách</h2>
          <p>
            Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Chúng tôi sẽ thông báo cho bạn về bất kỳ
            thay đổi nào bằng cách đăng chính sách mới trên trang này và cập nhật ngày "Cập nhật lần cuối".
          </p>

          <h2>8. Liên hệ</h2>
          <p>
            Nếu bạn có bất kỳ câu hỏi nào về Chính sách Bảo mật này, vui lòng liên hệ với chúng tôi qua:
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

export default PrivacyPolicy;
