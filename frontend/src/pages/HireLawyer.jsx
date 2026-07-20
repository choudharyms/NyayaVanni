import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import LawyerSkeleton from '../components/LawyerSkeleton';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  Scale,
  Search,
  Filter,
  Clock,
  X,
  Check,
  FileText,
  Bookmark,
  CalendarDays,
  BadgeAlert,
  BadgeCheck,
  SearchX,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ARIA_LABELS, PLACEHOLDERS } from '../constants';
import ThemeToggle from '../components/ThemeToggle';
import Breadcrumb from '../components/Breadcrumb';
import Footer from '../components/Footer';
import useKeyboardShortcut from '../hooks/useKeyboardShortcut';
import SearchShortcutHint from '../components/SearchShortcutHint';

function HighlightedText({ text, query }) {
  if (!query.trim()) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-nyaya-500/20 text-nyaya-700 dark:text-nyaya-300 rounded px-0.5 font-semibold">
        {text.slice(index, index + lowerQuery.length)}
      </mark>
      {text.slice(index + lowerQuery.length)}
    </>
  );
}

const MAX_SUGGESTIONS = 8;

const POPULAR_AREAS = [
  'Real Estate & Property',
  'Family Law & Divorce',
  'Criminal Defense',
  'Corporate & Business',
  'Civil Litigation',
  'Intellectual Property',
];

function EmptyState({ searchTerm, filterType, onReset, onSelectArea }) {
  const hasSearch = searchTerm.trim().length > 0;
  const hasFilter = filterType !== 'All';

  return (
    <div className="flex flex-col items-center justify-center rounded-4xl border border-slate-200 bg-white/60 px-6 py-20 text-center shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="bg-nyaya-500/10 dark:bg-nyaya-500/20 pointer-events-none absolute inset-0 scale-150 rounded-full blur-2xl" />
        <div className="from-nyaya-500/15 dark:from-nyaya-500/25 border-nyaya-500/20 dark:border-nyaya-500/30 relative flex h-28 w-28 items-center justify-center rounded-full border bg-gradient-to-br to-blue-600/15 shadow-lg dark:to-blue-600/25">
          <div className="from-nyaya-500/20 dark:from-nyaya-500/30 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br to-blue-600/20 dark:to-blue-600/30">
            <SearchX className="text-nyaya-600 dark:text-nyaya-300 h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Heading */}
      <h3 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
        {hasSearch
          ? `No results for "${searchTerm}"`
          : hasFilter
            ? `No lawyers in "${filterType}"`
            : 'No lawyers found'}
      </h3>

      {/* Subtext */}
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {hasSearch && hasFilter
          ? `We couldn't find any ${filterType} lawyers matching "${searchTerm}". Try broadening your search or resetting the filters.`
          : hasSearch
            ? `We couldn't find any lawyers matching "${searchTerm}". Check the spelling or try a different keyword.`
            : hasFilter
              ? `There are no lawyers listed under "${filterType}" right now. Browse another practice area below.`
              : 'No lawyers match your current criteria. Try adjusting your search or filters.'}
      </p>

      {/* Quick area suggestions */}
      <div className="mb-8 w-full max-w-lg">
        <p className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
          Browse popular practice areas
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR_AREAS.filter((area) => area !== filterType).map((area) => (
            <button
              key={area}
              onClick={() => onSelectArea(area)}
              className="hover:bg-nyaya-500/10 hover:border-nyaya-500/30 hover:text-nyaya-600 dark:hover:bg-nyaya-500/15 dark:hover:border-nyaya-500/30 dark:hover:text-nyaya-300 cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="from-nyaya-500 hover:from-nyaya-400 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.03] hover:to-blue-500 active:scale-[0.99]"
      >
        <X className="h-4 w-4" />
        Reset All Filters
      </button>
    </div>
  );
}

export default function HireLawyer() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const isDropdownOpen = isSearchFocused && searchTerm.trim().length > 0;

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const lawyerCardRefs = useRef({});

  // Ctrl+K / Cmd+K to focus search
  useKeyboardShortcut('k', () => {
    searchInputRef.current?.focus();
  });

  // Modal / Booking State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [attachDocument, setAttachDocument] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);

  // Persistence State
  const [activeBookings, setActiveBookings] = useState(() => {
    try {
      const stored = localStorage.getItem('nyayavanni_consultations');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load consultations', e);
      return [];
    }
  });

  const [bookingSearchTerm, setBookingSearchTerm] = useState('');

  const filteredBookings = useMemo(() => {
    return activeBookings.filter((booking) => {
      const q = bookingSearchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        booking.lawyer.name.toLowerCase().includes(q) ||
        booking.lawyer.specialty.toLowerCase().includes(q) ||
        (booking.caseDescription &&
          booking.caseDescription.toLowerCase().includes(q))
      );
    });
  }, [activeBookings, bookingSearchTerm]);

  // Mock Data for Lawyers (BCI Compliant - No Ratings)
  const mockLawyers = useMemo(
    () => [
      {
        id: 1,
        name: 'Adv. Rahul Sharma',
        specialty: 'Real Estate & Property',
        experience: '15 Years',
        location: 'New Delhi, Delhi',
        fee: '₹2,000/Consultation',
        image:
          'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256',
      },
      {
        id: 2,
        name: 'Adv. Priya Desai',
        specialty: 'Family Law & Divorce',
        experience: '12 Years',
        location: 'Mumbai, Maharashtra',
        fee: '₹2,500/Consultation',
        image:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256&h=256',
      },
      {
        id: 3,
        name: 'Adv. Vikram Singh',
        specialty: 'Corporate & Business',
        experience: '20 Years',
        location: 'Bengaluru, Karnataka',
        fee: '₹5,000/Consultation',
        image:
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256&h=256',
      },
      {
        id: 4,
        name: 'Adv. Neha Gupta',
        specialty: 'Criminal Defense',
        experience: '8 Years',
        location: 'Pune, Maharashtra',
        fee: '₹1,500/Consultation',
        image:
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256&h=256',
      },
      {
        id: 5,
        name: 'Adv. Anil Kumar',
        specialty: 'Civil Litigation',
        experience: '18 Years',
        location: 'Chennai, Tamil Nadu',
        fee: '₹3,000/Consultation',
        image:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256&h=256',
      },
      {
        id: 6,
        name: 'Adv. Meera Reddy',
        specialty: 'Intellectual Property',
        experience: '10 Years',
        location: 'Hyderabad, Telangana',
        fee: '₹4,000/Consultation',
        image:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256&h=256',
      },
    ],
    []
  );

  const categories = useMemo(
    () => [
      'All',
      'Real Estate & Property',
      'Family Law & Divorce',
      'Corporate & Business',
      'Criminal Defense',
      'Civil Litigation',
      'Intellectual Property',
    ],
    []
  );

  // Helper: next 7 days
  const datesList = useMemo(() => {
    const dates = [];
    const locale = 'en-US';
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        fullDate: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString(locale, { weekday: 'short' }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString(locale, { month: 'short' }),
      });
    }
    return dates;
  }, []);

  const timeSlots = useMemo(
    () => [
      '09:30 AM',
      '11:00 AM',
      '01:30 PM',
      '03:00 PM',
      '04:30 PM',
      '06:00 PM',
    ],
    []
  );

  // Filter logic
  const filteredLawyers = useMemo(() => {
    return mockLawyers.filter((lawyer) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        lawyer.name.toLowerCase().includes(s) ||
        lawyer.specialty.toLowerCase().includes(s) ||
        lawyer.location.toLowerCase().includes(s);
      const matchesFilter =
        filterType === 'All' || lawyer.specialty === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [mockLawyers, searchTerm, filterType]);

  const suggestions = useMemo(() => {
    const query = searchTerm.trim();
    if (!query) return [];

    const s = query.toLowerCase();
    return mockLawyers
      .filter((lawyer) => {
        const matchesSearch =
          lawyer.name.toLowerCase().includes(s) ||
          lawyer.specialty.toLowerCase().includes(s) ||
          lawyer.location.toLowerCase().includes(s);
        const matchesFilter =
          filterType === 'All' || lawyer.specialty === filterType;
        return matchesSearch && matchesFilter;
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [mockLawyers, searchTerm, filterType]);

  const handleSelectSuggestion = useCallback((lawyer) => {
    setSearchTerm(lawyer.name);
    setIsSearchFocused(false);
    setHighlightedIndex(-1);
    searchInputRef.current?.blur();

    requestAnimationFrame(() => {
      lawyerCardRefs.current[lawyer.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsSearchFocused(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSearchFocused(false);
        setHighlightedIndex(-1);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDropdownOpen]);

  const handleSearchKeyDown = (event) => {
    if (!isDropdownOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        if (suggestions.length === 0) return -1;
        return prev < suggestions.length - 1 ? prev + 1 : 0;
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        if (suggestions.length === 0) return -1;
        return prev > 0 ? prev - 1 : suggestions.length - 1;
      });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else if (suggestions.length === 1) {
        handleSelectSuggestion(suggestions[0]);
      }
    }
  };

  const handleOpenBooking = (lawyer) => {
    setSelectedLawyer(lawyer);
    setSelectedDate(datesList[0]?.fullDate || '');
    setSelectedTime(timeSlots[0] || '');
    setCaseDescription('');
    setAttachDocument(false);
    setBookingComplete(false);
    setCurrentTicket(null);
    setIsModalOpen(true);
  };

  const isPastTimeSlot = (date, time) => {
    const now = new Date();

    const [timePart, meridiem] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return slotDateTime < now;
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!selectedLawyer || !selectedDate || !selectedTime) return;

    if (isPastTimeSlot(selectedDate, selectedTime)) {
      alert('Cannot book a consultation in the past.');
      return;
    }

    const existingBooking = activeBookings.some(
      (booking) =>
        booking.lawyer.id === selectedLawyer.id &&
        booking.rawDate === selectedDate &&
        booking.time === selectedTime
    );

    if (existingBooking) {
      alert('This lawyer is already booked for the selected date and time.');
      return;
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const meetingCode = `NV-${randomId}-${selectedLawyer.name
      .split(' ')
      .pop()
      .toUpperCase()}`;

    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const newBooking = {
      id: Date.now(),
      meetingCode,
      lawyer: selectedLawyer,
      date: formattedDate,
      rawDate: selectedDate,
      time: selectedTime,
      description: caseDescription,
      attachedContext: attachDocument
        ? 'NyayaVanni_Extracted_Context.pdf'
        : null,
      bookedAt: new Date().toLocaleDateString(),
    };

    const updatedBookings = [newBooking, ...activeBookings];
    setActiveBookings(updatedBookings);
    localStorage.setItem(
      'nyayavanni_consultations',
      JSON.stringify(updatedBookings)
    );

    setCurrentTicket(newBooking);
    setBookingComplete(true);
  };

  const handleCancelBooking = (bookingId) => {
    if (
      window.confirm(
        'Are you sure you want to cancel this consultation booking?'
      )
    ) {
      const next = activeBookings.filter((b) => b.id !== bookingId);
      setActiveBookings(next);
      localStorage.setItem('nyayavanni_consultations', JSON.stringify(next));
    }
  };

  const isTimeSlotBooked = (date, time) => {
    return activeBookings.some(
      (booking) =>
        booking.lawyer.id === selectedLawyer?.id &&
        booking.rawDate === date &&
        booking.time === time
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('All');
  };

  const handleSelectArea = (area) => {
    setFilterType(area);
    setSearchTerm('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Background gradients (match LandingPage) */}
      <div className="bg-nyaya-500/10 dark:bg-nyaya-500/25 pointer-events-none absolute top-[-10%] left-[-10%] h-[55%] w-[55%] rounded-full mix-blend-multiply blur-[140px] dark:mix-blend-screen" />
      <div className="pointer-events-none absolute right-[-12%] bottom-[-12%] h-[60%] w-[60%] rounded-full bg-blue-600/10 mix-blend-multiply blur-[160px] dark:bg-blue-600/20 dark:mix-blend-screen" />

      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/60 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-900/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label={ARIA_LABELS.GO_BACK}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div
              className="flex cursor-pointer items-center gap-2 text-xl font-bold tracking-tight text-slate-800 dark:text-white"
              onClick={() => navigate('/')}
            >
              <span className="bg-nyaya-500/15 border-nyaya-500/25 inline-flex h-9 w-9 items-center justify-center rounded-full border">
                <Scale className="text-nyaya-600 dark:text-nyaya-400 h-5 w-5" />
              </span>
              <span>
                Nyaya
                <span className="text-nyaya-600 dark:text-nyaya-400">
                  Vanni
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm text-slate-700 sm:flex dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              {t('nav.directory')}
            </div>
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-slate-100 px-6 py-2 dark:border-white/5">
          <Breadcrumb />
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-10">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-nyaya-500/10 border-nyaya-500/20 text-nyaya-600 dark:text-nyaya-300 mb-5 inline-block rounded-full border px-4 py-1.5 text-sm font-medium">
            Legal Experts Directory
          </div>

          <h1 className="text-slate-850 text-4xl font-extrabold tracking-tight md:text-5xl dark:text-white">
            {t('lawyers.title')}
          </h1>

          <p className="mt-4 text-base text-slate-600 md:text-lg dark:text-slate-300">
            {t('lawyers.disclaimer')}
          </p>
        </div>

        {/* Active Consultations */}
        {activeBookings.length > 0 && (
          <div className="mt-10 mb-10 rounded-4xl border border-slate-200 bg-white/60 p-6 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
            <div className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-white/10">
              <div className="flex items-center gap-2">
                <Bookmark className="text-nyaya-600 dark:text-nyaya-300 h-5 w-5" />
                <h2 className="text-slate-850 text-lg font-bold dark:text-white">
                  Your Active Consultations
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter consultations..."
                  value={bookingSearchTerm}
                  onChange={(e) => setBookingSearchTerm(e.target.value)}
                  className="focus:ring-nyaya-500/70 focus:border-nyaya-500/50 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm text-slate-900 transition focus:ring-2 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                />
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  {filteredBookings.length} of {activeBookings.length} Scheduled
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/50 p-4 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950/30 dark:hover:bg-slate-950/45"
                >
                  <img
                    src={booking.lawyer.image}
                    alt={booking.lawyer.name}
                    className="h-12 w-12 rounded-full border border-slate-200 object-cover dark:border-white/10"
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-bold text-slate-800 dark:text-white">
                      {booking.lawyer.name}
                    </h4>
                    <p className="text-nyaya-600 dark:text-nyaya-300 truncate text-xs font-semibold">
                      {booking.lawyer.specialty}
                    </p>

                    <div className="mt-1.5 flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        {booking.date.split(',')[1] || booking.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        {booking.time}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="border-slate-250 cursor-pointer rounded-full border bg-slate-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-500/30 hover:bg-rose-500/15 dark:border-white/10 dark:bg-white/5 dark:text-rose-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/15"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div className="mt-10 mb-10">
          <div className="rounded-4xl border border-slate-200 bg-white/60 p-5 shadow-md backdrop-blur-xl md:p-6 dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex flex-col gap-4 md:flex-row">
              {/* Search */}
              <div className="relative flex-1" ref={searchContainerRef}>
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>

                {searchTerm.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchFocused(false);
                      setHighlightedIndex(-1);
                    }}
                    className="absolute inset-y-0 right-3 my-auto h-9 cursor-pointer rounded-full border border-slate-200 bg-slate-100 px-3 text-sm text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    Clear
                  </button>
                )}

                <input
                  ref={searchInputRef}
                  type="text"
                  role="combobox"
                  aria-expanded={isDropdownOpen}
                  aria-controls="lawyer-search-suggestions"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    highlightedIndex >= 0
                      ? `lawyer-suggestion-${suggestions[highlightedIndex]?.id}`
                      : undefined
                  }
                  placeholder={t('lawyers.search')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onKeyDown={handleSearchKeyDown}
                  className="focus:ring-nyaya-500/70 focus:border-nyaya-500/50 w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-20 pl-12 text-slate-900 transition placeholder:text-slate-500 focus:ring-2 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-white dark:placeholder:text-slate-400"
                />

                {/* Keyboard shortcut hint */}
                <div className="pointer-events-none absolute inset-y-0 right-14 flex items-center">
                  <SearchShortcutHint />
                </div>

                {isDropdownOpen && (
                  <div
                    id="lawyer-search-suggestions"
                    role="listbox"
                    className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900"
                  >
                    {suggestions.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        No lawyers found
                      </p>
                    ) : (
                      <ul className="py-1">
                        {suggestions.map((lawyer, index) => (
                          <li
                            key={lawyer.id}
                            id={`lawyer-suggestion-${lawyer.id}`}
                            role="option"
                            aria-selected={highlightedIndex === index}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onClick={() => handleSelectSuggestion(lawyer)}
                            className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                              highlightedIndex === index
                                ? 'bg-nyaya-500/10 dark:bg-nyaya-500/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <img
                              src={lawyer.image}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover dark:border-white/10"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                                <HighlightedText
                                  text={lawyer.name}
                                  query={searchTerm}
                                />
                              </p>
                              <p className="text-nyaya-600 dark:text-nyaya-300 truncate text-xs">
                                <HighlightedText
                                  text={lawyer.specialty}
                                  query={searchTerm}
                                />
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                <MapPin className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
                                <HighlightedText
                                  text={lawyer.location}
                                  query={searchTerm}
                                />
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Filter */}
              <div className="relative md:w-72">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <Filter className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="focus:ring-nyaya-500/70 focus:border-nyaya-500/50 w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-10 pl-12 text-slate-900 transition focus:ring-2 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                >
                  {categories.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                    >
                      {cat}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 dark:text-slate-500">
                  ▼
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
              <p>
                {searchTerm.trim().length > 0 ? (
                  <>
                    Showing{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {filteredLawyers.length}
                    </span>{' '}
                    result(s)
                  </>
                ) : (
                  <>
                    Showing all{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {filteredLawyers.length}
                    </span>{' '}
                    available lawyers
                  </>
                )}
              </p>
              <p className="hidden sm:block">
                Tip: Search by{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  name
                </span>
                ,{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  specialty
                </span>
                , or{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  location
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LawyerSkeleton key={index} />
            ))}
          </div>
        ) : filteredLawyers.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            filterType={filterType}
            onReset={handleResetFilters}
            onSelectArea={handleSelectArea}
          />
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filteredLawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                ref={(el) => {
                  lawyerCardRefs.current[lawyer.id] = el;
                }}
                className="group hover:border-nyaya-500/40 relative rounded-4xl border border-slate-200 bg-white/70 p-6 shadow-md backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_45px_rgba(37,99,235,0.15)] dark:border-white/10 dark:bg-slate-900/65 dark:hover:shadow-[0_0_45px_rgba(37,99,235,0.22)]"
              >
                {/* glow blobs */}
                <div className="bg-nyaya-500/10 dark:bg-nyaya-500/20 pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-blue-500/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-blue-500/20" />

                <div className="flex items-start gap-4">
                  <div className="group-hover:ring-nyaya-500/40 relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-200 transition dark:ring-white/10">
                    <img
                      src={lawyer.image}
                      alt={lawyer.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-slate-850 group-hover:text-nyaya-600 dark:group-hover:text-nyaya-300 text-lg font-bold break-words transition-colors dark:text-white">
                      {lawyer.name}
                    </h3>
                    <p className="text-nyaya-600 dark:text-nyaya-300/90 text-sm font-semibold">
                      {lawyer.specialty}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span className="truncate">{lawyer.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>{lawyer.experience} Experience</span>
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-3 font-semibold text-slate-800 dark:border-white/10 dark:text-slate-100">
                    {lawyer.fee}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBooking(lawyer)}
                  className="from-nyaya-500 mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r to-blue-600 px-4 py-3.5 font-semibold text-white shadow-[0_0_25px_rgba(37,99,235,0.15)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] dark:shadow-[0_0_25px_rgba(37,99,235,0.22)]"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" /> {t('lawyers.book')}
                  </span>
                </button>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                  Informational directory only (BCI compliant).
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <section className="z-10 w-full">
        <Footer />
      </section>

      {/* Modal */}
      {isModalOpen && selectedLawyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
          />

          <div className="relative flex max-h-[90vh] w-full max-w-xl scale-100 transform flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl transition-all dark:border-white/10 dark:bg-slate-900/95">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-6 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Scale className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Consultation Scheduler
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    NyayaVanni Instant Match
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!bookingComplete ? (
                <form onSubmit={handleConfirmBooking} className="space-y-6">
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40">
                    <img
                      src={selectedLawyer.image}
                      alt={selectedLawyer.name}
                      className="h-12 w-12 rounded-full border object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">
                        {selectedLawyer.name}
                      </h4>
                      <p className="text-xs font-semibold text-blue-600">
                        {selectedLawyer.specialty}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {selectedLawyer.fee}
                      </p>
                    </div>
                  </div>

                  {/* Date selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      Select Date Slot
                    </label>
                    <div className="flex gap-2.5 overflow-x-auto pb-2">
                      {datesList.map((d) => {
                        const isSelected = selectedDate === d.fullDate;
                        return (
                          <button
                            key={d.fullDate}
                            type="button"
                            onClick={() => setSelectedDate(d.fullDate)}
                            className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-xl border p-3 transition-all ${
                              isSelected
                                ? 'border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/10 dark:border-blue-600 dark:bg-blue-600'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:border-blue-500/40'
                            }`}
                          >
                            <span className="text-[10px] font-bold tracking-wider uppercase">
                              {d.dayName}
                            </span>
                            <span className="my-0.5 text-lg leading-none font-extrabold">
                              {d.dayNum}
                            </span>
                            <span className="text-[9px] font-semibold uppercase">
                              {d.month}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      Select Available Time
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => {
                        const booked = isTimeSlotBooked(selectedDate, time);
                        const isSelected = selectedTime === time;
                        const isPast = isPastTimeSlot(selectedDate, time);
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isPast || booked}
                            onClick={() =>
                              !(isPast || booked) && setSelectedTime(time)
                            }
                            className={`rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
                              isPast || booked
                                ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400 opacity-50'
                                : isSelected
                                  ? 'border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/10 dark:border-blue-600 dark:bg-blue-600'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:border-blue-500/40'
                            }`}
                          >
                            {booked ? `${time} (Booked)` : time}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attach context */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      Legal Context
                    </label>
                    <div
                      onClick={() => setAttachDocument(!attachDocument)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                        attachDocument
                          ? 'border-blue-200 bg-blue-50/50 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/40 dark:hover:border-blue-500/30'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          attachDocument
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {attachDocument && (
                          <Check className="h-3.5 w-3.5 stroke-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <FileText
                            className={`h-4 w-4 ${attachDocument ? 'text-blue-600' : 'text-slate-400'}`}
                          />
                          <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                            Attach Document Analysis
                          </h5>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Share your active analyzed legal document
                          automatically with {selectedLawyer.name} for instant
                          briefing.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Case summary */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      Case Summary or Questions
                    </label>
                    <textarea
                      placeholder={PLACEHOLDERS.HIRE_LAWYER_CASE}
                      value={caseDescription}
                      onChange={(e) => setCaseDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border bg-slate-50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:bg-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="from-nyaya-500 hover:from-nyaya-400 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r to-blue-600 px-4 py-3.5 font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:to-blue-500"
                  >
                    Confirm Consultation Booking
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                  <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <BadgeCheck className="h-8 w-8" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-900">
                      Appointment Confirmed!
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Your instant match ticket has been generated below.
                    </p>
                  </div>

                  <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900 to-slate-950 text-white shadow-xl">
                    <div className="absolute top-1/2 -left-2 h-4 w-4 -translate-y-1/2 rounded-full border-r border-slate-800 bg-white/95" />
                    <div className="absolute top-1/2 -right-2 h-4 w-4 -translate-y-1/2 rounded-full border-l border-slate-800 bg-white/95" />

                    <div className="relative border-b border-dashed border-slate-800 p-5 pb-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">
                          NYAYAVANNI TICKET
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 uppercase">
                          {currentTicket?.meetingCode}
                        </span>
                      </div>

                      <div className="mb-5 flex items-center gap-4">
                        <img
                          src={currentTicket?.lawyer?.image}
                          alt={currentTicket?.lawyer?.name}
                          className="h-12 w-12 rounded-full border-2 border-blue-500/20 object-cover"
                        />
                        <div>
                          <h4 className="text-sm font-extrabold">
                            {currentTicket?.lawyer?.name}
                          </h4>
                          <p className="text-[11px] font-bold text-blue-400 uppercase">
                            {currentTicket?.lawyer?.specialty}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-500 uppercase">
                            Date
                          </span>
                          <span className="font-semibold text-slate-200">
                            {currentTicket?.date?.split(',')[1] ||
                              currentTicket?.date}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-500 uppercase">
                            Time Slot
                          </span>
                          <span className="font-semibold text-slate-200">
                            {currentTicket?.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 p-5 pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="block text-[9px] font-bold text-slate-500 uppercase">
                            Legal Briefing
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                            {currentTicket?.attachedContext ? (
                              <>
                                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />{' '}
                                Context Attached
                              </>
                            ) : (
                              <>
                                <BadgeAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" />{' '}
                                No Context
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-0.5">
                            {[1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4].map(
                              (w, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-400"
                                  style={{ width: `${w}px`, height: '24px' }}
                                />
                              )
                            )}
                          </div>
                          <span className="font-mono text-[8px] text-slate-500">
                            MEMBER SLOT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full max-w-sm gap-3">
                    <button
                      onClick={() =>
                        alert('Adding to Google Calendar... Done!')
                      }
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                    >
                      <CalendarDays className="h-4 w-4 text-slate-500" /> Add to
                      Calendar
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white transition-all hover:bg-blue-600"
                    >
                      Dismiss Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
