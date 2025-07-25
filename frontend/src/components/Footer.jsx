import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Copyright } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link for routing

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-10 px-4 sm:px-6 lg:px-8 shadow-inner border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* About Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">FreshMarket</h3>
                    <p className="text-sm leading-relaxed">
                        Your ultimate destination for fresh, high-quality groceries delivered right to your doorstep. Supporting local farmers and providing the best prices.
                    </p>
                    <div className="flex space-x-4 mt-4">
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200" aria-label="Facebook">
                            <Facebook size={20} />
                        </a>
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200" aria-label="Twitter">
                            <Twitter size={20} />
                        </a>
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200" aria-label="Instagram">
                            <Instagram size={20} />
                        </a>
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-600 transition-colors duration-200" aria-label="LinkedIn">
                            <Linkedin size={20} />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                        <li><Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">Home</Link></li>
                        <li><Link to="/shop" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">Shop Now</Link></li>
                        <li><Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">About Us</Link></li>
                        <li><Link to="/contact" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">Contact</Link></li>
                        <li><Link to="/faq" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">FAQs</Link></li>
                        <li><Link to="/admin/login" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">Admin Login</Link></li> {/* New Admin Login Link */}
                    </ul>
                </div>

                {/* Contact Us */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h3>
                    <ul className="space-y-2">
                        <li className="flex items-center space-x-2">
                            <Mail size={18} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                            <span>Akshit.dhake@mitaoe.ac.in</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <Phone size={18} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                            <span>+91 1234567890</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <MapPin size={18} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-1" />
                            <span>MIT Academy of Engineering, Pune</span>
                        </li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Newsletter</h3>
                    <p className="text-sm mb-4">Stay updated with our latest offers and fresh arrivals.</p>
                    <div className="flex">
                        <input
                            type="email"
                            placeholder="Your email"
                            className="w-full p-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                        />
                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-r-md transition-colors duration-200">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-10 pt-6 text-center text-sm">
                <p className="flex items-center justify-center space-x-1">
                    <Copyright size={16} className="text-gray-500 dark:text-gray-400" />
                    <span>{currentYear} FreshMarket. All rights reserved.</span>
                </p>
                <p className="mt-2">Developed with ❤️ by Team Plum</p>
            </div>
        </footer>
    );
};

export default Footer;
