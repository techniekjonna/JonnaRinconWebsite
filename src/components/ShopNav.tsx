import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Beat Shop', href: '/shop/beats' },
  { label: 'Services', href: '/shop/services' },
  { label: 'Merchandise', href: '/shop/merchandise' },
  { label: 'Art', href: '/shop/art' },
];

export default function ShopNav() {
  const { pathname } = useLocation();
  return (
    <div className="relative z-10 bg-[#0a0a0a]/95 border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center overflow-x-auto scrollbar-none">
          <Link
            to="/shop"
            className="flex items-center gap-1.5 py-3.5 pr-5 mr-3 border-r border-white/[0.08] text-[10px] text-white/30 uppercase tracking-widest hover:text-red-400 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Store
          </Link>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest border-b-2 -mb-px transition-all whitespace-nowrap flex-shrink-0 ${
                pathname === item.href
                  ? 'border-red-600 text-white'
                  : 'border-transparent text-white/30 hover:text-white/70'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
