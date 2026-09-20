import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowLeft, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Tin nhắn đã được gửi thành công! Chúng tôi sẽ sớm phản hồi bạn.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

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
          <h1 className="text-4xl font-bold">Liên hệ</h1>
          <p className="text-primary-100 mt-2">Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiOutlineMail className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-500 mt-1">support@unamshop.com</p>
                  <p className="text-gray-500">sales@unamshop.com</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiOutlinePhone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Điện thoại</h3>
                  <p className="text-gray-500 mt-1">+84 912 345 678</p>
                  <p className="text-gray-500">+84 987 654 321</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiOutlineLocationMarker className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Văn phòng</h3>
                  <p className="text-gray-500 mt-1">
                    123 Đường Kinh doanh<br />
                    Quận 1, TP. Hồ Chí Minh, Việt Nam
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-xl p-6">
              <h3 className="font-semibold text-primary-900 mb-2">Giờ làm việc</h3>
              <p className="text-primary-700 text-sm">
                Thứ Hai - Thứ Sáu: 9:00 - 18:00 ICT<br />
                Thứ Bảy: 10:00 - 16:00 ICT<br />
                Chủ Nhật: Nghỉ<br /><br />
                <strong>Hỗ trợ 24/7 qua email</strong>
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Gửi tin nhắn cho chúng tôi</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="nguyenvana@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chủ đề
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Chúng tôi có thể giúp gì cho bạn?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tin nhắn
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Hãy cho chúng tôi biết thêm về yêu cầu của bạn..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>
              </form>
            </div>
          </div>
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

export default Contact;
