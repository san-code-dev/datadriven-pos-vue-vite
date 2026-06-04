export const AccessMenu = [
    // --- SEKSI: OPERASIONAL & LAPANGAN ---
    {
        key: 'Court',
        icon: 'iconify:fluent:sport-tennis-24-regular',
        label: 'Manajemen Lapangan',
        route: '/court',
        api: '/api/court',
        menuCategory: 'court-management',
    },
    {
        key: 'Coach',
        icon: 'iconify:whh:referee',
        label: 'Data Pelatih',
        route: '/coach',
        api: '/api/coach',
        menuCategory: 'court-management',
    },
    {
        key: 'CourtBooking',
        icon: 'iconify:clarity:calendar-solid',
        label: 'Booking Lapangan',
        route: '/court-booking',
        api: '/api/court-booking',
        menuCategory: 'court-management',
    },
    {
        key: 'CoachingSession',
        icon: 'iconify:academic-cap-outline',
        label: 'Sesi Privat Coach',
        route: '/coaching-session',
        api: '/api/coaching-session',
        menuCategory: 'court-management',
    },

    // --- SEKSI: DATABASE PELANGGAN ---
    {
        key: 'Player',
        icon: 'iconify:mdi:tennis-player',
        label: 'Database Pemain',
        route: '/player',
        api: '/api/player',
        menuCategory: 'player-database',
    },

    // --- SEKSI: PRO SHOP & LOGISTIK ---
    {
        key: 'InventoryItem',
        icon: 'iconify:icon-park-outline:handle-round',
        label: 'Katalog Pro Shop',
        route: '/inventory',
        api: '/api/inventory',
        menuCategory: 'pro-shop-inventory',
    },

    // --- SEKSI: KEJUARAAN / TOURNAMENT ---
    {
        key: 'Championship',
        icon: 'iconify:fluent:trophy-24-regular',
        label: 'Master Turnamen',
        route: '/championship',
        api: '/api/championship',
        menuCategory: 'tournament-bracket',
    },
    {
        key: 'TournamentRegistration',
        icon: 'iconify:grommet-icons:group',
        label: 'Registrasi Turnamen',
        route: '/tournament-registration',
        api: '/api/tournament-registration',
        menuCategory: 'tournament-bracket',
    },
    {
        key: 'MatchScoreEntry',
        icon: 'iconify:fluent:scoreboard-24-regular',
        label: 'Skor Pertandingan',
        route: '/match-score',
        api: '/api/match-score',
        menuCategory: 'tournament-bracket',
    },

    // --- SEKSI: KEUANGAN ---
    {
        key: 'MembershipPackageSale',
        icon: 'iconify:ic:baseline-card-membership',
        label: 'Paket Deposit Member',
        route: '/membership-package',
        api: '/api/membership-package',
        menuCategory: 'finance-billing',
    }
];