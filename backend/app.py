from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from datetime import datetime, timedelta
from functools import wraps
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

# ---------- CONFIG ----------
app = Flask(__name__)

app.config["MONGO_URI"] = "MONGO_URI_ANDA"
app.config['SECRET_KEY'] = 'SECRET_KEY_ANDA'

mongo = PyMongo(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})
db = mongo.db

# ---------- JWT MIDDLEWARE ----------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Ambil token dari header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Format: "Bearer TOKEN"
            except IndexError:
                return jsonify({"error": "Token format salah!"}), 401
        
        if not token:
            return jsonify({"error": "Token tidak ditemukan!"}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.users.find_one({"_id": ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({"error": "User tidak ditemukan!"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token sudah expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token tidak valid!"}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Middleware untuk cek role
def role_required(*allowed_roles):
    """
    Contoh penggunaan:
    @role_required('admin')
    @role_required('admin', 'supervisor')
    @role_required('admin', 'supervisor', 'technician')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            user_role = current_user.get('role')
            if not user_role or user_role not in allowed_roles:
                return jsonify({"error": "Akses ditolak! Role tidak diizinkan."}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

# ---------- AUTH ROUTES ----------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'operator')  # default: operator
    
    if not username or not password:
        return jsonify({"error": "Username dan password harus diisi!"}), 400
    
    # Validasi role
    valid_roles = ['admin', 'supervisor', 'technician', 'operator']
    if role not in valid_roles:
        return jsonify({"error": f"Role harus salah satu dari: {', '.join(valid_roles)}"}), 400

    if db.users.find_one({"username": username}):
        return jsonify({"error": "Username sudah ada!"}), 400

    hashed = generate_password_hash(password)
    db.users.insert_one({
        "username": username,
        "password": hashed,
        "role": role,
        "created_at": datetime.utcnow()
    })

    return jsonify({"message": f"User {role} berhasil dibuat!"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username dan password harus diisi!"}), 400
    
    user = db.users.find_one({"username": username})

    if user and check_password_hash(user['password'], password):
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({
            "token": token,
            "message": "Login berhasil!",
            "user": {
                "id": str(user['_id']),
                "username": user['username'], 
                "role": user['role']
            }
        }), 200

    return jsonify({"error": "Username atau password salah!"}), 401

# ==================== USER MANAGEMENT (KHUSUS ADMIN) ====================

# GET SEMUA USER (Hanya Admin)
@app.route('/api/users', methods=['GET'])
@token_required
@role_required('admin')
def get_all_users(current_user):
    try:
        users = list(db.users.find({}, {"password": 0}))
        result = []
        for u in users:
            created_at = u.get("createdAt") or u.get("created_at")
            created_at_str = created_at.isoformat() if created_at else None
            
            result.append({
                "_id": str(u["_id"]),
                "username": u["username"],
                "role": u["role"],
                "createdAt": created_at_str
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# UPDATE USER (Ganti Role / Password) - Hanya Admin
@app.route('/api/users/<user_id>', methods=['PUT'])
@token_required
@role_required('admin')
def update_user(current_user, user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Data kosong"}), 400

    update_fields = {}

    # Ganti role (semua role boleh diganti oleh admin)
    if "role" in data:
        valid_roles = ['admin', 'supervisor', 'technician', 'operator']
        if data["role"] not in valid_roles:
            return jsonify({"error": f"Role tidak valid. Pilih dari: {', '.join(valid_roles)}"}), 400
        update_fields["role"] = data["role"]

    # Ganti password (jika diisi)
    if "password" in data and data["password"].strip():
        if len(data["password"].strip()) < 6:
            return jsonify({"error": "Password minimal 6 karakter!"}), 400
        update_fields["password"] = generate_password_hash(data["password"].strip())

    if not update_fields:
        return jsonify({"error": "Tidak ada data yang diubah"}), 400

    try:
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )

        if result.matched_count == 0:
            return jsonify({"error": "User tidak ditemukan"}), 404
        if result.modified_count == 0:
            return jsonify({"error": "Tidak ada perubahan"}), 400

        return jsonify({"message": "User berhasil diperbarui!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# HAPUS USER (Hanya Admin, dan TIDAK BISA HAPUS DIRI SENDIRI atau ADMIN LAIN)
@app.route('/api/users/<user_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_user(current_user, user_id):
    if str(current_user["_id"]) == user_id:
        return jsonify({"error": "Kamu tidak bisa menghapus akun sendiri!"}), 403

    try:
        # Cek role user yang akan dihapus
        target_user = db.users.find_one({"_id": ObjectId(user_id)})
        if not target_user:
            return jsonify({"error": "User tidak ditemukan"}), 404

        if target_user["role"] == "admin":
            return jsonify({"error": "Tidak bisa menghapus akun Admin lain!"}), 403

        result = db.users.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Gagal menghapus user"}), 500

        return jsonify({"message": "User berhasil dihapus!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# (Opsional) GET PROFILE USER YANG SEDANG LOGIN
@app.route('/api/me', methods=['GET'])
@token_required
def get_my_profile(current_user):
    return jsonify({
        "_id": str(current_user["_id"]),
        "username": current_user["username"],
        "role": current_user["role"]
    }), 200

# # Endpoint untuk cek user yang sedang login
# @app.route('/api/me', methods=['GET'])
# @token_required
# def get_current_user(current_user):
#     return jsonify({
#         "id": str(current_user['_id']),
#         "username": current_user['username'],
#         "role": current_user['role'],
#         "created_at": current_user['created_at'].isoformat() if current_user.get('created_at') else None
#     })

# ---------- HOME ----------
@app.route('/')
def home():
    total_wo = db.workorders.count_documents({})
    open_wo = db.workorders.count_documents({"status": {"$in": ["open", "in_progress"]}})
    overdue = db.maintenance_schedules.count_documents({"next_due": {"$lt": datetime.now()}}) 
    return jsonify({
        "message": "CMMS Backend SUDAH JALAN 100%!",
        "stats": {
            "total_wo": total_wo,
            "open_wo": open_wo,
            "overdue_tasks": overdue,
            "total_machines": db.machines.count_documents({}),
            "total_components": db.components.count_documents({})
        }
    })

# === CRUD MESIN ===
from datetime import datetime

@app.route('/api/machines', methods=['GET'])
@token_required
def get_machines(current_user):
    machines = list(db.machines.find().sort("createdAt", -1))
    result = []
    for m in machines:
        install_date = m.get("installDate")
        
        # Konversi otomatis:
        if isinstance(install_date, datetime):
            install_date = install_date.isoformat()
        
        result.append({
            "_id": str(m["_id"]),
            "machineCode": m.get("machineCode", ""),
            "machineName": m.get("machineName", ""),
            "machineType": m.get("machineType", ""),
            "location": m.get("location", ""),
            "installDate": install_date,
            "status": m.get("status", "active"),
            "createdAt": m.get("createdAt")
        })
    return jsonify(result)

@app.route('/api/machines', methods=['POST'])
@token_required
@role_required('admin')
def create_machine(current_user):
    data = request.get_json()

    # Validasi wajib
    required = ["machineCode", "machineName", "machineType", "location", "installDate"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Field {field} wajib diisi!"}), 400

    new_machine = {
        "machineCode": data["machineCode"].strip().upper(),
        "machineName": data["machineName"].strip(),
        "machineType": data["machineType"].strip(),
        "location": data["location"].strip(),
        "installDate": data["installDate"],  # format: YYYY-MM-DD atau ISO
        "status": data.get("status", "active"),
        "createdAt": datetime.utcnow()
    }

    result = db.machines.insert_one(new_machine)
    return jsonify({
        "message": "Mesin berhasil ditambahkan!",
        "_id": str(result.inserted_id)
    }), 201


@app.route('/api/machines/<id>', methods=['PUT'])
@token_required
@role_required('admin', 'supervisor')
def update_machine(current_user, id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Data tidak boleh kosong"}), 400

    update_data = {
        "machineCode": data.get("machineCode", "").strip().upper(),
        "machineName": data.get("machineName", "").strip(),
        "machineType": data.get("machineType", "").strip(),
        "location": data.get("location", "").strip(),
        "installDate": data.get("installDate"),
        "status": data.get("status", "active")
    }

    # Hapus field yang kosong agar tidak overwrite dengan string kosong
    update_data = {k: v for k, v in update_data.items() if v not in ["", None]}

    result = db.machines.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        return jsonify({"error": "Tidak ada perubahan atau mesin tidak ditemukan"}), 400

    return jsonify({"message": "Mesin berhasil diperbarui!"})


@app.route('/api/machines/<id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_machine(current_user, id):
    try:
        # Hapus semua komponen terkait (jika ada collection components)
        db.components.delete_many({"machineId": ObjectId(id)})
        
        # Hapus mesin
        result = db.machines.delete_one({"_id": ObjectId(id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Mesin tidak ditemukan"}), 404
            
        return jsonify({"message": "Mesin dan semua data terkait berhasil dihapus!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# === GET SINGLE MACHINE (untuk edit modal) ===
@app.route('/api/machines/<id>', methods=['GET'])
@token_required
def get_single_machine(current_user, id):
    machine = db.machines.find_one({"_id": ObjectId(id)})
    if not machine:
        return jsonify({"error": "Mesin tidak ditemukan"}), 404

    install_date = machine.get("installDate")
    if isinstance(install_date, datetime):
        install_date = install_date.isoformat()

    return jsonify({
        "_id": str(machine["_id"]),
        "machineCode": machine.get("machineCode", ""),
        "machineName": machine.get("machineName", ""),
        "machineType": machine.get("machineType", ""),
        "location": machine.get("location", ""),
        "installDate": install_date,
        "status": machine.get("status", "active"),
        "createdAt": machine.get("createdAt")
    })

# --- Components (Protected) ---
@app.route('/api/components', methods=['GET'])
@token_required
def get_components(current_user):
    comps = list(db.components.find())
    for c in comps:
        c['_id'] = str(c['_id'])
        c['machineId'] = str(c['machineId'])
    return jsonify(comps)

# === GET COMPONENTS BY MACHINE ===
@app.route('/api/machines/<machine_id>/components', methods=['GET'])
@token_required
def get_components_by_machine(current_user, machine_id):
    try:
        components = list(db.components.find({"machineId": ObjectId(machine_id)}).sort("componentName", 1))
        result = []
        for c in components:

            install_date = c.get("installDate")

            # ---- FIX INVALID DATE ----
            if isinstance(install_date, datetime):
                install_date = install_date.isoformat() + "Z"
            elif isinstance(install_date, str) and install_date.strip() == "":
                install_date = None

            result.append({
                "_id": str(c["_id"]),
                "machineId": str(c["machineId"]),
                "componentCode": c.get("componentCode", ""),
                "componentName": c.get("componentName", ""),
                "installDate": install_date,
                "status": c.get("status", "good"),
                "lifetimeHours": c.get("lifetimeHours", 0),
                "lifetimeCycles": c.get("lifetimeCycles", 0),
                "notes": c.get("notes", "")
            })

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === CREATE COMPONENT (POST) ===
@app.route('/api/machines/<machine_id>/components', methods=['POST'])
@token_required
@role_required('admin', 'supervisor', 'technician')
def create_component(current_user, machine_id):
    data = request.get_json()
    
    required = ["componentCode", "componentName"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Field {field} wajib diisi!"}), 400

    new_comp = {
        "machineId": ObjectId(machine_id),
        "componentCode": data["componentCode"].strip().upper(),
        "componentName": data["componentName"].strip(),
        "installDate": data.get("installDate") or datetime.utcnow().isoformat() + "Z",
        "status": data.get("status", "good"),  # good / warning / critical
        "lifetimeHours": int(data.get("lifetimeHours", 0)),
        "lifetimeCycles": int(data.get("lifetimeCycles", 0)),
        "notes": data.get("notes", "").strip(),
        "createdAt": datetime.utcnow()
    }

    result = db.components.insert_one(new_comp)
    return jsonify({
        "message": "Komponen berhasil ditambahkan!",
        "_id": str(result.inserted_id)
    }), 201


@app.route('/api/components/<comp_id>', methods=['PUT'])
@token_required
@role_required('admin', 'supervisor', 'technician')
def update_component(current_user, comp_id):
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Data kosong"}), 400

    # SESUAIKAN DENGAN FORMAT BARU DARI FRONTEND
    update_data = {}

    if "componentCode" in data:
        update_data["componentCode"] = data["componentCode"].strip().upper()
    if "componentName" in data:
        update_data["componentName"] = data["componentName"].strip()
    if "installDate" in data and data["installDate"]:
        update_data["installDate"] = data["installDate"]
    if "status" in data:
        update_data["status"] = data["status"]  # good, warning, critical
    if "lifetimeHours" in data:
        update_data["lifetimeHours"] = int(data["lifetimeHours"])
    if "lifetimeCycles" in data:
        update_data["lifetimeCycles"] = int(data["lifetimeCycles"])
    if "notes" in data:
        update_data["notes"] = data["notes"].strip()

    # Kalau nggak ada perubahan sama sekali
    if not update_data:
        return jsonify({"error": "Tidak ada data yang diubah"}), 400

    try:
        result = db.components.update_one(
            {"_id": ObjectId(comp_id)},
            {"$set": update_data}
        )

        if result.modified_count == 0:
            return jsonify({"error": "Tidak ada perubahan atau komponen tidak ditemukan"}), 400

        return jsonify({"message": "Komponen berhasil diperbarui!"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/components/<comp_id>', methods=['DELETE'])
@token_required
@role_required('admin', 'supervisor', 'technician')
def delete_component(current_user, comp_id):
    try:
        result = db.components.delete_one({"_id": ObjectId(comp_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Komponen tidak ditemukan"}), 404
        return jsonify({"message": "Komponen berhasil dihapus!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==============================================
# WORK ORDERS (dengan RBAC)
# ==============================================
@app.route('/api/workorders', methods=['GET'])
@token_required
def get_workorders(current_user):
    query = {}
    status = request.args.get('status')
    if status:
        query['status'] = status
    workorders = list(db.workorders.find(query).sort("createdAt", -1).limit(50))
   
    result = []
    for wo in workorders:
        item = {
            "_id": str(wo["_id"]),
            "woNumber": wo.get("woNumber", "-"),
            "type": wo.get("type", "-"),
            "priority": wo.get("priority", "low"),
            "status": wo.get("status", "open"),
            "description": wo.get("description", ""),
            "createdAt": wo["createdAt"].isoformat() if wo.get("createdAt") else None,
            "machineId": str(wo["machineId"]),
            "machineName": "Unknown Machine",
            "componentName": "-",
            "history": [
                {
                    "status": h["status"],
                    "timestamp": h["timestamp"].isoformat() if isinstance(h.get("timestamp"), datetime) else h.get("timestamp", None),
                    "by": h.get("by", "Unknown")
                }
                for h in wo.get("history", [])
            ]
        }
        machine = db.machines.find_one({"_id": wo["machineId"]})
        if machine:
            item["machineName"] = f"{machine['machineCode']} - {machine['machineName']}"
        if wo.get("componentId"):
            comp = db.components.find_one({"_id": wo["componentId"]})
            if comp:
                item["componentName"] = f"{comp['componentCode']} - {comp['componentName']}"
        result.append(item)
    return jsonify(result)

@app.route('/api/workorders', methods=['POST'])
@token_required
@role_required('admin', 'supervisor', 'technician')  # Hanya role ini yang bisa buat WO
def create_workorder(current_user):
    data = request.json
    
    today = datetime.now().strftime('%Y-%m')
    count = db.workorders.count_documents({"woNumber": {"$regex": f"^WO-{today}"}}) + 1
    wo_number = f"WO-{today}-{str(count).zfill(4)}"

    new_wo = {
        "woNumber": wo_number,
        "machineId": ObjectId(data['machineId']),
        "componentId": ObjectId(data['componentId']) if data.get('componentId') else None,
        "type": data['type'],
        "priority": data['priority'],
        "description": data['description'],
        "status": "open",
        "createdAt": datetime.now(),
        "createdBy": current_user['username'],  # Track siapa yang buat
        "history": [{
            "status": "open",
            "timestamp": datetime.now(),
            "by": current_user['username']
        }]
    }

    result = db.workorders.insert_one(new_wo)
    
    return jsonify({
        "message": "Work Order berhasil dibuat",
        "woNumber": wo_number,
        "_id": str(result.inserted_id)
    }), 201

@app.route('/api/workorders/<id>', methods=['GET'])
@token_required
def get_workorder_detail(current_user, id):
    wo = db.workorders.find_one({"_id": ObjectId(id)})
    if not wo:
        return jsonify({"error": "Work Order tidak ditemukan"}), 404
    
    wo['_id'] = str(wo['_id'])
    wo['machineId'] = str(wo['machineId'])
    if wo.get('componentId'):
        wo['componentId'] = str(wo['componentId'])
    
    machine = db.machines.find_one({"_id": ObjectId(wo['machineId'])})
    wo['machineName'] = machine['machineName'] if machine else "-"
    if wo.get('componentId'):
        comp = db.components.find_one({"_id": ObjectId(wo['componentId'])})
        wo['componentName'] = comp['componentName'] if comp else "-"
    else:
        wo['componentName'] = "-"
    
    if 'history' in wo and wo['history']:
        for h in wo['history']:
            if isinstance(h.get('timestamp'), datetime):
                h['timestamp'] = h['timestamp'].isoformat()
    if 'createdAt' in wo and isinstance(wo['createdAt'], datetime):
        wo['createdAt'] = wo['createdAt'].isoformat()

    return jsonify(wo)

@app.route('/api/workorders/<id>', methods=['DELETE'])
@token_required
@role_required('admin', 'supervisor')  # Hanya admin yang bisa hapus WO
def delete_workorder(current_user, id):
    try:
        result = db.workorders.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Work Order tidak ditemukan"}), 404
        return jsonify({"message": "Work Order berhasil dihapus"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 1. ROUTE BARU: AMBIL WO (CLAIM)
@app.route('/api/workorders/<id>/claim', methods=['POST'])
@token_required
@role_required('admin', 'supervisor', 'technician')
def claim_workorder(current_user, id):
    wo = db.workorders.find_one({"_id": ObjectId(id)})
    if not wo:
        return jsonify({"error": "Work Order tidak ditemukan"}), 404

    # CEK APAKAH SUDAH DIAMBIL ORANG LAIN
    if wo.get("assignedTo"):
        return jsonify({
            "error": "WO ini sudah diambil oleh teknisi lain!",
            "taken_by": wo.get("assignedName", "Orang lain"),
            "taken_at": wo.get("assignedAt").isoformat() if wo.get("assignedAt") else None
        }), 403

    # CEK STATUS — HANYA BOLEH DIAMBIL KALAU MASIH "open"
    if wo.get("status") != "open":
        return jsonify({"error": "WO ini sudah tidak bisa diambil (status bukan open)"}), 400

    # AMBIL WO — EKSKLUSIF!
    result = db.workorders.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "assignedTo": current_user["_id"],
            "assignedName": current_user["username"],
            "assignedAt": datetime.utcnow(),
            "status": "in_progress"  # langsung jadi in_progress
        },
        "$push": {
            "history": {
                "status": "in_progress",
                "timestamp": datetime.utcnow(),
                "by": current_user["username"],
                "note": "WO diambil oleh teknisi"
            }
        }}
    )

    if result.modified_count == 0:
        return jsonify({"error": "Gagal mengambil WO"}), 500

    return jsonify({
        "message": f"WO berhasil diambil oleh {current_user['username']}!",
        "success": True,
        "assignedTo": current_user["username"]
    }), 200


@app.route('/api/workorders/<id>/status', methods=['PUT'])
@token_required
@role_required('admin', 'supervisor', 'technician')
def update_status(current_user, id):
    data = request.json
    new_status = data.get('status')
    note = data.get('note', '')

    # DAFTAR STATUS YANG DIIZINKAN — SUDAH DITAMBAH 'closed'!
    allowed_status = ['in_progress', 'waiting_sparepart', 'completed', 'closed']
    if new_status not in allowed_status:
        return jsonify({"error": "Status tidak valid"}), 400

    wo = db.workorders.find_one({"_id": ObjectId(id)})
    if not wo:
        return jsonify({"error": "WO tidak ditemukan"}), 404

    # Logika ownership
    assigned_to = wo.get("assignedTo")
    is_owner = assigned_to and str(assigned_to) == str(current_user["_id"])
    is_supervisor_or_admin = current_user["role"] in ['admin', 'supervisor']

    # Auto-claim kalau teknisi mulai kerja (status in_progress)
    if not assigned_to and current_user["role"] == "technician" and new_status == "in_progress":
        db.workorders.update_one(
            {"_id": ObjectId(id)},
            {"$set": {
                "assignedTo": current_user["_id"],
                "assignedName": current_user["username"],
                "assignedAt": datetime.now()
            }}
        )
        is_owner = True

    # Hanya owner, supervisor, atau admin yang boleh ubah
    if not (is_owner or is_supervisor_or_admin):
        return jsonify({
            "error": "Kamu tidak berhak mengubah status WO ini!",
            "info": f"WO ini sedang dikerjakan oleh: {wo.get('assignedName', 'Belum diambil')}"
        }), 403

    # Khusus status "closed" → hanya Supervisor & Admin yang boleh!
    if new_status == "closed" and current_user["role"] not in ['admin', 'supervisor']:
        return jsonify({
            "error": "Hanya Supervisor atau Admin yang boleh menutup Work Order!"
        }), 403

    # Update status + history
    history_entry = {
        "status": new_status,
        "timestamp": datetime.now(),
        "by": current_user["username"]
    }
    if note:
        history_entry["note"] = note

    result = db.workorders.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": new_status}, "$push": {"history": history_entry}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "Gagal update status"}), 500

    return jsonify({
        "message": f"Status berhasil diubah menjadi {new_status}",
        "success": True
    })

@app.route('/api/workorders/<id>/archive', methods=['POST'])
@token_required
@role_required('admin', 'supervisor')
def archive_workorder(current_user, id):
    wo = db.workorders.find_one({"_id": ObjectId(id)})
    if not wo:
        return jsonify({"error": "WO tidak ditemukan"}), 404
    
    if wo["status"] not in ["completed", "closed"]:
        return jsonify({"error": "Hanya WO yang COMPLETED atau CLOSED yang bisa diarsipkan"}), 400
    
    db.workorders_archive.insert_one(wo)
    db.workorders.delete_one({"_id": ObjectId(id)})
    
    return jsonify({"message": "Work Order berhasil diarsipkan"})

@app.route('/api/workorders/archive', methods=['GET'])
@token_required
@role_required('admin', 'supervisor', 'technician')
def get_archived_workorders(current_user):
    archived = list(db.workorders_archive.find().sort([("history.timestamp", -1)]))
    
    result = []
    for wo in archived:
        item = wo.copy()
        item['_id'] = str(item['_id'])
        item['machineId'] = str(item['machineId'])
        if item.get('componentId'):
            item['componentId'] = str(item['componentId'])
        
        machine = db.machines.find_one({"_id": ObjectId(item['machineId'])})
        item['machineName'] = f"{machine['machineCode']} - {machine['machineName']}" if machine else "Unknown"
        
        if item.get('componentId'):
            comp = db.components.find_one({"_id": ObjectId(item['componentId'])})
            item['componentName'] = f"{comp['componentCode']} - {comp['componentName']}" if comp else "-"
        else:
            item['componentName'] = "-"
        
        if 'history' in item:
            for h in item['history']:
                if isinstance(h.get('timestamp'), datetime):
                    h['timestamp'] = h['timestamp'].isoformat()
        if isinstance(item.get('createdAt'), datetime):
            item['createdAt'] = item['createdAt'].isoformat()
            
        result.append(item)
    
    return jsonify(result)

@app.route('/api/workorders/archive/<id>/restore', methods=['POST'])
@token_required
@role_required('admin', 'supervisor')
def restore_workorder(current_user, id):
    try:
        archived_wo = db.workorders_archive.find_one({"_id": ObjectId(id)})
        if not archived_wo:
            return jsonify({"error": "WO tidak ditemukan di arsip"}), 404
        
        existing = db.workorders.find_one({"_id": ObjectId(id)})
        if existing:
            return jsonify({"error": "WO sudah ada di aktif"}), 400
        
        db.workorders.insert_one(archived_wo)
        db.workorders_archive.delete_one({"_id": ObjectId(id)})
        
        return jsonify({"message": "Work Order berhasil dikembalikan ke aktif!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Alerts ---
@app.route('/api/dashboard/alerts')
@token_required
def alerts(current_user):
    alerts = list(db.maintenance_schedules.find({
        "next_due": {"$lte": datetime.now()}
    }).limit(10))
    
    for a in alerts:
        a['_id'] = str(a['_id'])
        a['machineId'] = str(a['machineId'])
        if a.get('componentId'):
            a['componentId'] = str(a['componentId'])
    return jsonify(alerts)

# ==============================================
# MAINTENANCE SCHEDULING (dengan RBAC)
# ==============================================
@app.route('/api/schedules', methods=['POST'])
@token_required
@role_required('admin', 'supervisor')
def create_schedule(current_user):
    data = request.json
    last_done = datetime.fromisoformat(data['last_done'].replace('Z', '+00:00'))
    frequency = int(data['frequency_days'])
    next_due = last_done + timedelta(days=frequency)

    schedule = {
        "machineId": ObjectId(data['machineId']),
        "machineName": data['machineName'],
        "task": data['task'],
        "frequency_days": frequency,
        "last_done": last_done,
        "next_due": next_due,
        "createdAt": datetime.now(),
        "createdBy": current_user['username']
    }
    result = db.maintenance_schedules.insert_one(schedule)
    return jsonify({"message": "Jadwal berhasil dibuat!", "id": str(result.inserted_id)}), 201

@app.route('/api/schedules', methods=['GET'])
@token_required
def get_schedules(current_user):
    schedules = list(db.maintenance_schedules.find())
    today = datetime.now().date()
    result = []

    for s in schedules:
        next_due = s['next_due'].date()
        days_left = (next_due - today).days
        
        status = "on_track"
        if days_left < 0:
            status = "overdue"
        elif days_left <= 7:
            status = "due_soon"

        result.append({
            "_id": str(s['_id']),
            "machineName": s['machineName'],
            "task": s['task'],
            "frequency_days": s['frequency_days'],
            "last_done": s['last_done'].strftime("%d %b %Y"),
            "next_due": s['next_due'].strftime("%d %b %Y"),
            "days_left": days_left,
            "status": status
        })
    return jsonify(result)

# @app.route('/api/schedules/<id>/complete', methods=['POST'])
# @token_required
# @role_required('admin', 'supervisor', 'technician')
# def complete_maintenance(current_user, id):
#     schedule = db.maintenance_schedules.find_one({"_id": ObjectId(id)})
#     if not schedule:
#         return jsonify({"error": "Jadwal tidak ditemukan"}), 404
    
#     new_last_done = datetime.now()
#     new_next_due = new_last_done + timedelta(days=schedule['frequency_days'])
    
#     db.maintenance_schedules.update_one(
#         {"_id": ObjectId(id)},
#         {"$set": {
#             "last_done": new_last_done,
#             "next_due": new_next_due,
#             "lastCompletedBy": current_user['username']
#         }}
#     )
#     return jsonify({"message": "Maintenance selesai! Jadwal diperbarui."})

@app.route('/api/schedules/<id>', methods=['GET'])
@token_required
def get_single_schedule(current_user, id):
    try:
        schedule = db.maintenance_schedules.find_one({"_id": ObjectId(id)})
        if not schedule:
            return jsonify({"error": "Jadwal tidak ditemukan"}), 404
        
        schedule["_id"] = str(schedule["_id"])
        schedule["machineId"] = str(schedule["machineId"])
        schedule["last_done"] = schedule["last_done"].isoformat()
        schedule["next_due"] = schedule["next_due"].isoformat()
        
        return jsonify(schedule)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schedules/<id>', methods=['PUT'])
@token_required
@role_required('admin', 'supervisor')
def update_schedule(current_user, id):
    try:
        data = request.json
        last_done = datetime.fromisoformat(data['last_done'].replace('Z', '+00:00'))
        frequency = int(data['frequency_days'])
        next_due = last_done + timedelta(days=frequency)

        update_data = {
            "machineId": ObjectId(data['machineId']),
            "machineName": data['machineName'],
            "task": data['task'],
            "frequency_days": frequency,
            "last_done": last_done,
            "next_due": next_due
        }

        result = db.maintenance_schedules.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )

        if result.modified_count == 0:
            return jsonify({"error": "Tidak ada perubahan atau jadwal tidak ditemukan"}), 404

        return jsonify({"message": "Jadwal berhasil diperbarui!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schedules/<id>', methods=['DELETE'])
@token_required
@role_required('admin', 'supervisor')
def delete_schedule(current_user, id):
    try:
        result = db.maintenance_schedules.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Jadwal tidak ditemukan"}), 404
        return jsonify({"message": "Jadwal berhasil dihapus!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/maintenance-stats', methods=['GET'])
@token_required
def get_maintenance_stats(current_user):
    try:
        schedules = list(db.maintenance_schedules.find())
        today = datetime.now().date()
        
        overdue = 0
        due_today = 0
        soon = 0
        
        for s in schedules:
            due = s['next_due'].date() if hasattr(s['next_due'], 'date') else datetime.fromisoformat(str(s['next_due'])).date()
            days = (due - today).days
            
            if days < 0: overdue += 1
            elif days == 0: due_today += 1
            elif days <= 7: soon += 1
        
        return jsonify({
            "overdue_maintenance": overdue,
            "due_today": due_today,
            "upcoming_soon": soon,
            "total_schedules": len(schedules)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/maintenance-history', methods=['GET'])
@token_required
def get_maintenance_history(current_user):
    machine_id = request.args.get('machineId')
    query = {}
    if machine_id:
        query["machineId"] = ObjectId(machine_id)
    
    history = list(db.maintenance_schedules.find(query).sort("last_done", -1))
    
    result = []
    for h in history:
        result.append({
            "_id": str(h["_id"]),
            "machineId": str(h["machineId"]),
            "machineName": h["machineName"],
            "task": h["task"],
            "frequency_days": h["frequency_days"],
            "last_done": h["last_done"].strftime("%d %B %Y"),
            "next_due": h["next_due"].strftime("%d %B %Y"),
            "status": "Selesai" if h["next_due"] > datetime.now() else "Terjadwal"
        })
    
    return jsonify(result)

# ---------- RUN ----------
if __name__ == '__main__':
    app.run(debug=True, port=5000)
