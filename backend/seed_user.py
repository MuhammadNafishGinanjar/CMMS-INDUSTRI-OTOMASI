# seed_user.py
from pymongo import MongoClient
from bcrypt import hashpw, gensalt
from datetime import datetime

# Koneksi ke MongoDB (sesuaikan kalau beda port/database)
client = MongoClient("mongodb://admin:adminpassword@localhost:27017/cmms_industri_otomasi?authSource=admin")
db = client.cmms_industri_otomasi                    
users_collection = db.users            # Collection untuk user

# Daftar user dengan role (password di-hash otomatis)
seed_users = [
    {
        "username": "admin",
        "password": "admin123",        # akan di-hash
        "full_name": "Administrator",
        "role": "admin",
        "department": "IT & Maintenance",
        "created_at": datetime.utcnow()
    },
    {
        "username": "manager",
        "password": "manager123",
        "full_name": "Budi Santoso",
        "role": "manager",
        "department": "Produksi",
        "created_at": datetime.utcnow()
    },
    {
        "username": "teknisi1",
        "password": "teknisi123",
        "full_name": "Ahmad Rizki",
        "role": "technician",
        "department": "Maintenance",
        "created_at": datetime.utcnow()
    },
    {
        "username": "teknisi2",
        "password": "teknisi123",
        "full_name": "Siti Nurhaliza",
        "role": "technician",
        "department": "Maintenance",
        "created_at": datetime.utcnow()
    },
    {
        "username": "supervisor",
        "password": "super123",
        "full_name": "Joko Widodo",
        "role": "manager",
        "department": "Engineering",
        "created_at": datetime.utcnow()
    }
]

# Hash semua password
for user in seed_users:
    user["password"] = hashpw(user["password"].encode('utf-8'), gensalt()).decode('utf-8')

# Hapus semua user lama (opsional, comment kalau nggak mau)
# users_collection.delete_many({})

# Insert user baru
result = users_collection.insert_many(seed_users)

print("SEEDING USER SELESAI!")
print(f"Berhasil insert {len(result.inserted_ids)} user dengan role!")
print("\nDAFTAR USER SIAP PAKAI:")
print("-" * 50)
for user in seed_users:
    print(f"Username: {user['username']:<12} | Password: {user['full_name']:<20} | Role: {user['role']}")

print("\nLogin bisa langsung pakai:")
print("→ admin      / admin123     → Role: admin")
print("→ manager    / manager123   → Role: manager")
print("→ teknisi1   / teknisi123   → Role: technician")
print("→ teknisi2   / teknisi123   → Role: technician")
print("→ supervisor / super123     → Role: manager")