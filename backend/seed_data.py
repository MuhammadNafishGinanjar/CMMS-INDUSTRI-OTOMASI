# seed_data.py
from pymongo import MongoClient
from datetime import datetime

# URI dengan autentikasi (sesuai punya kamu)
MONGO_URI = "mongodb://admin:adminpassword@localhost:27017/cmms_industri_otomasi?authSource=admin"

print("Connecting to MongoDB...")
client = MongoClient(MONGO_URI)
db = client.get_database("cmms_industri_otomasi")   # lebih aman

# Bersihkan dulu (biar pasti bersih)
db.machines.drop()
db.components.drop()
print("Collection lama dibuang...")

# === 4 MESIN ===
machines = [
    {"machineCode": "CNC-01",   "machineName": "CNC Milling 5 Axis",   "machineType": "CNC",       "location": "Workshop A"},
    {"machineCode": "CONV-01",  "machineName": "Main Conveyor Line",   "machineType": "Conveyor",  "location": "Line Produksi"},
    {"machineCode": "PLC-01",   "machineName": "Siemens S7-1500",      "machineType": "PLC",       "location": "Control Room"},
    {"machineCode": "ROBOT-01", "machineName": "KUKA KR 20",            "machineType": "Robot Arm", "location": "Welding Station"}
]

machine_ids = {}
for m in machines:
    result = db.machines.insert_one({
        **m,
        "installDate": datetime.now(),
        "status": "active",
        "createdAt": datetime.now()
    })
    machine_ids[m["machineCode"]] = result.inserted_id

print(f"Berhasil tambah {len(machines)} mesin")

# === 40 KOMPONEN ===
components_data = {
    "CNC-01":  ["Spindle Motor","Ball Screw X","Ball Screw Y","Ball Screw Z","Servo X","Servo Y","Servo Z","Tool Changer","Lube Pump","Cooling Fan"],
    "CONV-01": ["Drive Motor","Conveyor Belt","Roller Set","Gearbox","Bearing Set","Chain Drive","Proximity Sensor","VFD Inverter","E-Stop Button","Photo Sensor"],
    "PLC-01":  ["CPU Module","Power Supply","Digital Input","Digital Output","Analog Input","Comm Module","HMI Panel","Backup Battery","Ethernet Switch","Cables"],
    "ROBOT-01":["Axis 1 Servo","Axis 2 Servo","Axis 3 Servo","Axis 4 Servo","Axis 5 Servo","Axis 6 Servo","Gear Reducer","Harmonic Drive","Gripper","Teach Pendant"]
}

total = 0
for code, comps in components_data.items():
    machine_id = machine_ids[code]
    for idx, name in enumerate(comps, start=1):
        db.components.insert_one({
            "machineId": machine_id,
            "componentCode": f"{code.split('-')[0]}-CMP-{str(idx).zfill(3)}",
            "componentName": name,
            "installDate": datetime.now(),
            "status": "good",
            "lifetimeHours": 20000 if ("Motor" in name or "Servo" in name) else 50000,
            "lifetimeCycles": 1000000
        })
        total += 1

print(f"Berhasil tambah {total} komponen!")
print("SELESAI! Cek di Compass → cmms_industri_otomasi → components")