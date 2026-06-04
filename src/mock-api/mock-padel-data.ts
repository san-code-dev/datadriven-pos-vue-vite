import { generateDynamicData } from '@/composables/generate-mock-data';

// ==========================================
// TIPE: MASTER COMPONENT DEFAULT
// ==========================================

export const Court = {
    type: 'master', // <-- Kembali menggunakan default map router Anda
    label: 'Manajemen Lapangan',
    schema: [
        { key: 'id', label: 'Court ID', type: 'display', primary: true, readonly: true },
        { key: 'nmCourt', label: 'Nama Lapangan', type: 'text' },
        { key: 'courtType', label: 'Tipe Lapangan', type: 'text' },
        { key: 'pricePerHour', label: 'Harga / Jam', type: 'currency' }
    ],
    data: [] as any[]
};
Court.data = generateDynamicData(Court.schema, 6);

export const Coach = {
    type: 'master',
    label: 'Data Pelatih',
    schema: [
        { key: 'id', label: 'Coach ID', type: 'display', primary: true, readonly: true },
        { key: 'nmCoach', label: 'Nama Pelatih', type: 'text' },
        { key: 'hourlyRate', label: 'Tarif / Jam', type: 'currency' }
    ],
    data: [] as any[]
};
Coach.data = generateDynamicData(Coach.schema, 8);

export const Player = {
    type: 'master',
    label: 'Database Pemain',
    schema: [
        { key: 'id', label: 'Player ID', type: 'display', primary: true, readonly: true },
        { key: 'nmPlayer', label: 'Nama Pemain', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'skillRating', label: 'Skill Rating', type: 'number' }
    ],
    data: [] as any[]
};
Player.data = generateDynamicData(Player.schema, 40);

export const InventoryItem = {
    type: 'master',
    label: 'Katalog Pro Shop',
    schema: [
        { key: 'id', label: 'Item ID', type: 'display', primary: true, readonly: true },
        { key: 'nmItem', label: 'Nama Barang', type: 'text' },
        { key: 'price', label: 'Harga', type: 'currency' },
        { key: 'stock', label: 'Stok Toko', type: 'number' }
    ],
    data: [] as any[]
};
InventoryItem.data = generateDynamicData(InventoryItem.schema, 25);

export const Championship = {
    type: 'master',
    label: 'Master Turnamen',
    schema: [
        { key: 'id', label: 'Championship ID', type: 'display', primary: true, readonly: true },
        { key: 'nmChampionship', label: 'Nama Turnamen', type: 'text' },
        { key: 'registrationFee', label: 'Biaya Masuk', type: 'currency' }
    ],
    data: [] as any[]
};
Championship.data = generateDynamicData(Championship.schema, 4);


// ==========================================
// TIPE: TRANSACTION COMPONENT DEFAULT
// ==========================================

export const CourtBooking = {
    type: 'transaction', // <-- Kembali menggunakan default map router Anda
    label: 'Booking Lapangan',
    schema: [
        { key: 'id', label: 'Booking Code', type: 'display', primary: true },
        { key: 'bookingDate', label: 'Tanggal Main', type: 'date' },
        { key: 'totalAmount', label: 'Total Pembayaran', type: 'currency' }
    ],
    data: [] as any[]
};
CourtBooking.data = generateDynamicData(CourtBooking.schema, 15);

export const CoachingSession = {
    type: 'transaction',
    label: 'Sesi Privat Coach',
    schema: [
        { key: 'id', label: 'Session ID', type: 'display', primary: true },
        { key: 'scheduleDate', label: 'Tanggal Sesi', type: 'date' },
        { key: 'status', label: 'Status Sesi', type: 'text' }
    ],
    data: [] as any[]
};
CoachingSession.data = generateDynamicData(CoachingSession.schema, 10);

export const TournamentRegistration = {
    type: 'transaction',
    label: 'Registrasi Turnamen',
    schema: [
        { key: 'id', label: 'Reg ID', type: 'display', primary: true },
        { key: 'teamName', label: 'Nama Tim', type: 'text' },
        { key: 'paymentStatus', label: 'Status Pembayaran', type: 'text' }
    ],
    data: [] as any[]
};
TournamentRegistration.data = generateDynamicData(TournamentRegistration.schema, 16);

export const MatchScoreEntry = {
    type: 'transaction',
    label: 'Skor Pertandingan',
    schema: [
        { key: 'id', label: 'Match ID', type: 'display', primary: true },
        { key: 'teamA', label: 'Tim Ganda A', type: 'text' },
        { key: 'teamB', label: 'Tim Ganda B', type: 'text' },
        { key: 'scoreFinal', label: 'Skor Akhir', type: 'text' }
    ],
    data: [] as any[]
};
MatchScoreEntry.data = generateDynamicData(MatchScoreEntry.schema, 32);

export const MembershipPackageSale = {
    type: 'transaction',
    label: 'Paket Deposit Member',
    schema: [
        { key: 'id', label: 'Invoice Pack', type: 'display', primary: true },
        { key: 'packageName', label: 'Nama Paket', type: 'text' },
        { key: 'quotaHours', label: 'Total Jam Alokasi', type: 'number' }
    ],
    data: [] as any[]
};
MembershipPackageSale.data = generateDynamicData(MembershipPackageSale.schema, 20);


// ==========================================
// SUB-DETAIL & BACKUP ROUTE ACTION INTERCEPT
// ==========================================

export const DetailCourtBooking = {
    type: 'transaction',
    label: 'Detail Rincian Booking',
    schema: [
        { key: 'id', label: 'Line ID', type: 'display', primary: true },
        { key: 'itemType', label: 'Layanan', type: 'text' },
        { key: 'subtotal', label: 'Subtotal', type: 'currency' }
    ],
    data: [] as any[]
};
DetailCourtBooking.data = generateDynamicData(DetailCourtBooking.schema, 3);