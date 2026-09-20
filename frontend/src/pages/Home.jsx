import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineCash,
  HiOutlineSupport,
  HiOutlineChartBar,
  HiOutlineUserGroup,
} from 'react-icons/hi';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: HiOutlineLightningBolt,
      title: 'Giao hĂ ng tá»©c thĂ¬',
      description: 'Nháº­n Ä‘Æ¡n nhanh chĂ³ng nhá» há»‡ thá»‘ng tá»± Ä‘á»™ng hĂ³a hiá»‡n Ä‘áº¡i.',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Cháº¥t lÆ°á»£ng cao',
      description: 'Dá»‹ch vá»¥ premium giĂºp tÄƒng trÆ°á»Ÿng máº¡ng xĂ£ há»™i bá»n vá»¯ng.',
    },
    {
      icon: HiOutlineCash,
      title: 'GiĂ¡ há»£p lĂ½',
      description: 'Má»©c giĂ¡ cáº¡nh tranh vá»›i tá»· lá»‡ tá»‘t nháº¥t thá»‹ trÆ°á»ng.',
    },
    {
      icon: HiOutlineSupport,
      title: 'Há»— trá»£ 24/7',
      description: 'Há»— trá»£ khĂ¡ch hĂ ng má»i lĂºc má»i nÆ¡i cho má»i tháº¯c máº¯c.',
    },
    {
      icon: HiOutlineChartBar,
      title: 'Theo dĂµi thá»i gian thá»±c',
      description: 'Theo dĂµi Ä‘Æ¡n hĂ ng theo thá»i gian thá»±c vá»›i cáº­p nháº­t rĂµ rĂ ng.',
    },
    {
      icon: HiOutlineUserGroup,
      title: 'ÄÆ°á»£c tin tÆ°á»Ÿng bá»Ÿi hĂ ng nghĂ¬n khĂ¡ch hĂ ng',
      description: 'Tham gia cĂ¹ng hĂ ng nghĂ¬n khĂ¡ch hĂ ng Ä‘Ă£ tÄƒng trÆ°á»Ÿng thĂ nh cĂ´ng.',
    },
  ];

  const services = [
    { name: 'Instagram Followers', price: '10.000Ä‘', per: '1000' },
    { name: 'YouTube Views', price: '15.000Ä‘', per: '1000' },
    { name: 'Facebook Likes', price: '8.000Ä‘', per: '1000' },
    { name: 'Twitter Followers', price: '12.000Ä‘', per: '1000' },
    { name: 'Telegram Members', price: '20.000Ä‘', per: '1000' },
    { name: 'TikTok Followers', price: '14.000Ä‘', per: '1000' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">á»ªnAm SHOP</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Báº£ng Ä‘iá»u khiá»ƒn
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    ÄÄƒng nháº­p
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Báº¯t Ä‘áº§u
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            TÄƒng trÆ°á»Ÿng máº¡ng xĂ£ há»™i
            <span className="block text-primary-200">cá»§a báº¡n ngay hĂ´m nay</span>
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            á»ªnAm SHOP lĂ  ná»n táº£ng SMM hĂ ng Ä‘áº§u cho má»i nhu cáº§u quáº£ng bĂ¡ máº¡ng xĂ£ há»™i.
            Nháº­n follower, like, view vĂ  nhiá»u dá»‹ch vá»¥ khĂ¡c vá»›i má»©c giĂ¡ Æ°u Ä‘Ă£i.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isAuthenticated ? '/new-order' : '/register'}
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Äáº·t Ä‘Æ¡n ngay
            </Link>
            <Link
              to="/services"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Xem dá»‹ch vá»¥
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600">50K+</div>
              <div className="text-gray-500 mt-1">KhĂ¡ch hĂ ng hĂ i lĂ²ng</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">1M+</div>
              <div className="text-gray-500 mt-1">ÄÆ¡n Ä‘Ă£ hoĂ n thĂ nh</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">100+</div>
              <div className="text-gray-500 mt-1">Dá»‹ch vá»¥ cĂ³ sáºµn</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">24/7</div>
              <div className="text-gray-500 mt-1">Há»— trá»£ khĂ¡ch hĂ ng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              VĂ¬ sao chá»n chĂºng tĂ´i?
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              ChĂºng tĂ´i mang Ä‘áº¿n dá»‹ch vá»¥ SMM tá»‘t nháº¥t vá»›i giao hĂ ng tá»©c thĂ¬ vĂ  há»— trá»£ 24/7.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dá»‹ch vá»¥ phá»• biáº¿n
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              KhĂ¡m phĂ¡ cĂ¡c dá»‹ch vá»¥ SMM Ä‘Æ°á»£c Æ°a chuá»™ng nháº¥t vá»›i má»©c giĂ¡ cáº¡nh tranh.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-primary-600">
                    {service.price}
                  </span>
                  <span className="text-gray-500 ml-2">/ {service.per}</span>
                </div>
                <Link
                  to={isAuthenticated ? '/new-order' : '/register'}
                  className="mt-4 block text-center bg-primary-50 text-primary-600 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors"
                >
                  Äáº·t Ä‘Æ¡n ngay
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/services"
              className="text-primary-600 font-medium hover:underline"
            >
              Xem táº¥t cáº£ dá»‹ch vá»¥ â†’
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sáºµn sĂ ng tÄƒng trÆ°á»Ÿng máº¡ng xĂ£ há»™i cá»§a báº¡n?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Tham gia cĂ¹ng hĂ ng nghĂ¬n khĂ¡ch hĂ ng Ä‘Ă£ hĂ i lĂ²ng vĂ  báº¯t Ä‘áº§u tÄƒng trÆ°á»Ÿng ngay hĂ´m nay.
          </p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Báº¯t Ä‘áº§u miá»…n phĂ­
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold text-white">á»ªnAm SHOP</span>
              <p className="mt-4">
                Äá»‘i tĂ¡c tin cáº­y cho viá»‡c tÄƒng trÆ°á»Ÿng vĂ  quáº£ng bĂ¡ máº¡ng xĂ£ há»™i.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">LiĂªn káº¿t nhanh</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:text-white transition-colors">Trang chá»§</Link></li>
                <li><Link to="/services" className="hover:text-white transition-colors">Dá»‹ch vá»¥</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">ÄÄƒng nháº­p</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">ÄÄƒng kĂ½</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platforms</h4>
              <ul className="space-y-2">
                <li><Link to="/services/instagram" className="hover:text-white transition-colors">Instagram</Link></li>
                <li><Link to="/services/youtube" className="hover:text-white transition-colors">YouTube</Link></li>
                <li><Link to="/services/facebook" className="hover:text-white transition-colors">Facebook</Link></li>
                <li><Link to="/services/twitter" className="hover:text-white transition-colors">Twitter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">PhĂ¡p lĂ½</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">ChĂ­nh sĂ¡ch báº£o máº­t</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Äiá»u khoáº£n dá»‹ch vá»¥</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white transition-colors">ChĂ­nh sĂ¡ch hoĂ n tiá»n</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">LiĂªn há»‡</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; 2025 á»ªnAm SHOP. Báº£n quyá»n thuá»™c vá» á»ªnAm SHOP.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
