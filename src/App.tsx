import React, { useEffect, useState, useMemo, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Star, Target, BookOpen, Clock, Settings, X, Calendar, Check, Cat, Dog, Sparkles } from 'lucide-react';

// --- Types ---
interface CoupleInfo {
  startDate: string;
  partnerName: string;
  myName: string;
  slogan: string;
  memorials?: { id: string; title: string; date: string }[];
}

interface Wish {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  emoji: string;
  description?: string;
  deadline?: string;
  tag?: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  milestones: { id: string; text: string; completed: boolean }[];
}

interface Memory {
  id: string;
  title: string;
  date: string;
  content: string;
  imageUrls: string[];
  tag?: string;
  mood?: string;
  goalId?: string;
  createdAt: string;
}

interface Capsule {
  id: string;
  recipient: 'partner' | 'self' | 'couple';
  title: string;
  content: string;
  openDate: string;
  isRead: boolean;
  createdAt: string;
}

type Tab = 'home' | 'wish' | 'target' | 'diary' | 'time';
type GoalFilter = 'all' | 'active' | 'completed' | 'paused';

// --- Helper Functions ---
const calculateDaysTogether = (startDate: string) => {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getNextAnniversary = (startDate: string) => {
  const start = new Date(startDate);
  const now = new Date();
  let next = new Date(now.getFullYear(), start.getMonth(), start.getDate());
  
  if (next < now) {
    next.setFullYear(now.getFullYear() + 1);
  }
  
  const diffTime = next.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return { date: next, daysRemaining: diffDays };
};

export default function App() {
  const [info, setInfo] = useState<CoupleInfo | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [isCapsuleModalOpen, setIsCapsuleModalOpen] = useState(false);
  const [expandedCapsuleId, setExpandedCapsuleId] = useState<string | null>(null);
  const [newCapsuleForm, setNewCapsuleForm] = useState<Partial<Capsule>>({
    recipient: 'partner',
    title: '',
    content: '',
    openDate: ''
  });
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);
  const [newMemoryForm, setNewMemoryForm] = useState<Partial<Memory>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    imageUrls: [],
    tag: '',
    mood: '',
    goalId: '',
  });
  const [memoryFilter, setMemoryFilter] = useState({
    mood: '',
    goalId: 'all',
    startDate: '',
    endDate: ''
  });
  const [goalFilter, setGoalFilter] = useState<GoalFilter>('all');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [newGoalForm, setNewGoalForm] = useState<Partial<Goal>>({
    title: '',
    emoji: '🎯',
    description: '',
    deadline: '',
    tag: '',
    progress: 0,
    status: 'active',
    milestones: []
  });
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [newWishText, setNewWishText] = useState('');
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CoupleInfo>({
    startDate: '',
    partnerName: '',
    myName: '',
    slogan: '',
    memorials: []
  });
  const [isAddingMemorial, setIsAddingMemorial] = useState(false);
  const [newMemDay, setNewMemDay] = useState({ title: '', date: '' });

  // Load from localStorage on mount
  useEffect(() => {
    const savedInfo = localStorage.getItem('couple_info');
    if (savedInfo) {
      const parsed = JSON.parse(savedInfo);
      setInfo(parsed);
      setFormData(parsed);
    } else {
      setIsSetupOpen(true);
    }

    const savedWishes = localStorage.getItem('wishes');
    if (savedWishes) {
      setWishes(JSON.parse(savedWishes));
    }

    const savedGoals = localStorage.getItem('goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }

    const savedMemories = localStorage.getItem('memories');
    if (savedMemories) {
      setMemories(JSON.parse(savedMemories));
    }

    const savedCapsules = localStorage.getItem('capsules');
    if (savedCapsules) {
      setCapsules(JSON.parse(savedCapsules));
    }

    // Loading Simulation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 8;
      if (currentProgress >= 100) {
        setLoadingProgress(100);
        clearInterval(interval);
        setTimeout(() => setLoading(false), 500);
      } else {
        setLoadingProgress(currentProgress);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('wishes', JSON.stringify(wishes));
  }, [wishes]);

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('capsules', JSON.stringify(capsules));
  }, [capsules]);

  const addGoal = (e: FormEvent) => {
    e.preventDefault();
    if (!newGoalForm.title?.trim()) return;

    const milestones = newGoalForm.milestones || [];
    const completedCount = milestones.filter(m => m.completed).length;
    const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

    const goal: Goal = {
      id: crypto.randomUUID(),
      title: newGoalForm.title.trim(),
      emoji: newGoalForm.emoji || '🎯',
      description: newGoalForm.description?.trim(),
      deadline: newGoalForm.deadline,
      tag: newGoalForm.tag?.trim(),
      progress,
      status: (progress === 100 ? 'completed' : 'active') as any,
      createdAt: new Date().toISOString(),
      milestones,
    };

    setGoals([goal, ...goals]);
    setIsGoalModalOpen(false);
    setNewGoalForm({ 
      title: '', 
      emoji: '🎯', 
      description: '', 
      deadline: '', 
      tag: '', 
      progress: 0, 
      status: 'active',
      milestones: [] 
    });
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const newMilestones = g.milestones.map(m => 
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = newMilestones.filter(m => m.completed).length;
        const newProgress = Math.round((completedCount / newMilestones.length) * 100);
        
        if (newProgress === 100 && g.progress < 100) {
          setCelebratingId(goalId);
          setTimeout(() => setCelebratingId(null), 1000);
        }

        return {
          ...g,
          milestones: newMilestones,
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : 'active'
        };
      }
      return g;
    }));
  };

  const addMilestoneToForm = () => {
    if (!newMilestoneText.trim()) return;
    setNewGoalForm(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), {
        id: crypto.randomUUID(),
        text: newMilestoneText.trim(),
        completed: false
      }]
    }));
    setNewMilestoneText('');
  };

  const removeMilestoneFromForm = (id: string) => {
    setNewGoalForm(prev => ({
      ...prev,
      milestones: prev.milestones?.filter(m => m.id !== id)
    }));
  };

  const updateGoalProgress = (id: string, progress: number) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        const newStatus = progress === 100 ? 'completed' : g.status === 'completed' ? 'active' : g.status;
        if (newStatus === 'completed' && g.status !== 'completed') {
          setCelebratingId(id);
          setTimeout(() => setCelebratingId(null), 1000);
        }
        return { ...g, progress, status: newStatus as any };
      }
      return g;
    }));
  };

  const updateGoalStatus = (id: string, status: Goal['status']) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        if (status === 'completed' && g.status !== 'completed') {
          setCelebratingId(id);
          setTimeout(() => setCelebratingId(null), 1000);
        }
        return { ...g, status, progress: status === 'completed' ? 100 : g.progress };
      }
      return g;
    }));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addMemory = (e: FormEvent) => {
    e.preventDefault();
    if (!newMemoryForm.title?.trim() || !newMemoryForm.content?.trim()) return;

    const memory: Memory = {
      id: crypto.randomUUID(),
      title: newMemoryForm.title.trim(),
      date: newMemoryForm.date || new Date().toISOString().split('T')[0],
      content: newMemoryForm.content.trim(),
      imageUrls: newMemoryForm.imageUrls || [],
      tag: newMemoryForm.tag?.trim(),
      mood: newMemoryForm.mood as any,
      goalId: newMemoryForm.goalId,
      createdAt: new Date().toISOString(),
    };

    setMemories([memory, ...memories]);
    setIsMemoryModalOpen(false);
    setNewMemoryForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      imageUrls: [],
      tag: '',
      mood: '',
      goalId: ''
    });
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const addCapsule = (e: FormEvent) => {
    e.preventDefault();
    if (!newCapsuleForm.title?.trim() || !newCapsuleForm.content?.trim() || !newCapsuleForm.openDate) return;

    const capsule: Capsule = {
      id: crypto.randomUUID(),
      recipient: newCapsuleForm.recipient || 'partner',
      title: newCapsuleForm.title.trim(),
      content: newCapsuleForm.content.trim(),
      openDate: newCapsuleForm.openDate,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setCapsules([capsule, ...capsules]);
    setIsCapsuleModalOpen(false);
    setNewCapsuleForm({
      recipient: 'partner',
      title: '',
      content: '',
      openDate: ''
    });
  };

  const deleteCapsule = (id: string) => {
    setCapsules(prev => prev.filter(c => c.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMemoryForm(prev => ({
          ...prev,
          imageUrls: [...(prev.imageUrls || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  const addWish = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!newWishText.trim()) return;

    const newWish: Wish = {
      id: crypto.randomUUID(),
      text: newWishText.trim(),
      completed: false,
      createdAt: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
    };

    setWishes([newWish, ...wishes]);
    setNewWishText('');
  };

  const toggleWish = (id: string) => {
    setWishes(wishes.map(w => {
      if (w.id === id) {
        if (!w.completed) {
          setCelebratingId(id);
          setTimeout(() => setCelebratingId(null), 1000);
        }
        return { ...w, completed: !w.completed };
      }
      return w;
    }));
  };

  const deleteWish = (id: string) => {
    setWishes(prev => prev.filter(w => w.id !== id));
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.partnerName || !formData.myName) return;
    
    localStorage.setItem('couple_info', JSON.stringify(formData));
    setInfo(formData);
    setIsSetupOpen(false);
  };

  const daysTogether = useMemo(() => info ? calculateDaysTogether(info.startDate) : 0, [info]);
  const nextAnniv = useMemo(() => info ? getNextAnniversary(info.startDate) : null, [info]);

  const nextMemorial = useMemo(() => {
    if (!info?.memorials || info.memorials.length === 0) return null;
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const futureMemorials = info.memorials.map(m => {
      const parts = m.date.split('-');
      // Assume date format is YYYY-MM-DD
      const mDate = new Date(m.date);
      let next = new Date(currentYear, mDate.getMonth(), mDate.getDate());
      if (next < now) {
        next.setFullYear(currentYear + 1);
      }
      const diff = next.getTime() - now.getTime();
      return { 
        ...m, 
        daysRemaining: Math.ceil(diff / (1000 * 60 * 60 * 24)),
        nextDate: next
      };
    });

    return futureMemorials.sort((a, b) => a.daysRemaining - b.daysRemaining)[0];
  }, [info]);

  const navItems = [
    { id: 'home', icon: Heart, label: '首页' },
    { id: 'wish', icon: Star, label: '心愿' },
    { id: 'target', icon: Target, label: '目标' },
    { id: 'diary', icon: BookOpen, label: '日记' },
    { id: 'time', icon: Clock, label: '时光' },
  ];

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center loading-gradient overflow-hidden"
        >
          {/* Twinkling Stars */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                '--duration': `${Math.random() * 3 + 1}s`
              } as any}
            />
          ))}

          {/* Floating Clouds */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="cloud"
              style={{
                top: `${20 + i * 20}%`,
                width: `${200 + Math.random() * 200}px`,
                height: `${100 + Math.random() * 100}px`,
                left: '-10%',
                '--duration': `${20 + Math.random() * 10}s`
              } as any}
            />
          ))}

          {/* Content Container */}
          <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-sm px-8">
            {/* Characters Group */}
            <div className="flex items-end gap-6 mb-4">
              {/* Cat */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="p-3 bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-white/50 text-sky-blue"
              >
                <Cat size={32} />
              </motion.div>

              {/* Bear (Relaxed) */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-4 bg-milk-yellow/40 backdrop-blur-sm rounded-[2rem] border-2 border-white shadow-xl text-gray-700 relative"
              >
                <Heart className="absolute -top-2 -right-2 text-red-300 fill-red-300" size={16} />
                <div className="w-10 h-10 bg-gray-700/10 rounded-full flex items-center justify-center font-bold text-lg">ʕ•ᴥ•ʔ</div>
              </motion.div>

              {/* Dog */}
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="p-3 bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-white/50 text-pink-300"
              >
                <Dog size={32} />
              </motion.div>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full space-y-4">
              <div className="relative h-6 w-full bg-white/20 backdrop-blur-md rounded-full border-4 border-white/50 overflow-hidden p-1 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  className="h-full bg-gradient-to-r from-sky-blue to-pink-300 rounded-full flex items-center justify-end px-2"
                >
                  {loadingProgress > 10 && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles size={10} className="text-white" />
                    </motion.div>
                  )}
                </motion.div>
              </div>
              
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
                  Initializing Love...
                </span>
                <span className="text-[10px] font-bold text-gray-500 font-mono">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
            </div>

            <p className="text-gray-400 font-serif-sc text-xs italic">
              “Every moment with you is a treasure.”
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen scrapbook-texture pb-24 md:pb-0 md:pt-12"
        >
      {/* Header */}
      {info && (
        <header className="px-6 py-8 md:max-w-xl md:mx-auto">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-playfair font-semibold tracking-tight text-gray-800">
                {info.myName} <span className="text-sky-blue mx-1">♥</span> {info.partnerName}
              </h1>
              <p className="text-sm text-gray-400 font-light italic">"{info.slogan || '我们的专属故事'}"</p>
            </div>
            <button 
              onClick={() => setIsSetupOpen(true)}
              className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Settings size={20} className="text-gray-400" />
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="px-6 md:max-w-xl md:mx-auto min-h-[60vh] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && info ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8 pb-12"
            >
              {/* Main Anniversary Card */}
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border-2 border-sky-blue/10 relative overflow-hidden">
                <div className="absolute top-4 right-6 opacity-20 rotate-12">
                  <Star className="text-milk-yellow fill-milk-yellow" size={32} />
                </div>
                
                <div className="text-center space-y-8">
                  <div className="inline-block px-4 py-1 bg-sky-blue/15 text-sky-blue text-xs font-semibold rounded-full uppercase tracking-widest">
                    Anniversary
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-medium">我们在一起已经</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-7xl font-playfair font-bold text-sky-blue">{daysTogether}</span>
                      <span className="text-xl text-gray-500 font-medium font-serif-sc">天</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-50 flex flex-col items-center gap-6">
                    <div className="flex flex-col items-center">
                      <p className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
                        <Calendar size={14} /> 下一个周年纪念日还有
                      </p>
                      <div className="text-2xl font-serif-sc font-medium text-gray-700">
                        {nextAnniv?.daysRemaining} <span className="text-sm text-gray-400">天</span>
                      </div>
                    </div>

                    {nextMemorial && (
                       <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                        <p className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-sky-blue" /> 下一个纪念日({nextMemorial.title})还有
                        </p>
                        <div className="text-2xl font-serif-sc font-medium text-gray-700">
                          {nextMemorial.daysRemaining} <span className="text-sm text-gray-400">天</span>
                        </div>
                      </div>
                    )}

                    <div className="w-full pt-4 border-t border-gray-50/50">
                      <button 
                        onClick={() => setIsAddingMemorial(!isAddingMemorial)}
                        className="text-[10px] font-bold text-sky-blue/60 hover:text-sky-blue transition-colors uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                      >
                        {isAddingMemorial ? '收起管理' : (info?.memorials?.length ? '管理其他纪念日' : '+ 添加纪念日')}
                      </button>

                      <AnimatePresence>
                        {isAddingMemorial && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-4 space-y-4"
                          >
                            {/* Simple Add Form */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                              <input 
                                placeholder="纪念日名称 (如: 第一次看电影)"
                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-serif-sc focus:ring-1 focus:ring-sky-blue/20 outline-none"
                                value={newMemDay.title}
                                onChange={e => setNewMemDay({...newMemDay, title: e.target.value})}
                              />
                              <div className="flex gap-2">
                                <input 
                                  type="date"
                                  className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-sky-blue/20 outline-none"
                                  value={newMemDay.date}
                                  onChange={e => setNewMemDay({...newMemDay, date: e.target.value})}
                                />
                                <button 
                                  onClick={() => {
                                    if (!newMemDay.title || !newMemDay.date) return;
                                    const updatedInfo = {
                                      ...info!,
                                      memorials: [...(info?.memorials || []), { ...newMemDay, id: crypto.randomUUID() }]
                                    };
                                    setInfo(updatedInfo);
                                    localStorage.setItem('couple_info', JSON.stringify(updatedInfo));
                                    setNewMemDay({ title: '', date: '' });
                                  }}
                                  className="bg-sky-blue text-white px-4 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform"
                                >
                                  添加
                                </button>
                              </div>
                            </div>

                            {/* List of custom memorials */}
                            {info?.memorials && info.memorials.length > 0 && (
                              <div className="space-y-2 max-h-32 overflow-auto custom-scrollbar pr-1">
                                {info.memorials.map(m => (
                                  <div key={m.id} className="flex justify-between items-center bg-gray-50/50 rounded-xl px-4 py-2 border border-gray-100">
                                    <div className="text-left">
                                      <p className="text-[10px] font-bold text-gray-700 font-serif-sc">{m.title}</p>
                                      <p className="text-[8px] text-gray-400 font-mono italic">{m.date}</p>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        const updatedInfo = {
                                          ...info!,
                                          memorials: info?.memorials?.filter(x => x.id !== m.id)
                                        };
                                        setInfo(updatedInfo);
                                        localStorage.setItem('couple_info', JSON.stringify(updatedInfo));
                                      }}
                                      className="text-gray-300 hover:text-red-400 transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-milk-yellow/20 rounded-full blur-2xl" />
              </div>

              {/* Section 1: Data Dashboard */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '已达成心愿', value: wishes.filter(w => w.completed).length, unit: '个', icon: Star, color: 'text-amber-400' },
                  { label: '正在坚持', value: goals.filter(g => g.status === 'active').length, unit: '个目标', icon: Target, color: 'text-sky-blue' },
                  { label: '珍贵回忆', value: memories.length, unit: '篇', icon: BookOpen, color: 'text-indigo-300' },
                  { label: '待开启信件', value: capsules.filter(c => new Date(c.openDate) > new Date()).length, unit: '封', icon: Clock, color: 'text-milk-yellow' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-[1.8rem] shadow-sm flex flex-col items-center justify-center space-y-2 border border-gray-50">
                    <div className={`p-2 rounded-xl bg-opacity-10 ${stat.color.replace('text-', 'bg-')}`}>
                      <stat.icon size={18} className={stat.color} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{stat.label}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-xl font-playfair font-bold text-gray-700">{stat.value}</span>
                        <span className="text-[10px] text-gray-400 font-serif-sc">{stat.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 2: Timeline */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-gray-800 font-bold font-serif-sc text-sm flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-sky-blue rounded-full" />
                    时间轴
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recent 10 Events</span>
                </div>

                <div className="relative pl-6 space-y-8">
                  {/* Timeline Background Line */}
                  <div className="absolute left-[31px] top-2 bottom-2 w-0.5 border-l-2 border-dashed border-sky-blue/20" />

                  {(() => {
                    const timelineEvents = [
                      ...memories.map(m => ({ 
                        type: 'memory' as const, 
                        date: m.date, 
                        title: m.title, 
                        id: m.id,
                        icon: BookOpen 
                      })),
                      ...goals
                        .filter(g => g.status === 'completed')
                        .map(g => ({ 
                          type: 'goal' as const, 
                          date: g.createdAt.split('T')[0], 
                          title: `目标完成：${g.title}`, 
                          id: g.id,
                          icon: Check 
                        }))
                    ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10);

                    if (timelineEvents.length === 0) {
                      return (
                        <div className="text-center py-10 text-gray-300 text-sm font-serif-sc italic">
                          还未有轨迹记录，去记录一段回忆吧 ~
                        </div>
                      );
                    }

                    return timelineEvents.map((event, idx) => (
                      <div key={idx} className="relative flex items-start gap-6">
                        {/* Dot Indicator */}
                        <div className={`z-10 w-3 h-3 rounded-full shrink-0 mt-1.5 border-2 border-white shadow-sm ring-4 ring-white ${
                          event.type === 'memory' ? 'bg-sky-blue' : 'bg-green-400'
                        }`} />

                        {/* Event Card */}
                        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center group hover:scale-[1.02] transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                              <Calendar size={10} />
                              {event.date}
                            </div>
                            <h4 className="text-xs font-bold text-gray-700 font-serif-sc line-clamp-1">{event.title}</h4>
                          </div>
                          <div className={`p-2 rounded-lg ${event.type === 'memory' ? 'bg-sky-blue/5 text-sky-blue' : 'bg-green-50 text-green-500'}`}>
                            <event.icon size={14} />
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'wish' ? (
            <motion.div
              key="wish"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6 flex-1 self-start"
            >
              {/* Wishes Stats */}
              <div className="flex justify-between items-center bg-sky-blue/10 px-6 py-4 rounded-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Star className="text-sky-blue fill-sky-blue" size={20} />
                  </div>
                  <span className="text-gray-600 font-medium">心愿清单</span>
                </div>
                <div className="text-sky-blue font-playfair font-bold text-lg">
                  {wishes.filter(w => w.completed).length} <span className="text-gray-400 font-serif-sc text-sm mx-1">/</span> {wishes.length}
                </div>
              </div>

              {/* Add Wish Input */}
              <form onSubmit={addWish} className="relative group">
                <input
                  type="text"
                  placeholder="许下一个新的心愿..."
                  className="w-full pl-6 pr-16 py-4 rounded-[1.5rem] bg-white shadow-sm border-2 border-transparent focus:border-sky-blue/20 outline-none transition-all placeholder:text-gray-300 font-serif-sc"
                  value={newWishText}
                  onChange={(e) => setNewWishText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newWishText.trim()}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-sky-blue text-white rounded-[1.2rem] shadow-lg shadow-sky-blue/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  <Check size={18} strokeWidth={3} />
                </button>
              </form>

              {/* Wishes List */}
              <div className="space-y-3 pb-8">
                <AnimatePresence mode="popLayout">
                  {wishes.map((wish) => (
                    <motion.div
                      key={wish.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`group relative p-4 rounded-3xl flex items-center gap-4 transition-all duration-300 ${
                        wish.completed ? 'bg-gray-50/80 border-transparent' : 'bg-white shadow-sm border border-sky-blue/5'
                      }`}
                    >
                      <button
                        onClick={() => toggleWish(wish.id)}
                        className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          wish.completed 
                            ? 'bg-sky-blue border-sky-blue text-white' 
                            : 'border-gray-200 hover:border-sky-blue/30'
                        }`}
                      >
                        {wish.completed && <Check size={16} strokeWidth={3} />}
                        
                        {/* Celebrate Animation */}
                        {celebratingId === wish.id && (
                          <div className="absolute inset-0 pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute left-1/2 top-1/2 -ml-1 -mt-1 w-2 h-2 rounded-full bg-sky-blue animate-celebrate"
                                style={{
                                  animationDelay: `${i * 0.1}s`,
                                  transform: `rotate(${i * 60}deg) translate(0px, 0px)`
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </button>

                      <div className="flex-1 overflow-hidden" onClick={() => toggleWish(wish.id)}>
                        <h4 className={`font-serif-sc transition-all truncate ${
                          wish.completed ? 'text-gray-300 line-through' : 'text-gray-700 font-medium'
                        }`}>
                          {wish.text}
                        </h4>
                        <p className="text-[10px] text-gray-300 flex items-center gap-1 mt-0.5">
                          {wish.createdAt}
                        </p>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteWish(wish.id); }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-200 hover:text-red-300 transition-all"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
                  
                  {wishes.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-gray-300 text-sm font-serif-sc"
                    >
                      还没有心愿哦，快去许一个吧 ~
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : activeTab === 'target' ? (
            <motion.div
              key="target"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6 flex-1 self-start"
            >
              {/* Header with Stats & Add Button */}
              <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-sky-blue/5">
                <div className="space-y-1">
                  <h3 className="text-gray-800 font-bold font-serif-sc">共同目标</h3>
                  <p className="text-[10px] text-gray-400 font-medium">一起成长的轨迹</p>
                </div>
                <button 
                  onClick={() => setIsGoalModalOpen(true)}
                  className="p-3 bg-sky-blue text-white rounded-2xl shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Target size={20} />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-gray-100/50 p-1.5 rounded-2xl gap-1">
                {(['all', 'active', 'completed', 'paused'] as GoalFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setGoalFilter(f)}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${
                      goalFilter === f 
                        ? 'bg-white text-sky-blue shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {f === 'all' ? '全部' : f === 'active' ? '进行中' : f === 'completed' ? '已完成' : '搁置'}
                  </button>
                ))}
              </div>

              {/* Goals List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                <AnimatePresence mode="popLayout">
                  {goals
                    .filter(g => goalFilter === 'all' || g.status === goalFilter)
                    .map((goal) => {
                      const linkedMemories = memories.filter(m => m.goalId === goal.id);
                      const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

                      return (
                        <motion.div
                          key={goal.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setSelectedGoalId(goal.id)}
                          className="group relative bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100/50 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-sky-blue/5 flex items-center justify-center text-2xl">
                              {goal.emoji || '🎯'}
                            </div>
                            <div className="flex-1 space-y-1">
                              <h4 className="font-bold text-gray-800 font-serif-sc truncate">{goal.title}</h4>
                              <div className="flex items-center gap-3">
                                {daysLeft !== null && (
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${daysLeft < 7 ? 'text-red-400' : 'text-gray-400'}`}>
                                    {daysLeft > 0 ? `剩 ${daysLeft} 天` : '已截止'}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-sky-blue uppercase tracking-wider flex items-center gap-1">
                                  <BookOpen size={10} /> {linkedMemories.length} 篇回忆
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                              <span className="text-[10px] font-bold text-sky-blue">{goal.progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100/50">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${goal.progress}%` }}
                                className="h-full bg-gradient-to-r from-sky-blue to-blue-400 rounded-full"
                              />
                            </div>
                          </div>

                          {celebratingId === goal.id && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="text-4xl">🎉</div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                </AnimatePresence>

                {goals.filter(g => goalFilter === 'all' || g.status === goalFilter).length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 text-gray-300 text-sm font-serif-sc col-span-full"
                  >
                    在这个状态下还没有目标哦 ~
                  </motion.div>
                )}
              </div>

              {/* Goal Detail Modal */}
              <AnimatePresence>
                {selectedGoalId && (() => {
                  const goal = goals.find(g => g.id === selectedGoalId);
                  if (!goal) return null;
                  const linkedMemories = memories.filter(m => m.goalId === goal.id);

                  return (
                    <motion.div
                      key="goal-detail"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 30 }}
                        className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100"
                      >
                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                          <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-[1.5rem] bg-sky-blue/5 flex items-center justify-center text-4xl shadow-inner transform rotate-3">
                                {goal.emoji}
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-gray-800 font-serif-sc">{goal.title}</h3>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded-lg font-bold uppercase tracking-widest">{goal.tag || '无标签'}</span>
                                  {goal.deadline && (
                                    <span className="text-[10px] text-gray-300 font-bold uppercase">截止: {goal.deadline}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button onClick={() => setSelectedGoalId(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
                              <X size={24} />
                            </button>
                          </div>

                          <div className="space-y-8">
                            {/* Description */}
                            {goal.description && (
                              <section>
                                <p className="text-sm text-gray-500 leading-relaxed font-serif-sc whitespace-pre-wrap italic">
                                  "{goal.description}"
                                </p>
                              </section>
                            )}

                            {/* Milestones Checklist */}
                            <section className="space-y-4">
                              <h5 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-sky-blue rounded-full" />
                                里程碑 ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length})
                              </h5>
                              <div className="space-y-2">
                                {goal.milestones.map((m) => (
                                  <div 
                                    key={m.id}
                                    onClick={() => toggleMilestone(goal.id, m.id)}
                                    className={`group flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                                      m.completed ? 'bg-gray-50 text-gray-300' : 'bg-white border border-gray-100 hover:border-sky-blue/20'
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      m.completed ? 'bg-sky-blue border-sky-blue text-white' : 'border-gray-200'
                                    }`}>
                                      {m.completed && <Check size={12} strokeWidth={4} />}
                                    </div>
                                    <span className={`text-sm font-medium font-serif-sc ${m.completed ? 'line-through' : 'text-gray-700'}`}>
                                      {m.text}
                                    </span>
                                  </div>
                                ))}
                                {goal.milestones.length === 0 && (
                                  <div className="text-center py-4 text-gray-300 text-[10px] font-bold italic">
                                    此目标还没有设置里程碑
                                  </div>
                                )}
                              </div>
                            </section>

                            {/* Linked Memories Mini Strip */}
                            <section className="space-y-4 pt-4 border-t border-gray-50">
                              <h5 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={12} />
                                关联回忆 ({linkedMemories.length})
                              </h5>
                              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                                {linkedMemories.map(m => (
                                  <div key={m.id} className="shrink-0 w-32 group cursor-pointer" onClick={() => { setSelectedGoalId(null); setExpandedMemoryId(m.id); }}>
                                    <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-2">
                                      {m.imageUrls[0] ? (
                                        <img src={m.imageUrls[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Star size={16} /></div>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-700 truncate font-serif-sc">{m.title}</p>
                                    <p className="text-[8px] text-gray-300 uppercase tracking-widest">{m.date}</p>
                                  </div>
                                ))}
                                {linkedMemories.length === 0 && (
                                  <div className="text-center w-full py-8 text-gray-300 text-[10px] font-bold italic">
                                    还没有关联的回忆哦
                                  </div>
                                )}
                              </div>
                            </section>
                          </div>
                        </div>

                        <div className="p-8 bg-gray-50 flex justify-between items-center">
                          <button 
                            onClick={() => { deleteGoal(goal.id); setSelectedGoalId(null); }}
                            className="text-xs font-bold text-red-300 hover:text-red-400 transition-colors uppercase tracking-widest"
                          >
                            Delete Goal
                          </button>
                          <button 
                            onClick={() => setSelectedGoalId(null)}
                            className="px-8 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-500 hover:bg-white/50 transition-all shadow-sm"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Goal Create Modal */}
              <AnimatePresence>
                {isGoalModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 overflow-y-auto max-h-[90vh] custom-scrollbar"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-serif-sc font-bold text-gray-800">设定新目标</h3>
                        <button onClick={() => setIsGoalModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                        </button>
                      </div>

                      <form onSubmit={addGoal} className="space-y-5">
                        <div className="flex gap-4">
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">图标</label>
                            <input
                              required
                              className="w-14 h-14 text-2xl text-center rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc"
                              value={newGoalForm.emoji}
                              onChange={(e) => setNewGoalForm({ ...newGoalForm, emoji: e.target.value })}
                            />
                          </div>
                          <div className="flex-1 space-y-1.5 pt-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">目标标题</label>
                            <input
                              required
                              placeholder="我们要一起完成什么？"
                              className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc"
                              value={newGoalForm.title}
                              onChange={(e) => setNewGoalForm({ ...newGoalForm, title: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">里程碑 (Checklist)</label>
                          <div className="space-y-2">
                             {newGoalForm.milestones?.map(m => (
                               <div key={m.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                                  <div className="w-1 h-4 bg-sky-blue/30 rounded-full" />
                                  <span className="flex-1 text-xs font-serif-sc text-gray-600">{m.text}</span>
                                  <button type="button" onClick={() => removeMilestoneFromForm(m.id)} className="text-gray-300 hover:text-red-400"><X size={14} /></button>
                               </div>
                             ))}
                             <div className="flex gap-2">
                               <input 
                                 placeholder="添加具体的步骤..."
                                 className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 text-xs font-serif-sc"
                                 value={newMilestoneText}
                                 onChange={(e) => setNewMilestoneText(e.target.value)}
                                 onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addMilestoneToForm(); } }}
                               />
                               <button 
                                 type="button"
                                 onClick={addMilestoneToForm}
                                 className="px-4 bg-sky-blue/10 text-sky-blue rounded-xl font-bold text-xs"
                               >
                                 添加
                               </button>
                             </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">描述 (可选)</label>
                          <textarea
                            placeholder="写下关于这个目标的小细节..."
                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc min-h-[80px] resize-none text-sm"
                            value={newGoalForm.description}
                            onChange={(e) => setNewGoalForm({ ...newGoalForm, description: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">截止日期</label>
                            <input
                              type="date"
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-xs"
                              value={newGoalForm.deadline}
                              onChange={(e) => setNewGoalForm({ ...newGoalForm, deadline: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">标签</label>
                            <input
                              placeholder="旅行 / 存钱..."
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-xs"
                              value={newGoalForm.tag}
                              onChange={(e) => setNewGoalForm({ ...newGoalForm, tag: e.target.value })}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-4 mt-2 bg-sky-blue text-white font-bold rounded-2xl shadow-xl shadow-sky-blue/30 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Check size={20} />
                          开启新篇章
                        </button>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : activeTab === 'diary' ? (
            <motion.div
              key="diary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6 flex-1 self-start"
            >
              {/* Header */}
              <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-sky-blue/5">
                <div className="space-y-1">
                  <h3 className="text-gray-800 font-bold font-serif-sc">回忆日记</h3>
                  <p className="text-[10px] text-gray-400 font-medium">收集每一个心动瞬间</p>
                </div>
                <button 
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="p-3 bg-sky-blue text-white rounded-2xl shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all text-sm font-bold flex items-center gap-2"
                >
                  <BookOpen size={20} />
                  记录
                </button>
              </div>

              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex flex-wrap gap-3">
                <input 
                  placeholder="搜索心情..."
                  value={memoryFilter.mood}
                  onChange={(e) => setMemoryFilter({...memoryFilter, mood: e.target.value})}
                  className="bg-gray-50 text-[10px] font-bold py-2 px-3 rounded-xl border-none outline-none max-w-[100px]"
                />

                <select 
                  value={memoryFilter.goalId}
                  onChange={(e) => setMemoryFilter({...memoryFilter, goalId: e.target.value})}
                  className="bg-gray-50 text-[10px] font-bold py-2 px-3 rounded-xl border-none outline-none max-w-[120px]"
                >
                  <option value="all">所有目标</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    value={memoryFilter.startDate}
                    onChange={(e) => setMemoryFilter({...memoryFilter, startDate: e.target.value})}
                    className="bg-gray-50 text-[10px] font-bold py-2 px-2 rounded-xl border-none outline-none"
                  />
                  <span className="text-gray-300">-</span>
                  <input 
                    type="date"
                    value={memoryFilter.endDate}
                    onChange={(e) => setMemoryFilter({...memoryFilter, endDate: e.target.value})}
                    className="bg-gray-50 text-[10px] font-bold py-2 px-2 rounded-xl border-none outline-none"
                  />
                </div>
              </div>

              {/* Memory Cards - Responsive Masonry Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                <AnimatePresence mode="popLayout">
                  {[...memories]
                    .filter(m => {
                      const moodMatch = !memoryFilter.mood || memoryFilter.mood === 'all' || m.mood?.toLowerCase().includes(memoryFilter.mood.toLowerCase());
                      const goalMatch = memoryFilter.goalId === 'all' || m.goalId === memoryFilter.goalId;
                      const dateMatch = (!memoryFilter.startDate || m.date >= memoryFilter.startDate) && 
                                      (!memoryFilter.endDate || m.date <= memoryFilter.endDate);
                      return moodMatch && goalMatch && dateMatch;
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((memory) => {
                      const associatedGoal = goals.find(g => g.id === memory.goalId);
                      
                      return (
                        <motion.div
                          key={memory.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setExpandedMemoryId(memory.id)}
                          className="group bg-white rounded-3xl p-3 shadow-sm border border-gray-100/50 cursor-pointer overflow-hidden flex flex-col gap-3 active:scale-[0.98] transition-all h-fit"
                        >
                          {/* Image Preview */}
                          {memory.imageUrls.length > 0 ? (
                            <div className="relative overflow-hidden aspect-square bg-gray-50 rounded-2xl">
                              <img 
                                src={memory.imageUrls[0]} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/80 backdrop-blur-sm rounded-lg text-[8px] font-bold">
                                {memory.mood || '开心'}
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-square bg-gradient-to-br from-sky-blue/5 to-milk-yellow/5 rounded-2xl flex items-center justify-center text-gray-200">
                              <Star size={24} />
                            </div>
                          )}

                          {/* Content Summary */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-sm font-bold text-gray-800 font-serif-sc truncate flex-1">{memory.title}</h4>
                              <button 
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  deleteMemory(memory.id); 
                                }}
                                className="relative z-50 p-1 -mt-1 -mr-1 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all group-hover:opacity-100 opacity-100 pointer-events-auto"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                              <span>{memory.date}</span>
                              {memory.tag && <span className="text-sky-blue">· {memory.tag}</span>}
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-1 h-4 font-serif-sc">
                              {memory.content}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>

              {/* Memory Detail Modal */}
              <AnimatePresence>
                {expandedMemoryId && (() => {
                  const memory = memories.find(m => m.id === expandedMemoryId);
                  if (!memory) return null;
                  const associatedGoal = goals.find(g => g.id === memory.goalId);
                  
                  return (
                    <motion.div
                      key="memory-detail"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 30 }}
                        className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100"
                      >
                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                          <div className="flex justify-between items-start mb-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="bg-sky-blue/10 text-sky-blue px-3 py-1 rounded-full text-[10px] font-bold">
                                  {memory.mood || '开心'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{memory.date}</span>
                              </div>
                              <h3 className="text-2xl font-bold text-gray-800 font-serif-sc">{memory.title}</h3>
                            </div>
                            <button onClick={() => setExpandedMemoryId(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
                              <X size={24} />
                            </button>
                          </div>

                          {memory.imageUrls.length > 0 && (
                            <div className="grid grid-cols-1 gap-4 mb-8">
                              {memory.imageUrls.map((url, i) => (
                                <img key={i} src={url} className="w-full rounded-[2rem] shadow-sm object-cover max-h-[400px]" />
                              ))}
                            </div>
                          )}

                          <div className="space-y-6">
                            <p className="text-gray-600 leading-relaxed font-serif-sc whitespace-pre-wrap">
                              {memory.content}
                            </p>

                            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-50">
                              {memory.tag && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-400">
                                  <Sparkles size={12} /> {memory.tag}
                                </div>
                              )}
                              {associatedGoal && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-blue/5 rounded-xl text-xs font-bold text-sky-blue">
                                  <Target size={12} /> 关联目标: {associatedGoal.title}
                                </div>
                              )}
                              <button 
                                onClick={(e) => { 
                                  deleteMemory(memory.id); 
                                  setExpandedMemoryId(null);
                                }}
                                className="ml-auto flex items-center gap-2 px-4 py-1.5 text-red-400 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                              >
                                <X size={14} /> 删除日记
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Memory Form Modal */}
              <AnimatePresence>
                {isMemoryModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100 overflow-y-auto max-h-[90vh]"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-serif-sc font-bold text-gray-800">记下一段瞬间</h3>
                        <button onClick={() => setIsMemoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                        </button>
                      </div>

                      <form onSubmit={addMemory} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">照片</label>
                          <div className="flex flex-wrap gap-2">
                            {newMemoryForm.imageUrls?.map((url, i) => (
                              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border">
                                <img src={url} className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => setNewMemoryForm({
                                    ...newMemoryForm, 
                                    imageUrls: newMemoryForm.imageUrls?.filter((_, idx) => idx !== i)
                                  })}
                                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-sky-blue hover:text-sky-blue transition-all">
                              <Sparkles size={20} />
                              <span className="text-[8px] mt-1">上传</span>
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">此刻心情</label>
                            <input
                              placeholder="此刻的心情是？"
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-sm"
                              value={newMemoryForm.mood}
                              onChange={(e) => setNewMemoryForm({ ...newMemoryForm, mood: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">日期</label>
                            <input
                              type="date"
                              required
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-sm"
                              value={newMemoryForm.date}
                              onChange={(e) => setNewMemoryForm({ ...newMemoryForm, date: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">标题</label>
                          <input
                            required
                            placeholder="给这段记忆起个名字"
                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-sm"
                            value={newMemoryForm.title}
                            onChange={(e) => setNewMemoryForm({ ...newMemoryForm, title: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">标签与目标</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              placeholder="回忆分组"
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-xs"
                              value={newMemoryForm.tag}
                              onChange={(e) => setNewMemoryForm({ ...newMemoryForm, tag: e.target.value })}
                            />
                            <select
                              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-xs appearance-none"
                              value={newMemoryForm.goalId}
                              onChange={(e) => setNewMemoryForm({ ...newMemoryForm, goalId: e.target.value })}
                            >
                              <option value="">不关联目标</option>
                              {goals.map(g => (
                                <option key={g.id} value={g.id}>{g.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">感悟与日记</label>
                          <textarea
                            required
                            placeholder="写下当下的心情..."
                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-sm min-h-[120px] resize-none"
                            value={newMemoryForm.content}
                            onChange={(e) => setNewMemoryForm({ ...newMemoryForm, content: e.target.value })}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-4 bg-sky-blue text-white font-bold rounded-2xl shadow-xl shadow-sky-blue/30 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                          <Check size={20} />
                          存入时光机
                        </button>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : activeTab === 'time' ? (
            <motion.div
              key="time"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6 flex-1 self-start"
            >
              {/* Header */}
              <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-sky-blue/5">
                <div className="space-y-1">
                  <h3 className="text-gray-800 font-bold font-serif-sc">时光胶囊</h3>
                  <p className="text-[10px] text-gray-400 font-medium">写给未来的信件</p>
                </div>
                <button 
                  onClick={() => setIsCapsuleModalOpen(true)}
                  className="p-3 bg-milk-yellow text-gray-700 rounded-2xl shadow-lg shadow-milk-yellow/20 hover:scale-105 active:scale-95 transition-all text-sm font-bold flex items-center gap-2"
                >
                  <Clock size={20} />
                  写信
                </button>
              </div>

              {/* Capsule List */}
              <div className="grid gap-6 pb-12">
                <AnimatePresence mode="popLayout">
                  {capsules
                    .sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime())
                    .map((capsule) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const openDate = new Date(capsule.openDate);
                      const isReady = openDate <= today;
                      const isExpanded = expandedCapsuleId === capsule.id;
                      
                      const diffDays = Math.ceil((openDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <motion.div
                          key={capsule.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          onClick={() => {
                            if (isReady) setExpandedCapsuleId(isExpanded ? null : capsule.id);
                          }}
                          className={`group relative rounded-[2rem] transition-all duration-500 overflow-hidden ${
                            isReady 
                              ? 'bg-white border-2 border-sky-blue/20 shadow-sm cursor-pointer' 
                              : 'bg-milk-yellow border-2 border-milk-yellow/50 shadow-sm'
                          }`}
                        >
                          {/* Envelope Flap (Visual) */}
                          {!isReady && (
                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-milk-yellow brightness-95" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                          )}

                          <div className={`p-6 relative z-10 ${isReady ? '' : 'pt-16'}`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="space-y-1">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                  isReady ? 'bg-sky-blue/10 text-sky-blue' : 'bg-black/5 text-gray-500'
                                }`}>
                                  To: {{ partner: 'Ta', self: '自己', couple: '我们' }[capsule.recipient]}
                                </span>
                                <h4 className={`text-lg font-bold font-serif-sc ${isReady ? 'text-gray-800' : 'text-gray-600'}`}>
                                  {capsule.title}
                                </h4>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); if(confirm('确定要销毁这封未来的信件吗？')) deleteCapsule(capsule.id); }}
                                className="p-2 text-gray-400/50 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            {!isReady ? (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Clock size={14} />
                                  <span className="text-sm font-serif-sc">开启日期: {capsule.openDate}</span>
                                </div>
                                <div className="bg-white/40 rounded-2xl p-4 text-center">
                                  <p className="text-xs text-gray-500 mb-1">距离启封还有</p>
                                  <div className="text-2xl font-playfair font-bold text-gray-700">
                                    {diffDays} <span className="text-xs">Days</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-green-500 text-[10px] font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    已开启
                                  </div>
                                  <span className="text-[10px] text-gray-300 font-bold tracking-widest">
                                    {capsule.openDate} 投递
                                  </span>
                                </div>
                                
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <p className="text-sm text-gray-600 leading-relaxed font-serif-sc pt-4 border-t border-gray-50 whitespace-pre-wrap">
                                        {capsule.content}
                                      </p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                
                                {!isExpanded && (
                                  <div className="text-center pt-2">
                                    <span className="text-[10px] font-bold text-sky-blue animate-bounce inline-block">点击开启信件</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>

                {capsules.length === 0 && (
                  <div className="text-center py-24 text-gray-300 font-serif-sc space-y-4">
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-sm mx-auto flex items-center justify-center text-milk-yellow">
                      <Clock size={32} />
                    </div>
                    <p className="text-sm">还没有埋下未来的时光胶囊哦 ~</p>
                  </div>
                )}
              </div>

              {/* Capsule Modal */}
              <AnimatePresence>
                {isCapsuleModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100 overflow-y-auto max-h-[90vh]"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-serif-sc font-bold text-gray-800">寄往未来的信</h3>
                        <button onClick={() => setIsCapsuleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                        </button>
                      </div>

                      <form onSubmit={addCapsule} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">收信人</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['partner', 'self', 'couple'] as const).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setNewCapsuleForm({ ...newCapsuleForm, recipient: r })}
                                className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                                  newCapsuleForm.recipient === r 
                                    ? 'bg-sky-blue text-white border-sky-blue' 
                                    : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'
                                }`}
                              >
                                {{ partner: 'Ta', self: '自己', couple: '我们' }[r]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">信件标题</label>
                          <input
                            required
                            placeholder="给这封信起个标题"
                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-sm"
                            value={newCapsuleForm.title}
                            onChange={(e) => setNewCapsuleForm({ ...newCapsuleForm, title: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">启封日期</label>
                          <input
                            type="date"
                            required
                            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-sm"
                            value={newCapsuleForm.openDate}
                            onChange={(e) => setNewCapsuleForm({ ...newCapsuleForm, openDate: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">信件内容</label>
                          <textarea
                            required
                            placeholder="写下你想对未来自己/Ta说的话..."
                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all font-serif-sc text-sm min-h-[150px] resize-none"
                            value={newCapsuleForm.content}
                            onChange={(e) => setNewCapsuleForm({ ...newCapsuleForm, content: e.target.value })}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-4 bg-sky-blue text-white font-bold rounded-2xl shadow-xl shadow-sky-blue/30 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                          <Check size={20} />
                          封存并投递
                        </button>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full py-20 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center text-milk-yellow">
                <Clock size={32} />
              </div>
              <h2 className="text-xl font-serif-sc text-gray-700 font-medium">即将上线</h2>
              <p className="text-sm text-gray-400">正在精心准备 "{navItems.find(i => i.id === activeTab)?.label}" 模块...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Setup Modal */}
      <AnimatePresence>
        {isSetupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif-sc font-bold text-gray-800">
                  {info ? '编辑资料' : '开始我们的故事'}
                </h3>
                {info && (
                  <button onClick={() => setIsSetupOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">在一起日期</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-sky-blue/30 font-serif-sc text-gray-700 outline-none transition-all"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">我的昵称</label>
                    <input
                      placeholder="你的名字"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-sky-blue/30 font-serif-sc text-gray-700 outline-none transition-all"
                      value={formData.myName}
                      onChange={(e) => setFormData({ ...formData, myName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Ta 的昵称</label>
                    <input
                      placeholder="Ta 的名字"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-sky-blue/30 font-serif-sc text-gray-700 outline-none transition-all"
                      value={formData.partnerName}
                      onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">一句话 Slogan</label>
                  <input
                    placeholder="例如：我们的专属故事"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-sky-blue/30 font-serif-sc text-gray-700 outline-none transition-all"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-sky-blue text-white font-bold rounded-2xl shadow-lg shadow-sky-blue/30 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  保存设置
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/40 p-2 flex justify-between items-center z-40">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 relative ${
              activeTab === item.id ? 'text-sky-blue' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-bold">{item.label}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="nav-dot"
                className="absolute -bottom-1 w-1 h-1 bg-sky-blue rounded-full"
              />
            )}
          </button>
        ))}
      </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
