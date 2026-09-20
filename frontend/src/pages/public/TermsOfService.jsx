import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';

const TermsOfService = () => {
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
          <h1 className="text-4xl font-bold">Điều khoản dịch vụ</h1>
          <p className="text-primary-100 mt-2">Cập nhật lần cuối: 4 tháng 12, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 legal-content">
          <h2>1. Chấp nhận điều khoản</h2>
          <p>
            Bằng cách truy cập và sử dụng ỪnAm SHOP, bạn chấp nhận và đồng ý bị ràng buộc bởi các điều khoản
            và điều kiện của thỏa thuận này. Nếu bạn không đồng ý với các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
          </p>

          <h2>2. Mô tả dịch vụ</h2>
          <p>
            ỪnAm SHOP cung cấp các dịch vụ tiếp thị mạng xã hội bao gồm nhưng không giới hạn ở follower, like,
            view và tăng tương tác trên nhiều nền tảng mạng xã hội. Chúng tôi đóng vai trò trung gian giữa bạn và các nhà cung cấp dịch vụ bên thứ ba.
          </p>

          <h2>3. Trách nhiệm của người dùng</h2>
          <p>Với tư cách người dùng dịch vụ của chúng tôi, bạn đồng ý:</p>
          <ul>
            <li>Cung cấp thông tin chính xác và đầy đủ khi tạo tài khoản</li>
            <li>Bảo vệ an toàn thông tin đăng nhập tài khoản</li>
            <li>Không sử dụng dịch vụ cho mục đích bất hợp pháp hoặc không được phép</li>
            <li>Tuân thủ mọi luật pháp hiện hành và điều khoản của nền tảng mạng xã hội</li>
            <li>Không bán lại dịch vụ của chúng tôi nếu không có ủy quyền</li>
          </ul>

          <h2>4. Đơn hàng và thanh toán</h2>
          <ul>
            <li>Tất cả đơn hàng được xử lý sau khi xác nhận thanh toán</li>
            <li>Giá có thể thay đổi mà không cần thông báo trước</li>
            <li>Chúng tôi chỉ chấp nhận thanh toán qua cổng thanh toán được ủy quyền</li>
            <li>Đơn hàng không thể hủy sau khi quy trình xử lý bắt đầu</li>
          </ul>

          <h2>5. Giao hàng dịch vụ</h2>
          <p>
            Chúng tôi nỗ lực giao tất cả đơn hàng đúng thời hạn. Tuy nhiên, thời gian giao hàng có thể thay đổi tùy vào lượng đơn,
            loại dịch vụ và tình trạng của nhà cung cấp bên thứ ba. Chúng tôi không đảm bảo thời gian giao cụ thể trừ khi có quy định rõ ràng.
          </p>

          <h2>6. Chính sách không đảm bảo</h2>
          <p>
            Mặc dù chúng tôi cố gắng mang đến dịch vụ chất lượng cao, nhưng chúng tôi không đảm bảo:
          </p>
          <ul>
            <li>Giữ vững follower, like hoặc view vĩnh viễn</li>
            <li>Kết quả cụ thể hoặc hiệu quả từ dịch vụ của chúng tôi</li>
            <li>Rằng dịch vụ sẽ đáp ứng đúng yêu cầu riêng của bạn</li>
            <li>Dịch vụ không bị gián đoạn hoặc không có lỗi</li>
          </ul>

          <h2>7. Giới hạn trách nhiệm</h2>
          <p>
            ỪnAm SHOP không chịu trách nhiệm đối với bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, hệ quả hoặc phạt
            nào phát sinh từ việc bạn sử dụng dịch vụ. Tổng trách nhiệm của chúng tôi không vượt quá số tiền đã thanh toán cho dịch vụ cụ thể đó.
          </p>

          <h2>8. Kết thúc tài khoản</h2>
          <p>
            Chúng tôi có quyền chấm dứt hoặc tạm ngưng tài khoản của bạn bất cứ lúc nào nếu vi phạm các điều khoản,
            hoạt động gian lận hoặc bất kỳ lý do nào khác theo quyết định riêng của chúng tôi.
          </p>

          <h2>9. Thay đổi điều khoản</h2>
          <p>
            Chúng tôi có quyền sửa đổi các điều khoản này bất cứ lúc nào. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản đã sửa đổi.
          </p>

          <h2>10. Thông tin liên hệ</h2>
          <p>
            Nếu bạn có câu hỏi về Điều khoản Dịch vụ này, vui lòng liên hệ với chúng tôi qua:
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

export default TermsOfService;
