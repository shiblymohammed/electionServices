import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Election Cart</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your trusted partner for election campaign management. We provide comprehensive packages and services to help you run successful political campaigns.
            </p>
            <p className="text-xs text-gray-500">
              © {currentYear} Election Cart. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate("/")}
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/my-orders")}
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  My Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/cart")}
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Cart
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@electioncart.com"
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <span className="text-sm text-gray-600">Help Center</span>
              </li>
              <li>
                <span className="text-sm text-gray-600">FAQs</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              Secure payments powered by Razorpay
            </p>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <span className="text-xs text-gray-500">Terms of Service</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
