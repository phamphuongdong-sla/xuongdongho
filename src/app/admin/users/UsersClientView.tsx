'use client';

import React, { useState } from 'react';
import { 
  createUser, 
  updateUser, 
  resetUserPassword,
  toggleUserStatus, 
  deleteUser 
} from '@/actions/users';
import {
  createMeter,
  updateMeter,
  deleteMeter,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createUnit,
  updateUnit,
  deleteUnit,
} from '@/actions/admin-catalog';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Lock, 
  Key, 
  Briefcase, 
  AlertCircle,
  Eye, 
  EyeOff,
  SlidersHorizontal,
  Wrench,
  Gauge,
  Boxes,
  Search,
  Plus,
  Phone,
  Tag,
  MapPin,
  Hash,
  Building,
  Database,
  Download,
  Upload,
  RefreshCw,
  FileJson,
} from 'lucide-react';
import { exportSystemBackup, restoreSystemBackup } from '@/actions/backup';

interface Unit {
  id: number;
  code: string;
  name: string;
  type?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface UserItem {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  department?: string | null;
  unitId?: number | null;
  role: string;
  isActive: boolean;
  unit?: Unit | null;
  createdAt: string | Date;
}

interface MeterItem {
  id: number;
  code: string;
  name: string;
  category: string;
  size?: string | null;
  unit?: string | null;
  manufacturer?: string | null;
  notes?: string | null;
  isActive: boolean;
}

interface SparePartItem {
  id: number;
  code: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  unitPrice: number;
  notes?: string | null;
  isActive: boolean;
}

interface EmployeeItem {
  id: number;
  fullName: string;
  code?: string | null;
  phone?: string | null;
  unitId?: number | null;
  department?: string | null;
  position?: string | null;
  notes?: string | null;
  isActive: boolean;
  unit?: Unit | null;
}

const ROLES_INFO: Record<string, { label: string; badgeClass: string; desc: string }> = {
  admin: {
    label: 'Quản Trị Viên (Admin)',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'Toàn quyền cấu hình, quản trị người dùng, xóa/hoàn tác tồn kho, xem toàn bộ báo cáo',
  },
  accountant: {
    label: 'Lãnh Đạo / Kế Toán',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Xem báo cáo đối soát, kiểm tra số liệu, xem và in ấn phiếu xuất/nhập, không sửa kho vật lý',
  },
  kho: {
    label: 'Thủ Kho (Kho VP & Xưởng)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Lập phiếu nhập theo hợp đồng, lập phiếu xuất 12 đơn vị, kiểm kê và quản lý kho thực tế',
  },
  ktv: {
    label: 'Kỹ Thuật Viên Xưởng Sửa Chữa',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Lập phiếu sửa chữa, xuất dùng linh kiện theo định mức, ghi nhận đồng hồ sửa chữa quay vòng',
  },
  unit_user: {
    label: 'Cán Bộ 12 Chi Nhánh / XN',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    desc: 'Xem và xác nhận đồng hồ cấp phát, kiểm tra tồn kho tại đơn vị của mình',
  },
};

const PERMISSIONS_MATRIX = [
  { module: '1. Nhập Kho Theo Hợp Đồng (ĐH Mới & LK)', admin: 'Toàn quyền', accountant: 'Xem & In phiếu', kho: 'Lập phiếu, Nhập hàng', ktv: 'Không có quyền', unit_user: 'Không có quyền' },
  { module: '2. Xuất Kho Cấp Phát 12 Đơn Vị', admin: 'Toàn quyền', accountant: 'Xem & In phiếu', kho: 'Lập phiếu xuất, In', ktv: 'Không có quyền', unit_user: 'Xem đơn vị mình' },
  { module: '3. Xưởng Sửa Chữa & Xuất Dùng Linh Kiện', admin: 'Toàn quyền', accountant: 'Xem & In', kho: 'Xem & Quản lý LK', ktv: 'Lập phiếu SC, Xuất LK', unit_user: 'Không có quyền' },
  { module: '4. Báo Cáo Đối Soát Nhập - Xuất - Tồn', admin: 'Toàn quyền & Sửa đầu kỳ', accountant: 'Xem & Xuất Excel', kho: 'Xem & Đối soát kho', ktv: 'Xem vật tư SC', unit_user: 'Xem số liệu ĐV' },
  { module: '5. In Ấn Phiếu Nhập/Xuất Chuẩn Bộ Tài Chính', admin: 'Có (Tất cả)', accountant: 'Có (Tất cả)', kho: 'Có (Phiếu kho lập)', ktv: 'Phiếu sửa chữa', unit_user: 'Biên bản giao nhận' },
  { module: '6. Xóa Phiếu & Hoàn Tác Tồn Kho', admin: 'Cho phép', accountant: 'Không được xóa', kho: 'Phiếu do mình lập', ktv: 'Không được xóa', unit_user: 'Không được xóa' },
  { module: '7. Quản Trị Tài Khoản & Phân Quyền', admin: 'Toàn quyền', accountant: 'Không có quyền', kho: 'Không có quyền', ktv: 'Không có quyền', unit_user: 'Không có quyền' },
];

export function UsersClientView({
  initialUsers,
  units,
  initialUnits,
  initialMeters = [],
  initialSpareParts = [],
  initialEmployees = [],
  currentUser,
}: {
  initialUsers: UserItem[];
  units: Unit[];
  initialUnits?: Unit[];
  initialMeters?: MeterItem[];
  initialSpareParts?: SparePartItem[];
  initialEmployees?: EmployeeItem[];
  currentUser?: { id?: number; role?: string; fullName?: string } | null;
}) {
  const isKhoRole = currentUser?.role === 'kho';

  // Navigation tabs - if kho role, default to 'employees' tab
  const [activeTab, setActiveTab] = useState<'users' | 'employees' | 'units' | 'meters' | 'spareParts' | 'backup'>(
    isKhoRole ? 'employees' : 'users'
  );

  // Backup & Restore state
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Units state (Danh mục đơn vị)
  const [unitList, setUnitList] = useState<Unit[]>(initialUnits && initialUnits.length > 0 ? initialUnits : units);
  const [unitSearch, setUnitSearch] = useState('');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitType, setUnitType] = useState('Chi nhánh');
  const [unitAddress, setUnitAddress] = useState('');
  const [unitPhone, setUnitPhone] = useState('');
  const [unitEmail, setUnitEmail] = useState('');
  const [unitSortOrder, setUnitSortOrder] = useState<number>(0);

  // Users state
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [unitId, setUnitId] = useState<number>(units[0]?.id || 1);
  const [role, setRole] = useState<string>('kho');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Employees state
  const [employees, setEmployees] = useState<EmployeeItem[]>(initialEmployees);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>('all');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [empFullName, setEmpFullName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empUnitId, setEmpUnitId] = useState<number>(units[0]?.id || 1);
  const [empDepartment, setEmpDepartment] = useState('');
  const [empPosition, setEmpPosition] = useState('');
  const [empNotes, setEmpNotes] = useState('');

  // Meters state
  const [meters, setMeters] = useState<MeterItem[]>(initialMeters);
  const [meterSearch, setMeterSearch] = useState('');
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [editingMeter, setEditingMeter] = useState<MeterItem | null>(null);
  const [meterCode, setMeterCode] = useState('');
  const [meterName, setMeterName] = useState('');
  const [meterCategory, setMeterCategory] = useState('Tiêu chuẩn');
  const [meterSize, setMeterSize] = useState('DN15');
  const [meterUnit, setMeterUnit] = useState('Cái');
  const [meterManufacturer, setMeterManufacturer] = useState('');
  const [meterNotes, setMeterNotes] = useState('');

  // Spare Parts state
  const [spareParts, setSpareParts] = useState<SparePartItem[]>(initialSpareParts);
  const [partSearch, setPartSearch] = useState('');
  const [showPartModal, setShowPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePartItem | null>(null);
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [partCategory, setPartCategory] = useState('DN15');
  const [partUnit, setPartUnit] = useState('Cái');
  const [partUnitPrice, setPartUnitPrice] = useState<number>(10000);
  const [partNotes, setPartNotes] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --------------------------------------------------------------------------
  // USER HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setDepartment('');
    setUnitId(units[0]?.id || 1);
    setRole('kho');
    setPassword('123456');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: UserItem) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setEmail(u.email);
    setPhone(u.phone || '');
    setDepartment(u.department || '');
    setUnitId(u.unitId || units[0]?.id || 1);
    setRole(u.role);
    setPassword('');
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          fullName,
          email,
          phone,
          department,
          unitId: Number(unitId),
          role: role as any,
        });
        if (password) {
          await resetUserPassword(editingUser.id, password);
        }
        setMessage({ type: 'success', text: `Đã cập nhật thông tin tài khoản ${fullName} (${email}) thành công!` });
      } else {
        await createUser({
          fullName,
          email,
          phone,
          department,
          unitId: Number(unitId),
          role: role as any,
          password: password || '123456',
        });
        setMessage({ type: 'success', text: `Đã tạo tài khoản mới ${email} thành công! Mật khẩu mặc định: ${password || '123456'}` });
      }
      setShowUserModal(false);
      window.location.reload();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean, name: string) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'kích hoạt lại'} tài khoản ${name}?`)) return;
    try {
      const res = await toggleUserStatus(id);
      setUsers(users.map((u) => (u.id === id ? { ...u, isActive: res.isActive } : u)));
      setMessage({ type: 'success', text: `Đã ${res.isActive ? 'kích hoạt' : 'khóa'} tài khoản ${name} thành công!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`CẢNH BÁO: Xóa tài khoản ${name} sẽ thu hồi mọi quyền truy cập vĩnh viễn! Tiếp tục?`)) return;
    try {
      await deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
      setMessage({ type: 'success', text: `Đã xóa tài khoản ${name} thành công!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // --------------------------------------------------------------------------
  // EMPLOYEE HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenCreateEmployee = () => {
    setEditingEmployee(null);
    setEmpFullName('');
    setEmpCode('');
    setEmpPhone('');
    setEmpUnitId(units[0]?.id || 1);
    setEmpDepartment('');
    setEmpPosition('');
    setEmpNotes('');
    setShowEmployeeModal(true);
  };

  const handleOpenEditEmployee = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setEmpFullName(emp.fullName);
    setEmpCode(emp.code || '');
    setEmpPhone(emp.phone || '');
    setEmpUnitId(emp.unitId || units[0]?.id || 1);
    setEmpDepartment(emp.department || '');
    setEmpPosition(emp.position || '');
    setEmpNotes(emp.notes || '');
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (editingEmployee) {
        const res = await updateEmployee(editingEmployee.id, {
          fullName: empFullName,
          code: empCode,
          phone: empPhone,
          unitId: Number(empUnitId),
          department: empDepartment,
          position: empPosition,
          notes: empNotes,
        });
        setEmployees(employees.map(x => x.id === editingEmployee.id ? (res.employee as any) : x));
        setMessage({ type: 'success', text: `Đã cập nhật nhân viên ${empFullName} thành công!` });
      } else {
        const res = await createEmployee({
          fullName: empFullName,
          code: empCode,
          phone: empPhone,
          unitId: Number(empUnitId),
          department: empDepartment,
          position: empPosition,
          notes: empNotes,
        });
        setEmployees([res.employee as any, ...employees]);
        setMessage({ type: 'success', text: `Đã thêm mới nhân viên ${empFullName} thành công!` });
      }
      setShowEmployeeModal(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nhân viên ${name}?`)) return;
    try {
      await deleteEmployee(id);
      setEmployees(employees.filter(x => x.id !== id));
      setMessage({ type: 'success', text: `Đã xóa nhân viên ${name} thành công!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // --------------------------------------------------------------------------
  // METER HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenCreateMeter = () => {
    setEditingMeter(null);
    setMeterCode('');
    setMeterName('');
    setMeterCategory('Tiêu chuẩn');
    setMeterSize('DN15');
    setMeterUnit('Cái');
    setMeterManufacturer('');
    setMeterNotes('');
    setShowMeterModal(true);
  };

  const handleOpenEditMeter = (m: MeterItem) => {
    setEditingMeter(m);
    setMeterCode(m.code);
    setMeterName(m.name);
    setMeterCategory(m.category);
    setMeterSize(m.size || 'DN15');
    setMeterUnit(m.unit || 'Cái');
    setMeterManufacturer(m.manufacturer || '');
    setMeterNotes(m.notes || '');
    setShowMeterModal(true);
  };

  const handleSaveMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (editingMeter) {
        const res = await updateMeter(editingMeter.id, {
          code: meterCode,
          name: meterName,
          category: meterCategory,
          size: meterSize,
          unit: meterUnit,
          manufacturer: meterManufacturer,
          notes: meterNotes,
        });
        setMeters(meters.map(x => x.id === editingMeter.id ? (res.meter as any) : x));
        setMessage({ type: 'success', text: `Đã cập nhật đồng hồ ${meterName} thành công!` });
      } else {
        const res = await createMeter({
          code: meterCode,
          name: meterName,
          category: meterCategory,
          size: meterSize,
          unit: meterUnit,
          manufacturer: meterManufacturer,
          notes: meterNotes,
        });
        setMeters([...meters, res.meter as any]);
        setMessage({ type: 'success', text: `Đã thêm mới đồng hồ ${meterName} thành công!` });
      }
      setShowMeterModal(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeter = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa đồng hồ ${name}?`)) return;
    try {
      await deleteMeter(id);
      setMeters(meters.filter(x => x.id !== id));
      setMessage({ type: 'success', text: `Đã xóa đồng hồ ${name} thành công!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // --------------------------------------------------------------------------
  // SPARE PART HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenCreatePart = () => {
    setEditingPart(null);
    setPartCode('');
    setPartName('');
    setPartCategory('DN15');
    setPartUnit('Cái');
    setPartUnitPrice(10000);
    setPartNotes('');
    setShowPartModal(true);
  };

  const handleOpenEditPart = (p: SparePartItem) => {
    setEditingPart(p);
    setPartCode(p.code);
    setPartName(p.name);
    setPartCategory(p.category || 'DN15');
    setPartUnit(p.unit || 'Cái');
    setPartUnitPrice(p.unitPrice || 0);
    setPartNotes(p.notes || '');
    setShowPartModal(true);
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (editingPart) {
        const res = await updateSparePart(editingPart.id, {
          code: partCode,
          name: partName,
          category: partCategory,
          unit: partUnit,
          unitPrice: Number(partUnitPrice),
          notes: partNotes,
        });
        setSpareParts(spareParts.map(x => x.id === editingPart.id ? ((res as any).part as any) : x));
        setMessage({ type: 'success', text: `Đã cập nhật linh kiện ${partName} thành công!` });
      } else {
        const res = await createSparePart({
          code: partCode,
          name: partName,
          category: partCategory,
          unit: partUnit,
          unitPrice: Number(partUnitPrice),
          notes: partNotes,
        });
        setSpareParts([...spareParts, (res as any).part as any]);
        setMessage({ type: 'success', text: `Đã thêm mới linh kiện ${partName} thành công!` });
      }
      setShowPartModal(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePart = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa linh kiện ${name}?`)) return;
    try {
      await deleteSparePart(id);
      setSpareParts(spareParts.filter(x => x.id !== id));
      setMessage({ type: 'success', text: `Đã xóa linh kiện ${name} thành công!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // --------------------------------------------------------------------------
  // UNIT HANDLERS (Quản lý đơn vị thành viên)
  // --------------------------------------------------------------------------
  const handleOpenCreateUnit = () => {
    setEditingUnit(null);
    setUnitCode('');
    setUnitName('');
    setUnitType('Chi nhánh');
    setUnitAddress('');
    setUnitPhone('');
    setUnitEmail('');
    setUnitSortOrder(unitList.length + 1);
    setShowUnitModal(true);
  };

  const handleOpenEditUnit = (u: Unit) => {
    setEditingUnit(u);
    setUnitCode(u.code);
    setUnitName(u.name);
    setUnitType(u.type || 'Chi nhánh');
    setUnitAddress(u.address || '');
    setUnitPhone(u.phone || '');
    setUnitEmail(u.email || '');
    setUnitSortOrder(u.sortOrder !== undefined ? u.sortOrder : 0);
    setShowUnitModal(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (editingUnit) {
        const res = await updateUnit(editingUnit.id, {
          code: unitCode,
          name: unitName,
          type: unitType,
          address: unitAddress,
          phone: unitPhone,
          email: unitEmail,
          sortOrder: Number(unitSortOrder),
        });
        setUnitList(unitList.map(u => u.id === editingUnit.id ? ((res as any).unit as any) : u));
        setMessage({ type: 'success', text: `Đã cập nhật đơn vị "${unitName}" thành công!` });
      } else {
        const res = await createUnit({
          code: unitCode,
          name: unitName,
          type: unitType,
          address: unitAddress,
          phone: unitPhone,
          email: unitEmail,
          sortOrder: Number(unitSortOrder),
        });
        setUnitList([...unitList, (res as any).unit as any]);
        setMessage({ type: 'success', text: `Đã thêm mới đơn vị "${unitName}" thành công!` });
      }
      setShowUnitModal(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUnitStatus = async (u: Unit) => {
    const nextStatus = u.isActive === false ? true : false;
    if (!confirm(`Bạn có chắc muốn ${nextStatus ? 'kích hoạt lại' : 'ngưng hoạt động'} đơn vị "${u.name}"?`)) return;
    try {
      const res = await updateUnit(u.id, { isActive: nextStatus });
      setUnitList(unitList.map(item => item.id === u.id ? ((res as any).unit as any) : item));
      setMessage({ type: 'success', text: `Đã ${nextStatus ? 'kích hoạt' : 'ngưng hoạt động'} đơn vị "${u.name}"!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUnit = async (id: number, name: string) => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa đơn vị "${name}"?`)) return;
    try {
      await deleteUnit(id);
      setUnitList(unitList.filter(u => u.id !== id));
      setMessage({ type: 'success', text: `Đã xóa đơn vị "${name}" thành công!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Filtered lists
  const filteredUnits = unitList.filter(u =>
    u.isActive !== false &&
    (u.name.toLowerCase().includes(unitSearch.toLowerCase()) ||
    u.code.toLowerCase().includes(unitSearch.toLowerCase()) ||
    (u.type && u.type.toLowerCase().includes(unitSearch.toLowerCase())) ||
    (u.address && u.address.toLowerCase().includes(unitSearch.toLowerCase())))
  );

  const filteredEmployees = employees.filter(emp => {
    if (emp.isActive === false) return false;
    const matchSearch = emp.fullName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (emp.phone && emp.phone.includes(employeeSearch)) ||
      (emp.code && emp.code.toLowerCase().includes(employeeSearch.toLowerCase()));
    const matchUnit = selectedUnitFilter === 'all' || emp.unitId === selectedUnitFilter;
    return matchSearch && matchUnit;
  });

  const filteredMeters = meters.filter(m => 
    m.isActive !== false &&
    (m.code.toLowerCase().includes(meterSearch.toLowerCase()) ||
    m.name.toLowerCase().includes(meterSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(meterSearch.toLowerCase()))
  );

  const isDN15PartAdmin = (p: SparePartItem) => {
    const str = `${p.name || ''} ${p.category || ''} ${p.code || ''}`.toLowerCase();
    return str.includes('d15') || str.includes('dn15') || str.includes('d 15') || str.includes('dn 15');
  };

  const filteredSpareParts = spareParts
    .filter(p =>
      p.isActive !== false &&
      (p.code.toLowerCase().includes(partSearch.toLowerCase()) ||
      p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(partSearch.toLowerCase())))
    )
    .sort((a, b) => {
      const a15 = isDN15PartAdmin(a);
      const b15 = isDN15PartAdmin(b);
      if (a15 && !b15) return -1;
      if (!a15 && b15) return 1;
      return a.code.localeCompare(b.code);
    });

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const data = await exportSystemBackup();
      const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const filename = `sowasuco_backup_${dateStr}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: `Đã tạo và tải xuống bản sao lưu dữ liệu thành công (${filename})!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi tạo bản sao lưu dữ liệu' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestoreSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.version || !json.data) {
          setRestoreError('Tệp không đúng cấu trúc bản sao lưu hệ thống SOWASUCO WM (thiếu version hoặc data).');
          setRestorePreview(null);
          return;
        }
        setRestorePreview(json);
      } catch {
        setRestoreError('Không thể đọc tệp JSON. Vui lòng chọn tệp tin hợp lệ.');
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restorePreview) return;
    if (!confirm('CẢNH BÁO QUAN TRỌNG:\n\nQuá trình khôi phục sẽ thay thế toàn bộ dữ liệu hiện tại bằng dữ liệu từ tệp sao lưu này.\n\nBạn có chắc chắn muốn tiến hành khôi phục ngay không?')) {
      return;
    }
    setRestoreLoading(true);
    setRestoreError(null);
    setRestoreSuccess(null);
    try {
      const res = await restoreSystemBackup(restorePreview);
      if (res.success) {
        setRestoreSuccess(res.message);
        setMessage({ type: 'success', text: res.message });
        setRestorePreview(null);
        setRestoreFile(null);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setRestoreError((res as any).error || 'Lỗi khi khôi phục dữ liệu');
      }
    } catch (err: any) {
      setRestoreError(err.message || 'Lỗi khi khôi phục dữ liệu');
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Admin / Employee Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        {!isKhoRole && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-brand-600 text-brand-700 bg-brand-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            1. Tài Khoản & Phân Quyền ({users.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'employees'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          {isKhoRole ? 'Danh Mục Nhân Viên Theo Đơn Vị' : '2. Nhân Viên Theo Đơn Vị'} ({employees.length})
        </button>

        {!isKhoRole && (
          <>
            <button
              onClick={() => setActiveTab('units')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'units'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              3. Danh Mục Đơn Vị ({unitList.length})
            </button>

            <button
              onClick={() => setActiveTab('meters')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'meters'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <Gauge className="w-4 h-4 text-emerald-600" />
              4. Danh Mục Đồng Hồ Nước ({meters.length} SKU)
            </button>

            <button
              onClick={() => setActiveTab('spareParts')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'spareParts'
                  ? 'border-amber-600 text-amber-700 bg-amber-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <Boxes className="w-4 h-4 text-amber-600" />
              5. Danh Mục Vật Tư Linh Kiện ({spareParts.length} SKU)
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'backup'
                  ? 'border-purple-600 text-purple-700 bg-purple-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <Database className="w-4 h-4 text-purple-600" />
              6. Sao Lưu & Khôi Phục Dữ Liệu
            </button>
          </>
        )}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: USERS & PERMISSIONS */}
      {/* ==================================================================== */}
      {activeTab === 'users' && !isKhoRole && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  Danh Sách Tài Khoản Hệ Thống
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý quyền đăng nhập, mật khẩu và nhóm vai trò của các cán bộ nhân viên
                </p>
              </div>

              {!isKhoRole ? (
                <button
                  onClick={handleOpenCreateUser}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  Thêm Tài Khoản Mới
                </button>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
                  Chỉ Quản trị viên (Admin) được tạo & đổi mật khẩu tài khoản
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Cán Bộ / Email</th>
                    <th className="py-3 px-4">Đơn Vị Trực Thuộc</th>
                    <th className="py-3 px-4">Vai Trò & Quyền Hạn</th>
                    <th className="py-3 px-4">Số Điện Thoại</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const roleInfo = ROLES_INFO[u.role] || {
                      label: u.role,
                      badgeClass: 'bg-slate-100 text-slate-800',
                      desc: '',
                    };

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{u.fullName}</p>
                          <p className="text-slate-500 text-[11px] font-mono mt-0.5">{u.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {u.unit?.name || 'Văn Phòng Công Ty'}
                          </span>
                          {u.department && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {u.department}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleInfo.badgeClass}`}
                          >
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {u.phone || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(u.id, u.isActive, u.fullName)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                            title="Nhấp để chuyển đổi trạng thái hoạt động"
                          >
                            {u.isActive ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Hoạt động
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                Bị khóa
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                              title="Chỉnh sửa thông tin & phân quyền"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matrix Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ma Trận Quyền Hạn Chi Tiết Theo Nhóm Vai Trò
                </h3>
                <p className="text-xs text-slate-500">
                  Quy định chức năng được phép thực hiện tương ứng theo từng cấp độ tài khoản
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Phân Hệ & Nghiệp Vụ</th>
                    <th className="py-2.5 px-3 text-purple-700 font-bold">Admin</th>
                    <th className="py-2.5 px-3 text-emerald-700 font-bold">Thủ Kho</th>
                    <th className="py-2.5 px-3 text-amber-700 font-bold">Kỹ Thuật Viên</th>
                    <th className="py-2.5 px-3 text-blue-700 font-bold">Lãnh Đạo / Kế Toán</th>
                    <th className="py-2.5 px-3 text-slate-700 font-bold">12 Chi Nhánh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERMISSIONS_MATRIX.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-800">{p.module}</td>
                      <td className="py-2 px-3 text-purple-800 font-semibold bg-purple-50/20">{p.admin}</td>
                      <td className="py-2 px-3 text-emerald-800 font-semibold bg-emerald-50/20">{p.kho}</td>
                      <td className="py-2 px-3 text-amber-800 font-semibold bg-amber-50/20">{p.ktv}</td>
                      <td className="py-2 px-3 text-blue-800 font-semibold bg-blue-50/20">{p.accountant}</td>
                      <td className="py-2 px-3 text-slate-600">{p.unit_user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: EMPLOYEES BY UNIT */}
      {/* ==================================================================== */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Danh Sách Nhân Viên Theo Đơn Vị ({employees.length} nhân viên)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dữ liệu dùng để tự động gợi ý người giao hàng, người nhận hàng và kỹ thuật viên vào mọi loại phiếu
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên, SĐT, mã NV..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedUnitFilter}
                  onChange={(e) => setSelectedUnitFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="text-xs py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tất cả đơn vị</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>

                <button
                  onClick={handleOpenCreateEmployee}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Nhân Viên
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Mã NV</th>
                    <th className="py-3 px-4">Đơn Vị Trực Thuộc</th>
                    <th className="py-3 px-4">Chức Vụ / Phòng Ban</th>
                    <th className="py-3 px-4">Số Điện Thoại</th>
                    <th className="py-3 px-4">Ghi Chú</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        Không tìm thấy nhân viên phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{emp.fullName}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{emp.code || '—'}</td>
                        <td className="py-3 px-4 font-semibold text-blue-700">
                          {emp.unit?.name || 'Xưởng đồng hồ'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {emp.position || 'Cán bộ'} {emp.department ? `(${emp.department})` : ''}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{emp.phone || '—'}</td>
                        <td className="py-3 px-4 text-slate-500 italic text-[11px]">{emp.notes || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditEmployee(emp)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Sửa nhân viên"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id, emp.fullName)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa nhân viên"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: UNITS CATALOG (Đơn vị thành viên & Chi nhánh) */}
      {/* ==================================================================== */}
      {activeTab === 'units' && !isKhoRole && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Danh Mục Đơn Vị Thành Viên ({unitList.length} Đơn vị)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý các Chi nhánh cấp nước, Xí nghiệp và Xưởng thuộc Công ty CP Nước Môi trường Đô thị Sơn La (SOWASUCO)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên, mã đơn vị, địa chỉ..."
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={handleOpenCreateUnit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Đơn Vị Mới
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-center w-14">STT</th>
                    <th className="py-3 px-4">Mã Đơn Vị</th>
                    <th className="py-3 px-4 min-w-[220px]">Tên Đơn Vị</th>
                    <th className="py-3 px-4">Loại Hình</th>
                    <th className="py-3 px-4 min-w-[180px]">Địa Chỉ</th>
                    <th className="py-3 px-4">Điện Thoại / Liên Hệ</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-center w-24">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        Không tìm thấy đơn vị nào phù hợp với từ khóa tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {u.sortOrder !== undefined && u.sortOrder > 0 ? u.sortOrder : idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                          {u.code}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            u.code === 'KHO-VP'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.type?.includes('Xí nghiệp')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.type || 'Chi nhánh'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {u.address ? (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[200px]" title={u.address}>{u.address}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {u.phone || u.email ? (
                            <div className="space-y-0.5">
                              {u.phone && <div>{u.phone}</div>}
                              {u.email && <div className="text-[11px] text-slate-400">{u.email}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleUnitStatus(u)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                              u.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title="Bấm để đổi trạng thái hoạt động"
                          >
                            {u.isActive !== false ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Hoạt động</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-slate-500" />
                                <span>Ngưng</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditUnit(u)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Sửa thông tin đơn vị"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {u.code !== 'KHO-VP' && (
                              <button
                                onClick={() => handleDeleteUnit(u.id, u.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Xóa đơn vị"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: METERS CATALOG (25 SKU) */}
      {/* ==================================================================== */}
      {activeTab === 'meters' && !isKhoRole && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-emerald-600" />
                  Danh Mục Đồng Hồ Nước ({meters.length} SKU)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chuẩn hóa danh xưng danh định không tiền tố mã, bao gồm các dòng ĐH mới, ĐH sửa chữa, ĐH cấp theo dự án
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên ĐH, mã SKU, cỡ..."
                    value={meterSearch}
                    onChange={(e) => setMeterSearch(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handleOpenCreateMeter}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm SKU Đồng Hồ
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã SKU</th>
                    <th className="py-3 px-4">Tên Đồng Hồ (Chuẩn Danh Định)</th>
                    <th className="py-3 px-4">Phân Loại</th>
                    <th className="py-3 px-4">Cỡ / Kích Thước</th>
                    <th className="py-3 px-4">ĐVT</th>
                    <th className="py-3 px-4">Hãng SX / Xuất Xứ</th>
                    <th className="py-3 px-4">Ghi Chú</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeters.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        Không tìm thấy đồng hồ phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredMeters.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">{m.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            m.category === 'Sửa chữa' || m.code.includes('SC')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {m.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{m.size || 'DN15'}</td>
                        <td className="py-3 px-4 text-slate-600">{m.unit || 'Cái'}</td>
                        <td className="py-3 px-4 text-slate-600">{m.manufacturer || '—'}</td>
                        <td className="py-3 px-4 text-slate-500 italic text-[11px]">{m.notes || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditMeter(m)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Sửa đồng hồ"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMeter(m.id, m.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa đồng hồ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: SPARE PARTS CATALOG (35 SKU) */}
      {/* ==================================================================== */}
      {activeTab === 'spareParts' && !isKhoRole && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-600" />
                  Danh Mục Vật Tư Linh Kiện Sửa Chữa ({spareParts.length} SKU)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  13 linh kiện tiêu chuẩn DN15 và các dòng linh kiện phụ trợ khác phục vụ xưởng sửa chữa đồng hồ
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên LK, mã vật tư..."
                    value={partSearch}
                    onChange={(e) => setPartSearch(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <button
                  onClick={handleOpenCreatePart}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Linh Kiện
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã Vật Tư</th>
                    <th className="py-3 px-4">Tên Linh Kiện (Dễ Hiểu)</th>
                    <th className="py-3 px-4">Nhóm Định Mức</th>
                    <th className="py-3 px-4">ĐVT</th>
                    <th className="py-3 px-4 text-right">Đơn Giá Kế Toán</th>
                    <th className="py-3 px-4">Ghi Chú</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSpareParts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        Không tìm thấy linh kiện phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredSpareParts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">{p.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            p.code.startsWith('VP-D15-') || p.category === 'DN15'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {p.category || 'Phụ kiện'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.unit || 'Cái'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                          {(p.unitPrice || 0).toLocaleString()} đ
                        </td>
                        <td className="py-3 px-4 text-slate-500 italic text-[11px]">{p.notes || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditPart(p)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                              title="Sửa linh kiện"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePart(p.id, p.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa linh kiện"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. TAB: SAO LƯU & KHÔI PHỤC DỮ LIỆU */}
      {/* ==================================================================== */}
      {activeTab === 'backup' && !isKhoRole && (
        <div className="space-y-6">
          {/* Card 1: Sao Lưu Dữ Liệu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      1. Sao Lưu Toàn Bộ Dữ Liệu Hệ Thống (Export Backup)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Tạo tệp tin JSON độc lập chứa toàn bộ cấu trúc dữ liệu, danh mục, tồn kho và lịch sử phiếu nhập xuất.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadBackup}
                disabled={backupLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                {backupLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang trích xuất dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tải Xuống Bản Sao Lưu (.json)</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-6 bg-slate-50/50 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Thống kê phạm vi dữ liệu trong bản sao lưu:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">Đơn vị thành viên</span>
                  <span className="text-lg font-extrabold text-slate-900 font-mono">{unitList.length}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">Tài khoản quản trị</span>
                  <span className="text-lg font-extrabold text-slate-900 font-mono">{users.length}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">Cán bộ nhân viên</span>
                  <span className="text-lg font-extrabold text-slate-900 font-mono">{employees.length}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">SKU Đồng hồ nước</span>
                  <span className="text-lg font-extrabold text-emerald-700 font-mono">{meters.length}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">SKU Vật tư linh kiện</span>
                  <span className="text-lg font-extrabold text-amber-700 font-mono">{spareParts.length}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * Bản sao lưu bao gồm toàn bộ các phiếu nhập kho hợp đồng, phiếu xuất 12 chi nhánh, phiếu nhập cũ, phiếu sửa chữa, tồn kho và các thiết lập số dư đầu kỳ.
              </p>
            </div>
          </div>

          {/* Card 2: Khôi Phục Dữ Liệu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    2. Khôi Phục Dữ Liệu Từ Tệp Sao Lưu (Import Restore)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chọn tệp tin sao lưu (.json) của hệ thống SOWASUCO WM để phục hồi trạng thái cơ sở dữ liệu.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {restoreError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {restoreSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{restoreSuccess}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 hover:border-purple-400 transition-colors rounded-2xl p-6 text-center bg-slate-50/50">
                <FileJson className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                <label className="block text-sm font-bold text-slate-800 mb-1 cursor-pointer">
                  <span>Chọn hoặc kéo thả tệp sao lưu JSON vào đây</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-500">Định dạng chấp nhận: .json (tạo từ chức năng sao lưu của hệ thống)</p>
                {restoreFile && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-bold">
                    <span>{restoreFile.name}</span>
                    <span className="text-slate-400 font-sans font-normal">({(restoreFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* Preview card if valid file parsed */}
              {restorePreview && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded tracking-wider">
                        Thông Tin Tệp Sao Lưu
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Ngày tạo bản sao lưu: <span className="font-mono text-amber-900">{new Date(restorePreview.exportDate).toLocaleString('vi-VN')}</span>
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-600 font-semibold">Phiên bản: {restorePreview.version}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100">
                      <span className="text-slate-500 block text-[11px]">Đơn vị:</span>
                      <strong className="text-slate-900 font-mono">{restorePreview.summary?.units ?? 0}</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100">
                      <span className="text-slate-500 block text-[11px]">Đồng hồ & Linh kiện:</span>
                      <strong className="text-slate-900 font-mono">{(restorePreview.summary?.meters ?? 0) + (restorePreview.summary?.spareParts ?? 0)} SKU</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100">
                      <span className="text-slate-500 block text-[11px]">Phiếu nhập kho:</span>
                      <strong className="text-slate-900 font-mono">{restorePreview.summary?.importVouchers ?? 0} phiếu</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100">
                      <span className="text-slate-500 block text-[11px]">Phiếu xuất kho:</span>
                      <strong className="text-slate-900 font-mono">{restorePreview.summary?.exportVouchers ?? 0} phiếu</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-red-50/80 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Cảnh báo quan trọng:</strong> Hành động này sẽ thay thế toàn bộ dữ liệu hiện tại trong cơ sở dữ liệu và tự động làm mới trang sau khi hoàn tất.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRestorePreview(null);
                        setRestoreFile(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-white"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteRestore}
                      disabled={restoreLoading}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                    >
                      {restoreLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang khôi phục dữ liệu...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Bắt Đầu Khôi Phục Dữ Liệu Ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE/EDIT USER */}
      {/* ==================================================================== */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                {editingUser ? 'Chỉnh Sửa Quyền Hạn Tài Khoản' : 'Thêm Tài Khoản Mới'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và Tên (*)</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Đăng Nhập (*)</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: thukho@sowasuco.vn"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Email chính thức dùng để đăng nhập vào hệ thống</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0987654321"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {editingUser ? 'Đổi Mật Khẩu (Để trống nếu không đổi)' : 'Mật Khẩu (*)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUser ? 'Nhập mật khẩu mới...' : 'Mặc định: 123456'}
                      className="w-full border border-slate-200 rounded-lg p-2.5 pr-8 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phòng Ban / Tổ</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="VD: Phòng Kỹ thuật..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn Vị Trực Thuộc</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-semibold"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vai Trò & Nhóm Quyền Hạn Hạn Định (*)
                </label>
                <div className="space-y-2 pt-1">
                  {Object.entries(ROLES_INFO).map(([key, info]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        role === key
                          ? 'border-brand-500 bg-brand-50/50 shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value={key}
                        checked={role === key}
                        onChange={(e) => setRole(e.target.value)}
                        className="mt-0.5 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">{info.label}</span>
                        <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{info.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-500 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : (editingUser ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE/EDIT EMPLOYEE */}
      {/* ==================================================================== */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {editingEmployee ? 'Chỉnh Sửa Nhân Viên' : 'Thêm Nhân Viên Mới'}
              </h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và Tên (*)</label>
                <input
                  type="text"
                  required
                  value={empFullName}
                  onChange={(e) => setEmpFullName(e.target.value)}
                  placeholder="VD: Lò Văn Nhánh"
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Cán Bộ / NV</label>
                  <input
                    type="text"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    placeholder="VD: NV-TP1-01"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đơn Vị Trực Thuộc (*)</label>
                <select
                  value={empUnitId}
                  onChange={(e) => setEmpUnitId(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-semibold"
                  required
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức Vụ</label>
                  <input
                    type="text"
                    value={empPosition}
                    onChange={(e) => setEmpPosition(e.target.value)}
                    placeholder="VD: Cán bộ chi nhánh..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phòng Ban / Tổ</label>
                  <input
                    type="text"
                    value={empDepartment}
                    onChange={(e) => setEmpDepartment(e.target.value)}
                    placeholder="VD: Tổ Kỹ thuật..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={empNotes}
                  onChange={(e) => setEmpNotes(e.target.value)}
                  placeholder="Ghi chú thêm..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : (editingEmployee ? 'Lưu Thay Đổi' : 'Thêm Nhân Viên')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE/EDIT METER */}
      {/* ==================================================================== */}
      {showMeterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-600" />
                {editingMeter ? 'Chỉnh Sửa SKU Đồng Hồ' : 'Thêm SKU Đồng Hồ Mới'}
              </h3>
              <button
                onClick={() => setShowMeterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMeter} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã SKU (*)</label>
                  <input
                    type="text"
                    required
                    value={meterCode}
                    onChange={(e) => setMeterCode(e.target.value)}
                    placeholder="VD: ĐH015, ĐH015(SC)..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cỡ Kích Thước</label>
                  <input
                    type="text"
                    value={meterSize}
                    onChange={(e) => setMeterSize(e.target.value)}
                    placeholder="VD: DN15, DN20..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Đồng Hồ (Chuẩn Danh Định) (*)</label>
                <input
                  type="text"
                  required
                  value={meterName}
                  onChange={(e) => setMeterName(e.target.value)}
                  placeholder="VD: Đồng hồ DN15 (sửa chữa)"
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân Loại (*)</label>
                  <select
                    value={meterCategory}
                    onChange={(e) => setMeterCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-semibold"
                  >
                    <option value="Tiêu chuẩn">Tiêu chuẩn (Mới)</option>
                    <option value="Sửa chữa">Sửa chữa (Quay vòng)</option>
                    <option value="Nhập khẩu">Nhập khẩu</option>
                    <option value="Cấp theo DA">Cấp theo dự án</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn Vị Tính</label>
                  <input
                    type="text"
                    value={meterUnit}
                    onChange={(e) => setMeterUnit(e.target.value)}
                    placeholder="Cái"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hãng Sản Xuất / Xuất Xứ</label>
                <input
                  type="text"
                  value={meterManufacturer}
                  onChange={(e) => setMeterManufacturer(e.target.value)}
                  placeholder="VD: SOWASUCO / Kent / Actaris..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={meterNotes}
                  onChange={(e) => setMeterNotes(e.target.value)}
                  placeholder="Ghi chú thêm..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMeterModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : (editingMeter ? 'Lưu Thay Đổi' : 'Thêm SKU')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE/EDIT SPARE PART */}
      {/* ==================================================================== */}
      {showPartModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-600" />
                {editingPart ? 'Chỉnh Sửa Linh Kiện' : 'Thêm Linh Kiện Mới'}
              </h3>
              <button
                onClick={() => setShowPartModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePart} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Vật Tư (*)</label>
                  <input
                    type="text"
                    required
                    value={partCode}
                    onChange={(e) => setPartCode(e.target.value)}
                    placeholder="VD: VP-D15-014..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhóm Định Mức</label>
                  <input
                    type="text"
                    value={partCategory}
                    onChange={(e) => setPartCategory(e.target.value)}
                    placeholder="VD: DN15, Phụ kiện..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Linh Kiện (Dễ Hiểu) (*)</label>
                <input
                  type="text"
                  required
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="VD: Vít tinh chỉnh DN15"
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn Giá Kế Toán (đ)</label>
                  <input
                    type="number"
                    min={0}
                    value={partUnitPrice}
                    onChange={(e) => setPartUnitPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn Vị Tính</label>
                  <input
                    type="text"
                    value={partUnit}
                    onChange={(e) => setPartUnit(e.target.value)}
                    placeholder="Cái, Bộ, Viên..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={partNotes}
                  onChange={(e) => setPartNotes(e.target.value)}
                  placeholder="Ghi chú định mức hoặc xuất xứ..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-500 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : (editingPart ? 'Lưu Thay Đổi' : 'Thêm Linh Kiện')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE/EDIT UNIT (Đơn vị thành viên) */}
      {/* ==================================================================== */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {editingUnit ? 'Chỉnh Sửa Đơn Vị Thành Viên' : 'Thêm Đơn Vị Thành Viên Mới'}
              </h3>
              <button
                onClick={() => setShowUnitModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Đơn Vị (*)</label>
                  <input
                    type="text"
                    required
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value)}
                    placeholder="VD: CNCN-MC, XNCN-TP01..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono uppercase font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại Hình</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-semibold bg-white"
                  >
                    <option value="Chi nhánh">Chi nhánh Cấp nước</option>
                    <option value="Xí nghiệp">Xí nghiệp Cấp nước</option>
                    <option value="Kho/Xưởng">Kho Văn phòng / Xưởng</option>
                    <option value="Dự phòng">Đơn vị dự phòng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Đơn Vị Đầy Đủ (*)</label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="VD: Chi nhánh Cấp nước Mộc Châu"
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Đơn Vị</label>
                <input
                  type="text"
                  value={unitAddress}
                  onChange={(e) => setUnitAddress(e.target.value)}
                  placeholder="VD: Tiểu khu 2, TT Mộc Châu, Huyện Mộc Châu..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={unitPhone}
                    onChange={(e) => setUnitPhone(e.target.value)}
                    placeholder="0212.xxx.xxx"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thứ Tự Sắp Xếp (STT)</label>
                  <input
                    type="number"
                    min={0}
                    value={unitSortOrder}
                    onChange={(e) => setUnitSortOrder(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Liên Hệ</label>
                <input
                  type="email"
                  value={unitEmail}
                  onChange={(e) => setUnitEmail(e.target.value)}
                  placeholder="chinhanh@sowasuco.vn"
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : (editingUnit ? 'Lưu Thay Đổi' : 'Thêm Đơn Vị')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
