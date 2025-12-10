# CMMS 2025 — Computerized Maintenance Management System

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Sistem **Computerized Maintenance Management System (CMMS)** modern berbasis web untuk **industri manufaktur** dengan pendekatan **Lean Maintenance** dan **Role-Based Access Control (RBAC)** yang aman, realistis, dan siap produksi.

---

## Fitur Utama

### 1. Work Order Management
- Pembuatan Work Order oleh **Supervisor** dan **Teknisi**
- Sistem **Pull System** — Teknisi mengambil WO secara mandiri (tidak ada assign)
- Ownership eksklusif: hanya 1 teknisi + Supervisor/Admin yang boleh ubah status
- Status: `Open → In Progress → Waiting Sparepart → Completed → Closed`
- History lengkap + timestamp WIB akurat
- Archive otomatis setelah selesai

### 2. Maintenance Scheduling (Preventive Maintenance)
- Jadwal PM rutin (harian, mingguan, bulanan)
- Reminder otomatis di dashboard
- **Tidak otomatis update last maintenance** → hanya update saat WO benar-benar ditutup
- Mencegah data fiktif → sesuai standar **ISO 55001**

### 3. Maintenance History & Audit Trail
- Riwayat lengkap semua perbaikan per mesin/komponen
- `lastMaintenanceDate` otomatis update saat WO ditutup
- Log aktivitas user (siapa buat, edit, hapus)
- Data tersimpan selamanya untuk analisa MTBF/MTTR

### 4. Documentation & Reporting
- Data mesin & komponen lengkap (kode, tipe, lokasi, tanggal pasang)
- Foto & catatan perbaikan (siap ditambah)
- Export-ready untuk laporan bulanan
- Audit trail lengkap

### 5. Role-Based Access Control (RBAC) — 4 Role Realistis

| Role        | Hak Akses Utama |
|-------------|-----------------|
| **Admin**       | Bisa semua (kelola user, mesin, WO, jadwal) |
| **Supervisor**  | Buat WO, tutup WO, archive, buat jadwal PM, edit mesin |
| **Teknisi**     | Ambil WO, update status, tambah/edit komponen |
| **Operator**    | Hanya melihat dashboard & status mesin |

---

## Tech Stack

| Layer        | Technology                     |
|--------------|--------------------------------|
| Frontend     | Next.js 14 (App Router) + Tailwind CSS |
| Backend      | Flask (Python) + PyMongo       |
| Database     | MongoDB (Local / Atlas)        |
| Auth         | JWT + Werkzeug Password Hash   |
| Deployment   | Siap Vercel + Render / Railway |

---

## Alur Kerja Harian
```
Operator lapor kerusakan (lisan/WA)
↓
Supervisor validasi → buat Work Order
↓
Teknisi ambil WO sendiri (Pull System)
↓
Teknisi kerja → update status → Completed
↓
Supervisor verifikasi → Close & Archive
↓
lastMaintenanceDate otomatis update
```
---


---

## Cara Menjalankan (Lokal)

```bash
# 1. Backend (Flask)
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python app.py

# 2. Frontend (Next.js)
cd frontend
cd cmms-frontend
npm install
npm run dev
