import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HomeIcon,
    BeakerIcon,
    DocumentTextIcon,
    ShoppingBagIcon,
    ChatBubbleLeftRightIcon,
    UserIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Disease AI', href: '/predict', icon: BeakerIcon },
    { name: 'Prescriptions', href: '/ocr', icon: DocumentTextIcon },
    { name: 'Medicine Orders', href: '/orders', icon: ShoppingBagIcon },
    { name: 'Health Assistant', href: '/chat', icon: ChatBubbleLeftRightIcon },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 glass-panel m-4 border-r-0">
            <div className="flex items-center justify-center h-20 border-b border-white/20">
                <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">
                    HealthPredict
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-slate-600 hover:bg-white/50 hover:text-primary-600'
                                }`}
                        >
                            <item.icon
                                className={`mr-3 h-6 w-6 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'}`}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/20">
                <Link
                    to="/profile"
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 rounded-xl hover:bg-white/50 transition-all mb-2"
                >
                    <UserIcon className="mr-3 h-6 w-6 text-slate-400" />
                    Profile
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-all"
                >
                    <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6 text-red-400" />
                    Logout
                </button>
            </div>
        </div>
    );
}
