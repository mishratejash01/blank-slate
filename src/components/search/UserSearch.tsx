import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { searchUsers } from '@/lib/profile-api';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileCard from '@/components/profile/UserProfileCard';

const UserSearch = () => {
  const { user, profile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (!user || !profile) return;
      setLoading(true);
      try {
        const data = await searchUsers(value, user.id, profile.organization_domain);
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="bg-[#202327] rounded-full py-2.5 px-4 flex items-center gap-3 focus-within:bg-black focus-within:border focus-within:border-[#1d9bf0] group border border-transparent">
        <Search className="w-5 h-5 text-[#71767b] group-focus-within:text-[#1d9bf0]" />
        <input
          type="text"
          placeholder="Search users by @username"
          className="bg-transparent border-none text-white outline-none w-full placeholder:text-[#71767b] text-[15px]"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}>
            <X className="w-4 h-4 text-[#71767b] hover:text-white" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-black border border-[#2f3336] rounded-2xl shadow-lg z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-[#71767b] text-sm">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-[#71767b] text-sm">No users found</div>
          ) : (
            results.map((r) => (
              <UserProfileCard key={r.user_id} userId={r.user_id}>
                <div className="flex items-center gap-3 p-3 hover:bg-[#181818] cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center font-bold text-sm">
                    {r.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] text-[#e7e9ea] truncate">{r.full_name}</div>
                    <div className="text-[#71767b] text-[13px] truncate">
                      {r.username ? `@${r.username}` : ''} · {r.department} · {r.organization_domain}
                    </div>
                  </div>
                </div>
              </UserProfileCard>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
