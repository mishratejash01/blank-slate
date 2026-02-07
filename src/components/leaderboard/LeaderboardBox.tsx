import { useState, useEffect } from 'react';
import { fetchLeaderboard } from '@/lib/profile-api';
import { Trophy, Star, Clock, Gift } from 'lucide-react';
import UserProfileCard from '@/components/profile/UserProfileCard';

const LeaderboardBox = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then(data => {
      setLeaders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

  return (
    <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl overflow-hidden">
      {/* Prize Banner */}
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-b border-[#2f3336] p-3 flex items-center gap-2">
        <Gift className="w-5 h-5 text-yellow-400 shrink-0" />
        <p className="text-[13px] text-yellow-200 font-medium">
          🏆 The #1 user on the 8th of every month wins <span className="font-bold">₹5,000!</span>
        </p>
      </div>

      <div className="py-3 px-4">
        <div className="text-xl font-extrabold text-[#e7e9ea] mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
        </div>

        {loading ? (
          <div className="text-[#71767b] text-sm py-4 text-center">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="text-[#71767b] text-sm py-4 text-center">No activity yet. Start engaging!</div>
        ) : (
          <div className="space-y-1">
            {leaders.map((leader) => (
              <UserProfileCard key={leader.userId} userId={leader.userId}>
                <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#eff3f4]/5 cursor-pointer transition-colors">
                  <span className={`text-lg font-bold w-6 text-center ${rankColors[leader.rank - 1] || 'text-[#71767b]'}`}>
                    {leader.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold">
                    {leader.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-[#e7e9ea] truncate">
                      {leader.name}
                    </div>
                    <div className="text-[11px] text-[#71767b] flex items-center gap-2">
                      {leader.username && <span>@{leader.username}</span>}
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {leader.avgRating.toFixed(1)}</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {leader.totalMinutes}m</span>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-[#1d9bf0]">{leader.score}</span>
                </div>
              </UserProfileCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardBox;
