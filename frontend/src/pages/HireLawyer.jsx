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
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ARIA_LABELS, PLACEHOLDERS } from '../constants';
import ThemeToggle from '../components/ThemeToggle';
import Breadcrumb from '../components/Breadcrumb';
import Footer from '../components/Footer';
import useKeyboardShortcut from "../hooks/useKeyboardShortcut";
import SearchShortcutHint from "../components/SearchShortcutHint";

function HighlightedText({ text, query }) {
  if (!query.trim()) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-nyaya-500/20 px-0.5 font-semibold text-nyaya-700 dark:text-nyaya-300">
        {text.slice(index, index + lowerQuery.length)}
      </mark>
      {text.slice(index + lowerQuery.length)}
    </>
  );
}

const MAX_SUGGESTIONS = 8;

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-court-walnut text-court-cream wood-panel transition-colors duration-300 font-sans">
      {/* Radial vignette backdrop */}
      <div className="absolute inset-0 court-vignette opacity-95 pointer-events-none z-0"></div>

      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-court-gold/25 bg-court-walnut/90 backdrop-blur-xl transition-all duration-300">
        <div className="flex items-center justify-between h-16 px-6 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 transition border rounded-full bg-court-walnut border-court-gold/30 hover:bg-court-gold hover:text-court-walnut text-court-cream cursor-pointer"
              aria-label={ARIA_LABELS.GO_BACK}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-court-cream cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span className="inline-flex items-center justify-center border rounded-full w-9 h-9 bg-court-gold/15 border-court-gold/25">
                <Scale className="w-5 h-5 text-court-gold" />
              </span>
              <span>
                Nyaya
                <span className="text-court-gold font-semibold">
                  Vanni
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-court-gold/10 border border-court-gold/25 text-court-gold text-sm font-semibold">
              {t('nav.directory')}
            </div>
            <ThemeToggle />
          </div>
        </div>
        <div className="px-6 py-2 mx-auto max-w-7xl border-t border-court-gold/15">
          <Breadcrumb />
        </div>
      </nav>

      <main className="relative z-10 px-6 pt-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block mb-5 px-4 py-1.5 rounded-full bg-court-gold/10 border border-court-gold/20 text-court-gold font-medium text-sm animate-pulse-soft">
            ⚖️ Legal Experts Directory
          </div>

          <h1 className="text-4xl font-bold tracking-tight font-serif text-court-cream md:text-5xl">
            {t('lawyers.title')}
          </h1>

          <p className="mt-4 text-base md:text-lg text-court-muted">
            {t('lawyers.disclaimer')}
          </p>
        </div>

        {/* Active Consultations */}
        {activeBookings.length > 0 && (
          <div className="mt-10 mb-10 court-card p-6 shadow-2xl rounded-3xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-court-gold/20">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-court-gold" />
                <h2 className="text-lg font-bold font-serif text-court-cream">
                  Your Active Consultations
                </h2>
              </div>
              <span className="px-3 py-1 text-xs font-semibold border rounded-full bg-court-gold/10 border-court-gold/25 text-court-gold">
                {activeBookings.length} Scheduled
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {activeBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 transition border rounded-2xl border-court-gold/20 bg-court-walnut/30 hover:border-court-gold/45 hover:bg-court-walnut/50"
                >
                  <img
                    src={booking.lawyer.image}
                    alt={booking.lawyer.name}
                    className="object-cover w-12 h-12 border rounded-full border-court-gold/25"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-court-cream truncate">
                      {booking.lawyer.name}
                    </h4>
                    <p className="text-xs font-semibold truncate text-court-gold">
                      {booking.lawyer.specialty}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-court-muted font-semibold">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-court-gold/70" />
                        {booking.date.split(',')[1] || booking.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-court-gold/70" />
                        {booking.time}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="px-3 py-2 text-xs font-semibold transition border rounded-full bg-court-walnut border-court-gold/25 hover:bg-rose-500/15 hover:border-rose-500/30 text-rose-450 cursor-pointer"
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
          <div className="court-card p-5 md:p-6 rounded-3xl shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row">
              {/* Search */}
              <div className="relative flex-1" ref={searchContainerRef}>
                <div className="absolute inset-y-0 flex items-center pointer-events-none left-4">
                  <Search className="w-5 h-5 text-court-gold/75" />
                </div>

                {searchTerm.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchFocused(false);
                      setHighlightedIndex(-1);
                    }}
                    className="absolute inset-y-0 px-3 my-auto text-sm transition border rounded-full right-3 h-9 bg-court-walnut border-court-gold/25 hover:border-court-gold/50 text-court-muted hover:text-court-cream cursor-pointer"
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
                  className="w-full py-4 pl-12 pr-20 text-court-cream transition border rounded-2xl bg-court-walnut/40 border-court-gold/30 placeholder:text-court-muted focus:outline-none focus:ring-2 focus:ring-court-gold/20 focus:border-court-gold"
                />

                {/* Keyboard shortcut hint */}
                <div className="absolute inset-y-0 right-14 flex items-center pointer-events-none">
                  <SearchShortcutHint />
                </div>

                {isDropdownOpen && (
                  <div
                    id="lawyer-search-suggestions"
                    role="listbox"
                    className="absolute z-20 w-full mt-1 overflow-hidden border shadow-2xl rounded-2xl border-court-gold/25 bg-court-walnut"
                  >
                    {suggestions.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-court-muted">
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
                                ? 'bg-court-gold/15 text-court-gold'
                                : 'hover:bg-court-gold/5 text-court-muted hover:text-court-cream'
                            }`}
                          >
                            <img
                              src={lawyer.image}
                              alt=""
                              className="object-cover w-9 h-9 border rounded-full border-court-gold/25 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate text-court-cream">
                                <HighlightedText
                                  text={lawyer.name}
                                  query={searchTerm}
                                />
                              </p>
                              <p className="text-xs truncate text-court-gold">
                                <HighlightedText
                                  text={lawyer.specialty}
                                  query={searchTerm}
                                />
                              </p>
                              <p className="flex items-center gap-1 mt-0.5 text-xs truncate text-court-muted">
                                <MapPin className="w-3 h-3 shrink-0 text-court-gold/60" />
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
                <div className="absolute inset-y-0 flex items-center pointer-events-none left-4">
                  <Filter className="w-5 h-5 text-court-gold/75" />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full py-4 pl-12 pr-10 text-court-cream transition border appearance-none cursor-pointer rounded-2xl bg-court-walnut/40 border-court-gold/30 focus:outline-none focus:ring-2 focus:ring-court-gold/20 focus:border-court-gold"
                >
                  {categories.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="bg-court-walnut text-court-cream"
                    >
                      {cat}
                    </option>
                  ))}
                </select>

                <div className="absolute inset-y-0 flex items-center pointer-events-none right-4 text-court-gold">
                  ▼
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4 text-sm text-court-muted">
              <p>
                {searchTerm.trim().length > 0 ? (
                  <>
                    Showing{' '}
                    <span className="font-semibold text-court-cream">
                      {filteredLawyers.length}
                    </span>{' '}
                    result(s)
                  </>
                ) : (
                  <>
                    Showing all{' '}
                    <span className="font-semibold text-court-cream">
                      {filteredLawyers.length}
                    </span>{' '}
                    available lawyers
                  </>
                )}
              </p>
              <p className="hidden sm:block">
                Tip: Search by{' '}
                <span className="text-court-cream font-semibold">
                  name
                </span>
                ,{' '}
                <span className="text-court-cream font-semibold">
                  specialty
                </span>
                , or{' '}
                <span className="text-court-cream font-semibold">
                  location
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {Array.from({ length: 6 }).map((_, index) => (
              <LawyerSkeleton key={index} />
            ))}
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="p-10 text-center court-card rounded-3xl shadow-xl">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-court-gold/60" />
            <h3 className="text-xl font-bold font-serif text-court-cream">
              No lawyers found
            </h3>
            <p className="mt-2 text-court-muted">
              Try adjusting your search or filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('All');
              }}
              className="inline-flex items-center justify-center px-6 py-3 mt-6 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredLawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                ref={(el) => {
                  lawyerCardRefs.current[lawyer.id] = el;
                }}
                className="group relative rounded-3xl court-card court-card-gold-hover p-6 flex flex-col justify-between min-h-[350px]"
              >
                {/* glow blob */}
                <div className="absolute transition-opacity duration-500 rounded-full opacity-0 pointer-events-none -top-10 -right-10 h-28 w-28 bg-court-gold/5 blur-3xl group-hover:opacity-100" />

                <div>
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 overflow-hidden transition rounded-full shrink-0 ring-2 ring-court-gold/25 group-hover:ring-court-gold">
                      <img
                        src={lawyer.image}
                        alt={lawyer.name}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-bold font-serif text-court-cream break-words transition-colors group-hover:text-court-gold">
                        {lawyer.name}
                      </h3>
                      <p className="text-sm font-semibold text-court-gold">
                        {lawyer.specialty}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-court-muted">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-court-gold/60" />
                      <span className="truncate">{lawyer.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-court-gold/60" />
                      <span>{lawyer.experience} Experience</span>
                    </div>

                    <div className="pt-3 mt-3 font-semibold border-t border-court-gold/15 text-court-cream">
                      {lawyer.fee}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleOpenBooking(lawyer)}
                    className="mt-6 w-full rounded-2xl py-3.5 px-4 font-bold text-court-walnut bg-court-gold hover:bg-yellow-500 shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" /> {t('lawyers.book')}
                    </span>
                  </button>

                  <p className="mt-3 text-[10px] text-court-muted/70 text-center">
                    Informational directory only (BCI compliant).
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <section className="relative z-10 w-full mt-8">
        <Footer />
      </section>

      {/* Modal */}
      {isModalOpen && selectedLawyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 transition-opacity duration-300 bg-court-walnut/70 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-xl bg-court-walnut border border-court-gold/25 rounded-3xl shadow-2xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-court-gold/20 shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 text-court-gold rounded-full bg-court-gold/15 border border-court-gold/25 shrink-0">
                  <Scale className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif text-court-cream">
                    Consultation Scheduler
                  </h3>
                  <p className="text-xs font-semibold text-court-gold">
                    NyayaVanni Instant Match
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-court-muted hover:text-court-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {!bookingComplete ? (
                <form onSubmit={handleConfirmBooking} className="space-y-6">
                  <div className="flex items-center gap-4 p-4 border bg-court-walnut/30 border-court-gold/20 rounded-2xl">
                    <img
                      src={selectedLawyer.image}
                      alt={selectedLawyer.name}
                      className="object-cover w-12 h-12 border rounded-full border-court-gold/25"
                    />
                    <div>
                      <h4 className="font-bold text-court-cream">
                        {selectedLawyer.name}
                      </h4>
                      <p className="text-xs font-semibold text-court-gold">
                        {selectedLawyer.specialty}
                      </p>
                      <p className="text-xs font-semibold text-court-muted mt-0.5">
                        {selectedLawyer.fee}
                      </p>
                    </div>
                  </div>

                  {/* Date selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold tracking-wider uppercase text-court-cream">
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
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border shrink-0 w-16 transition-all ${
                              isSelected
                                ? 'bg-court-gold border-court-gold text-court-walnut shadow-md font-bold'
                                : 'bg-court-walnut/40 border-court-gold/20 hover:border-court-gold/50 text-court-muted hover:text-court-cream'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                              {d.dayName}
                            </span>
                            <span className="text-lg font-extrabold my-0.5 leading-none">
                              {d.dayNum}
                            </span>
                            <span className="text-[9px] uppercase font-semibold">
                              {d.month}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold tracking-wider uppercase text-court-cream">
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
                            className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                              isPast || booked
                                ? 'opacity-50 cursor-not-allowed border-court-gold/10 bg-court-walnut/20 text-court-muted/50'
                                : isSelected
                                  ? 'bg-court-gold border-court-gold text-court-walnut shadow-md font-bold'
                                  : 'bg-court-walnut/40 border-court-gold/20 hover:border-court-gold/50 text-court-muted hover:text-court-cream'
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
                    <label className="block text-xs font-bold tracking-wider uppercase text-court-cream">
                      Legal Context
                    </label>
                    <div
                      onClick={() => setAttachDocument(!attachDocument)}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                        attachDocument
                          ? 'bg-court-gold/10 border-court-gold/40 shadow-sm'
                          : 'bg-court-walnut/40 border-court-gold/20 hover:border-court-gold/40'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                          attachDocument
                            ? 'bg-court-gold border-court-gold text-court-walnut'
                            : 'border-court-gold/20 bg-court-walnut'
                        }`}
                      >
                        {attachDocument && (
                          <Check className="w-3.5 h-3.5 stroke-3 text-court-walnut font-bold" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <FileText
                            className={`w-4 h-4 ${attachDocument ? 'text-court-gold' : 'text-court-muted'}`}
                          />
                          <h5 className="text-xs font-bold text-court-cream">
                            Attach Document Analysis
                          </h5>
                        </div>
                        <p className="text-[11px] text-court-muted font-semibold mt-1">
                          Share your active analyzed legal document
                          automatically with {selectedLawyer.name} for instant
                          briefing.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Case summary */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold tracking-wider uppercase text-court-cream">
                      Case Summary or Questions
                    </label>
                    <textarea
                      placeholder={PLACEHOLDERS.HIRE_LAWYER_CASE}
                      value={caseDescription}
                      onChange={(e) => setCaseDescription(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-xs font-medium border bg-court-walnut/30 border-court-gold/20 rounded-xl text-court-cream placeholder:text-court-muted focus:outline-none focus:ring-2 focus:ring-court-gold/20 focus:border-court-gold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-court-walnut bg-court-gold hover:bg-yellow-500 transition-all duration-300 shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Confirm Consultation Booking
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 animate-pulse">
                    <BadgeCheck className="w-8 h-8" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold font-serif text-court-cream">
                      Appointment Confirmed!
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-court-muted">
                      Your instant match ticket has been generated below.
                    </p>
                  </div>

                  <div className="relative w-full max-w-sm overflow-hidden text-court-cream border shadow-2xl bg-court-walnut/90 rounded-2xl border-court-gold/25">
                    <div className="absolute w-4 h-4 -translate-y-1/2 border-r rounded-full bg-court-walnut -left-2 top-1/2 border-court-gold/25" />
                    <div className="absolute w-4 h-4 -translate-y-1/2 border-l rounded-full bg-court-walnut -right-2 top-1/2 border-court-gold/25" />

                    <div className="relative p-5 pb-6 border-b border-dashed border-court-gold/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] tracking-widest font-black uppercase text-court-gold">
                          NYAYAVANNI TICKET
                        </span>
                        <span className="text-[10px] font-mono text-court-muted uppercase">
                          {currentTicket?.meetingCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-5">
                        <img
                          src={currentTicket?.lawyer?.image}
                          alt={currentTicket?.lawyer?.name}
                          className="object-cover w-12 h-12 border-2 rounded-full border-court-gold/30"
                        />
                        <div>
                          <h4 className="text-sm font-extrabold text-court-cream">
                            {currentTicket?.lawyer?.name}
                          </h4>
                          <p className="text-[11px] text-court-gold font-bold uppercase">
                            {currentTicket?.lawyer?.specialty}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-court-muted font-bold block uppercase">
                            Date
                          </span>
                          <span className="font-semibold text-court-cream">
                            {currentTicket?.date?.split(',')[1] ||
                              currentTicket?.date}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-court-muted font-bold block uppercase">
                            Time Slot
                          </span>
                          <span className="font-semibold text-court-cream">
                            {currentTicket?.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-6 bg-court-walnut/40">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-court-muted font-bold block uppercase">
                            Legal Briefing
                          </span>
                          <span className="text-[11px] font-bold text-court-cream flex items-center gap-1">
                            {currentTicket?.attachedContext ? (
                              <>
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{' '}
                                Context Attached
                              </>
                            ) : (
                              <>
                                <BadgeAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />{' '}
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
                                  className="bg-court-gold/40"
                                  style={{ width: `${w}px`, height: '24px' }}
                                />
                              )
                            )}
                          </div>
                          <span className="text-[8px] font-mono text-court-muted">
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
                      className="flex-1 bg-court-walnut/30 hover:bg-court-gold/10 text-court-cream border border-court-gold/25 font-bold py-3 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <CalendarDays className="w-4 h-4 text-court-gold" /> Add to
                      Calendar
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 text-xs font-bold text-court-walnut bg-court-gold hover:bg-yellow-500 rounded-xl"
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
